import { clearAuth, loadAuth } from "../config/config.js";
import { printSuccess, printWarning, printBlank } from "../ui/printer.js";

/**
 * Logout — clear stored credentials.
 */
export function logoutFlow() {
  printBlank();

  const auth = loadAuth();
  if (!auth) {
    printWarning("You are not logged in.");
  } else {
    clearAuth();
    printSuccess(`Logged out. Goodbye, ${auth.username}!`);
  }

  printBlank();
}
