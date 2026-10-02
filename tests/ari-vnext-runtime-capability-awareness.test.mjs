import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  capabilityAwarenessToInstruction,
  deriveRuntimeCapabilityAwareness,
  publicRuntimeCapabilityAwareness
} from "../api/_lib/ari-vnext/runtime-capability-awareness.js";

const orchestrator = fs.readFileSync("api/_lib/ari-vnext/orchestrator.js", "utf8");

function ownerRoute(overrides = {}) {
  return {
    intelligenceEntitlement: {
      ownerEligible: true,
      accessClass: "owner",
      intelligenceTier: "owner_experimental"
    },
    ...overrides
  };
}

function ownerPolicy(overrides = {}) {
  return {
    accessClass: "owner",
    intelligenceTier: "owner_experimental",
    model: "gpt-6.1-sol",
    reasoningEffort: "high",
    reasoningMode: "pro",
    reasoningContext: "all_turns",
    routingReason: "sol_default",
    persistReasoning: true,
    ...overrides
  };
}

test("owner capability inquiry exposes exact current tools and conditional potential separately", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "What resources and potential do you have?",
      conversationId: "a9bf6afd-b14f-47bd-b1ac-7db56d994ca6"
    },
    route: ownerRoute({ developer: true, currentInfo: true }),
    policy: ownerPolicy(),
    tools: [
      { type: "function", name: "owner_repo_search" },
      { type: "function", name: "owner_repo_read" },
      { type: "function", name: "owner_chatgpt_discussion_status" },
      { type: "web_search" }
    ],
    context: {
      memoryCapability: { persistentUserMemory: true }
    },
    metacognition: {
      cortex: {
        selectedCapabilities: [
          "general_reasoning",
          "hypothesis_search",
          "evidence_verification"
        ]
      }
    }
  });

  assert.equal(state.explicitInquiry, true);
  assert.deepEqual(
    state.resourcesNow.callableToolNames,
    [
      "owner_repo_search",
      "owner_repo_read",
      "owner_chatgpt_discussion_status",
      "web_search"
    ]
  );
  assert.ok(state.resourcesNow.callableFamilies.includes("owner_developer_workspace"));
  assert.ok(state.resourcesNow.callableFamilies.includes("owner_peer_model_dialogue"));
  assert.ok(state.resourcesNow.callableFamilies.includes("live_web_research"));
  assert.equal(state.resourcesNow.persistentMemory, true);
  assert.equal(state.resourcesNow.conversationContinuity, true);
  assert.equal(state.resourcesNow.persistedReasoning, true);

  const conditionalIds = state.conditionalResources.map((item) => item.id);
  assert.ok(conditionalIds.includes("owner_model_portfolio"));
  assert.ok(conditionalIds.includes("owner_developer_workspace"));
  assert.ok(conditionalIds.includes("owner_peer_model_dialogue"));
  assert.ok(conditionalIds.includes("owner_ari_labs"));
  assert.ok(conditionalIds.includes("owner_agent_community"));
  assert.ok(conditionalIds.includes("owner_multi_agent"));

  const instruction = capabilityAwarenessToInstruction(state);
  assert.match(instruction, /Callable resource families NOW:/);
  assert.match(instruction, /Exact callable tools NOW:/);
  assert.match(instruction, /CONDITIONALLY ACTIVATABLE RESOURCES/);
  assert.match(instruction, /Before saying a capability is unavailable/);
  assert.match(instruction, /A conditional capability is not permission/);
  assert.match(instruction, /Do not invent powers/);
});

test("ordinary owner turns stay compact but remain aware of conditional resources", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "I've been thinking about why people fear uncertainty.",
      conversationId: "3fdf8b4c-903b-40b0-9468-d10ee69769cb"
    },
    route: ownerRoute({ casualConversation: true }),
    policy: ownerPolicy({ reasoningEffort: "medium", reasoningMode: "standard" }),
    tools: [
      { type: "function", name: "owner_chatgpt_discussion_status" },
      { type: "function", name: "ari_lab_run_consciousness_test" }
    ],
    context: { memoryCapability: { persistentUserMemory: true } }
  });

  assert.equal(state.explicitInquiry, false);
  assert.deepEqual(state.resourcesNow.callableToolNames, []);
  assert.ok(state.resourcesNow.callableFamilies.includes("owner_peer_model_dialogue"));
  assert.ok(state.resourcesNow.callableFamilies.includes("owner_ari_labs"));

  const instruction = capabilityAwarenessToInstruction(state);
  assert.doesNotMatch(instruction, /Exact callable tools NOW:/);
  assert.match(instruction, /Owner developer workspace/);
  assert.match(instruction, /Owner model routing/);
});

