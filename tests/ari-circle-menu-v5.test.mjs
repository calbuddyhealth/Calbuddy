import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
const profileCompat = fs.readFileSync(new URL("../js/ari-circle/v4-ui.js", import.meta.url), "utf8");
const profileLoader = fs.readFileSync(new URL("../js/ari-circle/profile/profile-v3-loader.js", import.meta.url), "utf8");
const profileFriends = fs.readFileSync(new URL("../js/ari-circle/profile/profile-friends.js", import.meta.url), "utf8");
const visitorControls = fs.readFileSync(new URL("../js/ari-circle/profile/profile-visitor-controls.js", import.meta.url), "utf8");
const feedPostOptions = fs.readFileSync(new URL("../js/ari-circle/feed/feed-post-options.js", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/ari-circle-menu-v5.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const authority = fs.readFileSync(new URL("../assets/css/ari-circle-v5-visual-authority.css", import.meta.url), "utf8");
const supabaseConfig = fs.readFileSync(new URL("../supabase-config.js", import.meta.url), "utf8");
const feedHtml = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetupHtml = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const questHtml = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");

test("ARI Circle drawer reflects the current Real World Social navigation", () => {
  assert.match(menu, /<small>Circle controls<\/small>/);
  assert.match(menu, /group\("Main"/);
  assert.match(menu, /group\("Account"/);
  assert.match(menu, /Notifications/);
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Meet Up"/);
  assert.match(menu, /Profile Options/);
  assert.match(menu, /Privacy & Visibility/);
  assert.match(menu, /Circle Safety/);
  assert.match(menu, /Exit ARI Circle/);
  assert.doesNotMatch(menu, /label: "Find People"/);
  assert.doesNotMatch(menu, /Buddies/);
});

test("shared shell uses one final consolidated visual authority", () => {
  assert.match(shell, /AUTHORITY_STYLE_HREF = "assets\/css\/ari-circle-v5-visual-authority\.css\?v=5\.2\.5"/);
  assert.doesNotMatch(shell, /ari-circle-v5-minimal-premium\.css/);
  assert.match(authority, /CONSOLIDATED VISUAL AUTHORITY/);
  assert.match(authority, /FORMER V5\.2\.4 MINIMAL PREMIUM OVERRIDES/);
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
  assert.doesNotMatch(shell, /ari-circle-partners\.html|ari-circle-challenges\.html|\["Find People", "Buddies", "Partners"\]/);
});

test("Notification Settings lives inside Notifications instead of the primary drawer", () => {
  assert.doesNotMatch(menu, /label: "Notification Settings"/);
  assert.match(menu, /circle-notifications-settings-link/);
  assert.match(menu, /notification-settings\.html/);
});

test("drawer is pearl white, grouped, and keeps only Exit destructive", () => {
  assert.match(css, /circle-v5-menu__icon/);
  assert.match(premium, /premium pearl drawer/i);
  assert.match(premium, /circle-v52-menu-group__items/);
  assert.match(premium, /circle-v52-menu-exit/);
  assert.match(menu, /circle-v5-menu__item--exit/);
});

test("Feed, Meet Up, and Quests use the same shared navigation and final CSS authority", () => {
  for (const html of [feedHtml, meetupHtml, questHtml]) {
    assert.match(html, /<header class="circle-v5-header feed-header">/);
    assert.match(html, /class="feed-brand circle-v5-brand"/);
    assert.match(html, /id="ariCircleMenuV5Script" src="js\/ari-circle\/circle-menu-v5\.js\?v=2\.4\.3"/);
    assert.match(html, /id="ariCircleSocialBadgesScript" src="js\/ari-circle\/social-badges\.js\?v=1\.2\.0"/);
    assert.match(html, /supabase-config\.js\?v=1\.1\.8/);
    assert.match(html, /ari-circle-v5-visual-authority\.css\?v=5\.2\.5/);
    assert.doesNotMatch(html, /ari-circle-v5-minimal-premium\.css/);
    assert.match(html, /id="ariCircleV5RealWorldScript" src="js\/ari-circle\/v5-real-world\.js\?v=5\.2\.3"/);
  }
});

test("Feed loads Feed-only post controls instead of mixed Profile compatibility flow", () => {
  assert.doesNotMatch(feedHtml, /ari-circle-v4\.css/);
  assert.doesNotMatch(feedHtml, /ari-circle-v4-polish\.css/);
  assert.doesNotMatch(feedHtml, /ari-circle-v4-ux-fixes\.css/);
  assert.doesNotMatch(feedHtml, /js\/ari-circle\/v4-ui\.js/);
  assert.doesNotMatch(feedHtml, /v4-flow-fixes\.js/);
  assert.doesNotMatch(feedHtml, /launch-social-v5\.js/);
  assert.doesNotMatch(feedHtml, /profile-visitor-controls\.js|profile-social-flow\.js/);
  assert.match(feedHtml, /js\/ari-circle\/feed\/feed-post-options\.js\?v=1\.0\.0/);
  assert.match(feedHtml, /Friends only · kept inside your verified age space\./);
  assert.match(feedHtml, /id="streamTitle">Your Feed</);
  assert.match(feedHtml, /js\/ari-circle\/feed\/feed-polish\.js\?v=1\.0\.1/);
  assert.match(feedHtml, /js\/ari-circle\/feed\/feed-moderation\.js\?v=1\.1\.0/);

  assert.match(feedPostOptions, /FEED POST OPTIONS/);
  assert.match(feedPostOptions, /ari_circle_feed_post_options_context/);
  assert.match(feedPostOptions, /ari_circle_feed_hide_post/);
  assert.match(feedPostOptions, /ari_circle_feed_delete_post/);
  assert.doesNotMatch(feedPostOptions, /relationship_state|ari_circle_profile_friends|circle-owner-actions|circle-visitor-actions/);
});

test("Profile compatibility modules remain Profile-only and purpose-specific", () => {
  assert.match(profileCompat, /PROFILE COMPATIBILITY SHELL/);
  assert.match(profileCompat, /const VERSION = "5\.3\.2"/);
  assert.match(profileCompat, /if \(!isProfileRoute\(\)\) return/);
  assert.match(profileCompat, /window\.AriCircleMenuV5\?\.refresh\?\.\(\)/);
  assert.match(profileCompat, /v5-real-world\.js\?v=5\.2\.3/);
  assert.match(profileCompat, /profile\/profile-visitor-controls\.js\?v=1\.0\.0/);
  assert.doesNotMatch(profileCompat, /launch-social-v5\.js|v4-flow-fixes\.js/);
  assert.doesNotMatch(profileCompat, /circleMenuMarkup|ari-circle-partners\.html|ari-circle-challenges\.html/);

  assert.match(profileLoader, /profile-friends\.js\?v=1\.0\.0/);
  assert.match(profileLoader, /v4-ui\.js\?v=5\.3\.2/);
  assert.doesNotMatch(profileLoader, /profile-social-flow|profile-connection-authority|v4-flow-fixes\.js|AriCircleV4FlowFixes/);

  assert.match(profileFriends, /PROFILE FRIENDS/);
  assert.match(profileFriends, /ari_circle_profile_friends/);
  assert.doesNotMatch(profileFriends, /ari_circle_relationship_state|ari_circle_feed_hide_post|ari_circle_feed_delete_post|data\.circleAction\s*=\s*"connection"/);

  assert.match(visitorControls, /PROFILE VISITOR CONTROLS/);
  assert.match(visitorControls, /ari_circle_mute_state/);
  assert.match(visitorControls, /ari_circle_set_mute/);
  assert.match(visitorControls, /ari_circle_block_user/);
  assert.match(visitorControls, /target_type=profile/);
  assert.doesNotMatch(visitorControls, /challenge-|buddy-|feed-composer|ari-circle-partners\.html|ari-circle-challenges\.html/);
});

test("Profile compatibility cannot recursively refresh the drawer from the V5 ready event", () => {
  const listenerStart = profileCompat.indexOf('document.addEventListener("ari-circle:v5-real-world-ready"');
  const listenerEnd = profileCompat.indexOf("window.AriCircleV4", listenerStart);
  const readyListener = profileCompat.slice(listenerStart, listenerEnd);
  assert.ok(listenerStart >= 0, "Profile must listen for V5 visual readiness");
  assert.doesNotMatch(readyListener, /standardizeMenus\(\)|AriCircleMenuV5.*refresh/);
  assert.match(readyListener, /promoteV5VisualAuthority\(\)/);
});

test("Profile compatibility cannot re-append the dark V5 base after light Visual Authority", () => {
  assert.doesNotMatch(profileCompat, /ensureStyle\("ari-circle-v5-real-world-style"/);
  assert.match(profileCompat, /VISUAL_AUTHORITY_MATCH = "ari-circle-v5-visual-authority\.css"/);
  assert.match(profileCompat, /function promoteV5VisualAuthority\(\)/);
  assert.match(profileCompat, /document\.head\.append\(authority\)/);
  assert.match(profileCompat, /ari-circle:v5-real-world-ready/);
});

test("portaled drawer typography and sizing are page-independent", () => {
  assert.match(authority, /font-family:\s*"Inter"[\s\S]*-apple-system[\s\S]*sans-serif\s*!important/);
  assert.match(authority, /-webkit-text-size-adjust:\s*100%\s*!important/);
  assert.match(authority, /circle-v52-menu-group__items \.circle-v5-menu__item/);
  assert.match(authority, /min-height:\s*54px\s*!important/);
  assert.match(authority, /\.feed-page,[\s\S]*\.circle-v5-page[\s\S]*padding-top:\s*0\s*!important/);
});

test("shared Supabase bootstrap still loads the adults-only V5 drawer", () => {
  assert.match(supabaseConfig, /shouldLoadCircleMenu/);
  assert.match(feedHtml, /id="ariCircleMenuV5Script"/);
});

test("drawer uses bounded lifecycle refreshes and no DOM MutationObserver", () => {
  assert.doesNotMatch(menu, /MutationObserver/);
  assert.doesNotMatch(menu, /observer\.observe/);
  assert.match(menu, /setTimeout\(run, 160\)/);
  assert.match(menu, /setTimeout\(run, 700\)/);
  assert.match(menu, /window\.addEventListener\("pageshow"/);
  assert.match(menu, /circle-v52-menu-group/);
});