// =====================================================
// ARI REBIRTH
// File: AriFoodSearch.js
// Version: 1.0.0
//
// Purpose:
//   Search and autocomplete engine for the ARI Nutrition
//   food registry.
//
// Architectural flow:
//
//   ARI Food Data Modules
//          ↓
//   AriFoodRegistry
//          ↓
//   AriFoodSearch
//          ↓
//   Nutrition Manual Entry autocomplete
//
// Responsibilities:
//   - Search food records exposed by AriFoodRegistry.
//   - Rank exact, prefix, alias, token, and fuzzy matches.
//   - Prioritize popular foods when relevance is similar.
//   - Match preparation, food state, category, brand,
//     restaurant, aliases, and tags.
//   - Support lightweight typo tolerance.
//   - Support filters for category/state/preparation.
//   - Return calculator-ready canonical food records.
//   - Provide popular-food suggestions when requested.
//   - Expose search diagnostics.
//
// Non-responsibilities:
//   - Does not own food nutrition data.
//   - Does not register foods.
//   - Does not calculate serving nutrition.
//   - Does not convert ounces, grams, cups, or pieces.
//   - Does not save meals.
//   - Does not access Supabase.
//   - Does not manipulate the DOM.
//
// Dependencies:
//   - AriFoodRegistry v2+
// =====================================================

