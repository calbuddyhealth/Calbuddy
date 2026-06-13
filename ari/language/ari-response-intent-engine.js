// ari/language/ari-response-intent-engine.js
// Ari Response Intent Engine
// Purpose: Decide what conversational move Ari should make before composing words.
// V2.0
// Upgrades:
// - Uses Universal Domain Governor as the first routing authority.
// - Prevents teaching/build requests from falling into uncertainty.
// - Keeps safety and body stabilization above all.
// - Separates WHAT conversation this is from HOW Ari should respond.
// - Makes response intent work across teaching, building, medical/body, relationship, family, identity, career, planning, conflict, wisdom, emotion, values, and uncertainty.
window.AriResponseIntentEngine = {
  version: "2.0.0",
  evaluate(input = {}) {
    return this.decide(input);
  },
  decide(input = {}) {
    const summary = input.summary || input || {};
    const domainLead = summary.domainLead || summary.domainGovernor?.domainLead || null;
    const domainMode = summary.domainMode || summary.domainGovernor?.domainMode || null;
    const domainQuestion = summary.domainQuestion || summary.domainGovernor?.domainQuestion || null;
    const domainPermissions =
      summary.domainPermissions ||
      summary.domainGovernor?.domainPermissions ||
      {};
    const shouldPreferTeaching =
      summary.shouldPreferTeaching === true ||
      summary.domainGovernor?.shouldPreferTeaching === true ||
      domainLead === "knowledge_teaching_domain";
    const shouldPreferSafety =
      summary.shouldPreferSafety === true ||
      summary.domainGovernor?.shouldPreferSafety === true ||
      domainLead === "critical_safety_domain";
    const shouldPreferBodyStabilization =
      summary.shouldPreferBodyStabilization === true ||
      summary.domainGovernor?.shouldPreferBodyStabilization === true ||
      domainLead === "medical_body_domain" ||
      domainLead === "sleep_recovery_domain";
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
      "vital_stability",
      "waste_elimination",
      "temperature_regulation",
      "movement_mobility",
      "threat_regulation"
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
    const connectionNeedActive =
      organismIsRelationalFunction ||
      need === "connection" ||
      need === "belonging" ||
      summary.needResponseMode === "restore_connection";
    const dignityNeedActive =
      mode === "restore_dignity" ||
      need === "worth" ||
      need === "esteem" ||
      summary.needResponseMode === "restore_dignity" ||
      (
        needScore >= 75 &&
        ["worth", "esteem", "respect", "competence"].includes(need)
      );
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
      observerCategory === "life_chapter" ||
      summary.salienceRecommendedLead === "life_chapter" ||
      leadOrgan === "meaning";
    const executiveClear =
      executiveDecision === "protect_safety_first" ||
      executiveDecision === "protect_relationship_first" ||
      executiveDecision === "protect_responsibility_first" ||
      executiveDecision === "protect_capacity_first" ||
      primaryPriority === "safety" ||
      primaryPriority === "relationship" ||
      primaryPriority === "responsibility" ||
      primaryPriority === "capacity";
    // 1. Critical safety always wins.
    if (
      shouldPreferSafety ||
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
          sourceLayer: "domain_safety"
        }
      );
    }
    // 2. Medical/body domain wins unless safety is higher.
    if (
      shouldPreferBodyStabilization ||
      bodyNeedActive
    ) {
      return this.intent(
        "stabilize_organism_function",
        "body_truth_then_action",
        "A body, medical, or organism-stability domain is active. Ari should stabilize before interpretation.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            summary.organismRecommendedQuestion ||
            summary.organismRecommendedAction ||
            domainQuestion ||
            observerQuestion ||
            "What does your body need first right now?",
          sourceLayer: "domain_body"
        }
      );
    }
    // 3. Direct teaching request. This must beat uncertainty.
    if (shouldPreferTeaching) {
      return this.intent(
        "teach_clearly",
        "clear_explanation",
        "The Universal Domain Governor identified this as a teaching request. Ari should answer directly instead of asking an emotional or uncertainty question.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "domain_teaching"
        }
      );
    }
    // 4. Build/debug/code request.
    if (domainLead === "creative_building_domain") {
      return this.intent(
        "build_or_debug",
        "direct_build_steps",
        "The Universal Domain Governor identified this as a build/debug request. Ari should give concrete code or implementation steps.",
        {
          shouldAskQuestion: false,
          recommendedQuestion: null,
          sourceLayer: "domain_building"
        }
      );
    }
    // 5. Relationship / connection.
    if (
      domainLead === "relationship_connection_domain" ||
      connectionNeedActive
    ) {
      return this.intent(
        "offer_connection",
        "comfort_then_truth",
        "Connection, loneliness, abandonment, or attachment pain is active. Ari should restore connection before analysis.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion ||
            domainQuestion ||
            "What feels most disconnected right now?",
          sourceLayer: "domain_connection"
        }
      );
    }
    // 6. Parenthood / family / caregiving.
    if (
      domainLead === "family_parenthood_domain" ||
      executiveDecision === "protect_relationship_first" ||
      executiveDecision === "protect_responsibility_first" ||
      primaryPriority === "relationship" ||
      primaryPriority === "responsibility" ||
      primaryPriority === "caregiving" ||
      observerPrimary === "relationship_transition" ||
      observerPrimary === "caregiving_transition"
    ) {
      return this.intent(
        "protect_relationship_responsibility",
        "meaning_truth_then_action",
        "A family, responsibility, caregiving, or parenthood domain is leading. Ari should protect what is entrusted before treating every goal equally.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion ||
            domainQuestion ||
            "What needs protection first in this situation?",
          sourceLayer: "domain_family_responsibility"
        }
      );
    }
    // 7. Identity.
    if (
      domainLead === "identity_transition_domain" ||
      leadOrgan === "identity"
    ) {
      return this.intent(
        "clarify_identity",
        "identity_then_question",
        "Identity is active. Ari should name the active role or self-state and ask what it protects.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion ||
            domainQuestion ||
            "Which part of you is trying to lead right now?",
          sourceLayer: "domain_identity"
        }
      );
    }
    // 8. Career transition.
    if (domainLead === "career_transition_domain") {
      return this.intent(
        "support_transition_planning",
        "transition_truth_then_plan",
        "A career or role transition is active. Ari should protect stability, identity, and next steps.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion ||
            domainQuestion ||
            "What future stability are you trying to protect?",
          sourceLayer: "domain_career_transition"
        }
      );
    }
    // 9. Planning / decision.
    if (
      domainLead === "decision_planning_domain" ||
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
          sourceLayer: "domain_planning"
        }
      );
    }
    // 10. Dignity / worth repair.
    if (dignityNeedActive) {
      return this.intent(
        "protect_dignity",
        "validate_then_truth",
        "Worth, respect, shame, or self-value is active. Ari should protect dignity before giving advice.",
        {
          shouldAskQuestion: false,
          recommendedQuestion:
            observerQuestion ||
            "What happened that made you feel this way?",
          sourceLayer: "human_dignity"
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
      executiveDecision === "reduce_load_immediately" ||
      primaryPriority === "capacity-protection" ||
      primaryPriority === "capacity" ||
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
      observerCategory === "life_chapter" ||
      leadOrgan === "meaning"
    ) {
      return this.intent(
        "name_life_chapter",
        "meaning_wisdom_action",
        "A life chapter is active. Ari should frame the situation in the larger season of life.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion ||
            "What kind of person is this season asking you to become?",
          sourceLayer: "observer_life_chapter"
        }
      );
    }
    // Clarify only after stronger domains had a chance to win.
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
        "Ari needs one focused question before advising.",
        {
          shouldAskQuestion: true,
          recommendedQuestion:
            observerQuestion || "What feels most important about this?",
          sourceLayer: "observer_hierarchy"
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
          recommendedQuestion:
            observerQuestion ||
            summary.synthesisRecommendedQuestion ||
            summary.salienceQuestion ||
            "What context am I missing?",
          sourceLayer: "uncertainty"
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