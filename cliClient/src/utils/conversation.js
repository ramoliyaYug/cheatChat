/**
 * Generate a deterministic conversation ID from two usernames.
 * Matches the backend logic — always sorted alphabetically.
 */
export function makeConversationId(userA, userB) {
  return [userA, userB].sort().join("#");
}
