// oxlint-disable no-console
import chalk from "chalk";
import ora from "ora";
import { createInterface } from "readline";
import { isCi } from "./environment.js";

function emptyLine() {
  writeInformation("");
}

function writeInformation(message, ...optionalParams) {
  console.log(message, ...optionalParams);
}

function writeWarning(message, ...optionalParams) {
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

function startProcess(message) {
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

async function confirm(config) {
  if (isCi()) {
    return Promise.resolve(config.default);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultText = config.default ? " (Y/n)" : " (y/N)";
    rl.question(`${config.message}${defaultText} `, (answer) => {
      rl.close();

      const normalizedAnswer = answer.trim().toLowerCase();

      if (normalizedAnswer === "y" || normalizedAnswer === "yes") {
        resolve(true);
      } else if (normalizedAnswer === "n" || normalizedAnswer === "no") {
        resolve(false);
      } else {
        resolve(config.default);
      }
    });
  });
}

export const ui = {
  writeInformation,
  writeWarning,
  writeError,
  emptyLine,
  startProcess,
  confirm,
};
