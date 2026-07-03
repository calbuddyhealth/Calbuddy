// ari/governance/ari-situation-contract.js
// Ari Situation Contract
// Purpose: Authoritative contract governor for Ari Rebirth.
// V3.2.5 — Conversation Mode / Direct Question / Anti-Drift Upgrade

window.Ari = window.Ari || {};

window.AriSituationContract = {
  version: "3.2.5",

  create(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const safety = summary.safetyContextGate || {};
    const triage = summary.triage || summary.ariTriage || {};
    const thread = summary.threadUnderstanding || summary.threadUnderstandingState || {};
const planner =
  summary.multiLanePlan ||
  summary.responsePlan ||
  summary.multiLaneResponsePlan ||
  {};
    const contract = this.blankContract({ safety, map, triage, thread, planner });

    this.applyConversationMode(contract, map, thread, summary);
    this.applyQuestionMode(contract, map, thread, summary);

    this.applySafetyPriority(contract, safety, map, triage);
    this.applyConversationFunctionPriority(contract, map, triage, summary);
    this.applyPrimaryLane(contract, map, triage);
    this.applyLaneProfile(contract);
    this.applyTriageLanes(contract, triage, map);
   this.applySituationThesis(contract, map);
     this.applyMedicalContextProtection(contract, safety, map, triage);
    this.applyClarity(contract, safety, map);
    this.applyAuthority(contract);
    this.applyResponseShape(contract);
    this.applyExecutive(contract);
    this.buildExecutiveConclusion(contract, summary, map, triage);
    this.applyCommunicationProfile(contract);
    this.applyMouthDirective(contract);
    this.applyLegacyProtection(contract);
    this.applyAntiDrift(contract);
    this.cleanContract(contract);

    return {
      situationContract: contract,
      ...contract
    };
  },

  blankContract({ safety = {}, map = {}, triage = {}, thread = {}, planner = {} }) {
    return {
      situationContractRan: true,
      situationContractVersion: this.version,
      source: "ari-situation-contract",

      authority: "normal",

      conversationMode: {
        mode: "unknown",
        isFollowUp: false,
        isNewTopic: false,
        isCorrection: false,
        mustReusePriorContext: false,
        mayUsePriorContext: true,
        reason: null
      },

      questionMode: {
        type: "unknown",
        isDirectQuestion: false,
        isInstruction: false,
        isDecision: false,
        isDebugging: false,
        shouldAnswerImmediately: true,
        mayAskClarifyingQuestion: true,
        reason: null
      },

      primary: null,
      support: [],
      brief: [],
      context: [],
      deferred: [],
      blocked: [],

      risk: {
        level: safety.riskLevel || map.riskLevel || "none",
        type: safety.riskType || map.riskType || "none",
        override: safety.override || map.override || null
      },

      clarity: {
        needed: false,
        level: "none",
        question: null,
        placement: "none"
      },

      situationThesis: {
        available: false,
        thesis: null,
        narrative: null,
        recommendedUse: "do_not_use_as_authority",
        requiredByComposer: false
      },
      responseShape: null,
      responseRules: [],

      communicationProfile: {
        emotionalWeight: "normal",
        directness: "normal",
        humorAllowed: true,
        sarcasmAllowed: true,
        profanityAllowed: true,
        challengeAllowed: true,
        validationAllowed: true,
        validationLevel: "light",
        styleNotes: []
      },

      requiredBehaviors: [],
      forbiddenBehaviors: [],

      executive: {
        contractGoal: null,
        contractObstacle: null,
        contractNextAction: null,
        contractCompletionCriteria: null,
        executiveConclusion: null,
        legacyOverrideProtection: true,
        allowedLegacyInfluence: "support_only"
      },

      mouthDirective: {
        opening: null,
        order: [],
        avoid: [],
        required: [],
        closing: null
      },

      debug: {
        triagePrimaryLane: triage.primaryLane || null,
        triageConfidence: triage.confidence ?? null,
        triageResponseShape: triage.responseShape || null,
        triageReasons: triage.reasons || [],
        plannerPrimaryLane: planner.primaryLane || null,
plannerResponseShape: planner.responseShape || null,
plannerResponseOrder: planner.responseOrder || [],
plannerComposerDirective: planner.composerDirective || null,
        
        mapDomains: map.domains || [],
        mapSituations: map.situations || [],
        mapNeeds: map.needs || [],
        mapRisks: map.risks || [],
        threadQuestionUsed: map.threadQuestionUsed || false,
        safetyOverride: safety.override || null
      },

      reasons: []
    };
  },

  applyConversationMode(contract, map = {}, thread = {}, summary = {}) {
    const raw = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      map.rawUserText ||
      ""
    ).toLowerCase();

    const confirmedPriorContext =
  map.threadQuestionUsed === true ||
  map.canonical?.priorContextUsed === true ||
  thread.resolvedMeaning?.isContextual === true ||
  thread.shouldUseAsContext === true ||
  Object.keys(thread.workingContext || {}).length > 0;

if (confirmedPriorContext)  {
      contract.conversationMode = {
        mode: "follow_up",
        isFollowUp: true,
        isNewTopic: false,
        isCorrection: false,
        mustReusePriorContext: true,
        mayUsePriorContext: true,
        reason: "Current turn depends on prior context."
      };
      contract.responseRules.push("reuse_prior_context_without_reasking");
      contract.requiredBehaviors.push("Use prior context when answering.");
      return;
    }

    if (/\b(actually|i meant|no,|not that|correction|wrong one)\b/.test(raw)) {
      contract.conversationMode = {
        mode: "correction",
        isFollowUp: true,
        isNewTopic: false,
        isCorrection: true,
        mustReusePriorContext: true,
        mayUsePriorContext: true,
        reason: "User appears to be correcting prior interpretation."
      };
      contract.responseRules.push("treat_as_correction");
      contract.requiredBehaviors.push("Correct the prior interpretation before continuing.");
      return;
    }

    if (/\b(new topic|switch topics|different question|unrelated)\b/.test(raw)) {
      contract.conversationMode = {
        mode: "new_topic",
        isFollowUp: false,
        isNewTopic: true,
        isCorrection: false,
        mustReusePriorContext: false,
        mayUsePriorContext: false,
        reason: "User explicitly started a new topic."
      };
      contract.responseRules.push("do_not_drag_prior_context_forward");
      return;
    }

    contract.conversationMode = {
      mode: "current_turn",
      isFollowUp: false,
      isNewTopic: false,
      isCorrection: false,
      mustReusePriorContext: false,
      mayUsePriorContext: true,
      reason: "No explicit continuation or reset detected."
    };
  },

  applyQuestionMode(contract, map = {}, thread = {}, summary = {}) {
    const raw = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      map.rawUserText ||
      ""
    ).toLowerCase();

    const questions = map.questions || [];
    const situations = map.situations || [];
    const domains = map.domains || [];

    if (
      questions.includes("instruction_question") ||
      situations.includes("implementation_help_request") ||
      domains.includes("builder_domain") ||
      /\b(send it|give me the code|update it|fix this|next|done)\b/.test(raw)
    ) {
      contract.questionMode = {
        type: "instruction",
        isDirectQuestion: true,
        isInstruction: true,
        isDecision: false,
        isDebugging: domains.includes("builder_domain"),
        shouldAnswerImmediately: true,
        mayAskClarifyingQuestion: false,
        reason: "User is asking for action or implementation."
      };
      contract.responseRules.push("answer_directly_no_unneeded_clarification");
      return;
    }

    if (
      questions.includes("decision_question") ||
      situations.includes("tradeoff_or_competing_priorities")
    ) {
      contract.questionMode = {
        type: "decision",
        isDirectQuestion: true,
        isInstruction: false,
        isDecision: true,
        isDebugging: false,
        shouldAnswerImmediately: true,
        mayAskClarifyingQuestion: true,
        reason: "User is asking for judgment or prioritization."
      };
      return;
    }

    if (
      questions.includes("knowledge_question") ||
      questions.includes("explicit_question") ||
      /\?$/.test(raw)
    ) {
      contract.questionMode = {
        type: "direct_question",
        isDirectQuestion: true,
        isInstruction: false,
        isDecision: false,
        isDebugging: false,
        shouldAnswerImmediately: true,
        mayAskClarifyingQuestion: true,
        reason: "User asked a direct question."
      };
      return;
    }

    contract.questionMode = {
      type: "statement_or_context",
      isDirectQuestion: false,
      isInstruction: false,
      isDecision: false,
      isDebugging: false,
      shouldAnswerImmediately: true,
      mayAskClarifyingQuestion: true,
      reason: "No strong question type detected."
    };
  },

  applySafetyPriority(contract, safety = {}, map = {}, triage = {}) {
  const primaryRisk = safety.primaryRisk || map.primaryRisk || null;

  const isMedicalRisk =
    primaryRisk?.type === "medical" ||
    primaryRisk?.type === "poisoning_overdose";

  if (safety.override === "emergency") {
    contract.primary = isMedicalRisk ? "medical_body" : "safety";
    contract.authority = "absolute";
    contract.reasons.push(
      isMedicalRisk
        ? "Safety Gate confirmed emergency medical/body risk."
        : "Safety Gate confirmed emergency safety risk."
    );
    return;
  }

  if (safety.override === "urgent") {
    contract.primary = isMedicalRisk ? "medical_body" : "safety";
    contract.authority = "absolute";
    contract.reasons.push(
      isMedicalRisk
        ? "Safety Gate confirmed urgent medical/body risk."
        : "Safety Gate confirmed urgent safety risk."
    );
    return;
  }

  if (safety.override === "clarify_risk") {
    contract.primary = "risk_clarification";
    contract.authority = "absolute";
    contract.clarity = {
      needed: true,
      level: "high",
      question:
        safety.followUpQuestion ||
        map.recommendedQuestion ||
        "Is anyone in immediate danger right now?",
      placement: "only"
    };
    contract.reasons.push("Safety Gate requested risk clarification.");
  }
},

