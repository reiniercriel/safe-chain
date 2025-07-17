import {
  addLineToFile,
  doesExecutableExistOnSystem,
  execAndGetOutput,
  removeLinesMatchingPattern,
} from "../helpers.js";

const shellName = "Zsh";
const executableName = "zsh";
const startupFileCommand = "echo ${ZDOTDIR:-$HOME}/.zshrc";

function isInstalled() {
  return doesExecutableExistOnSystem(executableName);
}

function teardown() {
  const startupFile = execAndGetOutput(startupFileCommand, executableName);

  // Removes all aliases starting with "alias npm=", "alias npx=", or "alias yarn="
  // This will remove the safe-chain aliases for npm, npx, and yarn commands.
  removeLinesMatchingPattern(startupFile, /^alias\s+(npm|npx|yarn)=/);

  return true;
}

function setup(tools) {
  const startupFile = execAndGetOutput(startupFileCommand, executableName);
  teardown();

  for (const { tool, aikidoCommand } of tools) {
    addLineToFile(
      startupFile,
      `alias ${tool}="${aikidoCommand}" # Safe-chain alias for ${tool}`
    );
  }

  return true;
}

export default {
  name: shellName,
  isInstalled,
  setup,
  teardown,
};
