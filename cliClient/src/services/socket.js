import WebSocket from "ws";
import { WS_API_URL } from "../utils/constants.js";
import { logError, debug } from "../utils/logger.js";

/**
 * Create and return a WebSocket connection.
 * @param {string} token - JWT auth token
 * @param {object} handlers - { onOpen, onMessage, onClose, onError }
 * @returns {WebSocket}
 */
export function createSocket(token, handlers = {}) {
  const url = `${WS_API_URL}?token=${token}`;
  debug("Connecting to WebSocket:", url);

  const ws = new WebSocket(url);

  ws.on("open", () => {
    debug("WebSocket connected");
    handlers.onOpen?.();
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      debug("WS message:", data);
      handlers.onMessage?.(data);
    } catch (err) {
      logError("ws-parse", err);
    }
  });

  ws.on("close", (code, reason) => {
    debug("WebSocket closed:", code, reason?.toString());
    handlers.onClose?.(code, reason?.toString());
  });

  ws.on("error", (err) => {
    logError("ws-error", err);
    handlers.onError?.(err);
  });

  return ws;
}

/**
 * Send a global message through the WebSocket.
 */
export function sendGlobalMessage(ws, text) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({
    action: "message",
    type: "global",
    text,
  }));
  return true;
}

/**
 * Send a private message through the WebSocket.
 */
export function sendPrivateMessage(ws, to, text) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({
    action: "message",
    type: "private",
    to,
    text,
  }));
  return true;
}

/**
 * Request chat history (global or private).
 */
export function requestHistory(ws, type, withUser, limit = 50) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  const payload = { action: "history", type, limit };
  if (type === "private" && withUser) {
    payload.with = withUser;
  }
  ws.send(JSON.stringify(payload));
  return true;
}

/**
 * Request the list of currently online users.
 */
export function requestOnline(ws) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ action: "online" }));
  return true;
}

/**
 * Request the list of all registered users.
 */
export function requestUsers(ws) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ action: "users" }));
  return true;
}

/**
 * Close the WebSocket connection gracefully.
 */
export function closeSocket(ws) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}
