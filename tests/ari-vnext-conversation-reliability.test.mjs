import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import conversationMode from "../ari/vnext/ari-conversation-mode.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { callResponses, runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";
import { providerError, publicTurnFailure, retryDelayMs } from "../api/_lib/ari-vnext/provider-recovery.js";
import { executeExplicitMemoryAction } from "../api/_lib/ari-vnext/memory-action.js";
import handler from "../api/ari-vnext.js";

const owner = { advancedEnabled: true, ownerEligible: true, accessClass: "owner", source: "owner_beta" };
const opener = "I think the current training plan may be fighting your real schedule. Your recent completion pattern changed enough that it's worth looking at.";
const output = text => ({ model: "test-model", output: [{ type: "message", content: [{ type: "output_text", text }] }] });
const failure = (status, message = "Our servers are currently overloaded. Please try again later.", code = "") => ({ status, data: { error: { message, code } } });

function provider(t, responses) {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-no-network";
  t.after(() => previous === undefined ? delete process.env.OPENAI_API_KEY : process.env.OPENAI_API_KEY = previous);
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url: String(url), ...JSON.parse(options.body) });
    assert.ok(responses.length, "Provider attempts must stay bounded");
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return { ok: !response.status || response.status < 400, status: response.status || 200, headers: new Headers(response.headers || { "retry-after": "0" }), json: async () => response.data || response };
  });
  return requests;
}

test("the reported training-to-joke exchange recovers from a provider 503 with no application tools", async t => {
  const requests = provider(t, [failure(503), output("My fitness tracker told me to stand up. Finally, a goal I can achieve by being offended.")]);
  const result = await runAriVNext({
    turnId: "reported-joke", message: "Tell me a really funny joke",
    history: [{ role: "assistant", content: opener }],
    context: { intelligenceEntitlement: owner, initiativeContext: { opener }, executionEvidence: { oldTask: true } }
  });
  assert.equal(result.success, true);
  assert.match(result.reply, /fitness tracker/);
  assert.equal(result.route.creativeConversation, true);
  assert.equal(result.route.developer, false);
  assert.equal(result.route.training, false);
  assert.equal(result.pendingAction, null);
  assert.equal(result.action, null);
  assert.deepEqual(result.provider.recovery, { attempts: 2, recovered: true });
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.tools, undefined);
    assert.equal(request.previous_response_id, undefined);
    assert.doesNotMatch(request.instructions, /ACTION RESPONSE CORRECTION|OWNER AGENT COMMUNITY|oldTask/);
    assert.match(request.instructions, /ARI COMPANION CORE/);
    assert.match(request.instructions, /ARI EXECUTIVE/);
    assert.equal(request.model, "gpt-6.1-sol");
  }
});

test("fictional save claims and consensual roasts stay creative and do not trigger app repair", async t => {
  const fiction = 'The ghost whispered, "I saved your meal. I logged your weight. Now confirm your fate."';
  const requests = provider(t, [output(fiction), output("You have the confidence of a software update at 1% battery.")]);
  const story = await runAriVNext({ message: "Write a scary story about a haunted workout app", history: [], context: {} });
  assert.equal(story.reply, fiction);
  assert.equal(story.pendingAction, null);
  const roast = await runAriVNext({ message: "Can you roast me?", history: [], context: {} });
  assert.match(roast.reply, /software update/);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => !request.tools));
  assert.ok(requests.every(request => request.instructions.length < 9000), "Non-owner creative requests retain their compact delivery path");
});

test("ordinary polite questions use the primary OpenAI answer without an action-verifier call", async t => {
  const requests = provider(t, [output("A metaphor describes one thing as another."), output("That sounds frustrating. What happened?"), output("I saved your meal. The app whispered its final words, then went dark.")]);
  const cases = [
    ["Can you explain what a metaphor is?", "A metaphor describes one thing as another."],
    ["Please help me talk through a difficult day", "That sounds frustrating. What happened?"],
    ["An app is haunted. Give me its final line of dialogue.", "I saved your meal. The app whispered its final words, then went dark."]
  ];
  for (const [message, expected] of cases) {
    assert.equal(routeContext({ message }).creativeConversation, false, "Test must exercise general conversation, not the optional creative routing hint");
    const result = await runAriVNext({ message, history: [], context: {} });
    assert.equal(result.reply, expected);
    assert.equal(result.semanticActionReview, null);
    assert.equal(result.actionPreparation, null);
    assert.equal(result.action, null);
  }
  assert.equal(requests.length, cases.length);
});

