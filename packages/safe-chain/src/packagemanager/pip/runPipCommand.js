import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";

/**
 * Runs a pip command with the specified arguments
 * 
 * @param {string} command - The pip command to use (e.g., "pip", "pip3")
 * @param {string[]} args - Command arguments
 * @returns {Promise<{status: number}>} Result object with status code
 */
export async function runPip(command, args) {
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

/**
 * Runs a pip command in dry-run mode and captures output
 * Note: pip doesn't have a native --dry-run flag, so this may need adjustment
 * 
 * @param {string} command - The pip command to use
 * @param {string[]} args - Command arguments
 * @returns {Promise<{status: number, output: string}>} Result with status and output
 */
export async function dryRunPipCommandAndOutput(command, args) {
  try {
    // Note: pip doesn't have a --dry-run flag like npm
    // This would need to be implemented differently if dry-run functionality is needed
    const result = await safeSpawn(
      command,
      args,
      {
        stdio: "pipe",
        env: mergeSafeChainProxyEnvironmentVariables(process.env),
      }
    );
    return {
      status: result.status,
      output: result.status === 0 ? result.stdout : result.stderr,
    };
  } catch (error) {
    if (error.status) {
      const output =
        error.stdout?.toString() ??
        error.stderr?.toString() ??
        error.message ??
        "";
      return { status: error.status, output };
    } else {
      ui.writeError("Error executing command:", error.message);
      return { status: 1 };
    }
  }
}
