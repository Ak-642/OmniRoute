import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getNodeRuntimeSupport } from "../../bin/nodeRuntimeSupport.mjs";

test("October 2026 security policy rejects vulnerable Node.js releases", () => {
  for (const version of ["22.23.3", "24.22.0", "26.12.0", "25.9.0", "20.20.2"]) {
    assert.equal(getNodeRuntimeSupport(version).nodeCompatible, false, version);
  }
});

test("Bun compatibility path rejects versions below the October security release", () => {
  for (const [version, expected] of [
    ["1.3.14", false],
    ["1.4.3", false],
    ["1.4.4", true],
    ["1.4.5", true],
  ]) {
    const script = `Object.defineProperty(process.versions, "bun", { value: ${JSON.stringify(version)} });
      const { getNodeRuntimeSupport, getNodeRuntimeWarning } = await import("./bin/nodeRuntimeSupport.mjs");
      console.log(JSON.stringify({ support: getNodeRuntimeSupport(), warning: getNodeRuntimeWarning() }));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: new URL("../../", import.meta.url),
      encoding: "utf8",
    });
    assert.equal(child.status, 0, child.stderr);
    const result = JSON.parse(child.stdout);
    assert.equal(result.support.nodeCompatible, expected, version);
    if (!expected) assert.match(result.warning, /Bun.*1\.4\.4/);
  }
});

test("October 2026 security policy accepts fixed and newer patch releases", () => {
  for (const version of ["22.23.4", "22.23.5", "24.22.1", "24.22.2", "26.12.1", "26.12.2"]) {
    assert.equal(getNodeRuntimeSupport(version).nodeCompatible, true, version);
  }
});
