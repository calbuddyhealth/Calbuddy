import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const pearl = fs.readFileSync(new URL("../assets/css/ari-circle-v5-pearl.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const authority = fs.readFileSync(new URL("../assets/css/ari-circle-v5-visual-authority.css", import.meta.url), "utf8");
const minimal = fs.readFileSync(new URL("../assets/css/ari-circle-v5-minimal-premium.css", import.meta.url), "utf8");
const happening = fs.readFileSync(new URL("../js/ari-circle/feed/happening-v5.js", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const quests = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");


test("Circle V5.2.2 makes Minimal Premium the final primary-surface layer", () => {
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-surface:\s*#ffffff/);
  assert.match(authority, /--circle521-surface:\s*#ffffff/);
  assert.match(authority, /color-scheme:\s*light\s*!important/);
  assert.match(minimal, /ARI CIRCLE V5\.2\.2 — MINIMAL PREMIUM/);
  for (const html of [feed, meetup, quests]) {
    assert.match(html, /ari-circle-v5-pearl\.css\?v=5\.1\.0/);
    assert.match(html, /ari-circle-v5-premium\.css\?v=5\.2\.0/);
    assert.match(html, /ari-circle-v5-visual-authority\.css\?v=5\.2\.1/);
    assert.match(html, /ari-circle-v5-minimal-premium\.css\?v=5\.2\.2/);
  }
  assert.match(meetup, /meta name="theme-color" content="#f6f8fc"/);
  assert.match(quests, /meta name="theme-color" content="#f6f8fc"/);
});


test("shared ARI Circle header is text-only, larger, and pearl", () => {
  assert.match(shell, /const VERSION = "5\.2\.2"/);
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.doesNotMatch(shell, /circle-v51-orbit-mark/);
  assert.match(shell, /<strong>ARI<\/strong><em>CIRCLE<\/em>/);
  assert.match(minimal, /\.circle-v51-orbit-mark,[\s\S]*display:\s*none\s*!important/);
  assert.match(minimal, /font:\s*800 clamp\(1\.02rem,4\.7vw,1\.28rem\)/);
  assert.doesNotMatch(shell, /YOUR CIRCLE/);
  assert.doesNotMatch(shell, /FIND YOUR PEOPLE/);
  assert.doesNotMatch(shell, /DO SOMETHING TOGETHER/);
  assert.match(authority, /background:\s*rgba\(255,255,255,\.975\)\s*!important/);
  assert.doesNotMatch(shell, /\.rpc\s*\(/);
  assert.doesNotMatch(shell, /\.from\s*\(/);
  assert.doesNotMatch(shell, /fetch\s*\(/);
});


test("Minimal Premium motion and lifecycle stay bounded", () => {
  assert.match(shell, /HALO_SEEN_KEY/);
  assert.match(shell, /sessionStorage\.getItem\(HALO_SEEN_KEY\)/);
  assert.doesNotMatch(shell, /setInterval\s*\(/);
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.match(minimal, /\.circle-v51-halo-intro \.circle-v51-orbit-mark[\s\S]*animation:\s*none\s*!important/);
  assert.match(minimal, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(minimal, /animation:\s*[^;]*infinite/);
});


test("ordinary social cards remain light and visual authority does not stack blur", () => {
  assert.match(authority, /\.circle-v5-meetup-card,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v5-quest-card,[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(authority, /body\.circle-v5-real-world \.feed-composer,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v51-halo-header[\s\S]*backdrop-filter:\s*blur\(10px\)/);
  assert.match(authority, /\.circle-v5-bottom-nav__dock[\s\S]*backdrop-filter:\s*blur\(10px\)/);
  assert.match(authority, /Media viewers remain the intentional dark exception/);
});


test("Meet Up and Quests keep compact navigation while redundant helper copy is removed", () => {
  assert.match(meetup, /<h1 id="meetupTitle">Meet Up<\/h1>/);
  assert.match(meetup, /<p class="circle-v52-page-intro__sub">Find your people\.<\/p>/);
  assert.doesNotMatch(meetup, /How XP works/);
  assert.doesNotMatch(meetup, /Community events/);
  assert.doesNotMatch(meetup, /peaceful civic marches/);
  assert.match(quests, /<h1 id="questTitle">Quests<\/h1>/);
  assert.match(quests, /<p class="circle-v52-page-intro__sub">Do something together\.<\/p>/);
  assert.match(quests, /Pick a mission\. Finish it together\./);
  assert.doesNotMatch(quests, /<summary>Verified XP<\/summary>/);
  assert.doesNotMatch(quests, /most hype wins/i);
  assert.match(authority, /\.circle-v52-page-intro h1[\s\S]*font:\s*850 1\.08rem/);
});


test("Feed discovery has no redundant See all or empty-card Create meetup CTA", () => {
  assert.match(happening, /HAPPENING/);
  assert.match(happening, /Do something in real life/);
  assert.doesNotMatch(happening, />See all</);
  assert.doesNotMatch(happening, />Create a meetup</);
  assert.match(happening, /Nothing planned yet\./);
});


test("Feed prevents legacy dark CSS or stale shell modules from outranking V5.2.2", () => {
  assert.match(feed, /id="ari-circle-v4-polish-style"/);
  assert.match(feed, /id="ari-circle-v4-ux-fixes-style"/);
  assert.match(feed, /id="ari-circle-v5-real-world-style"/);
  const legacyIndex = feed.indexOf('id="ari-circle-v5-real-world-style"');
  const authorityIndex = feed.indexOf("ari-circle-v5-visual-authority.css?v=5.2.1");
  const minimalIndex = feed.indexOf("ari-circle-v5-minimal-premium.css?v=5.2.2");
  assert.ok(legacyIndex >= 0 && authorityIndex > legacyIndex, "light visual authority must load after legacy V5 CSS");
  assert.ok(minimalIndex > authorityIndex, "V5.2.2 minimal layer must load last");
  assert.match(feed, /v4-ui\.js\?v=5\.2\.2/);
  assert.match(shell, /happening-v5\.js\?v=5\.2\.2/);
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
