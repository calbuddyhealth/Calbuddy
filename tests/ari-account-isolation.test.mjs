import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const guardSource = fs.readFileSync("js/account-isolation-guard.js", "utf8");
const authSource = fs.readFileSync("js/auth.js", "utf8");
const nutritionUiSource = fs.readFileSync("ari/actions/ari-nutrition-action-ui.js", "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; },
    dump() { return new Map(values); }
  };
}

class FakeCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

function makeSandbox() {
  const local = storage();
  const session = storage();
  const events = [];
  let currentUser = { id: "user-a" };
  let executed = 0;
  let adapterExecutions = 0;
  let authListener = null;

  const CalBuddy = {
    pendingAction: null,
    setPendingAction(action) {
      this.pendingAction = action;
      local.setItem("calbuddyPendingAction", JSON.stringify(action));
      return action;
    },
    getPendingAction() {
      if (this.pendingAction) return this.pendingAction;
      const raw = local.getItem("calbuddyPendingAction");
      return raw ? JSON.parse(raw) : null;
    },
    clearPendingAction() {
      this.pendingAction = null;
      local.removeItem("calbuddyPendingAction");
    },
    async executeAction(action) {
      executed += 1;
      return { success: true, action };
    },
    async confirmPendingAction() {
      const action = this.getPendingAction();
      if (!action) return { success: false };
      const result = await this.executeAction(action);
      this.clearPendingAction();
      return { success: true, result };
    },
    async getCurrentUser() { return currentUser; }
  };

  const bridge = {
    pendingStorageKey: "ari_vnext_pending_action",
    async getSession() { return { user: currentUser, access_token: "token" }; },
    getPendingAction() { return null; },
    setPendingAction(action) {
      session.setItem(this.pendingStorageKey, JSON.stringify(action));
      return action;
    },
    clearPendingAction() { session.removeItem(this.pendingStorageKey); },
    async ask() { return { reply: "ok" }; }
  };

  const adapter = {
    async executeConfirmed(input) {
      adapterExecutions += 1;
      return { success: true, input };
    }
  };

  const windowObject = {
    CalBuddy,
    AriVNextBridge: bridge,
    AriVNextActionAdapter: adapter,
    calbuddySupabase: {
      auth: {
        onAuthStateChange(callback) {
          authListener = callback;
          return { data: { subscription: { unsubscribe() {} } } };
        }
      }
    },
    getCurrentSession: async () => ({ user: currentUser, access_token: "token" }),
    dispatchEvent(event) { events.push(event); },
    addEventListener() {},
    setTimeout,
    clearTimeout
  };

  const sandbox = {
    window: windowObject,
    CalBuddy,
    localStorage: local,
    sessionStorage: session,
    CustomEvent: FakeCustomEvent,
    console,
    setTimeout,
    clearTimeout,
    Object,
    JSON,
    Date
  };

  vm.createContext(sandbox);
  vm.runInContext(guardSource, sandbox, { filename: "account-isolation-guard.js" });

  return {
    sandbox,
    local,
    session,
    events,
    setUser(id) { currentUser = id ? { id } : null; },
    getExecuted: () => executed,
    getAdapterExecutions: () => adapterExecutions,
    emitAuth(event, id) { authListener?.(event, id ? { user: { id } } : null); }
  };
}

async function settle() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 5));
}

test("Account A pending action cannot survive into Account B", async () => {
  const ctx = makeSandbox();
  await settle();

  const stored = ctx.sandbox.window.CalBuddy.setPendingAction({
    action_type: "log_activity",
    payload: { activity_name: "Arm workout" }
  });

  assert.equal(stored.user_id, "user-a");
  assert.equal(stored.owner_user_id, "user-a");
  assert.equal(ctx.local.getItem("calbuddyPendingAction"), null);
  assert.ok(ctx.local.getItem("arixp:u:user-a:calbuddyPendingAction"));

  ctx.local.setItem("ari_training_workout_plan_v3", JSON.stringify({ owner: "user-a" }));
  ctx.setUser("user-b");
  ctx.sandbox.window.AriAccountIsolation.activateUser("user-b");

  assert.equal(ctx.sandbox.window.CalBuddy.getPendingAction(), null);
  assert.equal(ctx.local.getItem("ari_training_workout_plan_v3"), null);
  assert.equal(
    JSON.parse(ctx.local.getItem("arixp:u:user-a:ari_training_workout_plan_v3")).owner,
    "user-a"
  );
});

