import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveLongitudinalState,
  deriveWeightVelocity
} from "../api/_lib/ari-vnext/longitudinal-state.js";

test("dated weight history produces weekly velocity instead of endpoint-only guessing", () => {
  const weight = deriveWeightVelocity([
    { value: 181, date: "2026-08-15" },
    { value: 182, date: "2026-08-08" },
    { value: 183, date: "2026-08-01" },
    { value: 184, date: "2026-07-25" }
  ], { goalType: "cut" });

  assert.equal(weight.available, true);
  assert.equal(weight.direction, "down");
  assert.ok(weight.velocityPerWeek < -0.8 && weight.velocityPerWeek > -1.2);
  assert.equal(weight.goalDirection, "down");
});

test("poor workout adherence tells Ari to hold major program changes", () => {
  const state = deriveLongitudinalState({
    route: { training: true, goals: true },
    context: {
      training: {
        longitudinal: {
          adherence: {
            windowDays: 28,
            plannedCount: 10,
            completedCount: 4,
            missedCount: 6,
            rate: 0.4
          },
          progression: {
            comparableExerciseCount: 4,
            upCount: 0,
            stableCount: 2,
            downCount: 2,
            windowPrCount: 0,
            windowPrs: [],
            plateauCandidateCount: 2,
            plateauCandidates: [
              { name: "Bench Press" },
              { name: "Barbell Row" }
            ]
          }
        }
      },
      recentTraining: []
    }
  });

  assert.equal(state.signals.some((item) => item.id === "adherence_before_program_change"), true);
  assert.equal(state.programDecision.stance, "hold_major_changes");
});

test("multiple plateaus with adequate exposure justify inspecting the program", () => {
  const state = deriveLongitudinalState({
    route: { training: true },
    context: {
      training: {
        longitudinal: {
          adherence: {
            windowDays: 28,
            plannedCount: 9,
            completedCount: 8,
            missedCount: 1,
            rate: 0.89
          },
          progression: {
            comparableExerciseCount: 5,
            upCount: 1,
            stableCount: 3,
            downCount: 1,
            windowPrCount: 0,
            windowPrs: [],
            plateauCandidateCount: 2,
            plateauCandidates: [
              { name: "Bench Press" },
              { name: "Lat Pulldown" }
            ]
          }
        }
      }
    }
  });

  assert.equal(state.signals.some((item) => item.id === "multi_exercise_plateau_pattern"), true);
  assert.equal(state.programDecision.stance, "inspect_then_adjust");
});

test("multiple recent-window PRs bias Ari toward preserving a working program", () => {
  const state = deriveLongitudinalState({
    route: { training: true },
    context: {
      training: {
        longitudinal: {
          adherence: {
            windowDays: 28,
            plannedCount: 8,
            completedCount: 8,
            missedCount: 0,
            rate: 1
          },
          progression: {
            comparableExerciseCount: 5,
            upCount: 3,
            stableCount: 2,
            downCount: 0,
            windowPrCount: 2,
            windowPrs: [
              { name: "Squat" },
              { name: "Overhead Press" }
            ],
            plateauCandidateCount: 0,
            plateauCandidates: []
          }
        }
      }
    }
  });

  assert.equal(state.signals.some((item) => item.id === "broad_progression_present"), true);
  assert.equal(state.programDecision.stance, "preserve_working_plan");
});

test("large completed-set change between comparable weeks is surfaced without diagnosing overtraining", () => {
  const state = deriveLongitudinalState({
    route: { training: true },
    context: {
      training: {
        longitudinal: {
          adherence: {
            windowDays: 28,
            plannedCount: 8,
            completedCount: 8,
            missedCount: 0,
            rate: 1
          },
          progression: {
            comparableExerciseCount: 2,
            upCount: 1,
            stableCount: 1,
            downCount: 0,
            windowPrCount: 0,
            windowPrs: [],
            plateauCandidateCount: 0,
            plateauCandidates: []
          },
          volumeChange: {
            available: true,
            latestWeek: "2026-08-09",
            previousWeek: "2026-08-02",
            latestCompletedSets: 58,
            previousCompletedSets: 40,
            completedSetChangeRatio: 0.45,
            latestVolumeLoad: 42000,
            previousVolumeLoad: 33000,
            volumeLoadChangeRatio: 0.27
          }
        }
      }
    }
  });

  const signal = state.signals.find((item) => item.id === "meaningful_weekly_volume_change");
  assert.ok(signal);
  assert.equal(signal.confidence, "low");
});

test("configured weekly weight-change target is compared with observed velocity", () => {
  const state = deriveLongitudinalState({
    route: { goals: true },
    context: {
      goals: {
        goalType: "lose",
        weeklyWeightChangeGoal: -0.5
      },
      recentWeights: [
        { value: 180, date: "2026-08-15" },
        { value: 182, date: "2026-08-08" },
        { value: 184, date: "2026-08-01" },
        { value: 186, date: "2026-07-25" }
      ]
    }
  });

  assert.equal(state.weight.available, true);
  assert.equal(state.signals.some((item) => item.id === "weight_velocity_differs_from_target"), true);
});
