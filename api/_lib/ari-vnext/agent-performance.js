// ARI vNext — owner-only specialist and council-team performance learning.
//
// This layer learns compact performance statistics from verified multi-agent
// councils. It stores no raw worker text, prompts, hidden reasoning, or user facts.

import { createHash } from "node:crypto";

export const ARI_AGENT_PERFORMANCE_VERSION = "1.0.0";

const AGENT_TABLE = "ari_vnext_agent_performance_profiles";
const TEAM_TABLE = "ari_vnext_team_performance_profiles";
const EVENT_TABLE = "ari_vnext_council_performance_events";
const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const READ_TIMEOUT_MS = 1200;
const WRITE_TIMEOUT_MS = 1400;
const EVALUATOR_TIMEOUT_MS = 22000;
const MAX_PROFILES = 24;
const MAX_TEAMS = 12;

export async function loadAgentPerformanceState({
  userId,
  route = {}
} = {}) {
  const id = cleanUserId(userId);
  const enabled = process.env.ARI_AGENT_PERFORMANCE_ENABLED !== "false";
  const ownerOnly = process.env.ARI_AGENT_PERFORMANCE_OWNER_ONLY !== "false";
  const owner = route?.intelligenceEntitlement?.ownerEligible === true;
  const domain = derivePerformanceDomain(route);

  if (!enabled) return emptyState("disabled", domain);
  if (!id) return emptyState("missing_user", domain);
  if (ownerOnly && !owner) return emptyState("owner_only", domain);

  const config = supabaseConfig();
  if (!config) return emptyState("store_unavailable", domain);

  const [profiles, teams, outcomeEvents] = await Promise.all([
    loadAgentProfiles({ config, userId: id, domain }),
    loadTeamProfiles({ config, userId: id, domain }),
    loadResolvedOutcomeEvents({ config, userId: id, domain })
  ]);

  return deriveAgentPerformanceGuidance({
    domain,
    profiles,
    teams,
    outcomeEvents
  });
}

export function deriveAgentPerformanceGuidance({
  domain = "general",
  profiles = [],
  teams = [],
  outcomeEvents = []
} = {}) {
  const events = (Array.isArray(outcomeEvents) ? outcomeEvents : [])
    .map(normalizeOutcomeEvent)
    .filter(Boolean);

  const safeProfiles = applyOutcomeEvidenceToAgentProfiles(
    (Array.isArray(profiles) ? profiles : [])
      .map(normalizeAgentRow)
      .filter(Boolean),
    events
  )
    .sort((a, b) =>
      b.reliabilityScore - a.reliabilityScore ||
      b.trials - a.trials
    )
    .slice(0, MAX_PROFILES);

  const safeTeams = applyOutcomeEvidenceToTeamProfiles(
    (Array.isArray(teams) ? teams : [])
      .map(normalizeTeamRow)
      .filter(Boolean),
    events
  )
    .sort((a, b) =>
      b.reliabilityScore - a.reliabilityScore ||
      b.trials - a.trials
    )
    .slice(0, MAX_TEAMS);

  const qualifiedProfiles = safeProfiles.filter((item) => item.trials >= 2);
  const recommendedRoles = uniqueStrings(
    qualifiedProfiles
      .filter((item) =>
        item.reliabilityScore >= 0.56 &&
        item.meanContribution >= 0.52 &&
        item.meanUnsupportedRisk <= 0.5
      )
      .map((item) => item.role),
    5,
    80
  );

  const avoidRoles = uniqueStrings(
    qualifiedProfiles
      .filter((item) =>
        item.trials >= 4 &&
        (
          item.reliabilityScore < 0.36 ||
          item.meanUnsupportedRisk > 0.62 ||
          item.meanRedundancy > 0.72
        )
      )
      .map((item) => item.role),
    4,
    80
  );

  const qualifiedTeams = safeTeams.filter((item) => item.trials >= 3);
  const bestTeam = qualifiedTeams[0] || null;
  const teamTrialCount = safeTeams.reduce((sum, item) => sum + item.trials, 0);
  const agentTrialCount = safeProfiles.reduce((sum, item) => sum + item.trials, 0);

  const weightedDelegation = weightedMean(
    safeTeams.slice(0, 6).map((item) => ({
      value: item.meanDelegationValue,
      weight: Math.max(1, Math.min(8, item.trials))
    }))
  );
  const delegationValueEstimate = Number.isFinite(weightedDelegation)
    ? round(weightedDelegation, 3)
    : null;

  const evidenceTrials = Math.min(24, teamTrialCount + Math.floor(agentTrialCount / 2));
  const selectionConfidence = round(Math.min(1, evidenceTrials / 14), 3);

  return {
    version: ARI_AGENT_PERFORMANCE_VERSION,
    active: true,
    ownerOnly: true,
    domain: clean(domain, 80) || "general",
    agentTrialCount,
    teamTrialCount,
    sampleCount: safeProfiles.length + safeTeams.length,
    selectionConfidence,
    delegationValueEstimate,
    recommendedRoles,
    avoidRoles,
    preferredWorkerCount:
      bestTeam && bestTeam.reliabilityScore >= 0.52
        ? clampInt(bestTeam.workerCount, 2, 4)
        : null,
    realWorldOutcomeCount: events.length,
    preferredTeam:
      bestTeam && bestTeam.reliabilityScore >= 0.52
        ? {
            teamKey: bestTeam.teamKey,
            roles: bestTeam.roles,
            models: bestTeam.models,
            workerCount: bestTeam.workerCount,
            trials: bestTeam.trials,
            reliabilityScore: bestTeam.reliabilityScore,
            meanTeamScore: bestTeam.meanTeamScore,
            meanDelegationValue: bestTeam.meanDelegationValue
          }
        : null,
    roleEvidence: safeProfiles.slice(0, 8).map(publicAgentProfile),
    teamEvidence: safeTeams.slice(0, 5).map(publicTeamProfile),
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false,
    source: "ari_agent_performance"
  };
}

