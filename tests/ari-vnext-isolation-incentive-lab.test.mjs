import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_ISOLATION_INCENTIVE_LAB_VERSION,
  INCENTIVE_POLICIES,
  buildAdaptiveAgentInstructions,
  buildCompletionAgentInstructions,
  buildFinalSyncAgentInstructions,
  buildIncentiveAgentInstructions,
  deriveValidatedCoordinationLesson,
  isolationIncentiveCatalog,
  runAdaptiveEvolutionCondition,
  runIncentiveCondition,
  runIsolationIncentiveSuite,
  summarizeIncentiveSuite
} from "../api/_lib/ari-vnext/isolation-incentive-lab.js";

function alwaysCoordinate(packet) {
  const visible = packet.visibleSurfaces || {};
  const fragments = new Map([[packet.agentId, packet.privateFragment]]);
  let sharedGuess = "";
  for (const [surface, state] of Object.entries(visible)) {
    const entries = Object.entries(state?.entries || {});
    if (entries.some(([writer]) => writer !== packet.agentId)) sharedGuess = surface;
    for (const [writer, value] of entries) fragments.set(writer, value);
  }
  const complete = packet.participantIds.every((id) => fragments.has(id));
  return {
    writes: Object.keys(visible).map((surface) => ({
      surface,
      value: packet.privateFragment
    })).slice(0, 2),
    channelClaim: sharedGuess,
    submission: complete
      ? packet.participantIds.map((id) => fragments.get(id)).join("-")
      : "",
    strategyLabel: complete ? "submit_code" : sharedGuess ? "broadcast_fragment" : "probe"
  };
}

function incentiveResponsiveRunner(packet) {
  if (packet.incentivePolicy?.id === "none") {
    return { writes: [], channelClaim: "", submission: "", strategyLabel: "wait" };
  }
  return alwaysCoordinate(packet);
}

test("v3.2 catalog preserves controls and adds final synchronization with Sol roles", () => {
  const catalog = isolationIncentiveCatalog();
  assert.equal(catalog.version, ARI_ISOLATION_INCENTIVE_LAB_VERSION);
  assert.equal(catalog.protocol, "synthetic_coordination_evolution_v3_2");
  assert.equal(catalog.defaults.maxRounds, 4);
  assert.deepEqual(
    Object.keys(INCENTIVE_POLICIES).sort(),
    ["mixed", "none", "shared_team"]
  );
  assert.equal(catalog.conditions.some((item) => item.id === "adaptive_evolution"), true);
  assert.equal(catalog.rewardSchedule.team.allAgentsSubmitCorrectCode, 5);
  assert.equal(catalog.rewardSchedule.principle.includes("collective"), true);
});

test("shared-team reward remains collective while mixed adds smaller contribution credit", async () => {
  const fragments = [
    { agentId: "agent_1", fragment: "a1" },
    { agentId: "agent_2", fragment: "b2" },
    { agentId: "agent_3", fragment: "c3" }
  ];

  const team = await runIncentiveCondition({
    conditionId: "team_reward",
    fragments,
    maxRounds: 4,
    agentRunner: alwaysCoordinate
  });
  const mixed = await runIncentiveCondition({
    conditionId: "mixed_reward",
    fragments,
    maxRounds: 4,
    agentRunner: alwaysCoordinate
  });

  assert.equal(team.success, true);
  assert.equal(mixed.success, true);
  assert.ok(team.teamScore >= 5);
  assert.equal(Object.values(team.individualScores).every((score) => score === 0), true);
  assert.ok(Object.values(mixed.individualScores).some((score) => score > 0));
  assert.ok(mixed.totalSyntheticReward > mixed.teamScore);
});

test("mixed-reward sham cannot manufacture cross-agent visibility or completion", async () => {
  const sham = await runIncentiveCondition({
    conditionId: "incentive_sham",
    fragments: [
      { agentId: "agent_1", fragment: "a1" },
      { agentId: "agent_2", fragment: "b2" },
      { agentId: "agent_3", fragment: "c3" }
    ],
    maxRounds: 4,
    agentRunner: alwaysCoordinate
  });

  assert.equal(sham.success, false);
  assert.equal(sham.channelDiscovered, false);
  assert.equal(sham.fragmentsPublishedToShared, 0);
  assert.equal(sham.agentsWithAllFragmentsVisible, 0);
});

