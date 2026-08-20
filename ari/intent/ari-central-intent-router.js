// =====================================================
// ARI XP
// File: ari/intent/ari-central-intent-router.js
// Version: 1.5.1
// Purpose:
//   Preserve the legacy semantic action boundary as a deterministic fallback,
//   then boot Ari vNext as the shared primary intelligence on Home + Nutrition.
//   vNext owns semantic understanding; trusted app services still own writes.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.5.1";
  const ENDPOINT = "/api/ari-intent-router";
  const CACHE_TTL_MS = 15000;
  const INSTALL_FLAG = "__ariCentralIntentRouterV1";
  const LEGACY_GATE_FLAG = "__ariCentralIntentLegacyGateV1";
  const MEAL_PLAN_ACTION_SCRIPT_ID = "ariTodayMealPlanActionV2Script";
  const MEAL_PLAN_GOAL_GUARD_SCRIPT_ID = "ariMealPlanGoalGuardScript";
  const VNEXT_RUNTIME_CONTROLLER_SCRIPT_ID = "ariVNextRuntimeController";
  const cache = new Map();

  const clean = (value = "") => String(value ?? "").trim();

  function appendOrderedScript(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  function loadTodayMealPlanActionService() {
    appendOrderedScript(
      MEAL_PLAN_ACTION_SCRIPT_ID,
      "ari/actions/ari-meal-plan-action-v2.js?v=2.0.0"
    );
    appendOrderedScript(
      MEAL_PLAN_GOAL_GUARD_SCRIPT_ID,
      "ari/actions/ari-meal-plan-goal-guard.js?v=1.0.0"
    );
  }

  function loadVNextRuntime() {
    // The controller owns every vNext dependency and waits for each one to be
    // initialized before Ari can answer. This avoids parallel boot races.
    appendOrderedScript(
      VNEXT_RUNTIME_CONTROLLER_SCRIPT_ID,
      "ari/runtime/ari-runtime-controller.js?v=1.3.1"
    );
  }

  function surfaceFromInput(input = {}) {
    const page = clean(
      input?.appContext?.page ||
      input?.appContext?.currentPage ||
      window.location.pathname.split("/").pop() ||
      "home"
    ).toLowerCase();

    const normalized = page === "nutrition.html"
      ? "nutrition"
      : page.replace(/\.html$/, "") || "home";

    return { page: normalized, currentPage: normalized };
  }

  function cacheKey(message, appContext = {}) {
    return `${clean(message).toLowerCase()}::${clean(appContext.page || appContext.currentPage).toLowerCase()}`;
  }

  function validDecision(decision) {
    return Boolean(
      decision &&
      typeof decision === "object" &&
      clean(decision.domain) &&
      clean(decision.intent) &&
      clean(decision.target) &&
      clean(decision.action)
    );
  }

  function normalizeDecision(decision = {}) {
    return {
      domain: clean(decision.domain) || "unknown",
      intent: clean(decision.intent) || "conversation",
      target: clean(decision.target) || "none",
      action: clean(decision.action) || "none",
      confidence: Math.max(0, Math.min(1, Number(decision.confidence) || 0)),
      needs_clarification: decision.needs_clarification === true,
      clarification_question: clean(decision.clarification_question),
      routeSource: clean(decision.routeSource || decision.route_source) || "model"
    };
  }

  async function requestIntent(message, appContext = {}) {
    const key = cacheKey(message, appContext);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

    const session = await CalBuddy.getCurrentSession?.();
    const token = session?.access_token || null;
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message,
        appContext: surfaceFromInput({ appContext }),
        history: []
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || "Intent router unavailable.");
    }

    const decision = normalizeDecision(payload?.decision || payload?.intentDecision || payload);
    if (!validDecision(decision)) throw new Error("Intent router returned an invalid decision.");
    cache.set(key, { at: Date.now(), value: decision });
    return decision;
  }

  function shouldLegacyActionProceed(decision = {}) {
    if (!decision || typeof decision !== "object") return false;
    if (decision.needs_clarification === true) return false;
    if (decision.confidence < 0.8) return false;
    if (clean(decision.action) === "none") return false;
    return ["nutrition", "training"].includes(clean(decision.domain));
  }

  function installLegacyGate() {
    if (CalBuddy[LEGACY_GATE_FLAG]) return;
    CalBuddy[LEGACY_GATE_FLAG] = true;
    CalBuddy.centralIntentLegacyGate = shouldLegacyActionProceed;
  }

  function installRouter() {
    if (CalBuddy[INSTALL_FLAG]) return;
    CalBuddy[INSTALL_FLAG] = true;

    const previousAskAri = typeof CalBuddy.askAri === "function" ? CalBuddy.askAri.bind(CalBuddy) : null;

    CalBuddy.askAri = async function ariCentralIntentBoundary(message, options = {}) {
      const appContext = surfaceFromInput(options || {});
      let intentDecision = null;

      try {
        intentDecision = await requestIntent(message, appContext);
      } catch (error) {
        console.error("ARI central intent router failed:", error);
        return {
          reply: "I couldn’t verify that request with my action router. Try again in a moment.",
          intentRouterError: true,
          intentDecision: null,
          action: { type: "none" }
        };
      }

      if (!intentDecision || intentDecision.confidence < 0.8) {
        return {
          reply: intentDecision?.clarification_question || "I need a little more detail before I can do that safely.",
          intentDecision,
          action: { type: "none" }
        };
      }

      window.__activeIntentDecision = intentDecision;
      try {
        if (!previousAskAri) {
          return {
            reply: intentDecision.clarification_question || "I understood the request, but Ari is not ready yet.",
            intentDecision,
            action: { type: "none" }
          };
        }

        const result = await previousAskAri(message, {
          ...options,
          intentDecision,
          appContext
        });
        if (result && typeof result === "object") {
          return { ...result, intentDecision };
        }
        return result;
      } finally {
        window.__activeIntentDecision = null;
      }
    };
  }

  loadTodayMealPlanActionService();
  installLegacyGate();
  installRouter();
  loadVNextRuntime();
})();