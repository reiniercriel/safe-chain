import {
  addLineToFile,
  doesExecutableExistOnSystem,
  removeLinesMatchingPattern,
} from "../helpers.js";
import { execSync } from "child_process";

const shellName = "Zsh";
const executableName = "zsh";
const startupFileCommand = "echo ${ZDOTDIR:-$HOME}/.zshrc";

function isInstalled() {
  return doesExecutableExistOnSystem(executableName);
}

function teardown() {
  const startupFile = getStartupFile();

  // Removes all aliases starting with "alias npm=", "alias npx=", or "alias yarn="
  // This will remove the safe-chain aliases for npm, npx, and yarn commands.
  removeLinesMatchingPattern(startupFile, /^alias\s+(npm|npx|yarn)=/);

  return true;
}

function setup(tools) {
  const startupFile = getStartupFile();
  teardown();

  for (const { tool, aikidoCommand } of tools) {
    addLineToFile(
      startupFile,
      `alias ${tool}="${aikidoCommand}" # Safe-chain alias for ${tool}`
    );
  }

  return true;
}

function getStartupFile() {
  try {
    return execSync(startupFileCommand, {
      encoding: "utf8",
      shell: executableName,
    }).trim();
  } catch (error) {
    throw new Error(
      `Command failed: ${startupFileCommand}. Error: ${error.message}`
    );
  }
}

export default {
  name: shellName,
  isInstalled,
  setup,
  teardown,
};
