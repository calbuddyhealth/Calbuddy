import test from "node:test";
import assert from "node:assert/strict";
import { classifyStrategyFeedback, deriveAdaptiveStrategyState, evaluateStrategyOutcome } from "../api/_lib/ari-vnext/adaptive-strategy.js";
import { responseFingerprint, selectFeedbackTarget, validateStrategyApplications } from "../api/_lib/ari-vnext/strategy-evidence.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";
import { enqueueReflection, drainReflection } from "../api/_lib/ari-vnext/deferred-reflection.js";
import { prepareAdaptiveStrategiesForTurn } from "../api/_lib/ari-vnext/adaptive-strategy-store.js";

const uid = "22222222-2222-4222-8222-222222222222";
const reply = "I would check the current file before proposing a change.";
const strategies = [{ id: "s1", strategyKey: "verify_first", title: "Verify first" }, { id: "s2", strategyKey: "be_brief", title: "Be brief" }];
function response(body) { return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }); }
function env(t) {
  for (const [key, value] of Object.entries({ SUPABASE_URL: "https://learning.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-only" })) {
    const prior = process.env[key]; process.env[key] = value;
    t.after(() => prior === undefined ? delete process.env[key] : process.env[key] = prior);
  }
}

test("feedback distinguishes direct correction from incidental praise and uncertainty", () => {
  for (const value of ["That is wrong.", "That's wrong.", "Your answer is incorrect."]) assert.equal(classifyStrategyFeedback(value), "negative");
  for (const value of ["The weather is perfect today.", "What exactly is this?", "If that is wrong, what then?", 'She said that is wrong.', '"That is wrong."']) assert.equal(classifyStrategyFeedback(value), "neutral", value);
  assert.equal(classifyStrategyFeedback("Perfect!"), "positive");
  assert.equal(classifyStrategyFeedback("Perfect, but not what I asked."), "negative");
  const prior = { strategyKey: "prior", status: "practical_prior", confidence: 0.8, maturityScore: 0.8, trials: 20 };
  const next = evaluateStrategyOutcome(prior, "neutral").strategy;
  assert.equal(next.confidence, 0.8); assert.equal(next.trials, 20); assert.equal(next.maturityScore, 0.8);
});

test("a challenger has an exposure slot even with six established priors", () => {
  const incumbents = Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, strategyKey: `i${i}`, status: "practical_prior", confidence: 0.95, domains: ["general"] }));
  const pool = [...incumbents, { id: "a", strategyKey: "a", status: "testing", domains: ["general"], lastUsedAt: "2026-10-01" }, { id: "b", strategyKey: "b", status: "testing", domains: ["general"] }];
  const selected = deriveAdaptiveStrategyState({ strategies: pool }).active;
  assert.equal(selected.length, 6); assert.equal(selected.at(-1).strategyKey, "b");
});

test("application needs a known strategy and a real passage; ambiguous feedback gives no shared credit", () => {
  const applications = validateStrategyApplications([
    { strategyKey: "verify_first", evidenceQuote: reply },
    { strategyKey: "be_brief", evidenceQuote: "This passage was never said." },
    { strategyKey: "unknown", evidenceQuote: reply }
  ], strategies, reply);
  assert.equal(applications.length, 1);
  const uses = strategies.map((s, i) => ({ id: `u${i}`, strategy_id: s.id, response_hash: responseFingerprint(reply), application_evidence: applications[0] }));
  assert.equal(selectFeedbackTarget({ uses, strategies, message: "Perfect!", previousReply: reply }), null);
  assert.equal(selectFeedbackTarget({ uses, strategies, message: "I like that approach: verify_first", previousReply: reply }).id, "u0");
  assert.equal(selectFeedbackTarget({ uses: uses.slice(0, 1), strategies, previousReply: "A different response" }), null);
  assert.equal(selectFeedbackTarget({ uses: [{ ...uses[0], application_evidence: null }], strategies, previousReply: reply }), null);
});

test("feedback lookup is scoped to the same conversation and preceding response", async t => {
  env(t); const urls = [];
  t.mock.method(globalThis, "fetch", async url => { urls.push(new URL(url)); return response([]); });
  await prepareAdaptiveStrategiesForTurn({ userId: uid, conversationId: "thread-a", turnId: "feedback", message: "That is wrong.", history: [{ role: "assistant", content: reply }] });
  const lookup = urls.find(url => url.pathname.endsWith("ari_vnext_strategy_uses"));
  assert.equal(lookup.searchParams.get("conversation_id"), "eq.thread-a");
  assert.equal(lookup.searchParams.get("response_hash"), `eq.${responseFingerprint(reply)}`);
});

