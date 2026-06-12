// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth coordinator for Ari Rebirth.
// V2.8

window.AriLanguageComposer = {
  compose(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const salienceMode =
      summary.synthesisMode ||
      summary.salienceMode ||
      "continue_observing";

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const needResponseMode = summary.needResponseMode || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;

    const languageMode = this.getLanguageMode(leadOrgan, salienceMode);

    const openingEngine = this.getEngine("AriMouthOpeningEngine", "AriOpeningEngine");
    const truthEngine = this.getEngine("AriMouthTruthEngine", "AriTruthEngine");
    const emotionEngine = this.getEngine("AriMouthEmotionEngine", "AriEmotionalNamingEngine");
    const wisdomEngine = this.getEngine("AriMouthWisdomEngine", "AriWisdomPrincipleEngine");
    const actionEngine = this.getEngine("AriMouthActionEngine", "AriActionGuidanceEngine");
    const voiceEngine = this.getEngine("AriMouthVoiceEngine", "AriVoiceBlendEngine");
    const shapeEngine = this.getEngine("AriMouthShapeEngine", "AriResponseShapeEngine");
    const shaperEngine = this.getEngine("AriMouthShaper", "AriResponseShaper");

    const openingResult = this.safeRunAny(openingEngine, ["create", "generate", "compose", "open", "run"], summary);
    const truthResult = this.safeRunAny(truthEngine, ["extract", "generate", "compose", "tell", "run"], summary);
    const emotionResult = this.safeRunAny(emotionEngine, ["name", "generate", "compose", "detect", "run"], summary);
    const wisdomResult = this.safeRunAny(wisdomEngine, ["distill", "generate", "compose", "resolve", "run"], summary);
    const actionResult = this.safeRunAny(actionEngine, ["guide", "generate", "compose", "recommend", "run"], summary);
    const voiceResult = this.safeRunAny(voiceEngine, ["blend", "generate", "compose", "choose", "run"], summary);
    const shapeResult = this.safeRunAny(shapeEngine, ["shape", "generate", "compose", "structure", "run"], summary);

    const recommendedQuestion =
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "What feels most important about this right now?";

    let opening =
      this.readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan, salienceMode);

    let meaningText =
      typeof summary.meaningStatement === "string" && summary.meaningStatement.trim()
        ? summary.meaningStatement.trim()
        : null;

    let synthesisText =
      typeof summary.synthesisStatement === "string" && summary.synthesisStatement.trim()
        ? summary.synthesisStatement.trim()
        : null;

    let truthText = this.readText(truthResult, ["truth", "text", "line"]);
    let emotionText = this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
    let wisdomText = this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = this.readText(actionResult, ["guidance", "action", "text", "line"]);

    if (salienceMode === "restore_dignity" || needResponseMode === "restore_dignity") {
      opening = "That sounds disrespectful and frustrating.";

      emotionText =
        primaryHumanNeed === "worth"
          ? "Feeling disrespected can hit your sense of worth, even when your worth has not actually changed."
          : emotionText;

      truthText =
        "Other people’s behavior may be giving you a signal, but it should not get to define your value.";

      wisdomText = null;

      actionText =
        "Start by naming what happened clearly, then separate the facts from the feeling that nobody respects you.";
    }

    if (salienceMode === "emotional_connection") {
      opening = "That sounds lonely.";
      emotionText = "The need underneath this may be connection, not just answers.";
      truthText = "Feeling alone does not mean you are actually without value or without people who care.";
      wisdomText = null;
      actionText = "Name who feels distant, then decide whether this needs comfort, repair, or a direct conversation.";
    }

    if (leadOrgan === "uncertainty") {
      if (truthText) meaningText = null;
      else if (meaningText) truthText = null;
    }

    if (leadOrgan === "emotion") {
      meaningText = null;

      if (this.isGenericUncertaintyLine(truthText)) truthText = null;
      if (this.isGenericWisdomLine(wisdomText)) wisdomText = null;
      if (this.isGenericActionLine(actionText)) actionText = null;
    }

    if (
      leadOrgan === "meaning" &&
      strongestSignalCategory !== "underlying_emotion"
    ) {
      emotionText = null;
    }

    const bodyParts = this.chooseBodyParts({
      leadOrgan,
      salienceMode,
      synthesisText,
      meaningText,
      truthText,
      emotionText,
      wisdomText,
      actionText
    });

    const cleanBodyParts = this.dedupeLines(bodyParts);

    const body =
      cleanBodyParts.length > 0
        ? cleanBodyParts.join("\n\n")
        : this.createFallbackBody(summary, leadOrgan, salienceMode);

    const closing =
      this.readText(shapeResult, ["closing", "question", "finalQuestion"]) ||
      recommendedQuestion;

    let finalResponse =
`${opening}

${body}

${closing}`;

    const shapedResponse = this.safeRunAny(
      shaperEngine,
      ["polish", "shape", "compose", "generate", "run"],
      { finalResponse },
      { finalResponse }
    );

    if (shapedResponse?.finalResponse) {
      finalResponse = shapedResponse.finalResponse;
    }

    return {
      languageMode,
      languageOpening: opening,
      languageBody: body,
      languageClosing: closing,
      finalResponse,

      mouthUsed: {
        opening: Boolean(opening),
        synthesis: cleanBodyParts.includes(synthesisText),
        meaning: cleanBodyParts.includes(meaningText),
        truth: cleanBodyParts.includes(truthText),
        emotion: cleanBodyParts.includes(emotionText),
        wisdom: cleanBodyParts.includes(wisdomText),
        action: cleanBodyParts.includes(actionText),
        voice: Boolean(voiceResult),
        shape: Boolean(shapeResult),
        shaper: Boolean(shapedResponse?.finalResponse)
      },

      mouthEnginesFound: {
        opening: Boolean(openingEngine),
        meaning: Boolean(summary.meaningStatement),
        truth: Boolean(truthEngine),
        emotion: Boolean(emotionEngine),
        wisdom: Boolean(wisdomEngine),
        action: Boolean(actionEngine),
        voice: Boolean(voiceEngine),
        shape: Boolean(shapeEngine),
        shaper: Boolean(shaperEngine)
      },

      mouthTextDebug: {
        leadOrgan,
        salienceMode,
        primaryHumanNeed,
        needResponseMode,
        opening,
        synthesisText,
        meaningText,
        truthText,
        emotionText,
        wisdomText,
        actionText,
        closing,
        selectedBodyParts: cleanBodyParts
      },

      source: "ari-language-composer"
    };
  },

  getLanguageMode(leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") return "restore_dignity";
    if (salienceMode === "emotional_connection") return "emotional_connection";

    const modeMap = {
      meaning: "life_chapter",
      identity: "identity",
      values: "values",
      stewardship: "stewardship",
      emotion: "emotion",
      wisdom: "wisdom",
      uncertainty: "uncertainty",
      observer: "observer"
    };

    return modeMap[leadOrgan] || "reflection";
  },

  getEngine(...names) {
    for (const name of names) {
      if (window[name]) return window[name];
    }
    return null;
  },

  safeRunAny(engine, methods = [], arg = {}, fallback = null) {
    try {
      if (!engine) return fallback;

      for (const method of methods) {
        if (typeof engine[method] === "function") {
          const result = engine[method](arg);
          if (result) return result;
        }
      }
    } catch (error) {
      console.warn("[AriLanguageComposer] mouth engine failed", error);
    }

    return fallback;
  },

  readText(result, keys = []) {
    if (!result) return null;

    if (typeof result === "string") {
      return result.trim() || null;
    }

    for (const key of keys) {
      if (typeof result[key] === "string" && result[key].trim()) {
        return result[key].trim();
      }
    }

    return null;
  },

  chooseBodyParts({
    leadOrgan,
    salienceMode,
    synthesisText,
    meaningText,
    truthText,
    emotionText,
    wisdomText,
    actionText
  } = {}) {
    if (salienceMode === "restore_dignity") {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (salienceMode === "emotional_connection") {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (leadOrgan === "meaning") {
      return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    }

    if (leadOrgan === "uncertainty") {
      return [truthText || synthesisText || meaningText, wisdomText, actionText].filter(Boolean);
    }

    if (leadOrgan === "emotion") {
      return [emotionText, truthText || synthesisText, actionText].filter(Boolean);
    }

    if (leadOrgan === "wisdom") {
      return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    }

    if (leadOrgan === "identity") {
      return [truthText || synthesisText || meaningText, wisdomText, actionText].filter(Boolean);
    }

    return [
      synthesisText,
      meaningText,
      truthText,
      emotionText,
      wisdomText,
      actionText
    ].filter(Boolean);
  },

  dedupeLines(lines = []) {
    const cleaned = [];

    for (const line of lines) {
      if (!line || typeof line !== "string") continue;

      const normalized = this.normalizeText(line);

      const duplicate = cleaned.some(existing => {
        const existingNormalized = this.normalizeText(existing);
        return (
          existingNormalized === normalized ||
          existingNormalized.includes(normalized) ||
          normalized.includes(existingNormalized)
        );
      });

      if (!duplicate) cleaned.push(line.trim());
    }

    return cleaned;
  },

  normalizeText(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  isGenericUncertaintyLine(text = "") {
    const normalized = this.normalizeText(text);

    return (
      normalized.includes("needs more context before naming this cleanly") ||
      normalized.includes("not enough evidence") ||
      normalized.includes("something is unclear") ||
      normalized.includes("before interpreting")
    );
  },

  isGenericWisdomLine(text = "") {
    const normalized = this.normalizeText(text);

    return (
      normalized.includes("not everything important can be first") ||
      normalized.includes("wisdom chooses what leads")
    );
  },

  isGenericActionLine(text = "") {
    const normalized = this.normalizeText(text);

    return (
      normalized.includes("ask one better question before choosing the next action") ||
      normalized.includes("ask one clarifying question before offering insight")
    );
  },

  humanizeLabel(label = "") {
    return String(label)
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim();
  },

  createFallbackOpening(summary = {}, leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") return "That sounds disrespectful and frustrating.";
    if (salienceMode === "emotional_connection") return "That sounds lonely.";

    if (leadOrgan === "meaning") return "Something feels important about this chapter.";
    if (leadOrgan === "identity") return "This may be more about identity than circumstance.";
    if (leadOrgan === "wisdom") return "There appears to be a real tension here.";
    if (leadOrgan === "stewardship") return "This may not be fear.";
    if (leadOrgan === "emotion") return "That sounds heavier than it looks.";
    if (leadOrgan === "uncertainty") return "Something is unclear here.";

    return "Something important may be present.";
  },

  createFallbackBody(summary = {}, leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") {
      return "Feeling disrespected matters. Ari should protect dignity first, then understand what happened without assuming the worst.";
    }

    if (salienceMode === "emotional_connection") {
      return "The need underneath this may be connection. Ari should respond with warmth before trying to analyze.";
    }

    const chapter = summary.primaryLifeChapter || null;
    const identity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    const tension = summary.wisdomTension || null;
    const value = summary.integratedValue || null;
    const hypothesis = summary.hypothesis || null;

    const chapterMap = {
      fatherhood_transition:
        "This seems to be about stepping into fatherhood with presence, steadiness, and love.",
      family_transition:
        "This seems to be about protecting family, presence, and the relationships that cannot be replaced.",
      purpose_chapter:
        "This seems to be about staying connected to the purpose behind what you are building.",
      builder_development:
        "This seems to be about becoming the kind of builder who can create without burning out.",
      identity_transition:
        "This seems to be about letting an old identity adapt to a new season."
    };

    const tensionMap = {
      presence_vs_achievement:
        "There may be a real tension between presence and achievement.",
      family_vs_purpose:
        "There may be a real tension between family and purpose."
    };

    const valueMap = {
      meaningful_presence:
        "The deeper value may be meaningful presence.",
      meaningful_love:
        "The deeper value may be a meaningful life rooted in love, service, and contribution.",
      clarity:
        "The deeper value may be clarity."
    };

    const pieces = [];

    if (leadOrgan === "meaning" && chapter) {
      pieces.push(chapterMap[chapter] || `This seems to be about ${this.humanizeLabel(chapter)}.`);
    }

    if (identity && leadOrgan === "identity") {
      pieces.push(`The ${this.humanizeLabel(identity)} part of you seems to be trying to protect something important.`);
    }

    if (tension && tension !== "unclear") {
      pieces.push(tensionMap[tension] || `There may be a real tension around ${this.humanizeLabel(tension)}.`);
    }

    if (value) {
      pieces.push(valueMap[value] || `The deeper value may be ${this.humanizeLabel(value)}.`);
    }

    if (hypothesis === "presence_must_be_earned") {
      pieces.push("One possible pattern is that presence feels like something you have to earn after achievement.");
    }

    if (hypothesis === "purpose_abandonment_fear") {
      pieces.push("One possible pattern is that slowing down feels too close to abandoning the future you care about.");
    }

    if (leadOrgan === "stewardship") {
      pieces.push("It may be stewardship. Responsibility, care, commitment, and preparation can feel intense without being unhealthy.");
    }

    if (leadOrgan === "uncertainty") {
      pieces.push("Ari does not have enough evidence to be confident yet. More understanding is needed before a strong interpretation should be made.");
    }

    if (pieces.length === 0) {
      pieces.push("Ari is still observing before reaching a stronger conclusion.");
    }

    return pieces.join(" ");
  }
};