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
