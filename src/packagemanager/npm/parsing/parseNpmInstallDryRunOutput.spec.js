import { describe, it } from "node:test";
import assert from "node:assert";
import { parseDryRunOutput } from "./parseNpmInstallDryRunOutput.js";

describe("parseNpmInstallDryRunOutput", () => {
  it("should parse added packages", () => {
    const output = `
add @jest/transform 29.7.0
add @jest/test-result 29.7.0
add @jest/reporters 29.7.0
add @jest/console 29.7.0
add jest-cli 29.7.0
add import-local 3.2.0
add @jest/types 29.6.3
add @jest/core 29.7.0
add jest 29.7.0

added 267 packages in 831ms

32 packages are looking for funding
  run \`npm fund\` for details`;

    const expected = [
      { name: "@jest/transform", version: "29.7.0", type: "add" },
      { name: "@jest/test-result", version: "29.7.0", type: "add" },
      { name: "@jest/reporters", version: "29.7.0", type: "add" },
      { name: "@jest/console", version: "29.7.0", type: "add" },
      { name: "jest-cli", version: "29.7.0", type: "add" },
      { name: "import-local", version: "3.2.0", type: "add" },
      { name: "@jest/types", version: "29.6.3", type: "add" },
      { name: "@jest/core", version: "29.7.0", type: "add" },
      { name: "jest", version: "29.7.0", type: "add" },
    ];

    const result = parseDryRunOutput(output);

    assert.deepEqual(result, expected);
  });

  it("should parse removed packages", () => {
    const output = `
remove react 19.1.0

    removed 1 package in 115ms`;

    const expected = [{ name: "react", version: "19.1.0", type: "remove" }];

    const result = parseDryRunOutput(output);

    assert.deepEqual(result, expected);
  });

  it("should parse changed packages", () => {
    const output = `
change react 19.0.0 => 19.1.0

changed 1 package in 204ms`;

    const expected = [
      {
        name: "react",
        version: "19.1.0",
        oldVersion: "19.0.0",
        type: "change",
      },
    ];

    const result = parseDryRunOutput(output);

    assert.deepEqual(result, expected);
  });

  it("should parse mixed package changes", () => {
    const output = `
add @jest/transform 29.7.0
add @jest/test-result 29.7.0
add @jest/reporters 29.7.0
add @jest/console 29.7.0
add jest-cli 29.7.0
add import-local 3.2.0
add @jest/types 29.6.3
add @jest/core 29.7.0
add jest 29.7.0
remove react 19.1.0
change lodash 4.17.0 => 4.18.0

removed 1 package in 115ms`;

    const expected = [
      { name: "@jest/transform", version: "29.7.0", type: "add" },
      { name: "@jest/test-result", version: "29.7.0", type: "add" },
      { name: "@jest/reporters", version: "29.7.0", type: "add" },
      { name: "@jest/console", version: "29.7.0", type: "add" },
      { name: "jest-cli", version: "29.7.0", type: "add" },
      { name: "import-local", version: "3.2.0", type: "add" },
      { name: "@jest/types", version: "29.6.3", type: "add" },
      { name: "@jest/core", version: "29.7.0", type: "add" },
      { name: "jest", version: "29.7.0", type: "add" },
      { name: "react", version: "19.1.0", type: "remove" },
      {
        name: "lodash",
        version: "4.18.0",
        oldVersion: "4.17.0",
        type: "change",
      },
    ];

    const result = parseDryRunOutput(output);

    assert.deepEqual(result, expected);
  });

  it("should work with npm v22.0.0", () => {
    const output = `
add  @jest/types                                        29.6.3
add  @jest/core                                         29.7.0
add  jest                                               29.7.0

added 257 packages in 791ms

44 packages are looking for funding
    run \`npm fund\` for details`;

    const expected = [
      { name: "@jest/types", version: "29.6.3", type: "add" },
      { name: "@jest/core", version: "29.7.0", type: "add" },
      { name: "jest", version: "29.7.0", type: "add" },
    ];

    const result = parseDryRunOutput(output);

    assert.deepEqual(result, expected);
  });
});