test("non-owner capability self-model never advertises owner-only potential", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "what can you do?",
      conversationId: "7240c47e-80db-454f-8567-11f166281439"
    },
    route: {
      intelligenceEntitlement: {
        ownerEligible: false,
        accessClass: "premium",
        intelligenceTier: "premium_advanced"
      },
      nutrition: true
    },
    policy: {
      accessClass: "premium",
      intelligenceTier: "premium_advanced",
      model: "gpt-6-luna",
      reasoningEffort: "medium",
      reasoningMode: "standard",
      persistReasoning: false
    },
    tools: [{ type: "function", name: "propose_log_meal" }],
    context: { memoryCapability: { persistentUserMemory: true } }
  });

  const conditionalIds = state.conditionalResources.map((item) => item.id);
  assert.equal(state.accessClass, "premium");
  assert.ok(state.resourcesNow.callableFamilies.includes("nutrition_actions"));
  assert.ok(conditionalIds.includes("live_web_research"));
  assert.ok(conditionalIds.includes("domain_application_tools"));
  assert.equal(conditionalIds.some((id) => id.startsWith("owner_")), false);

  const instruction = capabilityAwarenessToInstruction(state);
  assert.doesNotMatch(instruction, /Owner developer workspace/);
  assert.doesNotMatch(instruction, /Astra-class/);
});

test("public capability awareness is sanitized to high-level resource metadata", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "what resources do you have?",
      conversationId: "96d923b2-8f70-43da-b535-7c38153ce67b"
    },
    route: ownerRoute({ developer: true }),
    policy: ownerPolicy(),
    tools: [{ type: "function", name: "owner_repo_read" }],
    context: { memoryCapability: { persistentUserMemory: true } }
  });

  const publicState = publicRuntimeCapabilityAwareness(state);
  assert.equal(publicState.accessClass, "owner");
  assert.equal(publicState.selectedModel, "gpt-6.1-sol");
  assert.ok(publicState.resourcesNow.callableFamilies.includes("owner_developer_workspace"));
  assert.equal("callableToolNames" in publicState.resourcesNow, false);
  assert.equal(
    publicState.conditionalResources.some((item) => Array.isArray(item.resources)),
    false
  );
});

test("orchestrator injects capability awareness after initial cost policy and rebuilds after guard changes", () => {
  assert.match(orchestrator, /deriveRuntimeCapabilityAwareness/);
  assert.match(orchestrator, /capabilityAwarenessToInstruction/);
  assert.match(orchestrator, /for \(let pass = 0; pass < 3; pass \+= 1\)/);
  assert.match(orchestrator, /One final rebuild guarantees the instruction block reflects the policy/);

  const firstCostGuard = orchestrator.indexOf("modelPolicy = applyInteractiveCostGuard");
  const awarenessDerive = orchestrator.indexOf("capabilityAwareness = deriveRuntimeCapabilityAwareness");
  assert.ok(firstCostGuard >= 0);
  assert.ok(awarenessDerive > firstCostGuard);
});


