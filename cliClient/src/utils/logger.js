import { muted } from "../ui/color.js";

/**
 * Simple logger for debug output (disabled by default).
 */
const DEBUG = process.env.CHEATCHAT_DEBUG === "true";

export function debug(...args) {
  if (DEBUG) {
    console.log(muted("[DEBUG]"), ...args);
  }
}

export function logError(context, err) {
  if (DEBUG) {
    console.error(muted(`[ERROR:${context}]`), err);
  }
}
