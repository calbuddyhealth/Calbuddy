import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferencePacket,
  REFERENCE_CONTEXT_VERSION,
  resolveReferenceTarget
} from "../api/_lib/ari-vnext/reference-context.js";
import { reviewExplicitApplicationIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";
import { validateToolCall } from "../api/_lib/ari-vnext/tools.js";

function reference({ id, domain, entityType, collection, ordinal, label = id, state = "persisted" }) {
  return {
    referenceId: id,
    state,
    domain,
    entityType,
    label,
    canonical: { id },
    details: { collection, ordinal },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

function nutritionTurn(message, references) {
  return { message, context: { referenceState: { references } } };
}

test("Phase 9A resolves exactly one authoritative target", () => {
  const result = resolveReferenceTarget({ message: "delete that", referenceState: { references: [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 })] }, route: { nutrition: true } });
  assert.equal(result.status, "resolved");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.selectedReferenceId, "ref_live_meal_a");
});

test("Phase 9A refuses to guess when two authoritative targets are plausible", () => {
  const result = resolveReferenceTarget({ message: "delete that", referenceState: { references: [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }), reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })] }, route: { nutrition: true } });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.selectedReferenceId, null);
  assert.deepEqual(result.candidateReferenceIds, ["ref_live_meal_a", "ref_live_meal_b"]);
});

test("Phase 9A resolves an explicit ordinal only inside one authoritative collection", () => {
  const result = resolveReferenceTarget({ message: "delete the second one", referenceState: { references: [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }), reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })] }, route: { nutrition: true } });
  assert.equal(result.status, "resolved");
  assert.equal(result.reason, "unique_authoritative_ordinal");
  assert.equal(result.selectedReferenceId, "ref_live_meal_b");
});

test("Phase 9A keeps the same ordinal ambiguous across two plausible collections", () => {
  const result = resolveReferenceTarget({ message: "delete the second one", referenceState: { references: [reference({ id: "ref_live_meal_today", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 }), reference({ id: "ref_live_meal_recent", domain: "nutrition", entityType: "meal", collection: "recent_meals", ordinal: 2 })] }, route: { nutrition: true } });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.reason, "ordinal_matches_multiple_collections");
  assert.equal(result.requiresClarification, true);
});

test("Phase 9A never re-targets a deleted reference", () => {
  const result = resolveReferenceTarget({ message: "delete that", referenceState: { references: [reference({ id: "ref_live_meal_deleted", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1, state: "deleted" }), reference({ id: "ref_live_meal_current", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })] }, route: { nutrition: true } });
  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_meal_current");
  assert.ok(!result.candidateReferenceIds.includes("ref_live_meal_deleted"));
});

test("Phase 9A uses the current message to narrow cross-domain targets", () => {
  const result = resolveReferenceTarget({ message: "delete that workout", referenceState: { references: [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }), reference({ id: "ref_live_workout_a", domain: "training", entityType: "workout", collection: "recent_workouts", ordinal: 1 })] }, route: { nutrition: true, training: true } });
  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_workout_a");
});

test("Phase 9A publishes deterministic resolution before model choice", () => {
  const packet = buildReferencePacket({ message: "delete that", history: [{ role: "assistant", content: "You have two meals in view." }], context: { referenceState: { references: [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }), reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })] } } }, { nutrition: true });
  assert.equal(REFERENCE_CONTEXT_VERSION, "1.3.0");
  assert.equal(packet?.resolution?.status, "ambiguous");
  assert.equal(packet?.resolution?.requiresClarification, true);
  assert.equal(packet?.policy?.deterministicResolutionPrecedesModelChoice, true);
});

test("Phase 9A verifier blocks an ambiguous explicit mutation before a pending action can be created", async () => {
  const refs = [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }), reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })];
  const route = { nutrition: true };
  const tool = "propose_undo_nutrition_mutation";
  const review = await reviewExplicitApplicationIntent({ turn: nutritionTurn("delete that", refs), route, tools: [{ type: "function", name: tool }], functionCall: { name: tool, arguments: JSON.stringify({ referenceId: "ref_live_meal_a" }) } });
  assert.equal(review?.decision, "none");
  assert.equal(review?.confidence, 1);
  assert.equal(review?.source, "deterministic_reference_resolution_block");
  assert.equal(route.referenceResolution?.status, "ambiguous");
});

