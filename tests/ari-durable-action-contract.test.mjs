import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync("api/ari-vnext.js", "utf8");
const core = fs.readFileSync("calbuddy-core.js", "utf8");
const adapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");
const training = fs.readFileSync("ari/vnext/ari-vnext-training-context.js", "utf8");
const bridge = fs.readFileSync("ari/vnext/ari-vnext-bridge.js", "utf8");
const tools = fs.readFileSync("api/_lib/ari-vnext/tools-core.js", "utf8");
const resilience = fs.readFileSync("js/home-resilience.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260922223000_ari_action_transaction_ledger.sql", "utf8");

test("server action proposal persistence precedes durable conversation persistence", () => {
  const runIndex = api.indexOf("const result = await runAriVNext(turn)");
  const ledgerIndex = api.indexOf("persistAriActionProposal", runIndex);
  const conversationIndex = api.indexOf("const turnPersistenceTask", runIndex);
  assert.ok(runIndex >= 0);
  assert.ok(ledgerIndex > runIndex);
  assert.ok(conversationIndex > ledgerIndex);
  assert.match(api, /action_ledger_persistence_failed/);
});

test("ledger lifecycle is idempotent and success requires a completed receipt", () => {
  assert.match(migration, /'proposed','pending','executing','completed','failed','cancelled','expired'/);
  assert.match(migration, /unique index if not exists ai_app_actions_user_vnext_action_uidx/);
  assert.match(migration, /grant select, insert, update on table public\.ai_app_actions to authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ai_app_actions to service_role/);
  assert.match(migration, /revoke all on table public\.ai_app_actions from anon/);
  assert.match(core, /beginPendingActionExecution/);
  assert.match(core, /\.in\("status", \["pending", "failed"\]\)/);
  assert.match(core, /completePendingAction/);
  assert.match(core, /\.eq\("status", "executing"\)/);
  assert.match(core, /action_receipt_write_failed/);
  assert.match(adapter, /await CalBuddy\.completePendingAction/);
});

test("navigation recovery rebuilds executable action state from the same source turn", () => {
  assert.match(core, /restorePendingActionFromLedger/);
  assert.match(core, /source_turn_id/);
  assert.match(resilience, /restorePendingActionFromLedger/);
  assert.match(resilience, /sourceTurnId: pending\.id/);
  assert.match(core, /vnext_pending_action/);
});

test("workout generation is library-first and persistence remains registry-validated", () => {
  assert.match(training, /recommendFromQuery/);
  assert.match(training, /getRecommendedExercises/);
  assert.match(training, /exerciseLibrary/);
  assert.match(bridge, /exerciseLibrary: trainingContext\.exerciseLibrary/);
  assert.match(tools, /exerciseId: \{ type: "string" \}/);
  assert.match(tools, /required: \["exerciseId", "name", "sets", "reps", "restSeconds", "notes"\]/);
  assert.match(adapter, /request\?\.exerciseId \|\| request\?\.name/);
  assert.match(adapter, /registryValidated: true/);
});

test("updated browser action components remain syntactically valid", () => {
  assert.doesNotThrow(() => new Function(core));
  assert.doesNotThrow(() => new Function(adapter));
  assert.doesNotThrow(() => new Function(training));
  assert.doesNotThrow(() => new Function(bridge));
});


test("unfinished pre-ledger vNext browser actions are not executed after the upgrade", () => {
  assert.match(core, /Pre-transaction vNext confirmations were browser-only/);
  assert.match(core, /parsed\?\.vnext_action_id && parsed\?\._ledger_persisted !== true/);
  assert.match(core, /localStorage\.removeItem\("calbuddyPendingAction"\)/);
});


test("completed durable actions clear only matching browser pending state and cannot be re-shown after navigation", () => {
  assert.match(core, /pendingActionMatches/);
  assert.match(core, /clearPendingActionStateFor/);
  assert.match(core, /reconcilePendingActionWithLedger/);
  assert.match(core, /\["completed", "cancelled", "expired", "executing"\]\.includes\(status\)/);
  assert.match(core, /CalBuddy\.clearPendingActionStateFor\(data\)/);
  assert.match(resilience, /firstReconciledPendingAction/);
});

test("durable meal startup cleanup preserves current ledger-backed proposals", () => {
  const homeHtml = fs.readFileSync("home.html", "utf8");
  assert.match(homeHtml, /const durable=window\.CalBuddy\?\.isDurableAction\?\.\(pending\)===true\s*\|\|\s*Boolean\(pending\?\.vnext_action_id\)/);
  assert.match(homeHtml, /pending\?\.action_type==="log_meal"&&!durable/);
});
