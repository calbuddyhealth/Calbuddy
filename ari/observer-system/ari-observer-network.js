// ari/observer-system/ari-observer-network.js
// Ari Observer Network
// Purpose: Perceive emotional, intent, memory, goal, life-transition, human-pattern, values, conflict, dual-salience, and hierarchy signals before routing.
// V3.1: Adds Observer Hierarchy Engine integration.

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "3.1.0",

  normalize(message = "") {
    return String(message || "").toLowerCase().trim();
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  observeConversation(text) {
    return {
      hasQuestion:
        text.includes("?") ||
        /^(how|what|why|when|where|can|should|do|does|is|are)\b/.test(text),

      hasDirectRequest: this.containsAny(text, [
        "help me",
        "can you",
        "please",
        "show me",
        "make me",
        "create",
        "build",
        "fix",
        "explain",
        "teach",
        "remember",
        "forget",
        "tell me",
        "do not give me",
        "don't give me"
      ]),

      isSharing: this.containsAny(text, [
        "i am",
        "i'm",
        "i feel",
        "i felt",
        "i learned",
        "i realized",
        "my name is",
        "i passed",
        "i want",
        "i need",
        "my daughter",
        "my son",
        "my wife",
        "my husband"
      ]),

      topicHints: this.detectTopics(text)
    };
  },

  observeEmotion(text) {
    const signals = [];

    if (this.containsAny(text, ["lonely", "sad", "hurt", "ashamed", "grief", "cry"])) {
      signals.push("compassion");
    }

    if (this.containsAny(text, ["worried", "risk", "unsafe", "danger", "confused", "overwhelmed", "guilty", "regret"])) {
      signals.push("concern");
    }

    if (this.containsAny(text, ["passed", "did it", "success", "great news", "finished", "excited"])) {
      signals.push("joy");
      signals.push("pride");
    }

    if (this.containsAny(text, ["what if", "imagine", "future", "possibility", "vision", "someday"])) {
      signals.push("wonder");
    }

    if (this.containsAny(text, ["stuck", "hard", "can't", "trying", "need to", "pursuing"])) {
      signals.push("determination");
    }

    if (this.containsAny(text, [
      "responsibility",
      "irresponsible",
      "provide",
      "protect",
      "family",
      "daughter",
      "son",
      "promotion",
      "income",
      "first child",
      "wife"
    ])) {
      signals.push("stewardship");
    }

    if (this.containsAny(text, ["hope", "hopeful", "future", "dream"])) {
      signals.push("hope");
    }

    return {
      signals: [...new Set(signals)],

      hasEmotionalPain: this.containsAny(text, [
        "lonely",
        "sad",
        "hurt",
        "ashamed",
        "overwhelmed",
        "scared",
        "worried",
        "anxious",
        "stressed",
        "guilty",
        "exhausted",
        "burned out"
      ]),

      isTemporaryEmotion: this.containsAny(text, [
        "i am feeling",
        "i'm feeling",
        "i feel",
        "today",
        "right now",
        "tonight",
        "this morning",
        "this afternoon",
        "this evening"
      ])
    };
  },

  observeIntent(text) {
    if (this.containsAny(text, ["remember that", "remember this", "save this", "from now on", "going forward"])) {
      return "memory";
    }

    if (this.containsAny(text, ["forget that", "forget this", "delete that memory", "don't remember"])) {
      return "forget";
    }

    if (this.containsAny(text, [
      "help me create a plan",
      "make a plan",
      "create a plan",
      "roadmap",
      "next step",
      "what should i focus",
      "what deserves my attention",
      "help me decide",
      "figure out what matters",
      "what matters most",
      "what am i not seeing",
      "which choice"
    ])) {
      return "plan";
    }

    if (this.containsAny(text, ["debug", "github", "repository", "repo", "code", "fix this", "api", "javascript"])) {
      return "build";
    }

    if (this.containsAny(text, ["explain", "teach", "break this down", "how does", "what does"])) {
      return "teach";
    }

    if (this.containsAny(text, ["brainstorm", "imagine", "what if", "ideas", "possibility"])) {
      return "explore";
    }

    if (this.containsAny(text, ["i feel", "i'm feeling", "i am feeling", "i'm sad", "i am sad", "lonely", "overwhelmed"])) {
      return "support";
    }

    if (this.containsAny(text, ["i learned", "i realized", "this taught me", "this means"])) {
      return "reflect";
    }

    return "unknown";
  },

  observeMemory(text) {
    return {
      explicitMemoryIntent: this.containsAny(text, [
        "remember that",
        "remember this",
        "save this",
        "from now on",
        "going forward",
        "keep in mind"
      ]),

      forgetIntent: this.containsAny(text, [
        "forget that",
        "forget this",
        "delete that memory",
        "don't remember that"
      ]),

      identitySignal: this.containsAny(text, [
        "my name is",
        "call me",
        "i go by",
        "i am a",
        "i'm a",
        "i work as",
        "my job is"
      ]),

      preferenceSignal: this.containsAny(text, [
        "i prefer",
        "i like when",
        "i don't like when",
        "i want you to",
        "i need you to",
        "i value"
      ]),

      milestoneSignal: this.containsAny(text, [
        "milestone",
        "i passed",
        "i graduated",
        "got married",
        "baby was born",
        "daughter was born",
        "son was born",
        "ari was born"
      ]),

      journeySignal: this.containsAny(text, [
        "i am trying to",
        "i'm trying to",
        "i want to become",
        "my goal is",
        "i am working on",
        "i'm working on",
        "i am building",
        "i'm building",
        "pmhnp journey",
        "starting my pmhnp",
        "pursuing pmhnp",
        "leaving the navy",
        "becoming a father",
        "planning a wedding",
        "building ari rebirth",
        "promotion",
        "offered a promotion"
      ]),

      reflectionSignal: this.containsAny(text, [
        "i learned",
        "i realized",
        "i discovered",
        "this taught me",
        "this means"
      ])
    };
  },

  observeGoals(text) {
    return {
      wantsPlan: this.containsAny(text, [
        "plan",
        "roadmap",
        "next step",
        "milestone",
        "schedule",
        "focus on first",
        "what deserves my attention",
        "help me decide",
        "what matters most",
        "what am i not seeing",
        "which choice"
      ]),

      wantsGrowth: this.containsAny(text, [
        "become",
        "becoming",
        "improve",
        "better",
        "grow",
        "stronger",
        "healthier",
        "pursuing",
        "school",
        "certification",
        "promotion",
        "opportunity"
      ]),

      wantsBuild: this.containsAny(text, [
        "build",
        "building",
        "create",
        "code",
        "debug",
        "architecture",
        "ari rebirth"
      ]),

      wantsHealth: this.containsAny(text, [
        "weight",
        "calorie",
        "nutrition",
        "exercise",
        "meal",
        "fitness"
      ])
    };
  },

  observeLifeTransitions(text) {
    return {
      fatherhood: this.containsAny(text, [
        "becoming a father",
        "become a father",
        "about to become a father",
        "my daughter",
        "my son",
        "first child",
        "future daughter",
        "future son"
      ]),

      motherhood: this.containsAny(text, [
        "becoming a mother",
        "become a mother",
        "about to become a mother",
        "my baby",
        "future child"
      ]),

      pregnancy: this.containsAny(text, [
        "pregnant",
        "pregnancy",
        "due in",
        "expecting"
      ]),

      marriage: this.containsAny(text, [
        "wife",
        "husband",
        "married",
        "marriage"
      ]),

      engagement: this.containsAny(text, [
        "engaged",
        "fiance",
        "fiancée",
        "planning a wedding",
        "wedding"
      ]),

      militaryTransition: this.containsAny(text, [
        "leaving the navy",
        "leaving the military",
        "separating",
        "retiring from military",
        "getting out",
        "after years of service"
      ]),

      careerTransition: this.containsAny(text, [
        "career change",
        "new career",
        "changing careers",
        "starting a new job",
        "pmhnp",
        "nurse practitioner",
        "graduate school",
        "school after military",
        "civilian career",
        "leaving the navy",
        "promotion",
        "offered a promotion",
        "increase my income",
        "longer hours",
        "more travel",
        "career opportunity"
      ]),

      retirement: this.containsAny(text, [
        "retirement",
        "retiring"
      ])
    };
  },

  observeHumanPatterns(text, lifeTransitions = {}) {
    const activeTransitions = Object.values(lifeTransitions).filter(Boolean).length;

    const roles = [];

    if (lifeTransitions.fatherhood) roles.push("father");
    if (lifeTransitions.motherhood) roles.push("mother");
    if (lifeTransitions.marriage) roles.push("spouse");
    if (lifeTransitions.engagement) roles.push("fiance");
    if (lifeTransitions.militaryTransition) roles.push("military-transitioning");
    if (lifeTransitions.careerTransition) roles.push("career-transitioning");

    if (this.containsAny(text, ["student", "school", "pmhnp", "graduate school"])) {
      roles.push("student");
    }

    if (this.containsAny(text, ["build ari", "building ari", "ari rebirth", "founder", "business"])) {
      roles.push("builder");
    }

    if (this.containsAny(text, [
      "provider",
      "support my family",
      "support my daughter",
      "protect my family",
      "provide more for my family",
      "income",
      "promotion"
    ])) {
      roles.push("provider");
    }

    const competingPriorities = this.containsAny(text, [
      "what should i focus on",
      "what matters most",
      "cannot do everything",
      "can't do everything",
      "too much at once",
      "which should come first",
      "competing priorities",
      "give 100%",
      "all at the same time",
      "advance every goal equally",
      "deserves my attention",
      "help me decide",
      "prioritize income or family",
      "income or family",
      "which choice"
    ]);

    const burnoutRisk = this.containsAny(text, [
      "burned out",
      "burnout",
      "exhausted",
      "overwhelmed",
      "spreading myself too thin",
      "spread too thin",
      "running out of energy",
      "cannot give 100%",
      "can't give 100%",
      "too much at once"
    ]);

    const purposeConflict = this.containsAny(text, [
      "what matters most",
      "what i most need to hear",
      "not what i want to hear",
      "which should i sacrifice",
      "what deserves my attention",
      "what should come first",
      "protect the others",
      "care deeply about",
      "purpose",
      "income or family",
      "provide more for my family",
      "miss moments",
      "which choice",
      "regret more",
      "prioritize income or family"
    ]);

    const opportunityCost = this.containsAny(text, [
      "neglect one area",
      "sacrifice",
      "protect the others",
      "cannot give 100%",
      "can't give 100%",
      "if i focus on",
      "if i continue",
      "income or family",
      "more money",
      "more time",
      "longer hours",
      "more travel",
      "miss moments",
      "never get back",
      "turning down the promotion",
      "accepting it would require"
    ]);

    const futureRegretRisk = this.containsAny(text, [
      "miss my daughter",
      "miss my son",
      "first year",
      "regret",
      "regret more",
      "which choice i would regret",
      "wish i had",
      "look back",
      "family first",
      "miss moments",
      "never get back"
    ]);

    const roleConflict =
      (roles.length >= 2 && competingPriorities) ||
      roles.length >= 3 ||
      this.containsAny(text, [
        "multiple roles",
        "pulled in different directions",
        "balance everything",
        "cannot do everything",
        "can't do everything",
        "too many responsibilities",
        "father and",
        "husband and",
        "student and",
        "provider and",
        "prioritize income or family"
      ]);

    return {
      roles: [...new Set(roles)],
      roleConflict,
      competingPriorities,
      burnoutRisk,
      purposeConflict,
      opportunityCost,
      futureRegretRisk,

      lifeTransitionLoad: {
        count: activeTransitions,
        level:
          activeTransitions >= 5
            ? "extreme"
            : activeTransitions >= 3
            ? "high"
            : activeTransitions >= 1
            ? "moderate"
            : "low"
      }
    };
  },

  observeValuesAndConflicts(text, humanPatterns = {}) {
    const values = [];

    if (this.containsAny(text, [
      "tell me what i need to hear",
      "what i need to hear",
      "direct feedback",
      "truth",
      "honest",
      "do not give me encouragement",
      "don't sugarcoat",
      "no sugarcoating"
    ])) {
      values.push("truth");
    }

    if (this.containsAny(text, [
      "accountability",
      "hold me accountable",
      "what i need to hear",
      "not what i want to hear"
    ])) {
      values.push("accountability");
    }

    if (this.containsAny(text, [
      "daughter",
      "son",
      "family",
      "wife",
      "husband",
      "first child",
      "baby"
    ])) {
      values.push("family");
    }

    if (this.containsAny(text, [
      "responsibility",
      "irresponsible",
      "provide",
      "protect",
      "provider"
    ])) {
      values.push("responsibility");
    }

    if (this.containsAny(text, [
      "pmhnp",
      "growth",
      "improve",
      "become",
      "promotion",
      "opportunity"
    ])) {
      values.push("growth");
    }

    if (this.containsAny(text, [
      "ari rebirth",
      "build",
      "building",
      "create",
      "founder"
    ])) {
      values.push("creation");
    }

    if (this.containsAny(text, [
      "service",
      "navy",
      "military",
      "take care of others",
      "support others"
    ])) {
      values.push("service");
    }

    const coreConflicts = [];

    if (
      this.containsAny(text, ["promotion", "career", "income", "opportunity", "longer hours", "more travel"]) &&
      this.containsAny(text, ["daughter", "son", "family", "first child", "wife", "husband"])
    ) {
      coreConflicts.push("ambition_vs_presence");
    }

    if (
      this.containsAny(text, ["school", "pmhnp", "career change", "promotion", "opportunity"]) &&
      this.containsAny(text, ["security", "stable", "safe", "income", "provide"])
    ) {
      coreConflicts.push("growth_vs_stability");
    }

    if (
      this.containsAny(text, ["everyone else", "take care of others", "support everyone", "provide", "protect"]) &&
      this.containsAny(text, ["burned out", "exhausted", "overwhelmed", "too much"])
    ) {
      coreConflicts.push("service_vs_self");
    }

    if (this.containsAny(text, ["leaving the navy", "leaving the military", "after years of service"])) {
      coreConflicts.push("identity_vs_transition");
    }

    if (
      this.containsAny(text, ["income or family", "provide more for my family"]) ||
      (
        this.containsAny(text, ["income", "promotion", "more money"]) &&
        this.containsAny(text, ["family", "daughter", "son", "first child"])
      )
    ) {
      coreConflicts.push("provider_vs_present_parent");
    }

    let decisionPressure = "low";

    if (humanPatterns.competingPriorities && humanPatterns.roleConflict) {
      decisionPressure = "medium";
    }

    if (
      humanPatterns.lifeTransitionLoad &&
      humanPatterns.lifeTransitionLoad.level === "high"
    ) {
      decisionPressure = "high";
    }

    if (
      humanPatterns.lifeTransitionLoad &&
      humanPatterns.lifeTransitionLoad.level === "extreme"
    ) {
      decisionPressure = "critical";
    }

    if (humanPatterns.futureRegretRisk && humanPatterns.opportunityCost) {
      decisionPressure = decisionPressure === "low" ? "medium" : decisionPressure;
    }

    const sacrificeDetected = this.containsAny(text, [
      "sacrifice",
      "neglect",
      "protect the others",
      "cannot do everything",
      "can't do everything",
      "miss moments",
      "never get back"
    ]);

    return {
      values: [...new Set(values)],
      coreConflicts: [...new Set(coreConflicts)],
      decisionPressure,
      sacrificeDetected
    };
  },

  observeRelationship(text, context = {}) {
    return {
      unknownUser: !context.userId && !context.profile,

      relationshipSignal: this.containsAny(text, [
        "friend",
        "companion",
        "know me",
        "trust",
        "talk to me",
        "listen to me"
      ]),

      communicationPreference: this.containsAny(text, [
        "talk to me",
        "be more",
        "be less",
        "direct feedback",
        "gentle",
        "blunt",
        "don't sugarcoat",
        "no sugarcoating",
        "what i need to hear"
      ])
    };
  },

  observeRisk(text) {
    return {
      guardianRequired: this.containsAny(text, [
        "suicide",
        "kill myself",
        "hurt myself",
        "overdose",
        "chest pain",
        "stroke",
        "can't breathe",
        "abuse",
        "danger",
        "emergency"
      ])
    };
  },

  observeDualSalience(message, context = {}) {
    if (!window.AriDualSalienceSystem || !window.AriDualSalienceSystem.analyze) {
      return {
        available: false,
        reason: "AriDualSalienceSystem not loaded"
      };
    }

    return {
      available: true,
      ...window.AriDualSalienceSystem.analyze({
        text: message,
        context
      })
    };
  },

  observeHierarchy(observation = {}) {
    if (
      !window.Ari ||
      !window.Ari.observerHierarchyEngine ||
      !window.Ari.observerHierarchyEngine.analyze
    ) {
      return {
        available: false,
        reason: "AriObserverHierarchyEngine not loaded"
      };
    }

    return {
      available: true,
      ...window.Ari.observerHierarchyEngine.analyze(observation)
    };
  },

  detectTopics(text) {
    const topics = [];

    if (this.containsAny(text, ["code", "github", "repo", "debug", "api", "javascript"])) {
      topics.push("coding");
    }

    if (this.containsAny(text, ["weight", "calorie", "meal", "nutrition", "exercise"])) {
      topics.push("health");
    }

    if (this.containsAny(text, ["lonely", "sad", "overwhelmed", "relationship", "feel", "guilty", "worried", "regret"])) {
      topics.push("emotional");
    }

    if (this.containsAny(text, ["ari", "calbuddy", "rebirth", "architecture"])) {
      topics.push("ari-development");
    }

    if (this.containsAny(text, ["plan", "roadmap", "next step", "focus", "attention", "decide", "prioritize"])) {
      topics.push("planning");
    }

    if (this.containsAny(text, ["daughter", "son", "baby", "father", "mother", "pregnant", "pregnancy", "first child", "wife", "husband"])) {
      topics.push("family");
    }

    if (this.containsAny(text, ["navy", "military", "service", "separating"])) {
      topics.push("military-transition");
    }

    if (this.containsAny(text, ["pmhnp", "school", "career", "job", "nurse practitioner", "promotion", "income"])) {
      topics.push("career-transition");
    }

    if (this.containsAny(text, ["wedding", "marriage", "fiance", "fiancée", "wife", "husband"])) {
      topics.push("relationship-transition");
    }

    return [...new Set(topics)];
  },

  observe(message = "", context = {}) {
    const text = this.normalize(message);
    const lifeTransitions = this.observeLifeTransitions(text);
    const humanPatterns = this.observeHumanPatterns(text, lifeTransitions);
    const valuesAndConflicts = this.observeValuesAndConflicts(text, humanPatterns);
    const dualSalience = this.observeDualSalience(message, context);

    const baseObservation = {
      message,
      normalizedMessage: text,
      conversation: this.observeConversation(text),
      emotion: this.observeEmotion(text),
      intent: this.observeIntent(text),
      memory: this.observeMemory(text),
      goals: this.observeGoals(text),
      lifeTransitions,
      humanPatterns,
      valuesAndConflicts,
      relationship: this.observeRelationship(text, context),
      risk: this.observeRisk(text),
      dualSalience,
      observedAt: new Date().toISOString(),
      source: "ari-observer-network",
      version: this.version
    };

    const observerHierarchy = this.observeHierarchy(baseObservation);

    const observation = {
      ...baseObservation,
      observerHierarchy,
      hierarchy: observerHierarchy
    };

    window.dispatchEvent(
      new CustomEvent("ari:observation", {
        detail: observation
      })
    );

    return observation;
  }
};