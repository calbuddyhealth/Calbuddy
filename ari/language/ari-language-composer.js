// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final mouth assembler for Ari Rebirth.
// V3.6.0
// Fixes:
// - Situation Contract is authoritative.
// - Supports build_or_fix and build_steps.
// - Prevents legacy uncertainty/life-chapter/salience from hijacking builder/teacher/planning.
// - Composer obeys Mouth Director and Situation Contract first.
// - Legacy systems are fallback only.

window.AriLanguageComposer = {
  version: "3.6.0",

  compose(input = {}) {
    const summary = input.summary || input || {};

    const contract =
      summary.situationContract || {};

    const contractPrimary =
      summary.situationContractPrimary ||
      contract.primary ||
      null;

    const responseIntent =
      summary.responseIntent ||
      this.intentFromContract(contractPrimary) ||
      "respond_normally";

    const responseShape =
      summary.responseShape ||
      contract.responseShape ||
      null;

    const intentAuthority = this.getIntentAuthority(summary, {
      contractPrimary,
      responseIntent,
      responseShape
    });

    let leadOrgan =
      intentAuthority.leadOrgan ||
      summary.contractBridgeLeadOrgan ||
      summary.salienceLeadOrgan ||
      summary.synthesisLeadOrgan ||
      "observer";

    let salienceMode =
      intentAuthority.salienceMode ||
      summary.contractBridgeMode ||
      summary.salienceMode ||
      summary.synthesisMode ||
      "continue_observing";

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const organismNeed = summary.organismNeed || null;

    const organismFunction =
      summary.organismFunction ||
      summary.organismPrimaryFunction ||
      null;

    const isBodyOrganism =
      [
        "food",
        "water",
        "sleep",
        "pain_protection",
        "vital_safety",
        "felt_safety"
      ].includes(organismNeed) ||
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
      contractPrimary === "safety" ||
      contractPrimary === "medical_body" ||
      responseIntent === "protect_safety" ||
      responseIntent === "protect_safety_first" ||
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

    const languageMode = this.getLanguageMode(
      leadOrgan,
      salienceMode,
      responseIntent,
      contractPrimary
    );

    const openingEngine = this.getEngine("AriMouthOpeningEngine", "AriOpeningEngine");
    const truthEngine = this.getEngine("AriMouthTruthEngine", "AriTruthEngine");
    const emotionEngine = this.getEngine("AriMouthEmotionEngine", "AriEmotionalNamingEngine");
    const wisdomEngine = this.getEngine("AriMouthWisdomEngine", "AriWisdomPrincipleEngine");
    const actionEngine = this.getEngine("AriMouthActionEngine", "AriActionGuidanceEngine");
    const voiceEngine = this.getEngine("AriMouthVoiceEngine", "AriVoiceBlendEngine");
    const shapeEngine = this.getEngine("AriMouthShapeEngine", "AriResponseShapeEngine");
    const shaperEngine = this.getEngine("AriMouthShaper", "AriResponseShaper");

    const openingResult = this.safeRunAny(
      openingEngine,
      ["create", "generate", "compose", "open", "run"],
      summary
    );

    const truthResult = this.safeRunAny(
      truthEngine,
      ["extract", "generate", "compose", "tell", "run"],
      summary
    );

    const emotionResult = this.safeRunAny(
      emotionEngine,
      ["name", "generate", "compose", "detect", "run"],
      summary
    );

    const wisdomResult = this.safeRunAny(
      wisdomEngine,
      ["distill", "generate", "compose", "resolve", "run"],
      summary
    );

    const actionResult = this.safeRunAny(
      actionEngine,
      ["guide", "generate", "compose", "recommend", "run"],
      summary
    );

    const voiceResult = this.safeRunAny(
      voiceEngine,
      ["blend", "generate", "compose", "choose", "run"],
      summary
    );

    const shapeResult = this.safeRunAny(
      shapeEngine,
      ["shape", "generate", "compose", "structure", "run"],
      summary
    );

    const recommendedQuestion = this.getRecommendedQuestion(summary, intentAuthority);

    let opening =
      this.readText(openingResult, ["opening", "text", "line"]) ||
      this.createFallbackOpening(summary, leadOrgan, salienceMode, responseIntent, contractPrimary);

    let synthesisText =
      typeof summary.synthesisStatement === "string"
        ? summary.synthesisStatement.trim()
        : null;

    let meaningText =
      typeof summary.meaningStatement === "string"
        ? summary.meaningStatement.trim()
        : null;

    let emotionText =
      this.readText(emotionResult, ["emotionalName", "emotion", "text", "line"]);

    let truthText =
      this.readText(truthResult, ["truth", "text", "line"]);

    let wisdomText =
      this.readText(wisdomResult, ["principle", "wisdom", "text", "line"]);

    let actionText =
      this.readText(actionResult, ["guidance", "action", "text", "line"]);

    // ==================================================
    // CONTRACT-AWARE DIRECT CONTENT
    // ==================================================

    if (this.isTeachingIntent(responseIntent, contractPrimary)) {
      truthText =
        summary.teachingAnswer ||
        summary.knowledgeAnswer ||
        summary.humanTruth ||
        summary.oneLineInsight ||
        truthText ||
        this.createDirectAnswerPlaceholder(summary, responseIntent, contractPrimary);
    }

    if (this.isBuilderIntent(responseIntent, contractPrimary, responseShape)) {
  opening = "";

  truthText =
    summary.builderAnswer ||
    summary.codeAnswer ||
    summary.implementationAnswer ||
    summary.humanTruth ||
    truthText ||
    "I can help debug this. Start by checking the login flow in this order: auth config, redirect URL, callback handling, session storage, then the UI error message.";

  if (this.isUncertaintyText(truthText)) {
    truthText =
      "I can help debug this. Start by checking the login flow in this order: auth config, redirect URL, callback handling, session storage, then the UI error message.";
  }

  actionText =
    summary.builderSteps ||
    summary.actionText ||
    actionText ||
    "Send me the login page code, Supabase/Firebase/Auth config if used, and the exact error you see. Then I can tell you what block to replace.";

  if (this.isUncertaintyText(actionText)) {
    actionText =
      "Send me the login page code, Supabase/Firebase/Auth config if used, and the exact error you see. Then I can tell you what block to replace.";
  }
}

    if (contractPrimary === "risk_clarification") {
      opening = "";
      synthesisText = null;
      meaningText = null;
      emotionText = null;
      wisdomText = null;
      actionText = null;

      truthText =
        contract.clarity?.question ||
        summary.followUpQuestion ||
        "Are you saying this is an immediate safety concern, or are you using that phrase casually?";
    }

    // ==================================================
    // DIRECT INTENT AUTHORITY
    // ==================================================

    if (intentAuthority.forceDirectAnswer) {
      opening = this.isBuilderIntent(responseIntent, contractPrimary, responseShape) ? "" : opening;

      synthesisText = null;
      meaningText = null;
      emotionText = null;
      wisdomText = null;

      if (this.isTeachingIntent(responseIntent, contractPrimary)) {
        truthText =
          summary.teachingAnswer ||
          summary.knowledgeAnswer ||
          summary.humanTruth ||
          summary.oneLineInsight ||
          truthText;
      }

      if (this.isBuilderIntent(responseIntent, contractPrimary, responseShape)) {
        truthText =
          summary.builderAnswer ||
          summary.codeAnswer ||
          summary.implementationAnswer ||
          truthText ||
          "I can help debug this, but I need the code or error to find the exact break.";

        actionText =
          summary.builderSteps ||
          summary.actionText ||
          actionText ||
          "Paste the login page code and the exact error message.";
      }

      if (!truthText && !actionText) {
        truthText = this.createDirectAnswerPlaceholder(summary, responseIntent, contractPrimary);
      }
    }

    // ==================================================
    // SAFETY / BODY PROTECTION
    // ==================================================

    if (isSafetyOrBody) {
      synthesisText = null;
      meaningText = null;
      wisdomText = null;

      if (this.isAbstractOrDiagnosticText(emotionText)) emotionText = null;

      if (this.isAbstractOrDiagnosticText(truthText)) {
        truthText = "A body signal should be stabilized before it is interpreted.";
      }

      if (this.isAbstractOrDiagnosticText(actionText)) {
        actionText = "Stabilize first, then interpret later.";
      }

      if (!truthText) {
        truthText = "A body signal should be stabilized before it is interpreted.";
      }

      if (!actionText) {
        actionText = "Stabilize the body first, then interpret later.";
      }
    }

    // ==================================================
    // CLEANUP / BLOCKING
    // ==================================================

    if (hasUnclearLifeChapter && !intentAuthority.allowUnclearLifeChapterText) {
      meaningText = null;
    }

    if (hasUnclearConflict && !intentAuthority.allowUnclearConflictText) {
      wisdomText = null;
    }

    if (this.isPlaceholderOrUnclearText(synthesisText)) synthesisText = null;
    if (this.isPlaceholderOrUnclearText(meaningText)) meaningText = null;
    if (this.isPlaceholderOrUnclearText(wisdomText)) wisdomText = null;

    if (this.isBadUserFacingText(opening)) opening = "";
    if (this.isBadUserFacingText(synthesisText)) synthesisText = null;
    if (this.isBadUserFacingText(meaningText)) meaningText = null;
    if (this.isBadUserFacingText(emotionText)) emotionText = null;

    const directTeaching =
      this.isTeachingIntent(responseIntent, contractPrimary);

    const directBuilder =
      this.isBuilderIntent(responseIntent, contractPrimary, responseShape);

    if (!directTeaching && !directBuilder && this.isBadUserFacingText(truthText)) {
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

    if (
      director.responsePattern === "question_only" ||
      director.responsePattern === "risk_clarification_question"
    ) {
      opening = "";
      synthesisText = null;
      meaningText = null;
      emotionText = null;
      wisdomText = null;
      actionText = null;

      truthText =
        contract.clarity?.question ||
        summary.followUpQuestion ||
        recommendedQuestion ||
        truthText;
    }

    let bodyParts = this.chooseBodyParts({
      leadOrgan,
      responseIntent,
      responseShape,
      responsePattern: director.responsePattern,
      contractPrimary,
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
      director.responsePattern === "risk_clarification_question" ||
      responseIntent === "stabilize_organism_function" ||
      responseIntent === "teach_clearly" ||
      this.isBuilderIntent(responseIntent, contractPrimary, responseShape) ||
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
        contractPrimary,
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

  intentFromContract(primary = null) {
    const map = {
      safety: "protect_safety_first",
      risk_clarification: "clarify_risk",
      medical_body: "stabilize_organism_function",
      builder: "build_or_fix",
      teacher: "teach_clearly",
      executive_decision: "create_priority_structure",
      emotion: "offer_connection",
      family: "protect_family_presence",
      relationship: "protect_relationship_responsibility",
      wisdom: "resolve_tension",
      memory: "acknowledge_memory",
      general_understanding: "respond_normally"
    };

    return map[primary] || null;
  },

  getIntentAuthority(summary = {}, context = {}) {
    const contractPrimary =
      context.contractPrimary ||
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      null;

    const responseIntent =
      context.responseIntent ||
      summary.responseIntent ||
      this.intentFromContract(contractPrimary);

    const responseShape =
      context.responseShape ||
      summary.responseShape ||
      summary.situationContract?.responseShape ||
      null;

    const domainLead =
      summary.domainLead ||
      summary.domainGovernor?.domainLead ||
      null;

    const shouldPreferTeaching =
      summary.shouldPreferTeaching === true ||
      summary.domainGovernor?.shouldPreferTeaching === true ||
      domainLead === "knowledge_teaching_domain";

    if (
      contractPrimary === "safety" ||
      responseIntent === "protect_safety" ||
      responseIntent === "protect_safety_first"
    ) {
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

    if (
      contractPrimary === "medical_body" ||
      responseIntent === "stabilize_organism_function" ||
      responseIntent === "stabilize_health"
    ) {
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

    if (
      contractPrimary === "risk_clarification" ||
      responseIntent === "clarify_risk"
    ) {
      return {
        level: "clarification",
        leadOrgan: "safety",
        salienceMode: "risk_clarification",
        suppressRecoveryQuestion: true,
        forceDirectAnswer: true,
        allowUnclearLifeChapterText: false,
        allowUnclearConflictText: false
      };
    }

    if (
      contractPrimary === "teacher" ||
      responseIntent === "teach_clearly" ||
      shouldPreferTeaching
    ) {
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

    if (
      contractPrimary === "builder" ||
      responseIntent === "build_or_debug" ||
      responseIntent === "build_or_fix" ||
      responseShape === "build_steps" ||
      responseShape === "code_then_explain"
    ) {
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

    if (
      contractPrimary === "executive_decision" ||
      responseIntent === "create_priority_structure" ||
      responseIntent === "decision_support"
    ) {
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
      explanationLevel:
        summary.mouthExplanationLevel ||
        summary.explanationLevel ||
        "standard",

      responsePattern:
        summary.mouthResponsePattern ||
        summary.responsePattern ||
        "reflection_then_question",

      maxBodySections:
        Number(summary.mouthMaxBodySections ?? summary.maxBodySections ?? 3),

      askBeforeTeaching:
        Boolean(summary.mouthAskBeforeTeaching ?? summary.askBeforeTeaching ?? false),

      allowMeaning:
        mouthAllows.meaning ?? summary.allowMeaning ?? true,

      allowEmotion:
        mouthAllows.emotion ?? summary.allowEmotion ?? true,

      allowTruth:
        mouthAllows.truth ?? summary.allowTruth ?? true,

      allowWisdom:
        mouthAllows.wisdom ?? summary.allowWisdom ?? true,

      allowAction:
        mouthAllows.action ?? summary.allowAction ?? true
    };

    if (intentAuthority.level === "clarification") {
      director.askBeforeTeaching = true;
      director.allowMeaning = false;
      director.allowEmotion = false;
      director.allowWisdom = false;
      director.allowAction = false;
      director.allowTruth = true;
      director.explanationLevel = "minimal";
      director.responsePattern = "risk_clarification_question";
      director.maxBodySections = 1;
    }

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
        director.responsePattern = "build_steps";
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
      summary.situationContract?.clarity?.question ||
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
    responseShape,
    responsePattern,
    contractPrimary,
    isSafetyOrBody,
    synthesisText,
    meaningText,
    emotionText,
    truthText,
    wisdomText,
    actionText
  } = {}) {
    if (isSafetyOrBody) {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (contractPrimary === "risk_clarification") {
      return [truthText].filter(Boolean);
    }

    if (this.isTeachingIntent(responseIntent, contractPrimary)) {
      return [truthText, actionText].filter(Boolean);
    }

    if (this.isBuilderIntent(responseIntent, contractPrimary, responseShape)) {
      return [truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "explain_then_example") {
      return [truthText, actionText].filter(Boolean);
    }

    if (
      responsePattern === "build_steps" ||
      responsePattern === "direct_code_or_steps" ||
      responsePattern === "code_then_explain"
    ) {
      return [truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "comfort_then_truth") {
      return [emotionText, truthText].filter(Boolean);
    }

    if (responsePattern === "validate_then_question") {
      return [emotionText, truthText].filter(Boolean);
    }

    if (responsePattern === "comfort_then_question") {
      return [emotionText, truthText].filter(Boolean);
    }

    if (responsePattern === "observe_then_question") {
      return [truthText || synthesisText || meaningText].filter(Boolean);
    }

    if (responsePattern === "validate_then_next_step") {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "calm_health_step") {
      return [truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "body_truth_then_action") {
      return [truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "family_truth_then_next_step") {
      return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    }

    if (responsePattern === "relationship_truth_then_repair") {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "comfort_bridge_then_one_step") {
      return [emotionText, truthText, actionText].filter(Boolean);
    }

    if (responsePattern === "principle_then_choice") {
      return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    }

    if (responsePattern === "meaning_then_guidance") {
      return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    }

    if (responsePattern === "meaning_truth_then_action") {
      return [meaningText || synthesisText, truthText, wisdomText, actionText].filter(Boolean);
    }

    if (responsePattern === "insight_then_guidance") {
      return [truthText || synthesisText, wisdomText, actionText].filter(Boolean);
    }

    if (leadOrgan === "safety") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "teacher") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "builder") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "planner") return [truthText, actionText].filter(Boolean);
    if (leadOrgan === "emotion") return [emotionText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "meaning") return [meaningText || synthesisText || truthText, wisdomText, actionText].filter(Boolean);
    if (leadOrgan === "uncertainty") return [truthText || synthesisText || meaningText, actionText].filter(Boolean);
    if (leadOrgan === "wisdom") return [wisdomText, truthText || synthesisText, actionText].filter(Boolean);
    if (leadOrgan === "identity") return [truthText || synthesisText || meaningText, wisdomText, actionText].filter(Boolean);

    return [
      synthesisText,
      meaningText,
      emotionText,
      truthText,
      wisdomText,
      actionText
    ].filter(Boolean);
  },

  createDirectAnswerPlaceholder(summary = {}, responseIntent = null, contractPrimary = null) {
    if (this.isTeachingIntent(responseIntent, contractPrimary)) {
      return "I can explain this clearly, but I need the teaching content to generate the full answer.";
    }

    if (this.isBuilderIntent(responseIntent, contractPrimary, summary.responseShape)) {
      return "I can help build or fix this, but I need the code, error, or screenshot to give exact steps.";
    }

    return "I can answer this directly, but I need the answer content to generate the full response.";
  },

  readDirectKnowledgeText(summary = {}) {
    if (
      summary.responseIntent === "teach_clearly" ||
      summary.domainLead === "knowledge_teaching_domain" ||
      summary.shouldPreferTeaching === true ||
      summary.situationContractPrimary === "teacher"
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

  getLanguageMode(
    leadOrgan = "observer",
    salienceMode = null,
    responseIntent = null,
    contractPrimary = null
  ) {
    if (contractPrimary === "builder") return "building";
    if (contractPrimary === "teacher") return "teaching";
    if (contractPrimary === "executive_decision") return "planning";
    if (contractPrimary === "medical_body") return "safety";
    if (contractPrimary === "safety") return "safety";
    if (contractPrimary === "risk_clarification") return "safety_clarification";
    if (contractPrimary === "emotion") return "emotional_connection";
    if (contractPrimary === "family") return "family";
    if (contractPrimary === "relationship") return "relationship";
    if (contractPrimary === "wisdom") return "wisdom";

    if (responseIntent === "teach_clearly") return "teaching";

    if (
      responseIntent === "build_or_debug" ||
      responseIntent === "build_or_fix"
    ) {
      return "building";
    }

    if (
      responseIntent === "create_priority_structure" ||
      responseIntent === "decision_support"
    ) {
      return "planning";
    }

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

  isTeachingIntent(responseIntent = null, contractPrimary = null) {
    return (
      contractPrimary === "teacher" ||
      responseIntent === "teach_clearly" ||
      responseIntent === "teach"
    );
  },

  isBuilderIntent(responseIntent = null, contractPrimary = null, responseShape = null) {
    return (
      contractPrimary === "builder" ||
      responseIntent === "build_or_debug" ||
      responseIntent === "build_or_fix" ||
      responseIntent === "generate_code" ||
      responseShape === "build_steps" ||
      responseShape === "code_then_explain"
    );
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
isUncertaintyText(text = "") {
  if (!text || typeof text !== "string") return false;

  const normalized = this.normalizeText(text);

  return (
    normalized.includes("understand one more detail") ||
    normalized.includes("before interpreting") ||
    normalized.includes("guess too fast") ||
    normalized.includes("not enough evidence") ||
    normalized.includes("something is unclear") ||
    normalized.includes("continue observing") ||
    normalized.includes("what feels most uncertain") ||
    normalized.includes("what feels important here")
  );
},
  createFallbackOpening(
    summary = {},
    leadOrgan = "observer",
    salienceMode = null,
    responseIntent = null,
    contractPrimary = null
  ) {
    if (contractPrimary === "teacher") return "";
    if (contractPrimary === "builder") return "";
    if (contractPrimary === "risk_clarification") return "";
    if (contractPrimary === "executive_decision") return "Let’s organize this clearly.";
    if (contractPrimary === "medical_body") return "Your body is the priority right now.";
    if (contractPrimary === "safety") return "Safety comes first here.";
    if (contractPrimary === "emotion") return "That sounds heavier than it looks.";
    if (contractPrimary === "family") return "This is about protecting your family and your stability.";
    if (contractPrimary === "relationship") return "The relationship piece matters here.";

    if (responseIntent === "teach_clearly") return "";

    if (
      responseIntent === "build_or_debug" ||
      responseIntent === "build_or_fix"
    ) {
      return "";
    }

    if (responseIntent === "create_priority_structure") {
      return "Let’s organize this clearly.";
    }

    if (salienceMode === "restore_dignity") {
      return "That sounds disrespectful and frustrating.";
    }

    if (salienceMode === "restore_connection") {
      return "That sounds lonely.";
    }

    if (salienceMode === "emotional_connection") {
      return "That sounds lonely.";
    }

    if (salienceMode === "stabilize_body_first") {
      return "Your body is the priority right now.";
    }

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