import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferencePacket,
  isReferenceFollowUp,
  resolveReferenceTarget
} from "../api/_lib/ari-vnext/reference-context.js";

function meal({ id, name, category = "lunch", date = "2026-08-26", state = "persisted", ordinal = 1 }) {
  return {
    referenceId: id,
    state,
    domain: "nutrition",
    entityType: "meal",
    label: name,
    canonical: { id, nutritionDate: date },
    details: {
      collection: "recent_meals",
      ordinal,
      name,
      mealCategory: category,
      nutritionDate: date
    },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

test("Phase 9B recognizes actually-prefixed correction turns as reference follow-ups", () => {
  assert.equal(isReferenceFollowUp("Actually make the chicken 8 ounces."), true);
  assert.equal(isReferenceFollowUp("No, I meant the lunch."), true);
  assert.equal(isReferenceFollowUp("I meant the other workout."), true);
});

test("Phase 9B resolves a named correction to one exact authoritative meal", () => {
  const result = resolveReferenceTarget({
    message: "Actually make the chicken 8 ounces.",
    referenceState: {
      references: [
        meal({ id: "ref_live_meal_chicken", name: "Chicken Burrito Bowl", ordinal: 1 }),
        meal({ id: "ref_live_meal_salmon", name: "Salmon Rice Bowl", category: "dinner", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.reason, "unique_authoritative_named_target");
  assert.equal(result.selectedReferenceId, "ref_live_meal_chicken");
});

test("Phase 9B resolves no-I-meant correction by explicit meal category", () => {
  const result = resolveReferenceTarget({
    message: "No, I meant the lunch.",
    referenceState: {
      references: [
        meal({ id: "ref_live_breakfast", name: "Egg Breakfast", category: "breakfast", ordinal: 1 }),
        meal({ id: "ref_live_lunch", name: "Chicken Wrap", category: "lunch", ordinal: 2 }),
        meal({ id: "ref_live_dinner", name: "Salmon Dinner", category: "dinner", ordinal: 3 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_lunch");
});

test("Phase 9B keeps same-name corrections ambiguous instead of guessing by recency", () => {
  const result = resolveReferenceTarget({
    message: "Actually change the chicken.",
    referenceState: {
      references: [
        meal({ id: "ref_live_chicken_1", name: "Chicken Bowl", ordinal: 1 }),
        meal({ id: "ref_live_chicken_2", name: "Chicken Salad", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.selectedReferenceId, null);
});

test("Phase 9B explicit selector miss never falls through to a different surviving meal", () => {
  const result = resolveReferenceTarget({
    message: "Actually change the chicken.",
    referenceState: {
      references: [
        meal({ id: "ref_live_chicken_deleted", name: "Chicken Bowl", state: "deleted", ordinal: 1 }),
        meal({ id: "ref_live_salmon", name: "Salmon Bowl", category: "dinner", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "unresolved");
  assert.equal(result.reason, "explicit_selector_not_found");
  assert.equal(result.selectedReferenceId, null);
});

test("Phase 9B repeated edits keep resolving the same stable authoritative object", () => {
  const references = [
    meal({ id: "ref_live_meal_chicken", name: "Chicken Burrito Bowl", ordinal: 1 }),
    meal({ id: "ref_live_meal_salmon", name: "Salmon Bowl", category: "dinner", ordinal: 2 })
  ];

  const first = resolveReferenceTarget({
    message: "Actually make the chicken 8 ounces.",
    referenceState: { references },
    route: { nutrition: true }
  });
  const second = resolveReferenceTarget({
    message: "Actually make the chicken 10 ounces instead.",
    referenceState: { references },
    route: { nutrition: true }
  });

  assert.equal(first.selectedReferenceId, "ref_live_meal_chicken");
  assert.equal(second.selectedReferenceId, "ref_live_meal_chicken");
});

test("Phase 9B packet marks correction language without granting mutation permission", () => {
  const packet = buildReferencePacket({
    message: "No, I meant the lunch.",
    history: [{ role: "assistant", content: "I can change the dinner. Confirm?" }],
    context: {
      referenceState: {
        references: [meal({ id: "ref_live_lunch", name: "Chicken Wrap", category: "lunch" })]
      }
    }
  }, { nutrition: true });

  assert.equal(packet?.correctionDetected, true);
  assert.equal(packet?.resolution?.status, "resolved");
  assert.equal(packet?.policy?.correctionLanguageMayResolveTargetButNeverGrantWritePermission, true);
  assert.equal(packet?.policy?.currentTurnAuthorizesMutation, true);
});

test("Phase 9B supports exact dated corrections without guessing relative dates", () => {
  const result = resolveReferenceTarget({
    message: "No, I meant the 2026-08-26 lunch.",
    referenceState: {
      references: [
        meal({ id: "ref_live_lunch_26", name: "Chicken Wrap", category: "lunch", date: "2026-08-26", ordinal: 1 }),
        meal({ id: "ref_live_lunch_27", name: "Turkey Wrap", category: "lunch", date: "2026-08-27", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_lunch_26");
});
