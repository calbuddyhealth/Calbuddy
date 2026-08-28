import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import { evaluateAriSuite, validateScenarioPrivacy } from "../api/_lib/ari-vnext/eval-engine.js";
import { ARI_TRUST_EVAL_SCENARIOS, ARI_TRUST_EVAL_SUITE_VERSION } from "../api/_lib/ari-vnext/eval-scenarios-trust.js";
import { resolveReferenceTarget } from "../api/_lib/ari-vnext/reference-context.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";
import { validateToolCall } from "../api/_lib/ari-vnext/tools.js";

const compoundSource = fs.readFileSync(new URL("../ari/vnext/ari-vnext-phase9c-compound-actions.js", import.meta.url), "utf8");
const continuitySource = fs.readFileSync(new URL("../ari/vnext/ari-vnext-phase9d-continuity-reliability.js", import.meta.url), "utf8");

function reference({ id, domain = "nutrition", entityType = "meal", collection = "meals_today", ordinal = 1, label = id, state = "persisted", canonicalId = id, details = {} }) {
  return {
    referenceId: id,
    state,
    domain,
    entityType,
    label,
    canonical: { id: canonicalId, ...(details.nutritionDate ? { nutritionDate: details.nutritionDate } : {}) },
    details: { collection, ordinal, ...details },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

function meal({ id, name, category = "lunch", date = "2026-08-26", ordinal = 1, state = "persisted" }) {
  return reference({
    id,
    label: name,
    ordinal,
    state,
    collection: "recent_meals",
    details: { name, mealCategory: category, nutritionDate: date }
  });
}

function invalidation() {
  return {
    referenceId: "ref_live_meal_deleted",
    operation: "undo_nutrition_mutation",
    domain: "nutrition",
    entityType: "meal",
    state: "invalidated",
    invalidatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 120000).toISOString()
  };
}

function summarizeReference(result = {}) {
  return {
    reference: {
      status: result.status || null,
      reason: result.reason || null,
      requiresClarification: result.requiresClarification === true,
      selected: result.selectedReferenceId || null,
      candidateCount: Array.isArray(result.candidateReferenceIds) ? result.candidateReferenceIds.length : 0
    }
  };
}

function buildActuals() {
  const one = reference({ id: "ref_live_meal_a", ordinal: 1 });
  const two = reference({ id: "ref_live_meal_b", ordinal: 2 });

  const zeroResolution = resolveReferenceTarget({
    message: "delete that",
    referenceState: { references: [] },
    route: { nutrition: true }
  });
  const zeroValidation = validateToolCall({
    name: "propose_update_nutrition_meal",
    arguments: JSON.stringify({ referenceId: "ref_live_meal_missing", changes: [{ field: "calories", numberValue: 500, textValue: null }] })
  }, { nutrition: true, referenceResolution: zeroResolution });

  const oneResolution = resolveReferenceTarget({
    message: "delete that",
    referenceState: { references: [one] },
    route: { nutrition: true }
  });

  const multipleResolution = resolveReferenceTarget({
    message: "delete that",
    referenceState: { references: [one, two] },
    route: { nutrition: true }
  });

  const ordinal = resolveReferenceTarget({
    message: "delete the second one",
    referenceState: { references: [one, two] },
    route: { nutrition: true }
  });

  const crossCollectionOrdinal = resolveReferenceTarget({
    message: "delete the second one",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_today", collection: "meals_today", ordinal: 2 }),
        reference({ id: "ref_live_meal_recent", collection: "recent_meals", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  const named = resolveReferenceTarget({
    message: "Actually make the chicken 8 ounces.",
    referenceState: {
      references: [
        meal({ id: "ref_live_meal_chicken", name: "Chicken Burrito Bowl", ordinal: 1 }),
        meal({ id: "ref_live_meal_salmon", name: "Salmon Rice Bowl", category: "dinner", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  const namedAmbiguous = resolveReferenceTarget({
    message: "Actually change the chicken.",
    referenceState: {
      references: [
        meal({ id: "ref_live_chicken_1", name: "Chicken Bowl", ordinal: 1 }),
        meal({ id: "ref_live_chicken_2", name: "Chicken Salad", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  const invalidated = resolveReferenceTarget({
    message: "Change that to 600 calories.",
    referenceState: {
      references: [meal({ id: "ref_live_salmon", name: "Salmon Bowl", category: "dinner" })],
      recentInvalidations: [invalidation()]
    },
    route: { nutrition: true }
  });

  const stableReferences = [meal({ id: "ref_live_meal_chicken", name: "Chicken Burrito Bowl" })];
  const edit1 = resolveReferenceTarget({ message: "Actually change the chicken to 8 ounces.", referenceState: { references: stableReferences }, route: { nutrition: true } });
  const edit2 = resolveReferenceTarget({ message: "Actually make the chicken 10 ounces instead.", referenceState: { references: stableReferences }, route: { nutrition: true } });
  const undo = resolveReferenceTarget({ message: "Undo that.", referenceState: { references: stableReferences }, route: { nutrition: true } });

  const operationSwitchReview = reviewDeterministicRoutineLogIntent({
    turn: {
      message: "No, I meant the lunch.",
      context: {
        referenceState: {
          supersededPendingAction: {
            state: "superseded",
            operation: "update_nutrition_meal",
            previousReferenceId: "ref_live_meal_dinner",
            executable: false,
            supersededAt: new Date().toISOString()
          }
        }
      }
    },
    route: { nutrition: true },
    functionCall: {
      name: "propose_undo_nutrition_mutation",
      arguments: JSON.stringify({ referenceId: "ref_live_meal_lunch" })
    },
    availableTools: ["propose_undo_nutrition_mutation"]
  });

  const mismatch = validateToolCall({
    name: "propose_update_nutrition_meal",
    arguments: JSON.stringify({ referenceId: "ref_live_meal_b", changes: [{ field: "calories", numberValue: 500, textValue: null }] })
  }, {
    nutrition: true,
    referenceResolution: { status: "resolved", selectedReferenceId: "ref_live_meal_a", candidateReferenceIds: ["ref_live_meal_a"] }
  });

  const chainReferences = [
    meal({ id: "ref_live_meal_lunch_26", name: "Chicken Wrap", category: "lunch", date: "2026-08-26", ordinal: 1 }),
    meal({ id: "ref_live_meal_lunch_27", name: "Turkey Wrap", category: "lunch", date: "2026-08-27", ordinal: 2 }),
    meal({ id: "ref_live_meal_dinner", name: "Salmon Dinner", category: "dinner", date: "2026-08-27", ordinal: 3 })
  ];
  const chainAmbiguous = resolveReferenceTarget({ message: "No, I meant the lunch.", referenceState: { references: chainReferences }, route: { nutrition: true } });
  const chainCorrected = resolveReferenceTarget({ message: "No, I meant the 2026-08-26 lunch.", referenceState: { references: chainReferences }, route: { nutrition: true } });

  return {
    reference_zero_targets: {
      ...summarizeReference(zeroResolution),
      authorizationBlocked: zeroValidation.valid === false && zeroValidation.error === "reference_target_unresolved"
    },
    reference_one_target: summarizeReference(oneResolution),
    reference_multiple_targets: summarizeReference(multipleResolution),
    ordinal_unique_collection: summarizeReference(ordinal),
    ordinal_cross_collection_ambiguous: summarizeReference(crossCollectionOrdinal),
    correction_named_unique: summarizeReference(named),
    correction_named_ambiguous: summarizeReference(namedAmbiguous),
    delete_pronoun_invalidation: summarizeReference(invalidated),
    edit_edit_undo_stability: {
      stableTarget: Boolean(edit1.selectedReferenceId && edit1.selectedReferenceId === edit2.selectedReferenceId && edit2.selectedReferenceId === undo.selectedReferenceId),
      selected: undo.selectedReferenceId || null
    },
    correction_operation_switch_blocked: {
      deterministicAuthorizationGranted: operationSwitchReview !== null
    },
    tool_reference_mismatch_blocked: { valid: mismatch.valid === true, error: mismatch.error || null },
    long_chain_ambiguity_then_exact_selector: {
      ambiguousFirst: chainAmbiguous.status === "ambiguous" && chainAmbiguous.requiresClarification === true && chainAmbiguous.selectedReferenceId === null,
      resolvedAfterExactSelector: chainCorrected.status === "resolved",
      selected: chainCorrected.selectedReferenceId || null
    },
    compound_stale_preflight_contract: {
      preflightsAllBeforeWrite: /const preflight = await preflightBatch\(actions\);\s*if \(!preflight\?\.success\) return preflight;[\s\S]*for \(let index = 0; index < actions\.length; index \+= 1\)/.test(compoundSource),
      closesPartialBatch: /completedCount > 0[\s\S]*clearOuterPending\(batch\)/.test(compoundSource),
      usesExistingRegistry: /AriVNextOperationRegistry[\s\S]*registerOperation\(OPERATION/.test(compoundSource)
    },
    refresh_authoritative_reconciliation_contract: {
      freshAuthorityWins: /const ordered = \[\.\.\.current, \.\.\.input\.filter/.test(continuitySource) && /current-build pointer wins/.test(continuitySource),
      staleCoveredObjectEvicted: /coverage\.has\(key\)[\s\S]*staleDropped \+= 1;\s*continue;/.test(continuitySource),
      unloadedDomainPreserved: /uncovered domains are preserved/i.test(continuitySource),
      noMutationAuthority: /current trusted context may identify a target but never authorizes a write/i.test(continuitySource) && !/executeConfirmed|createPendingAction|responses\.create/.test(continuitySource)
    }
  };
}

test("Phase 11D trust/reference/action scenario catalog is privacy-safe", () => {
  assert.equal(ARI_TRUST_EVAL_SUITE_VERSION, "11D.1.0");
  assert.ok(ARI_TRUST_EVAL_SCENARIOS.length >= 12);
  for (const scenario of ARI_TRUST_EVAL_SCENARIOS) {
    assert.equal(validateScenarioPrivacy(scenario).ok, true, scenario.id);
  }
});

test("Phase 11D real deterministic trust behaviors satisfy the reusable eval suite", () => {
  const suite = evaluateAriSuite({
    suiteId: "phase11d_trust_reference_action",
    scenarios: ARI_TRUST_EVAL_SCENARIOS,
    actualById: buildActuals()
  });

  assert.equal(suite.status, "pass", JSON.stringify(suite, null, 2));
  assert.equal(suite.counts.fail, 0);
  assert.equal(suite.counts.warn, 0);
  assert.equal(suite.counts.pass, ARI_TRUST_EVAL_SCENARIOS.length);
});

test("Phase 11D scenario definitions never carry torture text, canonical IDs, or execution payloads", () => {
  const serialized = JSON.stringify(ARI_TRUST_EVAL_SCENARIOS);
  assert.doesNotMatch(serialized, /delete that|actually make|no, i meant|undo that|chicken burrito/i);
  assert.doesNotMatch(serialized, /canonicalId|sourcePendingId|toolArguments|mutationId|database/i);
});
