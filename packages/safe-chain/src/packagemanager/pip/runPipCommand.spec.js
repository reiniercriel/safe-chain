import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";

describe("runPipCommand --cert handling", () => {
  let runPip;
  let capturedArgs = null;

  beforeEach(async () => {
    capturedArgs = null;

    // Mock safeSpawn to capture args
    mock.module("../../utils/safeSpawn.js", {
      namedExports: {
        safeSpawn: async (command, args, options) => {
          capturedArgs = { command, args, options };
          return { status: 0 };
        },
      },
    });

    // Mock proxy env merge
    mock.module("../../registryProxy/registryProxy.js", {
      namedExports: {
        mergeSafeChainProxyEnvironmentVariables: (env) => ({
          ...env,
          HTTPS_PROXY: "http://localhost:8080",
        }),
      },
    });

    // Mock certUtils to point to a test CA path
    mock.module("../../registryProxy/certUtils.js", {
      namedExports: {
        getCaCertPath: () => "/tmp/test-ca.pem",
      },
    });

    const mod = await import("./runPipCommand.js");
    runPip = mod.runPip;
  });

  afterEach(() => {
    mock.reset();
  });

  it("should append --cert with our CA path to pip args by default (PyPI)", async () => {
    const res = await runPip("pip3", ["install", "requests"]);
    assert.strictEqual(res.status, 0);

    // safeSpawn should be called with --cert flag
    assert.ok(capturedArgs, "safeSpawn should have been called");
    
    const idx = capturedArgs.args.indexOf("--cert");
    assert.ok(idx >= 0, "--cert flag should be present in pip args");
    
    const certPath = capturedArgs.args[idx + 1];
    assert.strictEqual(certPath, "/tmp/test-ca.pem", "CA path should match getCaCertPath()");
    
    // Original args should be preserved before --cert
    assert.strictEqual(capturedArgs.args[0], "install");
    assert.strictEqual(capturedArgs.args[1], "requests");

  // No Python CA env overrides expected
  assert.strictEqual(capturedArgs.options.env.REQUESTS_CA_BUNDLE, undefined);
  assert.strictEqual(capturedArgs.options.env.SSL_CERT_FILE, undefined);
  });

  it("should not override user-provided --cert <path>", async () => {
    const res = await runPip("pip3", ["install", "requests", "--cert", "/tmp/user-ca.pem"]);
    assert.strictEqual(res.status, 0);

    // Ensure only the user-provided --cert is present
    const certIndices = capturedArgs.args
      .map((a, i) => (a === "--cert" ? i : -1))
      .filter((i) => i >= 0);
    assert.strictEqual(certIndices.length, 1, "should not inject an extra --cert");
    const userPath = capturedArgs.args[certIndices[0] + 1];
    assert.strictEqual(userPath, "/tmp/user-ca.pem", "should preserve user-provided cert path");
  // No Python CA env overrides expected
  assert.strictEqual(capturedArgs.options.env.REQUESTS_CA_BUNDLE, undefined);
  assert.strictEqual(capturedArgs.options.env.SSL_CERT_FILE, undefined);
  });

  it("should not override user-provided --cert=<path>", async () => {
    const res = await runPip("pip3", ["install", "requests", "--cert=/tmp/user-ca.pem"]);
    assert.strictEqual(res.status, 0);

    // Ensure args contain the inline --cert=<path> and no extra --cert token
    const hasInline = capturedArgs.args.some((a) => typeof a === "string" && a.startsWith("--cert="));
    assert.ok(hasInline, "should keep inline --cert=<path>");
    const injectedIndex = capturedArgs.args.indexOf("--cert");
    assert.strictEqual(injectedIndex, -1, "should not inject separate --cert when inline is provided");
  // No Python CA env overrides expected
  assert.strictEqual(capturedArgs.options.env.REQUESTS_CA_BUNDLE, undefined);
  assert.strictEqual(capturedArgs.options.env.SSL_CERT_FILE, undefined);
  });

  it("should inject --cert when explicit index is a known PyPI host", async () => {
    const res = await runPip("pip3", ["install", "requests", "--index-url", "https://pypi.org/simple"]);
    assert.strictEqual(res.status, 0);
    const idx = capturedArgs.args.indexOf("--cert");
    assert.ok(idx >= 0, "--cert should be present for known registries");
  });

  it("should NOT inject --cert when index points to an unknown external mirror (tunneled)", async () => {
    const res = await runPip("pip3", [
      "install",
      "certifi",
      "--index-url",
      "https://pypi.tuna.tsinghua.edu.cn/simple",
    ]);
    assert.strictEqual(res.status, 0);
    const idx = capturedArgs.args.indexOf("--cert");
    assert.strictEqual(idx, -1, "--cert should be omitted for tunneled external hosts");
  });

  it("should NOT inject --cert when installing from a direct external URL", async () => {
    const res = await runPip("pip3", [
      "install",
      "https://example.com/pkg-1.0.0-py3-none-any.whl",
    ]);
    assert.strictEqual(res.status, 0);
    const idx = capturedArgs.args.indexOf("--cert");
    assert.strictEqual(idx, -1, "--cert should be omitted for direct external URLs");
  });
});
