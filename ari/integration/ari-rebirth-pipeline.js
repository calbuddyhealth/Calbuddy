// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V3.3.0 — Clean functional pipeline

window.AriRebirthPipeline = {
  version: "3.3.0",

  async run(systemSummary = {}) {
    let summary = this.normalizeInput(systemSummary);
    let reasoningResult = {};

    const runEngine = async (engine, methods = [], fallback = {}) => {
      if (!engine) return fallback;

      for (const method of methods) {
        if (typeof engine[method] === "function") {
          const result = await engine[method](summary);
          return result || fallback;
        }
      }

      return fallback;
    };

    const merge = (result = {}) => {
      summary = { ...summary, ...(result || {}) };
    };

    // 0.10 Safety Context Gate
    const safetyContextGate = await runEngine(
      window.AriSafetyContextGate,
      ["evaluate"],
      {
        safetyContextGateRan: false,
        source: "not-loaded",
        override: null,
        riskLevel: "none",
        riskType: "none",
        followUpNeeded: false,
        followUpQuestion: null
      }
    );

    summary = {
      ...summary,
      safetyContextGate,
      ...safetyContextGate
    };

    // 0.20 Observer Evidence
    const observerResult = await runEngine(
      window.Ari?.observerNetwork,
      ["observe"],
      {
        observerEvidenceRan: false,
        observerEvidenceSource: "not-loaded",
        observations: [],
        observationLedger: [],
        observedTypes: [],
        observedValues: [],
        observationCount: 0
      }
    );

    summary = {
      ...summary,
      observerEvidence: observerResult,
      ...observerResult,
      observations: observerResult.observations || [],
      observationLedger:
        observerResult.observationLedger ||
        observerResult.observations ||
        [],
      observedTypes: observerResult.observedTypes || [],
      observedValues: observerResult.observedValues || [],
      observationCount: observerResult.observationCount || 0
    };

    // 0.25 Universal Conversation Classifier
    const conversationResult = await runEngine(
      window.AriUniversalConversationClassifier,
      ["classify"],
      {
        universalConversationClassifierRan: false,
        universalConversationClassifierSource: "not-loaded",
        conversationType: "unknown",
        conversationIntent: "unknown",
        conversationResponseHint: null,
        conversationCandidates: []
      }
    );

    summary = {
      ...summary,
      ...conversationResult,
      universalConversationClassification: conversationResult
    };

    // 0.27 Continuity / Memory / Relationship / Context
    merge(await runEngine(window.AriConversationContinuityEngine, ["analyze", "evaluate", "create"]));
    merge(await runEngine(window.AriMemoryRetrievalEngine, ["retrieve", "search", "create"]));
    merge(await runEngine(window.AriRelationshipEngine, ["analyze", "evaluate", "create"]));
    merge(await runEngine(window.AriContextAssembler, ["assemble", "create"]));

    // 0.28 Thread Understanding
    merge(await runEngine(window.AriThreadUnderstandingEngine, ["understand", "analyze", "create"]));

    // 0.29 Subject Graph / Entity Reference Resolver
    merge(await runEngine(window.AriEntityReferenceResolver, ["resolve"]));

    // 0.30 Situation Map
    const situationMap = await runEngine(
      window.AriSituationMapEngine,
      ["build", "create"],
      {
        situationMapRan: false,
        source: "not-loaded",
        situations: [],
        domains: [],
        needs: [],
        risks: [],
        questions: [],
        primaryLaneSuggestion: null,
        supportLaneSuggestions: [],
        briefLaneSuggestions: [],
        contextLaneSuggestions: [],
        deferredLaneSuggestions: []
      }
    );

    summary = {
      ...summary,
      situationMap,
      ...situationMap
    };

    // 0.35 Triage Engine
    const triageOutput = await runEngine(
      window.AriTriageEngine,
      ["run", "triage"],
      {}
    );

    const triageResult =
      triageOutput.ariTriage || {
        triageEngineRan: false,
        triageEngineSource: "not-loaded",
        primaryLane: summary.primaryLaneSuggestion || null,
        supportLanes: summary.supportLaneSuggestions || [],
        deferredLanes: summary.deferredLaneSuggestions || [],
        blockedLanes: summary.blockedLanes || [],
        responseConstraints: summary.responseConstraints || [],
        confidence: summary.confidence || null,
        reason: "Triage engine not loaded. Falling back to Situation Map."
      };

    summary = {
      ...summary,
      ...triageOutput,
      triage: triageResult,
      ...triageResult,

      primaryLaneSuggestion:
        triageResult.primaryLane ||
        summary.primaryLaneSuggestion,

      supportLaneSuggestions:
        triageResult.supportLanes ||
        summary.supportLaneSuggestions ||
        [],

      deferredLaneSuggestions:
        triageResult.deferredLanes ||
        summary.deferredLaneSuggestions ||
        [],

      blockedLanes:
        triageResult.blockedLanes ||
        summary.blockedLanes ||
        [],

      responseConstraints:
        triageResult.responseConstraints ||
        summary.responseConstraints ||
        []
    };

    // 0.40 Situation Contract
    merge(await runEngine(
      window.AriSituationContract,
      ["create", "build"],
      {
        situationContractRan: false,
        source: "not-loaded",
        situationContract: null
      }
    ));

    // 0.45 Bridge Contract
    summary = this.applyContractBridge(summary);

    // 1.00 Human Needs
    merge(await runEngine(
      window.Ari?.needEngine,
      ["evaluate"],
      {
        needEngineRan: false,
        primaryHumanNeed: summary.primaryHumanNeed || "understanding",
        primaryHumanNeedScore: summary.primaryHumanNeedScore || 55,
        primaryHumanNeedReason:
          "Need engine unavailable. Defaulting to understanding.",
        needRecommendedLeadOrgan: "observer",
        needResponseMode: "continue_observing",
        rankedHumanNeeds: []
      }
    ));

    // Legacy support organs
    merge(await runEngine(window.AriIdentityPriorityEngine, ["evaluate"]));
    merge(await runEngine(window.AriStewardshipFearDifferentiator, ["evaluate"]));
    merge(await runEngine(window.AriLifeChapterEngine, ["detect"]));
    merge(await runEngine(window.AriUncertaintyClassificationEngine, ["classify"]));
    merge(await runEngine(window.AriIdentityConflictResolver, ["resolve"]));
    merge(await runEngine(window.AriValueIntegrationEngine, ["integrate"]));
    merge(await runEngine(window.Ari?.emotionIntegrator, ["integrate"]));

    // Legacy decision support
    merge(await runEngine(window.AriSalienceGovernor, ["govern"]));
    merge(await runEngine(window.AriSynthesisEngine, ["synthesize"]));

    summary = this.reassertContractAuthority(summary);

    // Observer Hierarchy Diagnostic
    merge(await this.runObserverHierarchy(summary));

    summary = this.reassertContractAuthority(summary);

    // Response Intent
    merge(await runEngine(
      window.AriResponseIntentEngine,
      ["decide"],
      { responseIntentSource: "not-loaded" }
    ));

    summary = this.reassertContractAuthority(summary);

    // Executive Function
    merge(await runEngine(
      window.Ari?.executiveFunction,
      ["evaluate"],
      {
        executiveFunctionRan: false,
        executiveFunctionSource: "not-loaded"
      }
    ));

    summary = this.reassertContractAuthority(summary);

    // Reasoning Engine
    reasoningResult = await runEngine(
      window.AriReasoningEngine,
      ["create", "reason"],
      {
        reasoningEngineRan: false,
        reasoningSource: "not-loaded",
        reasoning: {},
        reasoningAnswer: null
      }
    );

    summary = {
      ...summary,
      ...reasoningResult,
      reasoning: reasoningResult.reasoning || summary.reasoning || {},
      reasoningAnswer:
        reasoningResult.reasoningAnswer ||
        summary.reasoningAnswer ||
        null
    };

    summary = this.reassertContractAuthority(summary);

    // Character Context
    const characterContextResult = await runEngine(
      window.AriCharacterContextEngine,
      ["create"],
      {
        characterContextEngineRan: false,
        characterContextEngineSource: "not-loaded",
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: "silent",
        characterReason: "Character context engine not loaded.",
        characterHints: {}
      }
    );

    summary = {
      ...summary,
      ...characterContextResult,
      characterContext: characterContextResult
    };

    summary = this.reassertContractAuthority(summary);

    // Teaching Answer Engine
    merge(await runEngine(window.AriTeachingAnswerEngine, ["teach"]));

    // Human Language Engine
    const humanLanguageResult = await runEngine(
      window.AriHumanLanguageEngine,
      ["create"],
      {
        humanLanguageEngineRan: false,
        humanLanguageSource: "not-loaded",
        humanLanguageProfile: {}
      }
    );

    summary = {
      ...summary,
      ...humanLanguageResult,
      humanLanguage: humanLanguageResult,
      humanLanguageProfile:
        humanLanguageResult.humanLanguageProfile ||
        summary.humanLanguageProfile ||
        {}
    };

    summary = this.reassertContractAuthority(summary);

    // Communication Planner
    merge(await runEngine(
      window.AriCommunicationPlanner,
      ["plan"],
      {
        communicationPlannerRan: false,
        communicationPlannerSource: "not-loaded",
        communicationPlan: null
      }
    ));

    summary = this.reassertContractAuthority(summary);

    // Lexical Grounding
    merge(await runEngine(
      window.AriLexicalGroundingEngine,
      ["ground"],
      {
        lexicalGroundingRan: false,
        lexicalGroundingSource: "not-loaded",
        lexicalGrounding: null,
        preferredTerms: {},
        conceptMap: {}
      }
    ));

    summary = this.reassertContractAuthority(summary);

    // Mouth Director
    const mouthDirector = await runEngine(
      window.AriMouthDirector,
      ["direct"],
      {}
    );

    summary = {
      ...summary,
      mouthDirector,
      mouthDirectorRan: Boolean(window.AriMouthDirector),
      mouthDirectorSource: window.AriMouthDirector
        ? "ari-mouth-director"
        : "not-loaded",

      mouthExplanationLevel: mouthDirector.explanationLevel || null,
      mouthResponsePattern:
        summary.responseShape ||
        mouthDirector.responsePattern ||
        null,

      mouthMaxBodySections: mouthDirector.maxBodySections ?? null,
      mouthAskBeforeTeaching:
        mouthDirector.askBeforeTeaching ?? null,

      mouthAllows: {
        meaning: mouthDirector.allowMeaning ?? null,
        emotion: mouthDirector.allowEmotion ?? null,
        truth: mouthDirector.allowTruth ?? null,
        wisdom: mouthDirector.allowWisdom ?? null,
        action: mouthDirector.allowAction ?? null
      }
    };

    summary = this.reassertContractAuthority(summary);

    // Composer
    merge(await runEngine(window.AriLanguageComposer, ["compose"]));

    // Response Compressor
    const compressionResult = await runEngine(
      window.AriResponseCompressor,
      ["compress"],
      {}
    );

    summary = {
      ...summary,
      ...compressionResult,
      finalResponse:
        compressionResult.finalResponse ||
        compressionResult.compressedResponse ||
        summary.finalResponse
    };

    // Memory Candidate Detection
    merge(await runEngine(
      window.AriMemoryCandidateEngine,
      ["detect", "create", "evaluate"]
    ));

    // Memory Save
    if (
      Array.isArray(summary.memoryCandidates) &&
      summary.memoryCandidates.length &&
      window.AriMemoryStore?.saveCandidates
    ) {
      const memorySaveResult =
        await window.AriMemoryStore.saveCandidates(summary.memoryCandidates);

      summary = {
        ...summary,
        memorySaveRan: true,
        memorySaveResult
      };
    } else {
      summary = {
        ...summary,
        memorySaveRan: false
      };
    }

    // Final Thread Save
    await this.saveFinalThreadState(summary);

    // Situation Review Console
    const situationReview = await runEngine(
      window.AriSituationReviewConsole,
      ["review"],
      {
        situationReviewConsoleRan: false,
        source: "not-loaded"
      }
    );

    summary = {
      ...summary,
      situationReview,
      situationReviewConsoleRan:
        situationReview.situationReviewConsoleRan || Boolean(window.AriSituationReviewConsole),
      situationReviewConsoleVersion:
        situationReview.situationReviewConsoleVersion || null
    };

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";
    summary.rebirthPipelineVersion = this.version;

    this.debugLog(summary, reasoningResult);

    return summary;
  },

  normalizeInput(systemSummary = {}) {
    const userMessage =
      systemSummary.userMessage ||
      systemSummary.message ||
      systemSummary.normalizedMessage ||
      systemSummary.input ||
      "";

    return {
      ...systemSummary,
      userMessage,
      message: userMessage,
      input: userMessage,
      normalizedMessage: String(userMessage || "").toLowerCase().trim()
    };
  },

  async runObserverHierarchy(summary = {}) {
    if (
      !window.Ari?.observerHierarchyEngine ||
      typeof window.Ari.observerHierarchyEngine.analyze !== "function"
    ) {
      return {};
    }

    const lateHierarchy =
      window.Ari.observerHierarchyEngine.analyze({
        ...(summary.observation || {}),
        ...summary,
        summary
      }) || {};

    return {
      observerHierarchy: lateHierarchy,
      hierarchy: lateHierarchy,

      observerHierarchySource:
        lateHierarchy.system || "ari-observer-hierarchy-engine",

      observerHierarchyPrimaryObservation:
        lateHierarchy.primaryObservation || null,
      observerHierarchyPrimaryCategory:
        lateHierarchy.primaryCategory || null,
      observerHierarchyPrimaryReason:
        lateHierarchy.primaryReason || null,
      observerHierarchyPrimaryConfidence:
        lateHierarchy.primaryConfidence ?? null,

      observerHierarchySupportingObservations:
        lateHierarchy.supportingObservations || [],

      observerHierarchyDominantTension:
        lateHierarchy.dominantTension || null,
      observerHierarchyLifeChapter:
        lateHierarchy.lifeChapter || null,

      observerHierarchyObjectiveLead:
        lateHierarchy.objectiveLead || null,
      observerHierarchySubjectiveLead:
        lateHierarchy.subjectiveLead || null,
      observerHierarchyDualSalienceMode:
        lateHierarchy.dualSalienceMode || null,

      observerHierarchyExecutiveInstruction:
        lateHierarchy.recommendedExecutiveInstruction || null,

      observerHierarchyShouldAskClarifyingQuestion:
        Boolean(lateHierarchy.shouldAskClarifyingQuestion),

      observerHierarchyRecommendedQuestion:
        lateHierarchy.recommendedQuestion || null,

      observerHierarchyRankedObservations:
        lateHierarchy.rankedObservations || [],

      observerHierarchyRankedUnknowns:
        lateHierarchy.rankedUnknowns || []
    };
  },

  async saveFinalThreadState(summary = {}) {
    if (!window.AriThreadStore?.save) {
      summary.threadSaveRan = false;
      return summary;
    }

    const threadState = {
      ...(summary.threadState || {}),
      currentTopic:
        summary.threadUnderstanding?.currentTopic ||
        summary.continuityState?.currentTopic ||
        summary.currentTopic ||
        "general_thread",

      previousAnswerSummary:
        summary.finalResponse
          ? String(summary.finalResponse).slice(0, 500)
          : null,

      lastFinalResponse:
        summary.finalResponse || null,

      lastUpdatedAt: new Date().toISOString()
    };

    await window.AriThreadStore.save(threadState);

    summary.threadSaveRan = true;
    summary.threadState = threadState;

    return summary;
  },

  applyContractBridge(summary = {}) {
    const contract = summary.situationContract || {};
    const primary = contract.primary || summary.primaryLaneSuggestion;

    const bridge = {
      contractBridgeRan: true,
      contractBridgeSource: "ari-rebirth-pipeline"
    };

    const apply = (data = {}) => Object.assign(bridge, data);

    const laneMap = {
      safety: {
        contractBridgeLeadOrgan: "safety",
        contractBridgeMode: "safety_override",
        contractBridgeResponseIntent: "protect_safety_first",
        salienceLeadOrgan: "safety",
        salienceMode: "safety_override",
        responseIntent: "protect_safety_first",
        primaryHumanNeed: "security",
        needResponseMode: "protect_safety_first"
      },

      medical_body: {
        contractBridgeLeadOrgan: "safety",
        contractBridgeMode: "medical_or_body_first",
        contractBridgeResponseIntent: "stabilize_organism_function",
        salienceLeadOrgan: "safety",
        salienceMode: "medical_or_body_first",
        responseIntent: "stabilize_organism_function",
        primaryHumanNeed: "body",
        needResponseMode: "stabilize_body_first"
      },

      risk_clarification: {
        contractBridgeLeadOrgan: "safety",
        contractBridgeMode: "clarify_risk",
        contractBridgeResponseIntent: "clarify_risk",
        salienceLeadOrgan: "safety",
        salienceMode: "clarify_risk",
        responseIntent: "clarify_risk",
        primaryHumanNeed: "security",
        needResponseMode: "clarify_before_answer"
      },

      executive_decision: {
        contractBridgeLeadOrgan: "executive",
        contractBridgeMode: "plan_next_step",
        contractBridgeResponseIntent: "decision_support",
        salienceLeadOrgan: "executive",
        salienceMode: "plan_next_step",
        responseIntent: "decision_support",
        primaryHumanNeed: "clarity",
        needResponseMode: "choose_next_step"
      },

      builder: {
        contractBridgeLeadOrgan: "builder",
        contractBridgeMode: "build_or_debug",
        contractBridgeResponseIntent: "build_or_fix",
        salienceLeadOrgan: "builder",
        salienceMode: "build_or_debug",
        responseIntent: "build_or_fix",
        primaryHumanNeed: "execution",
        needResponseMode: "step_by_step_action"
      },

      emotion: {
        contractBridgeLeadOrgan: "emotion",
        contractBridgeMode: "restore_connection",
        contractBridgeResponseIntent: "offer_connection",
        salienceLeadOrgan: "emotion",
        salienceMode: "restore_connection",
        responseIntent: "offer_connection",
        primaryHumanNeed: "connection",
        needResponseMode: "restore_connection"
      },

      teacher: {
        contractBridgeLeadOrgan: "teacher",
        contractBridgeMode: "teach_clearly",
        contractBridgeResponseIntent: "teach",
        salienceLeadOrgan: "teacher",
        salienceMode: "teach_clearly",
        responseIntent: "teach",
        primaryHumanNeed: "understanding",
        needResponseMode: "teach_clearly"
      }
    };

    if (laneMap[primary]) apply(laneMap[primary]);

    return {
      ...summary,
      ...bridge,

      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        null,

      situationContractPrimary:
        contract.primary || null,

      situationContractSupport:
        contract.support || [],

      situationContractBrief:
        contract.brief || [],

      situationContractContext:
        contract.context || [],

      situationContractDeferred:
        contract.deferred || [],

      situationContractBlocked:
        contract.blocked || []
    };
  },

  reassertContractAuthority(summary = {}) {
    const contract = summary.situationContract || null;
    if (!contract || !contract.primary) return summary;

    const primary = contract.primary;

    const authority = {
      contractAuthorityReasserted: true,
      contractAuthoritySource: "ari-rebirth-pipeline",

      situationContractPrimary: primary,
      situationContractSupport: contract.support || [],
      situationContractBrief: contract.brief || [],
      situationContractContext: contract.context || [],
      situationContractDeferred: contract.deferred || [],
      situationContractBlocked: contract.blocked || [],

      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        null
    };

    const laneMap = {
      safety: {
        salienceLeadOrgan: "safety",
        salienceMode: "safety_override",
        responseIntent: "protect_safety_first",
        primaryHumanNeed: "security",
        needResponseMode: "protect_safety_first"
      },

      medical_body: {
        salienceLeadOrgan: "safety",
        salienceMode: "medical_or_body_first",
        responseIntent: "stabilize_organism_function",
        primaryHumanNeed: "body",
        needResponseMode: "stabilize_body_first"
      },

      risk_clarification: {
        salienceLeadOrgan: "safety",
        salienceMode: "clarify_risk",
        responseIntent: "clarify_risk",
        primaryHumanNeed: "security",
        needResponseMode: "clarify_before_answer"
      },

      executive_decision: {
        salienceLeadOrgan: "executive",
        salienceMode: "plan_next_step",
        responseIntent: "decision_support",
        primaryHumanNeed: "clarity",
        needResponseMode: "choose_next_step"
      },

      builder: {
        salienceLeadOrgan: "builder",
        salienceMode: "build_or_debug",
        responseIntent: "build_or_fix",
        primaryHumanNeed: "execution",
        needResponseMode: "step_by_step_action"
      },

      emotion: {
        salienceLeadOrgan: "emotion",
        salienceMode: "restore_connection",
        responseIntent: "offer_connection",
        primaryHumanNeed: "connection",
        needResponseMode: "restore_connection"
      },

      teacher: {
        salienceLeadOrgan: "teacher",
        salienceMode: "teach_clearly",
        responseIntent: "teach",
        primaryHumanNeed: "understanding",
        needResponseMode: "teach_clearly"
      },

      family: {
        salienceLeadOrgan: "meaning",
        salienceMode: "protect_family_presence",
        responseIntent: "family_context_support",
        primaryHumanNeed: "connection",
        needResponseMode: "protect_relationships"
      },

      general_understanding: {
        salienceLeadOrgan: "observer",
        salienceMode: "continue_observing",
        responseIntent: "understand_context",
        primaryHumanNeed: "understanding",
        needResponseMode: "continue_observing"
      }
    };

    return {
      ...summary,
      ...authority,
      ...(laneMap[primary] || {})
    };
  },

  debugLog(summary = {}, reasoningResult = {}) {
    console.log("===== ARI REBIRTH PIPELINE =====", this.version);

    console.log("===== SAFETY CONTEXT GATE =====");
    console.log(summary.safetyContextGate);

    console.log("===== OBSERVER EVIDENCE =====");
    console.log(summary.observerEvidence);

    console.log("===== UNIVERSAL CONVERSATION CLASSIFIER =====");
    console.log(summary.universalConversationClassification || {
      ran: summary.universalConversationClassifierRan,
      type: summary.conversationType,
      intent: summary.conversationIntent
    });

    console.log("===== THREAD UNDERSTANDING =====");
    console.log(summary.threadUnderstanding || {
      ran: summary.threadUnderstandingRan,
      activeSubject: summary.activeSubject,
      activeIssue: summary.activeIssue,
      impliedQuestion: summary.impliedQuestion
    });

    console.log("===== SUBJECT GRAPH =====");
    console.log(summary.subjectGraphState || {
      ran: summary.subjectGraphRan,
      activeSubject: summary.activeSubject,
      references: summary.resolvedReferences
    });

    console.log("===== SITUATION MAP =====");
    console.log(summary.situationMap);

    console.log("===== SITUATION CONTRACT =====");
    console.log(summary.situationContract);

    console.log(`===== REASONING ENGINE ${summary.reasoningEngineVersion || "UNKNOWN"} =====`);
    console.log(summary.reasoning);
    console.log("Loaded Reasoning Version:", window.AriReasoningEngine?.version);
    console.log("Reasoning Result Version:", reasoningResult.reasoningEngineVersion);

    console.log("===== CHARACTER CONTEXT =====");
    console.log(summary.characterContext);

    console.log("===== HUMAN LANGUAGE ENGINE =====");
    console.log(summary.humanLanguageProfile);

    console.log("===== CONTRACT AUTHORITY =====");
    console.log({
      contractAuthorityReasserted: summary.contractAuthorityReasserted,
      situationContractPrimary: summary.situationContractPrimary,
      salienceLeadOrgan: summary.salienceLeadOrgan,
      salienceMode: summary.salienceMode,
      responseIntent: summary.responseIntent,
      responseShape: summary.responseShape
    });

    console.log("===== MEMORY SAVE =====");
    console.log({
      memorySaveRan: summary.memorySaveRan,
      memoryCandidates: summary.memoryCandidates,
      memorySaveResult: summary.memorySaveResult
    });

    console.log("===== FINAL RESPONSE =====");
    console.log(summary.finalResponse);
  }
};

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline?.version
);