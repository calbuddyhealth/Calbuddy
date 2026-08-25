import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { deriveInitiativeCandidate } from "../api/_lib/ari-vnext/initiative-engine.js";
import { compactDirectEvent, compactMatchedSpotEvent } from "../api/_lib/ari-vnext/circle-event-initiative.js";

const loaderSource = await readFile(
  new URL("../api/_lib/ari-vnext/circle-event-initiative.js", import.meta.url),
  "utf8"
);
const endpointSource = await readFile(
  new URL("../api/ari-vnext-initiative.js", import.meta.url),
  "utf8"
);

const NOW = new Date("2026-08-25T19:30:00.000Z");

function circleEvent(type, overrides = {}) {
  return {
    eventId: overrides.eventId || `event-${type}`,
    type,
    subjectType: type.startsWith("mission.") ? "mission" : "meetup",
    subjectId: overrides.subjectId || "subject-1",
    actor: overrides.actor ?? { displayName: "Marcus", handle: "marcus" },
    metadata: overrides.metadata || {},
    matchReasons: overrides.matchReasons || [],
    occurredAt: overrides.occurredAt || "2026-08-25T19:00:00.000Z"
  };
}

test("initiative endpoint independently loads Circle events with authenticated server state", () => {
  assert.match(endpointSource, /loadCircleInitiativeEvents\(\{ accessToken: auth\.accessToken, userId: auth\.userId/i);
  assert.match(endpointSource, /return \{ authenticated: true, userId, accessToken \}/i);
  assert.match(endpointSource, /circleEvents,/i);
  assert.match(endpointSource, /deriveInitiativeCandidate\(\{[\s\S]*?circleEvents,/i);
  assert.doesNotMatch(endpointSource, /body\?\.circleEvents|context\?\.circleEvents/i);
});

test("Circle initiative loader never falls back to service role and uses bounded server RPCs", () => {
  assert.match(loaderSource, /ari_circle_list_domain_events/i);
  assert.match(loaderSource, /ari_circle_list_my_action_intents/i);
  assert.match(loaderSource, /ari_circle_match_opportunities/i);
  assert.match(loaderSource, /SUPABASE_ANON_KEY \|\| process\.env\.SUPABASE_PUBLISHABLE_KEY/i);
  assert.doesNotMatch(loaderSource, /SUPABASE_SERVICE_ROLE_KEY/i);
  assert.match(loaderSource, /12 \* 60 \* 60 \* 1000/i);
  assert.match(loaderSource, /matchedSpotOpenServerGrounded: true/i);
  assert.match(loaderSource, /matchedSpotRequiresAvailableViewerState: true/i);
  assert.match(loaderSource, /noClientSuppliedEventAuthority: true/i);
  assert.match(loaderSource, /noMutationAuthority: true/i);
});

test("direct initiative path admits only direct coordination facts", () => {
  for (const type of [
    "meetup.accepted",
    "meetup.cancelled",
    "meetup.waitlisted",
    "meetup.declined",
    "mission.progress_verified",
    "mission.progress_rejected",
    "mission.objective_reached"
  ]) {
    const row = compactDirectEvent({
      event_id: `id-${type}`,
      event_type: type,
      subject_type: type.startsWith("mission.") ? "mission" : "meetup",
      subject_id: "subject-1",
      actor_user_id: type === "mission.objective_reached" ? null : "other-user",
      actor_display_name: "Marcus",
      actor_handle: "marcus",
      metadata: {},
      occurred_at: NOW.toISOString()
    }, "viewer-user");
    assert.ok(row, `${type} should be admitted`);
  }

  for (const type of ["meetup.created", "mission.created", "meetup.spot_opened", "meetup.joined", "meetup.requested"]) {
    const row = compactDirectEvent({
      event_id: `id-${type}`,
      event_type: type,
      subject_type: "meetup",
      subject_id: "subject-1",
      actor_user_id: "other-user",
      occurred_at: NOW.toISOString()
    }, "viewer-user");
    assert.equal(row, null, `${type} must stay out of the direct initiative path`);
  }
});

test("spot-open initiative requires a server Match Engine result for the same available Meetup", () => {
  const eventRow = {
    event_id: "spot-1",
    event_type: "meetup.spot_opened",
    subject_type: "meetup",
    subject_id: "meetup-1",
    actor_user_id: null,
    metadata: { spots_remaining: 1 },
    occurred_at: NOW.toISOString()
  };
  const matched = compactMatchedSpotEvent(eventRow, "viewer-user", {
    opportunity_type: "meetup",
    opportunity_id: "meetup-1",
    viewer_state: "available",
    match_score: 92,
    match_reasons: ["Matches the activity you want", "Starts inside your available time window"]
  });
  assert.ok(matched);
  assert.equal(matched.type, "meetup.spot_opened");
  assert.deepEqual(matched.metadata, { spotsRemaining: 1 });
  assert.deepEqual(matched.matchReasons, [
    "Matches the activity you want",
    "Starts inside your available time window"
  ]);

  assert.equal(compactMatchedSpotEvent(eventRow, "viewer-user", {
    opportunity_type: "meetup",
    opportunity_id: "different-meetup",
    viewer_state: "available"
  }), null);
  assert.equal(compactMatchedSpotEvent(eventRow, "viewer-user", {
    opportunity_type: "meetup",
    opportunity_id: "meetup-1",
    viewer_state: "joined"
  }), null);
});

test("server-matched spot opening becomes useful initiative without scarcity bait", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: {
      items: [circleEvent("meetup.spot_opened", {
        metadata: { spotsRemaining: 1 },
        matchReasons: ["Matches the activity you want", "Fits your preferred group size"]
      })]
    },
    proactiveInsights: { items: [] },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.shouldInitiate, true);
  assert.equal(state.candidate.source, "circle_domain_event");
  assert.equal(state.candidate.priority, "medium");
  assert.equal(state.candidate.action, "review_matched_circle_spot");
  assert.match(state.candidate.opener, /matches what you're looking for/i);
  assert.doesNotMatch(state.candidate.opener, /one spot left|hurry|act now|last chance/i);
  assert.match(state.candidate.context, /Matches the activity you want/i);
});

test("self-generated direct events are suppressed before the initiative engine", () => {
  const row = compactDirectEvent({
    event_id: "accepted-self",
    event_type: "meetup.accepted",
    subject_type: "meetup",
    subject_id: "m1",
    actor_user_id: "viewer-user",
    actor_display_name: "Viewer",
    occurred_at: NOW.toISOString()
  }, "viewer-user");
  assert.equal(row, null);
});

test("Circle event metadata is whitelisted again inside proactive loader", () => {
  const row = compactDirectEvent({
    event_id: "verified-1",
    event_type: "mission.progress_verified",
    subject_type: "mission",
    subject_id: "mission-1",
    actor_user_id: "reviewer-1",
    metadata: {
      contribution_amount: 3,
      unit: "miles",
      proof_note: "private evidence",
      meeting_point: "private location",
      message: "private message"
    },
    occurred_at: NOW.toISOString()
  }, "viewer-user");
  assert.deepEqual(row.metadata, { contributionAmount: 3, unit: "miles" });
});

test("host acceptance becomes a high-priority deterministic initiative", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: { items: [circleEvent("meetup.accepted")] },
    proactiveInsights: { items: [] },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.shouldInitiate, true);
  assert.equal(state.candidate.source, "circle_domain_event");
  assert.equal(state.candidate.priority, "high");
  assert.equal(state.candidate.action, "review_circle_schedule");
  assert.match(state.candidate.opener, /accepted your meetup request/i);
  assert.equal(state.candidate.requiresLanguageModelCall, false);
});

test("direct Circle fact can outrank a lower-confidence high training inference", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: { items: [circleEvent("meetup.cancelled")] },
    proactiveInsights: {
      items: [{
        id: "broad_performance_regression",
        priority: "high",
        confidence: 0.84,
        domain: "training",
        reason: "three lifts down",
        trigger: "three_or_more_comparable_down_trends"
      }]
    },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.candidate.source, "circle_domain_event");
  assert.equal(state.candidate.action, "find_circle_replacement");
});

