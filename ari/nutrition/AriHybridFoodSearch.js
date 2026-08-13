// =====================================================
// ARI EXPERIENCE
// File: AriHybridFoodSearch.js
// Version: 1.0.3
// Purpose:
//   Keep ARI Nutrition's existing local food search instant while
//   enriching branded grocery searches from the server-backed catalog.
//
// V1.0.3:
//   - Never caches an empty cloud result set.
//   - A temporary miss can be retried immediately after the catalog changes.
//
// V1.0.2:
//   - Never treats raw local result count as proof that a search is good.
//   - Only suppresses cloud enrichment when the local engine has a truly
//     strong exact answer.
//   - Brand-only searches still enrich so users can discover more variants.
//   - Preserves instant local rendering, bounded requests, caching, and the
//     existing AriFoodRegistry/AriFoodCalculator contract.
// =====================================================

(function initializeAriHybridFoodSearch(global) {
  "use strict";

  const VERSION = "1.0.3";
  const ENDPOINT = "/api/ari-food-search";
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 5000;
  const DEFAULT_LIMIT = 8;
  const STRONG_LOCAL_SCORE = 900;

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

  function nowMs() {
    return (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    )
      ? performance.now()
      : Date.now();
  }

  function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(number)));
  }

  function getResultScore(food) {
    const score = Number(food?.search?.score ?? food?.score);
    return Number.isFinite(score) ? score : 0;
  }

  function getMatchTypes(food) {
    return Array.isArray(food?.search?.matchTypes)
      ? food.search.matchTypes.map((value) => cleanText(value))
      : [];
  }

  function queryIsBrandOnly(query, localResults) {
    const normalized = normalizeText(query);
    if (!normalized) return false;

    return (Array.isArray(localResults) ? localResults : []).some(
      (food) => normalizeText(food?.brand) === normalized
    );
  }

  function hasStrongLocalAnswer(query, localResults) {
    const results = Array.isArray(localResults) ? localResults : [];
    if (!results.length) return false;

    if (queryIsBrandOnly(query, results)) return false;

    const top = results[0];
    const matchTypes = getMatchTypes(top);
    const exactMatch = matchTypes.some((type) =>
      ["exact-name", "exact-display-name", "exact-alias"].includes(type)
    );

    if (exactMatch) return true;

    return getResultScore(top) >= STRONG_LOCAL_SCORE;
  }

  function isEligibleQuery(query, localResults = []) {
    const normalized = normalizeText(query);

    if (normalized.length < 2) return false;
    if (!normalized.includes(" ") && normalized.length < 6) return false;
    if (hasStrongLocalAnswer(query, localResults)) return false;

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

    const results = Array.isArray(entry.results) ? entry.results : [];

    // Do not allow a historical miss to suppress a fresh catalog lookup.
    if (!results.length) {
      state.cache.delete(key);
      return null;
    }

    state.cacheHits += 1;
    return results;
  }

  function setCached(query, results) {
    const key = normalizeText(query);
    const normalizedResults = Array.isArray(results) ? results : [];

    if (!key) return;

    // Positive results are useful typing accelerators. Empty results are not:
    // the server-backed catalog can gain a product at any time, including
    // moments after a user's first search.
    if (!normalizedResults.length) {
      state.cache.delete(key);
      return;
    }

    state.cache.set(key, {
      savedAt: Date.now(),
      results: normalizedResults
    });

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
    } catch (_) {
      // Fall through to direct Supabase lookup.
    }

    try {
      if (typeof global.calbuddySupabase?.auth?.getSession === "function") {
        const { data, error } = await global.calbuddySupabase.auth.getSession();
        if (!error && data?.session?.access_token) return data.session.access_token;
      }
    } catch (_) {
      // Search stays local when auth lookup is unavailable.
    }

    return null;
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
        console.warn(
          "[ARI Hybrid Food Search] Registration skipped:",
          error?.message || error
        );
      }
    }

    state.registeredFoods += registered;
    return registered;
  }

  function refreshCurrentSearch(query) {
    const input = document.getElementById("mealName");
    if (!input) return;
    if (normalizeText(input.value) !== normalizeText(query)) return;

    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function requestCloudResults(query, localCount, limit) {
    const normalized = normalizeText(query);
    if (!normalized) return [];

    const cached = getCached(normalized);
    if (cached) return cached;

    if (state.pending.has(normalized)) {
      return state.pending.get(normalized);
    }

    const promise = (async () => {
      const startedAt = nowMs();
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
          body: JSON.stringify({ query, limit, localCount })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data?.success !== true) {
          throw new Error(
            data?.error || `Food catalog request failed (${response.status}).`
          );
        }

        const results = Array.isArray(data?.results) ? data.results : [];
        setCached(normalized, results);
        registerFoods(results);
        state.lastDurationMs = Math.round(nowMs() - startedAt);
        return results;
      } catch (error) {
        state.failures += 1;
        state.lastError = error?.name === "AbortError"
          ? "cloud_search_timeout"
          : cleanText(error?.message || error, 300);

        console.warn(
          "[ARI Hybrid Food Search] Cloud enrichment unavailable:",
          state.lastError
        );
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
    const results = Array.isArray(localResults) ? localResults : [];
    if (!isEligibleQuery(query, results)) return;
    if (getCached(query)) return;

    requestCloudResults(query, results.length, limit)
      .then((cloudResults) => {
        if (Array.isArray(cloudResults) && cloudResults.length) {
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
    if (!search || typeof search.suggest !== "function") return false;

    const originalSuggest = search.suggest.bind(search);
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
    isEligibleQuery,
    hasStrongLocalAnswer
  });

  global.AriHybridFoodSearch = AriHybridFoodSearch;
  install();
})(typeof window !== "undefined" ? window : globalThis);
