// ari/governance/ari-triage-engine.js
// Ari Triage Engine
// Purpose: Arbitrate priority before Situation Contract.
// V2.0.0 — Universal Arbitration Engine

window.Ari = window.Ari || {};

window.AriTriageEngine = {
  version: "2.0.0",

  run(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const safety = summary.safetyContextGate || {};

    const triage = {
      triageEngineRan: true,
      triageEngineVersion: this.version,
      source: "ari-triage-engine",

      primaryLane: null,
      supportLanes: [],
      briefLanes: [],
      contextLanes: [],
      deferredLanes: [],
      blockedLanes: [],

      urgency: map.urgency || "none",
      gravity: map.gravity || 0,
      confidence: 50,

      responseShape: null,
      responseConstraints: [],

      candidates: [],
      reasons: []
    };

    this.collectSafetyCandidate(safety, triage);
    this.collectSituationCandidates(map, triage);
    this.collectUniversalCandidates(map, triage);
    this.arbitrate(triage);
    this.applyLaneConsequences(map, safety, triage);
    this.finalize(triage);

    return {
      ariTriage: triage,
      triageEngineRan: true,
      triagePrimaryLane: triage.primaryLane,
      triageSupportLanes: triage.supportLanes,
      triageBriefLanes: triage.briefLanes,
      triageContextLanes: triage.contextLanes,
      triageDeferredLanes: triage.deferredLanes,
      triageBlockedLanes: triage.blockedLanes,
      triageResponseShape: triage.responseShape,
      triageResponseConstraints: triage.responseConstraints,
      triageUrgency: triage.urgency,
      triageGravity: triage.gravity,
      triageConfidence: triage.confidence,
      triageCandidates: triage.candidates,
      triageReasons: triage.reasons
    };
  },

  collectSafetyCandidate(safety = {}, triage = {}) {
    if (safety.override === "safety_emergency") {
      this.addCandidate(triage, "safety", 100, "Safety emergency overrides all other lanes.");
      triage.urgency = "critical";
      triage.gravity = 10;
      return;
    }

    if (safety.override === "medical_urgent") {
      this.addCandidate(triage, "medical_body", 96, "Medical urgency overrides non-medical lanes.");
      triage.urgency = "high";
      triage.gravity = 9;
      return;
    }

    if (safety.override === "clarify_risk") {
      this.addCandidate(triage, "risk_clarification", 94, "Risk is ambiguous, so one clarification question leads.");
      triage.urgency = "clarify";
      triage.gravity = Math.max(triage.gravity || 0, 7);
    }
  },

  collectSituationCandidates(map = {}, triage = {}) {
    const candidates = map.triageCandidates || [];

    candidates.forEach(candidate => {
      this.addCandidate(
        triage,
        candidate.lane,
        candidate.score || 50,
        candidate.reasons?.[0] || "Candidate from Situation Map."
      );
    });

    const primary = map.primaryLane || map.primaryLaneSuggestion || null;

    if (primary) {
      this.addCandidate(
        triage,
        primary,
        map.confidence || 70,
        "Situation Map selected primary lane."
      );
    }

    this.addMany(triage.supportLanes, map.supportLanes || map.supportLaneSuggestions || []);
    this.addMany(triage.briefLanes, map.briefLanes || map.briefLaneSuggestions || []);
    this.addMany(triage.contextLanes, map.contextLanes || map.contextLaneSuggestions || []);
    this.addMany(triage.deferredLanes, map.deferredLanes || map.deferredLaneSuggestions || []);
    this.addMany(triage.blockedLanes, map.blockedLanes || []);
    this.addMany(triage.responseConstraints, map.responseConstraints || []);
  },

  collectUniversalCandidates(map = {}, triage = {}) {
    const needs = map.needs || [];
    const domains = map.domains || [];
    const situations = map.situations || [];
    const questions = map.questions || [];

    if (needs.includes("urgent_protection")) {
      this.addCandidate(triage, "medical_body", 92, "Urgent protection need detected.");
    }

    if (needs.includes("risk_clarification")) {
      this.addCandidate(triage, "risk_clarification", 90, "Risk clarification need detected.");
    }

    if (
      needs.includes("action_or_build_help") ||
      domains.includes("builder_domain")
    ) {
      this.addCandidate(triage, "builder", 86, "Build/debug/action request detected.");
    }

    if (
      needs.includes("understanding") ||
      domains.includes("knowledge_domain") ||
      questions.includes("knowledge_question")
    ) {
      this.addCandidate(triage, "teacher", 82, "Knowledge or explanation request detected.");
    }

    if (
      needs.includes("decision_support") ||
      questions.includes("decision_question") ||
      situations.includes("tradeoff_or_competing_priorities")
    ) {
      this.addCandidate(triage, "executive_decision", 88, "Decision or tradeoff request detected.");
    }

    if (domains.includes("memory_preference_domain")) {
      this.addCandidate(triage, "memory", 90, "Memory or preference request detected.");
    }

    if (
      domains.includes("medical_context_domain") ||
      domains.includes("body_signal_domain")
    ) {
      this.addCandidate(triage, "medical_context", 76, "Medical/body context should stay visible without hijacking.");
    }

    if (
      domains.includes("family_context_domain") ||
      domains.includes("relationship_context_domain")
    ) {
      this.addCandidate(triage, "relationship", 70, "Relationship or family context detected.");
    }

    if (domains.includes("emotion_context_domain")) {
      this.addCandidate(triage, "emotion", 64, "Emotion context detected.");
    }

    if (
      domains.includes("wisdom_domain") ||
      situations.includes("wisdom_or_values_tension") ||
      needs.includes("wisdom_support") ||
      needs.includes("principle_clarity")
    ) {
      this.addCandidate(triage, "wisdom", 62, "Wisdom or principle tension detected.");
    }
  },

  arbitrate(triage = {}) {
    if (!triage.candidates.length) {
      this.addCandidate(triage, "general_understanding", 50, "No strong candidate found.");
    }

    triage.candidates.forEach(candidate => {
      candidate.priority = this.priorityOf(candidate.lane);
      candidate.finalScore = candidate.score + candidate.priority;
    });

    triage.candidates.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      return this.priorityOf(b.lane) - this.priorityOf(a.lane);
    });

    const winner = triage.candidates[0];

    triage.primaryLane = winner.lane;
    triage.confidence = Math.min(100, Math.max(50, winner.score));
    triage.reasons.push(winner.reasons?.[0] || `Triage selected ${winner.lane}.`);
  },

  applyLaneConsequences(map = {}, safety = {}, triage = {}) {
    const primary = triage.primaryLane;

    if (primary === "safety") {
      this.addMany(triage.blockedLanes, ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["safety_first", "direct_next_step", "no_philosophy"]);
      triage.responseShape = "urgent_safety";
      return;
    }

    if (primary === "medical_body") {
      this.addMany(triage.deferredLanes, ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["medical_first", "state_urgent_thresholds", "calm_direct"]);
      triage.responseShape = "medical_boundary_then_action";
      return;
    }

    if (primary === "risk_clarification") {
      this.addMany(triage.blockedLanes, ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["ask_one_risk_question", "do_not_assume_safety"]);
      triage.responseShape = "clarify_risk_only";
      return;
    }

    if (primary === "builder") {
      this.addMany(triage.deferredLanes, ["emotion", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["give_steps_or_code", "do_not_over_reflect", "do_not_ask_wisdom_question"]);
      triage.responseShape = "build_steps";
    }

    if (primary === "teacher") {
      this.addMany(triage.deferredLanes, ["uncertainty", "life_chapter", "deep_emotion", "wisdom"]);
      this.addMany(triage.responseConstraints, ["answer_directly", "do_not_ask_uncertainty_question", "do_not_ask_wisdom_question"]);
      triage.responseShape = "clear_explanation";
    }

    if (primary === "executive_decision") {
      this.add(triage.briefLanes, "emotion");
      this.addMany(triage.responseConstraints, ["organize_options", "name_tradeoff", "recommend_next_step"]);
      triage.responseShape = "decision_first_layered";
    }

    if (primary === "memory") {
      this.addMany(triage.responseConstraints, ["acknowledge_memory", "do_not_reflect_first"]);
      triage.responseShape = "memory_acknowledgment";
    }

    if (primary === "emotion") {
      triage.responseShape = "emotion_then_ground";
    }

    if (primary === "wisdom") {
      this.addMany(triage.responseConstraints, ["principle_then_choice", "avoid_generic_uncertainty_question"]);
      triage.responseShape = "principle_then_choice";
    }

    if (primary === "medical_context") {
      this.addMany(triage.responseConstraints, ["medical_context_without_escalation"]);
      triage.responseShape = "medical_context_then_next_step";
    }

    if (
      map.domains?.includes("medical_context_domain") &&
      !["medical_body", "risk_clarification", "safety", "medical_context"].includes(primary)
    ) {
      this.add(triage.contextLanes, "medical_context");
      this.add(triage.responseConstraints, "medical_context_without_escalation");
    }
  },

  finalize(triage = {}) {
    if (!triage.primaryLane) {
      triage.primaryLane = "general_understanding";
      triage.confidence = 50;
      triage.reasons.push("No stronger triage lane emerged.");
    }

    if (!triage.responseShape) {
      triage.responseShape = this.shapeFromPrimary(triage.primaryLane);
    }

    triage.supportLanes = this.cleanLaneList(triage.supportLanes, triage.primaryLane);
    triage.briefLanes = this.cleanLaneList(triage.briefLanes, triage.primaryLane);
    triage.contextLanes = this.cleanLaneList(triage.contextLanes, triage.primaryLane);
    triage.deferredLanes = this.cleanLaneList(triage.deferredLanes, triage.primaryLane);
    triage.blockedLanes = this.cleanLaneList(triage.blockedLanes, triage.primaryLane);
    triage.responseConstraints = [...new Set(triage.responseConstraints)];
  },

  priorityOf(lane) {
    const priority = {
      safety: 100,
      medical_body: 95,
      risk_clarification: 90,
      medical_context: 55,

      memory: 50,
      builder: 48,
      executive_decision: 46,
      teacher: 42,

      relationship: 36,
      family: 36,
      emotion: 30,
      wisdom: 28,

      life_chapter: 20,
      deep_emotion: 18,
      general_understanding: 10
    };

    return priority[lane] || 0;
  },

  shapeFromPrimary(primary) {
    const map = {
      safety: "urgent_safety",
      medical_body: "medical_boundary_then_action",
      medical_context: "medical_context_then_next_step",
      risk_clarification: "clarify_risk_only",
      teacher: "clear_explanation",
      builder: "build_steps",
      executive_decision: "decision_first_layered",
      emotion: "emotion_then_ground",
      memory: "memory_acknowledgment",
      family: "family_truth_then_next_step",
      relationship: "relationship_truth_then_repair",
      wisdom: "principle_then_choice",
      general_understanding: "standard"
    };

    return map[primary] || "standard";
  },

  addCandidate(triage = {}, lane, score = 50, reason = "") {
    if (!lane) return;

    const existing = triage.candidates.find(item => item.lane === lane);

    if (existing) {
      existing.score = Math.max(existing.score, score);
      if (reason && !existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
      }
      return;
    }

    triage.candidates.push({
      lane,
      score,
      reasons: reason ? [reason] : []
    });
  },

  add(list, item) {
    if (item && Array.isArray(list) && !list.includes(item)) {
      list.push(item);
    }
  },

  addMany(list, items = []) {
    if (!Array.isArray(items)) return;
    items.forEach(item => this.add(list, item));
  },

  cleanLaneList(list = [], primary = null) {
    return [...new Set(list)].filter(lane => lane && lane !== primary);
  }
};