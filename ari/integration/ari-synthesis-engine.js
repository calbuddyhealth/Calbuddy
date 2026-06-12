// ari/integration/ari-synthesis-engine.js
// Ari Synthesis Engine
// Purpose: Combine organ outputs into one coherent interpretation.
// V1.1
// Fixes:
// - Updates weak missing-information question.
// - Prevents synthesis from reintroducing old recovery wording.

window.AriSynthesisEngine = {
  synthesize(input = {}) {
    const summary = input.summary || input || {};

    const defaultMissingInformationQuestion =
      "What feels important here that has not been said out loud yet?";

    const salienceLeadOrgan = summary.salienceLeadOrgan || "observer";
    const salienceMode = summary.salienceMode || "continue_observing";
    const salienceQuestion = summary.salienceQuestion || null;

    const uncertaintyType = summary.uncertaintyType || null;
    const uncertaintyReason = summary.uncertaintyReason || null;

    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const lifeChapterStatement = summary.lifeChapterStatement || null;
    const lifeChapterFocus = summary.lifeChapterFocus || null;

    const leadIdentity =
      summary.resolvedLeadIdentity || summary.leadIdentity || null;
    const supportIdentity = summary.resolvedSupportingIdentity || null;
    const identityPrioritySummary = summary.identityPrioritySummary || null;
    const resolutionReason = summary.resolutionReason || null;

    const integratedValue = summary.integratedValue || null;
    const integrationStatement = summary.integrationStatement || null;

    const emotionalClassification = summary.emotionalClassification || null;
    const stewardshipFearExplanation = summary.explanation || null;

    const wisdomTension = summary.wisdomTension || null;
    const wisdomStatement = summary.wisdomStatement || null;
    const wisdomResolvedStatement = summary.wisdomResolvedStatement || null;

    const hypothesis = summary.hypothesis || null;
    const counterHypothesis = summary.counterHypothesis || null;
    const confidence =
      summary.calibratedConfidence || summary.metaConfidence || "unknown";

    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;

    const synthesisParts = [];
    const cautions = [];
    const actionGuidance = [];

    function addPart(text) {
      if (text && !synthesisParts.includes(text)) synthesisParts.push(text);
    }

    function addCaution(text) {
      if (text && !cautions.includes(text)) cautions.push(text);
    }

    function addAction(text) {
      if (text && !actionGuidance.includes(text)) actionGuidance.push(text);
    }

    function cleanQuestion(question) {
      if (!question) return null;

      if (question === "What information feels most missing right now?") {
        return defaultMissingInformationQuestion;
      }

      return question;
    }

    // 1. Start with the leading organ.
    if (salienceLeadOrgan === "uncertainty") {
      addPart(
        "Ari does not have enough grounded evidence yet, so the wisest move is to clarify before interpreting."
      );

      if (uncertaintyReason) addPart(uncertaintyReason);

      addCaution(
        "Do not force an emotional interpretation before Ari knows what kind of uncertainty this is."
      );
    }

    if (salienceLeadOrgan === "meaning") {
      if (lifeChapterStatement) addPart(lifeChapterStatement);
      if (lifeChapterFocus) addPart(lifeChapterFocus);
    }

    if (salienceLeadOrgan === "identity") {
      if (leadIdentity) {
        addPart(
          `The identity that appears most important right now is '${leadIdentity}'.`
        );
      }

      if (supportIdentity) {
        addPart(`The supporting identity appears to be '${supportIdentity}'.`);
      }

      if (identityPrioritySummary) addPart(identityPrioritySummary);
      if (resolutionReason) addPart(resolutionReason);
    }

    if (salienceLeadOrgan === "values") {
      if (integrationStatement) addPart(integrationStatement);

      if (integratedValue) {
        addPart(`The deeper value Ari should protect is '${integratedValue}'.`);
      }
    }

    if (salienceLeadOrgan === "stewardship") {
      addPart("This may be more about stewardship than fear.");
      if (stewardshipFearExplanation) addPart(stewardshipFearExplanation);
    }

    if (salienceLeadOrgan === "emotion") {
      addPart(
        "An emotional signal appears central, but Ari should still keep the interpretation calibrated."
      );
    }

    if (salienceLeadOrgan === "wisdom") {
      if (wisdomResolvedStatement) addPart(wisdomResolvedStatement);
      else if (wisdomStatement) addPart(wisdomStatement);
    }

    if (salienceLeadOrgan === "observer") {
      addPart("Ari should keep observing before making a strong claim.");
      addCaution("The current evidence is too thin for a confident interpretation.");
    }

    // 2. Add important supporting context.
    if (
      salienceLeadOrgan !== "meaning" &&
      primaryLifeChapter &&
      primaryLifeChapter !== "unclear_chapter"
    ) {
      addPart(`A life chapter signal is also active: '${primaryLifeChapter}'.`);
    }

    if (
      salienceLeadOrgan !== "identity" &&
      leadIdentity &&
      leadIdentity !== "observer"
    ) {
      addPart(`The active leading identity appears to be '${leadIdentity}'.`);
    }

    if (salienceLeadOrgan !== "values" && integrationStatement) {
      addPart(integrationStatement);
    }

    if (
      salienceLeadOrgan !== "stewardship" &&
      emotionalClassification === "stewardship"
    ) {
      addPart("Ari should treat this as stewardship before assuming fear.");
    }

    if (
      wisdomTension &&
      wisdomTension !== "unclear" &&
      salienceLeadOrgan !== "wisdom"
    ) {
      addPart(`A wisdom tension is present: '${wisdomTension}'.`);
    }

    // 3. Hypothesis handling.
    if (hypothesis) {
      addPart(`Ari's current working hypothesis is '${hypothesis}'.`);

      if (counterHypothesis) {
        addCaution(
          `Ari should keep the counter-hypothesis in view: '${counterHypothesis}'.`
        );
      }

      if (confidence === "low" || confidence === "unknown") {
        addCaution(
          "This hypothesis should be spoken gently because confidence is not high."
        );
      }
    } else {
      addCaution(
        "No grounded hypothesis exists yet, so Ari should ask a recovery question instead of presenting a conclusion."
      );
    }

    // 4. Prevent emotion hijack.
    if (
      strongestSignalCategory !== "underlying_emotion" &&
      salienceLeadOrgan !== "emotion"
    ) {
      addCaution(
        "Do not default to 'What feeling is hardest to admit?' unless emotion is actually the leading domain."
      );
    }

    // 5. Action guidance.
    if (salienceMode === "continue_observing") {
      addAction("Ask one clarifying question before offering insight.");
    }

    if (salienceMode === "protect_life_chapter") {
      addAction("Name the life chapter first, then ask what the season requires.");
    }

    if (salienceMode === "identity_leadership") {
      addAction("Name the active identity and ask what that identity must protect.");
    }

    if (salienceMode === "integrate_values") {
      addAction("Show how the apparent conflict may share a deeper value.");
    }

    if (salienceMode === "stewardship_not_fear") {
      addAction(
        "Use language of responsibility, care, and stewardship instead of fear unless stronger evidence supports fear."
      );
    }

    if (salienceMode === "emotion_depth") {
      addAction(
        "Ask an emotional depth question, but keep it specific to the detected emotion."
      );
    }

    if (salienceMode === "wisdom_resolution") {
      addAction("Clarify which good should lead and which should support.");
    }

    const synthesisStatement =
      synthesisParts.length > 0
        ? synthesisParts.join(" ")
        : "Ari should continue observing until a clearer synthesis emerges.";

    const recommendedQuestion =
      cleanQuestion(salienceQuestion) ||
      cleanQuestion(summary.identityConflictQuestion) ||
      cleanQuestion(summary.identityRecoveryQuestion) ||
      cleanQuestion(summary.valueIntegrationQuestion) ||
      cleanQuestion(summary.lifeChapterQuestion) ||
      cleanQuestion(summary.recommendedRecoveryQuestion) ||
      cleanQuestion(summary.wisdomRecoveryQuestion) ||
      cleanQuestion(summary.emotionRecoveryQuestion) ||
      defaultMissingInformationQuestion;

    return {
      synthesisStatement,
      synthesisCautions: cautions,
      synthesisActionGuidance: actionGuidance,
      synthesisRecommendedQuestion: recommendedQuestion,

      synthesisLeadOrgan: salienceLeadOrgan,
      synthesisMode: salienceMode,

      synthesisDebug: {
        strongestSignal,
        strongestSignalCategory,
        uncertaintyType,
        primaryLifeChapter,
        leadIdentity,
        supportIdentity,
        integratedValue,
        emotionalClassification,
        wisdomTension,
        hypothesis,
        counterHypothesis,
        confidence
      },

      source: "ari-synthesis-engine"
    };
  }
};