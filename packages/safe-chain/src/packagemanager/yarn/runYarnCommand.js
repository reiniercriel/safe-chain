import { execSync } from "child_process";
import { ui } from "../../environment/userInteraction.js";

export function runYarnCommand(args) {
  try {
    const npxCommand = `yarn ${args.join(" ")}`;
    execSync(npxCommand, { stdio: "inherit" });
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
