// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V4.2.6 — Mouth Planner Merge / Communication Planner Removed

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "4.2.6",

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

    const mark = label => {
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

    const runEngine = async (engine, methods = [], fallback = {}) => {
      if (!engine) return fallback;

      for (const method of methods) {
        if (typeof engine[method] === "function") {
          try {
            const result = await engine[method](summary);
            return result || fallback;
          } catch (error) {
            console.error("Ari pipeline engine error:", method, error);
            return {
              ...fallback,
              error: error?.message || String(error)
            };
          }
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

    mark("normalizeInput complete");

    mark("before loadThreadState");
    summary = await this.loadThreadState(summary);
    mark("after loadThreadState");

    summary = this.preserveDeveloperEvidence(summary);
    summary = this.preserveMealEstimate(summary);

    // 0.10 Safety
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
        followUpQuestion: null,
        shouldStopNormalResponse: false
      }
    );

    summary = {
      ...summary,
      safetyContextGate,
      ...safetyContextGate
    };
    mark("after safetyContextGate");

    // 0.20 Observer
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

    // 0.23 Conversation Function
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

    // 0.25 Classifier
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

    // 0.26 Routing Evidence
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
      routingEvidenceSource: routingEvidence.source || "not-loaded",
      routingPressures: routingEvidence.routingPressures || {},
      preservedObserverEvidence:
        routingEvidence.preservedObserverEvidence || [],
      preservedObservationCount:
        routingEvidence.preservedObservationCount ?? 0
    };
    mark("after observerRoutingEvidence");
        // 0.27 Semantic Frame
    mark("before semanticFrameBuilder");
    const semanticFrameOutput = await runEngine(
      window.AriSemanticFrameBuilder || window.Ari?.semanticFrameBuilder,
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

    // 0.28 Lane Splitter
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
      laneSplitterSource: laneSplit.source || "not-loaded",
      laneSplitterConfidence: laneSplit.confidence || null,
      laneSplitterScores: laneSplit.scores || {},
      laneSplitterSemanticAware:
        Boolean(
          summary.semanticFrameOutput?.semanticFrameBuilderRan ||
          summary.semanticSummary ||
          summary.semanticFrameOutput?.primaryFrame ||
          summary.semanticFrameOutput?.normalizedFrame
        ),
      laneSplitterSemanticFirst: laneSplit.semanticFirst ?? false,
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

    // 0.29 Continuity only when needed
    const shouldUseContinuity =
      summary.laneSplit?.routing?.useThread ||
      summary.laneSplit?.routing?.useMemory ||
      summary.laneSplit?.routing?.useRelationship;

    if (shouldUseContinuity) {
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
        continuityEntryPointRan: continuityResults.ran ?? false,
        continuityEntryPointSource:
          continuityResults.source || "not-loaded",
        continuityEntryPointReason: continuityResults.reason || null,
        continuityEntryPointUsed: continuityResults.used || {},
        continuityEntryPointOutputs: continuityResults.outputs || {},
        continuityEntryPointWarnings: continuityResults.warnings || []
      };
      mark("after continuityEntryPoint");

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
        continuityPacketRan: continuityPacket.ran ?? false,
        continuityPacketSource:
          continuityPacket.source || "not-loaded",
        continuityType: continuityPacket.continuityType || null,
        continuityCurrentTurn: continuityPacket.currentTurn || {},
        continuityActiveThread: continuityPacket.activeThread || {},
        continuityReferencedContext:
          continuityPacket.referencedContext || {},
        continuityUsableFacts: continuityPacket.usableFacts || [],
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
    }

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

    // 0.30 Thread Question
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
                
         // 0.40 Triage
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

// 0.43 Multi-Lane Planner

mark("before multiLanePlanner");

const multiLanePlan = await runEngine(

  window.AriMultiLaneResponsePlanner,

  ["plan"],

  {

    multiLanePlannerRan: false,

    source: "not-loaded",

    primaryLane: summary.triage?.primaryLane || null,

    responseShape: summary.triage?.responseShape || null,

    responseOrder: [],

    composerDirective: {}

  }

);

summary = {

  ...summary,

  multiLanePlan,

  responsePlan: multiLanePlan,

  multiLaneResponsePlan: multiLanePlan

};

mark("after multiLanePlanner");

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

    mark("before contractBridge");
    summary = this.applyContractBridge(summary);
    mark("after contractBridge");

// 0.50 Cognitive Executive
mark("before cognitiveExecutive");
const cognitiveExecutiveResult = await runEngine(
  window.AriCognitiveExecutive,
  ["plan"],
  {
    ariExecutiveRan: false,
    ariExecutiveVersion: null,
    cognitiveExecutive: {
      source: "not-loaded",
      authority: "none",
      activate: [],
      requires: {}
    }
  }
);

summary = {
  ...summary,
  ...cognitiveExecutiveResult,
  cognitiveExecutive:
    cognitiveExecutiveResult.cognitiveExecutive ||
    summary.cognitiveExecutive ||
    null
};
mark("after cognitiveExecutive");



    // 0.60 Developer Layer
    mark("before runDeveloperLayer");
    summary = await this.runDeveloperLayer(summary);
    mark("after runDeveloperLayer");

    summary = this.preserveDeveloperEvidence(summary);
    summary = this.applyContractBridge(summary);

    const developerResponseLocked = Boolean(
      summary.responseLocked === true ||
      summary.developerResponseLocked === true ||
      summary.developerHandoff?.responseLocked === true ||
      summary.developerHandoff?.developerResponseLocked === true
    );

    if (!developerResponseLocked && summary.developerHandoff) {
      summary.unlockedDeveloperHandoff = summary.developerHandoff;
      summary.developerIntent =
        summary.developerIntent ||
        summary.developerHandoff.developerIntent ||
        null;

      summary.composerDeveloperPacket =
        summary.developerHandoff.composerDeveloperPacket ||
        summary.composerDeveloperPacket ||
        null;

      summary.developerHandoff = null;
      summary.developerResponse = null;
      summary.finalResponse = null;
      summary.responseLocked = false;
      summary.developerResponseLocked = false;
    }

    // 0.70 Reasoning
    mark("before AriReasoningEngine");
    const reasoningResult = await runEngine(
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
    mark("after AriReasoningEngine");

    // 0.80 Character Context
mark("before characterContext");
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
mark("after characterContext");



// 0.805 Supabase Character Knowledge
mark("before supabaseCharacterKnowledge");
const supabaseCharacterKnowledgeResult = await runEngine(
  window.AriSupabaseCharacterKnowledgeEngine,
  ["retrieve"],
  {
    supabaseCharacterKnowledgeRan: false,
    characterKnowledgeAvailable: false,
    inferenceNeeded: false,
    nodes: []
  }
);

summary = {
  ...summary,
  ...supabaseCharacterKnowledgeResult,
  supabaseCharacterKnowledge: supabaseCharacterKnowledgeResult,
  characterKnowledge: supabaseCharacterKnowledgeResult
};
mark("after supabaseCharacterKnowledge");

// 0.81 Character Reasoning
mark("before characterReasoning");
const characterReasoningResult = await runEngine(
  window.AriCharacterReasoningEngine,
  ["reason"],
  {
    characterReasoningRan: false,
    characterReasoningSource: "not-loaded",
    characterAnswerAvailable: false
  }
);

summary = {
  ...summary,
  ...characterReasoningResult,
  characterReasoning: characterReasoningResult
};
mark("after characterReasoning");

// 0.82 Character Expression
mark("before characterExpression");
const characterExpressionResult = await runEngine(
  window.AriCharacterExpressionEngine,
  ["create"],
  {
    characterExpressionRan: false,
    characterExpressionSource: "not-loaded",
    characterRelevant: false,
    composerCharacter: null,
    composerCharacterPacket: null
  }
);

summary = {
  ...summary,
  ...characterExpressionResult,
  characterExpression: characterExpressionResult,
  composerCharacter:
    characterExpressionResult.composerCharacter ||
    characterExpressionResult.composerCharacterPacket ||
    null
};

summary.composerCharacter = {
  ...(summary.composerCharacter || {}),
  enabled:
    summary.composerCharacter?.enabled === true ||
    characterReasoningResult.characterAnswerAvailable === true,
  draft:
    characterReasoningResult.userFacingDraft ||
    summary.composerCharacter?.draft ||
    "",
  reasoning:
    characterReasoningResult.characterAnswerAvailable === true
      ? characterReasoningResult
      : summary.composerCharacter?.reasoning || null
};

mark("after characterExpression");

// 0.83 Knowledge Router
mark("before knowledgeRouter");

const knowledgeRouterResult = await runEngine(
  window.AriKnowledgeRouter,
  ["route"],
  {
    knowledgeRouterRan: false,
    shouldUseKnowledge: false
  }
);

summary = {
  ...summary,
  ...knowledgeRouterResult,
  knowledgeRouter: knowledgeRouterResult
};

mark("after knowledgeRouter");

// 0.84 Knowledge Meaning Interpreter
mark("before knowledgeMeaningInterpreter");

merge(await runEngine(
  window.AriKnowledgeMeaningInterpreter,
  ["interpret"],
  {
    knowledgeMeaningInterpreterRan: false,
    knowledgeMeaningUsable: false,
    knowledgeMeaning: null
  }
));

mark("after knowledgeMeaningInterpreter");

    // 0.85 Lexical Grounding
    mark("before lexicalGrounding");
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
    mark("after lexicalGrounding");

    // 0.90 Human Language
    mark("before humanLanguage");
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
    mark("after humanLanguage");

    // 0.95 Mouth Director / Expression Planner
mark("before mouthDirector");
const mouthDirectorResult = await runEngine(
  window.AriMouthDirector,
  ["direct", "plan"],
  {
    mouthDirectorRan: false,
    mouthDirectorSource: "not-loaded",
    expressionPlan: null,
    blueprintHint: null,
    responseRules: summary.responseRules || [],
    responseAvoid: [],
    responseRequired: []
  }
);

summary = {
  ...summary,
  ...mouthDirectorResult,
  mouthDirector: mouthDirectorResult,
  expressionPlan: mouthDirectorResult.expressionPlan || null,
  blueprintHint: mouthDirectorResult.blueprintHint || null,
  communicationPlan:
    mouthDirectorResult.communicationPlan ||
    summary.communicationPlan ||
    null,
  mouthDirective:
    mouthDirectorResult.mouthDirective ||
    summary.mouthDirective ||
    null,
  responseRules:
    mouthDirectorResult.responseRules ||
    summary.responseRules ||
    [],
  responseAvoid:
    mouthDirectorResult.responseAvoid || [],
  responseRequired:
    mouthDirectorResult.responseRequired || []
};

mark("after mouthDirector");
        // 1.10 Composer Bridge
    mark("before composerBridge");
    const composerPacketResult =
      window.AriComposerBridge?.build
        ? await window.AriComposerBridge.build(summary)
        : { composerPacketReady: false };

    summary = {
      ...summary,
      ...composerPacketResult,
      composerPacket:
        composerPacketResult.composerPacket ||
        this.buildFallbackComposerPacket(summary)
    };

    if (!summary.composerPacket?.ready) {
      summary.composerPacket = this.buildFallbackComposerPacket(summary);
    }
    mark("after composerBridge");

// 1.15 Blueprint Writer
if (!developerResponseLocked) {
  mark("before blueprintWriter");

  const blueprintWriterResult =
  window.AriBlueprintWriter?.write
    ? await window.AriBlueprintWriter.write({
        composerPacket: summary.composerPacket,
        summary
      })
    : { blueprintWriterRan: false };

  summary = {
    ...summary,
    ...blueprintWriterResult,
    blueprintWriter: blueprintWriterResult,
    blueprintWriterDraft:
      blueprintWriterResult.draft ||
      blueprintWriterResult.blueprintWriterDraft ||
      null
  };

  mark("after blueprintWriter");
}

    // 1.20 AI Writer
const hasKnowledgeSynthesisAnswer = false;

const shouldBypassAIWriterForCharacter =
  summary.characterReasoning?.characterAnswerAvailable === true &&
  (
    summary.characterReasoning?.userFacingDraft ||
    summary.composerCharacter?.draft
  );

if (!developerResponseLocked && hasKnowledgeSynthesisAnswer) {
  mark("before aiWriter");

  const knowledgeDraft = summary.knowledgeSynthesisDraft;

  summary = {
    ...summary,
    finalResponse: knowledgeDraft,
    aiWriterRan: false,
    aiWriterUsedAI: false,
    aiWriterSource: "bypassed_knowledge_synthesis",
    aiWriterDraft: knowledgeDraft,
    aiWriterBypassReason:
      "Supabase knowledge synthesis already produced a usable answer.",
    aiWriter: {
      aiWriterRan: false,
      aiWriterUsedAI: false,
      aiWriterSource: "bypassed_knowledge_synthesis",
      draft: knowledgeDraft
    }
  };

  mark("after aiWriter");

} else if (!developerResponseLocked && shouldBypassAIWriterForCharacter) {
  mark("before aiWriter");

  const characterDraft =
    summary.characterReasoning?.userFacingDraft ||
    summary.composerCharacter?.draft ||
    null;

  summary = {
    ...summary,
    finalResponse: characterDraft,
    aiWriterRan: false,
    aiWriterUsedAI: false,
    aiWriterSource: "bypassed_character_reasoning",
    aiWriterDraft: characterDraft,
    aiWriterBypassReason:
      "Character reasoning already produced a complete answer.",
    aiWriter: {
      aiWriterRan: false,
      aiWriterUsedAI: false,
      aiWriterSource: "bypassed_character_reasoning",
      draft: characterDraft
    }
  };

  mark("after aiWriter");

} else if (!developerResponseLocked) {
  mark("before aiWriter");

  const aiWriterResult =
    window.AriAIWriter?.write
      ? await window.AriAIWriter.write({
          composerPacket: {
  ...summary.composerPacket,
  blueprintWriterDraft: summary.blueprintWriterDraft || null,
  blueprintWriter: summary.blueprintWriter || null
},
          summary
        })
      : { aiWriterRan: false };

  summary = {
    ...summary,
    ...aiWriterResult,
    aiWriter: aiWriterResult,
    aiWriterDraft:
      aiWriterResult.draft ||
      aiWriterResult.aiWriterDraft ||
      null
  };

  mark("after aiWriter");
}

    // 1.30 V9 Composer
    if (!developerResponseLocked) {
      mark("before AriLanguageComposer");

      const composerEngine =
        window.AriLanguageComposerV9 ||
        window.AriLanguageComposer;

      const composerResult =
  composerEngine?.compose
    ? await composerEngine.compose({
        composerPacket: {
          ...summary.composerPacket,
          blueprintWriterDraft: summary.blueprintWriterDraft || null,
          blueprintWriter: summary.blueprintWriter || null
        },
        summary
      })
    : {};
      const composerFinal =
        composerResult.finalResponse ||
        composerResult.languageBody ||
        composerResult.languageComposerOutput ||
        null;

      summary = {
        ...summary,
        ...composerResult,
        finalResponse:
  composerFinal ||
  summary.blueprintWriterDraft ||
  summary.aiWriterDraft ||
  summary.finalResponse ||
  "I’m here, but Ari could not compose a final response."
      };

      mark("after AriLanguageComposer");
    }

    summary = this.preserveMealEstimate(summary);

    // 1.40 Action Planner
    if (window.Ari?.rebirthActionPlanner?.plan) {
      summary = window.Ari.rebirthActionPlanner.plan(summary);
    }

    // 1.50 Conversation Meaning History
    const conversationMeaningHistory =
      window.Ari?.conversationMeaningHistory?.build
        ? await window.Ari.conversationMeaningHistory.build(summary)
        : {
            conversationMeaningHistoryRan: false,
            source: "not-loaded",
            conversationMeaningHistory:
              summary.conversationMeaningHistory || [],
            latestConversationMeaning: null,
            priorMeaningForFollowUp: null
          };

    summary = {
      ...summary,
      conversationMeaningHistoryState: conversationMeaningHistory,
      ...conversationMeaningHistory
    };

    // 1.60 Memory Candidate Detection
    merge(await runEngine(
      window.AriMemoryCandidateEngine,
      ["detect", "create", "evaluate"],
      { memoryCandidateRan: false }
    ));

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

    // 1.70 Save Thread
    mark("before saveFinalThreadState");
    await this.saveFinalThreadState(summary);
    mark("after saveFinalThreadState");

    // 1.80 Optional Review Console, debug only
    if (debugTiming && window.AriSituationReviewConsole) {
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
    }

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
    buildFallbackComposerPacket(summary = {}) {
    return {
      ready: true,
      source: "ari-rebirth-pipeline-fallback",
      version: this.version,

      userQuestion:
        summary.resolvedUserQuestion ||
        summary.threadQuestion?.resolvedUserQuestion ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "",

      primary:
        summary.situationContractPrimary ||
        summary.primaryLane ||
        "general_understanding",

      responseShape:
        summary.responseShape ||
        summary.mouthResponsePattern ||
        "clear_explanation",

      responseRules:
        summary.responseRules ||
        summary.responseConstraints ||
        [],

      requiredBehaviors: [],
      forbiddenBehaviors: [],
responseAvoid:
  summary.responseAvoid || [],

responseRequired:
  summary.responseRequired || [],

expressionPlan:
  summary.expressionPlan || null,

blueprintHint:
  summary.blueprintHint || null,
      mouthDirective:
        summary.situationContract?.mouthDirective ||
        summary.mouthDirector ||
        null,



      communicationPlan:
        summary.communicationPlan || null,

      humanLanguageProfile:
        summary.humanLanguageProfile || {},

      thesis: {
        value: summary.primarySituationThesis || null,
        narrative: summary.situationNarrative || null,
        recommendedUse:
          summary.thesisRecommendedUse ||
          "do_not_use_as_authority"
      },

      safety: {
        gate: summary.safetyContextGate || null,
        risk: summary.situationContract?.risk || null,
        clarity: summary.situationContract?.clarity || null
      },

      developerPacket:
        summary.composerDeveloperPacket || null,

character:
  summary.composerCharacter ||
  summary.characterExpression?.composerCharacter ||
  summary.characterExpression?.composerCharacterPacket ||
  null,

      hasDeveloperPacket:
        summary.composerDeveloperPacket?.enabled === true,

      evidence: {
        github: summary.githubEvidence || null,
        developerPacket: summary.composerDeveloperPacket || null,
        developerHandoff: summary.developerHandoff || null,
        developerResponse: summary.developerResponse || null,
        developerReply: summary.developerReply || null,
        aiWriter: {
          ran: summary.aiWriterRan === true,
          usedAI: summary.aiWriterUsedAI === true,
          draft: summary.aiWriterDraft || null,
          source: summary.aiWriterSource || null,
          version: summary.aiWriterVersion || null,
          fallbackReason: summary.aiWriterFallbackReason || null
        },
        reasoning: summary.reasoning || null,
        lexicalGrounding: summary.lexicalGrounding || null,
        continuityFacts: summary.continuityUsableFacts || []
      }
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
          threadState.latestConversationMeaning || null
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

    if (!ownerMode) return summary;

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
      summary.situationContractPrimary === "developer_artifact" ||
      /\b(code|file|github|repo|commit|patch|function|html|css|javascript|api|engine|bug|fix|update|edit|build|implement|developer|composer|pipeline|latency|slow|bottleneck|performance|diagnose)\b/i.test(text);

    if (!isDeveloperRequest) return summary;

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
    await timedRun("patchDecision", window.AriRebirthPatchDecisionEngine, ["decide"]);
    await timedRun("patchValidation", window.AriRebirthPatchValidationEngine, ["validate"]);
    await timedRun("developerHandoff", window.AriRebirthDeveloperHandoffEngine, ["handoff", "create", "build"]);

    if (summary.developerHandoff) {
      summary.developerIntent =
        summary.developerHandoff.developerIntent ||
        null;

      summary.developerResponse =
        summary.developerHandoff.developerResponse ||
        summary.developerIntent?.developerResponse ||
        null;

      summary.composerDeveloperPacket =
        summary.developerHandoff.composerDeveloperPacket ||
        summary.composerDeveloperPacket ||
        null;

      const hasDeveloperFinal =
        Boolean(summary.developerHandoff.reply) ||
        Boolean(summary.developerHandoff.finalResponse);

      summary.developerResponseLocked =
        hasDeveloperFinal &&
        (
          summary.developerHandoff.developerResponseLocked === true ||
          summary.developerHandoff.responseLocked === true
        );

      summary.responseLocked = summary.developerResponseLocked;

      if (summary.developerResponseLocked === true) {
        summary.finalResponse =
          summary.developerHandoff.reply ||
          summary.developerHandoff.finalResponse ||
          summary.finalResponse;
      }
    }

    return {
      ...summary,
      developerLayerRan: true,
      developerLayerSource: "ari-rebirth-pipeline",
      developerLayerVersion: this.version
    };
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
      summary.primaryLane ||
      "general_understanding";

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
        "clear_explanation",
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

  async saveFinalThreadState(summary = {}) {
    if (!window.AriThreadStore?.save) {
      summary.threadSaveRan = false;
      return summary;
    }

    const previousThread = summary.threadState || {};
    const userMessage =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

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

  debugLog(summary = {}, reasoningResult = {}) {
    console.log("===== ARI REBIRTH PIPELINE =====", this.version);
    console.log("===== SAFETY CONTEXT GATE =====", summary.safetyContextGate);
    console.log("===== OBSERVER EVIDENCE =====", summary.observerEvidence);
    console.log("===== CONVERSATION FUNCTION =====", summary.conversationFunction);
    console.log("===== CLASSIFIER =====", summary.universalConversationClassification);
    console.log("===== ROUTING EVIDENCE =====", summary.routingEvidence);
    console.log("===== SEMANTIC FRAME BUILDER =====", summary.semanticFrameOutput);
    console.log("===== LANE SPLIT =====", summary.laneSplit);
    console.log("===== SITUATION MAP =====", summary.situationMap);
    console.log("===== TRIAGE =====", summary.triage);
    console.log("===== MULTI-LANE PLANNER =====", summary.multiLanePlan);
    console.log("===== CONTRACT =====", summary.situationContract);
    console.log("===== COGNITIVE EXECUTIVE =====", summary.cognitiveExecutive);
    console.log("===== KNOWLEDGE ROUTER =====", summary.knowledgeRouter);
    console.log("===== KNOWLEDGE MEANING INTERPRETER =====", summary.knowledgeMeaning);
    console.log("===== REASONING =====", reasoningResult);
    console.log("===== HUMAN LANGUAGE =====", summary.humanLanguageProfile);
    console.log("===== EXPRESSION PLAN =====", summary.expressionPlan);
console.log("===== BLUEPRINT HINT =====", summary.blueprintHint);
console.log("===== MOUTH DIRECTOR =====", summary.mouthDirector);
    console.log("===== COMPOSER PACKET =====", summary.composerPacket);
    console.log("===== BLUEPRINT WRITER =====", summary.blueprintWriter);
    console.log("===== AI WRITER =====", summary.aiWriter);
    console.log("===== FINAL RESPONSE =====", summary.finalResponse);
    console.log("===== DEVELOPER LAYER =====", summary.developerHandoff || summary.developerUnderstanding);
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