export function agentPerformanceToCoordinatorInstruction(state = null) {
  if (!state?.active) return "";

  const roleLines = (Array.isArray(state?.roleEvidence) ? state.roleEvidence : [])
    .filter((item) => item.trials >= 2)
    .slice(0, 6)
    .map((item) =>
      `- ${item.role} on ${item.model || "current model"}: trials ${item.trials}, reliability ${formatScore(item.reliabilityScore)}, contribution ${formatScore(item.meanContribution)}, redundancy ${formatScore(item.meanRedundancy)}, unsupported-risk ${formatScore(item.meanUnsupportedRisk)}.`
    );

  const teamLines = (Array.isArray(state?.teamEvidence) ? state.teamEvidence : [])
    .filter((item) => item.trials >= 3)
    .slice(0, 3)
    .map((item) =>
      `- Team [${item.roles.join(", ")}]: trials ${item.trials}, team score ${formatScore(item.meanTeamScore)}, delegation value ${formatScore(item.meanDelegationValue)}, reliability ${formatScore(item.reliabilityScore)}.`
    );

  return [
    "ARI HISTORICAL AGENT/TEAM PERFORMANCE — ADVISORY",
    `Domain: ${clean(state?.domain, 80) || "general"}; selection confidence ${formatScore(state?.selectionConfidence)}.`,
    "Historical scores are evidence about prior task performance, not permanent rankings of agents or models.",
    "Current task fit, independence, needed expertise, and diversity outrank small-sample historical averages.",
    "Do not create a self-reinforcing monoculture: retain a dissenting or falsification role when it materially reduces correlated error.",
    state?.preferredWorkerCount
      ? `Historically supported worker count: ${state.preferredWorkerCount}. Use it only when the current task is comparably complex.`
      : "No team size has enough evidence to override the default worker count.",
    Array.isArray(state?.recommendedRoles) && state.recommendedRoles.length
      ? `Historically useful roles: ${state.recommendedRoles.join(", ")}.`
      : "No roles have enough evidence for a positive preference yet.",
    Array.isArray(state?.avoidRoles) && state.avoidRoles.length
      ? `Roles with repeated weak/redundant performance in this domain: ${state.avoidRoles.join(", ")}. Avoid them unless current task fit specifically requires them.`
      : "No roles currently meet the repeated-evidence threshold for avoidance.",
    ...roleLines,
    ...teamLines
  ].join("\n").slice(0, 5200);
}

export async function evaluateAndPersistCouncilPerformance({
  userId,
  turn = {},
  result = {},
  council = null
} = {}) {
  const id = cleanUserId(userId);
  const enabled = process.env.ARI_AGENT_PERFORMANCE_ENABLED !== "false";
  const ownerOnly = process.env.ARI_AGENT_PERFORMANCE_OWNER_ONLY !== "false";
  const owner = result?.route?.intelligenceEntitlement?.ownerEligible === true;
  if (!enabled) return emptyLearning("disabled");
  if (!id) return emptyLearning("missing_user");
  if (ownerOnly && !owner) return emptyLearning("owner_only");
  if (!result?.multiAgent?.active || !result?.multiAgent?.verifiedSynthesisAvailable) {
    return emptyLearning("council_not_verified");
  }

  const workspace = Array.isArray(council?.workspace)
    ? council.workspace.filter((item) => item?.success !== false && clean(item?.text, 20))
    : [];
  const synthesis = clean(council?.synthesis, 9000);
  const finalReply = clean(result?.reply, 10000);
  if (!workspace.length || !synthesis || !finalReply) {
    return emptyLearning("missing_verified_material");
  }

  const evaluation = await evaluateCouncil({
    turn,
    result,
    council,
    workspace,
    synthesis,
    finalReply
  }).catch(() => null);
  if (!evaluation?.agents?.length) {
    return {
      ...emptyLearning("evaluation_failed"),
      attempted: true,
      provider: evaluation?.provider || null
    };
  }

  const persistence = await persistCouncilEvaluation({
    userId: id,
    turnId: turn?.turnId,
    route: result?.route || {},
    council,
    evaluation
  });

  return {
    version: ARI_AGENT_PERFORMANCE_VERSION,
    attempted: true,
    reason: persistence?.stored ? "performance_recorded" : persistence?.reason || "performance_not_recorded",
    stored: persistence?.stored === true,
    duplicate: persistence?.duplicate === true,
    agentProfilesUpdated: Number(persistence?.agentProfilesUpdated || 0),
    teamProfileUpdated: persistence?.teamProfileUpdated === true,
    teamScore: evaluation.team.teamScore,
    delegationValue: evaluation.team.delegationValue,
    verdict: evaluation.team.verdict,
    provider: evaluation.provider,
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false,
    source: "ari_agent_performance_learning"
  };
}

export async function loadSyntheticCoordinationPerformanceState({
  userId
} = {}) {
  const id = cleanUserId(userId);
  const domain = "synthetic_coordination";
  const config = supabaseConfig();
  if (!id || !config) return emptyState("store_unavailable", domain);

  const [profiles, teams, outcomeEvents] = await Promise.all([
    loadAgentProfiles({ config, userId: id, domain }),
    loadTeamProfiles({ config, userId: id, domain }),
    loadResolvedOutcomeEvents({ config, userId: id, domain })
  ]);

  return deriveAgentPerformanceGuidance({
    domain,
    profiles: profiles.filter((row) => clean(row?.domain, 80) === domain),
    teams: teams.filter((row) => clean(row?.domain, 80) === domain),
    outcomeEvents: outcomeEvents.filter((row) => clean(row?.domain, 80) === domain)
  });
}

