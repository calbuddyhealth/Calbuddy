// ari/governance/ari-situation-contract.js
// Ari Situation Contract
// Purpose: Create the authoritative response contract from Safety Gate + Observer + Situation Map.
// V2.1.0
// Upgrades:
// - Adds contract authority levels.
// - Adds executive fields for next-step control.
// - Protects primary lane from legacy uncertainty/life-chapter/emotion/wisdom override.
// - Standardizes response shapes for Composer / Mouth Director.
// - Keeps Safety Gate and medical/body above all.

window.Ari = window.Ari || {};

window.AriSituationContract = {
  version: "2.1.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || summary || {};
    const safety = summary.safetyContextGate || {};
const triage =
  summary.triage ||
  summary.ariTriage ||
  {};
    const contract = {
      situationContractRan: true,
      situationContractVersion: this.version,
      source: "ari-situation-contract",

      authority: "normal", // absolute | strong | normal
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
        placement: "none"
      },

      responseShape: "standard",
      responseRules: [],

      executive: {
        contractGoal: null,
        contractObstacle: null,
        contractNextAction: null,
        contractCompletionCriteria: null,
        legacyOverrideProtection: true,
        allowedLegacyInfluence: "support_only"
      },

      mouthDirective: {
        opening: null,
        order: [],
        avoid: [],
        required: [],
        closing: null
      },

      debug: {
        triagePrimaryLane: triage.primaryLane || summary.triagePrimaryLane || null,

  triageConfidence: triage.confidence ?? summary.triageConfidence ?? null,

  triageResponseShape: triage.responseShape || summary.triageResponseShape || null,

  triageReasons: triage.reasons || summary.triageReasons || [],
        mapPrimaryLane: map.primaryLaneSuggestion || null,
        mapDomains: map.domains || [],
        mapSituations: map.situations || [],
        mapNeeds: map.needs || [],
        mapRisks: map.risks || [],
        safetyOverride: safety.override || null,
        safetyRiskLevel: safety.riskLevel || null,
        safetyRiskType: safety.riskType || null
      },

      reasons: []
    };

    this.applyRiskPriority(contract, safety, map, triage);
