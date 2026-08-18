import assert from "node:assert/strict";
import test from "node:test";

import { deriveCoachingState } from "../api/_lib/ari-vnext/coaching-state.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";

test("cut plus downward weight trend plus reported strength decline surfaces recovery/deficit pressure", () => {
  const state = deriveCoachingState({
    turn: {
      message: "My strength is dropping and I'm always hungry while cutting",
      history: []
    },
    route: { training: true, goals: true, nutrition: true, coachingState: true },
    context: {
      goals: { goalType: "cut", dailyGoal: 2100 },
      coachingSnapshot: {
        weight: {
          available: true,
          latest: 181.5,
          oldest: 185,
          change: -3.5,
          direction: "down",
          pointCount: 6
        },
        today: { caloriesConsumed: 1700, proteinG: 145, mealCount: 4 }
      },
      recentTraining: [
        { type: "workout", completed: true },
        { type: "workout", completed: true },
        { type: "workout", completed: true },
        { type: "workout", completed: true }
      ],
      training: { currentWeek: { days: [] } },
      recentMeals: []
    }
  });

  assert.ok(state);
  assert.equal(state.goal, "lose");
  assert.equal(state.evidence.reported.performanceDecline, true);
  assert.equal(state.evidence.reported.hunger, true);
  assert.equal(
    state.signals.some((item) => item.id === "possible_recovery_or_deficit_pressure"),
    true
  );
});

test("weight direction mismatch is surfaced without pretending one data point is a trend", () => {
  const state = deriveCoachingState({
    turn: { message: "Am I on track for my cut?", history: [] },
    route: { goals: true, coachingState: true },
    context: {
      goals: { goalType: "lose weight" },
      coachingSnapshot: {
        weight: {
          available: true,
          latest: 188,
          oldest: 185,
          change: 3,
          direction: "up",
          pointCount: 5
        }
      },
      recentTraining: [],
      recentMeals: []
    }
  });

  assert.equal(
    state.signals.some((item) => item.id === "goal_weight_direction_mismatch"),
    true
  );
});

test("dense current training week is visible as a low-confidence schedule signal", () => {
  const state = deriveCoachingState({
    turn: { message: "How does my training week look?", history: [] },
    route: { training: true },
    context: {
      training: {
        currentWeek: {
          days: [
            workoutDay(), workoutDay(), workoutDay(), workoutDay(),
            { type: "off", exercises: [] },
            { type: "off", exercises: [] },
            { type: "off", exercises: [] }
          ]
        }
      },
      recentTraining: []
    }
  });

  assert.equal(state.evidence.training.maxConsecutivePlannedDays, 4);
  assert.equal(state.signals.some((item) => item.id === "dense_training_schedule"), true);
});

test("cross-feature coaching does not use low reasoning solely because the message is short", () => {
  const policy = resolveModelPolicy({
    training: true,
    goals: true,
    coachingState: true,
    complexity: "fast"
  });

  assert.equal(policy.mode, "standard");
  assert.equal(policy.reasoningEffort, "medium");
});

test("ordinary single-domain short question can remain fast", () => {
  const policy = resolveModelPolicy({
    nutrition: true,
    training: false,
    goals: false,
    coachingState: false,
    complexity: "fast"
  });

  assert.equal(policy.mode, "fast");
});

function workoutDay() {
  return {
    type: "workout",
    exercises: [{ name: "Exercise" }]
  };
}
