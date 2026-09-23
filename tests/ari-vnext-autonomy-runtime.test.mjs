import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveAriOwnedAutonomyGoals,
  classifyAutonomyCiState,
  derivePersistentAutonomyGoals,
  resolvePendingCi,
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

const sha = "a".repeat(40);
const branch = "agent/ari-autonomous-development";
const ciRun = (overrides = {}) => ({ id: 72, head_sha: sha, head_branch: branch,
  path: ".github/workflows/ari-vnext-tests.yml", status: "completed", conclusion: "success", run_number: 9, ...overrides });

test("CI evidence requires the exact commit, branch, test workflow, and latest run", () => {
  const classify = (...runs) => classifyAutonomyCiState({ workflow_runs: runs }, sha, branch);
  assert.equal(classify(ciRun()).ciStatus, "passed");
  assert.equal(classify(ciRun({ conclusion: "failure" })).ciStatus, "failed");
  assert.equal(classify(ciRun({ conclusion: "cancelled" })).outcomeStatus, "blocked");
  for (const override of [
    { head_sha: "b".repeat(40) }, { head_branch: "main" }, { path: ".github/workflows/deploy.yml" },
    { status: "in_progress" }, { conclusion: "skipped" }, { conclusion: "neutral" }
  ]) assert.equal(classify(ciRun(override)).terminal, false);
  assert.equal(classify(ciRun(), ciRun({ id: 73, run_number: 10, status: "queued" })).terminal, false);
  assert.equal(classifyAutonomyCiState({ state: "success" }, sha, branch).terminal, false);
});

test("CI resolves the original attempt, preserves chronological history, and retries persistence failures", async () => {
  const now = new Date("2026-09-23T18:00:00Z");
  const old = { at: "2026-09-23T13:00:00Z", action: "branch_commit", status: "pending_ci",
    commitSha: sha, branch, convictionLearning: { goalId: "goal-1", attemptId: "attempt-1" } };
  const state = { recent: [{ ...old, commitSha: "b".repeat(40), at: "2026-09-23T14:00:00Z" }, old] };
  const writes = [];
  const records = [];
  const options = { userId: "owner", state, now, repo: "example/repo", token: "test",
    read: async url => { assert.equal(new URL(url).searchParams.get("head_sha"), sha); return { workflow_runs: [ciRun()] }; },
    save: async value => { writes.push(value); return true; },
    record: async value => { records.push(value); return { stored: true, ...value.autonomyGoal.convictionAttempt }; }
  };
  const result = await resolvePendingCi(options);
  assert.equal(result.update.learningStored, true);
  assert.equal(records[0].autonomyGoal.convictionAttempt.attemptId, "attempt-1");
  assert.equal(records[0].eventId, `ci:${sha}:72:1`);
  assert.equal(result.state.recent[0].commitSha, "b".repeat(40));
  assert.equal(result.state.recent[1].status, "ci_passed");
  assert.equal(writes.length, 1);
  const failed = await resolvePendingCi({ ...options, record: async () => ({ stored: false, reason: "unavailable" }) });
  assert.equal(failed.state.recent[1].ciObservedAt, null);
  assert.equal(failed.update.learningStored, false);
  assert.equal(writes.length, 1);
});

test("scheduled goals honor opt-in, pauses, and reviewed attempt budgets", () => {
  const base = { id: "g", title: "Improve reasoning", purpose: "Independent learning", domain: "ari_independence",
    successCriteria: "Transfer demonstrated", status: "active", autonomy: true, commitment: { strength: 0.9 },
    budget: { used: 1, attempts: 4 }, approaches: [], attempts: [], lessons: [] };
  assert.equal(derivePersistentAutonomyGoals([base]).length, 1);
  for (const override of [{ autonomy: false }, { status: "paused" }, { status: "retired" }, { budget: { used: 4, attempts: 4 } }]) {
    assert.equal(derivePersistentAutonomyGoals([{ ...base, ...override }]).length, 0);
  }
});
