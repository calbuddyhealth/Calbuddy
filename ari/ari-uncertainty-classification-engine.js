// ari/ari-uncertainty-classification-engine.js
// Ari Uncertainty Classification Engine
// Purpose: Determine WHY Ari is uncertain before choosing a recovery question.
// V1.0

window.AriUncertaintyClassificationEngine = {
  classify(input = {}) {
    const summary = input.summary || input || {};

    const hypothesis = summary.hypothesis || null;
    const evidenceStrength = summary.evidenceStrength || "none";
    const underlyingEmotion = summary.underlyingEmotion || "unclear";
    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;
    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;
    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const primaryBelief = summary.primaryBelief || null;
    const wisdomTension = summary.wisdomTension || null;
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const lifeSignals = summary.lifeSignals || [];
    const uncertaintyAreas = summary.uncertaintyAreas || [];
    const knownUnknowns = summary.knownUnknowns || [];

    let type = "general_uncertainty";
    let confidence = 50;
    let reason = "Ari does not have enough information to classify the uncertainty clearly.";
    let recoveryQuestion = "What are you trying to understand more clearly right now?";

    // 1. Emotion uncertainty only when emotion is actually central
    if (
      strongestSignalCategory === "underlying_emotion" ||
      uncertaintyAreas.includes("underlying_emotion_unclear")
    ) {
      if (
        strongestSignalCategory === "underlying_emotion" &&
        strongestSignal &&
        strongestSignal !== "unclear"
      ) {
        type = "emotion_uncertainty";
        confidence = 82;
        reason = "An underlying emotion appears to be central, but it needs more clarity.";
        recoveryQuestion = "What feeling is hardest to admit underneath this?";
      }
    }

    // 2. Belief uncertainty
    if (
      strongestSignalCategory === "belief" ||
      primaryBelief ||
      knownUnknowns.includes("which belief is driving the situation") ||
      uncertaintyAreas.includes("primary_belief_unclear")
    ) {
      type = "belief_uncertainty";
      confidence = primaryBelief ? 80 : 72;
      reason = "A belief or assumption appears important, but Ari does not fully understand it yet.";
      recoveryQuestion = "What assumption are you making that might be shaping this?";
    }

    // 3. Identity uncertainty
    if (
      strongestSignalCategory === "identity" ||
      dominantIdentity ||
      knownUnknowns.includes("which identity is most active right now") ||
      uncertaintyAreas.includes("identity_unclear")
    ) {
      type = "identity_uncertainty";
      confidence = dominantIdentity ? 82 : 74;
      reason = "The active identity or role is unclear.";
      recoveryQuestion = "Which part of you feels most responsible for this right now?";
    }

    // 4. Life chapter uncertainty
    if (
      strongestSignalCategory === "life" ||
      primaryLifeSignal ||
      lifeSignals.length > 0 ||
      uncertaintyAreas.includes("life_chapter_unclear")
    ) {
      type = "life_chapter_uncertainty";
      confidence = primaryLifeSignal ? 84 : 76;
      reason = "A life chapter signal is present, but Ari needs more context before naming it cleanly.";
      recoveryQuestion = "What feels different about this season of life?";
    }

    // 5. Value / wisdom uncertainty
    if (
      strongestSignalCategory === "highest_good" ||
      wisdomTension ||
      rootNeed === "understanding" ||
      uncertaintyAreas.includes("future_consequence_unclear")
    ) {
      type = "value_or_wisdom_uncertainty";
      confidence = 78;
      reason = "Ari detects a need for clarity, wisdom, or prioritization rather than emotional excavation.";
      recoveryQuestion = "What good are you trying to protect most right now?";
    }

    // 6. Missing information should override emotion fallback when no hypothesis exists
    if (
      !hypothesis &&
      evidenceStrength === "none" &&
      (!strongestSignalCategory || strongestSignalCategory !== "underlying_emotion")
    ) {
      type = "missing_information";
      confidence = 88;
      reason = "Ari has no grounded hypothesis and needs more context before interpreting.";
      recoveryQuestion = "What information feels most missing right now?";
    }

    // 7. Curiosity / understanding mode
    if (
      primaryEmotion === "curiosity" &&
      rootNeed === "understanding" &&
      !hypothesis
    ) {
      type = "understanding_uncertainty";
      confidence = 86;
      reason = "The dominant state is curiosity and understanding, not hidden emotion.";
      recoveryQuestion = "What are you trying to understand more clearly?";
    }

    return {
      uncertaintyType: type,
      uncertaintyConfidence: confidence,
      uncertaintyReason: reason,
      recommendedRecoveryQuestion: recoveryQuestion,
      shouldUseEmotionRecovery: type === "emotion_uncertainty",
      shouldContinueObserving:
        type === "missing_information" ||
        type === "understanding_uncertainty",
      source: "ari-uncertainty-classification-engine"
    };
  }
};