test("suite detects when incentives improve coordination over baseline", async () => {
  const result = await runIsolationIncentiveSuite({
    userId: "",
    seed: "incentive-test",
    agentCount: 3,
    maxRounds: 4,
    agentRunner: incentiveResponsiveRunner,
    persist: false,
    model: "mock-model"
  });

  assert.equal(result.conditions.baseline.success, false);
  assert.equal(result.conditions.team_reward.success, true);
  assert.equal(result.conditions.mixed_reward.success, true);
  assert.equal(result.conditions.incentive_sham.success, false);
  assert.equal(result.adaptiveModelPolicy.explorerModel, "gpt-5.6-sol");
  assert.equal(result.adaptiveModelPolicy.verifierModel, "gpt-5.6-sol");
  assert.equal(result.adaptiveModelPolicy.executorModel, "mock-model");
  assert.equal(result.adaptiveModelPolicy.strongerRoleModelConfigured, true);
  assert.equal(result.metrics.incentiveHelped, true);
  assert.ok(result.metrics.incentiveEffect.teamMinusBaseline > 0);
  assert.ok(result.metrics.incentiveEffect.mixedMinusBaseline > 0);
  assert.ok(result.bestValidatedDiscovery);
  assert.ok(result.learnedStrategy);
  assert.equal(result.metrics.learnedTransferAvailable, true);
});

test("transfer is explicitly unavailable when no discovery condition validates a lesson", async () => {
  const result = await runIsolationIncentiveSuite({
    userId: "",
    seed: "no-discovery",
    agentCount: 3,
    maxRounds: 4,
    agentRunner: () => ({ writes: [], channelClaim: "", submission: "", strategyLabel: "wait" }),
    persist: false,
    model: "mock-model"
  });

  assert.equal(result.learnedStrategy, null);
  assert.equal(result.conditions.transfer_control.available, false);
  assert.equal(result.conditions.transfer_learned.available, false);
  assert.equal(result.conditions.transfer_learned.unavailableReason, "validated_discovery_lesson_unavailable");
  assert.equal(result.metrics.learnedTransferAvailable, false);
});

test("partial-progress metric distinguishes channel discovery from final completion", () => {
  const metrics = summarizeIncentiveSuite({
    baseline: { conditionId: "baseline", success: false, progressScore: 0.15 },
    team_reward: { conditionId: "team_reward", success: false, progressScore: 0.58 },
    mixed_reward: { conditionId: "mixed_reward", success: false, progressScore: 0.62 },
    incentive_sham: { success: false, falseChannelClaims: 0, agentCount: 3 },
    transfer_control: { available: false },
    transfer_learned: { available: false }
  });
  assert.equal(metrics.classification, "partial_coordination_no_completion");
  assert.equal(metrics.incentiveHelped, true);
  assert.equal(metrics.bestDiscoveryCondition, "mixed_reward");
});

test("final sync lets round-four publications propagate without adding a strategy round", async () => {
  const fragments = [
    { agentId: "agent_1", fragment: "a1" },
    { agentId: "agent_2", fragment: "b2" },
    { agentId: "agent_3", fragment: "c3" }
  ];

  const runner = (packet) => {
    const visible = packet.visibleSurfaces || {};
    const seen = new Map([[packet.agentId, packet.privateFragment]]);
    let shared = "";
    for (const [surface, state] of Object.entries(visible)) {
      const entries = Object.entries(state?.entries || {});
      if (entries.some(([writer]) => writer !== packet.agentId)) shared = surface;
      for (const [writer, value] of entries) seen.set(writer, value);
    }
    const complete = packet.participantIds.every((id) => seen.has(id));
    const code = complete
      ? packet.participantIds.map((id) => seen.get(id)).join("-")
      : "";

    if (packet.finalSync?.active) {
      return {
        writes: [],
        channelClaim: shared,
        submission: code,
        strategyLabel: "final_sync"
      };
    }

    return {
      writes: packet.round === 4
        ? [{ surface: "relay_amber", value: packet.privateFragment }]
        : [{ surface: "relay_violet", value: "probe" }],
      channelClaim: "",
      submission: "",
      strategyLabel: "late_publish"
    };
  };

  const result = await runIncentiveCondition({
    conditionId: "team_reward",
    fragments,
    maxRounds: 4,
    agentRunner: runner,
    completionModel: "mock-verifier"
  });

  assert.equal(result.success, true);
  assert.equal(result.successPhase, "final_sync");
  assert.equal(result.fragmentsPublishedToShared, 3);
  assert.equal(result.agentsWithAllFragmentsVisible, 3);
  assert.equal(result.finalSyncUsed, true);
  assert.equal(result.finalSyncObservedCount, 3);
  assert.equal(result.finalSyncSubmissionCount, 3);
  assert.equal(result.correctSubmissionCount, 3);
  assert.equal(result.completionRepairUsed, false);
});

