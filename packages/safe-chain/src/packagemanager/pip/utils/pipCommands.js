/**
 * Pip command constants
 */
export const pipInstallCommand = "install";
export const pipUninstallCommand = "uninstall";
export const pipListCommand = "list";
export const pipShowCommand = "show";
export const pipFreeze = "freeze";

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
