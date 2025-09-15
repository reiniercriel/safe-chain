import { commandArgumentScanner } from "./dependencyScanner/commandArgumentScanner.js";
import { dryRunScanner } from "./dependencyScanner/dryRunScanner.js";
import { nullScanner } from "./dependencyScanner/nullScanner.js";
import { runNpm } from "./runNpmCommand.js";
import {
  getNpmCommandForArgs,
  npmInstallCommand,
  npmCiCommand,
  npmInstallTestCommand,
  npmInstallCiTestCommand,
  npmUpdateCommand,
  npmAuditCommand,
  npmExecCommand,
} from "./utils/npmCommands.js";

export function createNpmPackageManager(version) {
  // From npm v10.4.0 onwards, the npm commands output detailed information
  // when using the --dry-run flag.
  // We use that information to scan for dependency changes.
  // For older versions of npm we have to rely on parsing the command arguments.
  const supportedScanners = isPriorToNpm10_4(version)
    ? npm10_3AndBelowSupportedScanners
    : npm10_4AndAboveSupportedScanners;

  function isSupportedCommand(args) {
    const scanner = findDependencyScannerForCommand(supportedScanners, args);
    return scanner.shouldScan(args);
  }

  function getDependencyUpdatesForCommand(args) {
    const scanner = findDependencyScannerForCommand(supportedScanners, args);
    return scanner.scan(args);
  }

  return {
    runCommand: runNpm,
    isSupportedCommand,
    getDependencyUpdatesForCommand,
  };
}

const npm10_4AndAboveSupportedScanners = {
  [npmInstallCommand]: dryRunScanner(),
  [npmUpdateCommand]: dryRunScanner(),
  [npmCiCommand]: dryRunScanner(),
  [npmAuditCommand]: dryRunScanner({
    skipScanWhen: (args) => !args.includes("fix"),
  }),
  [npmExecCommand]: commandArgumentScanner({ ignoreDryRun: true }), // exec command doesn't support dry-run

  // Running dry-run on install-test and install-ci-test will install & run tests.
  // We only want to know if there are changes in the dependencies.
  // So we run change the dry-run command to only check the install.
  [npmInstallTestCommand]: dryRunScanner({ dryRunCommand: npmInstallCommand }),
  [npmInstallCiTestCommand]: dryRunScanner({ dryRunCommand: npmCiCommand }),
};

const npm10_3AndBelowSupportedScanners = {
  [npmInstallCommand]: commandArgumentScanner(),
  [npmUpdateCommand]: commandArgumentScanner(),
  [npmExecCommand]: commandArgumentScanner({ ignoreDryRun: true }), // exec command doesn't support dry-run
};

function isPriorToNpm10_4(version) {
  try {
    const [major, minor] = version.split(".").map(Number);
    if (major < 10) return true;
    if (major === 10 && minor < 4) return true;
    return false;
  } catch {
    // Default to true: if version parsing fails, assume it's an older version
    return true;
  }
}

function findDependencyScannerForCommand(scanners, args) {
  const command = getNpmCommandForArgs(args);
  if (!command) {
    return nullScanner();
  }

  const scanner = scanners[command];
  return scanner ? scanner : nullScanner();
}
