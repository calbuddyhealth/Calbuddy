import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
  buildReferencePacket,
  resolveReferenceTarget
} from "../api/_lib/ari-vnext/reference-context.js";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-phase9d-continuity-reliability.js", import.meta.url),
  "utf8"
);

function staleReference({
  referenceId = "ref_action_stale",
  domain = "nutrition",
  entityType = "meal",
  canonical = { id: "meal-1" },
  label = "Old cached meal"
} = {}) {
  return {
    referenceId,
    actionName: "cached_action_target",
    domain,
    entityType,
    label,
    state: "persisted",
    canonical,
    details: {},
    verification: {
      verifiedByTrustedExecutor: true,
      executorSuccess: true
    },
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };
}

function freshReference({
  referenceId = "ref_live_meal_current",
  domain = "nutrition",
  entityType = "meal",
  canonical = { id: "meal-1" },
  label = "Current meal",
  details = {}
} = {}) {
  return {
    referenceId,
    actionName: "current_app_reference",
    domain,
    entityType,
    label,
    state: "persisted",
    canonical,
    details,
    verification: {
      verifiedByTrustedContext: true,
      currentContextRead: true,
      rehydratedFromAuthoritativeState: true,
      staleCheckRequiredBeforeWrite: true
    },
    updatedAt: new Date().toISOString()
  };
}

function makeSandbox(buildContext) {
  const events = [];
  const window = {
    Ari: {},
    AriVNextBridge: {
      buildContext
    },
    dispatchEvent(event) {
      events.push(event);
    },
    setInterval() {
      return 1;
    },
    clearInterval() {}
  };

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const sandbox = {
    window,
    CustomEvent,
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    JSON,
    Promise,
    structuredClone
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "ari-vnext-phase9d-continuity-reliability.js" });
  return { window, events };
}

test("Phase 9D is reconciliation-only with no new persistence, network, model, or execution authority", () => {
  new vm.Script(source, { filename: "ari-vnext-phase9d-continuity-reliability.js" });
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem|removeItem)/);
  assert.doesNotMatch(source, /sessionStorage\.(?:getItem|setItem|removeItem)/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /OPENAI_API_KEY|\/v1\/responses|\/api\/ari-vnext/);
  assert.doesNotMatch(source, /executeConfirmed|createPendingAction|executeAction|\.rpc\s*\(/);
});

