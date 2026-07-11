"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const jwt = require("jsonwebtoken");

// ─── Configuration ───────────────────────────────────────────────────────────

const JWT_SECRET = "cheatchat_super_secret_key_2026";
const CONNECTIONS_TABLE = "Connections";
const GLOBAL_MESSAGES_TABLE = "GlobalMessages";
const PRIVATE_MESSAGES_TABLE = "PrivateMessages";
const USERS_TABLE = "Users";
const GLOBAL_ROOM_ID = "GLOBAL";
const CONNECTION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// ─── DynamoDB Client ─────────────────────────────────────────────────────────

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ─── API Gateway Management Client (lazily initialized per invocation) ───────

let apigwClient = null;

function getApigwClient(event) {
  if (!apigwClient) {
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const endpoint = `https://${domain}/${stage}`;
    apigwClient = new ApiGatewayManagementApiClient({ endpoint });
  }
  return apigwClient;
}

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Connection Helpers ──────────────────────────────────────────────────────

/*
- Send a JSON payload to a specific WebSocket connection.
- Automatically cleans up stale connections.
*/
async function sendToConnection(event, connectionId, payload) {
  const client = getApigwClient(event);
  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      })
    );
  } catch (err) {
    if (err instanceof GoneException || err.statusCode === 410) {
      console.log(`[WS] Stale connection detected: ${connectionId}`);
      const staleConn = await getConnection(connectionId);
      if (staleConn) {
        await removeConnection(connectionId, staleConn.username);
        console.log(`[WS] Stale connection removed: ${connectionId}`);
      }
    } else {
      console.error(`[WS] Failed to send to ${connectionId}:`, err);
    }
  }
}

/*
- Store a new connection in the Connections table.
*/
async function storeConnection(connectionId, username) {
  const now = Math.floor(Date.now() / 1000);
  await ddb.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        username,
        connectedAt: new Date().toISOString(),
        expiresAt: now + CONNECTION_TTL_SECONDS,
      },
    })
  );
}

/*
- Remove a connection from the Connections table.
- Requires both connectionId (PK) and username (SK) for composite key.
*/
async function removeConnection(connectionId, username) {
  await ddb.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId, username },
    })
  );
}

/*
- Get a connection record by connectionId.
- Uses Query instead of GetItem to work with composite key tables
- (we may not know the sort key value upfront).
*/
async function getConnection(connectionId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      KeyConditionExpression: "connectionId = :cid",
      ExpressionAttributeValues: { ":cid": connectionId },
      Limit: 1,
    })
  );
  return result.Items?.[0] || null;
}

/*
- Get all connection IDs for a given username using the GSI.
*/
async function getConnectionsByUsername(username) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: "UsernameIndex",
      KeyConditionExpression: "username = :u",
      ExpressionAttributeValues: { ":u": username },
    })
  );
  return result.Items || [];
}

/*
- this has no use in current architecture
- this was the old approach but if user grows this won't help
- this is for the small chat app
*/

async function getAllConnections() {
  const items = [];
  let lastKey = undefined;

  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: CONNECTIONS_TABLE,
        IndexName: "UsernameIndex",
        KeyConditionExpression: "username > :empty",
        ExpressionAttributeValues: { ":empty": "" },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

/*
- Scan all connections (fallback -> full table scan)
*/
async function scanAllConnections() {
  const items = [];
  let lastKey = undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: CONNECTIONS_TABLE,
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

/*
- Scan all users from the Users table.
*/
async function scanAllUsers() {
  const items = [];
  let lastKey = undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        ProjectionExpression: "username",
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

// ─── Conversation ID Helper ─────────────────────────────────────────────────

/*
- Generate a deterministic conversation ID from two usernames.
- Always sorted alphabetically and joined with #
*/
function makeConversationId(userA, userB) {
  return [userA, userB].sort().join("#");
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

/*
- $connect -> Authenticate the WebSocket connection.
- Reads token from query string, verifies JWT, stores connection.
*/
async function handleConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;

  if (!token) {
    console.log("[CONNECT] Rejected: no token provided");
    return { statusCode: 401, body: "Missing token" };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.username) {
    console.log("[CONNECT] Rejected: invalid token");
    return { statusCode: 401, body: "Invalid token" };
  }

  const username = decoded.username;

  // Verify user exists in the database
  const userRecord = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { username },
    })
  );

  if (!userRecord.Item) {
    console.log(`[CONNECT] Rejected: user not found — ${username}`);
    return { statusCode: 401, body: "User not found" };
  }

  // Store connection
  await storeConnection(connectionId, username);

  // Update lastSeen
  await ddb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { username },
      UpdateExpression: "SET lastSeen = :now",
      ExpressionAttributeValues: { ":now": new Date().toISOString() },
    })
  );

  console.log(`[CONNECT] ${username} connected as ${connectionId}`);

  return { statusCode: 200, body: "Connected" };
}

