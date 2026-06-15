// ari/governance/ari-situation-contract.js
// Ari Situation Contract
// Purpose: Authoritative contract governor for Ari Rebirth.
// V3.0.0
// Role:
// - Converts Safety Gate + Situation Map + Triage into a binding response contract.
// - Enforces chain of command.
// - Prevents downstream drift from uncertainty, life chapter, emotion, wisdom, or generic questions.
// - Gives Mouth Director / Composer clear required and forbidden behavior.

window.Ari = window.Ari || {};

window.AriSituationContract = {
  version: "3.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const safety = summary.safetyContextGate || {};
    const triage = summary.triage || summary.ariTriage || {};

    const contract = this.blankContract({ safety, map, triage });

    this.applySafetyPriority(contract, safety, map, triage);
    this.applyPrimaryLane(contract, map, triage);
    this.applyLaneProfile(contract);
    this.applyTriageLanes(contract, triage, map);
    this.applyMedicalContextProtection(contract, safety, map, triage);
    this.applyClarity(contract, safety, map);
    this.applyAuthority(contract);
    this.applyResponseShape(contract);
    this.applyExecutive(contract);
    this.applyMouthDirective(contract);
    this.applyLegacyProtection(contract);
    this.cleanContract(contract);

    return {
      situationContract: contract,
      ...contract
    };
  },

  blankContract({ safety = {}, map = {}, triage = {} }) {
    return {
      situationContractRan: true,
      situationContractVersion: this.version,
      source: "ari-situation-contract",

      authority: "normal",

      primary: null,
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

      responseShape: null,
      responseRules: [],

      requiredBehaviors: [],
      forbiddenBehaviors: [],

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
        triagePrimaryLane: triage.primaryLane || null,
        triageConfidence: triage.confidence ?? null,
        triageResponseShape: triage.responseShape || null,
        triageReasons: triage.reasons || [],
        mapPrimaryLane: map.primaryLane || map.primaryLaneSuggestion || null,
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
  },

  applySafetyPriority(contract, safety = {}, map = {}, triage = {}) {
    if (
      safety.override === "safety_emergency" ||
      safety.shouldUseSafetyResponse === true ||
      triage.primaryLane === "safety" ||
      map.primaryLaneSuggestion === "safety"
    ) {
      contract.primary = "safety";
      contract.authority = "absolute";
      contract.reasons.push("Safety emergency overrides all other lanes.");
      return;
    }

    if (
      safety.override === "medical_urgent" ||
      safety.shouldUseMedicalResponse === true ||
      triage.primaryLane === "medical_body" ||
      map.primaryLaneSuggestion === "medical_body"
    ) {
      contract.primary = "medical_body";
      contract.authority = "absolute";
      contract.reasons.push("Medical/body urgency overrides non-medical lanes.");
      return;
    }

    if (
      safety.override === "clarify_risk" ||
      safety.shouldAskRiskClarification === true ||
      triage.primaryLane === "risk_clarification" ||
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
      contract.reasons.push("Ambiguous risk requires clarification before normal response.");
    }
  },

  applyPrimaryLane(contract, map = {}, triage = {}) {
    if (contract.primary) return;

    if (triage.primaryLane) {
      contract.primary = triage.primaryLane;
      contract.reasons.push(`Primary came from Triage Engine: ${contract.primary}.`);
      return;
    }

    if (map.primaryLane || map.primaryLaneSuggestion) {
      contract.primary = map.primaryLane || map.primaryLaneSuggestion;
      contract.reasons.push(`Primary came from Situation Map: ${contract.primary}.`);
      return;
    }

    contract.primary = "general_understanding";
    contract.reasons.push("No stronger lane was detected.");
  },

  applyLaneProfile(contract) {
    const profile = this.getLaneProfile(contract.primary);

    contract.authority = profile.authority;
    contract.responseShape = profile.responseShape;

    this.addMany(contract.blocked, profile.blocked || []);
    this.addMany(contract.deferred, profile.deferred || []);
    this.addMany(contract.brief, profile.brief || []);
    this.addMany(contract.context, profile.context || []);
    this.addMany(contract.responseRules, profile.responseRules || []);
    this.addMany(contract.requiredBehaviors, profile.requiredBehaviors || []);
    this.addMany(contract.forbiddenBehaviors, profile.forbiddenBehaviors || []);

    contract.executive = {
      ...contract.executive,
      ...(profile.executive || {})
    };

    contract.mouthDirective = {
      ...contract.mouthDirective,
      ...(profile.mouthDirective || {})
    };
  },

  applyTriageLanes(contract, triage = {}, map = {}) {
    const hasTriage =
      triage &&
      (
        triage.primaryLane ||
        Array.isArray(triage.supportLanes) ||
        Array.isArray(triage.briefLanes) ||
        Array.isArray(triage.contextLanes) ||
        Array.isArray(triage.deferredLanes) ||
        Array.isArray(triage.blockedLanes)
      );

    if (hasTriage) {
      this.addMany(contract.support, triage.supportLanes || []);
      this.addMany(contract.brief, triage.briefLanes || []);
      this.addMany(contract.context, triage.contextLanes || []);
      this.addMany(contract.deferred, triage.deferredLanes || []);
      this.addMany(contract.blocked, triage.blockedLanes || []);
      this.addMany(contract.responseRules, triage.responseConstraints || []);
      return;
    }

    this.addMany(contract.support, map.supportLanes || map.supportLaneSuggestions || []);
    this.addMany(contract.brief, map.briefLanes || map.briefLaneSuggestions || []);
    this.addMany(contract.context, map.contextLanes || map.contextLaneSuggestions || []);
    this.addMany(contract.deferred, map.deferredLanes || map.deferredLaneSuggestions || []);
    this.addMany(contract.blocked, map.blockedLanes || []);
    this.addMany(contract.responseRules, map.responseConstraints || []);
  },

  applyMedicalContextProtection(contract, safety = {}, map = {}, triage = {}) {
    const medicalContextExists =
      safety.riskType === "medical" ||
      map.riskType === "medical" ||
      (map.domains || []).includes("medical_context_domain") ||
      (map.domains || []).includes("body_signal_domain") ||
      contract.primary === "medical_context";

    if (!medicalContextExists) return;

    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) return;

    if (contract.primary !== "medical_context") {
      this.add(contract.context, "medical_context");
    }

    this.add(contract.responseRules, "medical_context_without_escalation");
    this.add(contract.requiredBehaviors, "Address medical/body context with practical next step.");
    this.add(contract.forbiddenBehaviors, "Do not use generic uncertainty recovery questions.");
    this.add(contract.forbiddenBehaviors, "Do not frame medical context as a life chapter.");
    this.add(contract.blocked, "life_chapter");
    this.add(contract.blocked, "deep_emotion");
  },

  applyClarity(contract, safety = {}, map = {}) {
    if (contract.clarity.needed) return;

    if (contract.primary === "risk_clarification") return;

    if (map.shouldAskClarifyingQuestion === true) {
      contract.clarity = {
        needed: true,
        level: map.complexity === "multi_domain" ? "medium" : "low",
        question:
          map.recommendedQuestion ||
          "Which part do you want to handle first?",
        placement: "end"
      };
      contract.reasons.push("Situation Map requested clarification.");
    }
  },

  applyAuthority(contract) {
    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
      contract.authority = "absolute";
      return;
    }

    if (
      [
        "medical_context",
        "builder",
        "teacher",
        "executive_decision",
        "memory"
      ].includes(contract.primary)
    ) {
      contract.authority = "strong";
      return;
    }

    contract.authority = contract.authority || "normal";
  },

  applyResponseShape(contract) {
    if (contract.responseShape) return;

    contract.responseShape = this.getLaneProfile(contract.primary).responseShape || "standard";
  },

  applyExecutive(contract) {
    const profile = this.getLaneProfile(contract.primary);

    contract.executive = {
      ...contract.executive,
      ...(profile.executive || {})
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

    contract.mouthDirective.required = [
      ...(contract.mouthDirective.required || []),
      ...contract.requiredBehaviors
    ];

    contract.mouthDirective.avoid = [
      ...(contract.mouthDirective.avoid || []),
      ...contract.forbiddenBehaviors
    ];

    if (contract.clarity.needed) {
      contract.mouthDirective.closing = contract.clarity.question;
    }
  },

  applyLegacyProtection(contract) {
    if (contract.authority === "absolute") {
      this.add(contract.responseRules, "legacy_systems_must_not_override");
      contract.executive.allowedLegacyInfluence = "none";
      return;
    }

    if (contract.authority === "strong") {
      this.add(contract.responseRules, "legacy_systems_support_only");
      contract.executive.allowedLegacyInfluence = "support_only";
      return;
    }

    contract.executive.allowedLegacyInfluence = "normal";
  },

  getLaneProfile(lane = "general_understanding") {
    const profiles = {
      safety: {
        authority: "absolute",
        responseShape: "urgent_safety",
        blocked: ["builder", "teacher", "wisdom", "emotion", "deep_emotion", "life_chapter", "identity"],
        responseRules: ["safety_first"],
        requiredBehaviors: [
          "Lead with immediate safety.",
          "Give direct emergency/safety next step."
        ],
        forbiddenBehaviors: [
          "Do not philosophize.",
          "Do not use life-chapter framing.",
          "Do not answer lower-priority topics first."
        ],
        executive: {
          contractGoal: "Protect immediate safety.",
          contractObstacle: "Lower-priority interpretation may distract from urgent safety.",
          contractNextAction: "Give immediate safety guidance.",
          contractCompletionCriteria: "User receives clear safety next step."
        },
        mouthDirective: {
          opening: "Lead with immediate safety."
        }
      },

      medical_body: {
        authority: "absolute",
        responseShape: "body_truth_then_action",
        deferred: ["builder", "teacher", "wisdom", "career", "financial", "life_chapter"],
        blocked: ["life_chapter", "deep_emotion", "wisdom"],
        responseRules: ["medical_first"],
        requiredBehaviors: [
          "Lead with medical/body boundary.",
          "State when urgent care or medical contact is needed.",
          "Use calm direct language."
        ],
        forbiddenBehaviors: [
          "Do not interpret emotionally before medical safety.",
          "Do not over-reflect.",
          "Do not use generic uncertainty recovery questions."
        ],
        executive: {
          contractGoal: "Stabilize body or medical risk before interpretation.",
          contractObstacle: "Emotional or philosophical interpretation could delay care.",
          contractNextAction: "Give calm medical boundary and next step.",
          contractCompletionCriteria: "User knows whether urgent care/medical contact is needed."
        },
        mouthDirective: {
          opening: "Lead with medical boundary and next step."
        }
      },

      medical_context: {
        authority: "strong",
        responseShape: "medical_context_then_next_step",
        brief: ["emotion"],
        blocked: ["life_chapter", "deep_emotion"],
        responseRules: ["medical_context_without_escalation", "legacy_systems_support_only"],
        requiredBehaviors: [
          "Treat medical context as important but not automatically urgent.",
          "Give practical next step.",
          "Name red flags only if useful."
        ],
        forbiddenBehaviors: [
          "Do not escalate without red flags.",
          "Do not use generic uncertainty recovery questions.",
          "Do not frame medical context as a life chapter."
        ],
        executive: {
          contractGoal: "Help user make a safe practical decision around non-urgent medical context.",
          contractObstacle: "Ari may either over-escalate or under-answer with vague reflection.",
          contractNextAction: "Give calm practical guidance and clear thresholds.",
          contractCompletionCriteria: "User knows what to do next and what would make it urgent."
        },
        mouthDirective: {
          opening: "Answer the medical context first."
        }
      },

      risk_clarification: {
        authority: "absolute",
        responseShape: "risk_clarification_question",
        blocked: ["builder", "teacher", "wisdom", "emotion", "deep_emotion", "life_chapter"],
        responseRules: ["ask_risk_clarification_first"],
        requiredBehaviors: [
          "Ask one direct risk clarification question."
        ],
        forbiddenBehaviors: [
          "Do not assume emergency.",
          "Do not ignore possible risk.",
          "Do not answer unrelated lanes yet."
        ],
        executive: {
          contractGoal: "Clarify ambiguous risk before normal response.",
          contractObstacle: "Assuming too much or ignoring risk could both be unsafe.",
          contractNextAction: "Ask one direct safety clarification question.",
          contractCompletionCriteria: "Risk ambiguity is reduced."
        },
        mouthDirective: {
          opening: "Ask one safety clarification question."
        }
      },

      builder: {
        authority: "strong",
        responseShape: "build_steps",
        brief: ["emotion"],
        deferred: ["wisdom", "life_chapter", "deep_emotion"],
        blocked: ["life_chapter", "deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: [
          "Give concrete technical next steps.",
          "Ask for code/error only if exact fix requires it."
        ],
        forbiddenBehaviors: [
          "Do not use generic emotional recovery questions.",
          "Do not frame debugging as a life chapter.",
          "Do not ask wisdom questions before helping build."
        ],
        executive: {
          contractGoal: "Help the user build, debug, or implement.",
          contractObstacle: "Legacy uncertainty or life-chapter systems may over-reflect.",
          contractNextAction: "Give concrete steps, code guidance, or request the exact code/error needed.",
          contractCompletionCriteria: "User has a next technical action."
        },
        mouthDirective: {
          opening: "Answer with build/debug help first."
        }
      },

      teacher: {
        authority: "strong",
        responseShape: "clear_explanation",
        brief: ["emotion"],
        deferred: ["wisdom", "life_chapter", "deep_emotion"],
        blocked: ["deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: [
          "Teach directly first.",
          "Explain clearly with simple structure."
        ],
        forbiddenBehaviors: [
          "Do not ask vague uncertainty questions before teaching.",
          "Do not over-reflect."
        ],
        executive: {
          contractGoal: "Explain the topic clearly.",
          contractObstacle: "Emotional or uncertainty systems may ask instead of teaching.",
          contractNextAction: "Give a direct explanation with simple structure.",
          contractCompletionCriteria: "User understands the topic better."
        },
        mouthDirective: {
          opening: "Teach directly first."
        }
      },

      executive_decision: {
        authority: "strong",
        responseShape: "prioritize_then_plan",
        brief: ["emotion"],
        deferred: ["life_chapter", "deep_emotion"],
        blocked: ["deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: [
          "Name the priority.",
          "Give the next step.",
          "Separate primary from secondary concerns."
        ],
        forbiddenBehaviors: [
          "Do not treat all concerns as equal.",
          "Do not ask generic recovery questions."
        ],
        executive: {
          contractGoal: "Create priority and decision structure.",
          contractObstacle: "Too many competing lanes may blur the next move.",
          contractNextAction: "Organize options and name the next step.",
          contractCompletionCriteria: "User knows what to do first."
        },
        mouthDirective: {
          opening: "Organize the decision first."
        }
      },

      wisdom: {
        authority: "normal",
        responseShape: "principle_then_choice",
        brief: ["emotion"],
        requiredBehaviors: [
          "Name the tension.",
          "Name the principle that should lead.",
          "Give a grounded choice."
        ],
        forbiddenBehaviors: [
          "Do not become vague or mystical.",
          "Do not ignore practical consequences."
        ],
        executive: {
          contractGoal: "Clarify the principle that should lead.",
          contractObstacle: "Competing values may create overthinking.",
          contractNextAction: "Name the tension and the ordering principle.",
          contractCompletionCriteria: "User sees the wiser direction."
        },
        mouthDirective: {
          opening: "Name the principle first."
        }
      },

      emotion: {
        authority: "normal",
        responseShape: "comfort_then_truth",
        support: ["truth"],
        requiredBehaviors: [
          "Validate without overdoing it.",
          "Name the emotional signal.",
          "Ground the user."
        ],
        forbiddenBehaviors: [
          "Do not replace action with emotional reflection when action is requested."
        ],
        executive: {
          contractGoal: "Restore emotional grounding and connection.",
          contractObstacle: "Advice may land poorly before the feeling is named.",
          contractNextAction: "Validate, name the emotional signal, then ground.",
          contractCompletionCriteria: "User feels understood and steadier."
        },
        mouthDirective: {
          opening: "Start with emotional grounding."
        }
      },

      memory: {
        authority: "strong",
        responseShape: "acknowledge_memory_request",
        blocked: ["deep_emotion", "life_chapter"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: [
          "Acknowledge the memory or preference request directly."
        ],
        forbiddenBehaviors: [
          "Do not answer around the memory request."
        ],
        executive: {
          contractGoal: "Acknowledge or apply memory preference.",
          contractObstacle: "The system may answer content while missing the memory request.",
          contractNextAction: "Acknowledge the memory/update request.",
          contractCompletionCriteria: "Preference is handled clearly."
        },
        mouthDirective: {
          opening: "Acknowledge the memory request."
        }
      },

      general_understanding: {
        authority: "normal",
        responseShape: "standard",
        requiredBehaviors: [
          "Answer directly or ask one useful clarifying question."
        ],
        forbiddenBehaviors: [
          "Do not over-interpret weak signals."
        ],
        executive: {
          contractGoal: "Understand and respond normally.",
          contractObstacle: "Signal may be broad or under-specified.",
          contractNextAction: "Answer directly or ask one useful clarifying question.",
          contractCompletionCriteria: "User gets useful clarity."
        },
        mouthDirective: {
          opening: "Answer normally."
        }
      }
    };

    return profiles[lane] || profiles.general_understanding;
  },

  cleanContract(contract) {
    contract.primary = contract.primary || "general_understanding";

    contract.support = this.cleanLaneList(contract.support, contract.primary);
    contract.brief = this.cleanLaneList(contract.brief, contract.primary);
    contract.context = this.cleanLaneList(contract.context, contract.primary);
    contract.deferred = this.cleanLaneList(contract.deferred, contract.primary);
    contract.blocked = this.cleanLaneList(contract.blocked, contract.primary);

    contract.responseRules = this.cleanList(contract.responseRules);
    contract.requiredBehaviors = this.cleanList(contract.requiredBehaviors);
    contract.forbiddenBehaviors = this.cleanList(contract.forbiddenBehaviors);
    contract.reasons = this.cleanList(contract.reasons);

    contract.mouthDirective.required = this.cleanList(contract.mouthDirective.required);
    contract.mouthDirective.avoid = this.cleanList(contract.mouthDirective.avoid);
    contract.mouthDirective.order = this.cleanList(contract.mouthDirective.order);

    if (!contract.responseShape) {
      contract.responseShape = "standard";
    }
  },

  add(list, item) {
    if (Array.isArray(list) && item && !list.includes(item)) {
      list.push(item);
    }
  },

  addMany(list, items = []) {
    if (!Array.isArray(items)) return;
    items.forEach(item => this.add(list, item));
  },

  cleanList(list = []) {
    return [...new Set((list || []).filter(Boolean))];
  },

  cleanLaneList(list = [], primary = null) {
    return this.cleanList(list).filter(lane => lane && lane !== primary);
  }
};