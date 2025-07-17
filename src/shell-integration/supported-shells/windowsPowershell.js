import {
  addLineToFile,
  doesExecutableExistOnSystem,
  execAndGetOutput,
  removeLinesMatchingPattern,
} from "../helpers.js";

const shellName = "Windows PowerShell";
const executableName = "powershell";
const startupFileCommand = "echo $PROFILE";

function isInstalled() {
  return doesExecutableExistOnSystem(executableName);
}

function teardown() {
  const startupFile = execAndGetOutput(startupFileCommand, executableName);

  // Removes all aliases starting with "Set-Alias npm=", "Set-Alias npx=", or "Set-Alias yarn="
  // This will remove the safe-chain aliases for npm, npx, and yarn commands.
  removeLinesMatchingPattern(startupFile, /^Set-Alias\s+(npm|npx|yarn)\s+/);

  return true;
}

function setup(tools) {
  const startupFile = execAndGetOutput(startupFileCommand, executableName);
  teardown();

  for (const { tool, aikidoCommand } of tools) {
    addLineToFile(
      startupFile,
      `Set-Alias ${tool} ${aikidoCommand} # Safe-chain alias for ${tool}`
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