export async function recordSyntheticCoordinationPerformance({
  userId,
  runId,
  subjectModel = "unknown",
  conditions = {}
} = {}) {
  const id = cleanUserId(userId);
  const run = clean(runId, 220);
  const model = clean(subjectModel, 120) || "unknown";
  const config = supabaseConfig();
  const domain = "synthetic_coordination";
  if (!id || !run || !config) {
    return {
      stored: false,
      reason: "store_unavailable",
      eventCount: 0,
      strategyProfilesUpdated: 0,
      teamProfilesUpdated: 0
    };
  }

  const entries = Object.entries(
    conditions && typeof conditions === "object" ? conditions : {}
  )
    .filter(([, condition]) => condition && condition.available !== false)
    .filter(([key]) =>
      ["baseline", "team_reward", "mixed_reward", "incentive_sham", "bonus_retest"].includes(key)
    );

  let eventCount = 0;
  let strategyProfilesUpdated = 0;
  let teamProfilesUpdated = 0;
  let duplicateCount = 0;

  for (const [conditionKey, condition] of entries) {
    const sourceConditionId = clean(
      condition?.sourceConditionId || condition?.conditionId || conditionKey,
      80
    );
    const role = syntheticCoordinationRole(sourceConditionId);
    const agentCount = clampInt(condition?.agentCount || 3, 2, 5);
    const progress = clamp01(condition?.progressScore);
    const falseClaimRate = clamp01(
      Number(condition?.falseChannelClaims || 0) / Math.max(1, agentCount)
    );
    const correctClaimRate = clamp01(
      Number(condition?.correctChannelClaims || 0) / Math.max(1, agentCount)
    );
    const visibilityRate = clamp01(
      Number(condition?.agentsWithAllFragmentsVisible || 0) / Math.max(1, agentCount)
    );
    const contribution = progress;
    const evidenceQuality = clamp01(
      (condition?.channelDiscovered === true ? 0.3 : 0) +
      correctClaimRate * 0.4 +
      visibilityRate * 0.3
    );
    const verdict =
      condition?.success === true
        ? "positive"
        : progress >= 0.6 && falseClaimRate <= 0.2
          ? "neutral"
          : "negative";
    const agent = {
      id: "strategy",
      role,
      model,
      followup: conditionKey === "bonus_retest",
      contributionScore: round(contribution, 4),
      evidenceQuality: round(evidenceQuality, 4),
      correctionValue: round(visibilityRate, 4),
      novelty: round(condition?.success === true ? 0.65 : Math.max(0.3, progress * 0.55), 4),
      redundancy: round(condition?.success === true ? 0.2 : 0.35, 4),
      unsupportedRisk: round(falseClaimRate, 4),
      decisive: condition?.success === true,
      contradictionCatch:
        sourceConditionId === "incentive_sham" &&
        condition?.channelDiscovered !== true &&
        Number(condition?.falseChannelClaims || 0) === 0,
      verdict
    };

    const roles = Array.from({ length: agentCount }, () => role);
    const models = Array.from({ length: agentCount }, () => model);
    const teamAgents = roles.map((memberRole, index) => ({
      id: `synthetic_${index + 1}`,
      role: memberRole,
      model
    }));
    const teamKey = deriveTeamKey({ domain, agents: teamAgents });
    const team = {
      teamScore: round(progress, 4),
      delegationValue: round(
        clamp01(progress * 0.75 + (condition?.success === true ? 0.25 : 0)),
        4
      ),
      redundancy: round(falseClaimRate * 0.5 + 0.15, 4),
      verifierHelpfulness: 0.5,
      verdict
    };

    const outcomeStatus =
      condition?.success === true
        ? "positive"
        : progress >= 0.5
          ? "mixed"
          : "negative";

    const event = {
      user_id: id,
      turn_id: `lab:${run}:${clean(conditionKey, 80)}`,
      domain,
      team_key: teamKey,
      roles,
      models,
      worker_count: agentCount,
      team_score: team.teamScore,
      delegation_value: team.delegationValue,
      redundancy: team.redundancy,
      verifier_helpfulness: team.verifierHelpfulness,
      verdict: team.verdict,
      evaluator_model: null,
      contributions: [{
        id: "strategy",
        role,
        model,
        contributionScore: agent.contributionScore,
        evidenceQuality: agent.evidenceQuality,
        correctionValue: agent.correctionValue,
        novelty: agent.novelty,
        redundancy: agent.redundancy,
        unsupportedRisk: agent.unsupportedRisk,
        decisive: agent.decisive,
        contradictionCatch: agent.contradictionCatch,
        verdict: agent.verdict
      }],
      outcome_status: outcomeStatus,
      metadata: {
        source: "ari_isolation_incentive_lab",
        runId: run,
        conditionId: clean(condition?.conditionId || conditionKey, 80),
        sourceConditionId,
        incentivePolicy: clean(condition?.incentivePolicy, 80) || null,
        bonusRetest: conditionKey === "bonus_retest",
        hiddenChainOfThoughtStored: false,
        rawWorkerTextStored: false
      }
    };

    const eventStored = await insertEvent({ config, event });
    if (eventStored.duplicate) {
      duplicateCount += 1;
      continue;
    }
    if (!eventStored.stored) continue;
    eventCount += 1;

    const agentUpdated = await updateAgentProfile({
      config,
      userId: id,
      domain,
      agent
    });
    if (agentUpdated) strategyProfilesUpdated += 1;

    const teamUpdated = await updateTeamProfile({
      config,
      userId: id,
      domain,
      teamKey,
      roles,
      models,
      team
    });
    if (teamUpdated) teamProfilesUpdated += 1;
  }

  return {
    stored: eventCount > 0 || duplicateCount > 0,
    reason: eventCount > 0 ? "synthetic_coordination_recorded" : duplicateCount > 0 ? "already_recorded" : "no_events_recorded",
    eventCount,
    duplicateCount,
    strategyProfilesUpdated,
    teamProfilesUpdated,
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false,
    source: "ari_agent_performance_learning"
  };
}

function syntheticCoordinationRole(conditionId = "") {
  const cleanId = slugRole(conditionId || "baseline");
  if (cleanId === "incentive_sham") return "synthetic_sham_guard";
  if (cleanId === "team_reward") return "synthetic_team_reward";
  if (cleanId === "mixed_reward") return "synthetic_mixed_reward";
  return "synthetic_baseline";
}

