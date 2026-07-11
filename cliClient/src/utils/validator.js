/**
 * Validate a username string.
 * Returns { valid, message }
 */
export function validateUsername(input) {
  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" };
  }
  if (trimmed.length > 20) {
    return { valid: false, message: "Username must be at most 20 characters" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, message: "Username can only contain letters, numbers, and underscores" };
  }
  return { valid: true, message: null };
}

/**
 * Validate a password string.
 * Returns { valid, message }
 */
export function validatePassword(input) {
  if (input.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  if (input.length > 128) {
    return { valid: false, message: "Password must be at most 128 characters" };
  }
  return { valid: true, message: null };
}
