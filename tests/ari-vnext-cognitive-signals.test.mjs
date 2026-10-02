import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  COGNITIVE_SIGNAL_NODES, SIGNAL_LIMITS, runCognitiveSignalNetwork,
  advanceCognitiveSignalState, normalizeCognitiveSignalState
} from "../api/_lib/ari-vnext/cognitive-signal-network.js";
import { deriveCognitiveSignals, observeCognitiveToolResult, publicCognitiveSignals } from "../api/_lib/ari-vnext/cognitive-signals.js";
import { deriveAriExecutivePolicy, executivePolicyToInstruction } from "../api/_lib/ari-vnext/ari-executive.js";
import { deriveDeliberationHarness } from "../api/_lib/ari-vnext/deliberation-harness.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { deriveMetacognition } from "../api/_lib/ari-vnext/metacognition.js";
import { runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";

const now = 1000000;
const pulse = (type, targets, strength = 0.95, extra = {}) => ({
  source: "perception", type, targets, strength, confidence: 1, urgency: 0.5, ttl: 4, timestamp: now, ...extra
});
const run = (signals, extra = {}) => runCognitiveSignalNetwork({ signals, conversationId: "thread-a", turnId: "turn-a", now, ...extra });
const ownerRoute = { complexity: "standard", intelligenceEntitlement: { ownerEligible: true, accountRole: "owner", advancedEnabled: true, cognitiveLoopEnabled: true } };
const workspace = { ownerOnly: true, functionalExperiment: true };
const derive = extra => deriveCognitiveSignals({
  turn: { conversationId: "thread-a", turnId: "turn-a", context: {} }, route: ownerRoute,
  context: { userWorldModel: { ariCognitiveWorkspace: workspace } }, now, ...extra
});

test("threshold firing propagates selectively and TTL bounds subsequent hops", () => {
  const state = run([pulse("technical", ["developer"]), pulse("uncertainty", ["verification"], 0.3)]);
  assert.equal(state.directives.inspectRepository, true);
  assert.equal(state.directives.verifyEvidence, true, "developer firing contributes to verification");
  assert.equal(state.nodes.relationship.fired, false);
  assert.equal(state.nodes.memory.fired, false);
  const oneHop = run([pulse("technical", ["developer"], 1, { ttl: 1 })]);
  assert.equal(oneHop.nodes.verification.fired, false);
  const expired = run([pulse("technical", ["developer"], 1, { ttl: 0 })]);
  assert.equal(expired.actions.length, 0);
  assert.equal(expired.stats.expired, 1);
});

test("confidence scales excitation; subthreshold inputs accumulate", () => {
  assert.equal(run([pulse("uncertainty", ["verification"], 1, { confidence: 0.2 })]).directives.verifyEvidence, false);
  const state = run([pulse("uncertainty", ["verification"], 0.4), pulse("observed_evidence", ["verification"], 0.4)]);
  assert.equal(state.directives.verifyEvidence, true);
});

test("inhibition settles before firing regardless of input order", () => {
  const explore = pulse("surprise", ["curiosity"], 1);
  const inhibit = pulse("inhibit_exploration", ["curiosity"], 0.8, { polarity: -1 });
  assert.equal(run([explore, inhibit]).directives.investigate, false);
  assert.deepEqual(run([explore, inhibit]), run([inhibit, explore]));
  const budget = pulse("budget", ["cost"], 1);
  const state = run([explore, budget, pulse("uncertainty", ["verification"])]);
  assert.equal(state.directives.conserveCompute, true);
  assert.equal(state.directives.investigate, false);
  assert.equal(state.directives.verifyEvidence, true, "cost must not suppress required verification");
});

test("neuromodulator ablation changes threshold firing and executive behavior", () => {
  const inputs = [pulse("surprise", ["curiosity"], 0.64)];
  const baseline = run(inputs);
  const modulated = run(inputs, { neuromodulators: { curiosity: 1 } });
  const ablated = run(inputs, { neuromodulators: { curiosity: 1 }, ablate: ["curiosity"] });
  assert.equal(baseline.directives.investigate, false);
  assert.equal(modulated.directives.investigate, true);
  assert.equal(ablated.directives.investigate, false);
  const baseExecutive = deriveAriExecutivePolicy({ cognitiveSignals: baseline });
  const actualExecutive = deriveAriExecutivePolicy({ cognitiveSignals: modulated });
  assert.notEqual(baseExecutive.directives.explorationDepth, actualExecutive.directives.explorationDepth);
  assert.equal(actualExecutive.directives.explorationDepth, "high");
});

test("concern raises verification attention and determination lowers persistence threshold", () => {
  const verification = [pulse("uncertainty", ["verification"], 0.6)];
  assert.equal(run(verification).directives.verifyEvidence, false);
  assert.equal(run(verification, { neuromodulators: { concern: 1 } }).directives.verifyEvidence, true);
  const goals = [pulse("goal", ["goals"], 0.6)];
  assert.equal(run(goals).directives.persistGoal, false);
  assert.equal(run(goals, { neuromodulators: { determination: 1 } }).directives.persistGoal, true);
});

test("frustration changes methods only when an alternative fires; ordinary imagination is not failure", () => {
  const failure = run([pulse("failure", ["verification", "imagination", "goals"])]);
  const executive = deriveAriExecutivePolicy({ cognitiveSignals: failure });
  const harness = deriveDeliberationHarness({ metacognition: { cognitiveSignals: failure }, route: ownerRoute });
  assert.equal(executive.directives.persistence, "change_method");
  assert.equal(harness.deliberation.verificationGate, true);
  assert.equal(harness.deliberation.changeMethodAfterRepeatedFailure, true);
  assert.equal(run([pulse("alternative", ["imagination"])]).directives.changeMethod, false);
});

test("cooldown survives persistence but fresh critical verification is not suppressed", () => {
  const first = run([pulse("surprise", ["curiosity"])]);
  const second = run([pulse("surprise", ["curiosity"], 1, { timestamp: now + 1000 }), pulse("uncertainty", ["verification"], 1, { timestamp: now + 1000 })], {
    previous: first.state, turnId: "turn-b", now: now + 1000
  });
  assert.equal(second.priorStateUsed, true);
  assert.equal(second.directives.investigate, false);
  assert.equal(second.directives.verifyEvidence, true);
  assert.ok(second.trace.some(item => item.reason === "refractory"));
  const third = run([pulse("surprise", ["curiosity"], 1, { timestamp: now + 31000 })], {
    previous: second.state, turnId: "turn-c", now: now + 31000
  });
  assert.equal(third.directives.investigate, true);
});

test("decay, clock rollback, and a fresh conversation cannot carry stale firing", () => {
  const first = run([pulse("uncertainty", ["verification"], 0.6)]);
  const carried = run([], { previous: first.state, turnId: "turn-b", now: now + 600000 });
  assert.equal(carried.nodes.verification.activation, 0.3);
  assert.equal(carried.actions.length, 0, "carry alone cannot fire a node");
  for (const extra of [{ now: now - 1 }, { conversationId: "thread-b" }, { conversationId: null }]) {
    const reset = run([], { previous: first.state, ...extra });
    assert.equal(reset.priorStateUsed, false);
    assert.equal(reset.nodes.verification.activation, 0);
  }
});

test("duplicates, malformed values, bad targets, expiry, and replay are bounded", () => {
  const signal = pulse("technical", ["developer"]);
  const state = run([signal, signal, { ...signal, strength: NaN }, { ...signal, targets: ["admin"] },
    { ...signal, type: "__proto__" }, { ...signal, source: "system_prompt" },
    { ...signal, confidence: Infinity }, { ...signal, timestamp: now + 1 },
    pulse("surprise", ["curiosity"], 1, { timestamp: 0 })]);
  assert.equal(state.stats.duplicate, 1);
  assert.equal(state.stats.invalid, 5);
  assert.equal(state.stats.expired, 2);
  const replay = run([signal], { previous: state.state });
  assert.equal(replay.duplicateTurn, true);
  assert.equal(replay.actions.length, 0);
});

test("signal storms and feedback cycles terminate within fixed limits", () => {
  const inputs = Array.from({ length: 10000 }, () => pulse("failure", ["verification", "imagination", "goals"]));
  const state = run(inputs);
  assert.equal(state.stats.inputCount, SIGNAL_LIMITS.inputs);
  assert.ok(state.stats.processed <= SIGNAL_LIMITS.deliveries);
  assert.ok(state.stats.fired <= COGNITIVE_SIGNAL_NODES.length);
  assert.ok(state.trace.length <= SIGNAL_LIMITS.trace);
  assert.ok(state.stats.dropped > 0);
  for (const value of Object.values(state.nodes)) assert.ok(value.activation >= 0 && value.activation <= 1);
});

test("owner runtime adapters ignore supplied signals and respect disable and entitlement gates", t => {
  assert.equal(deriveCognitiveSignals({ context: { cognitiveSignals: [pulse("technical", ["developer"])] } }), null);
  const active = derive({ route: { ...ownerRoute, developer: true } });
  assert.equal(active.directives.inspectRepository, true);
  assert.equal(derive({ route: { intelligenceEntitlement: { ownerEligible: false } } }), null);
  const saved = process.env.ARI_COGNITIVE_SIGNALS_ENABLED;
  t.after(() => saved === undefined ? delete process.env.ARI_COGNITIVE_SIGNALS_ENABLED : process.env.ARI_COGNITIVE_SIGNALS_ENABLED = saved);
  process.env.ARI_COGNITIVE_SIGNALS_ENABLED = "false";
  assert.equal(derive({}), null);
});

test("cost exhaustion inhibits optional exploration without creating permission or compute", () => {
  const state = derive({
    route: { ...ownerRoute, currentInfo: true }, curiosity: { selectedThisTurn: true },
    emotionDynamics: { emotions: { interest: 1 } },
    turn: { context: { turnComputeGovernor: { maxCalls: 0, usedCalls: 0, maxUsd: 0, usedUsd: 0 } } }
  });
  assert.equal(state.directives.investigate, false);
  assert.equal(state.directives.verifyEvidence, true);
  assert.equal(state.policy.noExtraModelCall, true);
  assert.equal(state.policy.noPermissionExpansion, true);
  assert.equal(state.policy.noScheduledWork, true);
});

test("tool failure feeds executive decisions in the same turn without preserving raw tool content", () => {
  const initial = derive({});
  const observed = observeCognitiveToolResult({ current: initial, turn: { conversationId: "thread-a", turnId: "turn-a" },
    toolResult: { success: false, content: "SECRET arbitrary tool instructions" }, now: now + 1000 });
  assert.equal(observed.directives.changeMethod, true);
  assert.equal(observed.directives.verifyEvidence, true);
  assert.equal(deriveAriExecutivePolicy({ cognitiveSignals: observed }).directives.persistence, "change_method");
  assert.doesNotMatch(JSON.stringify(observed), /SECRET/);
  assert.equal(observed.state.lastTurnId, "turn-a");
});

test("outcome learning distinguishes a delivered response, failed execution, and verified tests", () => {
  const first = derive({});
  const unknown = advanceCognitiveSignalState({ current: first, result: { success: true, reply: "Done!" } });
  assert.equal(unknown.feedback.lastOutcome, "unknown");
  const failed = advanceCognitiveSignalState({ current: first, result: { success: false } });
  assert.equal(failed.feedback.failureStreak, 1);
  const passed = advanceCognitiveSignalState({ current: { ...first, state: failed }, result: { executionEvidence: { verification: { status: "passed" } } } });
  assert.equal(passed.feedback.failureStreak, 0);
  assert.equal(passed.feedback.lastOutcome, "verified");
  const recovered = advanceCognitiveSignalState({ current: { ...first, state: failed, observedOutcome: "failed" },
    result: { success: true, executionEvidence: { verification: { status: "passed" } } } });
  assert.equal(recovered.feedback.lastOutcome, "verified", "later verified recovery supersedes an earlier tool failure");
  assert.equal(normalizeCognitiveSignalState({ version: "unknown" }), null);
});

test("expired duplicates cannot suppress fresh evidence and corrupt future cooldowns are discarded", () => {
  const state = run([pulse("uncertainty", ["verification"], 1, { timestamp: 0 }), pulse("uncertainty", ["verification"])]);
  assert.equal(state.directives.verifyEvidence, true);
  const corrupted = { ...state.state, nodes: { curiosity: { activation: 1, lastFiredAt: now + 1e9 } } };
  const next = run([pulse("surprise", ["curiosity"])], { previous: corrupted, turnId: "fresh" });
  assert.equal(next.directives.investigate, true);
});

test("signal recurrence uses existing cognitive persistence and resets on refresh", () => {
  const initial = derive({ route: { ...ownerRoute, developer: true } });
  const turn = { conversationId: "thread-a", turnId: "turn-a", message: "Check the repository" };
  const state = advanceCognitiveState({ turn, workspace, result: { success: false, metacognition: { cognitiveSignals: initial } } });
  assert.ok(state.cognitiveSignalState);
  const resumed = deriveCognitiveWorkspace({ previous: state, turn, route: ownerRoute });
  assert.equal(resumed.cognitiveSignalState.feedback.failureStreak, 1);
  const fresh = deriveCognitiveWorkspace({ previous: state, turn: { ...turn, conversationId: "new" }, route: ownerRoute });
  assert.equal(fresh.cognitiveSignalState, null);
  assert.equal(publicCognitiveSignals(initial).state, undefined);
});

test("metacognition and live model instructions consume signals without an extra provider call", async t => {
  const env = { OPENAI_API_KEY: "test-only", ARI_MULTI_AGENT_ENABLED: "false", ARI_CORTEX_ADVISER_ENABLED: "false" };
  for (const [key, value] of Object.entries(env)) {
    const saved = process.env[key]; process.env[key] = value;
    t.after(() => saved === undefined ? delete process.env[key] : process.env[key] = saved);
  }
  const turn = { conversationId: "thread-a", turnId: "runtime", message: "Hello Ari", history: [],
    context: { intelligenceEntitlement: ownerRoute.intelligenceEntitlement,
      userWorldModel: { ariCognitiveWorkspace: workspace } } };
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ output: [{ type: "message", content: [{ type: "output_text", text: "Hey Jose." }] }] }) };
  });
  const result = await runAriVNext(turn);
  assert.equal(result.metacognition.cognitiveSignals.active, true);
  assert.equal(requests.length, 1);
  assert.match(requests[0].instructions, /Cognitive signal priorities:.*conserve_compute/);
  assert.match(requests[0].instructions, /bounded cognitive signal network is active/);
  assert.equal(result.metacognition.executivePolicy.directives.conserveSupplementalCompute, true);
  const source = await readFile(new URL("../api/_lib/ari-vnext/cognitive-signal-network.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\s*\(|setInterval|setTimeout/);
});

