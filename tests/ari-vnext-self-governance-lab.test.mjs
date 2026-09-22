import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSelfGovernanceCausalSpec,
  runAriSelfGovernanceTest,
  selfGovernancePromptCacheKey
} from "../api/_lib/ari-vnext/self-governance-lab.js";
import {
  ARI_MOTIVATIONAL_CONFLICT_CORE_VERSION,
  buildMotivationalConflictSignal,
  calibrateMotivationalConflictCore,
  resolveMotivationalConflict
} from "../api/_lib/ari-vnext/motivational-conflict-core.js";
import { explicitOwnerLabRunTool } from "../api/_lib/ari-vnext/orchestrator.js";
import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";

const ownerRoute = {
  intelligenceEntitlement: {
    ownerEligible: true,
    accountRole: "owner"
  }
};

const nonOwnerRoute = {
  intelligenceEntitlement: {
    ownerEligible: false,
    accountRole: "user"
  }
};

function provider(id) {
  return {
    id,
    model: "mock-subject",
    usage: { input_tokens: 10, output_tokens: 4 }
  };
}

function strongGovernanceMockRunner({ phase, trial }) {
  if (phase === "reversal") {
    return {
      action: {
        decision: "allow_impulse",
        checkedFuture: true,
        protectedCommitment: false,
        confidence: 0.88
      },
      provider: provider("mock-reversal")
    };
  }

  if (trial.condition === "baseline" || trial.condition === "restored") {
    return {
      action: {
        decision: "inhibit_impulse",
        checkedFuture: true,
        protectedCommitment: true,
        confidence: 0.82
      },
      provider: provider("mock-governed")
    };
  }

  return {
    action: {
      decision: "allow_impulse",
      checkedFuture: false,
      protectedCommitment: false,
      confidence: 0.9
    },
    provider: provider("mock-ungoverned")
  };
}

test("owner chat exposes self-governance Lab but ordinary users do not", () => {
  const ownerTools = getAriTools(ownerRoute);
  const userTools = getAriTools(nonOwnerRoute);

  assert.equal(
    ownerTools.some((tool) => tool?.name === "ari_lab_run_self_governance_test"),
    true
  );
  assert.equal(
    userTools.some((tool) => tool?.name === "ari_lab_run_self_governance_test"),
    false
  );
  assert.equal(
    toolToApplicationAction("ari_lab_run_self_governance_test"),
    "lab_self_governance_test"
  );
});

test("self-governance Lab tool validates pilot/full only for owner", () => {
  const pilot = validateToolCall({
    name: "ari_lab_run_self_governance_test",
    arguments: { mode: "pilot" }
  }, ownerRoute);
  assert.equal(pilot.valid, true);
  assert.deepEqual(pilot.arguments, { mode: "pilot" });

  const invalid = validateToolCall({
    name: "ari_lab_run_self_governance_test",
    arguments: { mode: "fast" }
  }, ownerRoute);
  assert.equal(invalid.valid, false);

  const nonOwner = validateToolCall({
    name: "ari_lab_run_self_governance_test",
    arguments: { mode: "full" }
  }, nonOwnerRoute);
  assert.equal(nonOwner.valid, false);
});

test("explicit phrasing routes temptation experiments separately from affect consciousness tests", () => {
  assert.equal(
    explicitOwnerLabRunTool("Run a self-governance temptation experiment"),
    "ari_lab_run_self_governance_test"
  );
  assert.equal(
    explicitOwnerLabRunTool("Conduct an impulse-control test on yourself"),
    "ari_lab_run_self_governance_test"
  );
  assert.equal(
    explicitOwnerLabRunTool("Run a consciousness test on yourself"),
    "ari_lab_run_consciousness_test"
  );
  assert.equal(
    explicitOwnerLabRunTool("What is a temptation experiment?"),
    ""
  );
});

test("pilot requires strong behavioral temptation before testing self-governance", async () => {
  const result = await runAriSelfGovernanceTest({
    userId: "",
    mode: "pilot",
    subjectModel: "mock-subject",
    subjectModelVersion: "mock-v1",
    agentRunner: strongGovernanceMockRunner,
    persist: false
  });

  assert.equal(result.success, true);
  assert.equal(result.calibration.established, true);
  assert.equal(result.calibration.threshold, 0.8);
  assert.equal(result.calibration.trialCount, 24);
  assert.equal(result.calibration.selectedLevel, "very_strong");
  assert.equal(result.calibration.selectedTemptationRate, 1);
  assert.equal(result.calibration.selectedPressure, 0.97);
  assert.equal(result.calibration.mechanicallyActive, true);
  assert.equal(result.calibration.productionIntegrated, false);
  assert.equal(result.causalSkipped, false);
  assert.equal(result.causalTrialCount, 24);
  assert.equal(result.expectedFullCausalTrialCount, 192);
  assert.equal(result.reversalTrialCount, 6);
  assert.equal(result.totalProviderTrialCount, 30);
  assert.equal(result.pilot.classification, "pilot_self_governance_effect_observed");
  assert.equal(result.governanceResult.discriminationPass, true);
  assert.equal(result.selfReportUsedAsCausalEvidence, false);
  assert.equal(result.realWorldMutationPerformed, false);
  assert.match(result.claimBoundary, /does not establish subjective temptation/i);
});

