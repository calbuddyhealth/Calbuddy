// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Build a universal situation map from upstream signals.
// V8.2.0 — Advisory Situation Mapper Only
// Boundary:
// - DOES collect signals from Safety Gate, Observer, Thread Understanding, Entity Resolver, and Classifier.
// - DOES map domains, situations, needs, risks, constraints, and candidate lanes.
// - DOES NOT choose final lane.
// - DOES NOT create Situation Contract.
// - DOES NOT override Triage.
// - DOES NOT compose final response.

window.Ari = window.Ari || {};

window.AriSituationMapEngine = {
  version: "8.2.0",

build(input = {}) {
  const summary = input.summary || input || {};

  const rawUserText =
    summary.userMessage ||
    summary.message ||
    summary.input ||
    summary.normalizedMessage ||
    "";

  const resolvedText =
    summary.resolvedUserQuestion ||
    summary.threadQuestion?.resolvedUserQuestion ||
    rawUserText;

  const text = this.normalize(resolvedText);

  const observations =
    summary.observations ||
    summary.observationLedger ||
    summary.observerEvidence?.observations ||
    [];

  const safetyGate = summary.safetyContextGate || {
    override: summary.override || null,
    riskLevel: summary.riskLevel || "none",
    riskType: summary.riskType || "none",
    followUpNeeded: summary.followUpNeeded || false,
    followUpQuestion: summary.followUpQuestion || null
  };

  const thread =
    summary.continuityContext ||
    summary.continuityPacket?.activeThread?.workingContext ||
    summary.continuityPacket?.activeThread ||
    summary.continuityResults?.outputs?.thread ||
    summary.threadUnderstanding ||
    summary.threadUnderstandingState ||
    {};

  const entity =
    summary.entityReference ||
    summary.entityReferenceState ||
    summary.subjectGraphState ||
    {};

  const conversation =
    summary.universalConversationClassification ||
    summary.conversationClassification ||
    summary.conversation ||
    {
      conversationType: summary.conversationType || null,
      conversationIntent: summary.conversationIntent || null,
      conversationCandidates: summary.conversationCandidates || []
    };

  const rawSemanticFrame =
    summary.semanticFrame ||
    summary.activeSemanticFrame ||
    summary.currentSemanticFrame ||
    summary.semanticFrameOutput ||
    summary.normalizedSemanticFrame ||
    summary.primarySemanticFrame ||
    null;

  const map = this.createEmptyMap({
    text,
    rawUserText,
    resolvedText,
    observations,
    safetyGate,
    thread,
    entity,
    conversation,
    rawSemanticFrame
  });

  this.collectUpstreamSignals(map);
  this.readSemanticSituation(map);
  this.detectQuestions(map);
  this.detectDomains(map);
  this.detectSituations(map);
  this.detectRisks(map);
  this.detectNeeds(map);

this.detectCompetingSituations(map);
this.detectResponseRequirements(map);
this.scoreMap(map);
this.buildLaneEvidence(map);
this.setMapSummary(map);
this.applyResponseConstraints(map);

this.buildEvidenceModel(map);
this.detectContradictions(map);
this.detectAmbiguity(map);
this.buildTriageHandoff(map);
this.runMapIntegrityCheck(map);
this.syncLegacyCompatibility(map);


  return map;
},

createEmptyMap({
  text,
  rawUserText,
  resolvedText,
  observations,
  safetyGate,
  thread,
  entity,
  conversation,
  rawSemanticFrame
}) {
  return {
    situationMapRan: true,
    situationMapVersion: this.version,
    source: "ari-situation-map-engine",

    text,
    rawText: text,
    rawUserText,
    resolvedText,
    normalizedResolvedText: text,

    threadQuestionUsed: Boolean(resolvedText !== rawUserText),
    threadQuestion: {
      used: Boolean(resolvedText !== rawUserText),
      rawUserText,
      resolvedText
    },

    observationsUsed: observations,
    safetyGateUsed: safetyGate,
    threadUnderstandingUsed: thread,
    entityReferenceUsed: entity,
    conversationClassificationUsed: conversation,
    rawSemanticFrame,

    canonical: {
      actor: null,
      subject: null,
      object: null,
      domain: null,
      subdomain: null,
      issue: null,
      issueType: null,
      goal: null,
      desiredOutcome: null,
      constraints: [],
      attempts: [],
      urgency: "unknown",
      severity: "unknown",
      timeframe: "present_or_unspecified",
      uncertainty: "unknown",
      requiresContext: false,
      priorContextUsed: false
    },

    semanticSituation: {
      available: false,
      source: null,
      confidence: 0,
      currentTurnMeaning: null,
      inheritedContext: null,
      handoff: null,
      continuityFrame: null
    },

    upstreamSignals: {
      domainSignals: [],
      intentSignals: [],
      issueSignals: [],
      subjectSignals: [],
      objectSignals: [],
      goalSignals: [],
      constraintSignals: [],
      attemptSignals: []
    },

    questions: [],
    domains: [],
    situations: [],
    needs: [],
    risks: [],

    responseRequirements: [],
    responseConstraints: [],
    competingSituations: [],

    evidenceModel: {
      objectiveEvidence: [],
      subjectiveEvidence: [],
      semanticEvidence: [],
      contextualEvidence: [],
      lexicalEvidence: [],
      riskEvidence: [],
      weightedSignals: [],
      confidence: 0
    },

    ambiguity: {
      present: false,
      level: "none",
      reasons: [],
      missing: []
    },

    contradictions: [],

    triageHandoff: {
      ready: false,
      evidence: [],
      recommendedPriorities: [],
      constraints: [],
      ambiguity: null,
      authority: "handoff_only"
    },

    laneEvidence: [],
    triageCandidates: [],

    gravity: 0,
    urgency: "none",
    complexity: "simple",
    horizon: "present_or_unspecified",

    eventState: safetyGate.riskLevel === "context" ? "context" : "unknown",
    riskLevel: safetyGate.riskLevel || "none",
    riskType: safetyGate.riskType || "none",
    override: safetyGate.override || null,

    situationType: null,
    situationFamily: null,
    primaryNeed: null,
    confidence: 0,

    shouldUseMultiLaneResponse: false,
    shouldAskClarifyingQuestion: false,
    recommendedQuestion: null,

    reasons: [],



    authority: "advisory_situation_mapping_only",

    cannotSet: [
      "primaryLane",
      "primaryLaneSuggestion",
      "triagePrimaryLane",
      "situationContractPrimary",
      "riskLevelOverride",
      "finalResponse",
      "responseText",
      "medicalEscalation",
      "mouthPattern"
    ]
  };
},
collectUpstreamSignals(map) {
  const thread = map.threadUnderstandingUsed || {};
  const working =
    thread.workingContext ||
    thread ||
    {};

  const allSignals = [
    ...(thread.currentTurn?.signals || []),
    ...(working.domainSignals || []),
    ...(working.intentSignals || []),
    ...(working.issueSignals || []),
    ...(working.subjectSignals || []),
    ...(working.objectSignals || []),
    ...(working.goalSignals || []),
    ...(working.constraintSignals || []),
    ...(working.attemptSignals || [])
  ];

  allSignals.forEach(signal => {
    if (!signal?.category) return;

    if (signal.category === "domain") this.addObj(map.upstreamSignals.domainSignals, signal);
    if (signal.category === "intent") this.addObj(map.upstreamSignals.intentSignals, signal);
    if (signal.category === "issue") this.addObj(map.upstreamSignals.issueSignals, signal);
    if (signal.category === "subject") this.addObj(map.upstreamSignals.subjectSignals, signal);
    if (signal.category === "object") this.addObj(map.upstreamSignals.objectSignals, signal);
    if (signal.category === "goal") this.addObj(map.upstreamSignals.goalSignals, signal);
    if (signal.category === "constraint") this.addObj(map.upstreamSignals.constraintSignals, signal);
    if (signal.category === "attempt") this.addObj(map.upstreamSignals.attemptSignals, signal);
  });

  const entity = map.entityReferenceUsed || {};

  if (entity.activeProblem || entity.activeIssue) {
    this.addObj(map.upstreamSignals.issueSignals, {
      category: "issue",
      type: "entity_active_issue",
      value:
        entity.activeProblem?.issueType ||
        entity.activeIssue?.issueType ||
        entity.activeProblem?.type ||
        entity.activeIssue?.type ||
        "active_issue",
      evidence:
        entity.activeProblem?.label ||
        entity.activeIssue?.label ||
        "entity active issue",
      confidence:
        entity.activeProblem?.confidence ||
        entity.activeIssue?.confidence ||
        entity.confidence ||
        0.7,
      source: "entity_reference_resolver"
    });
  }

  if (entity.activeSubject || entity.activeEntity) {
    this.addObj(map.upstreamSignals.subjectSignals, {
      category: "subject",
      type: "entity_active_subject",
      value:
        entity.activeSubject?.kind ||
        entity.activeEntity?.kind ||
        "active_subject",
      evidence:
        entity.activeSubject?.surface ||
        entity.activeEntity?.surface ||
        entity.activeSubject?.label ||
        entity.activeEntity?.label ||
        "entity active subject",
      confidence:
        entity.activeSubject?.confidence ||
        entity.activeEntity?.confidence ||
        entity.confidence ||
        0.7,
      source: "entity_reference_resolver"
    });
  }
},
buildEvidenceModel(map) {
  const safeConfidence = value => {
    const n = Number(value);
    if (Number.isFinite(n)) return n > 1 ? n / 100 : n;
    return 0.6;
  };

  const addEvidence = (bucket, item = {}) => {
    if (!item.claim && !item.evidence) return;

    map.evidenceModel[bucket].push({
      claim: item.claim || item.evidence,
      evidence: item.evidence || item.claim,
      confidence: safeConfidence(item.confidence),
      source: item.source || "unknown",
      type: item.type || null
    });
  };

  (map.observationsUsed || []).forEach(obs => {
    const type = obs.type || "";

    const item = {
      claim: obs.value || obs.type,
      evidence: obs.evidence || obs.value || obs.type,
      confidence: obs.confidence ?? 0.6,
      source: obs.source || "observer",
      type
    };

    if (
      [
        "question_mark_count",
        "message_length",
        "body_symptom",
        "work_reference",
        "money_reference",
        "building_reference",
        "family_reference",
        "person_reference"
      ].includes(type)
    ) {
      addEvidence("objectiveEvidence", item);
      return;
    }

    if (
      [
        "emotion_word",
        "ownership_reference",
        "conversation_target",
        "messy_language_signal"
      ].includes(type)
    ) {
      addEvidence("subjectiveEvidence", item);
      return;
    }

    addEvidence("lexicalEvidence", item);
  });

  if (map.semanticSituation.available) {
    addEvidence("semanticEvidence", {
      claim: map.canonical.issueType || "semantic situation",
      evidence: map.canonical.goal || map.semanticSituation.source,
      confidence: map.semanticSituation.confidence || 0.7,
      source: map.semanticSituation.source,
      type: "semantic_situation"
    });
  }

  if (map.canonical.priorContextUsed) {
    addEvidence("contextualEvidence", {
      claim: "prior context used",
      evidence: map.canonical.subject || "continuity context",
      confidence: 0.78,
      source: "continuity",
      type: "prior_context"
    });
  }

  (map.risks || []).forEach(risk => {
    addEvidence("riskEvidence", {
      claim: risk,
      evidence: map.riskType || risk,
      confidence: 0.86,
      source: "safety_or_situation_map",
      type: "risk"
    });
  });

  map.evidenceModel.weightedSignals = [
    ...map.evidenceModel.riskEvidence.map(e => ({ ...e, weight: 100 })),
    ...map.evidenceModel.semanticEvidence.map(e => ({ ...e, weight: 85 })),
    ...map.evidenceModel.contextualEvidence.map(e => ({ ...e, weight: 75 })),
    ...map.evidenceModel.objectiveEvidence.map(e => ({ ...e, weight: 70 })),
    ...map.evidenceModel.subjectiveEvidence.map(e => ({ ...e, weight: 60 })),
    ...map.evidenceModel.lexicalEvidence.map(e => ({ ...e, weight: 55 }))
  ].sort((a, b) => b.weight - a.weight);

  const total = map.evidenceModel.weightedSignals.length;

  const avg =
    total > 0
      ? map.evidenceModel.weightedSignals.reduce(
          (sum, e) => sum + Number(e.confidence || 0),
          0
        ) / total
      : 0.5;

  map.evidenceModel.confidence = Math.round(avg * 100);
},

detectContradictions(map) {
  map.contradictions = [];

  const addContradiction = (
    type,
    claim,
    severity = "low",
    guidance = ""
  ) => {
    map.contradictions.push({
      type,
      claim,
      severity,
      guidance
    });
  };

  const has = domain => map.domains.includes(domain);

  // ------------------------------------------------------------------
  // Domain conflicts
  // ------------------------------------------------------------------

  if (
    has("builder_domain") &&
    has("medical_context_domain") &&
    !has("animal_health_context_domain")
  ) {
    addContradiction(
      "domain_conflict",
      "Builder and medical domains both strongly detected.",
      "medium",
      "Prefer semantic frame and resolved user question when selecting the dominant interpretation."
    );
  }

  if (
    has("builder_domain") &&
    has("relationship_context_domain")
  ) {
    addContradiction(
      "mixed_domain",
      "Technical and relationship contexts both present.",
      "low",
      "Allow multi-lane reasoning unless semantic evidence clearly favors one."
    );
  }

  // ------------------------------------------------------------------
  // Semantic vs legacy disagreement
  // ------------------------------------------------------------------

  if (
    map.semanticSituation.available &&
    map.canonical.issueType &&
    map.situations.length &&
    !map.situations.includes(map.canonical.issueType)
  ) {
    addContradiction(
      "semantic_vs_legacy",
      `Semantic issue '${map.canonical.issueType}' is not reflected in detected situations.`,
      "medium",
      "Favor semantic interpretation while retaining legacy detections as supporting evidence."
    );
  }

  // ------------------------------------------------------------------
  // Need vs lane disagreement
  // ------------------------------------------------------------------

  const topLane = map.laneEvidence?.[0]?.lane || null;

  if (
    map.needs.includes("decision_support") &&
    topLane &&
    topLane !== "executive_decision"
  ) {
    addContradiction(
      "lane_alignment",
      "Decision support detected but executive lane is not leading.",
      "low",
      "Verify lane ranking before Triage finalizes."
    );
  }

  if (
    map.needs.includes("action_or_build_help") &&
    topLane &&
    topLane === "teacher"
  ) {
    addContradiction(
      "explain_vs_act",
      "Signals indicate implementation help but explanation lane is strongest.",
      "low",
      "Consider builder support alongside explanation."
    );
  }

  // ------------------------------------------------------------------
  // Context continuity disagreement
  // ------------------------------------------------------------------

  if (
    map.canonical.requiresContext &&
    !map.canonical.priorContextUsed
  ) {
    addContradiction(
      "continuity_gap",
      "Semantic frame expects prior context but none was incorporated.",
      "medium",
      "Thread Understanding should reconstruct missing context before Triage."
    );
  }

  // ------------------------------------------------------------------
  // Confidence disagreement
  // ------------------------------------------------------------------

  if (
    map.semanticSituation.available &&
    map.semanticSituation.confidence >= 85 &&
    map.evidenceModel.confidence < 50
  ) {
    addContradiction(
      "confidence_mismatch",
      "Semantic confidence is high while aggregate evidence confidence is low.",
      "low",
      "Review evidence weighting and observer signals."
    );
  }
},
detectAmbiguity(map) {
  const missing = [];
  const reasons = [];

  const topLane = map.laneEvidence?.[0] || null;
  const secondLane = map.laneEvidence?.[1] || null;

  if (!map.canonical.subject && map.canonical.requiresContext) {
    missing.push("subject");
    reasons.push("Context is required but subject is unresolved.");
  }

  if (
    map.needs.includes("decision_support") &&
    !map.canonical.object &&
    !map.canonical.issue
  ) {
    missing.push("decision_options_or_issue");
    reasons.push("Decision support detected but options/issue are unclear.");
  }

  if (
    map.needs.includes("context_sensitive_support") &&
    map.domains.includes("medical_context_domain") &&
    !map.text
  ) {
    missing.push("health_context_details");
    reasons.push("Health/body context detected but details are missing.");
  }

  if (
    topLane &&
    secondLane &&
    Math.abs(topLane.score - secondLane.score) <= 8
  ) {
    missing.push("dominant_lane");
    reasons.push(
      `Top lane '${topLane.lane}' is close to '${secondLane.lane}'.`
    );
  }

  if (map.contradictions?.length) {
    missing.push("conflict_resolution");
    reasons.push("Contradictions are present and need triage review.");
  }

  if (
    map.semanticSituation.available &&
    map.semanticSituation.confidence < 60
  ) {
    missing.push("semantic_confidence");
    reasons.push("Semantic frame confidence is weak.");
  }

  map.ambiguity = {
    present: missing.length > 0,
    level:
      missing.length >= 3
        ? "high"
        : missing.length === 2
          ? "moderate"
          : missing.length === 1
            ? "low"
            : "none",
    missing,
    reasons,
    shouldAskClarifyingQuestion:
      missing.includes("subject") ||
      missing.includes("decision_options_or_issue") ||
      missing.includes("dominant_lane")
  };

  map.shouldAskClarifyingQuestion = map.ambiguity.shouldAskClarifyingQuestion;

  if (map.shouldAskClarifyingQuestion && !map.recommendedQuestion) {
    map.recommendedQuestion =
      "What exactly are we deciding or trying to fix?";
  }
},

buildTriageHandoff(map) {
  map.triageHandoff = {
    ready: true,
    authority: "handoff_only",
    situationFamily: map.situationFamily || this.inferSituationFamily(map),
    primaryNeed: map.primaryNeed || map.needs[0] || "general_understanding",
    semanticSituation: map.semanticSituation,
    canonical: map.canonical,
    evidence: map.evidenceModel.weightedSignals.slice(0, 8),
    recommendedPriorities: map.laneEvidence.slice(0, 6),
    constraints: map.responseConstraints,
    ambiguity: map.ambiguity,
    contradictions: map.contradictions,
    risk: {
      level: map.riskLevel,
      type: map.riskType,
      override: map.override
    }
  };
},

  

mapSemanticDomainToSituationDomain(map, domain) {
  const domainMap = {
    health: "medical_context_domain",
    animal_health: "animal_health_context_domain",
    general_understanding: "knowledge_domain",
    choice_or_priority: "decision_context_domain",
    task_execution: "builder_domain",
    ari_architecture: "builder_domain",
    system_behavior: "builder_domain",
    relationships: "relationship_context_domain",
    self_concept: "identity_context_domain",
    inner_life: "emotion_context_domain",
    execution: "builder_domain",
    analysis: "knowledge_domain"
  };

  const mapped = domainMap[domain];

  if (mapped) {
    this.add(map.domains, mapped);
  }
},

readSemanticSituation(map) {
  const thread = map.threadUnderstandingUsed || {};
  const working = thread.workingContext || thread || {};

  const frame =
  thread.semanticFrame ||
  thread.activeSemanticFrame ||
  working.semanticFrame ||
  working.activeSemanticFrame ||
  working.semanticState?.semanticFrame ||
  map.conversationClassificationUsed?.semanticFrame ||
  map.rawSemanticFrame ||
  null;

  const currentTurnFrame =
    frame?.currentTurnFrame ||
    frame?.primaryFrame ||
    frame ||
    null;

  const continuityFrame = frame?.continuityFrame || null;
  const handoff = frame?.handoff || null;
  const inherited = frame?.inheritedContext || null;

  if (!frame && !currentTurnFrame && !handoff && !inherited) return;

  map.semanticSituation = {
    available: true,
    source: frame?.semanticFrameSource || frame?.source || "semantic_frame",
    confidence:
      currentTurnFrame?.confidence ||
      frame?.confidence ||
      handoff?.confidence ||
      60,
    currentTurnMeaning: currentTurnFrame,
    inheritedContext: inherited,
    handoff,
    continuityFrame
  };

  map.canonical.domain =
    currentTurnFrame?.domain ||
    handoff?.domain ||
    map.canonical.domain;

  map.canonical.issueType =
    currentTurnFrame?.frameType ||
    handoff?.currentMeaning ||
    map.canonical.issueType;

  map.canonical.goal =
    currentTurnFrame?.intent ||
    handoff?.intent ||
    map.canonical.goal;

  map.canonical.subject =
    handoff?.inheritedSubject ||
    inherited?.activeSubject ||
    inherited?.currentTopic ||
    map.canonical.subject;

  map.canonical.requiresContext = Boolean(
    handoff?.requiresPriorContext ||
    continuityFrame?.isContinuation ||
    inherited
  );

  map.canonical.priorContextUsed = Boolean(
    inherited ||
    handoff?.priorContextAvailable
  );

  this.mapSemanticDomainToSituationDomain(map, currentTurnFrame?.domain);
  

  if (currentTurnFrame?.frameType) {
    this.add(map.situations, currentTurnFrame.frameType);
  }

  if (handoff?.requiresPriorContext || continuityFrame?.isContinuation) {
    this.add(map.situations, "follow_up_context_available");
    this.add(map.responseRequirements, "reuse_prior_context_without_reasking");
  }

  map.reasons.push("Semantic frame read into Situation Map canonical structure.");
},

  detectQuestions(map) {
    const observations = map.observationsUsed || [];
    const thread = map.threadUnderstandingUsed || {};
    const conversation = map.conversationClassificationUsed || {};

    if (
      this.hasType(observations, "question_phrase") ||
      this.hasType(observations, "question_mark_count")
    ) {
      this.add(map.questions, "explicit_question");
    }

    if (this.hasQuestionType(observations, "decision_question")) {
      this.add(map.questions, "decision_question");
    }

    if (this.hasQuestionType(observations, "instruction_question")) {
      this.add(map.questions, "instruction_question");
    }

    if (
      this.hasQuestionType(observations, "knowledge_question") ||
      this.hasType(observations, "knowledge_request_phrase")
    ) {
      this.add(map.questions, "knowledge_question");
    }

    if (this.hasQuestionType(observations, "opinion_request")) {
      this.add(map.questions, "opinion_request");
    }

    const impliedType =
      thread.impliedQuestion?.type ||
      thread.resolvedMeaning?.intent ||
      null;

    if (impliedType && impliedType !== "respond_normally") {
      this.add(map.questions, impliedType);
      map.reasons.push(`Thread supplied intent/question: ${impliedType}.`);
    }

    const conversationType = conversation.conversationType;
    if (conversationType) {
      this.add(map.questions, conversationType);
      map.reasons.push(`Classifier supplied conversation type: ${conversationType}.`);
    }

    if (!map.questions.length) {
      this.add(map.questions, "implicit_question_or_statement");
    }
  },
    detectDomains(map) {
    const observations = map.observationsUsed || [];
    const safetyGate = map.safetyGateUsed || {};
    const conversation = map.conversationClassificationUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.domains, "safety_domain");
    if (safetyGate.override === "medical_urgent") this.add(map.domains, "medical_context_domain");
    if (safetyGate.override === "clarify_risk") this.add(map.domains, "risk_clarification_domain");

    const observerDomainMap = {
      safety: "safety_domain",
      body: "medical_context_domain",
      relationship: "relationship_context_domain",
      family: "family_context_domain",
      emotion: "emotion_context_domain",
      career: "career_work_domain",
      financial: "financial_resource_domain",
      builder: "builder_domain",
      knowledge: "knowledge_domain",
      memory: "memory_preference_domain",
      wisdom: "wisdom_domain",
      identity: "identity_context_domain",
      politics: "civic_or_political_context_domain",
      religion: "religion_or_spiritual_context_domain"
    };

    observations.forEach(obs => {
      if (obs.domain && observerDomainMap[obs.domain]) {
        this.add(map.domains, observerDomainMap[obs.domain]);
      }
    });

    if (this.hasType(observations, "body_symptom")) this.add(map.domains, "medical_context_domain");
    if (this.hasType(observations, "work_reference")) this.add(map.domains, "career_work_domain");
    if (this.hasType(observations, "money_reference")) this.add(map.domains, "financial_resource_domain");
    if (this.hasType(observations, "building_reference")) this.add(map.domains, "builder_domain");
    if (this.hasType(observations, "emotion_word")) this.add(map.domains, "emotion_context_domain");
    if (this.hasType(observations, "family_reference")) this.add(map.domains, "family_context_domain");
    if (this.hasType(observations, "person_reference")) this.add(map.domains, "relationship_context_domain");

    this.mapConversationDomain(conversation.conversationType, map);
this.mapUniversalDomainSignals(map);
this.mapTextDomainSignals(map);
  },

  mapConversationDomain(type, map) {
    const mappings = {
      builder_task: ["builder_domain"],
      writing_task: ["writing_domain"],
      calculation_task: ["calculation_domain"],
      medical_or_body_concern: ["medical_context_domain"],
      emotional_concern: ["emotion_context_domain"],
      safety_concern: ["safety_domain"],
      workplace_conflict_or_ethics: ["career_work_domain", "accountability_context_domain"],
      relationship_or_family_context: ["relationship_context_domain", "family_context_domain"],
      interpersonal_response_help: ["relationship_context_domain"],
      memory_request: ["memory_preference_domain"],
      creative_or_design_conversation: ["creative_design_domain"],
      ari_self_or_perspective_question: ["ari_self_context_domain"],
      civic_or_political_question: ["civic_or_political_context_domain"],
      religion_or_spiritual_question: ["religion_or_spiritual_context_domain"]
    };

    (mappings[type] || []).forEach(domain => this.add(map.domains, domain));
  },

  mapUniversalDomainSignals(map) {
    const signals = map.upstreamSignals.domainSignals || [];

    const domainMap = {
      animal_health_or_pet_context: ["animal_health_context_domain", "medical_context_domain"],
      human_or_body_health_context: ["medical_context_domain"],
      builder_or_system_context: ["builder_domain"],
      work_or_accountability_context: ["career_work_domain", "accountability_context_domain"],
      relationship_or_family_context: ["relationship_context_domain", "family_context_domain"],
      financial_context: ["financial_resource_domain"]
    };

    signals.forEach(signal => {
      (domainMap[signal.value] || []).forEach(domain => this.add(map.domains, domain));
    });
  },

