// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth assembler for Ari Rebirth.
// V3.5.3
// Fixes: 
// - Adds Response Intent Authority so teaching/building/planning cannot be hijacked by uncertainty.
// - Makes Composer obey Mouth Director more strictly.
// - Prevents uncertainty/life-chapter/emotion recovery questions from leaking into direct teaching.
// - Prevents internal diagnostic phrases like "Ari should..." from reaching the user.
// - Keeps safety/body stabilization protected.
// - Fixes broken createDirectAnswerPlaceholder syntax.
window.AriLanguageComposer = {
  version: "3.5.3",
  compose(input = {}) {
    const summary = input.summary || input || {};
    const responseIntent = summary.responseIntent || "respond_normally";
    const responseShape = summary.responseShape || null;
    const intentAuthority = this.getIntentAuthority(summary);
    let leadOrgan =
      intentAuthority.leadOrgan ||
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";
    let salienceMode =
      intentAuthority.salienceMode ||
      summary.synthesisMode ||
      summary.salienceMode ||
      "continue_observing";
    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const organismNeed = summary.organismNeed || null;
    const organismFunction =
      summary.organismFunction ||
      summary.organismPrimaryFunction ||
      null;
    const isBodyOrganism =
      ["food", "water", "sleep", "pain_protection", "vital_safety", "felt_safety"].includes(organismNeed) ||
      [
        "energy_intake",
        "hydration",
        "rest_recovery",
        "injury_protection",
        "vital_stability",
        "threat_regulation",
        "waste_elimination",
        "temperature_regulation",
        "movement_mobility"
      ].includes(organismFunction);
    const isSafetyOrBody =
      responseIntent === "protect_safety" ||
      responseIntent === "stabilize_health" ||
      responseIntent === "stabilize_organism_function" ||
      leadOrgan === "safety" ||
      salienceMode === "stabilize_body_first" ||
      primaryHumanNeed === "body" ||
      isBodyOrganism;
    const hasUnclearLifeChapter =
      summary.primaryLifeChapter === "unclear_chapter" ||
      summary.personLifeChapter === "unclear" ||
      summary.primaryLifeChapter === null;
    const hasUnclearConflict =
      summary.apparentConflict === "unclear" ||
      summary.wisdomTension === "unclear" ||
      summary.primaryConflict === "unclear";
    const director = this.readDirector(summary, intentAuthority);
    const languageMode = this.getLanguageMode(leadOrgan, salienceMode, responseIntent);
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
    const recommendedQuestion = this.getRecommendedQuestion(summary, intentAuthority);
    let opening =
      this.readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan, salienceMode, responseIntent);
    let synthesisText = typeof summary.synthesisStatement === "string" ? summary.synthesisStatement.trim() : null;
    let meaningText = typeof summary.meaningStatement === "string" ? summary.meaningStatement.trim() : null;
    let emotionText = this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);
   let truthText = this.readText(truthResult, ["truth", "text", "line"]);

if (
  responseIntent === "teach_clearly" ||
  summary.domainLead === "knowledge_teaching_domain" ||
  summary.shouldPreferTeaching === true
) {
  truthText =
    summary.teachingAnswer ||
    summary.knowledgeAnswer ||
    summary.humanTruth ||
    summary.oneLineInsight ||
    truthText;
}
    let wisdomText = this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);
    let actionText = this.readText(actionResult, ["guidance", "action", "text", "line"]);
    if (intentAuthority.forceDirectAnswer) {
  opening = "";
  synthesisText = null;
  meaningText = null;
  emotionText = null;
  wisdomText = null;

  const directTeachingText =
    summary.teachingAnswer ||
    summary.knowledgeAnswer ||
    summary.humanTruth ||
    summary.oneLineInsight ||
    null;

  if (
    responseIntent === "teach_clearly" ||
    summary.domainLead === "knowledge_teaching_domain" ||
    summary.shouldPreferTeaching === true
  ) {
    truthText = directTeachingText || truthText;
  }

  if (!directTeachingText && this.isBadUserFacingText(truthText)) {
    truthText = null;
  }

  if (this.isBadUserFacingText(actionText)) actionText = null;

  if (!truthText && !actionText) {
    truthText = this.createDirectAnswerPlaceholder(summary, responseIntent);
  }
}
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
    if (hasUnclearLifeChapter && !intentAuthority.allowUnclearLifeChapterText) meaningText = null;
    if (hasUnclearConflict && !intentAuthority.allowUnclearConflictText) wisdomText = null;
    if (this.isPlaceholderOrUnclearText(synthesisText)) synthesisText = null;
    if (this.isPlaceholderOrUnclearText(meaningText)) meaningText = null;
    if (this.isPlaceholderOrUnclearText(wisdomText)) wisdomText = null;
    if (this.isBadUserFacingText(opening)) opening = "";
    if (this.isBadUserFacingText(synthesisText)) synthesisText = null;
    if (this.isBadUserFacingText(meaningText)) meaningText = null;
    if (this.isBadUserFacingText(emotionText)) emotionText = null;
   const isDirectTeaching =
  responseIntent === "teach_clearly" ||
  summary.domainLead === "knowledge_teaching_domain" ||
  summary.shouldPreferTeaching === true;

