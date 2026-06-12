// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth coordinator for Ari Rebirth.
// V2.2
// Fixes:
// - Supports old and new mouth engine names.
// - Tries multiple possible method names per mouth engine.
// - Tracks engines found vs engines actually used.
// - Keeps safe fallback language if a mouth engine returns null.

window.AriLanguageComposer = {
  compose(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

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

    const safeRunAny = (engine, methods = [], fallback = null) => {
      try {
        if (!engine) return fallback;

        for (const method of methods) {
          if (typeof engine[method] === "function") {
            const result = engine[method](summary);
            if (result) return result;
          }
        }
      } catch (error) {
        console.warn("[AriLanguageComposer] mouth engine failed", error);
      }

      return fallback;
    };

    const openingEngine = getEngine("AriMouthOpeningEngine", "AriOpeningEngine");
    const truthEngine = getEngine("AriMouthTruthEngine", "AriTruthEngine");
    const emotionEngine = getEngine("AriMouthEmotionEngine", "AriEmotionalNamingEngine");
    const wisdomEngine = getEngine("AriMouthWisdomEngine", "AriWisdomPrincipleEngine");
    const actionEngine = getEngine("AriMouthActionEngine", "AriActionGuidanceEngine");
    const voiceEngine = getEngine("AriMouthVoiceEngine", "AriVoiceBlendEngine");
    const shapeEngine = getEngine("AriMouthShapeEngine", "AriResponseShapeEngine");
    const shaperEngine = getEngine("AriMouthShaper", "AriResponseShaper");

    const openingResult = safeRunAny(openingEngine, [
      "create",
      "generate",
      "compose",
      "open",
      "run"
    ], null);

    const truthResult = safeRunAny(truthEngine, [
      "extract",
      "generate",
      "compose",
      "tell",
      "run"
    ], null);

    const emotionResult = safeRunAny(emotionEngine, [
      "name",
      "generate",
      "compose",
      "detect",
      "run"
    ], null);

    const wisdomResult = safeRunAny(wisdomEngine, [
      "distill",
      "generate",
      "compose",
      "resolve",
      "run"
    ], null);

    const actionResult = safeRunAny(actionEngine, [
      "guide",
      "generate",
      "compose",
      "recommend",
      "run"
    ], null);

    const voiceResult = safeRunAny(voiceEngine, [
      "blend",
      "generate",
      "compose",
      "choose",
      "run"
    ], null);

    const shapeResult = safeRunAny(shapeEngine, [
      "shape",
      "generate",
      "compose",
      "structure",
      "run"
    ], null);

    const recommendedQuestion =
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "What feels most important about this right now?";

    const fallbackOpening = this.createFallbackOpening(summary, leadOrgan);
    const fallbackBody = this.createFallbackBody(summary, leadOrgan);
    const fallbackClosing = recommendedQuestion;

    let opening =
      openingResult?.opening ||
      openingResult?.text ||
      openingResult?.line ||
      fallbackOpening;

    const bodyParts = [
      truthResult?.truth,
      truthResult?.text,
      truthResult?.line,

      emotionResult?.emotionalName,
      emotionResult?.emotion,
      emotionResult?.text,
      emotionResult?.line,

      wisdomResult?.principle,
      wisdomResult?.wisdom,
      wisdomResult?.text,
      wisdomResult?.line,

      actionResult?.guidance,
      actionResult?.action,
      actionResult?.text,
      actionResult?.line
    ].filter(Boolean);

    let body =
      bodyParts.length > 0
        ? bodyParts.join(" ")
        : fallbackBody;

    let closing =
      shapeResult?.closing ||
      shapeResult?.question ||
      shapeResult?.finalQuestion ||
      fallbackClosing;

    let finalResponse =
`${opening}

${body.trim()}

${closing}`;

    const shapedResponse = safeRunAny(
      shaperEngine,
      ["polish", "shape", "compose", "generate", "run"],
      { finalResponse }
    );

    if (shapedResponse?.finalResponse) {
      finalResponse = shapedResponse.finalResponse;
    }

    return {
      languageMode,
      languageOpening: opening,
      languageBody: body.trim(),
      languageClosing: closing,
      finalResponse,

      mouthUsed: {
        opening: Boolean(openingResult),
        truth: Boolean(truthResult),
        emotion: Boolean(emotionResult),
        wisdom: Boolean(wisdomResult),
        action: Boolean(actionResult),
        voice: Boolean(voiceResult),
        shape: Boolean(shapeResult),
        shaper: Boolean(shapedResponse?.finalResponse)
      },

      mouthEnginesFound: {
        opening: Boolean(openingEngine),
        truth: Boolean(truthEngine),
        emotion: Boolean(emotionEngine),
        wisdom: Boolean(wisdomEngine),
        action: Boolean(actionEngine),
        voice: Boolean(voiceEngine),
        shape: Boolean(shapeEngine),
        shaper: Boolean(shaperEngine)
      },

      source: "ari-language-composer"
    };
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