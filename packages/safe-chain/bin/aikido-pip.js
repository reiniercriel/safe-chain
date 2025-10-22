#!/usr/bin/env node

import { main } from "../src/main.js";
import { initializePackageManager } from "../src/packagemanager/currentPackageManager.js";

// Defaults
let packageManagerName = "pip";
let targetVersionMajor;

// Copy argv so we can mutate while parsing
const argv = process.argv.slice(2);

console.log("** aikido-pip ** Original arguments:", process.argv.slice(2));

for (let i = 0; i < argv.length; i++) {
	const a = argv[i];

  // --target-version-major
	if (a === "--target-version-major" && i + 1 < argv.length) {
    console.log("Setting targetVersionMajor from CLI arg:", argv[i + 1]);
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

console.log("** aikido-pip ** Final arguments (after processing):", argv);

initializePackageManager(packageManagerName);
var exitCode = await main(argv);

process.exit(exitCode);
