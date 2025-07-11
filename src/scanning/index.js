import { auditChanges } from "./audit/index.js";
import { getScanTimeout } from "../config/configFile.js";
import { setTimeout } from "timers/promises";
import chalk from "chalk";
import { getPackageManager } from "../packagemanager/currentPackageManager.js";
import { ui } from "../environment/userInteraction.js";

export function shouldScanCommand(args) {
  if (!args || args.length === 0) {
    return false;
  }

  return getPackageManager().isSupportedCommand(args);
}

export async function scanCommand(args) {
  if (!shouldScanCommand(args)) {
    return [];
  }

  let timedOut = false;

  const spinner = ui.startProcess("Scanning for malicious packages...");
  let audit;

  await Promise.race([
    (async () => {
      try {
        const packageManager = getPackageManager();
        const changes = await packageManager.getDependencyUpdatesForCommand(
          args
        );

        if (timedOut) {
          return;
        }

        if (changes.length > 0) {
          spinner.setText(`Scanning ${changes.length} package(s)...`);
        }

        audit = await auditChanges(changes);
      } catch (error) {
        spinner.fail(`Error while scanning: ${error.message}`);
        throw error;
      }
    })(),
    setTimeout(getScanTimeout()).then(() => {
      timedOut = true;
    }),
  ]);

  if (timedOut) {
    spinner.fail("Timeout exceeded while scanning.");
    throw new Error("Timeout exceeded while scanning npm install command.");
  }

  if (!audit || audit.isAllowed) {
    spinner.succeed("No malicious packages detected.");
  } else {
    printMaliciousChanges(audit.disallowedChanges, spinner);
    await acceptRiskOrExit(
      "Do you want to continue with the installation despite the risks?",
      false
    );
  }
}

function printMaliciousChanges(changes, spinner) {
  spinner.fail(chalk.bold("Malicious changes detected:"));

  for (const change of changes) {
    ui.writeInformation(` - ${change.name}@${change.version}`);
  }
}

async function acceptRiskOrExit(message, defaultValue) {
  ui.emptyLine();
  const continueInstall = await ui.confirm({
    message: message,
    default: defaultValue,
  });

  if (continueInstall) {
    ui.writeInformation("Continuing with the installation...");
    return;
  }

  ui.writeInformation("Exiting without installing packages.");
  ui.emptyLine();
  process.exit(1);
}
