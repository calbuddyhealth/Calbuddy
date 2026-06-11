// ari/uncertainty/ari-uncertainty-classification-engine.js
// Ari Uncertainty Classification Engine
// Purpose: Determine WHY Ari is uncertain before choosing a recovery question.
// V1.2
// Fixes:
// - Treats null / unknown / none / low evidence as weak evidence.
// - Strengthens life chapter uncertainty when a meaningful life signal exists.
// - Prevents emotion recovery from becoming the default unless emotion is truly central.

window.AriUncertaintyClassificationEngine = {
  classify(input = {}) {
    const summary = input.summary || input || {};

    const hypothesis = summary.hypothesis || null;
    const evidenceStrength = summary.evidenceStrength || "none";

    const primaryEmotion =
      summary.primaryEmotion ||
      summary.surfaceEmotion ||
      null;

    const underlyingEmotion =
      summary.underlyingEmotion || "unclear";

    const underlyingEmotionDepth =
      summary.underlyingEmotionDepth || null;

    const strongestSignal =
      summary.strongestSignal || null;

    const strongestSignalCategory =
      summary.strongestSignalCategory || null;

    const rootNeed =
      summary.rootNeed || summary.primaryNeed || null;

    const dominantIdentity =
      summary.dominantIdentity || null;

    const primaryBelief =
      summary.primaryBelief || null;

    const wisdomTension =
      summary.wisdomTension || null;

    const highestGood =
      summary.highestGood || null;

    const primaryLifeSignal =
      summary.primaryLifeSignal || null;

    const primaryWeightedLifeSignal =
      summary.primaryWeightedLifeSignal || null;

    const lifePriorityClass =
      summary.lifePriorityClass || "none";

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

    const noEvidence =
      !evidenceStrength ||
      evidenceStrength === "none" ||
      evidenceStrength === "unknown" ||
      evidenceStrength === "low";

    function addCandidate(type, score, reason, recoveryQuestion, extra = {}) {
      candidates.push({
        type,
        score,
        reason,
        recoveryQuestion,
        ...extra
      });
    }

    // 1. Missing information
    if (!hypothesis && noEvidence) {
      addCandidate(
        "missing_information",
        92,
        "Ari has no grounded hypothesis and needs more context before interpreting.",
        "What information feels most missing right now?"
      );
    }

    // 2. Understanding / curiosity uncertainty
    if (
      primaryEmotion === "curiosity" &&
      rootNeed === "understanding" &&
      !hypothesis
    ) {
      addCandidate(
        "understanding_uncertainty",
        90,
        "The dominant state is curiosity and understanding, not hidden emotion.",
        "What are you trying to understand more clearly?"
      );
    }

    // 3. Emotion uncertainty
    if (
      strongestSignalCategory === "underlying_emotion" &&
      strongestSignal &&
      strongestSignal !== "unclear"
    ) {
      addCandidate(
        "emotion_uncertainty",
        88,
        "An underlying emotion appears central and needs deeper clarification.",
        "What feeling is hardest to admit underneath this?",
        {
          emotionSignal: strongestSignal
        }
      );
    }

    if (
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
        {
          emotionSignal: underlyingEmotionDepth || underlyingEmotion
        }
      );
    }

    // 4. Belief uncertainty
    if (
      strongestSignalCategory === "belief" ||
      primaryBelief ||
      knownUnknowns.includes("which belief is driving the situation") ||
      uncertaintyAreas.includes("primary_belief_unclear")
    ) {
      addCandidate(
        "belief_uncertainty",
        primaryBelief ? 86 : 78,
        "A belief or assumption appears important, but Ari does not fully understand it yet.",
        "What assumption are you making that might be shaping this?",
        {
          beliefSignal: primaryBelief || strongestSignal || null
        }
      );
    }

    // 5. Identity uncertainty
    if (
      strongestSignalCategory === "identity" ||
      dominantIdentity ||
      knownUnknowns.includes("which identity is most active right now") ||
      uncertaintyAreas.includes("identity_unclear")
    ) {
      addCandidate(
        "identity_uncertainty",
        dominantIdentity ? 86 : 80,
        "The active identity or role is unclear.",
        "Which part of you feels most responsible for this right now?",
        {
          identitySignal: dominantIdentity || strongestSignal || null
        }
      );
    }

    // 6. Life chapter uncertainty
    if (
      strongestSignalCategory === "life" ||
      primaryLifeSignal ||
      primaryWeightedLifeSignal ||
      lifeSignals.length > 0 ||
      uncertaintyAreas.includes("life_chapter_unclear")
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

    // 7. Value / wisdom uncertainty
    if (
      strongestSignalCategory === "highest_good" ||
      (wisdomTension && wisdomTension !== "unclear") ||
      highestGood ||
      rootNeed === "understanding" ||
      uncertaintyAreas.includes("future_consequence_unclear")
    ) {
      addCandidate(
        "value_or_wisdom_uncertainty",
        wisdomTension && wisdomTension !== "unclear" ? 86 : 80,
        "Ari detects a need for clarity, wisdom, or prioritization rather than emotional excavation.",
        "What good are you trying to protect most right now?",
        {
          wisdomTension,
          highestGood
        }
      );
    }

    // 8. Conflict uncertainty
    if (
      summary.primaryConflict ||
      summary.hiddenConflict ||
      summary.conflictIntensity === "medium" ||
      summary.conflictIntensity === "high"
    ) {
      addCandidate(
        "conflict_uncertainty",
        summary.conflictIntensity === "high" ? 88 : 80,
        "A conflict or tradeoff may be present, but Ari needs to understand what is competing.",
        "What two good things feel like they are competing right now?",
        {
          conflictSignal:
            summary.primaryConflict ||
            summary.hiddenConflict ||
            null
        }
      );
    }

    // 9. Mission / purpose uncertainty
    if (
      strongestSignal === "creative_mission" ||
      primaryLifeSignal === "creative_mission" ||
      primaryWeightedLifeSignal === "creative_mission" ||
      lifeSignals.includes("creative_mission") ||
      summary.protecting === "creative_purpose"
    ) {
      addCandidate(
        "mission_uncertainty",
        94,
        "Ari detects a creative mission or purpose signal, but the mission needs clarification.",
        "What future are you trying to create?",
        {
          missionSignal: "creative_mission"
        }
      );
    }

    // 10. If no candidates were detected, use general uncertainty.
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

    return {
      uncertaintyType: winner.type,
      uncertaintyConfidence: winner.score,
      uncertaintyReason: winner.reason,
      recommendedRecoveryQuestion: winner.recoveryQuestion,

      shouldUseEmotionRecovery,
      shouldContinueObserving,

      winningCandidate: winner,

      detectedUncertainties: candidates.map(candidate => ({
        type: candidate.type,
        score: candidate.score,
        reason: candidate.reason,
        recoveryQuestion: candidate.recoveryQuestion,
        emotionSignal: candidate.emotionSignal || null,
        beliefSignal: candidate.beliefSignal || null,
        identitySignal: candidate.identitySignal || null,
        lifeSignal: candidate.lifeSignal || null,
        missionSignal: candidate.missionSignal || null,
        conflictSignal: candidate.conflictSignal || null,
        wisdomTension: candidate.wisdomTension || null,
        highestGood: candidate.highestGood || null,
        lifePriorityClass: candidate.lifePriorityClass || null
      })),

      source: "ari-uncertainty-classification-engine"
    };
  }
};