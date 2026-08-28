import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const ownerBootstrap = await readFile(new URL("../js/ari-circle/v6/ari-next-owner-beta-v1.js", import.meta.url), "utf8");
const source = await readFile(new URL("../js/ari-circle/v6/for-you-commit-v1.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-v6-commit.css", import.meta.url), "utf8");

test("For You commitment enhancer is isolated, valid browser JavaScript, and keeps Details available", () => {
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /const VERSION = "1\.1\.0"/);
  assert.match(html, /ari-next-owner-beta-v1\.js\?v=1\.0\.0/);
  assert.match(ownerBootstrap, /for-you-commit-v1\.js\?v=1\.1\.0/);
  assert.doesNotMatch(html, /<script[^>]+for-you-commit-v1\.js\?v=1\.1\.0/i);
  assert.match(html, /ari-circle-v6-commit\.css\?v=1\.0\.0/);
  assert.match(source, /openLink\.textContent = "Details"/);
  assert.match(source, /Join Mission/);
  assert.match(source, /Join \/ Request/);
});

test("rendered For You cards are bound to UUIDs from the exact context that rendered them", () => {
  assert.match(source, /const context = await api\.refresh\(\);/);
  assert.match(source, /bindCardIdentities\(context\);/);
  assert.match(source, /const rows = \(Array\.isArray\(context\?\.bestMatches\)/);
  assert.match(source, /const item = rows\[index\];/);
  assert.match(source, /itemType !== identity\.type \|\| itemTitle !== identity\.title/);
  assert.match(source, /card\.dataset\.v6OpportunityId = itemId/);
  assert.match(source, /if \(!isUuid\(card\?\.dataset\?\.v6OpportunityId\)\) return;/);
});

test("commit re-reads fresh authenticated Action Network context at tap time", () => {
  assert.match(source, /fetch\("\/api\/ari-vnext-circle-context"/);
  assert.match(source, /Authorization: `Bearer \$\{token\}`/);
  assert.match(source, /surface: "circle_v6_for_you_commit"/);
  assert.match(source, /cache: "no-store"/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(source, /\b(?:supabase|client)\.from\s*\(/i);
});

test("tap-time resolution requires the same render-bound Opportunity UUID to still be a current match", () => {
  assert.match(source, /const opportunityId = clean\(card\?\.dataset\?\.v6OpportunityId, 120\)/);
  assert.match(source, /!isUuid\(identity\.opportunityId\)/);
  assert.match(source, /\.filter\(\(item\) => clean\(item\?\.id, 120\) === identity\.opportunityId\)/);
  assert.match(source, /\.filter\(\(item\) => clean\(item\?\.type, 30\)\.toLowerCase\(\) === identity\.type\)/);
  assert.match(source, /\.filter\(\(item\) => clean\(item\?\.title, 120\) === identity\.title\)/);
  assert.match(source, /matches\.length !== 1/);
  assert.match(source, /recommendation_changed/);
  assert.match(source, /This recommendation changed\. Refreshing For You before any action is taken/);
  assert.match(source, /await refreshV6\(\);\s*return;/);
});

test("a stale card cannot switch authority to a different Opportunity that happens to reuse its title", () => {
  const resolver = source.match(/function resolveFreshOpportunity\([\s\S]*?\n  }\n\n  function decorateCards/)?.[0] || "";
  const idFilter = resolver.indexOf("identity.opportunityId");
  const titleFilter = resolver.indexOf("identity.title", idFilter + 1);
  assert.ok(idFilter >= 0, "resolver must require the bound UUID");
  assert.ok(titleFilter > idFilter, "title may only corroborate identity after UUID authority exists");
  assert.doesNotMatch(resolver, /find\(.*title|matches\[0\]\s*\|\|/i);
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

test("V6 rerenders resynchronize UUID binding before restoring commit controls", () => {
  assert.match(source, /new MutationObserver\(scheduleSync\)/);
  assert.match(source, /some\(\(card\) => !isUuid\(card\?\.dataset\?\.v6OpportunityId\)\)/);
  assert.match(source, /await refreshV6\(\)/);
  assert.match(source, /state\.syncing/);
  assert.match(source, /state\.syncQueued/);
});

test("successful commitment invalidates shared Circle context and refreshes the integrated V6 surface", () => {
  assert.match(source, /new CustomEvent\("ari:circleChanged"/);
  assert.match(source, /source: "circle_v6_for_you_commit"/);
  assert.match(source, /const context = await api\.refresh\(\);/);
  assert.match(source, /bindCardIdentities\(context\);\s*decorateCards\(\);/);
});

test("commit controls preserve mobile touch targets and do not replace the detail path", () => {
  assert.match(css, /\.v6-commit-actions/);
  assert.match(css, /min-height:42px/);
  assert.match(css, /@media\(max-width:430px\)/);
  assert.match(css, /grid-template-columns:1fr 1fr/);
  assert.match(source, /v6-commit-details/);
});
