// ari/observer-system/ari-life-signal-extractor.js
// Ari Life Signal Extractor
// Purpose: Observe life-context, transition, identity, capacity, and mission clues
// without declaring a definitive life chapter.
// V2.0.0 — Multi-Signal Life Context Evidence / Ledger Compatible

window.Ari = window.Ari || {};

window.Ari.lifeSignalExtractor = {
  version: "2.0.0",

  /* =====================================================
     MAIN ENTRY
  ===================================================== */

  extract(message = "", context = {}) {
    const input = this.normalizeInput(message, context);
    const text = input.text;
    const signals = [];

    const add = ({
      name,
      type = "life_signal",
      category = "life_context",
      domain = "life",
      confidence = 0.6,
      evidence = [],
      inferenceLevel = "observed",
      evidenceClass = "direct_text",
      subject = "user",
      target = null,
      relation = null,
      temporalStatus = "current",
      metadata = {}
    } = {}) => {
      if (!name) return null;

      const evidenceList = Array.isArray(evidence)
        ? evidence.filter(Boolean)
        : [evidence].filter(Boolean);

      const existing = signals.find(item =>
        item.name === name &&
        item.type === type &&
        item.subject === subject &&
        item.target === target
      );

      if (existing) {
        existing.confidence = Math.max(existing.confidence, confidence);
        existing.evidence = [
          ...new Set([
            ...(existing.evidence || []),
            ...evidenceList
          ])
        ];
        existing.matchCount = Number(existing.matchCount || 1) + 1;
        existing.metadata = {
          ...(existing.metadata || {}),
          ...metadata
        };
        return existing;
      }

      const signal = {
        name,
        signal: name,
        value: name,

        type,
        category,
        domain,

        confidence,
        evidence: evidenceList,
        inferenceLevel,
        evidenceClass,

        subject,
        target,
        relation,

        temporalStatus,
        matchCount: 1,

        source: "ari-life-signal-extractor",
        sourceVersion: this.version,
        sourceStage: "perception",

        metadata
      };

      signals.push(signal);
      return signal;
    };

    this.detectLifeDomains(text, add);
    this.detectTransitions(text, add);
    this.detectIdentityMovement(text, add);
    this.detectMissionAndMeaning(text, add);
    this.detectCapacityAndPressure(text, add);
    this.detectLossAndDisruption(text, add);
    this.detectStabilityAndCommitment(text, add);

    this.buildCompositeHypotheses(signals, add);

    const rankedSignals = this.rankSignals(signals);
    const directSignals = rankedSignals.filter(signal =>
      signal.inferenceLevel === "observed"
    );

    const inferredSignals = rankedSignals.filter(signal =>
      signal.inferenceLevel !== "observed"
    );

    const primarySignal =
      rankedSignals.find(signal => signal.type === "life_transition_hypothesis") ||
      rankedSignals[0] ||
      null;

    return {
      lifeSignalExtractorRan: true,
      lifeSignalExtractorVersion: this.version,
      lifeSignalExtractorSource: "ari-life-signal-extractor",

      rawText: input.rawText,
      normalizedText: text,

      signals: rankedSignals,
      signalNames: [...new Set(rankedSignals.map(item => item.name))],

      directSignals,
      inferredSignals,

      primarySignal,
      primarySignalName: primarySignal?.name || null,
      primarySignalConfidence: primarySignal?.confidence || 0,

      hasLifeContextSignal: directSignals.length > 0,
      hasTransitionEvidence: rankedSignals.some(item =>
        item.type === "transition_indicator"
      ),
      hasMajorLifeSignal: rankedSignals.some(item =>
        item.type === "life_transition_hypothesis" &&
        item.confidence >= 0.72
      ),

      domains: [...new Set(rankedSignals.map(item => item.domain).filter(Boolean))],
      pressures: rankedSignals.filter(item => item.type === "life_pressure"),
      transitions: rankedSignals.filter(item =>
        item.type === "transition_indicator" ||
        item.type === "life_transition_hypothesis"
      ),

      observations: rankedSignals.map(signal =>
        this.toLedgerObservation(signal, input.rawText)
      ),

      authority: {
        canObserveLifeContext: true,
        canDetectTransitionIndicators: true,
        canCreateLifeSignalHypotheses: true,

        canDeclareLifeChapter: false,
        canChoosePrimaryMeaning: false,
        canChooseLane: false,
        canDetermineSafetySeverity: false,
        canAnswerUser: false,

        role: "life_context_and_transition_evidence_only"
      },

      source: "ari-life-signal-extractor"
    };
  },

  analyze(input = {}) {
    if (typeof input === "string") {
      return this.extract(input);
    }

    const summary = input.summary || input || {};

    return this.extract(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "",
      summary
    );
  },

  observe(input = {}) {
    return this.analyze(input);
  },

  /* =====================================================
     LIFE DOMAIN CLUES
  ===================================================== */

  detectLifeDomains(text, add) {
    this.runTable(text, add, this.tables.lifeDomains);
  },

  tables: {
    lifeDomains: [
      {
        name: "family_context",
        type: "life_context_signal",
        domain: "family",
        confidence: 0.74,
        terms: [
          "family", "wife", "husband", "spouse", "partner",
          "daughter", "son", "child", "kid", "baby",
          "mother", "mom", "father", "dad", "brother", "sister"
        ]
      },

      {
        name: "parenthood_context",
        type: "life_context_signal",
        domain: "parenthood",
        confidence: 0.78,
        terms: [
          "pregnant", "pregnancy", "expecting a baby",
          "having a baby", "becoming a father", "becoming a dad",
          "becoming a mother", "becoming a parent",
          "newborn", "due date", "born soon"
        ]
      },

      {
        name: "military_context",
        type: "life_context_signal",
        domain: "military",
        confidence: 0.76,
        terms: [
          "military", "navy", "marine", "marines",
          "army", "air force", "service member",
          "orders", "deployment", "command"
        ]
      },

      {
        name: "career_context",
        type: "life_context_signal",
        domain: "career",
        confidence: 0.72,
        terms: [
          "career", "job", "employment", "work",
          "promotion", "interview", "resume",
          "applying", "civilian job", "new position"
        ]
      },

      {
        name: "education_context",
        type: "life_context_signal",
        domain: "education",
        confidence: 0.72,
        terms: [
          "school", "college", "university", "degree",
          "graduate school", "program", "pmhnp",
          "nurse practitioner", "studying", "course"
        ]
      },

      {
        name: "creative_project_context",
        type: "life_context_signal",
        domain: "creative_project",
        confidence: 0.72,
        terms: [
          "building ari", "build ari", "calbuddy", "cal buddy",
          "my app", "my project", "project", "product",
          "architecture", "system", "engine", "platform"
        ]
      },

      {
        name: "financial_context",
        type: "life_context_signal",
        domain: "financial",
        confidence: 0.72,
        terms: [
          "money", "debt", "budget", "income",
          "salary", "bills", "rent", "mortgage",
          "financial security", "can't afford", "cant afford"
        ]
      },

      {
        name: "health_context",
        type: "life_context_signal",
        domain: "health",
        confidence: 0.72,
        terms: [
          "health", "illness", "diagnosis", "hospital",
          "surgery", "recovery", "injury", "medical condition"
        ]
      },

      {
        name: "relationship_context",
        type: "life_context_signal",
        domain: "relationship",
        confidence: 0.72,
        terms: [
          "relationship", "marriage", "married", "wedding",
          "divorce", "breakup", "partner", "spouse",
          "dating", "engaged", "fiancé", "fiance"
        ]
      }
    ]
  },

  /* =====================================================
     TRANSITION INDICATORS
  ===================================================== */

  detectTransitions(text, add) {
    const patterns = [
      {
        name: "entering_new_role",
        regex: /\b(becoming|starting as|about to become|stepping into|taking on the role of)\b/,
        confidence: 0.82
      },

      {
        name: "leaving_current_role",
        regex: /\b(leaving|separating from|resigning from|retiring from|getting out of|walking away from)\b/,
        confidence: 0.84
      },

      {
        name: "active_change",
        regex: /\b(changing|transitioning|moving from|shifting from|switching to|starting over)\b/,
        confidence: 0.8
      },

      {
        name: "future_transition",
        regex: /\b(soon|next month|next year|about to|preparing to|getting ready to)\b/,
        confidence: 0.7
      },

      {
        name: "new_chapter_language",
        regex: /\b(new chapter|different chapter|next chapter|chapter of my life|new season|season of my life)\b/,
        confidence: 0.86
      },

      {
        name: "ending_or_closure",
        regex: /\b(ending|coming to an end|closing this chapter|finished with|done with)\b/,
        confidence: 0.8
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "transition_indicator",
        category: "transition",
        domain: "life",
        confidence: pattern.confidence,
        evidence: match[0],
        metadata: {
          transitionIndicator: true
        }
      });
    });
  },

  /* =====================================================
     IDENTITY MOVEMENT
  ===================================================== */

  detectIdentityMovement(text, add) {
    const patterns = [
      {
        name: "identity_questioning",
        regex: /\b(who am i|who i am|what kind of person am i|what does this say about me)\b/,
        confidence: 0.84
      },

      {
        name: "identity_change",
        regex: /\b(i am becoming|i'm becoming|im becoming|changing who i am|different person|new version of me)\b/,
        confidence: 0.84
      },

      {
        name: "role_conflict",
        regex: /\b(torn between|which part of me|which identity|who should i be|trying to be both)\b/,
        confidence: 0.82
      },

      {
        name: "identity_loss",
        regex: /\b(don't know who i am|dont know who i am|lost myself|not myself anymore)\b/,
        confidence: 0.86
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "identity_signal",
        category: "identity",
        domain: "identity",
        confidence: pattern.confidence,
        evidence: match[0]
      });
    });
  },

  /* =====================================================
     MISSION, PURPOSE, AND MEANING
  ===================================================== */

  detectMissionAndMeaning(text, add) {
    const patterns = [
      {
        name: "purpose_language",
        regex: /\b(purpose|calling|what i was meant to do|what i am meant to do|built for this)\b/,
        confidence: 0.82
      },

      {
        name: "meaningful_work",
        regex: /\b(meaningful work|something meaningful|work that matters|make a difference)\b/,
        confidence: 0.82
      },

      {
        name: "mission_commitment",
        regex: /\b(my mission|this mission|committed to building|have to finish this|need to bring this to life)\b/,
        confidence: 0.8
      },

      {
        name: "legacy_orientation",
        regex: /\b(legacy|leave behind|what i want to be remembered for|build something that lasts)\b/,
        confidence: 0.8
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "meaning_signal",
        category: "meaning",
        domain: "purpose",
        confidence: pattern.confidence,
        evidence: match[0]
      });
    });
  },

  /* =====================================================
     CAPACITY AND PRESSURE
  ===================================================== */

  detectCapacityAndPressure(text, add) {
    const patterns = [
      {
        name: "capacity_pressure",
        regex: /\b(tired|exhausted|burned out|burnt out|overwhelmed|no energy|running on empty)\b/,
        confidence: 0.84
      },

      {
        name: "sleep_or_rest_deficit",
        regex: /\b(no sleep|not sleeping|need rest|need a break|take a break|slow down|can't rest|cant rest)\b/,
        confidence: 0.82
      },

      {
        name: "time_pressure",
        regex: /\b(running out of time|not enough time|every free moment|no time|deadline|too late)\b/,
        confidence: 0.82
      },

      {
        name: "achievement_pressure",
        regex: /\b(falling behind|fall behind|lose momentum|losing momentum|lose progress|need to keep going)\b/,
        confidence: 0.82
      },

      {
        name: "responsibility_load",
        regex: /\b(too much on my plate|too many responsibilities|everyone depends on me|have to handle everything)\b/,
        confidence: 0.84
      },

      {
        name: "competing_priorities",
        regex: /\b(torn between|trying to balance|juggling|too many priorities|can't do everything|cant do everything)\b/,
        confidence: 0.84
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "life_pressure",
        category: "pressure",
        domain: "capacity",
        confidence: pattern.confidence,
        evidence: match[0]
      });
    });
  },

  /* =====================================================
     LOSS, DISRUPTION, AND INSTABILITY
  ===================================================== */

  detectLossAndDisruption(text, add) {
    const patterns = [
      {
        name: "relationship_loss",
        regex: /\b(breakup|divorce|separated from my partner|relationship ended|lost my relationship)\b/,
        domain: "relationship",
        confidence: 0.84
      },

      {
        name: "career_disruption",
        regex: /\b(lost my job|fired|laid off|career ended|leaving my career)\b/,
        domain: "career",
        confidence: 0.84
      },

      {
        name: "bereavement_or_death",
        regex: /\b(died|passed away|lost my mother|lost my father|lost my wife|lost my husband|grieving)\b/,
        domain: "loss",
        confidence: 0.88
      },

      {
        name: "health_disruption",
        regex: /\b(new diagnosis|serious illness|major surgery|health changed|can't do what i used to)\b/,
        domain: "health",
        confidence: 0.84
      },

      {
        name: "financial_instability",
        regex: /\b(can't pay|cant pay|losing my home|behind on bills|financial crisis|going broke)\b/,
        domain: "financial",
        confidence: 0.86
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "life_disruption_signal",
        category: "disruption",
        domain: pattern.domain,
        confidence: pattern.confidence,
        evidence: match[0]
      });
    });
  },

  /* =====================================================
     STABILITY AND COMMITMENT
  ===================================================== */

  detectStabilityAndCommitment(text, add) {
    const patterns = [
      {
        name: "long_term_commitment",
        regex: /\b(long term|for the rest of my life|committed to|not giving up|sticking with)\b/,
        confidence: 0.74
      },

      {
        name: "stable_role",
        regex: /\b(for years|been doing this for|my normal routine|nothing has changed)\b/,
        confidence: 0.72
      },

      {
        name: "chosen_direction",
        regex: /\b(i decided|i've decided|ive decided|i chose|i'm going to|im going to)\b/,
        confidence: 0.78
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "stability_or_commitment_signal",
        category: "commitment",
        domain: "life",
        confidence: pattern.confidence,
        evidence: match[0]
      });
    });
  },

  /* =====================================================
     COMPOSITE HYPOTHESES
  ===================================================== */

  buildCompositeHypotheses(signals, add) {
    const has = name => signals.some(signal => signal.name === name);
    const domain = value => signals.some(signal => signal.domain === value);
    const evidenceFor = (...names) =>
      signals
        .filter(signal => names.includes(signal.name))
        .flatMap(signal => signal.evidence || []);

    const transitionEvidence =
      has("entering_new_role") ||
      has("leaving_current_role") ||
      has("active_change") ||
      has("new_chapter_language") ||
      has("future_transition");

    if (domain("parenthood") && transitionEvidence) {
      add({
        name: "parenthood_transition",
        type: "life_transition_hypothesis",
        category: "transition",
        domain: "parenthood",
        confidence: 0.82,
        evidence: [
          ...evidenceFor(
            "parenthood_context",
            "entering_new_role",
            "future_transition",
            "new_chapter_language"
          )
        ],
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference",
        metadata: {
          requiresCorroboration: true,
          declaredAsHypothesis: true
        }
      });
    }

    if (domain("military") && has("leaving_current_role")) {
      add({
        name: "military_exit_transition",
        type: "life_transition_hypothesis",
        category: "transition",
        domain: "military",
        confidence: 0.84,
        evidence: evidenceFor("military_context", "leaving_current_role"),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }

    if (
      (domain("career") || domain("education")) &&
      transitionEvidence
    ) {
      add({
        name: "career_or_education_transition",
        type: "life_transition_hypothesis",
        category: "transition",
        domain: domain("education") ? "education" : "career",
        confidence: 0.76,
        evidence: signals
          .filter(signal =>
            ["career", "education", "life"].includes(signal.domain)
          )
          .flatMap(signal => signal.evidence || []),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }

    if (
      domain("creative_project") &&
      (
        has("mission_commitment") ||
        has("meaningful_work") ||
        has("purpose_language")
      )
    ) {
      add({
        name: "creative_mission",
        type: "life_transition_hypothesis",
        category: "mission",
        domain: "creative_project",
        confidence: 0.78,
        evidence: signals
          .filter(signal =>
            signal.domain === "creative_project" ||
            signal.domain === "purpose"
          )
          .flatMap(signal => signal.evidence || []),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }

    if (
      (
        has("identity_change") ||
        has("identity_questioning") ||
        has("identity_loss")
      ) &&
      transitionEvidence
    ) {
      add({
        name: "identity_transition",
        type: "life_transition_hypothesis",
        category: "transition",
        domain: "identity",
        confidence: 0.8,
        evidence: signals
          .filter(signal =>
            signal.domain === "identity" ||
            signal.type === "transition_indicator"
          )
          .flatMap(signal => signal.evidence || []),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }

    if (
      has("capacity_pressure") &&
      (
        has("achievement_pressure") ||
        has("time_pressure") ||
        has("responsibility_load")
      )
    ) {
      add({
        name: "capacity_achievement_conflict",
        type: "life_tension_hypothesis",
        category: "tension",
        domain: "capacity",
        confidence: 0.82,
        evidence: evidenceFor(
          "capacity_pressure",
          "achievement_pressure",
          "time_pressure",
          "responsibility_load"
        ),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }

    if (
      has("competing_priorities") &&
      (
        domain("family") ||
        domain("career") ||
        domain("creative_project")
      )
    ) {
      add({
        name: "role_priority_conflict",
        type: "life_tension_hypothesis",
        category: "tension",
        domain: "life",
        confidence: 0.78,
        evidence: signals
          .filter(signal =>
            signal.name === "competing_priorities" ||
            ["family", "career", "creative_project"].includes(signal.domain)
          )
          .flatMap(signal => signal.evidence || []),
        inferenceLevel: "inferred",
        evidenceClass: "corroborated_inference"
      });
    }
  },

  /* =====================================================
     TABLE RUNNER
  ===================================================== */

  runTable(text, add, table = []) {
    table.forEach(group => {
      const matches = [];

      (group.terms || []).forEach(term => {
        const match = this.findTerm(text, term);
        if (match) matches.push(match);
      });

      (group.patterns || []).forEach(regex => {
        const match = text.match(regex);
        if (match?.[0]) matches.push(match[0]);
      });

      matches.forEach(evidence => {
        add({
          name: group.name,
          type: group.type,
          category: group.category || "life_context",
          domain: group.domain || "life",
          confidence: group.confidence || 0.7,
          evidence
        });
      });
    });
  },

  /* =====================================================
     RANKING
  ===================================================== */

  typePriority: {
    life_transition_hypothesis: 98,
    life_tension_hypothesis: 94,
    life_disruption_signal: 92,
    transition_indicator: 88,
    identity_signal: 84,
    life_pressure: 82,
    meaning_signal: 78,
    stability_or_commitment_signal: 74,
    life_context_signal: 68,
    life_signal: 60
  },

  rankSignals(signals = []) {
    return signals
      .map(signal => {
        const priority = this.typePriority[signal.type] || 60;
        const corroboration = Math.min(
          10,
          Math.max(0, Number(signal.matchCount || 1) - 1) * 2
        );

        const evidenceCount = Math.min(
          8,
          Math.max(0, Number(signal.evidence?.length || 0) - 1)
        );

        const score = Math.round(
          priority * 0.5 +
          signal.confidence * 100 * 0.4 +
          corroboration +
          evidenceCount
        );

        return {
          ...signal,
          priority,
          score
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.confidence - a.confidence;
      });
  },

  /* =====================================================
     LEDGER HANDOFF
  ===================================================== */

  toLedgerObservation(signal = {}, rawText = "") {
    return {
      type: signal.type,
      value: signal.name,
      signal: signal.name,

      category: signal.category,
      domain: signal.domain,

      subject: signal.subject || "user",
      target: signal.target || null,
      relation: signal.relation || null,

      confidence: signal.confidence,
      inferenceLevel: signal.inferenceLevel,
      evidenceClass: signal.evidenceClass,

      temporalStatus: signal.temporalStatus || "current",
      lifespan:
        signal.type === "life_context_signal"
          ? "conversation"
          : "turn",

      evidence: (signal.evidence || []).map(item =>
        this.createEvidenceRecord(rawText, item)
      ),

      source: "ari-life-signal-extractor",
      sourceVersion: this.version,
      sourceStage: "perception",

      metadata: {
        score: signal.score || null,
        priority: signal.priority || null,
        matchCount: signal.matchCount || 1,
        ...(signal.metadata || {})
      }
    };
  },

  createEvidenceRecord(rawText = "", evidence = "") {
    const text = String(evidence || "");
    const raw = String(rawText || "");
    const start = raw.toLowerCase().indexOf(text.toLowerCase());

    return {
      text,
      sourceField: "userMessage",
      start: start >= 0 ? start : null,
      end: start >= 0 ? start + text.length : null
    };
  },

  /* =====================================================
     INPUT AND TEXT HELPERS
  ===================================================== */

  normalizeInput(message = "", context = {}) {
    if (message && typeof message === "object") {
      const summary = message.summary || message;

      const rawText =
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "";

      return {
        rawText,
        text: this.normalize(rawText),
        context: summary
      };
    }

    return {
      rawText: String(message || ""),
      text: this.normalize(message),
      context: context || {}
    };
  },

  findTerm(text = "", term = "") {
    const escaped = this.escapeRegex(term);

    const match = String(text || "").match(
      new RegExp(`(^|\\b)(${escaped})(?=\\b|$)`, "i")
    );

    return match?.[2] || null;
  },

  includesAny(text = "", terms = []) {
    return terms.some(term => Boolean(this.findTerm(text, term)));
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI LIFE SIGNAL EXTRACTOR LOADED:",
  window.Ari.lifeSignalExtractor?.version
);