// ari/pipeline-stages/deliberation/ari-reasoning-stage.js
// Ari Reasoning Deliberation Stage
//
// Purpose:
//   Coordinate cognitive executive routing,
//   developer evidence gathering,
//   OpenAI cognitive reasoning,
//   reasoning-result validation,
//   and downstream response-control requirements.
//
// V2.0.0 — OpenAI Cognitive Reasoning Orchestration
//
// Authority model:
//
//   Cognitive Executive:
//   - decides which reasoning resources should run
//   - activates specialist capabilities
//   - adds advisory requirements
//
//   Developer Layer:
//   - gathers specialist technical evidence
//   - may produce authoritative technical findings
//   - should not normally own final response language
//
//   AriReasoningEngine / OpenAI:
//   - interprets user meaning
//   - builds the semantic frame
//   - analyzes evidence
//   - proposes actions
//   - defines response strategy
//   - may draft response language
//
//   AriReasoningStage:
//   - coordinates these systems
//   - validates state transitions
//   - does not execute actions
//   - does not override safety
//   - does not write final delivery language

window.Ari = window.Ari || {};

window.AriReasoningStage = {
  version: "2.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback,

      preserveDeveloperEvidence =
        state => state,

      runDeveloperLayer =
        async state => state,

      applyContractBridge =
        state => state
    } = runtime;

    let state = {
      ...summary,

      activeDeliberationStage:
        "reasoning"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const reasoningEligibility =
      this.resolveReasoningEligibility({
        state,
        runInstructions
      });

    state = {
      ...state,

      reasoningEligibility,

      shouldRunCognitiveExecutive:
        reasoningEligibility
          .runCognitiveExecutive,

      shouldRunDeveloperLayer:
        reasoningEligibility
          .runDeveloper,

      shouldRunHeavyReasoning:
        reasoningEligibility
          .runGeneralReasoning
    };

    // =================================================
    // 1. Cognitive Executive
    // =================================================

    mark(
      "before cognitiveExecutive"
    );

    const cognitiveExecutiveResult =
      reasoningEligibility
        .runCognitiveExecutive
        ? await runEngine(
            window.AriCognitiveExecutive,

            ["plan"],

            {
              ariExecutiveRan:
                false,

              ariExecutiveVersion:
                null,

              cognitiveExecutive: {
                source:
                  "not-loaded",

                authority:
                  "none",

                activate:
                  [],

                requires:
                  {},

                requiredBehaviors:
                  [],

                forbiddenBehaviors:
                  [],

                constraints:
                  [],

                reason:
                  "cognitive_executive_not_loaded"
              }
            },

            {
              ...state,

              reasoningStageInput:
                this.buildReasoningStageInput(
                  state
                )
            }
          )
        : {
            ariExecutiveRan:
              false,

            ariExecutiveVersion:
              null,

            cognitiveExecutive: {
              source:
                "skipped-by-executive-routing",

              authority:
                "none",

              activate:
                [],

              requires:
                {},

              requiredBehaviors:
                [],

              forbiddenBehaviors:
                [],

              constraints:
                [],

              reason:
                "cognitive_executive_not_required"
            }
          };

    state = {
      ...state,

      ...this.pickCognitiveExecutiveFields(
        cognitiveExecutiveResult
      ),

      cognitiveExecutive:
        cognitiveExecutiveResult
          .cognitiveExecutive ||
        state.cognitiveExecutive ||
        null,

      ariExecutiveRan:
        cognitiveExecutiveResult
          .ariExecutiveRan === true,

      ariExecutiveVersion:
        cognitiveExecutiveResult
          .ariExecutiveVersion ||
        state.ariExecutiveVersion ||
        null
    };

    mark(
      "after cognitiveExecutive"
    );

    // =================================================
    // 2. Developer Layer
    // =================================================

    const shouldRunDeveloper =
      reasoningEligibility
        .runDeveloper ||
      state.cognitiveExecutive
        ?.activate
        ?.includes?.(
          "developer"
        ) ||
      state.cognitiveExecutive
        ?.requires
        ?.developer === true;

    state = {
      ...state,

      shouldRunDeveloperLayer:
        shouldRunDeveloper
    };

    mark(
      "before runDeveloperLayer"
    );

    state =
      shouldRunDeveloper
        ? await runDeveloperLayer(
            state
          )
        : {
            ...state,

            developerLayerRan:
              false,

            developerLayerSource:
              "skipped-by-executive-routing",

            developerLayerSkipReason:
              "developer_path_not_required"
          };

    mark(
      "after runDeveloperLayer"
    );

    state =
      preserveDeveloperEvidence(
        state
      );

    state =
      applyContractBridge(
        state
      );

    // =================================================
    // 3. Developer response-lock handling
    // =================================================

    const developerResponseLocked =
      this.resolveDeveloperResponseLock(
        state
      );

    if (
      !developerResponseLocked &&
      state.developerHandoff
    ) {
      state = {
        ...state,

        unlockedDeveloperHandoff:
          state.developerHandoff,

        developerIntent:
          state.developerIntent ||
          state.developerHandoff
            ?.developerIntent ||
          null,

        composerDeveloperPacket:
          state.developerHandoff
            ?.composerDeveloperPacket ||
          state.composerDeveloperPacket ||
          null,

        developerHandoff:
          null,

        developerResponse:
          null,

        finalResponse:
          null,

        responseLocked:
          false,

        developerResponseLocked:
          false
      };
    } else {
      state = {
        ...state,

        developerResponseLocked
      };
    }

    // =================================================
    // 4. OpenAI Cognitive Reasoning
    // =================================================

    const shouldRunGeneralReasoning =
      reasoningEligibility
        .runGeneralReasoning &&
      developerResponseLocked !== true;

    state = {
      ...state,

      shouldRunHeavyReasoning:
        shouldRunGeneralReasoning
    };

    const reasoningStageInput =
      this.buildReasoningStageInput(
        state
      );

    mark(
      "before AriReasoningEngine"
    );

    const reasoningResult =
      shouldRunGeneralReasoning
        ? await runEngine(
            window.AriReasoningEngine,

            [
              "reason",
              "create"
            ],

            this.buildReasoningFallback({
              reason:
                "reasoning_engine_not_loaded",

              source:
                "not-loaded",

              engineRan:
                false
            }),

            {
              ...state,

              reasoningStageInput
            }
          )
        : this.buildReasoningFallback({
            reason:
              developerResponseLocked
                ? "developer_response_already_locked"
                : "general_reasoning_not_required",

            source:
              developerResponseLocked
                ? "skipped-developer-response-locked"
                : "skipped-by-executive-routing",

            engineRan:
              false
          });

    mark(
      "after AriReasoningEngine"
    );

    // =================================================
    // 5. Controlled reasoning-result integration
    // =================================================

    const cognitiveReasoningResult =
      reasoningResult
        .cognitiveReasoningResult ||
      null;

    const reasoningEngineReady =
      cognitiveReasoningResult
        ?.ready === true;

    state = {
      ...state,

      cognitiveReasoningResult,

      reasoning:
        reasoningResult.reasoning ||
        {},

      semanticFrame:
        cognitiveReasoningResult
          ?.semanticFrame ||
        state.semanticFrame ||
        null,

      responseStrategy:
        cognitiveReasoningResult
          ?.responseStrategy ||
        state.responseStrategy ||
        null,

      modelDraftResponse:
        cognitiveReasoningResult
          ?.draftResponse ||
        "",

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningEngineRan:
        reasoningResult
          .reasoningEngineRan === true,

      reasoningEngineReady,

      reasoningEngineVersion:
        reasoningResult
          .reasoningEngineVersion ||
        null,

      reasoningSource:
        reasoningResult
          .reasoningSource ||
        reasoningResult.source ||
        "unknown",

      reasoningConfidence:
        cognitiveReasoningResult
          ?.confidence ??
        reasoningResult
          .reasoningConfidence ??
        null,

      reasoningPrimary:
        cognitiveReasoningResult
          ?.semanticFrame
          ?.primaryLane ||
        reasoningResult
          .reasoningPrimary ||
        state.primaryLane ||
        null,

      reasoningFailure:
        reasoningEngineReady
          ? null
          : {
              reason:
                reasoningResult.reason ||
                cognitiveReasoningResult
                  ?.validation
                  ?.errors
                  ?.[0] ||
                "reasoning_result_not_ready",

              errors:
                cognitiveReasoningResult
                  ?.validation
                  ?.errors ||
                reasoningResult.errors ||
                []
            }
    };

    // =================================================
    // 6. Normalize reasoning requirements
    // =================================================

    const reasoningRequirements =
      this.resolveReasoningRequirements(
        state
      );

    state = {
      ...state,

      reasoningRequirements,

      requiredCapabilities:
        this.mergeUnique(
          state.requiredCapabilities,

          reasoningRequirements
            .capabilities
        ),

      responseRequired:
        this.mergeUnique(
          state.responseRequired,

          reasoningRequirements
            .requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,

          reasoningRequirements
            .forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,

          reasoningRequirements
            .constraints
        )
    };

    // =================================================
    // 7. Reasoning Stage Packet
    // =================================================

    state.reasoningStageRan =
      true;

    state.reasoningStageReady =
      developerResponseLocked === true ||
      reasoningEngineReady === true;

    state.reasoningStageSource =
      "ari-reasoning-stage";

    state.reasoningStageVersion =
      this.version;

    state.reasoningStagePacket =
      this.buildReasoningStagePacket(
        state
      );

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveReasoningEligibility({
    state = {},
    runInstructions = {}
  } = {}) {
    const developerRequested =
      runInstructions.developer ===
        true ||
      state.shouldRunDeveloperLayer ===
        true ||
      state.routingContract
        ?.run
        ?.developer === true ||
      state.routingContract
        ?.mode === "developer";

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      state.safetyStagePacket
        ?.shouldStopNormalResponse ===
        true ||
      state.safetyStagePacket
        ?.safetyShouldStopNormalResponse ===
        true;

    const fastPath =
      runInstructions.fastPath ===
        true ||
      state.routingApplicability
        ?.fastPathEligible === true;

    const heavyReasoningRequested =
      runInstructions
        .heavyReasoning !== false &&
      state.shouldRunHeavyReasoning !==
        false;

    const routeNeedsReasoning =
      this.routeNeedsReasoning(
        state
      );

    const runCognitiveExecutive =
      developerRequested ||
      safetyOverride ||
      heavyReasoningRequested ||
      routeNeedsReasoning;

    const runGeneralReasoning =
      !safetyOverride &&
      (
        developerRequested ===
          false ||
        state.developerResponseLocked !==
          true
      ) &&
      (
        heavyReasoningRequested ||
        routeNeedsReasoning ||
        !fastPath
      );

    return {
      runCognitiveExecutive,

      runDeveloper:
        developerRequested,

      runGeneralReasoning,

      developerRequested,
      safetyOverride,
      fastPath,
      heavyReasoningRequested,
      routeNeedsReasoning,

      source:
        "ari-reasoning-stage-eligibility",

      reason:
        safetyOverride
          ? "safety_override_limits_general_reasoning"
          : developerRequested
            ? "developer_reasoning_requested"
            : runGeneralReasoning
              ? "general_reasoning_required"
              : "reasoning_fast_path"
    };
  },

  routeNeedsReasoning(summary = {}) {
    const capabilities =
      this.mergeUnique(
        summary.routingContract
          ?.capabilities,

        summary.requiredCapabilities
      );

    const reasoningCapabilities = [
      "causal_reasoning",
      "comparison_reasoning",
      "decision_analysis",
      "risk_analysis",
      "multi_step_reasoning",
      "code_debugging",
      "architecture_design",
      "planning",
      "problem_solving",
      "semantic_interpretation",
      "response_planning"
    ];

    if (
      capabilities.some(
        capability =>
          reasoningCapabilities
            .includes(
              capability
            )
      )
    ) {
      return true;
    }

    const mode =
      summary.routingContract
        ?.mode ||
      summary.conversationMode ||
      "";

    return [
      "decision_support",
      "planning",
      "developer",
      "medical",
      "emotional_support",
      "analysis",
      "comparison",
      "problem_solving"
    ].includes(
      mode
    );
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildReasoningStageInput(summary = {}) {
    const original =
      summary.turn
        ?.originalText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const effective =
      summary.turn
        ?.effectiveText ||
      summary.resolvedUserQuestion ||
      original;

    return {
      schema:
        "ari_cognitive_reasoning_request",

      schemaVersion:
        "1.0.0",

      request: {
        original,

        effective,

        // Compatibility alias during migration.
        resolved:
          effective,

        turnId:
          summary.turn
            ?.turnId ||
          summary.turnId ||
          null,

        currentTurnWasResolved:
          summary.currentTurnWasResolved ===
          true,

        language:
          summary.language ||
          summary.detectedLanguage ||
          null
      },

      conversation: {
        recentTurns:
          this.toArray(
            summary.conversationContext
              ?.recentTurns ||
            summary.recentTurns
          ),

        activeThreads:
          this.toArray(
            summary.activeThreads
          ),

        currentTopic:
          summary.currentTopic ||
          summary.conversationContext
            ?.currentTopic ||
          null,

        userContext:
          summary.userContext ||
          null,

        operatingState:
          summary
            .conversationOperatingState ||
          null
      },

      perception:
        summary.perceptionPacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      executive:
        summary.executivePacket ||
        null,

      continuity:
        summary.continuityStagePacket ||
        null,

      safety:
        summary.safetyStagePacket ||
        null,

      situation:
        summary.situationStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      understanding:
        summary.understandingStagePacket ||
        null,

      responseControl: {
        contextLane:
          summary.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          summary.routingContract
            ?.primaryLane ||
          null,

        responseShape:
          summary.responseShape ||
          summary.routingContract
            ?.responseShape ||
          null,

        rules:
          this.toArray(
            summary.responseRules
          ),

        constraints:
          this.toArray(
            summary.responseConstraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid
          ),

        blocked:
          this.toArray(
            summary.blocked
          )
      },

      capabilities: {
        available:
          this.toArray(
            summary.availableCapabilities
          ),

        required:
          this.toArray(
            summary.requiredCapabilities
          ),

        tools:
          summary.toolAvailability ||
          summary.availableTools ||
          null
      },

      developerEvidence: {
        github:
          summary.githubEvidence ||
          null,

        fileContext:
          summary.githubFileContext ||
          null,

        investigation:
          summary.developerInvestigation ||
          null,

        developerIntent:
          summary.developerIntent ||
          null,

        handoff:
          summary.developerHandoff ||
          summary.unlockedDeveloperHandoff ||
          null,

        composerPacket:
          summary.composerDeveloperPacket ||
          null
      },

      authority: {
        safetyIsBinding:
          true,

        routingIsBinding:
          true,

        responseConstraintsAreBinding:
          true,

        upstreamSemanticSignalsAreAdvisory:
          true,

        mayInterpretMeaning:
          true,

        mayResolveAmbiguity:
          true,

        mayBuildSemanticFrame:
          true,

        mayAnalyzeEvidence:
          true,

        mayPlanResponse:
          true,

        mayDraftResponse:
          true,

        mayProposeActions:
          true,

        mayExecuteActions:
          false,

        mayPersistState:
          false,

        mayOverrideSafety:
          false,

        mayClaimToolSuccess:
          false,

        mayExposePrivateChainOfThought:
          false
      },

      // Optional injected client.
      openAIReasoningInvoker:
        summary.openAIReasoningInvoker ||
        null
    };
  },

  // ===================================================
  // Reasoning requirements
  // ===================================================

  resolveReasoningRequirements(
    summary = {}
  ) {
    const executive =
      summary.cognitiveExecutive ||
      {};

    const reasoning =
      summary.reasoning ||
      {};

    const responseStrategy =
      summary.cognitiveReasoningResult
        ?.responseStrategy ||
      reasoning.responseStrategy ||
      {};

    return {
      capabilities:
        this.mergeUnique(
          executive.activate,

          reasoning.capabilities,

          reasoning
            .requiredCapabilities
        ),

      requiredBehaviors:
        this.mergeUnique(
          executive
            .requiredBehaviors,

          reasoning
            .requiredBehaviors,

          responseStrategy
            .requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          executive
            .forbiddenBehaviors,

          reasoning
            .forbiddenBehaviors,

          responseStrategy
            .forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          executive.constraints,

          reasoning.constraints,

          responseStrategy.constraints
        ),

      requires:
        this.objectOrEmpty(
          executive.requires
        ),

      authority:
        summary.cognitiveReasoningResult
          ?.authority ||
        executive.authority ||
        "advisory"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildReasoningStagePacket(
    summary = {}
  ) {
    const developerReady =
      summary.developerResponseLocked ===
      true;

    const cognitiveReady =
      summary.cognitiveReasoningResult
        ?.ready === true;

    const ready =
      developerReady ||
      cognitiveReady;

    return {
      ready,

      ran:
        summary.reasoningStageRan ===
        true,

      source:
        "ari-reasoning-stage",

      version:
        this.version,

      eligibility:
        summary.reasoningEligibility ||
        null,

      cognitiveExecutive: {
        ran:
          summary.ariExecutiveRan ===
          true,

        version:
          summary.ariExecutiveVersion ||
          null,

        value:
          summary.cognitiveExecutive ||
          null
      },

      developer: {
        applicable:
          summary
            .shouldRunDeveloperLayer ===
          true,

        ran:
          summary.developerLayerRan ===
          true,

        responseLocked:
          summary
            .developerResponseLocked ===
          true,

        intent:
          summary.developerIntent ||
          null,

        handoff:
          summary.developerHandoff ||
          summary
            .unlockedDeveloperHandoff ||
          null,

        composerPacket:
          summary
            .composerDeveloperPacket ||
          null,

        evidence: {
          github:
            summary.githubEvidence ||
            null,

          fileContext:
            summary.githubFileContext ||
            null,

          investigation:
            summary
              .developerInvestigation ||
            null
        }
      },

      generalReasoning: {
        applicable:
          summary
            .shouldRunHeavyReasoning ===
          true,

        ran:
          summary.reasoningEngineRan ===
          true,

        ready:
          summary.reasoningEngineReady ===
          true,

        version:
          summary.reasoningEngineVersion ||
          null,

        source:
          summary.reasoningSource ||
          null,

        cognitiveReasoningResult:
          summary
            .cognitiveReasoningResult ||
          null,

        compatibilityValue:
          summary.reasoning ||
          {},

        semanticFrame:
          summary.semanticFrame ||
          null,

        responseStrategy:
          summary.responseStrategy ||
          null,

        draftResponse:
          summary.modelDraftResponse ||
          "",

        confidence:
          summary.reasoningConfidence ??
          null,

        requirements:
          summary.reasoningRequirements ||
          null,

        failure:
          summary.reasoningFailure ||
          null
      },

      responseControl: {
        requiredCapabilities:
          this.toArray(
            summary.requiredCapabilities
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid
          ),

        constraints:
          this.toArray(
            summary.responseConstraints
          )
      },

      authority: {
        canCoordinateCognition:
          true,

        canRunDeveloperAnalysis:
          true,

        canInvokeAuthoritativeReasoning:
          true,

        canInterpretMeaning:
          true,

        canBuildSemanticFrame:
          true,

        canDefineResponseStrategy:
          true,

        canDraftResponse:
          true,

        canProposeActions:
          true,

        canExecuteActions:
          false,

        canAddReasoningConstraints:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalDeliveryLanguage:
          false,

        canPersistState:
          false,

        role:
          "cognitive_reasoning_orchestration"
      }
    };
  },

  // ===================================================
  // Fallbacks
  // ===================================================

  buildReasoningFallback({
    reason =
      "reasoning_unavailable",

    source =
      "unknown",

    engineRan =
      false
  } = {}) {
    return {
      reasoningEngineRan:
        engineRan,

      reasoningEngineReady:
        false,

      reasoningEngineVersion:
        null,

      reasoningSource:
        source,

      cognitiveReasoningResult: {
        schema:
          "ari_cognitive_reasoning_result",

        schemaVersion:
          "1.0.0",

        ready:
          false,

        authoritative:
          false,

        interpretation:
          {},

        reasoningDecision: {
          answerDirectly:
            false,

          reasoningMode:
            "clarification",

          toolsNeeded:
            [],

          proposedActions:
            []
        },

        semanticFrame:
          {},

        caseModel:
          {},

        options:
          [],

        tradeoffs:
          [],

        uncertainties:
          [],

        responseStrategy:
          {},

        draftResponse:
          "",

        grounding: {
          evidenceUsed:
            [],

          assumptions:
            [],

          unresolvedConflicts:
            []
        },

        confidence:
          0,

        validation: {
          passed:
            false,

          errors: [
            reason
          ]
        },

        source,

        authority:
          "none"
      },

      reasoning:
        {},

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningConfidence:
        0,

      reasoningPrimary:
        null,

      authority:
        "none",

      reason
    };
  },

  // ===================================================
  // Developer response-lock resolution
  // ===================================================

  resolveDeveloperResponseLock(
    state = {}
  ) {
    return Boolean(
      state.responseLocked ===
        true ||
      state.developerResponseLocked ===
        true ||
      state.developerHandoff
        ?.responseLocked === true ||
      state.developerHandoff
        ?.developerResponseLocked ===
        true
    );
  },

  // ===================================================
  // Controlled field selection
  // ===================================================

  pickCognitiveExecutiveFields(
    result = {}
  ) {
    return {
      cognitiveExecutiveSource:
        result
          .cognitiveExecutiveSource ||
        result.source ||
        null,

      cognitiveExecutiveConfidence:
        result
          .cognitiveExecutiveConfidence ??
        null
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  objectOrEmpty(value) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  },

  toArray(value) {
    if (
      Array.isArray(value)
    ) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  mergeUnique(...values) {
    return [
      ...new Set(
        values.flatMap(
          value =>
            this.toArray(value)
        )
      )
    ];
  }
};

console.log(
  "ARI REASONING STAGE LOADED:",
  window.AriReasoningStage?.version
);