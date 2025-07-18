import chalk from "chalk";
import { ui } from "../environment/userInteraction.js";
import { detectShells } from "./shellDetection.js";
import { knownAikidoTools } from "./helpers.js";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Loops over the detected shells and calls the setup function for each.
 */
export async function setup() {
  ui.writeInformation(
    chalk.bold("Setting up shell aliases.") +
      " This will wrap safe-chain around npm, npx, and yarn commands."
  );
  ui.emptyLine();

  copyStartupFiles();

  try {
    const shells = detectShells();
    if (shells.length === 0) {
      ui.writeError("No supported shells detected. Cannot set up aliases.");
      return;
    }

    ui.writeInformation(
      `Detected ${shells.length} supported shell(s): ${shells
        .map((shell) => chalk.bold(shell.name))
        .join(", ")}.`
    );

    let updatedCount = 0;
    for (const shell of shells) {
      if (setupShell(shell)) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      ui.emptyLine();
      ui.writeInformation(`Please restart your terminal to apply the changes.`);
    }
  } catch (error) {
    ui.writeError(
      `Failed to set up shell aliases: ${error.message}. Please check your shell configuration.`
    );
    return;
  }
}

/**
 * Calls the setup function for the given shell and reports the result.
 */
function setupShell(shell) {
  let success = false;
  try {
    shell.teardown(knownAikidoTools); // First, tear down to prevent duplicate aliases
    success = shell.setup(knownAikidoTools);
  } catch {
    success = false;
  }

  if (success) {
    ui.writeInformation(
      `${chalk.bold("- " + shell.name + ":")} ${chalk.green(
        "Setup successful"
      )}`
    );
  } else {
    ui.writeError(
      `${chalk.bold("- " + shell.name + ":")} ${chalk.red(
        "Setup failed"
      )}. Please check your ${shell.name} configuration.`
    );
  }

  return success;
}

function copyStartupFiles() {
  const startupFiles = ["init-posix.sh"];

  for (const file of startupFiles) {
    const targetPath = path.join(os.homedir(), ".safe-chain", "scripts", file);

    // Create target directory if it doesn't exist
    const targetDir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Use absolute path for source
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sourcePath = path.resolve(__dirname, "startup-scripts", file);
    fs.copyFileSync(sourcePath, targetPath);
  }
}
