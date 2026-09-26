import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRepairHandoffIssue,
  createRepairHandoffIssue,
  deriveSelfRepairGoals,
  isChatGptRepairHandoffEnabled
} from "../api/_lib/ari-vnext/chatgpt-repair-handoff.js";

test("self observer turns failed CI into a high-priority repair goal", () => {
  const goals = deriveSelfRepairGoals({
    state: {
      recent: [{
        at: "2026-09-25T04:00:00.000Z",
        action: "branch_commit",
        status: "pending_ci",
        filePath: "ari/runtime/example.js",
        branch: "agent/ari-autonomous-development",
        commitSha: "abc123",
        summary: "Change runtime behavior.",
        evidence: "Observed runtime mismatch."
      }]
    },
    ciUpdate: {
      commitSha: "abc123",
      ciStatus: "failed",
      terminal: true
    }
  });

  assert.equal(goals.length, 1);
  assert.equal(goals[0].source, "self_observer");
  assert.equal(goals[0].observedFailure.ciStatus, "failed");
  assert.equal(goals[0].observedFailure.filePath, "ari/runtime/example.js");
  assert.ok(goals[0].priority >= 0.95);
});

test("self observer deduplicates the current CI update and persisted failed action", () => {
  const failed = {
    at: "2026-09-25T04:00:00.000Z",
    action: "branch_commit",
    status: "ci_failed",
    ciStatus: "failed",
    filePath: "ari/runtime/example.js",
    commitSha: "abc123",
    summary: "Change runtime behavior.",
    evidence: "CI failed."
  };

  const goals = deriveSelfRepairGoals({
    state: { recent: [failed] },
    ciUpdate: { commitSha: "abc123", ciStatus: "failed", terminal: true }
  });

  assert.equal(goals.length, 1);
});

test("handoff issue preserves Ari proposal and requires independent ChatGPT review", () => {
  const result = buildRepairHandoffIssue({
    goal: {
      id: "ari_repair:test",
      label: "Repair the observed runtime failure.",
      source: "self_observer",
      observedFailure: { ciStatus: "failed", filePath: "ari/runtime/example.js" }
    },
    proposal: {
      action: "patch",
      filePath: "ari/runtime/example.js",
      find: "const oldValue = true;",
      replace: "const oldValue = false;",
      commitMessage: "Fix runtime example",
      summary: "The runtime uses the wrong flag.",
      evidence: "The failing test exercises this exact branch.",
      expectedBenefit: "Restore expected behavior.",
      confidence: 0.82,
      tests: ["node --test tests/example.test.mjs"]
    },
    planning: {
      summary: "Inspect the runtime flag and its test.",
      searchQueries: ["oldValue runtime flag"]
    },
    files: [{ path: "ari/runtime/example.js" }],
    now: new Date("2026-09-25T05:00:00.000Z")
  });

  assert.match(result.title, /^\[ARI→CHATGPT\]/);
  assert.match(result.body, /Independently inspect the current repository/);
  assert.match(result.body, /Do not merge to production/);
  assert.match(result.body, /const oldValue = true;/);
  assert.match(result.body, /const oldValue = false;/);
  assert.match(result.body, new RegExp(`ARI-HANDOFF:${result.handoffKey}`));
  assert.equal(result.packet.proposer, "Ari");
  assert.equal(result.packet.requestedReviewer, "ChatGPT");
});

test("handoff creation deduplicates an existing open Ari handoff", async () => {
  const calls = [];
  const request = async (url, token, options = {}) => {
    calls.push({ url, token, options });
    return {
      items: [{
        number: 42,
        html_url: "https://github.com/calbuddyhealth/Calbuddy/issues/42",
        body: "<!-- ARI-HANDOFF:placeholder -->"
      }]
    };
  };

  const built = buildRepairHandoffIssue({
    goal: { id: "ari_repair:test", label: "Repair a failure.", source: "self_observer" },
    proposal: {
      action: "patch",
      filePath: "ari/runtime/example.js",
      find: "a",
      replace: "b",
      summary: "Fix example",
      evidence: "Evidence",
      confidence: 0.8
    }
  });

  const result = await createRepairHandoffIssue({
    repo: "calbuddyhealth/Calbuddy",
    token: "test-token",
    goal: { id: "ari_repair:test", label: "Repair a failure.", source: "self_observer" },
    proposal: {
      action: "patch",
      filePath: "ari/runtime/example.js",
      find: "a",
      replace: "b",
      summary: "Fix example",
      evidence: "Evidence",
      confidence: 0.8
    },
    request: async (url, token, options = {}) => {
      calls.push({ url, token, options });
      return {
        items: [{
          number: 42,
          html_url: "https://github.com/calbuddyhealth/Calbuddy/issues/42",
          body: `<!-- ARI-HANDOFF:${built.handoffKey} -->`
        }]
      };
    }
  });

  assert.equal(result.success, true);
  assert.equal(result.created, false);
  assert.equal(result.deduplicated, true);
  assert.equal(result.issueNumber, 42);
  assert.equal(calls.length, 1);
});

test("handoff is enabled by default but can be explicitly disabled", () => {
  assert.equal(isChatGptRepairHandoffEnabled(undefined), true);
  assert.equal(isChatGptRepairHandoffEnabled("true"), true);
  assert.equal(isChatGptRepairHandoffEnabled("false"), false);
});
