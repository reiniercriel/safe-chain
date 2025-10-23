import { describe, it, before, beforeEach, afterEach } from "node:test";
import { DockerTestContainer } from "./DockerTestContainer.js";
import assert from "node:assert";

describe("E2E: pip coverage", () => {
  let container;

  before(async () => {
    DockerTestContainer.buildImage();
  });

  beforeEach(async () => {
    // Run a new Docker container for each test
    container = new DockerTestContainer();
    await container.start();

    const installationShell = await container.openShell("zsh");
    await installationShell.runCommand("safe-chain setup");
  });

  afterEach(async () => {
    // Stop and clean up the container after each test
    if (container) {
      await container.stop();
      container = null;
    }
  });

  it(`successfully installs known safe packages with pip3`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand("pip3 install requests");

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`pip3 download`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand("pip3 download requests");

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`pip3 .whl`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand("pip3 wheel requests");

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`pip3 install --dry-run is respected by scanner`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand("pip3 install --dry-run requests");

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });
});
