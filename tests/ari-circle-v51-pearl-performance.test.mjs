import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const pearl = fs.readFileSync(new URL("../assets/css/ari-circle-v5-pearl.css", import.meta.url), "utf8");
const premium = fs.readFileSync(new URL("../assets/css/ari-circle-v5-premium.css", import.meta.url), "utf8");
const authority = fs.readFileSync(new URL("../assets/css/ari-circle-v5-visual-authority.css", import.meta.url), "utf8");
const xp = fs.readFileSync(new URL("../assets/css/ari-circle-xp.css", import.meta.url), "utf8");
const happening = fs.readFileSync(new URL("../js/ari-circle/feed/happening-v5.js", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const quests = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");


test("current Circle V5 presentation ends in consolidated visual and XP authorities", () => {
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-surface:\s*#ffffff/);
  assert.match(authority, /--circle521-surface:\s*#ffffff/);
  assert.match(authority, /color-scheme:\s*light\s*!important/);
  assert.match(authority, /CONSOLIDATED VISUAL AUTHORITY/);
  assert.match(authority, /FORMER V5\.2\.4 MINIMAL PREMIUM OVERRIDES/);
  assert.match(xp, /REAL WORLD XP VISUAL AUTHORITY/);
  for (const html of [feed, meetup, quests]) {
    assert.match(html, /ari-circle-v5-pearl\.css\?v=5\.1\.0/);
    assert.match(html, /ari-circle-v5-premium\.css\?v=5\.2\.0/);
    assert.match(html, /ari-circle-v5-visual-authority\.css\?v=5\.2\.5/);
    assert.doesNotMatch(html, /ari-circle-v5-minimal-premium\.css/);
  }
  assert.match(meetup, /ari-circle-xp\.css\?v=1\.0\.1/);
});


test("shared ARI Circle header is text-only, larger, and pearl", () => {
  assert.match(shell, /const VERSION = "5\.2\.4"/);
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.doesNotMatch(shell, /circle-v51-orbit-mark/);
  assert.match(shell, /<strong>ARI<\/strong><em>CIRCLE<\/em>/);
  assert.match(authority, /\.circle-v51-orbit-mark,[\s\S]*display:\s*none\s*!important/);
  assert.match(authority, /font:\s*800 clamp\(1\.02rem,4\.7vw,1\.28rem\)/);
  assert.doesNotMatch(shell, /\.rpc\s*\(/);
  assert.doesNotMatch(shell, /\.from\s*\(/);
  assert.doesNotMatch(shell, /fetch\s*\(/);
});


test("primary V5 shell lifecycle stays bounded", () => {
  assert.match(shell, /HALO_SEEN_KEY/);
  assert.match(shell, /sessionStorage\.getItem\(HALO_SEEN_KEY\)/);
  assert.doesNotMatch(shell, /setInterval\s*\(/);
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.match(authority, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(xp, /@media \(prefers-reduced-motion: reduce\)/);
});


test("ordinary social cards remain light and avoid stacked card blur", () => {
  assert.match(authority, /\.circle-v5-meetup-card,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v5-quest-card,[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(authority, /body\.circle-v5-real-world \.feed-composer,[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /\.circle-v5-bottom-nav__dock[\s\S]*backdrop-filter:\s*blur\(10px\)/);
});


test("Meet Up and Missions keep compact navigation identity", () => {
  assert.match(meetup, /<h1 id="meetupTitle">Meet Up<\/h1>/);
  assert.match(meetup, /<p class="circle-v52-page-intro__sub">Find your people\.<\/p>/);
  assert.match(quests, /<h1 id="questTitle">Missions<\/h1>/);
  assert.match(quests, /<p class="circle-v52-page-intro__sub">Do something worth finishing\.<\/p>/);
  assert.match(quests, /Move something forward—alone or together\./);
  assert.match(quests, /<h2 id="questListTitle">Quests<\/h2>/);
  assert.match(authority, /\.circle-v52-page-intro h1[\s\S]*font:\s*850 1\.08rem/);
});


test("Feed discovery has no redundant See all or empty-card Create meetup CTA", () => {
  assert.match(happening, /HAPPENING/);
  assert.match(happening, /Do something in real life/);
  assert.doesNotMatch(happening, />See all</);
  assert.doesNotMatch(happening, />Create a meetup</);
  assert.match(happening, /Nothing planned yet\./);
});


test("Feed loads current V5 without Profile compatibility presentation", () => {
  assert.match(feed, /id="ari-circle-v5-real-world-style"/);
  assert.doesNotMatch(feed, /ari-circle-v4\.css/);
  assert.doesNotMatch(feed, /ari-circle-v4-polish\.css/);
  assert.doesNotMatch(feed, /ari-circle-v4-ux-fixes\.css/);
  assert.doesNotMatch(feed, /js\/ari-circle\/v4-ui\.js/);
  const realWorldIndex = feed.indexOf('id="ari-circle-v5-real-world-style"');
  const authorityIndex = feed.indexOf("ari-circle-v5-visual-authority.css?v=5.2.5");
  assert.ok(realWorldIndex >= 0 && authorityIndex > realWorldIndex, "visual authority must load after the V5 base");
  assert.match(feed, /v5-real-world\.js\?v=5\.2\.4/);
});


test("primary Circle pages pin the adult-gated menu asset before shared bootstrap", () => {
  for (const html of [feed, meetup, quests]) {
    const menuIndex = html.indexOf('id="ariCircleMenuV5Script"');
    const configIndex = html.indexOf('src="supabase-config.js');
    assert.ok(menuIndex >= 0, "page should pin the shared Circle menu asset");
    assert.match(html, /circle-menu-v5\.js\?v=2\.4\.3/);
    assert.ok(configIndex >= 0, "page should still load shared Supabase bootstrap");
    assert.ok(menuIndex < configIndex, "deferred menu element must exist before supabase-config checks for it");
  }
});
