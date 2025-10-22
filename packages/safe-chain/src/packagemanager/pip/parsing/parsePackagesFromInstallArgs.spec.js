import { describe, it } from "node:test";
import assert from "node:assert";
import { parsePackagesFromInstallArgs } from "./parsePackagesFromInstallArgs.js";

describe("parsePackagesFromInstallArgs", () => {
  it("should parse simple package name", () => {
    const result = parsePackagesFromInstallArgs(["install", "requests"]);
    assert.deepEqual(result, [
      { name: "requests", type: "add" },
    ]);
  });

  it("should parse package with version specifier", () => {
    const result = parsePackagesFromInstallArgs(["install", "requests==2.28.0"]);
    assert.deepEqual(result, [
      { name: "requests==2.28.0", type: "add" },
    ]);
  });

  it("should skip flags", () => {
    const result = parsePackagesFromInstallArgs(["install", "--upgrade", "requests"]);
    assert.deepEqual(result, [
      { name: "requests", type: "add" },
    ]);
  });

  it("should parse multiple packages", () => {
    const result = parsePackagesFromInstallArgs(["install", "requests", "flask", "django==4.0"]);
    assert.deepEqual(result, [
      { name: "requests", type: "add" },
      { name: "flask", type: "add" },
      { name: "django==4.0", type: "add" },
    ]);
  });

  it("should return empty array for no packages", () => {
    const result = parsePackagesFromInstallArgs(["install", "--help"]);
    assert.deepEqual(result, []);
  });
});