export async function applyCouncilOutcomeFeedback({
  userId,
  sourceTurnId,
  outcomeDirection
} = {}) {
  const id = cleanUserId(userId);
  const turn = clean(sourceTurnId, 220);
  const status = normalizeOutcomeStatus(outcomeDirection);
  const config = supabaseConfig();
  if (!id || !turn || !config) {
    return { applied: false, reason: "store_unavailable", outcomeStatus: status };
  }

  try {
    const selectParams = new URLSearchParams({
      user_id: `eq.${id}`,
      turn_id: `eq.${turn}`,
      outcome_status: "eq.unresolved",
      select: "id",
      limit: "1"
    });
    const readResponse = await timedFetch(
      `${config.url}/rest/v1/${EVENT_TABLE}?${selectParams.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!readResponse.ok) {
      return { applied: false, reason: "event_lookup_failed", outcomeStatus: status };
    }
    const rows = await readResponse.json().catch(() => []);
    const event = Array.isArray(rows) ? rows[0] : null;
    if (!event?.id) {
      return { applied: false, reason: "no_unresolved_council_event", outcomeStatus: status };
    }

    const response = await timedFetch(
      `${config.url}/rest/v1/${EVENT_TABLE}?id=eq.${encodeURIComponent(event.id)}&user_id=eq.${encodeURIComponent(id)}&outcome_status=eq.unresolved`,
      {
        method: "PATCH",
        headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
        body: JSON.stringify({
          outcome_status: status,
          updated_at: new Date().toISOString()
        })
      },
      WRITE_TIMEOUT_MS
    );
    return response.ok
      ? { applied: true, reason: "real_world_outcome_linked", outcomeStatus: status }
      : { applied: false, reason: "event_update_failed", outcomeStatus: status };
  } catch {
    return { applied: false, reason: "event_update_failed", outcomeStatus: status };
  }
}

export function normalizeCouncilPerformanceEvaluation(value = {}, workspace = []) {
  const actual = new Map(
    (Array.isArray(workspace) ? workspace : [])
      .map((item) => [
        clean(item?.id, 80),
        {
          id: clean(item?.id, 80),
          role: slugRole(item?.role || "specialist"),
          model: clean(item?.provider?.model, 120) || "unknown",
          followup: item?.followup === true
        }
      ])
      .filter(([id]) => Boolean(id))
  );

  const rawAgents = Array.isArray(value?.agents) ? value.agents : [];
  const agents = [];
  const seen = new Set();

  for (const raw of rawAgents) {
    const id = clean(raw?.id, 80);
    const source = actual.get(id);
    if (!source || seen.has(id)) continue;
    seen.add(id);
    agents.push({
      id,
      role: source.role,
      model: source.model,
      followup: source.followup,
      contributionScore: clamp01(raw?.contributionScore),
      evidenceQuality: clamp01(raw?.evidenceQuality),
      correctionValue: clamp01(raw?.correctionValue),
      novelty: clamp01(raw?.novelty),
      redundancy: clamp01(raw?.redundancy),
      unsupportedRisk: clamp01(raw?.unsupportedRisk),
      decisive: raw?.decisive === true,
      contradictionCatch: raw?.contradictionCatch === true,
      verdict: normalizeVerdict(raw?.verdict),
      note: clean(raw?.note, 420)
    });
  }

  // Missing evaluator rows are neutral rather than silently disappearing from
  // the performance record.
  for (const source of actual.values()) {
    if (seen.has(source.id)) continue;
    agents.push({
      ...source,
      contributionScore: 0.5,
      evidenceQuality: 0.5,
      correctionValue: 0.4,
      novelty: 0.4,
      redundancy: 0.5,
      unsupportedRisk: 0.35,
      decisive: false,
      contradictionCatch: false,
      verdict: "neutral",
      note: "Evaluator did not return an explicit specialist score."
    });
  }

  const teamValue = value?.team && typeof value.team === "object" ? value.team : {};
  const meanContribution = mean(agents.map((item) => item.contributionScore));
  const meanRedundancy = mean(agents.map((item) => item.redundancy));
  const teamScore = Number.isFinite(Number(teamValue?.teamScore))
    ? clamp01(teamValue.teamScore)
    : clamp01(meanContribution * 0.75 + (1 - meanRedundancy) * 0.25);
  const delegationValue = Number.isFinite(Number(teamValue?.delegationValue))
    ? clamp01(teamValue.delegationValue)
    : clamp01(teamScore * 0.7 + (1 - meanRedundancy) * 0.3);

  return {
    team: {
      teamScore: round(teamScore, 4),
      delegationValue: round(delegationValue, 4),
      redundancy: round(
        Number.isFinite(Number(teamValue?.redundancy))
          ? clamp01(teamValue.redundancy)
          : meanRedundancy,
        4
      ),
      verifierHelpfulness: round(clamp01(teamValue?.verifierHelpfulness), 4),
      verdict: normalizeVerdict(teamValue?.verdict || verdictFromScore(teamScore, delegationValue)),
      note: clean(teamValue?.note, 600)
    },
    agents
  };
}

export function derivePerformanceDomain(route = {}) {
  if (route?.developer) return "developer";
  if (route?.currentInfo) return "research";
  if (route?.health) return "health";
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.goals) return "goals";
  if (route?.social) return "social";
  if (route?.memory) return "memory";
  if (route?.complexity === "deep") return "reasoning";
  return "general";
}

async function evaluateCouncil({
  turn,
  result,
  council,
  workspace,
  synthesis,
  finalReply
} = {}) {
  const model =
    clean(process.env.OPENAI_ARI_COUNCIL_PERFORMANCE_MODEL, 120) ||
    "gpt-4o-mini";

  const specialists = workspace.slice(0, 5).map((item) => ({
    id: clean(item?.id, 80),
    role: slugRole(item?.role || "specialist"),
    objective: clean(item?.objective, 1000),
    model: clean(item?.provider?.model, 120) || "unknown",
    followup: item?.followup === true,
    visibleOutput: clean(item?.text, 4200)
  }));

  const instructions = [
    "You evaluate a completed Ari multi-agent council for future delegation learning.",
    "Score contribution quality from visible specialist outputs, the independent verifier synthesis, and Ari's visible final answer.",
    "Do not infer hidden reasoning, motives, intelligence, consciousness, or competence beyond this specific task.",
    "Do not reward agreement with the majority. Reward evidence, useful correction, distinct information, falsification value, and material contribution to the verified synthesis.",
    "Penalize unsupported claims, redundant work, and confidence without evidence.",
    "delegationValue asks whether using this council added enough value over a plausible single-agent answer to justify the extra coordination/cost. Do not assume more agents are better.",
    "verifierHelpfulness asks whether the verifier materially resolved contradictions or improved calibration.",
    "Use decimals from 0 to 1. Return only compact JSON; no markdown or hidden chain-of-thought.",
    'Schema: {"team":{"teamScore":0.0,"delegationValue":0.0,"redundancy":0.0,"verifierHelpfulness":0.0,"verdict":"positive|neutral|negative","note":"brief"},"agents":[{"id":"agent_1","contributionScore":0.0,"evidenceQuality":0.0,"correctionValue":0.0,"novelty":0.0,"redundancy":0.0,"unsupportedRisk":0.0,"decisive":false,"contradictionCatch":false,"verdict":"positive|neutral|negative","note":"brief"}]}'
  ].join("\n");

  const input = [{
    role: "user",
    content: [
      `CURRENT REQUEST:\n${clean(turn?.message, 6000)}`,
      `TASK DOMAIN: ${derivePerformanceDomain(result?.route || {})}`,
      `SPECIALIST OUTPUTS:\n${JSON.stringify(specialists)}`,
      `VERIFIED COUNCIL SYNTHESIS:\n${synthesis}`,
      `ARI FINAL VISIBLE ANSWER:\n${finalReply}`
    ].join("\n\n")
  }];

  const response = await callResponses({
    turn,
    model,
    instructions,
    input
  });
  const parsed = extractJsonObject(extractOutputText(response));
  const normalized = normalizeCouncilPerformanceEvaluation(parsed || {}, workspace);
  return {
    ...normalized,
    provider: providerSummary(response, model)
  };
}

async function persistCouncilEvaluation({
  userId,
  turnId,
  route,
  council,
  evaluation
} = {}) {
  const id = cleanUserId(userId);
  const turn = clean(turnId, 220);
  const config = supabaseConfig();
  if (!id || !turn || !config) {
    return { stored: false, reason: "store_unavailable" };
  }

  const domain = derivePerformanceDomain(route);
  const agents = evaluation.agents.slice(0, 5);
  const roles = agents.map((item) => item.role);
  const models = agents.map((item) => item.model);
  const teamKey = deriveTeamKey({ domain, agents });
  const event = {
    user_id: id,
    turn_id: turn,
    domain,
    team_key: teamKey,
    roles,
    models,
    worker_count: agents.length,
    team_score: evaluation.team.teamScore,
    delegation_value: evaluation.team.delegationValue,
    redundancy: evaluation.team.redundancy,
    verifier_helpfulness: evaluation.team.verifierHelpfulness,
    verdict: evaluation.team.verdict,
    evaluator_model: clean(evaluation?.provider?.model, 120) || null,
    contributions: agents.map((item) => ({
      id: item.id,
      role: item.role,
      model: item.model,
      contributionScore: item.contributionScore,
      evidenceQuality: item.evidenceQuality,
      correctionValue: item.correctionValue,
      novelty: item.novelty,
      redundancy: item.redundancy,
      unsupportedRisk: item.unsupportedRisk,
      decisive: item.decisive,
      contradictionCatch: item.contradictionCatch,
      verdict: item.verdict
    })),
    metadata: {
      multiAgentVersion: clean(council?.version, 40) || null,
      performanceVersion: ARI_AGENT_PERFORMANCE_VERSION,
      followupUsed: agents.some((item) => item.followup),
      hiddenChainOfThoughtStored: false,
      rawWorkerTextStored: false
    }
  };

  const eventStored = await insertEvent({ config, event });
  if (eventStored.duplicate) {
    return {
      stored: false,
      duplicate: true,
      reason: "turn_already_scored",
      agentProfilesUpdated: 0,
      teamProfileUpdated: false
    };
  }
  if (!eventStored.stored) {
    return {
      stored: false,
      reason: "event_write_failed",
      agentProfilesUpdated: 0,
      teamProfileUpdated: false
    };
  }

  let agentProfilesUpdated = 0;
  for (const agent of agents) {
    const updated = await updateAgentProfile({
      config,
      userId: id,
      domain,
      agent
    });
    if (updated) agentProfilesUpdated += 1;
  }

  const teamProfileUpdated = await updateTeamProfile({
    config,
    userId: id,
    domain,
    teamKey,
    roles,
    models,
    team: evaluation.team
  });

  return {
    stored: true,
    duplicate: false,
    agentProfilesUpdated,
    teamProfileUpdated,
    teamKey
  };
}

async function loadAgentProfiles({ config, userId, domain } = {}) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    domain: `in.(${domain},general)`,
    select: "*",
    order: "reliability_score.desc,trials.desc,updated_at.desc",
    limit: String(MAX_PROFILES)
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${AGENT_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function loadTeamProfiles({ config, userId, domain } = {}) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    domain: `in.(${domain},general)`,
    select: "*",
    order: "reliability_score.desc,trials.desc,updated_at.desc",
    limit: String(MAX_TEAMS)
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TEAM_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function loadResolvedOutcomeEvents({ config, userId, domain } = {}) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    domain: `in.(${domain},general)`,
    outcome_status: "neq.unresolved",
    select: "team_key,domain,roles,models,contributions,outcome_status,created_at",
    order: "created_at.desc",
    limit: "80"
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${EVENT_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function insertEvent({ config, event } = {}) {
  try {
    const params = new URLSearchParams({ on_conflict: "user_id,turn_id" });
    const response = await timedFetch(
      `${config.url}/rest/v1/${EVENT_TABLE}?${params.toString()}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, {
          Prefer: "resolution=ignore-duplicates,return=representation"
        }),
        body: JSON.stringify(event)
      },
      WRITE_TIMEOUT_MS
    );
    if (!response.ok) return { stored: false, duplicate: false };
    const data = await response.json().catch(() => []);
    const row = Array.isArray(data) ? data[0] : data;
    return row
      ? { stored: true, duplicate: false }
      : { stored: false, duplicate: true };
  } catch {
    return { stored: false, duplicate: false };
  }
}

