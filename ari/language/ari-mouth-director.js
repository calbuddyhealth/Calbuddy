// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V3.0
// Rule:
// - Situation Contract is authoritative.
// - Mouth Director may shape communication.
// - Mouth Director may NOT change primary/support/brief/context/deferred.
// - Legacy systems are fallback only.

window.AriMouthDirector = {
  version: "3.0.0",

  direct(summary = {}) {
    const contract =
      summary.situationContract || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      null;

    const responseShape =
      summary.responseShape ||
      contract.responseShape ||
      "balanced";

    const safetyRiskLevel =
      summary.safetyRiskLevel ||
      summary.safetyContextGate?.riskLevel ||
      summary.riskLevel ||
      "none";

    const clarityNeeded =
      summary.safetyFollowUpNeeded === true ||
      contract.clarity?.needed === true ||
      primary === "risk_clarification";

    const director = {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      source: "ari-mouth-director",

      contractPrimary: primary,
      responseShape,
      safetyRiskLevel,

      explanationLevel: "standard",
      responsePattern: responseShape || "balanced",
      maxBodySections: 3,
      askBeforeTeaching: false,

      allowMeaning: false,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: false,
      allowAction: true,

      mouthRules: [
        "Situation Contract is authoritative.",
        "Mouth Director may shape response format only.",
        "Mouth Director must not change the primary lane.",
        "Legacy systems are fallback only when no Situation Contract exists."
      ]
    };

    // 1. Risk clarification must be one clear question.
    if (clarityNeeded) {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "risk_clarification_question",
        maxBodySections: 1,
        askBeforeTeaching: true,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false,

        mouthRules: [
          ...director.mouthRules,
          "Ask one clear risk clarification question.",
          "Do not assume emergency if context is unclear.",
          "Do not answer lower-priority lanes until risk is clarified."
        ]
      };
    }

    // 2. Contract primary lanes.
    if (primary === "safety") {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "urgent_support",
        maxBodySections: 2,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (primary === "medical_body") {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "body_truth_then_action",
        maxBodySections: 2,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (primary === "executive_decision") {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "prioritize_then_plan",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: true,
        allowAction: true
      };
    }

    if (primary === "builder") {
      return {
        ...director,
        explanationLevel: "clear",
        responsePattern: "code_then_explain",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (primary === "teacher") {
      return {
        ...director,
        explanationLevel: "clear",
        responsePattern: "explain_then_example",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (primary === "emotion") {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "comfort_then_truth",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (primary === "family") {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "family_truth_then_next_step",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: true,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: true,
        allowAction: true
      };
    }

    if (primary === "relationship") {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "relationship_truth_then_repair",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (primary === "wisdom") {
      return {
        ...director,
        explanationLevel: "deep",
        responsePattern: "principle_then_choice",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: true,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: true,
        allowAction: true
      };
    }

    if (primary === "memory") {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "acknowledge_memory_request",
        maxBodySections: 1,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (primary === "general_understanding") {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "observe_then_answer",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    // 3. Response shape override, only when contract primary did not match.
    if (responseShape === "multi_question_triage") {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "primary_support_brief_context_deferred",
        maxBodySections: 5,
        askBeforeTeaching: false,

        allowMeaning: true,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: true,
        allowAction: true,

        mouthRules: [
          ...director.mouthRules,
          "Use primary/support/brief/context/deferred structure when useful."
        ]
      };
    }

    // 4. Legacy fallback.
    return this.legacyFallback(summary, director);
  },

  legacyFallback(summary = {}, director = {}) {
    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      "observe";

    const need = summary.primaryHumanNeed || null;

    const confidence =
      summary.calibratedConfidence ||
      summary.metaConfidence ||
      "unknown";

    const intent =
      summary.responseIntent ||
      "respond_normally";

    const shape =
      summary.responseShape ||
      "balanced";

    const observerPrimary =
      summary.observerHierarchyPrimaryObservation ||
      summary.strongestObservation ||
      null;

    const observerCategory =
      summary.observerHierarchyPrimaryCategory ||
      summary.strongestObservationCategory ||
      null;

    const isTeachingRequest =
      intent === "teach_clearly" ||
      intent === "teach" ||
      shape === "clear_explanation" ||
      observerPrimary === "teaching_request" ||
      summary.questionType === "teaching" ||
      summary.focusType === "teaching" ||
      summary.primaryNeed === "teaching";

    const isBuildRequest =
      intent === "build_or_debug" ||
      intent === "build_or_fix" ||
      intent === "generate_code" ||
      shape === "code_then_explain" ||
      observerPrimary === "build_request" ||
      summary.focusType === "build" ||
      summary.primaryNeed === "build";

    const isConnectionWound =
      intent === "offer_connection" ||
      mode === "restore_connection" ||
      mode === "emotional_connection" ||
      need === "connection" ||
      need === "belonging";

    if (intent === "protect_safety" || intent === "protect_safety_first") {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "urgent_support",
        maxBodySections: 2,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (
      intent === "stabilize_organism_function" ||
      shape === "body_truth_then_action" ||
      mode === "stabilize_body_first" ||
      need === "body"
    ) {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "body_truth_then_action",
        maxBodySections: 2,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (isTeachingRequest) {
      return {
        ...director,
        explanationLevel: "clear",
        responsePattern: "explain_then_example",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (isBuildRequest) {
      return {
        ...director,
        explanationLevel: "clear",
        responsePattern: "code_then_explain",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: false,
        allowTruth: true,
        allowWisdom: false,
        allowAction: true
      };
    }

    if (
      intent === "clarify_before_advising" ||
      intent === "clarify_before_interpreting" ||
      shape === "brief_reflect_then_question"
    ) {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "question_only",
        maxBodySections: 1,
        askBeforeTeaching: true,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: false,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (isConnectionWound) {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "comfort_then_truth",
        maxBodySections: 3,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: false,
        allowAction: false
      };
    }

    if (
      intent === "create_priority_structure" ||
      intent === "decision_support" ||
      observerCategory === "planning"
    ) {
      return {
        ...director,
        explanationLevel: "standard",
        responsePattern: "prioritize_then_plan",
        maxBodySections: 4,
        askBeforeTeaching: false,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: true,
        allowWisdom: true,
        allowAction: true
      };
    }

    if (
      confidence === "unknown" ||
      confidence === "low"
    ) {
      return {
        ...director,
        explanationLevel: "minimal",
        responsePattern: "observe_then_question",
        maxBodySections: 2,
        askBeforeTeaching: true,

        allowMeaning: false,
        allowEmotion: true,
        allowTruth: false,
        allowWisdom: false,
        allowAction: false
      };
    }

    return director;
  }
};