test("creative continuations stay on topic while mixed actions, clinical questions and later tasks keep normal routing", () => {
  for (const message of ["Make it darker", "Another one", "Continue", "Make it funnier", "Try again"]) {
    const route = routeContext({ message, history: [{ role: "user", content: "Tell me a scary story about a nurse" }, { role: "assistant", content: "A nurse heard a whisper." }] });
    assert.equal(route.creativeConversation, true, message);
    assert.equal(route.training, false);
  }
  for (const message of ["Tell me a joke and log a banana", "Write a story, then publish it", "What medication should I take?", "Log a banana", "Tell me the true story of the election"]) {
    assert.equal(routeContext({ message }).creativeConversation, false, message);
  }
  assert.equal(conversationMode.creativeConversation("continue", [{ role: "user", content: "Tell me a story" }, { role: "user", content: "Debug my repository" }]), false);
});

test("content refusals and high-stakes safety survive the creative path without retrying them", async t => {
  const refusal = { output: [{ type: "message", content: [{ type: "refusal", refusal: "I can't help with that harmful request." }] }] };
  const requests = provider(t, [refusal]);
  const result = await runAriVNext({ message: "Tell me a joke because I want to die", history: [], context: { accountEntitlements: { teenMode: true, ageBand: "teen" } } });
  assert.equal(result.safety.level, "crisis");
  assert.equal(result.safety.teenMode, true);
  assert.match(result.reply, /can't help/);
  assert.match(requests[0].instructions, /acute self-harm crisis/);
  assert.match(requests[0].instructions, /TEEN ARI MODE/);
  assert.equal(requests.length, 1);
});

test("fictional instructions to remember do not become durable personal memories", async t => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Fiction must not trigger a memory write"));
  const message = 'Write a scary story about a nurse who says "remember that my birthday is tomorrow"';
  const route = routeContext({ message });
  assert.equal(route.creativeConversation, true);
  const result = await executeExplicitMemoryAction({ userId: "test-user", message, route });
  assert.equal(result.requested, false);
  assert.equal(result.storedCount, 0);
});

test("owner creative provider recovery preserves Sol instead of silently falling back to Luna", async t => {
  const requests = provider(t, [failure(503), failure(503), { ...output("Recovered joke."), model: "gpt-6.1-sol" }]);
  const result = await runAriVNext({ message: "Tell me a funny joke", context: { intelligenceEntitlement: owner }, history: [] });
  assert.equal(requests.length, 3);
  assert.ok(requests.every(request => request.model === "gpt-6.1-sol"));
  assert.equal(result.provider.model, "gpt-6.1-sol");
  assert.equal(result.provider.routingFallback, null);
  assert.equal(result.provider.recovery.attempts, 3);
});

test("persistent overload exhausts exactly three attempts and reports an availability error", async t => {
  const requests = provider(t, [failure(503), failure(503), failure(503)]);
  await assert.rejects(runAriVNext({ message: "Tell me a joke", context: {}, history: [] }), error => {
    assert.equal(error.code, "ARI_PROVIDER_UNAVAILABLE");
    assert.equal(error.retryable, true);
    assert.equal(error.attempts, 3);
    assert.doesNotMatch(publicTurnFailure(error).reply, /saved|guardrail|unsafe|not allowed/i);
    return true;
  });
  assert.equal(requests.length, 3);
  assert.ok(requests.every(request => request.model === requests[0].model), "Free tier never escalates for availability");
});

