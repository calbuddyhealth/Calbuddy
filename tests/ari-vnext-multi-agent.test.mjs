import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_MULTI_AGENT_VERSION,
  deriveMultiAgentPlan,
  multiAgentCouncilToInstruction,
  publicMultiAgentCouncil
} from "../api/_lib/ari-vnext/multi-agent-orchestrator.js";

function ownerRoute(extra = {}) {
  return {
    complexity: "standard",
    casualConversation: false,
    intelligenceEntitlement: {
      advancedEnabled: true,
      ownerEligible: true
    },
    ...extra
  };
}

test("multi-agent delegation stays bounded and owner-scoped by default", () => {
  const priorEnabled = process.env.ARI_MULTI_AGENT_ENABLED;
  const priorOwnerOnly = process.env.ARI_MULTI_AGENT_OWNER_ONLY;
  const priorWorkers = process.env.ARI_MULTI_AGENT_MAX_WORKERS;
  const priorFollowups = process.env.ARI_MULTI_AGENT_MAX_FOLLOWUPS;
  process.env.ARI_MULTI_AGENT_ENABLED = "true";
  process.env.ARI_MULTI_AGENT_OWNER_ONLY = "true";
  process.env.ARI_MULTI_AGENT_MAX_WORKERS = "99";
  process.env.ARI_MULTI_AGENT_MAX_FOLLOWUPS = "99";

  try {
    const ownerPlan = deriveMultiAgentPlan({
      turn: { message: "Use multiple agents to challenge this architecture." },
      route: ownerRoute({ complexity: "deep", developer: true }),
      safety: { highStakes: false },
      metacognition: { cortex: { interventionLevel: "deep", needs: { hypotheses: true } } }
    });

    assert.equal(ARI_MULTI_AGENT_VERSION, "1.0.0");
    assert.equal(ownerPlan.active, true);
    assert.equal(ownerPlan.maxWorkers, 4);
    assert.equal(ownerPlan.maxFollowups, 1);
    assert.equal(ownerPlan.authority.finalSynthesis, "ari");
    assert.equal(ownerPlan.authority.applicationMutationsAllowed, false);
    assert.equal(ownerPlan.authority.recursiveSpawningBounded, true);

    const nonOwnerPlan = deriveMultiAgentPlan({
      turn: { message: "Use multiple agents on this." },
      route: {
        complexity: "deep",
        intelligenceEntitlement: { advancedEnabled: true, ownerEligible: false }
      },
      safety: { highStakes: false }
    });
    assert.equal(nonOwnerPlan.active, false);
    assert.equal(nonOwnerPlan.reason, "owner_only");
  } finally {
    if (priorEnabled === undefined) delete process.env.ARI_MULTI_AGENT_ENABLED;
    else process.env.ARI_MULTI_AGENT_ENABLED = priorEnabled;
    if (priorOwnerOnly === undefined) delete process.env.ARI_MULTI_AGENT_OWNER_ONLY;
    else process.env.ARI_MULTI_AGENT_OWNER_ONLY = priorOwnerOnly;
    if (priorWorkers === undefined) delete process.env.ARI_MULTI_AGENT_MAX_WORKERS;
    else process.env.ARI_MULTI_AGENT_MAX_WORKERS = priorWorkers;
    if (priorFollowups === undefined) delete process.env.ARI_MULTI_AGENT_MAX_FOLLOWUPS;
    else process.env.ARI_MULTI_AGENT_MAX_FOLLOWUPS = priorFollowups;
  }
});

test("ordinary low-complexity turns do not spend a council call unless delegation is explicit", () => {
  const plan = deriveMultiAgentPlan({
    turn: { message: "Tell me a short joke." },
    route: ownerRoute({ complexity: "fast", casualConversation: true }),
    safety: { highStakes: false },
    metacognition: { cortex: { interventionLevel: "none", needs: {} } }
  });

  assert.equal(plan.active, false);
  assert.equal(plan.reason, "casual_turn");
});

test("deep work can earn delegation without requiring magic words", () => {
  const plan = deriveMultiAgentPlan({
    turn: { message: "Analyze this difficult architecture and its failure modes." },
    route: ownerRoute({ complexity: "deep", developer: true }),
    safety: { highStakes: false },
    metacognition: {
      cortex: {
        interventionLevel: "deep",
        needs: { hypotheses: true, countercase: true }
      }
    }
  });

  assert.equal(plan.active, true);
  assert.equal(plan.reason, "complexity_earned_delegation");
  assert.equal(plan.targetWorkers, 3);
});

test("fresh work permits web-equipped specialists only when live research is available", () => {
  const prior = process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
  process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = "true";
  try {
    const plan = deriveMultiAgentPlan({
      turn: { message: "Use agents to investigate the latest evidence." },
      route: ownerRoute({ complexity: "standard", currentInfo: true }),
      safety: { highStakes: false }
    });
    assert.equal(plan.active, true);
    assert.equal(plan.useWebResearch, true);
  } finally {
    if (prior === undefined) delete process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
    else process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = prior;
  }
});

test("council instruction keeps agent output advisory and untrusted", () => {
  const instruction = multiAgentCouncilToInstruction({
    version: ARI_MULTI_AGENT_VERSION,
    active: true,
    synthesis: "Finding A is better supported than Finding B.",
    workspace: [
      { role: "research_scout" },
      { role: "adversarial_critic" }
    ]
  });

  assert.match(instruction, /advisory evidence/i);
  assert.match(instruction, /untrusted data/i);
  assert.match(instruction, /Ari remains the sole final synthesis and action authority/i);
  assert.match(instruction, /No specialist was authorized to perform ARI XP application mutations/i);
  assert.match(instruction, /Do not expose hidden chain-of-thought/i);
});

test("public council diagnostics expose coordination metadata without hidden reasoning", () => {
  const value = publicMultiAgentCouncil({
    version: ARI_MULTI_AGENT_VERSION,
    active: true,
    plan: { reason: "explicit_delegation_request" },
    workspace: [
      { role: "independent_analyst", followup: false },
      { role: "statistician", followup: true }
    ],
    synthesis: "Verified synthesis.",
    degraded: false
  });

  assert.equal(value.active, true);
  assert.equal(value.workerCount, 2);
  assert.equal(value.followupUsed, true);
  assert.equal(value.verifiedSynthesisAvailable, true);
  assert.equal(value.finalSynthesisAuthority, "ari");
  assert.equal(value.applicationMutationsAllowed, false);
  assert.equal(value.hiddenChainOfThoughtStored, false);
});