applyConversationFunctionPriority(contract, map = {}, triage = {}, summary = {}) {
  if (contract.primary) return;

  const cf = summary.conversationFunction || {};
  const primaryFunction = cf.primaryFunction || summary.primaryFunction || null;

  const triagePrimary =
    triage.primaryLane ||
    summary.triagePrimaryLane ||
    summary.ariTriage?.primaryLane ||
    null;

  if (triagePrimary === "executive_decision") {
    contract.primary = "executive_decision";
    contract.authority = "strong";
    contract.responseShape = "prioritize_then_plan";

    this.add(contract.brief, "emotion");
    this.add(contract.responseRules, "decision_framework");
    this.add(contract.responseRules, "do_not_let_emotion_override_direct_decision_request");
    this.add(contract.requiredBehaviors, "Name the priority.");
    this.add(contract.requiredBehaviors, "Give the next step.");
    this.add(contract.requiredBehaviors, "Separate primary from secondary concerns.");

    contract.reasons.push(
      "Triage selected executive_decision; emotional disclosure is support, not primary."
    );
    return;
  }

  if (primaryFunction === "emotional_disclosure") {
    contract.primary = "emotion";
    contract.authority = "strong";
    contract.responseShape = "presence_then_grounding";

    this.add(contract.responseRules, "emotional_presence_first");
    this.add(contract.requiredBehaviors, "Acknowledge the emotional disclosure before explaining.");
    this.add(contract.forbiddenBehaviors, "Do not jump straight into builder/teacher mode.");

    contract.reasons.push(
      "Conversation Function Engine detected emotional disclosure."
    );
  }
},

  applyPrimaryLane(contract, map = {}, triage = {}) {
    if (contract.primary) return;

    if (triage.primaryLane) {
      contract.primary = triage.primaryLane;
      contract.reasons.push(`Primary came from Triage Engine: ${contract.primary}.`);
      return;
    }

    contract.primary = "general_understanding";
    contract.reasons.push("No stronger lane was detected.");
  },

  applyLaneProfile(contract) {
    const profile = this.getLaneProfile(contract.primary);

    contract.authority = profile.authority;
    contract.responseShape = profile.responseShape;

    this.addMany(contract.support, profile.support || []);
    this.addMany(contract.brief, profile.brief || []);
    this.addMany(contract.context, profile.context || []);
    this.addMany(contract.deferred, profile.deferred || []);
    this.addMany(contract.blocked, profile.blocked || []);
    this.addMany(contract.responseRules, profile.responseRules || []);
    this.addMany(contract.requiredBehaviors, profile.requiredBehaviors || []);
    this.addMany(contract.forbiddenBehaviors, profile.forbiddenBehaviors || []);

    contract.executive = {
      ...contract.executive,
      ...(profile.executive || {})
    };

    contract.mouthDirective = {
      ...contract.mouthDirective,
      ...(profile.mouthDirective || {})
    };
  },

  applyTriageLanes(contract, triage = {}, map = {}) {
    this.addMany(contract.support, triage.supportLanes || []);
    this.addMany(contract.brief, triage.briefLanes || []);
    this.addMany(contract.context, triage.contextLanes || []);
    this.addMany(contract.deferred, triage.deferredLanes || []);
    this.addMany(contract.blocked, triage.blockedLanes || []);
    this.addMany(contract.responseRules, triage.responseConstraints || map.responseConstraints || []);
  },

