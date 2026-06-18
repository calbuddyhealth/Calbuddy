// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Build an evidence-based case model from upstream context.
// V8.3.0 — Case Modeler Only / No Final Recommendation Authority
// Boundary:
// - DOES organize known facts, inferred facts, unknowns, constraints, risks, options, tradeoffs, consequences, and confidence.
// - DOES use groundedContext and preferredTerms when available.
// - DOES NOT choose final lane.
// - DOES NOT create final recommendation language.
// - DOES NOT compose final response.
// - DOES NOT override Situation Contract, Triage, Safety, Character, or Composer.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "8.3.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const observations = summary.observations || summary.observationLedger || [];

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    const reasoning = this.blankReasoning({ primary, contract });

    this.loadGroundedInputs(reasoning, summary);
this.loadActiveSituationInputs(reasoning, summary);
this.addRelevantFacts(reasoning, observations);
    this.buildCaseModel(reasoning, summary, primary);
    this.buildOptionsAndConsequences(reasoning, summary, primary);
    this.buildTradeoffs(reasoning, summary, primary);
    this.buildMissingInfo(reasoning, summary, primary);
    this.buildConfidence(reasoning, summary, primary);
    this.finalize(reasoning);

    return {
      reasoningEngineRan: true,
      reasoningEngineVersion: this.version,
      reasoningSource: "ari-reasoning-engine",

      reasoning,

      reasoningAnswer: null,
      reasoningRecommendation: null,
      reasoningConfidence: reasoning.confidence?.score ?? null,
      reasoningPrimary: primary,

      authority: "case_modeling_only"
    };
  },

  blankReasoning({ primary, contract }) {
    return {
      version: this.version,
      source: "ari-reasoning-engine",

      primary,
      contractPrimary: contract.primary || primary,
      responseShape: contract.responseShape || null,

      authority: "case_modeling_only",

      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "finalResponse",
        "responseText",
        "mouthPattern",
        "tone",
        "recommendation",
        "finalRecommendation",
        "medicalEscalation",
        "riskOverride"
      ],

      groundedContext: {},
      preferredTerms: {},

      knownFacts: [],
      inferredFacts: [],
      unknowns: [],
      constraints: [],
      risks: [],
      resources: [],

      caseModel: {
        frame: null,
        situation: null,
        userQuestion: null,
        activeProblem: null,
        actor: null,
        issue: null,
        action: null,
        pressure: null,
        decision: null,
        consequence: null,
        userGoal: null,
        currentState: null,
        desiredState: null,
        obstacle: null,
        constraints: [],
        risks: [],
        unknowns: [],
        options: [],
        consequences: [],
        tradeoffs: [],
        nextActionCandidates: []
      },

      options: [],
      likelyOutcomes: [],
      tradeoffs: [],
      counterfactuals: [],

      decisionMemo: {
        summary: null,
        strongestFacts: [],
        materialUnknowns: [],
        safestAvailableActions: [],
        actionsToAvoid: [],
        confidence: null
      },

      executiveConclusion: {
        primary,
        framing: null,
        analysisSummary: null,
        candidateActions: [],
        keyRisk: null,
        keyTradeoff: null,
        uncertainty: null,
        mustInclude: [
          ...(contract.responseRules || []),
          ...(contract.mouthDirective?.required || [])
        ],
        mustAvoid: [
          ...(contract.blocked || []),
          ...(contract.mouthDirective?.avoid || [])
        ],
        ownsFinalRecommendation: false
      },

      confidence: {
        score: 0,
        level: "low",
        reasons: [],
        uncertaintyDrivers: []
      },

      answer: null,
      recommendation: null,
      obeyedContract: true,
      contractViolations: []
    };
  },
    loadGroundedInputs(reasoning, summary = {}) {
    const groundedContext =
      summary.groundedContext ||
      summary.entityReference?.groundedContext ||
      summary.entityReferenceState?.groundedContext ||
      summary.subjectGraphState?.groundedContext ||
      {};

    const preferredTerms =
      summary.preferredTerms ||
      summary.lexicalGrounding?.preferredTerms ||
      {};

    reasoning.groundedContext = groundedContext;
    reasoning.preferredTerms = preferredTerms;

    const addIfPresent = (target, value, label) => {
      const text = this.termText(value);
      if (!text) return;
      this.add(target, `${label}: ${text}`);
    };

    addIfPresent(reasoning.knownFacts, preferredTerms.actor, "Actor");
    addIfPresent(reasoning.knownFacts, preferredTerms.issue, "Issue");
    addIfPresent(reasoning.knownFacts, preferredTerms.action, "Action");
    addIfPresent(reasoning.knownFacts, preferredTerms.pressure, "Pressure");
    addIfPresent(reasoning.knownFacts, preferredTerms.decision, "Decision being considered");
    addIfPresent(reasoning.knownFacts, preferredTerms.consequence, "Feared consequence");

    addIfPresent(reasoning.knownFacts, groundedContext.actor, "Actor");
    addIfPresent(reasoning.knownFacts, groundedContext.issue, "Issue");
    addIfPresent(reasoning.knownFacts, groundedContext.pressure, "Pressure");
    addIfPresent(reasoning.knownFacts, groundedContext.decision, "Decision being considered");
    addIfPresent(reasoning.knownFacts, groundedContext.consequence, "Feared consequence");
  },