/*
- $disconnect -> Clean up the connection record.
*/
async function handleDisconnect(event) {
  const connectionId = event.requestContext.connectionId;

  // Retrieve connection to log which user disconnected
  const conn = await getConnection(connectionId);
  if (conn) {
    console.log(`[DISCONNECT] ${conn.username} disconnected (${connectionId})`);

    // Update lastSeen
    await ddb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username: conn.username },
        UpdateExpression: "SET lastSeen = :now",
        ExpressionAttributeValues: { ":now": new Date().toISOString() },
      })
    );
  }

  if (conn) {
    await removeConnection(connectionId, conn.username);
  }

  return { statusCode: 200, body: "Disconnected" };
}

/*
- message -> Handle incoming chat messages (global & private).
*/
async function handleMessage(event) {
  const connectionId = event.requestContext.connectionId;

  // Identify the sender from the connection record
  const conn = await getConnection(connectionId);
  if (!conn) {
    console.log(`[MESSAGE] Unknown connection: ${connectionId}`);
    return { statusCode: 401, body: "Not authenticated" };
  }

  const sender = conn.username;

  // Parse the message body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    await sendToConnection(event, connectionId, {
      event: "error",
      message: "Invalid JSON",
    });
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { type, text, to } = body;

  // Validate message text
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    await sendToConnection(event, connectionId, {
      event: "error",
      message: "Message text is required",
    });
    return { statusCode: 400, body: "Missing text" };
  }

  const trimmedText = text.trim();
  const timestamp = Date.now();

  if (type === "global") {
    return await handleGlobalMessage(event, sender, trimmedText, timestamp);
  }

  if (type === "private") {
    return await handlePrivateMessage(event, connectionId, sender, to, trimmedText, timestamp);
  }

  // Unknown message type
  await sendToConnection(event, connectionId, {
    event: "error",
    message: `Unknown message type: ${type}`,
  });

  return { statusCode: 400, body: "Unknown type" };
}

/*
- Broadcast a global message to every user
*/
async function handleGlobalMessage(event, sender, text, timestamp) {

  await ddb.send(
    new PutCommand({
      TableName: GLOBAL_MESSAGES_TABLE,
      Item: {
        roomId: GLOBAL_ROOM_ID,
        timestamp,
        sender,
        message: text,
      },
    })
  );

  // Build the outgoing payload
  const payload = {
    event: "global_message",
    sender,
    text,
    timestamp,
  };

  // Broadcast to ALL connected users
  const connections = await scanAllConnections();

  const sendPromises = connections.map((c) =>
    sendToConnection(event, c.connectionId, payload)
  );

  await Promise.allSettled(sendPromises);

  console.log(`[GLOBAL] ${sender}: "${text}" → ${connections.length} recipients`);

  return { statusCode: 200, body: "Message sent" };
}

/*
- Send a private message to a specific user
*/
async function handlePrivateMessage(event, senderConnectionId, sender, receiver, text, timestamp) {
  // Validate receiver
  if (!receiver || typeof receiver !== "string" || receiver.trim().length === 0) {
    await sendToConnection(event, senderConnectionId, {
      event: "error",
      message: "Recipient ('to') is required for private messages",
    });
    return { statusCode: 400, body: "Missing recipient" };
  }

  const trimmedReceiver = receiver.trim();

  // Prevent sending to yourself
  if (trimmedReceiver === sender) {
    await sendToConnection(event, senderConnectionId, {
      event: "error",
      message: "Cannot send a private message to yourself",
    });
    return { statusCode: 400, body: "Cannot message self" };
  }

  // Check if receiver exists
  const receiverRecord = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { username: trimmedReceiver },
    })
  );

  if (!receiverRecord.Item) {
    await sendToConnection(event, senderConnectionId, {
      event: "error",
      message: `User '${trimmedReceiver}' does not exist`,
    });
    return { statusCode: 404, body: "Receiver not found" };
  }

  // Generate deterministic conversation ID
  const conversationId = makeConversationId(sender, trimmedReceiver);

  // Persist the message
  await ddb.send(
    new PutCommand({
      TableName: PRIVATE_MESSAGES_TABLE,
      Item: {
        conversationId,
        timestamp,
        sender,
        receiver: trimmedReceiver,
        message: text,
      },
    })
  );

  // Build the outgoing payload
  const payload = {
    event: "private_message",
    sender,
    text,
    timestamp,
  };

  // Send to all receiver's connections (they may be on multiple devices)
  const receiverConnections = await getConnectionsByUsername(trimmedReceiver);
  const senderConnections = await getConnectionsByUsername(sender);

  const allTargets = [...receiverConnections, ...senderConnections];

  // Deduplicate connection IDs
  const seen = new Set();
  const uniqueTargets = allTargets.filter((c) => {
    if (seen.has(c.connectionId)) return false;
    seen.add(c.connectionId);
    return true;
  });

  const sendPromises = uniqueTargets.map((c) =>
    sendToConnection(event, c.connectionId, payload)
  );

  await Promise.allSettled(sendPromises);

  console.log(
    `[PRIVATE] ${sender} → ${trimmedReceiver}: "${text}" (${uniqueTargets.length} connections)`
  );

  return { statusCode: 200, body: "Message sent" };
}

