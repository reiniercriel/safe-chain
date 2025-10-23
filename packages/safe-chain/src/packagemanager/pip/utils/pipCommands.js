/**
 * Pip command constants
 * 
 * Note: Unlike npm, pip does not support command aliases or abbreviations.
 * Commands must be spelled out fully (e.g., "install", not "i" or "add").
 */
export const pipInstallCommand = "install";
export const pipDownloadCommand = "download";
export const pipWheelCommand = "wheel";
export const pipUninstallCommand = "uninstall";

/**
 * Gets the pip command from the arguments array
 * 
 * @param {string[]} args - Command line arguments
 * @returns {string|null} The pip command or null if not found
 */
export function getPipCommandForArgs(args) {
  if (!args || args.length === 0) {
    return null;
  }

  // The first non-flag argument is typically the command
  for (const arg of args) {
    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return null;
}

/**
 * Checks if the arguments contain the --dry-run flag
 * 
 * @param {string[]} args - Command line arguments
 * @returns {boolean} True if --dry-run is present
 */
export function hasDryRunArg(args) {
  return args.some((arg) => arg === "--dry-run");
}
