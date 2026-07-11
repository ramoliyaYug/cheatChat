import { brand, muted, accent, whiteBold } from "../ui/color.js";
import { printBlank } from "../ui/printer.js";
import { APP_NAME } from "../utils/constants.js";

export function helpCommand() {
  printBlank();
  console.log(`  ${whiteBold(`${APP_NAME} — Command Reference`)}`);
  printBlank();

  const commands = [
    ["chat signup", "Create a new account"],
    ["chat login", "Login to your account"],
    ["chat logout", "Logout and clear credentials"],
    ["chat whoami", "Show current user info"],
    ["chat connect", "Connect to chat"],
    ["chat help", "Show this help menu"],
  ];

  for (const [cmd, desc] of commands) {
    console.log(`  ${brand(cmd.padEnd(20))} ${muted(desc)}`);
  }

  printBlank();
  console.log(`  ${whiteBold("Inside Chat:")}`);
  printBlank();

  const chatCommands = [
    ["/global", "Switch to global chat"],
    ["/dm <username>", "Switch to private messaging"],
    ["/history", "Load message history"],
    ["/online", "Show online users"],
    ["/users", "Show all registered users"],
    ["/help", "Show chat commands"],
    ["/exit", "Disconnect and exit"],
  ];

  for (const [cmd, desc] of chatCommands) {
    console.log(`  ${accent(cmd.padEnd(20))} ${muted(desc)}`);
  }

  printBlank();
  console.log(`  ${whiteBold("AI Tools:")}`);
  printBlank();

  const aiCommands = [
    ["chat ai", "Interactive AI chat"],
    ["chat solve <file>", "Solve/improve a file with AI"],
  ];

  for (const [cmd, desc] of aiCommands) {
    console.log(`  ${brand(cmd.padEnd(20))} ${muted(desc)}`);
  }

  printBlank();
}
