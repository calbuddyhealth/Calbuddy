// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Format, order, pacing, and compression limits only.
// V4.3.0 — Pure Delivery Director

window.Ari = window.Ari || {};

window.AriMouthDirector = {
  version: "4.3.0",

  direct(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const communicationPlan = summary.communicationPlan || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      communicationPlan.primary ||
      "general_understanding";

    const responseShape =
      contract.responseShape ||
      communicationPlan.responseShape ||
      this.patternFromPrimary(primary);

    const sectionOrder =
      communicationPlan.sectionOrder ||
      this.orderFromContract(contract, primary);

    const maxBodySections = this.maxSections(primary, language, communicationPlan);
    const maxBulletsPerSection = this.maxBullets(primary, communicationPlan);

    return {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      source: "ari-mouth-director",

      // Mouth does NOT decide truth, priority, recommendation, or meaning.
      mouthAuthority: "delivery_only",

      contractPrimary: primary,
      responseShape,
      responsePattern: responseShape,

      sectionOrder,
      maxBodySections,
      maxBulletsPerSection,

      openingStyle: language.openingStyle || "direct",
      closingStyle: language.closingStyle || "optional",
      pace: language.pace || "normal",
      depth: language.depth || "practical",

      formatHints: this.formatHints(primary),
      styleRules: this.styleRules(primary),

      compressionDirective: {
        enabled: true,
        maxSections: maxBodySections,
        maxBulletsPerSection,
        style: this.compressionStyle(primary, language),
        preserve:
          communicationPlan.preserve ||
          contract.responseRequirements ||
          []
      },

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
        "Mouth Director controls delivery only.",
        "Do not decide the recommendation.",
        "Do not decide the priority.",
        "Do not change the primary lane.",
        "Do not override Situation Contract.",
        "Do not override Communication Planner.",
        "Do not expose internal system names.",
        "Composer writes naturally.",
        "Compressor may shorten but must preserve required content."
      ]
    };
  },

  patternFromPrimary(primary) {
    const map = {
      safety: "urgent_safety",
      risk_clarification: "one_question_only",
      medical_body: "body_truth_then_action",
      medical_context: "medical_context_then_next_step",
      builder: "steps_or_code_first",
      teacher: "clear_explanation",
      executive_decision: "recommendation_then_reasoning",
      emotion: "attune_then_ground",
      family: "priority_then_boundary",
      relationship: "truth_then_repair",
      wisdom: "principle_then_choice",
      memory: "acknowledge_only",
      general_understanding: "direct_answer"
    };

    return map[primary] || "direct_answer";
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

  maxSections(primary, language = {}, communicationPlan = {}) {
    if (Number.isFinite(Number(language.maxBodySections))) {
      return Number(language.maxBodySections);
    }

    if (Number.isFinite(Number(communicationPlan.maxSections))) {
      return Number(communicationPlan.maxSections);
    }

    const map = {
      safety: 2,
      risk_clarification: 1,
      medical_body: 2,
      medical_context: 3,
      builder: 4,
      teacher: 3,
      executive_decision: 5,
      emotion: 3,
      family: 4,
      relationship: 3,
      wisdom: 4,
      memory: 1,
      general_understanding: 3
    };

    return map[primary] || 3;
  },

  maxBullets(primary, communicationPlan = {}) {
    if (Number.isFinite(Number(communicationPlan.maxBulletsPerSection))) {
      return Number(communicationPlan.maxBulletsPerSection);
    }

    const map = {
      executive_decision: 3,
      builder: 5,
      teacher: 4,
      medical_context: 3,
      general_understanding: 3
    };

    return map[primary] || 3;
  },

  compressionStyle(primary, language = {}) {
    if (language.compressionStyle) return language.compressionStyle;

    if (primary === "executive_decision") return "tight_but_complete";
    if (primary === "safety") return "short_direct";
    if (primary === "risk_clarification") return "one_question";
    if (primary === "emotion") return "brief_warm";
    if (primary === "builder") return "practical_steps";

    return "clean_concise";
  },

  formatHints(primary) {
    const map = {
      safety: [
        "Put immediate action first.",
        "Keep it short."
      ],
      risk_clarification: [
        "Ask one clear question only."
      ],
      medical_body: [
        "State boundary first.",
        "Give practical next step."
      ],
      medical_context: [
        "Use medical context briefly.",
        "Avoid unnecessary escalation."
      ],
      builder: [
        "Give concrete steps.",
        "Use replacement code when useful."
      ],
      teacher: [
        "Explain plainly.",
        "Use simple structure."
      ],
      executive_decision: [
        "Recommendation first.",
        "Then known/inferred/unknown if requested.",
        "Rejected alternatives only if requested.",
        "Next step near the end."
      ],
      emotion: [
        "Brief attunement.",
        "Then grounding truth."
      ],
      relationship: [
        "Name the truth.",
        "Offer repair move."
      ],
      wisdom: [
        "Name principle.",
        "Name choice."
      ]
    };

    return map[primary] || ["Answer directly."];
  },

  styleRules(primary) {
    const shared = [
      "Do not invent meaning.",
      "Do not add generic reflection questions.",
      "Do not expose system names.",
      "Do not over-explain.",
      "Do not change the recommendation."
    ];

    const map = {
      safety: [
        "No humor.",
        "No philosophy.",
        "No life-chapter language."
      ],
      risk_clarification: [
        "One question only.",
        "No extra sections."
      ],
      builder: [
        "No emotional over-reflection.",
        "Prioritize usable action."
      ],
      teacher: [
        "Do not ask before teaching unless clarity is required."
      ],
      executive_decision: [
        "Do not treat all concerns as equal.",
        "Do not bury the recommendation.",
        "Keep the answer structured but natural."
      ],
      medical_context: [
        "Do not escalate without red flags.",
        "Do not frame medical context as identity or meaning."
      ]
    };

    return [...(map[primary] || []), ...shared];
  }
};