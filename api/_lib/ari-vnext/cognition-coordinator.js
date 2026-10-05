import { isOwnerUltraRoute } from "./owner-ultra.js";

// ARI vNext — unified cognition coordinator.
//
// State engines may remain specialized, but only a small set of model-facing
// authorities should speak into the prompt. This coordinator converts durable
// cognition records into compact evidence instead of letting every subsystem
// emit its own behavioral instruction block.

export const ARI_COGNITION_COORDINATOR_VERSION = "1.0.0";

export function deriveCognitionCoordinator({
  route = {},
  safety = {},
  companionState = null,
  metacognition = null,
  relevantContext = null
} = {}) {
  const workspace = relevantContext?.userWorldModel?.ariCognitiveWorkspace || {};
  const candidates = [
    closureEvidence(workspace?.communicationClosure, route),
    beliefEvidence(workspace?.beliefSystem, route),
    identityEvidence(workspace?.behavioralIdentity, route, companionState),
    dreamingEvidence(relevantContext?.dreaming, route),
    experienceEvidence(relevantContext?.experiences, route),
    convictionEvidence(relevantContext?.convictionLearning, route)
  ].filter(Boolean);

  const selectedEvidence = candidates
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
    .slice(0, maxEvidenceSources(route, safety));

  return {
    version: ARI_COGNITION_COORDINATOR_VERSION,
    ownerUltra: isOwnerUltraRoute(route),
    authorities: {
      relationshipBehavior: "companion_core",
      communicationStyle: "communication_profile",
      experimentalCognition: "ari_executive",
      difficultReasoningProcess: "deliberation_harness"
    },
    selectedEvidence,
    suppressedLegacyInstructionEmitters: [
      "relationship_continuity_instruction",
      "behavioral_identity_instruction",
      "communication_closure_instruction",
      "dreaming_instruction",
      "experience_instruction",
      "conviction_instruction",
      "cognitive_workspace_instruction"
    ],
    policy: {
      stateEnginesMayRemainSpecialized: true,
      promptAuthoritiesMustStayFew: true,
      storedCognitionIsEvidenceNotAuthority: true,
      currentUserCorrectionWins: true,
      currentEvidenceWins: true,
      oneExecutiveInstructionAuthority: true,
      hiddenChainOfThoughtStored: false
    },
    active: Boolean(
      selectedEvidence.length ||
      metacognition?.executivePolicy ||
      companionState
    )
  };
}

export function cognitionCoordinatorToInstruction(state = null) {
  if (!state?.active) return "";
  const lines = [
    "ARI UNIFIED COGNITION COORDINATOR",
    "Only four model-facing authorities are active: Companion Core for relationship behavior, Communication Profile for style, Ari Executive for experimental cognition, and Deliberation Harness for difficult reasoning process.",
    "Other cognition systems are evidence producers, not independent voices. Do not stack or repeat their old behavioral instructions.",
    "Current user corrections and current verified evidence outrank stored cognition. Stored beliefs, identity summaries, dreams, experiences, and goals may inform judgment only when materially relevant.",
    "Dream-derived material is provisional. Experience records are precedents, not universal rules. Belief/identity records may be revised by new evidence. Communication closure may block a completion claim until its evidence criteria are actually satisfied."
  ];

  for (const item of state.selectedEvidence || []) {
    lines.push(`Evidence [${item.kind}]: ${clean(item.summary, 520)}`);
  }

  const instruction = lines.join("\n");
  return state.ownerUltra ? instruction : instruction.slice(0, 3600);
}

function closureEvidence(value = null, route = {}) {
  const loop = value?.loop || value;
  if (!loop?.id) return null;
  const state = clean(loop?.state, 60).toLowerCase();
  if (["closed", "verified", "rejected", "superseded"].includes(state)) return null;
  const summary = clean(
    loop?.selectedInterpretation ||
    loop?.userRequest ||
    loop?.expectedOutcome?.summary,
    520
  );
  if (!summary) return null;
  return {
    kind: "communication_closure",
    priority: route?.developer || route?.currentInfo ? 0.96 : 0.86,
    summary: `${summary} [state=${state || "open"}]`
  };
}

