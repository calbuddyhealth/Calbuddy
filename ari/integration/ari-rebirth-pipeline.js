// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Coordinate Ari's five-layer communication lifecycle.
// V5.0.1 — Compact Five-Layer Lifecycle Orchestrator

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "5.0.1",

  async run(systemSummary = {}) {
    const debugTiming =
      systemSummary.debugTiming === true ||
      systemSummary.appContext?.debugTiming === true;

    const timingStart = performance.now();
    const timing = [];

    let summary = {
      ...this.normalizeInput(systemSummary),
      debugTiming,
      pipelineTiming: timing,
      pipelineTimingStart: timingStart,
      pipelineLifecycleErrors: []
    };

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
        `${Math.round(performance.now() - timingStart)}ms`
      );
    };

    const runEngine = async (
      engine,
      methods = [],
      fallback = {},
      inputState = summary
    ) => {
      if (!engine) return fallback;

      for (const method of methods) {
        if (typeof engine[method] !== "function") continue;

        try {
          const result = await engine[method](inputState);
          return result || fallback;
        } catch (error) {
          console.error("Ari pipeline engine error:", method, error);

          return {
            ...fallback,
            error: error?.message || String(error),
            failedMethod: method,
            engineVersion: engine?.version || null
          };
        }
      }

      return fallback;
    };

    mark("normalizeInput complete");

    mark("before loadThreadState");
    summary = await this.loadThreadState(summary);
    mark("after loadThreadState");

    summary = this.preserveDeveloperEvidence(summary);
    summary = this.preserveMealEstimate(summary);

    const layerRuntime = {
      mark,
      runEngine,

      preserveDeveloperEvidence: state =>
        this.preserveDeveloperEvidence(state),

      preserveMealEstimate: state =>
        this.preserveMealEstimate(state),

      runDeveloperLayer: state =>
        this.runDeveloperLayer(state),

      applyContractBridge: state =>
        this.applyContractBridge(state),

      buildFallbackComposerPacket: state =>
        this.buildFallbackComposerPacket(state),

      saveFinalThreadState: state =>
        this.saveFinalThreadState(state),

      saveAriConversationHistory: state =>
        this.saveAriConversationHistory(state),

      addCandidateDraft: (existing, candidate) =>
        this.addCandidateDraft(existing, candidate),

      isUsableBlueprintDraft: (draft, state) =>
        this.isUsableBlueprintDraft(draft, state)
    };

    const layers = [
      {
        name: "perception",
        label: "perceptionPipeline",
        pipeline: window.AriPerceptionPipeline
      },
      {
        name: "executiveRouting",
        label: "executiveRoutingPipeline",
        pipeline: window.AriExecutiveRoutingPipeline
      },
      {
        name: "deliberation",
        label: "deliberationPipeline",
        pipeline: window.AriDeliberationPipeline
      },
      {
        name: "expression",
        label: "expressionPipeline",
        pipeline: window.AriExpressionPipeline
      },
      {
        name: "delivery",
        label: "deliveryPipeline",
        pipeline: window.AriDeliveryPipeline
      }
    ];

    for (const layer of layers) {
      mark(`before ${layer.label}`);

      summary = await this.runPipelineLayer({
        name: layer.name,
        pipeline: layer.pipeline,
        summary,
        runtime: layerRuntime
      });

      mark(`after ${layer.label}`);
    }

    summary = {
      ...summary,

      rebirthPipelineRan: true,
      rebirthPipelineSource: "ari-rebirth-pipeline",
      rebirthPipelineVersion: this.version,
      pipelineArchitecture: "five-layer",

      pipelineLayers: {
        perception: summary.perceptionPipelineRan === true,
        executiveRouting: summary.executiveRoutingPipelineRan === true,
        deliberation: summary.deliberationPipelineRan === true,
        expression: summary.expressionPipelineRan === true,
        delivery: summary.deliveryPipelineRan === true
      }
    };

    summary.pipelineLifecycleComplete =
      Object.values(summary.pipelineLayers).every(Boolean);

    this.debugLog(summary);
    finishTiming();

    summary.pipelineTiming = timing;
    summary.pipelineTimingStart = timingStart;

    return summary;
  },

  async runPipelineLayer({
    name = "unknown",
    pipeline = null,
    summary = {},
    runtime = {}
  } = {}) {
    if (!pipeline || typeof pipeline.run !== "function") {
      const error = {
        layer: name,
        error: "pipeline_not_loaded",
        message: `The ${name} pipeline was not loaded.`
      };

      console.error("Ari pipeline layer missing:", error);

      return {
        ...summary,
        [`${name}PipelineRan`]: false,
        [`${name}PipelineSource`]: "not-loaded",
        [`${name}PipelineError`]: error.message,
        pipelineLifecycleErrors: [
          ...(summary.pipelineLifecycleErrors || []),
          error
        ]
      };
    }

    try {
      const result = await pipeline.run(summary, runtime);

      if (!result || typeof result !== "object") {
        const error = {
          layer: name,
          error: "invalid_pipeline_result",
          message: `The ${name} pipeline returned an invalid result.`
        };

        return {
          ...summary,
          [`${name}PipelineRan`]: false,
          [`${name}PipelineSource`]: "invalid-result",
          [`${name}PipelineError`]: error.message,
          pipelineLifecycleErrors: [
            ...(summary.pipelineLifecycleErrors || []),
            error
          ]
        };
      }

      return {
        ...result,
        pipelineLifecycleErrors:
          result.pipelineLifecycleErrors ||
          summary.pipelineLifecycleErrors ||
          []
      };
    } catch (error) {
      console.error(`Ari ${name} pipeline error:`, error);

      return {
        ...summary,
        [`${name}PipelineRan`]: false,
        [`${name}PipelineSource`]: "pipeline-error",
        [`${name}PipelineError`]: error?.message || String(error),
        pipelineLifecycleErrors: [
          ...(summary.pipelineLifecycleErrors || []),
          {
            layer: name,
            error: "pipeline_execution_failed",
            message: error?.message || String(error)
          }
        ]
      };
    }
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
      normalizedMessage: String(userMessage).toLowerCase().trim()
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
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const wantsMealLog = /\b(log|add|save|track)\b/i.test(text);

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

    const priorMealEstimate = wantsMealLog
      ? (
          summary.lastMealEstimate ||
          summary.appContext?.lastMealEstimate ||
          summary.threadState?.lastMealEstimate ||
          null
        )
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

      contextLane:
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      responseShape:
        summary.responseShape ||
        summary.mouthResponsePattern ||
        "clear_explanation",

      responseGoal: summary.responseGoal || null,
      responseOrder: summary.responseOrder || [],

      responseRules:
        summary.responseRules ||
        summary.responseConstraints ||
        [],

      responseConstraints: summary.responseConstraints || [],
      requiredBehaviors: summary.responseRequired || [],
      forbiddenBehaviors: summary.responseAvoid || [],
      responseAvoid: summary.responseAvoid || [],
      responseRequired: summary.responseRequired || [],

      expressionPlan: summary.expressionPlan || null,
      blueprintHint: summary.blueprintHint || null,

      mouthDirective:
        summary.situationContract?.mouthDirective ||
        summary.mouthDirective ||
        summary.mouthDirector ||
        null,

      meaningInterpretation: summary.meaningInterpretation || null,
      humanState: summary.humanState || null,

      responsePlan:
        summary.ariResponsePlan ||
        summary.understandingResponsePlan ||
        summary.responsePlan ||
        null,

      responseStrategy: summary.responseStrategy || null,
      communicationPlan: summary.communicationPlan || null,
      composerDirective: summary.composerDirective || null,
      humanLanguageProfile: summary.humanLanguageProfile || {},

      thesis: {
        value: summary.primarySituationThesis || null,
        narrative: summary.situationNarrative || null,
        recommendedUse:
          summary.thesisRecommendedUse ||
          "do_not_use_as_authority"
      },

      safety: {
        gate: summary.safetyContextGate || null,
        deepReview: summary.deepSafetyResult || null,
        disposition: summary.safetyDisposition || null,
        risk: summary.situationContract?.risk || null,
        clarity: summary.situationContract?.clarity || null
      },

      developerPacket: summary.composerDeveloperPacket || null,

      character:
        summary.composerCharacter ||
        summary.characterHandoff ||
        summary.characterExpression?.composerCharacter ||
        summary.characterExpression?.composerCharacterPacket ||
        null,

      languageGuidance:
        summary.languageGuidanceHandoff ||
        null,

      hasDeveloperPacket:
        summary.composerDeveloperPacket?.enabled === true,

      perceptionPacket: summary.perceptionPacket || null,
      executivePacket: summary.executivePacket || null,
      deliberationPacket: summary.deliberationPacket || null,

      evidence: {
        github: summary.githubEvidence || null,
        developerPacket: summary.composerDeveloperPacket || null,

        developerHandoff:
          summary.developerHandoff ||
          summary.unlockedDeveloperHandoff ||
          null,

        developerResponse: summary.developerResponse || null,
        developerReply: summary.developerReply || null,

        memory: {
          retrieval: summary.memoryRetrieval || null,
          context: summary.memoryContext || null,
          facts:
            summary.memoryFacts ||
            summary.usableMemories ||
            []
        },

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

        recentMessages:
          threadState.lastMessages ||
          [],

        workingContext:
          threadState.continuitySummary ||
          threadState.currentTopic ||
          null,

        activeTopic:
          threadState.currentTopic ||
          null,

        conversationMeaningHistory:
          threadState.conversationMeaningHistory ||
          [],

        latestConversationMeaning:
          threadState.latestConversationMeaning ||
          null,

        activeSemanticTimeline:
          threadState.activeSemanticTimeline ||
          [],

        activeSemanticFrame:
          threadState.activeSemanticFrame ||
          null,

        conversationMeaningFocus:
          threadState.conversationMeaningFocus ||
          null,

        conversationMeaningOpenLoops:
          threadState.conversationMeaningOpenLoops ||
          [],

        lastMealEstimate:
          threadState.lastMealEstimate ||
          null,

        mealEstimate:
          summary.mealEstimate ||
          null,

        priorMeaningForFollowUp:
          threadState.latestConversationMeaning ||
          null
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
      summary.routingContract?.run?.developer === true ||
      summary.routingContract?.mode === "developer" ||
      summary.conversationFunction?.developerArtifactRequest === true ||
      summary.artifactModificationRequest === true ||
      summary.artifactCreationRequest === true ||
      summary.artifactInvestigationRequest === true ||
      summary.developerArtifactRequest === true ||
      summary.primaryFunction === "developer_artifact_request" ||
      summary.primaryFunction === "build_or_debug_request" ||
      summary.situationContractPrimary === "builder" ||
      summary.situationContractPrimary === "developer_artifact" ||
      /\b(code|file|github|repo|commit|patch|function|html|css|javascript|api|engine|bug|fix|update|edit|build|implement|developer|composer|pipeline|latency|slow|bottleneck|performance|diagnose)\b/i.test(
        text
      );

    if (!isDeveloperRequest) return summary;

    const mark = label => {
      if (!summary.debugTiming || !Array.isArray(summary.pipelineTiming)) {
        return;
      }

      const start =
        typeof summary.pipelineTimingStart === "number"
          ? summary.pipelineTimingStart
          : performance.now();

      summary.pipelineTiming.push({
        label,
        ms: Math.round(performance.now() - start)
      });
    };

    const run = async (key, engine, methods = []) => {
      mark(`before ${key}`);

      let result = null;

      if (engine) {
        for (const method of methods) {
          if (typeof engine[method] !== "function") continue;

          try {
            result = await engine[method](summary);
          } catch (error) {
            console.error("Developer engine error:", method, error);

            result = {
              error: error?.message || String(error)
            };
          }

          break;
        }
      }

      mark(`after ${key}`);

      if (result) {
        const rebirthKey =
          `rebirth${key.charAt(0).toUpperCase()}${key.slice(1)}`;

        summary = {
          ...summary,
          [key]: result,
          [rebirthKey]: result,
          ...result,
          pipelineTiming: summary.pipelineTiming,
          pipelineTimingStart: summary.pipelineTimingStart
        };
      }

      return result;
    };

    const developerChain = [
      [
        "developerUnderstanding",
        window.AriRebirthDeveloperUnderstandingEngine,
        ["understand"]
      ],
      [
        "projectKnowledgeGraph",
        window.AriRebirthProjectKnowledgeGraphEngine,
        ["build"]
      ],
      [
        "capabilityRegistry",
        window.AriRebirthCapabilityRegistryEngine,
        ["inspect"]
      ],
      [
        "architecture",
        window.AriRebirthArchitectureEngine,
        ["design"]
      ],
      [
        "uiLayoutPlanner",
        window.AriRebirthUILayoutPlannerEngine,
        ["plan"]
      ],
      [
        "bugDiagnosis",
        window.AriRebirthBugDiagnosisEngine,
        ["diagnose"]
      ],
      [
        "executionPlanner",
        window.AriRebirthExecutionPlannerEngine,
        ["plan"]
      ],
      [
        "codeEvidence",
        window.AriRebirthCodeEvidenceEngine,
        ["build"]
      ],
      [
        "codeUnderstanding",
        window.AriRebirthCodeUnderstandingEngine,
        ["understand"]
      ],
      [
        "patchDecision",
        window.AriRebirthPatchDecisionEngine,
        ["decide"]
      ],
      [
        "patchValidation",
        window.AriRebirthPatchValidationEngine,
        ["validate"]
      ],
      [
        "developerHandoff",
        window.AriRebirthDeveloperHandoffEngine,
        ["handoff", "create", "build"]
      ]
    ];

    for (const [key, engine, methods] of developerChain) {
      await run(key, engine, methods);
    }

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

      summary.responseLocked =
        summary.developerResponseLocked;

      if (summary.developerResponseLocked) {
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
    const contract =
      summary.situationContract ||
      {};

    const map =
      summary.situationMap ||
      {};

    const triage =
      summary.triage ||
      summary.ariTriage ||
      {};

    const routing =
      summary.routingContract ||
      {};

    const routingAuthoritative =
      routing.authority?.authoritative === true;

    const safetyOverride =
      summary.safetyDisposition?.shouldStopNormalResponse === true;

    const primary = safetyOverride
      ? (
          summary.safetyRequiredPlanner ||
          contract.primary ||
          triage.primaryLane ||
          "immediate_safety_response"
        )
      : routingAuthoritative && routing.primaryLane
        ? routing.primaryLane
        : (
            contract.primary ||
            triage.primaryLane ||
            summary.primaryLaneSuggestion ||
            summary.situationContractPrimary ||
            summary.primaryLane ||
            "general_understanding"
          );

    const routedResponseShape =
      routingAuthoritative && !safetyOverride
        ? routing.responseShape
        : null;

    return {
      ...summary,
      contractBridgeRan: true,
      contractBridgeSource: "ari-rebirth-pipeline",
      situationContract: contract,

      contextLane:
        routing.contextLane ||
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      primaryLane: primary,
      triagePrimaryLane: triage.primaryLane || null,
      situationContractPrimary: primary,

      responseShape:
        routedResponseShape ||
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
      return {
        ...summary,
        threadSaveRan: false,
        threadSaveSource: "not-loaded",
        threadSaveReason: "thread_store_not_available"
      };
    }

    const previousThread =
      summary.threadState ||
      {};

    const userMessage =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const previousMessages =
      Array.isArray(previousThread.lastMessages)
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
        ? `User said: ${userMessage}. Ari answered: ${String(
            summary.finalResponse
          ).slice(0, 300)}`
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

      previousAnswerSummary: summary.finalResponse
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

      lastUpdatedAt:
        new Date().toISOString()
    };

    try {
      await window.AriThreadStore.save(threadState);

      return {
        ...summary,
        threadSaveRan: true,
        threadSaveSource: "ari-thread-store",
        threadState
      };
    } catch (error) {
      console.error("Ari thread-state save failed:", error);

      return {
        ...summary,
        threadSaveRan: false,
        threadSaveSource: "save-error",
        threadSaveError: error?.message || String(error)
      };
    }
  },

  addCandidateDraft(existing = [], candidate = {}) {
    const text =
      String(candidate.text || "")
        .trim();

    const current =
      Array.isArray(existing)
        ? existing
        : [];

    if (!text) return current;

    const duplicate =
      current.some(item =>
        String(item?.text || "").trim() === text &&
        item?.source === candidate.source
      );

    if (duplicate) return current;

    return [
      ...current,
      {
        ...candidate,
        text,
        createdAt: candidate.createdAt || Date.now()
      }
    ];
  },

  isUsableBlueprintDraft(draft = "", summary = {}) {
    const text =
      String(draft)
        .trim();

    if (text.length < 20) return false;

    const lower = text.toLowerCase();

    const internalPhrases = [
      "answer the direct question",
      "explain only enough",
      "don’t turn every answer",
      "don't turn every answer",
      "blueprint writer",
      "the user is asking",
      "the simplest way to think about it is"
    ];

    if (internalPhrases.some(phrase => lower.includes(phrase))) {
      return false;
    }

    const question =
      String(
        summary.resolvedUserQuestion ||
        summary.userMessage ||
        ""
      ).trim();

    return !question || text !== question;
  },

  saveAriConversationHistory(summary = {}) {
    try {
      const userMessage =
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "";

      const ariReply =
        summary.finalResponse ||
        summary.selectedDraft ||
        summary.aiWriterDraft ||
        summary.blueprintWriterDraft ||
        "";

      if (!userMessage || !ariReply) {
        return {
          saved: false,
          source: "local-storage",
          reason: "missing_user_message_or_reply"
        };
      }

      const history =
        JSON.parse(
          localStorage.getItem("ariConversationHistory") ||
          "[]"
        );

      const createdAt =
        new Date().toISOString();

      history.push({
        id: Date.now(),
        title: String(userMessage).slice(0, 80),
        preview: String(ariReply).slice(0, 180),

        messages: [
          {
            role: "user",
            content: userMessage,
            created_at: createdAt
          },
          {
            role: "ari",
            content: ariReply,
            emotion: summary.emotion || null,
            created_at: createdAt
          }
        ],

        created_at: createdAt
      });

      const retainedHistory =
        history.slice(-100);

      localStorage.setItem(
        "ariConversationHistory",
        JSON.stringify(retainedHistory)
      );

      return {
        saved: true,
        source: "local-storage",
        historyCount: retainedHistory.length
      };
    } catch (error) {
      console.warn("Ari conversation history save failed:", error);

      return {
        saved: false,
        source: "local-storage",
        error: error?.message || String(error)
      };
    }
  },

  debugLog(summary = {}) {
    console.log(
      "===== ARI REBIRTH PIPELINE =====",
      this.version
    );

    console.log("===== PIPELINE ARCHITECTURE =====", {
      architecture: summary.pipelineArchitecture,
      complete: summary.pipelineLifecycleComplete,
      layers: summary.pipelineLayers,
      lifecycleErrors: summary.pipelineLifecycleErrors || []
    });

    console.log("===== PERCEPTION PACKET =====", summary.perceptionPacket);
    console.log("===== EXECUTIVE PACKET =====", summary.executivePacket);
    console.log("===== ROUTING CONTRACT =====", summary.routingContract);
    console.log("===== DELIBERATION PACKET =====", summary.deliberationPacket);
    console.log("===== EXPRESSION PACKET =====", summary.expressionPacket);
    console.log("===== DELIVERY PACKET =====", summary.deliveryPacket);

    console.log("===== PIPELINE LAYER ERRORS =====", {
      lifecycle: summary.pipelineLifecycleErrors || [],
      deliberation: summary.deliberationStageErrors || [],
      expression: summary.expressionStageErrors || [],
      delivery: summary.deliveryStageErrors || []
    });

    console.log("===== SAFETY =====", {
      earlyGate: summary.safetyContextGate,
      eligibility: summary.safetyEligibility,
      deepSafety: summary.deepSafetyResult,
      disposition: summary.safetyDisposition
    });

    console.log("===== ROUTING =====", {
      laneSplit: summary.laneSplit,
      contextLane: summary.contextLane,
      primaryLane: summary.primaryLane,
      applicability: summary.routingApplicability
    });

    console.log("===== CONTINUITY =====", {
      packet: summary.continuityPacket,
      resolvedQuestion: summary.resolvedUserQuestion
    });

    console.log("===== SITUATION =====", {
      map: summary.situationMap,
      triage: summary.triage,
      multiLanePlan: summary.multiLanePlan,
      contract: summary.situationContract
    });

    console.log("===== REASONING =====", {
      cognitiveExecutive: summary.cognitiveExecutive,
      reasoning: summary.reasoning,

      developer:
        summary.developerHandoff ||
        summary.unlockedDeveloperHandoff ||
        summary.developerUnderstanding
    });

    console.log("===== MEMORY =====", {
      retrieval: summary.memoryRetrieval,
      context: summary.memoryContextResult || summary.memoryContext,
      facts: summary.memoryFacts
    });

    console.log("===== UNDERSTANDING =====", {
      language: summary.languageUnderstanding,
      semantic: summary.semanticUnderstanding,
      event: summary.eventUnderstanding,
      meaning: summary.meaningInterpretation,
      humanState: summary.humanState
    });

    console.log("===== EXPRESSION =====", {
      character: summary.characterHandoff,
      languageGuidance: summary.languageGuidanceHandoff,
      responseStrategy: summary.responseStrategy,
      composerPacket: summary.composerPacket,
      blueprintWriter: summary.blueprintWriter,
      aiWriter: summary.aiWriter,
      selectedDraft: summary.selectedDraft
    });

    console.log("===== DELIVERY =====", {
      actions: summary.actionHandoff,
      persistence: summary.learningPersistenceHandoff,
      diagnostics: summary.deliveryDiagnostics
    });

    console.log("===== FINAL RESPONSE =====", summary.finalResponse);

    console.log("===== GITHUB EVIDENCE =====", {
      available: summary.githubEvidenceAvailable,
      filePath: summary.githubEvidence?.filePath,
      contentLength: summary.githubEvidence?.contentLength,

      preview:
        summary.githubEvidence?.contentPreview?.slice(0, 300) ||
        null
    });
  }
};

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline?.version
);