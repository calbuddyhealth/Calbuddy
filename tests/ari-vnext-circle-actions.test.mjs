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

test("Circle lifecycle tools require server-derived adult Circle entitlement", () => {
  const adultTools = getAriTools(adultCircleRoute).map((tool) => tool.name);
  for (const name of [
    "propose_create_circle_meetup",
    "propose_join_circle_meetup",
    "propose_leave_circle_meetup",
    "propose_cancel_circle_meetup"
  ]) {
    assert.ok(adultTools.includes(name), name);
  }

  assert.equal(getAriTools({ social: true, circleAllowed: false }).some((tool) => tool.name.includes("circle_meetup")), false);
  assert.equal(getAriTools({ social: true, circleAllowed: true, teenMode: true }).some((tool) => tool.name.includes("circle_meetup")), false);
});

test("Circle proposal tools map to distinct trusted application actions", () => {
  assert.equal(toolToApplicationAction("propose_create_circle_meetup"), "create_circle_meetup");
  assert.equal(toolToApplicationAction("propose_join_circle_meetup"), "join_circle_meetup");
  assert.equal(toolToApplicationAction("propose_leave_circle_meetup"), "leave_circle_meetup");
  assert.equal(toolToApplicationAction("propose_cancel_circle_meetup"), "cancel_circle_meetup");
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

test("join and leave intent wrappers delegate to existing guarded Circle authorities", () => {
  assert.match(wrappers, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(wrappers, /public\.ari_circle_request_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_join_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_leave_meetup\(meetup\.id\)/i);
  assert.match(wrappers, /public\.ari_circle_withdraw_meetup_request\(meetup\.id\)/i);
  assert.match(wrappers, /Hosts must cancel the meetup instead/i);
  assert.doesNotMatch(wrappers, /grant execute[^;]+to anon/i);
});

test("browser Circle adapter executes only through guarded RPCs after confirmation path", () => {
  for (const rpc of [
    "ari_circle_create_meetup",
    "ari_circle_apply_join_intent",
    "ari_circle_apply_leave_intent",
    "ari_circle_cancel_meetup"
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

test("vNext refuses readiness until trusted Circle executor is loaded", () => {
  assert.match(guard, /ari-vnext-circle-action-adapter\.js\?v=1\.0\.0/);
  assert.match(guard, /AriVNextCircleActionAdapter\?\.ready === true/);
  assert.match(guard, /circleActionReady && contextReady && continuityReady && peerReady/);
  assert.match(guard, /ari:circleChanged/);
  assert.match(guard, /clearCircleCache/);
});

test("semantic verifier treats discovery as read-only and distinguishes leave from host cancellation", () => {
  assert.match(verifier, /anything going on tonight\?/i);
  assert.match(verifier, /discovery\/read request/i);
  assert.match(verifier, /cancel the user's OWN participation/i);
  assert.match(verifier, /cancel an entire HOSTED meetup/i);
  assert.match(verifier, /join, RSVP, request a spot, leave, withdraw/i);
});
