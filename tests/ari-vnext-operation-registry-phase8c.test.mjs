import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url), "utf8");
const phase8cSource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry-phase8c.js", import.meta.url), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function makeHarness() {
  const counters = {
    basePrepare: 0,
    baseCreatePending: 0,
    baseExecuteConfirmed: 0,
    baseApplicationExecute: 0,
    weightWrites: 0,
    goalWrites: 0,
    nutritionWrites: 0,
    workoutWrites: 0,
    workoutEditWrites: 0,
    activityWrites: 0,
    circleWrites: 0,
    planWrites: 0
  };

  let bridgePending = null;
  let legacyPending = null;
  let plans = [];

  const actionAdapter = {
    async prepareCalBuddyAction(pending = {}) {
      counters.basePrepare += 1;
      return { success: true, action: { action_type: pending.name, payload: pending.arguments || {}, confirmation_text: "Confirm?" } };
    },
    async createCalBuddyPendingAction() {
      counters.baseCreatePending += 1;
      return { success: true, action: { action_type: "base" } };
    },
    async executeConfirmed() {
      counters.baseExecuteConfirmed += 1;
      return { success: true, result: { via: "base" } };
    },
    mapWeight(pending = {}, args = {}) {
      const value = Number(args.value);
      return { success: true, action: { action_type: "log_weight", payload: { weight: args.unit === "kg" ? value * 2.2046226218 : value, notes: "Logged by Ari vNext." }, confirmation_text: `Log ${value} ${args.unit || "lb"}?` } };
    },
    mapGoal(pending = {}, args = {}) {
      return { success: true, action: { action_type: "update_goal_profile", payload: { daily_calorie_goal: Number(args.value) }, confirmation_text: "Update goal?" } };
    },
    async mapWorkoutPlanValidated() {
      return { success: true, action: { action_type: "plan_workout", payload: { vnext_prebuilt_workout: { title: "Leg Day" } }, confirmation_text: "Create workout?" } };
    },
    async mapWorkoutEditValidated() {
      return { success: true, action: { action_type: "edit_workout", payload: { vnext_prepared_edit: { operation: "update" } }, confirmation_text: "Edit workout?" } };
    },
    async executeValidatedWorkout({ action }) {
      counters.workoutWrites += 1;
      return { success: true, result: { workout: action.payload.vnext_prebuilt_workout, reply: "Workout saved." } };
    },
    async executeValidatedWorkoutEdit() {
      counters.workoutEditWrites += 1;
      return { success: true, result: { reply: "Workout edited." } };
    }
  };

  const window = {
    Ari: {},
    AriVNextActionAdapter: actionAdapter,
    AriVNextActivityAdapter: {
      async prepare() {
        return { success: true, action: { action_type: "log_activity", payload: { activity_name: "Walk", calories_burned: 100 }, confirmation_text: "Log Walk?" } };
      }
    },
    AriVNextNutritionResolutionAdapter: {
      ready: true,
      async resolveMeal() {
        return { success: true, action: { action_type: "log_meal", payload: { name: "Chicken", calories: 300, category: "Lunch", protein_g: 40, carbs_g: 10, fat_g: 8, serving_size: "6 oz", vnext_resolved_nutrition: true, ari_components: [{ name: "Chicken" }], ari_resolution: { method: "canonical" } }, confirmation_text: "Log Chicken (300 kcal)?" } };
      }
    },
    AriVNextBridge: {
      getPendingAction() { return bridgePending; },
      setPendingAction(value) { bridgePending = value; },
      clearPendingAction() { bridgePending = null; }
    },
    CalBuddy: {
      async executeAction(action) {
        counters.baseApplicationExecute += 1;
        return { success: true, result: { action } };
      },
      async createPendingAction(action) { return { ...action, id: "legacy-pending" }; },
      setPendingAction(action) { legacyPending = action; },
      getPendingAction() { return legacyPending; },
      clearPendingAction() { legacyPending = null; },
      async logWeight(payload) { counters.weightWrites += 1; return { weight_lbs: payload.weight }; },
      async updateProfile(payload) { counters.goalWrites += 1; return payload; },
      async getCurrentSession() { return { user: { id: "user-1" }, access_token: "token" }; },
      async getNutritionWindow() { return { nutritionDate: "2026-08-27" }; },
      async getConsumedCalories() { return 300; },
      setAriMood() {}
    },
    AriNutritionPlanSync: {
      async pushRecords(records) {
        counters.planWrites += 1;
        for (const record of records) {
          const existing = plans.find((item) => item.meal_slot === record.meal_slot);
          if (existing) Object.assign(existing, record);
          else plans.push({ id: `plan-${plans.length + 1}`, status: "planned", ...record });
        }
        return records;
      },
      async loadToday() { return plans.filter((plan) => plan.status === "planned"); }
    },
    calbuddySupabase: {
      auth: { async getSession() { return { data: { session: { user: { id: "user-1" }, access_token: "token" } } }; } },
      async rpc(name, args) {
        if (name === "ari_log_resolved_nutrition_meal") {
          counters.nutritionWrites += 1;
          return { data: { meal: { id: "meal-1", ...args.p_meal }, todayCalories: 300, undoAvailable: true, resolution: args.p_resolution }, error: null };
        }
        if (name === "ari_consume_nutrition_plan") {
          const plan = plans.find((item) => item.id === args.p_plan_id);
          if (plan) plan.status = "eaten";
          return { data: { mealId: "meal-plan-log", mutationId: args.p_mutation_id }, error: null };
        }
        return { data: {}, error: null };
      }
    },
    dispatchEvent() {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    crypto: globalThis.crypto
  };
  window.window = window;

  const sandbox = {
    window,
    sessionStorage: storage(),
    localStorage: storage(),
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Promise,
    Object,
    Map,
    Set,
    Uint8Array,
    Math
  };
  vm.createContext(sandbox);
  vm.runInContext(registrySource, sandbox, { filename: "ari-vnext-operation-registry.js" });

  const registry = window.AriVNextOperationRegistry;
  const phase8bOperations = [
    "plan_meal", "log_planned_meal",
    "update_nutrition_meal", "undo_nutrition_mutation", "update_weight_log", "delete_weight_log",
    "update_activity_log", "delete_activity_log", "edit_referenced_workout", "delete_workout",
    "log_referenced_planned_meal", "log_referenced_plan_components", "discard_referenced_meal_plan", "replace_referenced_meal_plan"
  ];
  for (const name of phase8bOperations) {
    registry.registerOperation(name, {
      source: "phase8b-test",
      priority: 100,
      async prepare(pending = {}) {
        if (name === "plan_meal") return { success: true, action: { action_type: "plan_meal", payload: { meals: pending.arguments.meals }, confirmation_text: "Add plan?" } };
        if (name === "log_planned_meal") return { success: true, action: { action_type: "log_planned_meal", payload: { meal_slot: pending.arguments.mealSlot }, confirmation_text: "Log plan?" } };
        return { success: true, action: { action_type: name, payload: pending.arguments || {}, confirmation_text: "Confirm?" } };
      },
      async createPending() { return { success: true, action: { action_type: name } }; },
      async executeConfirmed() { return { success: true, result: { via: "phase8b" } }; }
    });
  }

  const circleOps = [
    "create_circle_meetup", "join_circle_meetup", "leave_circle_meetup", "cancel_circle_meetup",
    "create_circle_mission", "join_circle_mission", "submit_circle_mission_progress",
    "create_circle_crew", "accept_circle_crew_invite", "decline_circle_crew_invite", "leave_circle_crew", "archive_circle_crew"
  ];
  const circleTypes = [
    "circle_create_meetup", "circle_join_meetup", "circle_leave_meetup", "circle_cancel_meetup",
    "circle_create_mission", "circle_join_mission", "circle_submit_mission_progress",
    "circle_create_crew", "circle_accept_crew_invite", "circle_decline_crew_invite", "circle_leave_crew", "circle_archive_crew"
  ];
  circleOps.forEach((name, index) => registry.registerOperation(name, {
    source: "phase8b-circle-test",
    priority: 200,
    async prepare(pending = {}) { return { success: true, action: { action_type: circleTypes[index], payload: pending.arguments || {}, confirmation_text: "Circle confirm?" } }; }
  }));
  circleTypes.forEach((type) => registry.registerApplicationExecutor(type, {
    source: "phase8b-circle-test",
    priority: 200,
    async execute() { counters.circleWrites += 1; return { success: true, reply: "Circle complete." }; }
  }));
  registry.registerApplicationExecutor("log_activity", {
    source: "phase8b-activity-test",
    priority: 200,
    async execute() { counters.activityWrites += 1; return { success: true, reply: "Activity logged." }; }
  });

  window.AriVNextOperationRegistryPhase8B = { ready: true, version: "1.0.0" };
  vm.runInContext(phase8cSource, sandbox, { filename: "ari-vnext-operation-registry-phase8c.js" });

  return { window, counters, actionAdapter, getBridgePending: () => bridgePending };
}

