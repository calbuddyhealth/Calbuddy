import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync(
  new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url),
  "utf8"
);

const css = fs.readFileSync(
  new URL("../assets/css/ari-circle-menu-v5.css", import.meta.url),
  "utf8"
);

const supabaseConfig = fs.readFileSync(
  new URL("../supabase-config.js", import.meta.url),
  "utf8"
);

const feedHtml = fs.readFileSync(
  new URL("../ari-circle-feed.html", import.meta.url),
  "utf8"
);

test("ARI Circle V5 drawer removes stale right-side category labels", () => {
  assert.match(menu, /Circle controls/);
  assert.match(menu, /Notifications/);
  assert.match(menu, /Find People/);
  assert.match(menu, /Privacy & Visibility/);
  assert.match(menu, /Circle Safety/);
  assert.match(menu, /Exit ARI Circle/);
  assert.doesNotMatch(menu, /<small>Activity<\/small>/);
  assert.doesNotMatch(menu, /<small>Buddies<\/small>/);
  assert.doesNotMatch(menu, /<small>Alerts<\/small>/);
  assert.doesNotMatch(menu, /<small>Account<\/small>/);
  assert.doesNotMatch(menu, /<small>Help<\/small>/);
  assert.doesNotMatch(menu, /<small>ARI XP<\/small>/);
});

test("Notification Settings lives inside Notifications instead of the primary drawer", () => {
  assert.doesNotMatch(menu, /label: "Notification Settings"/);
  assert.match(menu, /circle-notifications-settings-link/);
  assert.match(menu, /notification-settings\.html/);
});

test("ARI Circle drawer uses premium pearl glass and icon-led rows", () => {
  assert.match(css, /width:\s*min\(86vw, 360px\)/);
  assert.match(css, /backdrop-filter:\s*blur\(32px\) saturate\(160%\)/);
  assert.match(css, /border-radius:\s*30px/);
  assert.match(css, /circle-v5-menu__icon/);
  assert.match(css, /circle-v5-menu__item--exit/);
});

test("shared Supabase bootstrap loads the V5 drawer on Circle pages", () => {
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
  assert.match(supabaseConfig, /circle-menu-v5\.js\?v=1\.0\.1/);
  assert.match(feedHtml, /supabase-config\.js\?v=1\.1\.4/);
});

test("V5 drawer self-heals if the older V4 shell rewrites its contents", () => {
  assert.match(menu, /hasV5Markup/);
  assert.match(menu, /MutationObserver/);
  assert.match(menu, /circle-v5-menu__identity/);
});
