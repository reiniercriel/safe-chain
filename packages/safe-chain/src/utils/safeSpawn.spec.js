import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";

describe("safeSpawn", () => {
  let safeSpawn;
  let spawnCalls = [];

  beforeEach(async () => {
    spawnCalls = [];

    // Mock child_process module to capture what command string gets built
    mock.module("child_process", {
      namedExports: {
        spawn: (command, options) => {
          spawnCalls.push({ command, options });
          return {
            on: (event, callback) => {
              if (event === 'close') {
                // Simulate immediate success
                setTimeout(() => callback(0), 0);
              }
            }
          };
        },
      },
    });

    // Import after mocking
    const safeSpawnModule = await import("./safeSpawn.js");
    safeSpawn = safeSpawnModule.safeSpawn;
  });

  afterEach(() => {
    mock.reset();
  });

  it("should pass basic command and arguments correctly", async () => {
    await safeSpawn("echo", ["hello"]);

    assert.strictEqual(spawnCalls.length, 1);
    assert.strictEqual(spawnCalls[0].command, "echo hello");
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });

  it("should escape arguments containing spaces", async () => {
    await safeSpawn("echo", ["hello world"]);

    assert.strictEqual(spawnCalls.length, 1);
    // Argument should be escaped to prevent shell interpretation
    assert.strictEqual(spawnCalls[0].command, 'echo "hello world"');
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });

  it("should prevent shell injection attacks", async () => {
    await safeSpawn("ls", ["; rm test123.txt"]);

    assert.strictEqual(spawnCalls.length, 1);
    // Malicious command should be escaped to prevent execution
    assert.strictEqual(spawnCalls[0].command, 'ls "; rm test123.txt"');
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });

  it("should escape single quotes in arguments", async () => {
    await safeSpawn("echo", ["don't break"]);

    assert.strictEqual(spawnCalls.length, 1);
    // Single quote should be properly escaped with double quotes
    assert.strictEqual(spawnCalls[0].command, 'echo "don\'t break"');
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });

  it("should handle double quotes with simpler escaping", async () => {
    await safeSpawn("echo", ['say "hello"']);

    assert.strictEqual(spawnCalls.length, 1);
    // If we switch to double quotes, this should be: "say \"hello\""
    assert.strictEqual(spawnCalls[0].command, 'echo "say \\"hello\\""');
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });

  it("should not escape arguments with only safe characters", async () => {
    await safeSpawn("npm", ["install", "axios", "--save"]);

    assert.strictEqual(spawnCalls.length, 1);
    // Safe arguments (alphanumeric, dash, underscore, dot, slash) shouldn't be quoted
    assert.strictEqual(spawnCalls[0].command, "npm install axios --save");
    assert.strictEqual(spawnCalls[0].options.shell, true);
  });
});
