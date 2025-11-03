import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { getScanTimeout } from "./configFile.js";
import fs from "fs";
import path from "path";
import os from "os";

describe("getScanTimeout", () => {
  let originalEnv;
  let aikidoDir;
  let configPath;
  let configBackupPath;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.AIKIDO_SCAN_TIMEOUT_MS;

    // Use the actual .aikido directory
    aikidoDir = path.join(os.homedir(), ".aikido");
    configPath = path.join(aikidoDir, "config.json");
    configBackupPath = path.join(aikidoDir, "config.json.backup");

    // Backup existing config if it exists
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, configBackupPath);
    }
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.AIKIDO_SCAN_TIMEOUT_MS = originalEnv;
    } else {
      delete process.env.AIKIDO_SCAN_TIMEOUT_MS;
    }

    // Restore original config file
    if (fs.existsSync(configBackupPath)) {
      fs.copyFileSync(configBackupPath, configPath);
      fs.unlinkSync(configBackupPath);
    } else if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  it("should return default timeout of 10000ms when no config or env var is set", () => {
    delete process.env.AIKIDO_SCAN_TIMEOUT_MS;
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 10000);
  });

  it("should return timeout from config file when set", () => {
    delete process.env.AIKIDO_SCAN_TIMEOUT_MS;
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: 5000 }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 5000);
  });

  it("should prioritize environment variable over config file", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "20000";
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: 5000 }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 20000);
  });

  it("should handle invalid environment variable and fall back to config", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "invalid";
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: 7000 }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 7000);
  });

  it("should ignore zero and negative values and fall back to default", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "0";

    let timeout = getScanTimeout();
    assert.strictEqual(timeout, 10000);

    process.env.AIKIDO_SCAN_TIMEOUT_MS = "-5000";

    timeout = getScanTimeout();
    assert.strictEqual(timeout, 10000);
  });

  it("should ignore textual non-numeric values in environment variable and fall back to config", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "fast";
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: 8000 }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 8000);
  });

  it("should ignore textual non-numeric values in config file and fall back to default", () => {
    delete process.env.AIKIDO_SCAN_TIMEOUT_MS;
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: "slow" }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 10000);
  });

  it("should ignore textual non-numeric values in both env and config, fall back to default", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "quick";
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: "medium" }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 10000);
  });

  it("should ignore mixed alphanumeric strings in environment variable", () => {
    process.env.AIKIDO_SCAN_TIMEOUT_MS = "5000ms";
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: 6000 }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 6000);
  });

  it("should ignore mixed alphanumeric strings in config file", () => {
    delete process.env.AIKIDO_SCAN_TIMEOUT_MS;
    fs.writeFileSync(configPath, JSON.stringify({ scanTimeout: "3000ms" }));

    const timeout = getScanTimeout();

    assert.strictEqual(timeout, 10000);
  });
});