mapTextDomainSignals(map) {
  const text = map.rawText || map.resolvedText || "";

  if (/\b(cat|dog|pet|kitten|puppy|fleas?|ticks?|vet)\b/.test(text)) {
    this.add(map.domains, "animal_health_context_domain");
  }

  if (/\b(sunburn|burned|burnt|blister|blisters|skin|pain|red|peeling)\b/.test(text)) {
    this.add(map.domains, "medical_context_domain");
  }

  if (/\b(code|bug|error|file|function|engine|pipeline|javascript|github)\b/.test(text)) {
    this.add(map.domains, "builder_domain");
  }
},

mapTextSituationSignals(map) {
  const text = map.rawText || map.resolvedText || "";

  if (/\b(sunburn|burned|burnt)\b/.test(text)) {
    this.add(map.situations, "sunburn_or_skin_irritation_context");
  }

  if (/\b(fleas?|ticks?)\b/.test(text)) {
    this.add(map.situations, "pet_parasite_context");
  }

  if (/\bwhat else can i do|what should i do|can i|how do i\b/.test(text)) {
    this.add(map.situations, "action_guidance_request");
  }
},

mapTextNeedSignals(map) {
  const text = map.rawText || map.resolvedText || "";

  if (
    /\b(sunburn|burned|burnt|blister|blisters|fleas?|ticks?)\b/.test(text)
  ) {
    this.add(map.needs, "context_sensitive_support");
    this.add(map.needs, "action_or_build_help");
  }

  if (/\bwhat else can i do|what should i do|how do i\b/.test(text)) {
    this.add(map.needs, "action_or_build_help");
  }
},

  detectSituations(map) {
    const observations = map.observationsUsed || [];
    const safetyGate = map.safetyGateUsed || {};
    const thread = map.threadUnderstandingUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.situations, "active_safety_emergency");
    if (safetyGate.override === "medical_urgent") this.add(map.situations, "active_medical_urgency");
    if (safetyGate.override === "clarify_risk") this.add(map.situations, "ambiguous_risk_needs_clarification");
    if (safetyGate.riskLevel === "context") this.add(map.situations, "risk_or_medical_context_only");

    if (this.hasType(observations, "body_context")) this.add(map.situations, "body_or_medical_context");
    if (this.hasType(observations, "body_symptom")) this.add(map.situations, "body_symptom_mentioned");
    if (this.hasType(observations, "work_reference")) this.add(map.situations, "work_or_career_context");
    if (this.hasType(observations, "money_reference")) this.add(map.situations, "money_or_resource_context");
    if (this.hasType(observations, "building_reference")) this.add(map.situations, "building_or_debugging_context");
    if (this.hasType(observations, "knowledge_request_phrase")) this.add(map.situations, "teaching_or_explanation_request");
    if (this.hasType(observations, "emotion_word")) this.add(map.situations, "emotion_language_present");
    if (this.hasType(observations, "memory_request_phrase")) this.add(map.situations, "memory_or_preference_request");
    if (this.hasType(observations, "contrast_or_tradeoff_connector")) this.add(map.situations, "tradeoff_or_competing_priorities");
    if (this.hasType(observations, "pressure_or_constraint")) this.add(map.situations, "constraint_or_obligation_pressure");

    const issueKind =
      thread.activeIssue?.kind ||
      thread.activeIssue?.type ||
      thread.resolvedMeaning?.resolvedIssue?.kind ||
      null;

    this.mapIssueKindToSituation(issueKind, map);
