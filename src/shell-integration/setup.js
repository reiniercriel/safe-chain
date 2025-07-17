import chalk from "chalk";
import { ui } from "../environment/userInteraction.js";
import { detectShells } from "./shellDetection.js";
import { knownAikidoTools } from "./helpers.js";

/**
 * Loops over the detected shells and calls the setup function for each.
 */
export async function setup() {
  ui.writeInformation(
    chalk.bold("Setting up shell aliases.") +
      " This will wrap safe-chain around npm, npx, and yarn commands."
  );
  ui.emptyLine();

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
