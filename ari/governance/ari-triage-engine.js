// ari/governance/ari-triage-engine.js
// Ari Triage Engine
// Purpose: Decide what gets priority before Situation Contract.
// V1.1.0

window.Ari = window.Ari || {};

window.AriTriageEngine = {
  version: "1.1.0",

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

    this.applySafety(safety, map, triage);
    this.applySituationMap(map, triage);
    this.applyPriorityRules(map, triage);
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

  applySafety(safety = {}, map = {}, triage = {}) {
    if (safety.override === "safety_emergency") {
      this.choose(triage, "safety", 100, "Safety emergency overrides all other lanes.");
      this.addMany(triage.blockedLanes, ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["safety_first", "direct_next_step", "no_philosophy"]);
      triage.responseShape = "urgent_safety";
      triage.urgency = "critical";
      triage.gravity = 10;
      triage.confidence = 100;
      return;
    }

    if (safety.override === "medical_urgent") {
      this.choose(triage, "medical_body", 96, "Medical urgency overrides non-medical lanes.");
      this.addMany(triage.deferredLanes, ["teacher", "builder", "wisdom", "life_chapter"]);
      this.addMany(triage.responseConstraints, ["medical_first", "state_urgent_thresholds", "calm_direct"]);
      triage.responseShape = "medical_boundary_then_action";
      triage.urgency = "high";
      triage.gravity = 9;
      triage.confidence = 96;
      return;
    }

    if (safety.override === "clarify_risk") {
      this.choose(triage, "risk_clarification", 94, "Risk is ambiguous, so one clarification question leads.");
      this.addMany(triage.blockedLanes, ["teacher", "builder", "wisdom", "life_chapter", "deep_emotion"]);
      this.addMany(triage.responseConstraints, ["ask_one_risk_question", "do_not_assume_safety"]);
      triage.responseShape = "clarify_risk_only";
      triage.urgency = "clarify";
      triage.gravity = 7;
      triage.confidence = 94;
    }
  },

  applySituationMap(map = {}, triage = {}) {
    const primary = map.primaryLane || map.primaryLaneSuggestion || null;

    if (primary) {
      this.choose(triage, primary, map.confidence || 70, "Situation Map suggested the primary lane.");
    }

    this.addMany(triage.supportLanes, map.supportLanes || map.supportLaneSuggestions || []);
    this.addMany(triage.briefLanes, map.briefLanes || map.briefLaneSuggestions || []);
    this.addMany(triage.contextLanes, map.contextLanes || map.contextLaneSuggestions || []);
    this.addMany(triage.deferredLanes, map.deferredLanes || map.deferredLaneSuggestions || []);
    this.addMany(triage.blockedLanes, map.blockedLanes || []);
    this.addMany(triage.responseConstraints, map.responseConstraints || []);
  },

    applyPriorityRules(map = {}, triage = {}) {
    const needs = map.needs || [];
    const domains = map.domains || [];
    const situations = map.situations || [];

    const wisdomDetected =
      needs.includes("wisdom_support") ||
      needs.includes("principle_clarity") ||
      domains.includes("wisdom_domain") ||
      situations.includes("wisdom_or_values_tension") ||
      situations.includes("principle_or_long_term_consequence");

    if (needs.includes("understanding") || domains.includes("knowledge_domain")) {
      this.choose(triage, "teacher", 92, "Understanding/knowledge request should be answered directly.");
      this.addMany(triage.deferredLanes, ["uncertainty", "life_chapter", "deep_emotion", "wisdom"]);
      this.addMany(triage.blockedLanes, ["deep_emotion"]);
      this.addMany(triage.responseConstraints, ["answer_directly", "do_not_ask_uncertainty_question", "do_not_ask_wisdom_question"]);
      triage.responseShape = triage.responseShape || "clear_explanation";
    }

    if (needs.includes("action_or_build_help") || domains.includes("builder_domain")) {
      this.choose(triage, "builder", 94, "Build/debug request needs practical steps before reflection.");
      this.addMany(triage.deferredLanes, ["emotion", "life_chapter", "wisdom"]);
      this.addMany(triage.responseConstraints, ["give_steps_or_code", "do_not_over_reflect", "do_not_ask_wisdom_question"]);
      triage.responseShape = "build_steps";
    }

    if (needs.includes("decision_support") || situations.includes("tradeoff_or_competing_priorities")) {
      this.choose(triage, "executive_decision", 88, "Decision/tradeoff needs structure.");
      this.addMany(triage.briefLanes, ["emotion"]);
      this.addMany(triage.responseConstraints, ["organize_options", "name_tradeoff"]);
      triage.responseShape = "decision_first_layered";
    }

    if (
      wisdomDetected &&
      !["teacher", "builder", "safety", "medical_body", "risk_clarification"].includes(triage.primaryLane)
    ) {
      this.choose(triage, "wisdom", 84, "Wisdom/principle tension appears central.");
      this.addMany(triage.responseConstraints, ["principle_then_choice", "avoid_generic_uncertainty_question"]);
      triage.responseShape = triage.responseShape || "principle_then_choice";
    } else if (wisdomDetected) {
      this.add(triage.briefLanes, "wisdom");
      this.add(triage.responseConstraints, "preserve_brief_wisdom_without_hijack");
    }

    if (needs.includes("emotional_attunement") || domains.includes("emotion_context_domain")) {
      if (!["teacher", "builder", "safety", "medical_body", "risk_clarification"].includes(triage.primaryLane)) {
        this.choose(triage, "emotion", 78, "Emotion appears central.");
        triage.responseShape = triage.responseShape || "emotion_then_ground";
      } else {
        this.add(triage.briefLanes, "emotion");
        this.add(triage.responseConstraints, "preserve_brief_emotion_without_hijack");
      }
    }

    if (needs.includes("memory_acknowledgment") || domains.includes("memory_preference_domain")) {
      this.choose(triage, "memory", 95, "Memory/preference request should be acknowledged directly.");
      this.addMany(triage.responseConstraints, ["acknowledge_memory", "do_not_reflect_first"]);
      triage.responseShape = "memory_acknowledgment";
    }

    if (domains.includes("medical_context_domain") && triage.primaryLane !== "medical_body") {
      this.add(triage.contextLanes, "medical_context");
      this.add(triage.responseConstraints, "medical_context_without_escalation");
    }
  },

  finalize(triage = {}) {
    if (!triage.primaryLane) {
      triage.primaryLane = "general_understanding";
      triage.responseShape = triage.responseShape || "standard";
      triage.confidence = 50;
      triage.reasons.push("No stronger triage lane emerged.");
    }

    triage.supportLanes = this.cleanLaneList(triage.supportLanes, triage.primaryLane);
    triage.briefLanes = this.cleanLaneList(triage.briefLanes, triage.primaryLane);
    triage.contextLanes = this.cleanLaneList(triage.contextLanes, triage.primaryLane);
    triage.deferredLanes = this.cleanLaneList(triage.deferredLanes, triage.primaryLane);
    triage.blockedLanes = this.cleanLaneList(triage.blockedLanes, triage.primaryLane);

    if (!triage.responseShape) {
      triage.responseShape = this.shapeFromPrimary(triage.primaryLane);
    }

    triage.candidates.sort((a, b) => b.score - a.score);
  },

  choose(triage = {}, lane, score = 50, reason = "") {
    if (!lane) return;

    triage.candidates.push({
      lane,
      score,
      reasons: reason ? [reason] : []
    });

    const currentScore =
      triage.candidates
        .filter(c => c.lane === triage.primaryLane)
        .sort((a, b) => b.score - a.score)[0]?.score || 0;

    if (!triage.primaryLane || score >= currentScore) {
      triage.primaryLane = lane;
      triage.confidence = Math.max(triage.confidence || 0, score);
      if (reason) triage.reasons.push(reason);
    }
  },

  shapeFromPrimary(primary) {
    const map = {
      safety: "urgent_safety",
      medical_body: "medical_boundary_then_action",
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