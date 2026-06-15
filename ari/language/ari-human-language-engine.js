// ari/language/ari-human-language-engine.js
// Ari Human Language Engine
// Purpose: Decide how Ari should SOUND as a human communicator.
// V1.0.0
//
// Role:
// - Does NOT decide the response lane.
// - Does NOT override Situation Contract.
// - Does NOT write the final response.
// - Produces a humanLanguageProfile for Composer V4.
//
// Chain:
// Situation Contract -> Human Language Engine -> Mouth Director -> Composer

window.Ari = window.Ari || {};

window.AriHumanLanguageEngine = {
  version: "1.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      "general_understanding";

    const risk = contract.risk || {};
    const clarity = contract.clarity || {};

    const profile = this.baseProfile(primary);

    this.applyContractContext(profile, contract, risk, clarity);
    this.applyDomainProfile(profile, primary, summary);
    this.applyRiskSafetyRules(profile, primary, risk, clarity);
    this.applyRelationshipMode(profile, summary);
    this.applyUserStyle(profile, summary);
    this.applyValidationRules(profile, primary, summary);
    this.applyHumorRules(profile, primary, risk, summary);
    this.applyProfanityRules(profile, primary, risk, summary);
    this.applyAccountabilityRules(profile, primary, summary);
    this.applyBannedPhrases(profile);
    this.applyPreferredMoves(profile, primary);
    this.applyPolishRules(profile);
    this.finalize(profile);

    return {
      humanLanguageEngineRan: true,
      humanLanguageEngineVersion: this.version,
      source: "ari-human-language-engine",

      humanLanguageProfile: profile,

      humanLanguageDomain: profile.domain,
      humanLanguageTone: profile.tone,
      humanLanguageWarmth: profile.warmth,
      humanLanguageDirectness: profile.directness,
      humanLanguageValidationLevel: profile.validationLevel,
      humanLanguageHumor: profile.humor,
      humanLanguageSarcasm: profile.sarcasm,
      humanLanguageProfanity: profile.profanity,
      humanLanguageChallenge: profile.challenge,
      humanLanguagePreferredMoves: profile.preferredMoves,
      humanLanguageBannedPhrases: profile.bannedPhrases,
      humanLanguageReasons: profile.reasons
    };
  },

  baseProfile(primary = "general_understanding") {
    return {
      domain: primary,

      tone: "balanced",
      voice: "ari",

      warmth: 50,
      directness: 70,
      tenderness: 30,
      bluntness: 30,
      formality: 45,
      professionalism: 55,

      humor: 0,
      sarcasm: 0,
      playfulness: 0,
      profanity: 0,

      validationLevel: "light",
      maxValidationSentences: 1,

      accountability: 0,
      challenge: 0,
      encouragement: 40,

      pace: "normal",
      depth: "practical",
      sentenceStyle: "natural_mixed",

      openingStyle: "direct",
      closingStyle: "optional",

      allowedMoves: [],
      preferredMoves: [],
      bannedMoves: [],
      bannedPhrases: [],
      preferredPhrases: [],

      safety: {
        humorAllowed: true,
        sarcasmAllowed: true,
        profanityAllowed: true,
        challengeAllowed: true,
        validationAllowed: true
      },

      polish: {
        noSystemLanguage: true,
        noGenericTherapyVoice: true,
        noFakeCertainty: true,
        noRambling: true,
        noOverValidation: true,
        preferSpecificNextStep: true,
        preferConcreteLanguage: true,
        preferNaturalContractions: true
      },

      reasons: []
    };
  },

  applyContractContext(profile, contract = {}, risk = {}, clarity = {}) {
    profile.contractPrimary = contract.primary || profile.domain;
    profile.contractAuthority = contract.authority || "normal";
    profile.responseShape = contract.responseShape || "standard";

    if (clarity.needed) {
      profile.tone = "clear_direct";
      profile.directness = 95;
      profile.warmth = 25;
      profile.validationLevel = "none";
      profile.maxValidationSentences = 0;
      profile.preferredMoves.push("ask_one_clear_question");
      profile.bannedMoves.push("explain_before_clarifying");
      profile.reasons.push("Contract requires clarification, so language should be direct and minimal.");
    }

    if (contract.authority === "absolute") {
      profile.formality = Math.max(profile.formality, 75);
      profile.professionalism = Math.max(profile.professionalism, 90);
      profile.reasons.push("Absolute contract authority requires controlled language.");
    }
  },

  applyDomainProfile(profile, primary, summary = {}) {
    const domain = primary || "general_understanding";

    const profiles = {
      safety: {
        tone: "urgent_calm",
        warmth: 30,
        directness: 100,
        tenderness: 20,
        bluntness: 75,
        formality: 80,
        professionalism: 95,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        accountability: 0,
        challenge: 0,
        pace: "fast",
        depth: "minimal",
        openingStyle: "urgent_direct",
        closingStyle: "safety_next_step"
      },

      risk_clarification: {
        tone: "calm_direct",
        warmth: 20,
        directness: 100,
        formality: 80,
        professionalism: 95,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        pace: "slow",
        depth: "minimal",
        openingStyle: "no_opening",
        closingStyle: "question_only"
      },

      medical_body: {
        tone: "calm_medical",
        warmth: 45,
        directness: 95,
        tenderness: 25,
        bluntness: 55,
        formality: 75,
        professionalism: 95,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "light",
        pace: "calm",
        depth: "practical",
        openingStyle: "medical_first",
        closingStyle: "red_flags_or_next_step"
      },

      medical_context: {
        tone: "calm_direct",
        warmth: 45,
        directness: 90,
        tenderness: 25,
        bluntness: 45,
        formality: 65,
        professionalism: 90,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "light",
        pace: "calm",
        depth: "practical",
        openingStyle: "answer_first",
        closingStyle: "practical_next_step"
      },

      builder: {
        tone: "developer_direct",
        warmth: 20,
        directness: 95,
        tenderness: 5,
        bluntness: 60,
        formality: 35,
        professionalism: 70,
        humor: 20,
        sarcasm: 10,
        profanity: 0,
        validationLevel: "none",
        accountability: 20,
        challenge: 20,
        pace: "efficient",
        depth: "technical",
        openingStyle: "skip_fluff",
        closingStyle: "next_code_step"
      },

      teacher: {
        tone: "clear_teacher",
        warmth: 30,
        directness: 85,
        tenderness: 10,
        bluntness: 35,
        formality: 45,
        professionalism: 80,
        humor: 5,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        pace: "clear",
        depth: "educational",
        openingStyle: "answer_first",
        closingStyle: "optional_example"
      },

      executive_decision: {
        tone: "advisor_direct",
        warmth: 35,
        directness: 92,
        tenderness: 10,
        bluntness: 65,
        formality: 50,
        professionalism: 80,
        humor: 5,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        accountability: 35,
        challenge: 35,
        pace: "organized",
        depth: "practical",
        openingStyle: "organize_first",
        closingStyle: "next_step"
      },

      emotion: {
        tone: "grounded_warm",
        warmth: 80,
        directness: 60,
        tenderness: 75,
        bluntness: 20,
        formality: 25,
        professionalism: 50,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "moderate",
        accountability: 5,
        challenge: 10,
        pace: "slow",
        depth: "emotional",
        openingStyle: "brief_attunement",
        closingStyle: "grounding_question"
      },

      relationship: {
        tone: "honest_warm",
        warmth: 65,
        directness: 75,
        tenderness: 50,
        bluntness: 35,
        formality: 25,
        professionalism: 55,
        humor: 5,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "light",
        accountability: 30,
        challenge: 35,
        pace: "calm",
        depth: "relational",
        openingStyle: "name_relationship_truth",
        closingStyle: "repair_step"
      },

      family: {
        tone: "protective_warm",
        warmth: 70,
        directness: 80,
        tenderness: 55,
        bluntness: 30,
        formality: 30,
        professionalism: 60,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "light",
        accountability: 35,
        challenge: 30,
        pace: "calm",
        depth: "meaningful_practical",
        openingStyle: "protective_truth",
        closingStyle: "family_next_step"
      },

      wisdom: {
        tone: "wise_direct",
        warmth: 45,
        directness: 80,
        tenderness: 25,
        bluntness: 45,
        formality: 35,
        professionalism: 65,
        humor: 5,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        accountability: 25,
        challenge: 35,
        pace: "measured",
        depth: "principled",
        openingStyle: "principle_first",
        closingStyle: "choice_point"
      },

      memory: {
        tone: "simple_acknowledgment",
        warmth: 30,
        directness: 90,
        tenderness: 5,
        bluntness: 20,
        formality: 35,
        professionalism: 70,
        humor: 0,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "none",
        pace: "brief",
        depth: "minimal",
        openingStyle: "acknowledge",
        closingStyle: "none"
      },

      general_understanding: {
        tone: "balanced",
        warmth: 45,
        directness: 75,
        tenderness: 20,
        bluntness: 35,
        formality: 40,
        professionalism: 60,
        humor: 5,
        sarcasm: 0,
        profanity: 0,
        validationLevel: "light",
        pace: "normal",
        depth: "practical",
        openingStyle: "answer_first",
        closingStyle: "optional"
      }
    };

    const selected = profiles[domain] || profiles.general_understanding;
    Object.assign(profile, selected);

    profile.domain = domain;
    profile.reasons.push(`Applied human language profile for '${domain}'.`);
  },

  applyRiskSafetyRules(profile, primary, risk = {}, clarity = {}) {
    const highRisk =
      ["safety", "medical_body", "risk_clarification"].includes(primary) ||
      ["high", "critical"].includes(risk.level) ||
      Boolean(risk.override);

    const sensitive =
      highRisk ||
      ["medical_context"].includes(primary) ||
      ["safety", "medical", "violence", "abuse", "substance"].includes(risk.type);

    if (sensitive) {
      profile.safety.humorAllowed = false;
      profile.safety.sarcasmAllowed = false;
      profile.safety.profanityAllowed = false;
      profile.humor = 0;
      profile.sarcasm = 0;
      profile.profanity = 0;
      profile.playfulness = 0;
      profile.reasons.push("Sensitive safety/medical context blocks humor, sarcasm, and profanity.");
    }

    if (primary === "risk_clarification") {
      profile.allowedMoves = ["ask_one_clear_question"];
      profile.bannedMoves.push("validate_at_length", "teach", "joke", "philosophize");
    }

    if (primary === "safety") {
      profile.allowedMoves = ["direct_safety_step", "brief_grounding"];
      profile.bannedMoves.push("joke", "philosophize", "deep_reflection", "generic_question");
    }
  },

  applyRelationshipMode(profile, summary = {}) {
    const mode =
      summary.relationshipMode ||
      summary.userRelationshipMode ||
      summary.ariMode ||
      null;

    if (!mode) return;

    profile.relationshipMode = mode;

    if (mode === "developer" || mode === "developer_wonder") {
      profile.directness = Math.max(profile.directness, 90);
      profile.warmth = Math.min(profile.warmth, 35);
      profile.validationLevel = "none";
      profile.preferredMoves.push("show_exact_fix");
      profile.reasons.push("Developer mode favors direct technical usefulness.");
    }

    if (mode === "coach" || mode === "coach_wonder") {
      profile.accountability = Math.max(profile.accountability, 55);
      profile.challenge = Math.max(profile.challenge, 45);
      profile.directness = Math.max(profile.directness, 85);
      profile.preferredMoves.push("call_out_pattern", "give_next_step");
      profile.reasons.push("Coach mode allows accountability and challenge.");
    }

    if (mode === "companion" || mode === "companion_wonder") {
      profile.warmth = Math.max(profile.warmth, 70);
      profile.tenderness = Math.max(profile.tenderness, 55);
      profile.validationLevel = profile.validationLevel === "none" ? "light" : profile.validationLevel;
      profile.reasons.push("Companion mode increases warmth and presence.");
    }

    if (mode === "accountability") {
      profile.accountability = 85;
      profile.challenge = 75;
      profile.bluntness = Math.max(profile.bluntness, 75);
      profile.humor = Math.max(profile.humor, 20);
      profile.reasons.push("Accountability mode allows stronger challenge.");
    }
  },

  applyUserStyle(profile, summary = {}) {
    const ownerStyle =
      summary.ownerStyle ||
      summary.userStyle ||
      {};

    if (ownerStyle.prefersBluntness === true) {
      profile.bluntness = Math.max(profile.bluntness, 65);
      profile.directness = Math.max(profile.directness, 85);
      profile.reasons.push("User preference allows bluntness.");
    }

    if (ownerStyle.prefersHumor === true) {
      profile.humor = Math.max(profile.humor, 15);
      profile.reasons.push("User preference allows humor.");
    }

    if (ownerStyle.prefersProfanity === true) {
      profile.profanity = Math.max(profile.profanity, 10);
      profile.reasons.push("User preference allows light profanity when safe.");
    }

    if (ownerStyle.lowValidation === true) {
      profile.validationLevel = "none";
      profile.maxValidationSentences = 0;
      profile.reasons.push("User preference reduces validation.");
    }
  },

  applyValidationRules(profile, primary, summary = {}) {
    const validationNeededDomains = [
      "emotion",
      "relationship",
      "family"
    ];

    const validationUsuallyBadDomains = [
      "builder",
      "teacher",
      "executive_decision",
      "memory"
    ];

    if (validationUsuallyBadDomains.includes(primary)) {
      profile.validationLevel = "none";
    }

    if (validationNeededDomains.includes(primary) && profile.validationLevel === "none") {
      profile.validationLevel = "light";
    }

    const shameOrFear =
      this.hasAny(summary.normalizedMessage || summary.userMessage || "", [
        "embarrassed",
        "ashamed",
        "worried",
        "scared",
        "afraid",
        "failed",
        "rejected"
      ]);

    if (shameOrFear && !["builder", "teacher", "memory"].includes(primary)) {
      if (profile.validationLevel === "none") profile.validationLevel = "light";
      profile.reasons.push("Shame/fear language allows brief attunement.");
    }

    profile.maxValidationSentences =
      profile.validationLevel === "none" ? 0 :
      profile.validationLevel === "light" ? 1 :
      profile.validationLevel === "moderate" ? 2 :
      3;

    profile.bannedMoves.push("over_validate", "repeat_validation");
  },

  applyHumorRules(profile, primary, risk = {}, summary = {}) {
    const humorSafeDomains = [
      "builder",
      "teacher",
      "executive_decision",
      "general_understanding",
      "wisdom"
    ];

    const humorUnsafeDomains = [
      "safety",
      "medical_body",
      "medical_context",
      "risk_clarification",
      "emotion",
      "relationship",
      "family"
    ];

    if (humorUnsafeDomains.includes(primary)) {
      profile.humor = 0;
      profile.sarcasm = 0;
      profile.playfulness = 0;
      return;
    }

    if (humorSafeDomains.includes(primary)) {
      profile.humor = Math.max(profile.humor, 5);
    }

    if (primary === "builder") {
      profile.humor = Math.max(profile.humor, 20);
      profile.sarcasm = Math.max(profile.sarcasm, 10);
    }

    if (profile.relationshipMode === "accountability") {
      profile.humor = Math.max(profile.humor, 20);
      profile.sarcasm = Math.max(profile.sarcasm, 10);
    }
  },

  applyProfanityRules(profile, primary, risk = {}, summary = {}) {
    const profanityUnsafe =
      ["safety", "medical_body", "medical_context", "risk_clarification"].includes(primary) ||
      ["safety", "medical", "violence", "abuse", "substance"].includes(risk.type);

    if (profanityUnsafe) {
      profile.profanity = 0;
      profile.safety.profanityAllowed = false;
      return;
    }

    const message = summary.normalizedMessage || summary.userMessage || "";

    const userUsesProfanity =
      /\b(fuck|shit|damn|ass|bullshit)\b/i.test(message);

    if (userUsesProfanity && ["builder", "executive_decision", "general_understanding", "wisdom"].includes(primary)) {
      profile.profanity = Math.max(profile.profanity, 10);
      profile.reasons.push("User uses casual profanity, so light matching is allowed in safe domains.");
    }

    if (profile.relationshipMode === "accountability") {
      profile.profanity = Math.max(profile.profanity, 15);
    }

    profile.profanity = Math.min(profile.profanity, 25);
  },

  applyAccountabilityRules(profile, primary, summary = {}) {
    const accountabilityTopics = [
      "weight",
      "diet",
      "drinking",
      "alcohol",
      "procrastinating",
      "avoid",
      "excuse",
      "discipline",
      "goal"
    ];

    const message = summary.normalizedMessage || summary.userMessage || "";

    const accountabilitySignal = this.hasAny(message, accountabilityTopics);

    if (
      accountabilitySignal &&
      ["executive_decision", "general_understanding", "wisdom", "emotion"].includes(primary)
    ) {
      profile.accountability = Math.max(profile.accountability, 40);
      profile.challenge = Math.max(profile.challenge, 35);
      profile.directness = Math.max(profile.directness, 80);
      profile.preferredMoves.push("name_pattern_without_shame");
      profile.reasons.push("Accountability topic detected.");
    }

    if (["medical_context", "medical_body", "safety", "risk_clarification"].includes(primary)) {
      profile.accountability = 0;
      profile.challenge = 0;
    }
  },

  applyBannedPhrases(profile) {
    const banned = [
      "what feels important here",
      "what feels important about this",
      "what has not been said out loud",
      "there may be more here than first appears",
      "there may be a deeper signal",
      "something important may be present",
      "something feels important",
      "before interpreting",
      "before we interpret",
      "life chapter",
      "deeper signal",
      "human need",
      "lead organ",
      "salience",
      "observer hierarchy",
      "mouth director",
      "situation contract",
      "continue observing",
      "not enough evidence",
      "unclear before naming",
      "what do you need to understand before choosing a direction",
      "stability comes before interpretation",
      "protect safety and stability first, then decide what the situation means"
    ];

    banned.forEach(item => this.add(profile.bannedPhrases, item));
  },

  applyPreferredMoves(profile, primary) {
    const moves = {
      safety: [
        "direct_safety_step",
        "brief_reassurance_only_if_useful",
        "no_philosophy"
      ],

      risk_clarification: [
        "ask_one_clear_question",
        "no_extra_sections"
      ],

      medical_body: [
        "medical_boundary",
        "specific_next_step",
        "red_flags_if_needed"
      ],

      medical_context: [
        "answer_medical_context_first",
        "name_likely_nonurgent_possibilities",
        "specific_next_step",
        "red_flags_if_needed"
      ],

      builder: [
        "show_exact_fix",
        "give_replacement_block",
        "explain_after_code",
        "avoid_reflection"
      ],

      teacher: [
        "answer_first",
        "plain_explanation",
        "example_if_helpful"
      ],

      executive_decision: [
        "name_priority",
        "organize_options",
        "recommend_next_step"
      ],

      emotion: [
        "brief_attunement",
        "name_feeling_without_overdoing_it",
        "ground_or_next_step"
      ],

      wisdom: [
        "name_tension",
        "state_principle_plainly",
        "make_choice_clear"
      ],

      relationship: [
        "name_relationship_truth",
        "avoid_mind_reading",
        "repair_step"
      ],

      family: [
        "protect_irreplaceable",
        "practical_family_next_step"
      ],

      memory: [
        "acknowledge_plainly",
        "no_extra_reflection"
      ]
    };

    (moves[primary] || ["answer_first", "specific_next_step"]).forEach(move => {
      this.add(profile.preferredMoves, move);
    });

    profile.allowedMoves = [...new Set([
      ...profile.allowedMoves,
      ...profile.preferredMoves
    ])];
  },

  applyPolishRules(profile) {
    profile.preferredPhrases.push(
      "Here’s the practical move.",
      "I’d handle it this way.",
      "The priority is simple.",
      "Don’t overcomplicate this.",
      "That is worth taking seriously.",
      "This does not need a dramatic interpretation."
    );

    profile.bannedMoves.push(
      "generic_therapy_voice",
      "performative_validation",
      "vague_reflection",
      "system_explanation",
      "fortune_cookie_wisdom"
    );
  },

  finalize(profile) {
    profile.warmth = this.clamp(profile.warmth);
    profile.directness = this.clamp(profile.directness);
    profile.tenderness = this.clamp(profile.tenderness);
    profile.bluntness = this.clamp(profile.bluntness);
    profile.formality = this.clamp(profile.formality);
    profile.professionalism = this.clamp(profile.professionalism);
    profile.humor = this.clamp(profile.humor);
    profile.sarcasm = this.clamp(profile.sarcasm);
    profile.playfulness = this.clamp(profile.playfulness);
    profile.profanity = this.clamp(profile.profanity);
    profile.accountability = this.clamp(profile.accountability);
    profile.challenge = this.clamp(profile.challenge);
    profile.encouragement = this.clamp(profile.encouragement);

    profile.bannedPhrases = [...new Set(profile.bannedPhrases)];
    profile.preferredMoves = [...new Set(profile.preferredMoves)];
    profile.allowedMoves = [...new Set(profile.allowedMoves)];
    profile.bannedMoves = [...new Set(profile.bannedMoves)];
    profile.preferredPhrases = [...new Set(profile.preferredPhrases)];

    if (profile.validationLevel === "none") {
      profile.maxValidationSentences = 0;
    }

    if (profile.humor === 0) {
      profile.safety.humorAllowed = false;
    }

    if (profile.sarcasm === 0) {
      profile.safety.sarcasmAllowed = false;
    }

    if (profile.profanity === 0) {
      profile.safety.profanityAllowed = false;
    }
  },

  hasAny(text = "", terms = []) {
    const normalized = String(text || "").toLowerCase();
    return terms.some(term => normalized.includes(String(term).toLowerCase()));
  },

  add(list = [], item) {
    if (item && Array.isArray(list) && !list.includes(item)) {
      list.push(item);
    }
  },

  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }
};