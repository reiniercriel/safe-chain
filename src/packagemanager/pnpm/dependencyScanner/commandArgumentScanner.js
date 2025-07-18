import { resolvePackageVersion } from "../../../api/npmApi.js";
import { parsePackagesFromArguments } from "../parsing/parsePackagesFromArguments.js";

export function commandArgumentScanner() {
  return {
    scan: (args) => scanDependencies(args),
    shouldScan: () => true, // There's no dry run for pnpm, so we always scan
  };
}

async function scanDependencies(args) {
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
