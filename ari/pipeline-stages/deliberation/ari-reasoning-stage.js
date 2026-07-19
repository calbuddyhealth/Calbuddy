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
// V2.2.1 — Reliable Engine Invocation
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
//   - defines semantic response requirements
//   - does not draft final response language
//
//   AriReasoningStage:
//   - coordinates these systems
//   - validates state transitions
//   - does not execute actions
//   - does not override safety
//   - does not write final delivery language

window.Ari = window.Ari || {};

window.AriReasoningStage = {
  version: "2.2.1",

  async run(summary = {}, runtime = {}) {
    const {
  mark = () => {},

  runEngine = null,

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
  reasoningEligibility.runCognitiveExecutive
    ? await this.invokeEngine({
        engine:
          window.AriCognitiveExecutive,

        methods: [
          "plan"
        ],

        input: {
          ...state,

          reasoningStageInput:
            this.buildReasoningStageInput(
              state
            )
        },

        runtime,

        runtimeInvoker:
          runEngine,

        fallback: {
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
        expectedResult:
  "cognitive_executive"
      })
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

    let reasoningResult;

if (
  shouldRunGeneralReasoning
) {
  try {
    reasoningResult =
  await this.invokeEngine({
    engine:
      window.AriReasoningEngine,

    methods: [
      "reason",
      "create"
    ],

    input: {
      ...state,

      reasoningStageInput,

      request:
        reasoningStageInput
    },

    runtime,

    runtimeInvoker:
      runEngine,
      
      expectedResult:
  "reasoning"
  });
  
  } catch (error) {
    console.error(
      "Ari Reasoning Engine invocation failed:",
      error
    );

    reasoningResult =
      this.buildReasoningFallback({
        reason:
          error?.message ||
          "reasoning_engine_invocation_failed",

        source:
          "reasoning-engine-error",

        engineRan:
          false
      });

    reasoningResult.invocationError = {
      message:
        error?.message ||
        String(error),

      name:
        error?.name ||
        "Error",

      stack:
        error?.stack ||
        null
    };
  }
} else {
  reasoningResult =
    this.buildReasoningFallback({
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
}

    mark(
      "after AriReasoningEngine"
    );

    // =================================================
    // 5. Controlled reasoning-result integration
    // =================================================

    const cognitiveReasoningResult =
      this.objectOrNull(
        reasoningResult
          ?.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.reasoningResult
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.result
          ?.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.result
          ?.reasoningResult
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.result
      ) ||
      null;

    const semanticFrame =
      this.objectOrNull(
        cognitiveReasoningResult
          ?.semanticFrame
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.semanticFrame
      ) ||
      null;

    const responseRequirements =
      this.objectOrNull(
        cognitiveReasoningResult
          ?.responseRequirements
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.responseRequirements
      ) ||
      null;

    const executionMetadata =
      this.objectOrNull(
        cognitiveReasoningResult
          ?.executionMetadata
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.executionMetadata
      ) ||
      null;

    const evidenceReferences =
      this.firstArray(
        cognitiveReasoningResult
          ?.evidenceReferences,

        reasoningResult
          ?.evidenceReferences
      );

    const modelInvocation =
      this.objectOrNull(
        cognitiveReasoningResult
          ?.modelInvocation
      ) ||
      this.objectOrNull(
        reasoningResult
          ?.modelInvocation
      ) ||
      null;

    const reasoningEngineReady =
      cognitiveReasoningResult
        ?.ready === true &&
      Boolean(
        semanticFrame
      ) &&
      Boolean(
        responseRequirements
      ) &&
      modelInvocation
        ?.succeeded !== false;

    state = {
      ...state,

reasoningEngineResult:
  reasoningResult ||
  null,

      cognitiveReasoningResult,

      reasoningResult:
        cognitiveReasoningResult,

      reasoning:
        reasoningResult
          ?.reasoning ||
        {},

      semanticFrame,

      aiSemanticFrame:
        semanticFrame,

      responseRequirements,

      executionMetadata,

      evidenceReferences,

      modelInvocation,

      responseStrategy:
        this.objectOrNull(
          cognitiveReasoningResult
            ?.responseStrategy
        ) ||
        this.objectOrNull(
          reasoningResult
            ?.responseStrategy
        ) ||
        state.responseStrategy ||
        null,

      modelDraftResponse:
        "",

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningEngineRan:
        reasoningResult
          ?.reasoningEngineRan ===
          true ||
        cognitiveReasoningResult
          ?.success === true ||
        modelInvocation
          ?.succeeded === true,

      reasoningEngineReady,

      reasoningEngineVersion:
        reasoningResult
          ?.reasoningEngineVersion ||
        null,

      reasoningSource:
        cognitiveReasoningResult
          ?.source ||
        reasoningResult
          ?.reasoningSource ||
        reasoningResult
          ?.source ||
        "unknown",

      reasoningConfidence:
        executionMetadata
          ?.confidence ??
        cognitiveReasoningResult
          ?.confidence ??
        reasoningResult
          ?.reasoningConfidence ??
        null,

      reasoningPrimary:
        semanticFrame
          ?.primaryLane ||
        semanticFrame
          ?.primaryIntent ||
        reasoningResult
          ?.reasoningPrimary ||
        state.primaryLane ||
        null,

      reasoningFailure:
        reasoningEngineReady
          ? null
          : {
              reason:
                reasoningResult
                  ?.reason ||
                cognitiveReasoningResult
                  ?.validation
                  ?.errors
                  ?.[0] ||
                (
                  !cognitiveReasoningResult
                    ? "cognitive_reasoning_result_missing"
                    : !semanticFrame
                      ? "semantic_frame_missing"
                      : !responseRequirements
                        ? "response_requirements_missing"
                        : modelInvocation
                            ?.succeeded === false
                          ? "model_invocation_failed"
                          : "reasoning_result_not_ready"
                ),

              errors:
                cognitiveReasoningResult
                  ?.validation
                  ?.errors ||
                reasoningResult
                  ?.errors ||
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

console.log(
  "ARI REASONING STAGE DIAGNOSTIC:",
  {
    execution:
      state.reasoningStagePacket
        ?.executionDiagnostic ||
      null,

    engineResult:
      state.reasoningEngineResult ||
      null,

    engineInvocation:
      state.reasoningEngineResult
        ?.engineInvocationDiagnostic ||
      null
  }
);

    return state;
  },

async invokeEngine({
  engine = null,
  methods = [],
  input = {},
  runtime = {},
  runtimeInvoker = null,
  fallback = null,
  expectedResult = null
} = {}) {
  let runtimeResult = null;
  let runtimeError = null;

  if (
    typeof runtimeInvoker ===
    "function"
  ) {
    try {
      runtimeResult =
        await runtimeInvoker(
          engine,
          methods,
          fallback,
          input
        );
    } catch (error) {
      runtimeError =
        error;
    }

    const runtimeResultValid =
      this.isValidEngineInvocationResult({
        result:
          runtimeResult,

        expectedResult
      });

    if (runtimeResultValid) {
      return runtimeResult;
    }

    console.warn(
      "ARI ENGINE RUNTIME INVOKER DID NOT PRODUCE A VALID RESULT:",
      {
        expectedResult,

        result:
          runtimeResult,

        error:
          runtimeError?.message ||
          null
      }
    );
  }

  if (
    !engine ||
    (
      typeof engine !==
        "object" &&
      typeof engine !==
        "function"
    )
  ) {
    if (fallback !== null) {
      return fallback;
    }

    throw new Error(
      "engine_not_loaded"
    );
  }

  const methodName =
    methods.find(
      method =>
        typeof engine[method] ===
          "function"
    );

  if (!methodName) {
    if (fallback !== null) {
      return fallback;
    }

    throw new Error(
      "engine_method_not_available"
    );
  }


console.log(
  "ARI ENGINE DIRECT INVOCATION:",
  {
    expectedResult,

    engineVersion:
      engine?.version ||
      null,

    methodName,

    effectiveText:
      input
        ?.reasoningStageInput
        ?.request
        ?.effective ||
      null
  }
);

  const directResult =
    await engine[
      methodName
    ].call(
      engine,
      input,
      runtime
    );

  if (
    !this.isValidEngineInvocationResult({
      result:
        directResult,

      expectedResult
    })
  ) {
    throw new Error(
      expectedResult ===
        "reasoning"
        ? "reasoning_engine_returned_invalid_result"
        : expectedResult ===
            "cognitive_executive"
          ? "cognitive_executive_returned_invalid_result"
          : "engine_returned_invalid_result"
    );
  }

  return directResult;
},

isValidEngineInvocationResult({
  result = null,
  expectedResult = null
} = {}) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return false;
  }

  if (
    expectedResult ===
    "reasoning"
  ) {
    const cognitiveResult =
      this.objectOrNull(
        result.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        result.reasoningResult
      ) ||
      this.objectOrNull(
        result.result
          ?.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        result.result
          ?.reasoningResult
      ) ||
      null;

    const semanticFrame =
      this.objectOrNull(
        cognitiveResult
          ?.semanticFrame
      ) ||
      this.objectOrNull(
        result.semanticFrame
      );

    const responseRequirements =
      this.objectOrNull(
        cognitiveResult
          ?.responseRequirements
      ) ||
      this.objectOrNull(
        result.responseRequirements
      );

    const modelInvocation =
      this.objectOrNull(
        cognitiveResult
          ?.modelInvocation
      ) ||
      this.objectOrNull(
        result.modelInvocation
      );

    const engineActuallyRan =
      result.reasoningEngineRan ===
        true ||
      cognitiveResult?.success ===
        true ||
      modelInvocation?.succeeded ===
        true;

    return Boolean(
      engineActuallyRan &&
      semanticFrame &&
      responseRequirements
    );
  }

  if (
    expectedResult ===
    "cognitive_executive"
  ) {
    return Boolean(
      result.ariExecutiveRan ===
        true ||
      (
        result.ariExecutiveVersion &&
        result.cognitiveExecutive &&
        result.cognitiveExecutive
          .source !== "not-loaded"
      )
    );
  }

  return true;
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

    buildReasoningStageInput(
    summary = {}
  ) {
    const evidencePacket =
      this.objectOrNull(
        summary.evidencePacket
      ) ||
      this.objectOrNull(
        summary.perceptionPacket
          ?.evidencePacket
      ) ||
      null;

    const original =
      this.firstNonEmptyString([
        summary.currentTurn
          ?.originalText,

        summary.turn
          ?.originalText,

        summary.originalUserMessage,

        summary.userMessage,

        summary.message,

        summary.input
      ]);

    const effective =
      this.firstNonEmptyString([
        summary.currentTurn
          ?.effectiveText,

        summary.turn
          ?.effectiveText,

        summary.effectiveUserMessage,

        summary.resolvedUserQuestion,

        summary.resolvedQuestion,

        original
      ]);

    const turnId =
      summary.currentTurn
        ?.turnId ||
      summary.turn
        ?.turnId ||
      summary.turnId ||
      null;

    const routingContract =
      this.objectOrNull(
        summary.routingContract
      ) ||
      this.objectOrNull(
        summary.executivePacket
          ?.routingContract
      ) ||
      null;

    return {
      schema:
        "ari_cognitive_reasoning_request",

      schemaVersion:
        "1.1.2",

      action:
        "openai_reasoning",

      /*
       * Canonical direct fields.
       * These are intentionally duplicated outside request
       * so the reasoning client and API do not need to
       * reinterpret the request envelope.
       */

      currentTurn: {
        originalText:
          original,

        effectiveText:
          effective,

        turnId
      },

      originalUserMessage:
        original,

      effectiveUserMessage:
        effective,

      resolvedUserQuestion:
        effective,

      currentTurnWasResolved:
        summary.currentTurnWasResolved ===
          true,

      turnId,

      evidencePacket,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      routingContract,

      continuityStagePacket:
        summary.continuityStagePacket ||
        null,

      safetyStagePacket:
        summary.safetyStagePacket ||
        null,

      situationStagePacket:
        summary.situationStagePacket ||
        null,

      memoryStagePacket:
        summary.memoryStagePacket ||
        null,

      request: {
        original,

        effective,

        // Compatibility alias during migration.
        resolved:
          effective,

        turnId,

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
        routingContract,

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

      responseControl: {
        contextLane:
          summary.contextLane ||
          routingContract
            ?.contextLane ||
          routingContract
            ?.selectedRoute
            ?.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          routingContract
            ?.primaryLane ||
          routingContract
            ?.selectedRoute
            ?.primaryLane ||
          null,

        responseShape:
          summary.responseShape ||
          routingContract
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

        mayDefineResponseRequirements:
          true,

        mayPlanResponse:
          false,

        mayDraftResponse:
          false,

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

  const responseRequirements =
    this.objectOrEmpty(
      summary.responseRequirements ||
      summary.cognitiveReasoningResult
        ?.responseRequirements
    );

  const compatibilityStrategy =
    this.objectOrEmpty(
      summary.cognitiveReasoningResult
        ?.responseStrategy ||
      reasoning.responseStrategy
    );

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

        responseRequirements
          .requiredMoves,

        responseRequirements
          .requiredBehaviors,

        compatibilityStrategy
          .requiredBehaviors
      ),

    forbiddenBehaviors:
      this.mergeUnique(
        executive
          .forbiddenBehaviors,

        reasoning
          .forbiddenBehaviors,

        responseRequirements
          .prohibitedMoves,

        responseRequirements
          .forbiddenBehaviors,

        compatibilityStrategy
          .forbiddenBehaviors
      ),

    constraints:
      this.mergeUnique(
        executive.constraints,

        reasoning.constraints,

        responseRequirements
          .safetyRequirements,

        responseRequirements
          .continuityRequirements,

        responseRequirements
          .toneRequirements,

        compatibilityStrategy
          .constraints
      ),

    requires: {
      ...this.objectOrEmpty(
        executive.requires
      ),

      clarification:
        responseRequirements
          .clarificationRequired ===
        true,

      action:
        responseRequirements
          .actionRequired ===
        true
    },

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
    ?.ready === true &&
  Boolean(
    summary.semanticFrame
  ) &&
  Boolean(
    summary.responseRequirements
  ) &&
  summary.modelInvocation
    ?.succeeded !== false;

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

executionDiagnostic: {
  shouldRunGeneralReasoning:
    summary.shouldRunHeavyReasoning ===
    true,

  developerResponseLocked:
    summary.developerResponseLocked ===
    true,

  engineAvailable:
    Boolean(
      window.AriReasoningEngine
    ),

  engineMethods: {
    reason:
      typeof window
        .AriReasoningEngine
        ?.reason ===
      "function",

    create:
      typeof window
        .AriReasoningEngine
        ?.create ===
      "function"
  },

  resultAvailable:
    Boolean(
      summary.reasoningEngineResult
    ),

  resultSource:
    summary.reasoningEngineResult
      ?.source ||
    summary.reasoningSource ||
    null,

  fallbackReason:
    summary.reasoningFailure
      ?.reason ||
    null,

  invocationError:
  summary.reasoningEngineResult
    ?.invocationError ||
  null,

engineInvocation:
  summary.reasoningEngineResult
    ?.engineInvocationDiagnostic ||
  null
},

      cognitiveReasoningResult:
        summary.cognitiveReasoningResult ||
        null,

      reasoningResult:
        summary.cognitiveReasoningResult ||
        null,

      semanticFrame:
        summary.semanticFrame ||
        null,

      responseRequirements:
        summary.responseRequirements ||
        null,

      executionMetadata:
        summary.executionMetadata ||
        null,

      evidenceReferences:
        this.toArray(
          summary.evidenceReferences
        ),

      modelInvocation:
        summary.modelInvocation ||
        null,

      error:
        summary.reasoningFailure
          ?.reason ||
        null,

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

                canDefineResponseRequirements:
          true,

        canDefineResponseStrategy:
          false,

        canDraftResponse:
          false,

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
          "1.1.2",

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
          null,

        responseRequirements:
          null,

        executionMetadata:
          null,

        evidenceReferences:
          [],

        modelInvocation: {
          succeeded:
            false,

          model:
            null,

          finishReason:
            null,

          usage:
            null
        },

        caseModel:
          {},

        options:
          [],

        tradeoffs:
          [],

        uncertainties:
          [],

                responseStrategy:
          null,

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

  objectOrNull(
    value
  ) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    )
      ? value
      : null;
  },

  firstArray(
    ...values
  ) {
    for (
      const value of values
    ) {
      if (
        Array.isArray(
          value
        )
      ) {
        return [
          ...value
        ];
      }
    }

    return [];
  },

  firstNonEmptyString(
    values = []
  ) {
    for (
      const value of values
    ) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  },

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