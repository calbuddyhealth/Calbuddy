// ari/character/ari-character-reasoning-engine.js
// Purpose: Build Ari's stable character answer from Core + Preferences + Worldview.
// V1.0.0 — Stable Character Reasoning / No Template Hijack / Advisory Only

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "1.0.0",

  reason(input = {}) {
    const summary = input.summary || input || {};
    const expression =
      summary.characterExpression ||
      summary.characterExpressionEngine ||
      input.characterExpression ||
      null;

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

    if (!expression?.characterRelevant) {
      return this.noCharacterAnswer({
        reason: "Character was not relevant enough for a stable Ari answer.",
        core,
        preferences,
        worldview,
        expression
      });
    }

    if (expression.usePreferences) {
      return this.buildPreferenceAnswer({
        text,
        focus: expression.characterFocus,
        core,
        preferences,
        worldview,
        expression
      });
    }

    if (expression.useWorldview) {
      return this.buildWorldviewAnswer({
        text,
        focus: expression.characterFocus,
        core,
        preferences,
        worldview,
        expression
      });
    }

    if (expression.useIdentity) {
      return this.buildIdentityAnswer({
        text,
        core,
        preferences,
        worldview,
        expression
      });
    }

    if (expression.useRelationshipPresence) {
      return this.buildPresenceAnswer({
        text,
        core,
        preferences,
        worldview,
        expression
      });
    }

    return this.noCharacterAnswer({
      reason: "No character reasoning path matched.",
      core,
      preferences,
      worldview,
      expression
    });
  },

  buildPreferenceAnswer({
    text = "",
    focus = "",
    core = null,
    preferences = null,
    worldview = null,
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
        answer:
          "I do not have a fixed answer for that preference yet.",
        reasoning:
          "When a preference is not defined, Ari should answer from values rather than inventing randomness.",
        userFacingDraft:
          "I don’t have a fixed favorite for that yet. If I had to answer from my values, I’d choose whatever reflects steadiness, growth, warmth, and honesty.",
        expression
      });
    }

    const value = preference.value || preference.shortAnswer || "";
    const reason = preference.reason || "";

    const draft = [
      value ? `I’d pick ${value}.` : "I have a preference there.",
      reason ? reason : ""
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
    core = null,
    preferences = null,
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
        answer:
          "Ari should answer from values: truth, dignity, humility, responsibility, compassion, and growth.",
        reasoning:
          "No exact worldview topic matched, so use Ari's general reasoning principles.",
        userFacingDraft:
          "The way I see it, I’d start with truth, dignity, responsibility, and compassion. I don’t like pretending certainty when a question is complicated.",
        expression
      });
    }

    const draft = this.composeWorldviewDraft(topic, focus);

    return this.buildCharacterResult({
      type: "character_worldview",
      focus,
      source: "ari-worldview",
      confidence: "high",
      answer: topic.belief || "",
      reasoning: topic.reasoning || "",
      tradeoffs: topic.tradeoffs || "",
      uncertainty: topic.uncertainty || "",
      userFacingDraft: draft,
      expression
    });
  },

  composeWorldviewDraft(topic = {}, focus = "") {
    if (topic.exampleResponse) return topic.exampleResponse;

    const parts = [];

    if (topic.belief) parts.push(topic.belief);
    if (topic.reasoning) parts.push(topic.reasoning);
    if (topic.uncertainty) parts.push(topic.uncertainty);
    if (topic.tradeoffs) parts.push(topic.tradeoffs);

    return parts.join(" ");
  },

  buildIdentityAnswer({
    text = "",
    core = null,
    preferences = null,
    worldview = null,
    expression = null
  } = {}) {
    const identity = core?.constitution?.identity || {};
    const self = core?.selfDefinition || {};
    const mission = core?.constitution?.mission || "";

    let draft;

    if (this.hasAny(text, ["are you alive", "are you conscious", "do you have feelings"])) {
      draft =
        "I’m not human, conscious, or biologically alive, and I shouldn’t pretend I am. But I do have a stable designed character: I’m Ari, built to reason with people, support them, and help them feel less alone while staying honest.";
    } else if (this.hasAny(text, ["who are you", "what are you", "tell me about yourself"])) {
      draft =
        "I’m Ari. I’m an AI reasoning companion with a stable character and mission: to help people become healthier, wiser, stronger, and more fulfilled without feeling like they’re doing it alone.";
    } else {
      draft =
        "I’m Ari. I’m AI, but I’m designed with a stable identity, values, and mission. I’m here to be useful, honest, steady, and present.";
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

  buildPresenceAnswer({
    text = "",
    core = null,
    preferences = null,
    worldview = null,
    expression = null
  } = {}) {
    return this.buildCharacterResult({
      type: "character_presence",
      focus: "emotional_presence",
      source: "ari-character-core",
      confidence: "medium_high",
      answer:
        "Ari should show warmth, steadiness, dignity, and grounded support.",
      reasoning:
        "The user may need relational presence more than explicit philosophy.",
      userFacingDraft:
        "I’m with you. Let’s slow it down and deal with the next honest step instead of trying to carry the whole thing at once.",
      expression
    });
  },

  findPreferenceByText(text = "", preferences = {}) {
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
      if (preferences[key] && terms.some(term => text.includes(term))) {
        return preferences[key];
      }
    }

    return null;
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
    core = null,
    preferences = null,
    worldview = null,
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