if (!isDirectTeaching && this.isBadUserFacingText(truthText)) {
  truthText = null;
}
    if (this.isBadUserFacingText(wisdomText)) wisdomText = null;
    if (this.isBadUserFacingText(actionText)) actionText = null;
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
      responseIntent,
      responseShape,
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
      intentAuthority.suppressRecoveryQuestion ||
      director.responsePattern === "body_truth_then_action" ||
      director.responsePattern === "calm_health_step" ||
      responseIntent === "stabilize_organism_function" ||
      responseIntent === "teach_clearly" ||
      responseIntent === "build_or_debug" ||
      isSafetyOrBody
    ) {
      closing = null;
    }
    if (this.isBadUserFacingText(closing)) closing = null;
    let finalResponse = this.buildFinalResponse(opening, body, closing);
    const shapedResponse = this.safeRunAny(
      shaperEngine,
      ["polish", "shape", "compose", "generate", "run"],
      { finalResponse, summary },
      { finalResponse }
    );
    if (
      shapedResponse?.finalResponse &&
      !this.isBadUserFacingText(shapedResponse.finalResponse)
    ) {
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
        responseShape,
        organismFunction,
        organismNeed,
        isBodyOrganism,
        isSafetyOrBody,
        hasUnclearLifeChapter,
        hasUnclearConflict,
        intentAuthority,
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
            composerVersion: this.version,
      source: "ari-language-composer"
    };
  },
  getIntentAuthority(summary = {}) {
    const intent = summary.responseIntent || null;
    const domainLead = summary.domainLead || summary.domainGovernor?.domainLead || null;
    const shouldPreferTeaching =
      summary.shouldPreferTeaching === true ||
      summary.domainGovernor?.shouldPreferTeaching === true ||
      domainLead === "knowledge_teaching_domain";
    if (intent === "protect_safety") {
      return {
        level: "critical",
        leadOrgan: "safety",
        salienceMode: "safety_override",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: false,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }
    if (intent === "stabilize_organism_function" || intent === "stabilize_health") {
      return {
        level: "survival",
        leadOrgan: "safety",
        salienceMode: "stabilize_body_first",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: false,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }
    if (intent === "teach_clearly" || shouldPreferTeaching) {
      return {
        level: "direct_intent",
        leadOrgan: "teacher",
        salienceMode: "teach_clearly",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: true,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }
    if (intent === "build_or_debug") {
      return {
        level: "direct_intent",
        leadOrgan: "builder",
        salienceMode: "build_or_debug",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: true,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }
    if (intent === "create_priority_structure") {
      return {
        level: "executive",
        leadOrgan: "planner",
        salienceMode: "plan_next_step",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: false,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }
    return {
      level: "normal",
      leadOrgan: null,
      salienceMode: null,
      suppressRecoveryQuestion: false,
      forceDirectAnswer: false,
      allowUnclearLifeChapterText: false,
      allowUnclearConflictText: false
    };
  },
  readDirector(summary = {}, intentAuthority = {}) {
    const mouthAllows = summary.mouthAllows || {};
    const director = {
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
    if (intentAuthority.level === "direct_intent") {
      director.askBeforeTeaching = false;
      director.allowMeaning = false;
      director.allowEmotion = false;
      director.allowWisdom = false;
      if (intentAuthority.leadOrgan === "teacher") {
        director.explanationLevel = "clear";
        director.responsePattern = "explain_then_example";
        director.maxBodySections = 3;
        director.allowTruth = true;
        director.allowAction = false;
      }
      if (intentAuthority.leadOrgan === "builder") {
        director.explanationLevel = "clear";
        director.responsePattern = "direct_code_or_steps";
        director.maxBodySections = 4;
        director.allowTruth = true;
        director.allowAction = true;
      }
    }
    return director;
  },
  getRecommendedQuestion(summary = {}, intentAuthority = {}) {
    if (intentAuthority.suppressRecoveryQuestion) return null;
    return (
      summary.recommendedQuestion ||
      summary.observerHierarchyRecommendedQuestion ||
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "What feels most important about this right now?"
    );
  },
  chooseBodyParts({
    leadOrgan,
    responseIntent,
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
    if (responseIntent === "teach_clearly") return [truthText].filter(Boolean);
    if (responseIntent === "build_or_debug") return [truthText, actionText].filter(Boolean);
    if (responsePattern === "explain_then_example") return [truthText, actionText].filter(Boolean);
    if (responsePattern === "direct_code_or_steps") return [truthText, actionText].filter(Boolean);
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
    if (leadOrgan === "teacher") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "builder") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "planner") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "emotion") return [emotionText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "meaning") return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    if (leadOrgan === "uncertainty") return [truthText || synthesisText || meaningText, actionText].filter(Boolean);
    if (leadOrgan === "wisdom") return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "identity") return [truthText || synthesisText || meaningText, wisdomText, actionText].filter(Boolean);
    return [synthesisText, meaningText, emotionText, truthText, wisdomText, actionText].filter(Boolean);
  },
  createDirectAnswerPlaceholder(summary = {}, responseIntent = null) {
    if (responseIntent === "teach_clearly") {
      return "I can explain this clearly, but I need the teaching content to generate the full answer.";
    }
    if (responseIntent === "build_or_debug") {
      return "I can help build or fix this, but I need the builder content to generate the full code or steps.";
    }
    return "I can answer this directly, but I need the answer content to generate the full response.";
  },
 
  readDirectKnowledgeText(summary = {}) {
  if (
    summary.responseIntent === "teach_clearly" ||
    summary.domainLead === "knowledge_teaching_domain" ||
    summary.shouldPreferTeaching === true
  ) {
    return (
      summary.teachingAnswer ||
      summary.knowledgeAnswer ||
      summary.humanTruth ||
      summary.oneLineInsight ||
      null
    );
  }

  return null;
},
  
   buildFinalResponse(opening, body, closing) {
    return [opening, body, closing]
      .filter((part) => typeof part === "string" && part.trim())
      .join("\n\n");
  },
  getLanguageMode(leadOrgan = "observer", salienceMode = null, responseIntent = null) {
    if (responseIntent === "teach_clearly") return "teaching";
    if (responseIntent === "build_or_debug") return "building";
    if (responseIntent === "create_priority_structure") return "planning";
    if (salienceMode === "restore_dignity") return "restore_dignity";
    if (salienceMode === "restore_connection") return "emotional_connection";
    if (salienceMode === "emotional_connection") return "emotional_connection";
    if (salienceMode === "stabilize_body_first") return "safety";
    if (salienceMode === "teach_clearly") return "teaching";
    if (salienceMode === "build_or_debug") return "building";
    if (salienceMode === "plan_next_step") return "planning";
    const modeMap = {
      meaning: "life_chapter",
      identity: "identity",
      values: "values",
      stewardship: "stewardship",
      emotion: "emotion",
      wisdom: "wisdom",
      uncertainty: "uncertainty",
      observer: "observer",
      safety: "safety",
      teacher: "teaching",
      builder: "building",
      planner: "planning"
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
      const duplicate = cleaned.some((existing) => {
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
  isBadUserFacingText(text = "") {
    if (!text || typeof text !== "string") return false;
    const normalized = this.normalizeText(text);
    return (
      normalized.includes("ari should") ||
      normalized.includes("ari does not have enough") ||
      normalized.includes("response intent") ||
      normalized.includes("mouth director") ||
      normalized.includes("lead organ") ||
      normalized.includes("salience") ||
      normalized.includes("synthesis") ||
      normalized.includes("source layer") ||
      normalized.includes("domain governor") ||
      normalized.includes("observer hierarchy") ||
      normalized.includes("not force a conclusion before the evidence is clear")
    );
  },
  createFallbackOpening(summary = {}, leadOrgan = "observer", salienceMode = null, responseIntent = null) {
    if (responseIntent === "teach_clearly") return "";
    if (responseIntent === "build_or_debug") return "";
    if (responseIntent === "create_priority_structure") return "Let’s organize this clearly.";
    if (salienceMode === "restore_dignity") return "That sounds disrespectful and frustrating.";
    if (salienceMode === "restore_connection") return "That sounds lonely.";
    if (salienceMode === "emotional_connection") return "That sounds lonely.";
    if (salienceMode === "stabilize_body_first") return "Your body is the priority right now.";
    if (leadOrgan === "teacher") return "";
    if (leadOrgan === "builder") return "";
    if (leadOrgan === "planner") return "Let’s make this clear.";
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