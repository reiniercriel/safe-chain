import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";

export function createBunPackageManager() {
  return {
    runCommand: (args) => runBunCommand("bun", args),

    // For bun, we use the proxy-only approach to block package downloads,
    // so we don't need to analyze commands.
    isSupportedCommand: () => false,
    getDependencyUpdatesForCommand: () => [],
  };
}

export function createBunxPackageManager() {
  return {
    runCommand: (args) => runBunCommand("bunx", args),

    // For bunx, we use the proxy-only approach to block package downloads,
    // so we don't need to analyze commands.
    isSupportedCommand: () => false,
    getDependencyUpdatesForCommand: () => [],
  };
}

async function runBunCommand(command, args) {
  try {
    const result = await safeSpawn(command, args, {
      stdio: "inherit",
      env: mergeSafeChainProxyEnvironmentVariables(process.env),
    });
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
