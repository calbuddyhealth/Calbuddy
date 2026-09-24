// ARI vNext — Cognitive Operating System integration frame.
//
// This module connects Ari's existing world model, cognitive workspace, goals,
// memory, specialists, tools, verification, learning systems, and procedural
// skills into one explicit executive contract. It introduces no new execution
// authority and stores no hidden chain-of-thought.

export const ARI_COGNITIVE_OS_VERSION = "1.0.0";

export function buildCognitiveOperatingFrame({
  turn = {},
  route = {},
  cognitiveWorkspace = null,
  worldModel = null,
  convictionLearning = null,
  goals = [],
  dreaming = null,
  adaptiveStrategies = null,
  institutionalMemory = null,
  agentPerformance = null,
  decisionState = null,
  temporalTimeline = null,
  relevantMemory = "",
  trajectoryHistory = null,
  proceduralSkills = null
} = {}) {
  const message = clean(turn?.message, 4000);
  const activeGoals = normalizeGoals(goals, convictionLearning);
  const openLoops = Array.isArray(cognitiveWorkspace?.continuity?.openLoops)
    ? cognitiveWorkspace.continuity.openLoops.slice(0, 8)
    : [];
  const missingEvidence = uniqueText([
    ...(Array.isArray(cognitiveWorkspace?.epistemic?.missingEvidence)
      ? cognitiveWorkspace.epistemic.missingEvidence
      : []),
    ...(Array.isArray(trajectoryHistory?.recurringWeaknesses)
      ? trajectoryHistory.recurringWeaknesses
      : [])
  ], 10, 180);

  const planMode = resolvePlanMode({ route, message, activeGoals, openLoops });
  const specialists = resolveSpecialists({ route, agentPerformance });
  const verification = deriveVerificationContract({ route, message });
  const tools = deriveToolDomainPlan(route);

  return {
    version: ARI_COGNITIVE_OS_VERSION,
    active: true,
    ownerOnly: true,
    architecture: "persistent_cognitive_operating_system",
    stages: [
      "perceive",
      "retrieve",
      "model",
      "plan",
      "act",
      "verify",
      "learn"
    ],
    executive: {
      planMode,
      currentObjective: inferObjective(message, activeGoals),
      replanOnContradiction: true,
      currentEvidenceOutranksMemory: true,
      completionRequiresVerification: verification.completionRequiresVerification,
      noFalseCompletionClaims: true
    },
    perception: {
      authoritativeContextAvailable: Boolean(turn?.context?.authoritativeContext),
      currentInfoRequested: route?.currentInfo === true,
      developerEvidenceAvailable: route?.developer === true,
      visualEvidenceAvailable: Boolean(turn?.context?.visualInspection || turn?.context?.visualEvidence),
      temporalEvidenceAvailable: Number(temporalTimeline?.eventCount || 0) > 0
    },
    workingMemory: {
      relevantMemoryAvailable: Boolean(clean(relevantMemory, 120)),
      relevantMemoryChars: clean(relevantMemory, 12000).length,
      recentContinuityPairs: Number(turn?.context?.recentContinuityPairs || 0),
      openLoopCount: openLoops.length,
      openLoops: openLoops.map((item) => ({
        id: clean(item?.id, 160),
        type: clean(item?.type, 80),
        priority: Number(item?.priority || 0)
      }))
    },
    worldModel: {
      available: Boolean(worldModel),
      modelVersion: clean(worldModel?.version || worldModel?.modelVersion || worldModel?.model_version, 80) || null,
      updatedAt: worldModel?.updatedAt || worldModel?.updated_at || null,
      privacyControlsPresent: Boolean(worldModel?.privacyControls || worldModel?.privacy_controls),
      sourceSummaryPresent: Boolean(worldModel?.sourceSummary || worldModel?.source_summary)
    },
    goals: {
      count: activeGoals.length,
      active: activeGoals.slice(0, 6),
      hasActivePurpose: activeGoals.some((goal) => ["active", "waiting", "candidate"].includes(goal.status))
    },
    planning: {
      mode: planMode,
      hierarchyRequired: planMode === "hierarchical",
      alternativesRequired: route?.judgment === true || route?.developer === true || route?.currentInfo === true,
      counterfactualCheck: route?.judgment === true || route?.developer === true,
      uncertaintyCheck: true,
      stopConditionsRequired: planMode === "hierarchical"
    },
    specialists,
    tools,
    verification,
    learning: {
      dreamingActive: dreaming?.active === true,
      dreamInsightCount: Array.isArray(dreaming?.insights) ? dreaming.insights.length : 0,
      adaptiveStrategyCount: Number(adaptiveStrategies?.activeCount || 0),
      institutionalLessonCount: Number(institutionalMemory?.retrievedCount || institutionalMemory?.lessons?.length || 0),
      proceduralSkillCount: Number(proceduralSkills?.count || 0),
      trajectorySampleCount: Number(trajectoryHistory?.sampleCount || 0),
      priorTrajectoryScore: finiteOrNull(trajectoryHistory?.averageScore),
      recurringWeaknesses: uniqueText(trajectoryHistory?.recurringWeaknesses, 6, 160),
      recurringStrengths: uniqueText(trajectoryHistory?.recurringStrengths, 6, 160),
      feedbackLoop: "trajectory_evaluation_to_dreaming_to_strategy_to_skill"
    },
    epistemic: {
      missingEvidence,
      priorDecisionsAvailable: Number(decisionState?.recent?.length || 0) > 0,
      preserveUnknowns: true,
      memoryIsFallible: true,
      modelOutputIsNotEvidence: true,
      requireExternalEvidenceForCompletion: verification.requireExternalEvidence
    },
    proceduralSkills: {
      active: proceduralSkills?.active === true,
      count: Number(proceduralSkills?.count || 0),
      keys: (Array.isArray(proceduralSkills?.skills) ? proceduralSkills.skills : [])
        .slice(0, 8)
        .map((skill) => clean(skill?.key, 160))
        .filter(Boolean)
    },
    privacy: {
      hiddenChainOfThoughtStored: false,
      rawPromptStoredByThisLayer: false,
      rawReplyStoredByThisLayer: false,
      toolArgumentsStoredByThisLayer: false
    }
  };
}

