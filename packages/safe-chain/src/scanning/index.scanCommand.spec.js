import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { setTimeout } from "node:timers/promises";

describe("scanCommand", async () => {
  const getScanTimeoutMock = mock.fn(() => 1000);
  const mockGetDependencyUpdatesForCommand = mock.fn();
  const mockStartProcess = mock.fn(() => ({
    setText: () => {},
    succeed: () => {},
    fail: () => {},
    stop: () => {},
  }));

  // import { getPackageManager } from "../packagemanager/currentPackageManager.js";
  mock.module("../packagemanager/currentPackageManager.js", {
    namedExports: {
      getPackageManager: () => {
        return {
          isSupportedCommand: () => true,
          getDependencyUpdatesForCommand: mockGetDependencyUpdatesForCommand,
        };
      },
    },
  });

  // import { getScanTimeout } from "../config/configFile.js";
  mock.module("../config/configFile.js", {
    namedExports: {
      getScanTimeout: getScanTimeoutMock,
      getBaseUrl: () => undefined,
    },
  });

  // import { ui } from "../environment/userInteraction.js";
  mock.module("../environment/userInteraction.js", {
    namedExports: {
      ui: {
        startProcess: mockStartProcess,
        writeError: () => {},
        writeInformation: () => {},
        writeWarning: () => {},
        writeExitWithoutInstallingMaliciousPackages: () => {},
        emptyLine: () => {},
      },
    },
  });

  // import { auditChanges, MAX_LENGTH_EXCEEDED } from "./audit/index.js";
  mock.module("./audit/index.js", {
    namedExports: {
      auditChanges: (changes) => {
        const malisciousChangeName = "malicious";
        const allowedChanges = changes.filter(
          (change) => change.name !== malisciousChangeName
        );
        const disallowedChanges = changes
          .filter((change) => change.name === malisciousChangeName)
          .map((change) => ({
            ...change,
            reason: "malicious",
          }));
        const auditResults = {
          allowedChanges,
          disallowedChanges,
          isAllowed: disallowedChanges.length === 0,
        };

        return auditResults;
      },
      MAX_LENGTH_EXCEEDED: "MAX_LENGTH_EXCEEDED",
    },
  });

  const { scanCommand } = await import("./index.js");

  it("should succeed when there are no changes", async () => {
    let progressWasStopped = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {},
      stop: () => {
        progressWasStopped = true;
      },
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => []);

    await scanCommand(["install", "lodash"]);

    assert.equal(progressWasStopped, true);
  });

  it("should succeed when changes are not malicious", async () => {
    let progressWasStopped = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {},
      stop: () => {
        progressWasStopped = true;
      },
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "lodash", version: "4.17.21" },
    ]);

    await scanCommand(["install", "lodash"]);

    assert.equal(progressWasStopped, true);
  });

  it("should throw an error when timing out", async () => {
    let failureMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {
        failureMessageWasSet = true;
      },
      stop: () => {},
    }));
    getScanTimeoutMock.mock.mockImplementationOnce(() => 100);
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(async () => {
      await setTimeout(150);
      return [{ name: "lodash", version: "4.17.21" }];
    });

    await assert.rejects(scanCommand(["install", "lodash"]));

    assert.equal(failureMessageWasSet, true);
  });

  it("should fail and return 1 malicious changes are detected", async () => {
    let failureMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {
        failureMessageWasSet = true;
      },
      stop: () => {},
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "malicious", version: "1.0.0" },
    ]);

    const result = await scanCommand(["install", "malicious"]);

    assert.equal(failureMessageWasSet, true);
    assert.equal(result, 1);
  });

  it("should not report a timeout when the user takes a long time to respond (it should not affect the timeout)", async () => {
    let failureMessages = [];
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: (message) => {
        failureMessages.push(message);
      },
      stop: () => {},
    }));
    getScanTimeoutMock.mock.mockImplementationOnce(() => 100);
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(async () => {
      return [{ name: "malicious", version: "4.17.21" }];
    });

    await scanCommand(["install", "malicious"]);

    assert.equal(failureMessages.length, 1);
    const failureMessage = failureMessages[0];
    assert.equal(failureMessage.toLowerCase().includes("timeout"), false);
    assert.equal(failureMessage.toLowerCase().includes("malicious"), true);
  });

  it("should exit immediately when malicious changes are detected in block mode", async () => {
    let failureMessageWasSet = false;

    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {
        failureMessageWasSet = true;
      },
      stop: () => {},
    }));

    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "malicious", version: "1.0.0" },
    ]);

    const result = await scanCommand(["install", "malicious"]);

    assert.equal(failureMessageWasSet, true);
    assert.equal(result, 1);
  });

  it("should exit immediately when malicious changes are detected in block mode without prompting", async () => {
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {},
      stop: () => {},
    }));

    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "malicious", version: "1.0.0" },
    ]);

    const result = await scanCommand(["install", "malicious"]);

    assert.equal(result, 1);
  });
});
