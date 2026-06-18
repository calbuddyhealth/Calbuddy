// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V3.5.2 — Lane Splitter + Continuity Packet Routing

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "3.5.2",

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

    const merge = result => {
      summary = {
        ...summary,
        ...(result || {})
      };
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
      observer: observerResult,
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

    // 0.26 Observer Routing Evidence
    const routingEvidence =
      window.Ari?.observerRoutingEvidence?.analyze
        ? await window.Ari.observerRoutingEvidence.analyze({
            summary,
            observer: summary.observerEvidence
          })
        : {
            engine: "ari-observer-routing-evidence",
            source: "not-loaded",
            routingPressures: {},
            preservedObserverEvidence: summary.observations || []
          };

    summary = {
      ...summary,
      routingEvidence,
      observerRoutingEvidence: routingEvidence
    };

    // 0.27 Lane Splitter
    const laneSplit =
      window.Ari?.laneSplitterEngine?.split
        ? await window.Ari.laneSplitterEngine.split({
            summary,
            routingEvidence: summary.routingEvidence
          })
        : {
            engine: "ari-lane-splitter-engine",
            source: "not-loaded",
            lane: "direct_current_turn",
            routing: {
              useCurrentTurn: true,
              useThread: false,
              useMemory: false,
              useRelationship: false,
              goStraightToSituationMap: true
            }
          };

    summary = {
      ...summary,
      laneSplit,
      lane: laneSplit.lane || "direct_current_turn",
      routingDecision: laneSplit.routing || {}
    };

    // 0.28 Continuity Entry Point
    const continuityResults =
      window.Ari?.continuityEntryPoint?.enter
        ? await window.Ari.continuityEntryPoint.enter({
            summary,
            laneSplit: summary.laneSplit
          })
        : {
            engine: "ari-continuity-entry-point",
            source: "not-loaded",
            ran: false,
            reason: "continuity_entry_point_not_loaded",
            outputs: {
              thread: null,
              memory: null,
              relationship: null
            }
          };

    summary = {
      ...summary,
      continuityResults
    };

    // 0.29 Continuity Packet
    const continuityPacket =
      window.Ari?.continuityPacket?.build
        ? await window.Ari.continuityPacket.build({
            summary,
            laneSplit: summary.laneSplit,
            continuityResults: summary.continuityResults
          })
        : {
            engine: "ari-continuity-packet",
            source: "not-loaded",
            ran: false,
            reason: "continuity_packet_not_loaded",
            usableFacts: [],
            unresolvedReferences: [],
            situationMapHandoff: {
              ready: false,
              shouldUseAsContext: false
            }
          };

    summary = {
      ...summary,
      continuityPacket
    };

    // 0.30 Entity Reference Resolver
    merge(await runEngine(window.AriEntityReferenceResolver, ["resolve"]));

    // 0.31 Lexical Grounding
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

    // 0.32 Context Assembler
    merge(await runEngine(window.AriContextAssembler, ["assemble", "create"]));

    // 0.35 Situation Map
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
        laneCandidates: [],
        responseRequirements: [],
        responseConstraints: []
      }
    );

    summary = {
      ...summary,
      situationMap,
      ...situationMap
    };

    // 0.40 Triage Engine
    const triageOutput = await runEngine(
      window.AriTriageEngine,
      ["run", "triage"],
      {}
    );

    const triageResult =
      triageOutput.ariTriage || {
        triageEngineRan: false,
        triageEngineSource: "not-loaded",
        primaryLane: null,
        supportLanes: [],
        deferredLanes: [],
        blockedLanes: [],
        responseConstraints: [],
        confidence: null,
        reason: "Triage engine not loaded."
      };

    summary = {
      ...summary,
      ...triageOutput,
      triage: triageResult,
      ...triageResult,
      primaryLaneSuggestion: triageResult.primaryLane || null,
      supportLaneSuggestions: triageResult.supportLanes || [],
      deferredLaneSuggestions: triageResult.deferredLanes || [],
      blockedLanes: triageResult.blockedLanes || [],
      responseConstraints: triageResult.responseConstraints || []
    };

    // 0.45 Situation Contract
    merge(await runEngine(
      window.AriSituationContract,
      ["create", "build"],
      {
        situationContractRan: false,
        source: "not-loaded",
        situationContract: null
      }
    ));

    // 0.50 Bridge Contract
    summary = this.applyContractBridge(summary);
    summary = this.reassertContractAuthority(summary);

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

    summary = this.reassertContractAuthority(summary);

    // Legacy support organs
    merge(await runEngine(window.AriIdentityPriorityEngine, ["evaluate"]));
    merge(await runEngine(window.AriStewardshipFearDifferentiator, ["evaluate"]));
    merge(await runEngine(window.AriLifeChapterEngine, ["detect"]));
    merge(await runEngine(window.AriUncertaintyClassificationEngine, ["classify"]));
    merge(await runEngine(window.AriIdentityConflictResolver, ["resolve"]));
    merge(await runEngine(window.AriValueIntegrationEngine, ["integrate"]));
    merge(await runEngine(window.Ari?.emotionIntegrator, ["integrate"]));

    summary = this.reassertContractAuthority(summary);

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
        reasoningAnswer: null,
        reasoningRecommendation: null
      }
    );

    summary = {
      ...summary,
      ...reasoningResult,
      reasoning: reasoningResult.reasoning || summary.reasoning || {},
      reasoningAnswer: null,
      reasoningRecommendation: null
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

    summary = this.reassertContractAuthority(summary);

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
        situationReview.situationReviewConsoleRan ||
        Boolean(window.AriSituationReviewConsole),
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

    const previousThread = summary.threadState || {};

    const threadState = {
      ...previousThread,

      currentTopic:
        summary.continuityPacket?.activeThread?.activeTopic ||
        summary.threadUnderstanding?.currentTopic ||
        summary.continuityState?.currentTopic ||
        summary.currentTopic ||
        previousThread.currentTopic ||
        "general_thread",

      lastMessages:
        summary.continuityState?.lastMessages ||
        previousThread.lastMessages ||
        [],

      unresolvedItems:
        summary.continuityPacket?.unresolvedReferences ||
        summary.continuityState?.unresolvedItems ||
        previousThread.unresolvedItems ||
        [],

      nextStep:
        summary.continuityState?.nextStep ||
        previousThread.nextStep ||
        null,

      activeSubject:
        summary.threadUnderstanding?.activeSubject ||
        summary.activeSubject ||
        previousThread.activeSubject ||
        null,

      activeObject:
        summary.threadUnderstanding?.activeObject ||
        summary.activeObject ||
        previousThread.activeObject ||
        null,

      activeIssue:
        summary.threadUnderstanding?.activeIssue ||
        summary.activeIssue ||
        previousThread.activeIssue ||
        null,

      activeGoal:
        summary.threadUnderstanding?.activeGoal ||
        summary.activeGoal ||
        previousThread.activeGoal ||
        null,

      activeConstraints:
        summary.threadUnderstanding?.activeConstraints ||
        summary.activeConstraints ||
        previousThread.activeConstraints ||
        [],

      continuitySummary:
        summary.continuitySummary ||
        summary.continuityState?.continuitySummary ||
        previousThread.continuitySummary ||
        null,

      previousAnswerSummary:
        summary.finalResponse
          ? String(summary.finalResponse).slice(0, 500)
          : previousThread.previousAnswerSummary || null,

      lastFinalResponse:
        summary.finalResponse ||
        previousThread.lastFinalResponse ||
        null,

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

    return {
      ...summary,
      contractBridgeRan: true,
      contractBridgeSource: "ari-rebirth-pipeline",
      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        null,
      situationContractPrimary: primary || null,
      situationContractSupport: contract.support || [],
      situationContractBrief: contract.brief || [],
      situationContractContext: contract.context || [],
      situationContractDeferred: contract.deferred || [],
      situationContractBlocked: contract.blocked || []
    };
  },

  reassertContractAuthority(summary = {}) {
    const contract = summary.situationContract || null;
    if (!contract || !contract.primary) return summary;

    const primary = contract.primary;

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
      teacher: {
        salienceLeadOrgan: "teacher",
        salienceMode: "teach_clearly",
        responseIntent: "teach",
        primaryHumanNeed: "understanding",
        needResponseMode: "teach_clearly"
      },
      emotion: {
        salienceLeadOrgan: "emotion",
        salienceMode: "restore_connection",
        responseIntent: "offer_connection",
        primaryHumanNeed: "connection",
        needResponseMode: "restore_connection"
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
        null,
      ...(laneMap[primary] || {})
    };
  },

  debugLog(summary = {}, reasoningResult = {}) {
    console.log("===== ARI REBIRTH PIPELINE =====", this.version);
    console.log("===== SAFETY CONTEXT GATE =====", summary.safetyContextGate);
    console.log("===== OBSERVER EVIDENCE =====", summary.observerEvidence);
    console.log("===== CLASSIFIER =====", summary.universalConversationClassification);
    console.log("===== ROUTING EVIDENCE =====", summary.routingEvidence);
    console.log("===== LANE SPLIT =====", summary.laneSplit);
    console.log("===== CONTINUITY RESULTS =====", summary.continuityResults);
    console.log("===== CONTINUITY PACKET =====", summary.continuityPacket);
    console.log("===== ENTITY RESOLVER =====", summary.entityReferenceState || summary.subjectGraphState);
    console.log("===== LEXICAL GROUNDING =====", summary.lexicalGrounding);
    console.log("===== SITUATION MAP =====", summary.situationMap);
    console.log("===== TRIAGE =====", summary.triage);
    console.log("===== CONTRACT =====", summary.situationContract);
    console.log("===== REASONING =====", reasoningResult);
    console.log("===== FINAL RESPONSE =====", summary.finalResponse);
  }
};

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline?.version
);