test("Phase 9A tool gate accepts the exact uniquely resolved live meal reference", async () => {
  const refs = [reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 })];
  const route = { nutrition: true };
  const tool = "propose_update_nutrition_meal";
  const functionCall = { name: tool, arguments: JSON.stringify({ referenceId: "ref_live_meal_a", changes: [{ field: "calories", numberValue: 500, textValue: null }] }) };
  const review = await reviewExplicitApplicationIntent({ turn: nutritionTurn("change that to 500 calories", refs), route, tools: [{ type: "function", name: tool }], functionCall });
  const validation = validateToolCall(functionCall, route);
  assert.equal(review?.decision, tool);
  assert.equal(route.referenceResolution?.selectedReferenceId, "ref_live_meal_a");
  assert.equal(validation.valid, true, validation.error);
  assert.equal(validation.arguments.referenceId, "ref_live_meal_a");
});

test("Phase 9A tool gate rejects a syntactically valid but different reference", () => {
  const route = { nutrition: true, referenceResolution: { status: "resolved", selectedReferenceId: "ref_live_meal_a", candidateReferenceIds: ["ref_live_meal_a"] } };
  const validation = validateToolCall({ name: "propose_update_nutrition_meal", arguments: JSON.stringify({ referenceId: "ref_live_meal_b", changes: [{ field: "calories", numberValue: 500, textValue: null }] }) }, route);
  assert.equal(validation.valid, false);
  assert.equal(validation.error, "reference_target_mismatch");
});

test("Phase 9A tool gate rejects ambiguous or unresolved single-reference targets", () => {
  const ambiguous = validateToolCall({ name: "propose_delete_workout", arguments: JSON.stringify({ referenceId: "ref_live_workout_a" }) }, { training: true, referenceResolution: { status: "ambiguous", selectedReferenceId: null } });
  assert.equal(ambiguous.valid, false);
  assert.equal(ambiguous.error, "reference_target_ambiguous");
  const unresolved = validateToolCall({ name: "propose_delete_weight_log", arguments: JSON.stringify({ referenceId: "ref_live_weight_log_a" }) }, { goals: true, referenceResolution: { status: "unresolved", selectedReferenceId: null } });
  assert.equal(unresolved.valid, false);
  assert.equal(unresolved.error, "reference_target_unresolved");
});

test("Phase 9A live reference prefixes remain type bounded", () => {
  const meal = validateToolCall({ name: "propose_update_nutrition_meal", arguments: JSON.stringify({ referenceId: "ref_live_meal_a", changes: [{ field: "calories", numberValue: 500, textValue: null }] }) }, { nutrition: true });
  assert.equal(meal.valid, true, meal.error);
  const wrongType = validateToolCall({ name: "propose_update_nutrition_meal", arguments: JSON.stringify({ referenceId: "ref_live_workout_a", changes: [{ field: "calories", numberValue: 500, textValue: null }] }) }, { nutrition: true });
  assert.equal(wrongType.valid, false);
  assert.equal(wrongType.error, "nutrition_reference_id_invalid");
});

test("Phase 9A does not prematurely block explicit multi-component Meal Plan logging", () => {
  const validation = validateToolCall({ name: "propose_log_referenced_plan_components", arguments: JSON.stringify({ referenceIds: ["ref_ctx_meal_component_a", "ref_ctx_meal_component_b"] }) }, { nutrition: true, referenceResolution: { status: "ambiguous", selectedReferenceId: null } });
  assert.equal(validation.valid, true, validation.error);
  assert.deepEqual(validation.arguments.referenceIds, ["ref_ctx_meal_component_a", "ref_ctx_meal_component_b"]);
});
