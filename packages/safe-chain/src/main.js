#!/usr/bin/env node

import { scanCommand, shouldScanCommand } from "./scanning/index.js";
import { ui } from "./environment/userInteraction.js";
import { getPackageManager } from "./packagemanager/currentPackageManager.js";
import { initializeCliArguments } from "./config/cliArguments.js";

export async function main(args) {
  try {
    // This parses all the --safe-chain arguments and removes them from the args array
    args = initializeCliArguments(args);

    if (shouldScanCommand(args)) {
      await scanCommand(args);
    }
  } catch (error) {
    ui.writeError("Failed to check for malicious packages:", error.message);
  }

  var result = getPackageManager().runCommand(args);
  process.exit(result.status);
}
