#!/usr/bin/env node

import { scanCommand, shouldScanCommand } from "./scanning/index.js";
import { ui } from "./environment/userInteraction.js";
import { getPackageManager } from "./packagemanager/currentPackageManager.js";

export async function main(args) {
  try {
    if (shouldScanCommand(args)) {
      await scanCommand(args);
    }
  } catch (error) {
    ui.writeError("Failed to check for malicious packages:", error.message);
  }

  var result = getPackageManager().runCommand(args);
  process.exit(result.status);
}
