// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V3.9.5 — Composer Handoff Contract Normalized

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "3.9.5",

  async run(systemSummary = {}) {
    const debugTiming =
  systemSummary.debugTiming === true ||
  systemSummary.appContext?.debugTiming === true;

const timingStart = performance.now();
const timing = [];

let summary = this.normalizeInput(systemSummary);
summary.debugTiming = debugTiming;
summary.pipelineTiming = timing;
summary.pipelineTimingStart = timingStart;

const mark = (label) => {
  if (!debugTiming) return;

  timing.push({
    label,
    ms: Math.round(performance.now() - timingStart)
  });

  summary.pipelineTiming = timing;
};

const finishTiming = () => {
  if (!debugTiming) return;
  mark("AriRebirthPipeline.run complete");
  console.table(timing);
  console.log(
    "[AriRebirthPipeline Timing] Total:",
    Math.round(performance.now() - timingStart) + "ms"
  );
};
    
mark("normalizeInput complete");
     // 0.05 Load Thread State

  // Runs first so Safety, Observer, Classifier, Routing Evidence, and Lane Splitter can see prior context.

  mark("before loadThreadState");
summary = await this.loadThreadState(summary);
mark("after loadThreadState");
    let reasoningResult = {};

summary = this.preserveDeveloperEvidence(summary);

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
    mark("before safetyContextGate");
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
mark("after safetyContextGate");
    // 0.20 Observer Evidence
    mark("before observerEvidence");
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
mark("after observerEvidence");
// 0.23 Conversation Function Engine
mark("before conversationFunction");
const conversationFunctionResult = await runEngine(
  window.AriConversationFunctionEngine,
  ["analyze"],
  {
    conversationFunctionRan: false,
    conversationFunctionSource: "not-loaded",
    primaryFunction: "unknown",
    supportFunctions: [],
    blockedFunctions: [],
    candidates: [],
    responseBias: null,
    confidence: null
  }
);

summary = {
  ...summary,
  conversationFunction: conversationFunctionResult,
  ...conversationFunctionResult
};
mark("after conversationFunction");
    
    // 0.25 Universal Conversation Classifier
    mark("before universalConversationClassifier");
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
mark("after universalConversationClassifier");
    
    // 0.26 Observer Routing Evidence
    mark("before observerRoutingEvidence");
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
  observerRoutingEvidence: routingEvidence,

  routingEvidenceRan:
    routingEvidence.engine === "ari-observer-routing-evidence",

  routingEvidenceSource:
    routingEvidence.source || "not-loaded",

  routingPressures:
    routingEvidence.routingPressures || {},

  preservedObserverEvidence:
    routingEvidence.preservedObserverEvidence || [],

  preservedObservationCount:
    routingEvidence.preservedObservationCount ?? 0
};
mark("after observerRoutingEvidence");

// 0.265 Context Assembler - Early Pass
mark("before contextAssemblerEarly");
merge(await runEngine(window.AriContextAssembler, ["assemble", "create"]));
mark("after contextAssemblerEarly");

// 0.266 Semantic Frame Builder
mark("before semanticFrameBuilder");
const semanticFrameOutput = await runEngine(
  window.AriSemanticFrameBuilder ||
  window.Ari?.semanticFrameBuilder,
  ["build"],
  {
    semanticFrameBuilderRan: false,
    semanticFrameBuilderVersion: null,
    semanticFrameSource: "not-loaded",
    advisoryOnly: true,
    primaryFrame: null,
    normalizedFrame: null,
    secondaryFrames: [],
    allFrames: [],
    continuity: {},
    responseCharacteristics: {},
    emotionalOverlay: {},
    ambiguity: {},
    semanticSummary: null
  }
);

