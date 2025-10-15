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

    // const installationShell = await container.openShell("zsh");
    // await installationShell.runCommand("safe-chain setup");
  });

  afterEach(async () => {
    // Stop and clean up the container after each test
    if (container) {
      await container.stop();
      container = null;
    }
  });

  // it(`safe-chain proxy respects upstream proxy settings`, async () => {
  //   // Configure and start a proxy inside the container
  //   const proxy = await container.openShell("zsh");
  //   await proxy.runCommand(
  //     `echo 'BasicAuth user password' >> /etc/tinyproxy/tinyproxy.conf`
  //   );
  //   await proxy.runCommand("tinyproxy");

  //   const shell = await container.openShell("zsh");
  //   await shell.runCommand(
  //     'export HTTPS_PROXY="http://user:password@localhost:8888"'
  //   );
  //   const { output } = await shell.runCommand("npm install axios");

  //   // Check if the installation was successful
  //   assert(
  //     output.includes("added") || output.includes("up to date"),
  //     "npm install did not complete successfully"
  //   );

  //   const proxyLog = await container.openShell("zsh");
  //   const { output: logOutput } = await proxyLog.runCommand(
  //     "cat /var/log/tinyproxy/tinyproxy.log"
  //   );

  //   // Check if the proxy log contains entries for the npm install
  //   assert(
  //     logOutput.includes("CONNECT registry.npmjs.org:443"),
  //     "Proxy log does not contain expected entries"
  //   );
  // });

  it(`safe-chain proxy allows to request through a local http registry`, async () => {
    container.dockerExec("npx -y verdaccio --listen 4873", true);

    // Polling until verdaccio is ready (max 30 seconds)
    let verdaccioStarted = false;
    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const curlOutput = container.dockerExec(
          "curl -I http://localhost:4873/lodash/-/lodash-4.17.21.tgz"
        );
        if (curlOutput.includes("200 OK")) {
          verdaccioStarted = true;
          console.log(
            "Verdaccio started, after " + i * 500 + "ms\n",
            curlOutput
          );
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
      "npm install lodash --registry http://localhost:4873"
    );

    console.log("NPM install output:\n", result.output);

    const curlOutput = container.dockerExec(
      "curl -I http://localhost:4873/lodash/-/lodash-4.17.21.tgz"
    );

    console.log("Curl output:\n", curlOutput);

    // // Check if the installation was successful
    // assert(
    //   result.output.includes("added"),
    //   "npm install did not complete successfully, output: " + result.output
    // );
  });
});
