import { spawn } from "child_process";

function escapeArg(arg) {
  // If argument contains spaces or quotes, wrap in double quotes and escape double quotes
  if (arg.includes(" ") || arg.includes('"') || arg.includes("'")) {
    return '"' + arg.replaceAll('"', '\\"') + '"';
  }
  return arg;
}

function buildCommand(command, args) {
  const escapedArgs = args.map(escapeArg);
  return `${command} ${escapedArgs.join(" ")}`;
}

export async function safeSpawn(command, args, options = {}) {
  const fullCommand = buildCommand(command, args);
  return new Promise((resolve, reject) => {
    const child = spawn(fullCommand, { ...options, shell: true });

    // When stdio is piped, we need to collect the output
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        status: code,
        stdout: stdout,
        stderr: stderr,
      });
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * To avoid any regression issues on the JS ecosystem,
 * a py-friendly safeSpawn that avoids shell interpolation
 * issues (e.g., '<', '>' in version specs).
 * 
 * TL;DR: add support for shell::false
 */
export async function safeSpawnPy(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ status: code, stdout, stderr });
    });

    child.on("error", (error) => {
      resolve({ status: 1, stdout: "", stderr: error.message || String(error) });
    });
  });
}
