import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  advanceExecutionSession,
  ARI_EXECUTION_SESSION_VERSION,
  deriveExecutionWorkspace,
  summarizeExecutionSession
} from "../api/_lib/ari-vnext/execution-session.js";
import { developerToolResultToExecutionEvidence } from "../api/_lib/ari-vnext/developer-workspace.js";
import { getAriTools, toolToApplicationAction, validateToolCall } from "../api/_lib/ari-vnext/tools.js";
import { advanceRewardState } from "../api/_lib/ari-vnext/reward-core.js";

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


test("unrelated conversation leaves an unfinished investigation dormant instead of overwriting it", () => {
  const firstTurn = developerTurn({ turnId: "turn-dormant-1" });
  const workspace = deriveExecutionWorkspace({
    turn: firstTurn,
    route: { developer: true, complexity: "deep" },
    context: {}
  });
  const persisted = advanceExecutionSession({
    workspace,
    turn: firstTurn,
    result: {
      success: true,
      reply: "I found one durable clue.",
      executionEvidence: {
        observations: [{ id: "obs-dormant", kind: "repository_read", summary: "The state reducer owns continuity.", verified: true }]
      }
    }
  });

  const casualTurn = developerTurn({ turnId: "turn-dormant-2", message: "How are you?" });
  const dormant = deriveExecutionWorkspace({
    previous: persisted,
    turn: casualTurn,
    route: { developer: false, complexity: "fast", casualConversation: true },
    context: {}
  });
  assert.equal(dormant.active, false);
  assert.equal(dormant.session.id, persisted.id);

  const unchanged = advanceExecutionSession({
    previous: persisted,
    workspace: dormant,
    turn: casualTurn,
    result: { success: true, reply: "Doing well." }
  });
  assert.equal(unchanged.id, persisted.id);
  assert.equal(unchanged.evidence.length, persisted.evidence.length);
  assert.equal(unchanged.nextStep, persisted.nextStep);
});

test("owner SOL receives bounded repository workspace tools while ordinary users do not", () => {
  const ownerRoute = {
    developer: true,
    complexity: "deep",
    intelligenceEntitlement: {
      ownerEligible: true,
      accountRole: "owner",
      accessClass: "owner"
    }
  };
  const names = getAriTools(ownerRoute).map(tool => tool.name);
  for (const name of ["owner_memory_search", "owner_repo_search", "owner_repo_read", "owner_repo_ci_status", "propose_owner_github_edit"]) {
    assert.ok(names.includes(name), name);
  }

  const ordinaryNames = getAriTools({
    developer: true,
    complexity: "deep",
    intelligenceEntitlement: {
      ownerEligible: false,
      accountRole: "user",
      accessClass: "premium"
    }
  }).map(tool => tool.name);
  assert.equal(ordinaryNames.includes("owner_repo_read"), false);
  assert.equal(ordinaryNames.includes("owner_memory_search"), false);

  const memorySearch = validateToolCall({
    name: "owner_memory_search",
    arguments: JSON.stringify({ query: "previous architecture failure lesson" })
  }, ownerRoute);
  assert.equal(memorySearch.valid, true);
  assert.equal(memorySearch.arguments.query, "previous architecture failure lesson");
  assert.equal(toolToApplicationAction("owner_memory_search"), "memory_search");

  const validated = validateToolCall({
    name: "propose_owner_github_edit",
    arguments: JSON.stringify({
      filePath: "api/_lib/ari-vnext/model-policy.js",
      find: "exact current text",
      replace: "exact replacement text",
      commitMessage: "Fix current routing"
    })
  }, ownerRoute);
  assert.equal(validated.valid, true);
  assert.equal(validated.arguments.autonomousDevelopment, true);
});