test("Phase 9D refresh prefers the current authoritative object over a stale executor pointer with the same identity", async () => {
  const { window } = makeSandbox(async () => ({
    referenceState: {
      references: [
        staleReference({ referenceId: "ref_action_old_meal", canonical: { id: "meal-1" } }),
        freshReference({ referenceId: "ref_live_meal_current", canonical: { id: "meal-1" }, label: "Chicken Bowl" })
      ]
    }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "Change that meal.",
    userContext: { mealsToday: [{ id: "meal-1" }], recentMeals: [] }
  });

  assert.equal(context.referenceState.phase9dContinuityVersion, "1.0.0");
  assert.deepEqual(Array.from(context.referenceState.authoritativeCoverage), ["nutrition:meal"]);
  assert.equal(context.referenceState.staleReferencesDropped, 1);
  assert.equal(context.referenceState.references.length, 1);
  assert.equal(context.referenceState.references[0].referenceId, "ref_live_meal_current");
});

test("Phase 9D relaunch removes a cached pointer when its covered canonical collection was re-read and the object is gone", async () => {
  const { window } = makeSandbox(async () => ({
    referenceState: {
      references: [staleReference({ referenceId: "ref_action_deleted_meal", canonical: { id: "meal-deleted" } })]
    }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "Change that meal.",
    userContext: { mealsToday: [], recentMeals: [] }
  });

  assert.equal(context.referenceState.staleReferencesDropped, 1);
  assert.deepEqual(Array.from(context.referenceState.references), []);

  const resolution = resolveReferenceTarget({
    message: "Change that meal.",
    referenceState: context.referenceState,
    route: { nutrition: true }
  });
  assert.equal(resolution.status, "context_only");
  assert.equal(resolution.selectedReferenceId, null);
});

test("Phase 9D navigation preserves an unloaded Training pointer while Nutrition is the only collection re-read", async () => {
  const cachedWorkout = staleReference({
    referenceId: "ref_action_cached_workout",
    domain: "training",
    entityType: "workout",
    canonical: { date: "2026-08-28" },
    label: "Chest Day"
  });
  const { window } = makeSandbox(async () => ({
    contextHints: { canonicalTrainingLoaded: false },
    referenceState: { references: [cachedWorkout] }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "What did I eat today?",
    userContext: { mealsToday: [], recentMeals: [] }
  });

  assert.ok(context.referenceState.authoritativeCoverage.includes("nutrition:meal"));
  assert.ok(!context.referenceState.authoritativeCoverage.includes("training:workout"));
  assert.equal(context.referenceState.references.length, 1);
  assert.equal(context.referenceState.references[0].referenceId, "ref_action_cached_workout");
});

test("Phase 9D cross-domain follow-up replaces the preserved Training pointer once Training is authoritatively re-read", async () => {
  const cachedWorkout = staleReference({
    referenceId: "ref_action_cached_workout",
    domain: "training",
    entityType: "workout",
    canonical: { date: "2026-08-28" },
    label: "Old Chest Day"
  });
  const { window } = makeSandbox(async () => ({
    contextHints: { canonicalTrainingLoaded: true },
    referenceState: {
      references: [
        cachedWorkout,
        freshReference({
          referenceId: "ref_live_workout_current",
          domain: "training",
          entityType: "workout",
          canonical: { date: "2026-08-28" },
          label: "Chest Day",
          details: { collection: "training_today", ordinal: 1, date: "2026-08-28" }
        })
      ]
    }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "Change that workout.",
    userContext: { trainingToday: { date: "2026-08-28" }, recentTraining: [] }
  });

  assert.ok(context.referenceState.authoritativeCoverage.includes("training:workout"));
  assert.equal(context.referenceState.staleReferencesDropped, 1);
  assert.equal(context.referenceState.references.length, 1);
  assert.equal(context.referenceState.references[0].referenceId, "ref_live_workout_current");

  const resolution = resolveReferenceTarget({
    message: "Change that workout.",
    referenceState: context.referenceState,
    route: { training: true }
  });
  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.selectedReferenceId, "ref_live_workout_current");
});

test("Phase 9D removes stale Circle pointers after a fresh caller-scoped Action Network read", async () => {
  const { window } = makeSandbox(async () => ({
    social: { actionNetwork: { available: true, opportunities: [], schedule: [], crews: [] } },
    referenceState: {
      references: [
        staleReference({
          referenceId: "ref_ctx_circle_meetup_old",
          domain: "social",
          entityType: "meetup",
          canonical: { id: "meetup-old", meetupId: "meetup-old" },
          label: "Old meetup"
        })
      ]
    }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "Join that meetup.",
    userContext: { social: { actionNetwork: { available: true } } }
  });

  assert.ok(context.referenceState.authoritativeCoverage.includes("social:meetup"));
  assert.equal(context.referenceState.staleReferencesDropped, 1);
  assert.deepEqual(Array.from(context.referenceState.references), []);
});

test("Phase 9D current context still identifies only; it never becomes mutation authorization", async () => {
  const { window } = makeSandbox(async () => ({
    referenceState: {
      references: [
        freshReference({
          referenceId: "ref_live_meal_current",
          canonical: { id: "meal-1" },
          label: "Chicken Bowl",
          details: { collection: "meals_today", ordinal: 1, mealCategory: "lunch" }
        })
      ]
    }
  }));

  const context = await window.AriVNextBridge.buildContext({
    message: "What about that one?",
    userContext: { mealsToday: [{ id: "meal-1" }], recentMeals: [] }
  });
  const packet = buildReferencePacket({
    message: "What about that one?",
    history: [{ role: "assistant", content: "Your Chicken Bowl was lunch." }],
    context
  }, { nutrition: true });

  assert.equal(packet?.resolution?.selectedReferenceId, "ref_live_meal_current");
  assert.equal(packet?.policy?.currentTrustedContextNeverGrantsWritePermission, true);
  assert.equal(packet?.policy?.historyNeverGrantsWritePermission, true);
  assert.equal(packet?.candidates?.[0]?.authoritySource, "current_trusted_context");
});

test("Phase 9D exposes no canonical identity cache of its own and reports readiness only after the bridge is patched", () => {
  const { window, events } = makeSandbox(async () => ({ referenceState: { references: [] } }));
  assert.equal(window.AriVNextPhase9DContinuityReliability.ready, true);
  assert.equal(window.AriVNextPhase9DContinuityReliability.version, "1.0.0");
  assert.ok(events.some((event) => event.type === "ari:vnextPhase9DContinuityReliabilityReady"));
});