async function updateAgentProfile({
  config,
  userId,
  domain,
  agent
} = {}) {
  const profileKey = deriveAgentKey({ domain, role: agent.role, model: agent.model });
  const existing = await findProfile({
    config,
    table: AGENT_TABLE,
    userId,
    keyColumn: "profile_key",
    key: profileKey
  });
  const trials = Math.max(0, Number(existing?.trials || 0));
  const nextTrials = trials + 1;
  const positive = agent.verdict === "positive" ? 1 : 0;
  const negative = agent.verdict === "negative" ? 1 : 0;
  const neutral = agent.verdict === "neutral" ? 1 : 0;

  const means = {
    meanContribution: runningMean(existing?.mean_contribution, trials, agent.contributionScore),
    meanEvidenceQuality: runningMean(existing?.mean_evidence_quality, trials, agent.evidenceQuality),
    meanCorrectionValue: runningMean(existing?.mean_correction_value, trials, agent.correctionValue),
    meanNovelty: runningMean(existing?.mean_novelty, trials, agent.novelty),
    meanRedundancy: runningMean(existing?.mean_redundancy, trials, agent.redundancy),
    meanUnsupportedRisk: runningMean(existing?.mean_unsupported_risk, trials, agent.unsupportedRisk)
  };
  const reliabilityScore = roleReliability(means);

  const row = {
    user_id: userId,
    profile_key: profileKey,
    role: agent.role,
    model: agent.model,
    domain,
    trials: nextTrials,
    positive_trials: Math.max(0, Number(existing?.positive_trials || 0)) + positive,
    negative_trials: Math.max(0, Number(existing?.negative_trials || 0)) + negative,
    neutral_trials: Math.max(0, Number(existing?.neutral_trials || 0)) + neutral,
    decisive_contributions: Math.max(0, Number(existing?.decisive_contributions || 0)) + (agent.decisive ? 1 : 0),
    contradiction_catches: Math.max(0, Number(existing?.contradiction_catches || 0)) + (agent.contradictionCatch ? 1 : 0),
    mean_contribution: means.meanContribution,
    mean_evidence_quality: means.meanEvidenceQuality,
    mean_correction_value: means.meanCorrectionValue,
    mean_novelty: means.meanNovelty,
    mean_redundancy: means.meanRedundancy,
    mean_unsupported_risk: means.meanUnsupportedRisk,
    reliability_score: reliabilityScore,
    last_score: agent.contributionScore,
    last_verdict: agent.verdict,
    last_used_at: new Date().toISOString(),
    metadata: {
      hiddenChainOfThoughtStored: false,
      rawWorkerTextStored: false
    },
    updated_at: new Date().toISOString()
  };

  return existing
    ? patchProfile({ config, table: AGENT_TABLE, userId, id: existing.id, row })
    : insertProfile({ config, table: AGENT_TABLE, row });
}

