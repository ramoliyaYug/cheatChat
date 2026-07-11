import axios from "axios";
import { REST_API_URL } from "../utils/constants.js";
import { logError } from "../utils/logger.js";

// ─── Axios Instance ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: REST_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Returns { success, username, token, message, error }
 */
export async function signup(username, password) {
  try {
    const { data } = await api.post("/auth/signup", { username, password });
    return data;
  } catch (err) {
    return extractError(err);
  }
}

/**
 * Authenticate an existing user.
 * Returns { success, username, token, message, error }
 */
export async function login(username, password) {
  try {
    const { data } = await api.post("/auth/login", { username, password });
    return data;
  } catch (err) {
    return extractError(err);
  }
}

/**
 * Get the current authenticated user's profile.
 * Returns { success, user, error }
 */
export async function getMe(token) {
  try {
    const { data } = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    return extractError(err);
  }
}

// ─── AI Endpoints (Public — No Auth Required) ───────────────────────────────

/**
 * Send a prompt to the AI chat endpoint.
 * Returns { reply } or { error }
 */
export async function aiChat(prompt) {
  try {
    const { data } = await api.post("/ai/chat", { prompt }, { timeout: 60000 });
    return data;
  } catch (err) {
    return extractError(err);
  }
}

/**
 * Send a file to the AI file solver endpoint.
 * Returns { content } or { error }
 */
export async function aiFile(filename, content) {
  try {
    const { data } = await api.post("/ai/file", { filename, content }, { timeout: 60000 });
    return data;
  } catch (err) {
    return extractError(err);
  }
}

// ─── Error Extraction ────────────────────────────────────────────────────────

function extractError(err) {
  if (err.response?.data) {
    return err.response.data;
  }
  logError("api", err);
  return {
    success: false,
    error: err.message || "Network error — please check your connection",
  };
}
