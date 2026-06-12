// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V2.1
// Adds Response Intent V1.2, Executive V1.3, Dual Salience, and Observer Hierarchy awareness.

window.AriMouthDirector = {
  version: "2.1.0",

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

    const observerShouldAsk =
      summary.observerHierarchyShouldAskClarifyingQuestion === true;

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

    // SAFETY
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

    // CLARIFY BEFORE ADVISING
    if (
      intent === "clarify_before_advising" ||
      intent === "clarify_before_interpreting" ||
      shape === "brief_reflect_then_question" ||
      executiveDecision === "ask_before_directing" ||
      observerShouldAsk
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

    // DUAL SALIENCE BRIDGE
    if (
      intent === "bridge_subjective_to_objective" ||
      shape === "acknowledge_then_gently_redirect" ||
      executiveDecision === "bridge_before_advising" ||
      primaryPriority === "bridge-objective-and-subjective" ||
      dualMode === "acknowledge_gap_then_gently_redirect"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "comfort_bridge_then_one_step";
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

    // PROTECT FAMILY PRESENCE
    if (
      intent === "protect_family_presence" ||
      executiveDecision === "protect_family_first" ||
      primaryPriority === "family"
    ) {
      director.explanationLevel = "standard";
      director.responsePattern = "meaning_truth_then_action";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = true;
      director.allowEmotion = true;
      director.allowTruth = true;
      director.allowWisdom = true;
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
      director.maxBodySections = 3;
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
      director.explanationLevel = "standard";
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
      director.explanationLevel = "standard";
      director.responsePattern = "conflict_then_choice";
      director.maxBodySections = 3;
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

      director.allowWisdom = true;
      director.allowAction = true;

      return director;
    }

    // MEANING
    if (intent === "name_life_chapter") {
      director.explanationLevel = "deep";
      director.responsePattern = "meaning_then_guidance";
      director.maxBodySections = 4;

      return director;
    }

    // LOW CONFIDENCE
    if (
      confidence === "unknown" ||
      confidence === "low"
    ) {
      director.explanationLevel = "minimal";
      director.responsePattern = "observe_then_question";
      director.maxBodySections = 2;
      director.askBeforeTeaching = true;
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

      return director;
    }

    return director;
  }
};