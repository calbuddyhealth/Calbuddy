import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const css = await read("assets/css/ari-circle-connect-location-editor-layer-fix-v1.css");
const adapter = await read("assets/css/ari-circle-header-icon-parity.css");

test("open location editor escapes the hero stacking context", () => {
  assert.match(css, /circle-connect-actionbar:has\(\.ari-circle-location-panel:not\(\[hidden\]\)\)[\s\S]*z-index:260/);
  assert.match(css, /ari-circle-location-panel:not\(\[hidden\]\)[\s\S]*z-index:520/);
});

test("mobile location editor uses a fixed keyboard-safe sheet", () => {
  assert.match(css, /@media \(max-width:560px\)[\s\S]*position:fixed !important/);
  assert.match(css, /100dvh/);
  assert.match(css, /overflow-y:auto !important/);
});

test("location editor hotfix stylesheet is loaded", () => {
  assert.match(adapter, /ari-circle-connect-location-editor-layer-fix-v1\.css\?v=1\.0\.0/);
});
