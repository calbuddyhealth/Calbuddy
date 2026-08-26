import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-v6-experience.css", import.meta.url), "utf8");

test("Circle V6 keeps status updates and navigation keyboard/screen-reader friendly", () => {
  assert.match(html, /role="status" aria-live="polite"/i);
  assert.match(html, /aria-label="ARI Circle ARI Next"/i);
  assert.match(html, /aria-label="Open Circle menu"/i);
  assert.match(html, /aria-label="Messages"/i);
  assert.match(html, /aria-labelledby="v6Title"/i);
  assert.match(html, /aria-labelledby="v6AttentionTitle"/i);
  assert.match(html, /aria-labelledby="v6CrewsTitle"/i);
  assert.doesNotMatch(html, /aria-label="Action Network views"/i);
  assert.doesNotMatch(html, /class="v6-mode-nav"/i);
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:3px solid/);
});