import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceExecutionSession,
  ARI_EXECUTION_SESSION_VERSION,
  deriveExecutionWorkspace,
  summarizeExecutionSession
} from "../api/_lib/ari-vnext/execution-session.js";
import { developerToolResultToExecutionEvidence } from "../api/_lib/ari-vnext/developer-workspace.js";

function developerTurn(overrides = {}) {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    conversationId: "conv-1",
    turnId: "turn-1",
    message: "Investigate why Ari loses task state and fix the architecture.",
    surface: "/home.html",
    createdAt: "2026-09-24T20:00:00.000Z",
    ...overrides
  };
}

test("durable execution session anchors to the existing conviction goal", () => {
  const workspace = deriveExecutionWorkspace({
    previous: null,
    turn: developerTurn(),
    route: { developer: true, complexity: "deep" },
    context: {
      convictionLearning: {
        activeGoalId: "goal-1",
        goals: [{
          id: "goal-1",
          status: "active",
          purpose: "Make substantial Ari investigations resumable.",
          successCriteria: "Ari resumes with evidence, failed attempts, artifacts, and a next step.",
          nextAction: "Inspect the current execution path."
        }]
      }
    }
  });

  assert.equal(workspace.version, ARI_EXECUTION_SESSION_VERSION);
  assert.equal(workspace.active, true);
  assert.equal(workspace.session.goal, "Make substantial Ari investigations resumable.");
  assert.equal(workspace.session.successCriteria, "Ari resumes with evidence, failed attempts, artifacts, and a next step.");
  assert.equal(workspace.session.nextStep, "Inspect the current execution path.");
  assert.equal(workspace.session.hiddenChainOfThoughtStored, false);
});

test("failed verification is preserved as useful evidence and changes the next step", () => {
  const workspace = deriveExecutionWorkspace({
    turn: developerTurn(),
    route: { developer: true, complexity: "deep" },
    context: {}
  });

  const failed = advanceExecutionSession({
    previous: null,
    workspace,
    turn: developerTurn(),
    result: {
      success: true,
      reply: "The first check failed, so the approach needs to change.",
      executionEvidence: {
        verification: {
          id: "ci-1",
          requested: true,
          attempted: true,
          status: "failed",
          summary: "ARI vNext deterministic tests failed."
        },
        observations: [{
          id: "obs-1",
          kind: "runtime",
          summary: "The failure only occurs after navigation.",
          source: "test",
          verified: true
        }],
        hypotheses: [
          { id: "session-loss", label: "Session state is not durable.", status: "leading" },
          { id: "render-only", label: "The problem is only visual rendering.", status: "candidate" }
        ],
        eliminatedHypotheses: [
          { id: "render-only", label: "The problem is only visual rendering." }
        ]
      },
      executionWorkspaceUpdate: {
        approachChanged: true,
        approach: "Persist task state before retrying."
      }
    }
  });

  const states = failed.progressEvents.map(item => item.state);
  assert.equal(failed.status, "active");
  assert.ok(states.includes("verification_requested"));
  assert.ok(states.includes("test_attempted"));
  assert.ok(states.includes("test_failed"));
  assert.ok(states.includes("useful_failure"));
  assert.ok(states.includes("evidence_observed"));
  assert.ok(states.includes("hypothesis_eliminated"));
  assert.ok(states.includes("approach_changed"));
  assert.equal(failed.failedAttempts.length, 1);
  assert.equal(failed.hypotheses.find(item => item.id === "render-only")?.status, "eliminated");
  assert.match(failed.nextStep, /different bounded approach|change the failed method/i);
});

test("a later keep-going turn resumes the same execution session", () => {
  const firstWorkspace = deriveExecutionWorkspace({
    turn: developerTurn(),
    route: { developer: true, complexity: "deep" },
    context: {}
  });
  const persisted = advanceExecutionSession({
    workspace: firstWorkspace,
    turn: developerTurn(),
    result: {
      success: true,
      executionEvidence: {
        observations: [{
          id: "obs-resume",
          kind: "repository_read",
          summary: "The current file was inspected.",
          verified: true
        }]
      }
    }
  });

  const resumed = deriveExecutionWorkspace({
    previous: persisted,
    turn: developerTurn({
      turnId: "turn-2",
      message: "Keep going",
      surface: "/goals.html"
    }),
    route: { developer: true, followUp: true, complexity: "fast" },
    context: {}
  });

  assert.equal(resumed.active, true);
  assert.equal(resumed.resumeSuggested, true);
  assert.equal(resumed.session.id, persisted.id);
  assert.equal(resumed.session.evidence.length, persisted.evidence.length);
  assert.equal(resumed.session.nextStep, persisted.nextStep);
});

test("completion requires verified evidence instead of a completion label alone", () => {
  const workspace = deriveExecutionWorkspace({
    turn: developerTurn(),
    route: { developer: true, complexity: "deep" },
    context: {}
  });

  const unverified = advanceExecutionSession({
    workspace,
    turn: developerTurn(),
    result: {
      success: true,
      reply: "Complete.",
      executionEvidence: { status: "completed" }
    }
  });
  assert.notEqual(unverified.status, "completed");

  const verified = advanceExecutionSession({
    previous: unverified,
    workspace: {
      active: true,
      session: unverified
    },
    turn: developerTurn({ turnId: "turn-3", message: "Verify and finish it." }),
    result: {
      success: true,
      reply: "Done. The tests passed.",
      executionEvidence: {
        status: "completed",
        completionVerified: true,
        verification: {
          id: "ci-2",
          requested: true,
          attempted: true,
          status: "passed",
          summary: "ARI vNext deterministic tests passed."
        }
      }
    }
  });

  assert.equal(verified.status, "completed");
  assert.equal(verified.nextStep, null);
  assert.ok(verified.progressEvents.some(item => item.state === "test_passed"));
  assert.ok(verified.progressEvents.some(item => item.state === "completed"));
  assert.equal(summarizeExecutionSession(verified).status, "completed");
});

test("developer workspace converts CI into explicit attempted/passed verification evidence", () => {
  const evidence = developerToolResultToExecutionEvidence({
    success: true,
    evidenceId: "run-123",
    branch: "agent/ari-execution-investigation-runtime",
    runId: 123,
    status: "completed",
    conclusion: "success",
    headSha: "abcdef123456",
    htmlUrl: "https://example.test/run/123"
  }, "repo_ci_status");

  assert.equal(evidence.verification.requested, true);
  assert.equal(evidence.verification.attempted, true);
  assert.equal(evidence.verification.status, "passed");
  assert.equal(evidence.artifacts[0].verified, true);
});
