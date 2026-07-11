import path from "node:path";
import fs from "fs-extra";
import { aiFile } from "../services/api.js";
import { showBanner } from "../ui/banner.js";
import { createSpinner } from "../ui/spinner.js";
import {
  printBlank,
  printSuccess,
  printError,
} from "../ui/printer.js";
import { muted } from "../ui/color.js";

/**
 * Strip markdown code fences from AI response (client-side safety net).
 */
function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceRegex = /^```[\w]*\n?([\s\S]*?)\n?```$/;
  const match = trimmed.match(fenceRegex);
  if (match) {
    return match[1];
  }
  return trimmed;
}

/**
 * Solve/improve a file using AI.
 * Reads the file, sends it to POST /ai/file, overwrites with the result.
 */
export async function solveCommand(filePath) {
  showBanner();
  printBlank();

  // Resolve the file path relative to cwd
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const filename = path.basename(resolvedPath);

  // Check if file exists
  if (!(await fs.pathExists(resolvedPath))) {
    printError(`File not found: ${resolvedPath}`);
    printBlank();
    return;
  }

  // Check it's a file, not a directory
  const stat = await fs.stat(resolvedPath);
  if (!stat.isFile()) {
    printError(`Not a file: ${resolvedPath}`);
    printBlank();
    return;
  }

  // Read file content
  const content = await fs.readFile(resolvedPath, "utf-8");

  if (content.trim().length === 0) {
    printError("File is empty. Nothing to solve.");
    printBlank();
    return;
  }

  console.log(`  ${muted("File:")} ${filename}`);
  console.log(`  ${muted("Size:")} ${content.length} characters`);
  printBlank();

  const spinner = createSpinner("🤖 Solving...");
  spinner.start();

  const result = await aiFile(filename, content);

  if (result.content) {
    // Strip code fences if present (client-side safety)
    const cleanContent = stripCodeFences(result.content);

    // Overwrite the original file
    await fs.writeFile(resolvedPath, cleanContent, "utf-8");

    spinner.succeed("🤖 Solving complete!");
    printBlank();
    printSuccess(`File updated: ${resolvedPath}`);
  } else {
    spinner.fail("Solving failed");
    printError(result.error || "Failed to process the file");
  }

  printBlank();
}