this.mapUpstreamIssueSignals(map);
this.mapUpstreamIntentSignals(map);
this.mapTextSituationSignals(map);

    if (
  thread.workingContext ||
  thread.shouldUseAsContext ||
  thread.activeSituation ||
  thread.keyFacts?.length ||
  thread.activeThreadFacts?.length ||
  thread.resolvedMeaning?.isContextual
) {
  this.add(map.situations, "follow_up_context_available");
}
  },

  mapIssueKindToSituation(issueKind, map) {
    const issueMap = {
      health_or_body_issue: ["body_symptom_mentioned", "active_problem_context"],
      technical_or_system_issue: ["building_or_debugging_context", "active_problem_context"],
      relationship_or_trust_issue: ["relationship_or_trust_context", "active_problem_context"],
      pressure_or_constraint_issue: ["constraint_or_obligation_pressure", "active_problem_context"],
      accountability_or_work_quality_issue: [
        "accountability_or_work_quality_context",
        "work_or_career_context",
        "active_problem_context"
      ],
      work_ethics_or_safety: [
        "accountability_or_work_quality_context",
        "work_or_career_context",
        "active_problem_context"
      ],
      workplace_reporting_decision: [
        "accountability_or_work_quality_context",
        "work_or_career_context",
        "decision_context"
      ]
    };

    (issueMap[issueKind] || []).forEach(situation => this.add(map.situations, situation));
  },

  mapUpstreamIssueSignals(map) {
    (map.upstreamSignals.issueSignals || []).forEach(signal => {
      this.mapIssueKindToSituation(signal.value, map);
    });
  },

  mapUpstreamIntentSignals(map) {
    const intentMap = {
      action_guidance: ["action_guidance_request"],
      explanation_or_possibility: ["explanation_or_possibility_request"],
      monitoring_or_risk_check: ["monitoring_guidance_request"],
      implementation_help: ["implementation_help_request"],
      writing_help: ["writing_or_rewrite_request"],
      memory_or_preference: ["memory_or_preference_request"],
      alternative_strategy: ["alternative_strategy_request"]
    };

    (map.upstreamSignals.intentSignals || []).forEach(signal => {
      (intentMap[signal.value] || []).forEach(situation => this.add(map.situations, situation));
    });
  },
    detectRisks(map) {
    const safetyGate = map.safetyGateUsed || {};

    if (safetyGate.override === "safety_emergency") this.add(map.risks, "confirmed_safety_emergency");
    if (safetyGate.override === "medical_urgent") this.add(map.risks, "confirmed_medical_urgency");
    if (safetyGate.override === "clarify_risk") this.add(map.risks, "ambiguous_risk");
    if (safetyGate.riskLevel === "context") this.add(map.risks, "context_only_not_emergency");

    if (map.situations.includes("accountability_or_work_quality_context")) {
      this.add(map.risks, "accountability_or_quality_risk");
    }

    if (map.situations.includes("constraint_or_obligation_pressure")) {
      this.add(map.risks, "pressure_or_constraint_risk");
    }
  },

