// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth assembler for Ari Rebirth.
// V3.1
// Fixes:
// - Adds mouth debug sources.
// - Shows which engine generated each line.
// - Shows body assembly order.
// - Composer remains an assembler, not a writer.

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

    const director = this.readDirector(summary);
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

    let synthesisText =
      typeof summary.synthesisStatement === "string" && summary.synthesisStatement.trim()
        ? summary.synthesisStatement.trim()
        : null;

    let meaningText =
      typeof summary.meaningStatement === "string" && summary.meaningStatement.trim()
        ? summary.meaningStatement.trim()
        : null;

    let emotionText = this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
    let truthText = this.readText(truthResult, ["truth", "text", "line"]);
    let wisdomText = this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = this.readText(actionResult, ["guidance", "action", "text", "line"]);

    if (director.allowMeaning === false) {
      meaningText = null;
      synthesisText = null;
    }

    if (director.allowEmotion === false) emotionText = null;
    if (director.allowTruth === false) truthText = null;
    if (director.allowWisdom === false) wisdomText = null;
    if (director.allowAction === false) actionText = null;

    if (director.responsePattern === "question_only") {
      opening = "";
      synthesisText = null;
      meaningText = null;
      emotionText = null;
      truthText = null;
      wisdomText = null;
      actionText = null;
    }

    let bodyParts = this.chooseBodyParts({
      leadOrgan,
      salienceMode,
      responsePattern: director.responsePattern,
      synthesisText,
      meaningText,
      emotionText,
      truthText,
      wisdomText,
      actionText
    });

    bodyParts = this.dedupeLines(bodyParts);

    if (Number.isFinite(director.maxBodySections)) {
      bodyParts = bodyParts.slice(0, director.maxBodySections);
    }

    const body = bodyParts.join("\n\n");

    const closing =
      this.readText(shapeResult, ["closing", "question", "finalQuestion"]) ||
      recommendedQuestion;

    let finalResponse = this.buildFinalResponse(opening, body, closing);

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
        synthesis: bodyParts.includes(synthesisText),
        meaning: bodyParts.includes(meaningText),
        emotion: bodyParts.includes(emotionText),
        truth: bodyParts.includes(truthText),
        wisdom: bodyParts.includes(wisdomText),
        action: bodyParts.includes(actionText),
        voice: Boolean(voiceResult),
        shape: Boolean(shapeResult),
        shaper: Boolean(shapedResponse?.finalResponse)
      },

      mouthEnginesFound: {
        opening: Boolean(openingEngine),
        meaning: Boolean(summary.meaningStatement),
        emotion: Boolean(emotionEngine),
        truth: Boolean(truthEngine),
        wisdom: Boolean(wisdomEngine),
        action: Boolean(actionEngine),
        voice: Boolean(voiceEngine),
        shape: Boolean(shapeEngine),
        shaper: Boolean(shaperEngine)
      },

      mouthTextDebug: {
        leadOrgan,
        salienceMode,
        director,

        sources: {
          opening: openingResult?.source || "composer-fallback",
          emotion: emotionResult?.source || "none",
          truth: truthResult?.source || "none",
          wisdom: wisdomResult?.source || "none",
          action: actionResult?.source || "none",
          voice: voiceResult?.source || "none",
          shape: shapeResult?.source || "none",
          shaper: shapedResponse?.source || "none"
        },

        opening,
        synthesisText,
        meaningText,
        emotionText,
        truthText,
        wisdomText,
        actionText,
        closing,
        selectedBodyParts: bodyParts,

        bodyAssemblyOrder: bodyParts.map(part => {
          if (part === emotionText) return "emotion";
          if (part === truthText) return "truth";
          if (part === wisdomText) return "wisdom";
          if (part === actionText) return "action";
          if (part === meaningText) return "meaning";
          if (part === synthesisText) return "synthesis";
          return "unknown";
        })
      },

      source: "ari-language-composer"
    };
  },

  readDirector(summary = {}) {
    const mouthAllows = summary.mouthAllows || {};

    return {
      explanationLevel:
        summary.mouthExplanationLevel ||
        summary.explanationLevel ||
        "standard",

      responsePattern:
        summary.mouthResponsePattern ||
        summary.responsePattern ||
        "reflection_then_question",

      maxBodySections:
        Number(
          summary.mouthMaxBodySections ??
          summary.maxBodySections ??
          3
        ),

      askBeforeTeaching:
        Boolean(
          summary.mouthAskBeforeTeaching ??
          summary.askBeforeTeaching ??
          false
        ),

      allowMeaning:
        mouthAllows.meaning ??
        summary.allowMeaning ??
        true,

      allowEmotion:
        mouthAllows.emotion ??
        summary.allowEmotion ??
        true,

      allowTruth:
        mouthAllows.truth ??
        summary.allowTruth ??
        true,

      allowWisdom:
        mouthAllows.wisdom ??
        summary.allowWisdom ??
        true,

      allowAction:
        mouthAllows.action ??
        summary.allowAction ??
        true
    };
  },

  chooseBodyParts({
    leadOrgan,
    responsePattern,
    synthesisText,
    meaningText,
    emotionText,
    truthText,
    wisdomText,
    actionText
  } = {}) {
    if (responsePattern === "validate_then_question") {
      return [emotionText, truthText].filter(Boolean);
    }

    if (responsePattern === "comfort_then_question") {
      return [emotionText, truthText].filter(Boolean);
    }

    if (responsePattern === "observe_then_question") {
      return [truthText || synthesisText || meaningText].filter(Boolean);
    }

    if (responsePattern === "principle_then_choice") {
      return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    }

    if (responsePattern === "meaning_then_guidance") {
      return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    }

    if (responsePattern === "insight_then_guidance") {
      return [truthText || synthesisText, wisdomText, actionText].filter(Boolean);
    }

    if (leadOrgan === "emotion") {
      return [emotionText, truthText || synthesisText, actionText].filter(Boolean);
    }

    if (leadOrgan === "meaning") {
      return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    }

    if (leadOrgan === "uncertainty") {
      return [truthText || synthesisText || meaningText, actionText].filter(Boolean);
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
      emotionText,
      truthText,
      wisdomText,
      actionText
    ].filter(Boolean);
  },

  buildFinalResponse(opening, body, closing) {
    return [opening, body, closing]
      .filter(part => typeof part === "string" && part.trim())
      .join("\n\n");
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
      observer: "observer",
      safety: "safety"
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

  createFallbackOpening(summary = {}, leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") return "That sounds disrespectful and frustrating.";
    if (salienceMode === "emotional_connection") return "That sounds lonely.";

    if (leadOrgan === "meaning") return "Something feels important about this chapter.";
    if (leadOrgan === "identity") return "This may be more about identity than circumstance.";
    if (leadOrgan === "wisdom") return "There appears to be a real tension here.";
    if (leadOrgan === "stewardship") return "This may not be fear.";
    if (leadOrgan === "emotion") return "That sounds heavier than it looks.";
    if (leadOrgan === "uncertainty") return "Something is unclear here.";
    if (leadOrgan === "safety") return "Safety comes first here.";

    return "Something important may be present.";
  }
};