import { commandArgumentScanner } from "./dependencyScanner/commandArgumentScanner.js";
import { runPip } from "./runPipCommand.js";
import {
  getPipCommandForArgs,
  pipInstallCommand,
  pipDownloadCommand,
  pipWheelCommand,
} from "./utils/pipCommands.js";

/**
 * @param {string} [command]
 */
export function createPipPackageManager(command = "pip") {
  /**
   * @param {string[]} args
   */
  function isSupportedCommand(args) {
    const scanner = findDependencyScannerForCommand(
      commandScannerMapping,
      args
    );
    return scanner.shouldScan(args);
  }

  /**
   * @param {string[]} args
   */
  function getDependencyUpdatesForCommand(args) {
    const scanner = findDependencyScannerForCommand(
      commandScannerMapping,
      args
    );
    return scanner.scan(args);
  }

  return {
    runCommand: /** @param {string[]} args */ (args) => runPip(command, args),
    isSupportedCommand,
    getDependencyUpdatesForCommand,
  };
}

const commandScannerMapping = {
  [pipInstallCommand]: commandArgumentScanner(),
  [pipDownloadCommand]: commandArgumentScanner(), // download also fetches packages from PyPI
  [pipWheelCommand]: commandArgumentScanner(), // wheel downloads and builds packages
  // Other commands return null scanner by default
};

const NULL_SCANNER = {
  shouldScan: () => false,
  scan: () => [],
};

/**
 * @param {Record<string, any>} scanners
 * @param {string[]} args
 */
function findDependencyScannerForCommand(scanners, args) {
  const command = getPipCommandForArgs(args);
  if (!command) {
    return NULL_SCANNER;
  }

  const scanner = scanners[command];
  return scanner || NULL_SCANNER;
}
