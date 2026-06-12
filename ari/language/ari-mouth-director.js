// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V2.5
// Fixes:
// - Keeps organism/body stabilization short, practical, and non-abstract.
// - Prevents meaning/wisdom/identity leakage into body-first responses.
// - Softens connection support so Ari does not over-question loneliness.
// - Adds comfort_then_truth pattern for connection wounds.
// - Prevents family-priority wisdom from hijacking connection/attachment wounds.

window.AriMouthDirector = {
  version: "2.5.0",

  direct(summary = {}) {
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

    const executiveDecision =
      summary.executiveDecision || null;

    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

    const dualMode = summary.dualSalienceMode || null;

    const organismUrgencyLevel =
      summary.organismUrgency?.level ||
      summary.organismUrgencyLevel ||
      "none";

    const organismFunction =
      summary.organismPrimaryFunction ||
      summary.organismFunction ||
      null;

    const isConnectionWound =
      intent === "offer_connection" ||
      mode === "restore_connection" ||
      mode === "emotional_connection" ||
      need === "connection" ||
      need === "belonging" ||
      organismFunction === "connection";

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

    if (
      intent === "protect_safety" ||
      executiveDecision === "protect_safety_first" ||
      primaryPriority === "safety" ||
      organismUrgencyLevel === "critical"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "urgent_support";
      director.maxBodySections = 2;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "stabilize_organism_function" ||
      shape === "body_truth_then_action" ||
      mode === "stabilize_body_first" ||
      need === "body"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "body_truth_then_action";
      director.maxBodySections = 2;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = false;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "clarify_before_advising" ||
      intent === "clarify_before_interpreting" ||
      shape === "brief_reflect_then_question" ||
      executiveDecision === "ask_before_directing"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "question_only";
      director.maxBodySections = 1;
      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = false;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (isConnectionWound) {
      director.explanationLevel = "minimal";
      director.responsePattern = "comfort_then_truth";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (
      !isConnectionWound &&
      (
        intent === "protect_family_presence" ||
        executiveDecision === "protect_family_first" ||
        primaryPriority === "family"
      )
    ) {
      director.explanationLevel = "deep";
      director.responsePattern = "meaning_truth_then_action";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "bridge_subjective_to_objective" ||
      shape === "acknowledge_then_gently_redirect" ||
      executiveDecision === "bridge_before_advising" ||
      primaryPriority === "bridge-objective-and-subjective" ||
      dualMode === "acknowledge_gap_then_gently_redirect"
    ) {
      director.explanationLevel = "standard";
      director.responsePattern = "acknowledge_then_gently_redirect";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "follow_subjective_salience" ||
      shape === "comfort_then_explore" ||
      executiveDecision === "follow_subjective_salience_first" ||
      primaryPriority === "follow-human-attention" ||
      dualMode === "follow_user_attention_first"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "comfort_then_question";
      director.maxBodySections = 2;
      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (
      intent === "validate_then_act" ||
      shape === "validate_then_next_step"
    ) {
      director.explanationLevel = "standard";
      director.responsePattern = "validate_then_next_step";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "protect_dignity" ||
      mode === "restore_dignity" ||
      need === "worth"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "validate_then_question";
      director.maxBodySections = 2;
      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (
      intent === "stabilize_health" ||
      executiveDecision === "stabilize_health_first" ||
      primaryPriority === "health-stabilization"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "calm_health_step";
      director.maxBodySections = 2;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "create_priority_structure" ||
      executiveDecision === "create_priority_structure" ||
      primaryPriority === "planning"
    ) {
      director.explanationLevel = "deep";
      director.responsePattern = "prioritize_then_plan";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = false;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "protect_capacity" ||
      executiveDecision === "reduce_load_immediately" ||
      primaryPriority === "capacity-protection"
    ) {
      director.explanationLevel = "standard";
      director.responsePattern = "truth_then_boundary";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (
      intent === "name_conflict" ||
      shape === "conflict_then_choice"
    ) {
      director.explanationLevel = "deep";
      director.responsePattern = "conflict_then_choice";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (intent === "resolve_tension") {
      director.explanationLevel = "deep";
      director.responsePattern = "principle_then_choice";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (intent === "name_life_chapter") {
      director.explanationLevel = "deep";
      director.responsePattern = "meaning_then_guidance";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (intent === "clarify_identity") {
      director.explanationLevel = "standard";
      director.responsePattern = "identity_then_question";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (intent === "support_stewardship") {
      director.explanationLevel = "standard";
      director.responsePattern = "steady_then_next_step";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    if (intent === "name_emotion") {
      director.explanationLevel = "minimal";
      director.responsePattern = "emotion_then_question";
      director.maxBodySections = 2;
      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (intent === "integrate_values") {
      director.explanationLevel = "standard";
      director.responsePattern = "value_then_question";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = false;

      return director;
    }

    if (
      confidence === "unknown" ||
      confidence === "low"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "observe_then_question";
      director.maxBodySections = 2;
      director.askBeforeTeaching = true;

      director.allowMeaning = false;
      director.allowEmotion = true;
      director.allowTruth = false;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    if (
      confidence === "high" ||
      confidence === "very_high"
    ) {
      director.explanationLevel = "deep";
      director.responsePattern = "insight_then_guidance";
      director.maxBodySections = 4;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    return director;
  }
};