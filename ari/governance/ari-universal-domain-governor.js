// ari/governance/ari-universal-domain-governor.js
// Ari Universal Domain Governor
// Purpose: Rank universal domains before Ari interprets, routes, or composes.
// V1.0

window.Ari = window.Ari || {};

window.AriUniversalDomainGovernor = {
  version: "1.0.0",

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

    const ranked = domains.map(domain => {
      let score = 0;
      const reasons = [];

      const textHits = domain.text.filter(term => text.includes(term));
      const signalHits = signals.filter(signal =>
        domain.signals.some(term => signal.includes(term))
      );

      if (textHits.length) {
        score += domain.textWeight;
        reasons.push(`Text supports ${domain.name}: ${textHits.slice(0, 4).join(", ")}.`);
      }

      if (signalHits.length) {
        score += domain.signalWeight;
        reasons.push(`Signals support ${domain.name}: ${signalHits.slice(0, 4).join(", ")}.`);
      }

      if (domain.shouldBoost?.(summary, text, signals)) {
        score += domain.boostWeight || 20;
        reasons.push(`Context boost supports ${domain.name}.`);
      }

      return {
        name: domain.name,
        superDomain: domain.superDomain,
        authority: domain.authority,
        score: this.cap(score),
        leadOrgan: domain.leadOrgan,
        mode: domain.mode,
        question: domain.question,
        permissions: domain.permissions,
        reasons
      };
    })
    .filter(d => d.score > 0);

    if (ranked.length === 0) {
      ranked.push(this.defaultDomain());
    }

    ranked.sort((a, b) => {
      if (b.authority !== a.authority) return b.authority - a.authority;
      return b.score - a.score;
    });

    const lead = ranked[0];

    const blocked = this.getBlockedPermissions(lead, ranked);

    return {
      universalDomainGovernorRan: true,
      universalDomainGovernorVersion: this.version,

      domainLead: lead.name,
      domainSuperLead: lead.superDomain,
      domainLeadScore: lead.score,
      domainAuthority: lead.authority,
      domainLeadOrgan: lead.leadOrgan,
      domainMode: lead.mode,
      domainQuestion: lead.question,
      domainReasons: lead.reasons,

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

      shouldPreferTeaching:
        lead.name === "knowledge_teaching_domain",

      shouldPreferBodyStabilization:
        lead.superDomain === "survive" &&
        ["body_health_domain", "medical_domain", "sleep_recovery_domain"].includes(lead.name),

      shouldPreferSafety:
        lead.name === "critical_safety_domain",

      source: "ari-universal-domain-governor"
    };
  },

  getDomains() {
    return [
      {
        name: "critical_safety_domain",
        superDomain: "survive",
        authority: 1000,
        textWeight: 120,
        signalWeight: 120,
        boostWeight: 50,
        text: [
          "kill myself", "suicide", "self harm", "hurt myself", "hurt someone",
          "overdose", "can't stay safe", "cant stay safe", "abuse", "assault"
        ],
        signals: ["safety", "danger", "crisis", "self_harm", "harm", "security"],
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
        authority: 950,
        textWeight: 110,
        signalWeight: 115,
        boostWeight: 40,
        text: [
          "chest pain", "can't breathe", "cant breathe", "shortness of breath",
          "stroke", "seizure", "fainting", "bleeding", "severe pain",
          "pregnant", "fever", "infection", "dizzy"
        ],
        signals: ["medical", "body", "pain", "vital", "pregnancy", "health", "urgent"],
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
        })
      },

      {
        name: "sleep_recovery_domain",
        superDomain: "survive",
        authority: 900,
        textWeight: 100,
        signalWeight: 105,
        boostWeight: 35,
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
        name: "relationship_connection_domain",
        superDomain: "connect",
        authority: 800,
        textWeight: 90,
        signalWeight: 95,
        boostWeight: 30,
        text: [
          "alone", "lonely", "left me", "rejected", "abandoned",
          "relationship", "girlfriend", "fiance", "wife", "husband",
          "family", "connection"
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
        authority: 780,
        textWeight: 95,
        signalWeight: 100,
        boostWeight: 35,
        text: [
          "baby", "pregnant", "daughter", "son", "child", "father",
          "mother", "parent", "family", "good enough father", "good enough mother"
        ],
        signals: ["fatherhood", "motherhood", "parenthood", "family_transition", "family_parenthood"],
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
        authority: 700,
        textWeight: 90,
        signalWeight: 95,
        boostWeight: 25,
        text: [
          "who am i", "who i am", "identity", "lost", "becoming",
          "outside of", "not myself", "new version", "transition"
        ],
        signals: ["identity", "identity_transition", "role_transition", "self_concept"],
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
        authority: 650,
        textWeight: 85,
        signalWeight: 90,
        boostWeight: 25,
        text: [
          "job", "career", "military", "navy", "marine", "leaving",
          "resign", "retire", "promotion", "interview", "school"
        ],
        signals: ["career", "military_transition", "role_transition", "work"],
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
        authority: 600,
        textWeight: 80,
        signalWeight: 85,
        boostWeight: 20,
        text: [
          "what should i do", "what do i do", "decide", "decision",
          "which option", "plan", "next step", "how do i"
        ],
        signals: ["decision", "planning", "executive", "priority", "clarity"],
        leadOrgan: "planner",
        mode: "plan_next_step",
        question: "What decision needs to be made first?",
        permissions: this.permissions({
          planning: true,
          teaching: true,
          identity: false,
          lifeChapter: false,
          emotionRecovery: false,
          meaningProjection: false
        })
      },

      {
        name: "knowledge_teaching_domain",
        superDomain: "understand",
        authority: 500,
        textWeight: 100,
        signalWeight: 95,
        boostWeight: 30,
        text: [
          "what is", "what are", "how does", "how do", "explain",
          "teach me", "why does", "quantum", "code", "javascript",
          "html", "css", "science"
        ],
        signals: ["teaching", "learning", "knowledge", "teacher", "curiosity", "understanding"],
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
        name: "creative_building_domain",
        superDomain: "do",
        authority: 560,
        textWeight: 85,
        signalWeight: 85,
        boostWeight: 20,
        text: [
          "build", "building", "create", "coding", "app", "ari",
          "calbuddy", "project", "github", "file", "code"
        ],
        signals: ["builder", "creative", "project", "development", "code"],
        leadOrgan: "builder",
        mode: "build_or_debug",
        question: "What are we building or fixing first?",
        permissions: this.permissions({
          teaching: true,
          planning: true,
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

  getBlockedPermissions(lead = {}, ranked = []) {
    const blocked = [];

    if (lead.permissions.lifeChapter === false) blocked.push("life_chapter");
    if (lead.permissions.identity === false) blocked.push("identity");
    if (lead.permissions.emotionRecovery === false) blocked.push("emotion_recovery");
    if (lead.permissions.meaningProjection === false) blocked.push("meaning_projection");

    return blocked;
  },

  defaultDomain() {
    return {
      name: "general_understanding_domain",
      superDomain: "understand",
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

    const push = value => {
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
        if (value.category) push(value.category);
        if (value.primary) push(value.primary);
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
      summary.organismNeed
    ].forEach(push);

    if (Array.isArray(summary.rankedSignals)) {
      summary.rankedSignals.forEach(item => push(item.name));
    }

    if (Array.isArray(summary.rankedLifeSignals)) {
      summary.rankedLifeSignals.forEach(item => push(item.name));
    }

    if (Array.isArray(summary.rankedSalience)) {
      summary.rankedSalience.forEach(item => push(item.name));
    }

    return [...new Set(list.filter(Boolean))];
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

  cap(value, max = 120) {
    return Math.min(Number(value || 0), max);
  }
};