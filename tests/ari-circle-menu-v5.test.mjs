import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/ari-circle-menu-v5.css", import.meta.url), "utf8");
const supabaseConfig = fs.readFileSync(new URL("../supabase-config.js", import.meta.url), "utf8");
const feedHtml = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");

test("ARI Circle V5 drawer reflects Real World Social navigation", () => {
  assert.match(menu, /Circle controls/);
  assert.match(menu, /Notifications/);
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Meet Up"/);
  assert.match(menu, /ari-circle-meetup\.html/);
  assert.match(menu, /Privacy & Visibility/);
  assert.match(menu, /Circle Safety/);
  assert.match(menu, /Exit ARI Circle/);
  assert.doesNotMatch(menu, /label: "Find People"/);
  assert.doesNotMatch(menu, /<small>Buddies<\/small>/);
});

test("shared drawer bootstraps the authoritative V5 Real World shell", () => {
  assert.match(menu, /REAL_WORLD_SCRIPT_SRC = "js\/ari-circle\/v5-real-world\.js\?v=5\.0\.1"/);
  assert.match(menu, /loadRealWorldShell\(\)/);
});

test("adult gate cannot be re-hidden after authorization already succeeded", () => {
  assert.match(menu, /function holdForAdultGate\(\)[\s\S]*if \(adultAccessReady\(\)\) return/);
  assert.match(menu, /function revealAdultCircleUi\(\)[\s\S]*document\.documentElement\.style\.visibility = ""/);
  assert.ok(
    menu.indexOf('window.addEventListener("ari-circle-access-ready", startAdultCircleUi') < menu.indexOf("loadAdultGuard();"),
    "the access-ready listener must be registered before dynamically loading the guard"
  );
});

test("Real World shell uses bounded lifecycle refreshes instead of a global DOM observer", () => {
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.match(shell, /function boundedRefresh\(\)/);
  assert.match(shell, /document\.addEventListener\("circle:app-ready", queueRun\)/);
  assert.match(shell, /window\.addEventListener\("ari-circle-access-ready", queueRun\)/);
});

test("Notification Settings lives inside Notifications instead of the primary drawer", () => {
  assert.doesNotMatch(menu, /label: "Notification Settings"/);
  assert.match(menu, /circle-notifications-settings-link/);
  assert.match(menu, /notification-settings\.html/);
});

test("ARI Circle drawer keeps premium glass and icon-led rows", () => {
  assert.match(css, /width:\s*min\(86vw, 360px\)/);
  assert.match(css, /backdrop-filter:\s*blur\(32px\) saturate\(160%\)/);
  assert.match(css, /border-radius:\s*30px/);
  assert.match(css, /circle-v5-menu__icon/);
  assert.match(css, /circle-v5-menu__item--exit/);
});

test("shared Supabase bootstrap still loads the adults-only V5 drawer", () => {
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
  assert.match(supabaseConfig, /circle-menu-v5\.js\?v=1\.0\.1/);
  assert.match(feedHtml, /supabase-config\.js\?v=1\.1\.4/);
});

test("V5 drawer self-heals only around managed menu mutations", () => {
  assert.match(menu, /hasV5Markup/);
  assert.match(menu, /MutationObserver/);
  assert.match(menu, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(menu, /observer\.observe\(document\.documentElement/);
  assert.match(menu, /circle-v5-menu__identity/);
});
