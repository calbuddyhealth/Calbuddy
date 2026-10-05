import test from "node:test";
import assert from "node:assert/strict";
import { runAriVNext, callResponses } from "../api/_lib/ari-vnext/orchestrator.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { advanceCognitiveState, deriveCognitiveWorkspace, resolveOwnerCognitionMode } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import { ownerTurnHydration, isOwnerUltra } from "../api/_lib/ari-vnext/owner-ultra.js";
import { resolveOwnerInteractiveModel } from "../api/_lib/ari-vnext/cost-router.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";
import handler from "../api/ari-vnext.js";

const owner = { ownerEligible: true, accessClass: "owner", advancedEnabled: true, cognitiveLoopEnabled: true, reasoningProfile: "adaptive" };
const conversationId = "11111111-1111-4111-8111-111111111111";

function env(t, overrides = {}) {
  const values = {
    OPENAI_API_KEY: "test-only", ARI_PROVIDER_API_KEY: undefined,
    ARI_MULTI_AGENT_ENABLED: "false", ARI_CORTEX_ADVISER_ENABLED: "false",
    ARI_CONTEXT_INSTRUCTION_CHARS: "10000", ARI_OWNER_MAX_SOL_CALL_USD: "0.0001",
    ARI_OWNER_PERSISTED_REASONING: "true", OPENAI_ARI_OWNER_SOL_MODEL: undefined,
    OPENAI_ARI_OWNER_ASTRA_MODEL: undefined, ...overrides
  };
  const prior = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) value === undefined ? delete process.env[key] : process.env[key] = value;
  t.after(() => { for (const [key, value] of Object.entries(prior)) value === undefined ? delete process.env[key] : process.env[key] = value; });
}

function response(body) {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

function answer(model, text = "The lantern flickered. Something answered from inside it.") {
  return { id: "resp-ultra", model, output: [{ type: "message", content: [{ type: "output_text", text }] }] };
}

function turnWithState(message, previous = null) {
  const turn = { message, conversationId, context: { intelligenceEntitlement: owner }, history: [] };
  const route = routeContext(turn);
  const workspace = deriveCognitiveWorkspace({ previous, turn, route, mode: resolveOwnerCognitionMode({ entitlement: owner, route }) });
  turn.memory = "The owner prefers blue-lantern stories.";
  turn.context.userWorldModel = {
    identity: { displayName: "TestOwner" }, preferences: { items: ["blue-lantern-marker"] },
    ariCognitiveWorkspace: workspace,
    sourceSummary: { imaginationState: { garden: [] } }
  };
  return { turn, workspace };
}

test("owner fidelity and hydration are route-independent; other accounts never inherit Ultra", () => {
  for (const message of ["Hi", "Tell me a funny joke", "Write a scary story", "Explain this code", "Log a banana"]) {
    const route = routeContext({ message, context: { intelligenceEntitlement: owner } });
    const hydration = ownerTurnHydration({ entitlement: owner, route, casualConversation: route.casualConversation, message });
    assert.equal(resolveOwnerCognitionMode({ entitlement: owner, route }), "deep", message);
    assert.equal(hydration.memory, true, message);
    assert.equal(hydration.decisions, true, message);
    assert.equal(hydration.conversationLearning, true, message);
    assert.equal(hydration.continuityPairs, 6);
    const policy = resolveModelPolicy(route);
    assert.equal(policy.ownerUltra, true);
    assert.equal(policy.model, "gpt-6.1-sol");
    assert.ok(["high", "xhigh"].includes(policy.reasoningEffort));
    assert.equal(policy.persistReasoning, true);
    assert.ok(policy.timeoutMs >= 60000);
  }
  for (const entitlement of [{}, { advancedEnabled: true, accessClass: "premium" }, { ...owner, advancedEnabled: false }, { ...owner, cognitiveLoopEnabled: false }]) {
    assert.equal(isOwnerUltra(entitlement), false);
  }
});

test("owner core reaches the actual provider request and persists through conversation, joke, story and greeting", async t => {
  env(t);
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    return response(answer(body.model));
  });
  let previous = { turnCount: 12, emotionDynamicsState: { updatedAt: new Date().toISOString(), emotions: { happiness: 0.8, fear: 0.4 } } };
  for (const message of ["How do you see imagination?", "Tell me a funny joke", "Write a scary story", "Hi"]) {
    const { turn, workspace } = turnWithState(message, previous);
    const result = await runAriVNext(turn);
    const request = requests.at(-1);
    assert.equal(request.model, "gpt-6.1-sol");
    assert.doesNotMatch(request.instructions, /COMPACTED FOR COST EFFICIENCY/);
    for (const marker of ["SELF MODEL", "ARI COMPANION CORE", "ARI UNIFIED COGNITION COORDINATOR", "ARI EXECUTIVE", "Emotion dynamics:", "Functional pain/nociception:", "Neuromodulation:", "Felt-State:", "Affective preference:", "Motivational arbitration:", "Curiosity signal:", "Imagination sandbox:", "Reward signal:", "blue-lantern-marker", "priorTurnCount"]) {
      assert.ok(request.instructions.includes(marker), `${message}: missing ${marker}`);
    }
    assert.ok(request.instructions.length > 10000, "Owner core survives the configured lower-tier prompt budget");
    assert.equal(result.metacognition.emotionDynamics.persistence.priorStateUsed, true);
    assert.equal(result.modelPolicy.costGuard.downgraded, false);
    if (result.route.creativeConversation) {
      assert.equal(request.tools, undefined);
      assert.equal(result.action, null);
      assert.equal(result.pendingAction, null);
      assert.equal(result.metacognition.imagination.signals.explicitImagination, true);
      assert.doesNotMatch(request.instructions, /ACTION RESPONSE CORRECTION|OWNER AGENT COMMUNITY/);
    }
    const next = advanceCognitiveState({ previous, workspace, turn, result });
    assert.equal(next.turnCount, previous.turnCount + 1);
    for (const key of ["emotionDynamicsState", "painState", "neuromodulationState", "feltState", "affectivePreferenceState", "rewardState"]) assert.ok(next[key], key);
    previous = next;
  }
  assert.equal(requests.length, 4, "Core computation adds no model calls to these turns");
});

