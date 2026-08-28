// ARI vNext — Phase 9D refresh/relaunch continuity reliability.
//
// This is a reconciliation layer, not a new reference store or execution path.
// Every Ari turn already rebuilds context from trusted app state. Phase 9D makes
// that rebuild authoritative over older session pointers when the relevant
// entity collection was actually re-read on the current turn.
//
// Trust rules:
// - current trusted context may identify a target but never authorizes a write;
// - current-turn user language remains the only mutation authorization source;
// - covered stale pointers can only be removed, never promoted;
// - uncovered domains are preserved so cross-page/cross-domain continuity is
//   not erased merely because a heavy domain was not loaded on this turn;
// - no localStorage/sessionStorage/database/model call is added here.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_phase9d_continuity_reliability";
  const BRIDGE_FLAG = "__ariPhase9DContinuityReliabilityV1";
  const MAX_REFERENCES = 20;

  window.Ari = window.Ari || {};

  const api = {
    version: VERSION,
    source: SOURCE,
    ready: false
  };
  window.AriVNextPhase9DContinuityReliability = api;

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function hasOwn(value, key) {
    return Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key));
  }

  function coverageKey(domain = "", entityType = "") {
    const d = clean(domain, 40).toLowerCase();
    const type = clean(entityType, 60).toLowerCase();
    return d && type ? `${d}:${type}` : "";
  }

  function canonicalIdentity(reference = {}) {
    const canonical = object(reference?.canonical);
    const domain = clean(reference?.domain, 40).toLowerCase();
    const entityType = clean(reference?.entityType, 60).toLowerCase();
    const identity = clean(
      canonical?.id ??
      canonical?.mealId ??
      canonical?.activityId ??
      canonical?.workoutId ??
      canonical?.logDate ??
      canonical?.date ??
      canonical?.planId ??
      canonical?.crewId ??
      canonical?.meetupId ??
      canonical?.missionId ??
      canonical?.candidateKey,
      220
    );
    return domain && entityType && identity ? `${domain}:${entityType}:${identity}` : "";
  }

  function isPersisted(reference = {}) {
    return clean(reference?.state, 40).toLowerCase() === "persisted";
  }

  function isCurrentBuildReference(reference = {}, buildStartedAt = 0) {
    if (!isPersisted(reference)) return false;
    const verification = object(reference?.verification);
    if (verification?.verifiedByTrustedContext !== true || verification?.currentContextRead !== true) return false;
    const updatedAt = Date.parse(clean(reference?.updatedAt, 80));
    return Number.isFinite(updatedAt) && updatedAt >= buildStartedAt;
  }

  function collectCoverage(context = {}, options = {}, currentReferences = []) {
    const coverage = new Set();
    const userContext = object(options?.userContext);
    const optionNutrition = object(options?.nutrition);
    const contextNutrition = object(context?.nutrition);
    const userTraining = object(userContext?.training);
    const optionTraining = object(options?.training);
    const contextTraining = object(context?.training);

    const add = (domain, entityType) => {
      const key = coverageKey(domain, entityType);
      if (key) coverage.add(key);
    };

    // Only explicit source properties count as empty-collection authority. The
    // bridge's default [] values are not enough because an upstream read may
    // have failed soft and produced an empty fallback.
    if (
      hasOwn(userContext, "mealsToday") ||
      hasOwn(userContext, "recentMeals") ||
      hasOwn(options, "meals") ||
      hasOwn(options, "recentMeals") ||
      hasOwn(options, "todayLog")
    ) add("nutrition", "meal");

    const userNutrition = object(userContext?.nutrition);
    if (
      hasOwn(userNutrition, "mealPlan") ||
      hasOwn(optionNutrition, "mealPlan") ||
      Array.isArray(contextNutrition?.mealPlan?.active)
    ) {
      add("nutrition", "meal_plan_item");
      add("nutrition", "meal_plan_component");
    }

    if (hasOwn(userContext, "recentWeights") || hasOwn(options, "recentWeights")) {
      add("goals", "weight_log");
    }

    if (
      context?.contextHints?.canonicalTrainingLoaded === true ||
      hasOwn(userContext, "trainingToday") ||
      hasOwn(userContext, "recentTraining") ||
      hasOwn(options, "trainingToday") ||
      hasOwn(options, "recentTraining")
    ) add("training", "workout");

    if (
      hasOwn(userTraining, "activityLogs") ||
      hasOwn(userTraining, "activity_logs") ||
      hasOwn(userTraining, "recentActivities") ||
      hasOwn(userTraining, "manualActivities") ||
      hasOwn(optionTraining, "activityLogs") ||
      hasOwn(optionTraining, "activity_logs") ||
      hasOwn(optionTraining, "recentActivities") ||
      hasOwn(optionTraining, "manualActivities") ||
      hasOwn(contextTraining, "activityLogs") ||
      hasOwn(contextTraining, "activity_logs") ||
      hasOwn(contextTraining, "recentActivities") ||
      hasOwn(contextTraining, "manualActivities")
    ) add("training", "activity_log");

    if (context?.social?.actionNetwork?.available === true) {
      add("social", "meetup");
      add("social", "mission");
      add("social", "crew");
      add("social", "crew_candidate");
    }

    // A current-build trusted reference proves at least that exact entity
    // collection was read, even when the caller did not expose the original
    // userContext property that produced it.
    for (const reference of currentReferences) {
      const key = coverageKey(reference?.domain, reference?.entityType);
      if (key) coverage.add(key);
    }

    return coverage;
  }

  function reconcileReferences(references = [], coverage = new Set(), buildStartedAt = 0) {
    const input = array(references).filter((reference) => reference && typeof reference === "object");
    const current = input.filter((reference) => isCurrentBuildReference(reference, buildStartedAt));
    const currentIdentities = new Set(current.map(canonicalIdentity).filter(Boolean));
    const ordered = [...current, ...input.filter((reference) => !current.includes(reference))];
    const output = [];
    const seenReferenceIds = new Set();
    const seenIdentities = new Set();
    let staleDropped = 0;

    for (const reference of ordered) {
      const referenceId = clean(reference?.referenceId, 180);
      if (!referenceId || seenReferenceIds.has(referenceId)) continue;
      const key = coverageKey(reference?.domain, reference?.entityType);
      const identity = canonicalIdentity(reference);
      const fresh = isCurrentBuildReference(reference, buildStartedAt);

      if (!fresh && key && coverage.has(key)) {
        // A covered entity type was re-read this turn. If the old pointer no
        // longer exists in current authoritative state, it is stale. If it does
        // exist, the current-build pointer wins instead of the cached pointer.
        if (!identity || !currentIdentities.has(identity)) {
          staleDropped += 1;
          continue;
        }
        if (identity && seenIdentities.has(identity)) {
          staleDropped += 1;
          continue;
        }
      }

      if (identity && seenIdentities.has(identity)) continue;
      seenReferenceIds.add(referenceId);
      if (identity) seenIdentities.add(identity);
      output.push(reference);
      if (output.length >= MAX_REFERENCES) break;
    }

    return { references: output, staleDropped };
  }

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge || typeof bridge.buildContext !== "function") return false;
    if (bridge[BRIDGE_FLAG]) return true;

    const originalBuildContext = bridge.buildContext.bind(bridge);
    bridge.buildContext = async function phase9DContinuityContext(options = {}) {
      const buildStartedAt = Date.now();
      const context = await originalBuildContext(options);
      const referenceState = object(context?.referenceState);
      const current = array(referenceState?.references)
        .filter((reference) => isCurrentBuildReference(reference, buildStartedAt));
      const coverage = collectCoverage(context, options, current);
      const reconciled = reconcileReferences(referenceState?.references, coverage, buildStartedAt);

      if (!referenceState?.references && !coverage.size) return context;
      return {
        ...context,
        referenceState: {
          ...referenceState,
          phase9dContinuityVersion: VERSION,
          continuitySource: SOURCE,
          authoritativeCoverage: Array.from(coverage).sort(),
          reconciledAt: new Date().toISOString(),
          staleReferencesDropped: reconciled.staleDropped,
          references: reconciled.references
        }
      };
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    return true;
  }

  function install() {
    if (!patchBridge()) return false;
    api.ready = true;
    try {
      window.dispatchEvent(new CustomEvent("ari:vnextPhase9DContinuityReliabilityReady", {
        detail: { version: VERSION, source: SOURCE }
      }));
    } catch {}
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();
