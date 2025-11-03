import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";
import { getCombinedCaBundlePath } from "../../registryProxy/certBundle.js";

/**
 * @param {string} command
 * @param {string[]} args
 */
export async function runPip(command, args) {
  try {
    const env = mergeSafeChainProxyEnvironmentVariables(/** @type {Record<string, string>} */ (process.env));

    // Always provide Python with a complete CA bundle (Safe Chain CA + Mozilla + Node built-in roots)
    // so that any network request made by pip, including those outside explicit CLI args,
    // validates correctly under both MITM'd and tunneled HTTPS.
    const combinedCaPath = getCombinedCaBundlePath();
    env.REQUESTS_CA_BUNDLE = combinedCaPath;
    env.SSL_CERT_FILE = combinedCaPath;

    const result = await safeSpawn(command, args, {
      stdio: "inherit",
      env,
    });
    return { status: result.status };
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      return { status: /** @type {any} */ (error).status };
    } else {
      const message = error && typeof error === "object" && "message" in error ? /** @type {any} */ (error).message : String(error);
      ui.writeError("Error executing command:", message);
      return { status: 1 };
    }
  }
}
