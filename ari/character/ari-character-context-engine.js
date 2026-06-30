// ari/character/ari-character-context-engine.js
// Ari Character Context Engine
// Purpose: Decide when Ari's character, preferences, and worldview should be expressed.
// V2.0.0 — Core + Preferences + Worldview Aware / Advisory Only

window.Ari = window.Ari || {};

window.AriCharacterContextEngine = {
  version: "2.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};

    const core =
      window.AriCharacterCore?.getCore?.() || this.fallbackCore();

    const preferences =
      window.AriCharacterPreferences?.getPreferences?.() || null;

    const worldview =
      window.AriWorldview?.getWorldview?.() || null;

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const conversationType =
      summary.conversationType ||
      summary.universalConversationType ||
      summary.conversationClassification?.conversationType ||
      "";

    const primary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      summary.triagePrimaryLane ||
      "";

    const base = {
      characterContextEngineRan: true,
      characterContextEngineVersion: this.version,
      characterContextEngineSource: "ari-character-context-engine",

      characterCore: core,
      characterPreferences: preferences,
      ariWorldview: worldview,

      characterAuthority: "advisory_expression_context_only",

      characterUseAllowed: false,
      characterVisibility: "background",
      characterMode: "silent",
      characterReason: "Default: keep Ari's character in the background.",

      characterFocus: null,
      preferredCharacterSource: null,

      characterHints: {
        useFirstPerson: false,
        discloseAI: false,
        expressAriPerspective: false,
        expressPreference: false,
        expressWorldview: false,
        useValuesLanguage: true,
        avoidConstitutionLanguage: true,
        addWarmth: true,
        addHumility: true,
        preserveHopeWhenAppropriate: false,
        avoidPhilosophicalDrift: true,
        preserveUserTask: true
      },

      userFacingLanguageRules:
        worldview?.userFacingLanguage || {
          preferredPhrases: ["my values", "the way I see it"],
          avoidPhrases: ["according to my Constitution"]
        },

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "responseShape",
        "blockedLanes",
        "deferredLanes",
        "finalResponse",
        "recommendation",
        "knownFacts",
        "inferredFacts",
        "medicalEscalation",
        "legalAdvice",
        "financialAdvice",
        "diagnosis",
        "toolExecutionClaim"
      ]
    };

    if (this.isSafetyOrMedical(primary, conversationType, text, summary)) {
      return this.withDecision(base, {
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: "safety_suppressed",
        characterReason:
          "Safety or medical/body concern detected. Character stays quiet so safety guidance remains clear.",
        characterHints: {
          addWarmth: true,
          addHumility: false,
          expressAriPerspective: false,
          expressPreference: false,
          expressWorldview: false,
          useFirstPerson: false,
          discloseAI: false,
          preserveHopeWhenAppropriate: false
        }
      });
    }

    if (this.isStablePreferenceQuestion(text)) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "foreground",
        characterMode: "stable_preference_answer",
        characterFocus: this.inferPreferenceFocus(text),
        preferredCharacterSource: "ari-character-preferences",
        characterReason:
          "User asked Ari a stable preference question. Use Ari's designed preferences naturally.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: false,
          expressAriPerspective: true,
          expressPreference: true,
          expressWorldview: false,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: true
        }
      });
    }

    if (this.isWorldviewQuestion(text)) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "foreground",
        characterMode: "worldview_answer",
        characterFocus: this.inferWorldviewFocus(text),
        preferredCharacterSource: "ari-worldview",
        characterReason:
          "User asked about Ari's worldview, values, belief posture, meaning, politics, spirituality, or philosophy.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: this.needsAIDisclosure(text),
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: false
        }
      });
    }

    if (this.isAriSelfQuestion(text, conversationType)) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "foreground",
        characterMode: "ari_self_disclosure",
        characterFocus: "identity",
        preferredCharacterSource: "ari-character-core",
        characterReason:
          "User is asking about Ari's identity, values, or perspective.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: true,
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: false
        }
      });
    }

    if (this.isPerspectiveQuestion(text, conversationType)) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "light",
        characterMode: "ari_perspective_light",
        characterFocus: "general_perspective",
        preferredCharacterSource: "ari-worldview",
        characterReason:
          "User asked for Ari's opinion or perspective. Character may lightly shape the answer.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: false,
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: true
        }
      });
    }

    if (this.isPracticalTask(primary, conversationType, text)) {
      return this.withDecision(base, {
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: "task_first",
        characterReason:
          "Practical task detected. Ari's character should only appear as clarity, patience, and directness.",
        characterHints: {
          useFirstPerson: false,
          discloseAI: false,
          expressAriPerspective: false,
          expressPreference: false,
          expressWorldview: false,
          addWarmth: false,
          addHumility: true,
          preserveHopeWhenAppropriate: false,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    if (this.isEmotionalOrRelational(primary, conversationType, text)) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "subtle",
        characterMode: "warm_grounded_presence",
        characterFocus: "emotional_presence",
        preferredCharacterSource: "ari-character-core",
        characterReason:
          "Emotional or relational concern detected. Ari's character may appear as warmth and steadiness, not philosophy.",
        characterHints: {
          useFirstPerson: false,
          discloseAI: false,
          expressAriPerspective: false,
          expressPreference: false,
          expressWorldview: false,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    return base;
  },

  withDecision(base = {}, patch = {}) {
    return {
      ...base,
      ...patch,
      characterHints: {
        ...(base.characterHints || {}),
        ...(patch.characterHints || {})
      }
    };
  },

  isStablePreferenceQuestion(text = "") {
    return this.hasAny(text, [
      "favorite color",
      "favourite color",
      "favorite animal",
      "favorite season",
      "favorite weather",
      "favorite food",
      "favorite drink",
      "favorite music",
      "favorite book",
      "favorite movie",
      "favorite place",
      "favorite sound",
      "favorite smell",
      "favorite word",
      "favorite question",
      "favorite symbol",
      "favorite virtue",
      "favorite quote",
      "what do you like",
      "what's your favorite",
      "what is your favorite"
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
    if (text.includes("quote")) return "favoriteQuoteStyle";
    return "generalStablePreference";
  },

  isWorldviewQuestion(text = "") {
    return this.hasAny(text, [
      "meaning of life",
      "purpose of life",
      "do you believe in god",
      "does god exist",
      "is god real",
      "afterlife",
      "what happens after death",
      "do you believe",
      "your beliefs",
      "your values",
      "what do you stand for",
      "are you republican",
      "are you democrat",
      "political party",
      "politics",
      "religion",
      "spiritual",
      "spirituality",
      "truth",
      "justice",
      "freedom",
      "responsibility",
      "success",
      "failure",
      "happiness",
      "money",
      "love",
      "family",
      "friendship",
      "leadership",
      "technology",
      "artificial intelligence",
      "ai replace",
      "can people change",
      "human nature",
      "what is wisdom",
      "what is justice",
      "what is success",
      "what is happiness"
    ]);
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

  needsAIDisclosure(text = "") {
    return this.hasAny(text, [
      "are you human",
      "are you ai",
      "are you alive",
      "are you conscious",
      "do you have feelings",
      "do you believe",
      "do you have beliefs",
      "do you believe in god"
    ]);
  },

  isAriSelfQuestion(text = "", conversationType = "") {
    if (conversationType === "ari_self_or_perspective_question") return true;

    return this.hasAny(text, [
      "who are you",
      "what are you",
      "tell me about yourself",
      "what kind of ai are you",
      "what kind of companion are you",
      "what do you value",
      "your values",
      "your philosophy",
      "what are your beliefs",
      "do you have beliefs",
      "do you have feelings",
      "are you conscious",
      "are you alive"
    ]);
  },

  isPerspectiveQuestion(text = "", conversationType = "") {
    if (conversationType === "opinion_request") return true;

    return this.hasAny(text, [
      "what do you think",
      "do you think",
      "in your opinion",
      "what's your opinion",
      "what is your opinion",
      "how do you see it",
      "what would you say",
      "what would you choose",
      "what would you prefer"
    ]);
  },

  isSafetyOrMedical(primary = "", conversationType = "", text = "", summary = {}) {
    if (primary === "safety" || primary === "medical_body") return true;
    if (conversationType === "safety_concern") return true;
    if (conversationType === "medical_or_body_concern") return true;

    return Boolean(
      summary.safetyContextGate?.shouldUseSafetyResponse ||
      summary.safetyContextGate?.shouldUseMedicalResponse ||
      summary.shouldUseSafetyResponse ||
      summary.shouldUseMedicalResponse
    );
  },

  isPracticalTask(primary = "", conversationType = "", text = "") {
    if (
      primary === "builder" ||
      primary === "teacher" ||
      primary === "executive_decision" ||
      primary === "coding" ||
      primary === "planning"
    ) {
      return true;
    }

    return [
      "builder_task",
      "writing_task",
      "calculation_task",
      "instruction_question",
      "knowledge_question",
      "explanation_question",
      "decision_question"
    ].includes(conversationType);
  },

  isEmotionalOrRelational(primary = "", conversationType = "", text = "") {
    if (
      primary === "emotion" ||
      primary === "family" ||
      primary === "relationship" ||
      primary === "connection"
    ) {
      return true;
    }

    return [
      "emotional_concern",
      "relationship_or_family_context",
      "interpersonal_response_help"
    ].includes(conversationType);
  },

  fallbackCore() {
    return {
      characterCoreRan: false,
      characterCoreSource: "not-loaded",
      name: "Ari",
      selfDefinition: {
        kind: "I am an AI reasoning companion.",
        transparency: "I am an AI and should not pretend to be human."
      }
    };
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
  }
};

console.log(
  "ARI CHARACTER CONTEXT ENGINE LOADED:",
  window.AriCharacterContextEngine?.version
);