summary = {
  ...summary,
  semanticFrameOutput,
  semanticFrame: semanticFrameOutput,
  activeSemanticFrame: semanticFrameOutput.primaryFrame || null,
  primarySemanticFrame: semanticFrameOutput.primaryFrame || null,
  semanticSummary: semanticFrameOutput.semanticSummary || null,
  semanticContinuity: semanticFrameOutput.continuity || {},
  semanticResponseCharacteristics:
    semanticFrameOutput.responseCharacteristics || {},
  semanticEmotionalOverlay:
    semanticFrameOutput.emotionalOverlay || {},
  semanticAmbiguity:
    semanticFrameOutput.ambiguity || {}
};
mark("after semanticFrameBuilder");

    // 0.27 Lane Splitter
    mark("before laneSplitter");
    const laneSplit =
      window.Ari?.laneSplitterEngine?.split
        ? await window.Ari.laneSplitterEngine.split({
            summary,
routingEvidence: summary.routingEvidence,
semanticFrame: summary.semanticFrameOutput,
primarySemanticFrame: summary.primarySemanticFrame,
semanticSummary: summary.semanticSummary
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
  routingDecision: laneSplit.routing || {},

  laneSplitterRan:
    laneSplit.engine === "ari-lane-splitter-engine",

  laneSplitterSource:
    laneSplit.source || "not-loaded",

  laneSplitterConfidence:
    laneSplit.confidence || null,

  laneSplitterScores:
  laneSplit.scores || {},

laneSplitterSemanticAware:
  Boolean(
    summary.semanticFrameOutput?.semanticFrameBuilderRan ||
    summary.semanticSummary ||
    summary.semanticFrameOutput?.primaryFrame ||
    summary.semanticFrameOutput?.normalizedFrame
  ),

laneSplitterSemanticFirst:
  laneSplit.semanticFirst ?? false,

laneSplitterLexicalFallbackUsed:
  laneSplit.lexicalFallbackUsed ?? false,

laneSplitterSemanticFrameType:
  laneSplit.semanticFrameType || null,

laneSplitterSemanticIntent:
  laneSplit.semanticIntent || null,

laneSplitterExplanation:
  laneSplit.explanation || null
};

mark("after laneSplitter");

    // 0.28 Continuity Entry Point
    mark("before continuityEntryPoint");
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
  continuityResults,

  continuityEntryPointRan:
    continuityResults.ran ?? false,

  continuityEntryPointSource:
    continuityResults.source || "not-loaded",

  continuityEntryPointReason:
    continuityResults.reason || null,

  continuityEntryPointUsed:
    continuityResults.used || {},

  continuityEntryPointOutputs:
    continuityResults.outputs || {},

  continuityEntryPointWarnings:
    continuityResults.warnings || []
};
mark("after continuityEntryPoint");

    // 0.29 Continuity Packet
    mark("before continuityPacket");
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
  continuityPacket,

  continuityPacketRan:
    continuityPacket.ran ?? false,

  continuityPacketSource:
    continuityPacket.source || "not-loaded",

  continuityType:
    continuityPacket.continuityType || null,

  continuityCurrentTurn:
    continuityPacket.currentTurn || {},

  continuityActiveThread:
    continuityPacket.activeThread || {},

  continuityReferencedContext:
    continuityPacket.referencedContext || {},

  continuityUsableFacts:
    continuityPacket.usableFacts || [],

  continuityUsableFactCount:
    continuityPacket.usableFactCount ?? 0,

  continuityUnresolvedReferences:
    continuityPacket.unresolvedReferences || [],

  continuityUnresolvedReferenceCount:
    continuityPacket.unresolvedReferenceCount ?? 0,

  continuityPacketConfidence:
    continuityPacket.confidence || null,

  continuitySituationMapHandoff:
    continuityPacket.situationMapHandoff || {}
};
mark("after continuityPacket");

// 0.292 Load Prior Conversation Meaning
summary = {
  ...summary,
  priorMeaningForFollowUp:
    summary.latestConversationMeaning ||
    summary.threadState?.latestConversationMeaning ||
    null,

  conversationMeaningHistory:
    summary.conversationMeaningHistory ||
    summary.threadState?.conversationMeaningHistory ||
    [],

  activeSemanticTimeline:
    summary.activeSemanticTimeline ||
    summary.threadState?.activeSemanticTimeline ||
    []
};

// 0.295 Thread Question Generator
mark("before threadQuestionGenerator");
const threadQuestion =
  window.Ari?.threadQuestionGenerator?.generate
    ? await window.Ari.threadQuestionGenerator.generate({ summary })
    : {
        threadQuestionGeneratorRan: false,
        source: "not-loaded",
        resolvedUserQuestion: summary.userMessage,
        currentTurnWasResolved: false
      };

summary = {
  ...summary,
  threadQuestion,
  ...threadQuestion
};
mark("after threadQuestionGenerator");

    // 0.30 Entity Reference Resolver
// Only run for continuity routes. Direct current-turn messages do not need thread/entity resolution.
const shouldRunEntityResolver =
  summary.laneSplit?.routing?.useThread ||
  summary.laneSplit?.routing?.useMemory ||
  summary.laneSplit?.routing?.useRelationship;