test("Mission rejection initiative explicitly refuses to invent a rejection reason", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: { items: [circleEvent("mission.progress_rejected")] },
    relationshipContinuity: { unfinishedThreads: [] },
    proactiveInsights: { items: [] },
    now: NOW
  });
  assert.match(state.candidate.followUpPrompt, /without guessing why it was rejected/i);
});

test("Mission completion is positive rather than urgency bait", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: { items: [circleEvent("mission.objective_reached", { actor: null })] },
    relationshipContinuity: { unfinishedThreads: [] },
    proactiveInsights: { items: [] },
    now: NOW
  });
  assert.equal(state.candidate.priority, "positive");
  assert.equal(state.candidate.action, "review_mission_completion");
});

test("initiative rules preserve anti-engagement constraints for Circle", () => {
  const state = deriveInitiativeCandidate({
    circleEvents: { items: [circleEvent("meetup.accepted")] },
    relationshipContinuity: { unfinishedThreads: [] },
    proactiveInsights: { items: [] },
    now: NOW
  });
  assert.equal(state.rules.noEngagementBait, true);
  assert.equal(state.rules.circleEventsMustBeServerGrounded, true);
  assert.equal(state.rules.matchedSpotOpenRequiresServerMatch, true);
  assert.equal(state.rules.noGenericCircleCreationInitiative, true);
  assert.equal(state.rules.noCircleMutationFromInitiative, true);
});

test("initiative API reports only compact Circle event state, not raw event rows", () => {
  assert.match(endpointSource, /function compactCircleEventState/i);
  assert.match(endpointSource, /clientSuppliedEventAuthority: false/i);
  assert.match(endpointSource, /mutationAuthority: false/i);
  assert.doesNotMatch(endpointSource.match(/function compactCircleEventState[\s\S]*?\n}/)?.[0] || "", /items|eventId|subjectId|actor/);
});
