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

  // Removes the line that sources the safe-chain zsh initialization script (~/.aikido/scripts/init-zsh.sh)
  removeLinesMatchingPattern(
    startupFile,
    /^source\s+~\/\.safe-chain\/scripts\/init-zsh\.sh/
  );

  return true;
}

function setup() {
  const startupFile = execAndGetOutput(startupFileCommand, executableName);
  teardown();

  addLineToFile(
    startupFile,
    `source ~/.safe-chain/scripts/init-zsh.sh # Safe-chain Zsh initialization script`
  );

  return true;
}

export default {
  name: shellName,
  isInstalled,
  setup,
  teardown,
};
