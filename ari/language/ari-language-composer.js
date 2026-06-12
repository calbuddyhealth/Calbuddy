// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth coordinator for Ari Rebirth.
// V2.6
// Fixes:
// - Adds response budget / section limiter.
// - Prevents strong meaning mode from becoming too long.
// - In meaning mode, suppresses emotion unless emotion is truly leading.
// - Keeps uncertainty duplicate protection.
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

    const languageMode = modeMap[leadOrgan] || "reflection";

    const getEngine = (...names) => {
      for (const name of names) {
        if (window[name]) return window[name];
      }
      return null;
    };

    const safeRunAny = (engine, methods = [], arg = summary, fallback = null) => {
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
    };

    const readText = (result, keys = []) => {
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
    };

    const openingEngine = getEngine("AriMouthOpeningEngine", "AriOpeningEngine");
    const truthEngine = getEngine("AriMouthTruthEngine", "AriTruthEngine");
    const emotionEngine = getEngine("AriMouthEmotionEngine", "AriEmotionalNamingEngine");
    const wisdomEngine = getEngine("AriMouthWisdomEngine", "AriWisdomPrincipleEngine");
    const actionEngine = getEngine("AriMouthActionEngine", "AriActionGuidanceEngine");
    const voiceEngine = getEngine("AriMouthVoiceEngine", "AriVoiceBlendEngine");
    const shapeEngine = getEngine("AriMouthShapeEngine", "AriResponseShapeEngine");
    const shaperEngine = getEngine("AriMouthShaper", "AriResponseShaper");

    const openingResult = safeRunAny(openingEngine, ["create", "generate", "compose", "open", "run"]);
    const truthResult = safeRunAny(truthEngine, ["extract", "generate", "compose", "tell", "run"]);
    const emotionResult = safeRunAny(emotionEngine, ["name", "generate", "compose", "detect", "run"]);
    const wisdomResult = safeRunAny(wisdomEngine, ["distill", "generate", "compose", "resolve", "run"]);
    const actionResult = safeRunAny(actionEngine, ["guide", "generate", "compose", "recommend", "run"]);
    const voiceResult = safeRunAny(voiceEngine, ["blend", "generate", "compose", "choose", "run"]);
    const shapeResult = safeRunAny(shapeEngine, ["shape", "generate", "compose", "structure", "run"]);

    const recommendedQuestion =
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "What feels most important about this right now?";

    const opening =
      readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan);

    let meaningText =
      typeof summary.meaningStatement === "string" &&
      summary.meaningStatement.trim()
        ? summary.meaningStatement.trim()
        : null;

    let truthText = readText(truthResult, ["truth", "text", "line"]);
    let emotionText = readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
    let wisdomText = readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = readText(actionResult, ["guidance", "action", "text", "line"]);

    // Uncertainty mode should not repeat meaning + truth if both say "not enough context."
    if (leadOrgan === "uncertainty") {
      if (truthText) {
        meaningText = null;
      } else if (meaningText) {
        truthText = null;
      }
    }

    // Meaning mode should not become bloated.
    // Emotion only stays if emotion is actually leading or the strongest signal.
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

    const body =
      bodyParts.length > 0
        ? bodyParts.join("\n\n")
        : this.createFallbackBody(summary, leadOrgan);

    const closing =
      readText(shapeResult, ["closing", "question", "finalQuestion"]) ||
      recommendedQuestion;

    let finalResponse =
`${opening}

${body}

${closing}`;

    const shapedResponse = safeRunAny(
      shaperEngine,
      ["polish", "compose", "generate", "run"],
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
        opening: Boolean(readText(openingResult, ["opening", "text", "line"])),
        meaning: bodyParts.includes(meaningText),
        truth: bodyParts.includes(truthText),
        emotion: bodyParts.includes(emotionText),
        wisdom: bodyParts.includes(wisdomText),
        action: bodyParts.includes(actionText),
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
        selectedBodyParts: bodyParts
      },

      source: "ari-language-composer"
    };
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