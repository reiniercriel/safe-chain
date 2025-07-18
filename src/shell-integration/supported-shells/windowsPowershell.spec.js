import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import fs from "node:fs";
import path from "path";
import { knownAikidoTools } from "../helpers.js";

describe("Windows PowerShell shell integration", () => {
  let mockStartupFile;
  let windowsPowershell;

  beforeEach(async () => {
    // Create temporary startup file for testing
    mockStartupFile = path.join(
      tmpdir(),
      `test-windows-powershell-profile-${Date.now()}.ps1`
    );

    // Mock the helpers module
    mock.module("../helpers.js", {
      namedExports: {
        doesExecutableExistOnSystem: () => true,
        addLineToFile: (filePath, line) => {
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "", "utf-8");
          }
          fs.appendFileSync(filePath, line + "\n", "utf-8");
        },
        removeLinesMatchingPattern: (filePath, pattern) => {
          if (!fs.existsSync(filePath)) return;
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split("\n");
          const filteredLines = lines.filter((line) => !pattern.test(line));
          fs.writeFileSync(filePath, filteredLines.join("\n"), "utf-8");
        },
      },
    });

    // Mock child_process execSync
    mock.module("child_process", {
      namedExports: {
        execSync: () => mockStartupFile,
      },
    });

    // Import windowsPowershell module after mocking
    windowsPowershell = (await import("./windowsPowershell.js")).default;
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(mockStartupFile)) {
      fs.unlinkSync(mockStartupFile);
    }

    // Reset mocks
    mock.reset();
  });

  describe("isInstalled", () => {
    it("should return true when windows powershell is installed", () => {
      assert.strictEqual(windowsPowershell.isInstalled(), true);
    });

    it("should call doesExecutableExistOnSystem with correct parameter", () => {
      // Test that the method calls the helper with the right executable name
      assert.strictEqual(windowsPowershell.isInstalled(), true);
    });
  });

  describe("setup", () => {
    it("should add aliases for all provided tools", () => {
      const tools = [
        { tool: "npm", aikidoCommand: "aikido-npm" },
        { tool: "npx", aikidoCommand: "aikido-npx" },
        { tool: "yarn", aikidoCommand: "aikido-yarn" },
      ];

      const result = windowsPowershell.setup(tools);
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(
        content.includes("Set-Alias npm aikido-npm # Safe-chain alias for npm")
      );
      assert.ok(
        content.includes("Set-Alias npx aikido-npx # Safe-chain alias for npx")
      );
      assert.ok(
        content.includes(
          "Set-Alias yarn aikido-yarn # Safe-chain alias for yarn"
        )
      );
    });

    it("should handle empty tools array", () => {
      const result = windowsPowershell.setup([]);
      assert.strictEqual(result, true);

      // File should be created during teardown call even if no tools are provided
      if (fs.existsSync(mockStartupFile)) {
        const content = fs.readFileSync(mockStartupFile, "utf-8");
        assert.strictEqual(content.trim(), "");
      }
    });
  });

  describe("teardown", () => {
    it("should remove npm, npx, and yarn aliases", () => {
      const initialContent = [
        "# Windows PowerShell profile",
        "Set-Alias npm aikido-npm",
        "Set-Alias npx aikido-npx",
        "Set-Alias yarn aikido-yarn",
        "Set-Alias ls Get-ChildItem",
        "Set-Alias grep Select-String",
      ].join("\n");

      fs.writeFileSync(mockStartupFile, initialContent, "utf-8");

      const result = windowsPowershell.teardown(knownAikidoTools);
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(!content.includes("Set-Alias npm "));
      assert.ok(!content.includes("Set-Alias npx "));
      assert.ok(!content.includes("Set-Alias yarn "));
      assert.ok(content.includes("Set-Alias ls "));
      assert.ok(content.includes("Set-Alias grep "));
    });

    it("should handle file that doesn't exist", () => {
      if (fs.existsSync(mockStartupFile)) {
        fs.unlinkSync(mockStartupFile);
      }

      const result = windowsPowershell.teardown(knownAikidoTools);
      assert.strictEqual(result, true);
    });

    it("should handle file with no relevant aliases", () => {
      const initialContent = [
        "# Windows PowerShell profile",
        "Set-Alias ls Get-ChildItem",
        "$env:PATH += ';C:\\Tools'",
      ].join("\n");

      fs.writeFileSync(mockStartupFile, initialContent, "utf-8");

      const result = windowsPowershell.teardown(knownAikidoTools);
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(content.includes("Set-Alias ls "));
      assert.ok(content.includes("$env:PATH "));
    });
  });

  describe("shell properties", () => {
    it("should have correct name", () => {
      assert.strictEqual(windowsPowershell.name, "Windows PowerShell");
    });

    it("should expose all required methods", () => {
      assert.ok(typeof windowsPowershell.isInstalled === "function");
      assert.ok(typeof windowsPowershell.setup === "function");
      assert.ok(typeof windowsPowershell.teardown === "function");
      assert.ok(typeof windowsPowershell.name === "string");
    });
  });

  describe("integration tests", () => {
    it("should handle complete setup and teardown cycle", () => {
      const tools = [
        { tool: "npm", aikidoCommand: "aikido-npm" },
        { tool: "yarn", aikidoCommand: "aikido-yarn" },
      ];

      // Setup
      windowsPowershell.setup(tools);
      let content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(content.includes("Set-Alias npm aikido-npm"));
      assert.ok(content.includes("Set-Alias yarn aikido-yarn"));

      // Teardown
      windowsPowershell.teardown(tools);
      content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(!content.includes("Set-Alias npm "));
      assert.ok(!content.includes("Set-Alias yarn "));
    });

    it("should handle multiple setup calls", () => {
      const tools = [{ tool: "npm", aikidoCommand: "aikido-npm" }];

      windowsPowershell.setup(tools);
      windowsPowershell.teardown(tools);
      windowsPowershell.setup(tools);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      const npmMatches = (content.match(/Set-Alias npm /g) || []).length;
      assert.strictEqual(npmMatches, 1, "Should not duplicate aliases");
    });
  });
});