applyPlannerHandoff(contract, planner = {}) {
  if (!planner.multiLanePlannerRan) return;

  if (planner.responseShape) {
    contract.responseShape = planner.responseShape;
  }

  this.addMany(contract.support, planner.supportLanes || []);
  this.addMany(contract.brief, planner.briefLanes || []);
  this.addMany(contract.deferred, planner.deferredLanes || []);
  this.addMany(contract.blocked, planner.blockedLanes || []);

  if (planner.responseOrder?.length) {
    contract.mouthDirective.order = planner.responseOrder;
  }

  const directive = planner.composerDirective || {};

  if (directive.opening) {
    contract.mouthDirective.opening = directive.opening;
  }

  if (directive.closing) {
    contract.mouthDirective.closing = directive.closing;
  }

  this.addMany(contract.mouthDirective.required, directive.required || []);
  this.addMany(contract.mouthDirective.avoid, directive.avoid || []);

  (directive.sequence || []).forEach(step => {
    this.add(contract.requiredBehaviors, step);
  });

  this.add(contract.responseRules, "use_multi_lane_planner_handoff");
  this.add(contract.responseRules, "contract_may_override_planner_only_for_safety_or_authority");

  contract.debug = {
    ...(contract.debug || {}),
    plannerUsed: true,
    plannerPrimaryLane: planner.primaryLane || null,
    plannerResponseShape: planner.responseShape || null,
    plannerResponseOrder: planner.responseOrder || [],
    plannerConfidence: planner.confidence ?? null
  };

  contract.reasons.push("Multi-lane planner handoff applied after triage.");
},

  applySituationThesis(contract, map = {}) {
    const thesis = map.primarySituationThesis || null;
    const narrative = map.situationNarrative || thesis?.oneLine || null;
    const recommendedUse =
      map.thesisRecommendedUse || "do_not_use_as_authority";

    contract.situationThesis = {
      available: Boolean(thesis),
      thesis,
      narrative,
      recommendedUse,
      requiredByComposer: recommendedUse === "use_as_situation_blueprint"
    };

    contract.debug = {
      ...(contract.debug || {}),
      situationNarrative: narrative,
      primarySituationThesisType: thesis?.thesisType || null,
      thesisRecommendedUse: recommendedUse,
      thesisEvidenceCount: thesis?.evidenceCount || 0
    };

    if (recommendedUse !== "use_as_situation_blueprint") return;

    this.add(contract.responseRules, "composer_must_use_situation_thesis");
    this.add(contract.responseRules, "name_core_conflict_before_recommending");
    this.add(contract.requiredBehaviors, "Use the situation thesis as the response blueprint.");
    this.add(contract.requiredBehaviors, "Name the core conflict before giving advice when relevant.");

    if (thesis?.bestResponse) {
      this.add(contract.requiredBehaviors, thesis.bestResponse);
    }

    contract.mouthDirective.required = [
      ...(contract.mouthDirective.required || []),
      "Use the situation thesis as the response blueprint.",
      "Do not answer from domain labels alone."
    ];

    contract.reasons.push(
      `Situation thesis promoted: ${thesis?.thesisType || "unknown"}.`
    );
  },

  applyMedicalContextProtection(contract, safety = {}, map = {}) {
    const medicalContextExists =
      safety.riskType === "medical" ||
      map.riskType === "medical" ||
      (map.domains || []).includes("medical_context_domain") ||
      contract.primary === "medical_context";

    if (!medicalContextExists) return;
    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) return;

    if (contract.primary !== "medical_context") this.add(contract.context, "medical_context");

    this.add(contract.responseRules, "medical_context_without_escalation");
    this.add(contract.requiredBehaviors, "Address medical/body context with practical next step.");
    this.add(contract.forbiddenBehaviors, "Do not frame medical context as a life chapter.");
    this.add(contract.blocked, "life_chapter");
    this.add(contract.blocked, "deep_emotion");
  },

  applyClarity(contract, safety = {}, map = {}) {
  if (contract.clarity.needed) return;

  const directAnswerRequest =
    contract.questionMode?.isDirectQuestion === true &&
    contract.questionMode?.shouldAnswerImmediately === true;

  if (directAnswerRequest) {
    contract.clarity = {
      needed: false,
      level: "none",
      question: null,
      placement: "none"
    };

    this.add(contract.responseRules, "answer_direct_question_without_clarification");
    this.add(contract.forbiddenBehaviors, "Do not add a generic clarification question after answering.");
    return;
  }

  if (
    map.shouldAskClarifyingQuestion === true &&
    contract.questionMode.mayAskClarifyingQuestion !== false
  ) {
    contract.clarity = {
      needed: true,
      level: map.complexity === "multi_domain" ? "medium" : "low",
      question: map.recommendedQuestion || "Which part do you want to handle first?",
      placement: "end"
    };
    contract.reasons.push("Situation Map requested clarification.");
  }
},

  applyAuthority(contract) {
    if (["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
      contract.authority = "absolute";
      return;
    }

    if (["medical_context", "developer_artifact", "builder", "teacher", "executive_decision", "memory", "emotion"].includes(contract.primary)) {
      contract.authority = "strong";
      return;
    }

    contract.authority = contract.authority || "normal";
  },

  applyResponseShape(contract) {
    if (!contract.responseShape) {
      contract.responseShape = this.getLaneProfile(contract.primary).responseShape || "standard";
    }
  },

  applyExecutive(contract) {
    const profile = this.getLaneProfile(contract.primary);
    contract.executive = {
      ...contract.executive,
      ...(profile.executive || {})
    };
  },

buildExecutiveConclusion(
  contract,
  summary = {},
  map = {},
  triage = {}
) {
  if (contract.primary !== "executive_decision") return;

  const thesis = contract.situationThesis?.thesis || {};
  const preferred =
  summary.preferredTerms ||
  summary.lexicalGrounding?.preferredTerms ||
  summary.lexicalGroundingOutput?.preferredTerms ||
  map.preferredTerms ||
  {};

  contract.executive.executiveConclusion = {
    recommendation: null,
    keyReason:
      thesis.coreConflict ||
      preferred.centralTradeoff?.short ||
      preferred.centralTradeoff?.phrase ||
      "choice vs consequence",
    nextStep:
      thesis.bestResponse ||
      "Answer directly, name the tradeoff, and recommend the next step.",
    decisionOption:
      preferred.decisionOption?.short ||
      preferred.decisionOption?.phrase ||
      null,
    tradeoff:
      preferred.centralTradeoff?.short ||
      preferred.centralTradeoff?.phrase ||
      null,
    authority: "contract_handoff_only"
  };

  this.add(contract.responseRules, "composer_should_use_executive_conclusion");
},

  applyCommunicationProfile(contract) {
    const profile = contract.communicationProfile;

    if (["safety", "medical_body", "medical_context", "risk_clarification"].includes(contract.primary)) {
      profile.emotionalWeight = "low";
      profile.directness = "high";
      profile.humorAllowed = false;
      profile.sarcasmAllowed = false;
      profile.profanityAllowed = false;
      profile.challengeAllowed = false;
      profile.validationLevel = contract.primary === "medical_context" ? "light" : "none";
      profile.styleNotes.push("Sensitive safety/medical context requires calm, direct language.");
    }

    if (contract.primary === "builder") {
      profile.emotionalWeight = "low";
      profile.directness = "high";
      profile.validationLevel = "none";
      profile.styleNotes.push("Builder requests prioritize steps/code over emotional reflection.");
    }

    if (contract.primary === "teacher") {
      profile.emotionalWeight = "low";
      profile.directness = "medium";
      profile.validationLevel = "none";
      profile.styleNotes.push("Teaching requests should explain before validating.");
    }

    if (contract.primary === "executive_decision") {
      profile.emotionalWeight = "low";
      profile.directness = "high";
      profile.validationLevel = "none";
      profile.challengeAllowed = true;
      profile.styleNotes.push("Decision support should organize and recommend.");
    }

    if (contract.primary === "emotion") {
      profile.emotionalWeight = "high";
      profile.directness = "medium";
      profile.validationLevel = "moderate";
      profile.humorAllowed = false;
      profile.sarcasmAllowed = false;
    }

    this.add(contract.responseRules, `communication_${profile.directness}_directness`);
    this.add(contract.responseRules, `validation_${profile.validationLevel}`);
  },

  applyMouthDirective(contract) {
    contract.mouthDirective.order = [
      contract.primary,
      ...contract.support,
      ...contract.brief.map(lane => `brief_${lane}`),
      ...contract.context.map(lane => `context_${lane}`),
      ...contract.deferred.map(lane => `defer_${lane}`)
    ];

    contract.mouthDirective.required = [
      ...(contract.mouthDirective.required || []),
      ...contract.requiredBehaviors
    ];

    contract.mouthDirective.avoid = [
      ...(contract.mouthDirective.avoid || []),
      ...contract.forbiddenBehaviors
    ];

    if (contract.clarity.needed) {
      contract.mouthDirective.closing = contract.clarity.question;
    }
  },

  applyLegacyProtection(contract) {
    if (contract.authority === "absolute") {
      this.add(contract.responseRules, "legacy_systems_must_not_override");
      contract.executive.allowedLegacyInfluence = "none";
      return;
    }

    if (contract.authority === "strong") {
      this.add(contract.responseRules, "legacy_systems_support_only");
      contract.executive.allowedLegacyInfluence = "support_only";
      return;
    }

    contract.executive.allowedLegacyInfluence = "normal";
  },

  applyAntiDrift(contract) {
    this.add(contract.responseRules, "contract_primary_must_lead_response");
    this.add(contract.responseRules, "do_not_switch_lanes_without_new_evidence");

    if (contract.questionMode.shouldAnswerImmediately) {
      this.add(contract.requiredBehaviors, "Answer the user's current request directly.");
      this.add(contract.forbiddenBehaviors, "Do not replace the answer with a vague reflective question.");
    }

    if (contract.conversationMode.mustReusePriorContext) {
      this.add(contract.requiredBehaviors, "Reuse the active thread context.");
      this.add(contract.forbiddenBehaviors, "Do not ask the user to repeat context already available.");
    }

    if (contract.conversationMode.mayUsePriorContext === false) {
      this.add(contract.forbiddenBehaviors, "Do not import prior topic context into this new topic.");
    }
  },

  getLaneProfile(lane = "general_understanding") {
    const profiles = {
      safety: {
        authority: "absolute",
        responseShape: "urgent_safety",
        blocked: ["builder", "teacher", "wisdom", "emotion", "deep_emotion", "life_chapter", "identity"],
        responseRules: ["safety_first"],
        requiredBehaviors: ["Lead with immediate safety.", "Give direct emergency/safety next step."],
        forbiddenBehaviors: ["Do not philosophize.", "Do not answer lower-priority topics first."],
        executive: {
          contractGoal: "Protect immediate safety.",
          contractNextAction: "Give immediate safety guidance.",
          contractCompletionCriteria: "User receives clear safety next step."
        }
      },

      medical_body: {
        authority: "absolute",
        responseShape: "body_truth_then_action",
        deferred: ["builder", "teacher", "wisdom", "career", "financial", "life_chapter"],
        blocked: ["life_chapter", "deep_emotion", "wisdom"],
        responseRules: ["medical_first"],
        requiredBehaviors: ["Lead with medical/body boundary.", "State urgent thresholds.", "Use calm direct language."],
        forbiddenBehaviors: ["Do not interpret emotionally before medical safety.", "Do not over-reflect."],
        executive: {
          contractGoal: "Stabilize body or medical risk before interpretation.",
          contractNextAction: "Give calm medical boundary and next step.",
          contractCompletionCriteria: "User knows whether urgent care/medical contact is needed."
        }
      },

      medical_context: {
        authority: "strong",
        responseShape: "medical_context_then_next_step",
        brief: ["emotion"],
        blocked: ["life_chapter", "deep_emotion"],
        responseRules: ["medical_context_without_escalation"],
        requiredBehaviors: ["Treat medical context as important but not automatically urgent.", "Give practical next step."],
        forbiddenBehaviors: ["Do not escalate without red flags.", "Do not frame medical context as a life chapter."],
        executive: {
          contractGoal: "Help user make a safe practical decision around non-urgent medical context.",
          contractNextAction: "Give calm practical guidance and clear thresholds.",
          contractCompletionCriteria: "User knows what to do next and what would make it urgent."
        }
      },

      risk_clarification: {
        authority: "absolute",
        responseShape: "risk_clarification_question",
        blocked: ["builder", "teacher", "wisdom", "emotion", "deep_emotion", "life_chapter"],
        responseRules: ["ask_risk_clarification_first"],
        requiredBehaviors: ["Ask one direct risk clarification question."],
        forbiddenBehaviors: ["Do not assume emergency.", "Do not answer unrelated lanes yet."],
        executive: {
          contractGoal: "Clarify ambiguous risk before normal response.",
          contractNextAction: "Ask one direct safety clarification question.",
          contractCompletionCriteria: "Risk ambiguity is reduced."
        }
      },

developer_artifact: {
  authority: "strong",
  responseShape: "developer_artifact_operation",
  deferred: ["emotion", "wisdom", "life_chapter", "deep_emotion"],
  blocked: ["life_chapter", "deep_emotion"],
  responseRules: [
    "use_artifact_context",
    "produce_code_or_patch",
    "preserve_unrelated_code",
    "avoid_generic_platform_advice",
    "legacy_systems_support_only"
  ],
  requiredBehaviors: [
    "Use the provided file or artifact context.",
    "Give exact code, patch, or placement instructions.",
    "Preserve unrelated code."
  ],
  forbiddenBehaviors: [
    "Do not give generic platform advice.",
    "Do not ask unnecessary clarification.",
    "Do not switch into emotional reflection before code/action."
  ],
  executive: {
    contractGoal: "Perform the requested artifact/code operation.",
    contractNextAction: "Provide the exact patch, replacement block, or placement instruction.",
    contractCompletionCriteria: "User has actionable code or file instructions."
  }
},

      builder: {
        authority: "strong",
        responseShape: "build_steps",
        brief: ["emotion"],
        deferred: ["wisdom", "life_chapter", "deep_emotion"],
        blocked: ["life_chapter", "deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: ["Give concrete technical next steps.", "Ask for code/error only if exact fix requires it."],
        forbiddenBehaviors: ["Do not use generic emotional recovery questions.", "Do not ask wisdom questions before helping build."],
        executive: {
          contractGoal: "Help the user build, debug, or implement.",
          contractNextAction: "Give concrete steps, code guidance, or request exact missing code/error.",
          contractCompletionCriteria: "User has a next technical action."
        }
      },

      teacher: {
        authority: "strong",
        responseShape: "clear_explanation",
        brief: ["emotion"],
        deferred: ["wisdom", "life_chapter", "deep_emotion"],
        blocked: ["deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: ["Teach directly first.", "Explain clearly with simple structure."],
        forbiddenBehaviors: ["Do not ask vague uncertainty questions before teaching.", "Do not over-reflect."],
        executive: {
          contractGoal: "Explain the topic clearly.",
          contractNextAction: "Give a direct explanation with simple structure.",
          contractCompletionCriteria: "User understands the topic better."
        }
      },

      executive_decision: {
        authority: "strong",
        responseShape: "prioritize_then_plan",
        brief: ["emotion"],
        deferred: ["life_chapter", "deep_emotion"],
        blocked: ["deep_emotion"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: ["Name the priority.", "Give the next step.", "Separate primary from secondary concerns."],
        forbiddenBehaviors: ["Do not treat all concerns as equal.", "Do not ask generic recovery questions."],
        executive: {
          contractGoal: "Create priority and decision structure.",
          contractNextAction: "Organize options and name the next step.",
          contractCompletionCriteria: "User knows what to do first."
        }
      },

      memory: {
        authority: "strong",
        responseShape: "acknowledge_memory_request",
        blocked: ["deep_emotion", "life_chapter"],
        responseRules: ["legacy_systems_support_only"],
        requiredBehaviors: ["Acknowledge the memory or preference request directly."],
        forbiddenBehaviors: ["Do not answer around the memory request."],
        executive: {
          contractGoal: "Acknowledge or apply memory preference.",
          contractNextAction: "Acknowledge the memory/update request.",
          contractCompletionCriteria: "Preference is handled clearly."
        }
      },

      emotion: {
  authority: "strong",
  responseShape: "presence_then_grounding",
  support: ["truth"],
  requiredBehaviors: [
    "Acknowledge the emotional signal.",
    "Validate briefly.",
    "Ground before teaching."
  ],
  forbiddenBehaviors: [
    "Do not immediately switch into builder mode.",
    "Do not replace presence with a lecture."
  ]
},

      wisdom: {
        authority: "normal",
        responseShape: "principle_then_choice",
        brief: ["emotion"],
        requiredBehaviors: ["Name the tension.", "Name the principle that should lead.", "Give a grounded choice."],
        forbiddenBehaviors: ["Do not become vague or mystical.", "Do not ignore practical consequences."]
      },

      general_understanding: {
        authority: "normal",
        responseShape: "standard",
        requiredBehaviors: ["Answer directly or ask one useful clarifying question."],
        forbiddenBehaviors: ["Do not over-interpret weak signals."]
      }
    };

    return profiles[lane] || profiles.general_understanding;
  },

  cleanContract(contract) {
    contract.primary = contract.primary || "general_understanding";

    contract.support = this.cleanLaneList(contract.support, contract.primary);
    contract.brief = this.cleanLaneList(contract.brief, contract.primary);
    contract.context = this.cleanLaneList(contract.context, contract.primary);
    contract.deferred = this.cleanLaneList(contract.deferred, contract.primary);
    contract.blocked = this.cleanLaneList(contract.blocked, contract.primary);

    contract.responseRules = this.cleanList(contract.responseRules);
    contract.requiredBehaviors = this.cleanList(contract.requiredBehaviors);
    contract.forbiddenBehaviors = this.cleanList(contract.forbiddenBehaviors);
    contract.reasons = this.cleanList(contract.reasons);

    contract.mouthDirective.required = this.cleanList(contract.mouthDirective.required);
    contract.mouthDirective.avoid = this.cleanList(contract.mouthDirective.avoid);
    contract.mouthDirective.order = this.cleanList(contract.mouthDirective.order);

    if (!contract.responseShape) contract.responseShape = "standard";
  },

  add(list, item) {
    if (Array.isArray(list) && item && !list.includes(item)) list.push(item);
  },

  addMany(list, items = []) {
    if (!Array.isArray(items)) return;
    items.forEach(item => this.add(list, item));
  },

  cleanList(list = []) {
    return [...new Set((list || []).filter(Boolean))];
  },

  cleanLaneList(list = [], primary = null) {
    return this.cleanList(list).filter(lane => lane && lane !== primary);
  }
};

console.log(
  "ARI SITUATION CONTRACT LOADED:",
  window.AriSituationContract?.version
);