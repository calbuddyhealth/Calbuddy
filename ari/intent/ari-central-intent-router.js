// =====================================================
// ARI XP
// File: ari/intent/ari-central-intent-router.js
// Version: 1.0.0
// Purpose:
//   One semantic intent decision for every Ari user turn.
//   Calls /api/ari-intent-router and passes the same structured decision
//   through every downstream domain service. Never executes mutations.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const ENDPOINT = "/api/ari-intent-router";
  const CACHE_TTL_MS = 15000;
  const cache = new Map();

  const clean = (value = "") => String(value ?? "").trim();

  function surfaceFromInput(input = {}) {
    const page = clean(
      input?.appContext?.page ||
      input?.appContext?.currentPage ||
      window.location.pathname.split("/").pop() ||
      "home"
    ).toLowerCase();

    return {
      page: page === "nutrition.html" ? "nutrition" : page.replace(/\.html$/, "") || "home",
      currentPage: page === "nutrition.html" ? "nutrition" : page.replace(/\.html$/, "") || "home"
    };
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

  console.log("ARI CENTRAL INTENT ROUTER LOADED:", VERSION);
})();