loadActiveSituationInputs(reasoning, summary = {}) {
  const activeSituation =
    summary.activeSituation ||
    summary.assembledContext?.activeSituation ||
    summary.advisoryContext?.activeSituation ||
    summary.threadUnderstanding?.activeSituation ||
    summary.threadUnderstanding?.resolvedMeaning?.activeSituation ||
    null;

  const keyFacts =
    this.collectKeyFacts(summary);

  if (activeSituation) {
    const situationText =
      activeSituation.value ||
      activeSituation.label ||
      activeSituation.evidence ||
      null;

    if (situationText) {
      this.add(reasoning.knownFacts, `Active situation: ${situationText}`);
      reasoning.caseModel.situation = situationText;
      reasoning.caseModel.userQuestion = this.getOriginalText(summary);
    }
  }

  keyFacts.forEach(fact => {
    this.add(reasoning.knownFacts, fact);
  });

  if (keyFacts.length) {
    reasoning.decisionMemo.strongestFacts = [
      ...keyFacts,
      ...reasoning.decisionMemo.strongestFacts
    ].slice(0, 5);

    reasoning.confidence.reasons.push(
      "Active situation key facts were provided by context assembler."
    );
  }
},

collectKeyFacts(summary = {}) {
  const sources = [
    summary.keyFacts,
    summary.assembledContext?.keyFacts,
    summary.advisoryContext?.keyFacts,
    summary.threadUnderstanding?.keyFacts,
    summary.threadUnderstanding?.resolvedMeaning?.keyFacts,
    summary.threadUnderstanding?.workingContext?.keyFacts
  ];

  const facts = [];

  sources.forEach(source => {
    if (!Array.isArray(source)) return;

    source.forEach(fact => {
      const text =
        typeof fact === "string"
          ? fact
          : fact?.claim || fact?.value || fact?.label || fact?.evidence || "";

      if (text && String(text).trim()) {
        facts.push(String(text).trim());
      }
    });
  });

  return [...new Set(facts)];
},
  addRelevantFacts(reasoning, observations = []) {
    observations.forEach(obs => {
      if (!obs?.value) return;

      this.add(reasoning.knownFacts, `${obs.type || "observation"}: ${obs.value}`);
    });
  },

  buildCaseModel(reasoning, summary = {}, primary = "") {
    const frame = this.resolveFrame(reasoning, summary, primary);
    reasoning.caseModel.frame = frame;

    if (frame === "workplace_accountability") {
      return this.buildWorkplaceAccountabilityCase(reasoning, summary);
    }

    if (frame === "medical_or_body") {
      return this.buildMedicalBodyCase(reasoning, summary);
    }

    if (frame === "builder") {
      return this.buildBuilderCase(reasoning, summary);
    }

    if (frame === "relationship") {
      return this.buildRelationshipCase(reasoning, summary);
    }

    return this.buildGeneralCase(reasoning, summary, primary);
  },

  resolveFrame(reasoning, summary = {}, primary = "") {
    const map = summary.situationMap || {};
    const domains = map.domains || [];
    const situations = map.situations || [];
    const preferred = reasoning.preferredTerms || {};
    const grounded = reasoning.groundedContext || {};
    const text = this.getText(summary);

    const hasWorkAccountability =
      domains.includes("accountability_context_domain") ||
      situations.includes("accountability_or_work_quality_context") ||
      this.termText(preferred.issue) ||
      this.termText(grounded.issue) ||
      this.hasAny(text, [
        "documenting assessments",
        "cutting corners",
        "reporting it",
        "report a coworker",
        "leadership keeps rushing",
        "management has been pushing"
      ]);

    if (hasWorkAccountability) return "workplace_accountability";

    if (
      primary === "medical_body" ||
      primary === "medical_context" ||
      domains.includes("medical_context_domain")
    ) {
      return "medical_or_body";
    }

    if (
      primary === "builder" ||
      domains.includes("builder_domain")
    ) {
      return "builder";
    }

    if (
      primary === "relationship" ||
      domains.includes("relationship_context_domain") ||
      domains.includes("family_context_domain")
    ) {
      return "relationship";
    }

    return "general";
  },

  buildWorkplaceAccountabilityCase(reasoning, summary = {}) {
    const preferred = reasoning.preferredTerms || {};
    const grounded = reasoning.groundedContext || {};

    const actor = this.termText(preferred.actor) || grounded.actor || null;
    const issue = this.termText(preferred.issue) || grounded.issue || null;
    const pressure = this.termText(preferred.pressure) || grounded.pressure || null;
    const decision = this.termText(preferred.decision) || grounded.decision || null;
    const consequence = this.termText(preferred.consequence) || grounded.consequence || null;
    const action = this.termText(preferred.action) || grounded.action || null;

    const model = reasoning.caseModel;

    model.situation = "The user is deciding how to respond to a workplace accountability or documentation concern.";
    model.userQuestion = this.getOriginalText(summary);
    model.activeProblem = this.termText(preferred.activeProblem) || grounded.activeProblemLabel || issue || null;

    model.actor = actor;
    model.issue = issue;
    model.action = action;
    model.pressure = pressure;
    model.decision = decision;
    model.consequence = consequence;

    model.userGoal = "choose a responsible next step without ignoring the workplace pressure or the social consequences";
    model.currentState = "there is a concrete documentation/accountability concern and possible system pressure behind it";
    model.desiredState = "protect safety, facts, fairness, and professional responsibility";
    model.obstacle = "the issue may involve both individual accountability and system pressure from leadership or staffing";

    model.constraints = [
      "do not treat system pressure as an excuse for unsafe or false documentation",
      "do not accuse beyond the evidence",
      "protect patient safety and documentation integrity",
      "reduce retaliation or team-backlash risk where possible",
      "use the appropriate chain of command or policy pathway"
    ];

    model.risks = [
      "false or incomplete documentation can create patient-safety and professional risk",
      "reporting without facts can create unnecessary conflict",
      "ignoring the issue can normalize unsafe practice",
      "system pressure may continue unless documented separately"
    ];

    model.unknowns = [
      "whether the documentation issue is isolated or repeated",
      "whether patients were affected",
      "whether leadership already knows about the staffing pressure",
      "what the unit policy says about reporting documentation concerns",
      "whether there is a safe direct conversation path"
    ];

    reasoning.knownFacts.push(...model.constraints.map(x => `Constraint: ${x}`));
    reasoning.risks.push(...model.risks);
    reasoning.unknowns.push(...model.unknowns);

    reasoning.inferredFacts.push(
      "System pressure may explain why the behavior is happening, but it does not automatically make the behavior acceptable."
    );

    reasoning.resources.push(
      "objective documentation",
      "policy or chain of command",
      "direct conversation if safe and appropriate",
      "reporting the system pressure separately from the individual behavior"
    );
  },
    buildMedicalBodyCase(reasoning, summary = {}) {
    const preferred = reasoning.preferredTerms || {};
    const bodyProblem = this.termText(preferred.bodyProblem) || "the body or health concern";
    const model = reasoning.caseModel;

    model.situation = "The user is asking about a body or health concern.";
    model.userQuestion = this.getOriginalText(summary);
    model.activeProblem = bodyProblem;
    model.userGoal = "protect health and choose a safe next step";
    model.currentState = "health context is present, but severity and red flags may be unknown";
    model.desiredState = "identify red flags, avoid false reassurance, and choose appropriate care";
    model.obstacle = "symptoms can be mild, serious, or unclear without more clinical context";

    model.constraints = [
      "do not over-reassure",
      "name red flags when relevant",
      "recommend urgent care when severe, worsening, or high-risk signs are present"
    ];

    model.risks = [
      "missing a serious symptom",
      "delaying care if red flags are present"
    ];

    model.unknowns = [
      "duration",
      "severity",
      "associated symptoms",
      "risk factors",
      "whether symptoms are worsening"
    ];

    reasoning.risks.push(...model.risks);
    reasoning.unknowns.push(...model.unknowns);
  },

  buildBuilderCase(reasoning, summary = {}) {
    const preferred = reasoning.preferredTerms || {};
    const thingToFix = this.termText(preferred.thingToFix) || "the code or system issue";
    const model = reasoning.caseModel;

    model.situation = "The user is trying to build, fix, or debug something.";
    model.userQuestion = this.getOriginalText(summary);
    model.activeProblem = thingToFix;
    model.userGoal = "make the system work correctly";
    model.currentState = "a technical issue or implementation step is active";
    model.desiredState = "a small, testable fix";
    model.obstacle = "the exact failing layer may be unclear";

    model.constraints = [
      "avoid broad rewrites unless necessary",
      "prefer the smallest targeted fix",
      "keep code boundaries clear"
    ];

    model.risks = [
      "patching the wrong layer",
      "creating regressions",
      "breaking working behavior"
    ];

    model.unknowns = [
      "exact file state",
      "console errors",
      "which layer is failing"
    ];

    reasoning.risks.push(...model.risks);
    reasoning.unknowns.push(...model.unknowns);
  },

  buildRelationshipCase(reasoning, summary = {}) {
    const preferred = reasoning.preferredTerms || {};
    const person = this.termText(preferred.personOrRelationship) || "the other person";
    const model = reasoning.caseModel;

    model.situation = "The user is navigating a relationship or family situation.";
    model.userQuestion = this.getOriginalText(summary);
    model.activeProblem = person;
    model.userGoal = "respond in a way that protects honesty, clarity, and the relationship";
    model.currentState = "there may be incomplete information about the other person's inner state";
    model.desiredState = "address the issue without mind-reading or unnecessary defensiveness";
    model.obstacle = "the visible problem may not be the only relational issue";

    model.constraints = [
      "do not assume what another person feels",
      "separate facts from interpretation",
      "repair trust before trying to win the argument"
    ];

    model.risks = [
      "mind-reading",
      "defending too early",
      "missing the real injury"
    ];

    model.unknowns = [
      "what the other person actually feels",
      "what they need repaired",
      "what facts are disputed"
    ];

    reasoning.risks.push(...model.risks);
    reasoning.unknowns.push(...model.unknowns);
  },

  buildGeneralCase(reasoning, summary = {}, primary = "") {
    const model = reasoning.caseModel;

    model.situation = model.situation || "The user is asking for help or clarity.";
    model.userQuestion = this.getOriginalText(summary);
    model.userGoal = "get a useful answer";
    model.currentState = `active lane: ${primary}`;
    model.desiredState = "clear next understanding or action";
    model.obstacle = reasoning.knownFacts.length
  ? "the decision needs to be prioritized using the known facts"
  : "not enough specific case context may be available";

    model.constraints = [];
    model.risks = [];
    model.unknowns = ["what details would materially change the answer"];

    reasoning.unknowns.push(...model.unknowns);
  },

  buildOptionsAndConsequences(reasoning, summary = {}, primary = "") {
    const frame = reasoning.caseModel.frame;

    if (frame === "workplace_accountability") {
      return this.buildWorkplaceOptions(reasoning);
    }

    if (frame === "medical_or_body") {
      return this.buildMedicalOptions(reasoning);
    }

    if (frame === "builder") {
      return this.buildBuilderOptions(reasoning);
    }

    if (frame === "relationship") {
      return this.buildRelationshipOptions(reasoning);
    }

    return this.buildGeneralOptions(reasoning);
  },

  buildWorkplaceOptions(reasoning) {
    const model = reasoning.caseModel;

    model.options = [
      {
        option: "Document objective facts first",
        benefits: ["reduces hearsay", "protects fairness", "creates a clear record"],
        risks: ["takes time before acting"],
        reversibility: "high"
      },
      {
        option: "Separate the documentation concern from the staffing pressure",
        benefits: ["acknowledges system pressure without excusing unsafe practice"],
        risks: ["requires careful wording"],
        reversibility: "high"
      },
      {
        option: "Use the appropriate reporting pathway",
        benefits: ["protects patient safety and professional standards"],
        risks: ["may create social backlash"],
        reversibility: "medium"
      },
      {
        option: "Ignore it because leadership is rushing everyone",
        benefits: ["avoids immediate conflict"],
        risks: ["normalizes unsafe documentation", "may expose patients and staff to risk"],
        reversibility: "low"
      }
    ];

    model.consequences = [
      {
        option: "Document objective facts first",
        likelyOutcome: "the user can act with more accuracy and less emotional guessing",
        riskLevel: "low"
      },
      {
        option: "Separate the documentation concern from the staffing pressure",
        likelyOutcome: "the response becomes fairer and more useful",
        riskLevel: "low"
      },
      {
        option: "Use the appropriate reporting pathway",
        likelyOutcome: "the concern is escalated through a safer structure",
        riskLevel: "medium"
      },
      {
        option: "Ignore it because leadership is rushing everyone",
        likelyOutcome: "the immediate conflict may decrease, but the underlying risk remains",
        riskLevel: "high"
      }
    ];

    model.nextActionCandidates = [
      "Write down only what was observed, when it happened, and why it matters.",
      "Separate the individual documentation concern from the leadership/staffing pressure.",
      "Follow policy or chain of command rather than making it personal."
    ];

    reasoning.options.push(...model.options);
    reasoning.likelyOutcomes.push(...model.consequences);
  },
    buildMedicalOptions(reasoning) {
    reasoning.caseModel.options = [];
    reasoning.caseModel.nextActionCandidates = [
      "Determine severity and red flags.",
      "Identify missing clinical information.",
      "Escalate when serious features are present."
    ];
  },

  buildBuilderOptions(reasoning) {
    reasoning.caseModel.options = [];
    reasoning.caseModel.nextActionCandidates = [
      "Identify the failing component.",
      "Apply the smallest targeted change.",
      "Retest before modifying another subsystem."
    ];
  },

  buildRelationshipOptions(reasoning) {
    reasoning.caseModel.options = [];
    reasoning.caseModel.nextActionCandidates = [
      "Clarify facts before assumptions.",
      "Separate observations from interpretations.",
      "Address the relationship directly and respectfully."
    ];
  },

  buildGeneralOptions(reasoning) {
  const model = reasoning.caseModel;

  const hasUsefulFacts = (reasoning.knownFacts || []).length > 0;

  const hasKnownDecision =
    Boolean(model.decision) ||
    Boolean(model.activeProblem) ||
    Boolean(model.issue) ||
    hasUsefulFacts;

  if (hasKnownDecision) {
    model.options = [
      {
        option: "Clarify the objective",
        benefits: ["prevents solving the wrong problem"],
        risks: ["can feel slower than jumping into action"],
        reversibility: "high"
      },
      {
        option: "Identify the main constraint",
        benefits: ["shows what is actually limiting the situation"],
        risks: ["may miss secondary concerns if used alone"],
        reversibility: "medium"
      },
      {
        option: "Compare tradeoffs before acting",
        benefits: ["reduces impulsive or anxiety-driven choices"],
        risks: ["can delay action if overdone"],
        reversibility: "medium"
      },
      {
        option: "Choose the smallest useful next step",
        benefits: ["creates progress while preserving flexibility"],
        risks: ["may need adjustment as new facts appear"],
        reversibility: "high"
      }
    ];

    model.tradeoffs = [
      {
        sideA: "acting quickly",
        sideB: "protecting the outcome that matters most"
      }
    ];

    model.nextActionCandidates = [
      "Clarify what outcome matters most.",
      "Identify the biggest constraint or risk.",
      "Choose the smallest useful next step."
    ];

    reasoning.options.push(...model.options);
    reasoning.tradeoffs = model.tradeoffs;
    return;
  }

  model.options = [
    {
      option: "Gather the missing facts",
      benefits: ["reduces guessing"],
      risks: ["can delay action if overdone"],
      reversibility: "high"
    },
    {
      option: "Ask one clarifying question",
      benefits: ["gets the minimum information needed"],
      risks: ["may slow the conversation slightly"],
      reversibility: "high"
    },
    {
      option: "Give a cautious general answer",
      benefits: ["still helps when details are limited"],
      risks: ["may be less personalized"],
      reversibility: "high"
    }
  ];

  model.nextActionCandidates = [
    "Gather the missing facts.",
    "Ask one clarifying question.",
    "Give a cautious general answer."
  ];

  reasoning.options.push(...model.options);
},

  buildTradeoffs(reasoning) {
    const m = reasoning.caseModel;

    if (m.frame === "workplace_accountability") {
      m.tradeoffs = [
        {
          sideA: "protecting patient safety and documentation integrity",
          sideB: "avoiding conflict with coworkers"
        },
        {
          sideA: "recognizing system pressure",
          sideB: "holding individuals accountable for their actions"
        }
      ];
    }

    reasoning.tradeoffs = reasoning.tradeoffs.length
  ? reasoning.tradeoffs
  : (m.tradeoffs || []);
  },

  buildMissingInfo(reasoning) {
    reasoning.decisionMemo.materialUnknowns =
      reasoning.caseModel.unknowns || [];
  },

    buildConfidence(reasoning) {
    const model = reasoning.caseModel || {};

    let score = 0.45;

    if (model.frame) score += 0.10;
    if (model.situation) score += 0.10;
    if ((reasoning.knownFacts || []).length) score += 0.15;
    if ((model.constraints || []).length) score += 0.10;
    if ((model.options || []).length) score += 0.10;
    if ((model.nextActionCandidates || []).length) score += 0.10;
    if ((model.tradeoffs || []).length) score += 0.10;

    reasoning.confidence.score = Math.min(0.95, score);

    reasoning.confidence.level =
      reasoning.confidence.score >= 0.80 ? "high" :
      reasoning.confidence.score >= 0.60 ? "medium" :
      "low";

    reasoning.confidence.reasons = [
      ...(reasoning.confidence.reasons || []),
      model.situation ? "A usable situation frame was available." : null,
      (reasoning.knownFacts || []).length ? "Known facts were available." : null,
      (model.options || []).length ? "Options were generated." : null,
      (model.tradeoffs || []).length ? "Tradeoffs were identified." : null
    ].filter(Boolean);

    reasoning.confidence.uncertaintyDrivers =
      model.unknowns || [];

    reasoning.decisionMemo.strongestFacts =
      (reasoning.knownFacts || []).slice(0, 7);

    reasoning.decisionMemo.materialUnknowns =
      model.unknowns || [];

    reasoning.decisionMemo.safestAvailableActions =
      (model.nextActionCandidates || []).slice(0, 4);

    reasoning.executiveConclusion.analysisSummary =
      model.situation || null;

    reasoning.executiveConclusion.candidateActions =
      model.nextActionCandidates || [];

    reasoning.executiveConclusion.keyRisk =
      (model.risks || [])[0] || null;

    reasoning.executiveConclusion.keyTradeoff =
      (model.tradeoffs || reasoning.tradeoffs || [])[0] || null;

    reasoning.executiveConclusion.uncertainty =
      (model.unknowns || [])[0] || null;
  },

  finalize(reasoning) {
    // The Reasoning Engine intentionally NEVER produces the final answer.
    reasoning.answer = null;
    reasoning.recommendation = null;
    reasoning.executiveConclusion.ownsFinalRecommendation = false;
  },

  add(arr, value) {
    if (!value) return;
    if (!arr.includes(value)) arr.push(value);
  },

  termText(term) {
    if (!term) return null;
    if (typeof term === "string") return term;
    return term.raw || term.phrase || term.noun || term.short || null;
  },

  getOriginalText(summary = {}) {
    return (
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );
  },

  getText(summary = {}) {
    return this.getOriginalText(summary).toLowerCase();
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(p => text.includes(p.toLowerCase()));
  }
};

console.log(
  "ARI REASONING ENGINE LOADED:",
  window.AriReasoningEngine?.version
);