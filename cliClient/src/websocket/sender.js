import { sendGlobalMessage, sendPrivateMessage } from "../services/socket.js";
import { printError } from "../ui/printer.js";

/**
 * Send a message based on the current chat mode.
 * @param {WebSocket} ws - Active WebSocket connection
 * @param {string} mode - "global" or "private"
 * @param {string} text - Message text
 * @param {string} [dmTarget] - Target username for private messages
 */
export function sendMessage(ws, mode, text, dmTarget) {
  if (!text.trim()) return;

  if (mode === "global") {
    const ok = sendGlobalMessage(ws, text);
    if (!ok) printError("Not connected. Message not sent.");
  } else if (mode === "private") {
    if (!dmTarget) {
      printError("No DM target set. Use /dm <username>");
      return;
    }
    const ok = sendPrivateMessage(ws, dmTarget, text);
    if (!ok) printError("Not connected. Message not sent.");
  }
}
