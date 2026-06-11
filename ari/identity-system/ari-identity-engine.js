// ari/identity-system/ari-identity-engine.js
// Ari Identity Engine
// Purpose: Detect active identities, role hierarchy, role conflicts, and identity themes.
// V2.1
// Fixes:
// - Makes builder detection less aggressive.
// - Prevents vague uncertainty prompts from becoming "builder" by default.
// - Requires stronger project-specific evidence for builder identity.
// - Adds uncertainty protection for vague messages.
// - Deduplicates and caps identity strength.

window.Ari = window.Ari || {};

window.Ari.identityEngine = {
  version: "2.1.0",

  analyze(observation = {}, values = {}) {
    const identities = [];

    const text = observation.normalizedMessage || "";
    const isVagueUncertainty = this.isVagueUncertaintyMessage(text, observation);

    this.detectLifeTransitionIdentities(observation, identities);
    this.detectRoleLanguageIdentities(observation, identities, { isVagueUncertainty });
    this.detectValueBasedIdentities(values, identities, { isVagueUncertainty });
    this.detectGoalBasedIdentities(observation, identities, { isVagueUncertainty });

    const normalizedIdentities = this.normalizeIdentities(identities);
    const identityHierarchy = this.buildIdentityHierarchy({
      identities: normalizedIdentities,
      observation,
      values,
      isVagueUncertainty
    });

    const identityConflicts = this.detectIdentityConflicts({
      identities: normalizedIdentities,
      observation,
      values
    });

    const dominantIdentity = identityHierarchy.primary || null;

    const dominantTheme = this.detectDominantTheme({
      identities: normalizedIdentities,
      identityHierarchy,
      identityConflicts,
      observation,
      values,
      isVagueUncertainty
    });

    const coreQuestion = this.getCoreQuestion(dominantTheme);
    const primaryRisk = this.getPrimaryRisk(dominantTheme);

    return {
      identities: normalizedIdentities,
      identityHierarchy,
      identityConflicts,
      dominantIdentity,
      dominantTheme,
      coreQuestion,
      primaryRisk,
      vagueUncertaintyProtected: isVagueUncertainty,
      source: "ari-identity-engine"
    };
  },

  isVagueUncertaintyMessage(text = "", observation = {}) {
    const clean = String(text || "").toLowerCase().trim();

    const vaguePhrases = [
      "something feels off",
      "something is off",
      "i feel off",
      "i don't know",
      "im not sure",
      "i'm not sure",
      "not sure what i want",
      "i don't know what i want",
      "i don't know how i feel",
      "lately i've been thinking",
      "lately ive been thinking",
      "i have a decision to make",
      "i'm considering two different options",
      "im considering two different options",
      "something important is happening",
      "i don't know what is happening",
      "i dont know what is happening"
    ];

    const hasVaguePhrase = vaguePhrases.some((phrase) =>
      clean.includes(phrase)
    );

    const hasSpecificProjectSignal = this.hasStrongBuilderSignal(clean);
    const life = observation.lifeTransitions || {};
    const hasMajorLifeTransition =
      Boolean(life.fatherhood) ||
      Boolean(life.pregnancy) ||
      Boolean(life.marriage) ||
      Boolean(life.engagement) ||
      Boolean(life.militaryTransition) ||
      Boolean(life.careerTransition);

    return hasVaguePhrase && !hasSpecificProjectSignal && !hasMajorLifeTransition;
  },

  hasStrongBuilderSignal(text = "") {
    const clean = String(text || "").toLowerCase();

    const strongProjectSignals = [
      "ari rebirth",
      "building ari",
      "build ari",
      "ari's future",
      "aris future",
      "calbuddy",
      "cal buddy",
      "calbuddy health",
      "architecture",
      "code",
      "coding",
      "javascript",
      "html",
      "css",
      "github",
      "vercel",
      "supabase",
      "app development",
      "build the app",
      "building the app",
      "create the app",
      "project roadmap",
      "ari lab",
      "rebirth pipeline",
      "identity engine",
      "salience governor",
      "language composer",
      "core spine"
    ];

    return strongProjectSignals.some((phrase) => clean.includes(phrase));
  },

  addIdentity(identities = [], identity = {}) {
    if (!identity.name) return;

    const existing = identities.find((item) => item.name === identity.name);
    const incomingStrength = Number(identity.strength || 0);

    if (existing) {
      existing.strength = Math.min(
        120,
        existing.strength + incomingStrength
      );

      existing.reasons = [
        ...new Set([...(existing.reasons || []), ...(identity.reasons || [])])
      ];

      existing.confidence = this.mergeConfidence(
        existing.confidence,
        identity.confidence
      );

      return;
    }

    identities.push({
      name: identity.name,
      strength: Math.min(incomingStrength || 50, 120),
      confidence: identity.confidence || "medium",
      reasons: identity.reasons || []
    });
  },

  mergeConfidence(current = "medium", incoming = "medium") {
    const rank = {
      unknown: 0,
      low: 1,
      medium: 2,
      high: 3
    };

    return rank[incoming] > rank[current] ? incoming : current;
  },

  detectLifeTransitionIdentities(observation = {}, identities = []) {
    const life = observation.lifeTransitions || {};

    if (life.fatherhood) {
      this.addIdentity(identities, {
        name: "father",
        strength: 95,
        confidence: "high",
        reasons: ["Fatherhood or child-related transition detected."]
      });
    }

    if (life.engagement || life.marriage) {
      this.addIdentity(identities, {
        name: "future-spouse",
        strength: 85,
        confidence: "high",
        reasons: ["Engagement, wedding, or spouse transition detected."]
      });
    }

    if (life.militaryTransition) {
      this.addIdentity(identities, {
        name: "veteran-transitioning",
        strength: 80,
        confidence: "high",
        reasons: ["Military transition detected."]
      });
    }

    if (life.careerTransition) {
      this.addIdentity(identities, {
        name: "career-builder",
        strength: 75,
        confidence: "medium",
        reasons: ["Career transition or career growth detected."]
      });
    }

    if (life.pregnancy) {
      this.addIdentity(identities, {
        name: "expectant-parent",
        strength: 85,
        confidence: "high",
        reasons: ["Pregnancy or incoming child transition detected."]
      });
    }
  },

  detectRoleLanguageIdentities(observation = {}, identities = [], options = {}) {
    const text = observation.normalizedMessage || "";
    const patterns = observation.humanPatterns || {};
    const isVagueUncertainty = Boolean(options.isVagueUncertainty);

    const strongBuilderSignal = this.hasStrongBuilderSignal(text);

    const roleMap = [
      {
        name: "provider",
        strength: 76,
        phrases: [
          "provide",
          "provider",
          "protect my family",
          "stability",
          "responsibility"
        ],
        reason: "Provider, protection, responsibility, or stability language detected."
      },
      {
        name: "learner",
        strength: 72,
        phrases: [
          "pmhnp",
          "school",
          "student",
          "learn",
          "study",
          "degree"
        ],
        reason: "School, PMHNP, student, or learning language detected."
      },
      {
        name: "helper",
        strength: 68,
        phrases: [
          "help people",
          "serve",
          "service",
          "patients",
          "nurse"
        ],
        reason: "Helping, service, nursing, or patient-care language detected."
      },
      {
        name: "achiever",
        strength: 68,
        phrases: [
          "achievement",
          "milestone",
          "goals",
          "fall behind",
          "accomplish"
        ],
        reason: "Achievement, milestone, or accomplishment language detected."
      },
      {
        name: "leader",
        strength: 65,
        phrases: [
          "lead",
          "leader",
          "officer",
          "charge",
          "supervise"
        ],
        reason: "Leadership or officer language detected."
      }
    ];

    roleMap.forEach((role) => {
      if (role.phrases.some((phrase) => text.includes(phrase))) {
        this.addIdentity(identities, {
          name: role.name,
          strength: role.strength,
          confidence: "medium",
          reasons: [role.reason]
        });
      }
    });

    // Builder detection is intentionally stricter than other roles.
    if (strongBuilderSignal) {
      this.addIdentity(identities, {
        name: "builder",
        strength: 82,
        confidence: "high",
        reasons: ["Specific Ari, CalBuddy, code, architecture, or app-building language detected."]
      });
    } else if (!isVagueUncertainty) {
      const moderateBuilderSignals = [
        "build something",
        "building something",
        "create something",
        "project i am building",
        "thing i am building",
        "something meaningful",
        "future i am trying to create"
      ];

      if (moderateBuilderSignals.some((phrase) => text.includes(phrase))) {
        this.addIdentity(identities, {
          name: "builder",
          strength: 55,
          confidence: "low",
          reasons: ["General creation language detected, but not enough for strong builder certainty."]
        });
      }
    }

    if (Array.isArray(patterns.roles) && !isVagueUncertainty) {
      patterns.roles.forEach((role) => {
        this.addIdentity(identities, {
          name: role,
          strength: 50,
          confidence: "medium",
          reasons: ["Observer detected this active role."]
        });
      });
    }
  },

  detectValueBasedIdentities(values = {}, identities = [], options = {}) {
    const valueList = values.values || [];
    const isVagueUncertainty = Boolean(options.isVagueUncertainty);

    if (valueList.includes("family")) {
      this.addIdentity(identities, {
        name: "family-protector",
        strength: 75,
        confidence: "medium",
        reasons: ["Family value detected."]
      });
    }

    if (valueList.includes("responsibility")) {
      this.addIdentity(identities, {
        name: "provider",
        strength: 70,
        confidence: "medium",
        reasons: ["Responsibility value detected."]
      });
    }

    // Do not let vague creation/purpose values force builder identity too early.
    if (!isVagueUncertainty && valueList.includes("creation")) {
      this.addIdentity(identities, {
        name: "builder",
        strength: 62,
        confidence: "medium",
        reasons: ["Creation value detected."]
      });
    }

    if (valueList.includes("growth")) {
      this.addIdentity(identities, {
        name: "learner",
        strength: 65,
        confidence: "medium",
        reasons: ["Growth value detected."]
      });
    }

    if (valueList.includes("service")) {
      this.addIdentity(identities, {
        name: "helper",
        strength: 65,
        confidence: "medium",
        reasons: ["Service value detected."]
      });
    }
  },

  detectGoalBasedIdentities(observation = {}, identities = [], options = {}) {
    const goals = observation.goals || {};
    const text = observation.normalizedMessage || "";
    const isVagueUncertainty = Boolean(options.isVagueUncertainty);
    const strongBuilderSignal = this.hasStrongBuilderSignal(text);

    if (goals.wantsBuild && strongBuilderSignal) {
      this.addIdentity(identities, {
        name: "builder",
        strength: 78,
        confidence: "high",
        reasons: ["User wants to build or improve a specific project."]
      });
    } else if (goals.wantsBuild && !isVagueUncertainty) {
      this.addIdentity(identities, {
        name: "builder",
        strength: 48,
        confidence: "low",
        reasons: ["User may want to build, but the project signal is still broad."]
      });
    }

    if (goals.wantsGrowth) {
      this.addIdentity(identities, {
        name: "learner",
        strength: 70,
        confidence: "medium",
        reasons: ["User wants growth or development."]
      });
    }

    if (goals.wantsPlan) {
      this.addIdentity(identities, {
        name: "planner",
        strength: 60,
        confidence: "medium",
        reasons: ["User wants planning or prioritization."]
      });
    }
  },

  normalizeIdentities(identities = []) {
    const confidenceBonus = {
      high: 10,
      medium: 5,
      low: 0,
      unknown: 0
    };

    return [...identities]
      .map((identity) => ({
        ...identity,
        strength: Math.min(identity.strength || 0, 120),
        score:
          Math.min(identity.strength || 0, 120) +
          (confidenceBonus[identity.confidence] || 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  },

  buildIdentityHierarchy({
    identities = [],
    observation = {},
    values = {},
    isVagueUncertainty = false
  } = {}) {
    const life = observation.lifeTransitions || {};
    const valueList = values.values || [];

    if (isVagueUncertainty && identities.length === 0) {
      return {
        primary: null,
        secondary: [],
        supporting: [],
        seasonalPrimaryReason:
          "Vague uncertainty detected; no identity should lead yet."
      };
    }

    let primary = identities[0] || null;

    const father = identities.find((item) => item.name === "father");
    const expectantParent = identities.find((item) => item.name === "expectant-parent");
    const provider = identities.find((item) => item.name === "provider");

    if (life.fatherhood && father) {
      primary = father;
    } else if (life.pregnancy && expectantParent) {
      primary = expectantParent;
    } else if (valueList.includes("family") && father) {
      primary = father;
    } else if (valueList.includes("responsibility") && provider) {
      primary = provider;
    }

    const secondary = identities
      .filter((item) => item.name !== primary?.name)
      .slice(0, 2);

    const supporting = identities
      .filter(
        (item) =>
          item.name !== primary?.name &&
          !secondary.some((secondaryItem) => secondaryItem.name === item.name)
      )
      .slice(0, 5);

    return {
      primary,
      secondary,
      supporting,
      seasonalPrimaryReason:
        this.getSeasonalPrimaryReason(primary, observation, values)
    };
  },

  getSeasonalPrimaryReason(primary = null, observation = {}, values = {}) {
    if (!primary) return "No primary identity detected.";

    const life = observation.lifeTransitions || {};

    if (primary.name === "father" && life.fatherhood) {
      return "Fatherhood is active and should likely lead this season.";
    }

    if (primary.name === "expectant-parent") {
      return "Incoming child or pregnancy transition is active.";
    }

    if (primary.name === "provider") {
      return "Provider responsibility is active and may be organizing the user's decisions.";
    }

    if (primary.name === "builder") {
      return "Builder identity is active through specific creation or project work.";
    }

    return `${primary.name} appears strongest based on current evidence.`;
  },

  detectIdentityConflicts({ identities = [], observation = {}, values = {} } = {}) {
    const names = identities.map((item) => item.name);
    const conflicts = [];

    const addConflict = (name, confidence, reason) => {
      if (!conflicts.some((item) => item.name === name)) {
        conflicts.push({ name, confidence, reason });
      }
    };

    if (names.includes("father") && names.includes("builder")) {
      addConflict(
        "father_vs_builder",
        "high",
        "Father and builder identities both appear active."
      );
    }

    if (names.includes("provider") && names.includes("father")) {
      addConflict(
        "provider_vs_present_parent",
        "medium",
        "Provider and present-parent roles may compete for time and energy."
      );
    }

    if (names.includes("learner") && names.includes("builder")) {
      addConflict(
        "learner_vs_builder",
        "medium",
        "Learning path and building path may compete for focus."
      );
    }

    if (
      names.includes("veteran-transitioning") &&
      names.includes("career-builder")
    ) {
      addConflict(
        "old_service_identity_vs_new_career",
        "medium",
        "Military transition and new career identity are both active."
      );
    }

    if (
      values.valueConflicts?.includes("family_vs_creation") ||
      (names.includes("family-protector") && names.includes("builder"))
    ) {
      addConflict(
        "family_vs_creation_identity",
        "medium",
        "Family-protector and builder identities may compete."
      );
    }

    return conflicts;
  },

  detectDominantTheme({
    identities = [],
    identityHierarchy = {},
    identityConflicts = [],
    observation = {},
    values = {},
    isVagueUncertainty = false
  } = {}) {
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};

    if (isVagueUncertainty && !identityHierarchy.primary) {
      return "identity_unclear";
    }

    if (identityConflicts.length >= 3 || patterns.roleConflict) {
      return "identity_overload";
    }

    if (life.fatherhood && life.militaryTransition) {
      return "fatherhood_during_transition";
    }

    if (life.fatherhood) {
      return "fatherhood_transition";
    }

    if (
      identityConflicts.some(
        (conflict) => conflict.name === "father_vs_builder"
      )
    ) {
      return "family_vs_creation_identity";
    }

    if (
      identityConflicts.some(
        (conflict) => conflict.name === "provider_vs_present_parent"
      )
    ) {
      return "provider_vs_presence";
    }

    if (
      life.militaryTransition ||
      identities.some((item) => item.name === "veteran-transitioning")
    ) {
      return "identity_transition";
    }

    if (identityHierarchy.primary?.name) {
      return "identity_mapping";
    }

    return "identity_unclear";
  },

  getCoreQuestion(theme = "") {
    const questions = {
      identity_overload:
        "Which identity needs to become primary, and which identities need to support instead of compete?",

      fatherhood_during_transition:
        "How does the user become a father while also letting an old service chapter change shape?",

      fatherhood_transition:
        "What kind of father is the user becoming in this season?",

      family_vs_creation_identity:
        "How can the user protect family without abandoning the builder identity?",

      provider_vs_presence:
        "Is the user trying to provide more when the deeper need may be to be present more?",

      identity_transition:
        "Which old identity is ending, and which new identity is trying to emerge?",

      identity_mapping:
        "Which identity is currently organizing the user's decisions?",

      identity_unclear:
        "What identity is actually active underneath this question?"
    };

    return questions[theme] || questions.identity_unclear;
  },

  getPrimaryRisk(theme = "") {
    const risks = {
      identity_overload:
        "Trying to fully maintain every identity at once may create burnout or fractured focus.",

      fatherhood_during_transition:
        "The user may try to handle fatherhood with the same achievement strategy used in military or career life.",

      fatherhood_transition:
        "The user may confuse being a good father with being perfect or endlessly productive.",

      family_vs_creation_identity:
        "The user may treat slowing a project as abandoning purpose.",

      provider_vs_presence:
        "The user may over-provide while under-resting or under-connecting.",

      identity_transition:
        "Clinging to an old identity may make the next chapter harder to enter.",

      identity_mapping:
        "Ari may over-focus on the loudest identity instead of the identity that should lead this season.",

      identity_unclear:
        "Ari may give generic advice without knowing who the user is trying to become."
    };

    return risks[theme] || risks.identity_unclear;
  }
};