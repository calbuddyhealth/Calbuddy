// ari/governance/ari-multi-lane-response-planner.js
// Ari Multi-Lane Response Planner
// Purpose: Advanced attention distribution system.
// Reads Situation Map. Does NOT perform raw pattern recognition.
// V2.0

window.AriMultiLaneResponsePlanner = {
  version: "2.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || summary || {};

    const plan = {
      multiLanePlannerRan: true,
      multiLanePlannerVersion: this.version,
      source: "ari-multi-lane-response-planner",

      primaryLane: null,
      lanes: [],
      supportLanes: [],
      briefLanes: [],
      deferredLanes: [],
      blockedLanes: [],

      laneWeights: {},
      laneBudgets: {},
      laneRoles: {},

      responseOrder: [],
      responseShape: "single_lane",
      maxSections: 2,
      maxSentences: 6,

      conflictRules: [],
      responseRisks: [],
      blindSpots: [],

      shouldAcknowledgeMultipleSituations: false,
      shouldDeferLowerPriorityQuestions: false,
      shouldAskClarifyingQuestion: false,

      composerDirective: {
        opening: null,
        sequence: [],
        avoid: [],
        required: [],
        closing: null,
        question: null
      },

      fallbackMode: null,
      confidence: 0.7,
      reasons: []
    };

    this.choosePrimaryLane(summary, map, plan);
    this.buildLaneCandidates(map, plan);
    this.weightLanes(map, plan);
    this.assignLaneRoles(map, plan);
    this.applyConflictRules(map, plan);
    this.assignBudgets(plan);
    this.assignResponseShape(map, plan);
    this.buildComposerDirective(map, plan);
    this.checkBlindSpots(map, plan);
    this.finalize(plan);

    return plan;
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(n) || 0));
  },

  choosePrimaryLane(summary, map, plan) {
    if (map.primaryLaneSuggestion) {
      plan.primaryLane = map.primaryLaneSuggestion;
      plan.reasons.push(`Primary lane from Situation Map: ${map.primaryLaneSuggestion}.`);
      return;
    }

    if (summary.responseIntent === "protect_safety") {
      plan.primaryLane = "safety";
    } else if (summary.organismNeedsStabilization) {
      plan.primaryLane = "medical_body";
    } else if (summary.domainLeadOrgan) {
      plan.primaryLane = summary.domainLeadOrgan;
    } else {
      plan.primaryLane = "understanding";
      plan.fallbackMode = "missing_situation_map_or_primary_lane";
    }

    plan.reasons.push(`Primary lane inferred from existing summary: ${plan.primaryLane}.`);
  },

  buildLaneCandidates(map, plan) {
    const base = [plan.primaryLane];

    (map.supportLaneSuggestions || []).forEach(lane => base.push(lane));
    (map.deferredLaneSuggestions || []).forEach(lane => base.push(lane));

    const domainToLane = {
      safety_domain: "safety",
      medical_body_domain: "medical_body",
      emotion_domain: "emotion",
      relationship_connection_domain: "relationship",
      family_caregiving_domain: "family",
      career_contribution_domain: "career",
      money_resources_domain: "financial",
      creative_building_domain: "builder",
      knowledge_learning_domain: "teacher",
      wisdom_values_domain: "wisdom",
      memory_preference_domain: "memory"
    };

    (map.domains || []).forEach(domain => {
      if (domainToLane[domain]) base.push(domainToLane[domain]);
    });

    base.forEach(lane => {
      if (!lane) return;
      if (!plan.lanes.some(l => l.name === lane)) {
        plan.lanes.push({
          name: lane,
          weight: 0,
          role: "support",
          budget: "brief",
          maxSentences: 1,
          reason: null
        });
      }
    });
  },

  weightLanes(map, plan) {
    const setWeight = (lane, amount, reason) => {
      const item = plan.lanes.find(l => l.name === lane);
      if (!item) return;

      item.weight = this.clamp(item.weight + amount);
      item.reason = item.reason || reason;
      plan.laneWeights[lane] = item.weight;
    };

    setWeight(plan.primaryLane, 70, "Primary lane receives base attention.");

    if (map.urgency === "critical") {
      setWeight("safety", 100, "Critical urgency gives safety maximum authority.");
      setWeight("medical_body", 80, "Critical urgency often requires body stabilization.");
    }

    if (map.urgency === "high") {
      setWeight("medical_body", 90, "High urgency gives body lane priority.");
      setWeight("safety", 65, "High urgency requires safety awareness.");
    }

    const needs = map.needs || [];
    if (needs.includes("stabilization")) setWeight("medical_body", 80, "Stabilization need detected.");
    if (needs.includes("emotional_attunement")) setWeight("emotion", 65, "Emotional attunement need detected.");
    if (needs.includes("decision_support")) setWeight("executive_decision", 70, "Decision support need detected.");
    if (needs.includes("action_or_build_help")) setWeight("builder", 65, "Build/action need detected.");
    if (needs.includes("understanding")) setWeight("teacher", 55, "Understanding need detected.");
    if (needs.includes("wisdom_or_value_clarity")) setWeight("wisdom", 55, "Wisdom/value clarity need detected.");
    if (needs.includes("memory_acknowledgment")) setWeight("memory", 90, "Memory request should be acknowledged directly.");
    if (needs.includes("protection_of_relationships")) setWeight("family", 50, "Relationship protection need detected.");

    const situations = map.situations || [];
    if (situations.includes("family_or_caregiving_context")) setWeight("family", 45, "Family/caregiving context detected.");
    if (situations.includes("close_relationship_context")) setWeight("relationship", 40, "Close relationship context detected.");
    if (situations.includes("resource_or_financial_pressure")) setWeight("financial", 45, "Financial pressure detected.");
    if (situations.includes("work_or_role_context")) setWeight("career", 45, "Work or role context detected.");
    if (situations.includes("identity_or_role_pressure")) setWeight("identity", 45, "Identity or role pressure detected.");
    if (situations.includes("competing_priorities")) setWeight("executive_decision", 45, "Competing priorities detected.");

    plan.lanes.forEach(lane => {
      if (!plan.laneWeights[lane.name]) {
        lane.weight = lane.name === plan.primaryLane ? 70 : 25;
        plan.laneWeights[lane.name] = lane.weight;
      }
    });

    plan.lanes.sort((a, b) => b.weight - a.weight);
  },

  assignLaneRoles(map, plan) {
    plan.lanes.forEach(lane => {
      if (lane.name === plan.primaryLane) {
        lane.role = "primary";
        lane.maxSentences = 3;
      } else if (lane.weight >= 65) {
        lane.role = "answer";
        lane.maxSentences = 2;
      } else if (lane.weight >= 45) {
        lane.role = "brief";
        lane.maxSentences = 1;
      } else {
        lane.role = "acknowledge";
        lane.maxSentences = 1;
      }

      if (lane.name === "emotion" && lane.name !== plan.primaryLane) {
        lane.role = "validate";
        lane.maxSentences = 1;
      }

      if (lane.name === "memory") {
        lane.role = "acknowledge";
        lane.maxSentences = 1;
      }

      plan.laneRoles[lane.name] = lane.role;
    });
  },

  applyConflictRules(map, plan) {
    const hasLane = name => plan.lanes.some(l => l.name === name);
    const setRole = (name, role, maxSentences = 1) => {
      const lane = plan.lanes.find(l => l.name === name);
      if (!lane) return;
      lane.role = role;
      lane.maxSentences = maxSentences;
      plan.laneRoles[name] = role;
    };

    const safetyLead =
      plan.primaryLane === "safety" ||
      plan.primaryLane === "medical_body" ||
      map.urgency === "critical" ||
      map.urgency === "high";

    if (safetyLead) {
      plan.conflictRules.push("safety_or_body_leads_all_other_lanes");

      ["builder", "teacher", "wisdom", "career", "financial"].forEach(lane => {
        if (hasLane(lane)) {
          setRole(lane, "defer", 0);
          this.addUnique(plan.deferredLanes, lane);
        }
      });

      ["emotion", "family", "relationship"].forEach(lane => {
        if (hasLane(lane)) {
          setRole(lane, "brief", 1);
          this.addUnique(plan.briefLanes, lane);
        }
      });

      plan.shouldDeferLowerPriorityQuestions = true;
      plan.maxSections = 2;
      plan.maxSentences = 5;
    }

    if (hasLane("emotion") && hasLane("builder") && plan.primaryLane === "builder") {
      plan.conflictRules.push("builder_can_lead_but_emotion_must_be_acknowledged");
      setRole("emotion", "validate", 1);
    }

    if (hasLane("wisdom") && hasLane("medical_body")) {
      plan.conflictRules.push("wisdom_waits_until_body_boundary_is_clear");
      if (plan.primaryLane === "medical_body") setRole("wisdom", "defer", 0);
    }

    if (hasLane("memory")) {
      plan.conflictRules.push("memory_request_requires_direct_acknowledgment");
      setRole("memory", "acknowledge", 1);
    }
  },

  assignBudgets(plan) {
    plan.lanes.forEach(lane => {
      if (lane.role === "primary") lane.budget = "major";
      else if (lane.role === "answer") lane.budget = "moderate";
      else if (lane.role === "validate") lane.budget = "one_sentence";
      else if (lane.role === "brief") lane.budget = "one_sentence";
      else if (lane.role === "acknowledge") lane.budget = "one_sentence";
      else if (lane.role === "defer") lane.budget = "defer_only";
      else if (lane.role === "block") lane.budget = "none";
      else lane.budget = "brief";

      plan.laneBudgets[lane.name] = lane.budget;
    });

    plan.supportLanes = plan.lanes
      .filter(l => ["answer", "validate", "brief", "acknowledge"].includes(l.role))
      .map(l => l.name)
      .filter(name => name !== plan.primaryLane);

    plan.deferredLanes = plan.lanes
      .filter(l => l.role === "defer")
      .map(l => l.name);

    plan.blockedLanes = plan.lanes
      .filter(l => l.role === "block")
      .map(l => l.name);
  },

  assignResponseShape(map, plan) {
    if (plan.primaryLane === "safety" || plan.primaryLane === "medical_body") {
      plan.responseShape = "safety_first_layered";
      return;
    }

    if ((map.domains || []).length >= 4 || (map.questions || []).length >= 3) {
      plan.responseShape = "multi_question_triage";
      plan.shouldAcknowledgeMultipleSituations = true;
      plan.maxSections = 3;
      plan.maxSentences = 8;
      return;
    }

    if (plan.supportLanes.length >= 2) {
      plan.responseShape = "layered_multi_lane";
      plan.shouldAcknowledgeMultipleSituations = true;
      plan.maxSections = 3;
      plan.maxSentences = 8;
      return;
    }

    if (plan.supportLanes.length === 1) {
      plan.responseShape = "primary_plus_support";
      plan.maxSections = 2;
      plan.maxSentences = 6;
      return;
    }

    plan.responseShape = "single_lane";
  },

  buildComposerDirective(map, plan) {
    const d = plan.composerDirective;

    if (plan.responseShape === "safety_first_layered") {
      d.opening = "Lead with the urgent safety/body concern first.";
      d.required.push("Give a concrete next step.");
      d.required.push("Use calm, direct language.");
      d.avoid.push("Do not philosophize before safety.");
      d.avoid.push("Do not answer lower-priority technical or abstract questions first.");

      if (plan.briefLanes.includes("emotion") || plan.briefLanes.includes("family")) {
        d.sequence.push("Briefly acknowledge family/emotional weight in one sentence.");
      }

      d.sequence.push("State the safety/body action.");
      d.closing = plan.deferredLanes.length
        ? "Briefly say the deferred topics can be handled after the urgent issue."
        : null;

      return;
    }

    if (plan.responseShape === "multi_question_triage") {
      d.opening = "Acknowledge that the user asked multiple things.";
      d.required.push("Prioritize instead of answering everything equally.");
      d.sequence.push("Name the primary lane.");
      d.sequence.push("Give useful brief treatment to support lanes.");
      d.sequence.push("Defer lower-priority lanes clearly.");
      d.avoid.push("Do not collapse the prompt into only one interpretation.");
      return;
    }

    if (plan.responseShape === "layered_multi_lane") {
      d.opening = "Acknowledge the main situation and the secondary pressure.";
      d.sequence.push("Answer primary lane first.");
      d.sequence.push("Add one useful support-lane sentence.");
      d.required.push("Include one next step.");
      return;
    }

    if (plan.responseShape === "primary_plus_support") {
      d.opening = "Answer the main need directly.";
      d.sequence.push("Include one support-lane acknowledgment.");
      return;
    }

    d.opening = "Answer the primary lane directly.";
  },

  checkBlindSpots(map, plan) {
    if ((map.domains || []).includes("emotion_domain") && !plan.supportLanes.includes("emotion") && plan.primaryLane !== "emotion") {
      plan.blindSpots.push("emotion_detected_but_not_preserved");
    }

    if ((map.responseRequirements || []).includes("medical_boundary_and_next_step") && !["safety", "medical_body"].includes(plan.primaryLane)) {
      plan.blindSpots.push("medical_boundary_detected_but_not_primary");
    }

    if ((map.questions || []).length >= 2 && !plan.shouldAcknowledgeMultipleSituations) {
      plan.blindSpots.push("multiple_questions_detected_but_not_acknowledged");
    }

    if ((map.needs || []).includes("memory_acknowledgment") && !plan.lanes.some(l => l.name === "memory")) {
      plan.blindSpots.push("memory_request_detected_but_no_memory_lane");
    }

    if ((map.needs || []).includes("decision_support") && !plan.lanes.some(l => l.name === "executive_decision")) {
      plan.blindSpots.push("decision_need_detected_but_no_decision_lane");
    }

    if (plan.blindSpots.length) {
      plan.responseRisks.push("planner_detected_possible_attention_mismatch");
      plan.confidence = Math.max(0.45, plan.confidence - 0.15);
    }
  },

  finalize(plan) {
    plan.responseOrder = plan.lanes
      .filter(l => l.role !== "block")
      .map(l => {
        if (l.role === "defer") return `defer_${l.name}`;
        return l.name;
      });

    plan.lanes.forEach(lane => {
      plan.laneWeights[lane.name] = lane.weight;
      plan.laneRoles[lane.name] = lane.role;
      plan.laneBudgets[lane.name] = lane.budget;
    });

    if (!plan.primaryLane) {
      plan.primaryLane = "understanding";
      plan.fallbackMode = "no_primary_lane_found";
      plan.confidence = 0.4;
    }
  }
};