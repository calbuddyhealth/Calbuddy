import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");
const profileLoader = fs.readFileSync("js/ari-circle/profile/profile-v3-loader.js", "utf8");
const visitorControls = fs.readFileSync("js/ari-circle/profile/profile-visitor-controls.js", "utf8");
const feedPostOptions = fs.readFileSync("js/ari-circle/feed/feed-post-options.js", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-menu-v5.css", "utf8");
const premium = fs.readFileSync("assets/css/ari-circle-v5-premium.css", "utf8");
const authority = fs.readFileSync("assets/css/ari-circle-v5-visual-authority.css", "utf8");
const supabaseConfig = fs.readFileSync("supabase-config.js", "utf8");
const feedHtml = fs.readFileSync("ari-circle-feed.html", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");

test("Circle drawer contains only secondary controls", () => {
  assert.match(menu, /Circle controls/);
  assert.match(menu, /group\("Main"/);
  assert.match(menu, /group\("Account"/);
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Discover Friends"/);
  assert.match(menu, /Privacy & Visibility/);
  assert.match(menu, /Circle Safety/);
  assert.match(menu, /Exit ARI Circle/);
  assert.doesNotMatch(menu, /label: "Quests"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
});

test("shared shell uses consolidated light visual stack without XP authority", () => {
  assert.match(shell, /AUTHORITY_STYLE_HREF = "assets\/css\/ari-circle-v5-visual-authority\.css\?v=5\.2\.5"/);
  assert.doesNotMatch(shell, /ari-circle-xp\.css/);
  assert.match(authority, /CONSOLIDATED VISUAL AUTHORITY/);
  assert.doesNotMatch(feedHtml, /ari-circle-xp\.css/);
  assert.doesNotMatch(meetupHtml, /ari-circle-xp\.css/);
});

test("adult gate remains fail-closed and bounded", () => {
  assert.match(menu, /function holdForAdultGate\(\)/);
  assert.match(menu, /if \(adultAccessReady\(\)\) return/);
  assert.match(menu, /function revealAdultCircleUi\(\)/);
  assert.doesNotMatch(menu, /MutationObserver/);
  assert.match(menu, /window\.addEventListener\("pageshow"/);
});

test("Connect uses the current shared header and Connect + Profile shell", () => {
  assert.match(meetupHtml, /<header class="circle-v5-header feed-header">/);
  assert.match(meetupHtml, /class="feed-brand circle-v5-brand"/);
  assert.match(meetupHtml, /social-badges\.js\?v=1\.2\.0/);
  assert.match(meetupHtml, /supabase-config\.js\?v=1\.1\.8/);
  assert.match(meetupHtml, /ari-circle-v5-visual-authority\.css\?v=5\.2\.5/);
  assert.match(meetupHtml, /v5-real-world\.js\?v=5\.5\.0/);
  assert.match(shell, /navLink\("connect", "ari-circle-meetup\.html", "Connect"\)/);
  assert.match(shell, /navLink\("profile", "ari-circle\.html", "Profile"\)/);
  assert.doesNotMatch(shell, /navLink\("feed"/);
  assert.doesNotMatch(shell, />Missions<\/a>/);
});
test("legacy Feed is no longer a member posting destination", () => {
  assert.match(feedHtml, /window\.location\.replace\("ari-circle-meetup\.html"\)/);
  assert.match(feedPostOptions, /ari_circle_feed_hide_post/);
});
test("Profile compatibility stays Profile-only and showcase-aware", () => {
  assert.match(profileCompat, /const VERSION = "5\.6\.0"/);
  assert.match(profileCompat, /const REAL_WORLD_VERSION = "5\.5\.0"/);
  assert.match(profileCompat, /brand\.href = "ari-circle-meetup\.html"/);
  assert.match(profileCompat, /circleV3PostsPanel/);
  assert.match(profileLoader, /profile-gallery-v1\\.js\\?v=2\\.2\\.0/);
  assert.doesNotMatch(profileLoader, /ari-circle-xp\.css/);
  assert.match(visitorControls, /PROFILE VISITOR CONTROLS/);
});
test("drawer visual treatment stays page-independent", () => {
  assert.match(css, /circle-v5-menu__icon/);
  assert.match(premium, /premium pearl drawer/i);
  assert.match(authority, /font-family:\s*"Inter"/);
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
});
