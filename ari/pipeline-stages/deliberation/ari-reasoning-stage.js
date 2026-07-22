// ari/pipeline-stages/deliberation/ari-reasoning-stage.js
// Ari Reasoning Deliberation Stage
//
// Purpose:
// Coordinate cognitive executive routing, optional developer evidence,
// one authoritative OpenAI reasoning pass, result validation, and the
// canonical authoritative-draft handoff.
//
// V3.1.0 — Canonical Operation Registry Contract
//
// Architectural flow:
//
// Executive Routing
//      ↓
// Optional Cognitive Executive
//      ↓
// Optional Developer Evidence
//      ↓
// One OpenAI Cognitive Reasoning Pass
//      ↓
// Canonical Cognitive Result
//      ↓
// Authoritative Draft Handoff
//      ↓
// Semantic Validation / Response Planning
//
// Authority model:
//
// AriCognitiveExecutive:
// - decides which supporting reasoning resources should run
// - may activate developer analysis
// - may add advisory requirements
//
// Developer Layer:
// - gathers specialist technical evidence
// - may produce authoritative technical findings
// - does not normally own final response language
//
// AriReasoningEngine / OpenAI:
// - interprets current-turn meaning
// - builds the semantic frame
// - analyzes evidence
// - defines response requirements
// - proposes actions
// - produces the authoritative user-facing draft
//
// AriReasoningStage:
// - invokes the reasoning systems
// - validates the returned contracts
// - preserves the authoritative draft without rewriting it
// - does not execute actions
// - does not override safety
// - does not independently generate response language
// - does not persist runtime state

window.Ari = window.Ari || {};

