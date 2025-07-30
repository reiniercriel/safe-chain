import { commandArgumentScanner } from "./dependencyScanner/commandArgumentScanner.js";
import { runNpx } from "./runNpxCommand.js";

export function createNpxPackageManager() {
  const scanner = commandArgumentScanner();

  return {
    getWarningMessage: () => null,
    runCommand: runNpx,
    isSupportedCommand: (args) => scanner.shouldScan(args),
    getDependencyUpdatesForCommand: (args) => scanner.scan(args),
  };
}
