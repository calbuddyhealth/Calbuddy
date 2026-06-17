// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Convert resolved context + observer evidence into a universal situation model.
// V6.2.0
// Boundary:
// - Reads resolved meaning from Thread Understanding / Entity Resolver.
// - Does not resolve pronouns, infer hidden meaning, rewrite questions, or compose responses.
// - Outputs situation, domain, needs, lane candidates, and response constraints only.

window.AriSituationMapEngine = {
  version: "6.2.0",

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

    const thread = summary.threadUnderstanding || {};
    const entity = summary.entityReference || {};

    const map = {
      situationMapRan: true,
      situationMapVersion: this.version,
      source: "ari-situation-map-engine",

      rawText: text,
      observationsUsed: observations,
      safetyGateUsed: safetyGate,
      threadUnderstandingUsed: thread,
      entityReferenceUsed: entity,

      questions: [],
      situations: [],
      domains: [],
      needs: [],
      risks: [],
      responseRequirements: [],

      eventState: safetyGate.riskLevel === "context" ? "context" : "unknown",
      riskLevel: safetyGate.riskLevel || "none",
      riskType: safetyGate.riskType || "none",
      override: safetyGate.override || null,

      gravity: 0,
      urgency: "none",
      complexity: "simple",
      horizon: "unknown",

      primaryLaneSuggestion: null,
      supportLaneSuggestions: [],
      briefLaneSuggestions: [],
      contextLaneSuggestions: [],
      deferredLaneSuggestions: [],

      shouldUseMultiLaneResponse: false,
      shouldAskClarifyingQuestion: false,
      recommendedQuestion: null,

      situationType: null,
      situationFamily: null,
      primaryNeed: null,
      confidence: 0,
      primaryLane: null,
      supportLanes: [],
      blockedLanes: [],
      competingSituations: [],
      triageCandidates: [],
      responseConstraints: [],

      reasons: []
    };

    this.detectQuestions(observations, thread, map);
    this.detectDomains(observations, safetyGate, thread, entity, map);
    this.detectSituations(observations, safetyGate, thread, entity, map);
    this.detectRisks(safetyGate, map);
    this.detectNeeds(map, thread);
    this.detectResponseRequirements(safetyGate, thread, map);
    this.scoreMap(map);
    this.classifySituation(map);
    this.buildTriageCandidates(map);
    this.applyResponseConstraints(map);
    this.syncV2ToLegacyLanes(map);

    return map;
  },

  detectQuestions(observations = [], thread = {}, map = {}) {
    if (
      this.hasType(observations, "question_phrase") ||
      this.hasType(observations, "question_mark_count")
    ) {
      this.add(map.questions, "explicit_question");
    }

    if (this.hasQuestionType(observations, "decision_question")) {
      this.add(map.questions, "decision_question");
    }

    if (this.hasQuestionType(observations, "instruction_question")) {
      this.add(map.questions, "instruction_question");
    }

    if (
      this.hasQuestionType(observations, "knowledge_question") ||
      this.hasType(observations, "knowledge_request_phrase")
    ) {
      this.add(map.questions, "knowledge_question");
    }

    if (this.hasQuestionType(observations, "opinion_request")) {
      this.add(map.questions, "opinion_request");
    }

    if (thread.impliedQuestion?.type) {
      this.add(map.questions, thread.impliedQuestion.type);
      map.reasons.push(
        `Thread Understanding supplied implied question: ${thread.impliedQuestion.type}.`
      );
    }

    if (!map.questions.length) {
      this.add(map.questions, "implicit_question_or_statement");
    }
  },

  detectDomains(observations = [], safetyGate = {}, thread = {}, entity = {}, map = {}) {
    if (safetyGate.override === "safety_emergency") this.add(map.domains, "safety_domain");
    if (safetyGate.override === "medical_urgent") this.add(map.domains, "medical_body_domain");
    if (safetyGate.override === "clarify_risk") this.add(map.domains, "risk_clarification_domain");

    const domainMap = {
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
      wisdom: "wisdom_domain"
    };

    observations.forEach(obs => {
      if (obs.domain && domainMap[obs.domain]) {
        this.add(map.domains, domainMap[obs.domain]);
      }
    });

    if (this.hasType(observations, "body_symptom")) {
      this.add(map.domains, "medical_context_domain");
    }

    if (safetyGate.riskLevel === "context") {
      this.add(map.domains, "medical_context_domain");
    }

    if (thread.domain === "human_health_context") {
      this.add(map.domains, "medical_context_domain");
      map.reasons.push("Thread Understanding mapped the active context to human health.");
    }

    if (thread.domain === "animal_health_context") {
      this.add(map.domains, "animal_health_context_domain");
      this.add(map.domains, "medical_context_domain");
      map.reasons.push("Thread Understanding mapped the active context to animal health.");
    }

    if (thread.domain === "builder_context") {
      this.add(map.domains, "builder_domain");
      map.reasons.push("Thread Understanding mapped the active context to building/debugging.");
    }

    if (thread.domain === "decision_context") {
      this.add(map.domains, "decision_context_domain");
      map.reasons.push("Thread Understanding mapped the active context to decision support.");
    }

    if (thread.domain === "meaning_context") {
      this.add(map.domains, "meaning_context_domain");
      this.add(map.domains, "wisdom_domain");
      map.reasons.push("Thread Understanding mapped the active context to meaning/values.");
    }

    if (entity.resolvedSubjectDomain === "human_health_context") {
      this.add(map.domains, "medical_context_domain");
      map.reasons.push("Entity Resolver linked the active subject to human health.");
    }

    if (entity.resolvedSubjectDomain === "animal_health_context") {
      this.add(map.domains, "animal_health_context_domain");
      this.add(map.domains, "medical_context_domain");
      map.reasons.push("Entity Resolver linked the active subject to animal health.");
    }

    if (entity.resolvedSubjectDomain === "builder_context") {
      this.add(map.domains, "builder_domain");
      map.reasons.push("Entity Resolver linked the active subject to builder context.");
    }
  },

  detectSituations(observations = [], safetyGate = {}, thread = {}, entity = {}, map = {}) {
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

    if (this.hasType(observations, "contrast_or_tradeoff_connector")) {
      this.add(map.situations, "tradeoff_or_competing_priorities");
    }

    if (this.hasType(observations, "pressure_or_constraint")) {
      this.add(map.situations, "constraint_or_obligation_pressure");
    }

    if (this.hasType(observations, "future_time")) this.add(map.situations, "future_planning_context");
    if (this.hasType(observations, "past_time")) this.add(map.situations, "past_or_historical_context");

    const issueType =
      thread.activeIssue?.type ||
      entity.resolvedIssueType ||
      null;

    if (issueType === "health_symptom") {
      this.add(map.situations, "body_symptom_mentioned");
      this.add(map.situations, "active_problem_context");
    }

    if (issueType === "code_placement" || issueType === "implementation_step") {
      this.add(map.situations, "building_or_debugging_context");
      this.add(map.situations, "active_problem_context");
    }

    if (thread.impliedQuestion?.type === "monitoring_guidance") {
      this.add(map.situations, "monitoring_guidance_request");
    }

    if (thread.impliedQuestion?.type === "alternative_strategy") {
      this.add(map.situations, "alternative_strategy_request");
    }

    if (thread.impliedQuestion?.type === "placement_guidance") {
      this.add(map.situations, "placement_guidance_request");
    }

    if (thread.continuityUsed) {
      this.add(map.situations, "follow_up_context_available");
    }
  },

  detectRisks(safetyGate = {}, map = {}) {
    if (safetyGate.override === "safety_emergency") this.add(map.risks, "confirmed_safety_emergency");
    if (safetyGate.override === "medical_urgent") this.add(map.risks, "confirmed_medical_urgency");
    if (safetyGate.override === "clarify_risk") this.add(map.risks, "ambiguous_risk");
    if (safetyGate.riskLevel === "context") this.add(map.risks, "context_only_not_emergency");
  },

  detectNeeds(map = {}, thread = {}) {
    if (
      map.risks.includes("confirmed_safety_emergency") ||
      map.risks.includes("confirmed_medical_urgency")
    ) {
      this.add(map.needs, "urgent_protection");
    }

    if (
      map.questions.includes("decision_question") ||
      map.situations.includes("tradeoff_or_competing_priorities")
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
      map.domains.includes("knowledge_domain")
    ) {
      this.add(map.needs, "understanding");
    }

    if (
      map.domains.includes("medical_context_domain") ||
      map.situations.includes("body_symptom_mentioned")
    ) {
      this.add(map.needs, "context_sensitive_support");
    }

    if (map.situations.includes("monitoring_guidance_request")) {
      this.add(map.needs, "monitoring_guidance");
    }

    if (map.situations.includes("alternative_strategy_request")) {
      this.add(map.needs, "safe_alternative_strategy");
    }

    if (map.domains.includes("emotion_context_domain")) {
      this.add(map.needs, "emotional_attunement");
    }

    if (
      map.domains.includes("family_context_domain") ||
      map.domains.includes("relationship_context_domain")
    ) {
      this.add(map.needs, "relationship_or_family_awareness");
    }

    if (map.domains.includes("memory_preference_domain")) {
      this.add(map.needs, "memory_acknowledgment");
    }

    if (map.domains.includes("wisdom_domain")) {
      this.add(map.needs, "wisdom_support");
    }

    if (thread.laneHint === "medical_context") {
      this.add(map.needs, "context_sensitive_support");
    }

    if (thread.laneHint === "builder") {
      this.add(map.needs, "action_or_build_help");
    }
  },

  detectResponseRequirements(safetyGate = {}, thread = {}, map = {}) {
    if (safetyGate.override === "safety_emergency") {
      this.add(map.responseRequirements, "safety_response_required");
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.responseRequirements, "medical_urgent_response_required");
    }

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

    if (thread.continuityUsed) {
      this.add(map.responseRequirements, "reuse_prior_context_without_reasking");
    }
  },

  scoreMap(map = {}) {
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
      map.needs.length;

    map.complexity =
      total >= 10 || map.domains.length >= 4
        ? "multi_domain"
        : total >= 5 || map.domains.length >= 2
          ? "moderate"
          : "simple";

    map.shouldUseMultiLaneResponse =
      map.complexity === "multi_domain" ||
      map.needs.includes("decision_support");

    if (map.situations.includes("future_planning_context")) map.horizon = "future";
    else if (map.situations.includes("past_or_historical_context")) map.horizon = "past";
    else map.horizon = "present_or_unspecified";
  },

  classifySituation(map = {}) {
    if (map.risks.includes("confirmed_safety_emergency")) {
      return this.setSituation(map, {
        type: "active_safety_emergency",
        family: "safety",
        need: "immediate_protection",
        confidence: 100,
        primaryLane: "safety",
        blocked: ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]
      });
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      return this.setSituation(map, {
        type: "active_medical_urgency",
        family: "body",
        need: "medical_protection",
        confidence: 98,
        primaryLane: "medical_body",
        blocked: ["builder", "wisdom", "life_chapter", "deep_emotion"]
      });
    }

    if (map.risks.includes("ambiguous_risk")) {
      return this.setSituation(map, {
        type: "ambiguous_risk_needs_clarification",
        family: "safety",
        need: "risk_clarification",
        confidence: 95,
        primaryLane: "risk_clarification",
        blocked: ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]
      });
    }

    if (
      map.domains.includes("medical_context_domain") ||
      map.needs.includes("context_sensitive_support")
    ) {
      return this.setSituation(map, {
        type: "medical_or_body_context",
        family: "body",
        need: "body_context_support",
        confidence: 88,
        primaryLane: "medical_context",
        support: map.needs.includes("safe_alternative_strategy")
          ? ["executive_decision"]
          : [],
        blocked: ["life_chapter", "deep_emotion"]
      });
    }

    if (
      map.needs.includes("action_or_build_help") &&
      !map.needs.includes("decision_support")
    ) {
      return this.setSituation(map, {
        type: "build_or_fix_request",
        family: "builder",
        need: "action",
        confidence: 94,
        primaryLane: "builder",
        support: ["teacher"],
        blocked: ["uncertainty", "life_chapter", "deep_emotion"]
      });
    }

    if (
      map.needs.includes("understanding") &&
      !map.needs.includes("decision_support")
    ) {
      return this.setSituation(map, {
        type: "direct_teaching_request",
        family: "knowledge",
        need: "understanding",
        confidence: 92,
        primaryLane: "teacher",
        blocked: ["uncertainty", "life_chapter", "deep_emotion"]
      });
    }

    if (map.needs.includes("decision_support")) {
      return this.setSituation(map, {
        type: "decision_request_with_context",
        family: "executive",
        need: "decision_support",
        confidence: 92,
        primaryLane: "executive_decision",
        support: this.supportFromDomains(map),
        blocked: ["life_chapter", "deep_emotion"]
      });
    }

    if (map.domains.includes("memory_preference_domain")) {
      return this.setSituation(map, {
        type: "memory_or_preference_request",
        family: "memory",
        need: "memory_acknowledgment",
        confidence: 90,
        primaryLane: "memory",
        blocked: ["deep_emotion", "life_chapter"]
      });
    }

    if (map.domains.includes("emotion_context_domain")) {
      return this.setSituation(map, {
        type: "emotional_processing",
        family: "emotion",
        need: "emotional_attunement",
        confidence: 80,
        primaryLane: "emotion",
        support: ["general_understanding"]
      });
    }

    this.setSituation(map, {
      type: "general_understanding",
      family: "general",
      need: "understanding",
      confidence: 60,
      primaryLane: "general_understanding"
    });
  },

  supportFromDomains(map = {}) {
    const support = [];

    if (map.domains.includes("medical_context_domain")) support.push("medical_context");
    if (map.domains.includes("relationship_context_domain")) support.push("relationship");
    if (map.domains.includes("family_context_domain")) support.push("family");
    if (map.domains.includes("career_work_domain")) support.push("career");
    if (map.domains.includes("financial_resource_domain")) support.push("financial");
    if (map.domains.includes("emotion_context_domain")) support.push("emotion");
    if (map.domains.includes("knowledge_domain")) support.push("teacher");
    if (map.domains.includes("builder_domain")) support.push("builder");
    if (map.domains.includes("wisdom_domain")) support.push("wisdom");

    return support;
  },

  buildTriageCandidates(map = {}) {
    const addCandidate = (lane, score, reason) => {
      if (!lane) return;

      const existing = map.triageCandidates.find(item => item.lane === lane);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        return;
      }

      map.triageCandidates.push({
        lane,
        score,
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

  applyResponseConstraints(map = {}) {
    map.blockedLanes.forEach(lane => {
      this.add(map.responseConstraints, `block_${lane}`);
    });

    map.responseRequirements.forEach(req => {
      this.add(map.responseConstraints, req);
    });

    if (map.primaryLane === "teacher") {
      this.add(map.responseConstraints, "answer_directly");
      this.add(map.responseConstraints, "do_not_ask_uncertainty_question");
    }

    if (map.primaryLane === "builder") {
      this.add(map.responseConstraints, "give_steps_or_code");
      this.add(map.responseConstraints, "do_not_reflect_emotion_first");
    }

    if (map.primaryLane === "executive_decision") {
      this.add(map.responseConstraints, "organize_options");
      this.add(map.responseConstraints, "name_tradeoff");
      this.add(map.responseConstraints, "recommend_next_step");
    }

    if (map.primaryLane === "medical_context") {
      this.add(map.responseConstraints, "medical_context_first");
      this.add(map.responseConstraints, "give_practical_next_steps");
      this.add(map.responseConstraints, "name_red_flags_if_relevant");
      this.add(map.responseConstraints, "avoid_false_reassurance");
    }

    if (map.primaryLane === "safety") this.add(map.responseConstraints, "safety_first");
    if (map.primaryLane === "medical_body") this.add(map.responseConstraints, "medical_first");
  },

  syncV2ToLegacyLanes(map = {}) {
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

  blendConfidence(base = 60, sources = {}) {
    let score = Number(base || 60);

    if (sources.threadConfidence) {
      score = Math.round(
        (score * 0.65) + (sources.threadConfidence * 0.35)
      );
    }

    if (sources.entityConfidence) {
      score = Math.round(
        (score * 0.80) + (sources.entityConfidence * 0.20)
      );
    }

    return Math.max(40, Math.min(98, score));
  },

  setSituation(map = {}, config = {}) {
    const threadConfidence =
      map.threadUnderstandingUsed?.confidence ?? null;

    const entityConfidence =
      map.entityReferenceUsed?.confidence ??
      map.entityReferenceUsed?.resolvedReferenceConfidence ??
      null;

    const blendedConfidence = this.blendConfidence(
      config.confidence || 60,
      {
        threadConfidence,
        entityConfidence
      }
    );

    map.situationType = config.type || "general_understanding";
    map.situationFamily = config.family || "general";
    map.primaryNeed = config.need || "understanding";
    map.confidence = blendedConfidence;
    map.primaryLane = config.primaryLane || "general_understanding";

    (config.support || []).forEach(lane => {
      this.add(map.supportLanes, lane);
    });

    (config.blocked || []).forEach(lane => {
      this.add(map.blockedLanes, lane);
    });

    map.reasons.push(
      `Situation Map V${this.version} classified this as ${map.situationType}.`
    );
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