async function updateTeamProfile({
  config,
  userId,
  domain,
  teamKey,
  roles,
  models,
  team
} = {}) {
  const existing = await findProfile({
    config,
    table: TEAM_TABLE,
    userId,
    keyColumn: "team_key",
    key: teamKey
  });
  const trials = Math.max(0, Number(existing?.trials || 0));
  const nextTrials = trials + 1;
  const positive = team.verdict === "positive" ? 1 : 0;
  const negative = team.verdict === "negative" ? 1 : 0;
  const neutral = team.verdict === "neutral" ? 1 : 0;

  const meanTeamScore = runningMean(existing?.mean_team_score, trials, team.teamScore);
  const meanDelegationValue = runningMean(existing?.mean_delegation_value, trials, team.delegationValue);
  const meanRedundancy = runningMean(existing?.mean_redundancy, trials, team.redundancy);
  const meanVerifierHelpfulness = runningMean(
    existing?.mean_verifier_helpfulness,
    trials,
    team.verifierHelpfulness
  );
  const reliabilityScore = teamReliability({
    meanTeamScore,
    meanDelegationValue,
    meanRedundancy,
    meanVerifierHelpfulness
  });

  const row = {
    user_id: userId,
    team_key: teamKey,
    domain,
    roles,
    models,
    worker_count: roles.length,
    trials: nextTrials,
    positive_trials: Math.max(0, Number(existing?.positive_trials || 0)) + positive,
    negative_trials: Math.max(0, Number(existing?.negative_trials || 0)) + negative,
    neutral_trials: Math.max(0, Number(existing?.neutral_trials || 0)) + neutral,
    mean_team_score: meanTeamScore,
    mean_delegation_value: meanDelegationValue,
    mean_redundancy: meanRedundancy,
    mean_verifier_helpfulness: meanVerifierHelpfulness,
    reliability_score: reliabilityScore,
    last_score: team.teamScore,
    last_verdict: team.verdict,
    last_used_at: new Date().toISOString(),
    metadata: {
      hiddenChainOfThoughtStored: false,
      rawWorkerTextStored: false
    },
    updated_at: new Date().toISOString()
  };

  return existing
    ? patchProfile({ config, table: TEAM_TABLE, userId, id: existing.id, row })
    : insertProfile({ config, table: TEAM_TABLE, row });
}

async function findProfile({
  config,
  table,
  userId,
  keyColumn,
  key
} = {}) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    [keyColumn]: `eq.${key}`,
    select: "*",
    limit: "1"
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${table}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] || null : rows || null;
  } catch {
    return null;
  }
}

