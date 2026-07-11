import readline from "node:readline";
import { aiChat } from "../services/api.js";
import { showBanner } from "../ui/banner.js";
import { createSpinner } from "../ui/spinner.js";
import {
  printBlank,
  printSystem,
  printError,
} from "../ui/printer.js";
import { brand, accent, muted, whiteBold, success as successColor } from "../ui/color.js";

/**
 * Interactive AI chat mode.
 * Completely separate from the main chat application.
 */
export async function aiCommand() {
  showBanner();
  printBlank();
  console.log(`  ${whiteBold("🤖 AI Chat Mode")}`);
  console.log(`  ${muted("Ask anything. Type")} ${brand("exit")} ${muted("to quit.")}`);
  printBlank();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `  ${accent("You")} ${brand("›")} `,
    terminal: true,
  });

  rl.prompt();

  rl.on("line", async (input) => {
    const line = input.trim();

    if (!line) {
      rl.prompt();
      return;
    }

    if (line.toLowerCase() === "exit") {
      printBlank();
      printSystem("Exiting AI chat. Goodbye! 👋");
      printBlank();
      rl.close();
      process.exit(0);
      return;
    }

    const spinner = createSpinner("Thinking...");
    spinner.start();

    const result = await aiChat(line);

    if (result.reply) {
      spinner.stop();
      console.log();
      console.log(`  ${successColor("AI")} ${brand("›")} ${result.reply}`);
      console.log();
    } else {
      spinner.fail("AI error");
      printError(result.error || "Failed to get a response");
      printBlank();
    }

    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });

  process.on("SIGINT", () => {
    printBlank();
    printSystem("Exiting AI chat. Goodbye! 👋");
    printBlank();
    rl.close();
    process.exit(0);
  });
}
