import { execSync } from "child_process";
import { ui } from "../../environment/userInteraction.js";

export function runPnpmCommand(args, toolName = "pnpm") {
  try {
    if (toolName === "pnpm") {
      execSync(`pnpm ${args.join(" ")}`, { stdio: "inherit" });
    } else if (toolName === "pnpx") {
      execSync(`pnpx ${args.join(" ")}`, { stdio: "inherit" });
    } else {
      throw new Error(`Unsupported tool name for aikido-pnpm: ${toolName}`);
    }
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
