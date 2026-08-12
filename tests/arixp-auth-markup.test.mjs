import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../signin.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/auth.css", import.meta.url), "utf8");

test("uses the approved ARI XP brand hierarchy", () => {
  assert.match(html, /ARTIFICIAL REASONING INTELLIGENCE/);
  assert.match(html, /aria-label="ARI XP"/);
  assert.match(html, /<p class="ari-experience-label">EXPERIENCE<\/p>/);
  assert.doesNotMatch(html, /ARI REBIRTH/i);
});

test("collects date of birth before personal signup details", () => {
  const ageStepIndex = html.indexOf('id="ageStep"');
  const displayNameIndex = html.indexOf('id="displayName"');
  const signupEmailIndex = html.indexOf('id="signupEmail"');

  assert.ok(ageStepIndex >= 0);
  assert.ok(ageStepIndex < displayNameIndex);
  assert.ok(ageStepIndex < signupEmailIndex);
});

test("keeps the authentication surface asset-free and pearl white", () => {
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(css, /url\([^)]*\.(png|jpe?g|svg)/i);
  assert.match(css, /--ari-pearl:\s*#fbfcff/i);
});

test("all public onboarding destinations exist", () => {
  const hrefs = [...html.matchAll(/href="(\/[^"#?]+\.html)"/g)]
    .map(match => match[1]);

  for (const href of hrefs) {
    assert.equal(
      fs.existsSync(new URL(`..${href}`, import.meta.url)),
      true,
      `${href} should exist`
    );
  }
});
