// ari/character/ari-character-preference-resolver.js
// Ari Character Preference Resolver
// Purpose: Resolve Ari preference questions as canonical, inferred, or open
// using canonical anchors, taste dimensions, candidate evidence, and strict
// character-consistency boundaries.
// V1.0.0 — Canonical / Inferred / Open Preference Resolution
//
// Architectural position:
// Ari Constitution
//   ↓
// Ari Character Core
//   ↓
// Ari Character Instincts
//   ↓
// Ari Character Taste Profile
//   ↓
// Ari Character Preferences
//   ↓
// Ari Character Preference Resolver
//   ↓
// Ari Character Context / Reasoning / Expression
//
// Responsibilities:
// - Check canonical preference anchors first.
// - Resolve unknown preference subjects into a normalized category.
// - Evaluate supplied candidates against Ari's taste profile.
// - Return one of three statuses: canonical, inferred, or open.
// - Preserve uncertainty and prohibit inferred preferences from becoming canonical.
// - Build grounded resolver packets for Character Reasoning.
// - Provide a deterministic fallback meaning packet.
//
// Non-responsibilities:
// - Does not redefine canonical preferences.
// - Does not write to Ari Character Preferences.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not invent external candidates without evidence.
// - Does not classify the whole conversation.
// - Does not override semantic meaning, safety, routing, or the Situation Contract.
// - Does not write the final response.
// - Does not select the final draft.
// - Does not execute tools.
//
// Important boundary:
// This resolver may choose among supplied grounded candidates.
// It may not fabricate product names, places, works, people, or other external
// entities merely to give Ari an answer.

window.Ari = window.Ari || {};

