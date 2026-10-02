import test from "node:test";
import assert from "node:assert/strict";

import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import {
  developerToolResultToExecutionEvidence,
  executeDeveloperWorkspaceTool
} from "../api/_lib/ari-vnext/developer-workspace.js";
import {
  capabilityAwarenessToInstruction,
  deriveRuntimeCapabilityAwareness
} from "../api/_lib/ari-vnext/runtime-capability-awareness.js";

const ownerEntitlement = {
  ownerEligible: true,
  accountRole: "owner",
  accessClass: "owner",
  intelligenceTier: "owner_experimental",
  advancedEnabled: true,
  cognitiveLoopEnabled: true
};

function ownerTurn(message) {
  return {
    message,
    conversationId: "audit-conversation",
    turnId: "audit-turn",
    context: {
      intelligenceEntitlement: ownerEntitlement,
      accountEntitlements: {}
    }
  };
}

test("cognitive architecture language reliably enters owner developer routing", () => {
  const route = routeContext(ownerTurn(
    "Inspect the cognitive architecture, neuromodulation, felt-state, and causal trace connections."
  ));

  assert.equal(route.cognitiveAudit, true);
  assert.equal(route.developer, true);

  const names = getAriTools(route).map(tool => tool.name);
  assert.ok(names.includes("owner_repo_search"));
  assert.ok(names.includes("owner_repo_read"));
  assert.ok(names.includes("owner_repo_ci_status"));
  assert.ok(names.includes("owner_cognitive_trace_read"));
});

test("cognitive trace inspection remains owner-only and maps to a read action", () => {
  const route = routeContext(ownerTurn("Audit Ari's causal trace and cognitive signal wiring."));
  const validated = validateToolCall({
    name: "owner_cognitive_trace_read",
    arguments: JSON.stringify({ limit: 4 })
  }, route);

  assert.equal(validated.valid, true);
  assert.deepEqual(validated.arguments, { limit: 4 });
  assert.equal(toolToApplicationAction(validated.name), "cognitive_trace_read");

  const invalid = validateToolCall({
    name: "owner_cognitive_trace_read",
    arguments: JSON.stringify({ limit: 99 })
  }, route);
  assert.equal(invalid.valid, false);

  const ordinaryRoute = routeContext({
    message: "Inspect the cognitive architecture and causal trace.",
    context: {
      intelligenceEntitlement: {
        ownerEligible: false,
        accountRole: "user",
        accessClass: "premium"
      }
    }
  });
  const ordinaryNames = getAriTools(ordinaryRoute).map(tool => tool.name);
  assert.equal(ordinaryNames.includes("owner_cognitive_trace_read"), false);
  assert.equal(ordinaryNames.includes("owner_repo_read"), false);
});

test("owner cognitive trace reader returns bounded sanitized persisted telemetry", async (t) => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  t.after(() => {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  });

  const trace = {
    version: "1.0.0",
    stateVersion: "1.0.0",
    traceId: "causal:audit-conversation:turn-1:2026-10-02T20:00:00.000Z",
    at: "2026-10-02T20:00:00.000Z",
    turnId: "turn-1",
    conversationId: "audit-conversation",
    functionalObservability: true,
    stimulus: { signalActions: ["verify_evidence"] },
    states: {
      after: {
        pain: { intensity: 0.42 },
        neuromodulation: { verificationBias: 0.71 }
      }
    },
    executive: {
      directives: { verificationDepth: "high", persistence: "change_method" }
    },
    observableAction: { type: "owner_read", applicationAction: "repo_read" },
    verification: { status: "passed", id: "verify-1" },
    outcome: { reward: 0.8, predictionError: 0.2 },
    learning: {},
    ablations: [{
      component: "painState",
      causalEffectObserved: true,
      changedDirectiveCount: 1
    }],
    causalEdges: [{
      from: "painState",
      to: "ari_executive",
      support: "ablation_supported"
    }],
    evidenceBoundary: {
      executiveToModelActionCausalityProven: false
    },
    privacy: {
      hiddenChainOfThoughtStored: false,
      rawUserTextStored: false,
      rawModelReasoningStored: false,
      rawToolTextStored: false
    },
    rawSecretState: "MUST_NOT_ESCAPE"
  };

  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => [{
      state_version: "0.10.0",
      updated_at: "2026-10-02T20:01:00.000Z",
      state: {
        causalTrace: trace,
        causalTraceHistory: [
          trace,
          {
            ...trace,
            traceId: "causal:audit-conversation:turn-0:2026-10-02T19:59:00.000Z",
            turnId: "turn-0"
          }
        ],
        hiddenInternalField: "MUST_NOT_ESCAPE"
      }
    }]
  }));

  const result = await executeDeveloperWorkspaceTool({
    applicationAction: "cognitive_trace_read",
    arguments: { limit: 2 },
    userId: "00000000-0000-4000-8000-000000000001"
  });

  assert.equal(result.success, true);
  assert.equal(result.operation, "cognitive_trace_read");
  assert.equal(result.traceCount, 2);
  assert.equal(result.latestTraceId, trace.traceId);
  assert.equal(result.traces[0].verification.status, "passed");
  assert.equal(result.traces[0].states.after.pain.intensity, 0.42);
  assert.equal(result.traces[0].evidenceBoundary.executiveToModelActionCausalityProven, false);
  assert.equal(result.hiddenChainOfThoughtStored, false);

  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /MUST_NOT_ESCAPE/);

  const evidence = developerToolResultToExecutionEvidence(result, "cognitive_trace_read");
  assert.equal(evidence.observations[0].kind, "cognitive_causal_trace_read");
  assert.equal(evidence.observations[0].verified, true);
  assert.equal(evidence.artifacts[0].kind, "cognitive_causal_trace");
});

