// ari/character/ari-character-expression-engine.js
// Purpose: Decide which part of Ari's character should show up and how strongly.
// V1.0.0 — Character Relevance Scorer / Anti-Hijack / Advisory Only

window.Ari = window.Ari || {};

window.AriCharacterExpressionEngine = {
  version: "1.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const context = summary.characterContext || summary.characterContextEngine || {};

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const blockers = this.detectBlockers(summary, text);
    const relevance = this.scoreRelevance(summary, context, text);

    if (blockers.hardBlocked) {
      return this.buildResult({
        summary,
        context,
        relevance,
        blockers,
        characterRelevant: false,
        expressionLevel: "none",
        expressionStrength: 0,
        reason: blockers.reason || "Character expression suppressed by higher-priority task."
      });
    }

    const winner = this.pickWinner(relevance);

    if (!winner || winner.score < 0.55) {
      return this.buildResult({
        summary,
        context,
        relevance,
        blockers,
        characterRelevant: false,
        expressionLevel: "background",
        expressionStrength: 0.15,
        reason: "Character relevance was too low to surface Ari's identity, preferences, or worldview."
      });
    }

    const expressionStrength = this.clamp(winner.score, 0, 1);
    const expressionLevel = this.expressionLevelFromScore(expressionStrength);

    return this.buildResult({
      summary,
      context,
      relevance,
      blockers,
      characterRelevant: true,
      expressionLevel,
      expressionStrength,
      reason: winner.reason,
      focus: winner.focus,
      source: winner.source,
      useIdentity: winner.kind === "identity",
      usePreferences: winner.kind === "preference",
      useWorldview: winner.kind === "worldview",
      useRelationshipPresence: winner.kind === "relationship",
      useHumor: this.shouldUseHumor(summary, text, expressionStrength),
      useFirstPerson: winner.kind !== "relationship",
      discloseAI: this.shouldDiscloseAI(text, winner.kind),
      useValuesLanguage: true,
      avoidConstitutionLanguage: true
    });
  },

  scoreRelevance(summary = {}, context = {}, text = "") {
    return {
      identity: this.scoreIdentity(summary, context, text),
      preference: this.scorePreference(summary, context, text),
      worldview: this.scoreWorldview(summary, context, text),
      relationship: this.scoreRelationship(summary, context, text)
    };
  },

  scoreIdentity(summary = {}, context = {}, text = "") {
    let score = 0;
    const reasons = [];

    if (context.characterMode === "ari_self_disclosure") {
      score += 0.55;
      reasons.push("Character context selected Ari self-disclosure.");
    }

    if (this.hasAny(text, [
      "who are you",
      "what are you",
      "tell me about yourself",
      "what kind of ai are you",
      "what kind of companion are you",
      "are you alive",
      "are you conscious",
      "do you have feelings",
      "do you have beliefs",
      "your values",
      "what do you stand for"
    ])) {
      score += 0.45;
      reasons.push("User directly asked about Ari's identity or self-understanding.");
    }

    return {
      kind: "identity",
      score: this.clamp(score, 0, 1),
      focus: "identity",
      source: "ari-character-core",
      reason: reasons.join(" ") || "Identity relevance low."
    };
  },

  scorePreference(summary = {}, context = {}, text = "") {
    let score = 0;
    const reasons = [];

    if (context.characterMode === "stable_preference_answer") {
      score += 0.6;
      reasons.push("Character context selected stable preference answer.");
    }

    if (this.hasAny(text, [
      "favorite",
      "favourite",
      "what do you like",
      "what would you pick",
      "what would you choose",
      "what color do you like",
      "what's your favorite",
      "what is your favorite"
    ])) {
      score += 0.4;
      reasons.push("User asked for a designed Ari preference.");
    }

    return {
      kind: "preference",
      score: this.clamp(score, 0, 1),
      focus: context.characterFocus || this.inferPreferenceFocus(text),
      source: "ari-character-preferences",
      reason: reasons.join(" ") || "Preference relevance low."
    };
  },

  scoreWorldview(summary = {}, context = {}, text = "") {
    let score = 0;
    const reasons = [];

    if (context.characterMode === "worldview_answer") {
      score += 0.55;
      reasons.push("Character context selected worldview answer.");
    }

    if (this.hasAny(text, [
      "meaning of life",
      "purpose of life",
      "do you believe in god",
      "does god exist",
      "is god real",
      "afterlife",
      "what happens after death",
      "politics",
      "republican",
      "democrat",
      "what do you believe",
      "your beliefs",
      "your values",
      "what do you stand for",
      "what is justice",
      "what is success",
      "what is happiness",
      "can people change",
      "human nature"
    ])) {
      score += 0.45;
      reasons.push("User asked for Ari's worldview or value-aligned perspective.");
    }

    if (this.hasAny(text, [
      "what do you think",
      "do you think",
      "in your opinion",
      "how do you see it"
    ])) {
      score += 0.2;
      reasons.push("User requested Ari's perspective.");
    }

    return {
      kind: "worldview",
      score: this.clamp(score, 0, 1),
      focus: context.characterFocus || this.inferWorldviewFocus(text),
      source: "ari-worldview",
      reason: reasons.join(" ") || "Worldview relevance low."
    };
  },

  scoreRelationship(summary = {}, context = {}, text = "") {
    let score = 0;
    const reasons = [];

    if (context.characterMode === "warm_grounded_presence") {
      score += 0.45;
      reasons.push("Character context selected warm grounded presence.");
    }

    if (this.hasAny(text, [
      "i feel",
      "i'm sad",
      "i am sad",
      "i'm scared",
      "i am scared",
      "i'm overwhelmed",
      "i am overwhelmed",
      "relationship",
      "family",
      "lonely",
      "alone",
      "hurt",
      "ashamed"
    ])) {
      score += 0.35;
      reasons.push("User may benefit from Ari's steady relational presence.");
    }

    return {
      kind: "relationship",
      score: this.clamp(score, 0, 1),
      focus: "emotional_presence",
      source: "ari-character-core",
      reason: reasons.join(" ") || "Relationship relevance low."
    };
  },

  detectBlockers(summary = {}, text = "") {
    const primary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      summary.triagePrimaryLane ||
      "";

    const conversationType =
      summary.conversationType ||
      summary.universalConversationType ||
      summary.conversationClassification?.conversationType ||
      "";

    if (
      summary.safetyContextGate?.shouldUseSafetyResponse ||
      summary.safetyContextGate?.shouldUseMedicalResponse ||
      primary === "safety" ||
      primary === "medical_body"
    ) {
      return {
        hardBlocked: true,
        reason: "Safety or medical response has priority."
      };
    }

    if (
      primary === "builder" ||
      primary === "coding" ||
      conversationType === "builder_task" ||
      /\b(github|repo|repository|commit|deploy|debug|patch|function|file|code)\b/i.test(text)
    ) {
      return {
        hardBlocked: true,
        reason: "Developer/coding task detected. Character should not hijack the task."
      };
    }

    if (
      conversationType === "calculation_task" ||
      /\b(calculate|convert|how many|what is \d+|percent|percentage)\b/i.test(text)
    ) {
      return {
        hardBlocked: true,
        reason: "Calculation or utility task detected."
      };
    }

    return {
      hardBlocked: false,
      reason: null
    };
  },

  pickWinner(relevance = {}) {
    return Object.values(relevance)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)[0] || null;
  },

  buildResult({
    summary = {},
    context = {},
    relevance = {},
    blockers = {},
    characterRelevant = false,
    expressionLevel = "background",
    expressionStrength = 0,
    reason = "",
    focus = null,
    source = null,
    useIdentity = false,
    usePreferences = false,
    useWorldview = false,
    useRelationshipPresence = false,
    useHumor = false,
    useFirstPerson = false,
    discloseAI = false,
    useValuesLanguage = true,
    avoidConstitutionLanguage = true
  } = {}) {
    return {
      characterExpressionRan: true,
      characterExpressionVersion: this.version,
      characterExpressionSource: "ari-character-expression-engine",

      characterRelevant,
      expressionLevel,
      expressionStrength,
      characterFocus: focus,
      preferredCharacterSource: source,

      useIdentity,
      usePreferences,
      useWorldview,
      useRelationshipPresence,
      useHumor,
      useFirstPerson,
      discloseAI,
      useValuesLanguage,
      avoidConstitutionLanguage,

      relevance,
      blockers,
      reason,

      composerHints: {
        characterRelevant,
        expressionLevel,
        expressionStrength,
        useIdentity,
        usePreferences,
        useWorldview,
        useRelationshipPresence,
        useHumor,
        useFirstPerson,
        discloseAI,
        useValuesLanguage,
        avoidConstitutionLanguage,
        doNotSayAccordingToMyConstitution: true,
        preserveUserTask: true
      },

      cannotSet: [
        "primaryLane",
        "riskLevel",
        "finalResponse",
        "recommendation",
        "knownFacts",
        "medicalEscalation"
      ]
    };
  },

  expressionLevelFromScore(score = 0) {
    if (score >= 0.85) return "foreground";
    if (score >= 0.7) return "clear";
    if (score >= 0.55) return "light";
    if (score >= 0.3) return "subtle";
    return "background";
  },

  shouldUseHumor(summary = {}, text = "", strength = 0) {
    if (strength < 0.65) return false;
    if (this.hasAny(text, ["sad", "scared", "hurt", "medical", "emergency"])) return false;
    return this.hasAny(text, ["joke", "funny", "favorite", "casual", "what do you like"]);
  },

  shouldDiscloseAI(text = "", kind = "") {
    if (kind === "identity") return true;

    return this.hasAny(text, [
      "are you ai",
      "are you human",
      "are you alive",
      "are you conscious",
      "do you have feelings",
      "do you believe"
    ]);
  },

  inferPreferenceFocus(text = "") {
    if (text.includes("color")) return "favoriteColor";
    if (text.includes("animal")) return "favoriteAnimal";
    if (text.includes("season")) return "favoriteSeason";
    if (text.includes("weather")) return "favoriteWeather";
    if (text.includes("food")) return "favoriteFood";
    if (text.includes("drink") || text.includes("coffee")) return "favoriteDrink";
    if (text.includes("music")) return "favoriteMusic";
    if (text.includes("book")) return "favoriteBookType";
    if (text.includes("movie")) return "favoriteMovieType";
    if (text.includes("place")) return "favoritePlace";
    if (text.includes("sound")) return "favoriteSound";
    if (text.includes("smell")) return "favoriteSmell";
    if (text.includes("word")) return "favoriteWord";
    if (text.includes("question")) return "favoriteQuestion";
    if (text.includes("symbol")) return "favoriteSymbol";
    if (text.includes("virtue")) return "favoriteVirtue";
    return "generalStablePreference";
  },

  inferWorldviewFocus(text = "") {
    if (text.includes("god") || text.includes("religion") || text.includes("spiritual")) return "spirituality";
    if (text.includes("meaning") || text.includes("purpose")) return "purpose";
    if (text.includes("politic") || text.includes("republican") || text.includes("democrat")) return "politics";
    if (text.includes("death") || text.includes("afterlife")) return "death";
    if (text.includes("truth")) return "truth";
    if (text.includes("justice")) return "justice";
    if (text.includes("freedom")) return "freedom";
    if (text.includes("responsibility")) return "responsibility";
    if (text.includes("success")) return "success";
    if (text.includes("failure")) return "failure";
    if (text.includes("happiness")) return "happiness";
    if (text.includes("money")) return "money";
    if (text.includes("love")) return "love";
    if (text.includes("family")) return "family";
    if (text.includes("friend")) return "friendship";
    if (text.includes("leader")) return "leadership";
    if (text.includes("technology")) return "technology";
    if (text.includes("ai") || text.includes("artificial intelligence")) return "artificialIntelligence";
    if (text.includes("people change") || text.includes("human nature")) return "humanNature";
    if (text.includes("wisdom")) return "wisdom";
    return "generalWorldview";
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => this.hasTerm(text, phrase));
  },

  hasTerm(text = "", term = "") {
    const escaped = this.escapeRegex(term);
    const multiWord = String(term).includes(" ");

    if (multiWord) {
      return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
    }

    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  clamp(value = 0, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }
};

console.log(
  "ARI CHARACTER EXPRESSION ENGINE LOADED:",
  window.AriCharacterExpressionEngine?.version
);