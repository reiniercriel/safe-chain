import { execSync } from "child_process";
import * as os from "os";
import fs from "fs";

export const knownAikidoTools = [
  { tool: "npm", aikidoCommand: "aikido-npm" },
  { tool: "npx", aikidoCommand: "aikido-npx" },
  { tool: "yarn", aikidoCommand: "aikido-yarn" },
  // When adding a new tool here, also update the expected alias in the tests (shellIntegration.spec.js)
  // and add the documentation for the new tool in the README.md
];

export function doesExecutableExistOnSystem(executableName) {
  try {
    if (os.platform() === "win32") {
      execSync(`where ${executableName}`, { stdio: "ignore" });
    } else {
      execSync(`which ${executableName}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

export function execAndGetOutput(command, shell) {
  try {
    return execSync(command, { encoding: "utf8", shell }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}. Error: ${error.message}`);
  }
}

export function removeLinesMatchingPattern(filePath, pattern) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split(os.EOL);
  const updatedLines = lines.filter((line) => !pattern.test(line));
  fs.writeFileSync(filePath, updatedLines.join(os.EOL), "utf-8");
}

export function addLineToFile(filePath, line) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf-8");
  }
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const updatedContent = fileContent + os.EOL + line;
  fs.writeFileSync(filePath, updatedContent, "utf-8");
}
