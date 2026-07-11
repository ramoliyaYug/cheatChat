import {
  globalTag,
  privateTag,
  systemTag,
  errorTag,
  senderSelf,
  senderOther,
  timestamp as tsColor,
  messageText,
  muted,
  success,
  danger,
  warning,
  accent,
  brand,
  white,
  whiteBold,
  dim,
} from "./color.js";

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Message Printers ────────────────────────────────────────────────────────

/**
 * Print a global chat message.
 */
export function printGlobalMessage(sender, text, ts, currentUser) {
  const time = tsColor(formatTime(ts));
  const tag = globalTag(" GLOBAL ");
  const name = sender === currentUser ? senderSelf(sender) : senderOther(sender);
  console.log(`  ${tag} ${time} ${name}: ${messageText(text)}`);
}

/**
 * Print a private/DM message.
 */
export function printPrivateMessage(sender, text, ts, currentUser) {
  const time = tsColor(formatTime(ts));
  const tag = privateTag(" DM ");
  const name = sender === currentUser ? senderSelf("You") : senderOther(sender);
  console.log(`  ${tag} ${time} ${name}: ${messageText(text)}`);
}

/**
 * Print a system notification.
 */
export function printSystem(text) {
  console.log(`  ${systemTag(" SYS ")} ${muted(text)}`);
}

/**
 * Print an error message.
 */
export function printError(text) {
  console.log(`  ${errorTag(" ERR ")} ${danger(text)}`);
}

/**
 * Print a success message.
 */
export function printSuccess(text) {
  console.log(`  ${success("✓")} ${success(text)}`);
}

/**
 * Print a warning.
 */
export function printWarning(text) {
  console.log(`  ${warning("⚠")} ${warning(text)}`);
}

/**
 * Print info.
 */
export function printInfo(text) {
  console.log(`  ${accent("ℹ")} ${accent(text)}`);
}

/**
 * Print the in-chat help menu.
 */
export function printChatHelp() {
  console.log();
  console.log(`  ${whiteBold("Chat Commands:")}`);
  console.log(`  ${brand("/global")}          ${muted("Switch to global chat")}`);
  console.log(`  ${brand("/dm <username>")}   ${muted("Switch to private messaging")}`);
  console.log(`  ${brand("/history")}         ${muted("Load message history for current chat")}`);
  console.log(`  ${brand("/online")}          ${muted("Show currently connected users")}`);
  console.log(`  ${brand("/users")}           ${muted("Show all registered users")}`);
  console.log(`  ${brand("/help")}            ${muted("Show this help menu")}`);
  console.log(`  ${brand("/exit")}            ${muted("Disconnect and exit")}`);
  console.log();
}

/**
 * Print current chat mode indicator.
 */
export function printModeSwitch(mode, target) {
  console.log();
  if (mode === "global") {
    printSystem(`Switched to ${accent("🌍 Global Chat")} — messages go to everyone`);
  } else {
    printSystem(`Switched to ${accent(`🔒 DM → ${whiteBold(target)}`)} — messages are private`);
  }
  console.log();
}

/**
 * Print a history header.
 */
export function printHistoryHeader(type, target) {
  console.log();
  const sep = muted("─".repeat(50));
  console.log(`  ${sep}`);
  if (type === "global") {
    console.log(`  ${systemTag(" HISTORY ")} ${accent("🌍 Global Chat History")}`);
  } else {
    console.log(`  ${systemTag(" HISTORY ")} ${accent(`🔒 DM History with ${whiteBold(target)}`)}`);
  }
  console.log(`  ${sep}`);
}

/**
 * Print a history footer.
 */
export function printHistoryFooter(count) {
  const sep = muted("─".repeat(50));
  console.log(`  ${sep}`);
  console.log(`  ${muted(`${count} message${count !== 1 ? "s" : ""} loaded`)}`);
  console.log(`  ${sep}`);
  console.log();
}

/**
 * Print online users list.
 */
export function printOnlineUsers(users) {
  console.log();
  console.log(`  ${whiteBold("Online Users")} ${muted(`(${users.length})`)}`);
  console.log(`  ${muted("─".repeat(30))}`);
  if (users.length === 0) {
    console.log(`  ${muted("No users online")}`);
  } else {
    for (const u of users) {
      console.log(`  ${success("●")} ${accent(u)}`);
    }
  }
  console.log();
}

/**
 * Print all registered users list.
 */
export function printRegisteredUsers(users) {
  console.log();
  console.log(`  ${whiteBold("Registered Users")} ${muted(`(${users.length})`)}`);
  console.log(`  ${muted("─".repeat(30))}`);
  if (users.length === 0) {
    console.log(`  ${muted("No users found")}`);
  } else {
    for (const u of users) {
      console.log(`  ${brand("•")} ${white(u)}`);
    }
  }
  console.log();
}

/**
 * Print a blank line.
 */
export function printBlank() {
  console.log();
}
