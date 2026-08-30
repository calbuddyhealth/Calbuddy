import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makeActivityPending(id = "activity-action-1", overrides = {}) {
  return {
    id,
    name: "log_activity",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: {
      activityName: "Run",
      durationMinutes: 30,
      sets: null,
      repsPerSet: null,
      caloriesBurned: 280,
      intensity: "moderate",
      averageHeartRate: 145,
      dateText: "today",
      notes: "",
      ...(overrides.arguments || {})
    },
    ...overrides
  };
}

function makeHarness({ executeSuccess = true, prepareSuccess = true } = {}) {
  let bridgePending = null;
  let legacyPending = null;
  const executed = [];
  const prepared = [];
  let fallbackCreates = 0;
  let fallbackExecutes = 0;

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "legacy-activity-pending", ...action };
    },
    setPendingAction(action) {
      legacyPending = action;
    },
    getPendingAction() {
      return legacyPending;
    },
    clearPendingAction() {
      legacyPending = null;
    },
    async executeAction(action) {
      executed.push(action);
      return executeSuccess
        ? { success: true, entry: action.payload }
        : { success: false, message: "Activity write failed." };
    }
  };

  const adapter = {
    async createCalBuddyPendingAction() {
      fallbackCreates += 1;
      return { success: true, action: { action_type: "fallback" } };
    },
    async executeConfirmed() {
      fallbackExecutes += 1;
      return { success: true, result: { reply: "fallback" } };
    }
  };

  const activityAdapter = {
    async prepare(pending, args) {
      prepared.push({ pending, args });
      if (!prepareSuccess) {
        return {
          success: false,
          code: "activity_prepare_failed",
          message: "Activity could not be prepared."
        };
      }
      return {
        success: true,
        action: {
          action_type: "log_activity",
          payload: {
            activity_name: args.activityName,
            duration_minutes: args.durationMinutes,
            calories_burned: args.caloriesBurned,
            intensity: args.intensity,
            average_heart_rate: args.averageHeartRate,
            log_date: "2026-08-30",
            source: "ari_vnext"
          },
          confirmation_text: `Log ${args.activityName} for ${args.durationMinutes} min — ${args.caloriesBurned} kcal?`
        }
      };
    }
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter: adapter,
    AriVNextActivityAdapter: activityAdapter,
    AriVNextBridge: {
      getPendingAction() {
        return bridgePending;
      },
      clearPendingAction() {
        bridgePending = null;
      }
    },
    dispatchEvent() {},
    setInterval,
    clearInterval
  };

  const context = vm.createContext({
    window,
    console,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    Date,
    Number,
    String,
    Object,
    Math,
    Promise,
    Set,
    Array,
    setInterval,
    clearInterval
  });

  vm.runInContext(source, context, { filename: "ari-vnext-operation-registry.js" });

  return {
    window,
    adapter,
    executed,
    prepared,
    setBridgePending(value) {
      bridgePending = value;
    },
    get bridgePending() {
      return bridgePending;
    },
    get legacyPending() {
      return legacyPending;
    },
    get fallbackCreates() {
      return fallbackCreates;
    },
    get fallbackExecutes() {
      return fallbackExecutes;
    }
  };
}

test("registry owns log_activity while preserving the canonical Training preparer", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;

  assert.equal(registry.version, "1.7.0");
  assert.equal(registry.hasOperation("log_activity"), true);

  const pending = makeActivityPending();
  const mapped = await harness.adapter.createCalBuddyPendingAction(pending);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "log_activity");
  assert.equal(mapped.action.payload.activity_name, "Run");
  assert.equal(mapped.action.payload.calories_burned, 280);
  assert.equal(mapped.action.vnext_action_id, "activity-action-1");
  assert.equal(mapped.action.vnext_source_turn_id, "turn-activity-action-1");
  assert.equal(mapped.resolution.operation, "log_activity");
  assert.equal(harness.prepared.length, 1);
  assert.equal(harness.fallbackCreates, 0);
});

test("activity preparation failure cannot create a pending executable action", async () => {
  const harness = makeHarness({ prepareSuccess: false });
  const result = await harness.adapter.createCalBuddyPendingAction(makeActivityPending("activity-invalid"));

  assert.equal(result.success, false);
  assert.equal(result.code, "activity_prepare_failed");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.executed.length, 0);
  assert.equal(harness.fallbackCreates, 0);
});

test("confirmed activity executes exactly once with the original vNext identity", async () => {
  const harness = makeHarness();
  const pending = makeActivityPending("activity-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-activity"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.executed[0].action_type, "log_activity");
  assert.equal(harness.executed[0].payload.duration_minutes, 30);
  assert.equal(harness.executed[0].vnext_action_id, "activity-success");
  assert.equal(harness.executed[0].vnext_confirmation_turn_id, "confirm-activity");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackExecutes, 0);
});

test("failed activity execution preserves matching pending state for retry", async () => {
  const harness = makeHarness({ executeSuccess: false });
  const pending = makeActivityPending("activity-failure");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.bridgePending.id, "activity-failure");
  assert.equal(harness.legacyPending.vnext_action_id, "activity-failure");
});

test("unmigrated operations still use the compatibility fallback", async () => {
  const harness = makeHarness();
  await harness.adapter.createCalBuddyPendingAction({
    id: "workout-edit-1",
    name: "edit_workout",
    sourceTurnId: "turn-workout-edit-1",
    arguments: { dateText: "today", editType: "move" }
  });

  assert.equal(harness.fallbackCreates, 1);
});