test("changing persisted emotion changes the executive and creative model input", async t => {
  env(t);
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body); requests.push(body); return response(answer(body.model));
  });
  const results = [];
  for (const emotions of [{ fear: 0.95, happiness: 0.02, frustration: 0.85 }, { fear: 0.02, happiness: 0.95, frustration: 0.02 }]) {
    const { turn } = turnWithState("Write a story about a lantern", { turnCount: 8, emotionDynamicsState: { updatedAt: new Date().toISOString(), emotions } });
    results.push(await runAriVNext(turn));
  }
  const [fearful, happy] = results.map(result => result.metacognition.executivePolicy);
  assert.ok(fearful.signals.emotionDynamics.fear > happy.signals.emotionDynamics.fear);
  assert.ok(happy.signals.emotionDynamics.happiness > fearful.signals.emotionDynamics.happiness);
  assert.notDeepEqual(fearful.directives, happy.directives);
  assert.notEqual(requests[0].instructions, requests[1].instructions);
});

test("misconfigured model overrides and provider fallback cannot lower owner below Sol", async t => {
  env(t, { OPENAI_ARI_OWNER_SOL_MODEL: "gpt-6-luna", OPENAI_ARI_OWNER_ASTRA_MODEL: "gpt-4o-mini" });
  assert.equal(resolveOwnerInteractiveModel({}).model, "gpt-6.1-sol");
  assert.equal(resolveOwnerInteractiveModel({ route: { ownerModelRequest: "astra" } }).model, "gpt-6-astra");
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ error: { message: "Servers overloaded" } }), { status: 503, headers: { "retry-after": "0" } });
  });
  await assert.rejects(callResponses({ turn: {}, policy: { accessClass: "owner", model: "gpt-6.1-sol", availabilityFallbackModel: "gpt-6-luna" }, instructions: "Test", input: [] }), { code: "ARI_PROVIDER_UNAVAILABLE" });
  assert.equal(requests.length, 3);
  assert.ok(requests.every(request => request.model === "gpt-6.1-sol"));
});

