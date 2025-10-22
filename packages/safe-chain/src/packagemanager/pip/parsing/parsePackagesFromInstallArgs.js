/**
 * Parses package specifications from pip install arguments
 * 
 * Pip supports various package specification formats:
 * - package_name
 * - package_name==version
 * - package_name>=version
 * - package_name~=version
 * - git+https://...
 * - -r requirements.txt
 * - . (local directory)
 * 
 * @param {string[]} args - pip install command arguments
 * @returns {Array<{name: string, version?: string, type: string}>} Array of package specifications
 */
export function parsePackagesFromInstallArgs(args) {
  const packages = [];
  let skipNext = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (skipNext) {
      skipNext = false;
      continue;
    }

    // Skip the command itself (install, uninstall, etc.)
    if (i === 0 && !arg.startsWith("-")) {
      continue;
    }

    // Skip flags and their values
    if (arg.startsWith("-")) {
      // Some flags take a value, skip the next arg for those
      if (arg === "-r" || arg === "--requirement" || 
          arg === "-c" || arg === "--constraint" ||
          arg === "-e" || arg === "--editable" ||
          arg === "-t" || arg === "--target" ||
          arg === "-i" || arg === "--index-url" ||
          arg === "--extra-index-url") {
        skipNext = true;
      }
      continue;
    }

    // TODO: Implement full parsing logic
    // For now, this is a placeholder that would need to handle:
    // - Version specifiers (==, >=, <=, ~=, !=, <, >)
    // - VCS urls (git+, hg+, svn+, bzr+)
    // - Local file paths
    // - Requirements files (-r, --requirement)
    // - Extras (package[extra1,extra2])

    packages.push({
      name: arg,
      type: "add",
    });
  }

  return packages;
}
