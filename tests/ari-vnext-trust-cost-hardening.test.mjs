import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const runtime = await read("ari/runtime/ari-runtime-controller.js");
const bridge = await read("ari/vnext/ari-vnext-bridge.js");
const resilience = await read("js/home-resilience.js");
const api = await read("api/ari-vnext.js");
const continuity = await read("api/_lib/ari-vnext/continuity-service.js");
const memory = await read("api/_lib/ari-vnext/memory-service.js");
const idempotency = await read("api/_lib/ari-vnext/request-idempotency.js");
const migration = await read("supabase/migrations/20260820202300_ari_request_idempotency.sql");

test("runtime preserves the object-style Home ask contract", () => {
  assert.match(runtime, /function normalizeAskRequest\(messageOrInput = "", options = \{\}\)/);
  assert.match(runtime, /typeof messageOrInput === "object"/);
  assert.match(runtime, /const message = clean\(input\?\.message\)/);
  assert.match(runtime, /legacy\.askAri\(input\)/);
  assert.doesNotMatch(runtime, /AriVNextBridge\.ask\(messageOrInput/);
});

test("Home retries reuse one stable turn id", () => {
  assert.match(resilience, /const pending = createPendingTurn\(message\)/);
  assert.match(resilience, /turnId: pending\.id/);
  assert.match(resilience, /\.eq\("turn_id", pending\.id\)/);
  assert.match(resilience, /retries: retries \+ 1/);
});

test("vNext bridge sends turn identity and excludes legacy coach prompt injection", () => {
  assert.match(bridge, /const turnId = normalizeTurnId\(options\?\.turnId \|\| options\?\.requestId\)/);
  assert.match(bridge, /turnId,/);
  assert.match(bridge, /"X-Ari-Turn-Id": turnId/);
  assert.doesNotMatch(bridge, /memorySummary:\s*options\?\.coachMemorySummary/);
  assert.doesNotMatch(bridge, /userContext\?\.coachMemorySummary/);
});

test("vNext pending actions are discarded after expiry in the browser boundary", () => {
  assert.match(bridge, /Date\.parse\(String\(pending\?\.expiresAt \|\| ""\)\)/);
  assert.match(bridge, /expiresAt <= Date\.now\(\)/);
  assert.match(bridge, /this\.clearPendingAction\(\)/);
});

test("expired vNext-linked legacy actions cannot execute through fallback confirmation", () => {
  assert.match(runtime, /function isExpiredVNextLegacyPending/);
  assert.match(runtime, /action\?\.vnext_expires_at/);
  assert.match(runtime, /isExpiredVNextLegacyPending\(legacyPending\)/);
  assert.match(runtime, /legacy\.cancelPendingAction\?\.\(\)/);
  assert.match(runtime, /That pending change expired/);
});

test("retrieved memory uses complete-record budgeting instead of slicing mid-entry", () => {
  assert.match(memory, /export function buildMemorySummary/);
  assert.match(memory, /if \(used \+ additional > budget\) break/);
  assert.match(memory, /seen\.has\(dedupeKey\)/);
  assert.doesNotMatch(memory, /join\("\\n"\)\.slice\(0, 5000\)/);
});

test("server claims a turn before any Ari model orchestration", () => {
  const claimIndex = api.indexOf("requestClaim = await claimAriRequest(requestIdentity)");
  const runIndex = api.indexOf("const result = await runAriVNext(turn)");
  assert.ok(claimIndex >= 0, "request claim must exist");
  assert.ok(runIndex >= 0, "Ari orchestration call must exist");
  assert.ok(claimIndex < runIndex, "request must be claimed before spending a model call");
});

test("server replays completed turns and suppresses concurrent duplicates", () => {
  assert.match(api, /if \(requestClaim\?\.replay\)/);
  assert.match(api, /if \(requestClaim\?\.inProgress\)/);
  assert.match(api, /code: "ARI_TURN_IN_PROGRESS"/);
  assert.match(api, /completeAriRequest/);
  assert.match(api, /releaseAriRequest/);
});

test("continuity persists the same turn and conversation identity", () => {
  assert.match(continuity, /persistConversationTurn\(\{ userId, turnId = null, conversationId = null, message, reply/);
  assert.match(continuity, /turn_id: safeTurnId/);
  assert.match(continuity, /conversation_id: safeConversationId/);
  assert.match(continuity, /response\.status === 409 && Boolean\(safeTurnId\)/);
});

test("idempotency service uses user plus turn as the unique claim", () => {
  assert.match(idempotency, /const TABLE = "ari_request_dedup"/);
  assert.match(idempotency, /on_conflict=user_id%2Cturn_id/);
  assert.match(idempotency, /resolution=ignore-duplicates,return=representation/);
  assert.match(idempotency, /status === "completed" && existing\.response_payload/);
  assert.match(idempotency, /source: "already_processing"/);
});

test("idempotency stores a compact replay payload instead of duplicating full Ari state", () => {
  assert.match(idempotency, /function buildReplayPayload/);
  assert.match(idempotency, /pendingAction: safePayload\(value\.pendingAction\)/);
  assert.match(idempotency, /intelligenceEntitlement: safePayload\(value\.intelligenceEntitlement\)/);
  assert.doesNotMatch(idempotency, /userWorldModel: safePayload/);
  assert.doesNotMatch(idempotency, /cognitiveLoop: safePayload/);
});

test("database migration keeps the dedup ledger server-only", () => {
  assert.match(migration, /add column if not exists turn_id text/);
  assert.match(migration, /ari_conversation_turns_user_turn_uidx/);
  assert.match(migration, /create table if not exists public\.ari_request_dedup/);
  assert.match(migration, /primary key \(user_id, turn_id\)/);
  assert.match(migration, /revoke all on table public\.ari_request_dedup from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_request_dedup to service_role/);
});
