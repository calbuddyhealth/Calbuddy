// ari/governance/ari-situation-contract.js
// Ari Situation Contract
// Purpose: Decide response structure from Safety Gate + Observer + Situation Map.
// V1.0.0

window.Ari = window.Ari || {};

window.AriSituationContract = {
  version: "1.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || summary || {};
    const safety = summary.safetyContextGate || {};

    const contract = {
      situationContractRan: true,
      situationContractVersion: this.version,
      source: "ari-situation-contract",

      primary: "general_understanding",
      support: [],
      brief: [],
      context: [],
      deferred: [],
      blocked: [],

      risk: {
        level: safety.riskLevel || map.riskLevel || "none",
        type: safety.riskType || map.riskType || "none",
        override: safety.override || map.override || null
      },

      clarity: {
        needed: false,
        level: "none",
        question: null,
        placement: "none" // none | opening | end | only
      },

      responseShape: "standard",
      responseRules: [],
      mouthDirective: {
        opening: null,
        order: [],
        avoid: [],
        required: [],
        closing: null
      },

      reasons: []
    };

    this.applyRiskPriority(contract, safety, map);
    this.applyPrimaryFromMap(contract, map);
    this.applySupportFromMap(contract, map);
    this.applyClarity(contract, safety, map);
    this.applyResponseShape(contract);
    this.applyMouthDirective(contract);

    return {
      situationContract: contract,
      ...contract
    };
  },

  applyRiskPriority(contract, safety, map) {
    if (safety.override === "safety_emergency" || map.primaryLaneSuggestion === "safety") {
      contract.primary = "safety";
      contract.blocked = ["builder", "wisdom", "deep_emotion", "life_chapter"];
      contract.responseRules.push("safety_first");
      contract.reasons.push("Safety emergency overrides normal response.");
      return;
    }

    if (safety.override === "medical_urgent" || map.primaryLaneSuggestion === "medical_body") {
      contract.primary = "medical_body";
      contract.deferred = ["builder", "wisdom", "career", "financial"];
      contract.responseRules.push("medical_first");
      contract.reasons.push("Medical urgency leads before other lanes.");
      return;
    }

    if (safety.override === "clarify_risk" || map.primaryLaneSuggestion === "risk_clarification") {
      contract.primary = "risk_clarification";
      contract.clarity = {
        needed: true,
        level: "high",
        question:
          safety.followUpQuestion ||
          map.recommendedQuestion ||
          "Are you safe right now?",
        placement: "only"
      };
      contract.responseRules.push("ask_risk_clarification_first");
      contract.reasons.push("Risk is ambiguous, so clarification leads.");
    }
  },

  applyPrimaryFromMap(contract, map) {
    if (
      contract.primary === "safety" ||
      contract.primary === "medical_body" ||
      contract.primary === "risk_clarification"
    ) {
      return;
    }

    contract.primary =
      map.primaryLaneSuggestion ||
      "general_understanding";

    contract.reasons.push(`Primary came from Situation Map: ${contract.primary}.`);
  },

  applySupportFromMap(contract, map) {
    const support = [
      ...(map.supportLaneSuggestions || [])
    ];

    const context = [
      ...(map.contextLaneSuggestions || [])
    ];

    const deferred = [
      ...(map.deferredLaneSuggestions || [])
    ];

    support.forEach(lane => this.add(contract.support, lane));
    context.forEach(lane => this.add(contract.context, lane));
    deferred.forEach(lane => this.add(contract.deferred, lane));

    contract.support = contract.support.filter(lane => lane !== contract.primary);
    contract.context = contract.context.filter(lane => lane !== contract.primary);
    contract.deferred = contract.deferred.filter(lane => lane !== contract.primary);

    if (contract.primary === "executive_decision") {
      ["family", "financial", "career", "relationship"].forEach(lane => {
        if (contract.support.includes(lane)) {
          this.move(contract.support, contract.brief, lane);
        }
      });
    }

    if (contract.primary === "builder") {
      ["emotion", "relationship", "family"].forEach(lane => {
        if (contract.support.includes(lane)) {
          this.move(contract.support, contract.brief, lane);
        }
      });
    }
  },

  applyClarity(contract, safety, map) {
    if (contract.clarity.needed) return;

    if (map.shouldAskClarifyingQuestion) {
      contract.clarity = {
        needed: true,
        level: map.complexity === "multi_domain" ? "medium" : "low",
        question:
          map.recommendedQuestion ||
          "Which part do you want to handle first?",
        placement: "end"
      };

      contract.reasons.push("Situation Map recommends clarification.");
    }

    if (contract.primary === "general_understanding" && contract.support.length >= 3) {
      contract.clarity = {
        needed: true,
        level: "medium",
        question: "Which part matters most right now?",
        placement: "end"
      };
    }
  },

  applyResponseShape(contract) {
    if (contract.primary === "safety") {
      contract.responseShape = "urgent_safety";
      return;
    }

    if (contract.primary === "medical_body") {
      contract.responseShape = "medical_boundary_then_action";
      return;
    }

    if (contract.primary === "risk_clarification") {
      contract.responseShape = "clarify_risk_only";
      return;
    }

    if (contract.primary === "executive_decision") {
      contract.responseShape = "decision_first_layered";
      return;
    }

    if (contract.primary === "builder") {
      contract.responseShape = "build_steps";
      return;
    }

    if (contract.primary === "emotion") {
      contract.responseShape = "emotion_then_ground";
      return;
    }

    if (contract.primary === "teacher") {
      contract.responseShape = "teach_clearly";
      return;
    }

    if (contract.support.length || contract.brief.length || contract.context.length) {
      contract.responseShape = "layered_response";
      return;
    }

    contract.responseShape = "standard";
  },

  applyMouthDirective(contract) {
    contract.mouthDirective.order = [
      contract.primary,
      ...contract.support,
      ...contract.brief.map(lane => `brief_${lane}`),
      ...contract.context.map(lane => `context_${lane}`),
      ...contract.deferred.map(lane => `defer_${lane}`)
    ];

    if (contract.primary === "safety") {
      contract.mouthDirective.opening = "Lead with immediate safety.";
      contract.mouthDirective.required = ["Give direct emergency/safety next step."];
      contract.mouthDirective.avoid = ["Do not philosophize.", "Do not answer lower-priority topics first."];
      return;
    }

    if (contract.primary === "medical_body") {
      contract.mouthDirective.opening = "Lead with medical boundary and next step.";
      contract.mouthDirective.required = ["Use calm direct language.", "State when urgent care is needed."];
      contract.mouthDirective.avoid = ["Do not interpret emotionally before medical safety."];
      return;
    }

    if (contract.primary === "risk_clarification") {
      contract.mouthDirective.opening = "Ask one safety clarification question.";
      contract.mouthDirective.required = ["Only ask the risk clarification question."];
      contract.mouthDirective.avoid = ["Do not assume emergency.", "Do not ignore possible risk."];
      return;
    }

    contract.mouthDirective.opening = "Answer the primary lane first.";
    contract.mouthDirective.required = [
      "Do not collapse multiple issues into one.",
      "Respect primary/support/brief/context/deferred lanes."
    ];

    if (contract.clarity.needed) {
      contract.mouthDirective.closing = contract.clarity.question;
    }
  },

  add(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  move(from, to, item) {
    const index = from.indexOf(item);
    if (index >= 0) from.splice(index, 1);
    this.add(to, item);
  }
};