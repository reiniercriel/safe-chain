#!/usr/bin/env node

import { main } from "../src/main.js";
import { initializePackageManager } from "../src/packagemanager/currentPackageManager.js";
import { setEcoSystem } from "../src/config/settings.js";

// Defaults
let packageManagerName = "pip";
let targetVersionMajor;

// Copy argv so we can modify it
const argv = process.argv.slice(2);

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];

  // --target-version-major tells us which pip version is being used (2 or 3)
  if (a === "--target-version-major" && i + 1 < argv.length) {
    targetVersionMajor = argv[i + 1];
    argv.splice(i, 2);
    i -= 1;
    continue;
  }
}

// If the user explicitly called python3, prefer pip3
if (targetVersionMajor && String(targetVersionMajor).trim() === "3") {
  packageManagerName = "pip3";
}

// Set eco system
setEcoSystem("py");

initializePackageManager(packageManagerName);
const exitCode = await main(argv);

process.exit(exitCode);
