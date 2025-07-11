import chalk from "chalk";
import { ui } from "../environment/userInteraction.js";
import { detectShells } from "./shellDetection.js";
import { getAliases } from "./helpers.js";
import fs from "fs";
import { EOL } from "os";

export async function teardown() {
  ui.writeInformation(
    chalk.bold("Removing shell aliases.") +
      " This will remove safe-chain aliases for npm, npx, and yarn commands."
  );
  ui.emptyLine();

  try {
    const shells = detectShells();
    if (shells.length === 0) {
      ui.writeError("No supported shells detected. Cannot remove aliases.");
      return;
    }

    ui.writeInformation(
      `Detected ${shells.length} supported shell(s): ${shells
        .map((shell) => chalk.bold(shell.name))
        .join(", ")}.`
    );

    let updatedCount = 0;
    for (const shell of shells) {
      if (removeAliasesForShell(shell)) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      ui.emptyLine();
      ui.writeInformation(`Please restart your terminal to apply the changes.`);
    }
  } catch (error) {
    ui.writeError(
      `Failed to remove shell aliases: ${error.message}. Please check your shell configuration.`
    );
    return;
  }
}

/**
 * This function removes aliases for the given shell.
 * It reads the shell's startup file (eg ~/.bashrc, ~/.zshrc, etc.),
 * and then removes the aliases for npm, npx, and yarn commands.
 * If the aliases don't exist, it will report that they were not found.
 * If the startup file does not exist, it will report that no aliases need to be removed.
 *
 * The shell startup script is loaded by the respective shell when it starts.
 * This means that the aliases will be removed from the shell after it is restarted.
 */
function removeAliasesForShell(shell) {
  if (!shell.startupFile) {
    ui.writeError(
      `- ${chalk.bold(
        shell.name
      )}: no startup file found. Cannot remove aliases.`
    );
    return false;
  }

  if (!fs.existsSync(shell.startupFile)) {
    ui.writeInformation(
      `- ${chalk.bold(
        shell.name
      )}: startup file does not exist. No aliases to remove.`
    );
    return false;
  }

  const aliases = getAliases(shell.startupFile);
  const fileContent = fs.readFileSync(shell.startupFile, "utf-8");
  const { removedCount, notFoundCount } = removeAliasesFromFile(
    aliases,
    fileContent,
    shell.startupFile
  );

  let summary = "- " + chalk.bold(shell.name) + ": ";

  if (removedCount > 0) {
    summary += chalk.green(`${removedCount} aliases were removed`);
  }
  if (notFoundCount > 0) {
    if (removedCount > 0) {
      summary += ", ";
    }
    summary += chalk.yellow(`${notFoundCount} aliases were not found`);
  }
  if (removedCount === 0 && notFoundCount === 0) {
    summary += chalk.yellow("no aliases found to remove");
  }

  ui.writeInformation(summary);
  return removedCount > 0;
}

/**
 * This function removes the aliases from the startup file.
 * It searches for exact matches of each alias line and removes them.
 * eg: for bash it will remove 'alias npm="aikido-npm"' for npm from ~/.bashrc
 * @returns an object with the counts of removed and not found aliases.
 */
export function removeAliasesFromFile(aliases, fileContent, startupFilePath) {
  let removedCount = 0;
  let notFoundCount = 0;
  let updatedContent = fileContent;

  for (const alias of aliases) {
    const lines = updatedContent.split(EOL);
    let aliasLineIndex = lines.findIndex((line) => line.trim() === alias);

    if (aliasLineIndex !== -1) {
      removedCount++;

      // Remove all occurrences of the alias line, in case it appears multiple times
      while (aliasLineIndex !== -1) {
        lines.splice(aliasLineIndex, 1);
        aliasLineIndex = lines.findIndex((line) => line.trim() === alias);
      }
      updatedContent = lines.join(EOL);
    } else {
      notFoundCount++;
    }
  }

  if (removedCount > 0) {
    fs.writeFileSync(startupFilePath, updatedContent, "utf-8");
  }

  return {
    removedCount,
    notFoundCount,
  };
}
