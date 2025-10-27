// oxlint-disable no-console
import chalk from "chalk";
import ora from "ora";
import { isCi } from "./environment.js";
import { getLoggingLevel, LOGGING_SILENT } from "../config/settings.js";

function isSilentMode() {
  return getLoggingLevel() === LOGGING_SILENT;
}

function emptyLine() {
  if (isSilentMode()) return;

  writeInformation("");
}

function writeInformation(message, ...optionalParams) {
  if (isSilentMode()) return;

  console.log(message, ...optionalParams);
}

function writeWarning(message, ...optionalParams) {
  if (isSilentMode()) return;

  if (!isCi()) {
    message = chalk.yellow(message);
  }
  console.warn(message, ...optionalParams);
}

function writeError(message, ...optionalParams) {
  if (!isCi()) {
    message = chalk.red(message);
  }
  console.error(message, ...optionalParams);
}

function writeExitWithoutInstallingMaliciousPackages() {
  let message = "Safe-chain: Exiting without installing malicious packages.";
  if (!isCi()) {
    message = chalk.red(message);
  }
  console.error(message);
}

function writeVerboseInformation(message, ...optionalParams) {
  // TODO: Correctly implement verbose logging
  writeInformation(message, ...optionalParams);
}

function startProcess(message) {
  if (isSilentMode()) {
    return {
      succeed: () => {},
      fail: () => {},
      stop: () => {},
      setText: () => {},
    };
  }

  if (isCi()) {
    return {
      succeed: (message) => {
        writeInformation(message);
      },
      fail: (message) => {
        writeError(message);
      },
      stop: () => {},
      setText: (message) => {
        writeInformation(message);
      },
    };
  } else {
    const spinner = ora(message).start();
    return {
      succeed: (message) => {
        spinner.succeed(message);
      },
      fail: (message) => {
        spinner.fail(message);
      },
      stop: () => {
        spinner.stop();
      },
      setText: (message) => {
        spinner.text = message;
      },
    };
  }
}

export const ui = {
  writeInformation,
  writeVerboseInformation,
  writeWarning,
  writeError,
  writeExitWithoutInstallingMaliciousPackages,
  emptyLine,
  startProcess,
};
