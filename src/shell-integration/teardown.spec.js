import { describe, it } from "node:test";
import assert from "node:assert";
import { EOL, tmpdir } from "node:os";
import fs from "node:fs";
import { getAliases } from "./helpers.js";
import { removeAliasesFromFile } from "./teardown.js";

describe("teardown", () => {
  function runRemovalTestsForEnvironment(shell, startupExtension, expectedAliases) {
    describe(`${shell} shell removal`, () => {
      it(`should remove aliases from ${shell} file`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, "", ...expectedAliases, ""];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        // Test the removeAliasesFromFile function directly
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = removeAliasesFromFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.removedCount, 3, "Should remove 3 aliases");
        assert.strictEqual(result.notFoundCount, 0, "Should find all aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.ok(!updatedContent.includes(alias), `Alias "${alias}" should be removed`);
        }
      });

      it(`should handle file with no aliases for ${shell}`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, "", "alias other='command'", ""];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = removeAliasesFromFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.removedCount, 0, "Should remove 0 aliases");
        assert.strictEqual(result.notFoundCount, 3, "Should report 3 aliases not found");
        
        const updatedContent = readAndDeleteFile(filePath);
        assert.ok(updatedContent.includes("alias other='command'"), "Other aliases should remain unchanged");
      });

      it(`should remove duplicate aliases from ${shell} file`, () => {
        const lines = [
          `#!/usr/bin/env ${shell}`,
          "",
          ...expectedAliases,
          "alias other='command'",
          ...expectedAliases, // duplicates
          ""
        ];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = removeAliasesFromFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.removedCount, 3, "Should remove 3 aliases (counting duplicates as single removal)");
        assert.strictEqual(result.notFoundCount, 0, "Should find all aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.ok(!updatedContent.includes(alias), `Alias "${alias}" should be completely removed`);
        }
        assert.ok(updatedContent.includes("alias other='command'"), "Other aliases should remain");
      });

      it(`should use real getAliases() for ${shell} file`, () => {
        const filePath = `${tmpdir()}/test${startupExtension}`;
        const aliases = getAliases(filePath);
        
        // Verify we get the expected aliases for this shell type
        assert.strictEqual(aliases.length, 3, "Should get 3 aliases (npm, npx, yarn)");
        for (let i = 0; i < aliases.length; i++) {
          assert.strictEqual(aliases[i], expectedAliases[i], `Alias ${i} should match expected format`);
        }
      });

      it(`should handle partial alias matches for ${shell}`, () => {
        const lines = [
          `#!/usr/bin/env ${shell}`,
          "",
          expectedAliases[0], // Only first alias
          "alias other='command'",
          ""
        ];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = removeAliasesFromFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.removedCount, 1, "Should remove 1 alias");
        assert.strictEqual(result.notFoundCount, 2, "Should report 2 aliases not found");
        
        const updatedContent = readAndDeleteFile(filePath);
        assert.ok(!updatedContent.includes(expectedAliases[0]), "First alias should be removed");
        assert.ok(updatedContent.includes("alias other='command'"), "Other aliases should remain");
      });
    });
  }

  // Test for each shell type using real getAliases() output
  runRemovalTestsForEnvironment("bash", ".bashrc", [
    "alias npm='aikido-npm'",
    "alias npx='aikido-npx'",
    "alias yarn='aikido-yarn'"
  ]);

  runRemovalTestsForEnvironment("zsh", ".zshrc", [
    "alias npm='aikido-npm'",
    "alias npx='aikido-npx'",
    "alias yarn='aikido-yarn'"
  ]);

  runRemovalTestsForEnvironment("fish", ".fish", [
    'alias npm "aikido-npm"',
    'alias npx "aikido-npx"',
    'alias yarn "aikido-yarn"'
  ]);

  runRemovalTestsForEnvironment("pwsh", ".ps1", [
    "Set-Alias npm aikido-npm",
    "Set-Alias npx aikido-npx",
    "Set-Alias yarn aikido-yarn"
  ]);

  describe("removeAliasesFromFile edge cases", () => {
    it("should handle empty file", () => {
      const aliases = ["alias npm='aikido-npm'"];
      const fileContent = "";
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      fs.writeFileSync(filePath, fileContent, "utf-8");
      
      const result = removeAliasesFromFile(aliases, fileContent, filePath);
      
      assert.strictEqual(result.removedCount, 0, "Should remove 0 aliases from empty file");
      assert.strictEqual(result.notFoundCount, 1, "Should report 1 alias not found");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });

    it("should handle file with only whitespace", () => {
      const aliases = ["alias npm='aikido-npm'"];
      const fileContent = `${EOL}${EOL}   ${EOL}`;
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      fs.writeFileSync(filePath, fileContent, "utf-8");
      
      const result = removeAliasesFromFile(aliases, fileContent, filePath);
      
      assert.strictEqual(result.removedCount, 0, "Should remove 0 aliases from whitespace-only file");
      assert.strictEqual(result.notFoundCount, 1, "Should report 1 alias not found");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });
  });
});

function createShellStartupScript(lines, fileExtension) {
  const randomFileName = Math.random().toString(36).substring(2, 15);
  const filePath = `${tmpdir()}/${randomFileName}${fileExtension}`;
  fs.writeFileSync(filePath, lines.join(EOL), "utf-8");
  return filePath;
}

function readAndDeleteFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  fs.rmSync(filePath, { force: true });
  return fileContent.split(EOL);
}