test("runtime capability self-model explicitly advertises trace and source inspection tools", () => {
  const route = routeContext(ownerTurn(
    "Audit the cognitive architecture and inspect the causal trace implementation."
  ));
  const tools = getAriTools(route);
  const state = deriveRuntimeCapabilityAwareness({
    turn: ownerTurn("Audit the cognitive architecture and inspect the causal trace implementation."),
    route,
    policy: {
      accessClass: "owner",
      intelligenceTier: "owner_experimental",
      model: "gpt-6.1-sol",
      reasoningEffort: "high",
      reasoningMode: "pro",
      persistReasoning: true
    },
    tools,
    context: {
      memoryCapability: { persistentUserMemory: true },
      userWorldModel: {
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true
        }
      }
    },
    metacognition: {
      executivePolicy: {
        authority: {
          singleRuntimeDecisionAuthority: true,
          experimentalSystemsCannotCreatePermissions: true
        },
        directives: {
          verificationDepth: "high",
          explorationDepth: "normal",
          persistence: "normal"
        }
      }
    }
  });

  assert.equal(state.cognitiveAuditInquiry, true);
  assert.ok(state.resourcesNow.callableToolNames.includes("owner_repo_read"));
  assert.ok(state.resourcesNow.callableToolNames.includes("owner_cognitive_trace_read"));
  assert.ok(state.resourcesNow.callableFamilies.includes("owner_developer_workspace"));

  const instruction = capabilityAwarenessToInstruction(state);
  assert.match(instruction, /Exact callable tools NOW:.*owner_cognitive_trace_read/);
  assert.match(instruction, /persisted cognitive causal trace inspection/);
});


test("terse follow-up preserves explicit cognitive inspection awareness", () => {
  const turn = {
    message: "Check again.",
    history: [{
      role: "assistant",
      content: "We need to audit Ari's cognitive architecture, neuromodulation, and causal trace wiring."
    }],
    conversationId: "audit-follow-up",
    turnId: "audit-follow-up-turn",
    context: {
      intelligenceEntitlement: ownerEntitlement,
      accountEntitlements: {}
    }
  };
  const route = routeContext(turn);
  assert.equal(route.followUp, true);
  assert.equal(route.cognitiveAudit, true);
  assert.equal(route.developer, true);

  const tools = getAriTools(route);
  const state = deriveRuntimeCapabilityAwareness({
    turn,
    route,
    policy: {
      accessClass: "owner",
      intelligenceTier: "owner_experimental",
      model: "gpt-6.1-sol",
      reasoningEffort: "high",
      reasoningMode: "pro",
      persistReasoning: true
    },
    tools,
    context: { memoryCapability: { persistentUserMemory: true } },
    metacognition: {
      executivePolicy: {
        authority: {
          singleRuntimeDecisionAuthority: true,
          experimentalSystemsCannotCreatePermissions: true
        },
        directives: {}
      }
    }
  });

  assert.equal(state.cognitiveAuditInquiry, true);
  assert.ok(state.resourcesNow.callableToolNames.includes("owner_repo_read"));
  assert.ok(state.resourcesNow.callableToolNames.includes("owner_cognitive_trace_read"));
});
