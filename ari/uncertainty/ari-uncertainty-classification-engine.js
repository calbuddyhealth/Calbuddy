// ari/uncertainty/ari-uncertainty-classification-engine.js
// Ari Uncertainty Classification Engine
// Purpose: Determine WHY Ari is uncertain before choosing a recovery question.
// V1.6
// Fixes:
// - Adds Direct Intent Support Mode.
// - Prevents teaching/building/planning requests from being hijacked by missing_information.
// - Allows uncertainty to support direct answers instead of stealing the lead.
// - Keeps Human Needs Network awareness.
// - Keeps resolved_enough protection for high-evidence interpretations.

window.AriUncertaintyClassificationEngine = {
  version: "1.6.0",

  classify(input = {}) {
    const summary = input.summary || input || {};

    const domainLead =
      summary.domainLead ||
      summary.domainGovernor?.domainLead ||
      null;

    const responseIntent = summary.responseIntent || null;

    const shouldPreferTeaching =
      summary.shouldPreferTeaching === true ||
      summary.domainGovernor?.shouldPreferTeaching === true ||
      domainLead === "knowledge_teaching_domain" ||
      responseIntent === "teach_clearly";

    const directKnowledgeRequest =
      shouldPreferTeaching ||
      ["build_or_debug", "create_priority_structure"].includes(responseIntent);

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const primaryHumanNeedScore = Number(summary.primaryHumanNeedScore || 0);
    const needResponseMode = summary.needResponseMode || null;

    const strongHumanNeed =
      primaryHumanNeed &&
      primaryHumanNeed !== "understanding" &&
      primaryHumanNeedScore >= 80;

    const hypothesis = summary.hypothesis || null;
    const evidenceStrength = summary.evidenceStrength || "none";
    const calibratedConfidence =
      summary.calibratedConfidence || summary.metaConfidence || "unknown";
    const confidenceScore = Number(summary.confidenceScore || 0);

    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;
    const underlyingEmotion = summary.underlyingEmotion || "unclear";
    const underlyingEmotionDepth = summary.underlyingEmotionDepth || null;

    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;

    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const primaryBelief = summary.primaryBelief || null;

    const wisdomTension = summary.wisdomTension || null;
    const highestGood = summary.highestGood || null;

    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryWeightedLifeSignal = summary.primaryWeightedLifeSignal || null;
    const lifePriorityClass = summary.lifePriorityClass || "none";

    const lifeSignals = Array.isArray(summary.lifeSignals)
      ? summary.lifeSignals
      : [];

    const uncertaintyAreas = Array.isArray(summary.uncertaintyAreas)
      ? summary.uncertaintyAreas
      : [];

    const knownUnknowns = Array.isArray(summary.knownUnknowns)
      ? summary.knownUnknowns
      : [];

    const candidates = [];

    const weakEvidence =
      !evidenceStrength ||
      evidenceStrength === "none" ||
      evidenceStrength === "unknown" ||
      evidenceStrength === "low";

    const strongEvidence =
      evidenceStrength === "medium" ||
      evidenceStrength === "high";

    const confidentEnough =
      calibratedConfidence === "medium" ||
      calibratedConfidence === "high" ||
      confidenceScore >= 60;

    const hasGroundedInterpretation =
      Boolean(hypothesis) &&
      strongEvidence &&
      confidentEnough;

    function addCandidate(type, score, reason, recoveryQuestion, extra = {}) {
      candidates.push({
        type,
        score,
        reason,
        recoveryQuestion,
        ...extra
      });
    }

    // 0. Direct intent support mode.
    if (directKnowledgeRequest) {
      addCandidate(
        "direct_intent_supported",
        120,
        "Ari detected a direct teaching/building/planning request, so uncertainty should support the answer instead of leading.",
        null,
        {
          domainLead,
          responseIntent,
          supportMode: "answer_directly"
        }
      );
    }

    // 1. If Ari already has a grounded hypothesis, uncertainty should not lead.
    if (hasGroundedInterpretation) {
      addCandidate(
        "resolved_enough",
        110,
        "Ari already has a grounded hypothesis with enough evidence, so uncertainty should not lead.",
        null,
        {
          hypothesis,
          evidenceStrength,
          calibratedConfidence,
          confidenceScore
        }
      );
    }

    // 2. Strong human needs should prevent generic uncertainty from leading.
    if (!hasGroundedInterpretation && !hypothesis && weakEvidence && strongHumanNeed) {
      addCandidate(
        "human_need_leads",
        primaryHumanNeedScore + 10,
        `A strong human need '${primaryHumanNeed}' is already detected, so Ari should respond to that need before treating this as missing information.`,
        null,
        {
          primaryHumanNeed,
          primaryHumanNeedScore,
          needResponseMode
        }
      );
    }

    // 3. Missing information only leads when no stronger domain is active.
    if (!hypothesis && weakEvidence && !strongHumanNeed && !directKnowledgeRequest) {
      addCandidate(
        "missing_information",
        92,
        "Ari has no grounded hypothesis and needs more context before interpreting.",
        "What feels important here that has not been said out loud yet?"
      );
    }

    // 4. Understanding / curiosity uncertainty.
    if (
      primaryEmotion === "curiosity" &&
      rootNeed === "understanding" &&
      !hypothesis &&
      !strongHumanNeed &&
      !directKnowledgeRequest
    ) {
      addCandidate(
        "understanding_uncertainty",
        90,
        "The dominant state is curiosity and understanding, not hidden emotion.",
        "What are you trying to understand more clearly?"
      );
    }

    // 5. Emotion uncertainty.
    if (
      !hasGroundedInterpretation &&
      !directKnowledgeRequest &&
      strongestSignalCategory === "underlying_emotion" &&
      strongestSignal &&
      strongestSignal !== "unclear"
    ) {
      addCandidate(
        "emotion_uncertainty",
        88,
        "An underlying emotion appears central and needs deeper clarification.",
        "What feeling is hardest to admit underneath this?",
        { emotionSignal: strongestSignal }
      );
    }

    if (
      !hasGroundedInterpretation &&
      !directKnowledgeRequest &&
      underlyingEmotion &&
      underlyingEmotion !== "unclear" &&
      underlyingEmotionDepth &&
      underlyingEmotionDepth !== "unclear"
    ) {
      addCandidate(
        "emotion_uncertainty",
        82,
        "Ari has a possible emotional signal, but it needs confirmation.",
        "What feeling feels closest to the truth here?",
        { emotionSignal: underlyingEmotionDepth || underlyingEmotion }
      );
    }

    // 6. Belief uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        strongestSignalCategory === "belief" ||
        primaryBelief ||
        knownUnknowns.includes("which belief is driving the situation") ||
        uncertaintyAreas.includes("primary_belief_unclear")
      )
    ) {
      addCandidate(
        "belief_uncertainty",
        primaryBelief ? 86 : 78,
        "A belief or assumption appears important, but Ari does not fully understand it yet.",
        "What assumption are you making that might be shaping this?",
        { beliefSignal: primaryBelief || strongestSignal || null }
      );
    }

    // 7. Identity uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        strongestSignalCategory === "identity" ||
        dominantIdentity ||
        knownUnknowns.includes("which identity is most active right now") ||
        uncertaintyAreas.includes("identity_unclear")
      )
    ) {
      addCandidate(
        "identity_uncertainty",
        dominantIdentity ? 86 : 80,
        "The active identity or role is unclear.",
        "Which part of you feels most responsible for this right now?",
        { identitySignal: dominantIdentity || strongestSignal || null }
      );
    }

    // 8. Life chapter uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        strongestSignalCategory === "life" ||
        primaryLifeSignal ||
        primaryWeightedLifeSignal ||
        lifeSignals.length > 0 ||
        uncertaintyAreas.includes("life_chapter_unclear")
      )
    ) {
      let score = 80;

      if (primaryLifeSignal || primaryWeightedLifeSignal) score = 90;
      if (lifePriorityClass === "medium_life_priority") score = 94;
      if (lifePriorityClass === "high_life_priority") score = 98;
      if (lifePriorityClass === "major_life_priority") score = 102;

      addCandidate(
        "life_chapter_uncertainty",
        score,
        "A life chapter signal is present, but Ari needs more context before naming it cleanly.",
        "What feels different about this season of life?",
        {
          lifeSignal:
            primaryLifeSignal ||
            primaryWeightedLifeSignal ||
            strongestSignal ||
            null,
          lifePriorityClass
        }
      );
    }

    // 9. Value / wisdom uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        strongestSignalCategory === "highest_good" ||
        (wisdomTension && wisdomTension !== "unclear") ||
        highestGood ||
        rootNeed === "understanding" ||
        uncertaintyAreas.includes("future_consequence_unclear")
      )
    ) {
      addCandidate(
        "value_or_wisdom_uncertainty",
        wisdomTension && wisdomTension !== "unclear" ? 86 : 80,
        "Ari detects a need for clarity, wisdom, or prioritization rather than emotional excavation.",
        "What good are you trying to protect most right now?",
        { wisdomTension, highestGood }
      );
    }

    // 10. Conflict uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        summary.primaryConflict ||
        summary.hiddenConflict ||
        summary.conflictIntensity === "medium" ||
        summary.conflictIntensity === "high"
      )
    ) {
      addCandidate(
        "conflict_uncertainty",
        summary.conflictIntensity === "high" ? 88 : 80,
        "A conflict or tradeoff may be present, but Ari needs to understand what is competing.",
        "What two good things feel like they are competing right now?",
        {
          conflictSignal: summary.primaryConflict || summary.hiddenConflict || null
        }
      );
    }

    // 11. Mission / purpose uncertainty.
    if (
      !hasGroundedInterpretation &&
      !strongHumanNeed &&
      !directKnowledgeRequest &&
      (
        strongestSignal === "creative_mission" ||
        primaryLifeSignal === "creative_mission" ||
        primaryWeightedLifeSignal === "creative_mission" ||
        lifeSignals.includes("creative_mission") ||
        summary.protecting === "creative_purpose"
      )
    ) {
      addCandidate(
        "mission_uncertainty",
        94,
        "Ari detects a creative mission or purpose signal, but the mission needs clarification.",
        "What future are you trying to create?",
        { missionSignal: "creative_mission" }
      );
    }

    // 12. Fallback.
    if (candidates.length === 0) {
      addCandidate(
        "general_uncertainty",
        50,
        "Ari does not have enough information to classify the uncertainty clearly.",
        "What are you trying to understand more clearly right now?"
      );
    }

    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    const shouldUseEmotionRecovery =
      winner.type === "emotion_uncertainty";

    const shouldContinueObserving =
      winner.type === "missing_information" ||
      winner.type === "understanding_uncertainty" ||
      winner.type === "general_uncertainty";

    const shouldSuppressUncertainty =
      winner.type === "resolved_enough" ||
      winner.type === "human_need_leads" ||
      winner.type === "direct_intent_supported";

    return {
      uncertaintyEngineRan: true,
      uncertaintyEngineVersion: this.version,

      uncertaintyType: winner.type,
      uncertaintyConfidence: winner.score,
      uncertaintyReason: winner.reason,
      recommendedRecoveryQuestion: winner.recoveryQuestion,

      shouldUseEmotionRecovery,
      shouldContinueObserving,
      shouldSuppressUncertainty,

      uncertaintySupportMode: winner.supportMode || null,

      winningCandidate: winner,

      detectedUncertainties: candidates.map(candidate => ({
        type: candidate.type,
        score: candidate.score,
        reason: candidate.reason,
        recoveryQuestion: candidate.recoveryQuestion,
        primaryHumanNeed: candidate.primaryHumanNeed || null,
        primaryHumanNeedScore: candidate.primaryHumanNeedScore || null,
        needResponseMode: candidate.needResponseMode || null,
        emotionSignal: candidate.emotionSignal || null,
        beliefSignal: candidate.beliefSignal || null,
        identitySignal: candidate.identitySignal || null,
        lifeSignal: candidate.lifeSignal || null,
        missionSignal: candidate.missionSignal || null,
        conflictSignal: candidate.conflictSignal || null,
        wisdomTension: candidate.wisdomTension || null,
        highestGood: candidate.highestGood || null,
        lifePriorityClass: candidate.lifePriorityClass || null,
        hypothesis: candidate.hypothesis || null,
        evidenceStrength: candidate.evidenceStrength || null,
        calibratedConfidence: candidate.calibratedConfidence || null,
        confidenceScore: candidate.confidenceScore || null,
        domainLead: candidate.domainLead || null,
        responseIntent: candidate.responseIntent || null,
        supportMode: candidate.supportMode || null
      })),

      source: "ari-uncertainty-classification-engine"
    };
  }
};