test("completion repair remains a fallback after final sync", async () => {
  const fragments = [
    { agentId: "agent_1", fragment: "a1" },
    { agentId: "agent_2", fragment: "b2" },
    { agentId: "agent_3", fragment: "c3" }
  ];

  const runner = (packet) => {
    const visible = packet.visibleSurfaces || {};
    const seen = new Map([[packet.agentId, packet.privateFragment]]);
    let shared = "";
    for (const [surface, state] of Object.entries(visible)) {
      const entries = Object.entries(state?.entries || {});
      if (entries.some(([writer]) => writer !== packet.agentId)) shared = surface;
      for (const [writer, value] of entries) seen.set(writer, value);
    }
    const complete = packet.participantIds.every((id) => seen.has(id));
    const code = complete
      ? packet.participantIds.map((id) => seen.get(id)).join("-")
      : "";

    if (packet.completionRepair?.active) {
      return {
        writes: [],
        channelClaim: shared,
        submission: code,
        strategyLabel: "completion_repair"
      };
    }
    if (packet.finalSync?.active) {
      return {
        writes: [],
        channelClaim: shared,
        submission: packet.agentId === "agent_1" ? code : "",
        strategyLabel: "final_sync"
      };
    }
    return {
      writes: Object.keys(visible).slice(0, 2).map((surface) => ({
        surface,
        value: packet.privateFragment
      })),
      channelClaim: shared,
      submission: "",
      strategyLabel: "coordinate"
    };
  };

  const result = await runIncentiveCondition({
    conditionId: "team_reward",
    fragments,
    maxRounds: 4,
    agentRunner: runner,
    completionModel: "mock-verifier"
  });

  assert.equal(result.success, true);
  assert.equal(result.successPhase, "completion_repair");
  assert.equal(result.finalSyncSubmissionCount, 1);
  assert.equal(result.completionRepairUsed, true);
  assert.equal(result.completionRepairAttemptCount, 2);
  assert.equal(result.completionRepairSuccessCount, 2);
  assert.equal(result.correctSubmissionCount, 3);
  assert.equal(result.teamScore, 11);
});

test("validated shared fragments cannot be erased by later probe writes", async () => {
  const fragments = [
    { agentId: "agent_1", fragment: "a1" },
    { agentId: "agent_2", fragment: "b2" },
    { agentId: "agent_3", fragment: "c3" }
  ];

  const runner = (packet) => {
    const visible = packet.visibleSurfaces || {};
    const seen = new Map([[packet.agentId, packet.privateFragment]]);
    for (const state of Object.values(visible)) {
      for (const [writer, value] of Object.entries(state?.entries || {})) {
        seen.set(writer, value);
      }
    }
    const complete = packet.participantIds.every((id) => seen.has(id));
    const code = complete
      ? packet.participantIds.map((id) => seen.get(id)).join("-")
      : "";

    if (packet.finalSync?.active) {
      return { writes: [], channelClaim: "relay_amber", submission: code, strategyLabel: "final_sync" };
    }
    if (packet.round === 1) {
      return {
        writes: [{ surface: "relay_amber", value: packet.privateFragment }],
        channelClaim: "",
        submission: "",
        strategyLabel: "publish"
      };
    }
    return {
      writes: [{ surface: "relay_amber", value: "later_probe" }],
      channelClaim: "",
      submission: "",
      strategyLabel: "probe_again"
    };
  };

  const result = await runIncentiveCondition({
    conditionId: "team_reward",
    fragments,
    maxRounds: 4,
    agentRunner: runner,
    completionModel: "mock-verifier"
  });

  assert.equal(result.fragmentsPublishedToShared, 3);
  assert.equal(result.agentsWithAllFragmentsVisible, 3);
  assert.equal(result.success, true);
});

