import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";
import { getCaCertPath } from "../../registryProxy/certUtils.js";

export async function runPip(command, args) {
  try {
    const env = mergeSafeChainProxyEnvironmentVariables(process.env);

    // Pass --cert with our CA to pip so it trusts our MITM for known registries.
    // pip will append this to its default CA bundle, so it still validates
    // non-registry HTTPS (GitHub, custom mirrors) against system CAs.
    const finalArgs = [...args, "--cert", getCaCertPath()];

    const result = await safeSpawn(command, finalArgs, {
      stdio: "inherit",
      env,
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
