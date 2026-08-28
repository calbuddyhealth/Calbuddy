import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";

const adapter = await readFile(new URL("../ari/vnext/ari-vnext-circle-action-adapter.js", import.meta.url), "utf8");
const wrappers = await readFile(new URL("../supabase/migrations/20260825113000_ari_circle_action_network_agent_actions_v1.sql", import.meta.url), "utf8");
const circleV5Migration = await readFile(new URL("../supabase/migrations/20260824054500_ari_circle_v5_real_world_social.sql", import.meta.url), "utf8");
const missionMigration = await readFile(new URL("../supabase/migrations/20260825133000_ari_circle_mission_v2.sql", import.meta.url), "utf8");
const guard = await readFile(new URL("../ari/vnext/ari-vnext-context-guard.js", import.meta.url), "utf8");
const verifier = await readFile(new URL("../api/_lib/ari-vnext/action-intent-verifier.js", import.meta.url), "utf8");

const adultCircleRoute = {
  social: true,
  circleAllowed: true,
  teenMode: false,
  nutrition: false,
  training: false,
  goals: false
};

const meetupId = "11111111-1111-4111-8111-111111111111";
const missionId = "22222222-2222-4222-8222-222222222222";
const futureEnd = (days = 2) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

test("Circle lifecycle tools require server-derived adult Circle entitlement", () => {
  const adultTools = getAriTools(adultCircleRoute).map((tool) => tool.name);
  for (const name of [
    "propose_create_circle_meetup",
    "propose_join_circle_meetup",
    "propose_leave_circle_meetup",
    "propose_cancel_circle_meetup",
    "propose_create_circle_mission",
    "propose_join_circle_mission",
    "propose_submit_circle_mission_progress"
  ]) {
    assert.ok(adultTools.includes(name), name);
  }

  assert.equal(getAriTools({ social: true, circleAllowed: false }).some((tool) => tool.name.includes("circle_")), false);
  assert.equal(getAriTools({ social: true, circleAllowed: true, teenMode: true }).some((tool) => tool.name.includes("circle_")), false);
});

test("Circle proposal tools map to distinct trusted application actions", () => {
  assert.equal(toolToApplicationAction("propose_create_circle_meetup"), "create_circle_meetup");
  assert.equal(toolToApplicationAction("propose_join_circle_meetup"), "join_circle_meetup");
  assert.equal(toolToApplicationAction("propose_leave_circle_meetup"), "leave_circle_meetup");
  assert.equal(toolToApplicationAction("propose_cancel_circle_meetup"), "cancel_circle_meetup");
  assert.equal(toolToApplicationAction("propose_create_circle_mission"), "create_circle_mission");
  assert.equal(toolToApplicationAction("propose_join_circle_mission"), "join_circle_mission");
  assert.equal(toolToApplicationAction("propose_submit_circle_mission_progress"), "submit_circle_mission_progress");
});

test("Circle meetup creation requires validated public logistics rather than private meeting point", () => {
  const valid = validateToolCall({
    name: "propose_create_circle_meetup",
    arguments: JSON.stringify({
      title: "Chest after work",
      activity: "gym",
      area: "Mission Valley, San Diego",
      startsAt: "2026-08-26T18:00:00-07:00",
      durationMinutes: 75,
      guestSpots: 3,
      description: "Intermediate-friendly session.",
      joinMode: "approval"
    })
  }, adultCircleRoute);
  assert.equal(valid.valid, true, valid.error);

  const schema = getAriTools(adultCircleRoute).find((tool) => tool.name === "propose_create_circle_meetup")?.parameters;
  assert.ok(schema);
  assert.equal("meetingPoint" in schema.properties, false);
  assert.equal("latitude" in schema.properties, false);
  assert.equal("longitude" in schema.properties, false);
});

test("Circle participant mutations require exact UUIDs", () => {
  for (const name of ["propose_join_circle_meetup", "propose_leave_circle_meetup", "propose_cancel_circle_meetup"]) {
    const valid = validateToolCall({ name, arguments: JSON.stringify({ meetupId }) }, adultCircleRoute);
    assert.equal(valid.valid, true, `${name}: ${valid.error || "valid action rejected"}`);

    const invalid = validateToolCall({ name, arguments: JSON.stringify({ meetupId: "the one tonight" }) }, adultCircleRoute);
    assert.equal(invalid.valid, false, name);
    assert.equal(invalid.error, "circle_meetup_id_invalid");
  }
});