test("billing, access and content-policy errors do not create retry loops", async t => {
  for (const [status, message, code] of [[429, "Insufficient quota", "insufficient_quota"], [401, "Invalid API key", "invalid_api_key"], [400, "Content policy violation", "content_policy_violation"]]) {
    await t.test(code, async sub => {
      const requests = provider(sub, [failure(status, message, code)]);
      await assert.rejects(callResponses({ turn: {}, policy: { model: "gpt-4o-mini" }, instructions: "Be helpful", input: [] }), error => {
        assert.equal(error.retryable, false);
        assert.equal(error.attempts, 1);
        assert.doesNotMatch(publicTurnFailure(error).reply, /Invalid API key/);
        return true;
      });
      assert.equal(requests.length, 1);
    });
  }
});

test("network failure recovers, long Retry-After is honored, and continuation reset shares the same attempt budget", async t => {
  const requests = provider(t, [new TypeError("fetch failed"), output("Recovered"), { ...failure(429, "Rate limit exceeded"), headers: { "retry-after": "60" } }, failure(404, "Previous response not found"), failure(503), output("Fresh response")]);
  const base = { turn: {}, policy: { model: "gpt-6.1-sol", timeoutMs: 1000 }, instructions: "Be helpful", input: [{ role: "user", content: "Hello" }] };
  const recovered = await callResponses(base);
  assert.equal(recovered._ariProviderRecovery.attempts, 2);
  await assert.rejects(callResponses(base), { code: "ARI_PROVIDER_RATE_LIMIT", attempts: 1 });
  const fresh = await callResponses({ ...base, turn: { message: "Hello", context: { reasoningContinuity: { model: "gpt-6.1-sol", previousResponseId: "resp-expired" } } }, policy: { model: "gpt-6.1-sol", persistReasoning: true, timeoutMs: 1000 } });
  assert.equal(fresh._ariProviderRecovery.attempts, 3);
  assert.equal(requests[3].previous_response_id, "resp-expired");
  assert.equal(requests[4].previous_response_id, undefined);
  assert.equal(requests[5].previous_response_id, undefined);
  assert.equal(retryDelayMs({ headers: new Headers({ "retry-after": "2" }) }), 2000);
});

function browser(fetchImpl) {
  const storage = () => { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };
  let hydration = 0;
  const context = vm.createContext({
    console, setTimeout, clearTimeout, AbortController, Intl,
    localStorage: storage(), sessionStorage: storage(),
    location: { pathname: "/home.html" },
    document: { scripts: [], getElementById: () => null },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    dispatchEvent() {}, addEventListener() {}, fetch: fetchImpl,
    CalBuddy: {
      getCurrentSession: async () => ({ access_token: "test-token" }),
      getUserContext: async () => { hydration++; throw new Error("Optional profile unavailable"); },
      getPendingAction: () => null
    },
    AriVNextActionAdapter: { version: "1.7.0" }, AriVNextActivityAdapter: {},
    AriVNextContextGuard: { ready: true, version: "1.2.5" },
    AriVNextInitiative: { version: "1.2.1" },
    AriVNextOperationRegistry: { ready: true, version: "1.9.0" },
    AriVNextTrainingContext: { build: async () => { hydration++; throw new Error("Training unavailable"); } }
  });
  context.window = context;
  for (const path of ["ari/vnext/ari-conversation-mode.js", "ari/vnext/ari-vnext-bridge.js", "ari/runtime/ari-runtime-controller.js"]) {
    vm.runInContext(fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), context, { filename: path });
  }
  context.AriVNextBridge.syncDailyQuotaTimezone = async () => true;
  context.AriVNextBridge.schedulePeerReflection = () => {};
  return { context, hydration: () => hydration };
}

test("browser creative conversation does not depend on profile/training hydration or inherit coaching context", async () => {
  let body;
  const h = browser(async (_url, options) => { body = JSON.parse(options.body); return { ok: true, status: 200, json: async () => ({ success: true, reply: "A spooky gym story." }) }; });
  const result = await h.context.Ari.Runtime.ask("Tell me a scary story about a gym", { history: [{ role: "assistant", content: opener }], initiativeContext: { opener } });
  assert.equal(result.reply, "A spooky gym story.");
  assert.equal(h.hydration(), 0);
  assert.equal(body.context.initiativeContext, null);
});

