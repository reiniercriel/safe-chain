import { execSync } from "child_process";
import { ui } from "../../environment/userInteraction.js";

export function runNpm(args) {
  try {
    const npmCommand = `npm ${args.join(" ")}`;
    execSync(npmCommand, { stdio: "inherit" });
  } catch (error) {
    if (error.status) {
      return { status: error.status };
    } else {
      ui.writeError("Error executing command:", error.message);
      return { status: 1 };
    }
  }
  return { status: 0 };
}

export function dryRunNpmCommandAndOutput(args) {
  try {
    const npmCommand = `npm ${args.join(" ")} --ignore-scripts --dry-run`;
    const output = execSync(npmCommand, { stdio: "pipe" });
    return { status: 0, output: output.toString() };
  } catch (error) {
    if (error.status) {
      const output = error.stdout ? error.stdout.toString() : "";
      return { status: error.status, output };
    } else {
      ui.writeError("Error executing command:", error.message);
      return { status: 1 };
    }
  }
}
