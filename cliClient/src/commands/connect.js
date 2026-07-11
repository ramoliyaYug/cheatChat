import readline from "node:readline";
import { loadAuth } from "../config/config.js";
import { connectWebSocket } from "../websocket/connect.js";
import { disconnectWebSocket } from "../websocket/disconnect.js";
import { handleIncomingMessage } from "../websocket/receiver.js";
import { sendMessage } from "../websocket/sender.js";
import { requestHistory, requestOnline, requestUsers } from "../services/socket.js";
import { showChatHeader } from "../ui/banner.js";
import {
  printChatHelp,
  printModeSwitch,
  printError,
  printWarning,
  printSystem,
  printBlank,
} from "../ui/printer.js";
import { brand, accent, muted, prompt as promptColor } from "../ui/color.js";
import { CHAT_MODE } from "../utils/constants.js";

/**
 * Main connect command — enters interactive chat mode.
 */
export async function connectCommand() {
  printBlank();

  // ─── Check Authentication ────────────────────────────────────────────

  const auth = loadAuth();
  if (!auth) {
    printWarning("You are not logged in.");
    console.log(`  ${muted("Run")} ${brand("chat login")} ${muted("or")} ${brand("chat signup")} ${muted("first")}`);
    printBlank();
    return;
  }

  const { username, token } = auth;

  // ─── Chat State ──────────────────────────────────────────────────────

  let chatMode = CHAT_MODE.GLOBAL;
  let dmTarget = null;
  let ws = null;
  let rl = null;
  let isExiting = false;

  // ─── Prompt Helper ───────────────────────────────────────────────────

  function getPromptString() {
    if (chatMode === CHAT_MODE.GLOBAL) {
      return `  ${accent("🌍")} ${promptColor("›")} `;
    }
    return `  ${accent("🔒")} ${brand(dmTarget)} ${promptColor("›")} `;
  }

  function refreshPrompt() {
    if (rl) {
      rl.setPrompt(getPromptString());
      rl.prompt();
    }
  }

  // ─── Handle Incoming Messages ────────────────────────────────────────

  function onMessage(data) {
    // Clear the current prompt line before printing message
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    handleIncomingMessage(data, username);

    // Re-display the prompt
    refreshPrompt();
  }

  // ─── Handle Connection Close ─────────────────────────────────────────

  function onClose(code, reason) {
    if (!isExiting) {
      printBlank();
      printSystem("Connection lost. You have been disconnected.");
      printBlank();
      cleanup();
      process.exit(0);
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────

  function cleanup() {
    isExiting = true;
    if (rl) {
      rl.close();
      rl = null;
    }
  }

  // ─── Connect ─────────────────────────────────────────────────────────

  try {
    ws = await connectWebSocket(token, onMessage, onClose);
  } catch (err) {
    printError("Could not connect. Check your credentials or try: chat login");
    printBlank();
    return;
  }

  // ─── Show Chat UI ────────────────────────────────────────────────────

  printBlank();
  showChatHeader(username, chatMode, dmTarget);
  printBlank();
  printSystem("You are in Global Chat. Type a message or /help for commands.");
  printSystem("Loading chat history...");
  printBlank();

  // ─── Auto-load global history on connect ─────────────────────────────

  requestHistory(ws, "global");

  // ─── Start Interactive Readline ──────────────────────────────────────

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPromptString(),
    terminal: true,
  });

  rl.prompt();

  rl.on("line", (input) => {
    const line = input.trim();

    if (!line) {
      rl.prompt();
      return;
    }

    // ─── Chat Commands ─────────────────────────────────────────────

    if (line.startsWith("/")) {
      const parts = line.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      switch (cmd) {
        case "/global":
          chatMode = CHAT_MODE.GLOBAL;
          dmTarget = null;
          printModeSwitch("global");
          // Auto-load global history on mode switch
          requestHistory(ws, "global");
          refreshPrompt();
          return;

        case "/dm": {
          const target = parts[1];
          if (!target) {
            printError("Usage: /dm <username>");
            rl.prompt();
            return;
          }
          if (target === username) {
            printError("You cannot DM yourself.");
            rl.prompt();
            return;
          }
          chatMode = CHAT_MODE.PRIVATE;
          dmTarget = target;
          printModeSwitch("private", target);
          // Auto-load private history when switching to DM
          requestHistory(ws, "private", target);
          refreshPrompt();
          return;
        }

        case "/history":
          if (chatMode === CHAT_MODE.GLOBAL) {
            requestHistory(ws, "global");
          } else if (chatMode === CHAT_MODE.PRIVATE && dmTarget) {
            requestHistory(ws, "private", dmTarget);
          }
          rl.prompt();
          return;

        case "/online":
          requestOnline(ws);
          rl.prompt();
          return;

        case "/users":
          requestUsers(ws);
          rl.prompt();
          return;

        case "/help":
          printChatHelp();
          rl.prompt();
          return;

        case "/exit":
          disconnectWebSocket(ws);
          cleanup();
          process.exit(0);
          return;

        default:
          printError(`Unknown command: ${cmd}. Type /help for available commands.`);
          rl.prompt();
          return;
      }
    }

    // ─── Send Message ──────────────────────────────────────────────

    sendMessage(ws, chatMode, line, dmTarget);
    rl.prompt();
  });

  rl.on("close", () => {
    if (!isExiting) {
      disconnectWebSocket(ws);
      cleanup();
      process.exit(0);
    }
  });

  // ─── Handle process signals ──────────────────────────────────────────

  process.on("SIGINT", () => {
    disconnectWebSocket(ws);
    cleanup();
    process.exit(0);
  });
}
