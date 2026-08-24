import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const pearl = fs.readFileSync(new URL("../assets/css/ari-circle-v5-pearl.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const quests = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");


test("Circle V5.2 makes Premium Pearl authoritative on the primary social surfaces", () => {
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-ink:\s*#142033/);
  assert.match(premium, /color-scheme:\s*light\s*!important/);
  for (const html of [feed, meetup, quests]) {
    assert.match(html, /ari-circle-v5-pearl\.css\?v=5\.1\.0/);
    assert.match(html, /ari-circle-v5-premium\.css\?v=5\.2\.0/);
  }
  assert.match(meetup, /meta name="theme-color" content="#f6f8fc"/);
  assert.match(quests, /meta name="theme-color" content="#f6f8fc"/);
});


test("shared ARI Circle header is slim, brand-led, and no longer carries page subtitles", () => {
  assert.match(shell, /const VERSION = "5\.2\.0"/);
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-orbit-mark/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.doesNotMatch(shell, /YOUR CIRCLE/);
  assert.doesNotMatch(shell, /FIND YOUR PEOPLE/);
  assert.doesNotMatch(shell, /DO SOMETHING TOGETHER/);
  assert.doesNotMatch(shell, /<small>\$\{/);
  assert.match(premium, /min-height:\s*58px\s*!important/);
  assert.match(premium, /grid-template-columns:\s*42px minmax\(0,1fr\) 42px/);
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
  assert.match(premium, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(premium, /animation:\s*[^;]*infinite/);
});


test("ordinary social cards are light and do not stack backdrop blur", () => {
  assert.match(premium, /\.circle-v5-meetup-card,[\s\S]*background:\s*var\(--circle52-surface\)\s*!important/);
  assert.match(premium, /\.circle-v5-quest-card,[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(premium, /body\.circle-v5-real-world \.feed-composer,[\s\S]*background:\s*var\(--circle52-surface\)\s*!important/);
  assert.match(premium, /\.circle-v51-halo-header[\s\S]*backdrop-filter:\s*blur\(12px\)/);
  assert.match(premium, /\.circle-v5-bottom-nav__dock[\s\S]*backdrop-filter:\s*blur\(12px\)/);
  assert.match(premium, /Media remains the intentional dark exception/);
});


test("Meet Up and Quests use scan-first copy with long rules behind disclosures", () => {
  assert.match(meetup, /<h1 id="meetupTitle">Find your people<\/h1>/);
  assert.match(meetup, /Meet up\. Show up\. Earn XP\./);
  assert.match(meetup, /<summary>How XP works<\/summary>/);
  assert.match(quests, /<h1 id="questTitle">Do something together<\/h1>/);
  assert.match(quests, /Small steps\. Real impact\./);
  assert.match(quests, /<summary>Verified XP<\/summary>/);
  assert.doesNotMatch(meetup, /Find people who are actually ready to do something/);
  assert.doesNotMatch(quests, /Shared objectives without dangerous leaderboards/);
});


test("primary Circle pages pin the V5.2 adult-gated menu asset before shared bootstrap", () => {
  for (const html of [feed, meetup, quests]) {
    const menuIndex = html.indexOf('id="ariCircleMenuV5Script"');
    const configIndex = html.indexOf('src="supabase-config.js');
    assert.ok(menuIndex >= 0, "page should pin the V5.2 Circle menu asset");
    assert.match(html, /circle-menu-v5\.js\?v=2\.3\.0/);
    assert.ok(configIndex >= 0, "page should still load shared Supabase bootstrap");
    assert.ok(menuIndex < configIndex, "deferred menu element must exist before supabase-config checks for it");
  }
});
