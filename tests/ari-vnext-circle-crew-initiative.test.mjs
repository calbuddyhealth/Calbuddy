import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ARI_INITIATIVE_ENGINE_VERSION,
  deriveInitiativeCandidate
} from "../api/_lib/ari-vnext/initiative-engine.js";

const loaderSource = await readFile(new URL("../api/_lib/ari-vnext/crew-initiative.js", import.meta.url), "utf8");
const combinedSource = await readFile(new URL("../api/_lib/ari-vnext/circle-event-initiative.js", import.meta.url), "utf8");
const engineSource = await readFile(new URL("../api/_lib/ari-vnext/initiative-engine.js", import.meta.url), "utf8");

const now = new Date("2026-08-25T20:30:00.000Z");
const candidateKey = "abcdef0123456789abcdef0123456789";

function crewState(overrides = {}) {
  return {
    available: true,
    source: "user_scoped_crew_candidates",
    items: [{
      candidateKey,
      memberCount: 4,
      completedTogether: 3,
      firstCompletedAt: "2026-07-20T18:00:00.000Z",
      lastCompletedAt: "2026-08-20T18:00:00.000Z",
      topActivity: "gym",
      members: [
        { displayName: "Me", handle: "me", isViewer: true },
        { displayName: "Marcus", handle: "marcus", isViewer: false },
        { displayName: "Jake", handle: "jake", isViewer: false },
        { displayName: "Sam", handle: "sam", isViewer: false }
      ],
      ...overrides
    }]
  };
}

test("Crew candidate initiative requires three verified repeated completions", () => {
  const result = deriveInitiativeCandidate({
    circleEvents: { available: true, items: [], crewCandidates: crewState() },
    now
  });

  assert.equal(ARI_INITIATIVE_ENGINE_VERSION, "1.3.0");
  assert.equal(result.shouldInitiate, true);
  assert.equal(result.candidate.source, "circle_crew_candidate");
  assert.equal(result.candidate.action, "review_crew_candidate");
  assert.equal(result.candidate.priority, "medium");
  assert.equal(result.candidate.cooldownHours, 720);
  assert.equal(result.candidate.crewCandidate.candidateKey, candidateKey);
  assert.equal(result.rules.crewCandidateRequiresThreeCompletions, true);
  assert.equal(result.rules.crewCandidateNeverAutoCreates, true);
});

test("two shared completions may qualify for Crew persistence but not proactive Crew suggestion", () => {
  const result = deriveInitiativeCandidate({
    circleEvents: { available: true, items: [], crewCandidates: crewState({ completedTogether: 2 }) },
    now
  });
  assert.equal(result.shouldInitiate, false);
});

test("stale repeated activity does not trigger a Crew suggestion", () => {
  const result = deriveInitiativeCandidate({
    circleEvents: {
      available: true,
      items: [],
      crewCandidates: crewState({ lastCompletedAt: "2026-06-01T12:00:00.000Z" })
    },
    now
  });
  assert.equal(result.shouldInitiate, false);
});

test("direct medium Circle state changes outrank Crew formation suggestions", () => {
  const result = deriveInitiativeCandidate({
    circleEvents: {
      available: true,
      crewCandidates: crewState(),
      items: [{
        eventId: "event-waitlist-1",
        type: "meetup.waitlisted",
        subjectId: "11111111-1111-4111-8111-111111111111",
        occurredAt: "2026-08-25T20:00:00.000Z",
        actor: { displayName: "Host" }
      }]
    },
    now
  });

  assert.equal(result.shouldInitiate, true);
  assert.equal(result.candidate.source, "circle_domain_event");
  assert.equal(result.candidate.action, "review_circle_status");
  assert.notEqual(result.candidate.source, "circle_crew_candidate");
});

test("Crew copy is neutral and avoids loneliness/scarcity/FOMO mechanics", () => {
  const result = deriveInitiativeCandidate({
    circleEvents: { available: true, items: [], crewCandidates: crewState() },
    now
  });
  const text = `${result.candidate.opener} ${result.candidate.followUpPrompt}`.toLowerCase();
  for (const forbidden of ["hurry", "last chance", "one spot left", "lonely", "alone", "don't miss", "limited time"]) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
  assert.match(text, /if you want/);
  assert.match(text, /before i decide/);
});

test("Crew initiative loader uses only user JWT guarded RPC access and strips raw member ids", () => {
  assert.match(loaderSource, /ari_circle_list_crew_candidates/);
  assert.match(loaderSource, /Authorization: `Bearer \$\{token\}`/);
  assert.match(loaderSource, /SUPABASE_ANON_KEY \|\| process\.env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(loaderSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(loaderSource, /\.from\s*\(/);
  assert.doesNotMatch(loaderSource, /member_ids\s*:/i);
  assert.doesNotMatch(loaderSource, /requested_candidate_key|ari_circle_create_crew|ari_circle_respond_crew_invite/i);
});

test("combined Circle initiative source keeps Crew candidacy separate from Domain Event vocabulary", () => {
  assert.match(combinedSource, /loadCoreCircleInitiativeEvents/);
  assert.match(combinedSource, /loadCrewInitiativeCandidates/);
  assert.match(combinedSource, /crewCandidatesUseSeparateGuardedRpc: true/);
  assert.match(combinedSource, /crewCandidateBrowserContextIsNotAuthority: true/);
  assert.match(combinedSource, /crewCandidateMutationAuthority: false/);
  assert.doesNotMatch(combinedSource, /crew\.candidate_detected/);
});

test("Crew initiative facade preserves mature initiative engine and forbids auto-creation", () => {
  assert.match(engineSource, /initiative-engine-core\.js/);
  assert.match(engineSource, /CREW_MIN_COMPLETIONS_FOR_INITIATIVE = 3/);
  assert.match(engineSource, /CREW_RECENCY_DAYS = 45/);
  assert.match(engineSource, /CREW_COOLDOWN_HOURS = 30 \* 24/);
  assert.match(engineSource, /crewCandidateNeverAutoCreates: true/);
  assert.match(engineSource, /crewCandidateCannotOverrideDirectHighOrMediumInitiative: true/);
  assert.doesNotMatch(engineSource, /ari_circle_create_crew|requested_operation_id|executeAction/);
});