async function readyHarness() {
  const harness = makeHarness();
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(harness.window.AriVNextOperationRegistryPhase8C?.ready, true);
  return harness;
}

test("Phase 8C declares complete model-mutation registry coverage", async () => {
  const harness = await readyHarness();
  const phase = harness.window.AriVNextOperationRegistryPhase8C;
  assert.equal(phase.fallbackPolicy, "no_model_visible_mutation_requires_captured_fallback");
  for (const name of ["log_meal", "log_activity", "log_weight", "update_goal", "plan_workout", "edit_workout", "plan_meal", "join_circle_meetup", "update_nutrition_meal"]) {
    assert.ok(phase.modelMutationOperations.includes(name), `${name} should be covered by Phase 8C`);
  }
});

test("weight logging prepares, stores, and executes without the captured adapter/application fallbacks", async () => {
  const harness = await readyHarness();
  const pending = { id: "weight-1", sourceTurnId: "turn-weight", name: "log_weight", arguments: { value: 185, unit: "lb", dateText: "today" } };
  const stored = await harness.actionAdapter.createCalBuddyPendingAction(pending);
  assert.equal(stored.success, true);
  const execution = await harness.actionAdapter.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "confirm-weight" });
  assert.equal(execution.success, true);
  assert.equal(harness.counters.weightWrites, 1);
  assert.equal(harness.counters.basePrepare, 0);
  assert.equal(harness.counters.baseCreatePending, 0);
  assert.equal(harness.counters.baseExecuteConfirmed, 0);
  assert.equal(harness.counters.baseApplicationExecute, 0);
});

