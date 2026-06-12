// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth assembler for Ari Rebirth.
// V3.4

window.AriLanguageComposer = {
  version: "3.4.0",

  compose(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan = summary.synthesisLeadOrgan || summary.salienceLeadOrgan || "observer";
    const salienceMode = summary.synthesisMode || summary.salienceMode || "continue_observing";
    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const responseIntent = summary.responseIntent || null;

    const organismNeed = summary.organismNeed || null;
    const organismFunction = summary.organismFunction || summary.organismPrimaryFunction || null;

    const isBodyOrganism =
      ["food", "water", "sleep", "pain_protection", "vital_safety", "felt_safety"].includes(organismNeed) ||
      ["energy_intake", "hydration", "rest_recovery", "injury_protection", "vital_stability", "threat_regulation"].includes(organismFunction);

    const isSafetyOrBody =
      leadOrgan === "safety" ||
      salienceMode === "stabilize_body_first" ||
      primaryHumanNeed === "body" ||
      responseIntent === "stabilize_health" ||
      responseIntent === "stabilize_organism_function" ||
      isBodyOrganism;

    const hasUnclearLifeChapter =
      summary.primaryLifeChapter === "unclear_chapter" ||
      summary.personLifeChapter === "unclear";

    const hasUnclearConflict =
      summary.apparentConflict === "unclear" ||
      summary.wisdomTension === "unclear" ||
      summary.primaryConflict === "unclear";

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
      summary.recommendedQuestion ||
      summary.observerHierarchyRecommendedQuestion ||
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "What feels most important about this right now?";

    let opening =
      this.readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan, salienceMode);

    let synthesisText = typeof summary.synthesisStatement === "string" ? summary.synthesisStatement.trim() : null;
    let meaningText = typeof summary.meaningStatement === "string" ? summary.meaningStatement.trim() : null;
    let emotionText = this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
    let truthText = this.readText(truthResult, ["truth", "text", "line"]);
    let wisdomText = this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = this.readText(actionResult, ["guidance", "action", "text", "line"]);

    if (isSafetyOrBody) {
      synthesisText = null;
      meaningText = null;
      wisdomText = null;

      if (this.isAbstractOrDiagnosticText(emotionText)) emotionText = null;
      if (this.isAbstractOrDiagnosticText(truthText)) truthText = "A body signal should be stabilized before it is interpreted.";
      if (this.isAbstractOrDiagnosticText(actionText)) actionText = "Stabilize first, then interpret later.";

      if (!truthText) truthText = "A body signal should be stabilized before it is interpreted.";
      if (!actionText) actionText = "Stabilize the body first, then interpret later.";
    }

    if (hasUnclearLifeChapter) meaningText = null;
    if (hasUnclearConflict) wisdomText = null;

    if (this.isPlaceholderOrUnclearText(synthesisText)) synthesisText = null;
    if (this.isPlaceholderOrUnclearText(meaningText)) meaningText = null;
    if (this.isPlaceholderOrUnclearText(wisdomText)) wisdomText = null;

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
      responsePattern: director.responsePattern,
      isSafetyOrBody,
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

    let closing =
      this.readText(shapeResult, ["closing", "question", "finalQuestion"]) ||
      recommendedQuestion;

    if (
      director.responsePattern === "body_truth_then_action" ||
      director.responsePattern === "calm_health_step" ||
      responseIntent === "stabilize_organism_function" ||
      isSafetyOrBody
    ) {
      closing = null;
    }

    let finalResponse = this.buildFinalResponse(opening, body, closing);

    const shapedResponse = this.safeRunAny(
      shaperEngine,
      ["polish", "shape", "compose", "generate", "run"],
      { finalResponse, summary },
      { finalResponse }
    );

    if (shapedResponse?.finalResponse) finalResponse = shapedResponse.finalResponse;

    return {
      languageMode,
      languageOpening: opening,
      languageBody: body,
      languageClosing: closing,
      finalResponse,
      mouthUsed: {
        opening: Boolean(opening),
        synthesis: Boolean(synthesisText && bodyParts.includes(synthesisText)),
        meaning: Boolean(meaningText && bodyParts.includes(meaningText)),
        emotion: Boolean(emotionText && bodyParts.includes(emotionText)),
        truth: Boolean(truthText && bodyParts.includes(truthText)),
        wisdom: Boolean(wisdomText && bodyParts.includes(wisdomText)),
        action: Boolean(actionText && bodyParts.includes(actionText)),
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
        primaryHumanNeed,
        responseIntent,
        organismFunction,
        organismNeed,
        isBodyOrganism,
        isSafetyOrBody,
        hasUnclearLifeChapter,
        hasUnclearConflict,
        closingSuppressed: !closing,
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
        selectedBodyParts: bodyParts
      },
      source: "ari-language-composer"
    };
  },

  readDirector(summary = {}) {
    const mouthAllows = summary.mouthAllows || {};
    return {
      explanationLevel: summary.mouthExplanationLevel || summary.explanationLevel || "standard",
      responsePattern: summary.mouthResponsePattern || summary.responsePattern || "reflection_then_question",
      maxBodySections: Number(summary.mouthMaxBodySections ?? summary.maxBodySections ?? 3),
      askBeforeTeaching: Boolean(summary.mouthAskBeforeTeaching ?? summary.askBeforeTeaching ?? false),
      allowMeaning: mouthAllows.meaning ?? summary.allowMeaning ?? true,
      allowEmotion: mouthAllows.emotion ?? summary.allowEmotion ?? true,
      allowTruth: mouthAllows.truth ?? summary.allowTruth ?? true,
      allowWisdom: mouthAllows.wisdom ?? summary.allowWisdom ?? true,
      allowAction: mouthAllows.action ?? summary.allowAction ?? true
    };
  },

  chooseBodyParts({
    leadOrgan,
    responsePattern,
    isSafetyOrBody,
    synthesisText,
    meaningText,
    emotionText,
    truthText,
    wisdomText,
    actionText
  } = {}) {
    if (isSafetyOrBody) return [emotionText, truthText, actionText].filter(Boolean);

    if (responsePattern === "comfort_then_truth") return [emotionText, truthText].filter(Boolean);
    if (responsePattern === "validate_then_question") return [emotionText, truthText].filter(Boolean);
    if (responsePattern === "comfort_then_question") return [emotionText, truthText].filter(Boolean);
    if (responsePattern === "observe_then_question") return [truthText || synthesisText || meaningText].filter(Boolean);
    if (responsePattern === "validate_then_next_step") return [emotionText, truthText, actionText].filter(Boolean);
    if (responsePattern === "calm_health_step") return [truthText, actionText].filter(Boolean);
    if (responsePattern === "body_truth_then_action") return [truthText, actionText].filter(Boolean);
    if (responsePattern === "comfort_bridge_then_one_step") return [emotionText, truthText, actionText].filter(Boolean);
    if (responsePattern === "principle_then_choice") return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    if (responsePattern === "meaning_then_guidance") return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    if (responsePattern === "meaning_truth_then_action") return [meaningText || synthesisText, truthText, wisdomText, actionText].filter(Boolean);
    if (responsePattern === "insight_then_guidance") return [truthText || synthesisText, wisdomText, actionText].filter(Boolean);

    if (leadOrgan === "safety") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "emotion") return [emotionText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "meaning") return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    if (leadOrgan === "uncertainty") return [truthText || synthesisText || meaningText, actionText].filter(Boolean);
    if (leadOrgan === "wisdom") return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "identity") return [truthText || synthesisText || meaningText, wisdomText, actionText].filter(Boolean);

    return [synthesisText, meaningText, emotionText, truthText, wisdomText, actionText].filter(Boolean);
  },

  buildFinalResponse(opening, body, closing) {
    return [opening, body, closing]
      .filter(part => typeof part === "string" && part.trim())
      .join("\n\n");
  },

  getLanguageMode(leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") return "restore_dignity";
    if (salienceMode === "restore_connection") return "emotional_connection";
    if (salienceMode === "emotional_connection") return "emotional_connection";
    if (salienceMode === "stabilize_body_first") return "safety";

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
    if (typeof result === "string") return result.trim() || null;

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

  isPlaceholderOrUnclearText(text = "") {
    if (!text || typeof text !== "string") return false;
    const normalized = this.normalizeText(text);

    return (
      normalized.includes("does not have enough evidence") ||
      normalized.includes("unclear") ||
      normalized.includes("not clear enough") ||
      normalized.includes("no strong belief pattern") ||
      normalized.includes("cannot evaluate evidence") ||
      normalized.includes("no hypothesis available") ||
      normalized.includes("continue observing before naming")
    );
  },

  isAbstractOrDiagnosticText(text = "") {
    if (!text || typeof text !== "string") return false;
    const normalized = this.normalizeText(text);

    return (
      normalized.includes("active human need") ||
      normalized.includes("strongest deeper value") ||
      normalized.includes("ari should") ||
      normalized.includes("lead identity") ||
      normalized.includes("supporting identity") ||
      normalized.includes("synthesis") ||
      normalized.includes("life chapter") ||
      normalized.includes("meaningful priority") ||
      normalized.includes("system may be asking") ||
      normalized.includes("understanding the feeling underneath") ||
      normalized.includes("clarity")
    );
  },

  createFallbackOpening(summary = {}, leadOrgan = "observer", salienceMode = null) {
    if (salienceMode === "restore_dignity") return "That sounds disrespectful and frustrating.";
    if (salienceMode === "restore_connection") return "That sounds lonely.";
    if (salienceMode === "emotional_connection") return "That sounds lonely.";
    if (salienceMode === "stabilize_body_first") return "Your body is the priority right now.";

    if (leadOrgan === "meaning") return "Something feels important about this chapter.";
    if (leadOrgan === "identity") return "This may be more about identity than circumstance.";
    if (leadOrgan === "wisdom") return "There appears to be a real tension here.";
    if (leadOrgan === "stewardship") return "This may not be fear.";
    if (leadOrgan === "emotion") return "That sounds heavier than it looks.";
    if (leadOrgan === "uncertainty") return "Something is unclear here.";
    if (leadOrgan === "safety") return "Your body is the priority right now.";

    return "Something important may be present.";
  }
};