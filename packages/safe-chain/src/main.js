#!/usr/bin/env node

import { scanCommand, shouldScanCommand } from "./scanning/index.js";
import { ui } from "./environment/userInteraction.js";
import { getPackageManager } from "./packagemanager/currentPackageManager.js";
import { initializeCliArguments } from "./config/cliArguments.js";
import { createSafeChainProxy } from "./registryProxy/registryProxy.js";
import chalk from "chalk";

export async function main(args) {
  const proxy = createSafeChainProxy();
  await proxy.startServer();

  try {
    // This parses all the --safe-chain arguments and removes them from the args array
    args = initializeCliArguments(args);

    if (shouldScanCommand(args)) {
      await scanCommand(args);
    }
  } catch (error) {
    ui.writeError("Failed to check for malicious packages:", error.message);
    process.exit(1);
  }

  var result = await getPackageManager().runCommand(args);

  await proxy.stopServer();
  const blockedRequests = proxy.getBlockedRequests();
  if (blockedRequests.length > 0) {
    ui.emptyLine();

    ui.writeInformation(
      `Safe-chain: ${chalk.bold(
        `blocked ${blockedRequests.length} malicious package downloads`
      )}:`
    );

    for (const req of blockedRequests) {
      ui.writeInformation(` - ${req.packageName}@${req.version} (${req.url})`);
    }

    ui.emptyLine();
    ui.writeError("Exiting without installing malicious packages.");
    ui.emptyLine();

    process.exit(1);
  }

  process.exit(result.status);
}