this.applyPrimaryFromTriage(contract, triage, map);
this.applySupportFromTriage(contract, triage, map);
    this.applyClarity(contract, safety, map);
    this.applyAuthority(contract);
    this.applyResponseShape(contract);
    this.applyExecutiveContract(contract);
    this.applyMouthDirective(contract);
    this.applyLegacyProtection(contract);

    return {
      situationContract: contract,
      ...contract
    };
  },

  applyRiskPriority(contract, safety, map, triage) {
    if (
      safety.override === "safety_emergency" ||
      safety.shouldUseSafetyResponse === true ||
      triage.primaryLane === "safety" || map.primaryLaneSuggestion === "safety"
    ) {
      contract.primary = "safety";
      contract.authority = "absolute";
      contract.blocked = ["builder", "teacher", "wisdom", "deep_emotion", "life_chapter", "identity"];
      contract.responseRules.push("safety_first");
      contract.reasons.push("Safety emergency overrides normal response.");
      return;
    }

    if (
      safety.override === "medical_urgent" ||
      safety.shouldUseMedicalResponse === true ||
      map.primaryLaneSuggestion === "medical_body"
    ) {
      contract.primary = "medical_body";
      contract.authority = "absolute";
      contract.deferred = ["builder", "teacher", "wisdom", "career", "financial", "life_chapter"];
      contract.responseRules.push("medical_first");
      contract.reasons.push("Medical/body urgency leads before other lanes.");
      return;
    }

    if (
      safety.override === "clarify_risk" ||
      safety.shouldAskRiskClarification === true ||
      map.primaryLaneSuggestion === "risk_clarification"
    ) {
      contract.primary = "risk_clarification";
      contract.authority = "absolute";
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

applyPrimaryFromTriage(contract, triage, map) {
  if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
    return;
  }

  const triagePrimary =
    triage.primaryLane ||
    null;

  if (triagePrimary) {
    contract.primary = triagePrimary;
    contract.reasons.push(`Primary came from Triage Engine: ${contract.primary}.`);
    return;
  }

  this.applyPrimaryFromMap(contract, map);
},

applySupportFromTriage(contract, triage, map) {
  const hasTriage =
    triage &&
    (
      triage.primaryLane ||
      Array.isArray(triage.supportLanes) ||
      Array.isArray(triage.deferredLanes)
    );

  if (!hasTriage) {
    this.applySupportFromMap(contract, map);
    return;
  }

  const support = [...(triage.supportLanes || [])];
  const brief = [...(triage.briefLanes || [])];
  const context = [...(triage.contextLanes || [])];
  const deferred = [...(triage.deferredLanes || [])];
  const blocked = [...(triage.blockedLanes || [])];

  support.forEach(lane => this.add(contract.support, lane));
  brief.forEach(lane => this.add(contract.brief, lane));
  context.forEach(lane => this.add(contract.context, lane));
  deferred.forEach(lane => this.add(contract.deferred, lane));
  blocked.forEach(lane => this.add(contract.blocked, lane));

  contract.support = contract.support.filter(lane => lane !== contract.primary);
  contract.brief = contract.brief.filter(lane => lane !== contract.primary);
  contract.context = contract.context.filter(lane => lane !== contract.primary);
  contract.deferred = contract.deferred.filter(lane => lane !== contract.primary);
  contract.blocked = contract.blocked.filter(lane => lane !== contract.primary);
},

  applyPrimaryFromMap(contract, map) {
    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
      return;
    }

    contract.primary = map.primaryLaneSuggestion || "general_understanding";
    contract.reasons.push(`Primary came from Situation Map: ${contract.primary}.`);
  },

  applySupportFromMap(contract, map) {
    const support = [...(map.supportLaneSuggestions || [])];
    const brief = [...(map.briefLaneSuggestions || [])];
    const context = [...(map.contextLaneSuggestions || [])];
    const deferred = [...(map.deferredLaneSuggestions || [])];

    support.forEach(lane => this.add(contract.support, lane));
    brief.forEach(lane => this.add(contract.brief, lane));
    context.forEach(lane => this.add(contract.context, lane));
    deferred.forEach(lane => this.add(contract.deferred, lane));

    contract.support = contract.support.filter(lane => lane !== contract.primary);
    contract.brief = contract.brief.filter(lane => lane !== contract.primary);
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
      ["emotion", "relationship", "family", "wisdom", "life_chapter"].forEach(lane => {
        if (contract.support.includes(lane)) {
          this.move(contract.support, contract.brief, lane);
        }
      });
    }

    if (contract.primary === "teacher") {
      ["emotion", "relationship", "family", "wisdom", "life_chapter"].forEach(lane => {
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

    if (
      contract.primary === "general_understanding" &&
      contract.support.length >= 3
    ) {
      contract.clarity = {
        needed: true,
        level: "medium",
        question: "Which part matters most right now?",
        placement: "end"
      };

      contract.reasons.push("General understanding has many support lanes, so Ari should clarify.");
    }
  },

  applyAuthority(contract) {
    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
      contract.authority = "absolute";
      return;
    }

    if (
      [
        "builder",
        "teacher",
        "executive_decision",
        "memory"
      ].includes(contract.primary)
    ) {
      contract.authority = "strong";
      return;
    }

    contract.authority = "normal";
  },

  applyResponseShape(contract) {
    const shapeMap = {
      safety: "urgent_safety",
      medical_body: "body_truth_then_action",
      risk_clarification: "risk_clarification_question",
      executive_decision: "prioritize_then_plan",
      builder: "build_steps",
      teacher: "clear_explanation",
      emotion: "comfort_then_truth",
      family: "family_truth_then_next_step",
      relationship: "relationship_truth_then_repair",
      wisdom: "principle_then_choice",
      memory: "acknowledge_memory_request",
      general_understanding: "standard"
    };

    contract.responseShape = shapeMap[contract.primary] || "standard";

    if (
      contract.responseShape === "standard" &&
      (contract.support.length || contract.brief.length || contract.context.length)
    ) {
      contract.responseShape = "layered_response";
    }
  },

  applyExecutiveContract(contract) {
    const executiveMap = {
      safety: {
        contractGoal: "Protect immediate safety.",
        contractObstacle: "Lower-priority interpretation may distract from urgent safety.",
        contractNextAction: "Give immediate safety guidance.",
        contractCompletionCriteria: "User receives clear safety next step."
      },

      medical_body: {
        contractGoal: "Stabilize body or medical risk before interpretation.",
        contractObstacle: "Emotional or philosophical interpretation could delay care.",
        contractNextAction: "Give calm medical boundary and next step.",
        contractCompletionCriteria: "User knows whether urgent care/medical contact is needed."
      },

      risk_clarification: {
        contractGoal: "Clarify ambiguous risk before normal response.",
        contractObstacle: "Assuming too much or ignoring risk could both be unsafe.",
        contractNextAction: "Ask one direct safety clarification question.",
        contractCompletionCriteria: "Risk ambiguity is reduced."
      },

      builder: {
        contractGoal: "Help the user build, debug, or implement.",
        contractObstacle: "Legacy uncertainty or life-chapter systems may over-reflect.",
        contractNextAction: "Give concrete steps, code guidance, or request the exact code/error needed.",
        contractCompletionCriteria: "User has a next technical action."
      },

      teacher: {
        contractGoal: "Explain the topic clearly.",
        contractObstacle: "Emotional or uncertainty systems may ask instead of teaching.",
        contractNextAction: "Give a direct explanation with simple structure.",
        contractCompletionCriteria: "User understands the topic better."
      },

      executive_decision: {
        contractGoal: "Create priority and decision structure.",
        contractObstacle: "Too many competing lanes may blur the next move.",
        contractNextAction: "Organize options and name the next step.",
        contractCompletionCriteria: "User knows what to do first."
      },

      emotion: {
        contractGoal: "Restore emotional grounding and connection.",
        contractObstacle: "Advice may land poorly before the feeling is named.",
        contractNextAction: "Validate, name the emotional signal, then ground.",
        contractCompletionCriteria: "User feels understood and steadier."
      },

      family: {
        contractGoal: "Protect family, caregiving, or responsibility.",
        contractObstacle: "Achievement or urgency may crowd out what is irreplaceable.",
        contractNextAction: "Name what needs protection and give one stabilizing step.",
        contractCompletionCriteria: "Family/responsibility priority is clear."
      },

      relationship: {
        contractGoal: "Protect connection and repair.",
        contractObstacle: "Analysis may replace relational attunement.",
        contractNextAction: "Name the relationship truth and suggest one repair move.",
        contractCompletionCriteria: "User has a relational next step."
      },

      wisdom: {
        contractGoal: "Clarify the principle that should lead.",
        contractObstacle: "Competing values may create overthinking.",
        contractNextAction: "Name the tension and the ordering principle.",
        contractCompletionCriteria: "User sees the wiser direction."
      },

      memory: {
        contractGoal: "Acknowledge or apply memory preference.",
        contractObstacle: "The system may answer content while missing the memory request.",
        contractNextAction: "Acknowledge the memory/update request.",
        contractCompletionCriteria: "Preference is handled clearly."
      },

      general_understanding: {
        contractGoal: "Understand and respond normally.",
        contractObstacle: "Signal may be too broad or under-specified.",
        contractNextAction: "Answer directly or ask one useful clarifying question.",
        contractCompletionCriteria: "User gets useful clarity."
      }
    };

    contract.executive = {
      ...contract.executive,
      ...(executiveMap[contract.primary] || executiveMap.general_understanding)
    };
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
      contract.mouthDirective.required = [
        "Give direct emergency/safety next step.",
        "Do not answer lower-priority topics first."
      ];
      contract.mouthDirective.avoid = [
        "Do not philosophize.",
        "Do not over-explain.",
        "Do not use life-chapter framing."
      ];
      return;
    }

    if (contract.primary === "medical_body") {
      contract.mouthDirective.opening = "Lead with medical boundary and next step.";
      contract.mouthDirective.required = [
        "Use calm direct language.",
        "State when urgent care is needed."
      ];
      contract.mouthDirective.avoid = [
        "Do not interpret emotionally before medical safety.",
        "Do not over-reflect."
      ];
      return;
    }

    if (contract.primary === "risk_clarification") {
      contract.mouthDirective.opening = "Ask one safety clarification question.";
      contract.mouthDirective.required = [
        "Only ask the risk clarification question."
      ];
      contract.mouthDirective.avoid = [
        "Do not assume emergency.",
        "Do not ignore possible risk.",
        "Do not answer unrelated lanes yet."
      ];
      return;
    }

    if (contract.primary === "builder") {
      contract.mouthDirective.opening = "Answer with build/debug help first.";
      contract.mouthDirective.required = [
        "Give concrete technical next steps.",
        "Ask for code/error only if exact fix requires it.",
        "Do not let uncertainty/life-chapter systems override builder lane."
      ];
      contract.mouthDirective.avoid = [
        "Do not use generic emotional recovery questions.",
        "Do not frame simple debugging as a life chapter."
      ];
      return;
    }

    if (contract.primary === "teacher") {
      contract.mouthDirective.opening = "Teach directly first.";
      contract.mouthDirective.required = [
        "Explain clearly.",
        "Use simple structure.",
        "Do not ask a vague uncertainty question before teaching."
      ];
      contract.mouthDirective.avoid = [
        "Do not over-reflect.",
        "Do not make the user clarify unless the topic is ambiguous."
      ];
      return;
    }

    if (contract.primary === "executive_decision") {
      contract.mouthDirective.opening = "Organize the decision first.";
      contract.mouthDirective.required = [
        "Name the priority.",
        "Give the next step.",
        "Separate primary from secondary lanes."
      ];
      contract.mouthDirective.avoid = [
        "Do not treat all concerns as equal."
      ];
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

  applyLegacyProtection(contract) {
    if (contract.authority === "absolute") {
      contract.responseRules.push("legacy_systems_must_not_override");
      contract.executive.allowedLegacyInfluence = "none";
      return;
    }

    if (contract.authority === "strong") {
      contract.responseRules.push("legacy_systems_support_only");
      contract.executive.allowedLegacyInfluence = "support_only";
      return;
    }

    contract.executive.allowedLegacyInfluence = "normal";
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