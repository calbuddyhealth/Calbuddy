// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates.
// V2.6
// Upgrades:
// - Makes responseIntent + domain governor authoritative for mouth shape.
// - Fixes teaching requests getting swallowed by uncertainty.
// - Adds clear handling for build/code requests.
// - Keeps safety/body above everything.
// - Prevents uncertainty fallback from overriding direct teaching/build/planning.
// - Keeps meaning/wisdom/identity gated by permissions and intent.

window.AriMouthDirector = { 
  version: "2.6.0",

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

    const domainLead =
      summary.domainLead ||
      summary.domainGovernor?.domainLead ||
      summary.universalDomainGovernor?.domainLead ||
      null;

    const domainMode =
      summary.domainMode ||
      summary.domainGovernor?.domainMode ||
      summary.universalDomainGovernor?.domainMode ||
      null;

    const shouldPreferTeaching =
      summary.shouldPreferTeaching === true ||
      summary.domainGovernor?.shouldPreferTeaching === true ||
      summary.universalDomainGovernor?.shouldPreferTeaching === true;

    const shouldPreferSafety =
      summary.shouldPreferSafety === true ||
      summary.domainGovernor?.shouldPreferSafety === true ||
      summary.universalDomainGovernor?.shouldPreferSafety === true;

    const shouldPreferBodyStabilization =
      summary.shouldPreferBodyStabilization === true ||
      summary.domainGovernor?.shouldPreferBodyStabilization === true ||
      summary.universalDomainGovernor?.shouldPreferBodyStabilization === true;

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

    const observerPrimary =
      summary.observerHierarchyPrimaryObservation ||
      summary.strongestObservation ||
      null;

    const observerCategory =
      summary.observerHierarchyPrimaryCategory ||
      summary.strongestObservationCategory ||
      null;

    const isConnectionWound =
      intent === "offer_connection" ||
      mode === "restore_connection" ||
      mode === "emotional_connection" ||
      need === "connection" ||
      need === "belonging" ||
      organismFunction === "connection";

    const isTeachingRequest =
      intent === "teach_clearly" ||
      shape === "clear_explanation" ||
      domainLead === "knowledge_teaching_domain" ||
      domainMode === "teach_clearly" ||
      shouldPreferTeaching ||
      observerPrimary === "teaching_request" ||
      summary.questionType === "teaching" ||
      summary.focusType === "teaching" ||
      summary.primaryNeed === "teaching";

    const isBuildRequest =
      intent === "build_or_debug" ||
      intent === "generate_code" ||
      shape === "code_then_explain" ||
      domainLead === "creative_building_domain" ||
      domainMode === "build_or_debug" ||
      observerPrimary === "build_request" ||
      summary.focusType === "build" ||
      summary.primaryNeed === "build";

    const director = {
      explanationLevel: "standard",
      responsePattern: "reflection_then_question",
      maxBodySections: 3,
      askBeforeTeaching: false,

      allowMeaning: false,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: false,
      allowAction: true,

      source: "ari-mouth-director",
      mouthDirectorRan: true
    };

    // 1. Safety override.
    if (
      shouldPreferSafety ||
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

    // 2. Body / medical / organism stabilization.
    if (
      shouldPreferBodyStabilization ||
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

    // 3. Direct teaching must beat uncertainty.
    if (isTeachingRequest) {
      director.explanationLevel = "clear";
      director.responsePattern = "explain_then_example";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
      director.allowEmotion = false;
      director.allowTruth = true;
      director.allowWisdom = false;
      director.allowAction = false;

      return director;
    }

    // 4. Build/code/debug requests.
    if (isBuildRequest) {
      director.explanationLevel = "clear";
      director.responsePattern = "code_then_explain";
      director.maxBodySections = 4;
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
      intent === "protect_relationship_responsibility" ||
      intent === "protect_family_presence" ||
      executiveDecision === "protect_family_first" ||
      primaryPriority === "family" ||
      primaryPriority === "responsibility" ||
      primaryPriority === "caregiving"
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
      primaryPriority === "planning" ||
      observerCategory === "planning"
    ) {
      director.explanationLevel = "deep";
      director.responsePattern = "prioritize_then_plan";
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
      intent === "protect_capacity" ||
      executiveDecision === "reduce_load_immediately" ||
      primaryPriority === "capacity-protection"
    ) {
      director.explanationLevel = "standard";
      director.responsePattern = "truth_then_boundary";
      director.maxBodySections = 3;
      director.askBeforeTeaching = false;

      director.allowMeaning = false;
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
      director.allowWisdom = false;
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

    // Last-resort uncertainty fallback.
    // This must stay AFTER teaching/build/planning so it does not hijack direct requests.
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

      director.allowMeaning =
        intent === "name_life_chapter" ||
        intent === "support_stewardship" ||
        intent === "integrate_values";

      director.allowEmotion = true;
      director.allowTruth = true;

      director.allowWisdom =
        intent === "resolve_tension" ||
        intent === "name_life_chapter" ||
        intent === "integrate_values";

      director.allowAction = true;

      return director;
    }

    return director;
  }
};