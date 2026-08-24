import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
const profileCompat = fs.readFileSync(new URL("../js/ari-circle/v4-ui.js", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/ari-circle-menu-v5.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const minimal = fs.readFileSync(new URL("../assets/css/ari-circle-v5-minimal-premium.css", import.meta.url), "utf8");
const supabaseConfig = fs.readFileSync(new URL("../supabase-config.js", import.meta.url), "utf8");
const feedHtml = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetupHtml = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const questHtml = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");


test("ARI Circle V5.2 drawer reflects Real World Social navigation", () => {
  assert.match(menu, /<small>Circle controls<\/small>/);
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


test("Feed, Meet Up, and Quests use the same shared navigation shell", () => {
  for (const html of [feedHtml, meetupHtml, questHtml]) {
    assert.match(html, /<header class="circle-v5-header feed-header">/);
    assert.match(html, /class="feed-brand circle-v5-brand"/);
    assert.match(html, /id="ariCircleMenuV5Script" src="js\/ari-circle\/circle-menu-v5\.js\?v=2\.4\.0"/);
    assert.match(html, /ari-circle-v5-minimal-premium\.css\?v=5\.2\.4/);
    assert.match(html, /id="ariCircleV5RealWorldScript" src="js\/ari-circle\/v5-real-world\.js\?v=5\.2\.2"/);
  }
});


test("Feed no longer loads legacy Profile compatibility CSS or JS", () => {
  assert.doesNotMatch(feedHtml, /ari-circle-v4\.css/);
  assert.doesNotMatch(feedHtml, /ari-circle-v4-polish\.css/);
  assert.doesNotMatch(feedHtml, /ari-circle-v4-ux-fixes\.css/);
  assert.doesNotMatch(feedHtml, /js\/ari-circle\/v4-ui\.js/);
  assert.match(feedHtml, /js\/ari-circle\/v4-flow-fixes\.js\?v=1\.2\.1/);
  assert.match(feedHtml, /js\/ari-circle\/feed\/feed-polish\.js\?v=1\.0\.1/);
  assert.match(feedHtml, /js\/ari-circle\/feed\/feed-moderation\.js\?v=1\.1\.0/);
});


test("Profile compatibility shell is profile-only and never owns drawer markup", () => {
  assert.match(profileCompat, /PROFILE COMPATIBILITY SHELL/);
  assert.match(profileCompat, /if \(!isProfileRoute\(\)\) return/);
  assert.match(profileCompat, /window\.AriCircleMenuV5\?\.refresh\?\.\(\)/);
  assert.doesNotMatch(profileCompat, /circleMenuMarkup/);
  assert.doesNotMatch(profileCompat, /challenge-video-web-fix/);
  assert.doesNotMatch(profileCompat, /ari-circle-partners\.html/);
  assert.doesNotMatch(profileCompat, /ari-circle-challenges\.html/);
});


test("portaled drawer typography and sizing are independent of the source page", () => {
  assert.match(minimal, /font-family:\s*"Inter"[\s\S]*-apple-system[\s\S]*sans-serif\s*!important/);
  assert.match(minimal, /-webkit-text-size-adjust:\s*100%\s*!important/);
  assert.match(minimal, /circle-v52-menu-group__items \.circle-v5-menu__item/);
  assert.match(minimal, /min-height:\s*54px\s*!important/);
  assert.match(minimal, /\.feed-page,[\s\S]*\.circle-v5-page[\s\S]*padding-top:\s*0\s*!important/);
});


test("shared Supabase bootstrap still loads the adults-only V5 drawer", () => {
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
  assert.match(feedHtml, /id="ariCircleMenuV5Script" src="js\/ari-circle\/circle-menu-v5\.js\?v=2\.4\.0"/);
});


test("V5.2 drawer uses bounded lifecycle refreshes and no DOM MutationObserver", () => {
  assert.doesNotMatch(menu, /MutationObserver/);
  assert.doesNotMatch(menu, /observer\.observe/);
  assert.match(menu, /setTimeout\(run, 160\)/);
  assert.match(menu, /setTimeout\(run, 700\)/);
  assert.match(menu, /window\.addEventListener\("pageshow"/);
  assert.match(menu, /circle-v52-menu-group/);
});
