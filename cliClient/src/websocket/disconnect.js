import { closeSocket } from "../services/socket.js";
import { printSystem, printBlank } from "../ui/printer.js";

/**
 * Gracefully disconnect from the WebSocket.
 */
export function disconnectWebSocket(ws) {
  printBlank();
  printSystem("Disconnecting...");
  closeSocket(ws);
  printSystem("Goodbye! 👋");
  printBlank();
}
