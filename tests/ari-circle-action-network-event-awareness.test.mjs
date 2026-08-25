import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deriveEventAwareness, buildSituation } from "../api/ari-vnext-circle-context.js";

const source = await readFile(
  new URL("../api/ari-vnext-circle-context.js", import.meta.url),
  "utf8"
);

function event(overrides = {}) {
  return {
    eventId: overrides.eventId || crypto.randomUUID(),
    type: overrides.type || "meetup.accepted",
    subjectType: overrides.subjectType || "meetup",
    subjectId: overrides.subjectId || "meetup-1",
    actor: overrides.actor ?? { displayName: "Host", handle: "host" },
    actorIsViewer: overrides.actorIsViewer ?? false,
    metadata: overrides.metadata || {},
    occurredAt: overrides.occurredAt || "2026-08-25T18:00:00.000Z"
  };
}

test("Circle context reads bounded Domain Events with the signed-in user RPC path", () => {
  assert.match(source, /ari_circle_list_domain_events/i);
  assert.match(source, /requested_since: new Date\(Date\.now\(\) - 24 \* 60 \* 60 \* 1000\)\.toISOString\(\)/i);
  assert.match(source, /result_limit: MAX_DOMAIN_EVENTS/i);
  assert.match(source, /callOptionalActionNetworkRpc\(config, accessToken, "ari_circle_list_domain_events"/i);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE/i);
});

test("self-generated Circle actions remain context but cannot initiate", () => {
  const result = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.accepted", actorIsViewer: true })]
  });
  assert.equal(result.recentEvents.length, 1);
  assert.equal(result.actionableEvents.length, 0);
  assert.equal(result.recentEvents[0].initiativeEligible, false);
  assert.equal(result.recentEvents[0].relevanceReason, "self_generated_action");
});

test("host acceptance is a high-priority actionable state change for the applicant", () => {
  const result = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.accepted", actorIsViewer: false })]
  });
  assert.equal(result.actionableEvents.length, 1);
  assert.equal(result.actionableEvents[0].priority, "high");
  assert.equal(result.actionableEvents[0].relevanceReason, "host_accepted_request");
});

test("cancellation is actionable only when it came from someone else", () => {
  const participantView = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.cancelled", actorIsViewer: false })]
  });
  assert.equal(participantView.actionableEvents.length, 1);
  assert.equal(participantView.actionableEvents[0].priority, "high");

  const hostView = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.cancelled", actorIsViewer: true })]
  });
  assert.equal(hostView.actionableEvents.length, 0);
});

test("spot-opened cannot become initiative unless the Opportunity is a current match", () => {
  const unmatched = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.spot_opened", subjectId: "meetup-2", actor: null })],
    bestMatches: [{ id: "meetup-1" }]
  });
  assert.equal(unmatched.recentEvents.length, 0);
  assert.equal(unmatched.actionableEvents.length, 0);

  const matched = deriveEventAwareness({
    recentEvents: [event({ type: "meetup.spot_opened", subjectId: "meetup-2", actor: null })],
    bestMatches: [{ id: "meetup-2" }]
  });
  assert.equal(matched.actionableEvents.length, 1);
  assert.equal(matched.actionableEvents[0].relevanceReason, "matched_opportunity_spot_opened");
});

test("generic Meetup/Mission creation never initiates even when it is a current match", () => {
  for (const type of ["meetup.created", "mission.created"]) {
    const result = deriveEventAwareness({
      recentEvents: [event({ type, subjectId: "new-1", actorIsViewer: false })],
      bestMatches: [{ id: "new-1" }]
    });
    assert.equal(result.recentEvents.length, 1);
    assert.equal(result.actionableEvents.length, 0);
    assert.equal(result.recentEvents[0].initiativeEligible, false);
    assert.equal(result.recentEvents[0].relevanceReason, "new_matched_opportunity");
  }
});

test("Mission verification/rejection/objective changes are meaningful but user actions are suppressed", () => {
  const verified = deriveEventAwareness({ recentEvents: [event({ type: "mission.progress_verified" })] });
  assert.equal(verified.actionableEvents[0].priority, "positive");

  const rejected = deriveEventAwareness({ recentEvents: [event({ type: "mission.progress_rejected" })] });
  assert.equal(rejected.actionableEvents[0].priority, "medium");

  const reached = deriveEventAwareness({ recentEvents: [event({ type: "mission.objective_reached", actor: null })] });
  assert.equal(reached.actionableEvents[0].priority, "positive");

  const mySubmission = deriveEventAwareness({ recentEvents: [event({ type: "mission.progress_submitted", actorIsViewer: true })] });
  assert.equal(mySubmission.actionableEvents.length, 0);
});

test("event awareness deduplicates by event id and applies deterministic priority ordering", () => {
  const duplicateId = "event-1";
  const result = deriveEventAwareness({
    recentEvents: [
      event({ eventId: duplicateId, type: "mission.progress_verified", occurredAt: "2026-08-25T19:00:00Z" }),
      event({ eventId: duplicateId, type: "mission.progress_verified", occurredAt: "2026-08-25T19:00:00Z" }),
      event({ eventId: "event-2", type: "meetup.accepted", occurredAt: "2026-08-25T18:00:00Z" })
    ]
  });
  assert.equal(result.recentEvents.length, 2);
  assert.equal(result.actionableEvents[0].type, "meetup.accepted");
  assert.equal(result.actionableEvents[1].type, "mission.progress_verified");
});

test("Circle situation includes bounded event counts and separate actionable events", () => {
  const situation = buildSituation({
    recentEvents: Array.from({ length: 20 }, (_, index) => event({ eventId: `recent-${index}` })),
    actionableEvents: Array.from({ length: 10 }, (_, index) => event({ eventId: `action-${index}` }))
  });
  assert.equal(situation.summary.recentEventCount, 20);
  assert.equal(situation.summary.actionableEventCount, 10);
  assert.equal(situation.recentEvents.length, 8);
  assert.equal(situation.actionableEvents.length, 5);
});

test("event metadata is whitelisted again at the Ari boundary", () => {
  assert.match(source, /function safeEventMetadata/i);
  for (const allowed of ["request_status", "spots_remaining", "contribution_amount", "unit"]) {
    assert.match(source, new RegExp(allowed, "i"));
  }
  for (const forbidden of [
    "meeting_point",
    "approximate_latitude",
    "approximate_longitude",
    "proof_note",
    "message_body",
    "payment",
    "premium"
  ]) {
    assert.doesNotMatch(source.match(/function safeEventMetadata[\s\S]*?\n}\n/)?.[0] || "", new RegExp(forbidden, "i"));
  }
  assert.match(source, /rawDomainEventMetadataIncluded: false/i);
  assert.match(source, /domainEventsPersistedAsAriMemory: false/i);
});

test("JWT subject is presentation-only and Circle authorization still comes from user-scoped RPCs", () => {
  assert.match(source, /const viewerId = jwtSubject\(accessToken\)/i);
  assert.match(source, /actorIsViewer: Boolean\(viewerId && actorUserId && viewerId === actorUserId\)/i);
  assert.match(source, /Uses the signed-in user's JWT for every Circle RPC/i);
  assert.match(source, /No service-role fallback/i);
});
