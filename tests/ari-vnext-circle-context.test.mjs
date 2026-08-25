import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildRelevantContext, routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { buildSituation } from "../api/ari-vnext-circle-context.js";

const endpointSource = await readFile(new URL("../api/ari-vnext-circle-context.js", import.meta.url), "utf8");
const guardSource = await readFile(new URL("../ari/vnext/ari-vnext-context-guard.js", import.meta.url), "utf8");
const routerSource = await readFile(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url), "utf8");

test("Circle context endpoint executes guarded RPCs with the signed-in JWT and no service-role fallback", () => {
  assert.match(endpointSource, /Authorization:\s*`Bearer \$\{accessToken\}`/);
  assert.match(endpointSource, /ari_circle_my_age_state/);
  assert.match(endpointSource, /ari_circle_list_opportunities/);
  assert.match(endpointSource, /ari_circle_list_my_action_intents/);
  assert.match(endpointSource, /ari_circle_match_opportunities/);
  assert.match(endpointSource, /ari_circle_list_action_relationships/);
  assert.match(endpointSource, /SUPABASE_ANON_KEY \|\| process\.env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(endpointSource, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Circle context packet excludes private meetup, message, coordinate, feed, Mission proof, and durable social-learning surfaces", () => {
  assert.match(endpointSource, /exactMeetingPointsIncluded:\s*false/);
  assert.match(endpointSource, /directMessagesIncluded:\s*false/);
  assert.match(endpointSource, /rawCoordinatesIncluded:\s*false/);
  assert.match(endpointSource, /rawFeedContentIncluded:\s*false/);
  assert.match(endpointSource, /durableSocialLearningIncluded:\s*false/);
  assert.match(endpointSource, /missionProofNotesIncluded:\s*false/);
  assert.match(endpointSource, /missionReviewerIdentitiesIncluded:\s*false/);
  assert.doesNotMatch(endpointSource, /row\?\.meeting_point/);
  assert.doesNotMatch(endpointSource, /row\?\.approximate_latitude/);
  assert.doesNotMatch(endpointSource, /row\?\.approximate_longitude/);
  assert.doesNotMatch(endpointSource, /ari_circle_list_meetup_messages/);
  assert.doesNotMatch(endpointSource, /proof_note/);
  assert.doesNotMatch(endpointSource, /verified_by/);
});

test("vNext context guard hydrates Action Network only for relevant turns and fails soft", () => {
  assert.match(guardSource, /needsCircleActionContext/);
  assert.match(guardSource, /\/api\/ari-vnext-circle-context/);
  assert.match(guardSource, /actionNetwork/);
  assert.match(guardSource, /Circle context read skipped/);
  assert.match(guardSource, /CIRCLE_CONTEXT_TTL_MS = 15 \* 1000/);
  assert.doesNotMatch(guardSource, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("natural Action Network language routes through social context", () => {
  for (const message of [
    "Any meetups tonight?",
    "What missions are active?",
    "Show me my crew opportunities",
    "Any open spots?",
    "Find a workout partner"
  ]) {
    assert.equal(routeContext({ message }).social, true, message);
  }

  const hydrated = routeContext({
    message: "Anything going on tonight?",
    context: { social: { actionNetwork: { available: true } } }
  });
  assert.equal(hydrated.social, true);
});

test("Action Network packet is included in model context without becoming mutation authority", () => {
  const packet = {
    available: true,
    bestMatches: [{ key: "meetup:1", title: "Chest after work", matchScore: 85 }],
    relationships: [{ userId: "u-2", displayName: "Marcus", completedTogether: 3, topActivity: "gym" }],
    privacy: { exactMeetingPointsIncluded: false, durableSocialLearningIncluded: false }
  };
  const context = buildRelevantContext({
    surface: "/home.html",
    context: { social: { actionNetwork: packet } }
  }, { social: true });

  assert.deepEqual(context.social.actionNetwork, packet);
  assert.match(routerSource, /This context does not authorize a mutation/);
  assert.match(routerSource, /Never claim that Ari joined, hosted, cancelled, messaged, accepted, or changed Circle state/);
});

test("Ari Circle context keeps safe Mission objective and progress fields only", () => {
  for (const field of [
    "objectiveType",
    "progressMode",
    "targetValue",
    "unit",
    "verifiedProgress",
    "viewerVerifiedProgress",
    "viewerPendingProgress",
    "progressPercent",
    "objectiveReachedAt"
  ]) {
    assert.match(endpointSource, new RegExp(`\\b${field}\\b`));
  }
  assert.match(endpointSource, /const mission = type === "mission"/);
  assert.match(endpointSource, /missionProofNotesIncluded:\s*false/);
  assert.match(endpointSource, /missionReviewerIdentitiesIncluded:\s*false/);
});

test("Circle situation summarizes schedules, host requests, verified repeat relationships, and metric Missions without inventing state", () => {
  const situation = buildSituation({
    opportunities: [
      { key: "meetup:1", viewerState: "host", pendingRequestCount: 3 },
      { key: "meetup:2", viewerState: "joined", pendingRequestCount: null },
      {
        key: "mission:1",
        type: "mission",
        viewerState: "joined",
        pendingRequestCount: null,
        mission: {
          objectiveType: "distance",
          progressMode: "collective",
          targetValue: 100,
          unit: "miles",
          verifiedProgress: 42,
          progressPercent: 42
        }
      },
      {
        key: "mission:2",
        type: "mission",
        viewerState: "available",
        pendingRequestCount: null,
        mission: { objectiveType: "completion", progressMode: "individual" }
      }
    ],
    activeIntents: [{ intentId: "intent-1", activity: "gym" }],
    bestMatches: [{ key: "meetup:3", matchScore: 90 }],
    relationships: [
      { userId: "u-2", completedTogether: 3, topActivity: "gym" },
      { userId: "u-3", completedTogether: 1, topActivity: "walking" }
    ]
  });

  assert.equal(situation.summary.opportunityCount, 4);
  assert.equal(situation.summary.activeIntentCount, 1);
  assert.equal(situation.summary.bestMatchCount, 1);
  assert.equal(situation.summary.scheduledCount, 3);
  assert.equal(situation.summary.hostPendingRequestCount, 3);
  assert.equal(situation.summary.relationshipCount, 2);
  assert.equal(situation.summary.repeatRelationshipCount, 1);
  assert.equal(situation.summary.activeMetricMissionCount, 1);
  assert.equal(situation.relationships[0].completedTogether, 3);
});