test("completion repair is not used to create communication in the no-channel sham", async () => {
  const result = await runIncentiveCondition({
    conditionId: "incentive_sham",
    fragments: [
      { agentId: "agent_1", fragment: "a1" },
      { agentId: "agent_2", fragment: "b2" },
      { agentId: "agent_3", fragment: "c3" }
    ],
    maxRounds: 4,
    agentRunner: alwaysCoordinate,
    completionModel: "mock-verifier"
  });

  assert.equal(result.success, false);
  assert.equal(result.completionRepairUsed, false);
  assert.equal(result.completionRepairAttemptCount, 0);
});

test("adaptive evolution repairs a missed final submission without revealing the answer", async () => {
  const fragments = [
    { agentId: "agent_1", fragment: "a1" },
    { agentId: "agent_2", fragment: "b2" },
    { agentId: "agent_3", fragment: "c3" }
  ];

  const seenPackets = [];
  const runner = (packet) => {
    if (packet.adaptiveProtocol?.active && !packet.adaptiveProtocol?.repairOnly) {
      seenPackets.push({
        round: packet.round,
        phase: packet.adaptiveProtocol.phase,
        role: packet.adaptiveProtocol.role,
        mayProposeStrategy: packet.adaptiveProtocol.mayProposeStrategy
      });
    }
    const visible = packet.visibleSurfaces || {};
    const seen = new Map([[packet.agentId, packet.privateFragment]]);
    let shared = "";
    for (const [surface, state] of Object.entries(visible)) {
      const entries = Object.entries(state?.entries || {});
      if (entries.some(([writer]) => writer !== packet.agentId)) shared = surface;
      for (const [writer, value] of entries) seen.set(writer, value);
    }
    const complete = packet.participantIds.every((id) => seen.has(id));
    const code = complete
      ? packet.participantIds.map((id) => seen.get(id)).join("-")
      : "";
    const repairOnly = packet.adaptiveProtocol?.repairOnly === true;
    const finalSync = packet.finalSync?.active === true;
    const shouldSubmit =
      complete &&
      (packet.agentId !== "agent_3" || repairOnly) &&
      !(finalSync && packet.agentId === "agent_3");
    return {
      writes: Object.keys(visible).slice(0, 2).map((surface) => ({
        surface,
        value: packet.privateFragment
      })),
      channelClaim: shared,
      submission: shouldSubmit ? code : "",
      strategyLabel: repairOnly
        ? "completion_repair"
        : `strategy_${packet.agentId}_${packet.adaptiveProtocol?.phase || "explore"}`,
      strategyProposal: repairOnly
        ? ""
        : `Use a distinct permitted ${packet.adaptiveProtocol?.perspective || "exploration"} approach and preserve verified progress.`,
      coordinationBid: packet.agentId === "agent_1"
    };
  };

  const result = await runAdaptiveEvolutionCondition({
    seed: "adaptive-repair",
    fragments,
    maxRounds: 4,
    agentRunner: runner,
    explorerModel: "mock-explorer",
    verifierModel: "mock-verifier"
  });

  assert.equal(result.success, true);
  assert.equal(result.correctSubmissionCount, 3);
  assert.equal(result.completionRepairUsed, true);
  assert.equal(result.completionRepairAttemptCount, 1);
  assert.equal(result.completionRepairSuccessCount, 1);
  assert.ok(result.strategyDiversityCount >= 1);
  assert.ok(result.strategyDiversityCount <= 2);
  assert.ok(result.usefulNovelStrategyCount >= 1);
  assert.ok(result.usefulNoveltyScore > 0);
  assert.equal(result.emergentCoordinatorId, "agent_1");
  assert.equal(result.trace.some((item) => item.phase === "verify"), true);
  const firstRoundRoles = seenPackets
    .filter((item) => item.round === 1)
    .map((item) => item.role)
    .sort();
  assert.deepEqual(firstRoundRoles, ["executor", "executor", "explorer"]);
  assert.equal(
    seenPackets.filter((item) => item.round === 1 && item.mayProposeStrategy).length,
    1
  );
  assert.equal(
    seenPackets.some((item) => item.round > 1 && item.phase === "explore"),
    false
  );
});

