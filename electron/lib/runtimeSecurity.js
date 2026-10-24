"use strict";

const { checkServerIdentity } = require("node:tls");

// Electron's own Node runtime runs the desktop and its bundled server. The
// system Node version and electron/package.json engines do not attest it.
function getEmbeddedRuntimeIssues(versions, verifyIdentity = checkServerIdentity) {
  const floors = { 22: [23, 4], 24: [22, 1], 26: [12, 1] };
  const [major, minor, patch] = String(versions.node || "")
    .split(".")
    .map(Number);
  const floor = floors[major];
  const patched = floor && (minor > floor[0] || (minor === floor[0] && patch >= floor[1]));
  const issues = patched
    ? []
    : [`Embedded Node ${versions.node || "unknown"} is below the security floor.`];
  const certificate = { subjectaltname: "DNS:127.0.0.1", subject: { CN: "127.0.0.1" } };
  for (const host of ["１２７.0.0.1", "0177.0.0.1", "0x7f.0.0.1"]) {
    if (!verifyIdentity(host, certificate))
      issues.push("Embedded TLS hostname verification is unpatched.");
  }
  return [...new Set(issues)];
}

function assertSafeEmbeddedRuntime(versions) {
  const issues = getEmbeddedRuntimeIssues(versions);
  if (issues.length) {
    throw new Error(
      `OmniRoute desktop requires a patched Electron runtime. ${issues.join(" ")} ` +
        "Use the standalone Node server with Node 24.22.1 or newer until a patched desktop build is available."
    );
  }
}

module.exports = { getEmbeddedRuntimeIssues, assertSafeEmbeddedRuntime };
