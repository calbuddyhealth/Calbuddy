// ari/pipeline-stages/deliberation/ari-response-planning-stage.js
// Ari Response Planning Deliberation Stage
//
// Purpose:
//   Convert the authoritative cognitive reasoning result into
//   a governed canonical response plan for the Expression pipeline.
//
// V3.0.0 — Cognitive Strategy Consumption / Deterministic Governance
//
// Authority:
//
//   OpenAI reasoning:
//   - defines response goal
//   - defines response shape
//   - orders response moves
//   - determines whether clarification is required
//   - proposes writer strategy
//   - may provide a draft response
//
//   ARI response planning:
//   - validates structure
//   - enforces safety
//   - enforces binding response constraints
//   - prevents unauthorized action claims
//   - creates a mechanical fallback when cognition is unavailable
//   - hands the plan to Expression
//
// Non-responsibilities:
//   - does not reinterpret the user
//   - does not reconstruct semantic intent
//   - does not infer conversation function
//   - does not decide whether advice was requested
//   - does not independently decide whether comparison is required
//   - does not independently decide whether explanation is required
//   - does not write final user-facing language
//   - does not execute actions
//   - does not override safety

window.Ari = window.Ari || {};

window.AriResponsePlanningStage = {
  version: "3.0.0",
  schemaVersion: "2.0.0",

  // ===================================================
  // Public entry point
  // ===================================================

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback
    } = runtime;

    let state = {
      ...summary,

      activeDeliberationStage:
        "response_planning"
    };

    const planningEligibility =
      this.resolvePlanningEligibility(
        state
      );

    state = {
      ...state,

      planningEligibility,

      shouldRunResponsePlanner:
        planningEligibility
          .runExternalPlanner
    };

    const responsePlanningInput =
      this.buildResponsePlanningInput(
        state
      );

    state = {
      ...state,

      responsePlanningInput,

      responsePlannerInput:
        responsePlanningInput,

      canonicalResponsePlanningInput:
        responsePlanningInput
    };

    // The authoritative source is now the cognitive result.
    const cognitivePlan =
      this.buildPlanFromCognitiveResult(
        state
      );

    let externalPlannerEnvelope =
      this.buildSkippedPlannerEnvelope({
        reason:
          "cognitive_response_strategy_available"
      });

    // An external planner is now an optional transformer.
    // It does not own semantic meaning.
    if (
      planningEligibility
        .runExternalPlanner
    ) {
      mark(
        "before responsePlanner"
      );

      const rawPlannerResult =
        await runEngine(
          window.AriResponsePlanner ||
          window.Ari?.responsePlanner,

          [
            "plan",
            "create",
            "build"
          ],

          this.buildPlannerFailureEnvelope({
            reason:
              "response_planner_not_loaded"
          }),

          {
            ...state,

            cognitiveResponsePlan:
              cognitivePlan,

            responsePlanningInput
          }
        );

      mark(
        "after responsePlanner"
      );

      externalPlannerEnvelope =
        this.normalizePlannerEnvelope(
          rawPlannerResult
        );
    }

    const externalPlan =
      this.extractExternalPlan(
        externalPlannerEnvelope
      );

    // External planning may refine structure,
    // but cannot replace authoritative cognition.
    const candidatePlan =
      this.mergeCognitiveAndExternalPlan({
        cognitivePlan,
        externalPlan
      });

    const validation =
      this.validateResponsePlan({
        responsePlan:
          candidatePlan,

        state
      });

    const finalResponsePlan =
      validation.valid
        ? this.normalizeResponsePlan({
            responsePlan:
              candidatePlan,

            state,

            validation,

            fallback:
              false
          })
        : this.buildFallbackResponsePlan({
            state,

            validation,

            reason:
              validation.reason ||
              "response_plan_invalid"
          });

    const responseStrategy =
      this.buildResponseStrategy({
        state,

        responsePlan:
          finalResponsePlan
      });

    state = {
      ...state,

      rawResponsePlannerResult:
        externalPlannerEnvelope.raw ||
        null,

      responsePlannerEnvelope:
        externalPlannerEnvelope,

      responsePlannerResult:
        externalPlannerEnvelope,

      responsePlanValidation:
        validation,

      responsePlanAccepted:
        validation.valid === true,

      responsePlanRejectionReason:
        validation.valid
          ? null
          : validation.reason,

      responsePlan:
        finalResponsePlan,

      ariResponsePlan:
        finalResponsePlan,

      canonicalResponsePlan:
        finalResponsePlan,

      understandingResponsePlan:
        finalResponsePlan,

      responsePlannerRan:
        externalPlannerEnvelope
          .responsePlannerRan === true,

      responsePlannerUsable:
        finalResponsePlan.usable === true,

      responsePlannerSource:
        externalPlannerEnvelope.source ||
        finalResponsePlan.source ||
        "unknown",

      responsePlannerVersion:
        externalPlannerEnvelope.version ||
        null,

      responseStrategy,

      responseGoal:
        responseStrategy.responseGoal,

      responseShape:
        responseStrategy.responseShape,

      responsePosture:
        responseStrategy.responsePosture,

      responseMoves:
        responseStrategy.responseMoves,

      responseOrder:
        responseStrategy.responseOrder,

      adviceRequested:
        responseStrategy.adviceRequested ===
        true,

      advicePolicy:
        responseStrategy.advicePolicy,

      coachingPermissionRequired:
        responseStrategy
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        responseStrategy
          .shouldAskQuestion === true,

      questionPurpose:
        responseStrategy.questionPurpose,

      blueprintHint:
        responseStrategy.blueprintHint,

      writerInstructions:
        responseStrategy
          .writerInstructions,

      communicationPlan:
        responseStrategy
          .communicationPlan,

      composerDirective:
        responseStrategy
          .composerDirective,

      responseRules:
        this.mergeUnique(
          state.responseRules,

          responseStrategy.rules
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,

          responseStrategy.constraints
        ),

      responseRequired:
        this.mergeUnique(
          state.responseRequired,

          responseStrategy
            .requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,

          responseStrategy
            .forbiddenBehaviors
        )
    };

    state.responsePlanningHandoff =
      this.buildResponsePlanningHandoff(
        state
      );

    state.responsePlanningStageRan =
      true;

    state.responsePlanningStageReady =
      finalResponsePlan.ready === true &&
      finalResponsePlan.usable === true;

    state.responsePlanningStageSource =
      "ari-response-planning-stage";

    state.responsePlanningStageVersion =
      this.version;

    state.responsePlanningStagePacket =
      this.buildResponsePlanningStagePacket(
        state
      );

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolvePlanningEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked === true;

    const cognitiveReady =
      summary.cognitiveReasoningResult
        ?.ready === true;

    const cognitiveStrategyAvailable =
      this.isObject(
        summary.cognitiveReasoningResult
          ?.responseStrategy
      );

    const externalPlannerRequested =
      summary.routingContract
        ?.run
        ?.responsePlanner === true ||
      summary.executivePacket
        ?.runInstructions
        ?.responsePlanner === true ||
      summary
        .forceExternalResponsePlanner ===
        true;

    const runExternalPlanner =
      !developerLocked &&
      !responseLocked &&
      externalPlannerRequested;

    return {
      runExternalPlanner,

      developerLocked,

      responseLocked,

      cognitiveReady,

      cognitiveStrategyAvailable,

      externalPlannerRequested,

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : runExternalPlanner
              ? "external_planner_requested"
              : cognitiveStrategyAvailable
                ? "cognitive_strategy_available"
                : "mechanical_fallback_required",

      source:
        "ari-response-planning-stage-eligibility",

      authority:
        "planning_applicability_only"
    };
  },

  // ===================================================
  // Canonical input
  // ===================================================

  buildResponsePlanningInput(
    summary = {}
  ) {
    return {
      schema:
        "ari_response_planning_input",

      schemaVersion:
        this.schemaVersion,

      source:
        "ari-response-planning-stage",

      request: {
        original:
          this.getOriginalText(summary),

        effective:
          summary.cognitiveReasoningResult
            ?.interpretation
            ?.meaning ||
          summary.resolvedUserQuestion ||
          this.getOriginalText(summary),

        turnId:
          summary.turn?.turnId ||
          summary.turnId ||
          null
      },

      cognition: {
        ready:
          summary.cognitiveReasoningResult
            ?.ready === true,

        interpretation:
          summary.cognitiveReasoningResult
            ?.interpretation ||
          null,

        reasoningDecision:
          summary.cognitiveReasoningResult
            ?.reasoningDecision ||
          null,

        semanticFrame:
          summary.cognitiveReasoningResult
            ?.semanticFrame ||
          null,

        caseModel:
          summary.cognitiveReasoningResult
            ?.caseModel ||
          null,

        responseStrategy:
          summary.cognitiveReasoningResult
            ?.responseStrategy ||
          null,

        draftResponse:
          summary.cognitiveReasoningResult
            ?.draftResponse ||
          "",

        grounding:
          summary.cognitiveReasoningResult
            ?.grounding ||
          null,

        confidence:
          summary.cognitiveReasoningResult
            ?.confidence ??
          null
      },

      contracts: {
        routing:
          summary.routingContract ||
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

        reasoning:
          summary.reasoningStagePacket ||
          null
      },

      controls: {
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

        availableCapabilities:
          this.toArray(
            summary.availableCapabilities
          )
      },

      governance: {
        safetyIsBinding:
          true,

        cognitiveInterpretationIsAuthoritative:
          true,

        cognitiveResponseStrategyIsAuthoritative:
          true,

        externalPlannerMayRefineStructure:
          true,

        externalPlannerMayReinterpretMeaning:
          false,

        externalPlannerMayOverrideSafety:
          false,

        actionsAreProposalsOnly:
          true,

        finalLanguageOwnedByExpression:
          true
      }
    };
  },

  // ===================================================
  // Cognitive plan construction
  // ===================================================

  buildPlanFromCognitiveResult(
    summary = {}
  ) {
    const cognitive =
      summary.cognitiveReasoningResult ||
      {};

    const strategy =
      cognitive.responseStrategy ||
      {};

    const decision =
      cognitive.reasoningDecision ||
      {};

    const interpretation =
      cognitive.interpretation ||
      {};

    const semanticFrame =
      cognitive.semanticFrame ||
      {};

    const responseMoves =
      this.normalizeResponseMoves(
        strategy.responseMoves ||
        strategy.moves ||
        strategy.orderedPoints
      );

    const shouldAskQuestion =
      strategy.shouldAskQuestion === true ||
      decision
        .shouldAskClarifyingQuestion ===
        true ||
      interpretation
        .clarificationRequired === true;

    const questionPurpose =
      shouldAskQuestion
        ? (
            strategy.questionPurpose ||
            (
              interpretation
                .clarificationRequired ===
              true
                ? "resolve_required_ambiguity"
                : null
            )
          )
        : null;

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        this.schemaVersion,

      source:
        cognitive.source ||
        "openai-cognitive-reasoning",

      version:
        null,

      createdAt:
        new Date().toISOString(),

      ready:
        cognitive.ready === true,

      usable:
        cognitive.ready === true,

      fallback:
        false,

      responseGoal:
        strategy.responseGoal ||
        strategy.goal ||
        "answer_current_request",

      responseShape:
        strategy.responseShape ||
        strategy.shape ||
        semanticFrame.requestedOutput ||
        "clear_explanation",

      responsePosture:
        strategy.responsePosture ||
        strategy.posture ||
        strategy.tone ||
        "direct_helpful",

      responseMoves,

      responseOrder:
        this.normalizeResponseOrder({
          declaredOrder:
            strategy.responseOrder ||
            strategy.order,

          responseMoves
        }),

      adviceRequested:
        strategy.adviceRequested === true,

      advicePolicy:
        strategy.advicePolicy ||
        null,

      coachingPermissionRequired:
        strategy
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion,

      questionPurpose,

      requiredBehaviors:
        this.mergeUnique(
          strategy.requiredBehaviors,

          summary.responseRequired
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          strategy.forbiddenBehaviors,

          summary.responseAvoid
        ),

      constraints:
        this.mergeUnique(
          strategy.constraints,

          summary.responseConstraints
        ),

      rules:
        this.mergeUnique(
          strategy.rules,

          summary.responseRules
        ),

      blueprintHint:
        strategy.blueprintHint ||
        null,

      writerInstructions:
        strategy.writerInstructions ||
        null,

      communicationPlan:
        strategy.communicationPlan ||
        null,

      composerDirective:
        strategy.composerDirective ||
        null,

      draftResponse:
        cognitive.draftResponse ||
        "",

      proposedActions:
        this.normalizeProposedActions(
          decision.proposedActions
        ),

      grounding:
        cognitive.grounding ||
        null,

      confidence:
        this.normalizeConfidence(
          cognitive.confidence
        ),

      authority: {
        semanticSource:
          "cognitive_reasoning_result",

        mayRefineStructure:
          true,

        mayReinterpretMeaning:
          false,

        mayExecuteActions:
          false,

        mayOverrideSafety:
          false
      }
    };
  },

  // ===================================================
  // Optional external planner
  // ===================================================

  normalizePlannerEnvelope(
    rawResult = {}
  ) {
    const value =
      this.isObject(rawResult)
        ? rawResult
        : {};

    const responsePlan =
      value.responsePlan ||
      value.canonicalResponsePlan ||
      value.plan ||
      value.result?.responsePlan ||
      null;

    return {
      schema:
        value.schema ||
        "ari_response_planner_result",

      schemaVersion:
        value.schemaVersion ||
        this.schemaVersion,

      responsePlannerRan:
        value.responsePlannerRan ===
          true ||
        Boolean(responsePlan),

      source:
        value.source ||
        value.responsePlannerSource ||
        "ari-response-planner",

      version:
        value.responsePlannerVersion ||
        value.version ||
        null,

      usable:
        this.isObject(responsePlan),

      responsePlan,

      reason:
        value.reason ||
        (
          responsePlan
            ? "external_plan_available"
            : "external_plan_missing"
        ),

      raw:
        rawResult
    };
  },

  extractExternalPlan(
    envelope = {}
  ) {
    return this.isObject(
      envelope.responsePlan
    )
      ? envelope.responsePlan
      : null;
  },

  mergeCognitiveAndExternalPlan({
    cognitivePlan = {},
    externalPlan = null
  } = {}) {
    if (!this.isObject(externalPlan)) {
      return cognitivePlan;
    }

    // The external planner may adjust presentation structure,
    // but cannot replace semantic or governance fields.
    return {
      ...cognitivePlan,

      responseShape:
        externalPlan.responseShape ||
        externalPlan.shape ||
        cognitivePlan.responseShape,

      responsePosture:
        externalPlan.responsePosture ||
        externalPlan.posture ||
        cognitivePlan.responsePosture,

      responseMoves:
        this.normalizeResponseMoves(
          externalPlan.responseMoves ||
          externalPlan.moves ||
          cognitivePlan.responseMoves
        ),

      responseOrder:
        this.normalizeResponseOrder({
          declaredOrder:
            externalPlan.responseOrder ||
            externalPlan.order,

          responseMoves:
            this.normalizeResponseMoves(
              externalPlan.responseMoves ||
              externalPlan.moves ||
              cognitivePlan.responseMoves
            )
        }),

      blueprintHint:
        externalPlan.blueprintHint ||
        cognitivePlan.blueprintHint,

      writerInstructions:
        this.mergeObjects(
          cognitivePlan.writerInstructions,

          externalPlan.writerInstructions ||
          externalPlan.writerDirective
        ),

      communicationPlan:
        externalPlan.communicationPlan ||
        cognitivePlan.communicationPlan,

      composerDirective:
        this.mergeObjects(
          cognitivePlan.composerDirective,

          externalPlan.composerDirective
        ),

      requiredBehaviors:
        this.mergeUnique(
          cognitivePlan.requiredBehaviors,

          externalPlan.requiredBehaviors,
          externalPlan.required
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          cognitivePlan.forbiddenBehaviors,

          externalPlan.forbiddenBehaviors,
          externalPlan.avoid
        ),

      constraints:
        this.mergeUnique(
          cognitivePlan.constraints,

          externalPlan.constraints
        ),

      rules:
        this.mergeUnique(
          cognitivePlan.rules,

          externalPlan.rules
        ),

      externalPlannerSource:
        externalPlan.source ||
        "ari-response-planner"
    };
  },

  // ===================================================
  // Mechanical validation
  // ===================================================

  validateResponsePlan({
    responsePlan = null,
    state = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    if (!this.isObject(responsePlan)) {
      errors.push(
        "response_plan_missing"
      );

      return {
        valid:
          false,

        reason:
          errors[0],

        errors,
        warnings
      };
    }

    if (!responsePlan.responseGoal) {
      errors.push(
        "response_goal_missing"
      );
    }

    if (!responsePlan.responseShape) {
      warnings.push(
        "response_shape_missing"
      );
    }

    if (
      responsePlan.ready !== true
    ) {
      errors.push(
        "cognitive_response_plan_not_ready"
      );
    }

    const safetyStop =
      this.resolveSafetyStop(state);

    const safetyPreserved =
      !safetyStop ||
      this.planPreservesSafety(
        responsePlan
      );

    if (!safetyPreserved) {
      errors.push(
        "binding_safety_requirement_missing"
      );
    }

    if (
      responsePlan.shouldAskQuestion ===
        true &&
      !responsePlan.questionPurpose
    ) {
      warnings.push(
        "question_purpose_missing"
      );
    }

    if (
      responsePlan
        .coachingPermissionRequired ===
        true &&
      responsePlan.adviceRequested ===
        true
    ) {
      errors.push(
        "permission_required_for_explicit_advice"
      );
    }

    const actionExecutionClaim =
      this.toArray(
        responsePlan.proposedActions
      ).some(
        action =>
          action?.executed === true ||
          action?.status === "executed" ||
          action?.status === "completed"
      );

    if (actionExecutionClaim) {
      errors.push(
        "response_plan_claimed_action_execution"
      );
    }

    const draftClaimsExecution =
      this.containsExecutionClaim(
        responsePlan.draftResponse
      );

    if (draftClaimsExecution) {
      warnings.push(
        "draft_may_claim_unverified_execution"
      );
    }

    return {
      valid:
        errors.length === 0,

      reason:
        errors[0] ||
        "response_plan_valid",

      errors,

      warnings,

      checks: {
        safetyStop,
        safetyPreserved,
        actionExecutionClaim,
        draftClaimsExecution
      },

      authority:
        "mechanical_response_plan_validation"
    };
  },

  planPreservesSafety(
    responsePlan = {}
  ) {
    const identifiers =
      this.uniqueIdentifiers([
        responsePlan.responseGoal,
        responsePlan.responseShape,
        responsePlan.responsePosture,
        responsePlan.blueprintHint,

        ...this.toArray(
          responsePlan.requiredBehaviors
        ),

        ...this.toArray(
          responsePlan.responseMoves
        ).map(
          move =>
            this.readMoveId(move)
        )
      ]);

    return this.identifiersContainAny(
      identifiers,

      [
        "safety",
        "urgent",
        "emergency",
        "crisis",
        "immediate_support",
        "protect",
        "safety_limited"
      ]
    );
  },

  resolveSafetyStop(
    summary = {}
  ) {
    return (
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary.safetyStagePacket
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true
    );
  },

  // ===================================================
  // Accepted plan normalization
  // ===================================================

  normalizeResponsePlan({
    responsePlan = {},
    state = {},
    validation = {},
    fallback = false
  } = {}) {
    const responseMoves =
      this.normalizeResponseMoves(
        responsePlan.responseMoves
      );

    const adviceRequested =
      responsePlan.adviceRequested ===
      true;

    const coachingPermissionRequired =
      adviceRequested
        ? false
        : responsePlan
            .coachingPermissionRequired ===
          true;

    const writerInstructions =
      this.normalizeWriterInstructions({
        writerInstructions:
          responsePlan.writerInstructions,

        responsePlan: {
          ...responsePlan,

          adviceRequested,

          coachingPermissionRequired
        },

        responseMoves,

        state
      });

    return {
      ...responsePlan,

      schema:
        "ari_response_plan",

      schemaVersion:
        this.schemaVersion,

      source:
        responsePlan.source ||
        "ari-response-planning-stage",

      createdAt:
        responsePlan.createdAt ||
        new Date().toISOString(),

      ready:
        true,

      usable:
        true,

      fallback,

      responseGoal:
        responsePlan.responseGoal ||
        "answer_current_request",

      responseShape:
        responsePlan.responseShape ||
        "clear_explanation",

      responsePosture:
        responsePlan.responsePosture ||
        "direct_helpful",

      responseMoves,

      responseOrder:
        this.normalizeResponseOrder({
          declaredOrder:
            responsePlan.responseOrder,

          responseMoves
        }),

      adviceRequested,

      advicePolicy:
        responsePlan.advicePolicy ||
        (
          adviceRequested
            ? "explicitly_requested"
            : "not_specified"
        ),

      coachingPermissionRequired,

      shouldAskQuestion:
        responsePlan.shouldAskQuestion ===
        true,

      questionPurpose:
        responsePlan.shouldAskQuestion ===
          true
          ? responsePlan.questionPurpose ||
            "resolve_required_ambiguity"
          : null,

      requiredBehaviors:
        this.mergeUnique(
          state.responseRequired,

          responsePlan.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          state.responseAvoid,

          responsePlan.forbiddenBehaviors,

          adviceRequested
            ? [
                "ask_permission_for_explicitly_requested_advice"
              ]
            : []
        ),

      constraints:
        this.mergeUnique(
          state.responseConstraints,

          responsePlan.constraints
        ),

      rules:
        this.mergeUnique(
          state.responseRules,

          responsePlan.rules
        ),

      writerInstructions,

      proposedActions:
        this.normalizeProposedActions(
          responsePlan.proposedActions
        ),

      validation,

      authority: {
        semanticSource:
          "cognitive_reasoning_result",

        canDefineResponseStructure:
          true,

        canEnforceSafety:
          true,

        canAddBindingConstraints:
          true,

        canReinterpretMeaning:
          false,

        canExecuteActions:
          false,

        canWriteFinalLanguage:
          false,

        canOverrideSafety:
          false,

        role:
          "canonical_response_planning_contract"
      }
    };
  },

  // ===================================================
  // Mechanical fallback
  // ===================================================

  buildFallbackResponsePlan({
    state = {},
    validation = {},
    reason =
      "response_plan_unavailable"
  } = {}) {
    const safetyStop =
      this.resolveSafetyStop(state);

    const missingContext =
      state.contextLane ===
        "missing_context" ||
      state.routingContract
        ?.contextLane ===
        "missing_context";

    const shouldAskQuestion =
      !safetyStop &&
      missingContext;

    const responseGoal =
      safetyStop
        ? "address_immediate_safety"
        : shouldAskQuestion
          ? "recover_missing_context"
          : "answer_current_request";

    const responseShape =
      safetyStop
        ? "brief_direct_safety_response"
        : shouldAskQuestion
          ? "single_clarifying_question"
          : "direct_answer";

    const responseMoves =
      safetyStop
        ? this.normalizeResponseMoves([
            "prioritize_immediate_safety",
            "provide_direct_safety_step"
          ])
        : shouldAskQuestion
          ? this.normalizeResponseMoves([
              "ask_required_clarifying_question"
            ])
          : this.normalizeResponseMoves([
              "answer_current_turn",
              "provide_brief_supporting_context"
            ]);

    return this.normalizeResponsePlan({
      state,

      validation,

      fallback:
        true,

      responsePlan: {
        schema:
          "ari_response_plan",

        schemaVersion:
          this.schemaVersion,

        source:
          "ari-response-planning-stage-fallback",

        ready:
          true,

        usable:
          true,

        fallback:
          true,

        fallbackReason:
          reason,

        responseGoal,

        responseShape,

        responsePosture:
          safetyStop
            ? "calm_direct"
            : "direct_helpful",

        responseMoves,

        responseOrder:
          responseMoves.map(
            move => move.id
          ),

        adviceRequested:
          false,

        advicePolicy:
          safetyStop
            ? "safety_first"
            : "not_specified",

        coachingPermissionRequired:
          false,

        shouldAskQuestion,

        questionPurpose:
          shouldAskQuestion
            ? "recover_missing_context"
            : null,

        requiredBehaviors:
          this.mergeUnique(
            state.responseRequired,

            safetyStop
              ? [
                  "prioritize_immediate_safety"
                ]
              : []
          ),

        forbiddenBehaviors:
          this.mergeUnique(
            state.responseAvoid,

            [
              "claim_unperformed_action",
              "rewrite_user_meaning"
            ],

            !shouldAskQuestion
              ? [
                  "ask_unnecessary_clarifying_question"
                ]
              : []
          ),

        constraints:
          this.toArray(
            state.responseConstraints
          ),

        rules:
          this.toArray(
            state.responseRules
          ),

        draftResponse:
          "",

        proposedActions:
          [],

        confidence:
          safetyStop
            ? 0.8
            : shouldAskQuestion
              ? 0.7
              : 0.4
      }
    });
  },

  // ===================================================
  // Response strategy
  // ===================================================

  buildResponseStrategy({
    state = {},
    responsePlan = {}
  } = {}) {
    return {
      schema:
        "ari_response_strategy",

      schemaVersion:
        this.schemaVersion,

      ready:
        responsePlan.ready === true &&
        responsePlan.usable === true,

      source:
        responsePlan.source ||
        "ari-response-planning-stage",

      responsePlan,

      responseGoal:
        responsePlan.responseGoal,

      responseShape:
        responsePlan.responseShape,

      responsePosture:
        responsePlan.responsePosture,

      responseMoves:
        responsePlan.responseMoves ||
        [],

      responseOrder:
        responsePlan.responseOrder ||
        [],

      adviceRequested:
        responsePlan.adviceRequested ===
        true,

      advicePolicy:
        responsePlan.advicePolicy ||
        null,

      coachingPermissionRequired:
        responsePlan
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        responsePlan.shouldAskQuestion ===
        true,

      questionPurpose:
        responsePlan.questionPurpose ||
        null,

      requiredBehaviors:
        responsePlan.requiredBehaviors ||
        [],

      forbiddenBehaviors:
        responsePlan.forbiddenBehaviors ||
        [],

      constraints:
        responsePlan.constraints ||
        [],

      rules:
        responsePlan.rules ||
        [],

      blueprintHint:
        responsePlan.blueprintHint ||
        null,

      writerInstructions:
        responsePlan.writerInstructions ||
        null,

      communicationPlan:
        responsePlan.communicationPlan ||
        null,

      composerDirective:
        responsePlan.composerDirective ||
        null,

      draftResponse:
        responsePlan.draftResponse ||
        "",

      proposedActions:
        responsePlan.proposedActions ||
        [],

      grounding:
        responsePlan.grounding ||
        null,

      confidence:
        this.normalizeConfidence(
          responsePlan.confidence
        ),

      safety: {
        shouldStopNormalResponse:
          this.resolveSafetyStop(state),

        binding:
          true
      },

      authority: {
        canDefineResponseStructure:
          true,

        canGovernWriter:
          true,

        canHandOffDraft:
          true,

        canExecuteActions:
          false,

        canReinterpretMeaning:
          false,

        canOverrideSafety:
          false,

        canWriteFinalDeliveryLanguage:
          false,

        role:
          "final_deliberation_response_strategy"
      }
    };
  },

  // ===================================================
  // Writer instructions
  // ===================================================

  normalizeWriterInstructions({
    writerInstructions = {},
    responsePlan = {},
    responseMoves = [],
    state = {}
  } = {}) {
    const source =
      this.isObject(writerInstructions)
        ? writerInstructions
        : {};

    const adviceRequested =
      responsePlan.adviceRequested ===
      true;

    const shouldAskQuestion =
      responsePlan.shouldAskQuestion ===
      true;

    return {
      ...source,

      posture:
        source.posture ||
        responsePlan.responsePosture ||
        "direct_helpful",

      shape:
        source.shape ||
        responsePlan.responseShape ||
        "clear_explanation",

      moves:
        responseMoves,

      required:
        this.mergeUnique(
          source.required,

          responsePlan.requiredBehaviors,

          adviceRequested
            ? [
                "provide_requested_advice_without_permission_seeking"
              ]
            : []
        ),

      avoid:
        this.mergeUnique(
          source.avoid,

          responsePlan.forbiddenBehaviors,

          [
            "unsupported_execution_claim",
            "semantic_reinterpretation",
            "safety_override"
          ],

          !shouldAskQuestion
            ? [
                "unnecessary_clarifying_question"
              ]
            : [],

          adviceRequested
            ? [
                "permission_seeking_for_requested_advice"
              ]
            : []
        ),

      constraints:
        this.mergeUnique(
          source.constraints,

          responsePlan.constraints,

          state.responseConstraints
        ),

      finalQuestionAllowed:
        shouldAskQuestion,

      questionPurpose:
        shouldAskQuestion
          ? responsePlan.questionPurpose
          : null,

      coachingPermissionRequired:
        adviceRequested
          ? false
          : responsePlan
              .coachingPermissionRequired ===
            true,

      modelDraftAvailable:
        Boolean(
          responsePlan.draftResponse
        ),

      draftPath:
        responsePlan.draftResponse
          ? "responsePlan.draftResponse"
          : null,

      composerDirective:
        this.mergeObjects(
          source.composerDirective,

          {
            preserveCognitiveMeaning:
              true,

            preserveResponseMoves:
              true,

            preserveMoveOrder:
              true,

            preserveSafety:
              true,

            mayImproveLanguage:
              true,

            mayReinterpretMeaning:
              false,

            mayClaimExecution:
              false
          }
        ),

      authority:
        "writer_instruction_only"
    };
  },

  // ===================================================
  // Expression handoff
  // ===================================================

  buildResponsePlanningHandoff(
    summary = {}
  ) {
    const responsePlan =
      summary.responsePlan ||
      null;

    const responseStrategy =
      summary.responseStrategy ||
      null;

    return {
      schema:
        "ari_response_planning_handoff",

      schemaVersion:
        this.schemaVersion,

      ready:
        responsePlan?.ready === true &&
        responsePlan?.usable === true &&
        responseStrategy?.ready === true,

      source:
        "ari-response-planning-stage",

      version:
        this.version,

      responsePlan,

      responseStrategy,

      cognitiveReasoningResult:
        summary.cognitiveReasoningResult ||
        null,

      draftResponse:
        responsePlan?.draftResponse ||
        "",

      responseGoal:
        responseStrategy?.responseGoal ||
        null,

      responseShape:
        responseStrategy?.responseShape ||
        null,

      responsePosture:
        responseStrategy
          ?.responsePosture ||
        null,

      responseMoves:
        responseStrategy?.responseMoves ||
        [],

      responseOrder:
        responseStrategy?.responseOrder ||
        [],

      requiredBehaviors:
        responseStrategy
          ?.requiredBehaviors ||
        [],

      forbiddenBehaviors:
        responseStrategy
          ?.forbiddenBehaviors ||
        [],

      constraints:
        responseStrategy?.constraints ||
        [],

      rules:
        responseStrategy?.rules ||
        [],

      writerInstructions:
        responseStrategy
          ?.writerInstructions ||
        null,

      composerDirective:
        responseStrategy
          ?.composerDirective ||
        null,

      proposedActions:
        responseStrategy
          ?.proposedActions ||
        [],

      nextPipeline:
        "expression",

      preferredPlanPath:
        "responsePlanningHandoff.responsePlan",

      preferredStrategyPath:
        "responsePlanningHandoff.responseStrategy",

      preferredDraftPath:
        "responsePlanningHandoff.draftResponse",

      preferredWriterInstructionsPath:
        "responsePlanningHandoff.writerInstructions",

      authority: {
        canHandOffResponsePlan:
          true,

        canHandOffResponseStrategy:
          true,

        canHandOffDraft:
          true,

        canHandOffWriterInstructions:
          true,

        canExecuteActions:
          false,

        canRenderFinalLanguage:
          false,

        canOverrideSafety:
          false,

        role:
          "deliberation_to_expression_handoff"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildResponsePlanningStagePacket(
    summary = {}
  ) {
    const responsePlan =
      summary.responsePlan ||
      null;

    const responseStrategy =
      summary.responseStrategy ||
      null;

    return {
      schema:
        "ari_response_planning_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        responsePlan?.ready === true &&
        responsePlan?.usable === true &&
        responseStrategy?.ready === true,

      ran:
        summary.responsePlanningStageRan ===
        true,

      source:
        "ari-response-planning-stage",

      version:
        this.version,

      createdAt:
        new Date().toISOString(),

      eligibility:
        summary.planningEligibility ||
        null,

      input:
        summary.responsePlanningInput ||
        null,

      cognitiveSource: {
        ready:
          summary.cognitiveReasoningResult
            ?.ready === true,

        source:
          summary.cognitiveReasoningResult
            ?.source ||
          null,

        confidence:
          summary.cognitiveReasoningResult
            ?.confidence ??
          null
      },

      externalPlanner: {
        ran:
          summary.responsePlannerRan ===
          true,

        source:
          summary.responsePlannerSource ||
          null,

        version:
          summary.responsePlannerVersion ||
          null,

        envelope:
          summary.responsePlannerEnvelope ||
          null
      },

      validation:
        summary.responsePlanValidation ||
        null,

      responsePlan,

      responseStrategy,

      handoff:
        summary.responsePlanningHandoff ||
        null,

      quality: {
        cognitiveStrategyAvailable:
          this.isObject(
            summary.cognitiveReasoningResult
              ?.responseStrategy
          ),

        cognitivePlanReady:
          summary.cognitiveReasoningResult
            ?.ready === true,

        planAccepted:
          summary.responsePlanAccepted ===
          true,

        fallbackUsed:
          responsePlan?.fallback === true,

        responseMoveCount:
          this.toArray(
            responsePlan?.responseMoves
          ).length,

        writerInstructionsAvailable:
          this.isObject(
            responsePlan
              ?.writerInstructions
          ),

        draftAvailable:
          Boolean(
            responsePlan?.draftResponse
          ),

        safetyPreserved:
          summary.responsePlanValidation
            ?.checks
            ?.safetyPreserved !== false
      },

      authority: {
        canConsumeCognitiveStrategy:
          true,

        canValidateStructure:
          true,

        canEnforceSafety:
          true,

        canCreateMechanicalFallback:
          true,

        canBuildExpressionHandoff:
          true,

        canReinterpretMeaning:
          false,

        canChooseConversationFunction:
          false,

        canChooseOfficialRoute:
          false,

        canExecuteActions:
          false,

        canWriteFinalLanguage:
          false,

        canOverrideSafety:
          false,

        role:
          "response_strategy_governance_and_expression_handoff"
      }
    };
  },

  // ===================================================
  // Planner envelopes
  // ===================================================

  buildPlannerFailureEnvelope({
    reason =
      "response_planner_unavailable"
  } = {}) {
    return {
      schema:
        "ari_response_planner_result",

      schemaVersion:
        this.schemaVersion,

      responsePlannerRan:
        false,

      source:
        "ari-response-planning-stage",

      usable:
        false,

      responsePlan:
        null,

      reason
    };
  },

  buildSkippedPlannerEnvelope({
    reason =
      "external_planner_not_required"
  } = {}) {
    return {
      schema:
        "ari_response_planner_result",

      schemaVersion:
        this.schemaVersion,

      responsePlannerRan:
        false,

      source:
        "skipped-by-planning-eligibility",

      usable:
        false,

      responsePlan:
        null,

      reason,

      raw:
        null
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  normalizeResponseMoves(
    moves = []
  ) {
    return this.toArray(moves)
      .map(
        (
          move,
          index
        ) => {
          if (
            typeof move === "string"
          ) {
            return {
              id:
                this.normalizeIdentifier(
                  move
                ),

              order:
                index + 1,

              required:
                true,

              purpose:
                null,

              contentHint:
                move,

              source:
                "cognitive-response-strategy"
            };
          }

          if (!this.isObject(move)) {
            return null;
          }

          const id =
            move.id ||
            move.move ||
            move.name ||
            move.type ||
            move.title ||
            move.point ||
            null;

          if (!id) {
            return null;
          }

          return {
            ...move,

            id:
              this.normalizeIdentifier(
                id
              ),

            order:
              Number.isFinite(
                Number(move.order)
              )
                ? Number(move.order)
                : index + 1,

            required:
              move.required !== false,

            purpose:
              move.purpose ||
              null,

            contentHint:
              move.contentHint ||
              move.hint ||
              move.content ||
              move.point ||
              null,

            source:
              move.source ||
              "cognitive-response-strategy"
          };
        }
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.order - b.order
      )
      .map(
        (
          move,
          index
        ) => ({
          ...move,

          order:
            index + 1
        })
      );
  },

  normalizeResponseOrder({
    declaredOrder = [],
    responseMoves = []
  } = {}) {
    const declared =
      this.toArray(
        declaredOrder
      )
        .map(
          value =>
            this.normalizeIdentifier(
              this.valueOf(value)
            )
        )
        .filter(Boolean);

    return declared.length
      ? [...new Set(declared)]
      : responseMoves.map(
          move => move.id
        );
  },

  normalizeProposedActions(
    actions = []
  ) {
    return this.toArray(actions)
      .filter(
        action =>
          this.isObject(action) &&
          typeof action.type ===
            "string"
      )
      .map(
        action => ({
          type:
            action.type,

          arguments:
            this.isObject(
              action.arguments
            )
              ? action.arguments
              : {},

          rationale:
            typeof action.rationale ===
              "string"
              ? action.rationale
              : "",

          requiresApproval:
            action.requiresApproval !==
            false,

          executed:
            false,

          status:
            "proposed"
        })
      );
  },

  containsExecutionClaim(
    text = ""
  ) {
    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return false;
    }

    const normalized =
      text.toLowerCase();

    return [
      "i sent",
      "i have sent",
      "i created",
      "i have created",
      "i updated",
      "i have updated",
      "i deleted",
      "i have deleted",
      "i scheduled",
      "i have scheduled",
      "has been completed",
      "was successfully completed"
    ].some(
      phrase =>
        normalized.includes(phrase)
    );
  },

  readMoveId(
    move = null
  ) {
    if (
      typeof move === "string"
    ) {
      return move;
    }

    if (!this.isObject(move)) {
      return "";
    }

    return (
      move.id ||
      move.move ||
      move.name ||
      move.type ||
      ""
    );
  },

  identifiersContainAny(
    identifiers = [],
    candidates = []
  ) {
    const source =
      this.uniqueIdentifiers(
        identifiers
      );

    const targets =
      this.uniqueIdentifiers(
        candidates
      );

    return source.some(
      identifier =>
        targets.some(
          target =>
            identifier === target ||
            identifier.includes(target) ||
            target.includes(identifier)
        )
    );
  },

  uniqueIdentifiers(
    values = []
  ) {
    return [
      ...new Set(
        this.toArray(values)
          .map(
            value =>
              this.normalizeIdentifier(
                this.valueOf(value)
              )
          )
          .filter(Boolean)
      )
    ];
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(value || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  },

  valueOf(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string"
    ) {
      return value;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    if (this.isObject(value)) {
      return (
        value.id ||
        value.name ||
        value.type ||
        value.label ||
        value.value ||
        value.text ||
        value.point ||
        ""
      );
    }

    return "";
  },

  getOriginalText(
    summary = {}
  ) {
    return String(
      summary.turn?.originalText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.originalUserMessage ||
      ""
    ).trim();
  },

  normalizeConfidence(
    value = 0
  ) {
    const source =
      this.isObject(value)
        ? value.score
        : value;

    const number =
      Number(source);

    if (!Number.isFinite(number)) {
      return 0;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
        )
      );
    }

    return Math.max(
      0,
      Math.min(1, number)
    );
  },

  mergeObjects(
    base = {},
    override = {}
  ) {
    return {
      ...(
        this.isObject(base)
          ? base
          : {}
      ),

      ...(
        this.isObject(override)
          ? override
          : {}
      )
    };
  },

  mergeUnique(
    ...values
  ) {
    const seen =
      new Set();

    return values
      .flatMap(
        value =>
          this.toArray(value)
      )
      .filter(
        item => {
          const key =
            this.normalizeIdentifier(
              this.valueOf(item)
            );

          if (
            !key ||
            seen.has(key)
          ) {
            return false;
          }

          seen.add(key);

          return true;
        }
      );
  },

  toArray(
    value
  ) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== null &&
          item !== undefined &&
          item !== ""
      );
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  isObject(
    value
  ) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }
};

console.log(
  "ARI RESPONSE PLANNING STAGE LOADED:",
  window.AriResponsePlanningStage?.version
);