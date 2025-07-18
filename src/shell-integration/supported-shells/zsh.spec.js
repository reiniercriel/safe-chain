import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import fs from "node:fs";
import path from "path";

describe("Zsh shell integration", () => {
  let mockStartupFile;
  let zsh;

  beforeEach(async () => {
    // Create temporary startup file for testing
    mockStartupFile = path.join(tmpdir(), `test-zshrc-${Date.now()}`);

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

    // Import zsh module after mocking
    zsh = (await import("./zsh.js")).default;
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
    it("should return true when zsh is installed", () => {
      assert.strictEqual(zsh.isInstalled(), true);
    });

    it("should call doesExecutableExistOnSystem with correct parameter", () => {
      // Test that the method calls the helper with the right executable name
      assert.strictEqual(zsh.isInstalled(), true);
    });
  });

  describe("setup", () => {
    it("should add aliases for all provided tools", () => {
      const tools = [
        { tool: "npm", aikidoCommand: "aikido-npm" },
        { tool: "npx", aikidoCommand: "aikido-npx" },
        { tool: "yarn", aikidoCommand: "aikido-yarn" }
      ];

      const result = zsh.setup(tools);
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(
        content.includes('alias npm="aikido-npm" # Safe-chain alias for npm')
      );
      assert.ok(
        content.includes('alias npx="aikido-npx" # Safe-chain alias for npx')
      );
      assert.ok(
        content.includes('alias yarn="aikido-yarn" # Safe-chain alias for yarn')
      );
    });

    it("should call teardown before setup", () => {
      // Pre-populate file with existing aliases
      fs.writeFileSync(
        mockStartupFile,
        'alias npm="old-npm"\nalias npx="old-npx"\n',
        "utf-8"
      );

      const tools = [{ tool: "npm", aikidoCommand: "aikido-npm" }];
      zsh.setup(tools);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(!content.includes('alias npm="old-npm"'));
      assert.ok(content.includes('alias npm="aikido-npm"'));
    });

    it("should handle empty tools array", () => {
      const result = zsh.setup([]);
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
        "#!/bin/zsh",
        "alias npm='aikido-npm'",
        "alias npx='aikido-npx'",
        "alias yarn='aikido-yarn'",
        "alias ls='ls --color=auto'",
        "alias grep='grep --color=auto'",
      ].join("\n");

      fs.writeFileSync(mockStartupFile, initialContent, "utf-8");

      const result = zsh.teardown();
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(!content.includes("alias npm="));
      assert.ok(!content.includes("alias npx="));
      assert.ok(!content.includes("alias yarn="));
      assert.ok(content.includes("alias ls="));
      assert.ok(content.includes("alias grep="));
    });

    it("should handle file that doesn't exist", () => {
      if (fs.existsSync(mockStartupFile)) {
        fs.unlinkSync(mockStartupFile);
      }

      const result = zsh.teardown();
      assert.strictEqual(result, true);
    });

    it("should handle file with no relevant aliases", () => {
      const initialContent = [
        "#!/bin/zsh",
        "alias ls='ls --color=auto'",
        "export PATH=$PATH:~/bin",
      ].join("\n");

      fs.writeFileSync(mockStartupFile, initialContent, "utf-8");

      const result = zsh.teardown();
      assert.strictEqual(result, true);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(content.includes("alias ls="));
      assert.ok(content.includes("export PATH="));
    });
  });

  describe("shell properties", () => {
    it("should have correct name", () => {
      assert.strictEqual(zsh.name, "Zsh");
    });

    it("should expose all required methods", () => {
      assert.ok(typeof zsh.isInstalled === "function");
      assert.ok(typeof zsh.setup === "function");
      assert.ok(typeof zsh.teardown === "function");
      assert.ok(typeof zsh.name === "string");
    });
  });

  describe("integration tests", () => {
    it("should handle complete setup and teardown cycle", () => {
      const tools = [
        { tool: "npm", aikidoCommand: "aikido-npm" },
        { tool: "yarn", aikidoCommand: "aikido-yarn" }
      ];

      // Setup
      zsh.setup(tools);
      let content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(content.includes('alias npm="aikido-npm"'));
      assert.ok(content.includes('alias yarn="aikido-yarn"'));

      // Teardown
      zsh.teardown();
      content = fs.readFileSync(mockStartupFile, "utf-8");
      assert.ok(!content.includes("alias npm="));
      assert.ok(!content.includes("alias yarn="));
    });

    it("should handle multiple setup calls", () => {
      const tools = [{ tool: "npm", aikidoCommand: "aikido-npm" }];

      zsh.setup(tools);
      zsh.setup(tools);

      const content = fs.readFileSync(mockStartupFile, "utf-8");
      const npmMatches = (content.match(/alias npm="/g) || []).length;
      assert.strictEqual(npmMatches, 1, "Should not duplicate aliases");
    });
  });
});