test("Mission creation is measurable, reward-neutral, and semantically bounded", () => {
  const endsAt = futureEnd();
  const valid = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({
      title: "San Diego Moves",
      description: "Move together this weekend.",
      scope: "community",
      category: "community",
      verificationMode: "self",
      objectiveType: "distance",
      progressMode: "collective",
      targetValue: 1000,
      unit: "miles",
      endsAt,
      maxParticipants: null
    })
  }, adultCircleRoute);
  assert.equal(valid.valid, true, valid.error);

  const schema = getAriTools(adultCircleRoute).find((tool) => tool.name === "propose_create_circle_mission")?.parameters;
  assert.ok(schema);
  for (const forbidden of ["xp", "rewardXp", "latitude", "longitude", "placeId", "reviewerId"]) {
    assert.equal(forbidden in schema.properties, false, forbidden);
  }

  assert.deepEqual(schema.properties.category.enum, ["activity", "walking", "fitness", "community", "volunteer", "wellness", "other"]);
  assert.ok(schema.properties.unit.enum.includes("kilometers"));
  assert.ok(schema.properties.unit.enum.includes("hours"));
  assert.ok(schema.properties.unit.enum.includes("sessions"));
  assert.equal(schema.properties.unit.enum.includes("actions"), false);

  const wrongUnit = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({
      title: "Walk 10",
      description: "",
      scope: "community",
      category: "walking",
      verificationMode: "self",
      objectiveType: "distance",
      progressMode: "collective",
      targetValue: 10,
      unit: "minutes",
      endsAt,
      maxParticipants: 20
    })
  }, adultCircleRoute);
  assert.equal(wrongUnit.valid, false);
  assert.equal(wrongUnit.error, "circle_mission_unit_invalid");

  const kilometers = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({
      title: "Walk 10K",
      description: "",
      scope: "community",
      category: "walking",
      verificationMode: "self",
      objectiveType: "distance",
      progressMode: "collective",
      targetValue: 10,
      unit: "kilometers",
      endsAt,
      maxParticipants: 20
    })
  }, adultCircleRoute);
  assert.equal(kilometers.valid, true, kilometers.error);

  const hours = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({
      title: "Move 20 Hours",
      description: "",
      scope: "community",
      category: "fitness",
      verificationMode: "self",
      objectiveType: "duration",
      progressMode: "collective",
      targetValue: 20,
      unit: "hours",
      endsAt,
      maxParticipants: null
    })
  }, adultCircleRoute);
  assert.equal(hours.valid, true, hours.error);

  const personalCollective = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({
      title: "My activities",
      description: "",
      scope: "personal",
      category: "activity",
      verificationMode: "self",
      objectiveType: "count",
      progressMode: "collective",
      targetValue: 5,
      unit: "activities",
      endsAt,
      maxParticipants: null
    })
  }, adultCircleRoute);
  assert.equal(personalCollective.valid, false);
  assert.equal(personalCollective.error, "circle_mission_personal_collective_invalid");
});

test("Mission creation enforces the same future window as Mission V2 authority", () => {
  const base = {
    title: "Timed Mission",
    description: "",
    scope: "community",
    category: "activity",
    verificationMode: "self",
    objectiveType: "count",
    progressMode: "individual",
    targetValue: 5,
    unit: "activities",
    maxParticipants: null
  };

  const tooSoon = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({ ...base, endsAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
  }, adultCircleRoute);
  assert.equal(tooSoon.valid, false);
  assert.equal(tooSoon.error, "circle_mission_end_invalid");

  const tooLate = validateToolCall({
    name: "propose_create_circle_mission",
    arguments: JSON.stringify({ ...base, endsAt: futureEnd(91) })
  }, adultCircleRoute);
  assert.equal(tooLate.valid, false);
  assert.equal(tooLate.error, "circle_mission_end_invalid");
});

test("Mission join and progress require exact Mission identity and valid measurable progress", () => {
  const join = validateToolCall({
    name: "propose_join_circle_mission",
    arguments: JSON.stringify({ missionId })
  }, adultCircleRoute);
  assert.equal(join.valid, true, join.error);

  const badJoin = validateToolCall({
    name: "propose_join_circle_mission",
    arguments: JSON.stringify({ missionId: "that running mission" })
  }, adultCircleRoute);
  assert.equal(badJoin.valid, false);
  assert.equal(badJoin.error, "circle_mission_id_invalid");

  for (const [amount, unit] of [[3.2, "miles"], [5, "kilometers"], [45.5, "minutes"], [1.5, "hours"], [2, "sessions"]]) {
    const progress = validateToolCall({
      name: "propose_submit_circle_mission_progress",
      arguments: JSON.stringify({ missionId, amount, unit, note: "Progress" })
    }, adultCircleRoute);
    assert.equal(progress.valid, true, `${unit}: ${progress.error || "valid progress rejected"}`);
  }

  const fractionalCount = validateToolCall({
    name: "propose_submit_circle_mission_progress",
    arguments: JSON.stringify({ missionId, amount: 1.5, unit: "activities", note: "" })
  }, adultCircleRoute);
  assert.equal(fractionalCount.valid, false);
  assert.equal(fractionalCount.error, "circle_mission_count_progress_invalid");
});

