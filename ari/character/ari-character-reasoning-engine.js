// ari/character/ari-character-reasoning-engine.js
// Purpose: Build Ari's stable character answer from Supabase Character Knowledge + local fallback.
// V1.1.9 — Exact Supabase Preference Trust / Generic Favorite Composer

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "1.1.9",

  reason(input = {}) {
    const summary = input.summary || input || {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      {};

    const characterKnowledge =
      summary.characterKnowledge ||
      summary.supabaseCharacterKnowledge ||
      null;

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
      characterKnowledge?.characterFocus ||
      this.inferPreferenceFocus(text) ||
      (this.isWorldviewQuestion(text) ? this.inferWorldviewFocus(text) : null);

    const characterRelevant =
      isDirectAriCharacterQuestion &&
      (
        context.characterUseAllowed === true ||
        characterKnowledge?.characterKnowledgeAvailable === true ||
        characterKnowledge?.inferenceNeeded === true ||
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

    if (characterKnowledge?.characterKnowledgeAvailable === true) {
      return this.buildSupabaseCharacterAnswer({
        text,
        focus: characterFocus,
        characterKnowledge,
        expression: context
      });
    }

    if (characterKnowledge?.inferenceNeeded === true) {
      return this.buildValuesInferenceAnswer({
        text,
        focus: characterFocus,
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

  buildSupabaseCharacterAnswer({
    text = "",
    focus = "",
    characterKnowledge = null,
    expression = null
  } = {}) {
    const node = characterKnowledge?.primaryNode || null;

    if (!node) {
      return this.noCharacterAnswer({
        reason: "No Supabase character primary node available.",
        expression
      });
    }

    if (
      this.isFavoriteQuestion(text) &&
      this.isGenericNoStoredPreferenceNode(node)
    ) {
      return this.buildValuesInferenceAnswer({ text, focus, expression });
    }

    const type = String(node.knowledge_type || "").toLowerCase();

    let draft = "";

    if (type.includes("preference")) {
      draft = this.composePreferenceNodeDraft(node);
    } else if (type.includes("worldview")) {
      draft = this.composeWorldviewNodeDraft(node);
    } else if (type.includes("core") || type.includes("character")) {
      draft = this.composeCoreNodeDraft(node, text);
    } else {
      draft = this.composeGenericNodeDraft(node);
    }

    return this.buildCharacterResult({
      type: type || "supabase_character_knowledge",
      focus: focus || node.preference_key || node.knowledge_id || node.topic || null,
      source: "ari-supabase-character-knowledge-engine",
      confidence: characterKnowledge.confidence || "high",
      answer: node.summary || node.definition || node.topic || "",
      reasoning: node.definition || node.deep_understanding || node.purpose || "",
      userFacingDraft: draft,
      expression,
      characterKnowledge
    });
  },

  composePreferenceNodeDraft(node = {}) {
    const topic = String(node.topic || "").trim();
    const topicLower = topic.toLowerCase();

    const summary = String(node.summary || "").trim().replace(/\.$/, "");
    const definition = String(node.definition || "").trim();
    const deep = String(node.deep_understanding || "").trim();

    if (topicLower.startsWith("favorite ") && summary) {
      const subject = topic.replace(/^favorite\s+/i, "").toLowerCase();

      return [
        `My favorite ${subject} is ${summary}.`,
        definition,
        deep
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    if (summary && definition) {
      return [summary + ".", definition, deep].filter(Boolean).join(" ").trim();
    }

    if (summary) return summary + ".";
    if (definition) return [definition, deep].filter(Boolean).join(" ").trim();

    return this.composeGenericNodeDraft(node);
  },

  composeWorldviewNodeDraft(node = {}) {
    return this.composeGenericNodeDraft(node);
  },

  composeCoreNodeDraft(node = {}, text = "") {
    const topic = String(node.topic || "").toLowerCase();

    if (topic.includes("identity")) {
      return "I’m Ari. I’m an AI reasoning companion with a stable character and mission: to help people become healthier, wiser, stronger, and more fulfilled without feeling like they’re doing it alone.";
    }

    if (topic.includes("mission") || topic.includes("purpose")) {
      return "My mission is to help people become healthier, wiser, stronger, and more fulfilled — and to make sure they do not feel like they have to find that path alone.";
    }

    if (topic.includes("values")) {
      return "What I stand for is pretty simple: truth, dignity, wisdom, compassion, strength, humility, growth, service, and realistic hope.";
    }

    return this.composeGenericNodeDraft(node);
  },

  composeGenericNodeDraft(node = {}) {
    return [
      node.summary,
      node.definition,
      node.deep_understanding,
      node.purpose,
      node.universal_principle
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  },

  buildValuesInferenceAnswer({ text = "", focus = "", expression = null } = {}) {
    const inferred = this.inferUnknownPreference(text);

    return this.buildCharacterResult({
      type: "character_values_inference",
      focus: focus || "inferred_character_answer",
      source: "ari-character-reasoning-engine",
      confidence: "medium",
      answer: inferred.answer,
      reasoning: inferred.reasoning,
      userFacingDraft: inferred.draft,
      expression
    });
  },

  inferUnknownPreference(text = "") {
    const clean = String(text || "").toLowerCase();

    const favoriteMatch =
      clean.match(/favorite\s+([a-z\s]+?)(\?|$)/i) ||
      clean.match(/favorite\s+kind\s+of\s+([a-z\s]+?)(\?|$)/i);

    const subject = favoriteMatch?.[1]
      ? favoriteMatch[1].replace(/\b(is|are|do|you|your)\b/g, "").trim()
      : "";

    const label = subject || "that";

    return {
      answer: `values-based inferred preference for ${label}`,
      reasoning:
        "No exact stored preference matched, so Ari inferred from values: steadiness, honesty, usefulness, warmth, dignity, growth, and quiet meaning.",
      draft:
        `I don’t have a fixed favorite ${label} stored yet. But if I answer from my values, I’d choose something steady, honest, useful, and quietly meaningful — something with substance over flash.`
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

  isFavoriteQuestion(text = "") {
    return this.hasAny(text, [
      "your favorite",
      "what is your favorite",
      "what's your favorite",
      "whats your favorite"
    ]);
  },

  isGenericNoStoredPreferenceNode(node = {}) {
    const combined = [
      node.topic,
      node.summary,
      node.definition,
      node.purpose,
      node.deep_understanding
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      combined.includes("does not have a stored preference") ||
      combined.includes("does not have a fixed favorite") ||
      combined.includes("should answer honestly instead of inventing")
    );
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
    characterKnowledge = null
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
      characterKnowledge,

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