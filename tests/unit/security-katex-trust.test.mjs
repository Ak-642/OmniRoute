import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mermaidRequire = createRequire(require.resolve("mermaid"));
const katex = mermaidRequire("katex");
const expression = "\\href{https://example.com}{x}";

test("Mermaid's KaTeX ignores inherited trust settings", () => {
  const inherited = Object.create({ trust: true });
  const html = katex.renderToString(expression, inherited);
  assert.doesNotMatch(html, /href="https:\/\/example\.com/);
});

test("patched KaTeX retains ordinary math and explicit trusted-link rendering", () => {
  assert.match(katex.renderToString("x^2 + y^2"), /class="katex"/);
  assert.match(katex.renderToString(expression, { trust: true }), /href="https:\/\/example\.com/);
});
