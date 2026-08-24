import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const pearl = fs.readFileSync(new URL("../assets/css/ari-circle-v5-pearl.css", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const quests = fs.readFileSync(new URL("../ari-circle-quests.html", import.meta.url), "utf8");

test("Circle V5.1 defaults the primary social surfaces to Pearl light mode", () => {
  assert.match(pearl, /--circle51-bg:\s*#f5f7fb/);
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(pearl, /--circle51-text:\s*#101828/);
  assert.match(pearl, /color-scheme:\s*light\s*!important/);
  for (const html of [feed, meetup, quests]) {
    assert.match(html, /ari-circle-v5-pearl\.css\?v=5\.1\.0/);
  }
  assert.match(meetup, /meta name="theme-color" content="#f5f7fb"/);
  assert.match(quests, /meta name="theme-color" content="#f5f7fb"/);
});

test("Halo header is one shared cosmetic layer with no new data request", () => {
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-orbit-mark/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.match(shell, /YOUR CIRCLE/);
  assert.match(shell, /FIND YOUR PEOPLE/);
  assert.match(shell, /DO SOMETHING TOGETHER/);
  assert.doesNotMatch(shell, /\.rpc\s*\(/);
  assert.doesNotMatch(shell, /\.from\s*\(/);
  assert.doesNotMatch(shell, /fetch\s*\(/);
});

test("Halo motion is bounded and never becomes a continuous animation loop", () => {
  assert.match(shell, /HALO_SEEN_KEY/);
  assert.match(shell, /sessionStorage\.getItem\(HALO_SEEN_KEY\)/);
  assert.doesNotMatch(shell, /setInterval\s*\(/);
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.match(pearl, /animation:\s*circle51HaloIn 620ms/);
  assert.match(pearl, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(pearl, /animation:\s*[^;]*infinite/);
});

test("Pearl cards do not stack backdrop blur while header and dock may use it", () => {
  assert.match(pearl, /\.circle-v5-card,[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(pearl, /\.circle-v51-halo-header[\s\S]*backdrop-filter:\s*blur\(18px\)/);
  assert.match(pearl, /\.circle-v5-bottom-nav__dock[\s\S]*backdrop-filter:\s*blur\(18px\)/);
});

test("primary Circle pages pin the new adult-gated menu asset before shared bootstrap", () => {
  for (const html of [feed, meetup, quests]) {
    const menuIndex = html.indexOf('id="ariCircleMenuV5Script"');
    const configIndex = html.indexOf('src="supabase-config.js');
    assert.ok(menuIndex >= 0, "page should pin the V5.1 Circle menu asset");
    assert.ok(configIndex >= 0, "page should still load shared Supabase bootstrap");
    assert.ok(menuIndex < configIndex, "deferred menu element must exist before supabase-config checks for it");
  }
});
