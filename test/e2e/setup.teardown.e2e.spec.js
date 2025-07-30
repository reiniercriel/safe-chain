import { describe, it, before, beforeEach, afterEach } from "node:test";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DockerTestContainer } from "./DockerTestContainer.js";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("E2E: safe-chain setup command", () => {
  const imageName = "safe-chain-e2e-test";
  const containerName = "safe-chain-e2e-test-container";
  let container;

  before(async () => {
    // Build the Docker image for the test environment
    try {
      execSync(`docker build -t ${imageName} -f Dockerfile ../../safe-chain`, {
        cwd: __dirname,
        stdio: "ignore",
      });
    } catch (error) {
      throw new Error(`Failed to setup test environment: ${error.message}`);
    }
  });

  beforeEach(async () => {
    // Run a new Docker container for each test
    container = new DockerTestContainer(imageName, containerName);

    await container.start();
  });

  afterEach(async () => {
    // Stop and clean up the container after each test
    if (container) {
      await container.stop();
      container = null;
    }
  });

  for (let shell of ["bash", "zsh"]) {
    it(`safe-chain setup wraps npm command after installation for ${shell}`, async () => {
      // setting up the container
      const installationShell = await container.openShell(shell);
      await installationShell.runCommand("safe-chain setup");

      const projectShell = await container.openShell(shell);
      await projectShell.runCommand("cd /testapp");
      const result = await projectShell.runCommand("npm i axios");

      assert.ok(
        result.output.includes("Scanning for malicious packages..."),
        "Expected npm command to be wrapped by safe-chain"
      );
    });

    it(`safe-chain teardown unwraps npm command after uninstallation for ${shell}`, async () => {
      // setting up the container
      const installationShell = await container.openShell(shell);
      await installationShell.runCommand("safe-chain setup");
      await installationShell.runCommand("safe-chain teardown");

      const projectShell = await container.openShell(shell);
      await projectShell.runCommand("cd /testapp");
      await projectShell.runCommand("npm i axios");
      const result = await projectShell.runCommand("npm i axios");

      assert.ok(
        !result.output.includes("Scanning for malicious packages..."),
        "Expected npm command to not be wrapped by safe-chain after teardown"
      );
    });
  }
});
