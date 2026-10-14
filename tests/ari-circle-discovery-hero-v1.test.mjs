import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const css = await read("assets/css/ari-circle-connect-discovery-hero-v1.css");
const adapter = await read("assets/css/ari-circle-header-icon-parity.css");

test("Connect loads the CSS-only discovery hero", () => {
  assert.match(adapter, /ari-circle-connect-discovery-hero-v1\.css\?v=1\.0\.0/);
  assert.match(css, /circle-connect-main::before/);
  assert.match(css, /content:"EXPLORE"/);
  assert.match(css, /content:"FIND PEOPLE\. DO MORE TOGETHER\."/);
});

test("discovery hero upgrades location, actions, and filters without image assets", () => {
  assert.match(css, /ari-circle-location-orb/);
  assert.match(css, /Host something/);
  assert.match(css, /circle-connect-chip\.is-active/);
  assert.match(css, /circleDiscoveryPulse/);
  assert.doesNotMatch(css, /url\([^)]*\.(?:png|jpe?g|webp|avif)/i);
});
