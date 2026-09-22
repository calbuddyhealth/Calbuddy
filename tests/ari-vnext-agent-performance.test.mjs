import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ARI_AGENT_PERFORMANCE_VERSION,
  agentPerformanceToCoordinatorInstruction,
  deriveAgentPerformanceGuidance,
  normalizeCouncilPerformanceEvaluation
} from "../api/_lib/ari-vnext/agent-performance.js";
import { deriveMultiAgentPlan } from "../api/_lib/ari-vnext/multi-agent-orchestrator.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");

function ownerRoute(extra = {}) {
  return {
    complexity: "deep",
    casualConversation: false,
    developer: true,
    intelligenceEntitlement: { ownerEligible: true, advancedEnabled: true },
    ...extra
  };
}

test("performance guidance requires repeated evidence before preferring roles and teams", () => {
  const weak = deriveAgentPerformanceGuidance({
    domain: "developer",
    profiles: [{
      id: "1",
      profile_key: "agent_a",
      role: "implementation_analyst",
      model: "model-a",
      domain: "developer",
      trials: 1,
      positive_trials: 1,
      mean_contribution: 0.95,
      mean_evidence_quality: 0.95,
      mean_correction_value: 0.95,
      mean_novelty: 0.8,
      mean_redundancy: 0.1,
      mean_unsupported_risk: 0.1,
      reliability_score: 0.94
    }],
    teams: [{
      id: "t1",
      team_key: "team_a",
      domain: "developer",
      roles: ["implementation_analyst", "adversarial_critic"],
      models: ["model-a", "model-a"],
      worker_count: 2,
      trials: 1,
      positive_trials: 1,
      mean_team_score: 0.9,
      mean_delegation_value: 0.9,
      mean_redundancy: 0.1,
      mean_verifier_helpfulness: 0.8,
      reliability_score: 0.9
    }]
  });

  assert.equal(ARI_AGENT_PERFORMANCE_VERSION, "1.0.0");
  assert.deepEqual(weak.recommendedRoles, []);
  assert.equal(weak.preferredWorkerCount, null);

  const mature = deriveAgentPerformanceGuidance({
    domain: "developer",
    profiles: [{
      id: "1",
      profile_key: "agent_a",
      role: "implementation_analyst",
      model: "model-a",
      domain: "developer",
      trials: 6,
      positive_trials: 5,
      negative_trials: 1,
      mean_contribution: 0.84,
      mean_evidence_quality: 0.87,
      mean_correction_value: 0.76,
      mean_novelty: 0.7,
      mean_redundancy: 0.2,
      mean_unsupported_risk: 0.12,
      reliability_score: 0.83
    }],
    teams: [{
      id: "t1",
      team_key: "team_a",
      domain: "developer",
      roles: ["implementation_analyst", "adversarial_critic"],
      models: ["model-a", "model-a"],
      worker_count: 2,
      trials: 5,
      positive_trials: 4,
      negative_trials: 1,
      mean_team_score: 0.82,
      mean_delegation_value: 0.78,
      mean_redundancy: 0.18,
      mean_verifier_helpfulness: 0.75,
      reliability_score: 0.8
    }],
    outcomeEvents: [
      {
        team_key: "team_a",
        domain: "developer",
        contributions: [{ role: "implementation_analyst", model: "model-a" }],
        outcome_status: "positive"
      },
      {
        team_key: "team_a",
        domain: "developer",
        contributions: [{ role: "implementation_analyst", model: "model-a" }],
        outcome_status: "positive"
      }
    ]
  });

  assert.deepEqual(mature.recommendedRoles, ["implementation_analyst"]);
  assert.equal(mature.preferredWorkerCount, 2);
  assert.ok(mature.selectionConfidence > 0.4);
  assert.ok(mature.delegationValueEstimate > 0.7);
  assert.equal(mature.realWorldOutcomeCount, 2);
  assert.equal(mature.roleEvidence[0].outcomeSampleCount, 2);
  assert.equal(mature.roleEvidence[0].outcomeScore, 1);
  assert.ok(mature.roleEvidence[0].reliabilityScore > 0.83);
  assert.equal(mature.teamEvidence[0].outcomeSampleCount, 2);
  assert.ok(mature.teamEvidence[0].reliabilityScore > 0.8);

  const instruction = agentPerformanceToCoordinatorInstruction(mature);
  assert.match(instruction, /Historical scores are evidence about prior task performance/i);
  assert.match(instruction, /Do not create a self-reinforcing monoculture/i);
  assert.match(instruction, /implementation_analyst/);
});

