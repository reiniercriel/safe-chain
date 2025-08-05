import { execSync } from "node:child_process";
import * as pty from "node-pty";
import { parseShellOutput } from "./parseShellOutput.js";

export class DockerTestContainer {
  constructor(imageName, containerName) {
    this.imageName = imageName;
    this.containerName = containerName;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      throw new Error("Container is already running");
    }

    try {
      // Start a long-running container that we can exec commands into
      execSync(
        `docker run -d --name ${this.containerName} ${this.imageName} sleep infinity`,
        { stdio: "ignore" }
      );
      this.isRunning = true;
    } catch (error) {
      throw new Error(`Failed to start container: ${error.message}`);
    }
  }

  async openShell(shell) {
    let ptyProcess = pty.spawn(
      "docker",
      ["exec", "-it", this.containerName, shell],
      {
        name: "xterm-color",
        cols: 80,
        rows: 30,
      }
    );

    await new Promise((resolve, reject) => {
      ptyProcess.on("data", (data) => {
        if (data.includes("\u001b[?2004h")) {
          // This indicates that the shell is ready
          resolve();
        }
      });

      ptyProcess.on("error", (err) => {
        reject(err);
      });
    });

    function runCommand(command) {
      if (!ptyProcess) {
        throw new Error("Shell is not running");
      }

      return new Promise((resolve) => {
        let allData = [];

        ptyProcess.on("data", handleInput);

        const timeout = setTimeout(() => {
          // Fallback in case the command doesn't finish in a reasonable time
          resolve({ allData, output: parseShellOutput(allData), command });
          ptyProcess.removeListener("data", handleInput);
        }, 10000);

        function handleInput(data) {
          allData.push(data);

          if (data.includes("\u001b[?2004h")) {
            // This indicates that the command has finished executing
            resolve({ allData, output: parseShellOutput(allData), command });
            ptyProcess.removeListener("data", handleInput);
            clearTimeout(timeout);
          }
        }

        ptyProcess.write(`${command}\n`);
      });
    }

    return { runCommand };
  }

  async stop() {
    if (!this.isRunning) {
      return; // Already stopped
    }

    try {
      // Force stop and remove the container
      execSync(`docker kill ${this.containerName}`, {
        stdio: "ignore",
        timeout: 10000,
      });
    } catch {
      // Container might already be stopped
    }

    try {
      execSync(`docker rm -f ${this.containerName}`, {
        stdio: "ignore",
        timeout: 5000,
      });
    } catch {
      // Container might already be removed
    }

    this.isRunning = false;
  }
}
