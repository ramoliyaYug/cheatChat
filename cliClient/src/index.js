import { Command } from "commander";
import { showBanner } from "./ui/banner.js";
import { signupCommand } from "./commands/signup.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { helpCommand } from "./commands/help.js";
import { connectCommand } from "./commands/connect.js";
import { aiCommand } from "./commands/ai.js";
import { solveCommand } from "./commands/solve.js";
import { whoamiFlow } from "./auth/whoami.js";
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from "./utils/constants.js";

// ─── CLI Program ─────────────────────────────────────────────────────────────

const program = new Command();

program
  .name("chat")
  .version(APP_VERSION)
  .description(APP_DESCRIPTION);

// ─── Commands ────────────────────────────────────────────────────────────────

program
  .command("signup")
  .description("Create a new CheatChat account")
  .action(async () => {
    showBanner();
    await signupCommand();
  });

program
  .command("login")
  .description("Login to your CheatChat account")
  .action(async () => {
    showBanner();
    await loginCommand();
  });

program
  .command("logout")
  .description("Logout and clear stored credentials")
  .action(() => {
    showBanner();
    logoutCommand();
  });

program
  .command("whoami")
  .description("Show current logged-in user")
  .action(async () => {
    showBanner();
    await whoamiFlow();
  });

program
  .command("connect")
  .description("Connect to CheatChat and start messaging")
  .action(async () => {
    showBanner();
    await connectCommand();
  });

program
  .command("help")
  .description("Show all available commands")
  .action(() => {
    showBanner();
    helpCommand();
  });

program
  .command("ai")
  .description("Enter interactive AI chat mode")
  .action(async () => {
    await aiCommand();
  });

program
  .command("solve <file>")
  .description("Solve/improve a source file using AI")
  .action(async (file) => {
    await solveCommand(file);
  });

// ─── Default (no command) ────────────────────────────────────────────────────

if (process.argv.length <= 2) {
  showBanner();
  helpCommand();
} else {
  program.parse(process.argv);
}