export function cognitiveOperatingFrameToInstruction(frame = null) {
  if (!frame?.active) return "";
  return [
    "ARI COGNITIVE OPERATING SYSTEM — EXECUTIVE CONTRACT",
    "Run the task as a closed cognitive loop: perceive -> retrieve -> model -> plan -> act -> verify -> learn.",
    "Perception and verified external observations outrank memory, prior beliefs, plans, and model-generated assumptions.",
    "Treat memory, world-model state, dreams, strategies, and skills as fallible priors that can guide attention but never manufacture facts.",
    "For multi-step work, maintain a goal/subgoal plan and replan when observations contradict assumptions.",
    "Use specialist/council outputs as advisers. The executive remains responsible for synthesis and must not confuse another model's text with verified evidence.",
    "Tool availability is dynamic and route-scoped. Never invent a capability because a plan would benefit from it.",
    "An action or developer task is not complete until its required external verification has succeeded. Never turn a proposal, pending action, build start, or model statement into a completion claim.",
    "After outcomes become observable, use them to update strategy/evaluation layers rather than protecting the original plan.",
    "Preserve uncertainty when evidence is missing. Do not expose hidden chain-of-thought.",
    JSON.stringify(compactFrame(frame), null, 2)
  ].join("\n").slice(0, 9000);
}

function resolvePlanMode({ route = {}, message = "", activeGoals = [], openLoops = [] } = {}) {
  const text = clean(message, 3000);
  const multiStep = /\b(build|implement|architect|investigate|debug|research|plan|roadmap|entire|whole|all pieces|end[- ]to[- ]end|systemic)\b/i.test(text);
  if (route?.developer || route?.currentInfo || multiStep || activeGoals.length > 1 || openLoops.length > 2) {
    return "hierarchical";
  }
  if (route?.judgment || route?.memory || route?.goals) return "deliberative";
  return "direct";
}