test("explicit preferences survive a full profile and supersede old length preferences", () => {
  const old = { preferences: { items: ["User prefers long answers", ...Array.from({ length: 17 }, (_, i) => `User likes topic ${i}`)] } };
  const model = deriveUserWorldModel({ persisted: old, turn: { turnId: "correction", message: "I prefer short answers.", createdAt: "2026-10-11T00:00:00Z" } });
  assert.equal(model.preferences.items.length, 18);
  assert.equal(model.preferences.items[0], "I prefer short answers.");
  assert.ok(!model.preferences.items.some(value => /long answers/.test(value)));
  assert.equal(model.preferences.records[0].source, "explicit_user");
  assert.equal(model.preferences.records[0].turnId, "correction");
  assert.equal(model.preferences.superseded[0].text, "User prefers long answers");
  const later = deriveUserWorldModel({ persisted: model, context: { relevantMemory: "User prefers long answers" } });
  assert.equal(later.preferences.items[0], "I prefer short answers.");
  assert.ok(!later.preferences.items.includes("User prefers long answers"));
});

test("fiction and blocked categories cannot create preference corrections", () => {
  const persisted = { preferences: { items: ["User prefers long answers"] } };
  assert.deepEqual(deriveUserWorldModel({ persisted, route: { creativeConversation: true }, turn: { message: "I prefer short answers." } }).preferences.items, persisted.preferences.items);
  const blocked = deriveUserWorldModel({ persisted: { ...persisted, privacyControls: { blockedCategories: ["preferences"] } }, turn: { message: "I prefer short answers." } });
  assert.deepEqual(blocked.preferences, { items: [] });
});

test("durable reflection snapshots remaining budget without tokens and records terminal failure", async t => {
  env(t); let job, terminal;
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : {};
    if (String(url).includes("rpc/ari_claim_reflection_job")) { const claimed = job; job = null; return response(claimed ? [claimed] : []); }
    if (options.method === "POST") { job = { id: "job1", ...body }; return response([job]); }
    if (options.method === "PATCH") { terminal = body; return response([]); }
    return response([]);
  });
  const queued = await enqueueReflection({ turn: { userId: uid, turnId: "turn1", message: "Explain why", authorization: "DO_NOT_STORE", context: { turnComputeGovernor: { usedCalls: 1, maxCalls: 1 }, reasoningContinuity: "DO_NOT_STORE" } }, result: { success: true, reply, provider: { token: "DO_NOT_STORE" } } });
  assert.equal(queued.queued, true);
  assert.doesNotMatch(JSON.stringify(job), /DO_NOT_STORE/);
  assert.equal(job.input.turn.context.turnComputeGovernor.usedCalls, 1);
  const done = await drainReflection(uid, { reflect: async () => { throw new Error("provider unavailable"); } });
  assert.equal(done.status, "failed"); assert.deepEqual(terminal.input, {});
  let called = false;
  await drainReflection(uid, { reflect: async () => { called = true; } });
  assert.equal(called, false, "A claimed job is not sent to the provider twice");
});

test("successful deferred reflection retains usage and applied evidence", async t => {
  env(t); let terminal; const writes = [];
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    if (String(url).includes("rpc/")) return response([{ id: "job1", turn_id: "t1", input: { turn: { userId: uid, turnId: "t1" } } }]);
    terminal = JSON.parse(options.body); return response([]);
  });
  const result = await drainReflection(uid, {
    reflect: async () => ({ attempted: true, reason: "proposal_created", proposal: { strategyKey: "x" }, applications: [{ strategyId: "s1" }], provider: { model: "test", id: "resp1", usage: { input_tokens: 10 } } }),
    propose: async value => { writes.push(value); return { stored: true }; },
    applications: async value => { writes.push(value); return { stored: 1 }; },
    usage: async value => { writes.push(value); return { stored: true }; }
  });
  assert.equal(result.completed, true); assert.equal(writes.length, 3);
  assert.equal(terminal.receipt.proposalStored, true); assert.equal(terminal.receipt.applicationsStored, 1);
  assert.deepEqual(terminal.input, {});
});