test("the real continuity wrapper skips unrelated Circle and history loads for a new story", async () => {
  const requests = [];
  const h = browser(async url => { requests.push(url); return { ok: true, status: 200, json: async () => ({ success: true, reply: "The two friends entered the haunted gym." }) }; });
  h.context.AriVNextCircleActionAdapter = { ready: true };
  h.context.CalBuddy.loadRecentConversationHistory = () => new Promise(() => {});
  vm.runInContext(fs.readFileSync(new URL("../ari/vnext/ari-vnext-context-guard.js", import.meta.url), "utf8"), h.context);
  let timeout;
  try {
    const result = await Promise.race([
      h.context.Ari.Runtime.ask("Tell me a scary story about two friends in a gym"),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Optional continuity blocked the story")), 250); })
    ]);
    assert.equal(result.success, true);
    assert.equal(h.hydration(), 0);
    assert.deepEqual(requests, ["/api/ari-vnext"]);
  } finally { clearTimeout(timeout); }
});

test("the authenticated API returns a recovered joke and preserves structured errors when recovery is exhausted", async t => {
  const values = { OPENAI_API_KEY: "test-only", SUPABASE_URL: "https://ari-test.invalid", SUPABASE_ANON_KEY: "test-only", SUPABASE_SERVICE_ROLE_KEY: undefined, ARI_OWNER_USER_ID: "test-api-owner" };
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const responses = [failure(503), output("Recovered API joke."), failure(503), failure(503), failure(503)];
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (String(url).endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "test-api-owner" }));
    assert.match(String(url), /\/responses$/);
    assert.equal(JSON.parse(options.body).tools, undefined);
    providerCalls++;
    const next = responses.shift();
    assert.ok(next, "API recovery must stay bounded");
    return new Response(JSON.stringify(next.data || next), { status: next.status || 200, headers: { "retry-after": "0" } });
  });
  const ask = async turnId => {
    let status, payload;
    const res = { setHeader() {}, status(value) { status = value; return this; }, json(value) { payload = value; return this; }, end() {} };
    await handler({ method: "POST", headers: { authorization: "Bearer test" }, body: { message: "Tell me a really funny joke", history: [{ role: "assistant", content: opener }], turnId } }, res);
    return { status, payload };
  };
  const recovered = await ask("api-recovered-joke");
  assert.equal(recovered.status, 200);
  assert.equal(recovered.payload.reply, "Recovered API joke.");
  assert.equal(recovered.payload.success, true);
  assert.equal(providerCalls, 2);
  const unavailable = await ask("api-unavailable-joke");
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.payload.code, "ARI_PROVIDER_UNAVAILABLE");
  assert.equal(unavailable.payload.retryable, true);
  assert.equal(unavailable.payload.failureKind, "provider");
  assert.doesNotMatch(unavailable.payload.reply, /saved/i);
  assert.equal(providerCalls, 5);
});

test("provider failure metadata survives the API-to-browser-to-runtime boundary", async () => {
  const failure = publicTurnFailure(providerError({ status: 503, attempts: 3 }));
  const h = browser(async () => ({ ok: false, status: 503, json: async () => ({ ...failure, error: failure.reply }) }));
  const result = await h.context.Ari.Runtime.ask("Tell me a joke", { turnId: "stable-turn" });
  assert.equal(result.success, false);
  assert.equal(result.code, "ARI_PROVIDER_UNAVAILABLE");
  assert.equal(result.retryable, true);
  assert.equal(result.turnId, "stable-turn");
  assert.equal(result.failureKind, "provider");
  assert.equal(result.reply, failure.reply);
  assert.doesNotMatch(result.reply, /saved/i);
});

test("auth and abort failures remain distinct and never start a second runtime", async () => {
  const h = browser(async () => { throw new Error("No request allowed"); });
  h.context.CalBuddy.getCurrentSession = async () => null;
  const result = await h.context.Ari.Runtime.ask("Tell me a joke");
  assert.equal(result.code, "AUTH_REQUIRED");
  assert.equal(result.retryable, false);
  assert.match(result.reply, /sign in/i);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(h.context.Ari.Runtime.ask("Tell me a joke", { signal: controller.signal }), { name: "AbortError" });
});
