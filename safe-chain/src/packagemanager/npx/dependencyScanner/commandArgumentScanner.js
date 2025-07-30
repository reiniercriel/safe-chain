import { resolvePackageVersion } from "../../../api/npmApi.js";
import { parsePackagesFromArguments } from "../parsing/parsePackagesFromArguments.js";

export function commandArgumentScanner() {
  return {
    scan: (args) => scanDependencies(args),
    shouldScan: () => true, // all npx commands need to be scanned, npx doesn't have dry-run
  };
}
function scanDependencies(args) {
  return checkChangesFromArgs(args);
}

export async function checkChangesFromArgs(args) {
  const changes = [];
  const packageUpdates = parsePackagesFromArguments(args);

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
