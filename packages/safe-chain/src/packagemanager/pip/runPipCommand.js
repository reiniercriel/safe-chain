import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";
import { getCombinedCaBundlePath } from "./utils/pipCaBundle.js";
// Always provide Python with a complete CA bundle (Safe Chain CA + Mozilla + Node built-in roots)
// so that any network request made by pip, including those outside explicit CLI args,
// validates correctly under both MITM'd and tunneled HTTPS.

export async function runPip(command, args) {
  try {
    const env = mergeSafeChainProxyEnvironmentVariables(process.env);

  // Always set Python CA env vars to a combined bundle that includes Safe Chain CA,
  // Mozilla roots (certifi), and Node built-in root CAs.
    const combinedCaPath = getCombinedCaBundlePath();
    env.REQUESTS_CA_BUNDLE = combinedCaPath;
    env.SSL_CERT_FILE = combinedCaPath;

    const result = await safeSpawn(command, args, {
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