test("Reward Core learns from a useful failed execution test", () => {
  const turn = developerTurn({ turnId: "turn-reward-exec" });
  const workspace = deriveExecutionWorkspace({
    turn,
    route: { developer: true, complexity: "deep" },
    context: {}
  });
  const executionSession = advanceExecutionSession({
    workspace,
    turn,
    result: {
      success: true,
      reply: "The failed check eliminated one explanation.",
      metacognition: { cortex: { needs: { verification: true } } },
      executionEvidence: {
        verification: {
          id: "test-reward",
          requested: true,
          attempted: true,
          status: "failed",
          summary: "The isolated check falsified hypothesis A."
        },
        hypotheses: [
          { id: "a", label: "Hypothesis A", status: "leading" },
          { id: "b", label: "Hypothesis B", status: "candidate" }
        ],
        eliminatedHypotheses: [{ id: "a", label: "Hypothesis A" }]
      }
    }
  });

  const reward = advanceRewardState({
    turn,
    result: {
      success: true,
      reply: "The failed check eliminated one explanation.",
      route: { developer: true, complexity: "deep" },
      safety: { highStakes: false },
      metacognition: {
        confidence: "partial",
        missingEvidence: ["alternate branch"],
        evidenceSignals: ["repository_read"],
        curiosity: { activeQuestion: { informationGain: 0.9, novelty: 0.7, redundancy: 0.1 } },
        cortex: { needs: { verification: true } }
      },
      cortexAdviser: { attempted: false },
      scientificIntelligence: {
        hypotheses: [{ id: "a" }, { id: "b" }],
        outcomeLearning: { applied: false }
      },
      executionSession
    }
  });

  assert.ok(reward.lastEvent.progressStates.includes("test_failed"));
  assert.ok(reward.lastEvent.progressStates.includes("useful_failure"));
  assert.ok(reward.lastEvent.progressStates.includes("hypothesis_eliminated"));
  assert.ok(reward.lastEvent.dimensions.informationGain > 0.45);
});



test("memory-search evidence stays useful without persisting raw memory text", () => {
  const evidence = developerToolResultToExecutionEvidence({
    success: true,
    evidenceId: "memory-search-1",
    query: "prior architecture lesson",
    resultCount: 2,
    matches: [
      {
        id: "m1",
        topic: "developer",
        content: "A prior private memory containing details that must not enter persistent execution state."
      },
      {
        id: "m2",
        topic: "strategy",
        content: "Another private memory body."
      }
    ]
  }, "memory_search");

  assert.equal(evidence.observations.length, 1);
  assert.equal(evidence.observations[0].kind, "memory_search");
  assert.equal(evidence.observations[0].verified, true);
  assert.match(evidence.observations[0].summary, /2 relevant match/);
  assert.match(evidence.observations[0].summary, /developer/);
  assert.match(evidence.observations[0].summary, /strategy/);
  assert.doesNotMatch(evidence.observations[0].summary, /prior private memory|another private memory body/i);
  assert.equal(evidence.artifacts, undefined);
});

test("execution runtime modules remain syntactically valid", () => {
  for (const path of [
    "api/ari-vnext.js",
    "api/_lib/ari-vnext/execution-session.js",
    "api/_lib/ari-vnext/developer-workspace.js",
    "api/_lib/ari-vnext/model-policy.js",
    "api/_lib/ari-vnext/reward-core.js",
    "api/_lib/ari-vnext/context-router.js",
    "api/_lib/ari-vnext/cognitive-loop.js",
    "api/_lib/ari-vnext/orchestrator.js",
    "api/_lib/ari-vnext/adaptive-strategy.js",
    "api/_lib/ari-vnext/adaptive-strategy-reflection.js",
    "api/_lib/ari-vnext/dreaming-store.js",
    "api/_lib/ari-vnext/dreaming-runtime.js",
    "ari/vnext/ari-vnext-action-adapter.js",
    "ari/vnext/ari-vnext-bridge.js",
    "ari/runtime/ari-runtime-controller.js",
    "calbuddy-core.js"
  ]) {
    execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  }
});
