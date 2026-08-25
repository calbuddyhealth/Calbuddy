import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildSituation, deriveEventAwareness } from "../api/ari-vnext-circle-context.js";

const source = await readFile(
  new URL("../api/ari-vnext-circle-context.js", import.meta.url),
  "utf8"
);

test("Ari Crew awareness reads only guarded caller-scoped RPC projections", () => {
  assert.match(source, /const VERSION = "1\.5\.0"/i);
  assert.match(source, /callOptionalActionNetworkRpc\(config, accessToken, "ari_circle_list_my_crews"/i);
  assert.match(source, /callOptionalActionNetworkRpc\(config, accessToken, "ari_circle_list_crew_candidates"/i);
  assert.match(source, /SUPABASE_ANON_KEY \|\| process\.env\.SUPABASE_PUBLISHABLE_KEY/i);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/i);
  assert.doesNotMatch(source, /from\s+public\.ari_circle_crews|from\s+public\.ari_circle_crew_members/i);
});

test("Crew candidate model context deliberately drops raw founding member IDs", () => {
  const candidateFunction = source.match(/function compactCrewCandidate\([\s\S]*?\n}\n\nfunction compactCrewMember/)?.[0] || "";
  assert.match(candidateFunction, /candidateKey/i);
  assert.match(candidateFunction, /completedTogether/i);
  assert.match(candidateFunction, /topActivity/i);
  assert.match(candidateFunction, /members/i);
  assert.doesNotMatch(candidateFunction, /member_ids|memberIds|user_id|userId/i);
  assert.match(source, /rawCandidateMemberIdsIncluded: false/i);
  assert.match(source, /rawCrewCandidateMemberIdsIncluded: false/i);
});

test("Crew member compaction exposes identity labels but not raw user IDs", () => {
  const memberFunction = source.match(/function compactCrewMember\([\s\S]*?\n}\n\nfunction compactDomainEvent/)?.[0] || "";
  assert.match(memberFunction, /displayName/i);
  assert.match(memberFunction, /handle/i);
  assert.match(memberFunction, /role/i);
  assert.match(memberFunction, /status/i);
  assert.match(memberFunction, /isViewer/i);
  assert.doesNotMatch(memberFunction, /user_id|userId/i);
});

test("situation summary makes Crew state useful without turning it into engagement scoring", () => {
  const situation = buildSituation({
    crews: [
      { crewId: "c1", status: "active", viewerStatus: "active" },
      { crewId: "c2", status: "forming", viewerStatus: "invited" }
    ],
    crewCandidates: [
      { candidateKey: "a", completedTogether: 2 },
      { candidateKey: "b", completedTogether: 3 }
    ]
  });
  assert.equal(situation.summary.crewCount, 2);
  assert.equal(situation.summary.activeCrewCount, 1);
  assert.equal(situation.summary.crewInviteCount, 1);
  assert.equal(situation.summary.crewCandidateCount, 2);
  assert.equal(situation.crews.length, 2);
  assert.equal(situation.crewCandidates.length, 2);
});

test("Crew events enter recent context but are not proactive initiative authority in this layer", () => {
  const awareness = deriveEventAwareness({
    recentEvents: [
      { eventId: "e1", type: "crew.invited", subjectId: "c1", actorIsViewer: false, occurredAt: "2026-08-25T19:00:00Z" },
      { eventId: "e2", type: "crew.activated", subjectId: "c1", actorIsViewer: false, occurredAt: "2026-08-25T18:00:00Z" },
      { eventId: "e3", type: "crew.joined", subjectId: "c1", actorIsViewer: false, occurredAt: "2026-08-25T17:00:00Z" }
    ],
    bestMatches: [],
    opportunities: []
  });
  assert.equal(awareness.recentEvents.length, 3);
  assert.equal(awareness.actionableEvents.length, 0);
  const invite = awareness.recentEvents.find((event) => event.type === "crew.invited");
  assert.equal(invite.priority, "high");
  assert.equal(invite.initiativeEligible, false);
  assert.equal(invite.relevanceReason, "crew_invitation_received");
});

test("Crew event metadata is re-whitelisted at the Ari boundary", () => {
  assert.match(source, /const crewStatus = clean\(source\?\.crew_status, 30\)/i);
  assert.match(source, /const memberStatus = clean\(source\?\.member_status, 30\)/i);
  const metadataFunction = source.match(/function safeEventMetadata\([\s\S]*?\n}\n\nfunction dedupeMatches/)?.[0] || "";
  for (const forbidden of ["meeting_point", "latitude", "longitude", "message", "proof_note", "email", "phone", "premium", "payment", "popularity", "engagement"]) {
    assert.doesNotMatch(metadataFunction, new RegExp(forbidden, "i"));
  }
});

test("Crew awareness explicitly rejects public/arbitrary group discovery and mutation authority", () => {
  assert.match(source, /publicCrewDiscoveryIncluded: false/i);
  assert.match(source, /arbitraryGroupSuggestionsIncluded: false/i);
  assert.match(source, /crewCreationAuthorityIncluded: false/i);
  assert.match(source, /candidateEvidenceMinimumCompletions: 2/i);
  assert.match(source, /crewLifecycleContextOnlyUntilDedicatedInitiativeGate: true/i);
});
