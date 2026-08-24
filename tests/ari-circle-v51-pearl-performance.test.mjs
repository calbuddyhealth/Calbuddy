import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const pearl = fs.readFileSync(new URL("../assets/css/ari-circle-v5-pearl.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const authority = fs.readFileSync(new URL("../assets/css/ari-circle-v5-visual-authority.css", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const quests = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");


test("Circle V5.2.1 makes Premium Pearl authoritative on the primary social surfaces", () => {
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-surface:\s*#ffffff/);
  assert.match(authority, /--circle521-surface:\s*#ffffff/);
  assert.match(authority, /color-scheme:\s*light\s*!important/);
  for (const html of [feed, meetup, quests]) {
    assert.match(html, /ari-circle-v5-pearl\.css\?v=5\.1\.0/);
    assert.match(html, /ari-circle-v5-premium\.css\?v=5\.2\.0/);
    assert.match(html, /ari-circle-v5-visual-authority\.css\?v=5\.2\.1/);
  }
  assert.match(meetup, /meta name="theme-color" content="#f6f8fc"/);
  assert.match(quests, /meta name="theme-color" content="#f6f8fc"/);
});


test("shared ARI Circle header stays slim and pearl while page identity moves below it", () => {
  assert.match(shell, /const VERSION = "5\.2\.0"/);
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-orbit-mark/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.doesNotMatch(shell, /YOUR CIRCLE/);
  assert.doesNotMatch(shell, /FIND YOUR PEOPLE/);
  assert.doesNotMatch(shell, /DO SOMETHING TOGETHER/);
  assert.match(authority, /min-height:\s*58px\s*!important/);
  assert.match(authority, /grid-template-columns:\s*40px minmax\(0,1fr\) 40px/);
  assert.match(authority, /background:\s*rgba\(255,255,255,\.975\)\s*!important/);
  assert.doesNotMatch(shell, /\.rpc\s*\(/);
  assert.doesNotMatch(shell, /\.from\s*\(/);
  assert.doesNotMatch(shell, /fetch\s*\(/);
});


test("Premium Pearl motion and lifecycle stay bounded", () => {
  assert.match(shell, /HALO_SEEN_KEY/);
  assert.match(shell, /sessionStorage\.getItem\(HALO_SEEN_KEY\)/);
  assert.doesNotMatch(shell, /setInterval\s*\(/);
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.match(pearl, /animation:\s*circle51HaloIn 620ms/);
  assert.match(authority, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(authority, /animation:\s*[^;]*infinite/);
});


test("ordinary social cards are light and the visual authority does not stack blur", () => {
  assert.match(authority, /\.circle-v5-meetup-card,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v5-quest-card,[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(authority, /body\.circle-v5-real-world \.feed-composer,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v51-halo-header[\s\S]*backdrop-filter:\s*blur\(10px\)/);
  assert.match(authority, /\.circle-v5-bottom-nav__dock[\s\S]*backdrop-filter:\s*blur\(10px\)/);
  assert.match(authority, /Media viewers remain the intentional dark exception/);
});


test("Meet Up and Quests use compact page navigation instead of second hero headers", () => {
  assert.match(meetup, /<h1 id="meetupTitle">Meet Up<\/h1>/);
  assert.match(meetup, /<p class="circle-v52-page-intro__sub">Find your people\.<\/p>/);
  assert.match(meetup, /<summary>How XP works<\/summary>/);
  assert.match(quests, /<h1 id="questTitle">Quests<\/h1>/);
  assert.match(quests, /<p class="circle-v52-page-intro__sub">Do something together\.<\/p>/);
  assert.match(quests, /Pick a mission\. Finish it together\./);
  assert.match(quests, /<summary>Verified XP<\/summary>/);
  assert.match(authority, /\.circle-v52-page-intro h1[\s\S]*font:\s*850 1\.08rem/);
  assert.doesNotMatch(meetup, /Find people who are actually ready to do something/);
  assert.doesNotMatch(quests, /Shared objectives without dangerous leaderboards/);
});


test("Feed prevents legacy dark CSS from being re-injected after the premium authority layer", () => {
  assert.match(feed, /id="ari-circle-v4-polish-style"/);
  assert.match(feed, /id="ari-circle-v4-ux-fixes-style"/);
  assert.match(feed, /id="ari-circle-v5-real-world-style"/);
  const legacyIndex = feed.indexOf('id="ari-circle-v5-real-world-style"');
  const authorityIndex = feed.indexOf("ari-circle-v5-visual-authority.css?v=5.2.1");
  assert.ok(legacyIndex >= 0 && authorityIndex > legacyIndex, "light visual authority must load after legacy V5 CSS");
  assert.match(feed, /v4-ui\.js\?v=5\.2\.1/);
  assert.match(authority, /body\.circle-v5-real-world \.circle-v51-halo-header\.feed-header/);
  assert.match(authority, /body\.circle-v5-real-world \.feed-post/);
});


test("primary Circle pages pin the adult-gated menu asset before shared bootstrap", () => {
  for (const html of [feed, meetup, quests]) {
    const menuIndex = html.indexOf('id="ariCircleMenuV5Script"');
    const configIndex = html.indexOf('src="supabase-config.js');
    assert.ok(menuIndex >= 0, "page should pin the V5.2 Circle menu asset");
    assert.match(html, /circle-menu-v5\.js\?v=2\.3\.0/);
    assert.ok(configIndex >= 0, "page should still load shared Supabase bootstrap");
    assert.ok(menuIndex < configIndex, "deferred menu element must exist before supabase-config checks for it");
  }
});
