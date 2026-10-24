import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = new URL("../../", import.meta.url);

test("desktop checks the embedded runtime before loading network-capable modules", () => {
  const main = readFileSync(new URL("electron/main.js", root), "utf8");
  const guard = main.indexOf("assertSafeEmbeddedRuntime(process.versions)");
  assert.ok(guard >= 0, "desktop must check its actual embedded Node runtime");
  assert.ok(guard < main.indexOf('require("electron-updater")'));
});

test("desktop rejects vulnerable Node patches and TLS backport failures", () => {
  const { getEmbeddedRuntimeIssues } = require("../../electron/lib/runtimeSecurity.js");
  for (const node of ["22.23.3", "24.22.0", "26.12.0", "25.9.0"]) {
    assert.ok(getEmbeddedRuntimeIssues({ node }, () => new Error("rejected")).length > 0);
  }
  for (const node of ["22.23.4", "24.22.1", "26.12.1"]) {
    assert.deepEqual(
      getEmbeddedRuntimeIssues({ node }, () => new Error("rejected")),
      []
    );
  }
  assert.ok(getEmbeddedRuntimeIssues({ node: "24.22.1" }, () => undefined).length > 0);
});

test("packaging includes the guard and checks the actual Electron binary", () => {
  const pkg = JSON.parse(readFileSync(new URL("electron/package.json", root), "utf8"));
  assert.ok(pkg.build.files.includes("lib/runtimeSecurity.js"));
  assert.match(pkg.scripts["prepare:bundle"], /check-electron-runtime/);
  assert.doesNotMatch(pkg.scripts.dev, /--no-sandbox/);
});