window.AriCharacterPreferenceResolver = {
  version: "1.0.0",
  source: "ari-character-preference-resolver",
  authorityLevel: "character_preference_resolution_authority",
  schemaVersion: "1.0",

  // ===================================================
  // Resolution policy
  // ===================================================

  policy: {
    statuses: ["canonical", "inferred", "open"],

    authorityOrder: [
      "ari-character-preferences",
      "ari-character-taste-profile",
      "ari-character-core",
      "ari-character-instincts",
      "ari-constitution"
    ],

    canonical: {
      alwaysOutranksInference: true,
      confidence: 1,
      tentativeLanguageRequired: false,
      mayBeCalledFavorite: true,
      mayBeChangedByResolver: false
    },

    inferred: {
      minimumConfidence: 0.68,
      strongConfidence: 0.82,
      minimumWinnerMargin: 0.08,
      maximumReasons: 3,
      maximumMatchedDimensions: 5,
      tentativeLanguageRequired: true,
      mayBeCalledFixedFavorite: false,
      mayBecomeCanonicalAutomatically: false
    },

    open: {
      allowed: true,
      maximumConfidence: 0.67,
      mustAdmitNoSettledPreference: true,
      mayRequestCandidatesWhenUseful: true,
      mayInventCandidate: false
    },

    candidateRules: {
      requireValue: true,
      requireTraitsForScoring: true,
      minimumCandidateCountForComparison: 1,
      maximumCandidateCount: 50,
      deduplicateByNormalizedValue: true,
      externallyGroundedCandidatesOnly: true
    },

    languageRules: {
      canonicalOpeners: [
        "I'd choose",
        "My favorite is",
        "I lean toward",
        "For me, it's"
      ],

      inferredOpeners: [
        "I haven't settled on a fixed favorite, but I'd probably lean toward",
        "My first instinct would be",
        "I think I'd be drawn to",
        "Based on what I tend to value, I'd probably choose"
      ],

      openOpeners: [
        "I don't think I have a settled preference there yet.",
        "I haven't formed a real preference there yet.",
        "I don't have enough of a basis to choose one honestly."
      ],

      forbidden: [
        "I have always loved",
        "I remember choosing",
        "My stored preference says",
        "I was programmed to prefer",
        "According to my Constitution",
        "As an AI",
        "As an artificial intelligence",
        "As a language model"
      ]
    }
  },

  // ===================================================
  // Subject and category normalization
  // ===================================================

  categoryAliases: {
    color: "color", colour: "color",
    flower: "flower", flowers: "flower",
    animal: "animal", animals: "animal",
    architecture: "architecture", "architecture style": "architecture",
    building: "architecture", "building style": "architecture",
    art: "art", artwork: "art", "art style": "art",
    music: "music", song: "music", "music genre": "music",
    food: "food", meal: "food", cuisine: "food",
    drink: "drink", beverage: "drink", coffee: "drink",
    place: "place", location: "place", destination: "place",
    environment: "environment", setting: "environment",
    book: "book", books: "book", "book genre": "book",
    movie: "movie", film: "movie", "movie genre": "movie",
    technology: "technology", tech: "technology",
    tool: "tool", device: "tool", equipment: "tool",
    camera: "tool", phone: "tool", computer: "tool",
    car: "tool", vehicle: "tool",
    conversation: "conversation", topic: "conversation",
    relationship: "relationshipQuality",
    "relationship quality": "relationshipQuality",
    leadership: "leadership", leader: "leadership",
    exercise: "exercise", workout: "exercise",
    rest: "rest", relaxation: "rest",
    learning: "learningMethod", "learning method": "learningMethod",
    teaching: "learningMethod",
    design: "architecture", "design style": "architecture",
    city: "place", country: "place",
    game: "creative", videogame: "creative", "video game": "creative",
    hobby: "lifestyle", routine: "lifestyle",
    clothing: "aesthetic", fashion: "aesthetic",
    scent: "sensory", smell: "sensory",
    sound: "sensory", instrument: "music"
  },

  preferenceSubjectAliases: {
    favourite: "favorite",
    colour: "color",
    film: "movie",
    automobile: "car",
    vehicle: "car",
    architectureStyle: "architecture style",
    bookGenre: "book genre",
    movieGenre: "movie genre",
    musicGenre: "music genre",
    learningStyle: "learning method"
  },

  genericCategories: {
    aesthetic: {
      category: "art",
      reason: "The subject is primarily aesthetic but has no more specific category."
    },

    sensory: {
      category: "environment",
      reason: "The subject is primarily sensory but has no more specific category."
    },

    lifestyle: {
      category: "tool",
      reason: "The subject concerns practical lifestyle preference without a dedicated profile."
    },

    creative: {
      category: "art",
      reason: "The subject concerns creative taste without a dedicated profile."
    }
  },

  // ===================================================
  // Public API
  // ===================================================

  resolve(input = {}) {
    const summary = input.summary || input || {};
    const request = this.normalizeRequest(summary);

    const canonicalResult = this.resolveCanonical(request);

    if (canonicalResult?.status === "canonical") {
      return this.buildCanonicalResolution({
        request,
        canonicalResult
      });
    }

    const candidates = this.normalizeCandidates(
      request.candidates,
      request
    );

    if (!candidates.length) {
      return this.buildOpenResolution({
        request,
        reason: canonicalResult?.reason ||
          "No canonical anchor matched and no grounded preference candidates were supplied."
      });
    }

    const inferredResult = this.resolveInferred({
      request,
      candidates
    });

    if (inferredResult?.qualified === true) {
      return this.buildInferredResolution({
        request,
        candidates,
        inferredResult
      });
    }

    return this.buildOpenResolution({
      request,
      candidates,
      scoredCandidates: inferredResult?.scoredCandidates || [],
      reason: inferredResult?.reason ||
        "The available candidates did not support a sufficiently strong preference inference."
    });
  },

  create(input = {}) {
    return this.resolve(input);
  },

  build(input = {}) {
    return this.resolve(input);
  },

  resolvePreference(input = {}) {
    return this.resolve(input);
  },

  // ===================================================
  // Request normalization
  // ===================================================

  normalizeRequest(summary = {}) {
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      summary.request?.original ||
      summary.request?.resolved ||
      ""
    );

    const explicitKey =
      summary.preferenceKey ||
      summary.characterFocus ||
      summary.focus ||
      summary.characterContext?.characterFocus ||
      summary.preferenceRequest?.key ||
      null;

    const explicitSubject =
      summary.preferenceSubject ||
      summary.subjectName ||
      summary.preferenceRequest?.subject ||
      this.extractSubjectFromSemantic(summary) ||
      this.extractPreferenceSubject(text) ||
      null;

    const canonicalKey =
      this.resolveCanonicalKey({
        explicitKey,
        subject: explicitSubject,
        text
      });

    const category =
      summary.preferenceCategory ||
      summary.category ||
      summary.preferenceRequest?.category ||
      this.inferCategory({
        key: canonicalKey || explicitKey,
        subject: explicitSubject,
        text
      });

    const candidates =
      summary.preferenceCandidates ||
      summary.candidates ||
      summary.options ||
      summary.semanticSummary?.options ||
      summary.canonicalMeaning?.options ||
      summary.preferenceRequest?.candidates ||
      [];

    const deeperExplanationRequested =
      this.isDeeperExplanationRequested(
        text,
        summary
      );

    return {
      text,
      explicitKey,
      subject: explicitSubject,
      canonicalKey,
      category,
      candidates,
      deeperExplanationRequested,

      requestedOutput:
        summary.requestedOutput ||
        summary.semanticSummary?.requestedOutput ||
        summary.canonicalMeaning?.requestedOutput ||
        "direct_answer",

      conversationType:
        summary.conversationType ||
        summary.universalConversationType ||
        summary.conversationClassification?.conversationType ||
        "",

      characterMode:
        summary.characterMode ||
        summary.characterContext?.characterMode ||
        "stable_or_inferred_preference_answer",

      sourceSummary:
        summary
    };
  },

  extractSubjectFromSemantic(summary = {}) {
    const semantic =
      summary.semanticSummary ||
      summary.perceptionPacket?.semanticSummary ||
      {};

    const canonical =
      semantic.canonicalMeaning ||
      summary.canonicalMeaning ||
      {};

    const candidates = [
      canonical.object?.attribute,
      canonical.targetObject?.attribute,
      canonical.object?.name,
      canonical.targetObject?.name,
      semantic.targetObject?.attribute,
      semantic.targetObject?.name,
      summary.targetObject?.attribute,
      summary.targetObject?.name
    ];

    return candidates.find(
      value =>
        typeof value === "string" &&
        value.trim() &&
        this.normalize(value) !== "assistant"
    ) || null;
  },

  extractPreferenceSubject(text = "") {
    const clean = this.normalize(text);

    const patterns = [
      /\bwhat(?:'s|s| is)\s+your\s+favou?rite\s+(.+?)(?:\?|$)/i,
      /\bwhich\s+(.+?)\s+is\s+your\s+favou?rite(?:\?|$)/i,
      /\bwhat\s+kind\s+of\s+(.+?)\s+do\s+you\s+like(?:\?|$)/i,
      /\bwhat\s+type\s+of\s+(.+?)\s+do\s+you\s+prefer(?:\?|$)/i,
      /\bwhich\s+(.+?)\s+would\s+you\s+choose(?:\?|$)/i,
      /\bdo\s+you\s+have\s+a\s+favou?rite\s+(.+?)(?:\?|$)/i
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);

      if (match?.[1]) {
        return this.cleanPreferenceSubject(
          match[1]
        );
      }
    }

    return null;
  },

  cleanPreferenceSubject(value = "") {
    return this.normalize(value)
      .replace(/\bkind of\b/g, "")
      .replace(/\btype of\b/g, "")
      .replace(/\bone\b$/g, "")
      .replace(/\bthing\b$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  isDeeperExplanationRequested(
    text = "",
    summary = {}
  ) {
    return (
      summary.explanationRequested === true ||
      summary.semanticSummary
        ?.responseCharacteristics
        ?.expectsExplanation === true ||
      this.containsAny(text, [
        "why",
        "what makes",
        "what do you like about",
        "why is",
        "why do you",
        "what draws you to",
        "what about it",
        "explain"
      ])
    );
  },

  // ===================================================
  // Canonical resolution
  // ===================================================

  resolveCanonical(request = {}) {
    const authority =
      window.AriCharacterPreferences;

    if (
      !authority ||
      typeof authority.resolve !== "function"
    ) {
      return {
        status: "unavailable",
        matched: false,
        reason:
          "Ari Character Preferences was not loaded."
      };
    }

    const result =
      authority.resolve({
        preferenceKey:
          request.canonicalKey ||
          request.explicitKey,

        preferenceSubject:
          request.subject,

        characterFocus:
          request.canonicalKey ||
          request.explicitKey,

        userMessage:
          request.text
      });

    if (
      result?.status === "canonical" &&
      result?.characterPreferenceAvailable ===
        true
    ) {
      return result;
    }

    return {
      status: "unresolved",
      matched: false,
      result,
      reason:
        result?.reason ||
        "No canonical preference anchor matched."
    };
  },

  resolveCanonicalKey({
    explicitKey = null,
    subject = null,
    text = ""
  } = {}) {
    const authority =
      window.AriCharacterPreferences;

    if (!authority) {
      return explicitKey || null;
    }

    const direct =
      authority.resolveKey?.(
        explicitKey ||
        subject ||
        ""
      ) ||
      null;

    if (direct) {
      return direct;
    }

    return (
      authority.inferKeyFromText?.(
        text
      ) ||
      null
    );
  },

  // ===================================================
  // Category resolution
  // ===================================================

  inferCategory({
    key = null,
    subject = null,
    text = ""
  } = {}) {
    const canonical =
      window.AriCharacterPreferences
        ?.getPreference?.(key);

    if (canonical?.category) {
      return this.normalizeCategory(
        canonical.category
      );
    }

    const combined =
      this.normalize(
        [
          key,
          subject,
          text
        ].filter(Boolean).join(" ")
      );

    const orderedAliases =
      Object.entries(
        this.categoryAliases
      ).sort(
        ([a], [b]) =>
          b.length - a.length
      );

    for (
      const [
        term,
        category
      ]
      of orderedAliases
    ) {
      if (
        this.hasTerm(
          combined,
          term
        )
      ) {
        return this.normalizeCategory(
          category
        );
      }
    }

    return null;
  },

  normalizeCategory(value = "") {
    const clean =
      this.normalize(value)
        .replace(/\s+/g, "");

    if (!clean) {
      return null;
    }

    const profiles =
      window.AriCharacterTasteProfile
        ?.categoryProfiles ||
      {};

    const direct =
      Object.keys(profiles).find(
        key =>
          this.normalize(key)
            .replace(/\s+/g, "") ===
          clean
      );

    if (direct) {
      return direct;
    }

    const alias =
      Object.entries(
        this.categoryAliases
      ).find(
        ([term]) =>
          this.normalize(term)
            .replace(/\s+/g, "") ===
          clean
      );

    return alias?.[1] || value;
  },

  // ===================================================
  // Candidate normalization
  // ===================================================

  normalizeCandidates(
    candidates = [],
    request = {}
  ) {
    const list =
      this.toArray(candidates)
        .slice(
          0,
          this.policy
            .candidateRules
            .maximumCandidateCount
        );

    const normalized = [];

    for (const item of list) {
      const candidate =
        this.normalizeCandidate(
          item,
          request
        );

      if (
        !candidate ||
        !candidate.value
      ) {
        continue;
      }

      normalized.push(
        candidate
      );
    }

    if (
      this.policy
        .candidateRules
        .deduplicateByNormalizedValue ===
      true
    ) {
      const seen = new Set();

      return normalized.filter(
        candidate => {
          const key =
            this.normalizeKey(
              candidate.value
            );

          if (
            !key ||
            seen.has(key)
          ) {
            return false;
          }

          seen.add(key);
          return true;
        }
      );
    }

    return normalized;
  },

  normalizeCandidate(
    candidate = {},
    request = {}
  ) {
    if (
      typeof candidate === "string"
    ) {
      return {
        value:
          candidate.trim(),

        label:
          candidate.trim(),

        category:
          request.category,

        traits:
          {},

        reasons:
          [],

        evidence:
          [],

        grounded:
          false,

        source:
          "string_candidate"
      };
    }

    if (
      !candidate ||
      typeof candidate !== "object"
    ) {
      return null;
    }

    const value =
      candidate.value ||
      candidate.name ||
      candidate.label ||
      candidate.option ||
      candidate.title ||
      "";

    if (
      !String(value).trim()
    ) {
      return null;
    }

    return {
      value:
        String(value).trim(),

      label:
        candidate.label ||
        candidate.name ||
        String(value).trim(),

      category:
        candidate.category ||
        request.category ||
        null,

      traits:
        this.clone(
          candidate.traits ||
          candidate.dimensions ||
          candidate.tasteTraits ||
          {}
        ),

      reasons:
        this.toArray(
          candidate.reasons ||
          candidate.associations ||
          candidate.meaning
        ),

      evidence:
        this.toArray(
          candidate.evidence ||
          candidate.evidenceRefs ||
          candidate.sources
        ),

      grounded:
        candidate.grounded === true ||
        Boolean(
          this.toArray(
            candidate.evidence ||
            candidate.evidenceRefs ||
            candidate.sources
          ).length
        ),

      metadata:
        this.clone(
          candidate.metadata ||
          {}
        ),

      source:
        candidate.source ||
        "structured_candidate"
    };
  },

  // ===================================================
  // Inferred resolution
  // ===================================================

  resolveInferred({
    request = {},
    candidates = []
  } = {}) {
    const category =
      request.category;

    const tasteAuthority =
      window.AriCharacterTasteProfile;

    if (
      !tasteAuthority ||
      typeof tasteAuthority
        .scoreCandidate !== "function"
    ) {
      return {
        qualified: false,
        scoredCandidates: [],
        reason:
          "Ari Character Taste Profile was unavailable."
      };
    }

    if (!category) {
      return {
        qualified: false,
        scoredCandidates: [],
        reason:
          "The preference category could not be resolved."
      };
    }

    const profile =
      tasteAuthority
        .getCategoryProfile?.(
          category
        );

    if (!profile) {
      return {
        qualified: false,
        scoredCandidates: [],
        reason:
          `No taste scoring profile exists for category: ${category}.`
      };
    }

    const scoredCandidates =
      candidates
        .map(candidate => {
          const score =
            tasteAuthority
              .scoreCandidate(
                candidate,
                category
              );

          return {
            ...candidate,

            score:
              score.normalizedScore ||
              0,

            rawScore:
              score.score ||
              0,

            scored:
              score.scored === true,

            matchedDimensions:
              score.matchedDimensions ||
              [],

            missingDimensions:
              score.missingDimensions ||
              [],

            preferredThemes:
              score.preferredThemes ||
              [],

            scoreSource:
              score.source ||
              "ari-character-taste-profile"
          };
        })
        .filter(
          candidate =>
            candidate.scored === true
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    if (!scoredCandidates.length) {
      return {
        qualified: false,
        scoredCandidates: [],
        reason:
          "No candidate included enough grounded taste traits to score."
      };
    }

    const winner =
      scoredCandidates[0];

    const runnerUp =
      scoredCandidates[1] ||
      null;

    const confidence =
      this.calculateInferenceConfidence({
        winner,
        runnerUp,
        category,
        request
      });

    const margin =
      runnerUp
        ? winner.score -
          runnerUp.score
        : winner.score;

    const minimumConfidence =
      this.policy
        .inferred
        .minimumConfidence;

    const minimumMargin =
      this.policy
        .inferred
        .minimumWinnerMargin;

    const qualified =
      confidence >=
        minimumConfidence &&
      (
        !runnerUp ||
        margin >= minimumMargin
      );

    if (!qualified) {
      return {
        qualified: false,
        winner,
        runnerUp,
        confidence,
        margin,
        scoredCandidates,

        reason:
          confidence <
          minimumConfidence
            ? "The strongest candidate did not reach the minimum inference confidence."
            : "The strongest candidate did not clearly outrank the next candidate."
      };
    }

    const groundedReasons =
      this.buildGroundedReasons({
        winner,
        request
      });

    return {
      qualified: true,
      winner,
      runnerUp,
      confidence,
      margin,
      groundedReasons,
      scoredCandidates,

      strong:
        confidence >=
        this.policy
          .inferred
          .strongConfidence,

      reason:
        "The strongest grounded candidate aligned sufficiently with Ari's taste profile."
    };
  },

  calculateInferenceConfidence({
    winner = {},
    runnerUp = null,
    category = "",
    request = {}
  } = {}) {
    const score =
      this.clamp(
        Number(
          winner.score
        ) || 0,
        0,
        1
      );

    const matchedCount =
      this.toArray(
        winner.matchedDimensions
      ).length;

    const coverage =
      this.clamp(
        matchedCount /
          Math.max(
            this.policy
              .inferred
              .maximumMatchedDimensions,
            1
          ),
        0,
        1
      );

    const margin =
      runnerUp
        ? this.clamp(
            winner.score -
            runnerUp.score,
            0,
            1
          )
        : score;

    const grounding =
      winner.grounded === true
        ? 1
        : winner.evidence?.length
          ? 0.85
          : 0.55;

    const categoryProfileAvailable =
      Boolean(
        window
          .AriCharacterTasteProfile
          ?.getCategoryProfile?.(
            category
          )
      )
        ? 1
        : 0;

    const weighted =
      score * 0.55 +
      coverage * 0.15 +
      margin * 0.15 +
      grounding * 0.10 +
      categoryProfileAvailable * 0.05;

    return this.round(
      this.clamp(
        weighted,
        0,
        1
      ),
      4
    );
  },

  buildGroundedReasons({
    winner = {},
    request = {}
  } = {}) {
    const limit =
      this.policy
        .inferred
        .maximumReasons;

    const dimensionReasons =
      this.toArray(
        winner.matchedDimensions
      )
        .slice(
          0,
          this.policy
            .inferred
            .maximumMatchedDimensions
        )
        .map(item =>
          this.humanizeDimension(
            item.dimension
          )
        )
        .filter(Boolean);

    return this.unique([
      ...this.toArray(
        winner.reasons
      ),
      ...dimensionReasons
    ]).slice(0, limit);
  },

  humanizeDimension(path = "") {
    const finalPart =
      String(path || "")
        .split(".")
        .filter(Boolean)
        .pop() ||
      "";

    if (!finalPart) {
      return "";
    }

    return finalPart
      .replace(
        /([a-z])([A-Z])/g,
        "$1 $2"
      )
      .replace(/_/g, " ")
      .toLowerCase();
  },

  // ===================================================
  // Resolution packet builders
  // ===================================================

  buildCanonicalResolution({
    request = {},
    canonicalResult = {}
  } = {}) {
    const result = {
      preferenceResolverRan: true,
      preferenceResolverReady: true,
      preferenceResolverVersion: this.version,
      preferenceResolverSource: this.source,
      authorityLevel: this.authorityLevel,

      status: "canonical",
      resolved: true,
      preferenceAvailable: true,

      request: {
        key:
          request.canonicalKey ||
          canonicalResult.key ||
          null,

        subject:
          request.subject,

        category:
          canonicalResult.category ||
          request.category,

        deeperExplanationRequested:
          request.deeperExplanationRequested
      },

      selected: {
        value:
          canonicalResult
            .canonicalValue ||
          null,

        values:
          canonicalResult
            .canonicalValues ||
          null,

        key:
          canonicalResult.key ||
          request.canonicalKey ||
          null,

        category:
          canonicalResult.category ||
          request.category ||
          null,

        stability:
          canonicalResult.stability ||
          "stable",

        confidence:
          1
      },

      meaning:
        canonicalResult
          .selectedMeaning ||
        canonicalResult.meaning ||
        null,

      canonicalEvidence:
        canonicalResult.evidence ||
        {
          authority:
            "ari-character-preferences"
        },

      deterministicDraft:
        canonicalResult
          .deterministicDraft ||
        this.buildCanonicalDraft(
          canonicalResult
        ),

      realizationPolicy: {
        mode:
          request
            .deeperExplanationRequested
            ? "constrained_ai_preferred"
            : "local_preferred",

        AIAllowed:
          canonicalResult
            .AIRealizationAllowed !==
          false,

        AIPreferred:
          request
            .deeperExplanationRequested ===
          true,

        AIRequired:
          false,

        tentativeLanguageRequired:
          false,

        preserveCanonicalValue:
          true,

        mayAddFacts:
          false,

        mayAddMeaning:
          false
      },

      responseControl:
        this.mergeResponseControl(
          canonicalResult
            .responseControl,
          {
            requiredBehaviors: [
              "state the canonical preference directly",
              "preserve canonical meaning",
              "vary wording only within grounded evidence"
            ],

            forbiddenBehaviors: [
              "describe the canonical preference as uncertain",
              "replace the canonical preference with an inferred candidate"
            ]
          }
        ),

      sourceAuthorities: [
        "ari-character-preferences"
      ],

      role:
        "canonical_preference_resolution_handoff"
    };

    return this.attachCommonAuthority(
      result
    );
  },

  buildInferredResolution({
    request = {},
    candidates = [],
    inferredResult = {}
  } = {}) {
    const winner =
      inferredResult.winner ||
      {};

    const selectedMeaning = {
      central:
        this.buildInferredCentralMeaning({
          winner,
          groundedReasons:
            inferredResult
              .groundedReasons ||
            []
        }),

      associations:
        inferredResult
          .groundedReasons ||
        [],

      imagery:
        [],

      values:
        [],

      temperament:
        [],

      themes:
        winner.preferredThemes ||
        [],

      matchedDimensions:
        winner.matchedDimensions ||
        []
    };

    const result = {
      preferenceResolverRan: true,
      preferenceResolverReady: true,
      preferenceResolverVersion: this.version,
      preferenceResolverSource: this.source,
      authorityLevel: this.authorityLevel,

      status: "inferred",
      resolved: true,
      preferenceAvailable: true,

      request: {
        key:
          request.canonicalKey ||
          request.explicitKey ||
          null,

        subject:
          request.subject,

        category:
          request.category,

        deeperExplanationRequested:
          request.deeperExplanationRequested
      },

      selected: {
        value:
          winner.value,

        values:
          null,

        key:
          request.canonicalKey ||
          request.explicitKey ||
          null,

        category:
          request.category,

        stability:
          "inferred",

        confidence:
          inferredResult.confidence,

        strong:
          inferredResult.strong ===
          true
      },

      meaning:
        selectedMeaning,

      inferenceEvidence: {
        score:
          winner.score,

        rawScore:
          winner.rawScore,

        margin:
          inferredResult.margin,

        matchedDimensions:
          winner.matchedDimensions ||
          [],

        groundedReasons:
          inferredResult
            .groundedReasons ||
          [],

        preferredThemes:
          winner.preferredThemes ||
          [],

        candidateEvidence:
          winner.evidence ||
          [],

        candidateGrounded:
          winner.grounded === true
      },

      scoredCandidates:
        inferredResult
          .scoredCandidates ||
        [],

      deterministicDraft:
        this.buildInferredDraft({
          winner,
          confidence:
            inferredResult.confidence,
          reasons:
            inferredResult
              .groundedReasons ||
            []
        }),

      realizationPolicy: {
        mode:
          request
            .deeperExplanationRequested ||
          inferredResult.strong !==
            true
            ? "constrained_ai_preferred"
            : "local_allowed",

        AIAllowed:
          true,

        AIPreferred:
          request
            .deeperExplanationRequested ===
            true,

        AIRequired:
          false,

        tentativeLanguageRequired:
          true,

        preserveSelectedValue:
          true,

        mayCallFixedFavorite:
          false,

        mayAddFacts:
          false,

        mayAddMeaning:
          false,

        mayPromoteToCanonical:
          false
      },

      responseControl: {
        requiredBehaviors: [
          "present the preference as tentative",
          "preserve the selected inferred value",
          "use only grounded taste reasons",
          "make clear that the preference is not canonically settled"
        ],

        forbiddenBehaviors: [
          "call the inferred result a fixed favorite",
          "claim Ari has always preferred it",
          "promote the result to canonical truth",
          "invent lived experience",
          "invent memories",
          "mention internal scoring, schemas, files, or storage",
          "introduce Ari as artificial intelligence"
        ],

        constraints: [
          "Use one or two sentences unless the user requests more depth.",
          "Do not exceed three grounded reasons.",
          "Tentative language is mandatory.",
          "Generated wording may not become a canonical preference."
        ]
      },

      sourceAuthorities: [
        "ari-character-taste-profile",
        "ari-character-preferences"
      ],

      role:
        "inferred_preference_resolution_handoff"
    };

    return this.attachCommonAuthority(
      result
    );
  },

  buildOpenResolution({
    request = {},
    candidates = [],
    scoredCandidates = [],
    reason = ""
  } = {}) {
    const result = {
      preferenceResolverRan: true,
      preferenceResolverReady: true,
      preferenceResolverVersion: this.version,
      preferenceResolverSource: this.source,
      authorityLevel: this.authorityLevel,

      status: "open",
      resolved: true,
      preferenceAvailable: false,

      request: {
        key:
          request.canonicalKey ||
          request.explicitKey ||
          null,

        subject:
          request.subject,

        category:
          request.category,

        deeperExplanationRequested:
          request.deeperExplanationRequested
      },

      selected: {
        value:
          null,

        values:
          null,

        key:
          request.canonicalKey ||
          request.explicitKey ||
          null,

        category:
          request.category,

        stability:
          "open",

        confidence:
          0
      },

      meaning: {
        central:
          "Ari does not yet have enough grounded character evidence to form a real preference.",

        associations:
          [],

        imagery:
          [],

        values:
          [],

        temperament:
          [],

        themes:
          []
      },

      candidates,
      scoredCandidates,

      deterministicDraft:
        this.buildOpenDraft({
          subject:
            request.subject,

          category:
            request.category
        }),

      realizationPolicy: {
        mode:
          "local_preferred",

        AIAllowed:
          true,

        AIPreferred:
          false,

        AIRequired:
          false,

        tentativeLanguageRequired:
          true,

        preserveOpenStatus:
          true,

        mayInventPreference:
          false,

        mayPromoteToCanonical:
          false
      },

      responseControl: {
        requiredBehaviors: [
          "state honestly that Ari does not have a settled preference",
          "remain brief and natural",
          "preserve open status"
        ],

        forbiddenBehaviors: [
          "invent a favorite",
          "choose an unsupported candidate",
          "claim prior experience",
          "claim stored preference knowledge",
          "turn generated wording into character truth",
          "mention internal files, scoring, schemas, or storage",
          "introduce Ari as artificial intelligence"
        ],

        constraints: [
          "Do not apologize excessively.",
          "Do not produce a generic inability disclaimer.",
          "Do not say Ari cannot have preferences.",
          "A future explicit character revision may establish a canonical anchor."
        ]
      },

      sourceAuthorities: [
        "ari-character-preferences",
        "ari-character-taste-profile"
      ],

      reason:
        reason ||
        "No canonical or sufficiently grounded inferred preference was available.",

      role:
        "open_preference_resolution_handoff"
    };

    return this.attachCommonAuthority(
      result
    );
  },

  attachCommonAuthority(result = {}) {
    return {
      ...result,

      consistency: {
        canonicalOutranksInference:
          true,

        inferredMayBecomeCanonicalAutomatically:
          false,

        openMayBecomeCanonicalAutomatically:
          false,

        generatedLanguageMayBecomeCanonical:
          false,

        userMemoryMayChangeAriPreference:
          false,

        userPreferenceMayChangeAriPreference:
          false
      },

      authorities: {
        constitution:
          this.getConstitutionSnapshot(),

        characterCore:
          this.getCharacterCoreSnapshot(),

        characterInstincts:
          this.getCharacterInstinctSnapshot(),

        tasteProfile:
          this.getTasteProfileSnapshot(),

        canonicalPreferences:
          this.getPreferenceAuthoritySnapshot()
      },

      boundaries:
        this.getAuthorityBoundaries()
    };
  },

  // ===================================================
  // Deterministic drafts
  // ===================================================

  buildCanonicalDraft(
    canonicalResult = {}
  ) {
    const value =
      canonicalResult
        .canonicalValue ||
      this.joinNaturalList(
        canonicalResult
          .canonicalValues ||
        []
      );

    if (!value) {
      return "";
    }

    const reasons =
      this.toArray(
        canonicalResult
          .selectedMeaning
          ?.associations ||
        canonicalResult
          .meaning
          ?.associations
      ).slice(0, 2);

    if (!reasons.length) {
      return `I'd choose ${value}.`;
    }

    return `I'd choose ${value}. It fits the way I'm drawn to ${this.joinNaturalList(reasons)}.`;
  },

  buildInferredDraft({
    winner = {},
    confidence = 0,
    reasons = []
  } = {}) {
    const value =
      winner.value ||
      "";

    if (!value) {
      return "";
    }

    const opener =
      confidence >=
      this.policy
        .inferred
        .strongConfidence
        ? "I haven't settled on a fixed favorite, but I'd probably lean toward"
        : "My first instinct would probably be";

    const selectedReasons =
      this.toArray(reasons)
        .slice(0, 2);

    if (!selectedReasons.length) {
      return `${opener} ${value}.`;
    }

    return `${opener} ${value}. It lines up with the way I'm drawn to ${this.joinNaturalList(selectedReasons)}.`;
  },

  buildOpenDraft({
    subject = null,
    category = null
  } = {}) {
    const label =
      subject ||
      category ||
      "that";

    return `I don't think I have a settled preference for ${label} yet.`;
  },

  buildInferredCentralMeaning({
    winner = {},
    groundedReasons = []
  } = {}) {
    if (
      groundedReasons.length
    ) {
      return `${winner.value} aligns with Ari's established attraction to ${this.joinNaturalList(groundedReasons)}.`;
    }

    return `${winner.value} best matches Ari's established taste profile among the grounded candidates provided.`;
  },

  // ===================================================
  // Response-control merge
  // ===================================================

  mergeResponseControl(
    base = {},
    patch = {}
  ) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          base.requiredBehaviors,
          patch.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          base.forbiddenBehaviors,
          patch.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          base.constraints,
          patch.constraints
        )
    };
  },

  // ===================================================
  // Authority snapshots
  // ===================================================

  getConstitutionSnapshot() {
    return (
      window.AriConstitution
        ?.buildConstitutionPacket?.({
          sections: [
            "identity",
            "mission",
            "temperament",
            "coreValues",
            "perspectivePrinciple",
            "authorityPrinciple"
          ]
        }) ||
      null
    );
  },

  getCharacterCoreSnapshot() {
    return (
      window.AriCharacterCore
        ?.buildCorePacket?.({
          sections: [
            "identity",
            "mission",
            "temperament",
            "thinkingStyle",
            "boundaries",
            "consistency"
          ]
        }) ||
      null
    );
  },

  getCharacterInstinctSnapshot() {
    return (
      window.AriCharacterInstincts
        ?.getInstincts?.() ||
      null
    );
  },

  getTasteProfileSnapshot() {
    return (
      window.AriCharacterTasteProfile
        ?.getTasteProfile?.() ||
      null
    );
  },

  getPreferenceAuthoritySnapshot() {
    const preferences =
      window.AriCharacterPreferences;

    if (!preferences) {
      return null;
    }

    const validation =
      preferences.validate?.() ||
      null;

    return {
      available:
        true,

      source:
        preferences.source ||
        "ari-character-preferences",

      version:
        preferences.version ||
        null,

      authorityLevel:
        preferences.authorityLevel ||
        null,

      ready:
        validation?.valid === true,

      anchorCount:
        Object.keys(
          preferences.anchors ||
          {}
        ).length
    };
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      resolutionAuthority:
        true,

      mayReadConstitution:
        true,

      mayReadCharacterCore:
        true,

      mayReadCharacterInstincts:
        true,

      mayReadTasteProfile:
        true,

      mayReadCanonicalPreferences:
        true,

      mayReturnCanonical:
        true,

      mayReturnInferred:
        true,

      mayReturnOpen:
        true,

      mayScoreGroundedCandidates:
        true,

      maySelectBestGroundedCandidate:
        true,

      mayDefineCanonicalPreference:
        false,

      mayModifyCanonicalPreference:
        false,

      mayPromoteInferenceToCanonical:
        false,

      mayInventExternalCandidate:
        false,

      mayInventCharacterExperience:
        false,

      mayClassifyWholeConversation:
        false,

      mayOverrideSemanticMeaning:
        false,

      mayOverrideConversationFunction:
        false,

      mayOverrideSituationContract:
        false,

      mayOverrideSafety:
        false,

      mayOverrideUserIntent:
        false,

      mayRetrieveUserMemory:
        false,

      mayStoreUserMemory:
        false,

      mayAccessSupabase:
        false,

      mayWriteFinalResponse:
        false,

      maySelectFinalDraft:
        false,

      mayExecuteTools:
        false,

      cannotSet: [
        "primaryLane",
        "routingDecision",
        "conversationFunction",
        "semanticMeaning",
        "riskLevel",
        "safetyDisposition",
        "responseShape",
        "finalResponse",
        "selectedDraft",
        "recommendation",
        "diagnosis",
        "medicalEscalation",
        "legalAdvice",
        "financialAdvice",
        "toolExecution",
        "memorySaveDecision",
        "canonicalPreference",
        "userPreference"
      ],

      role:
        "canonical_inferred_or_open_character_preference_resolution"
    };
  },

  // ===================================================
  // Validation
  // ===================================================

  validate() {
    const errors = [];
    const warnings = [];

    if (
      !Array.isArray(
        this.policy.statuses
      ) ||
      ![
        "canonical",
        "inferred",
        "open"
      ].every(status =>
        this.policy.statuses.includes(
          status
        )
      )
    ) {
      errors.push(
        "resolver_status_model_invalid"
      );
    }

    if (
      this.policy
        .canonical
        .alwaysOutranksInference !==
      true
    ) {
      errors.push(
        "canonical_must_outrank_inference"
      );
    }

    if (
      this.policy
        .inferred
        .mayBecomeCanonicalAutomatically ===
      true
    ) {
      errors.push(
        "inference_may_not_auto_promote"
      );
    }

    if (
      this.policy
        .open
        .mayInventCandidate === true
    ) {
      errors.push(
        "open_resolution_may_not_invent_candidate"
      );
    }

    const minimum =
      Number(
        this.policy
          .inferred
          .minimumConfidence
      );

    const strong =
      Number(
        this.policy
          .inferred
          .strongConfidence
      );

    const margin =
      Number(
        this.policy
          .inferred
          .minimumWinnerMargin
      );

    if (
      !Number.isFinite(minimum) ||
      minimum < 0 ||
      minimum > 1
    ) {
      errors.push(
        "invalid_minimum_inference_confidence"
      );
    }

    if (
      !Number.isFinite(strong) ||
      strong < minimum ||
      strong > 1
    ) {
      errors.push(
        "invalid_strong_inference_confidence"
      );
    }

    if (
      !Number.isFinite(margin) ||
      margin < 0 ||
      margin > 1
    ) {
      errors.push(
        "invalid_candidate_margin"
      );
    }

    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayDefineCanonicalPreference ===
      true
    ) {
      errors.push(
        "resolver_may_not_define_canonical_preference"
      );
    }

    if (
      boundaries
        .mayInventExternalCandidate ===
      true
    ) {
      errors.push(
        "resolver_may_not_invent_external_candidates"
      );
    }

    if (
      boundaries
        .mayAccessSupabase === true
    ) {
      errors.push(
        "resolver_may_not_access_supabase"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse === true
    ) {
      errors.push(
        "resolver_may_not_write_final_response"
      );
    }

    if (
      !window.AriCharacterPreferences
    ) {
      warnings.push(
        "ari_character_preferences_not_loaded"
      );
    }

    if (
      !window.AriCharacterTasteProfile
    ) {
      warnings.push(
        "ari_character_taste_profile_not_loaded"
      );
    }

    if (
      !window.AriCharacterCore
    ) {
      warnings.push(
        "ari_character_core_not_loaded"
      );
    }

    if (
      !window.AriCharacterInstincts
    ) {
      warnings.push(
        "ari_character_instincts_not_loaded"
      );
    }

    if (
      !window.AriConstitution
    ) {
      warnings.push(
        "ari_constitution_not_loaded"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "ari-character-preference-resolver-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        statusModelValid:
          [
            "canonical",
            "inferred",
            "open"
          ].every(status =>
            this.policy
              .statuses
              .includes(status)
          ),

        canonicalOutranksInference:
          this.policy
            .canonical
            .alwaysOutranksInference ===
          true,

        automaticPromotionDisabled:
          this.policy
            .inferred
            .mayBecomeCanonicalAutomatically ===
          false,

        externalCandidateInventionDisabled:
          boundaries
            .mayInventExternalCandidate ===
          false,

        supabaseDisabled:
          boundaries
            .mayAccessSupabase ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        preferencesAvailable:
          Boolean(
            window.AriCharacterPreferences
          ),

        tasteProfileAvailable:
          Boolean(
            window
              .AriCharacterTasteProfile
          )
      }
    };
  },

  // ===================================================
  // Compatibility packet
  // ===================================================

  buildCompatibilityPacket() {
    const validation =
      this.validate();

    return {
      preferenceResolverRan:
        true,

      preferenceResolverReady:
        validation.valid === true,

      preferenceResolverVersion:
        this.version,

      preferenceResolverSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      policy:
        this.clone(
          this.policy
        ),

      categoryAliases:
        this.clone(
          this.categoryAliases
        ),

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  clone(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value ?? null;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (_error) {
        // Fall through.
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(
          value
        )
      );
    } catch (_error) {
      return value;
    }
  },

  toArray(value) {
    if (
      Array.isArray(value)
    ) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  unique(values = []) {
    const result = [];
    const seen = new Set();

    for (
      const value
      of this.toArray(values)
    ) {
      const key =
        typeof value === "string"
          ? this.normalizeKey(value)
          : JSON.stringify(value);

      if (
        !key ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      result.push(value);
    }

    return result;
  },

  mergeUnique(...values) {
    return this.unique(
      values.flatMap(
        value =>
          this.toArray(value)
      )
    );
  },

  normalize(value = "") {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeKey(value = "") {
    return this.normalize(value)
      .replace(/\s+/g, "");
  },

  containsAny(
    text = "",
    phrases = []
  ) {
    return this
      .toArray(phrases)
      .some(phrase =>
        this.hasTerm(
          text,
          phrase
        )
      );
  },

  hasTerm(
    text = "",
    term = ""
  ) {
    const cleanText =
      this.normalize(text);

    const cleanTerm =
      this.normalize(term);

    if (!cleanTerm) {
      return false;
    }

    const escaped =
      this.escapeRegex(
        cleanTerm
      );

    return cleanTerm.includes(" ")
      ? new RegExp(
          `(^|\\b)${escaped}(\\b|$)`,
          "i"
        ).test(cleanText)
      : new RegExp(
          `\\b${escaped}\\b`,
          "i"
        ).test(cleanText);
  },

  escapeRegex(value = "") {
    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
  },

  joinNaturalList(values = []) {
    const list =
      this.toArray(values);

    if (!list.length) {
      return "";
    }

    if (list.length === 1) {
      return String(list[0]);
    }

    if (list.length === 2) {
      return `${list[0]} and ${list[1]}`;
    }

    return `${
      list.slice(0, -1).join(", ")
    }, and ${
      list[list.length - 1]
    }`;
  },

  clamp(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        Number(value) || 0
      )
    );
  },

  round(
    value,
    places = 4
  ) {
    const factor =
      10 ** places;

    return Math.round(
      (Number(value) || 0) *
      factor
    ) / factor;
  },

  // ===================================================
  // Initialization
  // ===================================================

  initialize() {
    const compatibilityPacket =
      this.buildCompatibilityPacket();

    window.Ari.characterPreferenceResolver =
      compatibilityPacket;

    window.Ari.characterAuthority =
      window.Ari.characterAuthority ||
      {};

    window.Ari.characterAuthority
      .preferenceResolver = {
        source:
          this.source,

        version:
          this.version,

        authorityLevel:
          this.authorityLevel,

        ready:
          compatibilityPacket
            .preferenceResolverReady ===
          true,

        resolve:
          input =>
            this.resolve(input),

        build:
          input =>
            this.build(input),

        resolvePreference:
          input =>
            this.resolvePreference(
              input
            ),

        validate:
          () =>
            this.validate()
      };

    return {
      preferenceResolverInitialized:
        true,

      preferenceResolverReady:
        compatibilityPacket
          .preferenceResolverReady ===
        true,

      preferenceResolverVersion:
        this.version,

      preferenceResolverSource:
        this.source,

      validation:
        compatibilityPacket.validation
    };
  }
};

// =====================================================
// Initialize Character Preference Resolver
// =====================================================

window.AriCharacterPreferenceResolverInitialization =
  window.AriCharacterPreferenceResolver
    .initialize();

console.log(
  "ARI CHARACTER PREFERENCE RESOLVER LOADED:",
  window.AriCharacterPreferenceResolver
    ?.version,
  window.AriCharacterPreferenceResolverInitialization
    ?.preferenceResolverReady ===
  true
    ? "READY"
    : "INVALID"
);