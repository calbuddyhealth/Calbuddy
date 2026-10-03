import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const css = await read("assets/css/ari-circle-connect-card-depth-v1.css");
const adapter = await read("assets/css/ari-circle-header-icon-parity.css");

test("photo-free Circle cards expand the information panel across the card", () => {
  assert.match(css, /circle-connect-card__content:has\(\.circle-connect-card__media\[data-cover-source="fallback"\]\)[\s\S]*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /data-cover-source="fallback"[\s\S]*circle-connect-card__body[\s\S]*grid-column:1 \/ -1/);
});

test("fallback media becomes decoration instead of a half-width column", () => {
  assert.match(css, /\.circle-connect-card__media\[data-cover-source="fallback"\][\s\S]*position:absolute/);
  assert.match(css, /circle-connect-card__media-fallback[\s\S]*opacity:\.055/);
  assert.match(css, /data-cover-source="fallback"[\s\S]*small[\s\S]*display:none !important/);
});

test("adaptive card stylesheet is cache-busted", () => {
  assert.match(adapter, /ari-circle-connect-card-depth-v1\.css\?v=1\.1\.0/);
});
