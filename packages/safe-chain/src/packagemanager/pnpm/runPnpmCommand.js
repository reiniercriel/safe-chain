import { ui } from "../../environment/userInteraction.js";
import { safeSpawnSync } from "../../utils/safeSpawn.js";

export function runPnpmCommand(args, toolName = "pnpm") {
  try {
    let result;
    if (toolName === "pnpm") {
      result = safeSpawnSync("pnpm", args, { stdio: "inherit" });
    } else if (toolName === "pnpx") {
      result = safeSpawnSync("pnpx", args, { stdio: "inherit" });
    } else {
      throw new Error(`Unsupported tool name for aikido-pnpm: ${toolName}`);
    }

    return { status: result.status };
  } catch (error) {
    if (error.status) {
      return { status: error.status };
    } else {
      ui.writeError("Error executing command:", error.message);
      return { status: 1 };
    }
  }
}