/*
- history -> Return chat history (global or private).
*/
async function handleHistory(event) {
  const connectionId = event.requestContext.connectionId;

  const conn = await getConnection(connectionId);
  if (!conn) {
    return { statusCode: 401, body: "Not authenticated" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    await sendToConnection(event, connectionId, {
      event: "error",
      message: "Invalid JSON",
    });
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { type } = body;
  const limit = Math.min(Math.max(parseInt(body.limit) || 50, 1), 100);

  if (type === "global") {
    const result = await ddb.send(
      new QueryCommand({
        TableName: GLOBAL_MESSAGES_TABLE,
        KeyConditionExpression: "roomId = :rid",
        ExpressionAttributeValues: { ":rid": GLOBAL_ROOM_ID },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    const messages = (result.Items || []).reverse().map((item) => ({
      sender: item.sender,
      text: item.message,
      timestamp: item.timestamp,
    }));

    await sendToConnection(event, connectionId, {
      event: "history",
      type: "global",
      messages,
    });

    console.log(`[HISTORY] Global -> ${conn.username} (${messages.length} messages)`);
    return { statusCode: 200, body: "History sent" };
  }

  if (type === "private") {
    const withUser = body.with;
    if (!withUser || typeof withUser !== "string" || withUser.trim().length === 0) {
      await sendToConnection(event, connectionId, {
        event: "error",
        message: "'with' field is required for private history",
      });
      return { statusCode: 400, body: "Missing 'with'" };
    }

    const conversationId = makeConversationId(conn.username, withUser.trim());

    const result = await ddb.send(
      new QueryCommand({
        TableName: PRIVATE_MESSAGES_TABLE,
        KeyConditionExpression: "conversationId = :cid",
        ExpressionAttributeValues: { ":cid": conversationId },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    const messages = (result.Items || []).reverse().map((item) => ({
      sender: item.sender,
      text: item.message,
      timestamp: item.timestamp,
    }));

    await sendToConnection(event, connectionId, {
      event: "history",
      type: "private",
      with: withUser.trim(),
      messages,
    });

    console.log(`[HISTORY] Private ${conn.username}#${withUser.trim()} -> (${messages.length} messages)`);
    return { statusCode: 200, body: "History sent" };
  }

  await sendToConnection(event, connectionId, {
    event: "error",
    message: "History type must be 'global' or 'private'",
  });
  return { statusCode: 400, body: "Invalid history type" };
}

/*
- online -> Return list of currently connected usernames.
*/
async function handleOnline(event) {
  const connectionId = event.requestContext.connectionId;

  const conn = await getConnection(connectionId);
  if (!conn) {
    return { statusCode: 401, body: "Not authenticated" };
  }

  const connections = await scanAllConnections();

  // Extract unique usernames
  const usernameSet = new Set();
  for (const c of connections) {
    if (c.username) usernameSet.add(c.username);
  }

  const users = [...usernameSet].sort();

  await sendToConnection(event, connectionId, {
    event: "online",
    users,
  });

  console.log(`[ONLINE] -> ${conn.username} (${users.length} users online)`);
  return { statusCode: 200, body: "Online list sent" };
}

/*
- users -> Return list of all registered usernames.
*/
async function handleUsers(event) {
  const connectionId = event.requestContext.connectionId;

  const conn = await getConnection(connectionId);
  if (!conn) {
    return { statusCode: 401, body: "Not authenticated" };
  }

  const allUsers = await scanAllUsers();
  const users = allUsers.map((u) => u.username).sort();

  await sendToConnection(event, connectionId, {
    event: "users",
    users,
  });

  console.log(`[USERS] -> ${conn.username} (${users.length} registered)`);
  return { statusCode: 200, body: "Users list sent" };
}

/*
- $default -> Handle unknown/unsupported routes.
*/
async function handleDefault(event) {
  const connectionId = event.requestContext.connectionId;

  await sendToConnection(event, connectionId, {
    event: "error",
    message: "Unknown action. Supported actions: message, history, online, users",
  });

  return { statusCode: 200, body: "Unknown route" };
}

// ─── Route Dispatcher ────────────────────────────────────────────────────────

function dispatch(event) {
  const routeKey = event.requestContext.routeKey;

  switch (routeKey) {
    case "$connect":
      return handleConnect(event);
    case "$disconnect":
      return handleDisconnect(event);
    case "message":
      return handleMessage(event);
    case "history":
      return handleHistory(event);
    case "online":
      return handleOnline(event);
    case "users":
      return handleUsers(event);
    case "$default":
    default:
      return handleDefault(event);
  }
}

// ─── Lambda Handler ──────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Reset the API Gateway client for each invocation
  apigwClient = null;

  console.log("[WS] Incoming event:", JSON.stringify(event, null, 2));

  try {
    return await dispatch(event);
  } catch (err) {
    console.error("[WS] Unhandled error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};