import {
  addLineToFile,
  doesExecutableExistOnSystem,
  removeLinesMatchingPattern,
} from "../helpers.js";
import { execSync } from "child_process";

const shellName = "Windows PowerShell";
const executableName = "powershell";
const startupFileCommand = "echo $PROFILE";

function isInstalled() {
  return doesExecutableExistOnSystem(executableName);
}

function teardown(tools) {
  const startupFile = getStartupFile();

  for (const { tool } of tools) {
    // Remove any existing alias for the tool
    removeLinesMatchingPattern(
      startupFile,
      new RegExp(`^Set-Alias\\s+${tool}\\s+`)
    );
  }

  // Remove the line that sources the safe-chain PowerShell initialization script
  removeLinesMatchingPattern(
    startupFile,
    /^\.\s+["']?\$HOME[/\\].safe-chain[/\\]scripts[/\\]init-pwsh\.ps1["']?/
  );

  return true;
}

function setup() {
  const startupFile = getStartupFile();

  addLineToFile(
    startupFile,
    `. "$HOME\\.safe-chain\\scripts\\init-pwsh.ps1" # Safe-chain PowerShell initialization script`
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