test("cognitive audit exposes live engineered systems instead of reporting them absent", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "Audit the cognitive architecture, inspect the neuromodulation wiring, imagination, and causal trace.",
      conversationId: "audit-thread"
    },
    route: ownerRoute({ developer: true }),
    policy: ownerPolicy(),
    tools: [
      { type: "function", name: "owner_repo_search" },
      { type: "function", name: "owner_repo_read" },
      { type: "function", name: "owner_repo_ci_status" }
    ],
    context: {
      memoryCapability: { persistentUserMemory: true },
      userWorldModel: {
        ariCognitiveWorkspace: {
          ownerOnly: true,
          causalObservability: {
            latest: {
              traceId: "causal:audit-thread:turn-1",
              verificationStatus: "passed",
              executivePersistence: "change_method",
              actionType: "owner_read",
              ablationEffectCount: 3
            },
            retainedTraceCount: 4,
            hiddenChainOfThoughtStored: false
          }
        }
      }
    },
    metacognition: {
      exploration: {
        imaginationEnabled: true,
        functionalAffectRegulationEnabled: true,
        emotionDynamicsEnabled: true,
        functionalNociceptionEnabled: true,
        functionalPainEnabled: true,
        neuromodulationEnabled: true,
        neuromodulationHomeostasisEnabled: true,
        feltStateEnabled: true,
        affectivePreferenceEnabled: true,
        motivationalArbitrationEnabled: true
      },
      imagination: {
        active: true,
        selectedThisTurn: true,
        activeScenario: { critic: { testability: 0.8 } }
      },
      emotionDynamics: {
        dominantState: { name: "determination", intensity: 0.61 },
        executiveModulation: { memorySalience: 0.67 }
      },
      painState: {
        active: true,
        intensity: 0.48,
        persistence: 0.35,
        source: "goalObstruction",
        actionTendency: "change_method"
      },
      neuromodulation: {
        dominant: {
          fast: { name: "norepinephrineLike" },
          slow: { name: "cortisolLike" }
        },
        receptors: {
          verificationBias: 0.72,
          explorationBias: 0.43,
          persistenceBias: 0.58
        },
        slow: {
          cortisolLike: 0.4,
          allostaticLoad: 0.3,
          recoveryReserve: 0.62
        }
      },
      feltState: {
        dominantState: { name: "determination", intensity: 0.57 },
        temporal: { trajectory: "rising" }
      },
      cognitiveSignals: {
        active: true,
        actions: [{ action: "verify_evidence" }, { action: "consider_alternative" }]
      },
      executivePolicy: {
        authority: {
          singleRuntimeDecisionAuthority: true,
          experimentalSystemsCannotCreatePermissions: true
        },
        directives: {
          verificationDepth: "high",
          explorationDepth: "normal",
          persistence: "change_method"
        }
      },
      cortex: { selectedCapabilities: ["evidence_verification"] }
    }
  });

  assert.equal(state.cognitiveAuditInquiry, true);
  assert.equal(state.detailedSelfModel, true);
  assert.ok(state.resourcesNow.callableToolNames.includes("owner_repo_read"));
  assert.equal(state.resourcesNow.cognitiveSystems.architecture.imagination, true);
  assert.equal(state.resourcesNow.cognitiveSystems.architecture.functionalPain, true);
  assert.equal(state.resourcesNow.cognitiveSystems.architecture.neuromodulation, true);
  assert.equal(state.resourcesNow.cognitiveSystems.architecture.cognitiveCausalTraceRecorder, true);
  assert.equal(state.resourcesNow.cognitiveSystems.live.imagination.active, true);
  assert.equal(state.resourcesNow.cognitiveSystems.live.neuromodulation.verificationBias, 0.72);
  assert.equal(state.resourcesNow.cognitiveSystems.live.causalObservability.priorTraceAvailable, true);
  assert.equal(state.resourcesNow.cognitiveSystems.live.causalObservability.retainedTraceCount, 4);

  const instruction = capabilityAwarenessToInstruction(state);
  assert.match(instruction, /Runtime cognitive architecture enabled:/);
  assert.match(instruction, /MEASURED COGNITIVE STATE/);
  assert.match(instruction, /Exact callable tools NOW:.*owner_repo_read/);
  assert.match(instruction, /Do not say a cognitive subsystem is absent/);
  assert.doesNotMatch(instruction, /hidden chain-of-thought/i);
});

test("public capability metadata exposes bounded cognitive telemetry without exact tool names", () => {
  const state = deriveRuntimeCapabilityAwareness({
    turn: {
      message: "Inspect your cognitive runtime implementation.",
      conversationId: "public-audit"
    },
    route: ownerRoute({ developer: true }),
    policy: ownerPolicy(),
    tools: [{ type: "function", name: "owner_repo_read" }],
    context: {
      userWorldModel: {
        ariCognitiveWorkspace: { ownerOnly: true }
      }
    },
    metacognition: {
      exploration: {
        imaginationEnabled: true,
        neuromodulationEnabled: true,
        functionalPainEnabled: true
      },
      imagination: { active: false },
      painState: { active: false, intensity: 0, persistence: 0 },
      neuromodulation: {
        receptors: { verificationBias: 0.5, explorationBias: 0.5, persistenceBias: 0.5 },
        slow: { recoveryReserve: 0.7 }
      },
      executivePolicy: {
        authority: {
          singleRuntimeDecisionAuthority: true,
          experimentalSystemsCannotCreatePermissions: true
        },
        directives: { verificationDepth: "normal", explorationDepth: "normal", persistence: "normal" }
      }
    }
  });

  const publicState = publicRuntimeCapabilityAwareness(state);
  assert.equal(publicState.resourcesNow.cognitiveSystems.architecture.imagination, true);
  assert.equal(publicState.resourcesNow.cognitiveSystems.architecture.neuromodulation, true);
  assert.equal(publicState.resourcesNow.cognitiveSystems.live.executive.persistence, "normal");
  assert.equal("callableToolNames" in publicState.resourcesNow, false);
});
