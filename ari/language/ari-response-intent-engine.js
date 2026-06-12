// ari/language/ari-response-intent-engine.js
// Ari Response Intent Engine
// Purpose: Decide what kind of conversational move Ari should make before composing words.
// V1.5
// Fixes:
// - Separates true body organism functions from relational organism functions.
// - Prevents connection/attachment signals from triggering body stabilization.
// - Routes loneliness, abandonment, relationship rupture, and attachment pain to connection support.
// - Keeps body/survival functions protected before meaning, wisdom, identity, or interpretation.

window.AriResponseIntentEngine = {
  version: "1.5.0",

  evaluate(input = {}) {
    return this.decide(input);
  },

  decide(input = {}) {
    const summary = input.summary || input || {};

    const executiveDecision = summary.executiveDecision || null;

    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

    const responseStrategy =
      summary.responseStrategy ||
      summary.executiveResponseStrategy ||
      {};

    const strategyMode =
      responseStrategy.mode ||
      summary.responseStrategyMode ||
      null;

    const observerPrimary =
      summary.observerHierarchyPrimaryObservation || null;

    const observerCategory =
      summary.observerHierarchyPrimaryCategory || null;

    const observerShouldAsk =
      summary.observerHierarchyShouldAskClarifyingQuestion === true;

    const observerQuestion =
      summary.observerHierarchyRecommendedQuestion || null;

    const dualMode = summary.dualSalienceMode || null;
    const dualClarityAction = summary.dualSalienceClarityAction || null;

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      "continue_observing";

    const need = summary.primaryHumanNeed || null;
    const needScore = Number(summary.primaryHumanNeedScore || 0);
    const uncertaintyType = summary.uncertaintyType || null;
    const safetyTriggered = Boolean(summary.safetyTriggered);

    const organismFunction =
      summary.organismPrimaryFunction ||
      summary.organismFunction ||
      null;

    const organismUrgencyLevel =
      summary.organismUrgency?.level ||
      summary.organismUrgencyLevel ||
      "none";

    const bodyOrganismFunctions = [
      "energy_intake",
      "hydration",
      "rest_recovery",
      "injury_protection",
      "vital_stability"
    ];

    const relationalOrganismFunctions = [
      "connection"
    ];

    const organismIsBodyFunction =
      bodyOrganismFunctions.includes(organismFunction);

    const organismIsRelationalFunction =
      relationalOrganismFunctions.includes(organismFunction);

    const organismNeedsStabilization =
      organismIsBodyFunction &&
      (
        summary.organismNeedsStabilization === true ||
        summary.organismRecommendedMode === "stabilize_body_first" ||
        summary.organismRecommendedMode === "restore_basic_function" ||
        organismUrgencyLevel === "critical" ||
        organismUrgencyLevel === "high" ||
        organismUrgencyLevel === "moderate"
      );

    const bodyNeedActive =
      need === "body" ||
      summary.needResponseMode === "stabilize_body_first" ||
      (
        summary.needRecommendedLeadOrgan === "safety" &&
        organismIsBodyFunction
      ) ||
      organismNeedsStabilization;

    const rebirthResolvedEnough =
      summary.uncertaintyType === "resolved_enough" ||
      summary.calibratedConfidence === "high" ||
      summary.metaConfidence === "high" ||
      Number(summary.confidenceScore || 0) >= 75;

    const strongLifeChapterActive =
      Boolean(
        summary.primaryLifeChapter &&
        summary.primaryLifeChapter !== "unclear_chapter"
      ) ||
      summary.primarySalienceName === "fatherhood_transition" ||
      summary.primarySalienceName === "family_transition" ||
      summary.strongestSignal === "fatherhood_transition" ||
      summary.strongestSignal === "family_transition" ||
      summary.salienceRecommendedLead === "life_chapter" ||
      leadOrgan === "meaning";

    const executiveClear =
      executiveDecision === "protect_family_first" ||
      executiveDecision === "protect_safety_first" ||
      primaryPriority === "family" ||
      primaryPriority === "safety";

    // 1. True urgent safety always wins.
    if (
      safetyTriggered ||
      executiveDecision === "protect_safety_first" ||
      primaryPriority === "safety" ||
      organismUrgencyLevel === "critical"
    ) {
      return this.intent(
        "protect_safety",
        "urgent_support",
        "Safety is active and must lead.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "executive_safety"
        }
      );
    }

    // 2. Relational organism functions are NOT body stabilization.
    if (
      organismIsRelationalFunction ||
      need === "connection" ||
      need === "belonging" ||
      summary.needResponseMode === "restore_connection"
    ) {
      return this.intent(
        "offer_connection",
        "comfort_then_question",
        "Connection or attachment rupture is active. Ari should restore connection before analysis, not treat it like body stabilization.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion ||
            "What feels most lonely about this right now?",
          sourceLayer: "organism_connection"
        }
      );
    }

    // 3. True body/survival stabilization.
    if (bodyNeedActive) {
      return this.intent(
        "stabilize_organism_function",
        "body_truth_then_action",
        "A basic body function is active or disrupted. Ari should stabilize the body before meaning, identity, wisdom, or deeper interpretation.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            summary.organismRecommendedQuestion ||
            summary.organismRecommendedAction ||
            summary.synthesisRecommendedQuestion ||
            summary.salienceQuestion ||
            observerQuestion ||
            "What does your body need first right now?",
          sourceLayer: "organism_function"
        }
      );
    }

    if (
      !rebirthResolvedEnough &&
      !strongLifeChapterActive &&
      !executiveClear &&
      (
        observerShouldAsk ||
        dualClarityAction === "ask_one_clarifying_question" ||
        executiveDecision === "ask_before_directing" ||
        primaryPriority === "clarify-before-directing" ||
        strategyMode === "clarify_before_advising"
      )
    ) {
      return this.intent(
        "clarify_before_advising",
        "brief_reflect_then_question",
        "Observer hierarchy or executive strategy says Ari needs one focused question before advising.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What feels most important about this?",
          sourceLayer: "observer_hierarchy"
        }
      );
    }

    if (
      executiveDecision === "protect_family_first" ||
      primaryPriority === "family" ||
      observerPrimary === "provider_vs_present_parent" ||
      observerPrimary === "fatherhood_transition"
    ) {
      return this.intent(
        "protect_family_presence",
        "meaning_truth_then_action",
        "Family or parenthood is the leading executive priority. Ari should protect presence and avoid treating all goals equally.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion || "What does your family most need from you in this season?",
          sourceLayer: "executive_family"
        }
      );
    }

    if (
      dualMode === "acknowledge_gap_then_gently_redirect" ||
      executiveDecision === "bridge_before_advising" ||
      primaryPriority === "bridge-objective-and-subjective" ||
      strategyMode === "bridge_subjective_to_objective"
    ) {
      return this.intent(
        "bridge_subjective_to_objective",
        "acknowledge_then_gently_redirect",
        "Objective need is important, but the user's attention is elsewhere. Ari should bridge before advising.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "dual_salience"
        }
      );
    }

    if (
      dualMode === "follow_user_attention_first" ||
      executiveDecision === "follow_subjective_salience_first" ||
      primaryPriority === "follow-human-attention" ||
      strategyMode === "follow_subjective_salience"
    ) {
      return this.intent(
        "follow_subjective_salience",
        "comfort_then_explore",
        "The user's emotional focus is the doorway. Ari should start where the human actually is.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What feels loudest for you right now?",
          sourceLayer: "dual_salience"
        }
      );
    }

    if (
      dualMode === "validate_then_act" ||
      strategyMode === "validate_then_act"
    ) {
      return this.intent(
        "validate_then_act",
        "validate_then_next_step",
        "Both objective and subjective importance are high. Ari should validate, then offer one next step.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "dual_salience"
        }
      );
    }

    if (
      executiveDecision === "support_before_solution" ||
      primaryPriority === "emotional-support" ||
      strategyMode === "support_before_solution" ||
      observerCategory === "emotion"
    ) {
      return this.intent(
        "support_before_solution",
        "comfort_then_question",
        "Emotional pain is primary. Ari should offer connection before analysis.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What part of this feels heaviest right now?",
          sourceLayer: "executive_emotion"
        }
      );
    }

    if (
      executiveDecision === "stabilize_health_first" ||
      primaryPriority === "health-stabilization" ||
      strategyMode === "stabilize_health"
    ) {
      return this.intent(
        "stabilize_health",
        "calm_health_step",
        "Health stabilization is primary. Ari should be calm, practical, and not overcomplicate.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "executive_health"
        }
      );
    }

    if (
      executiveDecision === "create_priority_structure" ||
      primaryPriority === "planning" ||
      strategyMode === "create_priority_structure" ||
      observerCategory === "planning"
    ) {
      return this.intent(
        "create_priority_structure",
        "prioritize_then_plan",
        "The user needs structure. Ari should organize priorities and give next steps.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "executive_planning"
        }
      );
    }

    if (
      executiveDecision === "reduce_load_immediately" ||
      primaryPriority === "capacity-protection" ||
      strategyMode === "reduce_load"
    ) {
      return this.intent(
        "protect_capacity",
        "truth_then_boundary",
        "Capacity protection is active. Ari should be direct and protective.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "executive_capacity"
        }
      );
    }

    if (
      executiveDecision === "name_conflict_and_choose_lead" ||
      primaryPriority === "prioritize-conflict" ||
      observerCategory === "core_conflict"
    ) {
      return this.intent(
        "name_conflict",
        "conflict_then_choice",
        "A core conflict is active. Ari should name the tension and clarify what should lead.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "Which side of this conflict matters most long-term?",
          sourceLayer: "observer_conflict"
        }
      );
    }

    if (
      executiveDecision === "frame_as_life_chapter" ||
      primaryPriority === "life-chapter" ||
      observerCategory === "life_chapter"
    ) {
      return this.intent(
        "name_life_chapter",
        "meaning_wisdom_action",
        "A life chapter is active. Ari should frame the situation in the larger season of life.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What kind of person is this season asking you to become?",
          sourceLayer: "observer_life_chapter"
        }
      );
    }

    if (
      mode === "restore_dignity" ||
      need === "worth" ||
      (need === "esteem" && needScore >= 75)
    ) {
      return this.intent(
        "protect_dignity",
        "validate_then_ask",
        "Worth/respect need is active. Ari should validate dignity, avoid overexplaining, then ask what happened.",
        {
          shouldAskQuestion: true,
          recommendedQuestion: "What happened that made you feel this way?",
          sourceLayer: "human_needs"
        }
      );
    }

    if (
      mode === "emotional_connection" ||
      need === "connection" ||
      need === "belonging"
    ) {
      return this.intent(
        "offer_connection",
        "comfort_then_ask",
        "Connection need is active. Ari should offer warmth before analysis.",
        {
          shouldAskQuestion: true,
          recommendedQuestion: "What feels most lonely about this right now?",
          sourceLayer: "human_needs"
        }
      );
    }

    if (
      leadOrgan === "uncertainty" ||
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty"
    ) {
      return this.intent(
        "clarify_before_interpreting",
        "brief_reflect_then_question",
        "Ari lacks evidence and should ask one clean clarifying question.",
        {
          shouldAskQuestion: true,
          recommendedQuestion: observerQuestion || "What context am I missing?",
          sourceLayer: "uncertainty"
        }
      );
    }

    if (leadOrgan === "meaning") {
      return this.intent(
        "name_life_chapter",
        "meaning_wisdom_action",
        "A life chapter is active. Ari should name the chapter and protect what matters.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion || "What is this season really asking of you?",
          sourceLayer: "rebirth_meaning"
        }
      );
    }

    if (leadOrgan === "wisdom") {
      return this.intent(
        "resolve_tension",
        "principle_then_choice",
        "A wisdom tension is active. Ari should clarify what should lead.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What principle should lead this decision?",
          sourceLayer: "rebirth_wisdom"
        }
      );
    }

    if (leadOrgan === "identity") {
      return this.intent(
        "clarify_identity",
        "identity_then_question",
        "Identity is active. Ari should name the role and ask what it protects.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "Which role in you is trying to speak right now?",
          sourceLayer: "rebirth_identity"
        }
      );
    }

    if (leadOrgan === "stewardship") {
      return this.intent(
        "support_stewardship",
        "steady_then_next_step",
        "Stewardship is active. Ari should steady the user and focus on responsible next action.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "rebirth_stewardship"
        }
      );
    }

    if (leadOrgan === "emotion") {
      return this.intent(
        "name_emotion",
        "emotion_then_question",
        "Emotion is active. Ari should name the emotional signal and ask one useful question.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What emotion feels strongest underneath this?",
          sourceLayer: "rebirth_emotion"
        }
      );
    }

    if (leadOrgan === "values") {
      return this.intent(
        "integrate_values",
        "value_then_question",
        "A value integration signal is active. Ari should name the deeper value and ask what protects it.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What value are you trying to protect here?",
          sourceLayer: "rebirth_values"
        }
      );
    }

    return this.intent(
      "respond_normally",
      "balanced",
      "No special response intent detected.",
      {
        shouldAskQuestion: false,
        recommendedQuestion: null,
        sourceLayer: "default"
      }
    );
  },

  intent(responseIntent, responseShape, reason, extra = {}) {
    return {
      responseIntent,
      responseShape,
      responseIntentReason: reason,
      responseIntentSource: "ari-response-intent-engine",
      responseIntentVersion: this.version,
      shouldAskQuestion: extra.shouldAskQuestion ?? null,
      recommendedQuestion: extra.recommendedQuestion || null,
      responseIntentLayer: extra.sourceLayer || "unknown"
    };
  }
};