function beliefEvidence(value = null, route = {}) {
  if (!value || typeof value !== "object") return null;
  const goal = value?.activeGoal || null;
  const posture = value?.posture || null;
  const principle = (Array.isArray(value?.principles) ? value.principles : [])
    .find((item) => item?.id === "reality_final_vote") ||
    (Array.isArray(value?.principles) ? value.principles[0] : null);
  const statement = clean(
    goal?.purpose ||
    posture?.mode ||
    principle?.principle ||
    principle?.label,
    420
  );
  if (!statement) return null;
  return {
    kind: "belief",
    priority: route?.developer || route?.goals ? 0.68 : 0.42,
    summary: goal?.purpose
      ? `${statement} [posture=${clean(posture?.mode, 80) || "unknown"}]`
      : statement
  };
}

function identityEvidence(value = null, route = {}, companionState = null) {
  if (!value || typeof value !== "object") return null;
  const companionOwned = new Set([
    "repair_exactly",
    "natural_continuity",
    "high_stakes_expression",
    "controlled_spontaneity"
  ]);
  const behaviors = (Array.isArray(value?.activeBehaviors) ? value.activeBehaviors : [])
    .filter((item) => !companionOwned.has(clean(item?.id, 80)))
    .map((item) => clean(item?.instruction || item?.reason || item?.id, 220))
    .filter(Boolean);
  const invariants = (Array.isArray(value?.invariants) ? value.invariants : [])
    .map((item) => clean(item?.rule || item?.label || item?.id, 220))
    .filter(Boolean);
  const signals = [...behaviors, ...invariants];
  if (!signals.length) return null;
  return {
    kind: "behavioral_identity",
    priority: companionState?.conversationalMode === "reflective" ? 0.78 : route?.casualConversation ? 0.54 : 0.32,
    summary: signals.slice(0, 2).join("; ")
  };
}

function dreamingEvidence(value = null, route = {}) {
  const insights = Array.isArray(value?.insights) ? value.insights : [];
  const item = insights.find((entry) => entry?.confidence !== 0) || insights[0] || null;
  const summary = clean(item?.summary || item?.insight || item?.text, 420);
  if (!summary) return null;
  return {
    kind: "dreaming",
    priority: route?.casualConversation ? 0.4 : 0.3,
    summary
  };
}

function experienceEvidence(value = null, route = {}) {
  const experiences = Array.isArray(value?.experiences) ? value.experiences : [];
  const item = experiences[0] || null;
  const summary = clean(
    item?.learning ||
    item?.outcome ||
    item?.summary ||
    item?.observation,
    420
  );
  if (!summary) return null;
  return {
    kind: "experience",
    priority: route?.developer || route?.goals || route?.training || route?.nutrition ? 0.72 : 0.46,
    summary
  };
}

function convictionEvidence(value = null, route = {}) {
  if (!value || typeof value !== "object") return null;
  const goals = Array.isArray(value?.goals) ? value.goals : [];
  const goal = goals.find((item) => item?.active !== false) || goals[0] || null;
  const summary = clean(
    goal?.statement ||
    goal?.goal ||
    goal?.title ||
    value?.activeGoal?.statement ||
    value?.activeGoal?.title,
    420
  );
  if (!summary) return null;
  return {
    kind: "conviction_goal",
    priority: route?.goals || route?.training || route?.nutrition ? 0.9 : 0.38,
    summary
  };
}

function maxEvidenceSources(route = {}, safety = {}) {
  if (isOwnerUltraRoute(route)) return 6;
  if (safety?.highStakes === true) return 2;
  if (route?.complexity === "deep") return 3;
  if (route?.casualConversation === true) return 1;
  return 2;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
