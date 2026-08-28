import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  TOOL_REGISTRY_VERSION,
  CORE_TOOL_REGISTRY_VERSION,
  getAriTools,
  validateToolCall,
  toolToApplicationAction
} from "../api/_lib/ari-vnext/tools.js";

const adapter = await readFile(new URL("../ari/vnext/ari-vnext-circle-action-adapter.js", import.meta.url), "utf8");
const crewMigration = await readFile(new URL("../supabase/migrations/20260825194500_ari_circle_crews_v1.sql", import.meta.url), "utf8");
const verifier = await readFile(new URL("../api/_lib/ari-vnext/action-intent-verifier.js", import.meta.url), "utf8");

const adultCircleRoute = {
  social: true,
  circleAllowed: true,
  teenMode: false,
  nutrition: false,
  training: false,
  goals: false
};

const crewId = "33333333-3333-4333-8333-333333333333";
const candidateKey = "0123456789abcdef0123456789abcdef";
const crewTools = [
  "propose_create_circle_crew",
  "propose_accept_circle_crew_invite",
  "propose_decline_circle_crew_invite",
  "propose_leave_circle_crew",
  "propose_archive_circle_crew"
];

test("Crew tool facade preserves the mature core registry", () => {
  assert.equal(TOOL_REGISTRY_VERSION, "1.12.0");
  assert.equal(CORE_TOOL_REGISTRY_VERSION, "1.11.1");
  const mixed = getAriTools({ ...adultCircleRoute, nutrition: true }).map((tool) => tool.name);
  assert.ok(mixed.includes("propose_log_meal"));
  assert.ok(mixed.includes("propose_create_circle_mission"));
  for (const name of crewTools) assert.ok(mixed.includes(name), name);
});

test("Crew proposal tools require server-derived adult Circle entitlement", () => {
  const adultTools = getAriTools(adultCircleRoute).map((tool) => tool.name);
  for (const name of crewTools) assert.ok(adultTools.includes(name), name);

  const denied = getAriTools({ social: true, circleAllowed: false, teenMode: false }).map((tool) => tool.name);
  const teen = getAriTools({ social: true, circleAllowed: true, teenMode: true }).map((tool) => tool.name);
  for (const name of crewTools) {
    assert.equal(denied.includes(name), false, name);
    assert.equal(teen.includes(name), false, name);
  }
});

test("Crew creation accepts only an evidence-backed candidate key and bounded name", () => {
  const valid = validateToolCall({
    name: "propose_create_circle_crew",
    arguments: JSON.stringify({ candidateKey, name: "Tuesday Crew" })
  }, adultCircleRoute);
  assert.equal(valid.valid, true, valid.error);
  assert.deepEqual(valid.arguments, { candidateKey, name: "Tuesday Crew" });

  const invalidCandidate = validateToolCall({
    name: "propose_create_circle_crew",
    arguments: JSON.stringify({ candidateKey: "pick-these-people", name: "Tuesday Crew" })
  }, adultCircleRoute);
  assert.equal(invalidCandidate.valid, false);
  assert.equal(invalidCandidate.error, "circle_crew_candidate_invalid");

  const invalidName = validateToolCall({
    name: "propose_create_circle_crew",
    arguments: JSON.stringify({ candidateKey, name: "x" })
  }, adultCircleRoute);
  assert.equal(invalidName.valid, false);
  assert.equal(invalidName.error, "circle_crew_name_invalid");

  const schema = getAriTools(adultCircleRoute).find((tool) => tool.name === "propose_create_circle_crew")?.parameters;
  assert.ok(schema);
  for (const forbidden of ["memberIds", "members", "userIds", "inviteeIds", "xp", "premium", "payment"]) {
    assert.equal(forbidden in schema.properties, false, forbidden);
  }
});

test("Crew invitation, leave, and archive actions require exact Crew UUIDs", () => {
  for (const name of crewTools.slice(1)) {
    const valid = validateToolCall({ name, arguments: JSON.stringify({ crewId }) }, adultCircleRoute);
    assert.equal(valid.valid, true, `${name}: ${valid.error || "valid Crew action rejected"}`);

    const invalid = validateToolCall({ name, arguments: JSON.stringify({ crewId: "that crew" }) }, adultCircleRoute);
    assert.equal(invalid.valid, false, name);
    assert.equal(invalid.error, "circle_crew_id_invalid");
  }
});

test("Crew proposal tools map to distinct trusted application actions", () => {
  assert.equal(toolToApplicationAction("propose_create_circle_crew"), "create_circle_crew");
  assert.equal(toolToApplicationAction("propose_accept_circle_crew_invite"), "accept_circle_crew_invite");
  assert.equal(toolToApplicationAction("propose_decline_circle_crew_invite"), "decline_circle_crew_invite");
  assert.equal(toolToApplicationAction("propose_leave_circle_crew"), "leave_circle_crew");
  assert.equal(toolToApplicationAction("propose_archive_circle_crew"), "archive_circle_crew");
});

test("Crew browser executor delegates only to guarded Crew RPC authorities", () => {
  for (const rpc of [
    "ari_circle_create_crew",
    "ari_circle_respond_crew_invite",
    "ari_circle_leave_crew",
    "ari_circle_archive_crew"
  ]) {
    assert.match(adapter, new RegExp(rpc));
    assert.match(crewMigration, new RegExp(`create or replace function public\\.${rpc}`, "i"));
  }

  assert.match(adapter, /const CREW_CREATION_OPERATIONS = new Map\(\)/);
  assert.match(adapter, /function crewCreationOperationId/);
  assert.match(adapter, /requested_operation_id: crewCreationOperationId\(pending, candidateKey\)/);
  assert.match(adapter, /requested_accept: true/);
  assert.match(adapter, /requested_accept: false/);
  assert.doesNotMatch(adapter, /\.from\s*\(/);
  assert.doesNotMatch(adapter, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adapter, /requested_member_ids/i);
});

test("Crew server authority revalidates evidence, adult access, blocking, and consent", () => {
  assert.match(crewMigration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(crewMigration, /from public\.ari_circle_list_crew_candidates\(20\)/i);
  assert.match(crewMigration, /requested_operation_id/i);
  assert.match(crewMigration, /status = 'invited'/i);
  assert.match(crewMigration, /public\.ari_circle_social_pair_is_blocked/i);
  assert.match(crewMigration, /Nobody is silently enrolled|nobody is silently enrolled/i);
  assert.doesNotMatch(crewMigration, /award[_ ]xp|grant[_ ]xp/i);
});

test("semantic verifier distinguishes Crew reads, invitation responses, leave, and owner archive", () => {
  assert.match(verifier, /For ARI Circle Crews, discovery or explanation is read-only/i);
  assert.match(verifier, /Never infer or invent founding members/i);
  assert.match(verifier, /accept that Crew invite/i);
  assert.match(verifier, /decline\/pass on that Crew invite/i);
  assert.match(verifier, /distinguish leaving the user's OWN membership from archiving an entire OWNED Crew/i);
  assert.match(verifier, /No Crew tool may add arbitrary members/i);
});

test("Crew V1 intentionally exposes no arbitrary add-member proposal", () => {
  const names = getAriTools(adultCircleRoute).map((tool) => tool.name);
  for (const forbidden of [
    "propose_add_circle_crew_member",
    "propose_invite_circle_crew_member",
    "propose_remove_circle_crew_member",
    "propose_promote_circle_crew"
  ]) {
    assert.equal(names.includes(forbidden), false, forbidden);
  }
});