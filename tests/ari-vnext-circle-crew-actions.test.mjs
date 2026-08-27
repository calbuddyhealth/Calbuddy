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
  assert.equal(TOOL_REGISTRY_VERSION, "1.15.0");
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
  assert.equal(valid.valid, true, valid.error || "valid Crew proposal rejected");

  const invalidCandidate = validateToolCall({
    name: "propose_create_circle_crew",
    arguments: JSON.stringify({ candidateKey: "invented", name: "Tuesday Crew" })
  }, adultCircleRoute);
  assert.equal(invalidCandidate.valid, false);

  const blocked = validateToolCall({
    name: "propose_create_circle_crew",
    arguments: JSON.stringify({ candidateKey, name: "Tuesday Crew" })
  }, { social: true, circleAllowed: false, teenMode: false });
  assert.equal(blocked.valid, false);
});

test("Crew membership lifecycle tools accept only canonical UUIDs", () => {
  for (const name of crewTools.slice(1)) {
    const valid = validateToolCall({ name, arguments: JSON.stringify({ crewId }) }, adultCircleRoute);
    assert.equal(valid.valid, true, `${name}: ${valid.error || "rejected"}`);
    assert.equal(toolToApplicationAction(name).includes("crew"), true, name);

    const invalid = validateToolCall({ name, arguments: JSON.stringify({ crewId: "the crew" }) }, adultCircleRoute);
    assert.equal(invalid.valid, false, name);
  }
});

test("Crew adapter writes through authenticated server boundary rather than browser Supabase DML", () => {
  assert.match(adapter, /\/api\/ari-vnext-circle/);
  assert.match(adapter, /Authorization/);
  assert.match(adapter, /Bearer/);
  assert.doesNotMatch(adapter, /\.from\(["']ari_circle_crews/);
  assert.doesNotMatch(adapter, /\.from\(["']ari_circle_crew_members/);
});

test("Crew migration keeps crews private and invitation membership explicit", () => {
  assert.match(crewMigration, /create table if not exists public\.ari_circle_crews/);
  assert.match(crewMigration, /create table if not exists public\.ari_circle_crew_members/);
  assert.match(crewMigration, /visibility text not null default 'private'/);
  assert.match(crewMigration, /status text not null default 'invited'/);
  assert.match(crewMigration, /owner_id = auth\.uid\(\)/);
  assert.match(crewMigration, /user_id = auth\.uid\(\)/);
});

test("action verifier separates accepting an invite, leaving membership, and archiving an owned Crew", () => {
  assert.match(verifier, /accept that Crew invite/i);
  assert.match(verifier, /decline\/pass on that Crew invite/i);
  assert.match(verifier, /leaving the user's OWN membership/i);
  assert.match(verifier, /archiving an entire OWNED Crew/i);
  assert.match(verifier, /Never escalate a leave request into archive/i);
});
