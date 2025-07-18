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

  return true;
}

function setup(tools) {
  const startupFile = getStartupFile();

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
