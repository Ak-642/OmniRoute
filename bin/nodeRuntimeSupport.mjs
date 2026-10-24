#!/usr/bin/env node

export const SECURE_NODE_LINES = Object.freeze([
  Object.freeze({ major: 22, minor: 23, patch: 4 }),
  Object.freeze({ major: 24, minor: 22, patch: 1 }),
  Object.freeze({ major: 26, minor: 12, patch: 1 }),
]);

export const RECOMMENDED_NODE_VERSION = "24.22.1";
export const SUPPORTED_NODE_RANGE = ">=22.23.4 <23 || >=24.22.1 <25 || >=26.12.1 <27";
export const SUPPORTED_NODE_DISPLAY =
  "Node.js 22.23.4+ (22.x LTS), 24.22.1+ (24.x LTS), or 26.12.1+ (26.x)";

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function parseNodeVersion(version = process.versions.node) {
  const rawInput = String(version || process.versions.node || "0.0.0").trim();
  const normalized = rawInput.replace(/^v/i, "");
  const parts = normalized.split(".");
  const major = Number.parseInt(parts[0] || "0", 10);
  const minor = Number.parseInt(parts[1] || "0", 10);
  const patch = Number.parseInt(parts[2] || "0", 10);

  return {
    raw: normalized ? `v${normalized}` : "v0.0.0",
    normalized: normalized || "0.0.0",
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0,
    patch: Number.isFinite(patch) ? patch : 0,
  };
}

export function compareNodeVersions(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export function getSecureFloorForMajor(major) {
  return SECURE_NODE_LINES.find((line) => line.major === major) || null;
}

export function getNodeRuntimeSupport(version = process.versions.node) {
  if (process.versions.bun) {
    const bunCompatible =
      compareNodeVersions(parseNodeVersion(process.versions.bun), {
        major: 1,
        minor: 4,
        patch: 4,
      }) >= 0;
    return {
      nodeVersion: `bun-${process.versions.bun} (Node.js API ${version})`,
      nodeCompatible: bunCompatible,
      reason: bunCompatible ? "supported-bun" : "below-security-floor",
      supportedRange: SUPPORTED_NODE_RANGE + " || Bun >=1.4.4",
      supportedDisplay: SUPPORTED_NODE_DISPLAY + ", or Bun 1.4.4+",
      recommendedVersion: `v${RECOMMENDED_NODE_VERSION}`,
      minimumSecureVersion: "Bun v1.4.4",
    };
  }

  const parsed = parseNodeVersion(version);
  const secureFloor = getSecureFloorForMajor(parsed.major);
  const nodeCompatible = secureFloor ? compareNodeVersions(parsed, secureFloor) >= 0 : false;

  let reason = "unsupported-major";
  if (nodeCompatible) {
    reason = "supported";
  } else if (secureFloor) {
    reason = "below-security-floor";
  } else if (parsed.major >= 27) {
    reason = "unreleased-major";
  }

  return {
    nodeVersion: parsed.raw,
    nodeCompatible,
    reason,
    supportedRange: SUPPORTED_NODE_RANGE,
    supportedDisplay: SUPPORTED_NODE_DISPLAY,
    recommendedVersion: `v${RECOMMENDED_NODE_VERSION}`,
    minimumSecureVersion: secureFloor ? `v${formatVersion(secureFloor)}` : null,
  };
}

export function getNodeRuntimeWarning(version = process.versions.node) {
  const support = getNodeRuntimeSupport(version);
  if (support.nodeCompatible) return null;
  if (process.versions.bun)
    return `Bun ${process.versions.bun} is below the patched minimum v1.4.4.`;

  if (support.reason === "below-security-floor" && support.minimumSecureVersion) {
    return `Node.js ${support.nodeVersion} is below the patched minimum ${support.minimumSecureVersion} for this LTS line.`;
  }

  if (support.reason === "unreleased-major") {
    return `Node.js ${support.nodeVersion} is outside the supported LTS lines. OmniRoute currently supports Node.js 22.x, 24.x, and 26.x.`;
  }

  return `Node.js ${support.nodeVersion} is outside OmniRoute's approved secure runtime policy.`;
}
