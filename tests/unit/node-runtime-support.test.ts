import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  SUPPORTED_NODE_RANGE,
  getNodeRuntimeSupport,
  getNodeRuntimeWarning,
  parseNodeVersion,
} from "../../src/shared/utils/nodeRuntimeSupport.ts";
import {
  getNodeRuntimeSupport as getCliNodeRuntimeSupport,
  getNodeRuntimeWarning as getCliNodeRuntimeWarning,
} from "../../bin/nodeRuntimeSupport.mjs";

test("parseNodeVersion normalizes v-prefixed versions", () => {
  assert.deepEqual(parseNodeVersion("v22.23.4"), {
    raw: "v22.23.4",
    normalized: "22.23.4",
    major: 22,
    minor: 23,
    patch: 4,
  });
});

test("getNodeRuntimeSupport accepts patched Node 24 and 22 LTS lines", () => {
  assert.deepEqual(getNodeRuntimeSupport("22.23.4"), {
    nodeVersion: "v22.23.4",
    nodeCompatible: true,
    reason: "supported",
    supportedRange: SUPPORTED_NODE_RANGE,
    supportedDisplay: "Node.js 22.23.4+ (22.x LTS), 24.22.1+ (24.x LTS), or 26.12.1+ (26.x)",
    recommendedVersion: "v24.22.1",
    minimumSecureVersion: "v22.23.4",
  });

  assert.equal(getNodeRuntimeSupport("26.12.1").nodeCompatible, true);
  assert.deepEqual(getNodeRuntimeSupport("24.22.1"), {
    nodeVersion: "v24.22.1",
    nodeCompatible: true,
    reason: "supported",
    supportedRange: SUPPORTED_NODE_RANGE,
    supportedDisplay: "Node.js 22.23.4+ (22.x LTS), 24.22.1+ (24.x LTS), or 26.12.1+ (26.x)",
    recommendedVersion: "v24.22.1",
    minimumSecureVersion: "v24.22.1",
  });
});

test("getNodeRuntimeSupport rejects versions below the secure floor in a supported line", () => {
  const support = getNodeRuntimeSupport("22.23.3");

  assert.equal(support.nodeCompatible, false);
  assert.equal(support.reason, "below-security-floor");
  assert.equal(support.minimumSecureVersion, "v22.23.4");
  assert.match(getNodeRuntimeWarning("22.23.3") || "", /below the patched minimum v22\.23\.4/i);
});

test("getNodeRuntimeSupport rejects unsupported major lines", () => {
  const node18 = getNodeRuntimeSupport("18.20.8");
  const node20 = getNodeRuntimeSupport("20.20.2");
  const node27 = getNodeRuntimeSupport("27.1.0");

  assert.equal(node18.nodeCompatible, false);
  assert.equal(node18.reason, "unsupported-major");
  assert.match(getNodeRuntimeWarning("18.20.8") || "", /outside OmniRoute's approved secure/i);

  // Node 20.x is no longer supported (aligned to package.json engines >=22).
  assert.equal(node20.nodeCompatible, false);
  assert.equal(node20.reason, "unsupported-major");

  assert.equal(node27.nodeCompatible, false);
  assert.equal(node27.reason, "unreleased-major");
  assert.match(
    getNodeRuntimeWarning("27.1.0") || "",
    /currently supports Node\.js 22\.x, 24\.x, and 26\.x/i
  );
});

test("CLI runtime support stays aligned with the shared runtime policy", () => {
  assert.deepEqual(getCliNodeRuntimeSupport("24.22.1"), getNodeRuntimeSupport("24.22.1"));
  assert.deepEqual(getCliNodeRuntimeSupport("22.23.4"), getNodeRuntimeSupport("22.23.4"));
  assert.equal(getCliNodeRuntimeWarning("27.1.0"), getNodeRuntimeWarning("27.1.0"));
});

test("package.json engines.node equals SUPPORTED_NODE_RANGE (install gate == runtime gate)", () => {
  // Regression guard for #7446: npm consults `engines.node` at install time while the
  // runtime rejects anything outside SUPPORTED_NODE_RANGE. If the two drift, npm installs
  // OmniRoute on a Node version the runtime then refuses to run (the Node 22.0.0–22.23.3 gap).
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.engines.node, SUPPORTED_NODE_RANGE);
});