window.AriReasoningStage = {
  version: "3.1.0",
  schemaVersion: "3.1.0",
  source: "ari-reasoning-stage",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = null,
      preserveDeveloperEvidence = state => state,
      runDeveloperLayer = async state => state,
      applyContractBridge = state => state
    } = runtime;

    try {
      let state = {
        ...summary,
        activeDeliberationStage: "reasoning"
      };

      const executivePacket =
        this.objectOrEmpty(state.executivePacket);

      const runInstructions = {
        ...this.objectOrEmpty(
          state.routingContract?.run
        ),
        ...this.objectOrEmpty(
          executivePacket.runInstructions
        )
      };

      const reasoningEligibility =
        this.resolveReasoningEligibility({
          state,
          runInstructions
        });

      state = {
        ...state,
        reasoningEligibility,
        shouldRunCognitiveExecutive:
          reasoningEligibility.runCognitiveExecutive,
        shouldRunDeveloperLayer:
          reasoningEligibility.runDeveloper,
        shouldRunHeavyReasoning:
          reasoningEligibility.runGeneralReasoning
      };

      /* =================================================
         1. COGNITIVE EXECUTIVE
      ================================================= */

      mark("before cognitiveExecutive");

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
              expectedResult:
                "cognitive_executive",
              fallback:
                this.buildCognitiveExecutiveFallback(
                  "cognitive_executive_not_loaded"
                )
            })
          : this.buildCognitiveExecutiveFallback(
              "cognitive_executive_not_required",
              "skipped-by-executive-routing"
            );

      state = {
        ...state,
        ...this.pickCognitiveExecutiveFields(
          cognitiveExecutiveResult
        ),
        cognitiveExecutive:
          cognitiveExecutiveResult
            ?.cognitiveExecutive ||
          state.cognitiveExecutive ||
          null,
        ariExecutiveRan:
          cognitiveExecutiveResult
            ?.ariExecutiveRan === true,
        ariExecutiveVersion:
          cognitiveExecutiveResult
            ?.ariExecutiveVersion ||
          state.ariExecutiveVersion ||
          null
      };

      mark("after cognitiveExecutive");

      /* =================================================
         2. OPTIONAL DEVELOPER EVIDENCE
      ================================================= */

      const shouldRunDeveloper =
        reasoningEligibility.runDeveloper ||
        state.cognitiveExecutive
          ?.activate
          ?.includes?.("developer") ||
        state.cognitiveExecutive
          ?.requires
          ?.developer === true;

      state = {
        ...state,
        shouldRunDeveloperLayer:
          shouldRunDeveloper
      };

      mark("before runDeveloperLayer");

      state =
        shouldRunDeveloper
          ? await runDeveloperLayer(state)
          : {
              ...state,
              developerLayerRan:
                false,
              developerLayerSource:
                "skipped-by-executive-routing",
              developerLayerSkipReason:
                "developer_path_not_required"
            };

      mark("after runDeveloperLayer");

      state =
        preserveDeveloperEvidence(state);

      state =
        applyContractBridge(state);

      /* =================================================
         3. DEVELOPER RESPONSE LOCK
      ================================================= */

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

      /* =================================================
         4. ONE AUTHORITATIVE OPENAI PASS
      ================================================= */

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

      mark("before AriReasoningEngine");

      let reasoningEngineResult;

      if (shouldRunGeneralReasoning) {
        try {
          reasoningEngineResult =
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
          reasoningEngineResult =
            this.buildReasoningFallback({
              reason:
                error?.message ||
                "reasoning_engine_invocation_failed",
              source:
                "reasoning-engine-error",
              engineRan:
                false,
              invocationError: {
                message:
                  error?.message ||
                  String(error),
                name:
                  error?.name ||
                  "Error",
                code:
                  error?.code ||
                  null,
                stack:
                  error?.stack ||
                  null
              }
            });
        }
      } else {
        reasoningEngineResult =
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

      mark("after AriReasoningEngine");

      /* =================================================
         5. CANONICAL RESULT EXTRACTION
      ================================================= */

      const cognitiveReasoningResult =
        this.extractCognitiveReasoningResult(
          reasoningEngineResult
        );

      const semanticFrame =
        this.firstObject([
          cognitiveReasoningResult
            ?.semanticFrame,
          reasoningEngineResult
            ?.semanticFrame
        ]);

      const responseRequirements =
        this.firstObject([
          cognitiveReasoningResult
            ?.responseRequirements,
          reasoningEngineResult
            ?.responseRequirements
        ]);

      const responseStrategy =
        this.firstObject([
          cognitiveReasoningResult
            ?.responseStrategy,
          reasoningEngineResult
            ?.responseStrategy,
          state.responseStrategy
        ]);

      const executionMetadata =
        this.firstObject([
          cognitiveReasoningResult
            ?.executionMetadata,
          reasoningEngineResult
            ?.executionMetadata
        ]);

      const evidenceReferences =
        this.firstArray(
          cognitiveReasoningResult
            ?.evidenceReferences,
          reasoningEngineResult
            ?.evidenceReferences
        );

      const modelInvocation =
        this.firstObject([
          cognitiveReasoningResult
            ?.modelInvocation,
          reasoningEngineResult
            ?.modelInvocation
        ]);

      const authoritativeDraft =
        this.extractAuthoritativeDraft({
          cognitiveReasoningResult,
          reasoningEngineResult
        });

      const authoritativeDraftSource =
        this.resolveAuthoritativeDraftSource({
          cognitiveReasoningResult,
          reasoningEngineResult
        });

      const validation =
        this.validateReasoningResult({
          cognitiveReasoningResult,
          semanticFrame,
          responseRequirements,
          authoritativeDraft,
          modelInvocation,
          developerResponseLocked
        });

      state = {
        ...state,

        reasoningEngineResult:
          reasoningEngineResult ||
          null,

        cognitiveReasoningResult:
          cognitiveReasoningResult ||
          null,

        reasoningResult:
          cognitiveReasoningResult ||
          null,

        reasoning:
          reasoningEngineResult
            ?.reasoning ||
          {},

        semanticFrame:
          semanticFrame ||
          null,

        aiSemanticFrame:
          semanticFrame ||
          null,

        responseRequirements:
          responseRequirements ||
          null,

        responseStrategy:
          responseStrategy ||
          null,

        executionMetadata:
          executionMetadata ||
          null,

        evidenceReferences,

        modelInvocation:
          modelInvocation ||
          null,

        authoritativeDraft,

        authoritativeDraftSource,

        modelDraftResponse:
          authoritativeDraft,

        draftResponse:
          authoritativeDraft,

        reasoningEngineRan:
          reasoningEngineResult
            ?.reasoningEngineRan === true,

        reasoningEngineReady:
          validation.ready,

        reasoningEngineVersion:
          reasoningEngineResult
            ?.reasoningEngineVersion ||
          null,

        reasoningSource:
          cognitiveReasoningResult
            ?.source ||
          reasoningEngineResult
            ?.reasoningSource ||
          reasoningEngineResult
            ?.source ||
          "unknown",

        reasoningConfidence:
          executionMetadata
            ?.confidence ??
          cognitiveReasoningResult
            ?.confidence ??
          reasoningEngineResult
            ?.reasoningConfidence ??
          null,

        reasoningPrimary:
          semanticFrame
            ?.primaryLane ||
          semanticFrame
            ?.primaryIntent ||
          reasoningEngineResult
            ?.reasoningPrimary ||
          state.primaryLane ||
          null,

        reasoningFailure:
          validation.ready
            ? null
            : {
                reason:
                  validation.errors[0] ||
                  "reasoning_result_not_ready",
                errors:
                  validation.errors,
                warnings:
                  validation.warnings
              },

        reasoningValidation:
          validation
      };

      /* =================================================
         6. NORMALIZED RESPONSE REQUIREMENTS
      ================================================= */

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

      /* =================================================
         7. CANONICAL STAGE PACKET
      ================================================= */

      state = {
        ...state,

        reasoningStageRan:
          true,

        reasoningStageReady:
          developerResponseLocked === true ||
          validation.ready === true,

        reasoningStageSource:
          this.source,

        reasoningStageVersion:
          this.version
      };

      state.reasoningStagePacket =
        this.buildReasoningStagePacket(
          state
        );

      console.log(
        "ARI AUTHORITATIVE DRAFT DIAGNOSTIC",
        {
          stageVersion:
            this.version,

          reasoningStageReady:
            state.reasoningStageReady ===
            true,

          reasoningEngineReady:
            state.reasoningEngineReady ===
            true,

          cognitiveResultAvailable:
            Boolean(
              cognitiveReasoningResult
            ),

          semanticFrameAvailable:
            Boolean(
              semanticFrame
            ),

          responseRequirementsAvailable:
            Boolean(
              responseRequirements
            ),

          authoritativeDraftAvailable:
            Boolean(
              authoritativeDraft
            ),

          authoritativeDraftSource,

          authoritativeDraftLength:
            authoritativeDraft.length,

          authoritativeDraftPreview:
            authoritativeDraft.slice(
              0,
              300
            ),

          validation
        }
      );

      return state;
    } catch (error) {
      console.error(
        "ARI REASONING STAGE CRASH",
        {
          message:
            error?.message ||
            String(error),
          name:
            error?.name ||
            "Error",
          code:
            error?.code ||
            null,
          stack:
            error?.stack ||
            null
        }
      );

      throw error;
    }
  },

  /* =====================================================
     ENGINE INVOCATION
  ===================================================== */

  async invokeEngine({
    engine = null,
    methods = [],
    input = {},
    runtime = {},
    runtimeInvoker = null,
    fallback = null,
    expectedResult = null
  } = {}) {
    if (
      typeof runtimeInvoker ===
        "function"
    ) {
      const runtimeResult =
        await runtimeInvoker(
          engine,
          methods,
          fallback,
          input
        );

      if (
        !this.isValidEngineInvocationResult({
          result:
            runtimeResult,
          expectedResult
        })
      ) {
        const error =
          new Error(
            expectedResult ===
              "reasoning"
              ? "runtime_invoker_returned_invalid_reasoning_result"
              : expectedResult ===
                  "cognitive_executive"
                ? "runtime_invoker_returned_invalid_cognitive_executive_result"
                : "runtime_invoker_returned_invalid_engine_result"
          );

        error.code =
          "runtime_invoker_returned_invalid_result";

        error.expectedResult =
          expectedResult;

        error.engineVersion =
          engine?.version ||
          null;

        error.runtimeResult =
          runtimeResult;

        throw error;
      }

      return runtimeResult;
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
      typeof result !==
        "object" ||
      Array.isArray(result)
    ) {
      return false;
    }

    if (
      expectedResult ===
        "reasoning"
    ) {
      const cognitiveResult =
        this.extractCognitiveReasoningResult(
          result
        );

      const recognizedEnvelope =
        typeof result
          .reasoningEngineRan ===
            "boolean" ||
        typeof result
          .reasoningEngineReady ===
            "boolean" ||
        Boolean(
          result
            .reasoningEngineVersion
        ) ||
        Boolean(
          cognitiveResult
        );

      const recognizedCognitiveResult =
        Boolean(
          cognitiveResult &&
          (
            typeof cognitiveResult
              .ready === "boolean" ||
            cognitiveResult
              .validation ||
            cognitiveResult
              .schema ===
              "ari_cognitive_reasoning_result"
          )
        );

      return Boolean(
        recognizedEnvelope &&
        recognizedCognitiveResult
      );
    }

    if (
      expectedResult ===
        "cognitive_executive"
    ) {
      const executiveResult =
        this.objectOrNull(
          result.cognitiveExecutive
        );

      return Boolean(
        typeof result
          .ariExecutiveRan ===
            "boolean" &&
        executiveResult &&
        (
          typeof executiveResult
            .source === "string" ||
          typeof executiveResult
            .reason === "string" ||
          Array.isArray(
            executiveResult.activate
          )
        )
      );
    }

    return true;
  },

  /* =====================================================
     RESULT EXTRACTION
  ===================================================== */

  extractCognitiveReasoningResult(
    result = {}
  ) {
    return (
      this.objectOrNull(
        result
          ?.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        result
          ?.reasoningResult
      ) ||
      this.objectOrNull(
        result
          ?.result
          ?.cognitiveReasoningResult
      ) ||
      this.objectOrNull(
        result
          ?.result
          ?.reasoningResult
      ) ||
      this.objectOrNull(
        result
          ?.result
      ) ||
      null
    );
  },

  extractAuthoritativeDraft({
    cognitiveReasoningResult = null,
    reasoningEngineResult = null
  } = {}) {
    return this.firstNonEmptyString([
      cognitiveReasoningResult
        ?.authoritativeDraft,

      cognitiveReasoningResult
        ?.draftResponse,

      cognitiveReasoningResult
        ?.responseText,

      cognitiveReasoningResult
        ?.finalResponse,

      cognitiveReasoningResult
        ?.answer,

      cognitiveReasoningResult
        ?.reply,

      reasoningEngineResult
        ?.authoritativeDraft,

      reasoningEngineResult
        ?.draftResponse,

      reasoningEngineResult
        ?.responseText,

      reasoningEngineResult
        ?.finalResponse,

      reasoningEngineResult
        ?.answer,

      reasoningEngineResult
        ?.reply,

      reasoningEngineResult
        ?.result
        ?.authoritativeDraft,

      reasoningEngineResult
        ?.result
        ?.draftResponse,

      reasoningEngineResult
        ?.result
        ?.responseText,

      reasoningEngineResult
        ?.result
        ?.finalResponse
    ]);
  },

  resolveAuthoritativeDraftSource({
    cognitiveReasoningResult = null,
    reasoningEngineResult = null
  } = {}) {
    const candidates = [
      [
        "cognitiveReasoningResult.authoritativeDraft",
        cognitiveReasoningResult
          ?.authoritativeDraft
      ],
      [
        "cognitiveReasoningResult.draftResponse",
        cognitiveReasoningResult
          ?.draftResponse
      ],
      [
        "cognitiveReasoningResult.responseText",
        cognitiveReasoningResult
          ?.responseText
      ],
      [
        "cognitiveReasoningResult.finalResponse",
        cognitiveReasoningResult
          ?.finalResponse
      ],
      [
        "cognitiveReasoningResult.answer",
        cognitiveReasoningResult
          ?.answer
      ],
      [
        "cognitiveReasoningResult.reply",
        cognitiveReasoningResult
          ?.reply
      ],
      [
        "reasoningEngineResult.authoritativeDraft",
        reasoningEngineResult
          ?.authoritativeDraft
      ],
      [
        "reasoningEngineResult.draftResponse",
        reasoningEngineResult
          ?.draftResponse
      ],
      [
        "reasoningEngineResult.responseText",
        reasoningEngineResult
          ?.responseText
      ],
      [
        "reasoningEngineResult.finalResponse",
        reasoningEngineResult
          ?.finalResponse
      ],
      [
        "reasoningEngineResult.answer",
        reasoningEngineResult
          ?.answer
      ],
      [
        "reasoningEngineResult.reply",
        reasoningEngineResult
          ?.reply
      ],
      [
        "reasoningEngineResult.result.authoritativeDraft",
        reasoningEngineResult
          ?.result
          ?.authoritativeDraft
      ],
      [
        "reasoningEngineResult.result.draftResponse",
        reasoningEngineResult
          ?.result
          ?.draftResponse
      ],
      [
        "reasoningEngineResult.result.responseText",
        reasoningEngineResult
          ?.result
          ?.responseText
      ],
      [
        "reasoningEngineResult.result.finalResponse",
        reasoningEngineResult
          ?.result
          ?.finalResponse
      ]
    ];

    for (const [source, value] of candidates) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return source;
      }
    }

    return null;
  },

  validateReasoningResult({
    cognitiveReasoningResult = null,
    semanticFrame = null,
    responseRequirements = null,
    authoritativeDraft = "",
    modelInvocation = null,
    developerResponseLocked = false
  } = {}) {
    const errors = [];
    const warnings = [];

    if (developerResponseLocked) {
      return {
        ready: true,
        passed: true,
        errors,
        warnings,
        source:
          "developer-response-lock"
      };
    }

    if (!cognitiveReasoningResult) {
      errors.push(
        "cognitive_reasoning_result_missing"
      );
    }

    if (
      cognitiveReasoningResult &&
      cognitiveReasoningResult
        .ready !== true
    ) {
      errors.push(
        "cognitive_reasoning_result_not_ready"
      );
    }

    if (!semanticFrame) {
      errors.push(
        "semantic_frame_missing"
      );
    }

    if (!responseRequirements) {
      errors.push(
        "response_requirements_missing"
      );
    }

    if (!authoritativeDraft) {
      errors.push(
        "authoritative_draft_missing"
      );
    }

    if (
      modelInvocation
        ?.succeeded === false
    ) {
      errors.push(
        "model_invocation_failed"
      );
    }

    if (!modelInvocation) {
      warnings.push(
        "model_invocation_metadata_missing"
      );
    }

    return {
      ready:
        errors.length === 0,
      passed:
        errors.length === 0,
      errors:
        this.mergeUnique(errors),
      warnings:
        this.mergeUnique(warnings),
      source:
        "ari-reasoning-stage-validation"
    };
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveReasoningEligibility({
    state = {},
    runInstructions = {}
  } = {}) {
    const developerRequested =
      runInstructions.developer === true ||
      state.shouldRunDeveloperLayer === true ||
      state.routingContract
        ?.run
        ?.developer === true ||
      state.routingContract
        ?.mode === "developer";

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse === true ||
      state.safetyStagePacket
        ?.shouldStopNormalResponse === true ||
      state.safetyStagePacket
        ?.safetyShouldStopNormalResponse ===
          true;

    const fastPath =
      runInstructions.fastPath === true ||
      state.routingApplicability
        ?.fastPathEligible === true;

    const routeNeedsReasoning =
      this.routeNeedsReasoning(
        state
      );

    const generalReasoningExplicitlyDisabled =
      runInstructions
        .generalReasoning === false ||
      runInstructions
        .reasoning === false;

    const authoritativeResponseAlreadyAvailable =
      this.resolveDeveloperResponseLock(
        state
      );

    const semanticReasoningRequired =
      !safetyOverride &&
      !authoritativeResponseAlreadyAvailable &&
      !generalReasoningExplicitlyDisabled;

    const runGeneralReasoning =
      semanticReasoningRequired;

    const runCognitiveExecutive =
      developerRequested ||
      safetyOverride ||
      routeNeedsReasoning ||
      runGeneralReasoning;

    return {
      runCognitiveExecutive,
      runDeveloper:
        developerRequested,
      runGeneralReasoning,
      developerRequested,
      safetyOverride,
      fastPath,
      routeNeedsReasoning,
      semanticReasoningRequired,
      generalReasoningExplicitlyDisabled,
      authoritativeResponseAlreadyAvailable,
      source:
        "ari-reasoning-stage-eligibility",
      reason:
        safetyOverride
          ? "safety_override_limits_general_reasoning"
          : authoritativeResponseAlreadyAvailable
            ? "authoritative_response_already_available"
            : generalReasoningExplicitlyDisabled
              ? "general_reasoning_explicitly_disabled"
              : fastPath
                ? "fast_path_requires_single_pass_reasoning"
                : developerRequested
                  ? "developer_path_requires_single_pass_reasoning"
                  : "general_reasoning_required"
    };
  },

  routeNeedsReasoning(
    summary = {}
  ) {
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
            .includes(capability)
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
    ].includes(mode);
  },

  /* =====================================================
     REASONING REQUEST
  ===================================================== */

