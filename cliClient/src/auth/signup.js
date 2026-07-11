import inquirer from "inquirer";
import { signup as apiSignup } from "../services/api.js";
import { saveAuth } from "../config/config.js";
import { createSpinner } from "../ui/spinner.js";
import { printSuccess, printError, printBlank } from "../ui/printer.js";
import { validateUsername, validatePassword } from "../utils/validator.js";
import { brand, muted, whiteBold } from "../ui/color.js";

/**
 * Interactive signup flow.
 */
export async function signupFlow() {
  printBlank();
  console.log(`  ${whiteBold("Create your CheatChat account")}`);
  printBlank();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: brand("Username:"),
      validate: (input) => {
        const { valid, message } = validateUsername(input);
        return valid || message;
      },
    },
    {
      type: "password",
      name: "password",
      message: brand("Password:"),
      mask: "•",
      validate: (input) => {
        const { valid, message } = validatePassword(input);
        return valid || message;
      },
    },
    {
      type: "password",
      name: "confirmPassword",
      message: brand("Confirm Password:"),
      mask: "•",
      validate: (input, answers) => {
        if (input !== answers.password) return "Passwords do not match";
        return true;
      },
    },
  ]);

  const spinner = createSpinner("Creating your account...");
  spinner.start();

  const result = await apiSignup(answers.username, answers.password);

  if (result.success) {
    saveAuth(result.username, result.token);
    spinner.succeed(`Account created! Welcome, ${brand(result.username)}`);
    printBlank();
    console.log(`  ${muted("Run")} ${brand("chat connect")} ${muted("to start chatting")}`);
  } else {
    spinner.fail("Signup failed");
    printError(result.error || "Unknown error");
  }

  printBlank();
}