test("resolved Nutrition logging commits through the resolved RPC without legacy executeAction fallback", async () => {
  const harness = await readyHarness();
  const pending = { id: "meal-1", sourceTurnId: "turn-meal", name: "log_meal", arguments: { items: [{ foodText: "chicken" }] } };
  const execution = await harness.actionAdapter.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "confirm-meal" });
  assert.equal(execution.success, true);
  assert.equal(harness.counters.nutritionWrites, 1);
  assert.equal(harness.counters.baseExecuteConfirmed, 0);
  assert.equal(harness.counters.baseApplicationExecute, 0);
  assert.match(execution.reply, /logged/i);
});

test("validated workout creation executes directly through the trusted Training helper", async () => {
  const harness = await readyHarness();
  const pending = { id: "workout-1", sourceTurnId: "turn-workout", name: "plan_workout", arguments: { focus: "legs", dateText: "2026-08-28", exercises: [{ name: "Squat" }] } };
  const execution = await harness.actionAdapter.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "confirm-workout" });
  assert.equal(execution.success, true);
  assert.equal(harness.counters.workoutWrites, 1);
  assert.equal(harness.counters.baseExecuteConfirmed, 0);
  assert.equal(harness.counters.baseApplicationExecute, 0);
});

test("Circle pending creation and execution stay inside registry handlers", async () => {
  const harness = await readyHarness();
  const pending = { id: "circle-1", sourceTurnId: "turn-circle", name: "join_circle_meetup", arguments: { meetupId: "meetup-1" } };
  const stored = await harness.actionAdapter.createCalBuddyPendingAction(pending);
  assert.equal(stored.success, true);
  const execution = await harness.actionAdapter.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "confirm-circle" });
  assert.equal(execution.success, true);
  assert.equal(harness.counters.circleWrites, 1);
  assert.equal(harness.counters.baseCreatePending, 0);
  assert.equal(harness.counters.baseExecuteConfirmed, 0);
  assert.equal(harness.counters.baseApplicationExecute, 0);
});
