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

test("mobile location editor does not blur or install a tap-blocking backdrop", () => {
  assert.doesNotMatch(css, /backdrop-filter:blur\(/);
  assert.match(css, /::before[\s\S]*content:none !important/);
  assert.match(css, /::before[\s\S]*pointer-events:none !important/);
  assert.match(css, /ari-circle-location-panel:not\(\[hidden\]\)[\s\S]*pointer-events:auto !important/);
});

test("location controls remain explicitly interactive", () => {
  assert.match(css, /ari-circle-location-panel button[\s\S]*pointer-events:auto !important/);
  assert.match(css, /touch-action:manipulation/);
});

test("location editor hotfix stylesheet is loaded with current cache version", () => {
  assert.match(adapter, /ari-circle-connect-location-editor-layer-fix-v1\.css\?v=1\.0\.2/);
});
