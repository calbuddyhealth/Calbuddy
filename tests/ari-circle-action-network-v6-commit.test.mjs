import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const source = await readFile(new URL("../js/ari-circle/v6/for-you-commit-v1.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-v6-commit.css", import.meta.url), "utf8");

test("For You commitment enhancer is isolated, valid browser JavaScript, and keeps Details available", () => {
  assert.doesNotThrow(() => new Function(source));
  assert.match(html, /for-you-commit-v1\.js\?v=1\.0\.0/);
  assert.match(html, /ari-circle-v6-commit\.css\?v=1\.0\.0/);
  assert.match(source, /openLink\.textContent = "Details"/);
  assert.match(source, /Join Mission/);
  assert.match(source, /Join \/ Request/);
});

test("commit re-reads fresh authenticated Action Network context at tap time", () => {
  assert.match(source, /fetch\("\/api\/ari-vnext-circle-context"/);
  assert.match(source, /Authorization: `Bearer \$\{token\}`/);
  assert.match(source, /surface: "circle_v6_for_you_commit"/);
  assert.match(source, /cache: "no-store"/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(source, /\b(?:supabase|client)\.from\s*\(/i);
});

test("commit fails closed when the rendered card no longer maps to exactly one current match", () => {
  assert.match(source, /matches\.length !== 1/);
  assert.match(source, /ambiguous_current_match/);
  assert.match(source, /recommendation_changed/);
  assert.match(source, /This recommendation changed\. Refreshing For You before any action is taken/);
  assert.match(source, /await refreshV6\(\);\s*return;/);
  assert.doesNotMatch(source, /matches\[0\]\s*\|\||find\(.*title/i);
});

test("only exact current Opportunity UUIDs reach guarded Meetup and Mission join authorities", () => {
  assert.match(source, /isUuid\(meetupId\)/);
  assert.match(source, /isUuid\(missionId\)/);
  assert.match(source, /ari_circle_apply_join_intent/);
  assert.match(source, /requested_meetup_id: meetupId/);
  assert.match(source, /ari_circle_join_quest/);
  assert.match(source, /requested_quest_id: missionId/);
  assert.doesNotMatch(source, /ari_circle_join_meetup/);
});

test("Meetup commitment preserves approval and waitlist semantics instead of assuming success", () => {
  for (const resolution of ["joined", "requested", "waitlisted", "already_joined", "already_host", "declined"]) {
    assert.match(source, new RegExp(`resolution === "${resolution}"`));
  }
  assert.match(source, /Request sent\. The host is the point of contact/);
  assert.match(source, /Added to the waitlist/);
});

test("already-committed or changed viewer state cannot be joined again from For You", () => {
  assert.match(source, /viewerState && viewerState !== "available"/);
  for (const state of ["joined", "host", "pending", "waitlisted", "creator", "submitted", "verified", "completed"]) {
    assert.match(source, new RegExp(`viewerState === "${state}"`));
  }
});

test("successful commitment invalidates shared Circle context and refreshes the integrated V6 surface", () => {
  assert.match(source, /new CustomEvent\("ari:circleChanged"/);
  assert.match(source, /source: "circle_v6_for_you_commit"/);
  assert.match(source, /await refreshV6\(\)/);
  assert.match(source, /api && typeof api\.refresh === "function"/);
});

test("commit controls preserve mobile touch targets and do not replace the detail path", () => {
  assert.match(css, /\.v6-commit-actions/);
  assert.match(css, /min-height:42px/);
  assert.match(css, /@media\(max-width:430px\)/);
  assert.match(css, /grid-template-columns:1fr 1fr/);
  assert.match(source, /v6-commit-details/);
});