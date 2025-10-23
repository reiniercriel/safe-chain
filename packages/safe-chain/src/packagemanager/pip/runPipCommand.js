import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";


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

export async function dryRunPipCommandAndOutput(command, args) {
  try {
    // Note: pip supports --dry-run for the "install" command only; "download" and "wheel" do not.
    // We don't mutate args here — callers should include --dry-run when appropriate.
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
