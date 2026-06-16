// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide response order/format only.
// V4.1.0

window.Ari = window.Ari || {};

window.AriMouthDirector = {
  version: "4.1.0",

  direct(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      "general_understanding";

    const pattern = this.patternFromPrimary(primary, contract);
    const order = this.orderFromContract(contract, primary);

    const director = {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      source: "ari-mouth-director",

      mouthAuthority: "structure_only",

      contractPrimary: primary,
      responsePattern: pattern,
      responseShape: contract.responseShape || pattern,

      sectionOrder: order,
      maxBodySections: this.maxSections(primary, language),

      openingStyle: language.openingStyle || "direct",
      closingStyle: language.closingStyle || "optional",
      pace: language.pace || "normal",
      depth: language.depth || "practical",

      formatHints: this.formatHints(primary),
      styleRules: this.styleRules(primary),

compressionDirective: {
  enabled: true,
  preserve: [
    "recommendation",
    "known_inferred_unknown",
    "key_reason",
    "key_tradeoff",
    "rejected_alternatives",
    "next_step"
  ],
  maxSections: primary === "executive_decision" ? 5 : 3,
  maxBulletsPerSection: primary === "executive_decision" ? 4 : 3,
  style: "tight_but_complete"
},
      contractRequired: contract.mouthDirective?.required || [],
      contractAvoid: contract.mouthDirective?.avoid || [],
      contractClosing: contract.mouthDirective?.closing || null,

      // Backward compatibility only.
      // Composer V4 should not treat these as authority.
      allowMeaning: true,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: true,
      allowAction: true,
      askBeforeTeaching: primary === "risk_clarification",

      mouthRules: [
        "Situation Contract decides what must happen.",
        "Human Language Engine decides how Ari should sound.",
        "Mouth Director decides only order, format, and pacing.",
        "Mouth Director cannot block content lanes.",
        "Mouth Director cannot change the primary lane."
      ]
    };

    return director;
  },

  patternFromPrimary(primary, contract = {}) {
    if (contract.responseShape) return contract.responseShape;

    const map = {
      safety: "urgent_safety",
      risk_clarification: "risk_clarification_question",
      medical_body: "body_truth_then_action",
      medical_context: "medical_context_then_next_step",
      builder: "build_steps",
      teacher: "clear_explanation",
      executive_decision: "prioritize_then_plan",
      emotion: "comfort_then_truth",
      family: "family_truth_then_next_step",
      relationship: "relationship_truth_then_repair",
      wisdom: "principle_then_choice",
      memory: "acknowledge_memory_request",
      general_understanding: "standard"
    };

    return map[primary] || "standard";
  },

  orderFromContract(contract = {}, primary = "general_understanding") {
    const contractOrder = contract.mouthDirective?.order;

    if (Array.isArray(contractOrder) && contractOrder.length) {
      return contractOrder;
    }

    return [
      primary,
      ...(contract.support || []),
      ...(contract.brief || []).map(lane => `brief_${lane}`),
      ...(contract.context || []).map(lane => `context_${lane}`),
      ...(contract.deferred || []).map(lane => `defer_${lane}`)
    ].filter(Boolean);
  },

  maxSections(primary, language = {}) {
    if (Number.isFinite(Number(language.maxBodySections))) {
      return Number(language.maxBodySections);
    }

    const map = {
      safety: 2,
      risk_clarification: 1,
      medical_body: 2,
      medical_context: 3,
      builder: 4,
      teacher: 3,
      executive_decision: 4,
      emotion: 3,
      family: 4,
      relationship: 3,
      wisdom: 4,
      memory: 1,
      general_understanding: 3
    };

    return map[primary] || 3;
  },

  formatHints(primary) {
    const map = {
      safety: [
        "Immediate safety step first.",
        "Short direct response."
      ],
      risk_clarification: [
        "One clear question only."
      ],
      medical_body: [
        "Medical/body boundary first.",
        "Then practical next step."
      ],
      medical_context: [
        "Medical context first.",
        "Then practical next step.",
        "Brief red flags if useful."
      ],
      builder: [
        "Give concrete steps.",
        "Use code or replacement instructions when possible."
      ],
      teacher: [
        "Explain directly.",
        "Use simple structure."
      ],
      executive_decision: [
        "Name priority.",
        "Organize options.",
        "Give next step."
      ],
      emotion: [
        "Brief attunement.",
        "Then grounding or truth."
      ],
      wisdom: [
        "Name principle.",
        "Name tradeoff.",
        "Clarify choice."
      ]
    };

    return map[primary] || ["Answer directly."];
  },

  styleRules(primary) {
    const shared = [
      "Do not invent a deeper signal.",
      "Do not use generic uncertainty questions.",
      "Do not override the Situation Contract."
    ];

    const map = {
      medical_context: [
        "Do not escalate without red flags.",
        "Do not frame medical context as a life chapter."
      ],
      builder: [
        "Do not over-reflect.",
        "Do not ask vague emotional questions."
      ],
      teacher: [
        "Do not ask before teaching unless clarity is required."
      ],
      safety: [
        "No philosophy.",
        "No humor.",
        "No life-chapter framing."
      ],
      risk_clarification: [
        "No extra explanation.",
        "No lower-priority lanes."
      ]
    };

    return [...(map[primary] || []), ...shared];
  }
};