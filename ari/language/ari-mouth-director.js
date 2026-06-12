// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari should communicate.
// V1.0

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

    const director = {
      explanationLevel: "standard",
      responsePattern: "reflection_then_question",

      maxBodySections: 3,

      askBeforeTeaching: false,

      allowMeaning: true,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: true,
      allowAction: true
    };

    // -------------------------
    // RESTORE DIGNITY
    // -------------------------

    if (mode === "restore_dignity") {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "validate_then_question";

      director.maxBodySections = 2;

      director.askBeforeTeaching = true;

      director.allowEmotion = true;
      director.allowTruth = true;

      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // -------------------------
    // CONNECTION
    // -------------------------

    if (mode === "emotional_connection") {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "comfort_then_question";

      director.maxBodySections = 2;

      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // -------------------------
    // LOW CONFIDENCE
    // -------------------------

    if (
      confidence === "unknown" ||
      confidence === "low"
    ) {

      director.explanationLevel = "minimal";

      director.responsePattern =
        "observe_then_question";

      director.maxBodySections = 2;

      director.allowAction = false;

      return director;
    }

    // -------------------------
    // HIGH CONFIDENCE
    // -------------------------

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