// ari/governance/ari-universal-domain-governor.js
// Ari Universal Domain Governor
// Purpose: Rank universal domains before Ari interprets, routes, or composes.
// V2.1.0

window.Ari = window.Ari || {};

window.AriUniversalDomainGovernor = {
  version: "2.1.0",

  govern(input = {}) {
    const summary = input.summary || input || {};

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const signals = this.collectSignals(summary);
    const domains = this.getDomains();

    const ranked = domains
      .map((domain) => this.scoreDomain(domain, summary, text, signals))
      .filter((domain) => domain.score > 0);

    if (!ranked.length) ranked.push(this.defaultDomain());

    ranked.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.score !== a.score) return b.score - a.score;
      return b.authority - a.authority;
    });

    const forcedDomainName = this.getForcedDomainName(summary, text, signals);
    let lead = ranked[0];

    if (forcedDomainName && !this.hasSurvivalOverride(ranked)) {
      const forced = ranked.find((item) => item.name === forcedDomainName);

      if (forced) {
        lead = {
          ...forced,
          forced: true,
          forceReason: "Direct user intent overrode lower-priority interpretation."
        };
      }
    }

    const blocked = this.getBlockedPermissions(lead);

    return {
      universalDomainGovernorRan: true,
      universalDomainGovernorVersion: this.version,

      domainLead: lead.name,
      domainSuperLead: lead.superDomain,
      domainLeadScore: lead.score,
      domainPriority: lead.priority,
      domainAuthority: lead.authority,
      domainLeadOrgan: lead.leadOrgan,
      domainMode: lead.mode,
      domainQuestion: lead.question,
      domainReasons: lead.reasons,
      domainForced: Boolean(lead.forced),
      domainForceReason: lead.forceReason || null,

      domainPermissions: lead.permissions,
      domainBlockedPermissions: blocked,

      rankedUniversalDomains: ranked,

      shouldBlockLifeChapter:
        blocked.includes("life_chapter") ||
        lead.permissions.lifeChapter === false,

      shouldBlockIdentity:
        blocked.includes("identity") ||
        lead.permissions.identity === false,

      shouldBlockEmotionRecovery:
        blocked.includes("emotion_recovery") ||
        lead.permissions.emotionRecovery === false,

      shouldBlockMeaningProjection:
        blocked.includes("meaning_projection") ||
        lead.permissions.meaningProjection === false,

      shouldPreferTeaching: lead.name === "knowledge_teaching_domain",

      shouldPreferWisdom:
        lead.name === "wisdom_reflection_domain" ||
        lead.name === "decision_planning_domain",

      shouldPreferBuilding: lead.name === "creative_building_domain",

      shouldPreferBodyStabilization:
        lead.superDomain === "survive" &&
        ["medical_body_domain", "body_health_domain", "sleep_recovery_domain"].includes(lead.name),

      shouldPreferSafety: lead.name === "critical_safety_domain",

      source: "ari-universal-domain-governor"
    };
  },

  scoreDomain(domain, summary, text, signals) {
    let score = 0;
    const reasons = [];

    const textHits = domain.text.filter((term) => text.includes(term));
    const signalHits = signals.filter((signal) =>
      domain.signals.some((term) => signal.includes(term))
    );

    if (textHits.length) {
      score += domain.textWeight;
      reasons.push(`Text supports ${domain.name}: ${textHits.slice(0, 4).join(", ")}.`);
    }

    if (signalHits.length) {
      score += domain.signalWeight;
      reasons.push(`Signals support ${domain.name}: ${signalHits.slice(0, 4).join(", ")}.`);
    }

    const intentBoost = this.getIntentBoost(domain, summary, text, signals);
    if (intentBoost > 0) {
      score += intentBoost;
      reasons.push(`Direct intent boost supports ${domain.name}.`);
    }

    const observerBoost = this.getObserverBoost(domain, summary, signals);
    if (observerBoost > 0) {
      score += observerBoost;
      reasons.push(`Observer hierarchy supports ${domain.name}.`);
    }

    if (domain.shouldBoost?.(summary, text, signals)) {
      score += domain.boostWeight || 20;
      reasons.push(`Context boost supports ${domain.name}.`);
    }

    return {
      name: domain.name,
      superDomain: domain.superDomain,
      priority: domain.priority,
      authority: domain.authority,
      score: this.cap(score, domain.maxScore || 220),
      leadOrgan: domain.leadOrgan,
      mode: domain.mode,
      question: domain.question,
      permissions: domain.permissions,
      reasons
    };
  },

  getIntentBoost(domain, summary, text, signals) {
    const isBuild = this.isBuildRequest(summary, text);
    const isWisdom = this.isWisdomReflectionRequest(summary, text);
    const isTeaching = this.isTeachingRequest(summary, text, signals);
    const isMedical = this.isMedicalRequest(summary);
    const isSafety = this.isSafetyRequest(summary);

    if (isSafety && domain.name === "critical_safety_domain") return 250;
    if (isMedical && domain.name === "medical_body_domain") return 220;
    if (isBuild && domain.name === "creative_building_domain") return 210;
    if (isWisdom && domain.name === "wisdom_reflection_domain") return 190;
    if (isTeaching && !isBuild && !isWisdom && domain.name === "knowledge_teaching_domain") return 180;

    return 0;
  },

  getObserverBoost(domain, summary, signals) {
    const primaryObservation =
      summary.observerHierarchyPrimaryObservation ||
      summary.strongestObservation ||
      null;

    const primaryCategory =
      summary.observerHierarchyPrimaryCategory ||
      summary.strongestObservationCategory ||
      null;

    if (primaryObservation === "teaching_request" && domain.name === "knowledge_teaching_domain") return 200;
    if (primaryObservation === "build_request" && domain.name === "creative_building_domain") return 210;
    if (primaryCategory === "body" && domain.name === "medical_body_domain") return 220;
    if (primaryCategory === "safety" && domain.name === "critical_safety_domain") return 260;
    if (primaryCategory === "relationship" && domain.name === "relationship_connection_domain") return 150;
    if (primaryCategory === "planning" && domain.name === "decision_planning_domain") return 130;
    if (primaryCategory === "wisdom" && domain.name === "wisdom_reflection_domain") return 160;

    if (
      primaryCategory === "life_transition" &&
      domain.name === "family_parenthood_domain"
    ) {
      return signals.some((signal) =>
        ["parenthood", "fatherhood", "motherhood", "family"].some((term) =>
          signal.includes(term)
        )
      )
        ? 150
        : 0;
    }

    return 0;
  },

  getForcedDomainName(summary, text, signals) {
    if (this.isSafetyRequest(summary)) return "critical_safety_domain";
    if (this.isMedicalRequest(summary)) return "medical_body_domain";

    // Build must come before teaching so "how do I fix this code" does not become generic teaching.
    if (this.isBuildRequest(summary, text)) return "creative_building_domain";

    // Wisdom/philosophy comes before teaching so "what is a good life?" does not become encyclopedia mode.
    if (this.isWisdomReflectionRequest(summary, text)) return "wisdom_reflection_domain";

    if (this.isTeachingRequest(summary, text, signals)) return "knowledge_teaching_domain";

    return null;
  },

  isTeachingRequest(summary, text, signals = []) {
    return (
      summary.questionType === "teaching" ||
      summary.focusType === "teaching" ||
      summary.primaryNeed === "teaching" ||
      summary.observerHierarchyPrimaryObservation === "teaching_request" ||
      summary.strongestObservation === "teaching_request" ||
      signals.includes("teaching request") ||
      /^(how does|how do|what is|what are|why does|explain|teach)\b/.test(text)
    );
  },

  isBuildRequest(summary, text) {
    return (
      summary.focusType === "build" ||
      summary.primaryNeed === "build" ||
      summary.observerHierarchyPrimaryObservation === "build_request" ||
      this.containsAny(text, [
        "code",
        "javascript",
        "html",
        "css",
        "debug",
        "bug",
        "github",
        "repo",
        "repository",
        "function",
        "script",
        "full code",
        "entire code",
        "paste ready",
        "paste-ready",
        "update my code",
        "fix my code",
        "replace this file",
        "review the file",
        "review this code",
        "send me full code",
        "send me the full code"
      ])
    );
  },

  isWisdomReflectionRequest(summary, text) {
    return (
      summary.responseIntent === "reflect_wisely" ||
      summary.primaryHumanNeed === "wisdom" ||
      summary.needResponseMode === "choose_what_leads" ||
      this.containsAny(text, [
        "meaning of life",
        "what is a good life",
        "good life",
        "what is wisdom",
        "what is truth",
        "what is love",
        "what is justice",
        "what is courage",
        "what is purpose",
        "what matters most",
        "right thing",
        "wrong thing",
        "moral",
        "morality",
        "ethics",
        "philosophy",
        "philosophical",
        "wise",
        "wisdom",
        "highest good",
        "what good should lead"
      ])
    );
  },

  isMedicalRequest(summary) {
    return (
      summary.safetyTriggered ||
      summary.primaryHumanNeed === "body" ||
      summary.needResponseMode === "stabilize_body_first" ||
      summary.observerHierarchyPrimaryCategory === "body" ||
      summary.strongestObservationCategory === "body"
    );
  },

  isSafetyRequest(summary) {
    return (
      summary.safetyTriggered === true ||
      (
        summary.safetyType &&
        summary.safetyType !== "none"
      )
    );
  },

  hasSurvivalOverride(ranked = []) {
    const lead = ranked[0];
    if (!lead) return false;

    const isSurvivalDomain =
      lead.name === "critical_safety_domain" ||
      lead.name === "medical_body_domain" ||
      lead.name === "sleep_recovery_domain";

    if (!isSurvivalDomain) return false;
    if (lead.name === "critical_safety_domain") return true;

    return lead.score >= 180;
  },

  getDomains() {
    return [
      {
        name: "critical_safety_domain",
        superDomain: "survive",
        priority: 1000,
        authority: 1000,
        textWeight: 140,
        signalWeight: 140,
        boostWeight: 60,
        maxScore: 300,
        text: [
          "kill myself", "suicide", "self harm", "hurt myself", "hurt someone",
          "overdose", "can't stay safe", "cant stay safe", "abuse", "assault",
          "danger", "emergency"
        ],
        signals: ["safety", "danger", "crisis", "self harm", "harm", "security", "guardian"],
        leadOrgan: "safety",
        mode: "safety_override",
        question: "Are you safe right now?",
        permissions: this.permissions({
          safety: true,
          body: true,
          teaching: false,
          lifeChapter: false,
          identity: false,
          emotionRecovery: false,
          meaningProjection: false
        })
      },

      {
        name: "medical_body_domain",
        superDomain: "survive",
        priority: 950,
        authority: 950,
        textWeight: 125,
        signalWeight: 130,
        boostWeight: 50,
        maxScore: 280,
        text: [
          "chest pain", "can't breathe", "cant breathe", "shortness of breath",
          "stroke", "seizure", "fainting", "passed out", "bleeding",
          "severe pain", "pregnant", "pregnancy", "fever", "infection",
          "dizzy", "vomiting", "diarrhea", "dehydrated", "pain"
        ],
        signals: [
          "medical", "body", "body signal", "pain", "vital", "pregnancy",
          "urgent", "symptom", "illness", "infection"
        ],
        leadOrgan: "safety",
        mode: "medical_or_body_first",
        question: "What body signal needs attention first?",
        permissions: this.permissions({
          safety: true,
          body: true,
          teaching: true,
          lifeChapter: false,
          identity: false,
          emotionRecovery: false,
          meaningProjection: false
        }),
        shouldBoost: (summary) =>
          summary.primaryHumanNeed === "body" ||
          summary.needResponseMode === "stabilize_body_first" ||
          summary.observerHierarchyPrimaryCategory === "body"
      },

      {
        name: "sleep_recovery_domain",
        superDomain: "survive",
        priority: 900,
        authority: 900,
        textWeight: 105,
        signalWeight: 110,
        boostWeight: 35,
        maxScore: 240,
        text: [
          "exhausted", "no sleep", "can't sleep", "cant sleep", "burned out",
          "burnt out", "tired", "depleted", "nothing left", "not much left"
        ],
        signals: ["sleep", "rest", "recovery", "capacity", "burnout", "depleted"],
        leadOrgan: "safety",
        mode: "stabilize_body_first",
        question: "What demand needs to be reduced first?",
        permissions: this.permissions({
          safety: true,
          body: true,
          teaching: false,
          lifeChapter: true,
          identity: false,
          emotionRecovery: false,
          meaningProjection: false
        })
      },

      {
        name: "creative_building_domain",
        superDomain: "do",
        priority: 875,
        authority: 720,
        textWeight: 120,
        signalWeight: 110,
        boostWeight: 45,
        maxScore: 330,
        text: [
          "build", "building", "create", "coding", "app", "ari", "calbuddy",
          "project", "github", "code", "javascript", "html", "css", "debug",
          "bug", "repository", "repo", "function", "script", "full code",
          "entire code", "paste ready", "update my code", "fix my code",
          "replace this file", "review this code"
        ],
        signals: ["builder", "creative", "project", "development", "code", "build", "debug"],
        leadOrgan: "builder",
        mode: "build_or_debug",
        question: "What are we building or fixing first?",
        permissions: this.permissions({
          teaching: true,
          planning: true,
          action: true,
          identity: false,
          lifeChapter: false,
          emotionRecovery: false,
          meaningProjection: false
        })
      },

      {
        name: "knowledge_teaching_domain",
        superDomain: "understand",
        priority: 850,
        authority: 500,
        textWeight: 115,
        signalWeight: 105,
        boostWeight: 45,
        maxScore: 320,
        text: [
          "what is", "what are", "how does", "how do", "explain", "teach me",
          "why does", "quantum", "science", "physics", "history",
          "definition"
        ],
        signals: [
          "teaching", "teaching request", "learning", "knowledge", "teacher",
          "curiosity", "understanding", "intent"
        ],
        leadOrgan: "teacher",
        mode: "teach_clearly",
        question: "What are you trying to understand?",
        permissions: this.permissions({
          teaching: true,
          planning: false,
          identity: false,
          lifeChapter: false,
          emotionRecovery: false,
          meaningProjection: false,
          wisdom: false
        }),
        shouldBoost: (summary, text) =>
          summary.questionType === "teaching" ||
          summary.focusType === "teaching" ||
          /^(what|how|why|explain|teach)/i.test(text)
      },

      {
        name: "wisdom_reflection_domain",
        superDomain: "understand",
        priority: 830,
        authority: 760,
        textWeight: 110,
        signalWeight: 110,
        boostWeight: 40,
        maxScore: 300,
        text: [
          "meaning of life", "good life", "what is wisdom", "what is truth",
          "what is love", "what is justice", "what is courage", "what matters most",
          "right thing", "wrong thing", "moral", "morality", "ethics",
          "philosophy", "philosophical", "wise", "wisdom", "highest good",
          "what good should lead", "what is purpose"
        ],
        signals: [
          "wisdom", "highest good", "ethics", "moral", "values",
          "tradeoff", "priority", "purpose", "meaning"
        ],
        leadOrgan: "wisdom",
        mode: "wisdom_clarity",
        question: "What good are you trying to understand or protect?",
        permissions: this.permissions({
          wisdom: true,
          teaching: true,
          planning: true,
          action: true,
          identity: true,
          lifeChapter: true,
          emotion: true,
          meaningProjection: true,
          emotionRecovery: false
        })
      },

      {
        name: "relationship_connection_domain",
        superDomain: "connect",
        priority: 800,
        authority: 800,
        textWeight: 95,
        signalWeight: 100,
        boostWeight: 30,
        maxScore: 250,
        text: [
          "alone", "lonely", "left me", "rejected", "abandoned",
          "relationship", "girlfriend", "fiance", "fiancée", "wife",
          "husband", "partner", "family", "connection"
        ],
        signals: ["connection", "attachment", "relationship", "belonging", "family"],
        leadOrgan: "emotion",
        mode: "restore_connection",
        question: "What part of this feels most disconnected?",
        permissions: this.permissions({
          emotion: true,
          relationship: true,
          lifeChapter: true,
          identity: true,
          teaching: false,
          meaningProjection: true
        })
      },

      {
        name: "family_parenthood_domain",
        superDomain: "connect",
        priority: 780,
        authority: 780,
        textWeight: 100,
        signalWeight: 105,
        boostWeight: 35,
        maxScore: 260,
        text: [
          "baby", "pregnant", "pregnancy", "daughter", "son", "child",
          "father", "mother", "parent", "family", "good enough father",
          "good enough mother"
        ],
        signals: [
          "fatherhood", "motherhood", "parenthood", "family transition",
          "family parenthood", "family"
        ],
        leadOrgan: "meaning",
        mode: "protect_life_chapter",
        question: "What does your family need from you in this season?",
        permissions: this.permissions({
          emotion: true,
          relationship: true,
          lifeChapter: true,
          identity: true,
          wisdom: true,
          action: true,
          teaching: false,
          meaningProjection: true
        })
      },

      {
        name: "identity_transition_domain",
        superDomain: "become",
        priority: 700,
        authority: 700,
        textWeight: 90,
        signalWeight: 95,
        boostWeight: 25,
        maxScore: 220,
        text: [
          "who am i", "who i am", "identity", "lost", "becoming",
          "outside of", "not myself", "new version", "transition"
        ],
        signals: ["identity", "identity transition", "role transition", "self concept"],
        leadOrgan: "identity",
        mode: "clarify_identity",
        question: "Which part of your identity feels unstable right now?",
        permissions: this.permissions({
          identity: true,
          lifeChapter: true,
          emotion: true,
          wisdom: true,
          meaningProjection: true,
          teaching: false
        })
      },

      {
        name: "career_transition_domain",
        superDomain: "do",
        priority: 650,
        authority: 650,
        textWeight: 85,
        signalWeight: 90,
        boostWeight: 25,
        maxScore: 220,
        text: [
          "job", "career", "military", "navy", "marine", "leaving",
          "resign", "retire", "promotion", "interview", "school",
          "graduate school", "pmhnp"
        ],
        signals: ["career", "military transition", "role transition", "work"],
        leadOrgan: "planner",
        mode: "transition_planning",
        question: "What future stability are you trying to protect?",
        permissions: this.permissions({
          planning: true,
          identity: true,
          lifeChapter: true,
          wisdom: true,
          teaching: false,
          meaningProjection: true
        })
      },

      {
        name: "decision_planning_domain",
        superDomain: "do",
        priority: 600,
        authority: 600,
        textWeight: 80,
        signalWeight: 75,
        boostWeight: 20,
        maxScore: 220,
        text: [
          "what should i do", "what do i do", "decide", "decision",
          "which option", "which choice", "plan", "next step",
          "prioritize", "focus on"
        ],
        signals: ["decision", "planning", "executive", "priority", "plan next step"],
        leadOrgan: "planner",
        mode: "plan_next_step",
        question: "What decision needs to be made first?",
        permissions: this.permissions({
          planning: true,
          teaching: true,
          wisdom: true,
          action: true,
          identity: false,
          lifeChapter: false,
          emotionRecovery: false,
          meaningProjection: false
        })
      }
    ];
  },

  permissions(overrides = {}) {
    return {
      safety: false,
      body: false,
      relationship: false,
      emotion: false,
      teaching: false,
      planning: false,
      identity: false,
      lifeChapter: false,
      wisdom: false,
      action: false,
      emotionRecovery: false,
      meaningProjection: false,
      memory: false,
      ...overrides
    };
  },

  getBlockedPermissions(lead = {}) {
    const blocked = [];
    const permissions = lead.permissions || {};

    if (permissions.lifeChapter === false) blocked.push("life_chapter");
    if (permissions.identity === false) blocked.push("identity");
    if (permissions.emotionRecovery === false) blocked.push("emotion_recovery");
    if (permissions.meaningProjection === false) blocked.push("meaning_projection");

    return blocked;
  },

  defaultDomain() {
    return {
      name: "general_understanding_domain",
      superDomain: "understand",
      priority: 300,
      authority: 300,
      score: 55,
      leadOrgan: "observer",
      mode: "continue_observing",
      question: "What are you trying to understand?",
      permissions: this.permissions({
        teaching: true,
        planning: true
      }),
      reasons: ["No strong universal domain detected."]
    };
  },

  collectSignals(summary = {}) {
    const list = [];
    const push = (value) => {
      if (!value) return;

      if (typeof value === "string") {
        list.push(this.normalize(value));
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(push);
        return;
      }

      if (typeof value === "object") {
        if (value.name) push(value.name);
        if (value.signal) push(value.signal);
        if (value.category) push(value.category);
        if (value.primary) push(value.primary);
        if (value.observationType) push(value.observationType);
      }
    };

    [
      summary.questionType,
      summary.focusType,
      summary.primaryNeed,
      summary.primaryHumanNeed,
      summary.needResponseMode,
      summary.strongestSignal,
      summary.strongestSignalCategory,
      summary.primaryLifeSignal,
      summary.primaryWeightedLifeSignal,
      summary.primaryLifeChapter,
      summary.leadIdentity,
      summary.dominantIdentity,
      summary.integratedValue,
      summary.emotionalClassification,
      summary.primaryEmotion,
      summary.surfaceEmotion,
      summary.underlyingEmotion,
      summary.rootNeed,
      summary.protecting,
      summary.wisdomTension,
      summary.highestGood,
      summary.primaryPriority,
      summary.executiveDecision,
      summary.organismFunction,
      summary.organismNeed,
      summary.observerHierarchyPrimaryObservation,
      summary.observerHierarchyPrimaryCategory,
      summary.strongestObservation,
      summary.strongestObservationCategory,
      summary.strongestObservationType
    ].forEach(push);

    if (Array.isArray(summary.observationLedger)) summary.observationLedger.forEach(push);
    if (Array.isArray(summary.rankedLedgerObservations)) summary.rankedLedgerObservations.forEach(push);
    if (Array.isArray(summary.rankedSignals)) summary.rankedSignals.forEach((item) => push(item.name));
    if (Array.isArray(summary.rankedLifeSignals)) summary.rankedLifeSignals.forEach((item) => push(item.name));
    if (Array.isArray(summary.rankedSalience)) summary.rankedSalience.forEach((item) => push(item.name));
    if (Array.isArray(summary.observerHierarchyRankedObservations)) summary.observerHierarchyRankedObservations.forEach(push);

    return [...new Set(list.filter(Boolean))];
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  cap(value, max = 220) {
    return Math.min(Number(value || 0), max);
  }
};