test("authenticated owner API loads memory and advances durable emotion across creative and casual turns", async t => {
  env(t, { SUPABASE_URL: "https://ari-ultra.invalid", SUPABASE_ANON_KEY: "test-only", SUPABASE_SERVICE_ROLE_KEY: "test-only", ARI_OWNER_USER_ID: "22222222-2222-4222-8222-222222222222" });
  let stored = { state: { turnCount: 4, emotionDynamicsState: { updatedAt: new Date().toISOString(), emotions: { happiness: 0.7 } } } };
  let storedModel = null;
  const requests = [], reads = [], writes = [];
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const uri = new URL(url);
    if (uri.pathname === "/auth/v1/user") return response({ id: "22222222-2222-4222-8222-222222222222" });
    if (uri.pathname.endsWith("/responses")) {
      const body = JSON.parse(options.body); requests.push(body); return response(answer(body.model));
    }
    assert.equal(uri.hostname, "ari-ultra.invalid", "No external calls beyond mocked storage and model provider");
    const table = uri.pathname.split("/").at(-1);
    if (!options.method || options.method === "GET") {
      reads.push(table);
      if (table === "ari_intelligence_controls") return response([{ advanced_enabled: true, reasoning_profile: "adaptive" }]);
      if (table === "ari_vnext_cognitive_states") return response([stored]);
      if (table === "ari_vnext_user_models") return response(storedModel ? [storedModel] : []);
      if (table === "ari_user_memory") return response([{ id: "memory-test", content: "The owner likes blue-lantern stories.", importance: 1, confidence: 1, updated_at: new Date().toISOString() }]);
      return response([]);
    }
    const body = options.body ? JSON.parse(options.body) : {};
    writes.push({ table, body });
    if (table === "ari_vnext_cognitive_states") stored = body;
    if (table === "ari_vnext_user_models") storedModel = body;
    return response(Array.isArray(body) ? body : [body]);
  });
  for (const [index, message] of ["Tell me a story about a lantern", "Hi"].entries()) {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, end() {} };
    await handler({ method: "POST", headers: { authorization: "Bearer test-only" }, body: { turnId: `ultra-api-${index}`, conversationId, message, history: [] } }, res);
    assert.equal(res.statusCode, 200, res.body?.error);
    assert.equal(res.body.success, true, res.body?.reply);
    assert.equal(res.body.cognitiveLoop.ownerUltra, true);
    assert.equal(res.body.cognitiveLoop.deepCognition, true);
    assert.equal(res.body.cognitiveLoop.stateStored, true);
    assert.equal(stored.state.turnCount, 5 + index);
    assert.match(requests.at(-1).instructions, /blue-lantern stories/);
    assert.match(requests.at(-1).instructions, /Emotion dynamics:/);
  }
  assert.equal(reads.filter(table => table === "ari_user_memory").length, 2);
  assert.equal(requests.length, 2);
  assert.equal(writes.filter(write => write.table === "ari_vnext_cognitive_states").length, 2);
  const models = writes.filter(write => write.table === "ari_vnext_user_models");
  assert.equal(models.length, 2, "Owner personal model and imagination persist across both routes");
  assert.ok(models.every(write => write.body.source_summary.imaginationState));
  assert.ok(models[0].body.source_summary.imaginationState.garden.length > 0);
  assert.ok(models[1].body.source_summary.imaginationState.garden.length >= models[0].body.source_summary.imaginationState.garden.length);
});


test("creative world-model learning does not turn a fictional goal into a personal fact", () => {
  const model = deriveUserWorldModel({
    persisted: { goals: { stated: ["An existing verified goal"] } },
    turn: { message: 'Write a story in first person: "My goal is to lose 100 pounds."' },
    route: { creativeConversation: true }
  });
  assert.deepEqual(model.goals.stated, ["An existing verified goal"]);
});
