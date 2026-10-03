import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

const adapterSource = fs.readFileSync(new URL("../ari/vnext/ari-vnext-action-adapter.js", import.meta.url), "utf8");

function loadAdapter(controller) {
  const window = { Ari: {}, CalBuddy: {}, dispatchEvent() {} };
  const context = vm.createContext({
    window,
    document: { baseURI: "https://example.test/" },
    console,
    Date,
    Number,
    String,
    Object,
    Math,
    Promise,
    Set,
    Array,
    Intl,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000001" }
  });
  vm.runInContext(adapterSource, context, { filename: "ari-vnext-action-adapter.js" });
  const adapter = window.AriVNextActionAdapter;
  adapter.controllerPromise = Promise.resolve(controller);
  return adapter;
}

function makeController({ search }) {
  const canonical = new Map([
    ["bench-press", { id: "bench-press", name: "Bench Press" }],
    ["incline-dumbbell-bench-press", { id: "incline-dumbbell-bench-press", name: "Incline Dumbbell Bench Press" }],
    ["machine-chest-press", { id: "machine-chest-press", name: "Machine Chest Press" }],
    ["dumbbell-chest-press", { id: "dumbbell-chest-press", name: "Dumbbell Chest Press" }]
  ]);
  return {
    async init() {},
    getExercise(id) { return canonical.get(String(id || "")) || null; },
    findExercises(query, options) { return search(String(query || ""), options, canonical); },
    getDate() { return null; },
    setBuiltWorkoutForDate() { return true; },
    addExercise() { return true; },
    updateExercise() { return true; },
    removeExercise() { return true; },
    setDate() { return true; },
    async save() { return true; }
  };
}

function pending(exercises) {
  return {
    id: "workout-recovery-1",
    name: "plan_workout",
    sourceTurnId: "turn-workout-recovery-1",
    sourceMessage: "Make me a chest workout for today",
    arguments: {
      dateText: "today",
      focus: "chest",
      durationMinutes: 45,
      difficulty: "intermediate",
      warmup: "",
      finisher: "",
      notes: "",
      exercises
    }
  };
}

test("workout tool contract requires canonical exercise IDs as first-class identifiers", () => {
  const tool = getAriTools({ training: true }).find((item) => item.name === "propose_workout_plan");
  assert.ok(tool);
  assert.equal(tool.parameters.properties.exercises.minItems, 1);
  assert.equal(tool.parameters.properties.exercises.maxItems, 16);
  assert.equal(tool.parameters.properties.exercises.items.properties.exerciseId.minLength, 1);
  assert.match(tool.description, /exact exercise id/i);

  const invalid = validateToolCall({
    name: "propose_workout_plan",
    arguments: {
      focus: "chest",
      dateText: "today",
      durationMinutes: 45,
      difficulty: "intermediate",
      warmup: "",
      finisher: "",
      notes: "",
      exercises: [{ exerciseId: "", name: "Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "" }]
    }
  }, { training: true });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, "workout_exercise_id_required");
});

test("adapter retries the canonical name when the model supplied a noncanonical id", async () => {
  const controller = makeController({
    search(query, _options, canonical) {
      if (query === "Incline Dumbbell Bench Press") {
        return [{ ...canonical.get("incline-dumbbell-bench-press"), searchScore: 9000, searchReasons: ["exact_name"] }];
      }
      return [];
    }
  });
  const adapter = loadAdapter(controller);
  const p = pending([
    { exerciseId: "made-up-incline-db-id", name: "Incline Dumbbell Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "" }
  ]);
  const mapped = await adapter.mapWorkoutPlanValidated(p, p.arguments);
  assert.equal(mapped.success, true);
  assert.equal(mapped.resolution.exercises[0].exerciseId, "incline-dumbbell-bench-press");
});

test("adapter deterministically recovers a reordered canonical exercise name when the top candidate is clearly dominant", async () => {
  const controller = makeController({
    search(query, _options, canonical) {
      if (/dumbbell incline bench press/i.test(query)) {
        return [
          { ...canonical.get("incline-dumbbell-bench-press"), searchScore: 5200, searchReasons: ["fuzzy_tokens"] },
          { ...canonical.get("dumbbell-chest-press"), searchScore: 1800, searchReasons: ["fuzzy_tokens"] }
        ];
      }
      return [];
    }
  });
  const adapter = loadAdapter(controller);
  const p = pending([
    { exerciseId: "invented-id", name: "Dumbbell Incline Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "" }
  ]);
  const mapped = await adapter.mapWorkoutPlanValidated(p, p.arguments);
  assert.equal(mapped.success, true);
  assert.equal(mapped.resolution.exercises[0].exerciseId, "incline-dumbbell-bench-press");
  assert.match(mapped.resolution.exercises[0].match, /recovered/i);
});

test("adapter still rejects ambiguous fuzzy workout exercise matches", async () => {
  const controller = makeController({
    search(query, _options, canonical) {
      if (/chest press/i.test(query)) {
        return [
          { ...canonical.get("machine-chest-press"), searchScore: 4900, searchReasons: ["fuzzy_tokens"] },
          { ...canonical.get("dumbbell-chest-press"), searchScore: 4700, searchReasons: ["fuzzy_tokens"] }
        ];
      }
      return [];
    }
  });
  const adapter = loadAdapter(controller);
  const p = pending([
    { exerciseId: "invented-id", name: "Chest Press", sets: 4, reps: 8, restSeconds: 90, notes: "" }
  ]);
  const mapped = await adapter.mapWorkoutPlanValidated(p, p.arguments);
  assert.equal(mapped.success, false);
  assert.equal(mapped.code, "workout_exercise_resolution_required");
});