function resolveSpecialists({ route = {}, agentPerformance = null } = {}) {
  const recommended = Array.isArray(agentPerformance?.recommendedRoles)
    ? agentPerformance.recommendedRoles.slice(0, 6).map((value) => clean(value, 80)).filter(Boolean)
    : [];
  const inferred = [];
  if (route?.developer) inferred.push("developer", "verifier");
  if (route?.currentInfo) inferred.push("researcher", "source_verifier");
  if (route?.health) inferred.push("health_reasoner");
  if (route?.nutrition) inferred.push("nutrition_reasoner");
  if (route?.training) inferred.push("training_reasoner");
  if (route?.judgment) inferred.push("countercase_critic");

  const roles = [...new Set([...recommended, ...inferred])].slice(0, 8);
  return {
    enabled: roles.length > 0,
    roles,
    selectionEvidenceAvailable: Number(agentPerformance?.agentTrialCount || 0) > 0,
    teamEvidenceAvailable: Number(agentPerformance?.teamTrialCount || 0) > 0,
    advisoryOnly: true,
    executiveRetainsSynthesisAuthority: true
  };
}

function deriveToolDomainPlan(route = {}) {
  const domains = [];
  if (route?.developer) domains.push("developer");
  if (route?.nutrition) domains.push("nutrition");
  if (route?.training) domains.push("training");
  if (route?.goals) domains.push("goals");
  if (route?.social) domains.push("social");
  if (route?.memory) domains.push("memory");
  if (route?.currentInfo) domains.push("web_research");
  return {
    dynamicDiscovery: true,
    routeScoped: true,
    domains: [...new Set(domains)],
    executorAuthority: "existing_ari_vnext_tool_registry",
    confirmationBoundaryPreserved: true,
    newExecutionAuthorityGranted: false
  };
}

function deriveVerificationContract({ route = {}, message = "" } = {}) {
  const text = clean(message, 3000).toLowerCase();
  const actionIntent = /\b(do|make|change|update|edit|save|log|create|delete|cancel|send|publish|merge|deploy|apply|fix|implement)\b/.test(text);
  const developer = route?.developer === true;
  const research = route?.currentInfo === true;
  const highStakes = route?.health === true || route?.legal === true || route?.financial === true;
  const requireExternalEvidence = actionIntent || developer || research || highStakes;

  const requiredEvidence = [];
  if (developer) requiredEvidence.push("tests_or_runtime_observation");
  if (/\b(merge|commit|github|repo)\b/.test(text)) requiredEvidence.push("repository_state");
  if (/\b(deploy|production|vercel)\b/.test(text)) requiredEvidence.push("deployment_state");
  if (/\b(database|supabase|migration|sql)\b/.test(text)) requiredEvidence.push("database_state");
  if (research) requiredEvidence.push("cited_current_sources");
  if (highStakes) requiredEvidence.push("qualified_evidence_and_uncertainty");

  return {
    required: requireExternalEvidence,
    requireExternalEvidence,
    completionRequiresVerification: requireExternalEvidence,
    requiredEvidence: [...new Set(requiredEvidence)],
    proposalIsNotCompletion: true,
    modelTextIsNotVerification: true,
    verifiedActionFlagRequiredWhenExecuted: actionIntent
  };
}

function normalizeGoals(goals = [], convictionLearning = null) {
  const rows = [
    ...(Array.isArray(goals) ? goals : []),
    ...(Array.isArray(convictionLearning?.goals) ? convictionLearning.goals : [])
  ];
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const id = clean(row?.id || row?.goalId || row?.goal_id, 180);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const state = row?.state && typeof row.state === "object" ? row.state : row;
    out.push({
      id,
      title: clean(state?.title || state?.purpose || row?.title, 180),
      status: clean(row?.status || state?.status || "candidate", 40).toLowerCase(),
      nextAction: clean(state?.nextAction || state?.next_action, 320) || null,
      commitment: finiteOrNull(state?.commitment)
    });
  }
  return out.slice(0, 12);
}

function inferObjective(message, goals) {
  const text = clean(message, 360);
  if (text) return text;
  return clean(goals?.[0]?.title, 360) || null;
}

function compactFrame(frame) {
  return {
    version: frame.version,
    stages: frame.stages,
    executive: frame.executive,
    perception: frame.perception,
    workingMemory: frame.workingMemory,
    worldModel: frame.worldModel,
    goals: frame.goals,
    planning: frame.planning,
    specialists: frame.specialists,
    tools: frame.tools,
    verification: frame.verification,
    learning: frame.learning,
    epistemic: frame.epistemic,
    proceduralSkills: frame.proceduralSkills,
    privacy: frame.privacy
  };
}

function uniqueText(values, limit, max) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => clean(value, max))
      .filter(Boolean)
  )].slice(0, limit);
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
