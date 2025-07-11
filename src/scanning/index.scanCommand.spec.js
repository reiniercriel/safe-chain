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
  }));
  const mockConfirm = mock.fn(() => true);

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
        emptyLine: () => {},
        confirm: mockConfirm,
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
    let successMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {
        successMessageWasSet = true;
      },
      fail: () => {},
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => []);

    await scanCommand(["install", "lodash"]);

    assert.equal(successMessageWasSet, true);
  });

  it("should succeed when changes are not malicious", async () => {
    let successMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {
        successMessageWasSet = true;
      },
      fail: () => {},
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "lodash", version: "4.17.21" },
    ]);

    await scanCommand(["install", "lodash"]);

    assert.equal(successMessageWasSet, true);
  });

  it("should throw an error when timing out", async () => {
    let failureMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {
        failureMessageWasSet = true;
      },
    }));
    getScanTimeoutMock.mock.mockImplementationOnce(() => 100);
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(async () => {
      await setTimeout(150);
      return [{ name: "lodash", version: "4.17.21" }];
    });

    await assert.rejects(scanCommand(["install", "lodash"]));

    assert.equal(failureMessageWasSet, true);
  });

  it("should fail and prompt the user when malicious changes are detected", async () => {
    let failureMessageWasSet = false;
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: () => {
        failureMessageWasSet = true;
      },
    }));
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(() => [
      { name: "malicious", version: "1.0.0" },
    ]);
    let userWasPrompted = false;
    mockConfirm.mock.mockImplementationOnce(() => {
      userWasPrompted = true;
      return true; // Simulate user accepting the risk, otherwise the process would exit
    });

    await scanCommand(["install", "malicious"]);

    assert.equal(failureMessageWasSet, true);
    assert.equal(userWasPrompted, true);
  });

  it("should not report a timeout when the user takes a long time to respond (it should not affect the timeout)", async () => {
    let failureMessages = [];
    mockStartProcess.mock.mockImplementationOnce(() => ({
      setText: () => {},
      succeed: () => {},
      fail: (message) => {
        failureMessages.push(message);
      },
    }));
    getScanTimeoutMock.mock.mockImplementationOnce(() => 100);
    mockGetDependencyUpdatesForCommand.mock.mockImplementation(async () => {
      return [{ name: "malicious", version: "4.17.21" }];
    });
    mockConfirm.mock.mockImplementationOnce(async () => {
      await setTimeout(200);
      return true; // Simulate user accepting the risk, otherwise the process would exit
    });

    await scanCommand(["install", "malicious"]);

    assert.equal(failureMessages.length, 1);
    const failureMessage = failureMessages[0];
    assert.equal(failureMessage.toLowerCase().includes("timeout"), false);
    assert.equal(failureMessage.toLowerCase().includes("malicious"), true);
  });
});
