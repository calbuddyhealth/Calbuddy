// ari/integration/ari-synthesis-engine.js
// Ari Synthesis Engine
// Purpose: Combine organ outputs into one coherent interpretation.
// V1.2
// Fixes:
// - Adds Human Needs Network awareness.
// - Adds dignity/worth synthesis for restore_dignity.
// - Adds connection synthesis for restore_connection.
// - Adds security/body synthesis.
// - Prevents generic uncertainty language from overriding strong human needs.

window.AriSynthesisEngine = {
  synthesize(input = {}) {
    const summary = input.summary || input || {};
const authorityAllows = summary.authorityAllows || {};
const authorityForceDirectAnswer = Boolean(summary.authorityForceDirectAnswer);
const authoritySuppressRecoveryQuestion = Boolean(summary.authoritySuppressRecoveryQuestion);

const allowTeaching = summary.allowTeaching ?? authorityAllows.teaching ?? true;
const allowEmotion = summary.allowEmotion ?? authorityAllows.emotion ?? true;
const allowMeaning = summary.allowMeaning ?? authorityAllows.meaning ?? true;
const allowIdentity = summary.allowIdentity ?? authorityAllows.identity ?? true;
const allowWisdom = summary.allowWisdom ?? authorityAllows.wisdom ?? true;
const allowAction = summary.allowAction ?? authorityAllows.action ?? true;
    
    const defaultMissingInformationQuestion =
      "What feels important here that has not been said out loud yet?";

    const salienceLeadOrgan = summary.salienceLeadOrgan || "observer";
    const salienceMode = summary.salienceMode || "continue_observing";
    const salienceQuestion = summary.salienceQuestion || null;

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const primaryHumanNeedScore = Number(summary.primaryHumanNeedScore || 0);
    const primaryHumanNeedReason = summary.primaryHumanNeedReason || null;
    const needResponseMode = summary.needResponseMode || null;

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

    const strongHumanNeed =
      primaryHumanNeed &&
      primaryHumanNeed !== "understanding" &&
      primaryHumanNeedScore >= 80;

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
      if (needResponseMode === "restore_dignity" || primaryHumanNeed === "worth") {
        addPart(
          "The central need here appears to be worth, dignity, and respect."
        );
        addPart(
          "Ari should respond by protecting the user's dignity first, not by treating this as a vague uncertainty problem."
        );
        addAction(
          "Validate the wound, separate the user's worth from other people's behavior, then ask what happened."
        );
      } else if (
        needResponseMode === "restore_connection" ||
        primaryHumanNeed === "connection"
      ) {
        addPart(
          "The central need here appears to be connection, belonging, or feeling emotionally alone."
        );
        addPart(
          "Ari should respond with warmth and presence before trying to explain or solve."
        );
        addAction(
          "Name the loneliness gently, offer emotional grounding, then ask what made the user feel disconnected."
        );
      } else {
        addPart(
          "An emotional signal appears central, but Ari should still keep the interpretation calibrated."
        );
        addAction(
          "Respond with emotional attunement before offering interpretation."
        );
      }
    }

    if (salienceLeadOrgan === "executive") {
      if (primaryHumanNeed === "security") {
        addPart(
          "The central need appears to be security, stability, or protection."
        );
        addAction(
          "Help the user identify the first stabilizing step before exploring deeper meaning."
        );
      } else {
        addPart(
          "The situation appears to need practical organization before deeper interpretation."
        );
        addAction(
          "Clarify the decision, constraints, and next step."
        );
      }
    }

    if (salienceLeadOrgan === "safety") {
      addPart(
        "Safety or body stability appears to be the highest priority."
      );
      addAction(
        "Prioritize immediate safety, medical guidance, or stabilization before meaning-making."
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

    // 2. Add strong human need context.
    if (strongHumanNeed && salienceLeadOrgan !== "uncertainty") {
      addPart(`The active human need is '${primaryHumanNeed}'.`);
      if (primaryHumanNeedReason) addPart(primaryHumanNeedReason);
    }

    if (
      strongHumanNeed &&
      salienceLeadOrgan === "uncertainty"
    ) {
      addCaution(
        "A strong human need is active, so uncertainty should not flatten the response into generic clarification."
      );
    }

    // 3. Add important supporting context.
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

    // 4. Hypothesis handling.
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
    } else if (!strongHumanNeed) {
      addCaution(
        "No grounded hypothesis exists yet, so Ari should ask a recovery question instead of presenting a conclusion."
      );
    }

    // 5. Prevent emotion hijack, but allow emotion when human need demands it.
    if (
      strongestSignalCategory !== "underlying_emotion" &&
      salienceLeadOrgan !== "emotion" &&
      !["worth", "connection"].includes(primaryHumanNeed)
    ) {
      addCaution(
        "Do not default to 'What feeling is hardest to admit?' unless emotion is actually the leading domain."
      );
    }

    // 6. Action guidance.
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

    if (salienceMode === "restore_dignity") {
      addAction(
        "Protect dignity first. Do not make the user prove why feeling disrespected matters."
      );
    }

    if (salienceMode === "restore_connection") {
      addAction(
        "Offer connection and warmth first. Do not jump immediately into analysis."
      );
    }

    if (salienceMode === "protect_security") {
      addAction(
        "Stabilize the practical risk before deeper reflection."
      );
    }

    if (salienceMode === "stabilize_body_first") {
      addAction(
        "Address body stability before interpretation."
      );
    }

    if (salienceMode === "wisdom_resolution") {
      addAction("Clarify which good should lead and which should support.");
    }

    const synthesisStatement =
      synthesisParts.length > 0
        ? synthesisParts.join(" ")
        : "Ari should continue observing until a clearer synthesis emerges.";

if (authorityForceDirectAnswer || authoritySuppressRecoveryQuestion) {
  return {
    synthesisStatement: null,
    synthesisCautions: [],
    synthesisActionGuidance: [],
    synthesisRecommendedQuestion: null,

    synthesisLeadOrgan: salienceLeadOrgan,
    synthesisMode: salienceMode,

    synthesisDebug: {
      strongestSignal,
      strongestSignalCategory,
      uncertaintyType,
      primaryHumanNeed,
      primaryHumanNeedScore,
      needResponseMode,
      primaryLifeChapter,
      leadIdentity,
      supportIdentity,
      integratedValue,
      emotionalClassification,
      wisdomTension,
      hypothesis,
      counterHypothesis,
      confidence,
      authorityForceDirectAnswer,
      authoritySuppressRecoveryQuestion,
      allowTeaching,
      allowEmotion,
      allowMeaning,
      allowIdentity,
      allowWisdom,
      allowAction
    },
    source: "ari-synthesis-engine"
  };
}
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
        primaryHumanNeed,
        primaryHumanNeedScore,
        needResponseMode,
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