import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";
import { getCaCertPath } from "../../registryProxy/certUtils.js";

export async function runPip(command, args) {
  try {
    const env = mergeSafeChainProxyEnvironmentVariables(process.env);

    // If the user already provided --cert, respect their choice and do not override.
    // Support both "--cert <path>" and "--cert=<path>" forms.
    const hasUserCert = args.some((a, i) => {
      if (a === "--cert") return true;
      return typeof a === "string" && a.startsWith("--cert=");
    });

    // By default, pass --cert with our CA so pip trusts our MITM for known registries.
    // Note: pip treats --cert as the CA bundle to use for TLS (it does not merge with system CAs).
    const finalArgs = hasUserCert ? [...args] : [...args, "--cert", getCaCertPath()];

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
