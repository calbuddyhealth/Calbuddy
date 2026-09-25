import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceCommunicationClosure,
  deriveCommunicationClosureWorkspace,
  summarizeCommunicationClosure
} from "../api/_lib/ari-vnext/communication-closure.js";

test("developer work activates L3 closure with verification contract", () => {
  const workspace = deriveCommunicationClosureWorkspace({
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-1",
      turnId: "turn-1",
      message: "Fix the runtime, test it, and merge it"
    },
    route: { developer: true, complexity: "deep" },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Fix the runtime, test it, and merge it",
        successCriteria: "The requested behavior is implemented and verified."
      }
    }
  });

  assert.equal(workspace.active, true);
  assert.equal(workspace.level, 3);
  assert.equal(workspace.loop.state, "interpreted");
  assert.ok(workspace.loop.acceptanceCriteria.some(item => item.id === "verified_result"));
});

test("proposal is not mistaken for execution or verification", () => {
  const workspace = deriveCommunicationClosureWorkspace({
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-2",
      turnId: "turn-2",
      message: "Log this meal"
    },
    route: { nutrition: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Log this meal",
        successCriteria: "The meal is saved only after explicit confirmation."
      }
    }
  });

  const closure = advanceCommunicationClosure({
    workspace,
    turn: { turnId: "turn-2", message: "Log this meal" },
    result: {
      success: true,
      reply: "Ready to log it. Confirm to save.",
      pendingAction: { id: "pending-1" },
      action: { type: "proposed_action", applicationAction: "log_meal" },
      requestUnderstanding: { applicationAction: "log_meal" }
    }
  });

  assert.equal(closure.state, "contracted");
  assert.equal(closure.observedOutcome.verified, false);
  assert.notEqual(closure.terminalState, "verified");
});

test("verified execution can close the contract", () => {
  const workspace = deriveCommunicationClosureWorkspace({
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-3",
      turnId: "turn-3",
      message: "Fix and verify this"
    },
    route: { developer: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Fix and verify this",
        successCriteria: "Implementation is verified by a passing test."
      }
    }
  });

  const closure = advanceCommunicationClosure({
    workspace,
    turn: { turnId: "turn-3", message: "Fix and verify this" },
    result: {
      success: true,
      reply: "The fix is complete and verified.",
      executionEvidence: {
        completionVerified: true,
        verification: {
          id: "test-1",
          status: "passed",
          summary: "Targeted regression test passed."
        }
      }
    },
    executionSession: {
      id: "exec-1",
      status: "completed",
      goal: "Fix and verify this",
      evidence: [{
        id: "test-1",
        kind: "verification",
        summary: "Targeted regression test passed.",
        verified: true
      }]
    }
  });

  assert.equal(closure.state, "closed");
  assert.equal(closure.terminalState, "verified");
  assert.equal(closure.outcomeDelta.status, "matched");
  assert.ok(closure.acceptanceCriteria.every(item => ["passed", "observed"].includes(item.status)));
});

test("explicit correction supersedes the prior interpretation claim", () => {
  const first = deriveCommunicationClosureWorkspace({
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-4",
      turnId: "turn-a",
      message: "Update the workout page"
    },
    route: { developer: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Update the workout page",
        successCriteria: "The requested workout page change is verified."
      }
    }
  });

  const prior = advanceCommunicationClosure({
    workspace: first,
    turn: { turnId: "turn-a", message: "Update the workout page" },
    result: { success: true, reply: "I found the relevant implementation." },
    executionSession: {
      id: "exec-a",
      status: "active",
      goal: "Update the workout page",
      evidence: []
    }
  });

  const second = deriveCommunicationClosureWorkspace({
    previous: prior,
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-4",
      turnId: "turn-b",
      message: "No, I meant the training detail page"
    },
    route: { developer: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Update the training detail page",
        successCriteria: "The training detail page change is verified."
      }
    }
  });

  const corrected = advanceCommunicationClosure({
    previous: prior,
    workspace: second,
    turn: { turnId: "turn-b", message: "No, I meant the training detail page" },
    result: { success: true, reply: "Understood." },
    executionSession: {
      id: "exec-a",
      status: "active",
      goal: "Update the training detail page",
      evidence: []
    }
  });

  assert.equal(corrected.corrections.length, 1);
  assert.ok(corrected.claims.some(item => item.status === "superseded"));
  assert.ok(corrected.claims.some(item => item.status === "active" && /training detail page/i.test(item.claim)));
  assert.equal(corrected.state, "interpreted");

  const summary = summarizeCommunicationClosure(corrected);
  assert.equal(summary.correctionCount, 1);
});
