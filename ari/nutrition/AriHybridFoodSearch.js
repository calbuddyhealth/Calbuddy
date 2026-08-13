// =====================================================
// ARI EXPERIENCE
// File: AriHybridFoodSearch.js
// Version: 1.0.0
// Purpose:
//   Keep ARI Nutrition's existing local food search instant while
//   enriching branded grocery searches from the server-backed catalog.
//
// Design:
//   - AriFoodSearch.suggest() still returns synchronously.
//   - Local results render immediately with zero network dependency.
//   - Eligible searches start one background request.
//   - Returned foods are registered into AriFoodRegistry.
//   - The current search input is nudged once so the existing UI reruns
//     its normal local ranking against the newly registered foods.
//   - Failed/slow cloud search never breaks manual entry.
// =====================================================

(function initializeAriHybridFoodSearch(global) {
  "use strict";

  const VERSION = "1.0.0";
  const ENDPOINT = "/api/ari-food-search";
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 5000;
  const DEFAULT_LIMIT = 8;

  const state = {
    installed: false,
    requests: 0,
    cacheHits: 0,
    registeredFoods: 0,
    failures: 0,
    lastQuery: null,
    lastDurationMs: null,
    lastError: null,
    pending: new Map(),
    cache: new Map()
  };

  function cleanText(value, maxLength = 1000) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  function normalizeText(value) {
    return cleanText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(number)));
  }

  function isEligibleQuery(query, localCount) {
    const normalized = normalizeText(query);

    if (normalized.length < 2) return false;

    // One- and two-character searches should always stay local. For short
    // prefixes such as "dori", wait until the user has typed enough of the
    // brand/product to avoid creating a network request per keystroke.
    if (!normalized.includes(" ") && normalized.length < 6) return false;

    // Plenty of good local answers already means there is no need to enrich.
    if (Number(localCount) >= 6) return false;

    return true;
  }

  function getCached(query) {
    const key = normalizeText(query);
    const entry = state.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      state.cache.delete(key);
      return null;
    }

    state.cacheHits += 1;
    return entry.results;
  }

  function setCached(query, results) {
    const key = normalizeText(query);
    if (!key) return;

    state.cache.set(key, {
      savedAt: Date.now(),
      results: Array.isArray(results) ? results : []
    });

    // Tiny bounded client cache. This is only a typing accelerator, not the
    // canonical food database.
    if (state.cache.size > 40) {
      const oldestKey = state.cache.keys().next().value;
      if (oldestKey) state.cache.delete(oldestKey);
    }
  }

  async function resolveAccessToken() {
    try {
      if (typeof global.CalBuddy?.getCurrentSession === "function") {
        const session = await global.CalBuddy.getCurrentSession();
        if (session?.access_token) return session.access_token;
      }
    } catch (error) {
      // Fall through to direct Supabase lookup.
    }

    try {
      if (typeof global.calbuddySupabase?.auth?.getSession === "function") {
        const { data, error } = await global.calbuddySupabase.auth.getSession();
        if (!error && data?.session?.access_token) return data.session.access_token;
      }
    } catch (error) {
      // Search stays local when auth lookup is unavailable.
    }

    return null;
  }

  function canonicalFoodKey(food) {
    const metadataKey = normalizeText(food?.metadata?.canonicalKey);
    if (metadataKey) return metadataKey;

    const brand = normalizeText(food?.brand);
    const name = normalizeText(food?.name || food?.displayName);
    return `${brand}|${name}`;
  }

  function registerFoods(results) {
    const registry = global.AriFoodRegistry;

    if (!registry || typeof registry.register !== "function") return 0;

    let registered = 0;

    for (const food of Array.isArray(results) ? results : []) {
      if (!food || typeof food !== "object" || !food.id || !food.name) continue;

      try {
        const result = registry.register(food, {
          source: "AriBrandCloud",
          replace: true
        });

        if (result?.registered) registered += 1;
      } catch (error) {
        console.warn("[ARI Hybrid Food Search] Registration skipped:", error?.message || error);
      }
    }

    state.registeredFoods += registered;
    return registered;
  }

  function refreshCurrentSearch(query) {
    const input = document.getElementById("mealName");
    if (!input) return;

    if (normalizeText(input.value) !== normalizeText(query)) return;

    // Reuse the existing Nutrition search workflow rather than creating a
    // second autocomplete renderer. The second pass is fully local because
    // the response has already been cached and registered.
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function requestCloudResults(query, localCount, limit) {
    const normalized = normalizeText(query);
    if (!normalized) return [];

    const cached = getCached(normalized);
    if (cached) {
      registerFoods(cached);
      return cached;
    }

    if (state.pending.has(normalized)) {
      return state.pending.get(normalized);
    }

    const promise = (async () => {
      const startedAt = performance?.now?.() ?? Date.now();
      state.requests += 1;
      state.lastQuery = query;
      state.lastError = null;

      const accessToken = await resolveAccessToken();
      if (!accessToken) return [];

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            limit,
            localCount
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data?.success !== true) {
          throw new Error(data?.error || `Food catalog request failed (${response.status}).`);
        }

        const results = Array.isArray(data?.results) ? data.results : [];
        setCached(normalized, results);
        registerFoods(results);

        state.lastDurationMs = Math.round((performance?.now?.() ?? Date.now()) - startedAt);
        return results;
      } catch (error) {
        state.failures += 1;
        state.lastError = error?.name === "AbortError"
          ? "cloud_search_timeout"
          : cleanText(error?.message || error, 300);

        // Cloud search is enhancement-only. Never surface its failure as a
        // manual-entry error because local search/custom entry still work.
        console.warn("[ARI Hybrid Food Search] Cloud enrichment unavailable:", state.lastError);
        return [];
      } finally {
        clearTimeout(timer);
      }
    })();

    state.pending.set(normalized, promise);

    try {
      return await promise;
    } finally {
      state.pending.delete(normalized);
    }
  }

  function scheduleEnrichment(query, localResults, limit) {
    const localCount = Array.isArray(localResults) ? localResults.length : 0;
    if (!isEligibleQuery(query, localCount)) return;

    const cached = getCached(query);

    if (cached) {
      const registered = registerFoods(cached);
      if (registered > 0) queueMicrotask(() => refreshCurrentSearch(query));
      return;
    }

    requestCloudResults(query, localCount, limit)
      .then((results) => {
        if (Array.isArray(results) && results.length) {
          refreshCurrentSearch(query);
        }
      })
      .catch(() => {
        // requestCloudResults already converts failures into local fallback.
      });
  }

  function install() {
    if (state.installed) return true;

    const search = global.AriFoodSearch;

    if (!search || typeof search.suggest !== "function") {
      return false;
    }

    const originalSuggest = search.suggest.bind(search);

    // AriFoodSearch is exported as a frozen object, so its method cannot be
    // reassigned. Publish a compatible facade instead; all other methods and
    // properties are preserved while suggest() gets background enrichment.
    const facade = Object.create(null);

    for (const key of Object.keys(search)) {
      facade[key] = search[key];
    }

    facade.suggest = function hybridSuggest(query, options = {}) {
      const localResults = originalSuggest(query, options);
      const limit = clampInteger(options?.limit, 1, 12, DEFAULT_LIMIT);

      scheduleEnrichment(query, localResults, limit);
      return localResults;
    };

    global.AriFoodSearch = Object.freeze(facade);
    state.installed = true;

    console.info(`[ARI Nutrition] AriHybridFoodSearch v${VERSION} active.`);
    return true;
  }

  function getDiagnostics() {
    return {
      version: VERSION,
      installed: state.installed,
      requests: state.requests,
      cacheHits: state.cacheHits,
      registeredFoods: state.registeredFoods,
      failures: state.failures,
      cacheEntries: state.cache.size,
      pendingRequests: state.pending.size,
      lastQuery: state.lastQuery,
      lastDurationMs: state.lastDurationMs,
      lastError: state.lastError
    };
  }

  const AriHybridFoodSearch = Object.freeze({
    VERSION,
    install,
    getDiagnostics,
    isEligibleQuery
  });

  global.AriHybridFoodSearch = AriHybridFoodSearch;

  // This file is intentionally loaded immediately after AriFoodSearch.
  install();
})(typeof window !== "undefined" ? window : globalThis);
