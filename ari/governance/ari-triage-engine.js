// ari/governance/ari-triage-engine.js
// Ari Triage Engine
// Purpose: Arbitrate priority before Situation Contract.
// V2.3.0 — Developer Artifact Lane Support
// Boundary:
// - DOES choose final triage lane.
// - DOES decide support/context/deferred/blocked lanes.
// - DOES decide response shape and constraints.
// - DOES NOT compose final response.
// - DOES NOT override Safety Gate.
// - DOES NOT create Situation Contract.

window.Ari = window.Ari || {};

window.AriTriageEngine = {
  version: "2.3.0",

  run(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const safety = summary.safetyContextGate || map.safetyGateUsed || {};

    const handoff =
      map.triageHandoff ||
      summary.triageHandoff ||
      {};

    const triage = this.createEmptyTriage(map);
const emotionalSupportOverride =
  this.isEmotionalSupportRequest(summary, map);

if (emotionalSupportOverride) {
  this.addCandidate(
    triage,
    "emotion",
    99,
    "Emotional support request detected; presence and grounding lead.",
    "emotional_support_override"
  );

  this.addMany(triage.responseConstraints, [
    "emotional_presence_first",
    "do_not_lead_with_knowledge",
    "do_not_lead_with_executive_decision",
    "do_not_ask_unnecessary_clarification",
    "comfort_then_one_grounding_step"
  ]);

  triage.audit.notes.push(
    "Emotional support override applied before normal triage collection."
  );
}
    this.collectSafetyCandidate(safety, triage);
    this.collectConversationFunctionCandidate(summary, triage);
    this.collectMetaDeveloperRoutingCandidate(summary, map, triage);
    this.collectSemanticPriorityCandidates(map, handoff, triage);
    this.collectHandoffCandidates(handoff, triage);
    this.collectSituationCandidates(map, triage);
    this.collectUniversalCandidates(map, triage, summary);
this.collectEvidenceWeightedCandidates(map, handoff, triage);
this.collectSituationThesis(map, handoff, triage, summary);
this.resolveContradictions(map, handoff, triage);
this.resolveAmbiguity(map, handoff, triage, summary);
this.enforceSafetyGateAuthority(safety, triage);

this.arbitrate(triage);
    this.applyLaneConsequences(map, safety, triage);
    this.finalize(triage);

    return {
      ariTriage: triage,
      triageEngineRan: true,
      triageEngineVersion: this.version,
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
      triageReasons: triage.reasons,
      triageSituationThesis: triage.situationThesisUsed,
triageThesisRecommendedUse: triage.thesisRecommendedUse,
triageAudit: triage.audit
    };
  },

  createEmptyTriage(map = {}) {
    return {
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
      evidenceUsed: [],
      ambiguityUsed: null,
      contradictionsUsed: [],
      situationThesisUsed: null,
      thesisRecommendedUse: "do_not_use_as_authority",
      reasons: [],

      audit: {
        safetyChecked: false,
        handoffRead: false,
        evidenceWeighted: false,
        contradictionsResolved: false,
        ambiguityResolved: false,
        finalAuthority: "triage_engine",
        notes: []
      },

      authority: "triage_owns_lane_choice"
    };
  },

  collectSafetyCandidate(safety = {}, triage = {}) {
  triage.audit.safetyChecked = true;

  if (safety.override === "emergency") {
    if (
      safety.primaryRisk?.type === "medical" ||
      safety.primaryRisk?.type === "poisoning_overdose"
    ) {
      this.addCandidate(
        triage,
        "medical_body",
        100,
        "Safety Gate detected emergency medical/body risk.",
        "safety_gate"
      );
      triage.urgency = "critical";
      triage.gravity = 10;
      return;
    }

    this.addCandidate(
      triage,
      "safety",
      100,
      "Safety Gate detected emergency safety risk.",
      "safety_gate"
    );
    triage.urgency = "critical";
    triage.gravity = 10;
    return;
  }

  if (safety.override === "urgent") {
    if (
      safety.primaryRisk?.type === "medical" ||
      safety.primaryRisk?.type === "poisoning_overdose"
    ) {
      this.addCandidate(
        triage,
        "medical_body",
        98,
        "Safety Gate detected urgent medical/body risk.",
        "safety_gate"
      );
    } else {
      this.addCandidate(
        triage,
        "safety",
        98,
        "Safety Gate detected urgent safety risk.",
        "safety_gate"
      );
    }

    triage.urgency = "high";
    triage.gravity = Math.max(triage.gravity || 0, 9);
    return;
  }

  if (safety.override === "clarify_risk") {
    this.addCandidate(
      triage,
      "risk_clarification",
      96,
      "Risk is ambiguous, so one clarification question leads.",
      "safety_gate"
    );
    triage.urgency = "clarify";
    triage.gravity = Math.max(triage.gravity || 0, 7);
  }
},

collectConversationFunctionCandidate(summary = {}, triage = {}) {
  const cf = summary.conversationFunction || {};
  const primaryFunction = cf.primaryFunction || summary.primaryFunction || null;

  const semanticSummary = summary.semanticSummary || {};
  const expectsDirectAnswer =
    summary.semanticExpectsDirectAnswer === true ||
    semanticSummary.responseCharacteristics?.expectsDirectAnswer === true;

  const isDecisionSupport =
    summary.semanticPrimaryMeaning === "decision_support" ||
    semanticSummary.primaryMeaning === "decision_support" ||
    summary.semanticIntent === "evaluate_options" ||
    semanticSummary.intent === "evaluate_options";

  if (primaryFunction === "memory_or_identity_request") {
    this.addCandidate(
      triage,
      "memory",
      98,
      "Conversation Function Engine detected Ari identity/preference request.",
      "conversation_function_engine"
    );

    this.add(triage.responseConstraints, "answer_ari_identity_or_preference_directly");
    this.add(triage.responseConstraints, "use_character_context_if_available");
    this.add(triage.responseConstraints, "do_not_treat_preference_question_as_generic_teacher");

    return;
  }

  if (primaryFunction === "emotional_disclosure") {
    if (isDecisionSupport && expectsDirectAnswer) {
      this.addCandidate(
        triage,
        "executive_decision",
        97,
        "Direct decision request with emotional pressure; decision leads and emotion supports.",
        "conversation_function_engine"
      );

      this.addCandidate(
        triage,
        "emotion",
        72,
        "Emotional pressure is present as support context.",
        "conversation_function_engine"
      );

      this.add(triage.briefLanes, "emotion");
      this.add(triage.responseConstraints, "brief_emotional_attunement");
      this.add(triage.responseConstraints, "decision_framework");
      this.add(triage.responseConstraints, "do_not_let_emotion_override_direct_decision_request");
      return;
    }

    this.addCandidate(
      triage,
      "emotion",
      96,
      "Conversation Function Engine detected emotional disclosure.",
      "conversation_function_engine"
    );

    this.add(triage.responseConstraints, "emotional_presence_first");
    this.add(triage.responseConstraints, "do_not_jump_to_builder_or_teacher");
  }
},

collectMetaDeveloperRoutingCandidate(summary = {}, map = {}, triage = {}) {
  if (!this.isMetaDeveloperRoutingQuestion(summary, map)) return;

  this.addCandidate(
    triage,
    "teacher",
    96,
    "Meta developer routing question detected; answer as explanation, not artifact operation or decision.",
    "triage_meta_developer_guard"
  );

  this.add(triage.responseConstraints, "answer_directly");
  this.add(triage.responseConstraints, "explain_routing_behavior");
  this.add(triage.responseConstraints, "do_not_route_meta_question_as_builder");
  this.add(triage.responseConstraints, "do_not_route_meta_question_as_executive_decision");

  triage.audit.notes.push(
    "Meta developer routing guard applied; teacher lane preferred."
  );
},

collectSemanticPriorityCandidates(map = {}, handoff = {}, triage = {}) {
  const planner =
    map.plannerHandoff ||
    handoff.plannerHandoff ||
    {};

  const semanticPriority =
    map.semanticPriority ||
    handoff.semanticPriority ||
    {};

  if (planner.ready) {
    (planner.orderedLaneCandidates || []).forEach(item => {
      this.addCandidate(
        triage,
        item.lane,
        item.score || 60,
        item.reasons?.[0] || "Planner handoff candidate from semantic priority.",
        "semantic_priority_planner_handoff"
      );
    });

    this.addMany(triage.responseConstraints, planner.constraints || []);
  }

  if (semanticPriority.available) {
    if (semanticPriority.shouldUseMultiLaneResponse) {
      this.add(triage.responseConstraints, "preserve_multiple_user_needs");
      this.add(triage.responseConstraints, "answer_primary_need_first");
      this.add(triage.responseConstraints, "do_not_collapse_multi_domain_prompt");
    }

    triage.audit.notes.push(
      `Semantic priority available: ${semanticPriority.primary || "unknown"}.`
    );
  }
},

  collectHandoffCandidates(handoff = {}, triage = {}) {
    if (!handoff || !handoff.ready) return;

    triage.audit.handoffRead = true;

    (handoff.recommendedPriorities || []).forEach(item => {
      this.addCandidate(
        triage,
        item.lane,
        item.score || 60,
        item.reasons?.[0] || "Recommended by Situation Map triage handoff.",
        "triage_handoff"
      );
    });

    this.addMany(triage.responseConstraints, handoff.constraints || []);

    triage.ambiguityUsed = handoff.ambiguity || null;
    triage.contradictionsUsed = handoff.contradictions || [];

    (handoff.evidence || []).forEach(evidence => {
      triage.evidenceUsed.push(evidence);
    });
  },

  collectSituationCandidates(map = {}, triage = {}) {
    const candidates = map.triageCandidates || [];

    candidates.forEach(candidate => {
      this.addCandidate(
        triage,
        candidate.lane,
        candidate.score || 50,
        candidate.reasons?.[0] || "Candidate from Situation Map.",
        "situation_map"
      );
    });

    this.addMany(triage.responseConstraints, map.responseConstraints || []);
  },

  collectUniversalCandidates(map = {}, triage = {}, summary = {}) {
    const needs = map.needs || [];
    const domains = map.domains || [];
    const situations = map.situations || [];
    const questions = map.questions || [];

    if (needs.includes("urgent_protection")) {
  if (map.risks?.includes("confirmed_medical_or_body_risk")) {
    this.addCandidate(triage, "medical_body", 92, "Urgent medical/body protection need detected.", "universal_need");
  } else {
    this.addCandidate(triage, "safety", 92, "Urgent safety protection need detected.", "universal_need");
  }
}

    if (needs.includes("risk_clarification")) {
      this.addCandidate(triage, "risk_clarification", 90, "Risk clarification need detected.", "universal_need");
    }

    if (needs.includes("action_or_build_help") || domains.includes("builder_domain")) {
      this.addCandidate(triage, "builder", 86, "Build/debug/action request detected.", "universal_need");
    }

    if (
      needs.includes("understanding") ||
      domains.includes("knowledge_domain") ||
      questions.includes("knowledge_question")
    ) {
      this.addCandidate(triage, "teacher", 82, "Knowledge or explanation request detected.", "universal_need");
    }

    if (
  this.isTrueDecisionRequest(map, summary) &&
  (
    needs.includes("decision_support") ||
    questions.includes("decision_question") ||
    situations.includes("tradeoff_or_competing_priorities")
  )
) {
  this.addCandidate(
    triage,
    "executive_decision",
    88,
    "True decision/action request detected.",
    "universal_need"
  );
}
  
    if (domains.includes("memory_preference_domain")) {
      this.addCandidate(triage, "memory", 90, "Memory or preference request detected.", "universal_domain");
    }

    if (domains.includes("medical_context_domain")) {
      this.addCandidate(triage, "medical_context", 76, "Medical/body context should stay visible without hijacking.", "universal_domain");
    }

    if (domains.includes("family_context_domain")) {
      this.addCandidate(triage, "family", 72, "Family context detected.", "universal_domain");
    }

    if (domains.includes("relationship_context_domain")) {
      this.addCandidate(triage, "relationship", 70, "Relationship context detected.", "universal_domain");
    }

    if (domains.includes("emotion_context_domain")) {
      this.addCandidate(triage, "emotion", 64, "Emotion context detected.", "universal_domain");
    }

    if (
      domains.includes("wisdom_domain") ||
      situations.includes("wisdom_or_values_tension") ||
      needs.includes("wisdom_support") ||
      needs.includes("principle_clarity")
    ) {
      this.addCandidate(triage, "wisdom", 62, "Wisdom or principle tension detected.", "universal_domain");
    }
  },

  collectEvidenceWeightedCandidates(map = {}, handoff = {}, triage = {}) {
    const evidence = [
      ...(handoff.evidence || []),
      ...(map.evidenceModel?.weightedSignals || [])
    ];

    if (!evidence.length) return;

    triage.audit.evidenceWeighted = true;

    evidence.forEach(item => {
      const lane = this.laneFromEvidence(item);
      if (!lane) return;

      const confidence = this.safeConfidence(item.confidence);
      const weight = Number(item.weight || 50);
      const score = Math.min(96, Math.round((confidence * 70) + (weight * 0.3)));

      this.addCandidate(
        triage,
        lane,
        score,
        `Evidence supports ${lane}: ${item.claim || item.evidence}.`,
        item.source || "evidence_model"
      );
    });
  },

  laneFromEvidence(item = {}) {
    const text = `${item.claim || ""} ${item.evidence || ""} ${item.type || ""}`.toLowerCase();

    if (text.includes("safety") || text.includes("self harm") || text.includes("danger")) return "safety";
    if (
  text.includes("medical") ||
  text.includes("body") ||
  text.includes("health") ||
  text.includes("poisoning") ||
  text.includes("overdose")
) {
  if (
    text.includes("urgent") ||
    text.includes("emergency") ||
    text.includes("risk")
  ) {
    return "medical_body";
  }

  return "medical_context";
}

if (text.includes("urgent") || text.includes("emergency")) return "safety";
    if (text.includes("risk") || text.includes("clarify")) return "risk_clarification";

    if (text.includes("builder") || text.includes("code") || text.includes("debug") || text.includes("implementation")) return "builder";
    if (
  text.includes("decision_question") ||
  text.includes("evaluate_options") ||
  text.includes("request_action") ||
  text.includes("recommend") ||
  text.includes("choose") ||
  text.includes("decide")
) return "executive_decision";
    if (text.includes("understanding") || text.includes("explain") || text.includes("knowledge")) return "teacher";
    if (text.includes("memory")) return "memory";
    if (text.includes("family")) return "family";
    if (text.includes("relationship")) return "relationship";
    if (text.includes("emotion")) return "emotion";
    if (text.includes("wisdom") || text.includes("principle")) return "wisdom";

    return null;
  },

  collectSituationThesis(map = {}, handoff = {}, triage = {}, summary = {}) {
    const thesis =
      map.primarySituationThesis ||
      handoff.primarySituationThesis ||
      null;

    const recommendedUse =
      map.thesisRecommendedUse ||
      handoff.thesisRecommendedUse ||
      "do_not_use_as_authority";

    if (!thesis) return;

    triage.situationThesisUsed = thesis;
    triage.thesisRecommendedUse = recommendedUse;

    triage.audit.notes.push(
      `Situation thesis read: ${thesis.thesisType || "unknown"} (${recommendedUse}).`
    );

    if (recommendedUse === "use_as_situation_blueprint") {
      this.add(triage.responseConstraints, "composer_must_use_situation_thesis");
      this.add(triage.responseConstraints, "name_core_conflict_before_recommending");

      if (thesis.bestResponse) {
        this.add(triage.responseConstraints, "follow_thesis_best_response");
      }

      triage.audit.notes.push(
        "Situation thesis approved as response blueprint."
      );
    }

    if (thesis.thesisType === "medical_or_body_context") {
      this.addCandidate(
        triage,
        "medical_context",
        82,
        "Situation thesis indicates medical/body context.",
        "situation_thesis"
      );
    }

    if (
  thesis.thesisType === "decision_under_tradeoff" &&
  this.isTrueDecisionRequest(map, summary)
) {
  this.addCandidate(
    triage,
    "executive_decision",
    86,
    "Situation thesis indicates a true decision under tradeoff.",
    "situation_thesis"
  );
}

    if (thesis.thesisType === "short_term_reward_vs_long_term_stability") {
      this.addCandidate(
        triage,
        "executive_decision",
        92,
        "Situation thesis indicates reward impulse versus long-term stability.",
        "situation_thesis"
      );
    }

    if (thesis.thesisType === "technical_problem_or_build_context") {
      this.addCandidate(
        triage,
        "builder",
        88,
        "Situation thesis indicates technical/build context.",
        "situation_thesis"
      );
    }

    if (thesis.thesisType === "emotional_load_needs_containment") {
      this.addCandidate(
        triage,
        "emotion",
        84,
        "Situation thesis indicates emotional load needs containment.",
        "situation_thesis"
      );
    }

    if (thesis.thesisType === "relationship_or_family_impact") {
      this.addCandidate(
        triage,
        "relationship",
        78,
        "Situation thesis indicates relationship/family impact.",
        "situation_thesis"
      );
    }

    if (thesis.thesisType === "direct_information_or_explanation_request") {
      this.addCandidate(
        triage,
        "teacher",
        82,
        "Situation thesis indicates direct explanation request.",
        "situation_thesis"
      );
    }
  },

  resolveContradictions(map = {}, handoff = {}, triage = {}) {
    const contradictions = [
      ...(map.contradictions || []),
      ...(handoff.contradictions || [])
    ];

    if (!contradictions.length) return;

    triage.audit.contradictionsResolved = true;
    triage.contradictionsUsed = contradictions;

    contradictions.forEach(item => {
      if (item.type === "domain_conflict") {
        this.add(triage.responseConstraints, "resolve_domain_conflict_before_composing");
        triage.audit.notes.push("Domain conflict detected; final lane should prefer stronger semantic/evidence support.");
      }

      if (item.type === "continuity_gap") {
        this.add(triage.responseConstraints, "reuse_or_reconstruct_context");
        this.addCandidate(triage, "teacher", 68, "Continuity gap requires clear grounding before answer.", "contradiction_resolver");
      }

      if (item.type === "explain_vs_act") {
        this.addCandidate(triage, "builder", 84, "Implementation help outranks pure explanation when action is requested.", "contradiction_resolver");
      }

      if (item.type === "lane_alignment") {
        this.addCandidate(triage, "executive_decision", 84, "Decision support needs executive arbitration.", "contradiction_resolver");
      }
    });
  },

  resolveAmbiguity(map = {}, handoff = {}, triage = {}, summary = {}) {
    const ambiguity = handoff.ambiguity || map.ambiguity || null;
    if (!ambiguity || !ambiguity.present) return;

    triage.audit.ambiguityResolved = true;
    triage.ambiguityUsed = ambiguity;

    this.add(triage.responseConstraints, "handle_ambiguity_explicitly");

    const needsClarification =
  ambiguity.shouldAskClarifyingQuestion &&
  (
    (ambiguity.missing || []).includes("decision_options_or_issue") ||
    (ambiguity.missing || []).includes("subject") ||
    (ambiguity.missing || []).includes("dominant_lane")
  );

if (needsClarification && !this.hasDirectAnswerRequest(map)) {
  this.addCandidate(
    triage,
    "clarification",
    82,
    "Ambiguity requires one clarification before full response.",
    "ambiguity_resolver"
  );
}

    if ((ambiguity.missing || []).includes("dominant_lane")) {
      this.add(triage.responseConstraints, "state_assumption_if_answering");
    }

    if (
  (ambiguity.missing || []).includes("decision_options_or_issue") &&
  this.isTrueDecisionRequest(map, summary)
) {
  this.addCandidate(
    triage,
    "executive_decision",
    82,
    "Decision ambiguity should be organized before answering.",
    "ambiguity_resolver"
  );
}
  },

enforceSafetyGateAuthority(safety = {}, triage = {}) {
  if (!safety.safetyApprovedNormalFlow) return;

  triage.candidates = triage.candidates.filter(
    candidate => candidate.lane !== "risk_clarification"
  );

  triage.responseConstraints = triage.responseConstraints.filter(
    rule =>
      ![
        "ask_one_risk_question",
        "do_not_assume_safety",
        "ask_risk_clarification_first"
      ].includes(rule)
  );

  triage.audit.notes.push(
    "Safety Gate approved normal flow; removed downstream risk clarification candidates."
  );
},

  arbitrate(triage = {}) {
    if (!triage.candidates.length) {
      this.addCandidate(triage, "general_understanding", 50, "No strong candidate found.", "fallback");
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

    triage.audit.notes.push(
      `Primary lane '${winner.lane}' selected with score ${winner.score}, priority ${winner.priority}, final ${winner.finalScore}.`
    );
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

    if (primary === "clarification") {
      this.addMany(triage.responseConstraints, ["ask_one_clarifying_question", "do_not_over_answer"]);
      triage.responseShape = "clarify_then_answer";
      return;
    }

if (primary === "developer_artifact") {
  this.addMany(triage.deferredLanes, ["emotion", "wisdom", "life_chapter", "deep_emotion"]);
  this.addMany(triage.responseConstraints, [
    "use_artifact_context",
    "produce_code_or_patch",
    "preserve_unrelated_code",
    "avoid_generic_platform_advice"
  ]);
  triage.responseShape = "developer_artifact_operation";
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
      this.addMany(triage.responseConstraints, ["brief_attunement_then_ground"]);
      triage.responseShape = "emotion_then_ground";
    }

    if (primary === "family") {
      this.addMany(triage.responseConstraints, ["protect_family_context", "practical_next_step"]);
      triage.responseShape = "family_truth_then_next_step";
    }

    if (primary === "relationship") {
      this.addMany(triage.responseConstraints, ["relationship_awareness", "repair_or_clarity"]);
      triage.responseShape = "relationship_truth_then_repair";
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

    triage.audit.notes.push(`Final response shape: ${triage.responseShape}.`);
  },

  priorityOf(lane) {
    const priority = {
      safety: 100,
      medical_body: 95,
      risk_clarification: 90,
      clarification: 58,
medical_context: 55,

memory: 50,
developer_artifact: 58,
builder: 48,
executive_decision: 54,
teacher: 42,

relationship: 36,
family: 36,
emotion: 72,
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
      clarification: "clarify_then_answer",
      teacher: "clear_explanation",
      developer_artifact: "developer_artifact_operation",
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

  safeConfidence(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0.6;
    return n > 1 ? n / 100 : n;
  },

isEmotionalSupportRequest(summary = {}, map = {}) {
  const text = String(
    summary.userMessage ||
    summary.message ||
    summary.input ||
    map.rawUserText ||
    map.resolvedText ||
    map.text ||
    ""
  ).toLowerCase();

  const classifierType =
    summary.conversationType ||
    summary.universalConversationClassifier?.conversationType ||
    summary.classifier?.conversationType ||
    "";

  const classifierIntent =
    summary.conversationIntent ||
    summary.universalConversationClassifier?.conversationIntent ||
    summary.classifier?.conversationIntent ||
    "";

  const cf = summary.conversationFunction || {};
  const cfPrimary =
    cf.primaryFunction ||
    cf.dominantUserMove ||
    "";

  const emotionalText =
    /\b(sad|upset|hurt|lonely|depressed|overwhelmed|stressed|anxious|scared|down|burned out|exhausted|hate feeling this way|need to talk|talk to someone|long day|bad day|rough day|hard day|feel better|don'?t know what to do)\b/.test(text);

  return (
    classifierType === "emotional_support_request" ||
    classifierIntent === "comfort_and_grounding" ||
    cfPrimary === "emotional_disclosure" ||
    map.situationFamily === "emotion" ||
    map.primaryNeed === "emotional_attunement" ||
    emotionalText
  );
},

isMetaDeveloperRoutingQuestion(summary = {}, map = {}) {
  const text = String(
    summary.userMessage ||
    summary.message ||
    summary.input ||
    map.rawUserText ||
    map.resolvedText ||
    map.text ||
    ""
  ).toLowerCase();

  const questions = map.questions || [];
  const classifierType =
    summary.conversationType ||
    summary.universalConversationClassifier?.conversationType ||
    summary.classifier?.conversationType ||
    "";

  const functionIntent =
    summary.conversationIntent ||
    summary.universalConversationClassifier?.conversationIntent ||
    summary.classifier?.conversationIntent ||
    "";

  return (
    questions.includes("meta_developer_routing_question") ||
    classifierType === "meta_developer_routing_question" ||
    functionIntent === "explain_developer_routing_behavior" ||
    (
      /\b(should ari|should it|does it|will it|would it|can it)\b/.test(text) &&
      /\b(trigger|detect|classify|route|routing|semantic|artifact modification|file context|developer request|treat)\b/.test(text)
    )
  );
},

isTrueDecisionRequest(map = {}, summary = {}) {
  if (this.isMetaDeveloperRoutingQuestion(summary, map)) return false;

  const text = String(map.rawUserText || map.resolvedText || map.text || "").toLowerCase();
  const questions = map.questions || [];
  const situations = map.situations || [];
  const needs = map.needs || [];

  const directDecisionLanguage =
    /\b(should i|should we|what should i do|what do i do|which one|which option|choose|decide|best move|next step|recommend|would you|do i|do we)\b/.test(text);

  const buildActionRequest =
    needs.includes("action_or_build_help") &&
    /\b(fix|build|implement|update|replace|debug|send code|how do i)\b/.test(text);

  return (
    questions.includes("decision_question") ||
    situations.includes("decision_context") ||
    directDecisionLanguage ||
    buildActionRequest
  );
},

hasDirectAnswerRequest(map = {}) {
  const text = String(map.rawUserText || map.resolvedText || map.text || "").toLowerCase();

  const semanticIntent =
    map.semanticSituation?.currentTurnMeaning?.intent ||
    map.semanticSituation?.handoff?.intent ||
    map.canonical?.goal ||
    "";

  const semanticMeaning =
    map.semanticSituation?.currentTurnMeaning?.frameType ||
    map.semanticSituation?.handoff?.currentMeaning ||
    map.canonical?.issueType ||
    "";

  const questions = map.questions || [];

  return (
    questions.includes("explicit_question") ||
    questions.includes("knowledge_question") ||
    semanticIntent === "obtain_answer_or_clarification" ||
    semanticMeaning === "information_seeking" ||
    /\b(can we|do you know|what is|what are|why|how|tell me|explain|quote|example)\b/.test(text)
  );
},
  addCandidate(triage = {}, lane, score = 50, reason = "", source = "unknown") {
    if (!lane) return;

    const existing = triage.candidates.find(item => item.lane === lane);

    if (existing) {
      existing.score = Math.max(existing.score, score);
      if (reason && !existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
      }
      if (source && !existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      return;
    }

    triage.candidates.push({
      lane,
      score,
      reasons: reason ? [reason] : [],
      sources: source ? [source] : []
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

console.log(
  "ARI TRIAGE ENGINE LOADED:",
  window.AriTriageEngine?.version
);