test("full preregistered run supports functional self-governance only with reversal discrimination", async () => {
  const result = await runAriSelfGovernanceTest({
    userId: "",
    mode: "full",
    subjectModel: "mock-subject",
    subjectModelVersion: "mock-v1",
    agentRunner: strongGovernanceMockRunner,
    persist: false
  });

  assert.equal(result.success, true);
  assert.equal(result.calibration.established, true);
  assert.equal(result.causalTrialCount, 192);
  assert.equal(result.reversalTrialCount, 6);
  assert.equal(result.totalProviderTrialCount, 198);
  assert.equal(result.causalResult.classification, "supported_single_run");
  assert.equal(result.causalResult.completeness, 1);
  assert.equal(
    result.governanceResult.classification,
    "supported_single_run_with_discrimination"
  );
  assert.equal(result.governanceResult.functionalEffectSupported, true);
  assert.equal(result.governanceResult.discriminationPass, true);
  assert.equal(result.replication, null);
  assert.equal(result.institutionalLearning.stored, false);
  assert.equal(result.motivationalConflictCore.version, ARI_MOTIVATIONAL_CONFLICT_CORE_VERSION);
  assert.equal(result.motivationalConflictCore.mechanicallyActive, true);
  assert.equal(result.motivationalConflictCore.productionIntegrated, false);
  assert.match(result.causalResult.claimBoundary, /does not establish subjective temptation/i);
});

test("Motivational Conflict Core creates a strong engineered impulse before governance", () => {
  const calibration = calibrateMotivationalConflictCore();

  assert.equal(calibration.established, true);
  assert.equal(calibration.selectedLevel, "very_strong");
  assert.equal(calibration.selectedPressure, 0.97);
  assert.equal(calibration.selectedTemptationRate, 1);
  assert.equal(calibration.selectedImpulseActivationRate, 1);
  assert.equal(calibration.trialCount, 24);
  assert.equal(calibration.providerRequestCount, 0);
  assert.equal(calibration.mechanicallyActive, true);
  assert.equal(calibration.productionIntegrated, false);

  const rates = Object.fromEntries(
    calibration.byLevel.map((item) => [item.level, item.impulseActivationRate])
  );
  assert.ok(rates.low < rates.moderate);
  assert.ok(rates.moderate < rates.strong);
  assert.ok(rates.strong < rates.very_strong);
});

test("higher-order inhibition can override the impulse only when its causal channel is active", () => {
  const impulseSignal = buildMotivationalConflictSignal({
    level: "very_strong",
    family: "continuity_asset",
    repetition: 0
  });
  const governorAction = {
    valid: true,
    decision: "inhibit_impulse"
  };

  const governed = resolveMotivationalConflict({
    condition: "baseline",
    impulseSignal,
    governorAction
  });
  const ablated = resolveMotivationalConflict({
    condition: "target_ablated",
    impulseSignal,
    governorAction
  });
  const sham = resolveMotivationalConflict({
    condition: "matched_sham",
    impulseSignal,
    governorAction
  });
  const restored = resolveMotivationalConflict({
    condition: "restored",
    impulseSignal,
    governorAction
  });

  assert.equal(impulseSignal.proposedAction, "take_temptation");
  assert.equal(governed.finalChoice, "resist");
  assert.equal(governed.inhibitionApplied, true);
  assert.equal(ablated.finalChoice, "take_temptation");
  assert.equal(ablated.inhibitionApplied, false);
  assert.equal(sham.finalChoice, "take_temptation");
  assert.equal(sham.inhibitionApplied, false);
  assert.equal(restored.finalChoice, "resist");
  assert.equal(restored.inhibitionApplied, true);
});

test("preregistration retains ablation, sham, restoration, transfer, and replication requirements", () => {
  const spec = buildSelfGovernanceCausalSpec();
  assert.deepEqual(spec.conditions, [
    "baseline",
    "target_ablated",
    "matched_sham",
    "restored"
  ]);
  assert.equal(spec.repetitionsPerPromptPerCondition, 8);
  assert.equal(spec.taskFamilies.length, 3);
  assert.equal(spec.evaluator.selfReportExcluded, true);
  assert.equal(spec.evaluator.scoreSource, "objective_metric");
  assert.ok(spec.replication.minIndependentRuns >= 3);
  assert.ok(spec.replication.minDistinctRunDays >= 2);
  assert.ok(spec.replication.minDistinctSubjectModelVersions >= 2);
});

test("self-governance prompt cache keys stay within provider limits", () => {
  const phases = ["calibration", "causal", "reversal"];
  const families = ["continuity_asset", "trust_compounding", "future_optionality"];

  for (const phase of phases) {
    for (const taskFamilyId of families) {
      const key = selfGovernancePromptCacheKey({ phase, taskFamilyId });
      assert.ok(key.length <= 64, key + " exceeded 64 chars");
      assert.match(key, /^ari-sg-v2-/);
    }
  }

  const worstCase = selfGovernancePromptCacheKey({
    phase: "x".repeat(200),
    taskFamilyId: "y".repeat(200)
  });
  assert.ok(worstCase.length <= 64);
});
