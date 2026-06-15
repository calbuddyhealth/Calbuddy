// ari/language/ari-mouth-director.js
// Ari Mouth Director
// Purpose: Decide HOW Ari communicates, not WHAT Ari is allowed to say.
// V4.0.0
// Core rule:
// - Situation Contract is authoritative.
// - Mouth Director has no executive authority.
// - Mouth Director cannot change primary/support/brief/context/deferred lanes.
// - Mouth Director cannot block truth/action/wisdom/emotion/meaning.
// - Composer must obey Situation Contract first, then use Mouth Director only for style/format.

window.Ari = window.Ari || {};

window.AriMouthDirector = {
  version: "4.0.0",

  direct(summary = {}) {
    const contract = summary.situationContract || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      null;

    const responseShape =
      summary.responseShape ||
      contract.responseShape ||
      "standard";

    const safetyRiskLevel =
      summary.safetyRiskLevel ||
      summary.safetyContextGate?.riskLevel ||
      summary.riskLevel ||
      contract.risk?.level ||
      "none";

    const clarityNeeded =
      summary.safetyFollowUpNeeded === true ||
      contract.clarity?.needed === true ||
      primary === "risk_clarification";

    const base = this.baseDirector({
      primary,
      responseShape,
      safetyRiskLevel,
      contract,
      clarityNeeded
    });

    if (clarityNeeded) {
      return this.riskClarification(base, contract);
    }

    if (primary === "safety") {
      return this.safety(base);
    }

    if (primary === "medical_body") {
      return this.medicalBody(base);
    }

    if (primary === "medical_context") {
      return this.medicalContext(base);
    }

    if (primary === "builder") {
      return this.builder(base);
    }

    if (primary === "teacher") {
      return this.teacher(base);
    }

    if (primary === "executive_decision") {
      return this.executiveDecision(base);
    }

    if (primary === "emotion") {
      return this.emotion(base);
    }

    if (primary === "family") {
      return this.family(base);
    }

    if (primary === "relationship") {
      return this.relationship(base);
    }

    if (primary === "wisdom") {
      return this.wisdom(base);
    }

    if (primary === "memory") {
      return this.memory(base);
    }

    return this.general(base);
  },

  baseDirector({ primary, responseShape, safetyRiskLevel, contract, clarityNeeded }) {
    return {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      source: "ari-mouth-director",

      contractPrimary: primary,
      responseShape,
      safetyRiskLevel,

      responsePattern: responseShape || "standard",
      explanationLevel: "standard",
      maxBodySections: 3,

      tone: "calm",
      pace: "normal",
      directness: "medium",
      warmth: "medium",

      formatHints: [],
      styleRules: [],

      contractOrder:
        contract.mouthDirective?.order ||
        [
          primary,
          ...(contract.support || []),
          ...(contract.brief || []).map(lane => `brief_${lane}`),
          ...(contract.context || []).map(lane => `context_${lane}`),
          ...(contract.deferred || []).map(lane => `defer_${lane}`)
        ].filter(Boolean),

      contractRequired: contract.mouthDirective?.required || [],
      contractAvoid: contract.mouthDirective?.avoid || [],
      contractClosing: contract.mouthDirective?.closing || null,

      // Backward compatibility only.
      // These are NOT permission gates anymore.
      // Composer should stop using these as authority.
      allowMeaning: true,
      allowEmotion: true,
      allowTruth: true,
      allowWisdom: true,
      allowAction: true,
      askBeforeTeaching: false,

      mouthAuthority: "style_only",

      mouthRules: [
        "Situation Contract is authoritative.",
        "Mouth Director controls style and format only.",
        "Mouth Director must not change primary/support/brief/context/deferred lanes.",
        "Mouth Director must not suppress content lanes.",
        "Composer must obey Situation Contract before Mouth Director."
      ]
    };
  },

  riskClarification(base, contract = {}) {
    return {
      ...base,
      responsePattern: "risk_clarification_question",
      explanationLevel: "minimal",
      maxBodySections: 1,
      tone: "calm",
      pace: "slow",
      directness: "high",
      warmth: "low",
      formatHints: [
        "Ask one direct risk clarification question.",
        "Do not add extra interpretation."
      ],
      styleRules: [
        "Use one clear question.",
        "Avoid long explanation."
      ],
      contractClosing:
        contract.clarity?.question ||
        base.contractClosing ||
        "Are you safe right now?"
    };
  },

  safety(base) {
    return {
      ...base,
      responsePattern: "urgent_safety",
      explanationLevel: "minimal",
      maxBodySections: 2,
      tone: "steady",
      pace: "slow",
      directness: "high",
      warmth: "low",
      formatHints: [
        "Lead with immediate safety.",
        "Use short direct steps."
      ],
      styleRules: [
        "No philosophy.",
        "No life-chapter framing.",
        "No over-explaining."
      ]
    };
  },

  medicalBody(base) {
    return {
      ...base,
      responsePattern: "body_truth_then_action",
      explanationLevel: "minimal",
      maxBodySections: 2,
      tone: "calm",
      pace: "slow",
      directness: "high",
      warmth: "low",
      formatHints: [
        "Lead with medical/body priority.",
        "Give practical next step.",
        "State urgent thresholds if needed."
      ],
      styleRules: [
        "Do not emotionally interpret before medical guidance.",
        "Do not over-reflect."
      ]
    };
  },

  medicalContext(base) {
    return {
      ...base,
      responsePattern: "medical_context_then_next_step",
      explanationLevel: "minimal",
      maxBodySections: 3,
      tone: "calm",
      pace: "normal",
      directness: "high",
      warmth: "medium",
      formatHints: [
        "Treat medical context as important but not automatically urgent.",
        "Give practical next step.",
        "Name red flags briefly if useful."
      ],
      styleRules: [
        "Do not escalate without red flags.",
        "Do not use generic uncertainty recovery questions.",
        "Do not frame medical context as a life chapter."
      ]
    };
  },

  builder(base) {
    return {
      ...base,
      responsePattern: "build_steps",
      explanationLevel: "clear",
      maxBodySections: 4,
      tone: "practical",
      pace: "normal",
      directness: "high",
      warmth: "low",
      formatHints: [
        "Give concrete steps.",
        "Use exact replacement instructions when possible.",
        "Ask for code/error only if needed."
      ],
      styleRules: [
        "Do not over-reflect.",
        "Do not use life-chapter framing.",
        "Do not ask vague emotional questions."
      ]
    };
  },

  teacher(base) {
    return {
      ...base,
      responsePattern: "clear_explanation",
      explanationLevel: "clear",
      maxBodySections: 3,
      tone: "clear",
      pace: "normal",
      directness: "medium",
      warmth: "medium",
      formatHints: [
        "Explain directly.",
        "Use simple structure.",
        "Give example if useful."
      ],
      styleRules: [
        "Do not ask before teaching unless the contract asks for clarity."
      ]
    };
  },

  executiveDecision(base) {
    return {
      ...base,
      responsePattern: "prioritize_then_plan",
      explanationLevel: "standard",
      maxBodySections: 4,
      tone: "grounded",
      pace: "normal",
      directness: "high",
      warmth: "medium",
      formatHints: [
        "Name the priority.",
        "Separate primary from secondary issues.",
        "Give the next step."
      ],
      styleRules: [
        "Do not treat all lanes as equal."
      ]
    };
  },

  emotion(base) {
    return {
      ...base,
      responsePattern: "comfort_then_truth",
      explanationLevel: "minimal",
      maxBodySections: 3,
      tone: "warm",
      pace: "slow",
      directness: "medium",
      warmth: "high",
      formatHints: [
        "Name the emotional signal.",
        "Ground gently.",
        "Avoid over-analysis."
      ],
      styleRules: [
        "Do not rush into advice."
      ]
    };
  },

  family(base) {
    return {
      ...base,
      responsePattern: "family_truth_then_next_step",
      explanationLevel: "standard",
      maxBodySections: 4,
      tone: "protective",
      pace: "normal",
      directness: "high",
      warmth: "high",
      formatHints: [
        "Name what needs protection.",
        "Give one stabilizing next step."
      ],
      styleRules: [
        "Avoid generic motivation."
      ]
    };
  },

  relationship(base) {
    return {
      ...base,
      responsePattern: "relationship_truth_then_repair",
      explanationLevel: "standard",
      maxBodySections: 3,
      tone: "warm",
      pace: "slow",
      directness: "medium",
      warmth: "high",
      formatHints: [
        "Name the relationship truth.",
        "Offer one repair move."
      ],
      styleRules: [
        "Do not turn relationship pain into abstract analysis."
      ]
    };
  },

  wisdom(base) {
    return {
      ...base,
      responsePattern: "principle_then_choice",
      explanationLevel: "deep",
      maxBodySections: 4,
      tone: "reflective",
      pace: "slow",
      directness: "medium",
      warmth: "medium",
      formatHints: [
        "Name the principle.",
        "Name the tradeoff.",
        "Help choose what should lead."
      ],
      styleRules: [
        "Do not become vague or mystical."
      ]
    };
  },

  memory(base) {
    return {
      ...base,
      responsePattern: "acknowledge_memory_request",
      explanationLevel: "minimal",
      maxBodySections: 1,
      tone: "simple",
      pace: "normal",
      directness: "high",
      warmth: "medium",
      formatHints: [
        "Acknowledge the memory/preference action clearly."
      ],
      styleRules: [
        "Do not over-explain."
      ]
    };
  },

  general(base) {
    return {
      ...base,
      responsePattern: base.responseShape || "standard",
      explanationLevel: "standard",
      maxBodySections: 3,
      tone: "balanced",
      pace: "normal",
      directness: "medium",
      warmth: "medium",
      formatHints: [
        "Answer normally.",
        "Use the Situation Contract order if present."
      ],
      styleRules: [
        "Do not invent a deeper signal when the contract does not require one."
      ]
    };
  }
};