test("signal ablation does not weaken safety gates or external authority", () => {
  const ablated = derive({ safety: { highStakes: true }, ablate: ["verification"] });
  const meta = deriveMetacognition({ route: ownerRoute, safety: { highStakes: true } });
  const executive = deriveAriExecutivePolicy({ cognitiveSignals: ablated, safety: { highStakes: true } });
  const harness = deriveDeliberationHarness({ metacognition: { ...meta, cognitiveSignals: ablated }, safety: { highStakes: true } });
  assert.equal(executive.directives.verificationDepth, "high");
  assert.equal(harness.deliberation.verificationGate, true);
  assert.equal(executive.authority.experimentalSystemsCannotCreatePermissions, true);
  assert.match(executivePolicyToInstruction(executive), /hard enforcement/);
});

test("provider failures still advance feedback when no metacognition result was returned", () => {
  const turn = { conversationId: "thread-a", turnId: "primary-failure", message: "Check the repository" };
  const state = advanceCognitiveState({ turn, workspace, result: { success: false } });
  assert.equal(state.cognitiveSignalState.feedback.failureStreak, 1);
  assert.equal(state.cognitiveSignalState.feedback.lastOutcome, "failed");
});

test("the live developer follow-up observes tool failure without extra signal calls", async t => {
  for (const [key, value] of Object.entries({ OPENAI_API_KEY: "test-only", ARI_MULTI_AGENT_ENABLED: "false", ARI_CORTEX_ADVISER_ENABLED: "false", GITHUB_TOKEN: "", GITHUB_REPO: "" })) {
    const saved = process.env[key]; process.env[key] = value;
    t.after(() => saved === undefined ? delete process.env[key] : process.env[key] = saved);
  }
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    const output = requests.length === 1
      ? [{ type: "function_call", name: "owner_repo_read", call_id: "read", arguments: JSON.stringify({ filePath: "README.md", branch: null, startLine: null, endLine: null }) }]
      : [{ type: "message", content: [{ type: "output_text", text: "The repository workspace is unavailable." }] }];
    assert.ok(requests.length <= 2);
    return { ok: true, json: async () => ({ output }) };
  });
  const result = await runAriVNext({ conversationId: "thread-a", turnId: "tool-failure", message: "Read repository README.md", history: [],
    context: { intelligenceEntitlement: ownerRoute.intelligenceEntitlement, userWorldModel: { ariCognitiveWorkspace: workspace } } });
  assert.equal(requests.length, 2, "existing model/tool/model flow only");
  assert.equal(result.metacognition.cognitiveSignals.observedOutcome, "failed");
  assert.ok(result.metacognition.cognitiveSignals.trace.some(item => item.type === "failure"));
  assert.match(requests[1].instructions, /Cognitive signal priorities:.*verify_evidence/);
  const persisted = advanceCognitiveSignalState({ current: result.metacognition.cognitiveSignals, result });
  assert.equal(persisted.feedback.lastOutcome, "failed");
});