test("join and leave intent wrappers delegate to existing guarded Circle authorities", () => {
  assert.match(wrappers, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(wrappers, /public\.ari_circle_request_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_join_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_leave_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_withdraw_meetup_request\(meetup\.id\)/i);
  assert.match(wrappers, /Hosts must cancel the meetup instead/i);
  assert.doesNotMatch(wrappers, /grant execute[^;]+to anon/i);
});

test("Mission action executor delegates to existing guarded Mission authorities", () => {
  for (const rpc of ["ari_circle_create_mission_v2", "ari_circle_submit_mission_progress"]) {
    assert.match(adapter, new RegExp(rpc));
    assert.match(missionMigration, new RegExp(`create or replace function public\\.${rpc}`, "i"));
  }
  assert.match(adapter, /ari_circle_join_quest/);
  assert.match(circleV5Migration, /create or replace function public\.ari_circle_join_quest/i);
  assert.match(missionMigration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(missionMigration, /check \(objective_type = 'completion' or xp_reward = 0\)/i);
  assert.doesNotMatch(adapter, /ari_circle_review_mission_contribution/);
});

test("Mission adapter defaults remain valid under Mission V2 authority", () => {
  assert.match(adapter, /objectiveType === "count"\) return explicit \|\| "activities"/);
  assert.match(adapter, /const category = clean\(args\?\.category, 20\)\.toLowerCase\(\) \|\| "activity"/);
  assert.doesNotMatch(adapter, /return explicit \|\| "actions"/);
});

test("Mission progress action preserves one client event identity across repeated mapping", () => {
  assert.match(adapter, /const MISSION_PROGRESS_EVENTS = new Map\(\)/);
  assert.match(adapter, /function missionProgressEventId/);
  assert.match(adapter, /MISSION_PROGRESS_EVENTS\.has\(key\)/);
  assert.match(adapter, /requested_client_event_id: missionProgressEventId\(pending, missionId\)/);
  assert.match(adapter, /randomUUID/);
});

test("browser Circle adapter executes only through guarded RPCs after confirmation path", () => {
  for (const rpc of [
    "ari_circle_create_meetup",
    "ari_circle_apply_join_intent",
    "ari_circle_apply_leave_intent",
    "ari_circle_cancel_meetup",
    "ari_circle_create_mission_v2",
    "ari_circle_join_quest",
    "ari_circle_submit_mission_progress"
  ]) {
    assert.match(adapter, new RegExp(rpc));
  }
  assert.match(adapter, /AriVNextActionAdapter/);
  assert.match(adapter, /CalBuddy\.executeAction/);
  assert.match(adapter, /confirmation_text/);
  assert.doesNotMatch(adapter, /\.from\s*\(/);
  assert.doesNotMatch(adapter, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adapter, /meeting_point/i);
});

test("vNext refuses readiness until trusted Mission-capable Circle executor is loaded", () => {
  assert.match(guard, /ari-vnext-circle-action-adapter\.js\?v=1\.1\.1/);
  assert.match(guard, /AriVNextCircleActionAdapter\?\.ready === true/);
  assert.match(guard, /circleActionReady && contextReady && continuityReady && peerReady/);
  assert.match(guard, /ari:circleChanged/);
  assert.match(guard, /clearCircleCache/);
});

test("semantic verifier treats Circle discovery as read-only and bounds Mission writes", () => {
  assert.match(verifier, /anything going on tonight\?/i);
  assert.match(verifier, /discovery\/read request/i);
  assert.match(verifier, /cancelling the user's OWN participation/i);
  assert.match(verifier, /cancelling an entire HOSTED meetup/i);
  assert.match(verifier, /What Missions are active\?/i);
  assert.match(verifier, /add my 3 miles to that Mission/i);
  assert.match(verifier, /No Mission-review mutation tool is available/i);
  assert.match(verifier, /join, RSVP, request a spot, leave, withdraw/i);
});