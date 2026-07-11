"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const https = require("https");

// ─── Configuration ───────────────────────────────────────────────────────────

const JWT_SECRET = "cheatchat_super_secret_key_2026";
const JWT_EXPIRES_IN = "7d";
const USERS_TABLE = "Users";
const SALT_ROUNDS = 10;

// ─── Gemini AI Configuration ─────────────────────────────────────────────────

const GEMINI_API_KEYS = ["AIzaSyCL0YmldbwWpcv_DvhoZOy2MqGuWd-k8zg"];
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = "generativelanguage.googleapis.com";

// ─── DynamoDB Client ─────────────────────────────────────────────────────────

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ─── Validation Schemas ──────────────────────────────────────────────────────

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// ─── Response Helpers ────────────────────────────────────────────────────────

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function success(data) {
  return response(200, { success: true, ...data });
}

function error(statusCode, message) {
  return response(statusCode, { success: false, error: message });
}

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function extractToken(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

/*
- for POST /auth/signup
*/
async function handleSignup(event) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return error(400, "Invalid JSON body");
  }

  // Validate input
  const result = signupSchema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return error(400, messages.join(", "));
  }

  const { username, password } = result.data;

  // Check if user already exists
  const existing = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { username },
    })
  );

  if (existing.Item) {
    return error(409, "Username already taken");
  }

  // Hash password and store user
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        username,
        passwordHash,
        createdAt: now,
        lastSeen: now,
      },
      ConditionExpression: "attribute_not_exists(username)",
    })
  );

  const token = generateToken(username);

  console.log(`[SIGNUP] User created: ${username}`);

  return success({
    message: "Account created successfully",
    username,
    token,
  });
}

/*
- for POST /auth/login
*/
async function handleLogin(event) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return error(400, "Invalid JSON body");
  }

  // Validate input
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return error(400, messages.join(", "));
  }

  const { username, password } = result.data;

  // Fetch user
  const record = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { username },
    })
  );

  if (!record.Item) {
    return error(401, "Invalid username or password");
  }

  // Verify password
  const valid = await bcrypt.compare(password, record.Item.passwordHash);
  if (!valid) {
    return error(401, "Invalid username or password");
  }

  // Update lastSeen
  await ddb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { username },
      UpdateExpression: "SET lastSeen = :now",
      ExpressionAttributeValues: { ":now": new Date().toISOString() },
    })
  );

  const token = generateToken(username);

  console.log(`[LOGIN] User authenticated: ${username}`);

  return success({
    message: "Login successful",
    username,
    token,
  });
}

/*
- for GET /auth/me
*/
async function handleMe(event) {
  const token = extractToken(event);
  if (!token) {
    return error(401, "Missing authorization token");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return error(401, "Invalid or expired token");
  }

  const record = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { username: decoded.username },
    })
  );

  if (!record.Item) {
    return error(404, "User not found");
  }

  const { passwordHash, ...user } = record.Item;

  return success({ user });
}

// ─── Gemini AI Helpers ───────────────────────────────────────────────────────

/*
- Pick a random API key from the pool.
*/
function getRandomApiKey() {
  return GEMINI_API_KEYS[Math.floor(Math.random() * GEMINI_API_KEYS.length)];
}

/*
- Call Gemini API using native https.
- Returns the text response from Gemini.
*/
function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = getRandomApiKey();
    const path = `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const options = {
      hostname: GEMINI_BASE_URL,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || "Gemini API error"));
            return;
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
          resolve(text);
        } catch (e) {
          reject(new Error("Failed to parse Gemini response"));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Gemini API request timed out"));
    });

    req.write(requestBody);
    req.end();
  });
}

/*
- Strip markdown code fences from a string.
- Handles ```language\n...\n``` and ```\n...\n```
*/
function stripCodeFences(text) {
  const trimmed = text.trim();
  // Match opening ```<optional language> and closing ```
  const fenceRegex = /^```[\w]*\n?([\s\S]*?)\n?```$/;
  const match = trimmed.match(fenceRegex);
  if (match) {
    return match[1];
  }
  return trimmed;
}

// ─── AI Route Handlers ───────────────────────────────────────────────────────

/*
- POST /ai/chat — General AI conversation. No auth required.
*/
async function handleAiChat(event) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return error(400, "Invalid JSON body");
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return error(400, "'prompt' is required");
  }

  try {
    const reply = await callGemini(prompt.trim());
    console.log(`[AI:CHAT] Prompt: "${prompt.trim().substring(0, 50)}..."`);
    return response(200, { reply });
  } catch (err) {
    console.error("[AI:CHAT] Gemini error:", err.message);
    return error(502, `AI service error: ${err.message}`);
  }
}

/*
- POST /ai/file — Solve/improve an entire source file. No auth required.
*/
async function handleAiFile(event) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return error(400, "Invalid JSON body");
  }

  const { filename, content } = body;

  if (!filename || typeof filename !== "string") {
    return error(400, "'filename' is required");
  }
  if (!content || typeof content !== "string") {
    return error(400, "'content' (file contents) is required");
  }

  const filePrompt = `You are a senior software engineer. You are given a file named "${filename}".

Here is the complete file content:

${content}

Instructions:
- Fix any bugs, improve code quality, and optimize where possible.
- Return the ENTIRE updated file.
- Never omit any code.
- Never shorten the file.
- Preserve all imports unless they are truly unnecessary.
- Preserve formatting style.
- Output ONLY the updated file content.
- Do NOT wrap your answer inside markdown code blocks.
- Do NOT add any explanation before or after the code.
- Just return the raw updated file content.`;

  try {
    let result = await callGemini(filePrompt);
    // Safety: strip code fences if Gemini accidentally returns them
    result = stripCodeFences(result);

    console.log(`[AI:FILE] Processed: ${filename} (${content.length} chars → ${result.length} chars)`);
    return response(200, { content: result });
  } catch (err) {
    console.error("[AI:FILE] Gemini error:", err.message);
    return error(502, `AI service error: ${err.message}`);
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

function routeRequest(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || "";
  let path = event.path || event.requestContext?.http?.path || "";


  const stage = event.requestContext?.stage;
  if (stage && path.startsWith(`/${stage}`)) {
    path = path.slice(`/${stage}`.length) || "/";
  }

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return response(200, {});
  }

  // ─── Auth Routes ─────────────────────────────────────────────────────

  if (method === "POST" && path === "/auth/signup") {
    return handleSignup(event);
  }

  if (method === "POST" && path === "/auth/login") {
    return handleLogin(event);
  }

  if (method === "GET" && path === "/auth/me") {
    return handleMe(event);
  }

  // ─── AI Routes (Public — No Auth) ────────────────────────────────────

  if (method === "POST" && path === "/ai/chat") {
    return handleAiChat(event);
  }

  if (method === "POST" && path === "/ai/file") {
    return handleAiFile(event);
  }

  return error(404, `Route not found: ${method} ${path}`);
}

// ─── Lambda Handler ──────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log("[REST] Incoming event:", JSON.stringify(event, null, 2));

  try {
    return await routeRequest(event);   
  } catch (err) {
    console.error("[REST] Unhandled error:", err);
    return error(500, "Internal server error");
  }
};
