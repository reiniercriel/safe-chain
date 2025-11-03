import { parsePackagesFromInstallArgs } from "../parsing/parsePackagesFromInstallArgs.js";
import { hasDryRunArg } from "../utils/pipCommands.js";

/**
 * @param {{ ignoreDryRun?: boolean }} [options]
 */
export function commandArgumentScanner(options = {}) {
  const { ignoreDryRun = false } = options;

  /**
   * @param {string[]} args
   */
  function shouldScan(args) {
    return shouldScanDependencies(args, ignoreDryRun);
  }

  /**
   * @param {string[]} args
   */
  function scan(args) {
    return scanDependencies(args);
  }

  return {
    shouldScan,
    scan,
  };
}

/**
 * @param {string[]} args
 * @param {boolean} ignoreDryRun
 */
function shouldScanDependencies(args, ignoreDryRun) {
  return ignoreDryRun || !hasDryRunArg(args);
}

/**
 * @param {string[]} args
 */
function scanDependencies(args) {
  return checkChangesFromArgs(args);
}

/**
 * @param {string[]} args
 */
export function checkChangesFromArgs(args) {
  const packageUpdates = parsePackagesFromInstallArgs(args);

  // Parser already provides exact versions or "latest", no need to resolve
  // Just return the packages with type "add"
  return packageUpdates;
}
