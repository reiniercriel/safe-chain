import { parsePackagesFromInstallArgs } from "../parsing/parsePackagesFromInstallArgs.js";
import { hasDryRunArg } from "../utils/pipCommands.js";

/**
 * Scanner for pip command arguments to detect package installations
 * 
 * @param {Object} options - Scanner options
 * @param {boolean} [options.ignoreDryRun=false] - Whether to ignore dry-run flag
 * @returns {Object} Scanner interface
 */
export function commandArgumentScanner(options = {}) {
  const { ignoreDryRun = false } = options;

  function shouldScan(args) {
    return shouldScanDependencies(args, ignoreDryRun);
  }

  function scan(args) {
    return scanDependencies(args);
  }

  return {
    shouldScan,
    scan,
  };
}

function shouldScanDependencies(args, ignoreDryRun) {
  return ignoreDryRun || !hasDryRunArg(args);
}

function scanDependencies(args) {
  return checkChangesFromArgs(args);
}

/**
 * Extracts package changes from pip command arguments
 * 
 * Unlike npm, pip's parser already returns exact versions (== or ===)
 * or "latest" for unversioned packages, so no version resolution is needed.
 * 
 * @param {string[]} args - Command line arguments
 * @returns {Array<{name: string, version: string, type: string}>} Package changes
 */
export function checkChangesFromArgs(args) {
  const packageUpdates = parsePackagesFromInstallArgs(args);
  
  // Parser already provides exact versions or "latest", no need to resolve
  // Just return the packages with type "add"
  return packageUpdates;
}
