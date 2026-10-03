import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const parity = await read("assets/css/ari-circle-header-icon-parity.css");
const css = await read("assets/css/ari-circle-connect-location-focus-fix-v1.css");

test("Connect loads the mobile location focus stability stylesheet", () => {
  assert.match(parity, /ari-circle-connect-location-focus-fix-v1\.css\?v=1\.0\.0/);
});

test("Connect search-location panel is left anchored and viewport bounded", () => {
  assert.match(css, /\.ari-circle-location-orb \.ari-circle-location-panel\s*\{[\s\S]*left:\s*0/);
  assert.match(css, /transform:\s*none/);
  assert.match(css, /width:\s*min\(420px, calc\(100vw - 32px\)\)/);
  assert.match(css, /max-width:\s*calc\(100vw - 32px\)/);
});

test("Connect location form controls cannot force horizontal overflow on iOS", () => {
  assert.match(css, /\.ari-circle-location-panel__form > \*/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /\.ari-circle-location-panel__form input,[\s\S]*\.ari-circle-location-panel__form select\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*font-size:\s*16px\s*!important/);
});
