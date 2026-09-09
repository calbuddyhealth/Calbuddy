import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { resolvePendingActionIntent } from "../api/_lib/ari-vnext/pending-action.js";

const paths = [
  "calbuddy-core.js",
  "ari/vnext/ari-vnext-bridge.js",
  "ari/vnext/ari-vnext-action-adapter.js",
  "ari/vnext/ari-vnext-operation-registry.js",
  "js/home.js",
  "ari/runtime/ari-runtime-controller.js"
];
const sources = new Map(await Promise.all(paths.map(async (path) => [
  path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")
])));

function meal(id, name = "Banana", overrides = {}) {
  return {
    id, name: "log_meal", sourceTurnId: `turn-${id}`,
    status: "pending_confirmation",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    arguments: { name, calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, servingSize: "1 medium", ...overrides }
  };
}

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

function harness() {
  const listeners = new Map();
  const classes = new Set();
  const buttons = [{ disabled: false }, { disabled: false }];
  const bar = {
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    querySelectorAll: () => buttons,
    setAttribute() {}
  };
  const label = { textContent: "" };
  const displayed = [], requests = [], replies = [], writes = [], savedTurns = [];
  let failWrite = false;
  const context = vm.createContext({
    console, Date, Math, Map, Set, AbortController,
    localStorage: storage(), sessionStorage: storage(),
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    location: { pathname: "/home.html", href: "https://example.test/home.html" },
    document: {
      addEventListener() {}, scripts: [],
      getElementById: (id) => id === "pendingActionBar" ? bar : id === "pendingActionText" ? label : null,
      querySelectorAll: () => [], querySelector: () => null
    },
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); },
    async fetch(url, options) {
      assert.equal(url, "/api/ari-vnext");
      requests.push(JSON.parse(options.body));
      assert.ok(replies.length, "Every model response must be provided by the test");
      return { ok: true, status: 200, json: async () => replies.shift() };
    }
  });
  context.window = context;
  for (const path of paths) {
    if (path === "ari/runtime/ari-runtime-controller.js") {
      Object.assign(context.CalBuddy, {
        askAri: async () => { throw new Error("Unexpected legacy fallback"); },
        getCurrentSession: async () => ({ access_token: "test-token" }),
        getCurrentUser: async () => null,
        getUserContext: async () => ({}),
        saveConversationTurn: async (turn) => { savedTurns.push(turn); return true; },
        logMeal: async (payload) => {
          if (failWrite) return { success: false, message: "Meal save failed." };
          writes.push(payload);
          return { success: true, reply: `Logged ${payload.name}.` };
        }
      });
      context.AriVNextActivityAdapter = {};
      context.AriVNextMealPlanAdapter = { ready: true };
      context.AriVNextContextGuard = { ready: true };
      context.AriVNextBridge.schedulePeerReflection = () => {};
    }
    vm.runInContext(sources.get(path), context, { filename: path });
  }
  context.addAriMessage = (text, sender = "ari") => displayed.push({ text, sender });
  context.setAriPose = () => {};
  context.resetAriAfterDelay = () => {};
  context.refreshHomeDashboard = async () => {};

  return {
    context, displayed, requests, writes, savedTurns,
    failWrites(value) { failWrite = value; },
    get visible() { return classes.has("show"); },
    get history() { return vm.runInContext("ariChatHistory", context); },
    async ask(message, result) {
      replies.push(result);
      const response = await context.CalBuddy.askAri({ message, history: this.history });
      vm.runInContext("ariChatHistory.push({role:'user',content:__message},{role:'assistant',content:__reply})", Object.assign(context, { __message: message, __reply: response.reply }));
      return response;
    },
    propose(pending) {
      return this.ask(`Log ${pending.arguments.name}`, { success: true, reply: `Ready to log ${pending.arguments.name}. Confirm to save.`, pendingAction: pending, action: { type: "proposed_action" } });
    }
  };
}

