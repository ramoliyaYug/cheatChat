import ora from "ora";

/**
 * Create a styled spinner with consistent branding.
 */
export function createSpinner(text) {
  return ora({
    text,
    color: "magenta",
    spinner: "dots",
  });
}
