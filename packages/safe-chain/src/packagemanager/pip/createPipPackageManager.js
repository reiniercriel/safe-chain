import { commandArgumentScanner } from "./dependencyScanner/commandArgumentScanner.js";
import { nullScanner } from "./dependencyScanner/nullScanner.js";
import { runPip } from "./runPipCommand.js";
import {
  getPipCommandForArgs,
  pipInstallCommand,
  pipUninstallCommand,
} from "./utils/pipCommands.js";

/**
 * Creates a package manager interface for Python's pip package installer
 * 
 * @param {string} [command="pip"] - The pip command to use (e.g., "pip", "pip3") defaults to "pip"
 */
export function createPipPackageManager(command = "pip") {
  function isSupportedCommand(args) {
    const scanner = findDependencyScannerForCommand(
      commandScannerMapping,
      args
    );
    return scanner.shouldScan(args);
  }

  function getDependencyUpdatesForCommand(args) {
    const scanner = findDependencyScannerForCommand(
      commandScannerMapping,
      args
    );
    return scanner.scan(args);
  }

  return {
    runCommand: (args) => runPip(command, args),
    isSupportedCommand,
    getDependencyUpdatesForCommand,
  };
}

const commandScannerMapping = {
  [pipInstallCommand]: commandArgumentScanner(),
  [pipUninstallCommand]: nullScanner(), // Uninstall doesn't need scanning
};

function findDependencyScannerForCommand(scanners, args) {
  const command = getPipCommandForArgs(args);
  if (!command) {
    return nullScanner();
  }

  const scanner = scanners[command];
  return scanner ? scanner : nullScanner();
}
