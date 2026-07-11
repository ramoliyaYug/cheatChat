import { printGlobalMessage, printPrivateMessage, printError, printSystem } from "../ui/printer.js";

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

    case "error":
      printError(data.message || "Unknown server error");
      break;

    default:
      printSystem(`Unknown event: ${data.event}`);
      break;
  }
}
