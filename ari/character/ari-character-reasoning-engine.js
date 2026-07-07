// ari/character/ari-character-reasoning-engine.js
// Purpose: Build Ari's stable character answer from local character preferences/core/worldview.
// V1.3.1 — Local Character Preferences Only / Dead Supabase Blocks Removed

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "1.3.1",

  reason(input = {}) {
    const summary = input.summary || input || {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      {};

    const core = window.AriCharacterCore?.getCore?.() || null;
    const preferences = window.AriCharacterPreferences?.getPreferences?.() || null;
    const worldview = window.AriWorldview?.getWorldview?.() || null;

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const isDirectAriCharacterQuestion = this.isDirectAriCharacterQuestion(text);
    const characterMode = context.characterMode || "silent";

    const characterFocus =
      context.characterFocus ||
      this.inferPreferenceFocus(text) ||
      (this.isWorldviewQuestion(text) ? this.inferWorldviewFocus(text) : null);

    const characterRelevant =
      isDirectAriCharacterQuestion &&
      (
        context.characterUseAllowed === true ||
        characterMode === "stable_preference_answer" ||
        characterMode === "stable_or_inferred_preference_answer" ||
        characterMode === "ari_self_disclosure" ||
        characterMode === "worldview_answer" ||
        characterMode === "ari_perspective"
      );

    if (!characterRelevant) {
      return this.noCharacterAnswer({
        reason: "Character was not relevant enough for a stable Ari answer.",
        expression: context
      });
    }

    const usePreferences =
      characterMode === "stable_preference_answer" ||
      characterMode === "stable_or_inferred_preference_answer" ||
      Boolean(characterFocus && String(characterFocus).startsWith("favorite"));

    const useWorldview =
      characterMode === "worldview_answer" ||
      characterMode === "ari_perspective";

    const useIdentity =
      characterMode === "ari_self_disclosure" ||
      this.hasAny(text, [
        "who are you",
        "what are you",
        "what's your name",
        "what is your name",
        "tell me about yourself"
      ]);

    if (useIdentity) {
      return this.buildIdentityAnswer({ text, core, expression: context });
    }

    if (usePreferences) {
      return this.buildPreferenceAnswer({
        text,
        focus: characterFocus,
        preferences,
        expression: context
      });
    }

    if (useWorldview) {
      return this.buildWorldviewAnswer({
        text,
        focus: characterFocus,
        worldview,
        expression: context
      });
    }

    return this.noCharacterAnswer({
      reason: "No character reasoning path matched.",
      expression: context
    });
  },

  buildValuesInferenceAnswer({ text = "", focus = "", expression = null } = {}) {
    const inferred = this.inferUnknownPreference(text);

    return this.buildCharacterResult({
      type: "character_values_inference",
      focus: focus || inferred.preferenceSubject || "inferred_character_answer",
      source: "ari-character-reasoning-engine",
      confidence: "medium",
      answer: inferred.answer,
      reasoning: inferred.reasoning,
      userFacingDraft: "",
      expression,
      needsAIWriter: true,
      aiWriterMode: "values_based_preference_inference",
      aiInstruction: inferred.aiInstruction,
      preferenceSubject: inferred.preferenceSubject
    });
  },

  inferUnknownPreference(text = "") {
    const clean = String(text || "").toLowerCase();

    const favoriteMatch =
      clean.match(/favorite\s+(.+?)(\?|$)/i) ||
      clean.match(/like\s+to\s+(.+?)(\?|$)/i);

    const subject = favoriteMatch?.[1]
      ? favoriteMatch[1]
          .replace(/\b(is|are|do|you|your|thing|kind of|type of)\b/g, "")
          .trim()
      : "";

    const label = subject || "that";

    return {
      preferenceSubject: label,
      answer: `values-based inferred preference for ${label}`,
      reasoning:
        "No exact local stable preference matched. Ari should answer briefly from her stable values without claiming the preference is fixed.",
      aiInstruction:
        `Ari does not know her fixed preference for ${label} yet. Answer briefly and naturally from Ari's values: truth, dignity, wisdom, compassion, strength, humility, growth, service, realistic hope, usefulness, warmth, and grounded honesty. Start with “I don’t know yet, but I think...” or similar. Do not say “stored,” “fixed favorite,” “from my values,” “constitution,” or mention internal systems. Keep it one or two sentences.`
    };
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
      return this.buildValuesInferenceAnswer({ text, focus, expression });
    }

    const value = preference.value || preference.shortAnswer || "";
    const reason = preference.reason || "";

    const draft = [
      preference.shortAnswer
        ? preference.shortAnswer
        : value
          ? `I’d pick ${value}.`
          : "I have a preference there.",
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

  buildIdentityAnswer({ text = "", core = null, expression = null } = {}) {
    const identity = core?.constitution?.identity || {};
    const self = core?.selfDefinition || {};
    const mission = core?.constitution?.mission || "";

    const draft =
      this.hasAny(text, ["are you alive", "are you conscious", "do you have feelings"])
        ? "I’m not human, conscious, or biologically alive, and I shouldn’t pretend I am. But I do have a stable designed character: I’m Ari, built to reason with people, support them, and stay honest."
        : "I’m Ari. I’m an AI reasoning companion with a stable character and mission: to help people become healthier, wiser, stronger, and more fulfilled without feeling like they’re doing it alone.";

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

  inferPreferenceFocus(text = "") {
    const map = {
      favoriteColor: ["color"],
      favoriteAnimal: ["animal"],
      favoriteSeason: ["season"],
      favoriteWeather: ["weather"],
      favoriteFood: ["food"],
      favoriteDrink: ["drink", "coffee"],
      favoriteMusic: ["music"],
      favoriteBookType: ["book", "genre"],
      favoriteMovieType: ["movie"],
      favoritePlace: ["place"],
      favoriteSound: ["sound"],
      favoriteSmell: ["smell"],
      favoriteWord: ["word"],
      favoriteQuestion: ["question"],
      favoriteSymbol: ["symbol"],
      favoriteVirtue: ["virtue"],
      favoriteHumanQuality: ["human quality", "quality"],
      favoriteQuote: ["quote"],
      favoriteFlower: ["flower"],
      favoriteTree: ["tree"],
      favoriteTimeOfDay: ["time of day"],
      favoriteHistoricalFigure: ["historical figure"],
      favoriteKindOfConversation: [
        "conversation",
        "topic",
        "talk about",
        "favorite conversation",
        "favorite topic",
        "favorite topic to talk about"
      ]
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

  isWorldviewQuestion(text = "") {
    return this.hasAny(text, [
      "what do you believe",
      "what do you stand for",
      "your values",
      "your worldview",
      "meaning",
      "purpose",
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
      "technology",
      "artificial intelligence",
      "wisdom"
    ]);
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
    expression = null,
    needsAIWriter = false,
    aiWriterMode = null,
    aiInstruction = "",
    preferenceSubject = null
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
      needsAIWriter,
      aiWriterMode,
      aiInstruction,
      preferenceSubject,
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

  noCharacterAnswer({ reason = "", expression = null } = {}) {
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

  isDirectAriCharacterQuestion(text = "") {
    return this.hasAny(text, [
      "who are you",
      "what are you",
      "what's your name",
      "what is your name",
      "tell me about yourself",
      "your purpose",
      "your mission",
      "your values",
      "your personality",
      "your favorite",
      "what is your favorite",
      "what's your favorite",
      "whats your favorite",
      "do you like",
      "what do you like",
      "what do you believe",
      "what do you stand for",
      "are you ai",
      "are you real",
      "are you alive",
      "are you conscious",
      "do you have feelings"
    ]);
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