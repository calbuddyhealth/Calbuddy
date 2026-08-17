import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const navJs = fs.readFileSync("js/ari-circle/primary-nav.js", "utf8");
const navCss = fs.readFileSync("assets/css/ari-circle-primary-nav.css", "utf8");
const v4Ui = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");

test("ARI Circle primary nav stays Feed, Buddies, Challenges, Profile", () => {
  assert.match(navJs, /const ORDER = \["Feed", "Buddies", "Challenges", "Profile"\]/);
  assert.match(
    v4Ui,
    /Feed<\/a><a href="ari-circle-partners\.html">Buddies<\/a><a href="ari-circle-challenges\.html">Challenges<\/a><a class="is-active" href="ari-circle\.html"/
  );
});

test("ARI Circle primary nav uses soft pill treatment without the legacy underline", () => {
  assert.match(navCss, /\.circle-soft-primary-nav\s*\{/);
  assert.match(navCss, /border-radius:\s*22px/);
  assert.match(navCss, /backdrop-filter:\s*blur\(22px\)/);
  assert.match(navCss, /\.circle-soft-primary-tab\.is-active/);
  assert.match(navCss, /\.circle-soft-primary-tab::after[\s\S]*display:\s*none\s*!important/);
});

test("V4 shell loads the soft primary navigation assets", () => {
  assert.match(v4Ui, /ari-circle-primary-nav\.css\?v=1\.0\.1/);
  assert.match(v4Ui, /\/js\/ari-circle\/primary-nav\.js\?v=1\.0\.1/);
});