(function initializeAriFoodSearch(global) {
  "use strict";

  // =====================================================
  // VERSION
  // =====================================================

  const VERSION = "1.0.0";


  // =====================================================
  // DEFAULT CONFIGURATION
  // =====================================================

  const DEFAULT_OPTIONS = Object.freeze({
    limit: 8,
    maxLimit: 50,

    minQueryLength: 1,

    typoTolerance: true,

    fuzzyThreshold: 0.72,

    includeScore: true,

    includeSearchMeta: true,

    allowEmptyQuery: false,

    popularityWeight: 1.25,

    verifiedBoost: 10,

    exactNameBoost: 1000,
    exactDisplayNameBoost: 980,
    exactAliasBoost: 940,

    namePrefixBoost: 820,
    displayPrefixBoost: 790,
    aliasPrefixBoost: 760,

    allTokensNameBoost: 650,
    allTokensDisplayBoost: 620,
    allTokensAliasBoost: 590,

    tokenPrefixBoost: 180,
    tokenContainsBoost: 110,

    preparationBoost: 150,
    stateBoost: 130,
    categoryBoost: 90,
    brandBoost: 120,
    restaurantBoost: 120,
    tagBoost: 80,

    fuzzyTokenBoost: 90
  });


  // =====================================================
  // INTERNAL STATE
  // =====================================================

  const state = {
    searches: 0,
    emptySearches: 0,
    fuzzySearches: 0,
    lastQuery: null,
    lastResultCount: 0,
    lastSearchAt: null,
    lastDurationMs: null,
    lastError: null
  };


  // =====================================================
  // BASIC HELPERS
  // =====================================================

  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }


  function cleanString(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }


  function safeNumber(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }


  function clamp(value, min, max) {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }


  function normalizeText(value) {
    return cleanString(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }


  function tokenize(value) {
    const normalized = normalizeText(value);

    if (!normalized) {
      return [];
    }

    return normalized
      .split(" ")
      .filter(Boolean);
  }


  function uniqueStrings(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    const seen = new Set();
    const output = [];

    for (const value of values) {
      const normalized = normalizeText(value);

      if (
        !normalized ||
        seen.has(normalized)
      ) {
        continue;
      }

      seen.add(normalized);
      output.push(normalized);
    }

    return output;
  }


  function nowMs() {
    if (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    ) {
      return performance.now();
    }

    return Date.now();
  }


  // =====================================================
  // REGISTRY ACCESS
  // =====================================================

  function getRegistry() {
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.getSearchDocuments !== "function" ||
      typeof registry.resolveIds !== "function"
    ) {
      return null;
    }

    return registry;
  }


  function isReady() {
    return getRegistry() !== null;
  }


  // =====================================================
  // OPTIONS
  // =====================================================

  function normalizeOptions(options = {}) {
    const raw =
      isPlainObject(options)
        ? options
        : {};

    const maxLimit =
      Math.max(
        1,
        safeNumber(
          raw.maxLimit,
          DEFAULT_OPTIONS.maxLimit
        )
      );

    const limit =
      clamp(
        Math.round(
          safeNumber(
            raw.limit,
            DEFAULT_OPTIONS.limit
          )
        ),
        1,
        maxLimit
      );

    return {
      ...DEFAULT_OPTIONS,
      ...raw,

      limit,
      maxLimit,

      minQueryLength:
        Math.max(
          0,
          Math.round(
            safeNumber(
              raw.minQueryLength,
              DEFAULT_OPTIONS.minQueryLength
            )
          )
        ),

      fuzzyThreshold:
        clamp(
          safeNumber(
            raw.fuzzyThreshold,
            DEFAULT_OPTIONS.fuzzyThreshold
          ),
          0,
          1
        ),

      popularityWeight:
        Math.max(
          0,
          safeNumber(
            raw.popularityWeight,
            DEFAULT_OPTIONS.popularityWeight
          )
        )
    };
  }


  // =====================================================
  // FILTER NORMALIZATION
  // =====================================================

  function normalizeFilterValues(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return [];
    }

    const values =
      Array.isArray(value)
        ? value
        : [value];

    return uniqueStrings(values);
  }


  function documentPassesFilters(
    document,
    options
  ) {
    const categories =
      normalizeFilterValues(
        options.category ||
        options.categories
      );

    const states =
      normalizeFilterValues(
        options.state ||
        options.states
      );

    const preparations =
      normalizeFilterValues(
        options.preparation ||
        options.preparations
      );

    const brands =
      normalizeFilterValues(
        options.brand ||
        options.brands
      );


    if (
      categories.length > 0 &&
      !categories.includes(
        normalizeText(document.category)
      )
    ) {
      return false;
    }


    if (
      states.length > 0 &&
      !states.includes(
        normalizeText(document.state)
      )
    ) {
      return false;
    }


    if (
      preparations.length > 0 &&
      !preparations.includes(
        normalizeText(document.preparation)
      )
    ) {
      return false;
    }


    if (brands.length > 0) {
      const documentBrands =
        uniqueStrings([
          document.brand,
          document.restaurant
        ]);

      const matched =
        brands.some(
          brand =>
            documentBrands.includes(brand)
        );

      if (!matched) {
        return false;
      }
    }


    if (
      options.supportsWeight === true &&
      !document.measurement?.supportsWeight
    ) {
      return false;
    }


    if (
      options.supportsVolume === true &&
      !document.measurement?.supportsVolume
    ) {
      return false;
    }


    if (
      options.supportsCustomUnits === true &&
      !document.measurement?.supportsCustomUnits
    ) {
      return false;
    }


    return true;
  }


  // =====================================================
  // STRING DISTANCE
  // =====================================================

  /**
   * Damerau-Levenshtein distance.
   *
   * Handles simple misspellings and transposed characters,
   * such as:
   *
   *   chikcen -> chicken
   *   brocoli -> broccoli
   */

  function damerauLevenshtein(a, b) {
    const left = normalizeText(a);
    const right = normalizeText(b);

    if (left === right) {
      return 0;
    }

    if (!left) {
      return right.length;
    }

    if (!right) {
      return left.length;
    }

    const rows =
      left.length + 1;

    const cols =
      right.length + 1;

    const matrix =
      Array.from(
        { length: rows },
        () =>
          new Array(cols).fill(0)
      );


    for (
      let row = 0;
      row < rows;
      row += 1
    ) {
      matrix[row][0] = row;
    }


    for (
      let col = 0;
      col < cols;
      col += 1
    ) {
      matrix[0][col] = col;
    }


    for (
      let row = 1;
      row < rows;
      row += 1
    ) {
      for (
        let col = 1;
        col < cols;
        col += 1
      ) {
        const cost =
          left[row - 1] ===
          right[col - 1]
            ? 0
            : 1;


        matrix[row][col] =
          Math.min(
            matrix[row - 1][col] + 1,
            matrix[row][col - 1] + 1,
            matrix[row - 1][col - 1] + cost
          );


        if (
          row > 1 &&
          col > 1 &&
          left[row - 1] ===
            right[col - 2] &&
          left[row - 2] ===
            right[col - 1]
        ) {
          matrix[row][col] =
            Math.min(
              matrix[row][col],
              matrix[row - 2][col - 2] + cost
            );
        }
      }
    }


    return matrix[
      rows - 1
    ][
      cols - 1
    ];
  }


  function similarity(a, b) {
    const left = normalizeText(a);
    const right = normalizeText(b);

    if (!left || !right) {
      return 0;
    }

    if (left === right) {
      return 1;
    }

    const longest =
      Math.max(
        left.length,
        right.length
      );

    if (longest === 0) {
      return 1;
    }

    const distance =
      damerauLevenshtein(
        left,
        right
      );

    return clamp(
      1 - distance / longest,
      0,
      1
    );
  }


  // =====================================================
  // DOCUMENT FIELD NORMALIZATION
  // =====================================================

  function createSearchView(document) {
    const name =
      normalizeText(
        document.name
      );

    const displayName =
      normalizeText(
        document.displayName
      );

    const category =
      normalizeText(
        document.category
      );

    const stateValue =
      normalizeText(
        document.state
      );

    const preparation =
      normalizeText(
        document.preparation
      );

    const brand =
      normalizeText(
        document.brand
      );

    const restaurant =
      normalizeText(
        document.restaurant
      );

    const aliases =
      uniqueStrings(
        document.aliases
      );

    const tags =
      uniqueStrings(
        document.tags
      );

    const searchableText =
      normalizeText(
        document.searchableText
      );

    return {
      name,
      displayName,
      category,
      state: stateValue,
      preparation,
      brand,
      restaurant,
      aliases,
      tags,
      searchableText,

      nameTokens:
        tokenize(name),

      displayTokens:
        tokenize(displayName),

      aliasTokens:
        uniqueStrings(
          aliases.flatMap(tokenize)
        ),

      searchableTokens:
        uniqueStrings(
          tokenize(searchableText)
        )
    };
  }


  // =====================================================
  // TOKEN HELPERS
  // =====================================================

  function allTokensIncluded(
    queryTokens,
    targetTokens
  ) {
    if (
      queryTokens.length === 0 ||
      targetTokens.length === 0
    ) {
      return false;
    }

    return queryTokens.every(
      queryToken =>
        targetTokens.some(
          targetToken =>
            targetToken === queryToken ||
            targetToken.startsWith(
              queryToken
            )
        )
    );
  }


  function bestTokenSimilarity(
    queryToken,
    candidateTokens
  ) {
    let best = 0;

    for (
      const candidate
      of candidateTokens
    ) {
      const score =
        similarity(
          queryToken,
          candidate
        );

      if (score > best) {
        best = score;
      }

      if (best === 1) {
        break;
      }
    }

    return best;
  }


  // =====================================================
  // SCORE ONE DOCUMENT
  // =====================================================

  function scoreDocument(
    document,
    normalizedQuery,
    queryTokens,
    options
  ) {
    const view =
      createSearchView(document);

    let score = 0;

    const matchTypes =
      new Set();

    const matchedTerms =
      new Set();


    // -----------------------------------------------------
    // Exact matches
    // -----------------------------------------------------

    if (
      view.name ===
      normalizedQuery
    ) {
      score +=
        options.exactNameBoost;

      matchTypes.add(
        "exact-name"
      );

      matchedTerms.add(
        document.name
      );
    }


    if (
      view.displayName ===
      normalizedQuery
    ) {
      score +=
        options.exactDisplayNameBoost;

      matchTypes.add(
        "exact-display-name"
      );

      matchedTerms.add(
        document.displayName
      );
    }


    for (
      const alias
      of view.aliases
    ) {
      if (
        alias ===
        normalizedQuery
      ) {
        score +=
          options.exactAliasBoost;

        matchTypes.add(
          "exact-alias"
        );

        matchedTerms.add(alias);

        break;
      }
    }


    // -----------------------------------------------------
    // Prefix matches
    // -----------------------------------------------------

    if (
      view.name.startsWith(
        normalizedQuery
      )
    ) {
      score +=
        options.namePrefixBoost;

      matchTypes.add(
        "name-prefix"
      );
    }


    if (
      view.displayName.startsWith(
        normalizedQuery
      )
    ) {
      score +=
        options.displayPrefixBoost;

      matchTypes.add(
        "display-prefix"
      );
    }


    const aliasPrefix =
      view.aliases.find(
        alias =>
          alias.startsWith(
            normalizedQuery
          )
      );


    if (aliasPrefix) {
      score +=
        options.aliasPrefixBoost;

      matchTypes.add(
        "alias-prefix"
      );

      matchedTerms.add(
        aliasPrefix
      );
    }


    // -----------------------------------------------------
    // Full token matching
    // -----------------------------------------------------

    if (
      allTokensIncluded(
        queryTokens,
        view.nameTokens
      )
    ) {
      score +=
        options.allTokensNameBoost;

      matchTypes.add(
        "name-token-match"
      );
    }


    if (
      allTokensIncluded(
        queryTokens,
        view.displayTokens
      )
    ) {
      score +=
        options.allTokensDisplayBoost;

      matchTypes.add(
        "display-token-match"
      );
    }


    if (
      allTokensIncluded(
        queryTokens,
        view.aliasTokens
      )
    ) {
      score +=
        options.allTokensAliasBoost;

      matchTypes.add(
        "alias-token-match"
      );
    }


    // -----------------------------------------------------
    // Individual token matching
    // -----------------------------------------------------

    for (
      const queryToken
      of queryTokens
    ) {
      const exactToken =
        view.searchableTokens.includes(
          queryToken
        );


      if (exactToken) {
        score +=
          options.tokenContainsBoost;

        matchTypes.add(
          "token"
        );

        matchedTerms.add(
          queryToken
        );

        continue;
      }


      const prefixToken =
        view.searchableTokens.find(
          candidate =>
            candidate.startsWith(
              queryToken
            )
        );


      if (prefixToken) {
        score +=
          options.tokenPrefixBoost;

        matchTypes.add(
          "token-prefix"
        );

        matchedTerms.add(
          prefixToken
        );
      }
    }


    // -----------------------------------------------------
    // Semantic field boosts
    // -----------------------------------------------------

    if (
      view.preparation &&
      (
        view.preparation ===
          normalizedQuery ||
        queryTokens.includes(
          view.preparation
        )
      )
    ) {
      score +=
        options.preparationBoost;

      matchTypes.add(
        "preparation"
      );
    }


    if (
      view.state &&
      (
        view.state ===
          normalizedQuery ||
        queryTokens.includes(
          view.state
        )
      )
    ) {
      score +=
        options.stateBoost;

      matchTypes.add(
        "state"
      );
    }


    if (
      view.category &&
      (
        view.category ===
          normalizedQuery ||
        queryTokens.includes(
          view.category
        )
      )
    ) {
      score +=
        options.categoryBoost;

      matchTypes.add(
        "category"
      );
    }


    if (
      view.brand &&
      (
        view.brand.includes(
          normalizedQuery
        ) ||
        normalizedQuery.includes(
          view.brand
        )
      )
    ) {
      score +=
        options.brandBoost;

      matchTypes.add(
        "brand"
      );
    }


    if (
      view.restaurant &&
      (
        view.restaurant.includes(
          normalizedQuery
        ) ||
        normalizedQuery.includes(
          view.restaurant
        )
      )
    ) {
      score +=
        options.restaurantBoost;

      matchTypes.add(
        "restaurant"
      );
    }


    if (
      view.tags.some(
        tag =>
          tag ===
            normalizedQuery ||
          queryTokens.includes(tag)
      )
    ) {
      score +=
        options.tagBoost;

      matchTypes.add(
        "tag"
      );
    }


    // -----------------------------------------------------
    // Fuzzy typo matching
    // -----------------------------------------------------

    let fuzzyScore = 0;


    if (
      options.typoTolerance === true &&
      score <
        options.namePrefixBoost
    ) {
      let fuzzyMatches = 0;


      for (
        const queryToken
        of queryTokens
      ) {
        // Very short tokens create too much fuzzy noise.
        if (
          queryToken.length < 4
        ) {
          continue;
        }


        const best =
          bestTokenSimilarity(
            queryToken,
            view.searchableTokens
          );


        if (
          best >=
          options.fuzzyThreshold
        ) {
          fuzzyMatches += 1;

          fuzzyScore +=
            best *
            options.fuzzyTokenBoost;

          matchTypes.add(
            "fuzzy"
          );
        }
      }


      // Require every substantial token to have a
      // reasonable fuzzy relationship when the query
      // contains multiple words.
      const substantialTokens =
        queryTokens.filter(
          token =>
            token.length >= 4
        );


      if (
        substantialTokens.length > 1 &&
        fuzzyMatches <
          substantialTokens.length
      ) {
        fuzzyScore *= 0.35;
      }


      score += fuzzyScore;
    }


    // -----------------------------------------------------
    // Popularity tie-breaker
    // -----------------------------------------------------

    const popularity =
      clamp(
        safeNumber(
          document.popularity,
          0
        ),
        0,
        100
      );


    if (score > 0) {
      score +=
        popularity *
        options.popularityWeight;
    }


    return {
      score,
      fuzzyScore,
      matchTypes:
        Array.from(matchTypes),
      matchedTerms:
        Array.from(matchedTerms)
    };
  }


  // =====================================================
  // SORTING
  // =====================================================

  function compareScoredResults(
    left,
    right
  ) {
    if (
      right.score !== left.score
    ) {
      return (
        right.score -
        left.score
      );
    }


    const popularityDifference =
      safeNumber(
        right.document.popularity,
        0
      ) -
      safeNumber(
        left.document.popularity,
        0
      );


    if (
      popularityDifference !== 0
    ) {
      return popularityDifference;
    }


    return cleanString(
      left.document.displayName
    ).localeCompare(
      cleanString(
        right.document.displayName
      )
    );
  }


  // =====================================================
  // RESULT HYDRATION
  // =====================================================

  function hydrateResults(
    registry,
    scoredResults,
    options
  ) {
    const ids =
      scoredResults.map(
        item =>
          item.document.id
      );


    const foods =
      registry.resolveIds(ids);


    const foodMap =
      new Map(
        foods.map(
          food => [
            food.id,
            food
          ]
        )
      );


    const hydrated = [];


    for (
      const scored
      of scoredResults
    ) {
      const food =
        foodMap.get(
          scored.document.id
        );


      if (!food) {
        continue;
      }


      if (
        options.includeSearchMeta ===
        true
      ) {
        food.search = {
          score:
            Math.round(
              scored.score * 100
            ) / 100,

          matchTypes:
            [...scored.matchTypes],

          matchedTerms:
            [...scored.matchedTerms]
        };
      } else if (
        options.includeScore === true
      ) {
        food.score =
          Math.round(
            scored.score * 100
          ) / 100;
      }


      hydrated.push(food);
    }


    return hydrated;
  }


  // =====================================================
  // POPULAR FOODS
  // =====================================================

  function getPopular(options = {}) {
    const registry =
      getRegistry();

    if (!registry) {
      state.lastError =
        "AriFoodRegistry is not available.";

      return [];
    }


    const normalizedOptions =
      normalizeOptions(options);


    let documents =
      registry
        .getSearchDocuments()
        .filter(
          document =>
            documentPassesFilters(
              document,
              normalizedOptions
            )
        );


    documents.sort(
      (left, right) => {
        const popularityDifference =
          safeNumber(
            right.popularity,
            0
          ) -
          safeNumber(
            left.popularity,
            0
          );

        if (
          popularityDifference !== 0
        ) {
          return popularityDifference;
        }

        return cleanString(
          left.displayName
        ).localeCompare(
          cleanString(
            right.displayName
          )
        );
      }
    );


    documents =
      documents.slice(
        0,
        normalizedOptions.limit
      );


    return registry.resolveIds(
      documents.map(
        document =>
          document.id
      )
    );
  }


  // =====================================================
  // SEARCH
  // =====================================================

  function search(
    query,
    options = {}
  ) {
    const startedAt =
      nowMs();


    state.searches += 1;
    state.lastError = null;


    const registry =
      getRegistry();


    if (!registry) {
      const message =
        "AriFoodRegistry is not available.";

      state.lastError =
        message;

      state.lastResultCount = 0;
      state.lastDurationMs =
        nowMs() - startedAt;

      console.warn(
        `[AriFoodSearch] ${message}`
      );

      return [];
    }


    const normalizedOptions =
      normalizeOptions(options);


    const normalizedQuery =
      normalizeText(query);


    state.lastQuery =
      cleanString(query);

    state.lastSearchAt =
      new Date().toISOString();


    // -----------------------------------------------------
    // Empty query behavior
    // -----------------------------------------------------

    if (!normalizedQuery) {
      state.emptySearches += 1;


      const results =
        normalizedOptions
          .allowEmptyQuery === true
          ? getPopular(
              normalizedOptions
            )
          : [];


      state.lastResultCount =
        results.length;

      state.lastDurationMs =
        nowMs() - startedAt;


      return results;
    }


    if (
      normalizedQuery.length <
      normalizedOptions.minQueryLength
    ) {
      state.lastResultCount = 0;
      state.lastDurationMs =
        nowMs() - startedAt;

      return [];
    }


    const queryTokens =
      tokenize(
        normalizedQuery
      );


    const documents =
      registry
        .getSearchDocuments()
        .filter(
          document =>
            documentPassesFilters(
              document,
              normalizedOptions
            )
        );


    const scoredResults = [];


    for (
      const document
      of documents
    ) {
      const result =
        scoreDocument(
          document,
          normalizedQuery,
          queryTokens,
          normalizedOptions
        );


      if (
        result.score <= 0
      ) {
        continue;
      }


      if (
        result.fuzzyScore > 0
      ) {
        state.fuzzySearches += 1;
      }


      scoredResults.push({
        document,
        score:
          result.score,
        matchTypes:
          result.matchTypes,
        matchedTerms:
          result.matchedTerms
      });
    }


    scoredResults.sort(
      compareScoredResults
    );


    const limited =
      scoredResults.slice(
        0,
        normalizedOptions.limit
      );


    const results =
      hydrateResults(
        registry,
        limited,
        normalizedOptions
      );


    state.lastResultCount =
      results.length;

    state.lastDurationMs =
      nowMs() - startedAt;


    return results;
  }


  // =====================================================
  // AUTOCOMPLETE ALIAS
  // =====================================================

  function suggest(
    query,
    options = {}
  ) {
    return search(
      query,
      {
        limit: 8,
        ...options
      }
    );
  }


  // =====================================================
  // EXACT RESOLUTION
  // =====================================================

  function findExact(
    query,
    options = {}
  ) {
    const registry =
      getRegistry();

    if (!registry) {
      return null;
    }


    const normalizedQuery =
      normalizeText(query);

    if (!normalizedQuery) {
      return null;
    }


    const normalizedOptions =
      normalizeOptions({
        ...options,
        limit: 50
      });


    const documents =
      registry
        .getSearchDocuments()
        .filter(
          document =>
            documentPassesFilters(
              document,
              normalizedOptions
            )
        );


    const matches = [];


    for (
      const document
      of documents
    ) {
      const name =
        normalizeText(
          document.name
        );

      const displayName =
        normalizeText(
          document.displayName
        );

      const aliases =
        uniqueStrings(
          document.aliases
        );


      let priority = null;


      if (
        name ===
        normalizedQuery
      ) {
        priority = 3;
      } else if (
        displayName ===
        normalizedQuery
      ) {
        priority = 2;
      } else if (
        aliases.includes(
          normalizedQuery
        )
      ) {
        priority = 1;
      }


      if (priority !== null) {
        matches.push({
          document,
          priority
        });
      }
    }


    matches.sort(
      (left, right) => {
        if (
          right.priority !==
          left.priority
        ) {
          return (
            right.priority -
            left.priority
          );
        }

        return (
          safeNumber(
            right.document.popularity,
            0
          ) -
          safeNumber(
            left.document.popularity,
            0
          )
        );
      }
    );


    if (
      matches.length === 0
    ) {
      return null;
    }


    return registry.getById(
      matches[0].document.id
    );
  }


  // =====================================================
  // MATCH PREVIEW
  // =====================================================

  /**
   * Useful for diagnostics and testing search quality.
   *
   * Returns lightweight scoring information without
   * hydrating full food records.
   */

  function explain(
    query,
    options = {}
  ) {
    const registry =
      getRegistry();

    if (!registry) {
      return {
        ok: false,
        query:
          cleanString(query),
        normalizedQuery:
          normalizeText(query),
        results: [],
        error:
          "AriFoodRegistry is not available."
      };
    }


    const normalizedOptions =
      normalizeOptions(options);

    const normalizedQuery =
      normalizeText(query);

    const queryTokens =
      tokenize(
        normalizedQuery
      );


    if (!normalizedQuery) {
      return {
        ok: true,
        query:
          cleanString(query),
        normalizedQuery,
        results: []
      };
    }


    const scored = [];


    for (
      const document
      of registry.getSearchDocuments()
    ) {
      if (
        !documentPassesFilters(
          document,
          normalizedOptions
        )
      ) {
        continue;
      }


      const result =
        scoreDocument(
          document,
          normalizedQuery,
          queryTokens,
          normalizedOptions
        );


      if (
        result.score <= 0
      ) {
        continue;
      }


      scored.push({
        id:
          document.id,

        displayName:
          document.displayName,

        score:
          Math.round(
            result.score * 100
          ) / 100,

        matchTypes:
          result.matchTypes,

        matchedTerms:
          result.matchedTerms,

        popularity:
          document.popularity
      });
    }


    scored.sort(
      (left, right) =>
        right.score -
        left.score
    );


    return {
      ok: true,

      query:
        cleanString(query),

      normalizedQuery,

      resultCount:
        scored.length,

      results:
        scored.slice(
          0,
          normalizedOptions.limit
        )
    };
  }


  // =====================================================
  // DIAGNOSTICS
  // =====================================================

  function getDiagnostics() {
    const registry =
      getRegistry();


    return {
      engine:
        "AriFoodSearch",

      version:
        VERSION,

      ready:
        registry !== null,

      registryVersion:
        registry?.VERSION ||
        null,

      defaults: {
        limit:
          DEFAULT_OPTIONS.limit,

        typoTolerance:
          DEFAULT_OPTIONS.typoTolerance,

        fuzzyThreshold:
          DEFAULT_OPTIONS.fuzzyThreshold
      },

      activity: {
        ...state
      }
    };
  }


  // =====================================================
  // HEALTH CHECK
  // =====================================================

  function healthCheck() {
    const registry =
      getRegistry();


    if (!registry) {
      return {
        ok: false,

        issues: [
          {
            code:
              "registry_unavailable",

            message:
              "AriFoodRegistry is not available."
          }
        ]
      };
    }


    const issues = [];


    if (
      typeof registry.getSearchDocuments !==
      "function"
    ) {
      issues.push({
        code:
          "missing_getSearchDocuments",

        message:
          "AriFoodRegistry.getSearchDocuments() is required."
      });
    }


    if (
      typeof registry.resolveIds !==
      "function"
    ) {
      issues.push({
        code:
          "missing_resolveIds",

        message:
          "AriFoodRegistry.resolveIds() is required."
      });
    }


    if (
      typeof registry.getById !==
      "function"
    ) {
      issues.push({
        code:
          "missing_getById",

        message:
          "AriFoodRegistry.getById() is required."
      });
    }


    return {
      ok:
        issues.length === 0,

      registryVersion:
        registry.VERSION ||
        null,

      searchableFoods:
        typeof registry.count ===
        "function"
          ? registry.count()
          : null,

      issues
    };
  }


  // =====================================================
  // PUBLIC API
  // =====================================================

  const AriFoodSearch =
    Object.freeze({
      VERSION,

      // Primary search
      search,
      suggest,
      findExact,
      getPopular,

      // Utilities
      normalizeText,
      tokenize,
      similarity,

      // Diagnostics
      explain,
      getDiagnostics,
      healthCheck,
      isReady
    });


  // =====================================================
  // GLOBAL EXPORT
  // =====================================================

  global.AriFoodSearch =
    AriFoodSearch;


  // =====================================================
  // READY EVENT
  // =====================================================

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-search-ready",
        {
          detail: {
            version:
              VERSION
          }
        }
      )
    );
  } catch (error) {
    // Non-browser test environments may not
    // support CustomEvent.
  }


  // =====================================================
  // INITIALIZATION
  // =====================================================

  console.info(
    `[ARI Nutrition] AriFoodSearch v${VERSION} ready.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
