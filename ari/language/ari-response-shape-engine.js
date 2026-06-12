// ari/language/ari-response-shape-engine.js
// Ari Response Shape Engine
// Purpose: Decide the structure of Ari's final response.
// V1.1
// Fixes:
// - Adds body/safety guardrail.
// - Prevents body-first responses from adding questions.
// - Respects body_truth_then_action and stabilize_organism_function.

window.AriResponseShapeEngine = {
  version: "1.1.0",

  shape(summary = {}) {
    const lead =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const intent = summary.responseIntent || null;
    const pattern =
      summary.mouthResponsePattern ||
      summary.responseShape ||
      null;

    const primaryHumanNeed = summary.primaryHumanNeed || null;

    const isBodyFirst =
      lead === "safety" ||
      mode === "stabilize_body_first" ||
      intent === "stabilize_organism_function" ||
      pattern === "body_truth_then_action" ||
      primaryHumanNeed === "body";

    if (isBodyFirst) {
      return {
        responseShape: "body_truth_then_action",
        shouldNamePattern: false,
        shouldNameTension: false,
        shouldOfferAction: true,
        shouldAskQuestion: false,
        closing: null,
        question: null,
        finalQuestion: null,
        source: "ari-response-shape-engine"
      };
    }

    const confidence =
      summary.calibratedConfidence ||
      summary.metaConfidence ||
      "unknown";

    const hasHypothesis = Boolean(summary.hypothesis);
    const hasWisdom = Boolean(summary.wisdomResolvedStatement);
    const hasAction = Boolean(
      summary.courseCorrection ||
      summary.regretPreventableAction
    );

    let responseShape = "observe_question";
    let shouldNamePattern = false;
    let shouldNameTension = false;
    let shouldOfferAction = false;
    let shouldAskQuestion = true;

    if (lead === "uncertainty") {
      responseShape = "clarify_before_interpreting";
    } else if (confidence === "high" && hasHypothesis) {
      responseShape = "pattern_truth_action_question";
      shouldNamePattern = true;
      shouldNameTension = true;
      shouldOfferAction = hasAction;
    } else if (hasWisdom) {
      responseShape = "chapter_wisdom_question";
      shouldNameTension = true;
      shouldOfferAction = hasAction;
    } else if (lead === "meaning") {
      responseShape = "chapter_meaning_question";
      shouldNamePattern = confidence !== "low";
    } else if (lead === "identity") {
      responseShape = "identity_ordering_question";
      shouldNamePattern = true;
    }

    return {
      responseShape,
      shouldNamePattern,
      shouldNameTension,
      shouldOfferAction,
      shouldAskQuestion,
      source: "ari-response-shape-engine"
    };
  }
};