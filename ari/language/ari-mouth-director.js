// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide response order/format only.
// V4.2.0 — Communication Plan + Compression Directive

window.Ari = window.Ari || {};

window.AriMouthDirector = {
  version: "4.2.0",

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
    const communicationPlan = this.buildCommunicationPlan(primary, contract, language);

    const director = {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      source: "ari-mouth-director",

      mouthAuthority: "communication_plan_only",

      contractPrimary: primary,
      responsePattern: pattern,
      responseShape: contract.responseShape || pattern,

      sectionOrder: order,
      maxBodySections: communicationPlan.compression.maxSections,

      openingStyle: language.openingStyle || "direct",
      closingStyle: language.closingStyle || "optional",
      pace: language.pace || "normal",
      depth: language.depth || "practical",

      formatHints: this.formatHints(primary),
      styleRules: this.styleRules(primary),

      communicationPlan,
      compressionDirective: communicationPlan.compression,

      contractRequired: contract.mouthDirective?.required || [],
      contractAvoid: contract.mouthDirective?.avoid || [],
      contractClosing: contract.mouthDirective?.closing || null,

      // Backward compatibility only.
      allowMeaning: true,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: true,
      allowAction: true,
      askBeforeTeaching: primary === "risk_clarification",

      mouthRules: [
        "Situation Contract decides what must happen.",
        "Human Language Engine decides how Ari should sound.",
        "Mouth Director decides communication plan, order, format, and pacing.",
        "Mouth Director cannot change the primary lane.",
        "Mouth Director cannot override the Situation Contract.",
        "Compressor may shorten wording but must preserve the communication plan."
      ]
    };

    return director;
  },

  buildCommunicationPlan(primary, contract = {}, language = {}) {
    const preserveMap = {
      executive_decision: [
        "recommendation",
        "known_facts",
        "inferences",
        "unknowns",
        "key_reason",
        "key_tradeoff",
        "rejected_alternatives",
        "next_step"
      ],

      safety: [
        "urgent_action",
        "safety_boundary",
        "next_step"
      ],

      risk_clarification: [
        "single_clarifying_question"
      ],

      medical_body: [
        "medical_boundary",
        "practical_action",
        "red_flags"
      ],

      medical_context: [
        "medical_context",
        "practical_action",
        "red_flags"
      ],

      builder: [
        "direct_fix",
        "replacement_code",
        "implementation_step",
        "test_step"
      ],

      teacher: [
        "direct_answer",
        "plain_explanation",
        "example"
      ],

      emotion: [
        "brief_attunement",
        "grounding_truth",
        "practical_support"
      ],

      family: [
        "family_priority",
        "boundary",
        "next_step"
      ],

      relationship: [
        "relationship_truth",
        "repair_move",
        "next_step"
      ],

      wisdom: [
        "principle",
        "tradeoff",
        "choice"
      ],

      memory: [
        "acknowledgement"
      ],

      general_understanding: [
        "direct_answer"
      ]
    };

    const preserve = preserveMap[primary] || preserveMap.general_understanding;

    const required = preserve.filter(item =>
      [
        "recommendation",
        "direct_answer",
        "direct_fix",
        "urgent_action",
        "single_clarifying_question",
        "next_step"
      ].includes(item)
    );

    const optional = preserve.filter(item => !required.includes(item));

    const maxSections =
      Number.isFinite(Number(language.maxBodySections))
        ? Number(language.maxBodySections)
        : primary === "executive_decision"
          ? 6
          : this.maxSections(primary, language);

    const maxBulletsPerSection =
      primary === "executive_decision" ? 4 : 3;

    return {
      source: "ari-mouth-director",
      primary,
      preserve,
      required,
      optional,

      suppress: [
        ...(contract.blocked || []),
        ...(contract.mouthDirective?.avoid || [])
      ],

      merge: [
        ["key_reason", "key_tradeoff"],
        ["medical_context", "practical_action"],
        ["brief_attunement", "grounding_truth"]
      ],

      compression: {
        enabled: true,
        preserve,
        required,
        maxSections,
        maxBulletsPerSection,
        style: "tight_but_complete"
      }
    };
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
      executive_decision: 6,
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
        "Give next step.",
        "Preserve known, inferred, unknown, rejected alternatives."
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
      "Do not override the Situation Contract.",
      "Do not expose internal system names in the final response."
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
      ],
      executive_decision: [
        "Do not treat all concerns as equal.",
        "Do not over-explain when the user asked for concise.",
        "Preserve the recommendation and next step."
      ]
    };

    return [...(map[primary] || []), ...shared];
  }
};