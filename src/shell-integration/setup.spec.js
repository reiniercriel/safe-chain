import { describe, it } from "node:test";
import assert from "node:assert";
import { EOL, tmpdir } from "node:os";
import fs from "node:fs";
import { getAliases } from "./helpers.js";
import { readOrCreateStartupFile, appendAliasesToFile } from "./setup.js";

describe("setupShell", () => {
  function runSetupTestsForEnvironment(shell, startupExtension, expectedAliases) {
    describe(`${shell} shell setup`, () => {
      it(`should add aliases to ${shell} file`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, "", "alias cls='clear'"];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = appendAliasesToFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.addedCount, 3, "Should add 3 aliases");
        assert.strictEqual(result.existingCount, 0, "Should find no existing aliases");
        assert.strictEqual(result.failedCount, 0, "Should have no failed aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.ok(updatedContent.includes(alias), `Alias "${alias}" should be added`);
        }
        assert.ok(updatedContent.includes("alias cls='clear'"), "Original aliases should remain");
      });

      it(`should not add aliases if they already exist in ${shell} file`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, "", ...expectedAliases];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = appendAliasesToFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.addedCount, 0, "Should add 0 aliases");
        assert.strictEqual(result.existingCount, 3, "Should find 3 existing aliases");
        assert.strictEqual(result.failedCount, 0, "Should have no failed aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        // Count occurrences to ensure no duplicates were added
        for (const alias of expectedAliases) {
          assert.strictEqual(countOccurrences(updatedContent, alias), 1, `Alias "${alias}" should appear exactly once`);
        }
      });

      it(`should create file and add aliases if file does not exist for ${shell}`, () => {
        const randomName = Math.random().toString(36).substring(2, 15);
        const filePath = `${tmpdir()}/nonexistent-${randomName}${startupExtension}`;
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath, { force: true });
        }
        
        // Test readOrCreateStartupFile function
        const fileContent = readOrCreateStartupFile(filePath);
        assert.strictEqual(fileContent, "", "Should return empty string for new file");
        assert.ok(fs.existsSync(filePath), "File should be created");
        
        // Test adding aliases to the newly created file
        const aliases = getAliases(filePath);
        const result = appendAliasesToFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.addedCount, 3, "Should add 3 aliases");
        assert.strictEqual(result.existingCount, 0, "Should find no existing aliases");
        assert.strictEqual(result.failedCount, 0, "Should have no failed aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.ok(updatedContent.includes(alias), `Alias "${alias}" should be added`);
        }
      });

      it(`should add aliases only once when called multiple times for ${shell}`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, ""];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        
        // First call - should add aliases
        let fileContent = fs.readFileSync(filePath, "utf-8");
        const result1 = appendAliasesToFile(aliases, fileContent, filePath);
        assert.strictEqual(result1.addedCount, 3, "First call should add 3 aliases");
        
        // Second call - should detect existing aliases
        fileContent = fs.readFileSync(filePath, "utf-8");
        const result2 = appendAliasesToFile(aliases, fileContent, filePath);
        assert.strictEqual(result2.addedCount, 0, "Second call should add 0 aliases");
        assert.strictEqual(result2.existingCount, 3, "Second call should find 3 existing aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.strictEqual(countOccurrences(updatedContent, alias), 1, `Alias "${alias}" should appear exactly once`);
        }
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

      it(`should handle mixed scenario - some existing, some new for ${shell}`, () => {
        const lines = [`#!/usr/bin/env ${shell}`, "", expectedAliases[0], "alias other='command'"];
        const filePath = createShellStartupScript(lines, startupExtension);
        
        const aliases = getAliases(filePath);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        
        const result = appendAliasesToFile(aliases, fileContent, filePath);
        
        assert.strictEqual(result.addedCount, 2, "Should add 2 new aliases");
        assert.strictEqual(result.existingCount, 1, "Should find 1 existing alias");
        assert.strictEqual(result.failedCount, 0, "Should have no failed aliases");
        
        const updatedContent = readAndDeleteFile(filePath);
        for (const alias of expectedAliases) {
          assert.ok(updatedContent.includes(alias), `Alias "${alias}" should be present`);
        }
        assert.ok(updatedContent.includes("alias other='command'"), "Other aliases should remain");
      });
    });
  }

  // Test for each shell type using real getAliases() output
  runSetupTestsForEnvironment("bash", ".bashrc", [
    "alias npm='aikido-npm'",
    "alias npx='aikido-npx'",
    "alias yarn='aikido-yarn'"
  ]);

  runSetupTestsForEnvironment("zsh", ".zshrc", [
    "alias npm='aikido-npm'",
    "alias npx='aikido-npx'",
    "alias yarn='aikido-yarn'"
  ]);

  runSetupTestsForEnvironment("fish", ".fish", [
    'alias npm "aikido-npm"',
    'alias npx "aikido-npx"',
    'alias yarn "aikido-yarn"'
  ]);

  runSetupTestsForEnvironment("pwsh", ".ps1", [
    "Set-Alias npm aikido-npm",
    "Set-Alias npx aikido-npx",
    "Set-Alias yarn aikido-yarn"
  ]);

  describe("readOrCreateStartupFile", () => {
    it("should read existing file content", () => {
      const lines = ["#!/usr/bin/env bash", "", "alias test='echo test'"];
      const filePath = createShellStartupScript(lines, ".bashrc");
      
      const content = readOrCreateStartupFile(filePath);
      
      assert.ok(content.includes("#!/usr/bin/env bash"), "Should contain shebang");
      assert.ok(content.includes("alias test='echo test'"), "Should contain existing aliases");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });

    it("should create file if it doesn't exist", () => {
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      
      const content = readOrCreateStartupFile(filePath);
      
      assert.strictEqual(content, "", "Should return empty string for new file");
      assert.ok(fs.existsSync(filePath), "File should be created");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });

    it("should handle empty existing file", () => {
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      fs.writeFileSync(filePath, "", "utf-8");
      
      const content = readOrCreateStartupFile(filePath);
      
      assert.strictEqual(content, "", "Should return empty string for empty file");
      assert.ok(fs.existsSync(filePath), "File should still exist");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });
  });

  describe("appendAliasesToFile edge cases", () => {
    it("should handle empty aliases array", () => {
      const lines = ["#!/usr/bin/env bash", "", "alias test='echo test'"];
      const filePath = createShellStartupScript(lines, ".bashrc");
      const fileContent = fs.readFileSync(filePath, "utf-8");
      
      const result = appendAliasesToFile([], fileContent, filePath);
      
      assert.strictEqual(result.addedCount, 0, "Should add 0 aliases");
      assert.strictEqual(result.existingCount, 0, "Should find 0 existing aliases");
      assert.strictEqual(result.failedCount, 0, "Should have 0 failed aliases");
      
      const updatedContent = readAndDeleteFile(filePath);
      assert.ok(updatedContent.includes("alias test='echo test'"), "Original content should remain");
    });

    it("should handle partial substring matches correctly", () => {
      const lines = [
        "#!/usr/bin/env bash",
        "",
        "alias npmx='some-other-command'", // Contains 'npm' but shouldn't match 'alias npm='
        "alias test='echo test'"
      ];
      const filePath = createShellStartupScript(lines, ".bashrc");
      const fileContent = fs.readFileSync(filePath, "utf-8");
      
      const aliases = ["alias npm='aikido-npm'"];
      const result = appendAliasesToFile(aliases, fileContent, filePath);
      
      assert.strictEqual(result.addedCount, 1, "Should add 1 alias (npm)");
      assert.strictEqual(result.existingCount, 0, "Should find 0 existing aliases");
      assert.strictEqual(result.failedCount, 0, "Should have 0 failed aliases");
      
      const updatedContent = readAndDeleteFile(filePath);
      assert.ok(updatedContent.includes("alias npm='aikido-npm'"), "npm alias should be added");
      assert.ok(updatedContent.includes("alias npmx='some-other-command'"), "npmx alias should remain");
    });

    it("should handle file with only whitespace", () => {
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      const fileContent = `${EOL}${EOL}   ${EOL}`;
      fs.writeFileSync(filePath, fileContent, "utf-8");
      
      const aliases = ["alias npm='aikido-npm'"];
      const result = appendAliasesToFile(aliases, fileContent, filePath);
      
      assert.strictEqual(result.addedCount, 1, "Should add 1 alias");
      assert.strictEqual(result.existingCount, 0, "Should find 0 existing aliases");
      assert.strictEqual(result.failedCount, 0, "Should have 0 failed aliases");
      
      const updatedContent = fs.readFileSync(filePath, "utf-8");
      assert.ok(updatedContent.includes("alias npm='aikido-npm'"), "Alias should be added");
      
      // Cleanup
      fs.rmSync(filePath, { force: true });
    });
  });

  describe("appendAliasesToFile error handling", () => {
    it("should handle file permission errors gracefully", () => {
      const filePath = `${tmpdir()}/test-${Math.random().toString(36).substring(2, 15)}.bashrc`;
      fs.writeFileSync(filePath, "#!/usr/bin/env bash", "utf-8");
      
      // Make file read-only to simulate permission error
      fs.chmodSync(filePath, 0o444);
      
      const aliases = ["alias npm='aikido-npm'"];
      const fileContent = fs.readFileSync(filePath, "utf-8");
      
      const result = appendAliasesToFile(aliases, fileContent, filePath);
      
      assert.strictEqual(result.addedCount, 0, "Should add 0 aliases due to permission error");
      assert.strictEqual(result.existingCount, 0, "Should find 0 existing aliases");
      assert.strictEqual(result.failedCount, 1, "Should have 1 failed alias");
      
      // Restore permissions and cleanup
      fs.chmodSync(filePath, 0o644);
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

function countOccurrences(lines, searchString) {
  let count = 0;
  for (const line of lines) {
    if (line.includes(searchString)) {
      count++;
    }
  }
  return count;
}