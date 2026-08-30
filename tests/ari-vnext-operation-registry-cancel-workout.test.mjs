import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makePending(id = "cancel-workout-1", scheduledDate = "2026-08-30") {
  return {
    id,
    name: "cancel_workout",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sourceMessage: "Can you undo today's workout plan",
    arguments: { scheduledDate }
  };
}

function makeWorkout(overrides = {}) {
  return {
    type: "workout",
    workoutId: "workout-biceps-1",
    title: "Biceps Workout",
    completed: false,
    progress: { completed: false },
    exercises: [
      { exerciseId: "barbell-curl" },
      { exerciseId: "hammer-curl" }
    ],
    ...overrides
  };
}

function makeHarness({ workout = makeWorkout(), remoteSave = true } = {}) {
  let bridgePending = null;
  let legacyPending = null;
  let currentWorkout = workout;
  let clearCalls = 0;
  let saveCalls = 0;
  let fallbackCreates = 0;
  let fallbackExecutes = 0;
  let genericExecutes = 0;
  const events = [];

  const controller = {
    getDate() {
      return currentWorkout;
    },
    clearDate() {
      clearCalls += 1;
      currentWorkout = null;
      return true;
    },
    async save(options) {
      saveCalls += 1;
      assert.deepEqual(options, { remote: true });
      return remoteSave;
    }
  };

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "legacy-cancel-workout", ...action };
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
    async executeAction() {
      genericExecutes += 1;
      return { success: true };
    }
  };

  const adapter = {
    async getWorkoutController() {
      return controller;
    },
    async createCalBuddyPendingAction() {
      fallbackCreates += 1;
      return { success: true, action: { action_type: "fallback" } };
    },
    async executeConfirmed() {
      fallbackExecutes += 1;
      return { success: true, result: { reply: "fallback" } };
    }
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter: adapter,
    AriVNextBridge: {
      getPendingAction() {
        return bridgePending;
      },
      clearPendingAction() {
        bridgePending = null;
      }
    },
    dispatchEvent(event) {
      events.push(event);
    },
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
    Intl,
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
    events,
    setBridgePending(value) {
      bridgePending = value;
    },
    replaceWorkout(value) {
      currentWorkout = value;
    },
    get bridgePending() {
      return bridgePending;
    },
    get legacyPending() {
      return legacyPending;
    },
    get clearCalls() {
      return clearCalls;
    },
    get saveCalls() {
      return saveCalls;
    },
    get fallbackCreates() {
      return fallbackCreates;
    },
    get fallbackExecutes() {
      return fallbackExecutes;
    },
    get genericExecutes() {
      return genericExecutes;
    }
  };
}

test("registry owns cancel_workout and binds confirmation to the exact planned workout", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;

  assert.equal(registry.version, "1.7.0");
  assert.equal(registry.hasOperation("cancel_workout"), true);
  assert.equal(registry.hasOperation("edit_workout"), false);

  const pending = makePending();
  const mapped = await harness.adapter.createCalBuddyPendingAction(pending);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "cancel_workout");
  assert.equal(mapped.action.payload.scheduled_date, "2026-08-30");
  assert.equal(mapped.action.payload.expected_workout_title, "Biceps Workout");
  assert.match(mapped.action.payload.expected_workout_fingerprint, /workout-biceps-1/);
  assert.match(mapped.action.confirmation_text, /Remove Biceps Workout/);
  assert.equal(mapped.action.vnext_action_id, pending.id);
  assert.equal(mapped.resolution.operation, "cancel_workout");
  assert.equal(harness.fallbackCreates, 0);
});

test("completed workouts cannot be cancelled as planned workouts", async () => {
  const harness = makeHarness({ workout: makeWorkout({ completed: true }) });
  const result = await harness.adapter.createCalBuddyPendingAction(makePending("cancel-completed"));

  assert.equal(result.success, false);
  assert.equal(result.code, "workout_cancel_completed_session");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.clearCalls, 0);
});

test("confirmed cancellation clears the exact date once through canonical Training and clears matching pending", async () => {
  const harness = makeHarness();
  const pending = makePending("cancel-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-cancel-workout"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.clearCalls, 1);
  assert.equal(harness.saveCalls, 1);
  assert.equal(harness.genericExecutes, 0);
  assert.equal(harness.fallbackExecutes, 0);
  assert.equal(execution.action.vnext_action_id, pending.id);
  assert.equal(execution.action.vnext_confirmation_turn_id, "confirm-cancel-workout");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.events.some((event) => event.type === "ari:workoutPlanUpdated" && event.detail?.mode === "cancel"), true);
});

test("a changed workout cannot be removed by an older prepared cancellation", async () => {
  const harness = makeHarness();
  const pending = makePending("cancel-stale");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  harness.replaceWorkout(makeWorkout({
    workoutId: "workout-biceps-2",
    exercises: [
      { exerciseId: "barbell-curl" },
      { exerciseId: "preacher-curl" }
    ]
  }));

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(execution.code, "workout_cancel_target_changed");
  assert.equal(harness.clearCalls, 0);
  assert.equal(harness.saveCalls, 0);
  assert.equal(harness.bridgePending.id, pending.id);
  assert.equal(harness.legacyPending.vnext_action_id, pending.id);
});

test("workout editing remains on the existing compatibility path", async () => {
  const harness = makeHarness();
  await harness.adapter.createCalBuddyPendingAction({
    id: "edit-workout-1",
    name: "edit_workout",
    sourceTurnId: "turn-edit-workout-1",
    arguments: { dateText: "today", operation: "update", title: "Arms Workout" }
  });

  assert.equal(harness.fallbackCreates, 1);
});
