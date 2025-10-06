import { spawnSync, spawn } from "child_process";

function escapeArg(arg) {
  // Shell metacharacters that need escaping
  // These characters have special meaning in shells and need to be quoted
  const shellMetaChars = /[ "&'|;<>()$`\\!*?[\]{}~#]/;

  // If argument contains shell metacharacters, wrap in double quotes
  // and escape characters that are special even inside double quotes
  if (shellMetaChars.test(arg)) {
    // Inside double quotes, we need to escape: " $ ` \
    return '"' + arg.replace(/(["`$\\])/g, '\\$1') + '"';
  }
  return arg;
}

function buildCommand(command, args) {
  const escapedArgs = args.map(escapeArg);
  return `${command} ${escapedArgs.join(" ")}`;
}

export function safeSpawnSync(command, args, options = {}) {
  const fullCommand = buildCommand(command, args);
  return spawnSync(fullCommand, { ...options, shell: true });
}

export async function safeSpawn(command, args, options = {}) {
  const fullCommand = buildCommand(command, args);
  return new Promise((resolve, reject) => {
    const child = spawn(fullCommand, { ...options, shell: true });

    child.on("close", (code) => {
      resolve({
        status: code,
        stdout: Buffer.from(""),
        stderr: Buffer.from(""),
      });
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}
