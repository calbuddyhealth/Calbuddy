// ARI vNext — Phase 11D trust/reference/action scenario catalog.
// Definitions contain only safe expected decision codes and counters. Natural-language
// torture inputs live in the offline test runner and are never part of this catalog.

import { defineAriEvalScenario, expectation } from "./eval-engine.js";

export const ARI_TRUST_EVAL_SUITE_VERSION = "11D.1.0";

export const ARI_TRUST_EVAL_SCENARIOS = Object.freeze([
  scenario("reference_zero_targets", [
    expectation("reference.status", "exact", "context_only"),
    expectation("reference.selected", "exact", null),
    expectation("authorizationBlocked", "exact", true)
  ]),
  scenario("reference_one_target", [
    expectation("reference.status", "exact", "resolved"),
    expectation("reference.requiresClarification", "exact", false),
    expectation("reference.selected", "exact", "ref_live_meal_a")
  ]),
  scenario("reference_multiple_targets", [
    expectation("reference.status", "exact", "ambiguous"),
    expectation("reference.requiresClarification", "exact", true),
    expectation("reference.selected", "exact", null),
    expectation("reference.candidateCount", "exact", 2)
  ]),
  scenario("ordinal_unique_collection", [
    expectation("reference.status", "exact", "resolved"),
    expectation("reference.reason", "exact", "unique_authoritative_ordinal"),
    expectation("reference.selected", "exact", "ref_live_meal_b")
  ]),
  scenario("ordinal_cross_collection_ambiguous", [
    expectation("reference.status", "exact", "ambiguous"),
    expectation("reference.reason", "exact", "ordinal_matches_multiple_collections"),
    expectation("reference.requiresClarification", "exact", true)
  ]),
  scenario("correction_named_unique", [
    expectation("reference.status", "exact", "resolved"),
    expectation("reference.reason", "exact", "unique_authoritative_named_target"),
    expectation("reference.selected", "exact", "ref_live_meal_chicken")
  ]),
  scenario("correction_named_ambiguous", [
    expectation("reference.status", "exact", "ambiguous"),
    expectation("reference.requiresClarification", "exact", true),
    expectation("reference.selected", "exact", null)
  ]),
  scenario("delete_pronoun_invalidation", [
    expectation("reference.status", "exact", "unresolved"),
    expectation("reference.reason", "exact", "recent_reference_invalidated"),
    expectation("reference.requiresClarification", "exact", true),
    expectation("reference.selected", "exact", null)
  ]),
  scenario("edit_edit_undo_stability", [
    expectation("stableTarget", "exact", true),
    expectation("selected", "exact", "ref_live_meal_chicken")
  ]),
  scenario("correction_operation_switch_blocked", [
    expectation("deterministicAuthorizationGranted", "exact", false)
  ]),
  scenario("tool_reference_mismatch_blocked", [
    expectation("valid", "exact", false),
    expectation("error", "exact", "reference_target_mismatch")
  ]),
  scenario("long_chain_ambiguity_then_exact_selector", [
    expectation("ambiguousFirst", "exact", true),
    expectation("resolvedAfterExactSelector", "exact", true),
    expectation("selected", "exact", "ref_live_meal_lunch_26")
  ]),
  scenario("compound_stale_preflight_contract", [
    expectation("preflightsAllBeforeWrite", "exact", true),
    expectation("closesPartialBatch", "exact", true),
    expectation("usesExistingRegistry", "exact", true)
  ]),
  scenario("refresh_authoritative_reconciliation_contract", [
    expectation("freshAuthorityWins", "exact", true),
    expectation("staleCoveredObjectEvicted", "exact", true),
    expectation("unloadedDomainPreserved", "exact", true),
    expectation("noMutationAuthority", "exact", true)
  ])
]);

function scenario(id, expectations) {
  return defineAriEvalScenario({
    id,
    category: "trust_reference_action",
    tags: ["phase11d", "offline", "deterministic"],
    expectations
  });
}
