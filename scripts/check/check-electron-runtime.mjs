#!/usr/bin/env node
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const electronRequire = createRequire(new URL("../../electron/package.json", import.meta.url));
const executable = electronRequire("electron");
const guard = fileURLToPath(new URL("../../electron/lib/runtimeSecurity.js", import.meta.url));
const script = `require(${JSON.stringify(guard)}).assertSafeEmbeddedRuntime(process.versions);console.log(JSON.stringify(process.versions));`;
const result = spawnSync(executable, ["-e", script], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  encoding: "utf8",
  windowsHide: true,
  timeout: 15000,
});
if (result.error || result.status !== 0) {
  console.error(
    "[electron-runtime] Refusing to package an unverified or vulnerable embedded runtime."
  );
  console.error(result.error?.message || result.stderr || "Runtime probe did not succeed.");
  process.exit(1);
}
console.log(`[electron-runtime] Verified ${result.stdout.trim()}`);
