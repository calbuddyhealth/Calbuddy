// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V2.0

window.AriMouthDirector = {
  direct(summary = {}) {

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      "observe";

    const need =
      summary.primaryHumanNeed || null;

    const confidence =
      summary.calibratedConfidence ||
      summary.metaConfidence ||
      "unknown";

    const intent =
      summary.responseIntent ||
      "respond_normally";

    const director = {

      explanationLevel: "standard",

      responsePattern: "reflection_then_question",

      maxBodySections: 3,

      askBeforeTeaching: false,

      allowMeaning: true,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: true,
      allowAction: true,

      source: "ari-mouth-director",

      mouthDirectorRan: true
    };

    // ===================================
    // PROTECT DIGNITY
    // ===================================

    if (
      intent === "protect_dignity" ||
      mode === "restore_dignity" ||
      need === "worth"
    ) {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "validate_then_question";

      director.maxBodySections = 2;

      director.askBeforeTeaching = true;

      director.allowMeaning = false;

      director.allowEmotion = true;
      director.allowTruth = true;

      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // ===================================
    // CONNECTION
    // ===================================

    if (
      intent === "offer_connection" ||
      mode === "emotional_connection"
    ) {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "comfort_then_question";

      director.maxBodySections = 2;

      director.askBeforeTeaching = true;

      director.allowMeaning = false;

      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // ===================================
    // CLARIFY FIRST
    // ===================================

    if (
      intent === "clarify_before_interpreting"
    ) {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "question_only";

      director.maxBodySections = 1;

      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = false;
      director.allowTruth = false;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // ===================================
    // WISDOM
    // ===================================

    if (
      intent === "resolve_tension"
    ) {

      director.explanationLevel = "deep";

      director.responsePattern =
        "principle_then_choice";

      director.maxBodySections = 4;

      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    // ===================================
    // MEANING
    // ===================================

    if (
      intent === "name_life_chapter"
    ) {

      director.explanationLevel = "deep";

      director.responsePattern =
        "meaning_then_guidance";

      director.maxBodySections = 4;

      return director;
    }

    // ===================================
    // LOW CONFIDENCE
    // ===================================

    if (
      confidence === "unknown" ||
      confidence === "low"
    ) {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "observe_then_question";

      director.maxBodySections = 2;

      director.askBeforeTeaching = true;

      director.allowAction = false;

      return director;
    }

    // ===================================
    // HIGH CONFIDENCE
    // ===================================

    if (
      confidence === "high" ||
      confidence === "very_high"
    ) {

      director.explanationLevel = "deep";

      director.responsePattern =
        "insight_then_guidance";

      director.maxBodySections = 4;

      return director;
    }

    return director;
  }
};