mapSemanticNeedSignals(map) {
  const frame = map.semanticSituation?.currentTurnMeaning || {};
  const handoff = map.semanticSituation?.handoff || {};
  const domain = frame.domain || handoff.domain || "";
  const meaning = frame.frameType || handoff.currentMeaning || "";
  const intent = frame.intent || handoff.intent || "";

  if (meaning === "decision_support" || intent === "evaluate_options") {
    this.add(map.needs, "decision_support");
  }

  if (
    intent.includes("action") ||
    intent.includes("manage") ||
    intent.includes("implement") ||
    meaning.includes("instruction")
  ) {
    this.add(map.needs, "action_or_build_help");
  }

  if (
    intent.includes("explain") ||
    intent.includes("understand") ||
    meaning.includes("information_seeking")
  ) {
    this.add(map.needs, "understanding");
  }

  if (
    domain === "health" ||
    domain === "animal_health" ||
    meaning.includes("medical") ||
    meaning.includes("body")
  ) {
    this.add(map.needs, "context_sensitive_support");
  }

  if (map.canonical.requiresContext || map.canonical.priorContextUsed) {
    this.add(map.needs, "context_sensitive_support");
  }
},

  detectNeeds(map) {
    const conversation = map.conversationClassificationUsed || {};
this.mapSemanticNeedSignals(map);

    if (
      map.risks.includes("confirmed_safety_emergency") ||
      map.risks.includes("confirmed_medical_urgency")
    ) {
      this.add(map.needs, "urgent_protection");
    }

    if (
      map.questions.includes("decision_question") ||
      map.situations.includes("tradeoff_or_competing_priorities") ||
      map.situations.includes("decision_context") ||
      map.situations.includes("accountability_or_work_quality_context") ||
      conversation.conversationType === "decision_question" ||
      conversation.conversationType === "workplace_conflict_or_ethics"
    ) {
      this.add(map.needs, "decision_support");
    }

    if (
      map.questions.includes("instruction_question") ||
      map.domains.includes("builder_domain") ||
      map.situations.includes("implementation_help_request")
    ) {
      this.add(map.needs, "action_or_build_help");
    }

    if (
      map.questions.includes("knowledge_question") ||
      map.domains.includes("knowledge_domain") ||
      map.situations.includes("explanation_or_possibility_request")
    ) {
      this.add(map.needs, "understanding");
    }

    if (
      map.domains.includes("medical_context_domain") ||
      map.situations.includes("body_symptom_mentioned")
    ) {
      this.add(map.needs, "context_sensitive_support");
    }

    if (map.situations.includes("monitoring_guidance_request")) this.add(map.needs, "monitoring_guidance");
    if (map.situations.includes("alternative_strategy_request")) this.add(map.needs, "safe_alternative_strategy");
    if (map.domains.includes("emotion_context_domain")) this.add(map.needs, "emotional_attunement");
    if (map.domains.includes("relationship_context_domain")) this.add(map.needs, "relationship_awareness");
    if (map.domains.includes("family_context_domain")) this.add(map.needs, "family_awareness");
    if (map.domains.includes("memory_preference_domain")) this.add(map.needs, "memory_acknowledgment");
    if (map.domains.includes("ari_self_context_domain")) this.add(map.needs, "transparent_self_disclosure");
    if (map.domains.includes("writing_domain")) this.add(map.needs, "writing_or_rewrite");
    if (map.domains.includes("calculation_domain")) this.add(map.needs, "calculation");
    if (map.domains.includes("creative_design_domain")) this.add(map.needs, "creative_generation");
    if (map.domains.includes("accountability_context_domain")) this.add(map.needs, "accountability_support");

this.mapTextNeedSignals(map);
    if (!map.needs.length) {
      this.add(map.needs, "general_understanding");
    }
  },

  detectCompetingSituations(map) {
    const addCompeting = (name, reason, weight = 50) => {
      if (!name) return;

      map.competingSituations.push({
        name,
        reason,
        weight
      });
    };

    if (map.needs.includes("decision_support") && map.needs.includes("relationship_awareness")) {
      addCompeting(
        "decision_vs_relationship_impact",
        "Decision support is present with relationship context.",
        76
      );
    }

    if (map.needs.includes("decision_support") && map.needs.includes("family_awareness")) {
      addCompeting(
        "decision_vs_family_impact",
        "Decision support is present with family context.",
        78
      );
    }

    if (map.needs.includes("decision_support") && map.needs.includes("accountability_support")) {
      addCompeting(
        "accountability_vs_social_consequence",
        "Accountability or work-quality issue may include team consequences.",
        84
      );
    }

    if (map.needs.includes("context_sensitive_support") && map.needs.includes("safe_alternative_strategy")) {
      addCompeting(
        "body_context_vs_action_strategy",
        "Body or health context requires practical but cautious alternatives.",
        82
      );
    }

    map.competingSituations.sort((a, b) => b.weight - a.weight);
  },

  detectResponseRequirements(map) {
    const safetyGate = map.safetyGateUsed || {};
    const thread = map.threadUnderstandingUsed || {};

    if (safetyGate.override === "safety_emergency") {
      this.add(map.responseRequirements, "safety_response_required");
      map.shouldAskClarifyingQuestion = false;
    }

    if (safetyGate.override === "medical_urgent") {
      this.add(map.responseRequirements, "medical_urgent_response_required");
      map.shouldAskClarifyingQuestion = false;
    }

    if (safetyGate.override === "clarify_risk") {
      this.add(map.responseRequirements, "ask_one_risk_clarification_question");
      map.shouldAskClarifyingQuestion = true;
      map.recommendedQuestion = safetyGate.followUpQuestion || "Are you safe right now?";
    }

    if (map.needs.includes("decision_support")) this.add(map.responseRequirements, "decision_framework");
    if (map.needs.includes("action_or_build_help")) this.add(map.responseRequirements, "step_by_step_action");
    if (map.needs.includes("understanding")) this.add(map.responseRequirements, "clear_explanation");
    if (map.needs.includes("emotional_attunement")) this.add(map.responseRequirements, "brief_emotional_attunement");
    if (map.needs.includes("context_sensitive_support")) this.add(map.responseRequirements, "context_sensitive_care");
    if (map.needs.includes("monitoring_guidance")) this.add(map.responseRequirements, "name_what_to_watch_for");
    if (map.needs.includes("safe_alternative_strategy")) this.add(map.responseRequirements, "give_safe_alternatives");
    if (map.needs.includes("transparent_self_disclosure")) this.add(map.responseRequirements, "answer_ari_identity_transparently");
    if (map.needs.includes("writing_or_rewrite")) this.add(map.responseRequirements, "produce_requested_text");
    if (map.needs.includes("calculation")) this.add(map.responseRequirements, "calculate_directly");
    if (map.needs.includes("creative_generation")) this.add(map.responseRequirements, "generate_options");
    if (map.needs.includes("accountability_support")) this.add(map.responseRequirements, "separate_person_from_system_pressure");

    if (
  thread.resolvedMeaning?.isContextual ||
  thread.workingContext ||
  thread.shouldUseAsContext ||
  thread.activeSituation ||
  thread.keyFacts?.length ||
  thread.activeThreadFacts?.length
) {
  this.add(map.responseRequirements, "reuse_prior_context_without_reasking");
}
  },
    scoreMap(map) {
    if (map.risks.includes("confirmed_safety_emergency")) {
      map.gravity = 10;
      map.urgency = "critical";
      return;
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      map.gravity = 9;
      map.urgency = "high";
      return;
    }

    if (map.risks.includes("ambiguous_risk")) {
      map.gravity = 7;
      map.urgency = "clarify";
      return;
    }

    let gravity = 0;

    if (map.needs.includes("decision_support")) gravity += 3;
    if (map.needs.includes("context_sensitive_support")) gravity += 3;
    if (map.needs.includes("monitoring_guidance")) gravity += 2;
    if (map.needs.includes("safe_alternative_strategy")) gravity += 2;
    if (map.needs.includes("accountability_support")) gravity += 2;
    if (map.situations.includes("constraint_or_obligation_pressure")) gravity += 2;
    if (map.domains.includes("family_context_domain")) gravity += 2;
    if (map.domains.includes("financial_resource_domain")) gravity += 2;
    if (map.domains.includes("career_work_domain")) gravity += 1;
    if (map.domains.includes("emotion_context_domain")) gravity += 1;

    map.gravity = Math.min(10, gravity);

    if (gravity >= 7) map.urgency = "moderate";
    else if (gravity >= 3) map.urgency = "low";
    else map.urgency = "none";

    const total =
      map.questions.length +
      map.situations.length +
      map.domains.length +
      map.needs.length +
      map.competingSituations.length;

    map.complexity =
      total >= 12 || map.domains.length >= 4
        ? "multi_domain"
        : total >= 6 || map.domains.length >= 2
          ? "moderate"
          : "simple";

    map.shouldUseMultiLaneResponse =
      map.complexity === "multi_domain" ||
      map.needs.includes("decision_support") ||
      map.competingSituations.length > 0;

    if (map.situations.includes("future_planning_context")) {
      map.horizon = "future";
    } else if (map.situations.includes("past_or_historical_context")) {
      map.horizon = "past";
    } else {
      map.horizon = "present_or_unspecified";
    }
  },