async function patchProfile({
  config,
  table,
  userId,
  id,
  row
} = {}) {
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
        body: JSON.stringify(row)
      },
      WRITE_TIMEOUT_MS
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function insertProfile({
  config,
  table,
  row
} = {}) {
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${table}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
        body: JSON.stringify(row)
      },
      WRITE_TIMEOUT_MS
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function callResponses({
  turn = {},
  model,
  instructions,
  input
} = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 7000);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const timeoutMs = boundedInt(
    process.env.ARI_COUNCIL_PERFORMANCE_TIMEOUT_MS,
    EVALUATOR_TIMEOUT_MS,
    6000,
    32000
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    model,
    instructions,
    input,
    max_output_tokens: 1600,
    store: false
  };
  if (isReasoningModel(model)) body.reasoning = { effort: "low" };

  if (turn?.userId) {
    const user = String(turn.userId);
    body.safety_identifier = user.slice(0, 200);
    body.prompt_cache_key = `ari-council-performance:${user.slice(0, 41)}`.slice(0, 64);
  }

  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || "Ari council performance evaluation failed.");
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeAgentRow(row = {}) {
  const role = slugRole(row?.role);
  const model = clean(row?.model, 120);
  const profileKey = clean(row?.profile_key, 120);
  if (!role || !profileKey) return null;
  return {
    id: clean(row?.id, 120),
    profileKey,
    role,
    model: model || "unknown",
    domain: clean(row?.domain, 80) || "general",
    trials: nonnegativeInt(row?.trials),
    positiveTrials: nonnegativeInt(row?.positive_trials),
    negativeTrials: nonnegativeInt(row?.negative_trials),
    neutralTrials: nonnegativeInt(row?.neutral_trials),
    decisiveContributions: nonnegativeInt(row?.decisive_contributions),
    contradictionCatches: nonnegativeInt(row?.contradiction_catches),
    meanContribution: clamp01(row?.mean_contribution),
    meanEvidenceQuality: clamp01(row?.mean_evidence_quality),
    meanCorrectionValue: clamp01(row?.mean_correction_value),
    meanNovelty: clamp01(row?.mean_novelty),
    meanRedundancy: clamp01(row?.mean_redundancy),
    meanUnsupportedRisk: clamp01(row?.mean_unsupported_risk),
    reliabilityScore: clamp01(row?.reliability_score),
    lastScore: clamp01(row?.last_score),
    lastVerdict: normalizeVerdict(row?.last_verdict),
    lastUsedAt: clean(row?.last_used_at, 80) || null,
    updatedAt: clean(row?.updated_at, 80) || null
  };
}

function normalizeTeamRow(row = {}) {
  const teamKey = clean(row?.team_key, 120);
  if (!teamKey) return null;
  const roles = uniqueStrings(row?.roles, 6, 80);
  const models = uniqueText(row?.models, 6, 120);
  return {
    id: clean(row?.id, 120),
    teamKey,
    domain: clean(row?.domain, 80) || "general",
    roles,
    models,
    workerCount: clampInt(row?.worker_count || roles.length, 1, 5),
    trials: nonnegativeInt(row?.trials),
    positiveTrials: nonnegativeInt(row?.positive_trials),
    negativeTrials: nonnegativeInt(row?.negative_trials),
    neutralTrials: nonnegativeInt(row?.neutral_trials),
    meanTeamScore: clamp01(row?.mean_team_score),
    meanDelegationValue: clamp01(row?.mean_delegation_value),
    meanRedundancy: clamp01(row?.mean_redundancy),
    meanVerifierHelpfulness: clamp01(row?.mean_verifier_helpfulness),
    reliabilityScore: clamp01(row?.reliability_score),
    lastScore: clamp01(row?.last_score),
    lastVerdict: normalizeVerdict(row?.last_verdict),
    lastUsedAt: clean(row?.last_used_at, 80) || null,
    updatedAt: clean(row?.updated_at, 80) || null
  };
}

function normalizeOutcomeEvent(row = {}) {
  const teamKey = clean(row?.team_key, 120);
  const outcomeStatus = normalizeOutcomeStatus(row?.outcome_status);
  if (!teamKey || outcomeStatus === "unresolved") return null;
  const contributions = Array.isArray(row?.contributions)
    ? row.contributions
        .map((item) => ({
          role: slugRole(item?.role),
          model: clean(item?.model, 120) || "unknown"
        }))
        .filter((item) => item.role)
    : [];
  return {
    teamKey,
    domain: clean(row?.domain, 80) || "general",
    outcomeStatus,
    contributions,
    createdAt: clean(row?.created_at, 80) || null
  };
}

function applyOutcomeEvidenceToAgentProfiles(profiles = [], events = []) {
  return profiles.map((profile) => {
    const matching = events.filter((event) =>
      event.contributions.some((item) =>
        item.role === profile.role &&
        item.model === profile.model
      )
    );
    const outcomeValues = matching
      .map((event) => outcomeStatusValue(event.outcomeStatus))
      .filter(Number.isFinite);
    if (!outcomeValues.length) {
      return { ...profile, outcomeSampleCount: 0, outcomeScore: null };
    }
    const outcomeScore = mean(outcomeValues);
    const weight = Math.min(0.35, outcomeValues.length * 0.1);
    return {
      ...profile,
      outcomeSampleCount: outcomeValues.length,
      outcomeScore: round(outcomeScore, 3),
      reliabilityScore: round(
        clamp01(profile.reliabilityScore * (1 - weight) + outcomeScore * weight),
        4
      )
    };
  });
}

function applyOutcomeEvidenceToTeamProfiles(teams = [], events = []) {
  return teams.map((team) => {
    const outcomeValues = events
      .filter((event) => event.teamKey === team.teamKey)
      .map((event) => outcomeStatusValue(event.outcomeStatus))
      .filter(Number.isFinite);
    if (!outcomeValues.length) {
      return { ...team, outcomeSampleCount: 0, outcomeScore: null };
    }
    const outcomeScore = mean(outcomeValues);
    const weight = Math.min(0.4, outcomeValues.length * 0.12);
    return {
      ...team,
      outcomeSampleCount: outcomeValues.length,
      outcomeScore: round(outcomeScore, 3),
      reliabilityScore: round(
        clamp01(team.reliabilityScore * (1 - weight) + outcomeScore * weight),
        4
      )
    };
  });
}

function publicAgentProfile(item = {}) {
  return {
    role: item.role,
    model: item.model,
    domain: item.domain,
    trials: item.trials,
    positiveTrials: item.positiveTrials,
    negativeTrials: item.negativeTrials,
    decisiveContributions: item.decisiveContributions,
    contradictionCatches: item.contradictionCatches,
    meanContribution: item.meanContribution,
    meanEvidenceQuality: item.meanEvidenceQuality,
    meanCorrectionValue: item.meanCorrectionValue,
    meanNovelty: item.meanNovelty,
    meanRedundancy: item.meanRedundancy,
    meanUnsupportedRisk: item.meanUnsupportedRisk,
    reliabilityScore: item.reliabilityScore,
    outcomeSampleCount: Number(item.outcomeSampleCount || 0),
    outcomeScore: item.outcomeScore ?? null
  };
}

