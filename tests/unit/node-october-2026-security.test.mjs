import test from "node:test";
import assert from "node:assert/strict";
import { getNodeRuntimeSupport } from "../../bin/nodeRuntimeSupport.mjs";

test("October 2026 security policy rejects vulnerable Node.js releases", () => {
  for (const version of ["22.23.3", "24.22.0", "26.12.0", "25.9.0", "20.20.2"]) {
    assert.equal(getNodeRuntimeSupport(version).nodeCompatible, false, version);
  }
});

test("October 2026 security policy accepts fixed and newer patch releases", () => {
  for (const version of ["22.23.4", "22.23.5", "24.22.1", "24.22.2", "26.12.1", "26.12.2"]) {
    assert.equal(getNodeRuntimeSupport(version).nodeCompatible, true, version);
  }
});
