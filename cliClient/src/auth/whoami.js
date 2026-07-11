import { loadAuth } from "../config/config.js";
import { getMe } from "../services/api.js";
import { createSpinner } from "../ui/spinner.js";
import { printError, printWarning, printBlank } from "../ui/printer.js";
import { printUserTable } from "../ui/tables.js";
import { brand, whiteBold } from "../ui/color.js";

/**
 * Display current user info.
 */
export async function whoamiFlow() {
  printBlank();

  const auth = loadAuth();
  if (!auth) {
    printWarning("You are not logged in. Run: chat login");
    printBlank();
    return;
  }

  const spinner = createSpinner("Fetching profile...");
  spinner.start();

  const result = await getMe(auth.token);

  if (result.success) {
    spinner.succeed(`Logged in as ${brand(result.user.username)}`);
    printUserTable(result.user);
  } else {
    spinner.fail("Failed to fetch profile");
    printError(result.error || "Session may have expired. Try: chat login");
  }

  printBlank();
}
