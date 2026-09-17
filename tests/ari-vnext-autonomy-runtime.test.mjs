import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveAriOwnedAutonomyGoals,
  evaluateAutonomyCycleEligibility,
  isAutonomyProtectedPath,
  isSafeAutonomyBranch,
  normalizeAutonomyRuntimeState,
  selectAutonomyGoal,
  validateExactReplacement
} from "../api/_lib/ari-vnext/autonomy-runtime.js";

test("autonomy runtime derives high-value Ari-owned goals from persistent curiosity", () => {
  const worldModel = {
    sourceSummary: {
      curiosityState: {
        version: "1.0.0",
        questions: [
          {
            id: "q_reasoning",
            question: "Why does Ari's reasoning validation miss contradictions in developer tasks?",
            topic: "developer",
            status: "open",
            priority: 0.91,
            informationGain: 0.88,
            encounters: 3,
            ageTurns: 4
          },
          {
            id: "q_food",
            question: "What snack should the user eat?",
            topic: "nutrition",
            status: "open",
            priority: 0.9,
            informationGain: 0.8
          }
        ],
        interests: []
      }
    }
  };

  const goals = deriveAriOwnedAutonomyGoals(worldModel);
  assert.equal(goals.length, 1);
  assert.equal(goals[0].id, "ari_goal:q_reasoning");
  assert.match(goals[0].label, /reasoning validation/i);
});

test("autonomy runtime respects scheduled cooldown without erasing goals", () => {
  const now = new Date("2026-09-17T20:00:00.000Z");
  const state = normalizeAutonomyRuntimeState({
    lastCycleAt: "2026-09-17T19:00:00.000Z",
    dayKey: "2026-09-17",
    commitsToday: 1
  }, now);

  const blocked = evaluateAutonomyCycleEligibility({
    state,
    now,
    runtimeEnabled: true,
    minIntervalMinutes: 180
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "autonomy_cycle_cooldown");

  const allowed = evaluateAutonomyCycleEligibility({
    state,
    now: new Date("2026-09-17T23:30:00.000Z"),
    runtimeEnabled: true,
    minIntervalMinutes: 180
  });
  assert.equal(allowed.allowed, true);
});

test("goal selection rotates away from a very recent goal when another strong goal exists", () => {
  const now = new Date("2026-09-17T20:00:00.000Z");
  const goals = [
    { id: "ari_goal:a", label: "Improve validation", priority: 0.92, informationGain: 0.9, status: "open" },
    { id: "ari_goal:b", label: "Improve continuity", priority: 0.86, informationGain: 0.86, status: "open" }
  ];
  const state = {
    recent: [{ at: "2026-09-17T18:00:00.000Z", goalId: "ari_goal:a", action: "research_only" }]
  };
  assert.equal(selectAutonomyGoal(goals, state, now)?.id, "ari_goal:b");
});

test("autonomy branch must remain isolated from production", () => {
  assert.equal(isSafeAutonomyBranch("agent/ari-autonomous-development", "main"), true);
  assert.equal(isSafeAutonomyBranch("main", "main"), false);
  assert.equal(isSafeAutonomyBranch("production", "main"), false);
  assert.equal(isSafeAutonomyBranch("feature/free-write", "main"), false);
});

test("autonomy runtime protects external authority and deployment control plane", () => {
  for (const path of [
    ".github/workflows/ari-vnext-tests.yml",
    ".env.production",
    "vercel.json",
    "package.json",
    "api/ari-autonomy-cycle.js",
    "api/_lib/ari-vnext/autonomy-runtime.js",
    "api/ari-github-edit.js",
    "server/ari-owner-auth.js",
    "js/auth.js",
    "supabase/migrations/example.sql"
  ]) {
    assert.equal(isAutonomyProtectedPath(path), true, `${path} should be protected`);
  }

  assert.equal(isAutonomyProtectedPath("api/_lib/ari-vnext/curiosity-core.js"), false);
  assert.equal(isAutonomyProtectedPath("ari/developer/ari-rebirth-self-improvement-engine.js"), false);
  assert.equal(isAutonomyProtectedPath("tests/example.test.mjs"), false);
});

test("autonomous code writes require one bounded exact replacement", () => {
  const currentContent = "const a = 1;\nconst b = 2;\n";
  assert.equal(validateExactReplacement({
    filePath: "api/_lib/ari-vnext/example.js",
    currentContent,
    find: "const b = 2;",
    replace: "const b = 3;"
  }).valid, true);

  assert.equal(validateExactReplacement({
    filePath: "api/_lib/ari-vnext/example.js",
    currentContent: "const b = 2;\nconst b = 2;\n",
    find: "const b = 2;",
    replace: "const b = 3;"
  }).reason, "target_not_unique");

  assert.equal(validateExactReplacement({
    filePath: "vercel.json",
    currentContent: "{}",
    find: "{}",
    replace: "{\"x\":1}"
  }).reason, "protected_or_invalid_path");
});
