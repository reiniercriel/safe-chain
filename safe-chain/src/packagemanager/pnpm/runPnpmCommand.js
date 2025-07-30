import { spawnSync } from "child_process";
import { ui } from "../../environment/userInteraction.js";

export function runPnpmCommand(args, toolName = "pnpm") {
  try {
    let result;

    if (toolName === "pnpm") {
      result = spawnSync("pnpm", args, { stdio: "inherit" });
    } else if (toolName === "pnpx") {
      result = spawnSync("pnpx", args, { stdio: "inherit" });
    } else {
      throw new Error(`Unsupported tool name for aikido-pnpm: ${toolName}`);
    }

    if (result.status !== null) {
      return { status: result.status };
    }
  } catch (error) {
    ui.writeError("Error executing command:", error.message);
    return { status: 1 };
  }
  return { status: 0 };
}
