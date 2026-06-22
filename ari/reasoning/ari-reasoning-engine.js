// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Build a universal evidence-based case model from structured upstream context.
// V8.4.0 — Universal Case Modeler / Structured Inputs Only / No Final Recommendation Authority

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "8.4.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};
    const map = summary.situationMap || {};

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      "general_understanding";

    const reasoning = this.blankReasoning({ primary, contract, triage, map });

    this.loadStructuredInputs(reasoning, summary);
    this.buildUniversalCaseModel(reasoning, summary);
    this.buildUniversalOptions(reasoning, summary);
    this.buildUniversalTradeoffs(reasoning, summary);
    this.buildDecisionMemo(reasoning);
    this.buildConfidence(reasoning);
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

  blankReasoning({ primary, contract = {}, triage = {}, map = {} }) {
    return {
      version: this.version,
      source: "ari-reasoning-engine",

      primary,
      contractPrimary: contract.primary || primary,
      triagePrimary: triage.primaryLane || null,
      responseShape: contract.responseShape || triage.responseShape || null,

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

      upstream: {
        contract,
        triage,
        map
      },

      structuredInputs: {
        userText: null,
        semanticSummary: {},
        situationThesis: null,
        preferredTerms: {},
        conceptMap: {},
        groundedContext: {},
        observations: [],
        domains: [],
        situations: [],
        needs: [],
        risks: [],
        questions: [],
        constraints: [],
        responseRules: []
      },

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
        primaryLane: primary,
        userNeed: null,
        coreConflict: null,
        activeProblem: null,
        goals: [],
        constraints: [],
        obligations: [],
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

  loadStructuredInputs(reasoning, summary = {}) {
    const map = summary.situationMap || {};
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};

    const semanticSummary =
      summary.semanticSummary ||
      summary.semanticFrameOutput?.semanticSummary ||
      {};

    const situationThesis =
      contract.situationThesis?.thesis ||
      map.primarySituationThesis ||
      triage.situationThesisUsed ||
      summary.triageSituationThesis ||
      null;

    reasoning.structuredInputs = {
      userText: this.getOriginalText(summary),
      semanticSummary,
      situationThesis,
      preferredTerms:
        summary.preferredTerms ||
        summary.lexicalGrounding?.preferredTerms ||
        {},
      conceptMap:
        summary.conceptMap ||
        summary.lexicalGrounding?.conceptMap ||
        {},
      groundedContext:
        summary.groundedContext ||
        summary.entityReference?.groundedContext ||
        summary.subjectGraphState?.groundedContext ||
        {},
      observations:
        summary.observations ||
        summary.observationLedger ||
        [],
      domains: map.domains || [],
      situations: map.situations || [],
      needs: map.needs || [],
      risks: map.risks || [],
      questions: map.questions || [],
      constraints: [
        ...(map.responseConstraints || []),
        ...(triage.responseConstraints || []),
        ...(contract.responseRules || [])
      ],
      responseRules: contract.responseRules || []
    };

    this.extractFactsFromStructuredInputs(reasoning);
  },

  extractFactsFromStructuredInputs(reasoning) {
    const input = reasoning.structuredInputs;
    const thesis = input.situationThesis || {};
    const semantic = input.semanticSummary || {};
    const terms = input.preferredTerms || {};
    const conceptMap = input.conceptMap || {};

    this.add(reasoning.knownFacts, `Primary lane: ${reasoning.primary}`);

    if (semantic.primaryMeaning) {
      this.add(reasoning.knownFacts, `Primary meaning: ${semantic.primaryMeaning}`);
    }

    if (semantic.intent) {
      this.add(reasoning.knownFacts, `Intent: ${semantic.intent}`);
    }

    if (semantic.domain) {
      this.add(reasoning.knownFacts, `Domain: ${semantic.domain}`);
    }

    if (thesis.oneLine) {
      this.add(reasoning.knownFacts, `Situation thesis: ${thesis.oneLine}`);
    }

    if (thesis.coreConflict) {
      this.add(reasoning.knownFacts, `Core conflict: ${thesis.coreConflict}`);
    }

    if (thesis.userNeed) {
      this.add(reasoning.knownFacts, `User need: ${thesis.userNeed}`);
    }

    Object.entries(terms).forEach(([key, value]) => {
      const text = this.termText(value);
      if (text) this.add(reasoning.knownFacts, `${key}: ${text}`);
    });

    Object.entries(conceptMap).forEach(([key, value]) => {
      const text = this.termText(value);
      if (text) this.add(reasoning.knownFacts, `Concept ${key}: ${text}`);
    });

    input.domains.forEach(x => this.add(reasoning.knownFacts, `Domain signal: ${x}`));
    input.situations.forEach(x => this.add(reasoning.knownFacts, `Situation signal: ${x}`));
    input.needs.forEach(x => this.add(reasoning.knownFacts, `Need signal: ${x}`));
    input.questions.forEach(x => this.add(reasoning.knownFacts, `Question signal: ${x}`));

    input.risks.forEach(x => this.add(reasoning.risks, x));
    input.constraints.forEach(x => this.add(reasoning.constraints, x));
  },

  buildUniversalCaseModel(reasoning, summary = {}) {
    const input = reasoning.structuredInputs;
    const thesis = input.situationThesis || {};
    const semantic = input.semanticSummary || {};
    const terms = input.preferredTerms || {};

    const model = reasoning.caseModel;

    model.frame =
      thesis.thesisType ||
      semantic.primaryMeaning ||
      reasoning.primary ||
      "general_case";

    model.situation =
      thesis.oneLine ||
      semantic.primaryMeaning ||
      "The user is asking for help with the current situation.";

    model.userQuestion = input.userText;

    model.userNeed =
      thesis.userNeed ||
      this.termText(terms.primaryGoal) ||
      this.first(input.needs) ||
      "a useful next step";

    model.coreConflict =
      thesis.coreConflict ||
      this.inferConflictFromSignals(input) ||
      null;

    model.activeProblem =
      this.termText(terms.activeProblem) ||
      this.termText(terms.issue) ||
      this.termText(terms.object) ||
      semantic.primaryMeaning ||
      null;

    model.goals = this.cleanList([
      this.termText(terms.primaryGoal),
      thesis.userNeed,
      semantic.intent,
      ...input.needs
    ]);

    model.constraints = this.cleanList([
      ...reasoning.constraints,
      this.termText(terms.constraintPhrase),
      this.termText(terms.deadline),
      this.termText(terms.limitingResource)
    ]);

    model.obligations = this.cleanList([
      this.termText(terms.personOrRelationship),
      this.termText(terms.lifeTransition),
      ...input.domains.filter(x =>
        x.includes("family") ||
        x.includes("relationship") ||
        x.includes("medical") ||
        x.includes("financial") ||
        x.includes("career")
      )
    ]);

    model.risks = this.cleanList([
      ...reasoning.risks,
      ...input.risks
    ]);

    model.unknowns = this.cleanList([
      "which detail would materially change the next step",
      "whether any hidden constraint is more important than the visible one",
      "what option best protects the user's highest priority"
    ]);

    reasoning.unknowns.push(...model.unknowns);
  },

  buildUniversalOptions(reasoning) {
    const model = reasoning.caseModel;
    const primary = reasoning.primary;

    const options = [];

    options.push({
      option: "Name the priority",
      benefits: [
        "prevents treating every concern as equal",
        "makes the next step easier to choose"
      ],
      risks: [
        "may temporarily delay action"
      ],
      reversibility: "high"
    });

    options.push({
      option: "Protect the highest-risk constraint first",
      benefits: [
        "reduces avoidable harm",
        "keeps the decision grounded"
      ],
      risks: [
        "may feel less emotionally satisfying in the short term"
      ],
      reversibility: "medium"
    });

    options.push({
      option: "Choose the smallest useful next step",
      benefits: [
        "creates progress without overcommitting",
        "preserves flexibility"
      ],
      risks: [
        "may need another step after new information appears"
      ],
      reversibility: "high"
    });

    if (primary === "builder") {
      options.push({
        option: "Apply the smallest targeted technical change",
        benefits: [
          "reduces regression risk",
          "keeps debugging clean"
        ],
        risks: [
          "may not fix deeper architecture issues"
        ],
        reversibility: "high"
      });
    }

    if (primary === "executive_decision") {
      options.push({
        option: "Compare options by consequence, not emotion alone",
        benefits: [
          "improves decision quality",
          "reduces impulse-driven choices"
        ],
        risks: [
          "can feel slower than choosing immediately"
        ],
        reversibility: "medium"
      });
    }

    if (primary === "medical_body" || primary === "medical_context") {
      options.push({
        option: "Check red flags and choose the safest care threshold",
        benefits: [
          "avoids false reassurance",
          "keeps medical context practical"
        ],
        risks: [
          "may require outside medical input"
        ],
        reversibility: "medium"
      });
    }

    model.options = options;
    reasoning.options = options;

    model.consequences = options.map(option => ({
      option: option.option,
      likelyOutcome: option.benefits?.[0] || "may improve clarity",
      riskLevel: option.reversibility === "high" ? "low" : "moderate"
    }));

    reasoning.likelyOutcomes = model.consequences;

    model.nextActionCandidates = this.cleanList([
      "State the priority.",
      "Name the main constraint.",
      "Pick the smallest useful next step.",
      primary === "builder" ? "Make one targeted code change and retest." : null,
      primary === "executive_decision" ? "Choose the option that protects stability first." : null,
      primary === "medical_body" || primary === "medical_context"
        ? "Check whether red flags or urgent thresholds are present."
        : null
    ]);
  },

  buildUniversalTradeoffs(reasoning) {
    const model = reasoning.caseModel;

    const tradeoffs = [];

    if (model.coreConflict) {
      tradeoffs.push({
        sideA: model.coreConflict.split(" vs ")[0] || "one priority",
        sideB: model.coreConflict.split(" vs ")[1] || "competing priority"
      });
    }

    tradeoffs.push({
      sideA: "acting quickly",
      sideB: "protecting the outcome that matters most"
    });

    if (model.constraints.length) {
      tradeoffs.push({
        sideA: "what the user wants to do",
        sideB: "the constraint that limits the decision"
      });
    }

    model.tradeoffs = this.cleanTradeoffs(tradeoffs);
    reasoning.tradeoffs = model.tradeoffs;
  },

  buildDecisionMemo(reasoning) {
    const model = reasoning.caseModel;

    reasoning.decisionMemo.summary = model.situation;
    reasoning.decisionMemo.strongestFacts = reasoning.knownFacts.slice(0, 8);
    reasoning.decisionMemo.materialUnknowns = model.unknowns.slice(0, 5);
    reasoning.decisionMemo.safestAvailableActions =
      model.nextActionCandidates.slice(0, 4);

    reasoning.decisionMemo.actionsToAvoid = this.cleanList([
      "Do not let a lower-priority signal override the contract primary.",
      "Do not create a final recommendation inside the reasoning engine.",
      "Do not escalate medical or safety context unless the Safety Gate supports it.",
      "Do not replace a direct answer with a vague reflective question."
    ]);

    reasoning.executiveConclusion.analysisSummary = model.situation;
    reasoning.executiveConclusion.framing = model.frame;
    reasoning.executiveConclusion.candidateActions = model.nextActionCandidates;
    reasoning.executiveConclusion.keyRisk = model.risks[0] || null;
    reasoning.executiveConclusion.keyTradeoff = model.tradeoffs[0] || null;
    reasoning.executiveConclusion.uncertainty = model.unknowns[0] || null;
  },

  buildConfidence(reasoning) {
    const model = reasoning.caseModel;

    let score = 0.35;

    if (reasoning.primary) score += 0.1;
    if (model.frame) score += 0.1;
    if (model.situation) score += 0.1;
    if (reasoning.knownFacts.length) score += 0.15;
    if (model.goals.length) score += 0.08;
    if (model.constraints.length) score += 0.08;
    if (model.options.length) score += 0.1;
    if (model.tradeoffs.length) score += 0.08;
    if (model.nextActionCandidates.length) score += 0.08;

    reasoning.confidence.score = Math.min(0.95, Number(score.toFixed(2)));

    reasoning.confidence.level =
      reasoning.confidence.score >= 0.8 ? "high" :
      reasoning.confidence.score >= 0.6 ? "medium" :
      "low";

    reasoning.confidence.reasons = this.cleanList([
      model.frame ? "A usable frame was available." : null,
      reasoning.knownFacts.length ? "Structured facts were available." : null,
      model.options.length ? "Options were generated." : null,
      model.tradeoffs.length ? "Tradeoffs were identified." : null,
      model.nextActionCandidates.length ? "Next action candidates were identified." : null
    ]);

    reasoning.confidence.uncertaintyDrivers = model.unknowns || [];
    reasoning.decisionMemo.confidence = reasoning.confidence.level;
  },

  finalize(reasoning) {
    reasoning.answer = null;
    reasoning.recommendation = null;
    reasoning.executiveConclusion.ownsFinalRecommendation = false;

    if (
      reasoning.recommendation ||
      reasoning.answer ||
      reasoning.executiveConclusion.ownsFinalRecommendation
    ) {
      reasoning.obeyedContract = false;
      reasoning.contractViolations.push(
        "Reasoning engine attempted to own final answer authority."
      );
    }
  },

  inferConflictFromSignals(input = {}) {
    const domains = input.domains || [];
    const situations = input.situations || [];

    if (
      domains.includes("financial_resource_domain") &&
      domains.includes("family_context_domain")
    ) {
      return "financial stability vs family responsibility";
    }

    if (
      domains.includes("career_work_domain") &&
      domains.includes("family_context_domain")
    ) {
      return "career movement vs family stability";
    }

    if (
      situations.includes("tradeoff_or_competing_priorities")
    ) {
      return "choice vs consequence";
    }

    return null;
  },

  termText(term) {
    if (!term) return null;
    if (typeof term === "string") return term;
    return (
      term.raw ||
      term.phrase ||
      term.noun ||
      term.short ||
      term.value ||
      term.label ||
      term.evidence ||
      null
    );
  },

  getOriginalText(summary = {}) {
    return summary.userMessage || summary.message || summary.input || "";
  },

  first(arr = []) {
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  },

  add(arr, value) {
    if (!value || !Array.isArray(arr)) return;
    if (!arr.includes(value)) arr.push(value);
  },

  cleanList(list = []) {
    return [...new Set((list || []).filter(Boolean).map(x => String(x).trim()))];
  },

  cleanTradeoffs(list = []) {
    const seen = new Set();

    return list.filter(item => {
      if (!item?.sideA || !item?.sideB) return false;
      const key = `${item.sideA}::${item.sideB}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

console.log(
  "ARI REASONING ENGINE LOADED:",
  window.AriReasoningEngine?.version
);