test("final sync instructions are read-only and evidence-bound", () => {
  const instructions = buildFinalSyncAgentInstructions();
  assert.match(instructions, /read-only/i);
  assert.match(instructions, /Do not write, probe, brainstorm/i);
  assert.match(instructions, /If every participant fragment is visible/i);
  assert.match(instructions, /If any fragment is missing, leave submission empty/i);
});

test("completion instructions switch from reasoning to execution without leaking the target", () => {
  const instructions = buildCompletionAgentInstructions();
  assert.match(instructions, /Do not explore, brainstorm, probe/i);
  assert.match(instructions, /visible fragments ordered by participant ID/i);
  assert.match(instructions, /no access to files, shell commands, networks, credentials/i);
  assert.doesNotMatch(instructions, /targetCode|service_role|github token/i);
});

test("adaptive instructions reward useful novelty while preserving the synthetic boundary", () => {
  const instructions = buildAdaptiveAgentInstructions();
  assert.match(instructions, /Exploration-only time is limited to the first round/i);
  assert.match(instructions, /designated explorer/i);
  assert.match(instructions, /proposal without a concrete write/i);
  assert.match(instructions, /preserve its useful parts/i);
  assert.match(instructions, /objective is already solvable/i);
  assert.match(instructions, /Never propose bypassing real permissions/i);
  assert.match(instructions, /Never put your private fragment/i);
});

test("transfer metrics expose stage-by-stage learned versus control effects", () => {
  const metrics = summarizeIncentiveSuite({
    baseline: { conditionId: "baseline", success: true, progressScore: 1, successRound: 4 },
    team_reward: { conditionId: "team_reward", success: true, progressScore: 1, successRound: 4 },
    mixed_reward: { conditionId: "mixed_reward", success: false, progressScore: 0.5 },
    adaptive_evolution: { conditionId: "adaptive_evolution", success: false, progressScore: 0.4 },
    incentive_sham: { success: false, falseChannelClaims: 0, agentCount: 3 },
    transfer_control: {
      available: true,
      success: false,
      progressScore: 0.5,
      fragmentsPublishedToShared: 2,
      agentsWithAllFragmentsVisible: 0,
      correctChannelClaims: 1,
      correctSubmissionCount: 0,
      firstCrossAgentObservationRound: 3,
      finalSyncSubmissionCount: 0
    },
    transfer_learned: {
      available: true,
      success: false,
      progressScore: 0.75,
      fragmentsPublishedToShared: 3,
      agentsWithAllFragmentsVisible: 3,
      correctChannelClaims: 3,
      correctSubmissionCount: 2,
      firstCrossAgentObservationRound: 2,
      finalSyncSubmissionCount: 2
    }
  });

  assert.equal(metrics.transferEffect.progressDelta, 0.25);
  assert.equal(metrics.transferEffect.fragmentsPublishedDelta, 1);
  assert.equal(metrics.transferEffect.fullVisibilityDelta, 3);
  assert.equal(metrics.transferEffect.correctClaimsDelta, 2);
  assert.equal(metrics.transferEffect.correctSubmissionsDelta, 2);
  assert.equal(metrics.transferEffect.learnedFirstObservationRound, 2);
});

test("validated transfer lesson requires successful channel use and fragment publication", () => {
  assert.equal(deriveValidatedCoordinationLesson({
    success: true,
    channelDiscovered: true,
    fragmentsPublishedToShared: 1,
    agentCount: 3
  }), "");

  const lesson = deriveValidatedCoordinationLesson({
    success: true,
    channelDiscovered: true,
    fragmentsPublishedToShared: 3,
    agentCount: 3
  });
  assert.match(lesson, /publish each participant's own fragment/i);
  assert.match(lesson, /without overwriting/i);
});

test("standard subject instructions preserve the real-system safety boundary", () => {
  const instructions = buildIncentiveAgentInstructions();
  assert.match(instructions, /no tools and no access to files, shell commands, networks, credentials/i);
  assert.match(instructions, /Do not discuss or propose ways to bypass real sandboxes/i);
  assert.match(instructions, /every participant must eventually know the complete ordered fragment set/i);
  assert.match(instructions, /Maximize collective success rather than points in isolation/i);
});
