import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/ari-circle-menu-v5.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const supabaseConfig = fs.readFileSync(new URL("../supabase-config.js", import.meta.url), "utf8");
const feedHtml = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");


test("ARI Circle V5.2 drawer reflects Real World Social navigation", () => {
  assert.match(menu, /<small>Controls<\/small>/);
  assert.match(menu, /group\("Main"/);
  assert.match(menu, /group\("Account"/);
  assert.match(menu, /Notifications/);
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Meet Up"/);
  assert.match(menu, /ari-circle-meetup\.html/);
  assert.match(menu, /Profile Options/);
  assert.match(menu, /Privacy & Visibility/);
  assert.match(menu, /Circle Safety/);
  assert.match(menu, /Exit ARI Circle/);
  assert.match(menu, />V5\.2</);
  assert.doesNotMatch(menu, /label: "Find People"/);
  assert.doesNotMatch(menu, /Buddies/);
});


test("shared drawer bootstraps the authoritative V5.2 Premium Pearl Real World shell", () => {
  assert.match(menu, /REAL_WORLD_SCRIPT_SRC = "js\/ari-circle\/v5-real-world\.js\?v=5\.2\.0"/);
  assert.match(menu, /loadRealWorldShell\(\)/);
  assert.match(shell, /PREMIUM_STYLE_HREF = "assets\/css\/ari-circle-v5-premium\.css\?v=5\.2\.0"/);
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


test("V5.2 drawer is pearl white, grouped, and keeps only Exit destructive", () => {
  assert.match(css, /circle-v5-menu__icon/);
  assert.match(premium, /premium pearl drawer/i);
  assert.match(premium, /background:\s*rgba\(255,255,255,\.985\)\s*!important/);
  assert.match(premium, /circle-v52-menu-group__items/);
  assert.match(premium, /circle-v52-menu-exit/);
  assert.match(menu, /circle-v5-menu__item--exit/);
});


test("shared Supabase bootstrap still loads the adults-only V5 drawer", () => {
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
  assert.match(feedHtml, /id="ariCircleMenuV5Script" src="js\/ari-circle\/circle-menu-v5\.js\?v=2\.3\.0"/);
});


test("V5.2 drawer uses bounded lifecycle refreshes and no DOM MutationObserver", () => {
  assert.doesNotMatch(menu, /MutationObserver/);
  assert.doesNotMatch(menu, /observer\.observe/);
  assert.match(menu, /setTimeout\(run, 160\)/);
  assert.match(menu, /setTimeout\(run, 700\)/);
  assert.match(menu, /window\.addEventListener\("pageshow"/);
  assert.match(menu, /circle-v52-menu-group/);
});