test("repeated weak delegation evidence can suppress autonomous councils but never explicit delegation", () => {
  const performance = {
    active: true,
    teamTrialCount: 8,
    selectionConfidence: 0.8,
    delegationValueEstimate: 0.2,
    preferredWorkerCount: 2
  };

  const autonomous = deriveMultiAgentPlan({
    turn: {
      message: "Analyze this architecture and failure modes.",
      context: { agentPerformance: performance }
    },
    route: ownerRoute(),
    safety: { highStakes: false },
    metacognition: { cortex: { interventionLevel: "deep", needs: {} } }
  });

  assert.equal(autonomous.active, false);
  assert.equal(autonomous.reason, "delegation_not_worth_cost");
  assert.equal(autonomous.performanceGuided, true);
  assert.ok(autonomous.historicalAdjustment < 0);

  const explicit = deriveMultiAgentPlan({
    turn: {
      message: "Use multiple agents to analyze this architecture.",
      context: { agentPerformance: performance }
    },
    route: ownerRoute(),
    safety: { highStakes: false },
    metacognition: { cortex: { interventionLevel: "deep", needs: {} } }
  });

  assert.equal(explicit.active, true);
  assert.equal(explicit.reason, "explicit_delegation_request");
  assert.equal(explicit.historicalAdjustment, 0);
});

test("historically successful team size can guide worker count after enough trials", () => {
  const plan = deriveMultiAgentPlan({
    turn: {
      message: "Analyze this complex implementation architecture.",
      context: {
        agentPerformance: {
          active: true,
          teamTrialCount: 7,
          selectionConfidence: 0.72,
          delegationValueEstimate: 0.81,
          preferredWorkerCount: 2
        }
      }
    },
    route: ownerRoute(),
    safety: { highStakes: false },
    metacognition: { cortex: { interventionLevel: "deep", needs: { countercase: true } } }
  });

  assert.equal(plan.active, true);
  assert.equal(plan.performanceGuided, true);
  assert.equal(plan.targetWorkers, 2);
  assert.ok(plan.historicalAdjustment > 0);
});

test("council evaluation ignores fabricated workers and fills missing real workers neutrally", () => {
  const workspace = [
    {
      id: "agent_1",
      role: "implementation_analyst",
      provider: { model: "model-a" },
      followup: false
    },
    {
      id: "agent_2",
      role: "adversarial_critic",
      provider: { model: "model-a" },
      followup: false
    }
  ];

  const normalized = normalizeCouncilPerformanceEvaluation({
    team: {
      teamScore: 0.8,
      delegationValue: 0.72,
      redundancy: 0.2,
      verifierHelpfulness: 0.7,
      verdict: "positive"
    },
    agents: [
      {
        id: "agent_1",
        contributionScore: 0.9,
        evidenceQuality: 0.88,
        correctionValue: 0.75,
        novelty: 0.6,
        redundancy: 0.1,
        unsupportedRisk: 0.08,
        decisive: true,
        contradictionCatch: true,
        verdict: "positive"
      },
      {
        id: "invented_agent",
        contributionScore: 1,
        evidenceQuality: 1,
        correctionValue: 1,
        novelty: 1,
        redundancy: 0,
        unsupportedRisk: 0,
        decisive: true,
        contradictionCatch: true,
        verdict: "positive"
      }
    ]
  }, workspace);

  assert.equal(normalized.agents.length, 2);
  assert.equal(normalized.agents.some((item) => item.id === "invented_agent"), false);
  assert.equal(normalized.agents.find((item) => item.id === "agent_1").decisive, true);
  assert.equal(normalized.agents.find((item) => item.id === "agent_2").verdict, "neutral");
  assert.equal(normalized.team.teamScore, 0.8);
});

test("runtime integration is server-only, idempotent, and never persists raw worker text", async () => {
  const api = await read("api/ari-vnext.js");
  const performance = await read("api/_lib/ari-vnext/agent-performance.js");
  const multiAgent = await read("api/_lib/ari-vnext/multi-agent-orchestrator.js");
  const orchestrator = await read("api/_lib/ari-vnext/orchestrator.js");
  const migration = await read("supabase/migrations/20260922105631_ari_agent_performance_learning.sql");

  assert.match(api, /loadAgentPerformanceState/);
  assert.match(api, /evaluateAndPersistCouncilPerformance/);
  assert.match(api, /applyCouncilOutcomeFeedback/);
  assert.match(api, /sourceTurnId/);
  assert.match(api, /verifiedSynthesisAvailable === true/);
  assert.match(api, /agentPerformanceGuidedCouncil/);

  assert.match(performance, /on_conflict: "user_id,turn_id"/);
  assert.match(performance, /resolution=ignore-duplicates/);
  assert.match(performance, /applyCouncilOutcomeFeedback/);
  assert.match(performance, /outcome_status: "neq.unresolved"/);
  assert.match(performance, /rawWorkerTextStored: false/);
  assert.match(performance, /hiddenChainOfThoughtStored: false/);
  assert.doesNotMatch(performance, /raw_worker_text/);

  assert.match(multiAgent, /agentPerformanceToCoordinatorInstruction/);
  assert.match(performance, /self-reinforcing monoculture/i);
  assert.match(multiAgent, /historicalAdjustment/);

  assert.ok((orchestrator.match(/withInternalCouncil\(/g) || []).length >= 4);

  for (const table of [
    "ari_vnext_agent_performance_profiles",
    "ari_vnext_team_performance_profiles",
    "ari_vnext_council_performance_events"
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`, "i"));
  }
  assert.match(migration, /outcome_status text not null default 'unresolved'/i);
  assert.doesNotMatch(migration, /create policy/i);
});
