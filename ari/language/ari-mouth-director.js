// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V2.2
// Fixes:
// - Mouth obeys Response Intent first.
// - Removes direct observerShouldAsk override from the clarify block.
// - Prevents Observer noise from forcing question_only when Executive / Response Intent already chose a stronger move.

window.AriMouthDirector = {
  version: "2.2.0",

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

    const shape =
      summary.responseShape ||
      "balanced";

    const executiveDecision =
      summary.executiveDecision || null;

    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

    const dualMode =
      summary.dualSalienceMode || null;

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
    // 1. SAFETY OVERRIDE
    // ===================================

    if (
      intent === "protect_safety" ||
      executiveDecision === "protect_safety_first" ||
      primaryPriority === "safety"
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

    // ===================================
    // 2. RESPONSE INTENT FIRST
    // ===================================

    // CLARIFY BEFORE ADVISING
    // Important: do NOT check observerShouldAsk here.
    // Response Intent is responsible for deciding whether observation uncertainty
    // deserves a question. Mouth only obeys the final intent.
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

    // PROTECT FAMILY PRESENCE
    if (
      intent === "protect_family_presence" ||
      executiveDecision === "protect_family_first" ||
      primaryPriority === "family"
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

    // DUAL SALIENCE BRIDGE
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

    // FOLLOW SUBJECTIVE SALIENCE
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

    // VALIDATE THEN ACT
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

    // PROTECT DIGNITY
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

    // CONNECTION / SUPPORT
    if (
      intent === "offer_connection" ||
      intent === "support_before_solution" ||
      mode === "emotional_connection"
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

    // HEALTH STABILIZATION
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

    // PLANNING / STRUCTURE
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

    // CAPACITY PROTECTION
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

    // CONFLICT
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

    // WISDOM
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

    // MEANING
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

    // IDENTITY
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

    // STEWARDSHIP
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

    // EMOTION
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

    // VALUES
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

    // ===================================
    // 3. CONFIDENCE FALLBACKS
    // ===================================

    // LOW CONFIDENCE
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

    // HIGH CONFIDENCE
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