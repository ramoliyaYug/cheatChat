import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// ─── Config Path ─────────────────────────────────────────────────────────────

const CONFIG_DIR = path.join(os.homedir(), ".cheatchat");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig() {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeConfig(data) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Save authentication credentials to disk.
 */
export function saveAuth(username, token) {
  writeConfig({ username, token });
}

/**
 * Load stored authentication credentials.
 * Returns { username, token } or null if not logged in.
 */
export function loadAuth() {
  const config = readConfig();
  if (config.username && config.token) {
    return { username: config.username, token: config.token };
  }
  return null;
}

/**
 * Remove stored authentication credentials (logout).
 */
export function clearAuth() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Check if the user is currently authenticated.
 */
export function isLoggedIn() {
  return loadAuth() !== null;
}