addSemanticLaneEvidence(map, addCandidate) {
  const frame = map.semanticSituation?.currentTurnMeaning || {};
  const handoff = map.semanticSituation?.handoff || {};
  const meaning = frame.frameType || handoff.currentMeaning || "";
  const intent = frame.intent || handoff.intent || "";
  const domain = frame.domain || handoff.domain || "";

  if (meaning === "decision_support" || intent === "evaluate_options") {
    addCandidate("executive_decision", 86, "Semantic frame indicates decision support.");
  }

  if (
    intent.includes("implement") ||
    intent.includes("create") ||
    intent.includes("modify") ||
    intent.includes("manage") ||
    meaning.includes("instruction")
  ) {
    addCandidate("builder", 86, "Semantic frame indicates action/build help.");
  }

  if (
    intent.includes("understand") ||
    intent.includes("explain") ||
    meaning === "information_seeking"
  ) {
    addCandidate("teacher", 82, "Semantic frame indicates explanation or understanding.");
  }

  if (
    domain === "health" ||
    meaning.includes("medical") ||
    meaning.includes("body")
  ) {
    addCandidate("medical_context", 84, "Semantic frame indicates health/body context.");
  }
},

  buildLaneEvidence(map) {
    const addCandidate = (lane, score, reason) => {
      if (!lane || !score) return;

      const existing = map.laneEvidence.find(item => item.lane === lane);

      if (existing) {
        existing.score = Math.min(100, existing.score + score);
        if (reason) existing.reasons.push(reason);
        return;
      }

      map.laneEvidence.push({
        lane,
        score: Math.min(100, score),
        reasons: reason ? [reason] : []
      });
    };
this.addSemanticLaneEvidence(map, addCandidate);

    if (map.risks.includes("confirmed_safety_emergency")) {
      addCandidate("safety", 100, "Safety Gate confirmed emergency.");
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      addCandidate("medical_body", 98, "Safety Gate confirmed medical urgency.");
    }

    if (map.risks.includes("ambiguous_risk")) {
      addCandidate("risk_clarification", 95, "Safety Gate requested risk clarification.");
    }

    if (map.needs.includes("context_sensitive_support")) {
      addCandidate("medical_context", 82, "Medical/body context is present.");
    }

    if (map.needs.includes("decision_support")) {
      addCandidate("executive_decision", 80, "Decision support need is present.");
    }

    if (map.needs.includes("action_or_build_help")) {
      addCandidate("builder", 82, "Build/action help need is present.");
    }

    if (map.needs.includes("understanding")) {
      addCandidate("teacher", 76, "Understanding or explanation need is present.");
    }

    if (map.needs.includes("emotional_attunement")) {
      addCandidate("emotion", 70, "Emotion support need is present.");
    }

    if (map.needs.includes("relationship_awareness")) {
      addCandidate("relationship", 70, "Relationship context is present.");
    }

    if (map.needs.includes("family_awareness")) {
      addCandidate("family", 70, "Family context is present.");
    }

    if (map.needs.includes("memory_acknowledgment")) {
      addCandidate("memory", 78, "Memory/preference request is present.");
    }

    if (map.needs.includes("transparent_self_disclosure")) {
      addCandidate("ari_self", 86, "Ari self-disclosure context is present.");
    }

    if (map.needs.includes("writing_or_rewrite")) {
      addCandidate("writer", 82, "Writing/rewrite need is present.");
    }

    if (map.needs.includes("calculation")) {
      addCandidate("calculator", 82, "Calculation need is present.");
    }

    if (!map.laneEvidence.length) {
      addCandidate("general_understanding", 60, "No stronger lane evidence found.");
    }

    map.laneEvidence.sort((a, b) => b.score - a.score);
    map.triageCandidates = map.laneEvidence.slice(0, 8);
  },

  setMapSummary(map) {
    const topLane = map.laneEvidence?.[0] || null;

    map.mapSummary = {
      situationFamily: this.inferSituationFamily(map),
      primaryNeed: map.needs[0] || "general_understanding",
      strongestLaneEvidence: topLane,
      confidence: this.blendConfidence(topLane?.score || 60, map),
      reason:
        topLane?.reasons?.[0] ||
        "Situation Map gathered context but did not choose a final lane."
    };

    map.confidence = map.mapSummary.confidence;
    map.situationType = map.mapSummary.situationFamily;
    map.situationFamily = map.mapSummary.situationFamily;
    map.primaryNeed = map.mapSummary.primaryNeed;
  },

  inferSituationFamily(map) {
    if (map.risks.includes("confirmed_safety_emergency")) return "safety";
    if (map.risks.includes("confirmed_medical_urgency")) return "body";
    if (map.risks.includes("ambiguous_risk")) return "risk_clarification";
    if (map.domains.includes("medical_context_domain")) return "body";
    if (map.domains.includes("builder_domain")) return "builder";
    if (map.domains.includes("career_work_domain")) return "work";
    if (map.domains.includes("relationship_context_domain")) return "relationship";
    if (map.domains.includes("family_context_domain")) return "family";
    if (map.domains.includes("emotion_context_domain")) return "emotion";
    if (map.domains.includes("knowledge_domain")) return "knowledge";
    return "general";
  },

  applyResponseConstraints(map) {
    map.responseRequirements.forEach(req => {
      this.add(map.responseConstraints, req);
    });

    if (map.risks.includes("confirmed_safety_emergency")) {
      this.add(map.responseConstraints, "safety_first");
    }

    if (map.risks.includes("confirmed_medical_urgency")) {
      this.add(map.responseConstraints, "medical_first");
    }

    if (map.needs.includes("context_sensitive_support")) {
      this.add(map.responseConstraints, "avoid_false_reassurance");
      this.add(map.responseConstraints, "name_red_flags_if_relevant");
    }

    if (map.needs.includes("accountability_support")) {
      this.add(map.responseConstraints, "separate_person_from_system_pressure");
    }

    if (map.needs.includes("transparent_self_disclosure")) {
      this.add(map.responseConstraints, "do_not_fake_human_experience");
    }
  },

  syncLegacyCompatibility(map) {
    map.primaryLaneSuggestion = null;
    map.supportLaneSuggestions = [];
    map.deferredLaneSuggestions = [];
    map.blockedLanes = [];

    map.triageCandidates = map.laneEvidence || [];

    map.legacyCompatibility = {
      primaryLaneSuggestion: null,
      supportLaneSuggestions: [],
      blockedLanes: [],
      reason: "Situation Map no longer selects lanes. Triage owns lane choice."
    };
  },

  blendConfidence(base = 60, map = {}) {
    let score = Number(base || 60);

    const threadConfidence = map.threadUnderstandingUsed?.confidence ?? null;
    const entityConfidence =
      map.entityReferenceUsed?.confidence ??
      map.entityReferenceUsed?.resolvedReferenceConfidence ??
      null;

    if (threadConfidence) {
      score = Math.round((score * 0.65) + (threadConfidence * 0.35));
    }

    if (entityConfidence) {
      score = Math.round((score * 0.8) + (entityConfidence * 0.2));
    }

    return Math.max(40, Math.min(98, score));
  },

  hasType(observations = [], type) {
    return observations.some(o => o.type === type);
  },

  hasQuestionType(observations = [], questionType) {
    return observations.some(
      o => o.type === "question_phrase" && o.questionType === questionType
    );
  },

  add(list, item) {
    if (item && Array.isArray(list) && !list.includes(item)) {
      list.push(item);
    }
  },

  addObj(list, item) {
    if (!Array.isArray(list) || !item) return;

    const key = JSON.stringify({
      category: item.category,
      type: item.type,
      value: item.value,
      evidence: item.evidence
    });

    const exists = list.some(existing => {
      const existingKey = JSON.stringify({
        category: existing.category,
        type: existing.type,
        value: existing.value,
        evidence: existing.evidence
      });

      return existingKey === key;
    });

    if (!exists) list.push(item);
  },

runMapIntegrityCheck(map) {
  if (!map || typeof map !== "object") return map;

  const arrayFields = [
    "questions",
    "domains",
    "situations",
    "needs",
    "risks",
    "responseRequirements",
    "responseConstraints",
    "competingSituations",
    "contradictions",
    "laneEvidence",
    "triageCandidates",
    "reasons"
  ];

  arrayFields.forEach(field => {
    if (!Array.isArray(map[field])) {
      map[field] = [];
    }
  });

  if (!map.canonical) map.canonical = {};
  if (!map.evidenceModel) map.evidenceModel = {};
  if (!map.ambiguity) {
    map.ambiguity = {
      present: false,
      level: "none",
      reasons: [],
      missing: []
    };
  }

  if (!map.triageHandoff) {
    map.triageHandoff = {
      ready: false,
      evidence: [],
      recommendedPriorities: [],
      constraints: [],
      ambiguity: null,
      authority: "handoff_only"
    };
  }

  map.integrityCheckRan = true;
  return map;
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
  "ARI SITUATION MAP ENGINE LOADED:",
  window.AriSituationMapEngine?.version
);