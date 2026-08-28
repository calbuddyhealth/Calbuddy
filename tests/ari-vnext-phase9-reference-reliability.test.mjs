import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferencePacket,
  REFERENCE_CONTEXT_VERSION,
  resolveReferenceTarget
} from "../api/_lib/ari-vnext/reference-context.js";

function reference({
  id,
  domain,
  entityType,
  collection,
  ordinal,
  label = id,
  state = "persisted"
}) {
  return {
    referenceId: id,
    state,
    domain,
    entityType,
    label,
    canonical: { id },
    details: { collection, ordinal },
    verification: {
      verifiedByTrustedContext: true,
      currentContextRead: true
    }
  };
}

test("Phase 9A resolves exactly one authoritative target", () => {
  const result = resolveReferenceTarget({
    message: "delete that",
    referenceState: {
      references: [
        reference({
          id: "ref_live_meal_a",
          domain: "nutrition",
          entityType: "meal",
          collection: "meals_today",
          ordinal: 1
        })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.selectedReferenceId, "ref_live_meal_a");
});

test("Phase 9A refuses to guess when two authoritative targets are plausible", () => {
  const result = resolveReferenceTarget({
    message: "delete that",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }),
        reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.selectedReferenceId, null);
  assert.deepEqual(result.candidateReferenceIds, ["ref_live_meal_a", "ref_live_meal_b"]);
});

test("Phase 9A resolves an explicit ordinal only inside one authoritative collection", () => {
  const result = resolveReferenceTarget({
    message: "delete the second one",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }),
        reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.reason, "unique_authoritative_ordinal");
  assert.equal(result.selectedReferenceId, "ref_live_meal_b");
});

test("Phase 9A keeps the same ordinal ambiguous across two plausible collections", () => {
  const result = resolveReferenceTarget({
    message: "delete the second one",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_today", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 }),
        reference({ id: "ref_live_meal_recent", domain: "nutrition", entityType: "meal", collection: "recent_meals", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.reason, "ordinal_matches_multiple_collections");
  assert.equal(result.requiresClarification, true);
});

test("Phase 9A never re-targets a deleted reference", () => {
  const result = resolveReferenceTarget({
    message: "delete that",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_deleted", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1, state: "deleted" }),
        reference({ id: "ref_live_meal_current", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })
      ]
    },
    route: { nutrition: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_meal_current");
  assert.ok(!result.candidateReferenceIds.includes("ref_live_meal_deleted"));
});

test("Phase 9A uses the current message to narrow cross-domain targets", () => {
  const result = resolveReferenceTarget({
    message: "delete that workout",
    referenceState: {
      references: [
        reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }),
        reference({ id: "ref_live_workout_a", domain: "training", entityType: "workout", collection: "recent_workouts", ordinal: 1 })
      ]
    },
    route: { nutrition: true, training: true }
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.selectedReferenceId, "ref_live_workout_a");
});

test("Phase 9A publishes deterministic resolution before model choice", () => {
  const packet = buildReferencePacket({
    message: "delete that",
    history: [{ role: "assistant", content: "You have two meals in view." }],
    context: {
      referenceState: {
        references: [
          reference({ id: "ref_live_meal_a", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 1 }),
          reference({ id: "ref_live_meal_b", domain: "nutrition", entityType: "meal", collection: "meals_today", ordinal: 2 })
        ]
      }
    }
  }, { nutrition: true });

  assert.equal(REFERENCE_CONTEXT_VERSION, "1.3.0");
  assert.equal(packet?.resolution?.status, "ambiguous");
  assert.equal(packet?.resolution?.requiresClarification, true);
  assert.equal(packet?.policy?.deterministicResolutionPrecedesModelChoice, true);
});
