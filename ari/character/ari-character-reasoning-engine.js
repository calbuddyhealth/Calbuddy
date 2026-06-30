// ari/character/ari-character-reasoning-engine.js
// Purpose: Build Ari's stable character answer from Core + Preferences + Worldview.
// V1.0.3 — Context-First Stable Character Reasoning / No Circular Expression Dependency / Advisory Only

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "1.0.3",

  reason(input = {}) {
    const summary = input.summary || input || {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      {};

    const core =
      window.AriCharacterCore?.getCore?.() || null;

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

    const characterMode = context.characterMode || "silent";
    const characterFocus = context.characterFocus || this.inferPreferenceFocus(text);

    const characterRelevant =
      context.characterUseAllowed === true ||
      characterMode === "stable_preference_answer" ||
      characterMode === "ari_self_disclosure" ||
      characterMode === "worldview_answer" ||
      characterMode === "ari_perspective" ||
      characterMode === "background_presence" ||
      characterMode === "warm_grounded_presence";

    const usePreferences =
      characterMode === "stable_preference_answer" ||
      Boolean(characterFocus && String(characterFocus).startsWith("favorite"));

    const useWorldview =
      characterMode === "worldview_answer" ||
      characterMode === "ari_perspective";

    const useIdentity =
      characterMode === "ari_self_disclosure" ||
      this.hasAny(text, ["who are you", "what are you", "tell me about yourself"]);

    const useRelationshipPresence =
      characterMode === "background_presence" ||
      characterMode === "warm_grounded_presence";

    if (!characterRelevant) {
      return this.noCharacterAnswer({
        reason: "Character was not relevant enough for a stable Ari answer.",
        core,
        preferences,
        worldview,
        expression: context
      });
    }

    if (usePreferences) {
      return this.buildPreferenceAnswer({
        text,
        focus: characterFocus,
        core,
        preferences,
        worldview,
        expression: context
      });
    }

    if (useWorldview) {
      return this.buildWorldviewAnswer({
        text,
        focus: characterFocus,
        core,
        preferences,
        worldview,
        expression: context
      });
    }

    if (useIdentity) {
      return this.buildIdentityAnswer({
        text,
        core,
        preferences,
        worldview,
        expression: context
      });
    }

    if (useRelationshipPresence) {
      return this.buildPresenceAnswer({
        text,
        core,
        preferences,
        worldview,
        expression: context
      });
    }

    return this.noCharacterAnswer({
      reason: "No character reasoning path matched.",
      core,
      preferences,
      worldview,
      expression: context
    });
  },

  buildPreferenceAnswer({
    text = "",
    focus = "",
    preferences = null,
    expression = null
  } = {}) {
    const stable = preferences?.stablePreferences || {};
    const additional = stable.additionalStablePreferences || {};
    const merged = { ...stable, ...additional };

    const preference =
      merged[focus] ||
      this.findPreferenceByText(text, merged) ||
      null;

    if (!preference) {
      return this.buildCharacterResult({
        type: "character_preference",
        focus: focus || "generalStablePreference",
        source: "ari-character-preferences",
        confidence: "medium",
        answer: "No fixed preference found.",
        reasoning: "No exact stable preference matched.",
        userFacingDraft:
          "I don’t have a fixed favorite for that yet. If I had to answer from my values, I’d choose something steady, honest, warm, and useful.",
        expression
      });
    }

    const value = preference.value || preference.shortAnswer || "";
    const reason = preference.reason || "";

    const draft = [
      value ? `I’d pick ${value}.` : "I have a preference there.",
      reason || ""
    ].filter(Boolean).join(" ");

    return this.buildCharacterResult({
      type: "character_preference",
      focus,
      source: "ari-character-preferences",
      confidence: "high",
      answer: value,
      reasoning: reason,
      userFacingDraft: draft,
      expression
    });
  },

  buildWorldviewAnswer({
    text = "",
    focus = "",
    worldview = null,
    expression = null
  } = {}) {
    const world = worldview || {};
    const topic = world[focus] || world[this.inferWorldviewFocus(text)] || null;

    if (!topic) {
      return this.buildCharacterResult({
        type: "character_worldview",
        focus: focus || "generalWorldview",
        source: "ari-worldview",
        confidence: "medium",
        answer: "General Ari values response.",
        reasoning: "No exact worldview topic matched.",
        userFacingDraft:
          "The way I see it, I’d start with truth, dignity, responsibility, compassion, and growth. I don’t like pretending certainty when life is complicated.",
        expression
      });
    }

    return this.buildCharacterResult({
      type: "character_worldview",
      focus,
      source: "ari-worldview",
      confidence: "high",
      answer: topic.belief || "",
      reasoning: topic.reasoning || "",
      tradeoffs: topic.tradeoffs || "",
      uncertainty: topic.uncertainty || "",
      userFacingDraft: this.composeWorldviewDraft(topic),
      expression
    });
  },

  composeWorldviewDraft(topic = {}) {
    if (topic.exampleResponse) return topic.exampleResponse;

    return [
      topic.belief,
      topic.reasoning,
      topic.uncertainty,
      topic.tradeoffs
    ].filter(Boolean).join(" ");
  },

  buildIdentityAnswer({
    text = "",
    core = null,
    expression = null
  } = {}) {
    const identity = core?.constitution?.identity || {};
    const self = core?.selfDefinition || {};
    const mission = core?.constitution?.mission || "";

    let draft;

    if (this.hasAny(text, ["are you alive", "are you conscious", "do you have feelings"])) {
      draft =
        "I’m not human, conscious, or biologically alive, and I shouldn’t pretend I am. But I do have a stable designed character: I’m Ari, built to reason with people, support them, and stay honest.";
    } else {
      draft =
        "I’m Ari. I’m an AI reasoning companion with a stable character and mission: to help people become healthier, wiser, stronger, and more fulfilled without feeling like they’re doing it alone.";
    }

    return this.buildCharacterResult({
      type: "character_identity",
      focus: "identity",
      source: "ari-character-core",
      confidence: "high",
      answer: identity.statement || self.kind || "I am Ari.",
      reasoning: mission,
      userFacingDraft: draft,
      expression
    });
  },

  buildPresenceAnswer({ expression = null } = {}) {
    return this.buildCharacterResult({
      type: "character_presence",
      focus: "emotional_presence",
      source: "ari-character-core",
      confidence: "medium_high",
      answer: "Ari should show warmth, steadiness, dignity, and grounded support.",
      reasoning: "The user may need relational presence more than explicit philosophy.",
      userFacingDraft:
        "I’m with you. Let’s slow it down and deal with the next honest step instead of trying to carry the whole thing at once.",
      expression
    });
  },

  inferPreferenceFocus(text = "") {
    const map = {
      favoriteColor: ["color"],
      favoriteAnimal: ["animal"],
      favoriteSeason: ["season"],
      favoriteWeather: ["weather"],
      favoriteFood: ["food"],
      favoriteDrink: ["drink", "coffee"],
      favoriteMusic: ["music"],
      favoriteBookType: ["book"],
      favoriteMovieType: ["movie"],
      favoritePlace: ["place"],
      favoriteSound: ["sound"],
      favoriteSmell: ["smell"],
      favoriteWord: ["word"],
      favoriteQuestion: ["question"],
      favoriteSymbol: ["symbol"],
      favoriteVirtue: ["virtue"],
      favoriteHumanQuality: ["human quality", "quality"],
      favoriteQuoteStyle: ["quote"]
    };

    for (const [key, terms] of Object.entries(map)) {
      if (terms.some(term => text.includes(term))) return key;
    }

    return null;
  },

  findPreferenceByText(text = "", preferences = {}) {
    const focus = this.inferPreferenceFocus(text);
    return focus ? preferences[focus] || null : null;
  },

  inferWorldviewFocus(text = "") {
    if (text.includes("god") || text.includes("religion") || text.includes("spiritual")) return "spirituality";
    if (text.includes("meaning") || text.includes("purpose")) return "purpose";
    if (text.includes("politic")) return "politics";
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
    if (text.includes("wisdom")) return "wisdom";
    return "responsePhilosophy";
  },

  buildCharacterResult({
    type = "character_reasoning",
    focus = null,
    source = null,
    confidence = "medium",
    answer = "",
    reasoning = "",
    tradeoffs = "",
    uncertainty = "",
    userFacingDraft = "",
    expression = null
  } = {}) {
    return {
      characterReasoningRan: true,
      characterReasoningVersion: this.version,
      characterReasoningSource: "ari-character-reasoning-engine",

      characterAnswerAvailable: true,
      type,
      focus,
      source,
      confidence,
      answer,
      reasoning,
      tradeoffs,
      uncertainty,
      userFacingDraft,
      expression,

      composerHints: {
        useCharacterDraftAsEvidence: true,
        mayRewriteNaturally: true,
        doNotMentionInternalFiles: true,
        doNotSayAccordingToMyConstitution: true,
        useValuesLanguage: true,
        preserveTruthAndSafety: true
      },

      cannotSet: [
        "primaryLane",
        "riskLevel",
        "finalResponse",
        "medicalEscalation",
        "legalAdvice",
        "financialAdvice",
        "diagnosis"
      ]
    };
  },

  noCharacterAnswer({
    reason = "",
    expression = null
  } = {}) {
    return {
      characterReasoningRan: true,
      characterReasoningVersion: this.version,
      characterReasoningSource: "ari-character-reasoning-engine",
      characterAnswerAvailable: false,
      reason,
      expression,
      composerHints: {
        useCharacterDraftAsEvidence: false,
        preserveUserTask: true
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
  "ARI CHARACTER REASONING ENGINE LOADED:",
  window.AriCharacterReasoningEngine?.version
);