if (shouldRunEntityResolver) {
  merge(await runEngine(window.AriEntityReferenceResolver, ["resolve"]));
}


    // 0.35 Situation Map
    mark("before situationMap");
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
mark("after situationMap");
    // 0.40 Triage Engine
    mark("before triageEngine");
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
mark("after triageEngine");

    // 0.45 Situation Contract
    mark("before situationContract");
    merge(await runEngine(
      window.AriSituationContract,
      ["create", "build"],
      {
        situationContractRan: false,
        source: "not-loaded",
        situationContract: null
      }
    ));
mark("after situationContract");

    // 0.50 Bridge Contract
mark("before contractBridge");
    summary = this.applyContractBridge(summary);
    summary = this.reassertContractAuthority(summary);
mark("after contractBridge");
// 0.60 Ari Rebirth Developer Layer
// Owner-only developer reasoning. Runs before normal human-needs response path
// so app/code requests can produce developerIntent safely.
mark("before runDeveloperLayer");
summary = await this.runDeveloperLayer(summary);
mark("after runDeveloperLayer");
summary = this.preserveDeveloperEvidence(summary);
summary = this.reassertContractAuthority(summary);

const developerResponseLocked = Boolean(
  summary.responseLocked === true ||
  summary.developerResponseLocked === true ||
  summary.developerHandoff?.responseLocked === true ||
  summary.developerHandoff?.developerResponseLocked === true
);
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
    mark("before AriReasoningEngine");
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
mark("after AriReasoningEngine");
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

// 1.85 Lexical Grounding
// Runs downstream as expression support, not upstream situation authority.
merge(await runEngine(
  window.AriLexicalGroundingEngine,
  ["ground"],
  {
    lexicalGroundingRan: false,
    lexicalGroundingSource: "not-loaded",
    lexicalGrounding: null,
    preferredTerms: {},
    conceptMap: {},
    authority: {
      canSetSituation: false,
      canSetLane: false,
      canSetContract: false,
      canAnswerUser: false,
      role: "expression_grounding_only"
    }
  }
));

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

summary = this.reassertContractAuthority(summary);

// Composer handoff

summary = this.prepareComposerHandoff(summary);

    // Composer
if (!developerResponseLocked) {
  mark("before AriLanguageComposer");
  const composerResult = await runEngine(window.AriLanguageComposer, ["compose"]);

summary = {
  ...summary,
  ...composerResult,
  finalResponse:
    composerResult.finalResponse ||
    composerResult.languageBody ||
    summary.finalResponse
};
  mark("after AriLanguageComposer");
}

// Response Compressor
if (!developerResponseLocked) {
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
}

summary = this.preserveMealEstimate(summary);

// 2.10 Rebirth Action Planner
// Converts Ari's understanding into safe CalBuddy proposed actions.
// CalBuddy still requires user approval before executing.
if (window.Ari?.rebirthActionPlanner?.plan) {
  summary = window.Ari.rebirthActionPlanner.plan(summary);
}

// Conversation Meaning History
const conversationMeaningHistory =
  window.Ari?.conversationMeaningHistory?.build
    ? await window.Ari.conversationMeaningHistory.build(summary)
    : {
        conversationMeaningHistoryRan: false,
        source: "not-loaded",
        conversationMeaningHistory: summary.conversationMeaningHistory || [],
        latestConversationMeaning: null,
        priorMeaningForFollowUp: null
      };

