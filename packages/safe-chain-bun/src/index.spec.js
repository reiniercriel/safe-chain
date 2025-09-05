import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

describe("Bun Scanner", async () => {
  const mockAuditChanges = mock.fn();

  // Mock the scanning module
  mock.module("@aikidosec/safe-chain/scanning", {
    namedExports: {
      auditChanges: mockAuditChanges,
    },
  });

  const { scanner } = await import("./index.js");

  it("should export scanner object with version", () => {
    assert.strictEqual(scanner.version, "1");
    assert.strictEqual(typeof scanner.scan, "function");
  });

  it("should return empty advisories for clean packages", async () => {
    mockAuditChanges.mock.mockImplementation(() => ({
      allowedChanges: [{ name: "express", version: "4.18.2", type: "add" }],
      disallowedChanges: [],
      isAllowed: true,
    }));

    const packages = [{ name: "express", version: "4.18.2" }];
    const result = await scanner.scan({ packages });

    assert.deepEqual(result, []);
    assert.strictEqual(mockAuditChanges.mock.callCount(), 1);
    assert.deepEqual(mockAuditChanges.mock.calls[0].arguments[0], [
      { name: "express", version: "4.18.2", type: "add" },
    ]);
  });

  it("should return fatal advisory for malware packages", async () => {
    mockAuditChanges.mock.mockImplementation(() => ({
      allowedChanges: [],
      disallowedChanges: [
        {
          name: "malicious-pkg",
          version: "1.0.0",
          type: "add",
          reason: "MALWARE",
        },
      ],
      isAllowed: false,
    }));

    const packages = [{ name: "malicious-pkg", version: "1.0.0" }];
    const result = await scanner.scan({ packages });

    assert.strictEqual(result.length, 1);
    assert.deepEqual(result[0], {
      level: "fatal",
      package: "malicious-pkg",
      url: null,
      description: "Package malicious-pkg@1.0.0 contains known security threats (MALWARE). Installation blocked by Safe-Chain.",
    });
  });

  it("should handle multiple packages with mixed results", async () => {
    mockAuditChanges.mock.mockImplementation(() => ({
      allowedChanges: [{ name: "express", version: "4.18.2", type: "add" }],
      disallowedChanges: [
        {
          name: "malicious-pkg",
          version: "1.0.0",
          type: "add",
          reason: "MALWARE",
        },
        {
          name: "another-bad-pkg",
          version: "2.1.0",
          type: "add",
          reason: "MALWARE",
        },
      ],
      isAllowed: false,
    }));

    const packages = [
      { name: "express", version: "4.18.2" },
      { name: "malicious-pkg", version: "1.0.0" },
      { name: "another-bad-pkg", version: "2.1.0" },
    ];
    const result = await scanner.scan({ packages });

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].package, "malicious-pkg");
    assert.strictEqual(result[0].level, "fatal");
    assert.strictEqual(result[1].package, "another-bad-pkg");
    assert.strictEqual(result[1].level, "fatal");
  });

  it("should handle empty package list", async () => {
    mockAuditChanges.mock.mockImplementation(() => ({
      allowedChanges: [],
      disallowedChanges: [],
      isAllowed: true,
    }));

    const result = await scanner.scan({ packages: [] });

    assert.deepEqual(result, []);
    assert.deepEqual(
      mockAuditChanges.mock.calls[mockAuditChanges.mock.callCount() - 1]
        .arguments[0],
      []
    );
  });

  it("should convert Bun package format to safe-chain format correctly", async () => {
    mockAuditChanges.mock.mockImplementation(() => ({
      allowedChanges: [],
      disallowedChanges: [],
      isAllowed: true,
    }));

    const bunPackages = [
      { name: "lodash", version: "4.17.21" },
      { name: "@types/node", version: "20.0.0" },
    ];

    await scanner.scan({ packages: bunPackages });

    const expectedChanges = [
      { name: "lodash", version: "4.17.21", type: "add" },
      { name: "@types/node", version: "20.0.0", type: "add" },
    ];

    assert.deepEqual(
      mockAuditChanges.mock.calls[mockAuditChanges.mock.callCount() - 1]
        .arguments[0],
      expectedChanges
    );
  });
});
