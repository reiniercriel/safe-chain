import {
  addLineToFile,
  doesExecutableExistOnSystem,
  removeLinesMatchingPattern,
} from "../helpers.js";
import { execSync } from "child_process";

const shellName = "Bash";
const executableName = "bash";
const startupFileCommand = "echo ~/.bashrc";

function isInstalled() {
  return doesExecutableExistOnSystem(executableName);
}

function teardown(tools) {
  const startupFile = getStartupFile();

  for (const { tool } of tools) {
    // Remove any existing alias for the tool
    removeLinesMatchingPattern(startupFile, new RegExp(`^alias\\s+${tool}=`));
  }

  // Removes the line that sources the safe-chain bash initialization script (~/.aikido/scripts/init-posix.sh)
  removeLinesMatchingPattern(
    startupFile,
    /^source\s+~\/\.safe-chain\/scripts\/init-posix\.sh/
  );

  return true;
}

function setup() {
  const startupFile = getStartupFile();

  addLineToFile(
    startupFile,
    `source ~/.safe-chain/scripts/init-posix.sh # Safe-chain bash initialization script`
  );

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
