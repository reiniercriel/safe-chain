import { ui } from "../../../environment/userInteraction.js";
import { parseDryRunOutput } from "../parsing/parseNpmInstallDryRunOutput.js";
import { dryRunNpmCommandAndOutput } from "../runNpmCommand.js";
import { hasDryRunArg } from "../utils/npmCommands.js";

export function dryRunScanner(scannerOptions) {
  return {
    scan: (args) => scanDependencies(scannerOptions, args),
    shouldScan: (args) => shouldScanDependencies(scannerOptions, args),
  };
}
function scanDependencies(scannerOptions, args) {
  let dryRunArgs = args;

  if (scannerOptions?.dryRunCommand) {
    // Replace the first argument with the dryRunCommand (eg: "install" instead of "install-test")
    dryRunArgs = [scannerOptions.dryRunCommand, ...args.slice(1)];
  }

  return checkChangesWithDryRun(dryRunArgs);
}

function shouldScanDependencies(scannerOptions, args) {
  if (hasDryRunArg(args)) {
    return false;
  }

  if (scannerOptions?.skipScanWhen && scannerOptions.skipScanWhen(args)) {
    return false;
  }

  return true;
}

function checkChangesWithDryRun(args) {
  const dryRunOutput = dryRunNpmCommandAndOutput(args);

  // Dry-run can return a non-zero status code in some cases
  //  e.g., when running "npm audit fix --dry-run", it returns exit code 1
  //  when there are vulnurabilities that can be fixed.
  if (dryRunOutput.status !== 0 && !dryRunOutput.output) {
    ui.writeError("Detecting changes failed.");
    return [];
  }

  const parsedOutput = parseDryRunOutput(dryRunOutput.output);

  // reverse the array to have the top-level packages first
  return parsedOutput.reverse();
}