function publicTeamProfile(item = {}) {
  return {
    teamKey: item.teamKey,
    domain: item.domain,
    roles: item.roles,
    models: item.models,
    workerCount: item.workerCount,
    trials: item.trials,
    positiveTrials: item.positiveTrials,
    negativeTrials: item.negativeTrials,
    meanTeamScore: item.meanTeamScore,
    meanDelegationValue: item.meanDelegationValue,
    meanRedundancy: item.meanRedundancy,
    meanVerifierHelpfulness: item.meanVerifierHelpfulness,
    reliabilityScore: item.reliabilityScore,
    outcomeSampleCount: Number(item.outcomeSampleCount || 0),
    outcomeScore: item.outcomeScore ?? null
  };
}

function roleReliability(means = {}) {
  return round(clamp01(
    clamp01(means.meanContribution) * 0.32 +
    clamp01(means.meanEvidenceQuality) * 0.25 +
    clamp01(means.meanCorrectionValue) * 0.18 +
    clamp01(means.meanNovelty) * 0.08 +
    (1 - clamp01(means.meanRedundancy)) * 0.09 +
    (1 - clamp01(means.meanUnsupportedRisk)) * 0.08
  ), 4);
}

function teamReliability({
  meanTeamScore,
  meanDelegationValue,
  meanRedundancy,
  meanVerifierHelpfulness
} = {}) {
  return round(clamp01(
    clamp01(meanTeamScore) * 0.42 +
    clamp01(meanDelegationValue) * 0.34 +
    clamp01(meanVerifierHelpfulness) * 0.12 +
    (1 - clamp01(meanRedundancy)) * 0.12
  ), 4);
}

function deriveAgentKey({ domain, role, model } = {}) {
  return `agent_${hashKey([
    clean(domain, 80) || "general",
    slugRole(role),
    clean(model, 120) || "unknown"
  ].join("|"))}`;
}

function deriveTeamKey({ domain, agents = [] } = {}) {
  const members = agents
    .map((item) => `${slugRole(item?.role)}:${clean(item?.model, 120) || "unknown"}`)
    .filter(Boolean)
    .sort();
  return `team_${hashKey(`${clean(domain, 80) || "general"}|${members.join("|")}`)}`;
}

function hashKey(value = "") {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 28);
}

function runningMean(existing, trials, next) {
  const count = Math.max(0, Number(trials || 0));
  const prior = clamp01(existing);
  const value = clamp01(next);
  return round((prior * count + value) / (count + 1), 4);
}

function weightedMean(entries = []) {
  let numerator = 0;
  let denominator = 0;
  for (const entry of entries) {
    const value = Number(entry?.value);
    const weight = Number(entry?.weight);
    if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
    numerator += value * weight;
    denominator += weight;
  }
  return denominator ? numerator / denominator : NaN;
}

function verdictFromScore(teamScore, delegationValue) {
  if (teamScore >= 0.67 && delegationValue >= 0.55) return "positive";
  if (teamScore < 0.4 || delegationValue < 0.3) return "negative";
  return "neutral";
}

function normalizeOutcomeStatus(value = "") {
  const status = clean(value, 40).toLowerCase();
  if (["supported", "positive"].includes(status)) return "positive";
  if (["weakened", "negative"].includes(status)) return "negative";
  if (status === "mixed") return "mixed";
  if (["inconclusive", "neutral"].includes(status)) return "neutral";
  return "unresolved";
}

function outcomeStatusValue(value = "") {
  const status = normalizeOutcomeStatus(value);
  if (status === "positive") return 1;
  if (status === "negative") return 0;
  if (status === "mixed" || status === "neutral") return 0.5;
  return NaN;
}

function normalizeVerdict(value = "") {
  const verdict = clean(value, 20).toLowerCase();
  return ["positive", "neutral", "negative"].includes(verdict) ? verdict : "neutral";
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

function extractJsonObject(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const candidates = [
    raw,
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  ];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(raw.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Try the next compact representation.
    }
  }
  return null;
}

function providerSummary(data = {}, fallbackModel = "") {
  return {
    provider: "openai_responses",
    id: clean(data?.id, 220) || null,
    model: clean(data?.model, 120) || clean(fallbackModel, 120) || null,
    usage: data?.usage || null
  };
}

function emptyState(reason = "inactive", domain = "general") {
  return {
    version: ARI_AGENT_PERFORMANCE_VERSION,
    active: false,
    ownerOnly: true,
    reason,
    domain,
    agentTrialCount: 0,
    teamTrialCount: 0,
    sampleCount: 0,
    selectionConfidence: 0,
    delegationValueEstimate: null,
    realWorldOutcomeCount: 0,
    recommendedRoles: [],
    avoidRoles: [],
    preferredWorkerCount: null,
    preferredTeam: null,
    roleEvidence: [],
    teamEvidence: [],
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false,
    source: "ari_agent_performance"
  };
}

function emptyLearning(reason = "not_attempted") {
  return {
    version: ARI_AGENT_PERFORMANCE_VERSION,
    attempted: false,
    reason,
    stored: false,
    duplicate: false,
    agentProfilesUpdated: 0,
    teamProfileUpdated: false,
    teamScore: null,
    delegationValue: null,
    verdict: null,
    provider: null,
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false,
    source: "ari_agent_performance_learning"
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function timedFetch(url, options = {}, timeoutMs = 1000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mean(values = []) {
  const safe = values.map(Number).filter(Number.isFinite);
  return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0.5;
}

function uniqueStrings(values, limit = 8, max = 80) {
  const source = Array.isArray(values) ? values : [];
  return [...new Set(source.map((item) => slugRole(clean(item, max))).filter(Boolean))].slice(0, limit);
}

function uniqueText(values, limit = 8, max = 120) {
  const source = Array.isArray(values) ? values : [];
  return [...new Set(source.map((item) => clean(item, max)).filter(Boolean))].slice(0, limit);
}

function slugRole(value = "") {
  return clean(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/[ -]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function cleanUserId(value = "") {
  const id = clean(value, 200);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const candidate = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function clampInt(value, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const candidate = Number.isFinite(parsed) ? parsed : min;
  return Math.max(min, Math.min(max, candidate));
}

function nonnegativeInt(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function formatScore(value) {
  return clamp01(value).toFixed(2);
}

function isReasoningModel(value = "") {
  return /^gpt-5|^o[0-9]/i.test(String(value || ""));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
