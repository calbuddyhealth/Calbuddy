// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth coordinator for Ari Rebirth.
// V2.7
// Fixes:
// - Adds response budget / section limiter.
// - Prevents strong meaning mode from becoming too long.
// - In meaning mode, prefers meaning + wisdom + action.
// - Suppresses emotion unless emotion is truly leading.
// - Prevents duplicate uncertainty language.
// - Prevents duplicate/similar body lines.
// - Keeps readable sections.

window.AriLanguageComposer = {
  compose(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const strongestSignalCategory =
      summary.strongestSignalCategory || null;

    const languageMode = this.getLanguageMode(leadOrgan);

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

    const opening =
      this.readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan);

    let meaningText =
      typeof summary.meaningStatement === "string" && summary.meaningStatement.trim()
        ? summary.meaningStatement.trim()
        : null;

    let truthText = this.readText(truthResult, ["truth", "text", "line"]);
    let emotionText = this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
    let wisdomText = this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = this.readText(actionResult, ["guidance", "action", "text", "line"]);

    if (leadOrgan === "uncertainty") {
      if (truthText) meaningText = null;
      else if (meaningText) truthText = null;
    }

    if (
      leadOrgan === "meaning" &&
      strongestSignalCategory !== "underlying_emotion"
    ) {
      emotionText = null;
    }

    const bodyParts = this.chooseBodyParts({
      leadOrgan,
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
        : this.createFallbackBody(summary, leadOrgan);

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
        opening: Boolean(this.readText(openingResult, ["opening", "text", "line"])),
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
        opening,
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

  getLanguageMode(leadOrgan = "observer") {
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
    meaningText,
    truthText,
    emotionText,
    wisdomText,
    actionText
  } = {}) {
    if (leadOrgan === "meaning") {
      return [
        meaningText || truthText,
        wisdomText,
        actionText
      ].filter(Boolean);
    }

    if (leadOrgan === "uncertainty") {
      return [
        truthText || meaningText,
        wisdomText,
        actionText
      ].filter(Boolean);
    }

    if (leadOrgan === "emotion") {
      return [
        emotionText,
        truthText,
        wisdomText,
        actionText
      ].filter(Boolean);
    }

    if (leadOrgan === "wisdom") {
      return [
        wisdomText,
        truthText,
        actionText
      ].filter(Boolean);
    }

    if (leadOrgan === "identity") {
      return [
        truthText || meaningText,
        wisdomText,
        actionText
      ].filter(Boolean);
    }

    return [
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

      if (!duplicate) {
        cleaned.push(line.trim());
      }
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

  humanizeLabel(label = "") {
    return String(label)
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim();
  },

  createFallbackOpening(summary = {}, leadOrgan = "observer") {
    if (leadOrgan === "meaning") return "Something feels important about this chapter.";
    if (leadOrgan === "identity") return "This may be more about identity than circumstance.";
    if (leadOrgan === "wisdom") return "There appears to be a real tension here.";
    if (leadOrgan === "stewardship") return "This may not be fear.";
    if (leadOrgan === "emotion") return "That sounds heavier than it looks.";
    if (leadOrgan === "uncertainty") return "Something is unclear here.";

    return "Something important may be present.";
  },

  createFallbackBody(summary = {}, leadOrgan = "observer") {
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