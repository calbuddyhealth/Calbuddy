// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Convert safety + observer + thread + entity + classifier signals into a universal situation model.
// V7.1.0 — Universal Situation Mapper
// Boundary:
// - DOES map situation, domains, needs, risks, competing contexts, lane candidates, and response constraints.
// - DOES read Safety Gate, Observer Evidence, Thread Understanding, Entity Resolver, and Conversation Classifier.
// - DOES NOT resolve pronouns, rewrite user meaning, compose final response, or override Contract/Triage.
// - Advisory mapper only.

window.Ari = window.Ari || {};

window.AriSituationMapEngine = {
  version: "7.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const safetyGate = summary.safetyContextGate || {
      override: summary.override || null,
      riskLevel: summary.riskLevel || "none",
      riskType: summary.riskType || "none",
      followUpNeeded: summary.followUpNeeded || false,
      followUpQuestion: summary.followUpQuestion || null
    };

    const thread =
      summary.threadUnderstanding ||
      summary.threadUnderstandingState ||
      {};

    const entity =
      summary.entityReference ||
      summary.entityReferenceState ||
      summary.subjectGraphState ||
      {};

    const conversation =
      summary.universalConversationClassification ||
      summary.conversationClassification ||
      summary.conversation ||
      {
        conversationType: summary.conversationType || null,
        conversationIntent: summary.conversationIntent || null,
        conversationCandidates: summary.conversationCandidates || []
      };

    const map = this.createEmptyMap({
      text,
      observations,
      safetyGate,
      thread,
      entity,
      conversation
    });

    this.collectUpstreamSignals(map);
    this.detectQuestions(map);
    this.detectDomains(map);
    this.detectSituations(map);
    this.detectRisks(map);
    this.detectNeeds(map);
    this.detectCompetingSituations(map);
    this.detectResponseRequirements(map);
    this.scoreMap(map);
    this.classifySituation(map);
    this.buildTriageCandidates(map);
    this.applyResponseConstraints(map);
    this.syncToLegacyLanes(map);

    return map;
  },

  createEmptyMap({ text, observations, safetyGate, thread, entity, conversation }) {
    return {
      situationMapRan: true,
      situationMapVersion: this.version,
      source: "ari-situation-map-engine",

      rawText: text,
      observationsUsed: observations,
      safetyGateUsed: safetyGate,
      threadUnderstandingUsed: thread,
      entityReferenceUsed: entity,
      conversationClassificationUsed: conversation,

      upstreamSignals: {
        domainSignals: [],
        intentSignals: [],
        issueSignals: [],
        subjectSignals: [],
        objectSignals: [],
        goalSignals: [],
        constraintSignals: [],
        attemptSignals: []
      },

      questions: [],
      situations: [],
      domains: [],
      needs: [],
      risks: [],
      responseRequirements: [],
      responseConstraints: [],

      eventState: safetyGate.riskLevel === "context" ? "context" : "unknown",
      riskLevel: safetyGate.riskLevel || "none",
      riskType: safetyGate.riskType || "none",
      override: safetyGate.override || null,

      gravity: 0,
      urgency: "none",
      complexity: "simple",
      horizon: "present_or_unspecified",

      situationType: null,
      situationFamily: null,
      primaryNeed: null,
      confidence: 0,

      primaryLane: null,
      primaryLaneSuggestion: null,
      supportLanes: [],
      blockedLanes: [],
      supportLaneSuggestions: [],
      briefLaneSuggestions: [],
      contextLaneSuggestions: [],
      deferredLaneSuggestions: [],

      shouldUseMultiLaneResponse: false,
      shouldAskClarifyingQuestion: false,
      recommendedQuestion: null,

      competingSituations: [],
      triageCandidates: [],

      reasons: [],

      boundary: {
        authority: "situation_mapping_only",
        cannotSet: [
          "finalResponse",
          "responseText",
          "medicalEscalation",
          "safetyOverride",
          "contractPrimary",
          "mouthPattern"
        ]
      }
    };
  },

  collectUpstreamSignals(map) {
    const thread = map.threadUnderstandingUsed || {};
    const working = thread.workingContext || {};

    const allSignals = [
      ...(thread.currentTurn?.signals || []),
      ...(working.domainSignals || []),
      ...(working.intentSignals || [])
    ];

    allSignals.forEach(signal => {
      if (!signal?.category) return;

      if (signal.category === "domain") this.addObj(map.upstreamSignals.domainSignals, signal);
      if (signal.category === "intent") this.addObj(map.upstreamSignals.intentSignals, signal);
      if (signal.category === "issue") this.addObj(map.upstreamSignals.issueSignals, signal);
      if (signal.category === "subject") this.addObj(map.upstreamSignals.subjectSignals, signal);
      if (signal.category === "object") this.addObj(map.upstreamSignals.objectSignals, signal);
      if (signal.category === "goal") this.addObj(map.upstreamSignals.goalSignals, signal);
      if (signal.category === "constraint") this.addObj(map.upstreamSignals.constraintSignals, signal);
      if (signal.category === "attempt") this.addObj(map.upstreamSignals.attemptSignals, signal);
    });
  },

  detectQuestions(map) {
    const observations = map.observationsUsed || [];
    const thread = map.threadUnderstandingUsed || {};
    const conversation = map.conversationClassificationUsed || {};

    if (
      this.hasType(observations, "question_phrase") ||
      this.hasType(observations, "question_mark_count")
    ) {
      this.add(map.questions, "explicit_question");
    }

    if (this.hasQuestionType(observations, "decision_question")) this.add(map.questions, "decision_question");
    if (this.hasQuestionType(observations, "instruction_question")) this.add(map.questions, "instruction_question");
    if (this.hasQuestionType(observations, "knowledge_question")) this.add(map.questions, "knowledge_question");
    if (this.hasQuestionType(observations, "opinion_request")) this.add(map.questions, "opinion_request");

    const impliedType =
      thread.impliedQuestion?.type ||
      thread.resolvedMeaning?.intent ||
      null;

    if (impliedType && impliedType !== "respond_normally") {
      this.add(map.questions, impliedType);
      map.reasons.push(`Thread supplied intent/question: ${impliedType}.`);
    }

    const conversationType = conversation.conversationType;
    if (conversationType) {
      this.add(map.questions, conversationType);
      map.reasons.push(`Conversation classifier supplied type: ${conversationType}.`);
    }

    if (!map.questions.length) {
      this.add(map.questions, "implicit_question_or_statement");
    }
  },

  detectDomains(map) {
    const observations = map.observationsUsed || [];
    const safetyGate = map.safetyGateUsed || {};
    const thread = map.threadUnderstandingUsed || {};
    const entity = map.entityReferenceUsed || {};
    const conversation = map.conversationClassificationUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.domains, "safety_domain");
    if (safetyGate.override === "medical_urgent") this.add(map.domains, "medical_body_domain");
    if (safetyGate.override === "clarify_risk") this.add(map.domains, "risk_clarification_domain");

    const observerDomainMap = {
      safety: "safety_domain",
      body: "medical_context_domain",
      relationship: "relationship_context_domain",
      family: "family_context_domain",
      emotion: "emotion_context_domain",
      career: "career_work_domain",
      financial: "financial_resource_domain",
      builder: "builder_domain",
      knowledge: "knowledge_domain",
      memory: "memory_preference_domain",
      wisdom: "wisdom_domain",
      identity: "identity_context_domain",
      politics: "civic_or_political_context_domain",
      religion: "religion_or_spiritual_context_domain"
    };

    observations.forEach(obs => {
      if (obs.domain && observerDomainMap[obs.domain]) {
        this.add(map.domains, observerDomainMap[obs.domain]);
      }
    });

    if (this.hasType(observations, "body_symptom")) this.add(map.domains, "medical_context_domain");
    if (this.hasType(observations, "work_reference")) this.add(map.domains, "career_work_domain");
    if (this.hasType(observations, "money_reference")) this.add(map.domains, "financial_resource_domain");
    if (this.hasType(observations, "building_reference")) this.add(map.domains, "builder_domain");
    if (this.hasType(observations, "emotion_word")) this.add(map.domains, "emotion_context_domain");
    if (this.hasType(observations, "family_reference")) this.add(map.domains, "family_context_domain");
    if (this.hasType(observations, "person_reference")) this.add(map.domains, "relationship_context_domain");

    if (safetyGate.riskLevel === "context") {
      this.add(map.domains, "medical_context_domain");
    }

    this.mapThreadDomain(thread.domain, map);
    this.mapThreadDomain(entity.resolvedSubjectDomain, map);
    this.mapConversationDomain(conversation.conversationType, map);
    this.mapUniversalDomainSignals(map);
  },

  mapUniversalDomainSignals(map) {
    const signals = map.upstreamSignals.domainSignals || [];

    const domainMap = {
      animal_health_or_pet_context: ["animal_health_context_domain", "medical_context_domain"],
      human_or_body_health_context: ["medical_context_domain"],
      builder_or_system_context: ["builder_domain"],
      work_or_accountability_context: ["career_work_domain", "accountability_context_domain"],
      relationship_or_family_context: ["relationship_context_domain", "family_context_domain"],
      financial_context: ["financial_resource_domain"]
    };

    signals.forEach(signal => {
      (domainMap[signal.value] || []).forEach(domain => this.add(map.domains, domain));
    });
  },

  mapThreadDomain(domain, map) {
    const mappings = {
      human_health_context: ["medical_context_domain"],
      animal_health_context: ["animal_health_context_domain", "medical_context_domain"],
      builder_context: ["builder_domain"],
      decision_context: ["decision_context_domain"],
      meaning_context: ["meaning_context_domain", "wisdom_domain"],
      relationship_context: ["relationship_context_domain"],
      family_context: ["family_context_domain"],
      object_or_vehicle_context: ["object_or_vehicle_domain"],
      action_guidance_context: ["action_guidance_domain"],
      risk_monitoring_context: ["risk_monitoring_domain"]
    };

    (mappings[domain] || []).forEach(d => this.add(map.domains, d));

    if (mappings[domain]) {
      map.reasons.push(`Resolved context supplied domain: ${domain}.`);
    }
  },

  mapConversationDomain(type, map) {
    const mappings = {
      builder_task: ["builder_domain"],
      writing_task: ["writing_domain"],
      calculation_task: ["calculation_domain"],
      medical_or_body_concern: ["medical_context_domain"],
      emotional_concern: ["emotion_context_domain"],
      safety_concern: ["safety_domain"],
      relationship_or_family_context: ["relationship_context_domain", "family_context_domain"],
      interpersonal_response_help: ["relationship_context_domain"],
      memory_request: ["memory_preference_domain"],
      creative_or_design_conversation: ["creative_design_domain"],
      ari_self_or_perspective_question: ["ari_self_context_domain"],
      civic_or_political_question: ["civic_or_political_context_domain"],
      religion_or_spiritual_question: ["religion_or_spiritual_context_domain"]
    };

    (mappings[type] || []).forEach(d => this.add(map.domains, d));
  },

  detectSituations(map) {
    const observations = map.observationsUsed || [];
    const safetyGate = map.safetyGateUsed || {};
    const thread = map.threadUnderstandingUsed || {};
    const entity = map.entityReferenceUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.situations, "active_safety_emergency");
    if (safetyGate.override === "medical_urgent") this.add(map.situations, "active_medical_urgency");
    if (safetyGate.override === "clarify_risk") this.add(map.situations, "ambiguous_risk_needs_clarification");
    if (safetyGate.riskLevel === "context") this.add(map.situations, "risk_or_medical_context_only");

    if (this.hasType(observations, "body_context")) this.add(map.situations, "body_or_medical_context");
    if (this.hasType(observations, "body_symptom")) this.add(map.situations, "body_symptom_mentioned");
    if (this.hasType(observations, "person_reference")) this.add(map.situations, "close_person_context");
    if (this.hasType(observations, "family_reference")) this.add(map.situations, "family_context");
    if (this.hasType(observations, "work_reference")) this.add(map.situations, "work_or_career_context");
    if (this.hasType(observations, "money_reference")) this.add(map.situations, "money_or_resource_context");
    if (this.hasType(observations, "building_reference")) this.add(map.situations, "building_or_debugging_context");
    if (this.hasType(observations, "knowledge_request_phrase")) this.add(map.situations, "teaching_or_explanation_request");
    if (this.hasType(observations, "emotion_word")) this.add(map.situations, "emotion_language_present");
    if (this.hasType(observations, "memory_request_phrase")) this.add(map.situations, "memory_or_preference_request");
    if (this.hasType(observations, "wisdom_reference")) this.add(map.situations, "wisdom_or_values_tension");
    if (this.hasType(observations, "contrast_or_tradeoff_connector")) this.add(map.situations, "tradeoff_or_competing_priorities");
    if (this.hasType(observations, "pressure_or_constraint")) this.add(map.situations, "constraint_or_obligation_pressure");
    if (this.hasType(observations, "future_time")) this.add(map.situations, "future_planning_context");
    if (this.hasType(observations, "past_time")) this.add(map.situations, "past_or_historical_context");

    const issueKind =
      thread.activeIssue?.kind ||
      thread.activeIssue?.type ||
      thread.resolvedMeaning?.resolvedIssue?.kind ||
      entity.resolvedIssueType ||
      null;

    this.mapIssueKindToSituation(issueKind, map);
    this.mapIntentToSituation(thread.resolvedMeaning?.intent || thread.impliedQuestion?.type, map);
    this.mapUpstreamIssueSignals(map);
    this.mapUpstreamIntentSignals(map);

    if (thread.workingContext || thread.resolvedMeaning?.isContextual) {
      this.add(map.situations, "follow_up_context_available");
    }
  },

  mapIssueKindToSituation(issueKind, map) {
    const issueMap = {
      health_or_body_issue: ["body_symptom_mentioned", "active_problem_context"],
      health_symptom: ["body_symptom_mentioned", "active_problem_context"],
      body_function_or_symptom: ["body_symptom_mentioned", "active_problem_context"],
      technical_or_system_issue: ["building_or_debugging_context", "active_problem_context"],
      build_or_system_issue: ["building_or_debugging_context", "active_problem_context"],
      implementation_step: ["building_or_debugging_context", "active_problem_context"],
      relationship_or_trust_issue: ["relationship_or_trust_context", "active_problem_context"],
      pressure_or_constraint_issue: ["constraint_or_obligation_pressure", "active_problem_context"],
      accountability_or_work_quality_issue: ["accountability_or_work_quality_context", "work_or_career_context", "active_problem_context"]
    };

    (issueMap[issueKind] || []).forEach(s => this.add(map.situations, s));
  },

  mapIntentToSituation(intent, map) {
    const intentMap = {
      monitoring_guidance: ["monitoring_guidance_request"],
      monitoring_or_risk_check: ["monitoring_guidance_request"],
      safe_alternative_guidance: ["alternative_strategy_request"],
      alternative_strategy: ["alternative_strategy_request"],
      implementation_help: ["placement_guidance_request", "building_or_debugging_context"],
      action_guidance: ["action_guidance_request"],
      explanation_or_possibility: ["explanation_or_possibility_request"],
      memory_or_preference: ["memory_or_preference_request"],
      writing_help: ["writing_or_rewrite_request"]
    };

    (intentMap[intent] || []).forEach(s => this.add(map.situations, s));
  },

  mapUpstreamIssueSignals(map) {
    const signals = map.upstreamSignals.issueSignals || [];
    signals.forEach(signal => this.mapIssueKindToSituation(signal.value, map));
  },

  mapUpstreamIntentSignals(map) {
    const signals = map.upstreamSignals.intentSignals || [];
    signals.forEach(signal => this.mapIntentToSituation(signal.value, map));
  },

  detectRisks(map) {
    const safetyGate = map.safetyGateUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.risks, "confirmed_safety_emergency");
    if (safetyGate.override === "medical_urgent") this.add(map.risks, "confirmed_medical_urgency");
    if (safetyGate.override === "clarify_risk") this.add(map.risks, "ambiguous_risk");
    if (safetyGate.riskLevel === "context") this.add(map.risks, "context_only_not_emergency");

    if (map.situations.includes("accountability_or_work_quality_context")) {
      this.add(map.risks, "accountability_or_quality_risk");
    }

    if (map.situations.includes("constraint_or_obligation_pressure")) {
      this.add(map.risks, "pressure_or_constraint_risk");
    }
  },

  detectNeeds(map) {
    const conversation = map.conversationClassificationUsed || {};
    const thread = map.threadUnderstandingUsed || {};

    if (
      map.risks.includes("confirmed_safety_emergency") ||
      map.risks.includes("confirmed_medical_urgency")
    ) {
      this.add(map.needs, "urgent_protection");
    }

    if (
      map.questions.includes("decision_question") ||
      map.situations.includes("tradeoff_or_competing_priorities") ||
      conversation.conversationType === "decision_question" ||
      map.situations.includes("accountability_or_work_quality_context")
    ) {
      this.add(map.needs, "decision_support");
    }

    if (
      map.questions.includes("instruction_question") ||
      map.domains.includes("builder_domain") ||
      map.situations.includes("placement_guidance_request")
    ) {
      this.add(map.needs, "action_or_build_help");
    }

    if (
      map.questions.includes("knowledge_question") ||
      map.domains.includes("knowledge_domain") ||
      conversation.conversationType === "knowledge_question" ||
      map.situations.includes("explanation_or_possibility_request")
    ) {
      this.add(map.needs, "understanding");
    }

    if (
      map.domains.includes("medical_context_domain") ||
      map.situations.includes("body_symptom_mentioned")
    ) {
      this.add(map.needs, "context_sensitive_support");
    }

    if (map.situations.includes("monitoring_guidance_request")) this.add(map.needs, "monitoring_guidance");
    if (map.situations.includes("alternative_strategy_request")) this.add(map.needs, "safe_alternative_strategy");
    if (map.domains.includes("emotion_context_domain")) this.add(map.needs, "emotional_attunement");
    if (map.domains.includes("family_context_domain") || map.domains.includes("relationship_context_domain")) this.add(map.needs, "relationship_or_family_awareness");
    if (map.domains.includes("memory_preference_domain")) this.add(map.needs, "memory_acknowledgment");
    if (map.domains.includes("wisdom_domain")) this.add(map.needs, "wisdom_support");
    if (map.domains.includes("ari_self_context_domain")) this.add(map.needs, "transparent_self_disclosure");
    if (map.domains.includes("writing_domain")) this.add(map.needs, "writing_or_rewrite");
    if (map.domains.includes("calculation_domain")) this.add(map.needs, "calculation");
    if (map.domains.includes("creative_design_domain")) this.add(map.needs, "creative_generation");
    if (map.domains.includes("civic_or_political_context_domain")) this.add(map.needs, "civic_political_care");
    if (map.domains.includes("religion_or_spiritual_context_domain")) this.add(map.needs, "spiritual_or_belief_care");
    if (map.domains.includes("accountability_context_domain")) this.add(map.needs, "accountability_support");

    if (thread.laneHint === "medical_context") this.add(map.needs, "context_sensitive_support");
    if (thread.laneHint === "builder") this.add(map.needs, "action_or_build_help");

    if (!map.needs.length) {
      this.add(map.needs, "general_understanding");
    }
  },

  detectCompetingSituations(map) {
    const addCompeting = (name, reason, weight = 50) => {
      if (!name) return;
      map.competingSituations.push({ name, reason, weight });
    };

    if (map.needs.includes("decision_support") && map.needs.includes("relationship_or_family_awareness")) {
      addCompeting("decision_vs_relationship_impact", "Decision support is present with relationship/family context.", 78);
    }

    if (map.needs.includes("decision_support") && map.needs.includes("accountability_support")) {
      addCompeting("accountability_vs_social_consequence", "Accountability/work-quality issue includes possible social or team consequences.", 84);
    }

    if (map.needs.includes("context_sensitive_support") && map.needs.includes("safe_alternative_strategy")) {
      addCompeting("body_context_vs_action_strategy", "Body context requires practical but cautious alternatives.", 82);
    }

    if (map.needs.includes("transparent_self_disclosure") && map.needs.includes("decision_support")) {
      addCompeting("ari_self_disclosure_vs_user_task", "Ari identity/perspective signal may conflict with the user's practical task.", 86);
    }

    map.competingSituations.sort((a, b) => b.weight - a.weight);
  },

  detectResponseRequirements(map) {
    const safetyGate = map.safetyGateUsed || {};
    const thread = map.threadUnderstandingUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.responseRequirements, "safety_response_required");
    if (safetyGate.override === "medical_urgent") this.add(map.responseRequirements, "medical_urgent_response_required");

    if (safetyGate.override === "clarify_risk") {
      this.add(map.responseRequirements, "ask_one_risk_clarification_question");
      map.shouldAskClarifyingQuestion = true;
      map.recommendedQuestion = safetyGate.followUpQuestion || "Are you safe right now?";
    }

    if (map.needs.includes("decision_support")) this.add(map.responseRequirements, "decision_framework");
    if (map.needs.includes("action_or_build_help")) this.add(map.responseRequirements, "step_by_step_action");
    if (map.needs.includes("understanding")) this.add(map.responseRequirements, "clear_explanation");
    if (map.needs.includes("emotional_attunement")) this.add(map.responseRequirements, "brief_emotional_attunement");
    if (map.needs.includes("context_sensitive_support")) this.add(map.responseRequirements, "do_not_escalate_context_only_terms");
    if (map.needs.includes("monitoring_guidance")) this.add(map.responseRequirements, "name_what_to_watch_for");
    if (map.needs.includes("safe_alternative_strategy")) this.add(map.responseRequirements, "give_safe_alternatives");
    if (map.needs.includes("transparent_self_disclosure")) this.add(map.responseRequirements, "answer_ari_identity_transparently");
    if (map.needs.includes("writing_or_rewrite")) this.add(map.responseRequirements, "produce_requested_text");
    if (map.needs.includes("calculation")) this.add(map.responseRequirements, "calculate_directly");
    if (map.needs.includes("creative_generation")) this.add(map.responseRequirements, "generate_options");
    if (map.needs.includes("civic_political_care")) this.add(map.responseRequirements, "neutral_civic_framing");
    if (map.needs.includes("spiritual_or_belief_care")) this.add(map.responseRequirements, "belief_sensitive_framing");
    if (map.needs.includes("accountability_support")) this.add(map.responseRequirements, "separate_person_from_system_pressure");

    if (thread.resolvedMeaning?.isContextual || thread.workingContext) {
      this.add(map.responseRequirements, "reuse_prior_context_without_reasking");
    }
  },

  scoreMap(map) {
    if (map.risks.includes("confirmed_safety_emergency")) {
      map.gravity = 10;
      map.urgency = "critical";
      return;
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      map.gravity = 9;
      map.urgency = "high";
      return;
    }

    if (map.risks.includes("ambiguous_risk")) {
      map.gravity = 7;
      map.urgency = "clarify";
      return;
    }

    let gravity = 0;

    if (map.needs.includes("decision_support")) gravity += 3;
    if (map.needs.includes("context_sensitive_support")) gravity += 3;
    if (map.needs.includes("monitoring_guidance")) gravity += 2;
    if (map.needs.includes("safe_alternative_strategy")) gravity += 2;
    if (map.needs.includes("accountability_support")) gravity += 2;
    if (map.situations.includes("constraint_or_obligation_pressure")) gravity += 2;
    if (map.domains.includes("family_context_domain")) gravity += 2;
    if (map.domains.includes("financial_resource_domain")) gravity += 2;
    if (map.domains.includes("career_work_domain")) gravity += 1;
    if (map.domains.includes("emotion_context_domain")) gravity += 1;

    map.gravity = Math.min(10, gravity);

    if (gravity >= 7) map.urgency = "moderate";
    else if (gravity >= 3) map.urgency = "low";
    else map.urgency = "none";

    const total =
      map.questions.length +
      map.situations.length +
      map.domains.length +
      map.needs.length +
      map.competingSituations.length;

    map.complexity =
      total >= 12 || map.domains.length >= 4
        ? "multi_domain"
        : total >= 6 || map.domains.length >= 2
          ? "moderate"
          : "simple";

    map.shouldUseMultiLaneResponse =
      map.complexity === "multi_domain" ||
      map.needs.includes("decision_support") ||
      map.competingSituations.length > 0;

    if (map.situations.includes("future_planning_context")) map.horizon = "future";
    else if (map.situations.includes("past_or_historical_context")) map.horizon = "past";
    else map.horizon = "present_or_unspecified";
  },

  classifySituation(map) {
    const rules = [
      {
        when: () => map.risks.includes("confirmed_safety_emergency"),
        config: {
          type: "active_safety_emergency",
          family: "safety",
          need: "immediate_protection",
          confidence: 100,
          primaryLane: "safety",
          blocked: ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.risks.includes("confirmed_medical_urgency"),
        config: {
          type: "active_medical_urgency",
          family: "body",
          need: "medical_protection",
          confidence: 98,
          primaryLane: "medical_body",
          blocked: ["builder", "wisdom", "life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.risks.includes("ambiguous_risk"),
        config: {
          type: "ambiguous_risk_needs_clarification",
          family: "safety",
          need: "risk_clarification",
          confidence: 95,
          primaryLane: "risk_clarification",
          blocked: ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("transparent_self_disclosure") && !map.needs.includes("decision_support"),
        config: {
          type: "ari_self_or_perspective_context",
          family: "ari_self",
          need: "transparent_self_disclosure",
          confidence: 90,
          primaryLane: "ari_self",
          support: ["teacher"],
          blocked: ["life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.domains.includes("medical_context_domain") || map.needs.includes("context_sensitive_support"),
        config: {
          type: "medical_or_body_context",
          family: "body",
          need: "body_context_support",
          confidence: 88,
          primaryLane: "medical_context",
          support: map.needs.includes("safe_alternative_strategy") ? ["executive_decision"] : [],
          blocked: ["life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("action_or_build_help") && !map.needs.includes("decision_support"),
        config: {
          type: "build_or_fix_request",
          family: "builder",
          need: "action",
          confidence: 94,
          primaryLane: "builder",
          support: ["teacher"],
          blocked: ["uncertainty", "life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("writing_or_rewrite"),
        config: {
          type: "writing_or_rewrite_request",
          family: "writing",
          need: "produce_text",
          confidence: 90,
          primaryLane: "writer",
          blocked: ["life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("calculation"),
        config: {
          type: "calculation_request",
          family: "calculation",
          need: "calculate",
          confidence: 88,
          primaryLane: "calculator",
          blocked: ["life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("decision_support"),
        config: {
          type: "decision_request_with_context",
          family: "executive",
          need: "decision_support",
          confidence: 92,
          primaryLane: "executive_decision",
          support: this.supportFromDomains(map),
          blocked: ["life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("understanding"),
        config: {
          type: "direct_teaching_request",
          family: "knowledge",
          need: "understanding",
          confidence: 92,
          primaryLane: "teacher",
          blocked: ["uncertainty", "life_chapter", "deep_emotion"]
        }
      },
      {
        when: () => map.needs.includes("memory_acknowledgment"),
        config: {
          type: "memory_or_preference_request",
          family: "memory",
          need: "memory_acknowledgment",
          confidence: 90,
          primaryLane: "memory",
          blocked: ["deep_emotion", "life_chapter"]
        }
      },
      {
        when: () => map.needs.includes("emotional_attunement"),
        config: {
          type: "emotional_processing",
          family: "emotion",
          need: "emotional_attunement",
          confidence: 80,
          primaryLane: "emotion",
          support: ["general_understanding"]
        }
      }
    ];

    const match = rules.find(rule => rule.when());
    if (match) return this.setSituation(map, match.config);

    return this.setSituation(map, {
      type: "general_understanding",
      family: "general",
      need: "understanding",
      confidence: 60,
      primaryLane: "general_understanding"
    });
  },

  supportFromDomains(map) {
    const support = [];

    if (map.domains.includes("medical_context_domain")) support.push("medical_context");
    if (map.domains.includes("animal_health_context_domain")) support.push("animal_health");
    if (map.domains.includes("relationship_context_domain")) support.push("relationship");
    if (map.domains.includes("family_context_domain")) support.push("family");
    if (map.domains.includes("career_work_domain")) support.push("career");
    if (map.domains.includes("accountability_context_domain")) support.push("accountability");
    if (map.domains.includes("financial_resource_domain")) support.push("financial");
    if (map.domains.includes("emotion_context_domain")) support.push("emotion");
    if (map.domains.includes("knowledge_domain")) support.push("teacher");
    if (map.domains.includes("builder_domain")) support.push("builder");
    if (map.domains.includes("wisdom_domain")) support.push("wisdom");
    if (map.domains.includes("ari_self_context_domain")) support.push("ari_self");

    return [...new Set(support)];
  },

  buildTriageCandidates(map) {
    const addCandidate = (lane, score, reason) => {
      if (!lane) return;

      const existing = map.triageCandidates.find(item => item.lane === lane);

      if (existing) {
        existing.score = Math.min(100, existing.score + score);
        existing.reasons.push(reason);
        return;
      }

      map.triageCandidates.push({
        lane,
        score: Math.min(100, score),
        reasons: [reason]
      });
    };

    addCandidate(
      map.primaryLane,
      map.confidence,
      `Situation Map selected ${map.situationType}.`
    );

    map.supportLanes.forEach(lane => {
      addCandidate(lane, 35, "Support lane from Situation Map.");
    });

    map.triageCandidates.sort((a, b) => b.score - a.score);
  },

  applyResponseConstraints(map) {
    map.blockedLanes.forEach(lane => {
      this.add(map.responseConstraints, `block_${lane}`);
    });

    map.responseRequirements.forEach(req => {
      this.add(map.responseConstraints, req);
    });

    const laneConstraints = {
      teacher: ["answer_directly", "do_not_ask_uncertainty_question"],
      builder: ["give_steps_or_code", "do_not_reflect_emotion_first"],
      executive_decision: ["organize_options", "name_tradeoff", "recommend_next_step"],
      medical_context: ["medical_context_first", "give_practical_next_steps", "name_red_flags_if_relevant", "avoid_false_reassurance"],
      medical_body: ["medical_first"],
      safety: ["safety_first"],
      ari_self: ["answer_transparently", "do_not_fake_human_experience"],
      writer: ["produce_requested_text"],
      calculator: ["calculate_directly"]
    };

    (laneConstraints[map.primaryLane] || []).forEach(c => this.add(map.responseConstraints, c));
  },

  syncToLegacyLanes(map) {
    map.primaryLaneSuggestion = map.primaryLane || map.primaryLaneSuggestion;

    map.supportLanes.forEach(lane => {
      if (lane !== map.primaryLaneSuggestion) {
        this.add(map.supportLaneSuggestions, lane);
      }
    });

    map.blockedLanes.forEach(lane => {
      this.add(map.deferredLaneSuggestions, lane);
    });
  },

  blendConfidence(base = 60, map = {}) {
    let score = Number(base || 60);

    const threadConfidence = map.threadUnderstandingUsed?.confidence ?? null;
    const entityConfidence =
      map.entityReferenceUsed?.confidence ??
      map.entityReferenceUsed?.resolvedReferenceConfidence ??
      null;

    if (threadConfidence) {
      score = Math.round((score * 0.65) + (threadConfidence * 0.35));
    }

    if (entityConfidence) {
      score = Math.round((score * 0.8) + (entityConfidence * 0.2));
    }

    return Math.max(40, Math.min(98, score));
  },

  setSituation(map, config = {}) {
    map.situationType = config.type || "general_understanding";
    map.situationFamily = config.family || "general";
    map.primaryNeed = config.need || "understanding";
    map.confidence = this.blendConfidence(config.confidence || 60, map);
    map.primaryLane = config.primaryLane || "general_understanding";

    (config.support || []).forEach(lane => this.add(map.supportLanes, lane));
    (config.blocked || []).forEach(lane => this.add(map.blockedLanes, lane));

    map.reasons.push(`Situation Map V${this.version} classified this as ${map.situationType}.`);
  },

  hasType(observations = [], type) {
    return observations.some(o => o.type === type);
  },

  hasQuestionType(observations = [], questionType) {
    return observations.some(
      o => o.type === "question_phrase" && o.questionType === questionType
    );
  },

  add(list, item) {
    if (item && Array.isArray(list) && !list.includes(item)) {
      list.push(item);
    }
  },

  addObj(list, item) {
    if (!Array.isArray(list) || !item) return;

    const key = JSON.stringify({
      category: item.category,
      type: item.type,
      value: item.value,
      evidence: item.evidence
    });

    const exists = list.some(existing => {
      const existingKey = JSON.stringify({
        category: existing.category,
        type: existing.type,
        value: existing.value,
        evidence: existing.evidence
      });

      return existingKey === key;
    });

    if (!exists) list.push(item);
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI SITUATION MAP ENGINE LOADED:",
  window.AriSituationMapEngine?.version
);