import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";

/**
 * Creates a package manager interface for Python's pip package installer
 * 
 * @param {string} [command="pip"] - The pip command to use (e.g., "pip", "pip3") defaults to "pip"
 */
export function createPipPackageManager(command = "pip") {
  return {
    runCommand: (args) => runPipCommand(command, args),

    // For pip, set proxy server
    isSupportedCommand: () => false,
    getDependencyUpdatesForCommand: () => [],
  };
}

async function runPipCommand(command, args) {
  try {
    console.log("**createPipPackageManager.js** Running pip command");
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
