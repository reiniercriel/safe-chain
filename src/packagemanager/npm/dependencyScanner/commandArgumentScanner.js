import { resolvePackageVersion } from "../../../api/npmApi.js";
import { parsePackagesFromInstallArgs } from "../parsing/parsePackagesFromInstallArgs.js";
import { hasDryRunArg } from "../utils/npmCommands.js";

export function commandArgumentScanner(opts) {
  const ignoreDryRun = opts?.ignoreDryRun ?? false;

  return {
    scan: (args) => scanDependencies(args),
    shouldScan: (args) => shouldScanDependencies(args, ignoreDryRun),
  };
}
function scanDependencies(args) {
  return checkChangesFromArgs(args);
}

function shouldScanDependencies(args, ignoreDryRun) {
  return ignoreDryRun || !hasDryRunArg(args);
}

export async function checkChangesFromArgs(args) {
  const changes = [];
  const packageUpdates = parsePackagesFromInstallArgs(args);

  for (const packageUpdate of packageUpdates) {
    var exactVersion = await resolvePackageVersion(
      packageUpdate.name,
      packageUpdate.version
    );
    if (exactVersion) {
      packageUpdate.version = exactVersion;
    }

    changes.push({ ...packageUpdate, type: "add" });
  }
  return changes;
}
