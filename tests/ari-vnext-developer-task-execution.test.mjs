import test from "node:test";
import assert from "node:assert/strict";

import {
  createDeveloperTaskExecution,
  developerTaskCompletionDecision,
  markDeveloperTaskVerification,
  planDeveloperEvidenceBatch,
  publicDeveloperTaskExecution,
  recordDeveloperTaskArtifact,
  recordDeveloperTaskEvidence
} from "../api/_lib/ari-vnext/developer-task-execution.js";

test("task execution stores explicit completion criteria and unresolved questions", () => {
  const state = createDeveloperTaskExecution({
    taskId: "gps-fix",
    executionSessionId: "developer_task:gps-fix",
    goal: "Fix local event discovery",
    completionCriteria: ["Nearby San Diego events appear", "Relevant tests pass"],
    questions: [
      { id: "q1", text: "Which query filters events?", operation: { name: "owner_repo_search", arguments: { query: "event distance" } }, resourceKey: "repo-search" },
      { id: "q2", text: "Which location helper applies radius?", operation: { name: "owner_repo_search", arguments: { query: "radius" } }, resourceKey: "radius-search" }
    ]
  });
  assert.equal(state.stage, "investigating");
  assert.equal(state.completionCriteria.length, 2);
  assert.equal(state.questions.length, 2);
  assert.equal(state.hiddenChainOfThoughtStored, false);
});

test("independent evidence work is batched without serial model turns", () => {
  const state = createDeveloperTaskExecution({
    taskId: "batch",
    executionSessionId: "developer_task:batch",
    questions: [
      { id: "a", text: "Read A", operation: { name: "owner_repo_read", arguments: { filePath: "api/a.js" } }, resourceKey: "api/a.js" },
      { id: "b", text: "Read B", operation: { name: "owner_repo_read", arguments: { filePath: "api/b.js" } }, resourceKey: "api/b.js" }
    ]
  });
  const batch = planDeveloperEvidenceBatch(state, 4);
  assert.equal(batch.count, 2);
  assert.equal(batch.independent, true);
});

test("revision-aware evidence reuses an unchanged file and stales older revisions", () => {
  let state = createDeveloperTaskExecution({ taskId: "rev", executionSessionId: "developer_task:rev", questions: ["Inspect source"] });
  let first = recordDeveloperTaskEvidence(state, { source: "api/a.js", revision: "aaa", summary: "Current behavior", verified: true });
  state = first.state;
  const reused = recordDeveloperTaskEvidence(state, { source: "api/a.js", revision: "aaa", summary: "Current behavior", verified: true });
  assert.equal(reused.reused, true);
  const changed = recordDeveloperTaskEvidence(state, { source: "api/a.js", revision: "bbb", summary: "Behavior changed", verified: true });
  assert.equal(changed.revisionChanged, true);
  assert.equal(changed.state.evidence.find(item => item.revision === "aaa").stale, true);
});

test("changed, tested, and verified remain distinct states", () => {
  let state = createDeveloperTaskExecution({ taskId: "gates", executionSessionId: "developer_task:gates", completionCriteria: ["Tests pass"] });
  state = recordDeveloperTaskArtifact(state, { kind: "code_commit", label: "isolated branch", revision: "abc", locator: "commit:abc" });
  assert.equal(state.stage, "changed");
  state = markDeveloperTaskVerification(state, { status: "attempted", summary: "CI running" });
  assert.equal(state.stage, "verifying");
  assert.equal(developerTaskCompletionDecision(state).complete, false);
  state = markDeveloperTaskVerification(state, { status: "passed", summary: "CI passed", evidenceRef: "ci:1", criterionIds: ["criterion_1"] });
  assert.equal(state.stage, "verified");
  assert.equal(developerTaskCompletionDecision(state).complete, true);
});

test("public task state exposes progress without hidden reasoning", () => {
  const task = publicDeveloperTaskExecution(createDeveloperTaskExecution({ taskId: "public", executionSessionId: "developer_task:public" }));
  assert.equal(task.hiddenChainOfThoughtStored, false);
  assert.equal(typeof task.nextStep, "string");
  assert.ok(task.completion);
  assert.ok(task.budget);
});
