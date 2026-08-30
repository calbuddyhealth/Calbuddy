import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makePending(id = "workout-plan-1", overrides = {}) {
  return {
    id,
    name: "plan_workout",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sourceMessage: "Build me a chest workout for today",
    arguments: {
      dateText: "today",
      focus: "chest",
      durationMinutes: 45,
      difficulty: "intermediate",
      exercises: [
        { name: "Bench Press", sets: 4, reps: 8 },
        { name: "Incline Dumbbell Press", sets: 3, reps: 10 }
      ],
      ...(overrides.arguments || {})
    },
    ...overrides
  };
}

function makeHarness({ prepareSuccess = true, executeSuccess = true } = {}) {
  let bridgePending = null;
  let legacyPending = null;
  let fallbackCreates = 0;
  let fallbackExecutes = 0;
  let genericExecutes = 0;
  const prepared = [];
  const specializedExecutions = [];

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "legacy-workout-pending", ...action };
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
    async mapWorkoutPlanValidated(pending, args) {
      prepared.push({ pending, args });
      if (!prepareSuccess) {
        return {
          success: false,
          code: "workout_exercise_resolution_required",
          message: "Workout exercises require canonical resolution."
        };
      }

      return {
        success: true,
        action: {
          action_type: "plan_workout",
          payload: {
            scheduled_date: "2026-08-30",
            focus_id: "chest",
            existing_workout_mode: "create",
            requested_from_message: pending.sourceMessage,
            vnext_prebuilt_workout: {
              workoutId: `validated-${pending.id}`,
              title: "Chest",
              blocks: [{
                id: "main",
                exercises: [
                  { exerciseId: "bench-press" },
                  { exerciseId: "incline-dumbbell-press" }
                ]
              }],
              metadata: {
                registryValidated: true,
                vnextActionId: pending.id,
                vnextSourceTurnId: pending.sourceTurnId
              }
            }
          },
          confirmation_text: "Create Ari's Chest with 2 validated exercises for today?"
        },
        resolution: {
          registryValidated: true,
          exercises: [
            { requested: "Bench Press", exerciseId: "bench-press", canonicalName: "Bench Press" },
            { requested: "Incline Dumbbell Press", exerciseId: "incline-dumbbell-press", canonicalName: "Incline Dumbbell Press" }
          ]
        }
      };
    },
    async executeValidatedWorkout({ action, pending, currentTurnId }) {
      specializedExecutions.push({ action, pending, currentTurnId });
      if (!executeSuccess) {
        return { success: false, code: "workout_write_failed", message: "Workout write failed." };
      }
      return {
        success: true,
        result: {
          scheduled_date: action.payload.scheduled_date,
          workout: action.payload.vnext_prebuilt_workout
        },
        action: {
          ...action,
          vnext_action_id: pending.id,
          vnext_source_turn_id: pending.sourceTurnId,
          vnext_confirmation_turn_id: currentTurnId
        }
      };
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
    prepared,
    specializedExecutions,
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
    },
    get genericExecutes() {
      return genericExecutes;
    }
  };
}

test("registry owns plan_workout while preserving canonical Training validation", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;

  assert.equal(registry.version, "1.6.0");
  assert.equal(registry.hasOperation("plan_workout"), true);
  assert.equal(registry.hasOperation("edit_workout"), false);

  const pending = makePending();
  const mapped = await harness.adapter.createCalBuddyPendingAction(pending);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "plan_workout");
  assert.equal(mapped.action.payload.vnext_prebuilt_workout.metadata.registryValidated, true);
  assert.equal(mapped.action.vnext_action_id, "workout-plan-1");
  assert.equal(mapped.action.vnext_source_turn_id, "turn-workout-plan-1");
  assert.equal(mapped.resolution.operation, "plan_workout");
  assert.equal(mapped.resolution.registryValidated, true);
  assert.equal(harness.prepared.length, 1);
  assert.equal(harness.fallbackCreates, 0);
});

test("workout validation failure cannot create an executable pending action", async () => {
  const harness = makeHarness({ prepareSuccess: false });
  const result = await harness.adapter.createCalBuddyPendingAction(makePending("workout-invalid"));

  assert.equal(result.success, false);
  assert.equal(result.code, "workout_exercise_resolution_required");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.specializedExecutions.length, 0);
  assert.equal(harness.fallbackCreates, 0);
});

test("confirmed workout uses the canonical specialized executor exactly once", async () => {
  const harness = makeHarness();
  const pending = makePending("workout-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-workout"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.specializedExecutions.length, 1);
  assert.equal(harness.genericExecutes, 0);
  assert.equal(harness.specializedExecutions[0].action.action_type, "plan_workout");
  assert.equal(harness.specializedExecutions[0].pending.id, "workout-success");
  assert.equal(harness.specializedExecutions[0].currentTurnId, "confirm-workout");
  assert.equal(execution.action.vnext_action_id, "workout-success");
  assert.equal(execution.action.vnext_confirmation_turn_id, "confirm-workout");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackExecutes, 0);
});

test("failed workout execution preserves matching pending state for retry", async () => {
  const harness = makeHarness({ executeSuccess: false });
  const pending = makePending("workout-failure");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(harness.specializedExecutions.length, 1);
  assert.equal(harness.genericExecutes, 0);
  assert.equal(harness.bridgePending.id, "workout-failure");
  assert.equal(harness.legacyPending.vnext_action_id, "workout-failure");
});

test("workout editing remains on compatibility fallback", async () => {
  const harness = makeHarness();
  await harness.adapter.createCalBuddyPendingAction({
    id: "workout-edit-1",
    name: "edit_workout",
    sourceTurnId: "turn-workout-edit-1",
    arguments: { dateText: "today", operation: "move", exercise: "Squat", position: 1 }
  });

  assert.equal(harness.fallbackCreates, 1);
});