test("natural cancellation closes only the current proposal", () => {
  const pendingAction = meal("cancelled");
  for (const message of ["cancel", "cancel it", "cancel that", "don't log it", "never mind"]) {
    assert.equal(resolvePendingActionIntent({ message, pendingAction }).type, "cancel", message);
  }
  assert.equal(resolvePendingActionIntent({ message: "Cancel it and log a banana instead", pendingAction }).type, "none");
});

test("natural confirmation resolves the existing proposal without creating a new one", () => {
  const pendingAction = meal("confirmed");
  for (const message of ["confirm", "I confirm", "yes please", "yes log it"]) {
    assert.equal(resolvePendingActionIntent({ message, pendingAction }).type, "confirm", message);
  }
  assert.equal(resolvePendingActionIntent({ message: "Yes, log two bananas instead", pendingAction }).type, "none");
});

test("cancel button records the outcome and a new meal gets fresh buttons in the same conversation", async () => {
  const h = harness();
  await h.propose(meal("first", "Eggs"));
  assert.equal(h.visible, true);
  await h.context.cancelAriAction();
  assert.equal(h.visible, false);
  assert.equal(h.context.AriVNextBridge.getPendingAction(), null);
  assert.equal(h.context.CalBuddy.getPendingAction(), null);
  assert.equal(h.writes.length, 0);
  assert.ok(h.history.some((item) => item.role === "user" && /cancel/i.test(item.content)));
  assert.ok(h.history.some((item) => item.role === "assistant" && /cancel|won.t|not saved/i.test(item.content)));

  await h.propose(meal("second", "Banana"));
  assert.equal(h.requests.at(-1).pendingAction, null);
  assert.equal(h.visible, true);
  assert.equal(h.context.CalBuddy.getPendingAction().vnext_action_id, "second");
  await h.context.confirmAriAction();
  assert.deepEqual(h.writes.map((entry) => entry.name), ["Banana"]);
  assert.match(h.displayed.at(-1).text, /Logged Banana/);
  assert.equal(h.visible, false);
});

test("failed confirmation reports failure and retains the buttons for retry or cancel", async () => {
  const h = harness();
  await h.propose(meal("failed"));
  h.failWrites(true);
  await h.context.confirmAriAction();
  assert.equal(h.writes.length, 0);
  assert.match(h.displayed.at(-1).text, /failed/i);
  assert.doesNotMatch(h.displayed.at(-1).text, /done|logged/i);
  assert.equal(h.visible, true);
  h.failWrites(false);
  await h.context.confirmAriAction();
  assert.equal(h.writes.length, 1);
});

test("unprepared meal never claims it is ready and does not leave an invisible proposal", async () => {
  const h = harness();
  const result = await h.propose(meal("invalid", "Eggs", { calories: null }));
  assert.equal(result.pendingAction, null);
  assert.doesNotMatch(result.reply, /ready to log|confirm to save/i);
  assert.equal(h.context.AriVNextBridge.getPendingAction(), null);
  await h.propose(meal("valid"));
  assert.equal(h.visible, true);
});

test("failed typed confirmation remains retryable and never falls back to conversation", async () => {
  const h = harness();
  const pending = meal("typed");
  await h.propose(pending);
  h.failWrites(true);
  const result = await h.ask("confirm", {
    success: true, reply: "", pendingAction: pending,
    action: { type: "execute_pending_action", pendingActionId: pending.id }
  });
  assert.equal(result.execution.success, false);
  assert.match(result.reply, /failed/i);
  assert.equal(result.pendingAction.vnext_action_id, pending.id);
  assert.equal(h.context.AriVNextBridge.getPendingAction().id, pending.id);
  assert.equal(h.writes.length, 0);
});

test("an exception while preparing an action stays inside the action failure boundary", async () => {
  const h = harness();
  h.context.AriVNextActionAdapter.createCalBuddyPendingAction = async () => { throw new Error("Confirmation preparation failed."); };
  const result = await h.propose(meal("mapping-threw"));
  assert.equal(result.actionMapping.success, false);
  assert.match(result.reply, /not saved/);
  assert.equal(h.context.AriVNextBridge.getPendingAction(), null);
});
