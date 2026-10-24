import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

test("vendored browser adapter has a declared, directly resolvable Playwright runtime", () => {
  const root = new URL("../../../", import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.dependencies["playwright-core"], pkg.dependencies.playwright);
  const adapterRequire = createRequire(
    new URL("open-sse/vendor/codex-chatgpt-web/adapters/chatgpt-web/browser-worker.ts", root)
  );
  assert.equal(typeof adapterRequire("playwright-core").chromium.launch, "function");
});
