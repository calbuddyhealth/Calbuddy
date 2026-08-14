import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const customerPages = [
  "account.html",
  "ari-preference-settings.html",
  "community-guidelines.html",
  "help-safety.html",
  "identity.html",
  "notification-settings.html",
  "owner-moderation.html",
  "privacy-memory.html",
  "profile.html",
  "support-ari.html"
];

test("customer-facing account and settings pages use ARI XP branding", async () => {
  for (const path of customerPages) {
    const html = await readFile(new URL(`../${path}`, import.meta.url), "utf8");

    assert.doesNotMatch(
      html,
      /aria-label=["'](?:Ari|ARI) Rebirth/i,
      `${path} still exposes ARI Rebirth in an accessibility label`
    );

    assert.doesNotMatch(
      html,
      />\s*REBIRTH\s*</i,
      `${path} still renders REBIRTH to the user`
    );

    assert.doesNotMatch(
      html,
      /<title>[^<]*ARI Rebirth/i,
      `${path} still exposes ARI Rebirth in the page title`
    );
  }
});

test("active Ari preferences surface uses ARI XP / EXPERIENCE branding", async () => {
  const html = await readFile(
    new URL("../ari-preference-settings.html", import.meta.url),
    "utf8"
  );

  assert.match(html, /<title>Personalize Ari \| ARI XP<\/title>/);
  assert.match(html, /aria-label="ARI XP"/);
  assert.match(html, />\s*EXPERIENCE\s*</);
});
