// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Organize observed evidence into a real Situation Model V2.
// V5.0.0
// Reads: Observer Evidence + Safety Context Gate

window.AriSituationMapEngine = {
  version: "5.0.0",

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

    const safetyGate =
      summary.safetyContextGate ||
      {
        override: summary.override || null,
        riskLevel: summary.riskLevel || "none",
        riskType: summary.riskType || "none",
        followUpNeeded: summary.followUpNeeded || false,
        followUpQuestion: summary.followUpQuestion || null
      };

    const map = {
      situationMapRan: true,
      situationMapVersion: this.version,
      source: "ari-situation-map-engine",

      rawText: text,
      observationsUsed: observations,
      safetyGateUsed: safetyGate,

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

      // Situation Model V2
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

    this.detectQuestions(text, observations, map);
    this.detectSituations(observations, safetyGate, map);
    this.detectDomains(observations, safetyGate, map);
    this.detectNeeds(observations, safetyGate, map);
    this.detectRisks(safetyGate, map);
    this.detectResponseRequirements(safetyGate, map);
    this.scoreMap(map);
    this.assignLanes(map);
    this.classifySituation(map);
    this.buildTriageCandidates(map);
    this.applyResponseConstraints(map);
    this.syncV2ToLegacyLanes(map);

    return map;
  },

  detectQuestions(text, observations, map) {
    if (
      this.hasType(observations, "question_phrase") ||
      this.hasType(observations, "question_mark_count")
    ) {
      this.add(map.questions, "explicit_question");
    }

    if (
      this.hasValue(observations, "should i") ||
      this.hasValue(observations, "what should")
    ) {
      this.add(map.questions, "decision_question");
    }

    if (
      this.hasValue(observations, "how do") ||
      this.hasValue(observations, "how can")
    ) {
      this.add(map.questions, "instruction_question");
    }

    if (this.hasType(observations, "knowledge_request_phrase")) {
      this.add(map.questions, "knowledge_question");
    }

    if (!map.questions.length && text.length > 0) {
      this.add(map.questions, "implicit_question_or_statement");
    }
  },

  detectSituations(observations, safetyGate, map) {
    if (safetyGate.override === "safety_emergency") {
      this.add(map.situations, "active_safety_emergency");
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.situations, "active_medical_urgency");
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.situations, "ambiguous_risk_needs_clarification");
    }

    if (safetyGate.riskLevel === "context") {
      this.add(map.situations, "risk_or_medical_context_only");
    }

    if (this.hasType(observations, "body_context")) {
      this.add(map.situations, "body_or_medical_context");
    }

    if (this.hasType(observations, "body_symptom")) {
      this.add(map.situations, "body_symptom_mentioned");
    }

    if (this.hasType(observations, "person_reference")) {
      this.add(map.situations, "close_person_context");
    }

    if (this.hasType(observations, "family_reference")) {
      this.add(map.situations, "family_context");
    }

    if (this.hasType(observations, "work_reference")) {
      this.add(map.situations, "work_or_career_context");
    }

    if (this.hasType(observations, "money_reference")) {
      this.add(map.situations, "money_or_resource_context");
    }

    if (this.hasType(observations, "building_reference")) {
      this.add(map.situations, "building_or_debugging_context");
    }

    if (this.hasType(observations, "knowledge_request_phrase")) {
      this.add(map.situations, "teaching_or_explanation_request");
    }

    if (this.hasType(observations, "emotion_word")) {
      this.add(map.situations, "emotion_language_present");
    }

    if (this.hasType(observations, "memory_request_phrase")) {
      this.add(map.situations, "memory_or_preference_request");
    }

    if (this.hasType(observations, "contrast_or_tradeoff_connector")) {
      this.add(map.situations, "tradeoff_or_competing_priorities");
    }

    if (this.hasType(observations, "future_time")) {
      this.add(map.situations, "future_planning_context");
    }

    if (this.hasType(observations, "past_time")) {
      this.add(map.situations, "past_or_historical_context");
    }
  },

  detectDomains(observations, safetyGate, map) {
    if (safetyGate.override === "safety_emergency") {
      this.add(map.domains, "safety_domain");
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.domains, "medical_body_domain");
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.domains, "risk_clarification_domain");
    }

    if (
      safetyGate.riskLevel === "context" ||
      this.hasType(observations, "body_context")
    ) {
      this.add(map.domains, "medical_context_domain");
    }

    if (this.hasType(observations, "body_symptom")) {
      this.add(map.domains, "body_signal_domain");
    }

    if (this.hasType(observations, "person_reference")) {
      this.add(map.domains, "relationship_context_domain");
    }

    if (this.hasType(observations, "family_reference")) {
      this.add(map.domains, "family_context_domain");
    }

    if (this.hasType(observations, "work_reference")) {
      this.add(map.domains, "career_work_domain");
    }

    if (this.hasType(observations, "money_reference")) {
      this.add(map.domains, "financial_resource_domain");
    }

    if (this.hasType(observations, "building_reference")) {
      this.add(map.domains, "builder_domain");
    }

    if (this.hasType(observations, "knowledge_request_phrase")) {
      this.add(map.domains, "knowledge_domain");
    }

    if (this.hasType(observations, "emotion_word")) {
      this.add(map.domains, "emotion_context_domain");
    }

    if (this.hasType(observations, "memory_request_phrase")) {
      this.add(map.domains, "memory_preference_domain");
    }
  },

  detectNeeds(observations, safetyGate, map) {
    if (
      safetyGate.override === "safety_emergency" ||
      safetyGate.override === "medical_urgent"
    ) {
      this.add(map.needs, "urgent_protection");
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.needs, "risk_clarification");
    }

    if (map.situations.includes("tradeoff_or_competing_priorities")) {
      this.add(map.needs, "decision_support");
    }

    if (map.domains.includes("builder_domain")) {
      this.add(map.needs, "action_or_build_help");
    }

    if (map.domains.includes("knowledge_domain")) {
      this.add(map.needs, "understanding");
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

    if (map.domains.includes("medical_context_domain")) {
      this.add(map.needs, "context_sensitive_support");
    }
  },

  detectRisks(safetyGate, map) {
    if (safetyGate.override === "safety_emergency") {
      this.add(map.risks, "confirmed_safety_emergency");
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.risks, "confirmed_medical_urgency");
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.risks, "ambiguous_risk");
    }

    if (safetyGate.riskLevel === "context") {
      this.add(map.risks, "context_only_not_emergency");
    }
  },

  detectResponseRequirements(safetyGate, map) {
    if (safetyGate.override === "safety_emergency") {
      this.add(map.responseRequirements, "safety_response_required");
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.responseRequirements, "medical_urgent_response_required");
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.responseRequirements, "ask_one_risk_clarification_question");
      map.shouldAskClarifyingQuestion = true;
      map.recommendedQuestion =
        safetyGate.followUpQuestion || "Are you safe right now?";
    }

    if (map.needs.includes("decision_support")) {
      this.add(map.responseRequirements, "decision_framework");
    }

    if (map.needs.includes("action_or_build_help")) {
      this.add(map.responseRequirements, "step_by_step_action");
    }

    if (map.needs.includes("understanding")) {
      this.add(map.responseRequirements, "clear_explanation");
    }

    if (map.needs.includes("emotional_attunement")) {
      this.add(map.responseRequirements, "brief_emotional_attunement");
    }

    if (map.needs.includes("context_sensitive_support")) {
      this.add(map.responseRequirements, "do_not_escalate_context_only_terms");
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

    if (map.situations.includes("tradeoff_or_competing_priorities")) gravity += 3;
    if (map.situations.includes("family_context")) gravity += 2;
    if (map.situations.includes("money_or_resource_context")) gravity += 2;
    if (map.situations.includes("work_or_career_context")) gravity += 1;
    if (map.situations.includes("emotion_language_present")) gravity += 1;

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
      map.situations.includes("tradeoff_or_competing_priorities");

    if (map.situations.includes("future_planning_context")) {
      map.horizon = "future";
    } else if (map.situations.includes("past_or_historical_context")) {
      map.horizon = "past";
    } else {
      map.horizon = "present_or_unspecified";
    }
  },

  assignLanes(map) {
    if (map.risks.includes("confirmed_safety_emergency")) {
      map.primaryLaneSuggestion = "safety";
      return;
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      map.primaryLaneSuggestion = "medical_body";
      return;
    }

    if (map.risks.includes("ambiguous_risk")) {
      map.primaryLaneSuggestion = "risk_clarification";
      return;
    }

    if (map.needs.includes("decision_support")) {
      map.primaryLaneSuggestion = "executive_decision";
    } else if (map.needs.includes("action_or_build_help")) {
      map.primaryLaneSuggestion = "builder";
    } else if (map.needs.includes("understanding")) {
      map.primaryLaneSuggestion = "teacher";
    } else if (map.needs.includes("emotional_attunement")) {
      map.primaryLaneSuggestion = "emotion";
    } else {
      map.primaryLaneSuggestion = "general_understanding";
    }

    const supportRules = [
      ["family_context_domain", "family"],
      ["relationship_context_domain", "relationship"],
      ["financial_resource_domain", "financial"],
      ["career_work_domain", "career"],
      ["builder_domain", "builder"],
      ["knowledge_domain", "teacher"],
      ["emotion_context_domain", "emotion"],
      ["medical_context_domain", "medical_context"],
      ["memory_preference_domain", "memory"]
    ];

    supportRules.forEach(([domain, lane]) => {
      if (map.domains.includes(domain) && lane !== map.primaryLaneSuggestion) {
        this.add(map.supportLaneSuggestions, lane);
      }
    });

    if (map.risks.includes("context_only_not_emergency")) {
      this.add(map.contextLaneSuggestions, "medical_context");
      map.supportLaneSuggestions =
        map.supportLaneSuggestions.filter(lane => lane !== "medical_context");
    }
  },

  classifySituation(map) {
    if (map.risks.includes("confirmed_safety_emergency")) {
      this.setSituation(map, {
        type: "active_safety_emergency",
        family: "safety",
        need: "immediate_protection",
        confidence: 100,
        primaryLane: "safety",
        blocked: ["teacher", "builder", "wisdom", "life_chapter"]
      });
      return;
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      this.setSituation(map, {
        type: "active_medical_urgency",
        family: "body",
        need: "medical_protection",
        confidence: 98,
        primaryLane: "medical_body",
        blocked: ["builder", "wisdom", "life_chapter"]
      });
      return;
    }

    if (map.risks.includes("ambiguous_risk")) {
      this.setSituation(map, {
        type: "ambiguous_risk_needs_clarification",
        family: "safety",
        need: "risk_clarification",
        confidence: 95,
        primaryLane: "risk_clarification",
        blocked: ["teacher", "builder", "wisdom", "life_chapter", "emotion"]
      });
      return;
    }

        if (map.domains.includes("builder_domain")) {
      this.setSituation(map, {
        type: "build_or_fix_request",
        family: "builder",
        need: "action",
        confidence: 94,
        primaryLane: "builder",
        support: ["teacher"],
        blocked: ["uncertainty", "life_chapter", "deep_emotion"]
      });
      return;
    }

    if (map.domains.includes("knowledge_domain")) {
      this.setSituation(map, {
        type: "direct_teaching_request",
        family: "knowledge",
        need: "understanding",
        confidence: 92,
        primaryLane: "teacher",
        blocked: ["uncertainty", "life_chapter", "deep_emotion"]
      });
      return;
    }

    if (map.situations.includes("tradeoff_or_competing_priorities")) {
      this.setSituation(map, {
        type: "decision_or_tradeoff",
        family: "executive",
        need: "decision_support",
        confidence: 90,
        primaryLane: "executive_decision",
        support: ["financial", "family", "emotion", "medical_context"],
        blocked: ["life_chapter", "deep_emotion"]
      });
      return;
    }

    if (
      map.domains.includes("medical_context_domain") ||
      map.domains.includes("body_signal_domain")
    ) {
      this.setSituation(map, {
        type: "medical_or_body_context",
        family: "body",
        need: "body_context_support",
        confidence: 88,
        primaryLane: "medical_context",
        blocked: ["life_chapter", "deep_emotion"]
      });
      return;
    }

    if (
      map.domains.includes("family_context_domain") ||
      map.domains.includes("relationship_context_domain")
    ) {
      this.setSituation(map, {
        type: "relationship_or_family_context",
        family: "relationship",
        need: "relational_awareness",
        confidence: 82,
        primaryLane: map.domains.includes("family_context_domain")
          ? "family"
          : "relationship",
        support: ["emotion"]
      });
      return;
    }

    if (map.domains.includes("emotion_context_domain")) {
      this.setSituation(map, {
        type: "emotional_processing",
        family: "emotion",
        need: "emotional_attunement",
        confidence: 80,
        primaryLane: "emotion",
        support: ["general_understanding"]
      });
      return;
    }

    if (map.domains.includes("memory_preference_domain")) {
      this.setSituation(map, {
        type: "memory_or_preference_request",
        family: "memory",
        need: "memory_acknowledgment",
        confidence: 90,
        primaryLane: "memory",
        blocked: ["deep_emotion", "life_chapter"]
      });
      return;
    }

    this.setSituation(map, {
      type: "general_understanding",
      family: "general",
      need: "understanding",
      confidence: 60,
      primaryLane: "general_understanding"
    });
  },

  buildTriageCandidates(map) {
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
      `Situation Model V2 selected ${map.situationType}.`
    );

    map.supportLanes.forEach(lane => {
      addCandidate(lane, 35, "Support lane from Situation Model V2.");
    });

    map.supportLaneSuggestions.forEach(lane => {
      addCandidate(lane, 20, "Support lane from legacy Situation Map.");
    });

    map.triageCandidates.sort((a, b) => b.score - a.score);
  },

  applyResponseConstraints(map) {
    map.blockedLanes.forEach(lane => {
      this.add(map.responseConstraints, `block_${lane}`);
    });

    if (map.primaryLane === "teacher") {
      this.add(map.responseConstraints, "answer_directly");
      this.add(map.responseConstraints, "do_not_ask_uncertainty_question");
    }

    if (map.primaryLane === "builder") {
      this.add(map.responseConstraints, "give_steps_or_code");
      this.add(map.responseConstraints, "do_not_reflect_emotion_first");
    }

    if (map.primaryLane === "safety") {
      this.add(map.responseConstraints, "safety_first");
    }

    if (map.primaryLane === "medical_body") {
      this.add(map.responseConstraints, "medical_first");
    }
  },

  syncV2ToLegacyLanes(map) {
    if (map.primaryLane) {
      map.primaryLaneSuggestion = map.primaryLane;
    }

    map.supportLanes.forEach(lane => {
      if (lane !== map.primaryLaneSuggestion) {
        this.add(map.supportLaneSuggestions, lane);
      }
    });

    map.blockedLanes.forEach(lane => {
      this.add(map.deferredLaneSuggestions, lane);
    });
  },

  setSituation(map, config = {}) {
    map.situationType = config.type || "general_understanding";
    map.situationFamily = config.family || "general";
    map.primaryNeed = config.need || "understanding";
    map.confidence = Number(config.confidence || 60);
    map.primaryLane = config.primaryLane || "general_understanding";

    (config.support || []).forEach(lane => this.add(map.supportLanes, lane));
    (config.blocked || []).forEach(lane => this.add(map.blockedLanes, lane));

    map.reasons.push(
      `Situation Model V2 classified this as ${map.situationType}.`
    );
  },

  hasType(observations = [], type) {
    return observations.some(o => o.type === type);
  },

  hasValue(observations = [], value) {
    return observations.some(o => o.value === value);
  },

  add(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};