buildReasoningStageInput(
  summary = {}
) {
  const operationRegistry =
    window.AriOperationRegistry ||
    window.Ari?.operationRegistry ||
    null;

  const allowedOperations =
    this.resolveAllowedOperations(
      operationRegistry
    );

console.log(
  "ARI REASONING OPERATION CONTRACT",
  {
    operationCount:
      allowedOperations.length,

    allowedOperations
  }
);

  const evidencePacket =
      this.firstObject([
        summary.evidencePacket,
        summary.perceptionPacket
          ?.evidencePacket
      ]);

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
      this.firstObject([
        summary.routingContract,
        summary.executivePacket
          ?.routingContract
      ]);

if (!allowedOperations.length) {
  console.error(
    "ARI REASONING STAGE CANNOT BUILD OPERATION CONTRACT",
    {
      registryAvailable:
        Boolean(
          operationRegistry
        ),

      registryVersion:
        operationRegistry
          ?.version ||
        null,

      registryKeys:
        operationRegistry
          ? Object.keys(
              operationRegistry
            )
          : []
    }
  );
}

    return {
      schema:
        "ari_cognitive_reasoning_request",

      schemaVersion:
        "2.0.0",

      action:
        "openai_reasoning",

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

      evidencePacket:
        evidencePacket ||
        null,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      routingContract:
        routingContract ||
        null,

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
        routingContract ||
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

      outputContract: {
  schema:
    "ari_cognitive_reasoning_result",

  schemaVersion:
    "2.0.0",

  requiredSchema:
    "ari_cognitive_reasoning_result",

  semanticFrameRequired:
    true,

  responseRequirementsRequired:
    true,

  authoritativeDraftRequired:
    true,

  authoritativeDraftField:
    "draftResponse",

  authoritativeDraftMustBeUserFacing:
    true,

  authoritativeDraftMustBeComplete:
    true,

  authoritativeDraftMustRespectSafety:
    true,

  authoritativeDraftMustRespectEvidence:
    true,

  properties: {
    semanticFrame: {
      type:
        "object",

      properties: {
        operation: {
          type:
            "string",

          enum:
            allowedOperations
        }
      },

      required: [
        "operation"
      ]
    },

    draftResponse: {
      type:
        "string",

      minLength:
        1
    }
  },

  operationEnum:
    allowedOperations,

  allowedOperations
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
          true,

        mayDraftResponse:
          true,

        mustProduceDraftResponse:
          true,

        draftResponseIsAuthoritative:
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

      openAIReasoningInvoker:
        summary.openAIReasoningInvoker ||
        null
    };
  },

  /* =====================================================
     REQUIREMENT NORMALIZATION
  ===================================================== */

  resolveReasoningRequirements(
    summary = {}
  ) {
    const executive =
      this.objectOrEmpty(
        summary.cognitiveExecutive
      );

    const reasoning =
      this.objectOrEmpty(
        summary.reasoning
      );

    const responseRequirements =
      this.objectOrEmpty(
        summary.responseRequirements ||
        summary.cognitiveReasoningResult
          ?.responseRequirements
      );

    const responseStrategy =
      this.objectOrEmpty(
        summary.responseStrategy ||
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
          responseStrategy
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
          responseStrategy
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
          responseStrategy
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

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildReasoningStagePacket(
    summary = {}
  ) {
    const authoritativeDraft =
      this.firstNonEmptyString([
        summary.authoritativeDraft,
        summary.modelDraftResponse,
        summary.draftResponse,
        summary.cognitiveReasoningResult
          ?.draftResponse
      ]);

    const developerReady =
      summary.developerResponseLocked ===
        true;

    const cognitiveReady =
      summary.reasoningValidation
        ?.ready === true &&
      Boolean(
        authoritativeDraft
      );

    const ready =
      developerReady ||
      cognitiveReady;

    return {
      schema:
        "ari_reasoning_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      complete:
        ready,

      ran:
        summary.reasoningStageRan ===
        true,

      source:
        this.source,

      version:
        this.version,

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

      responseStrategy:
        summary.responseStrategy ||
        null,

      authoritativeDraft,

      draftResponse:
        authoritativeDraft,

      authoritativeDraftSource:
        summary.authoritativeDraftSource ||
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

      validation:
        summary.reasoningValidation ||
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

        canPreserveAuthoritativeDraft:
          true,

        canCoordinateAuthoritativeDraft:
          true,

        canGenerateDraftIndependently:
          false,

        canRewriteAuthoritativeDraft:
          false,

        canExecuteActions:
          false,

        canOverrideSafety:
          false,

        canWriteFinalDeliveryLanguage:
          false,

        canPersistState:
          false,

        role:
          "single_pass_cognitive_reasoning_orchestration"
      }
    };
  },

  /* =====================================================
     FALLBACKS
  ===================================================== */

  buildReasoningFallback({
    reason =
      "reasoning_unavailable",
    source =
      "unknown",
    engineRan =
      false,
    invocationError =
      null
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
          "2.0.0",

        ready:
          false,

        authoritative:
          false,

        semanticFrame:
          null,

        responseRequirements:
          null,

        responseStrategy:
          null,

        draftResponse:
          "",

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

      reasoningConfidence:
        0,

      reasoningPrimary:
        null,

      authority:
        "none",

      invocationError,

      reason
    };
  },

  buildCognitiveExecutiveFallback(
    reason =
      "cognitive_executive_unavailable",
    source =
      "not-loaded"
  ) {
    return {
      ariExecutiveRan:
        false,

      ariExecutiveVersion:
        null,

      cognitiveExecutive: {
        source,

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

        reason
      }
    };
  },

  /* =====================================================
     DEVELOPER RESPONSE LOCK
  ===================================================== */

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

  /* =====================================================
     CONTROLLED FIELD SELECTION
  ===================================================== */

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

  /* =====================================================
     UTILITIES
  ===================================================== */

resolveAllowedOperations(
  registry = null
) {
  if (!registry) {
    return [];
  }

  const methodNames = [
    "getAllowedOperations",
    "listOperations",
    "getOperations",
    "getOperationNames"
  ];

  for (const methodName of methodNames) {
    if (
      typeof registry[
        methodName
      ] !== "function"
    ) {
      continue;
    }

    try {
      const result =
        registry[
          methodName
        ]();

      const normalized =
        this.normalizeOperationList(
          result
        );

      if (normalized.length) {
        return normalized;
      }
    } catch (error) {
      console.warn(
        `Ari operation registry method failed: ${methodName}`,
        error
      );
    }
  }

  const directCandidates = [
    registry.operations,
    registry.allowedOperations,
    registry.operationNames,
    registry.registry,
    registry.definitions,
    registry.entries
  ];

  for (const candidate of directCandidates) {
    const normalized =
      this.normalizeOperationList(
        candidate
      );

    if (normalized.length) {
      return normalized;
    }
  }

  console.error(
    "ARI REASONING STAGE OPERATION REGISTRY EMPTY",
    {
      registryAvailable:
        true,

      registryVersion:
        registry.version ||
        null,

      registryKeys:
        Object.keys(
          registry
        )
    }
  );

  return [];
},

normalizeOperationList(
  value = null
) {
  let items = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (
    value &&
    typeof value ===
      "object"
  ) {
    items =
      Object.entries(value)
        .map(
          ([key, entry]) => {
            if (
              typeof entry ===
                "string"
            ) {
              return entry;
            }

            if (
              entry &&
              typeof entry ===
                "object"
            ) {
              return (
                entry.operation ||
                entry.name ||
                entry.id ||
                entry.key ||
                key
              );
            }

            return key;
          }
        );
  }

  return [
    ...new Set(
      items
        .map(item => {
          if (
            typeof item ===
              "string"
          ) {
            return item.trim();
          }

          if (
            item &&
            typeof item ===
              "object"
          ) {
            return String(
              item.operation ||
              item.name ||
              item.id ||
              item.key ||
              ""
            ).trim();
          }

          return "";
        })
        .filter(Boolean)
    )
  ];
},

  objectOrNull(
    value
  ) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    )
      ? value
      : null;
  },

  objectOrEmpty(
    value
  ) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  },

  firstObject(
    values = []
  ) {
    for (const value of values) {
      const objectValue =
        this.objectOrNull(value);

      if (objectValue) {
        return objectValue;
      }
    }

    return null;
  },

  firstArray(
    ...values
  ) {
    for (const value of values) {
      if (Array.isArray(value)) {
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
    for (const value of values) {
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

  toArray(
    value
  ) {
    if (Array.isArray(value)) {
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

  mergeUnique(
    ...values
  ) {
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
