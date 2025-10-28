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

  it(`pip3 install with extras such as requests[socks]`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('pip3 install "requests[socks]==2.32.3"');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`pip3 install with range version specifier`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('pip3 install "Jinja2>=3.1,<3.2"');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`python3 -m pip install routes through safe-chain`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python3 -m pip install requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`python3 -m pip download routes through safe-chain`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python3 -m pip download requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
  });

  it(`safe-chain blocks installation of malicious Python packages`, async () => {
    const shell = await container.openShell("zsh");
    // Clear pip cache to ensure network download through proxy
    await shell.runCommand("pip3 cache purge");

    const result = await shell.runCommand("pip3 install --break-system-packages safe-chain-pi-test");

    assert.ok(
      result.output.includes("blocked 1 malicious package downloads:"),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    assert.ok(
      result.output.includes("safe_chain_pi_test@0.0.1"),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    assert.ok(
      result.output.includes("Exiting without installing malicious packages."),
      `Output did not include expected text. Output was:\n${result.output}`
    );

    const listResult = await shell.runCommand("pip3 list");
    assert.ok(
      !listResult.output.includes("safe-chain-pi-test"),
      `Malicious package was installed despite safe-chain protection. Output of 'pip3 list' was:\n${listResult.output}`
    );
  });

  it(`python -m pip routes to aikido-pip (uses pip command)`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python -m pip install --break-system-packages requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    // Verify it completed successfully (would fail if routing was incorrect)
    assert.ok(
      result.output.includes("Successfully installed") || result.output.includes("Requirement already satisfied"),
      `Installation did not succeed. Output was:\n${result.output}`
    );
  });

  it(`python -m pip3 routes to aikido-pip3 (uses pip3 command)`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python -m pip3 install --break-system-packages requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    // Verify it completed successfully (would fail if routing was incorrect)
    assert.ok(
      result.output.includes("Successfully installed") || result.output.includes("Requirement already satisfied"),
      `Installation did not succeed. Output was:\n${result.output}`
    );
  });

  it(`python3 -m pip routes to aikido-pip3 (uses pip3 command)`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python3 -m pip install --break-system-packages requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    // Verify it completed successfully (would fail if routing was incorrect)
    assert.ok(
      result.output.includes("Successfully installed") || result.output.includes("Requirement already satisfied"),
      `Installation did not succeed. Output was:\n${result.output}`
    );
  });

  it(`python3 -m pip3 routes to aikido-pip3 (uses pip3 command)`, async () => {
    const shell = await container.openShell("zsh");
    const result = await shell.runCommand('python3 -m pip3 install --break-system-packages requests');

    assert.ok(
      result.output.includes("no malicious packages found."),
      `Output did not include expected text. Output was:\n${result.output}`
    );
    // Verify it completed successfully (would fail if routing was incorrect)
    assert.ok(
      result.output.includes("Successfully installed") || result.output.includes("Requirement already satisfied"),
      `Installation did not succeed. Output was:\n${result.output}`
    );
  });

});
