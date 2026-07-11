import inquirer from "inquirer";
import { login as apiLogin } from "../services/api.js";
import { saveAuth } from "../config/config.js";
import { createSpinner } from "../ui/spinner.js";
import { printSuccess, printError, printBlank } from "../ui/printer.js";
import { brand, muted, whiteBold } from "../ui/color.js";

/**
 * Interactive login flow.
 */
export async function loginFlow() {
  printBlank();
  console.log(`  ${whiteBold("Login to CheatChat")}`);
  printBlank();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: brand("Username:"),
      validate: (input) => input.trim().length > 0 || "Username is required",
    },
    {
      type: "password",
      name: "password",
      message: brand("Password:"),
      mask: "•",
      validate: (input) => input.length > 0 || "Password is required",
    },
  ]);

  const spinner = createSpinner("Authenticating...");
  spinner.start();

  const result = await apiLogin(answers.username, answers.password);

  if (result.success) {
    saveAuth(result.username, result.token);
    spinner.succeed(`Welcome back, ${brand(result.username)}!`);
    printBlank();
    console.log(`  ${muted("Run")} ${brand("chat connect")} ${muted("to start chatting")}`);
  } else {
    spinner.fail("Login failed");
    printError(result.error || "Invalid username or password");
  }

  printBlank();
}
