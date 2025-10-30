import { ui } from "../../environment/userInteraction.js";
import { safeSpawn } from "../../utils/safeSpawn.js";
import { mergeSafeChainProxyEnvironmentVariables } from "../../registryProxy/registryProxy.js";
import { getCaCertPath } from "../../registryProxy/certUtils.js";
import { knownPipRegistries } from "../../registryProxy/parsePackageFromUrl.js";
import yargsParser from "yargs-parser";

function extractHostsFromPipArgs(args) {
  function hostFromString(input) {
    if (typeof input !== "string" || input.length === 0) return undefined;
    try {
      const u = new URL(input);
      return u.hostname || undefined;
    } catch {
      // ignore: not a valid absolute URL
    }
    // Try adding a scheme if it's a schemeless URL-like value
    try {
      const u2 = new URL(`https://${input}`);
      return u2.hostname || undefined;
    } catch {
      // ignore: not a valid schemeless URL either
    }
    return undefined;
  }

  const parsed = yargsParser(args, {
    configuration: {
      "short-option-groups": true,
      "camel-case-expansion": false,
      "dot-notation": false,
      "duplicate-arguments-array": true,
      "flatten-duplicate-arrays": false,
      "greedy-arrays": false,
      "unknown-options-as-args": true,
    },
  });
  const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const candidateUrls = [
    ...toArray(parsed.i),
    ...toArray(parsed["index-url"]),
    ...toArray(parsed["extra-index-url"]),
    ...toArray(parsed["find-links"]),
    ...toArray(parsed._).filter(
      (a) => typeof a === "string" && (a.startsWith("https://") || a.startsWith("http://"))
    ),
  ];
  const hosts = new Set();
  for (const u of candidateUrls) {
    const h = hostFromString(u);
    if (h) hosts.add(h);
  }
  return Array.from(hosts);
}


export async function runPip(command, args) {
  try {
    const env = mergeSafeChainProxyEnvironmentVariables(process.env);
    // Re-introduce conditional --cert injection: only for known registries (MITM).
    // No global env overrides for Python trust.
    const hosts = extractHostsFromPipArgs(args);
    const allKnown = hosts.length === 0
      ? true // No explicit sources => default PyPI (known) -> MITM
      : hosts.every((h) => knownPipRegistries.includes(h));

    // Respect user-provided --cert: detect both "--cert <path>" and "--cert=<path>"
    const hasUserCert = args.some(
      (a) => a === "--cert" || (typeof a === "string" && a.startsWith("--cert="))
    );

    let finalArgs = [...args];
    if (allKnown && !hasUserCert) {
      finalArgs = [...args, "--cert", getCaCertPath()];
    }

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
