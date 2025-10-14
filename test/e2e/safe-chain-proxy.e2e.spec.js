import { describe, it, before, beforeEach, afterEach } from "node:test";
import { DockerTestContainer } from "./DockerTestContainer.js";
import assert from "node:assert";

describe("E2E: Safe chain proxy", () => {
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

  it(`safe-chain proxy respects upstream proxy settings`, async () => {
    // Configure and start a proxy inside the container
    const proxy = await container.openShell("zsh");
    await proxy.runCommand(
      `echo 'BasicAuth user password' >> /etc/tinyproxy/tinyproxy.conf`
    );
    await proxy.runCommand("tinyproxy");

    const shell = await container.openShell("zsh");
    await shell.runCommand(
      'export HTTPS_PROXY="http://user:password@localhost:8888"'
    );
    const { output } = await shell.runCommand("npm install axios");

    // Check if the installation was successful
    assert(
      output.includes("added") || output.includes("up to date"),
      "npm install did not complete successfully"
    );

    const proxyLog = await container.openShell("zsh");
    const { output: logOutput } = await proxyLog.runCommand(
      "cat /var/log/tinyproxy/tinyproxy.log"
    );

    // Check if the proxy log contains entries for the npm install
    assert(
      logOutput.includes("CONNECT registry.npmjs.org:443"),
      "Proxy log does not contain expected entries"
    );
  });

  it(`safe-chain proxy allows to request through a local http registry`, async () => {
    const configShell = await container.openShell("bash");
    await configShell.runCommand("touch ~/.verdaccio-config.yaml");
    // verdaccio.yaml
    // storage: ./storage
    // log: { type: file, path: ./verdaccio.log, level: info }
    await configShell.runCommand(
      "echo 'log: { type: file, path: /verdaccio.log, level: info }' >> ~/.verdaccio-config.yaml"
    );
    await configShell.runCommand(
      "echo 'storage: ./storage' >> ~/.verdaccio-config.yaml"
    );

    // Start a local npm registry (verdaccio) inside the container
    container.dockerExec("npx -y verdaccio -c ~/.verdaccio-config.yaml", true);

    // Polling until verdaccio is ready (max 60 seconds)
    let verdaccioStarted = false;
    for (let i = 0; i < 120; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const curlOutput = container.dockerExec(
          "curl -I http://localhost:4873/lodash"
        );
        if (curlOutput.includes("200 OK")) {
          verdaccioStarted = true;
          console.log("Verdaccio started, after " + i * 500 + "ms", curlOutput);
          break;
        }
      } catch {
        // ignore, this means docker exec returned -1 and verdaccio is not yet ready
      }
    }
    if (!verdaccioStarted) {
      assert.fail("Verdaccio did not start in time");
    }

    const shell = await container.openShell("bash");
    const result = await shell.runCommand(
      "npm install lodash --registry=http://localhost:4873"
    );

    console.log("NPM install output:", result.output);

    const verdaccioLog = await container.openShell("bash");
    const { output: logOutput } = await verdaccioLog.runCommand(
      "cat /verdaccio.log"
    );

    console.log("Verdaccio log output:", logOutput);

    // Check if the installation was successful
    assert(
      result.output.includes("added"),
      "npm install did not complete successfully, output: " + result.output
    );
  });
});
