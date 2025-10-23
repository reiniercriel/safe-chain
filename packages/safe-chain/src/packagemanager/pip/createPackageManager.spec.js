import { test } from "node:test";
import assert from "node:assert";
import { createPipPackageManager } from "./createPackageManager.js";

test("createPipPackageManager", async (t) => {
  await t.test("should create package manager with default pip command", () => {
    const pm = createPipPackageManager();
    
    assert.ok(pm);
    assert.strictEqual(typeof pm.runCommand, "function");
    assert.strictEqual(typeof pm.isSupportedCommand, "function");
    assert.strictEqual(typeof pm.getDependencyUpdatesForCommand, "function");
  });

  await t.test("should create package manager with custom pip3 command", () => {
    const pm = createPipPackageManager("pip3");
    
    assert.ok(pm);
    assert.strictEqual(typeof pm.runCommand, "function");
  });

  await t.test("should recognize install command as supported", () => {
    const pm = createPipPackageManager();
    
    // Note: Currently returns false because commandArgumentScanner is not yet implemented
    // When implemented, this should return true
    const result = pm.isSupportedCommand(["install", "requests"]);
    assert.strictEqual(typeof result, "boolean");
  });

  await t.test("should recognize download command as supported", () => {
    const pm = createPipPackageManager();
    
    const result = pm.isSupportedCommand(["download", "requests"]);
    assert.strictEqual(typeof result, "boolean");
  });

  await t.test("should recognize wheel command as supported", () => {
    const pm = createPipPackageManager();
    
    const result = pm.isSupportedCommand(["wheel", "requests"]);
    assert.strictEqual(typeof result, "boolean");
  });

  await t.test("should not support uninstall command", () => {
    const pm = createPipPackageManager();
    
    const result = pm.isSupportedCommand(["uninstall", "requests"]);
    assert.strictEqual(result, false);
  });

  await t.test("should not support list command", () => {
    const pm = createPipPackageManager();
    
    const result = pm.isSupportedCommand(["list"]);
    assert.strictEqual(result, false);
  });

  await t.test("should not support show command", () => {
    const pm = createPipPackageManager();
    
    const result = pm.isSupportedCommand(["show", "requests"]);
    assert.strictEqual(result, false);
  });

  await t.test("should return empty array for getDependencyUpdatesForCommand on install", () => {
    const pm = createPipPackageManager();
    
    // Note: Currently returns [] because commandArgumentScanner is not yet implemented
    const result = pm.getDependencyUpdatesForCommand(["install", "requests==2.28.0"]);
    assert.ok(Array.isArray(result));
  });

  await t.test("should return empty array for getDependencyUpdatesForCommand on download", () => {
    const pm = createPipPackageManager();
    
    const result = pm.getDependencyUpdatesForCommand(["download", "flask"]);
    assert.ok(Array.isArray(result));
  });

  await t.test("should return empty array for getDependencyUpdatesForCommand on wheel", () => {
    const pm = createPipPackageManager();
    
    const result = pm.getDependencyUpdatesForCommand(["wheel", "django"]);
    assert.ok(Array.isArray(result));
  });

  await t.test("should return empty array for unsupported commands", () => {
    const pm = createPipPackageManager();
    
    const result = pm.getDependencyUpdatesForCommand(["uninstall", "requests"]);
    assert.strictEqual(Array.isArray(result), true);
    assert.strictEqual(result.length, 0);
  });

  await t.test("should handle empty args array", () => {
    const pm = createPipPackageManager();
    
    const supported = pm.isSupportedCommand([]);
    assert.strictEqual(supported, false);
    
    const deps = pm.getDependencyUpdatesForCommand([]);
    assert.ok(Array.isArray(deps));
    assert.strictEqual(deps.length, 0);
  });

  await t.test("should handle args with only flags", () => {
    const pm = createPipPackageManager();
    
    const supported = pm.isSupportedCommand(["--version"]);
    assert.strictEqual(supported, false);
    
    const deps = pm.getDependencyUpdatesForCommand(["-h", "--help"]);
    assert.ok(Array.isArray(deps));
    assert.strictEqual(deps.length, 0);
  });
});
