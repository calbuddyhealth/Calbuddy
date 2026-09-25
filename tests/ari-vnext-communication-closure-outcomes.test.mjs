import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceCommunicationClosure,
  deriveCommunicationClosureWorkspace
} from "../api/_lib/ari-vnext/communication-closure.js";

test("verified intervention remains outcome_pending until real-world evidence arrives", () => {
  const workspace = deriveCommunicationClosureWorkspace({
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-outcome",
      turnId: "turn-outcome-1",
      message: "Run this intervention and see if it works"
    },
    route: { developer: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Run this intervention and see if it works",
        successCriteria: "The intervention is executed and technically verified."
      }
    }
  });

  const pending = advanceCommunicationClosure({
    workspace,
    turn: { turnId: "turn-outcome-1", message: "Run this intervention and see if it works" },
    result: {
      success: true,
      reply: "The intervention executed and the technical verification passed.",
      executionEvidence: {
        completionVerified: true,
        verification: { id: "verify-1", status: "passed", summary: "Technical verification passed." }
      },
      closureRuntime: {
        decisionOutcomeLearning: { resolved: false }
      }
    },
    executionSession: {
      id: "exec-outcome",
      status: "completed",
      goal: "Run this intervention and see if it works",
      evidence: [{
        id: "verify-1",
        kind: "verification",
        summary: "Technical verification passed.",
        verified: true
      }]
    }
  });

  assert.equal(pending.state, "outcome_pending");
  assert.equal(pending.terminalState, "open");
  assert.equal(
    pending.acceptanceCriteria.find(item => item.id === "downstream_outcome")?.status,
    "pending"
  );

  const resumed = deriveCommunicationClosureWorkspace({
    previous: pending,
    turn: {
      userId: "11111111-1111-4111-8111-111111111111",
      conversationId: "conv-outcome",
      turnId: "turn-outcome-2",
      message: "The intervention worked"
    },
    route: { developer: true },
    executionWorkspace: {
      active: true,
      session: {
        goal: "Run this intervention and see if it works",
        successCriteria: "The intervention is executed and technically verified."
      }
    }
  });

  const closed = advanceCommunicationClosure({
    previous: pending,
    workspace: resumed,
    turn: {
      turnId: "turn-outcome-2",
      message: "The intervention worked",
      context: {
        decisionOutcomeLearning: {
          resolved: true,
          decisionId: "decision-1",
          outcomeDirection: "supported",
          source: "explicit_user_real_world_report"
        }
      }
    },
    result: {
      success: true,
      reply: "That downstream outcome is now recorded.",
      executionEvidence: {
        completionVerified: true,
        verification: { id: "verify-1", status: "passed", summary: "Technical verification passed." }
      },
      closureRuntime: {
        decisionOutcomeLearning: {
          resolved: true,
          decisionId: "decision-1",
          outcomeDirection: "supported"
        }
      }
    },
    executionSession: {
      id: "exec-outcome",
      status: "completed",
      goal: "Run this intervention and see if it works",
      evidence: [{
        id: "verify-1",
        kind: "verification",
        summary: "Technical verification passed.",
        verified: true
      }]
    }
  });

  assert.equal(
    closed.acceptanceCriteria.find(item => item.id === "downstream_outcome")?.status,
    "passed"
  );
  assert.equal(closed.state, "closed");
  assert.ok(closed.beliefUpdates.some(item => item.operation === "update_from_outcome"));
  assert.ok(closed.lessons.some(item => item.kind === "real_world_outcome"));
});
