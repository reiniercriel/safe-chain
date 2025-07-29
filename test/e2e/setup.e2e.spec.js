import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

describe("E2E: safe-chain setup command", () => {
  const imageName = "safe-chain-e2e-test";
  const containerName = "safe-chain-e2e-test-container";

  before(async () => {
    console.log("Building Docker image for e2e tests...");
    try {
      execSync(`docker build -t ${imageName} -f test/e2e/Dockerfile .`, {
        cwd: projectRoot,
        stdio: "inherit",
      });
      console.log("Docker image built successfully");
    } catch (error) {
      throw new Error(`Failed to build Docker image: ${error.message}`);
    }
  });

  after(async () => {
    // Clean up: remove container and image
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: "ignore" });
    } catch {
      // Container might not exist, ignore
    }
    
    try {
      execSync(`docker rmi ${imageName}`, { stdio: "ignore" });
    } catch {
      // Image might be in use, ignore
    }
  });

  it("should successfully run safe-chain setup and create aliases", async () => {
    // Run the container and capture output
    const result = await runDockerTest([
      "node", "bin/safe-chain.js", "setup"
    ]);

    // Verify setup completed successfully
    assert.ok(
      result.stdout.includes("Setup successful"),
      "Setup should report success"
    );
    
    assert.strictEqual(
      result.exitCode, 
      0, 
      `Setup should exit with code 0, got ${result.exitCode}`
    );
  });

  it("should create correct aliases in .bashrc", async () => {
    // Run setup and then check .bashrc contents
    const result = await runDockerTest([
      "bash", "-c", `
        node bin/safe-chain.js setup && 
        echo "=== BASHRC CONTENTS ===" && 
        cat /home/testuser/.bashrc
      `
    ]);

    assert.strictEqual(result.exitCode, 0, "Commands should succeed");

    const bashrcContent = result.stdout;
    
    // Check for all expected aliases
    const expectedAliases = [
      'alias npm="aikido-npm" # Safe-chain alias for npm',
      'alias npx="aikido-npx" # Safe-chain alias for npx', 
      'alias yarn="aikido-yarn" # Safe-chain alias for yarn',
      'alias pnpm="aikido-pnpm" # Safe-chain alias for pnpm',
      'alias pnpx="aikido-pnpx" # Safe-chain alias for pnpx'
    ];

    for (const expectedAlias of expectedAliases) {
      assert.ok(
        bashrcContent.includes(expectedAlias),
        `Should contain alias: ${expectedAlias}`
      );
    }
  });

  it("should be idempotent (not create duplicate aliases)", async () => {
    // Run setup twice and check for duplicates
    const result = await runDockerTest([
      "bash", "-c", `
        node bin/safe-chain.js setup && 
        node bin/safe-chain.js setup && 
        echo "=== ALIAS COUNT ===" &&
        grep -c 'alias npm="aikido-npm"' /home/testuser/.bashrc || echo 0
      `
    ]);

    assert.strictEqual(result.exitCode, 0, "Commands should succeed");
    
    // Extract the count from output
    const lines = result.stdout.split('\n');
    const countLine = lines.find(line => line.match(/^\d+$/));
    const aliasCount = parseInt(countLine || '0');
    
    assert.strictEqual(
      aliasCount, 
      1, 
      `Should have exactly 1 npm alias, found ${aliasCount}`
    );
  });

  it("should work with fresh .bashrc file", async () => {
    // Ensure no .bashrc exists initially
    const result = await runDockerTest([
      "bash", "-c", `
        rm -f /home/testuser/.bashrc &&
        node bin/safe-chain.js setup &&
        test -f /home/testuser/.bashrc && echo "BASHRC_CREATED" ||
        echo "BASHRC_NOT_CREATED"
      `
    ]);

    assert.strictEqual(result.exitCode, 0, "Commands should succeed");
    assert.ok(
      result.stdout.includes("BASHRC_CREATED"),
      ".bashrc should be created if it doesn't exist"
    );
  });

  it("should detect bash shell correctly", async () => {
    const result = await runDockerTest([
      "node", "bin/safe-chain.js", "setup"
    ]);

    assert.strictEqual(result.exitCode, 0, "Setup should succeed");
    assert.ok(
      result.stdout.includes("Detected") && result.stdout.includes("Bash"),
      "Should detect Bash shell"
    );
  });

  /**
   * Helper function to run a command in Docker container and return result
   */
  async function runDockerTest(command) {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        "run", "--rm",
        "--name", containerName,
        imageName,
        ...command
      ];

      const child = spawn("docker", dockerArgs, {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr
        });
      });

      child.on("error", (error) => {
        reject(new Error(`Docker command failed: ${error.message}`));
      });

      // Set timeout to prevent hanging tests
      setTimeout(() => {
        child.kill();
        reject(new Error("Test timed out after 60 seconds"));
      }, 60000);
    });
  }
});