test("confirmation fails closed when a pending action belongs to another user", async () => {
  const ctx = makeSandbox();
  await settle();

  ctx.sandbox.window.CalBuddy.setPendingAction({
    action_type: "log_activity",
    payload: { activity_name: "Arm workout" }
  });

  ctx.setUser("user-b");
  ctx.sandbox.window.ARI_XP_ACTIVE_USER_ID = "user-b";
  ctx.session.setItem("arixp_active_user_id_v1", "user-b");

  const result = await ctx.sandbox.window.CalBuddy.confirmPendingAction();
  assert.equal(result.success, false);
  assert.equal(ctx.getExecuted(), 0);
});

test("vNext pending action is scoped to the authenticated account", async () => {
  const ctx = makeSandbox();
  await settle();

  const action = ctx.sandbox.window.AriVNextBridge.setPendingAction({
    id: "act-a",
    sourceTurnId: "turn-a",
    name: "log_activity",
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  });
  assert.equal(action.ownerUserId, "user-a");
  assert.ok(ctx.session.getItem("arixp:u:user-a:ari_vnext_pending_action"));

  ctx.setUser("user-b");
  ctx.sandbox.window.AriAccountIsolation.activateUser("user-b");
  assert.equal(ctx.sandbox.window.AriVNextBridge.getPendingAction(), null);
});

test("vNext confirmed execution blocks an action owned by a different account", async () => {
  const ctx = makeSandbox();
  await settle();

  ctx.setUser("user-b");
  ctx.sandbox.window.AriAccountIsolation.activateUser("user-b");
  const result = await ctx.sandbox.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: {
      id: "act-a",
      sourceTurnId: "turn-a",
      ownerUserId: "user-a",
      name: "log_activity"
    }
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "pending_action_account_mismatch");
  assert.equal(ctx.getAdapterExecutions(), 0);
});

test("sign-out/account deactivation clears active browser state", async () => {
  const ctx = makeSandbox();
  await settle();

  ctx.local.setItem("ari_training_workout_progress_v3", JSON.stringify({ owner: "user-a" }));
  ctx.sandbox.window.CalBuddy.setPendingAction({ action_type: "log_activity", payload: {} });
  ctx.sandbox.window.AriAccountIsolation.deactivateUser();

  assert.equal(ctx.local.getItem("ari_training_workout_progress_v3"), null);
  assert.equal(ctx.local.getItem("calbuddyPendingAction"), null);
  assert.equal(ctx.session.getItem("ari_vnext_pending_action"), null);
  assert.equal(ctx.session.getItem("arixp_active_user_id_v1"), null);
});

test("Nutrition surface cannot render Training or activity pending actions", () => {
  assert.match(nutritionUiSource, /NUTRITION_ACTION_TYPES/);
  assert.doesNotMatch(nutritionUiSource, /type === "plan_workout"/);
  assert.match(nutritionUiSource, /if \(!isNutritionAction\(action\)\)/);
  assert.match(nutritionUiSource, /if \(!isNutritionAction\(current\)\)/);
});

test("auth boots account isolation before Ari routing and no longer boots workout actions on Nutrition", () => {
  assert.match(authSource, /account-isolation-guard\.js\?v=1\.0\.0/);
  assert.equal(authSource.includes("bootstrapAriWorkoutActionForNutrition"), false);
  assert.ok(authSource.indexOf("bootstrapAccountIsolation();") < authSource.indexOf("bootstrapAriCentralIntentRouter();"));
  assert.match(authSource, /AriAccountIsolation\?\.deactivateUser/);
});
