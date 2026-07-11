import { createSocket } from "../services/socket.js";
import { createSpinner } from "../ui/spinner.js";

/**
 * Establish a WebSocket connection and return a promise that resolves
 * with the connected WebSocket, or rejects on failure.
 * @param {string} token - JWT auth token
 * @param {function} onMessage - Handler for incoming messages
 * @param {function} onClose - Handler for connection close
 * @returns {Promise<WebSocket>}
 */
export function connectWebSocket(token, onMessage, onClose) {
  return new Promise((resolve, reject) => {
    const spinner = createSpinner("Connecting to CheatChat...");
    spinner.start();

    const ws = createSocket(token, {
      onOpen: () => {
        spinner.succeed("Connected to CheatChat!");
        resolve(ws);
      },
      onMessage,
      onClose: (code, reason) => {
        onClose?.(code, reason);
      },
      onError: (err) => {
        spinner.fail("Connection failed");
        reject(err);
      },
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState !== 1) {
        spinner.fail("Connection timed out");
        ws.close();
        reject(new Error("Connection timed out"));
      }
    }, 10000);
  });
}
