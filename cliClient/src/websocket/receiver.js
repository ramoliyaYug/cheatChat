import {
  printGlobalMessage,
  printPrivateMessage,
  printError,
  printSystem,
  printHistoryHeader,
  printHistoryFooter,
  printOnlineUsers,
  printRegisteredUsers,
} from "../ui/printer.js";

/**
 * Handle incoming WebSocket messages and dispatch to the appropriate printer.
 * @param {object} data - Parsed JSON message from the server
 * @param {string} currentUser - The local user's username
 */
export function handleIncomingMessage(data, currentUser) {
  switch (data.event) {
    case "global_message":
      printGlobalMessage(data.sender, data.text, data.timestamp, currentUser);
      break;

    case "private_message":
      printPrivateMessage(data.sender, data.text, data.timestamp, currentUser);
      break;

    case "history":
      renderHistory(data, currentUser);
      break;

    case "online":
      printOnlineUsers(data.users || []);
      break;

    case "users":
      printRegisteredUsers(data.users || []);
      break;

    case "error":
      printError(data.message || "Unknown server error");
      break;

    default:
      printSystem(`Unknown event: ${data.event}`);
      break;
  }
}

/**
 * Render a history response (global or private).
 */
function renderHistory(data, currentUser) {
  const messages = data.messages || [];
  const type = data.type;
  const target = data.with;

  printHistoryHeader(type, target);

  if (messages.length === 0) {
    printSystem("No messages yet. Start the conversation!");
  } else {
    for (const msg of messages) {
      if (type === "global") {
        printGlobalMessage(msg.sender, msg.text, msg.timestamp, currentUser);
      } else {
        printPrivateMessage(msg.sender, msg.text, msg.timestamp, currentUser);
      }
    }
  }

  printHistoryFooter(messages.length);
}