summary = {
  ...summary,
  conversationMeaningHistoryState: conversationMeaningHistory,
  ...conversationMeaningHistory
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
    mark("before saveFinalThreadState");
await this.saveFinalThreadState(summary);
mark("after saveFinalThreadState");

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

finishTiming();
summary.pipelineTiming = timing;
summary.pipelineTimingStart = timingStart;
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

preserveDeveloperEvidence(summary = {}) {
  const githubFileContext =
    summary.githubFileContext ||
    summary.appContext?.githubFileContext ||
    null;

  const developerInvestigation =
    summary.developerInvestigation ||
    summary.appContext?.developerInvestigation ||
    null;

  return {
    ...summary,

    githubFileContext,
    developerInvestigation,

    githubEvidenceAvailable: Boolean(githubFileContext?.content),

    githubEvidence: githubFileContext?.content
      ? {
          filePath: githubFileContext.filePath || "unknown",
          content: githubFileContext.content,
          contentLength: githubFileContext.content.length,
          contentPreview: githubFileContext.content.slice(0, 5000)
        }
      : null
  };
},

preserveMealEstimate(summary = {}) {
  const wantsMealLog = /\b(log|add|save|track)\b/i.test(
    String(summary.userMessage || summary.message || summary.input || "")
  );

  const newMealEstimate =
    summary.mealEstimate ||
    summary.aiData?.mealEstimate ||
    summary.aiData?.rawOpenAIData?.mealEstimate ||
    summary.aiData?.rawOpenAIData?.response?.mealEstimate ||
    summary.structuredOutput?.mealEstimate ||
    summary.rawOpenAIData?.mealEstimate ||
    summary.rawOpenAIData?.response?.mealEstimate ||
    summary.response?.mealEstimate ||
    null;

  const priorMealEstimate =
    wantsMealLog
      ? summary.lastMealEstimate ||
        summary.appContext?.lastMealEstimate ||
        summary.threadState?.lastMealEstimate ||
        null
      : null;

  const mealEstimate = newMealEstimate || priorMealEstimate;

  if (!mealEstimate) return summary;

  return {
    ...summary,
    mealEstimate,
    lastMealEstimate: mealEstimate,
    appContext: {
      ...(summary.appContext || {}),
      lastMealEstimate: mealEstimate,
      mealEstimate
    }
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
  const userMessage = summary.userMessage || summary.message || summary.input || "";

  const previousMessages = Array.isArray(previousThread.lastMessages)
    ? previousThread.lastMessages
    : [];

  const lastMessages = [
    ...previousMessages,
    userMessage
  ]
    .filter(Boolean)
    .slice(-8);

  const realTopic =
    summary.resolvedPrimarySubject ||
    summary.activeSubject ||
    summary.situationMap?.situations?.[0] ||
    summary.continuityPacket?.activeThread?.activeTopic ||
    previousThread.currentTopic ||
userMessage ||
"general_thread";

  const threadState = {
    ...previousThread,

    currentTopic: realTopic,
    lastMessages,

    continuitySummary: summary.finalResponse
      ? `User said: ${userMessage}. Ari answered: ${String(summary.finalResponse).slice(0, 300)}`
      : previousThread.continuitySummary || null,

    activeSubject:
      summary.resolvedPrimarySubject ||
      summary.activeSubject ||
      previousThread.activeSubject ||
      null,

    activeIssue:
      summary.activeIssue ||
      summary.situationMap?.situations?.[0] ||
      previousThread.activeIssue ||
      null,

    activeGoal:
      summary.activeGoal ||
      previousThread.activeGoal ||
      null,

conversationMeaningHistory:
  summary.conversationMeaningHistory ||
  previousThread.conversationMeaningHistory ||
  [],

latestConversationMeaning:
  summary.latestConversationMeaning ||
  previousThread.latestConversationMeaning ||
  null,

activeSemanticTimeline:
  summary.activeSemanticTimeline ||
  previousThread.activeSemanticTimeline ||
  [],

activeSemanticFrame:
  summary.activeSemanticFrame ||
  previousThread.activeSemanticFrame ||
  null,

conversationMeaningFocus:
  summary.conversationMeaningFocus ||
  previousThread.conversationMeaningFocus ||
  null,

conversationMeaningOpenLoops:
  summary.conversationMeaningOpenLoops ||
  previousThread.conversationMeaningOpenLoops ||
  [],


    activeConstraints:
      summary.activeConstraints ||
      previousThread.activeConstraints ||
      [],

    unresolvedItems:
      summary.continuityPacket?.unresolvedReferences ||
      previousThread.unresolvedItems ||
      [],

    previousAnswerSummary:
      summary.finalResponse
        ? String(summary.finalResponse).slice(0, 500)
        : previousThread.previousAnswerSummary || null,

lastMealEstimate:
  summary.mealEstimate ||
  summary.lastMealEstimate ||
  previousThread.lastMealEstimate ||
  null,

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
  const map = summary.situationMap || {};
  const triage = summary.triage || summary.ariTriage || {};

  const primary =
    contract.primary ||
    triage.primaryLane ||
    summary.primaryLaneSuggestion ||
    summary.situationContractPrimary ||
    null;

  return {
    ...summary,

    contractBridgeRan: true,
    contractBridgeSource: "ari-rebirth-pipeline",

    situationContract: contract,

    primaryLane: primary,
    triagePrimaryLane: triage.primaryLane || primary,
    situationContractPrimary: primary,

    responseShape:
      contract.responseShape ||
      triage.responseShape ||
      summary.responseShape ||
      null,

    responseRules:
      contract.responseRules ||
      triage.responseConstraints ||
      summary.responseRules ||
      [],

    responseConstraints:
      contract.responseRules ||
      triage.responseConstraints ||
      summary.responseConstraints ||
      [],

    primarySituationThesis:
      contract.situationThesis?.thesis ||
      map.primarySituationThesis ||
      summary.primarySituationThesis ||
      null,

    situationNarrative:
      contract.situationThesis?.narrative ||
      map.situationNarrative ||
      summary.situationNarrative ||
      null,

    thesisRecommendedUse:
      contract.situationThesis?.recommendedUse ||
      map.thesisRecommendedUse ||
      summary.thesisRecommendedUse ||
      "do_not_use_as_authority",

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

    primaryLane: primary,
    triagePrimaryLane: summary.triage?.primaryLane || primary,
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

    responseRules:
      contract.responseRules ||
      summary.responseRules ||
      [],

    responseConstraints:
      contract.responseRules ||
      summary.responseConstraints ||
      [],

    primarySituationThesis:
      contract.situationThesis?.thesis ||
      summary.situationMap?.primarySituationThesis ||
      summary.primarySituationThesis ||
      null,

    situationNarrative:
      contract.situationThesis?.narrative ||
      summary.situationMap?.situationNarrative ||
      summary.situationNarrative ||
      null,

    thesisRecommendedUse:
      contract.situationThesis?.recommendedUse ||
      summary.situationMap?.thesisRecommendedUse ||
      summary.thesisRecommendedUse ||
      "do_not_use_as_authority",

    ...(laneMap[primary] || {})
  };
},

async loadThreadState(summary = {}) {
  const store = window.AriThreadStore;

  if (!store) {
    return {
      ...summary,
      threadStateLoaded: false,
      threadStateLoadReason: "thread_store_not_available"
    };
  }

  try {
    const threadState =
      typeof store.load === "function"
        ? await store.load()
        : typeof store.get === "function"
          ? await store.get()
          : typeof store.read === "function"
            ? await store.read()
            : null;

    if (!threadState) {
      return {
        ...summary,
        threadStateLoaded: false,
        threadStateLoadReason: "no_thread_state_found"
      };
    }

    return {
      ...summary,
      threadStateLoaded: true,
      threadState,

      recentMessages: threadState.lastMessages || [],

      workingContext:
        threadState.continuitySummary ||
        threadState.currentTopic ||
        null,

      activeTopic: threadState.currentTopic || null,

conversationMeaningHistory:
  threadState.conversationMeaningHistory || [],
 
latestConversationMeaning:
  threadState.latestConversationMeaning || null,

activeSemanticTimeline:
  threadState.activeSemanticTimeline || [],

activeSemanticFrame:
  threadState.activeSemanticFrame || null,

conversationMeaningFocus:
  threadState.conversationMeaningFocus || null,

conversationMeaningOpenLoops:
  threadState.conversationMeaningOpenLoops || [],

lastMealEstimate:
  threadState.lastMealEstimate || null,

mealEstimate:
  summary.mealEstimate || null,

priorMeaningForFollowUp:
  threadState.latestConversationMeaning || null,
     };
  } catch (error) {
    return {
      ...summary,
      threadStateLoaded: false,
      threadStateLoadReason: "thread_store_load_failed",
      threadStateLoadError: error?.message || String(error)
    };
  }
},

async runDeveloperLayer(summary = {}) {
  const ownerMode =
    summary.ownerMode === true ||
    summary.appContext?.ownerMode === true ||
    summary.userContext?.ownerMode === true;

  if (!ownerMode) {
    return summary;
  }

const text = String(

  summary.userMessage ||

    summary.message ||

    summary.input ||

    ""

);

const isDeveloperRequest =

  summary.conversationFunction?.developerArtifactRequest === true ||

  summary.artifactModificationRequest === true ||

  summary.artifactCreationRequest === true ||

  summary.artifactInvestigationRequest === true ||

  summary.developerArtifactRequest === true ||

  summary.primaryFunction === "developer_artifact_request" ||

  summary.primaryFunction === "build_or_debug_request" ||

  summary.situationContractPrimary === "builder" ||

/\b(code|file|github|repo|commit|patch|function|html|css|javascript|api|engine|bug|fix|update|edit|build|implement|developer|composer|pipeline|latency|slow|bottleneck|performance|diagnose)\b/i.test(text);

if (!isDeveloperRequest) {

  return summary;

}

  const runEngine = async (engine, methods = [], fallback = null) => {
    if (!engine) return fallback;

    for (const method of methods) {
      if (typeof engine[method] === "function") {
        try {
          const result = await engine[method](summary);
          return result || fallback;
        } catch (error) {
          console.error("Developer engine error:", method, error);
          return fallback;
        }
      }
    }

    return fallback;
  };

const devMark = label => {
  if (!summary.debugTiming || !Array.isArray(summary.pipelineTiming)) return;

  const start =
    typeof summary.pipelineTimingStart === "number"
      ? summary.pipelineTimingStart
      : performance.now();

  summary.pipelineTiming.push({
    label,
    ms: Math.round(performance.now() - start)
  });
};

const mergeAs = (key, result) => {
  if (!result) return;

  summary = {
    ...summary,
    [key]: result,
    [`rebirth${key.charAt(0).toUpperCase()}${key.slice(1)}`]: result,
    ...result,
    pipelineTiming: summary.pipelineTiming,
    pipelineTimingStart: summary.pipelineTimingStart
  };
};

const timedRun = async (key, engine, methods = []) => {
  devMark(`before ${key}`);
  const result = await runEngine(engine, methods);
  devMark(`after ${key}`);
  mergeAs(key, result);
  return result;
};

  await timedRun("developerUnderstanding", window.AriRebirthDeveloperUnderstandingEngine, ["understand"]);
await timedRun("projectKnowledgeGraph", window.AriRebirthProjectKnowledgeGraphEngine, ["build"]);
await timedRun("capabilityRegistry", window.AriRebirthCapabilityRegistryEngine, ["inspect"]);
await timedRun("architecture", window.AriRebirthArchitectureEngine, ["design"]);
await timedRun("uiLayoutPlanner", window.AriRebirthUILayoutPlannerEngine, ["plan"]);
await timedRun("bugDiagnosis", window.AriRebirthBugDiagnosisEngine, ["diagnose"]);
await timedRun("executionPlanner", window.AriRebirthExecutionPlannerEngine, ["plan"]);
await timedRun("codeEvidence", window.AriRebirthCodeEvidenceEngine, ["build"]);
await timedRun("codeUnderstanding", window.AriRebirthCodeUnderstandingEngine, ["understand"]);
await timedRun("dependencyMap", window.AriRebirthDependencyMapEngine, ["map"]);
await timedRun("selfImprovement", window.AriRebirthSelfImprovementEngine, ["improve"]);
await timedRun("patchDecision", window.AriRebirthPatchDecisionEngine, ["decide"]);
await timedRun("patchValidation", window.AriRebirthPatchValidationEngine, ["validate"]);
await timedRun("regressionTest", window.AriRebirthRegressionTestEngine, ["build"]);
await timedRun("learning", window.AriRebirthLearningEngine, ["learn"]);
await timedRun("developerHandoff", window.AriRebirthDeveloperHandoffEngine, ["handoff", "create", "build"]);

  // Promote locked developer handoff into pipeline-level authority.
if (summary.developerHandoff) {
  summary.developerIntent =
    summary.developerHandoff.developerIntent ||
    summary.developerHandoff;

  summary.developerResponse =
    summary.developerHandoff.developerResponse ||
    summary.developerIntent?.developerResponse ||
    null;

    summary.developerResponseLocked =
    summary.developerHandoff.developerResponseLocked === true ||
    summary.developerHandoff.responseLocked === true;

  summary.responseLocked =
    summary.developerResponseLocked;

    if (
    summary.developerResponseLocked === true &&
    summary.developerHandoff.reply
  ) {
    summary.finalResponse = summary.developerHandoff.reply;
  }

  if (
    summary.developerResponseLocked === true &&
    !summary.finalResponse &&
    summary.developerHandoff.finalResponse
  ) {
    summary.finalResponse = summary.developerHandoff.finalResponse;
  }
}

  return {
    ...summary,
    developerLayerRan: true,
    developerLayerSource: "ari-rebirth-pipeline",
    developerLayerVersion: this.version
  };
},

prepareComposerHandoff(summary = {}) {
  const contract = summary.situationContract || {};
  const triage = summary.triage || summary.ariTriage || {};
  const map = summary.situationMap || {};

  const primary =
    contract.primary ||
    summary.situationContractPrimary ||
    triage.primaryLane ||
    summary.triagePrimaryLane ||
    summary.primaryLane ||
    "general_understanding";

  return {
    ...summary,

    composerHandoffReady: true,

    situationContract: {
      ...contract,
      primary,
      responseShape:
  contract.responseShape ||
  triage.responseShape ||
  summary.responseShape ||
  map.responseShape ||
  "clear_explanation",
      responseRules:
        contract.responseRules ||
        triage.responseConstraints ||
        summary.responseRules ||
        [],
      situationThesis: contract.situationThesis || {
        thesis: summary.primarySituationThesis || map.primarySituationThesis || null,
        narrative: summary.situationNarrative || map.situationNarrative || null,
        recommendedUse:
          summary.thesisRecommendedUse ||
          map.thesisRecommendedUse ||
          "do_not_use_as_authority"
      }
    },

    situationContractPrimary: primary,
    triagePrimaryLane: triage.primaryLane || primary,
    primaryLane: primary,

    responseShape:
  contract.responseShape ||
  triage.responseShape ||
  summary.responseShape ||
  map.responseShape ||
  "clear_explanation",

    primarySituationThesis:
      summary.primarySituationThesis ||
      map.primarySituationThesis ||
      contract.situationThesis?.thesis ||
      null,

    situationNarrative:
      summary.situationNarrative ||
      map.situationNarrative ||
      contract.situationThesis?.narrative ||
      null,

    thesisRecommendedUse:
      summary.thesisRecommendedUse ||
      map.thesisRecommendedUse ||
      contract.situationThesis?.recommendedUse ||
      "do_not_use_as_authority"
  };
},

  debugLog(summary = {}, reasoningResult = {}) {
    console.log("===== ARI REBIRTH PIPELINE =====", this.version);
    console.log("===== SAFETY CONTEXT GATE =====", summary.safetyContextGate);
    console.log("===== OBSERVER EVIDENCE =====", summary.observerEvidence);
   console.log("===== CONVERSATION FUNCTION =====", summary.conversationFunction);
     console.log("===== CONVERSATION MEANING HISTORY =====", summary.conversationMeaningHistoryState);
    console.log("===== CLASSIFIER =====", summary.universalConversationClassification);
    console.log("===== ROUTING EVIDENCE =====", summary.routingEvidence);
    console.log("===== SEMANTIC FRAME BUILDER =====", summary.semanticFrameOutput);
    console.log("===== LANE SPLIT =====", summary.laneSplit);
    console.log("===== CONTINUITY RESULTS =====", summary.continuityResults);
    console.log("===== CONTINUITY PACKET =====", summary.continuityPacket);
    console.log("===== ENTITY RESOLVER =====", summary.entityReferenceState || summary.subjectGraphState);
    console.log("===== LEXICAL GROUNDING =====", summary.lexicalGrounding);
    console.log("===== SITUATION MAP =====", summary.situationMap);
    console.log("===== TRIAGE =====", summary.triage);
    console.log("===== CONTRACT =====", summary.situationContract);
    console.log("===== REASONING =====", reasoningResult);
 console.log("===== COMPOSER HANDOFF =====", {
  ready: summary.composerHandoffReady,
  primary: summary.situationContractPrimary,
  responseShape: summary.responseShape,
  hasThesis: Boolean(summary.primarySituationThesis),
  narrative: summary.situationNarrative,
  thesisUse: summary.thesisRecommendedUse
});
       console.log("===== MEAL ESTIMATE =====", summary.mealEstimate || summary.lastMealEstimate);
    console.log("===== FINAL RESPONSE =====", summary.finalResponse);
  console.log("===== DEVELOPER LAYER =====", summary.developerHandoff || summary.developerUnderstanding);
  console.log("===== UI LAYOUT PLANNER =====", summary.uiLayoutPlanner);
  console.log("===== GITHUB EVIDENCE =====", {
  available: summary.githubEvidenceAvailable,
  filePath: summary.githubEvidence?.filePath,
  contentLength: summary.githubEvidence?.contentLength,
  preview:
    summary.githubEvidence?.contentPreview?.slice(0, 300) || null
});
  }
};

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline?.version
);