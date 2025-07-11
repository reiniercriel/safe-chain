import chalk from "chalk";
import { ui } from "../environment/userInteraction.js";
import { detectShells } from "./shellDetection.js";
import { getAliases } from "./helpers.js";
import fs from "fs";
import { EOL } from "os";

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
      if (setupAliasesForShell(shell)) {
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
 * This function sets up aliases for the given shell.
 * It reads the shell's startup file (eg ~/.bashrc, ~/.zshrc, etc.),
 * and then appends the aliases for npm, npx, and yarn commands.
 * If the aliases already exist, it will not add them again.
 * If the startup file does not exist, it will create it.
 *
 * The shell startup script is loaded by the respective shell when it starts.
 * This means that the aliases will be available in the shell after it is restarted.
 */
function setupAliasesForShell(shell) {
  if (!shell.startupFile) {
    ui.writeError(
      `- ${chalk.bold(
        shell.name
      )}: no startup file found. Cannot set up aliases.`
    );
    return false;
  }

  const aliases = getAliases(shell.startupFile);

  if (aliases.length === 0) {
    ui.writeError(`- ${chalk.bold(shell.name)}: could not generate aliases.`);
    return false;
  }

  const fileContent = readOrCreateStartupFile(shell.startupFile);
  const { addedCount, existingCount, failedCount } = appendAliasesToFile(
    aliases,
    fileContent,
    shell.startupFile
  );

  let summary = "- " + chalk.bold(shell.name) + ": ";

  if (addedCount > 0) {
    summary += chalk.green(`${addedCount} aliases were added`);
  }
  if (existingCount > 0) {
    if (addedCount > 0) {
      summary += ", ";
    }
    summary += chalk.yellow(`${existingCount} aliases were already present`);
  }
  if (failedCount > 0) {
    if (addedCount > 0 || existingCount > 0) {
      summary += ", ";
    }
    summary += chalk.red(`${failedCount} aliases failed to add`);
  }

  // write summary in a single line
  ui.writeInformation(summary);

  return true;
}

/**
 * This reads the content of the startup file.
 * If the file does not exist, it creates an empty file and returns an empty string.
 * The startup file is the shell's startup script (eg: ~/.bashrc, ~/.zshrc, etc.).
 * It is used to set up the shell environment when it starts.
 * Some shells may not have a startup file, in which case this function will create one.
 */
export function readOrCreateStartupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf-8");
    ui.writeInformation(`File ${filePath} created.`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * This function appends the aliases to the startup file.
 *  eg: for bash it will append 'alias npm="aikido-npm"' for npm to ~/.bashrc
 * @returns an object with the counts of added, existing, and failed aliases.
 */
export function appendAliasesToFile(aliases, fileContent, startupFilePath) {
  let addedCount = 0;
  let existingCount = 0;
  let failedCount = 0;

  for (const alias of aliases) {
    try {
      if (fileContent.includes(alias)) {
        existingCount++;
        continue;
      }

      fs.appendFileSync(startupFilePath, `${EOL}${alias}`, "utf-8");

      addedCount++;
    } catch {
      failedCount++;
      continue;
    }
  }

  return {
    addedCount,
    existingCount,
    failedCount,
  };
}
