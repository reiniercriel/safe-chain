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
  const supportedScanners =
    getMajorVersion(version) >= 22
      ? npm22AndAboveSupportedScanners
      : npm21AndBelowSupportedScanners;

  function isSupportedCommand(args) {
    const scanner = findDependencyScannerForCommand(supportedScanners, args);
    return scanner.shouldScan(args);
  }

  function getDependencyUpdatesForCommand(args) {
    const scanner = findDependencyScannerForCommand(supportedScanners, args);
    return scanner.scan(args);
  }

  return {
    getWarningMessage: () => warnForLimitedSupport(version),
    runCommand: runNpm,
    isSupportedCommand,
    getDependencyUpdatesForCommand,
  };
}

const npm22AndAboveSupportedScanners = {
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

const npm21AndBelowSupportedScanners = {
  [npmInstallCommand]: commandArgumentScanner(),
  [npmUpdateCommand]: commandArgumentScanner(),
  [npmExecCommand]: commandArgumentScanner({ ignoreDryRun: true }), // exec command doesn't support dry-run
};

function warnForLimitedSupport(version) {
  if (getMajorVersion(version) >= 22) {
    return null;
  }

  return `Aikido-npm will only scan the arguments of the install command for Node.js version prior to version 22.
Please update your Node.js version to 22 or higher for full coverage. Current version: v${version}`;
}

function getMajorVersion(version) {
  return parseInt(version.split(".")[0]);
}

function findDependencyScannerForCommand(scanners, args) {
  const command = getNpmCommandForArgs(args);
  if (!command) {
    return nullScanner();
  }

  const scanner = scanners[command];
  return scanner ? scanner : nullScanner();
}
