// =====================================================
// ARI XP
// File: ari/intent/ari-central-intent-router.js
// Version: 1.1.0
// Purpose:
//   ONE semantic intent decision for every Ari user turn.
//   Wraps CalBuddy.askAri(), calls /api/ari-intent-router once, and passes
//   the SAME structured decision through every downstream domain service.
//   Never executes mutations itself.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.1.0";
  const ENDPOINT = "/api/ari-intent-router";
  const CACHE_TTL_MS = 15000;
  const INSTALL_FLAG = "__ariCentralIntentRouterV1";
  const cache = new Map();

  const clean = (value = "") => String(value ?? "").trim();

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
      router_source: "openai_structured_output",
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

    return false;
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

        // Fail closed for app actions. We do not let a conversational model
        // guess whether it should mutate user data when the authority router
        // is unavailable.
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

      // Low-confidence mutations never reach an executor. Conversation and
      // questions can proceed normally at lower confidence because no data
      // will be changed.
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

      return await originalAskAri({
        ...input,
        intentDecision
      });
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI CENTRAL INTENT BOUNDARY INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const installTimer = window.setInterval(() => {
    attempts += 1;
    if (installAskBoundary() || attempts >= 240) {
      window.clearInterval(installTimer);
    }
  }, 50);

  console.log("ARI CENTRAL INTENT ROUTER LOADED:", VERSION);
})();
