// ari/observer-system/ari-life-signal-extractor.js
// Ari Life Signal Extractor
// Purpose: Observe explicit life-context, transition, identity, capacity,
// disruption, commitment, and meaning evidence without declaring a life chapter,
// choosing canonical meaning, or replacing the user's requested operation.
// V3.0.0 — Context/Transition Separation / Explicit Evidence Dominance / Advisory Hypotheses

window.Ari = window.Ari || {};

window.Ari.lifeSignalExtractor = {
  version: "3.0.0",

  /* =====================================================
     MAIN ENTRY
  ===================================================== */

  extract(message = "", context = {}) {
    const input = this.normalizeInput(message, context);
    const rawText = input.rawText;
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
      role = "context_clue",
      explicit = true,
      subject = "user",
      target = null,
      relation = null,
      temporalStatus = "current",
      lifespan = "turn",
      metadata = {}
    } = {}) => {
      if (!name) return null;

      const evidenceList = this.asArray(evidence).filter(Boolean);
      if (!evidenceList.length && explicit === true) return null;

      const normalizedName = this.normalizeToken(name);

      const existing = signals.find(item =>
        item.name === normalizedName &&
        item.type === type &&
        item.role === role &&
        item.subject === subject &&
        item.target === target
      );

      if (existing) {
        existing.confidence = Math.max(existing.confidence, this.normalizeConfidence(confidence));
        existing.evidence = [...new Set([...(existing.evidence || []), ...evidenceList])];
        existing.matchCount = Number(existing.matchCount || 1) + Math.max(1, evidenceList.length);
        existing.explicit = existing.explicit === true || explicit === true;
        existing.metadata = { ...(existing.metadata || {}), ...metadata };
        return existing;
      }

      const signal = {
        name: normalizedName,
        signal: normalizedName,
        value: normalizedName,

        type,
        category,
        domain,

        confidence: this.normalizeConfidence(confidence),
        evidence: evidenceList,
        inferenceLevel,
        evidenceClass,

        role,
        explicit: explicit === true,

        subject,
        target,
        relation,

        temporalStatus,
        lifespan,
        matchCount: Math.max(1, evidenceList.length),

        source: "ari-life-signal-extractor",
        sourceVersion: this.version,
        sourceStage: "perception",

        metadata
      };

      signals.push(signal);
      return signal;
    };

    this.detectLifeDomains(text, add);
    this.detectExplicitTransitions(text, add);
    this.detectIdentityEvidence(text, add);
    this.detectMeaningAndMissionEvidence(text, add);
    this.detectCapacityAndPressure(text, add);
    this.detectLossAndDisruption(text, add);
    this.detectCommitmentAndStability(text, add);

    this.buildAdvisoryRelationships(signals, add);

    const rankedSignals = this.rankSignals(signals);
    const directSignals = rankedSignals.filter(signal => signal.inferenceLevel === "observed");
    const inferredSignals = rankedSignals.filter(signal => signal.inferenceLevel !== "observed");

    const contextualSignals = rankedSignals.filter(signal => signal.role === "context_clue");
    const transitionIndicators = rankedSignals.filter(signal => signal.role === "transition_indicator");
    const pressureSignals = rankedSignals.filter(signal => signal.role === "pressure_clue");
    const disruptionSignals = rankedSignals.filter(signal => signal.role === "disruption_clue");
    const identitySignals = rankedSignals.filter(signal => signal.role === "identity_clue");
    const meaningSignals = rankedSignals.filter(signal => signal.role === "meaning_clue");
    const commitmentSignals = rankedSignals.filter(signal => signal.role === "commitment_clue");
    const advisoryRelationships = rankedSignals.filter(signal => signal.role === "advisory_relationship");

    const strongestDirectSignal =
      directSignals.find(signal => signal.role !== "context_clue") ||
      directSignals[0] ||
      null;

    const primarySignal =
      strongestDirectSignal ||
      rankedSignals[0] ||
      null;

    const explicitTransitionEvidence = transitionIndicators.length > 0;
    const corroboratedTransitionRelationships = advisoryRelationships.filter(signal =>
      signal.type === "life_transition_hypothesis" &&
      signal.metadata?.corroborated === true
    );

    return {
      lifeSignalExtractorRan: true,
      lifeSignalExtractorVersion: this.version,
      lifeSignalExtractorSource: "ari-life-signal-extractor",

      rawText,
      normalizedText: text,

      signals: rankedSignals,
      signalNames: [...new Set(rankedSignals.map(item => item.name))],

      directSignals,
      inferredSignals,

      contextualSignals,
      transitionIndicators,
      pressureSignals,
      disruptionSignals,
      identitySignals,
      meaningSignals,
      commitmentSignals,
      advisoryRelationships,

      primarySignal,
      primarySignalName: primarySignal?.name || null,
      primarySignalConfidence: primarySignal?.confidence || 0,
      primarySignalAdvisoryOnly: true,

      hasLifeContextSignal: contextualSignals.length > 0,
      hasTransitionEvidence: explicitTransitionEvidence,

      hasCorroboratedTransitionRelationship:
        corroboratedTransitionRelationships.length > 0,

      hasMajorLifeSignal:
        explicitTransitionEvidence &&
        corroboratedTransitionRelationships.some(signal =>
          signal.confidence >= 0.78
        ),

      domains: [...new Set(rankedSignals.map(item => item.domain).filter(Boolean))],

      pressures: pressureSignals,

      transitions: [
        ...transitionIndicators,
        ...corroboratedTransitionRelationships
      ],

      observations: rankedSignals.map(signal =>
        this.toLedgerObservation(signal, rawText)
      ),

      lifeContextSummary: this.buildLifeContextSummary({
        contextualSignals,
        transitionIndicators,
        pressureSignals,
        disruptionSignals,
        identitySignals,
        meaningSignals,
        commitmentSignals,
        advisoryRelationships
      }),

      authority: {
        canObserveLifeContext: true,
        canObserveExplicitTransitionLanguage: true,
        canObserveIdentityLanguage: true,
        canObservePressureLanguage: true,
        canObserveDisruptionLanguage: true,
        canCreateAdvisoryRelationships: true,

        canDeclareLifeChapter: false,
        canDeclareMajorLifeTransition: false,
        canChoosePrimaryMeaning: false,
        canReplaceExplicitRequest: false,
        canChooseConversationFunction: false,
        canChooseLane: false,
        canChooseRoute: false,
        canDetermineSafetySeverity: false,
        canAnswerUser: false,

        role: "life_context_and_transition_evidence_only"
      },

      source: "ari-life-signal-extractor"
    };
  },

  analyze(input = {}) {
    if (typeof input === "string") return this.extract(input);

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
     LIFE-DOMAIN CONTEXT
     Domain words are context only. They do not establish
     transitions, conflict, mission, pressure, or meaning.
  ===================================================== */

  detectLifeDomains(text = "", add = () => {}) {
    this.runContextTable(text, add, this.tables.lifeDomains);
  },

  tables: {
    lifeDomains: [
      {
        name: "family_context",
        domain: "family",
        confidence: 0.72,
        terms: [
          "family", "wife", "husband", "spouse", "partner",
          "daughter", "son", "child", "kid", "baby",
          "mother", "mom", "father", "dad", "brother", "sister"
        ]
      },

      {
        name: "parenthood_context",
        domain: "parenthood",
        confidence: 0.76,
        terms: [
          "pregnant", "pregnancy", "expecting a baby",
          "having a baby", "becoming a father", "becoming a dad",
          "becoming a mother", "becoming a parent",
          "newborn", "due date", "born soon"
        ]
      },

      {
        name: "military_context",
        domain: "military",
        confidence: 0.74,
        terms: [
          "military", "navy", "marine", "marines",
          "army", "air force", "service member",
          "orders", "deployment", "command"
        ]
      },

      {
        name: "career_context",
        domain: "career",
        confidence: 0.7,
        terms: [
          "career", "job", "employment", "work",
          "promotion", "interview", "resume",
          "applying", "civilian job", "new position"
        ]
      },

      {
        name: "education_context",
        domain: "education",
        confidence: 0.7,
        terms: [
          "school", "college", "university", "degree",
          "graduate school", "program", "pmhnp",
          "nurse practitioner", "studying", "course"
        ]
      },

      {
        name: "creative_project_context",
        domain: "creative_project",
        confidence: 0.7,
        terms: [
          "building ari", "build ari", "calbuddy", "cal buddy",
          "my app", "my project", "project", "product",
          "architecture", "system", "engine", "platform"
        ]
      },

      {
        name: "financial_context",
        domain: "financial",
        confidence: 0.7,
        terms: [
          "money", "debt", "budget", "income",
          "salary", "bills", "rent", "mortgage",
          "financial security", "can't afford", "cant afford"
        ]
      },

      {
        name: "health_context",
        domain: "health",
        confidence: 0.7,
        terms: [
          "health", "illness", "diagnosis", "hospital",
          "surgery", "recovery", "injury", "medical condition"
        ]
      },

      {
        name: "relationship_context",
        domain: "relationship",
        confidence: 0.7,
        terms: [
          "relationship", "marriage", "married", "wedding",
          "divorce", "breakup", "partner", "spouse",
          "dating", "engaged", "fiancé", "fiance"
        ]
      }
    ]
  },

  runContextTable(text = "", add = () => {}, table = []) {
    table.forEach(group => {
      const matches = [];

      (group.terms || []).forEach(term => {
        const match = this.findTerm(text, term);
        if (match) matches.push(match);
      });

      if (!matches.length) return;

      add({
        name: group.name,
        type: "life_context_signal",
        category: "life_context",
        domain: group.domain || "life",
        confidence: group.confidence || 0.68,
        evidence: matches,
        role: "context_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        temporalStatus: "unspecified",
        lifespan: "turn",
        metadata: {
          contextOnly: true,
          doesNotEstablishTransition: true,
          doesNotEstablishConflict: true,
          doesNotEstablishPrimaryMeaning: true,
          doesNotReplaceUserRequest: true
        }
      });
    });
  },

  /* =====================================================
     EXPLICIT TRANSITION INDICATORS
  ===================================================== */

  detectExplicitTransitions(text = "", add = () => {}) {
    const patterns = [
      {
        name: "entering_new_role",
        domain: "life",
        regex: /\b(?:becoming|starting as|about to become|stepping into|taking on the role of)\b/,
        confidence: 0.84
      },

      {
        name: "leaving_current_role",
        domain: "life",
        regex: /\b(?:leaving|separating from|resigning from|retiring from|getting out of|walking away from)\b/,
        confidence: 0.86
      },

      {
        name: "active_role_change",
        domain: "life",
        regex: /\b(?:transitioning from|moving from .+ to|shifting from .+ to|switching from .+ to|changing careers|starting over)\b/,
        confidence: 0.84
      },

      {
        name: "preparing_for_change",
        domain: "life",
        regex: /\b(?:preparing to|getting ready to|planning to leave|planning to start|about to leave|about to start)\b/,
        confidence: 0.8
      },

      {
        name: "explicit_new_chapter_language",
        domain: "life",
        regex: /\b(?:new chapter|different chapter|next chapter|chapter of my life|new season|season of my life)\b/,
        confidence: 0.88
      },

      {
        name: "explicit_closure_language",
        domain: "life",
        regex: /\b(?:closing this chapter|this chapter is ending|coming to an end|finished with this phase|done with this phase)\b/,
        confidence: 0.84
      }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (!match) return;

      add({
        name: pattern.name,
        type: "transition_indicator",
        category: "transition",
        domain: pattern.domain,
        confidence: pattern.confidence,
        evidence: match[0],
        role: "transition_indicator",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        temporalStatus: this.inferTransitionTemporalStatus(text),
        lifespan: "turn",
        metadata: {
          explicitTransitionLanguage: true,
          transitionIndicator: true,
          doesNotDeclareLifeChapter: true
        }
      });
    });
  },

  inferTransitionTemporalStatus(text = "") {
    if (/\b(?:already|currently|right now|now|in the middle of)\b/.test(text)) return "current";
    if (/\b(?:soon|next month|next year|about to|preparing to|getting ready to)\b/.test(text)) return "future";
    if (/\b(?:used to|previously|last year|years ago|before)\b/.test(text)) return "past";
    return "unspecified";
  },

  /* =====================================================
     IDENTITY EVIDENCE
  ===================================================== */

  detectIdentityEvidence(text = "", add = () => {}) {
    const patterns = [
      {
        name: "identity_questioning",
        regex: /\b(?:who am i|what kind of person am i|what does this say about me)\b/,
        confidence: 0.86
      },

      {
        name: "identity_change_language",
        regex: /\b(?:i am becoming|i'm becoming|im becoming|changing who i am|a different person|new version of me)\b/,
        confidence: 0.86
      },

      {
        name: "identity_role_conflict",
        regex: /\b(?:which part of me|which identity|who should i be|trying to be both versions of myself)\b/,
        confidence: 0.84
      },

      {
        name: "identity_disconnection",
        regex: /\b(?:don't know who i am|dont know who i am|lost myself|not myself anymore)\b/,
        confidence: 0.88
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
        evidence: match[0],
        role: "identity_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          identityEvidenceOnly: true,
          doesNotDeclareIdentityTransition: true,
          doesNotChooseMeaning: true
        }
      });
    });
  },

  /* =====================================================
     MEANING / MISSION EVIDENCE
  ===================================================== */

  detectMeaningAndMissionEvidence(text = "", add = () => {}) {
    const patterns = [
      {
        name: "explicit_purpose_language",
        regex: /\b(?:my purpose|my calling|what i was meant to do|what i am meant to do|i was built for this)\b/,
        confidence: 0.84
      },

      {
        name: "meaningful_work_language",
        regex: /\b(?:meaningful work|something meaningful|work that matters|make a difference)\b/,
        confidence: 0.82
      },

      {
        name: "explicit_mission_commitment",
        regex: /\b(?:my mission|this is my mission|committed to building|need to bring this to life)\b/,
        confidence: 0.82
      },

      {
        name: "legacy_language",
        regex: /\b(?:my legacy|what i want to leave behind|what i want to be remembered for|build something that lasts)\b/,
        confidence: 0.82
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
        evidence: match[0],
        role: "meaning_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          meaningEvidenceOnly: true,
          doesNotDeclareMission: true,
          doesNotReplaceExplicitRequest: true
        }
      });
    });
  },

  /* =====================================================
     CAPACITY / PRESSURE EVIDENCE
  ===================================================== */

  detectCapacityAndPressure(text = "", add = () => {}) {
    const patterns = [
      {
        name: "capacity_pressure",
        regex: /\b(?:tired|exhausted|burned out|burnt out|overwhelmed|no energy|running on empty)\b/,
        confidence: 0.84
      },

      {
        name: "sleep_or_rest_deficit",
        regex: /\b(?:no sleep|not sleeping|need rest|need a break|can't rest|cant rest)\b/,
        confidence: 0.84
      },

      {
        name: "time_pressure",
        regex: /\b(?:running out of time|not enough time|every free moment|no time|deadline|too late)\b/,
        confidence: 0.84
      },

      {
        name: "achievement_pressure",
        regex: /\b(?:falling behind|lose momentum|losing momentum|lose progress|need to keep going)\b/,
        confidence: 0.82
      },

      {
        name: "responsibility_load",
        regex: /\b(?:too much on my plate|too many responsibilities|everyone depends on me|have to handle everything)\b/,
        confidence: 0.86
      },

      {
        name: "explicit_competing_priorities",
        regex: /\b(?:torn between|trying to balance|juggling|too many priorities|can't do everything|cant do everything)\b/,
        confidence: 0.86
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
        evidence: match[0],
        role: "pressure_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          pressureEvidenceOnly: true,
          doesNotEstablishCause: true,
          doesNotEstablishConflictWithoutCorroboration: true
        }
      });
    });
  },

  /* =====================================================
     LOSS / DISRUPTION EVIDENCE
  ===================================================== */

  detectLossAndDisruption(text = "", add = () => {}) {
    const patterns = [
      {
        name: "relationship_loss",
        domain: "relationship",
        regex: /\b(?:breakup|divorce|separated from my partner|relationship ended|lost my relationship)\b/,
        confidence: 0.86
      },

      {
        name: "career_disruption",
        domain: "career",
        regex: /\b(?:lost my job|got fired|was fired|laid off|career ended|leaving my career)\b/,
        confidence: 0.86
      },

      {
        name: "bereavement_or_death",
        domain: "loss",
        regex: /\b(?:died|passed away|lost my mother|lost my father|lost my wife|lost my husband|i am grieving|i'm grieving|im grieving)\b/,
        confidence: 0.9
      },

      {
        name: "health_disruption",
        domain: "health",
        regex: /\b(?:new diagnosis|serious illness|major surgery|my health changed|can't do what i used to|cant do what i used to)\b/,
        confidence: 0.86
      },

      {
        name: "financial_instability",
        domain: "financial",
        regex: /\b(?:can't pay|cant pay|losing my home|behind on bills|financial crisis|going broke)\b/,
        confidence: 0.88
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
        evidence: match[0],
        role: "disruption_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          disruptionEvidenceOnly: true,
          doesNotDetermineResponsePriority: true,
          doesNotDeclareLifeChapter: true
        }
      });
    });
  },

  /* =====================================================
     COMMITMENT / STABILITY EVIDENCE
  ===================================================== */

  detectCommitmentAndStability(text = "", add = () => {}) {
    const patterns = [
      {
        name: "long_term_commitment",
        regex: /\b(?:long term|for the rest of my life|committed to|not giving up|sticking with)\b/,
        confidence: 0.76
      },

      {
        name: "stable_role_language",
        regex: /\b(?:for years|been doing this for|my normal routine|nothing has changed)\b/,
        confidence: 0.74
      },

      {
        name: "explicit_chosen_direction",
        regex: /\b(?:i decided|i've decided|ive decided|i chose|i have chosen|my decision is)\b/,
        confidence: 0.84
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
        evidence: match[0],
        role: "commitment_clue",
        explicit: true,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          commitmentEvidenceOnly: true,
          doesNotAuthorizeAction: true
        }
      });
    });
  },

  /* =====================================================
     ADVISORY RELATIONSHIPS
     These may describe relationships between explicit
     signals but cannot become canonical meaning.
  ===================================================== */

  buildAdvisoryRelationships(signals = [], add = () => {}) {
    const has = name => signals.some(signal => signal.name === this.normalizeToken(name));
    const hasDomain = domain => signals.some(signal => signal.domain === domain);
    const direct = name => signals.find(signal =>
      signal.name === this.normalizeToken(name) &&
      signal.inferenceLevel === "observed"
    );

    const evidenceFor = (...names) =>
      signals
        .filter(signal => names.map(name => this.normalizeToken(name)).includes(signal.name))
        .flatMap(signal => signal.evidence || []);

    const addRelationship = ({
      name,
      type = "life_context_relationship",
      category = "relationship",
      domain = "life",
      confidence = 0.7,
      evidence = [],
      corroborated = false,
      metadata = {}
    }) => {
      add({
        name,
        type,
        category,
        domain,
        confidence,
        evidence,
        role: "advisory_relationship",
        explicit: false,
        inferenceLevel: "inferred",
        evidenceClass: corroborated ? "corroborated_inference" : "system_inference",
        temporalStatus: "unspecified",
        lifespan: "turn",
        metadata: {
          advisoryOnly: true,
          corroborated,
          cannotBecomePrimaryMeaning: true,
          cannotDeclareLifeChapter: true,
          cannotReplaceExplicitRequest: true,
          cannotChooseLane: true,
          cannotChooseRoute: true,
          ...metadata
        }
      });
    };

    const hasExplicitTransition =
      signals.some(signal =>
        signal.role === "transition_indicator" &&
        signal.inferenceLevel === "observed"
      );

    if (hasDomain("parenthood") && hasExplicitTransition) {
      addRelationship({
        name: "possible_parenthood_transition",
        type: "life_transition_hypothesis",
        category: "transition_relationship",
        domain: "parenthood",
        confidence: 0.76,
        evidence: [
          ...evidenceFor("parenthood_context"),
          ...signals
            .filter(signal => signal.role === "transition_indicator")
            .flatMap(signal => signal.evidence || [])
        ],
        corroborated: true
      });
    }

    if (
      hasDomain("military") &&
      direct("leaving_current_role")
    ) {
      addRelationship({
        name: "possible_military_exit_transition",
        type: "life_transition_hypothesis",
        category: "transition_relationship",
        domain: "military",
        confidence: 0.8,
        evidence: evidenceFor("military_context", "leaving_current_role"),
        corroborated: true
      });
    }

    if (
      (
        hasDomain("career") ||
        hasDomain("education")
      ) &&
      hasExplicitTransition
    ) {
      addRelationship({
        name: "possible_career_or_education_transition",
        type: "life_transition_hypothesis",
        category: "transition_relationship",
        domain: hasDomain("education") ? "education" : "career",
        confidence: 0.72,
        evidence: signals
          .filter(signal =>
            ["career", "education"].includes(signal.domain) ||
            signal.role === "transition_indicator"
          )
          .flatMap(signal => signal.evidence || []),
        corroborated: true
      });
    }

    if (
      hasDomain("creative_project") &&
      (
        has("explicit_mission_commitment") ||
        has("meaningful_work_language") ||
        has("explicit_purpose_language")
      )
    ) {
      addRelationship({
        name: "project_meaning_relationship",
        type: "life_context_relationship",
        category: "meaning_relationship",
        domain: "creative_project",
        confidence: 0.7,
        evidence: signals
          .filter(signal =>
            signal.domain === "creative_project" ||
            signal.role === "meaning_clue"
          )
          .flatMap(signal => signal.evidence || []),
        corroborated: true
      });
    }

    if (
      (
        has("identity_change_language") ||
        has("identity_questioning") ||
        has("identity_disconnection")
      ) &&
      hasExplicitTransition
    ) {
      addRelationship({
        name: "possible_identity_transition",
        type: "life_transition_hypothesis",
        category: "transition_relationship",
        domain: "identity",
        confidence: 0.74,
        evidence: signals
          .filter(signal =>
            signal.role === "identity_clue" ||
            signal.role === "transition_indicator"
          )
          .flatMap(signal => signal.evidence || []),
        corroborated: true
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
      addRelationship({
        name: "possible_capacity_achievement_tension",
        type: "life_tension_hypothesis",
        category: "tension_relationship",
        domain: "capacity",
        confidence: 0.76,
        evidence: evidenceFor(
          "capacity_pressure",
          "achievement_pressure",
          "time_pressure",
          "responsibility_load"
        ),
        corroborated: true
      });
    }

    if (
      has("explicit_competing_priorities") &&
      signals.some(signal =>
        ["family", "career", "creative_project", "education", "relationship"].includes(signal.domain)
      )
    ) {
      addRelationship({
        name: "possible_role_priority_tension",
        type: "life_tension_hypothesis",
        category: "tension_relationship",
        domain: "life",
        confidence: 0.72,
        evidence: signals
          .filter(signal =>
            signal.name === "explicit_competing_priorities" ||
            ["family", "career", "creative_project", "education", "relationship"].includes(signal.domain)
          )
          .flatMap(signal => signal.evidence || []),
        corroborated: true
      });
    }
  },

  /* =====================================================
     RANKING
     Direct evidence outranks all hypotheses.
  ===================================================== */

  rolePriority: {
    disruption_clue: 96,
    transition_indicator: 92,
    pressure_clue: 88,
    identity_clue: 84,
    commitment_clue: 80,
    meaning_clue: 78,
    context_clue: 64,
    advisory_relationship: 44
  },

  typePriority: {
    life_disruption_signal: 94,
    transition_indicator: 90,
    life_pressure: 86,
    identity_signal: 82,
    stability_or_commitment_signal: 78,
    meaning_signal: 76,
    life_context_signal: 62,
    life_transition_hypothesis: 46,
    life_tension_hypothesis: 44,
    life_context_relationship: 42,
    life_signal: 40
  },

  rankSignals(signals = []) {
    return signals
      .map(signal => {
        const rolePriority = this.rolePriority[signal.role] || 40;
        const typePriority = this.typePriority[signal.type] || 40;
        const corroboration = Math.min(
          8,
          Math.max(0, Number(signal.matchCount || 1) - 1) * 2
        );

        const evidenceCount = Math.min(
          6,
          Math.max(0, Number(signal.evidence?.length || 0) - 1)
        );

        const directBonus =
          signal.inferenceLevel === "observed"
            ? 14
            : 0;

        const inferencePenalty =
          signal.inferenceLevel !== "observed"
            ? 18
            : 0;

        const contextOnlyPenalty =
          signal.role === "context_clue"
            ? 5
            : 0;

        const advisoryPenalty =
          signal.role === "advisory_relationship"
            ? 20
            : 0;

        const score = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              rolePriority * 0.3 +
              typePriority * 0.22 +
              signal.confidence * 100 * 0.32 +
              corroboration +
              evidenceCount +
              directBonus -
              inferencePenalty -
              contextOnlyPenalty -
              advisoryPenalty
            )
          )
        );

        return {
          ...signal,

          priority:
            Math.round(
              rolePriority * 0.55 +
              typePriority * 0.45
            ),

          score,

          metadata: {
            ...(signal.metadata || {}),

            scoreBreakdown: {
              rolePriority,
              typePriority,
              confidence:
                signal.confidence,

              corroboration,
              evidenceCount,
              directBonus,
              inferencePenalty,
              contextOnlyPenalty,
              advisoryPenalty
            }
          }
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        if (a.inferenceLevel !== b.inferenceLevel) {
          return a.inferenceLevel === "observed" ? -1 : 1;
        }

        return b.confidence - a.confidence;
      });
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  buildLifeContextSummary({
    contextualSignals = [],
    transitionIndicators = [],
    pressureSignals = [],
    disruptionSignals = [],
    identitySignals = [],
    meaningSignals = [],
    commitmentSignals = [],
    advisoryRelationships = []
  } = {}) {
    return {
      contextPresent:
        contextualSignals.length > 0,

      explicitTransitionPresent:
        transitionIndicators.length > 0,

      pressurePresent:
        pressureSignals.length > 0,

      disruptionPresent:
        disruptionSignals.length > 0,

      identityLanguagePresent:
        identitySignals.length > 0,

      meaningLanguagePresent:
        meaningSignals.length > 0,

      commitmentLanguagePresent:
        commitmentSignals.length > 0,

      advisoryRelationshipCount:
        advisoryRelationships.length,

      domains:
        [
          ...new Set(
            [
              ...contextualSignals,
              ...transitionIndicators,
              ...pressureSignals,
              ...disruptionSignals,
              ...identitySignals,
              ...meaningSignals,
              ...commitmentSignals
            ]
              .map(signal =>
                signal.domain
              )
              .filter(Boolean)
          )
        ],

      governance: {
        contextCannotReplaceRequest:
          true,

        hypothesesCannotBecomeCanonicalMeaning:
          true,

        explicitTransitionRequiredForTransitionEvidence:
          true,

        domainMentionDoesNotEstablishTransition:
          true,

        pressureDoesNotEstablishCause:
          true,

        advisoryOnly:
          true
      }
    };
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

      subject:
        signal.subject ||
        "user",

      target:
        signal.target ||
        null,

      relation:
        signal.relation ||
        null,

      confidence:
        signal.confidence,

      inferenceLevel:
        signal.inferenceLevel,

      evidenceClass:
        signal.evidenceClass,

      temporalStatus:
        signal.temporalStatus ||
        "unspecified",

      lifespan:
        signal.lifespan ||
        "turn",

      evidence:
        (signal.evidence || []).map(item =>
          this.createEvidenceRecord(
            rawText,
            item
          )
        ),

      source:
        "ari-life-signal-extractor",

      sourceVersion:
        this.version,

      sourceStage:
        "perception",

      metadata: {
        role:
          signal.role,

        explicit:
          signal.explicit === true,

        score:
          signal.score ??
          null,

        priority:
          signal.priority ??
          null,

        matchCount:
          signal.matchCount ||
          1,

        advisoryOnly:
          signal.role ===
          "advisory_relationship",

        cannotChooseMeaning:
          true,

        cannotReplaceExplicitRequest:
          true,

        ...(signal.metadata || {})
      }
    };
  },

  createEvidenceRecord(
    rawText = "",
    evidence = ""
  ) {
    if (
      evidence &&
      typeof evidence === "object"
    ) {
      return evidence;
    }

    const evidenceText =
      String(
        evidence ||
        ""
      ).trim();

    const raw =
      String(
        rawText ||
        ""
      );

    const start =
      evidenceText
        ? raw
            .toLowerCase()
            .indexOf(
              evidenceText
                .toLowerCase()
            )
        : -1;

    return {
      text:
        evidenceText,

      sourceField:
        "userMessage",

      start:
        start >= 0
          ? start
          : null,

      end:
        start >= 0
          ? start +
            evidenceText.length
          : null
    };
  },

  /* =====================================================
     INPUT HELPERS
  ===================================================== */

  normalizeInput(
    message = "",
    context = {}
  ) {
    if (
      message &&
      typeof message ===
        "object"
    ) {
      const summary =
        message.summary ||
        message;

      const rawText =
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "";

      return {
        rawText,
        text:
          this.normalize(
            rawText
          ),

        context:
          summary
      };
    }

    return {
      rawText:
        String(
          message ||
          ""
        ),

      text:
        this.normalize(
          message
        ),

      context:
        context ||
        {}
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  findTerm(
    text = "",
    term = ""
  ) {
    const normalizedText =
      String(
        text ||
        ""
      );

    const escaped =
      this.escapeRegex(
        term
      );

    const pattern =
      term.includes(" ")
        ? new RegExp(
            `(?:^|\\b)(${escaped})(?=\\b|$)`,
            "i"
          )
        : new RegExp(
            `\\b(${escaped})\\b`,
            "i"
          );

    const match =
      normalizedText.match(
        pattern
      );

    return (
      match?.[1] ||
      match?.[0] ||
      null
    );
  },

  includesAny(
    text = "",
    terms = []
  ) {
    return terms.some(
      term =>
        Boolean(
          this.findTerm(
            text,
            term
          )
        )
    );
  },

  asArray(value = []) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  normalizeConfidence(
    value = 0.5
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0.5;
    }

    if (
      number > 1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

  normalizeToken(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .trim()
      .replace(
        /[\s-]+/g,
        "_"
      )
      .replace(
        /[^\w]/g,
        ""
      )
      .replace(
        /_+/g,
        "_"
      );
  },

  escapeRegex(
    value = ""
  ) {
    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
  },

  normalize(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        '"'
      )
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s'?.,!:%/.-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

console.log(
  "ARI LIFE SIGNAL EXTRACTOR LOADED:",
  window.Ari.lifeSignalExtractor?.version
);