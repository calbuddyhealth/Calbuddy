// =====================================================
// ARI XP
// File: ari/intent/ari-central-intent-router.js
// Version: 1.5.3
// Purpose:
//   Preserve the legacy semantic action boundary only for likely mutations,
//   then boot Ari vNext as the shared primary intelligence on Home + Nutrition.
//   vNext owns normal conversation; trusted app services still own writes.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.5.3";
  const ENDPOINT = "/api/ari-intent-router";
  const CACHE_TTL_MS = 15000;
  const INSTALL_FLAG = "__ariCentralIntentRouterV1";
  const LEGACY_GATE_FLAG = "__ariCentralIntentLegacyGateV1";
  const MEAL_PLAN_ACTION_SCRIPT_ID = "ariTodayMealPlanActionV2Script";
  const MEAL_PLAN_GOAL_GUARD_SCRIPT_ID = "ariMealPlanGoalGuardScript";
  const VNEXT_RUNTIME_CONTROLLER_SCRIPT_ID = "ariVNextRuntimeController";
  const cache = new Map();

  const clean = (value = "") => String(value ?? "").trim();
  const MUTATION_CUE_PATTERN = /\b(log|add|save|record|create|edit|change|update|delete|remove|clear|set|mark|complete|undo|plan|schedule|consume|move|replace|rename|cancel|start|finish)\b/i;

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
    appendOrderedScript(
      VNEXT_RUNTIME_CONTROLLER_SCRIPT_ID,
      "ari/runtime/ari-runtime-controller.js?v=1.4.1"
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
      target: clean(decision.target) || "unknown",
      action: clean(decision.action) || "none",
      confidence: Number.isFinite(Number(decision.confidence))
        ? Math.max(0, Math.min(1, Number(decision.confidence)))
        : 0,
      requires_confirmation: decision.requires_confirmation === true,
      needs_clarification: decision.needs_clarification === true,
      clarification_question: clean(decision.clarification_question),
      reason: clean(decision.reason),
      entities: decision.entities && typeof decision.entities === "object"
        ? { ...decision.entities }
        : {},
      router_source: "central_intent_router",
      router_version: VERSION
    };
  }

  async function fetchDecision(message, appContext) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, appContext })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !validDecision(data?.decision)) {
      throw new Error(data?.error || "Ari intent router returned an invalid decision.");
    }

    return normalizeDecision(data.decision);
  }

  CalBuddy.routeAriIntent = async function routeAriIntent(input = {}) {
    const message = clean(input.message || input.userMessage);

    if (!message) {
      return normalizeDecision({
        domain: "conversation",
        intent: "conversation",
        target: "none",
        action: "none",
        confidence: 1,
        requires_confirmation: false,
        needs_clarification: false,
        clarification_question: "",
        reason: "Empty message.",
        entities: {}
      });
    }

    if (validDecision(input.intentDecision)) {
      return normalizeDecision(input.intentDecision);
    }

    const appContext = {
      ...surfaceFromInput(input),
      ...(input.appContext && typeof input.appContext === "object" ? input.appContext : {})
    };

    const key = cacheKey(message, appContext);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      return cached.decision;
    }

    const decision = await fetchDecision(message, appContext);
    cache.set(key, { decision, savedAt: Date.now() });
    return decision;
  };

  CalBuddy.attachAriIntentDecision = async function attachAriIntentDecision(input = {}) {
    if (validDecision(input.intentDecision)) return input;
    const intentDecision = await CalBuddy.routeAriIntent(input);
    return { ...input, intentDecision };
  };

  CalBuddy.isAriMutationDecision = function isAriMutationDecision(decision = {}) {
    return clean(decision.action) !== "none" &&
      ["create", "log", "edit", "delete", "update"].includes(clean(decision.intent));
  };

  function isLikelyMutationMessage(message = "") {
    return MUTATION_CUE_PATTERN.test(clean(message));
  }

  function shouldBypassRouting(input = {}) {
    const message = clean(input.message);
    if (!message) return true;

    try {
      const pending = CalBuddy.getPendingAction?.();
      if (pending && (CalBuddy.isYes?.(message) || CalBuddy.isNo?.(message))) {
        return true;
      }
    } catch {
      // Pending confirmation bypass is an optimization only.
    }

    // Normal conversation, advice, questions, and greetings go directly to
    // vNext. The extra intent call exists only to preflight likely mutations.
    return !isLikelyMutationMessage(message);
  }

  function installLegacyActionGate() {
    if (CalBuddy[LEGACY_GATE_FLAG]) return true;
    if (typeof CalBuddy.detectAriActionFromMessage !== "function") return false;

    const legacyDetect = CalBuddy.detectAriActionFromMessage.bind(CalBuddy);

    CalBuddy.detectAriActionFromMessage = async function centralIntentLegacyGate(message = "", context = null) {
      const decision = CalBuddy.__activeIntentDecision || null;

      if (validDecision(decision) && clean(decision.action) === "none") {
        return null;
      }

      if (
        validDecision(decision) &&
        ["nutrition", "training"].includes(clean(decision.domain))
      ) {
        return null;
      }

      return await legacyDetect(message, context);
    };

    Object.defineProperty(CalBuddy, LEGACY_GATE_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    return true;
  }

  function installAskBoundary() {
    if (CalBuddy[INSTALL_FLAG]) return true;
    if (typeof CalBuddy.askAri !== "function") return false;

    const originalAskAri = CalBuddy.askAri.bind(CalBuddy);

    CalBuddy.askAri = async function ariCentralIntentBoundary(input = {}) {
      if (shouldBypassRouting(input)) {
        return await originalAskAri(input);
      }

      let intentDecision;

      try {
        intentDecision = await CalBuddy.routeAriIntent(input);
      } catch (error) {
        console.error("ARI CENTRAL INTENT ROUTER FAILED:", error);
        CalBuddy.setAriMood?.("concerned");
        return {
          reply: "I couldn’t verify that request with my action router, so I didn’t change anything. Try that again in a moment.",
          emotion: "concerned",
          pendingAction: null,
          intentRouterError: true
        };
      }

      localStorage.setItem("ariLastIntentDecision", JSON.stringify({
        ...intentDecision,
        message: clean(input.message),
        routed_at: new Date().toISOString()
      }));

      window.dispatchEvent(new CustomEvent("ari:intentDecision", {
        detail: { decision: intentDecision, message: clean(input.message) }
      }));

      if (intentDecision.needs_clarification) {
        return {
          reply:
            intentDecision.clarification_question ||
            "I want to make sure I change the right thing. What exactly do you want me to update?",
          emotion: "coach",
          pendingAction: null,
          intentDecision
        };
      }

      if (
        CalBuddy.isAriMutationDecision(intentDecision) &&
        intentDecision.confidence < 0.8
      ) {
        return {
          reply: "I’m not confident enough about what you want changed. Can you say exactly what you want me to log, create, or edit?",
          emotion: "coach",
          pendingAction: null,
          intentDecision
        };
      }

      CalBuddy.__activeIntentDecision = intentDecision;

      try {
        return await originalAskAri({
          ...input,
          intentDecision
        });
      } finally {
        CalBuddy.__activeIntentDecision = null;
      }
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI CENTRAL INTENT FALLBACK BOUNDARY INSTALLED:", VERSION);
    return true;
  }

  loadTodayMealPlanActionService();

  let attempts = 0;
  const installTimer = window.setInterval(() => {
    attempts += 1;
    const boundaryReady = installAskBoundary();
    const legacyGateReady = installLegacyActionGate();

    if (boundaryReady && legacyGateReady) {
      loadVNextRuntime();
      window.clearInterval(installTimer);
      return;
    }

    if (attempts >= 240) window.clearInterval(installTimer);
  }, 50);

  console.log("ARI CENTRAL INTENT ROUTER LOADED:", VERSION);
})();