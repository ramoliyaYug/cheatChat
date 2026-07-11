import { muted } from "./color.js";

/**
 * Print a simple table for user profile info.
 */
export function printUserTable(user) {
  const rows = [
    ["Username", user.username],
    ["Created", new Date(user.createdAt).toLocaleString()],
    ["Last Seen", new Date(user.lastSeen).toLocaleString()],
  ];

  const maxKey = Math.max(...rows.map((r) => r[0].length));

  console.log();
  for (const [key, value] of rows) {
    console.log(`  ${muted(key.padEnd(maxKey + 2))} ${value}`);
  }
  console.log();
}
