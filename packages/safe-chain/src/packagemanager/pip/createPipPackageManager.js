import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";

export function createPipPackageManager() {
  return {
    runCommand: (args) => runPipCommand("pip3", args),

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
