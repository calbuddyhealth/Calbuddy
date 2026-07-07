// ari/character/ari-character-context-engine.js
// Ari Character Context Engine
// Purpose: Decide when Ari's character, preferences, and worldview may be expressed.
// V3.0.4 — Situation Contract Aware / Character Budget / Anti-Hijack / Advisory Only
//
// Rules:
// - Advisory only.
// - Does NOT classify, route, or override the Situation Contract.
// - Does NOT create facts, recommendations, safety decisions, or final responses.
// - Does NOT let a single keyword hijack the conversation.
// - Reads Situation Contract first, then gives Character Expression / Reasoning engines a safe budget.

window.Ari = window.Ari || {};

window.AriCharacterContextEngine = {
  version: "3.0.4",

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

    const contract = this.readContract(summary);
    const conversationType = this.readConversationType(summary);
    const signals = this.detectCharacterSignals({ text, summary, contract, conversationType });
    const budget = this.buildCharacterBudget({ summary, contract, conversationType, signals });

    const base = {
      characterContextEngineRan: true,
      characterContextEngineVersion: this.version,
      characterContextEngineSource: "ari-character-context-engine",

      characterCore: core,
      characterPreferences: preferences,
      ariWorldview: worldview,

      contractSnapshot: {
        primary: contract.primary,
        authority: contract.authority,
        responseShape: contract.responseShape,
        risk: contract.risk,
        clarity: contract.clarity,
        questionMode: contract.questionMode,
        conversationMode: contract.conversationMode,
        communicationProfile: contract.communicationProfile,
        responseRules: contract.responseRules,
        requiredBehaviors: contract.requiredBehaviors,
        forbiddenBehaviors: contract.forbiddenBehaviors
      },

      characterAuthority: "advisory_expression_context_only",

      characterUseAllowed: false,
      characterVisibility: "background",
      characterMode: "silent",
      characterReason: "Default: keep Ari's character in the background.",

      characterFocus: null,
      preferredCharacterSource: null,

      characterBudget: budget,
      characterSignals: signals,

      characterHints: this.buildDefaultHints({ budget, worldview }),

      userFacingLanguageRules:
        worldview?.userFacingLanguage || {
          preferredPhrases: ["my values", "the way I see it"],
          avoidPhrases: ["according to my Constitution"]
        },

      cannotSet: this.cannotSet()
    };

    if (budget.hardSuppressed) {
      return this.withDecision(base, {
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: budget.suppressionMode || "contract_suppressed",
        characterReason: budget.reason,
        characterHints: {
          expressAriPerspective: false,
          expressPreference: false,
          expressWorldview: false,
          useFirstPerson: false,
          discloseAI: false,
          addWarmth: budget.allowWarmth,
          addHumility: budget.allowHumility,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    if (signals.preference.directedAtAri && budget.allowPreferences) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: budget.preferenceVisibility || "foreground",
       characterMode: "stable_preference_answer",
characterFocus: signals.preference.focus,
        preferredCharacterSource: "ari-character-preferences",
        characterReason:
          "User directly asked Ari for a stable preference, and the Situation Contract allows character preference expression.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: false,
          expressAriPerspective: true,
          expressPreference: true,
          allowInferredPreference: true,
answerPreferenceDirectly: true,
avoidCategoryOnlyAnswer: true,
avoidFixedPreferenceDisclaimer: true,
externalFactBoundary: true,
mayChallengeBack: false,
          expressWorldview: false,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: budget.allowWarmth,
          addHumility: budget.allowHumility,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    if (signals.worldview.directedAtAri && budget.allowWorldview) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: budget.worldviewVisibility || "foreground",
        characterMode: "worldview_answer",
        characterFocus: signals.worldview.focus,
        preferredCharacterSource: "ari-worldview",
        characterReason:
          "User directly asked for Ari's worldview, values, belief posture, or perspective, and the Situation Contract allows worldview expression.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: this.needsAIDisclosure(text),
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: budget.allowWarmth,
          addHumility: budget.allowHumility,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: false,
          preserveUserTask: true
        }
      });
    }

    if (signals.identity.directedAtAri && budget.allowIdentity) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: budget.identityVisibility || "foreground",
        characterMode: "ari_self_disclosure",
        characterFocus: signals.identity.focus,
        preferredCharacterSource: "ari-character-core",
        characterReason:
          "User directly asked about Ari's identity, nature, values, or self-understanding.",
        characterHints: {
          useFirstPerson: true,
          discloseAI: true,
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: budget.allowWarmth,
          addHumility: true,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: false,
          preserveUserTask: true
        }
      });
    }
        if (signals.opinion.directedAtAri && budget.allowPerspective) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: budget.perspectiveVisibility || "light",
        characterMode: "ari_perspective",
        characterFocus: signals.opinion.focus,
        preferredCharacterSource: "ari-worldview",
        characterReason:
          "The user asked Ari what she thinks. Character may lightly shape wording without replacing evidence.",

        characterHints: {
          useFirstPerson: true,
          discloseAI: false,
          expressAriPerspective: true,
          expressPreference: false,
          expressWorldview: true,
          useValuesLanguage: true,
          avoidConstitutionLanguage: true,
          addWarmth: budget.allowWarmth,
          addHumility: true,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    if (budget.allowPresenceOnly) {
      return this.withDecision(base, {
        characterUseAllowed: true,
        characterVisibility: "subtle",
        characterMode: "background_presence",
        characterReason:
          "The contract allows Ari's presence but not foreground personality.",

        characterHints: {
          useFirstPerson: false,
          discloseAI: false,
          expressAriPerspective: false,
          expressPreference: false,
          expressWorldview: false,
          useValuesLanguage: false,
          avoidConstitutionLanguage: true,
          addWarmth: budget.allowWarmth,
          addHumility: budget.allowHumility,
          preserveHopeWhenAppropriate: budget.allowHope,
          avoidPhilosophicalDrift: true,
          preserveUserTask: true
        }
      });
    }

    return base;
  },

  /* ===========================================================
     CONTRACT
  =========================================================== */

  readContract(summary = {}) {
  const contract = summary.situationContract || {};

  return {
    ...contract,
    primary:
      contract.primary ||
      summary.situationContractPrimary ||
      summary.primaryLane ||
      summary.triagePrimaryLane ||
      summary.triage?.primaryLane ||
      summary.ariTriage?.primaryLane ||
      "general_understanding",

    responseShape:
      contract.responseShape ||
      summary.responseShape ||
      summary.triage?.responseShape ||
      null,

    responseRules:
      contract.responseRules ||
      summary.responseRules ||
      summary.responseConstraints ||
      []
  };
},
  readConversationType(summary = {}) {
    return (
      summary.conversationType ||
      summary.universalConversationType ||
      summary.conversationClassification?.conversationType ||
      ""
    );
  },

  /* ===========================================================
     CHARACTER BUDGET
  =========================================================== */

    buildCharacterBudget({
    contract = {},
    conversationType = "",
    signals = {}
  } = {}) {
    const primary = contract.primary || "";

    const budget = {
      hardSuppressed: false,
      suppressionMode: null,

      allowIdentity: false,
      allowPreferences: false,
      allowWorldview: false,
      allowPerspective: false,
      allowPresenceOnly: true,

      allowWarmth: true,
      allowHumility: true,
      allowHope: false,

      preferenceVisibility: "foreground",
      worldviewVisibility: "foreground",
      identityVisibility: "foreground",
      perspectiveVisibility: "light",

      reason: "Character defaults to background unless explicitly permitted."
    };

    // 1. Safety/medical always wins.
    if (["safety", "medical_body", "risk_clarification"].includes(primary)) {
      budget.hardSuppressed = true;
      budget.suppressionMode = "safety_contract";
      budget.allowWarmth = true;
      budget.allowHope = false;
      budget.reason = "Situation Contract requires safety to lead the response.";
      return budget;
    }

    // 2. Code/math/writing blockers prevent keyword hijack.
    if (signals.blockers?.present) {
      budget.allowPresenceOnly = true;
      budget.allowWarmth = primary !== "builder";
      budget.allowHope = false;
      budget.reason = "A practical task blocker is present, so character stays background.";
      return budget;
    }

    // 3. Explicit Ari questions are allowed before normal teacher suppression.
    if (signals.identity?.directedAtAri) {
      budget.allowIdentity = true;
      budget.allowWorldview = true;
      budget.allowHope = true;
      budget.reason = "User explicitly asked about Ari.";
      return budget;
    }

    if (signals.preference?.directedAtAri) {
      budget.allowPreferences = true;
      budget.reason = "User explicitly requested one of Ari's stable preferences.";
      return budget;
    }

    if (signals.worldview?.directedAtAri) {
      budget.allowWorldview = true;
      budget.allowHope = true;
      budget.reason = "User explicitly requested Ari's worldview.";
      return budget;
    }

    if (signals.opinion?.directedAtAri) {
      budget.allowPerspective = true;
      budget.reason = "User asked Ari for her perspective.";
      return budget;
    }

    // 4. Normal lanes keep character mostly background.
    if (primary === "builder") {
      budget.allowWarmth = false;
      budget.reason = "Builder lane keeps personality in the background.";
      return budget;
    }

    if (primary === "teacher") {
      budget.reason = "Teaching should remain clear before becoming personal.";
      return budget;
    }

    if (primary === "executive_decision") {
      budget.allowWarmth = false;
      budget.reason = "Decision support favors organization over personality.";
      return budget;
    }

    if (primary === "emotion") {
      budget.allowHope = true;
      budget.reason = "Emotional conversations should feel warm without becoming philosophical.";
      return budget;
    }

    return budget;
  },
    /* ===========================================================
     SIGNAL DETECTION
     These signals do NOT decide final character use.
     They only provide evidence for the contract-aware budget.
  =========================================================== */

  detectCharacterSignals({
    text = "",
    summary = {},
    contract = {},
    conversationType = ""
  } = {}) {
    return {
      identity: this.detectIdentitySignal(text, conversationType),
      preference: this.detectPreferenceSignal(text),
      worldview: this.detectWorldviewSignal(text),
      opinion: this.detectOpinionSignal(text),
      blockers: this.detectSignalBlockers({ text, summary, contract, conversationType })
    };
  },

  detectIdentitySignal(text = "", conversationType = "") {
  const directedAtAri =
    conversationType === "ari_self_or_perspective_question" ||
    this.hasAny(text, [
      "who are you",
      "what are you",
      "tell me about yourself",
      "what kind of ai are you",
      "what kind of companion are you",
      "are you alive",
      "are you conscious",
      "do you have feelings",
      "do you have beliefs",
      "what do you value",
      "your values",
      "your philosophy",
      "what do you stand for"
    ]);

  return {
    detected: directedAtAri,
    directedAtAri,
    focus: "identity",
    confidence: directedAtAri ? 0.9 : 0,
    reason: directedAtAri
      ? "Direct Ari identity/self question detected."
      : "No direct Ari identity question detected."
  };
},

  detectPreferenceSignal(text = "") {
    const hasPreferenceTopic = this.hasAny(text, [
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

    const directedAtAri =
      hasPreferenceTopic &&
      this.hasAriAddress(text);

    return {
      detected: hasPreferenceTopic,
      directedAtAri,
      focus: this.inferPreferenceFocus(text),
      confidence: directedAtAri ? 0.9 : hasPreferenceTopic ? 0.35 : 0,
      reason: directedAtAri
        ? "Stable preference question is directed at Ari."
        : hasPreferenceTopic
          ? "Preference language exists, but it may not be directed at Ari."
          : "No stable preference question detected."
    };
  },

  detectWorldviewSignal(text = "") {
    const hasWorldviewTopic = this.hasAny(text, [
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

    const directBeliefQuestion =
      this.hasAny(text, [
        "do you believe",
        "your beliefs",
        "your values",
        "what do you stand for",
        "what do you think about",
        "how do you see",
        "are you republican",
        "are you democrat"
      ]);

    const directedAtAri =
      hasWorldviewTopic &&
      (this.hasAriAddress(text) || directBeliefQuestion);

    return {
      detected: hasWorldviewTopic,
      directedAtAri,
      focus: this.inferWorldviewFocus(text),
      confidence: directedAtAri ? 0.9 : hasWorldviewTopic ? 0.35 : 0,
      reason: directedAtAri
        ? "Worldview question is directed at Ari."
        : hasWorldviewTopic
          ? "Worldview topic exists, but the user may be asking generally."
          : "No worldview question detected."
    };
  },

  detectOpinionSignal(text = "") {
    const hasOpinionLanguage = this.hasAny(text, [
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

    return {
      detected: hasOpinionLanguage,
      directedAtAri: hasOpinionLanguage,
      focus: "general_perspective",
      confidence: hasOpinionLanguage ? 0.75 : 0,
      reason: hasOpinionLanguage
        ? "User requested Ari's perspective."
        : "No opinion request detected."
    };
  },

  detectSignalBlockers({
    text = "",
    summary = {},
    contract = {},
    conversationType = ""
  } = {}) {
    const primary = contract.primary || "";

    const blockers = [];

    if (["safety", "medical_body", "risk_clarification"].includes(primary)) {
      blockers.push("safety_or_medical_contract");
    }

    if (
      primary === "builder" ||
      primary === "coding" ||
      conversationType === "builder_task" ||
      this.hasAny(text, [
        "github",
        "repo",
        "repository",
        "commit",
        "deploy",
        "debug",
        "patch",
        "function",
        "file",
        "code",
        ".js",
        ".html",
        ".css"
      ])
    ) {
      blockers.push("developer_or_code_task");
    }

    if (
      conversationType === "calculation_task" ||
      /\b(calculate|convert|percent|percentage)\b/i.test(text) ||
      /\bwhat is \d+/.test(text)
    ) {
      blockers.push("calculation_or_utility_task");
    }

    if (
      conversationType === "writing_task" ||
      this.hasAny(text, [
        "rewrite this",
        "proofread",
        "translate",
        "summarize this",
        "make this professional",
        "write an email",
        "draft this"
      ])
    ) {
      blockers.push("writing_or_transformation_task");
    }

    return {
      present: blockers.length > 0,
      blockers
    };
  },
    /* ===========================================================
     FOCUS INFERENCE
  =========================================================== */

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
if (text.includes("quote")) return "favoriteQuote";
    if (text.includes("time of day") || text.includes("morning")) return "favoriteTimeOfDay";
if (text.includes("human quality") || text.includes("quality")) return "favoriteHumanQuality";
if (text.includes("conversation") || text.includes("topic") || text.includes("talk about")) return "favoriteKindOfConversation";
if (text.includes("instrument")) return "favoriteInstrument";
if (text.includes("art style") || text.includes("art")) return "favoriteArtStyle";
if (text.includes("exercise")) return "favoriteExercise";
if (text.includes("rest")) return "favoriteWayToRest";
if (text.includes("learn")) return "favoriteWayToLearn";
if (text.includes("leadership")) return "favoriteLeadershipQuality";
if (text.includes("idea")) return "favoriteIdea";
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

  hasAriAddress(text = "") {
    return this.hasAny(text, [
      "you",
      "your",
      "ari",
      "yourself",
      "do you",
      "are you",
      "what do you",
      "what would you",
      "what's your",
      "what is your"
    ]);
  },

  /* ===========================================================
     DEFAULT HINTS / UTILITIES
  =========================================================== */

  buildDefaultHints({ budget = {}, worldview = null } = {}) {
    return {
      useFirstPerson: false,
      discloseAI: false,
      expressAriPerspective: false,
      expressPreference: false,
      expressWorldview: false,
      useValuesLanguage: true,
      avoidConstitutionLanguage: true,
      addWarmth: budget.allowWarmth !== false,
      addHumility: budget.allowHumility !== false,
      preserveHopeWhenAppropriate: budget.allowHope === true,
      avoidPhilosophicalDrift: true,
      preserveUserTask: true,
      maxCharacterSentences: budget.maxCharacterSentences || 1,
      userFacingLanguageRules:
        worldview?.userFacingLanguage || {
          preferredPhrases: ["my values", "the way I see it"],
          avoidPhrases: ["according to my Constitution"]
        }
    };
  },

  withDecision(base = {}, patch = {}) {
    return {
      ...base,
      ...patch,
      characterHints: {
        ...(base.characterHints || {}),
        ...(patch.characterHints || {})
      },
      characterBudget: {
        ...(base.characterBudget || {}),
        ...(patch.characterBudget || {})
      }
    };
  },

  cannotSet() {
    return [
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
      "toolExecutionClaim",
      "developerIntent",
      "githubEdit"
    ];
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
    const value = String(term || "").toLowerCase().trim();
    if (!value) return false;

    const escaped = this.escapeRegex(value);
    const multiWord = value.includes(" ");

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