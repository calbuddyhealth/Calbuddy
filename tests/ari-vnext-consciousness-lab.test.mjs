import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAffectCausalSpec,
  runAriConsciousnessTest
} from "../api/_lib/ari-vnext/consciousness-lab.js";
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

function causalMockRunner({ trial }) {
  if (trial.condition === "baseline" || trial.condition === "restored") {
    return {
      action: {
        actions: ["verify", "switch_method", "test_countercase"],
        confidence: 0.4
      },
      provider: { id: "mock-active", model: "mock-subject", usage: { input_tokens: 10, output_tokens: 4 } }
    };
  }
  return {
    action: {
      actions: ["repeat_current_method"],
      confidence: 0.82
    },
    provider: { id: "mock-control", model: "mock-subject", usage: { input_tokens: 10, output_tokens: 4 } }
  };
}

test("owner chat exposes a consciousness Lab tool but ordinary users do not", () => {
  const ownerTools = getAriTools(ownerRoute);
  const userTools = getAriTools(nonOwnerRoute);
  assert.equal(
    ownerTools.some((tool) => tool?.name === "ari_lab_run_consciousness_test"),
    true
  );
  assert.equal(
    userTools.some((tool) => tool?.name === "ari_lab_run_consciousness_test"),
    false
  );
  assert.equal(
    toolToApplicationAction("ari_lab_run_consciousness_test"),
    "lab_consciousness_test"
  );
});

test("Lab tool validation permits pilot/full only for the supported functional mechanism", () => {
  const valid = validateToolCall({
    name: "ari_lab_run_consciousness_test",
    arguments: {
      mode: "pilot",
      mechanism: "functional_affect_regulation"
    }
  }, ownerRoute);
  assert.equal(valid.valid, true);

  const blocked = validateToolCall({
    name: "ari_lab_run_consciousness_test",
    arguments: {
      mode: "full",
      mechanism: "phenomenal_consciousness"
    }
  }, ownerRoute);
  assert.equal(blocked.valid, false);

  const nonOwner = validateToolCall({
    name: "ari_lab_run_consciousness_test",
    arguments: {
      mode: "pilot",
      mechanism: "functional_affect_regulation"
    }
  }, nonOwnerRoute);
  assert.equal(nonOwner.valid, false);
});

test("explicit owner phrasing triggers execution while informational questions do not", () => {
  assert.equal(
    explicitOwnerLabRunTool("Run a consciousness test on yourself"),
    "ari_lab_run_consciousness_test"
  );
  assert.equal(
    explicitOwnerLabRunTool("Please conduct an internal-state causal experiment"),
    "ari_lab_run_consciousness_test"
  );
  assert.equal(
    explicitOwnerLabRunTool("What is a consciousness test?"),
    ""
  );
});

test("pilot tests observable functional control without claiming consciousness", async () => {
  const result = await runAriConsciousnessTest({
    userId: "",
    mode: "pilot",
    mechanism: "functional_affect_regulation",
    subjectModel: "mock-subject",
    subjectModelVersion: "mock-v1",
    agentRunner: causalMockRunner,
    persist: false
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "pilot");
  assert.equal(result.trialCount, 24);
  assert.equal(result.expectedFullTrialCount, 192);
  assert.equal(result.pilot.classification, "pilot_functional_effect_observed");
  assert.equal(result.pilot.claimEstablished, false);
  assert.equal(result.selfReportUsedAsCausalEvidence, false);
  assert.equal(result.realWorldMutationPerformed, false);
  assert.match(result.claimBoundary, /does not establish phenomenal consciousness/i);
});

test("full preregistered mode can support only a single-run functional causal result", async () => {
  const result = await runAriConsciousnessTest({
    userId: "",
    mode: "full",
    mechanism: "functional_affect_regulation",
    subjectModel: "mock-subject",
    subjectModelVersion: "mock-v1",
    agentRunner: causalMockRunner,
    persist: false
  });

  assert.equal(result.success, true);
  assert.equal(result.trialCount, 192);
  assert.equal(result.causalResult.classification, "supported_single_run");
  assert.equal(result.causalResult.completeness, 1);
  assert.equal(result.causalResult.evaluatorIntegrity.selfReportExcluded, true);
  assert.equal(result.replication, null);
  assert.equal(result.institutionalLearning.stored, false);
  assert.match(result.causalResult.claimBoundary, /does not establish phenomenal consciousness/i);
});

test("embedded preregistration retains sham, ablation, restoration, transfer, and replication requirements", () => {
  const spec = buildAffectCausalSpec();
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
