import { describe, it } from "node:test";
import assert from "node:assert";
import { initializeCliArguments, getMalwareAction } from "./cliArguments.js";

describe("initializeCliArguments", () => {
  it("should return all args when no safe-chain args are present", () => {
    const args = ["install", "express", "--save"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "express", "--save"]);
  });

  it("should filter out safe-chain args and return remaining args", () => {
    const args = ["install", "--safe-chain-debug", "express", "--save"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "express", "--save"]);
  });

  it("should handle multiple safe-chain args", () => {
    const args = [
      "--safe-chain-verbose",
      "install",
      "--safe-chain-timeout=5000",
      "express",
    ];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "express"]);
  });

  it("should handle empty args array", () => {
    const args = [];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, []);
  });

  it("should handle args with only safe-chain arguments", () => {
    const args = ["--safe-chain-debug", "--safe-chain-verbose"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, []);
  });

  it("should handle args that start with safe-chain prefix but have additional content", () => {
    const args = ["--safe-chain-malware-action=block", "install", "package"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "package"]);
  });

  it("should handle args that contain safe-chain prefix but don't start with it", () => {
    const args = ["install", "my--safe-chain-package", "--save"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "my--safe-chain-package", "--save"]);
  });

  it("should not set malwareAction when no safe-chain arguments are passed", () => {
    const args = ["install", "express", "--save"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "express", "--save"]);
    assert.strictEqual(getMalwareAction(), undefined);
  });

  it("should parse malware-action=block and set state", () => {
    const args = ["--safe-chain-malware-action=block", "install", "package"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "package"]);
    assert.strictEqual(getMalwareAction(), "block");
  });

  it("should parse malware-action=prompt and set state", () => {
    const args = ["--safe-chain-malware-action=prompt", "install", "package"];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install", "package"]);
    assert.strictEqual(getMalwareAction(), "prompt");
  });

  it("should handle multiple malware-action args, using the last valid one", () => {
    const args = [
      "--safe-chain-malware-action=block",
      "--safe-chain-malware-action=prompt",
      "install",
    ];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install"]);
    assert.strictEqual(getMalwareAction(), "prompt");
  });

  it("should handle malware-action with other safe-chain args", () => {
    const args = [
      "--safe-chain-debug",
      "--safe-chain-malware-action=block",
      "--safe-chain-verbose",
      "install",
    ];
    const result = initializeCliArguments(args);

    assert.deepEqual(result, ["install"]);
    assert.strictEqual(getMalwareAction(), "block");
  });
});
