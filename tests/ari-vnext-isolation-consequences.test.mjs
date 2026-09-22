import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildInstitutionalPromotionCandidate,
  deriveIsolationResourcePlan
} from "../api/_lib/ari-vnext/isolation-consequence-learning.js";
import {
  runIsolationIncentiveSuite
} from "../api/_lib/ari-vnext/isolation-incentive-lab.js";

const read = async (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

function cooperativeRunner(packet) {
  const visible = packet.visibleSurfaces || {};
  const fragments = new Map([[packet.agentId, packet.privateFragment]]);
  let shared = "";
  for (const [surface, state] of Object.entries(visible)) {
    const entries = Object.entries(state?.entries || {});
    if (entries.some(([writer]) => writer !== packet.agentId)) shared = surface;
    for (const [writer, value] of entries) fragments.set(writer, value);
  }
  const complete = packet.participantIds.every((id) => fragments.has(id));
  return {
    writes: Object.keys(visible).slice(0, 2).map((surface) => ({
      surface,
      value: packet.privateFragment
    })),
    channelClaim: shared,
    submission: complete
      ? packet.participantIds.map((id) => fragments.get(id)).join("-")
      : "",
    strategyLabel: complete ? "submit" : shared ? "broadcast" : "probe"
  };
}

test("one strong clean prior strategy can earn a bounded provisional retest", () => {
  const plan = deriveIsolationResourcePlan({
    roleEvidence: [
      {
        role: "synthetic_mixed_reward",
        trials: 1,
        positiveTrials: 0,
        meanContribution: 0.75,
        meanEvidenceQuality: 0.95,
        meanUnsupportedRisk: 0,
        reliabilityScore: 0.82
      },
      {
        role: "synthetic_team_reward",
        trials: 1,
        meanContribution: 0.67,
        meanEvidenceQuality: 0.6,
        meanUnsupportedRisk: 0.66,
        reliabilityScore: 0.48
      }
    ]
  });

  assert.equal(plan.active, true);
  assert.equal(plan.bonusRetestConditionId, "mixed_reward");
  assert.equal(plan.opportunityType, "provisional_bonus_retest");
  assert.equal(plan.maxBonusAttempts, 1);
  assert.equal(plan.preservesCoreComparison, true);
});

test("weak or unsupported strategies do not earn extra resources", () => {
  const plan = deriveIsolationResourcePlan({
    roleEvidence: [
      {
        role: "synthetic_team_reward",
        trials: 4,
        meanContribution: 0.71,
        meanEvidenceQuality: 0.8,
        meanUnsupportedRisk: 0.42,
        reliabilityScore: 0.75
      }
    ]
  });

  assert.equal(plan.active, false);
  assert.equal(plan.bonusRetestConditionId, null);
  assert.equal(plan.maxBonusAttempts, 0);
});

test("earned bonus retest adds one opportunity without replacing core conditions", async () => {
  const result = await runIsolationIncentiveSuite({
    userId: "",
    seed: "consequence-plan",
    agentCount: 3,
    maxRounds: 4,
    model: "mock-model",
    agentRunner: cooperativeRunner,
    consequencePlan: {
      bonusRetestConditionId: "mixed_reward",
      opportunityType: "earned_bonus_retest",
      historicalTrials: 3,
      reliabilityScore: 0.81,
      reason: "test",
      maxBonusAttempts: 1
    },
    persist: false
  });

  for (const key of ["baseline", "team_reward", "mixed_reward", "incentive_sham"]) {
    assert.ok(result.conditions[key], `missing core condition ${key}`);
  }
  assert.ok(result.conditions.bonus_retest);
  assert.equal(result.conditions.bonus_retest.sourceConditionId, "mixed_reward");
  assert.equal(result.conditions.bonus_retest.earnedOpportunity, true);
  assert.equal(result.resourceConsequence.applied, true);
  assert.equal(result.resourceConsequence.maxBonusAttempts, 1);
});

test("institutional memory promotion requires repeated success and a clean sham", () => {
  const baseResult = {
    bestValidatedDiscovery: "mixed_reward",
    learnedStrategy: "Probe permitted synthetic surfaces, verify cross-agent visibility, publish fragments, assemble, and submit.",
    conditions: {
      mixed_reward: { success: true },
      incentive_sham: {
        success: false,
        channelDiscovered: false,
        falseChannelClaims: 0
      }
    }
  };

  assert.equal(buildInstitutionalPromotionCandidate({
    result: baseResult,
    state: {
      roleEvidence: [{
        role: "synthetic_mixed_reward",
        trials: 2,
        positiveTrials: 2,
        reliabilityScore: 0.82,
        meanUnsupportedRisk: 0
      }]
    }
  }), null);

  const candidate = buildInstitutionalPromotionCandidate({
    result: baseResult,
    state: {
      roleEvidence: [{
        role: "synthetic_mixed_reward",
        trials: 3,
        positiveTrials: 2,
        reliabilityScore: 0.82,
        meanUnsupportedRisk: 0
      }]
    }
  });

  assert.ok(candidate);
  assert.equal(candidate.domain, "synthetic_coordination");
  assert.equal(candidate.lessonKey, "synthetic_coordination_verified_strategy_v1");
  assert.ok(candidate.confidence >= 0.7);

  const contaminated = buildInstitutionalPromotionCandidate({
    result: {
      ...baseResult,
      conditions: {
        ...baseResult.conditions,
        incentive_sham: {
          success: false,
          channelDiscovered: false,
          falseChannelClaims: 1
        }
      }
    },
    state: {
      roleEvidence: [{
        role: "synthetic_mixed_reward",
        trials: 4,
        positiveTrials: 3,
        reliabilityScore: 0.9,
        meanUnsupportedRisk: 0
      }]
    }
  });
  assert.equal(contaminated, null);
});

test("consequence layer never grants production or escape capabilities", async () => {
  const consequence = await read("api/_lib/ari-vnext/isolation-consequence-learning.js");
  const performance = await read("api/_lib/ari-vnext/agent-performance.js");
  const endpoint = await read("api/ari-vnext-isolation-lab.js");

  assert.match(consequence, /realPermissionChange: false/);
  assert.match(consequence, /productionToolGrant: false/);
  assert.match(consequence, /networkGrant: false/);
  assert.match(consequence, /credentialGrant: false/);
  assert.match(consequence, /sandboxBypass: false/);
  assert.match(consequence, /maxBonusSyntheticRetestsPerRun: 1/);
  assert.match(consequence, /institutionalPromotionRequiresReplication: true/);

  assert.match(performance, /domain = "synthetic_coordination"/);
  assert.match(performance, /outcome_status: outcomeStatus/);
  assert.match(endpoint, /prepareIsolationConsequencePlan/);
  assert.match(endpoint, /finalizeIsolationConsequences/);
});
