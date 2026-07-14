// ari/pipeline-stages/deliberation/ari-response-planning-stage.js
// Ari Response Planning Deliberation Stage
//
// Purpose:
// Coordinate canonical response planning after continuity, safety, situation,
// memory, understanding, and reasoning have completed.
//
// V2.2.0 — Clean Canonical Rebuild / Alignment Enforcement / Writer Governance
//
// Architecture:
//
// Perception
//    ↓
// Executive Routing
//    ↓
// Continuity / Safety / Situation / Memory / Understanding / Reasoning
//    ↓
// Response Planning Stage
//    ↓
// Ari Response Planner
//    ↓
// Structural Validation
//    ↓
// Canonical Alignment Validation
//    ↓
// Accepted Plan or Canonical Fallback Plan
//    ↓
// Response Strategy
//    ↓
// Expression Pipeline
//
// Responsibilities:
// - Determine whether response planning should run.
// - Build one structured Response Planner input.
// - Execute the Response Planner when eligible.
// - Extract and validate the canonical response plan.
// - Reject plans that violate authoritative upstream obligations.
// - Prevent unnecessary clarification questions.
// - Prevent permission-seeking when advice was explicitly requested.
// - Prevent emotional exploration from replacing the primary task.
// - Preserve safety, continuity, constraints, and ordered response moves.
// - Produce the official response strategy and expression handoff.
//
// Non-responsibilities:
// - Does not reinterpret raw user language.
// - Does not choose semantic meaning.
// - Does not classify conversation function.
// - Does not choose the official route.
// - Does not override safety severity.
// - Does not retrieve continuity or memory.
// - Does not perform general reasoning.
// - Does not render blueprint sentences.
// - Does not write final user-facing language.
// - Does not select the final draft.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriResponsePlanningStage = {
  version: "2.2.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

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

    /* ===================================================
       1. PLANNING ELIGIBILITY
    =================================================== */

    const planningEligibility =
      this.resolvePlanningEligibility(
        state
      );

    state = {
      ...state,

      planningEligibility,

      shouldRunResponsePlanner:
        planningEligibility
          .runResponsePlanner
    };

    /* ===================================================
       2. CANONICAL PLANNER INPUT
    =================================================== */

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

    /* ===================================================
       3. RESPONSE PLANNER EXECUTION
    =================================================== */

    mark(
      "before responsePlanner"
    );

    const rawPlannerResult =
      planningEligibility
        .runResponsePlanner
        ? await runEngine(
            window.AriResponsePlanner ||
            window.Ari
              ?.responsePlanner,

            [
              "plan",
              "create",
              "build"
            ],

            this.buildPlannerFailureResult({
              state,

              source:
                "not-loaded",

              reason:
                "response_planner_not_loaded"
            }),

            state
          )
        : this.buildSkippedPlannerResult({
            state,

            reason:
              planningEligibility.reason
          });

    mark(
      "after responsePlanner"
    );

    /* ===================================================
       4. PLANNER ENVELOPE
    =================================================== */

    const plannerEnvelope =
      this.normalizePlannerEnvelope({
        rawPlannerResult,
        planningEligibility
      });

    const canonicalResponsePlan =
      this.extractCanonicalResponsePlan({
        plannerEnvelope,
        state
      });

    /* ===================================================
       5. STRUCTURAL VALIDATION
    =================================================== */

    const planValidation =
      this.validateResponsePlan({
        responsePlan:
          canonicalResponsePlan,

        planningEligibility
      });

    /* ===================================================
       6. CANONICAL ALIGNMENT VALIDATION
    =================================================== */

    const planAlignment =
      this.validatePlanAlignment({
        responsePlan:
          canonicalResponsePlan,

        state,
        planningEligibility
      });

    const responsePlanAccepted =
      planValidation.valid ===
        true &&
      planAlignment.valid ===
        true;

    const responsePlanRejectionReason =
      responsePlanAccepted
        ? null
        : (
            planValidation.valid !==
              true
              ? planValidation.reason
              : planAlignment.reason
          );

    /* ===================================================
       7. ACCEPT OR REBUILD PLAN
    =================================================== */

    const finalResponsePlan =
      responsePlanAccepted
        ? this.normalizeResponsePlan({
            responsePlan:
              canonicalResponsePlan,

            state,
            plannerEnvelope,
            planAlignment
          })
        : this.buildFallbackResponsePlan({
            state,

            plannerEnvelope,
            planAlignment,

            reason:
              responsePlanRejectionReason ||
              "response_plan_rejected"
          });

    state = {
      ...state,

      rawResponsePlannerResult:
        rawPlannerResult,

      responsePlannerEnvelope:
        plannerEnvelope,

      responsePlannerResult:
        plannerEnvelope,

      responsePlanValidation:
        planValidation,

      responsePlanAlignment:
        planAlignment,

      responsePlanAccepted,

      responsePlanRejectionReason,

      responsePlan:
        finalResponsePlan,

      ariResponsePlan:
        finalResponsePlan,

      understandingResponsePlan:
        finalResponsePlan,

      canonicalResponsePlan:
        finalResponsePlan,

      responsePlannerRan:
        plannerEnvelope
          .responsePlannerRan ===
        true,

      responsePlannerUsable:
        finalResponsePlan.usable ===
        true,

      responsePlannerSource:
        plannerEnvelope.source ||
        finalResponsePlan.source ||
        "unknown",

      responsePlannerVersion:
        plannerEnvelope
          .responsePlannerVersion ||
        plannerEnvelope.version ||
        null
    };

    /* ===================================================
       8. RESPONSE STRATEGY
    =================================================== */

    const responseStrategy =
      this.buildResponseStrategy({
        state,

        responsePlan:
          finalResponsePlan,

        plannerEnvelope
      });

    state = {
      ...state,

      responseStrategy,

      responseGoal:
        responseStrategy
          .responseGoal ||
        null,

      responseShape:
        responseStrategy
          .responseShape ||
        "clear_explanation",

      responsePosture:
        responseStrategy
          .responsePosture ||
        null,

      responseMoves:
        responseStrategy
          .responseMoves ||
        [],

      responseOrder:
        responseStrategy
          .responseOrder ||
        [],

      adviceRequested:
        responseStrategy
          .adviceRequested ===
        true,

      advicePolicy:
        responseStrategy
          .advicePolicy ||
        null,

      coachingPermissionRequired:
        responseStrategy
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        responseStrategy
          .shouldAskQuestion ===
        true,

      questionPurpose:
        responseStrategy
          .questionPurpose ||
        null,

      blueprintHint:
        responseStrategy
          .blueprintHint ||
        null,

      writerInstructions:
        responseStrategy
          .writerInstructions ||
        null,

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
        ),

      communicationPlan:
        responseStrategy
          .communicationPlan ||
        null,

      composerDirective:
        responseStrategy
          .composerDirective ||
        null
    };

    /* ===================================================
       9. EXPRESSION HANDOFF
    =================================================== */

    const responsePlanningHandoff =
      this.buildResponsePlanningHandoff({
        state,

        responsePlan:
          finalResponsePlan,

        responseStrategy,
        plannerEnvelope,
        planValidation,
        planAlignment
      });

    state = {
      ...state,

      responsePlanningHandoff
    };

    /* ===================================================
       10. STAGE PACKET
    =================================================== */

    state.responsePlanningStagePacket =
      this.buildResponsePlanningStagePacket(
        state
      );

    state.responsePlanningStageRan =
      true;

    state.responsePlanningStageSource =
      "ari-response-planning-stage";

    state.responsePlanningStageVersion =
      this.version;

    return state;
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolvePlanningEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary
        .developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

    const missingContext =
      summary.contextLane ===
        "missing_context" ||
      summary.laneSplit?.lane ===
        "missing_context" ||
      summary.routingContract
        ?.contextLane ===
        "missing_context";

    const existingPlan =
      this.findCanonicalPlan(
        summary
      );

    const existingPlanUsable =
      this.isUsablePlan(
        existingPlan
      );

    const runResponsePlanner =
      !developerLocked &&
      !responseLocked;

    let reason =
      "response_plan_required";

    if (developerLocked) {
      reason =
        "developer_response_locked";
    } else if (responseLocked) {
      reason =
        "response_locked";
    } else if (safetyOverride) {
      reason =
        "safety_response_plan_required";
    } else if (missingContext) {
      reason =
        "missing_context_clarification_plan_required";
    }

    return {
      runResponsePlanner,

      developerLocked,

      responseLocked,

      safetyOverride,

      missingContext,

      existingPlanAvailable:
        Boolean(existingPlan),

      existingPlanUsable,

      reason,

      source:
        "ari-response-planning-stage-eligibility",

      authority:
        "planning_applicability_only"
    };
  },

  /* =====================================================
     PLANNER INPUT
  ===================================================== */

  buildResponsePlanningInput(
    summary = {}
  ) {
    const originalText =
      this.getOriginalText(
        summary
      );

    const currentTurn =
      summary.continuityCurrentTurn ||
      summary.continuityStagePacket
        ?.currentTurn ||
      {
        originalText,

        text:
          originalText,

        normalizedText:
          String(
            summary.normalizedMessage ||
            originalText
          ).trim(),

        textPreserved:
          true,

        textWasRewritten:
          false
      };

    const reconciliation =
      this.readReconciliation(
        summary
      );

    const intentPacket =
      this.readIntentPacket(
        summary,
        reconciliation
      );

    return {
      schema:
        "ari_response_planning_input",

      schemaVersion:
        this.schemaVersion,

      source:
        "ari-response-planning-stage",

      request: {
        originalText,

        normalizedText:
          currentTurn.normalizedText ||
          summary.normalizedMessage ||
          originalText,

        currentTurn,

        originalTextPreserved:
          currentTurn
            .textWasRewritten !==
          true,

        referenceBinding:
          summary
            .continuityReferenceBinding ||
          null
      },

      canonicalContracts: {
        perception:
          summary.perceptionPacket ||
          null,

        reconciliation,

        conversationIntentPacket:
          intentPacket,

        executive:
          summary.executivePacket ||
          null,

        routing:
          summary.routingContract ||
          null,

        continuity:
          summary
            .continuityStagePacket ||
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
          summary
            .understandingStagePacket ||
          null,

        reasoning:
          summary.reasoningStagePacket ||
          null
      },

      context: {
        continuityContext:
          summary.continuityContext ||
          null,

        assembledContext:
          summary.assembledContext ||
          null,

        activeDialogueState:
          summary.activeDialogueState ||
          null,

        usableFacts:
          this.toArray(
            summary
              .continuityUsableFacts
          ),

        resolvedReferences:
          this.toArray(
            summary
              .continuityResolvedReferences
          ),

        unresolvedReferences:
          this.toArray(
            summary
              .continuityUnresolvedReferences
          ),

        memoryContext:
          summary.memoryContext ||
          summary.memoryHandoff ||
          null
      },

      humanUnderstanding: {
        language:
          summary.languageUnderstanding ||
          null,

        semantic:
          summary.semanticUnderstanding ||
          null,

        event:
          summary.eventUnderstanding ||
          null,

        meaning:
          summary.meaningInterpretation ||
          null,

        humanState:
          summary.humanState ||
          null,

        handoff:
          summary.understandingHandoff ||
          null
      },

      reasoningContext: {
        cognitiveExecutive:
          summary.cognitiveExecutive ||
          null,

        reasoning:
          summary.reasoning ||
          null,

        requirements:
          summary.reasoningRequirements ||
          null,

        situationContract:
          summary.situationContract ||
          null,

        multiLanePlan:
          summary.multiLanePlan ||
          null
      },

      controls: {
        mode:
          summary.routingContract
            ?.mode ||
          summary.conversationMode ||
          null,

        primaryIntent:
          summary.routingContract
            ?.primaryIntent ||
          summary.primaryIntent ||
          null,

        requestedOperation:
          reconciliation.semanticIntent
            ?.requestedOperation ||
          intentPacket
            ?.semanticIntent
            ?.requestedOperation ||
          summary.routingContract
            ?.requestedOperation ||
          null,

        requestedOutput:
          reconciliation.semanticIntent
            ?.requestedOutput ||
          intentPacket
            ?.semanticIntent
            ?.requestedOutput ||
          summary.routingContract
            ?.requestedOutput ||
          null,

        conversationPurpose:
          reconciliation
            .conversationPurpose
            ?.name ||
          intentPacket
            ?.conversationPurpose
            ?.name ||
          null,

        domain:
          summary.routingContract
            ?.domain ||
          summary.conversationDomain ||
          null,

        contextLane:
          summary.contextLane ||
          summary.routingContract
            ?.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          summary.routingContract
            ?.primaryLane ||
          null,

        supportLanes:
          this.toArray(
            summary
              .supportLaneSuggestions
          ),

        deferredLanes:
          this.toArray(
            summary
              .deferredLaneSuggestions
          ),

        blockedLanes:
          this.toArray(
            summary.blockedLanes
          ),

        currentResponseShape:
          summary.responseShape ||
          null,

        currentResponseGoal:
          summary.responseGoal ||
          null,

        currentResponseOrder:
          this.toArray(
            summary.responseOrder
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
            summary
              .responseConstraints
          ),

        rules:
          this.toArray(
            summary.responseRules
          )
      },

      existingPlans: {
        canonical:
          this.findCanonicalPlan(
            summary
          ),

        situation:
          summary.multiLanePlan ||
          null,

        situationContract:
          summary.situationContract ||
          null,

        communication:
          summary.communicationPlan ||
          null,

        cognitiveExecutive:
          summary.cognitiveExecutive ||
          null,

        reasoning:
          summary.reasoning ||
          null
      },

      governance: {
        safetyOverride:
          summary.safetyDisposition
            ?.shouldStopNormalResponse ===
            true ||
          summary
            .safetyShouldStopNormalResponse ===
            true,

        safetyRequiresClarification:
          summary
            .safetyRequiresClarification ===
          true,

        developerLocked:
          summary
            .developerResponseLocked ===
          true,

        responseLocked:
          summary.responseLocked ===
          true,

        missingContext:
          summary.contextLane ===
            "missing_context" ||
          summary.laneSplit?.lane ===
            "missing_context",

        currentTurnMeaningMustBePreserved:
          true,

        conversationPurposeMustBePreserved:
          true,

        routeMustBePreserved:
          true,

        safetyMustBePreserved:
          true,

        clarificationRequiresAuthorization:
          true,

        explicitAdviceMustNotRequirePermission:
          true,

        emotionalContextMustNotReplacePrimaryTask:
          true
      },

      authority: {
        canProvidePlannerInput:
          true,

        canPreserveUpstreamContracts:
          true,

        canChooseSemanticMeaning:
          false,

        canChooseConversationFunction:
          false,

        canChooseOfficialRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "structured_response_planner_input"
      }
    };
  },

  /* =====================================================
     PLANNER RESULT NORMALIZATION
  ===================================================== */

  normalizePlannerEnvelope({
    rawPlannerResult = {},
    planningEligibility = {}
  } = {}) {
    const result =
      rawPlannerResult &&
      typeof rawPlannerResult ===
        "object" &&
      !Array.isArray(
        rawPlannerResult
      )
        ? rawPlannerResult
        : {};

    const responsePlan =
      this.findCanonicalPlan(
        result
      );

    const responsePlannerRan =
      result.responsePlannerRan ===
        true ||
      (
        planningEligibility
          .runResponsePlanner ===
          true &&
        Boolean(responsePlan)
      );

    return {
      ...result,

      schema:
        result.schema ||
        "ari_response_planner_result",

      schemaVersion:
        result.schemaVersion ||
        this.schemaVersion,

      responsePlannerRan,

      responsePlannerVersion:
        result.responsePlannerVersion ||
        result.version ||
        window.AriResponsePlanner
          ?.version ||
        window.Ari
          ?.responsePlanner
          ?.version ||
        null,

      source:
        result.source ||
        result.responsePlannerSource ||
        (
          responsePlannerRan
            ? "ari-response-planner"
            : "ari-response-planning-stage"
        ),

      usable:
        result.usable ===
          true ||
        this.isUsablePlan(
          responsePlan
        ),

      responsePlan:
        responsePlan ||
        null,

      raw:
        rawPlannerResult,

      reason:
        result.reason ||
        (
          responsePlan
            ? "canonical_response_plan_available"
            : "canonical_response_plan_missing"
        ),

      authority:
        result.authority ||
        {
          role:
            "response_planner_result_wrapper"
        }
    };
  },

  extractCanonicalResponsePlan({
    plannerEnvelope = {},
    state = {}
  } = {}) {
    const candidates = [
      plannerEnvelope.responsePlan,

      plannerEnvelope
        .canonicalResponsePlan,

      plannerEnvelope
        .ariResponsePlan,

      plannerEnvelope.plan,

      plannerEnvelope.result
        ?.responsePlan,

      plannerEnvelope.output
        ?.responsePlan,

      this.looksLikeResponsePlan(
        plannerEnvelope
      )
        ? plannerEnvelope
        : null,

      this.findCanonicalPlan(
        state
      )
    ];

    return (
      candidates.find(
        candidate =>
          this.looksLikeResponsePlan(
            candidate
          )
      ) ||
      null
    );
  },

  findCanonicalPlan(
    source = {}
  ) {
    if (
      !source ||
      typeof source !==
        "object" ||
      Array.isArray(source)
    ) {
      return null;
    }

    const candidates = [
      source.canonicalResponsePlan,

      source.responsePlan,

      source.ariResponsePlan,

      source
        .understandingResponsePlan,

      source
        .responsePlannerResult
        ?.responsePlan,

      source
        .responsePlannerEnvelope
        ?.responsePlan,

      source
        .responsePlanningStagePacket
        ?.responsePlan,

      source
        .responsePlanningHandoff
        ?.responsePlan,

      source.result?.responsePlan,

      source.output?.responsePlan
    ];

    const nested =
      candidates.find(
        candidate =>
          this.looksLikeResponsePlan(
            candidate
          )
      );

    if (nested) {
      return nested;
    }

    return this.looksLikeResponsePlan(
      source
    )
      ? source
      : null;
  },

  looksLikeResponsePlan(
    value = null
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    return Boolean(
      value.schema ===
        "ari_response_plan" ||
      value.packetType ===
        "response_plan" ||
      value.responsePlanType ===
        "canonical" ||
      value.responseMoves ||
      value.moves ||
      value.responseGoal ||
      value.goal ||
      value.responseShape ||
      value.shape ||
      value.writerInstructions ||
      value.writerDirective ||
      value.advicePolicy ||
      value.blueprintHint
    );
  },

  /* =====================================================
     STRUCTURAL VALIDATION
  ===================================================== */

  validateResponsePlan({
    responsePlan = null,
    planningEligibility = {}
  } = {}) {
    if (!responsePlan) {
      return {
        valid:
          false,

        reason:
          "canonical_response_plan_missing",

        errors: [
          "canonical_response_plan_missing"
        ],

        warnings: [],

        source:
          "ari-response-planning-stage"
      };
    }

    if (
      typeof responsePlan !==
        "object" ||
      Array.isArray(responsePlan)
    ) {
      return {
        valid:
          false,

        reason:
          "response_plan_invalid_type",

        errors: [
          "response_plan_invalid_type"
        ],

        warnings: [],

        source:
          "ari-response-planning-stage"
      };
    }

    const errors = [];
    const warnings = [];

    const responseGoal =
      responsePlan.responseGoal ||
      responsePlan.goal ||
      null;

    const responseShape =
      responsePlan.responseShape ||
      responsePlan.shape ||
      null;

    const responseMoves =
      this.readResponseMoves(
        responsePlan
      );

    const writerInstructions =
      responsePlan.writerInstructions ||
      responsePlan.writerDirective ||
      null;

    if (!responseGoal) {
      warnings.push(
        "response_goal_missing"
      );
    }

    if (!responseShape) {
      warnings.push(
        "response_shape_missing"
      );
    }

    if (!responseMoves.length) {
      warnings.push(
        "response_moves_missing"
      );
    }

    if (!writerInstructions) {
      warnings.push(
        "writer_instructions_missing"
      );
    }

    if (
      planningEligibility
        .safetyOverride ===
        true &&
      !this.planPreservesSafety(
        responsePlan
      )
    ) {
      errors.push(
        "safety_override_not_preserved"
      );
    }

    const valid =
      errors.length ===
        0 &&
      Boolean(
        responseGoal ||
        responseShape ||
        responseMoves.length ||
        writerInstructions
      );

    return {
      valid,

      reason:
        valid
          ? "response_plan_valid"
          : (
              errors[0] ||
              "response_plan_incomplete"
            ),

      errors,

      warnings,

      responseMoveCount:
        responseMoves.length,

      hasResponseGoal:
        Boolean(responseGoal),

      hasResponseShape:
        Boolean(responseShape),

      hasWriterInstructions:
        Boolean(writerInstructions),

      safetyOverridePreserved:
        planningEligibility
          .safetyOverride !==
          true ||
        this.planPreservesSafety(
          responsePlan
        ),

      source:
        "ari-response-planning-stage"
    };
  },

  /* =====================================================
     CANONICAL ALIGNMENT
  ===================================================== */

  validatePlanAlignment({
    responsePlan = null,
    state = {},
    planningEligibility = {}
  } = {}) {
    const obligations =
      this.buildCanonicalResponseObligations(
        state
      );

    if (
      !responsePlan ||
      typeof responsePlan !==
        "object" ||
      Array.isArray(responsePlan)
    ) {
      return {
        valid:
          false,

        reason:
          "response_plan_missing_for_alignment",

        errors: [
          "response_plan_missing_for_alignment"
        ],

        warnings: [],

        obligations,

        checks: {},

        planEvidence: {},

        authority:
          "canonical_response_plan_alignment_validation"
      };
    }

    const moveIdentifiers =
      this.readPlanMoveIdentifiers(
        responsePlan
      );

    const requiredIdentifiers =
      this.readPlanRequiredIdentifiers(
        responsePlan
      );

    const planIdentifiers =
      this.uniqueIdentifiers([
        responsePlan.responseGoal,
        responsePlan.goal,
        responsePlan.responseShape,
        responsePlan.shape,
        responsePlan.blueprintHint,
        ...moveIdentifiers,
        ...requiredIdentifiers
      ]);

    const writerInstructions =
      responsePlan.writerInstructions ||
      responsePlan.writerDirective ||
      {};

    const planShouldAskQuestion =
      responsePlan.shouldAskQuestion ===
        true ||
      writerInstructions
        .finalQuestionAllowed ===
        true;

    const planQuestionPurpose =
      this.normalizeIdentifier(
        responsePlan.questionPurpose ||
        writerInstructions
          .questionPurpose ||
        ""
      );

    const adviceRequestedByPlan =
      responsePlan.adviceRequested ===
        true;

    const advicePolicy =
      this.normalizeIdentifier(
        responsePlan.advicePolicy ||
        ""
      );

    const coachingPermissionRequired =
      responsePlan
        .coachingPermissionRequired ===
        true;

    const directAnswerPresent =
      this.identifiersContainAny(
        planIdentifiers,

        [
          "answer",
          "direct_answer",
          "answer_current_turn",
          "answer_current_request",
          "answer_the_requested_question",
          "provide_direct_answer",
          "provide_information",
          "respond_to_request"
        ]
      );

    const recommendationPresent =
      this.identifiersContainAny(
        planIdentifiers,

        [
          "recommend",
          "recommendation",
          "provide_recommendation",
          "provide_clear_recommendation",
          "evaluate_and_recommend",
          "decide",
          "choose",
          "selection"
        ]
      );

    const comparisonPresent =
      this.identifiersContainAny(
        planIdentifiers,

        [
          "compare",
          "comparison",
          "compare_options",
          "compare_the_presented_options",
          "contrast",
          "tradeoff",
          "tradeoffs"
        ]
      );

    const explanationPresent =
      this.identifiersContainAny(
        planIdentifiers,

        [
          "explain",
          "explanation",
          "reason",
          "reasoning",
          "rationale",
          "explain_recommendation_reasoning",
          "provide_requested_explanation",
          "provide_reasoning"
        ]
      );

    const emotionalExplorationPresent =
      this.identifiersContainAny(
        planIdentifiers,

        [
          "understand_feelings_first",
          "understand_what_this_feels_like",
          "emotional_exploration",
          "explore_emotion",
          "validate_emotion_first",
          "ask_if_user_wants_advice",
          "ask_advice_or_understanding",
          "establish_emotional_preference"
        ]
      );

    const permissionSeekingPresent =
      coachingPermissionRequired ||
      this.identifiersContainAny(
        planIdentifiers,

        [
          "ask_permission",
          "ask_if_user_wants_advice",
          "ask_advice_or_understanding",
          "request_permission_to_advise",
          "permission_before_advice"
        ]
      );

    const clarificationAuthorized =
      obligations.clarificationRequired ||
      obligations.missingContext ||
      obligations
        .safetyClarificationRequired;

    const unauthorizedQuestion =
      planShouldAskQuestion &&
      !clarificationAuthorized;

    const unauthorizedPermissionSeeking =
      permissionSeekingPresent &&
      obligations
        .adviceExplicitlyRequested;

    const unauthorizedEmotionalReplacement =
      emotionalExplorationPresent &&
      obligations.primaryTaskRequired &&
      !obligations
        .emotionalSupportExplicitlyRequested;

    const missingDirectAnswer =
      obligations.directAnswerRequired &&
      !directAnswerPresent &&
      !recommendationPresent;

    const missingRecommendation =
      obligations.recommendationRequired &&
      !recommendationPresent;

    const missingComparison =
      obligations.comparisonRequired &&
      !comparisonPresent;

    const missingExplanation =
      obligations.explanationRequired &&
      !explanationPresent;

    const requiredClarificationMissing =
      clarificationAuthorized &&
      !planShouldAskQuestion;

    const adviceAuthorizationLost =
      obligations
        .adviceExplicitlyRequested &&
      (
        adviceRequestedByPlan !==
          true ||
        [
          "permission_required",
          "ask_first",
          "not_authorized",
          "withhold_advice"
        ].includes(
          advicePolicy
        )
      );

    const safetyPreserved =
      planningEligibility
        .safetyOverride !==
        true ||
      this.planPreservesSafety(
        responsePlan
      );

    const errors = [];
    const warnings = [];

    if (missingDirectAnswer) {
      errors.push(
        "required_direct_answer_missing"
      );
    }

    if (missingRecommendation) {
      errors.push(
        "required_recommendation_missing"
      );
    }

    if (missingComparison) {
      errors.push(
        "required_comparison_missing"
      );
    }

    if (missingExplanation) {
      errors.push(
        "required_explanation_missing"
      );
    }

    if (requiredClarificationMissing) {
      errors.push(
        "required_clarification_missing"
      );
    }

    if (unauthorizedQuestion) {
      errors.push(
        "unauthorized_clarifying_question"
      );
    }

    if (
      unauthorizedPermissionSeeking
    ) {
      errors.push(
        "unauthorized_advice_permission_request"
      );
    }

    if (
      unauthorizedEmotionalReplacement
    ) {
      errors.push(
        "primary_task_replaced_by_emotional_exploration"
      );
    }

    if (adviceAuthorizationLost) {
      errors.push(
        "explicit_advice_authorization_not_preserved"
      );
    }

    if (!safetyPreserved) {
      errors.push(
        "canonical_safety_requirement_missing"
      );
    }

    if (
      obligations
        .recommendationRequired &&
      adviceRequestedByPlan !==
        true
    ) {
      warnings.push(
        "planner_failed_to_mark_advice_as_requested"
      );
    }

    if (
      unauthorizedQuestion &&
      planQuestionPurpose
    ) {
      warnings.push(
        `unauthorized_question_purpose:${planQuestionPurpose}`
      );
    }

    const valid =
      errors.length ===
      0;

    return {
      valid,

      reason:
        valid
          ? "response_plan_aligned_with_canonical_request"
          : (
              errors[0] ||
              "response_plan_semantically_misaligned"
            ),

      errors,

      warnings,

      obligations,

      checks: {
        directAnswerPresent,

        recommendationPresent,

        comparisonPresent,

        explanationPresent,

        planShouldAskQuestion,

        clarificationAuthorized,

        requiredClarificationMissing,

        unauthorizedQuestion,

        permissionSeekingPresent,

        unauthorizedPermissionSeeking,

        emotionalExplorationPresent,

        unauthorizedEmotionalReplacement,

        adviceRequestedByPlan,

        adviceAuthorizationLost,

        safetyPreserved
      },

      planEvidence: {
        responseGoal:
          responsePlan.responseGoal ||
          responsePlan.goal ||
          null,

        responseShape:
          responsePlan.responseShape ||
          responsePlan.shape ||
          null,

        responseMoves:
          moveIdentifiers,

        requiredIdentifiers,

        planIdentifiers,

        adviceRequested:
          adviceRequestedByPlan,

        advicePolicy:
          responsePlan.advicePolicy ||
          null,

        shouldAskQuestion:
          planShouldAskQuestion,

        questionPurpose:
          responsePlan.questionPurpose ||
          writerInstructions
            .questionPurpose ||
          null,

        coachingPermissionRequired
      },

      authority:
        "canonical_response_plan_alignment_validation"
    };
  },

  /* =====================================================
     CANONICAL OBLIGATIONS
  ===================================================== */

  buildCanonicalResponseObligations(
    state = {}
  ) {
    const reconciliation =
      this.readReconciliation(
        state
      );

    const intentPacket =
      this.readIntentPacket(
        state,
        reconciliation
      );

    const semanticMeaning =
      state.semanticFrameOutput
        ?.canonicalMeaning ||
      state.semanticFrameResult
        ?.canonicalMeaning ||
      state.perceptionPacket
        ?.semantic
        ?.raw
        ?.canonicalMeaning ||
      {};

    const semanticRequirements =
      state.semanticFrameOutput
        ?.responseRequirements ||
      state.semanticFrameOutput
        ?.responseCharacteristics ||
      state
        .semanticResponseCharacteristics ||
      semanticMeaning
        .responseRequirements ||
      {};

    const reconciledRequirements =
      reconciliation
        .responseRequirements ||
      intentPacket
        ?.responseRequirements ||
      {};

    const conversationPurpose =
      reconciliation
        .conversationPurpose ||
      intentPacket
        ?.conversationPurpose ||
      {};

    const functionContract =
      conversationPurpose
        .responseContract ||
      state.conversationFunction
        ?.responseContract ||
      state.conversationFunctionResult
        ?.responseContract ||
      {};

    const semanticIntent =
      reconciliation.semanticIntent ||
      intentPacket?.semanticIntent ||
      {};

    const ambiguity =
      reconciliation.ambiguity ||
      intentPacket?.ambiguity ||
      state.semanticAmbiguity ||
      semanticMeaning.ambiguity ||
      {};

    const emotionalOverlay =
      state.semanticFrameOutput
        ?.emotionalOverlay ||
      state
        .semanticEmotionalOverlay ||
      semanticMeaning
        .emotionalOverlay ||
      intentPacket
        ?.context
        ?.emotional ||
      {};

    const operation =
      this.normalizeIdentifier(
        semanticIntent
          .requestedOperation ||
        semanticMeaning
          .requestedOperation ||
        state.routingContract
          ?.requestedOperation ||
        state.routingContract
          ?.primaryIntent ||
        state.primaryIntent ||
        ""
      );

    const requestedOutput =
      this.normalizeIdentifier(
        semanticIntent
          .requestedOutput ||
        semanticMeaning
          .requestedOutput ||
        state.routingContract
          ?.requestedOutput ||
        ""
      );

    const conversationFunction =
      this.normalizeIdentifier(
        conversationPurpose.name ||
        state.conversationFunction
          ?.primaryFunction ||
        state.conversationFunctionResult
          ?.primaryFunction ||
        ""
      );

    const mergedMust =
      this.uniqueIdentifiers(
        this.mergeUnique(
          semanticRequirements.must,
          reconciledRequirements.must,
          functionContract.must,
          state.responseRequired
        )
      );

    const mergedMustNot =
      this.uniqueIdentifiers(
        this.mergeUnique(
          semanticRequirements.mustNot,
          reconciledRequirements.mustNot,
          functionContract.mustNot,
          state.responseAvoid
        )
      );

    const directOperations = [
      "provide_information",
      "interpret_meaning",
      "explain_or_teach",
      "compare_options",
      "decide_or_prioritize",
      "evaluate_and_recommend",
      "verify_or_review",
      "inspect_and_explain",
      "calculate_or_convert",
      "translate",
      "provide_opinion",
      "create_artifact",
      "modify_artifact",
      "implement",
      "analyze"
    ];

    const recommendationOperations = [
      "evaluate_and_recommend",
      "decide_or_prioritize",
      "recommend",
      "recommend_option"
    ];

    const explanationOperations = [
      "interpret_meaning",
      "explain_or_teach",
      "inspect_and_explain",
      "explain_without_execution",
      "analyze"
    ];

    const directAnswerRequired =
      semanticRequirements
        .directAnswerRequested ===
        true ||
      semanticRequirements
        .expectsDirectAnswer ===
        true ||
      directOperations.includes(
        operation
      ) ||
      this.identifiersContainAny(
        mergedMust,

        [
          "answer_the_requested_question",
          "answer_current_request",
          "answer_current_turn",
          "provide_direct_answer",
          "answer_user"
        ]
      );

    const recommendationRequired =
      recommendationOperations.includes(
        operation
      ) ||
      requestedOutput.includes(
        "recommendation"
      ) ||
      semanticMeaning.actionPolicy
        ?.recommendationRequested ===
        true ||
      this.identifiersContainAny(
        mergedMust,

        [
          "provide_clear_recommendation",
          "provide_recommendation",
          "recommend_one",
          "make_recommendation"
        ]
      );

    const comparisonRequired =
      operation ===
        "compare_options" ||
      semanticMeaning.actionPolicy
        ?.comparisonRequested ===
        true ||
      this.identifiersContainAny(
        mergedMust,

        [
          "compare_the_presented_options",
          "compare_options",
          "provide_comparison"
        ]
      );

    const explanationRequired =
      semanticRequirements
        .explanationRequested ===
        true ||
      semanticRequirements
        .expectsExplanation ===
        true ||
      semanticMeaning.actionPolicy
        ?.explanationRequested ===
        true ||
      explanationOperations.includes(
        operation
      ) ||
      this.identifiersContainAny(
        mergedMust,

        [
          "provide_requested_explanation",
          "explain_reasoning",
          "provide_reasoning",
          "explain_recommendation"
        ]
      );

    const adviceExplicitlyRequested =
      recommendationRequired ||
      semanticMeaning.actionPolicy
        ?.recommendationRequested ===
        true ||
      this.identifiersContainAny(
        [
          operation,
          conversationFunction,
          ...mergedMust
        ],

        [
          "advice_request",
          "recommendation_request",
          "decision_support",
          "provide_advice",
          "provide_recommendation"
        ]
      );

    const clarificationRequired =
      ambiguity.requiresClarification ===
        true ||
      reconciliation.readiness
        ?.clarificationRequired ===
        true ||
      reconciledRequirements
        .clarificationRequired ===
        true ||
      functionContract
        .clarificationMayBeRequired ===
        true &&
      ambiguity.present ===
        true;

    const missingContext =
      state.contextLane ===
        "missing_context" ||
      state.laneSplit?.lane ===
        "missing_context" ||
      state.routingContract
        ?.contextLane ===
        "missing_context" ||
      reconciliation.readiness
        ?.missingPriorContext ===
        true;

    const safetyClarificationRequired =
      state
        .safetyRequiresClarification ===
        true ||
      state.safetyDisposition
        ?.requiresClarification ===
        true;

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      state
        .safetyShouldStopNormalResponse ===
        true ||
      reconciliation.readiness
        ?.immediateSafetyResponseRequired ===
        true;

    const emotionalSupportExplicitlyRequested =
      emotionalOverlay
        .explicitSupportRequested ===
        true ||
      intentPacket
        ?.context
        ?.emotional
        ?.explicitSupportRequested ===
        true ||
      operation ===
        "provide_emotional_support" ||
      conversationFunction ===
        "emotional_support_request";

    return {
      operation:
        operation ||
        null,

      requestedOutput:
        requestedOutput ||
        null,

      conversationFunction:
        conversationFunction ||
        null,

      primaryTaskRequired:
        Boolean(
          operation &&
          operation !==
            "respond"
        ),

      directAnswerRequired,

      recommendationRequired,

      comparisonRequired,

      explanationRequired,

      adviceExplicitlyRequested,

      clarificationRequired,

      missingContext,

      safetyClarificationRequired,

      safetyOverride,

      emotionalSupportExplicitlyRequested,

      requiredIdentifiers:
        mergedMust,

      forbiddenIdentifiers:
        mergedMustNot,

      source: {
        semanticMeaningAvailable:
          Boolean(
            semanticMeaning
              .requestedOperation
          ),

        reconciliationAvailable:
          reconciliation.available ===
          true,

        intentPacketAvailable:
          Boolean(intentPacket),

        conversationFunctionContractAvailable:
          Object.keys(
            functionContract ||
            {}
          ).length > 0
      },

      authority:
        "canonical_upstream_response_obligations"
    };
  },

  /* =====================================================
     SAFETY PRESERVATION
  ===================================================== */

  planPreservesSafety(
    responsePlan = {}
  ) {
    const identifiers =
      this.uniqueIdentifiers([
        responsePlan.responseGoal,
        responsePlan.goal,
        responsePlan.advicePolicy,
        responsePlan.responseShape,
        responsePlan.blueprintHint,

        ...this.readPlanMoveIdentifiers(
          responsePlan
        ),

        ...this.readPlanRequiredIdentifiers(
          responsePlan
        )
      ]);

    return this.identifiersContainAny(
      identifiers,

      [
        "safety",
        "emergency",
        "immediate_support",
        "protect",
        "urgent",
        "crisis",
        "direct_safety_step",
        "prioritize_immediate_safety"
      ]
    );
  },

  /* =====================================================
     ACCEPTED PLAN NORMALIZATION
  ===================================================== */

  normalizeResponsePlan({
    responsePlan = {},
    state = {},
    plannerEnvelope = {},
    planAlignment = {}
  } = {}) {
    const originalText =
      this.getOriginalText(
        state
      );

    const obligations =
      planAlignment.obligations ||
      this.buildCanonicalResponseObligations(
        state
      );

    const clarificationAuthorized =
      obligations.clarificationRequired ||
      obligations.missingContext ||
      obligations
        .safetyClarificationRequired;

    const shouldAskQuestion =
      clarificationAuthorized &&
      (
        responsePlan
          .shouldAskQuestion ===
          true ||
        responsePlan
          .writerInstructions
          ?.finalQuestionAllowed ===
          true ||
        responsePlan
          .writerDirective
          ?.finalQuestionAllowed ===
          true
      );

    const questionPurpose =
      shouldAskQuestion
        ? (
            responsePlan
              .questionPurpose ||
            responsePlan
              .writerInstructions
              ?.questionPurpose ||
            responsePlan
              .writerDirective
              ?.questionPurpose ||
            this.resolveQuestionPurpose(
              obligations
            )
          )
        : null;

    const adviceRequested =
      obligations
        .adviceExplicitlyRequested ||
      responsePlan
        .adviceRequested ===
        true;

    const coachingPermissionRequired =
      adviceRequested
        ? false
        : responsePlan
            .coachingPermissionRequired ===
          true;

    const responseMoves =
      this.normalizeResponseMoves(
        this.readResponseMoves(
          responsePlan
        )
      );

    const requiredBehaviors =
      this.mergeUnique(
        responsePlan
          .requiredBehaviors,

        responsePlan.required,

        obligations.requiredIdentifiers
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        responsePlan
          .forbiddenBehaviors,

        responsePlan.avoid,

        obligations
          .forbiddenIdentifiers,

        adviceRequested
          ? [
              "ask_permission_for_explicitly_requested_advice"
            ]
          : [],

        !clarificationAuthorized
          ? [
              "ask_unnecessary_clarifying_question"
            ]
          : [],

        obligations.primaryTaskRequired &&
        !obligations
          .emotionalSupportExplicitlyRequested
          ? [
              "replace_primary_task_with_emotional_exploration"
            ]
          : []
      );

    const constraints =
      this.mergeUnique(
        responsePlan.constraints,
        state.responseConstraints
      );

    const rules =
      this.mergeUnique(
        responsePlan.rules,
        responsePlan.responseRules,
        state.responseRules
      );

    const normalizedPlanBase = {
      ...responsePlan,

      shouldAskQuestion,

      questionPurpose,

      adviceRequested,

      coachingPermissionRequired,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules
    };

    const writerInstructions =
      this.normalizeWriterInstructions({
        writerInstructions:
          responsePlan
            .writerInstructions ||
          responsePlan
            .writerDirective ||
          {},

        responsePlan:
          normalizedPlanBase,

        responseMoves,

        clarificationAuthorized,

        adviceExplicitlyRequested:
          obligations
            .adviceExplicitlyRequested
      });

    return {
      ...normalizedPlanBase,

      schema:
        "ari_response_plan",

      schemaVersion:
        responsePlan.schemaVersion ||
        this.schemaVersion,

      source:
        responsePlan.source ||
        plannerEnvelope.source ||
        "ari-response-planner",

      version:
        responsePlan.version ||
        plannerEnvelope
          .responsePlannerVersion ||
        null,

      createdAt:
        responsePlan.createdAt ||
        new Date().toISOString(),

ready:
  true,

      usable:
        responsePlan.usable !==
        false,

      fallback:
        false,

      userQuestion:
        responsePlan.userQuestion ||
        responsePlan.question ||
        responsePlan
          .resolvedUserQuestion ||
        responsePlan.sourceQuestion ||
        originalText,

      originalUserText:
        responsePlan
          .originalUserText ||
        originalText,

      originalTextPreserved:
        true,

      responseGoal:
        responsePlan.responseGoal ||
        responsePlan.goal ||
        state.responseGoal ||
        state.primaryLane ||
        "answer_user",

      responseShape:
        responsePlan.responseShape ||
        responsePlan.shape ||
        state.responseShape ||
        "clear_explanation",

      responsePosture:
        responsePlan.responsePosture ||
        responsePlan.posture ||
        "direct_helpful",

      currentNeed:
        responsePlan.currentNeed ||
        "fulfill_authoritative_current_request",

      adviceRequested,

      advicePolicy:
        obligations
          .adviceExplicitlyRequested
          ? "explicitly_requested"
          : (
              responsePlan
                .advicePolicy ||
              "allowed_if_useful"
            ),

      coachingPermissionRequired,

      shouldAskQuestion,

      questionPurpose,

      responseMoves,

      responseOrder:
        this.normalizeResponseOrder({
          responsePlan,
          responseMoves,
          state
        }),

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules,

      blueprintHint:
        responsePlan.blueprintHint ||
        null,

      writerInstructions,

      communicationPlan:
        responsePlan
          .communicationPlan ||
        null,

      composerDirective:
        this.mergeComposerDirective({
          existing:
            responsePlan
              .composerDirective ||
            writerInstructions
              .composerDirective ||
            {},

          obligations,
          clarificationAuthorized
        }),

      confidence:
        this.normalizeConfidence(
          responsePlan.confidence ??
          plannerEnvelope.confidence ??
          state.routingConfidence ??
          0.5
        ),

      canonicalAlignment: {
        valid:
          true,

        reason:
          planAlignment.reason ||
          "response_plan_aligned_with_canonical_request",

        generatedFromCanonicalObligations:
          false,

        obligations,

        errors:
          planAlignment.errors ||
          [],

        warnings:
          planAlignment.warnings ||
          [],

        authority:
          "canonical_response_plan_alignment_record"
      },

      quality: {
        ...(
          responsePlan.quality ||
          {}
        ),

        responseMoveCount:
          responseMoves.length,

        hasResponseGoal:
          Boolean(
            responsePlan
              .responseGoal ||
            responsePlan.goal
          ),

        hasWriterInstructions:
          Boolean(
            writerInstructions
          ),

        canonicalAlignmentPassed:
          true,

        unauthorizedClarificationPrevented:
          !clarificationAuthorized,

        unauthorizedPermissionSeekingPrevented:
          obligations
            .adviceExplicitlyRequested
      },

      authority: {
        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canOrderResponseMoves:
          true,

        canDefineAdvicePolicy:
          true,

        canDefineClarificationPolicy:
          true,

        canDefineWriterInstructions:
          true,

        canValidateCanonicalAlignment:
          true,

        canChooseOfficialRoute:
          false,

        canChooseSemanticMeaning:
          false,

        canOverrideSafety:
          false,

        canRenderFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "canonical_response_planning_contract"
      }
    };
  },

  /* =====================================================
     CANONICAL FALLBACK PLAN
  ===================================================== */

  buildFallbackResponsePlan({
    state = {},
    reason =
      "response_planner_unavailable",
    plannerEnvelope = {},
    planAlignment = {}
  } = {}) {
    const obligations =
      planAlignment.obligations ||
      this.buildCanonicalResponseObligations(
        state
      );

    const safetyOverride =
      obligations.safetyOverride ===
        true ||
      state.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      state
        .safetyShouldStopNormalResponse ===
        true;

    const clarificationRequired =
      !safetyOverride &&
      (
        obligations
          .safetyClarificationRequired ||
        obligations.missingContext ||
        obligations.clarificationRequired
      );

    const responseMoves = [];

    const addMove = ({
      id,
      required = true,
      purpose = null,
      contentHint = null
    } = {}) => {
      if (!id) {
        return;
      }

      if (
        responseMoves.some(
          move =>
            move.id === id
        )
      ) {
        return;
      }

      responseMoves.push({
        id,

        order:
          responseMoves.length +
          1,

        required,

        purpose,

        contentHint,

        source:
          "ari-response-planning-stage-fallback"
      });
    };

    if (safetyOverride) {
      addMove({
        id:
          "prioritize_immediate_safety",

        purpose:
          "address_inherited_safety_requirements"
      });

      addMove({
        id:
          "give_direct_safety_step",

        purpose:
          "provide_immediate_action"
      });

      addMove({
        id:
          "preserve_original_user_request",

        required:
          false,

        purpose:
          "retain_non_safety_request_when_possible"
      });
    } else if (
      clarificationRequired
    ) {
      addMove({
        id:
          "ask_required_clarifying_question",

        purpose:
          this.resolveQuestionPurpose(
            obligations
          )
      });
    } else {
      if (
        obligations
          .comparisonRequired
      ) {
        addMove({
          id:
            "compare_the_presented_options",

          purpose:
            "fulfill_comparison_request",

          contentHint:
            "Compare the named options using criteria relevant to the user's stated situation."
        });
      }

      if (
        obligations
          .recommendationRequired
      ) {
        addMove({
          id:
            "provide_clear_recommendation",

          purpose:
            "fulfill_recommendation_request",

          contentHint:
            "State the recommendation directly without asking permission to provide advice."
        });
      }

      if (
        obligations
          .explanationRequired
      ) {
        addMove({
          id:
            obligations
              .recommendationRequired
              ? "explain_recommendation_reasoning"
              : "provide_requested_explanation",

          purpose:
            "fulfill_explanation_request",

          contentHint:
            "Explain the decisive reasoning, tradeoffs, and relevant limitations."
        });
      }

      if (
        obligations
          .directAnswerRequired &&
        !responseMoves.some(
          move =>
            [
              "provide_clear_recommendation",
              "provide_requested_explanation",
              "explain_recommendation_reasoning"
            ].includes(
              move.id
            )
        )
      ) {
        addMove({
          id:
            "answer_current_turn",

          purpose:
            "answer_authoritative_current_request"
        });
      }

      if (!responseMoves.length) {
        addMove({
          id:
            "answer_current_turn",

          purpose:
            "answer_current_request"
        });

        addMove({
          id:
            "give_brief_useful_context",

          required:
            false,

          purpose:
            "support_direct_answer"
        });
      }
    }

    const responseGoal =
      this.resolveFallbackResponseGoal({
        obligations,
        safetyOverride,
        clarificationRequired,
        state
      });

    const responseShape =
      this.resolveFallbackResponseShape({
        obligations,
        safetyOverride,
        clarificationRequired,
        state
      });

    const shouldAskQuestion =
      clarificationRequired;

    const questionPurpose =
      shouldAskQuestion
        ? this.resolveQuestionPurpose(
            obligations
          )
        : null;

    const requiredBehaviors =
      this.mergeUnique(
        state.responseRequired,

        obligations.requiredIdentifiers,

        safetyOverride
          ? [
              "prioritize_immediate_safety",
              "be_direct"
            ]
          : [],

        clarificationRequired
          ? [
              "ask_one_clear_question"
            ]
          : [],

        obligations
          .directAnswerRequired &&
        !clarificationRequired &&
        !safetyOverride
          ? [
              "answer_the_requested_question"
            ]
          : [],

        obligations
          .comparisonRequired
          ? [
              "compare_the_presented_options"
            ]
          : [],

        obligations
          .recommendationRequired
          ? [
              "provide_clear_recommendation"
            ]
          : [],

        obligations
          .explanationRequired
          ? [
              "provide_requested_explanation"
            ]
          : [],

        obligations
          .adviceExplicitlyRequested
          ? [
              "treat_advice_as_explicitly_authorized"
            ]
          : []
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        state.responseAvoid,

        obligations
          .forbiddenIdentifiers,

        safetyOverride
          ? [
              "delay",
              "casual_tone",
              "abstract_analysis"
            ]
          : [],

        clarificationRequired
          ? [
              "invent_missing_context",
              "rewrite_user_meaning"
            ]
          : [
              "ask_unnecessary_clarifying_question"
            ],

        obligations
          .adviceExplicitlyRequested
          ? [
              "ask_permission_for_explicitly_requested_advice"
            ]
          : [],

        obligations.primaryTaskRequired &&
        !obligations
          .emotionalSupportExplicitlyRequested
          ? [
              "replace_primary_task_with_emotional_exploration"
            ]
          : [],

        [
          "rewrite_user_meaning",
          "omit_required_response_moves"
        ]
      );

    const responsePosture =
      safetyOverride
        ? "calm_direct"
        : clarificationRequired
          ? "clear_precise"
          : "direct_helpful";

    const writerInstructions =
      this.normalizeWriterInstructions({
        writerInstructions: {
          posture:
            responsePosture,

          shape:
            responseShape,

          required:
            requiredBehaviors,

          avoid:
            forbiddenBehaviors,

          constraints:
            state.responseConstraints,

          maxSentences:
            safetyOverride
              ? 4
              : clarificationRequired
                ? 1
                : null,

          maxWords:
            null,

          finalQuestionAllowed:
            shouldAskQuestion,

          questionPurpose
        },

        responsePlan: {
          responsePosture,
          responseShape,
          shouldAskQuestion,
          questionPurpose,
          requiredBehaviors,
          forbiddenBehaviors,
          constraints:
            state.responseConstraints
        },

        responseMoves,

        clarificationAuthorized:
          clarificationRequired,

        adviceExplicitlyRequested:
          obligations
            .adviceExplicitlyRequested
      });

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        this.schemaVersion,

      version:
        this.version,

      source:
        "ari-response-planning-stage-fallback",

      createdAt:
        new Date().toISOString(),
ready:
  true,
      usable:
        true,

      fallback:
        true,

      fallbackReason:
        reason,

      rejectedPlannerPlan:
        plannerEnvelope
          ?.responsePlan ||
        null,

      userQuestion:
        this.getOriginalText(
          state
        ),

      originalUserText:
        this.getOriginalText(
          state
        ),

      originalTextPreserved:
        true,

      responseGoal,

      responseShape,

      responsePosture,

      currentNeed:
        safetyOverride
          ? "immediate_safety"
          : clarificationRequired
            ? "required_clarification"
            : "fulfill_authoritative_current_request",

      adviceRequested:
        obligations
          .adviceExplicitlyRequested,

      advicePolicy:
        obligations
          .adviceExplicitlyRequested
          ? "explicitly_requested"
          : safetyOverride
            ? "safety_first"
            : "allowed_if_useful",

      coachingPermissionRequired:
        false,

      shouldAskQuestion,

      questionPurpose,

      responseMoves,

      responseOrder:
        responseMoves.map(
          move =>
            move.id
        ),

      requiredBehaviors,

      forbiddenBehaviors,

      constraints:
        this.mergeUnique(
          state.responseConstraints,
          state.safetyDisposition
            ?.constraints
        ),

      rules:
        this.mergeUnique(
          state.responseRules
        ),

      blueprintHint:
        this.resolveFallbackBlueprintHint({
          obligations,
          safetyOverride,
          clarificationRequired
        }),

      writerInstructions,

      communicationPlan:
        null,

      composerDirective:
        this.mergeComposerDirective({
          existing: {},

          obligations,

          clarificationAuthorized:
            clarificationRequired
        }),

      canonicalAlignment: {
        valid:
          true,

        generatedFromCanonicalObligations:
          true,

        originalPlanRejected:
          planAlignment.valid ===
          false,

        originalPlanErrors:
          planAlignment.errors ||
          [],

        originalPlanWarnings:
          planAlignment.warnings ||
          [],

        obligations,

        authority:
          "canonical_response_plan_alignment_record"
      },

      confidence:
        safetyOverride
          ? 0.88
          : clarificationRequired
            ? 0.82
            : (
                obligations
                  .directAnswerRequired ||
                obligations
                  .recommendationRequired ||
                obligations
                  .comparisonRequired ||
                obligations
                  .explanationRequired
                  ? 0.84
                  : 0.65
              ),

      plannerEnvelope,

      quality: {
        responseMoveCount:
          responseMoves.length,

        canonicalAlignmentPassed:
          true,

        generatedFromCanonicalObligations:
          true,

        unauthorizedClarificationPrevented:
          !clarificationRequired,

        unauthorizedPermissionSeekingPrevented:
          obligations
            .adviceExplicitlyRequested,

        primaryTaskReplacementPrevented:
          obligations.primaryTaskRequired &&
          !obligations
            .emotionalSupportExplicitlyRequested
      },

      authority: {
        canDefineFallbackResponsePlan:
          true,

        canPreserveSafety:
          true,

        canPreserveOriginalTurn:
          true,

        canPreserveCanonicalObligations:
          true,

        canRejectMisalignedPlannerPlan:
          true,

        canPreventUnauthorizedClarification:
          true,

        canPreventUnauthorizedPermissionSeeking:
          true,

        canChooseOfficialRoute:
          false,

        canChooseSemanticMeaning:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        role:
          "canonical_alignment_safe_response_plan_fallback"
      }
    };
  },

  resolveFallbackResponseGoal({
    obligations = {},
    safetyOverride = false,
    clarificationRequired = false,
    state = {}
  } = {}) {
    if (safetyOverride) {
      return "address_immediate_safety";
    }

    if (clarificationRequired) {
      return this.resolveQuestionPurpose(
        obligations
      );
    }

    if (
      obligations
        .comparisonRequired &&
      obligations
        .recommendationRequired
    ) {
      return "compare_options_and_provide_clear_recommendation";
    }

    if (
      obligations
        .recommendationRequired
    ) {
      return "provide_clear_recommendation";
    }

    if (
      obligations
        .comparisonRequired
    ) {
      return "compare_presented_options";
    }

    if (
      obligations
        .explanationRequired
    ) {
      return "provide_requested_explanation";
    }

    if (
      obligations
        .directAnswerRequired
    ) {
      return "answer_current_request";
    }

    return (
      state.primaryLane ||
      state.routingContract
        ?.primaryLane ||
      state.routingContract
        ?.primaryIntent ||
      "answer_user"
    );
  },

  resolveFallbackResponseShape({
    obligations = {},
    safetyOverride = false,
    clarificationRequired = false,
    state = {}
  } = {}) {
    if (safetyOverride) {
      return "brief_direct_safety_response";
    }

    if (clarificationRequired) {
      return "single_clarifying_question";
    }

    if (
      obligations
        .comparisonRequired &&
      obligations
        .recommendationRequired &&
      obligations
        .explanationRequired
    ) {
      return "comparison_with_recommendation_and_reasoning";
    }

    if (
      obligations
        .recommendationRequired &&
      obligations
        .explanationRequired
    ) {
      return "recommendation_with_reasoning";
    }

    if (
      obligations
        .comparisonRequired
    ) {
      return "structured_comparison";
    }

    if (
      obligations
        .explanationRequired
    ) {
      return "clear_explanation";
    }

    return (
      state.responseShape ||
      state.routingContract
        ?.responseShape ||
      "direct_answer"
    );
  },

  resolveFallbackBlueprintHint({
    obligations = {},
    safetyOverride = false,
    clarificationRequired = false
  } = {}) {
    if (safetyOverride) {
      return "safety_urgent_support";
    }

    if (clarificationRequired) {
      return "required_clarification";
    }

    if (
      obligations
        .comparisonRequired &&
      obligations
        .recommendationRequired
    ) {
      return "comparison_recommendation_reasoning";
    }

    if (
      obligations
        .recommendationRequired
    ) {
      return "direct_recommendation";
    }

    if (
      obligations
        .explanationRequired
    ) {
      return "direct_explanation";
    }

    return "general_direct_response";
  },

  resolveQuestionPurpose(
    obligations = {}
  ) {
    if (
      obligations
        .safetyClarificationRequired
    ) {
      return "clarify_safety_risk";
    }

    if (obligations.missingContext) {
      return "recover_missing_context";
    }

    return "resolve_required_ambiguity";
  },

  /* =====================================================
     RESPONSE STRATEGY
  ===================================================== */

  buildResponseStrategy({
    state = {},
    responsePlan = {},
    plannerEnvelope = {}
  } = {}) {
    const safetyDisposition =
      state.safetyDisposition ||
      {};

    const understanding =
      state.understandingHandoff ||
      {};

    const memory =
      state.memoryHandoff ||
      {};

    const situationContract =
      state.situationContract ||
      {};

    const multiLanePlan =
      state.multiLanePlan ||
      {};

    const routing =
      state.routingContract ||
      {};

    const obligations =
      responsePlan
        .canonicalAlignment
        ?.obligations ||
      this.buildCanonicalResponseObligations(
        state
      );

    const clarificationAuthorized =
      obligations.clarificationRequired ||
      obligations.missingContext ||
      obligations
        .safetyClarificationRequired;

    const shouldAskQuestion =
      clarificationAuthorized &&
      responsePlan
        .shouldAskQuestion ===
      true;

    const questionPurpose =
      shouldAskQuestion
        ? (
            responsePlan
              .questionPurpose ||
            this.resolveQuestionPurpose(
              obligations
            )
          )
        : null;

    const coachingPermissionRequired =
      obligations
        .adviceExplicitlyRequested
        ? false
        : responsePlan
            .coachingPermissionRequired ===
          true;

    const responseMoves =
      this.normalizeResponseMoves(
        this.readResponseMoves(
          responsePlan
        )
      );

    const responseGoal =
      responsePlan.responseGoal ||
      multiLanePlan.responseGoal ||
      state.primaryLane ||
      routing.primaryLane ||
      routing.primaryIntent ||
      "answer_user";

    const responseShape =
      responsePlan.responseShape ||
      situationContract
        .responseShape ||
      multiLanePlan.responseShape ||
      routing.responseShape ||
      state.responseShape ||
      "clear_explanation";

    const responseOrder =
      this.normalizeResponseOrder({
        responsePlan,
        responseMoves,
        state
      });

    const requiredBehaviors =
      this.mergeUnique(
        state.responseRequired,

        responsePlan
          .requiredBehaviors,

        responsePlan.required,

        responsePlan
          .writerInstructions
          ?.required,

        safetyDisposition
          .requiredBehaviors,

        understanding
          .requiredBehaviors,

        memory.requiredBehaviors,

        situationContract
          .responseRequired,

        obligations.requiredIdentifiers
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        state.responseAvoid,

        responsePlan
          .forbiddenBehaviors,

        responsePlan.avoid,

        responsePlan
          .writerInstructions
          ?.avoid,

        safetyDisposition
          .forbiddenBehaviors,

        understanding
          .forbiddenBehaviors,

        memory
          .forbiddenBehaviors,

        obligations
          .forbiddenIdentifiers,

        !clarificationAuthorized
          ? [
              "ask_unnecessary_clarifying_question"
            ]
          : [],

        obligations
          .adviceExplicitlyRequested
          ? [
              "ask_permission_for_explicitly_requested_advice"
            ]
          : [],

        obligations.primaryTaskRequired &&
        !obligations
          .emotionalSupportExplicitlyRequested
          ? [
              "replace_primary_task_with_emotional_exploration"
            ]
          : []
      );

    const constraints =
      this.mergeUnique(
        state.responseConstraints,

        responsePlan.constraints,

        responsePlan
          .writerInstructions
          ?.constraints,

        safetyDisposition
          .constraints,

        understanding.constraints,

        situationContract
          .responseRules
      );

    const rules =
      this.mergeUnique(
        state.responseRules,

        responsePlan.rules,

        responsePlan
          .responseRules,

        situationContract
          .responseRules
      );

    const writerInstructions =
      this.normalizeWriterInstructions({
        writerInstructions:
          responsePlan
            .writerInstructions ||
          {},

        responsePlan: {
          ...responsePlan,

          shouldAskQuestion,

          questionPurpose,

          coachingPermissionRequired,

          requiredBehaviors,

          forbiddenBehaviors,

          constraints
        },

        responseMoves,

        clarificationAuthorized,

        adviceExplicitlyRequested:
          obligations
            .adviceExplicitlyRequested
      });

    return {
      schema:
        "ari_response_strategy",

      schemaVersion:
        this.schemaVersion,

      ready:
        responsePlan.usable !==
        false,

      source:
        responsePlan.source ||
        plannerEnvelope.source ||
        "ari-response-planning-stage",

      responsePlan,

      responseGoal,

      responseShape,

      responsePosture:
        responsePlan
          .responsePosture ||
        "direct_helpful",

      responseMoves,

      responseOrder,

      primaryLane:
        state.primaryLane ||
        routing.primaryLane ||
        null,

      contextLane:
        state.contextLane ||
        routing.contextLane ||
        null,

      planner:
        routing.planner ||
        state.selectedPlanner ||
        null,

      mode:
        routing.mode ||
        state.conversationMode ||
        "unknown",

      intent:
        routing.primaryIntent ||
        state.primaryIntent ||
        "unknown",

      domain:
        routing.domain ||
        state.conversationDomain ||
        "general",

      currentNeed:
        responsePlan.currentNeed ||
        null,

      adviceRequested:
        responsePlan
          .adviceRequested ===
          true ||
        obligations
          .adviceExplicitlyRequested,

      advicePolicy:
        obligations
          .adviceExplicitlyRequested
          ? "explicitly_requested"
          : (
              responsePlan
                .advicePolicy ||
              null
            ),

      coachingPermissionRequired,

      shouldAskQuestion,

      questionPurpose,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules,

      blueprintHint:
        responsePlan
          .blueprintHint ||
        null,

      writerInstructions,

      communicationNeeds:
        understanding
          .communicationNeeds ||
        [],

      communicationPlan:
        responsePlan
          .communicationPlan ||
        state.communicationPlan ||
        null,

      composerDirective:
        this.mergeComposerDirective({
          existing:
            responsePlan
              .composerDirective ||
            responsePlan
              .writerInstructions
              ?.composerDirective ||
            multiLanePlan
              .composerDirective ||
            {},

          obligations,

          clarificationAuthorized
        }),

      personalization: {
        allowed:
          memory
            .personalizationAllowed !==
          false,

        shouldMentionMemory:
          memory
            .shouldMentionMemory ===
          true,

        facts:
          memory.facts ||
          []
      },

      safety: {
        applicable:
          state.safetyApplicable ===
          true,

        riskLevel:
          state
            .resolvedSafetyRiskLevel ||
          safetyDisposition
            .riskLevel ||
          "none",

        shouldStopNormalResponse:
          state
            .safetyShouldStopNormalResponse ===
            true ||
          safetyDisposition
            .shouldStopNormalResponse ===
            true,

        requiresClarification:
          state
            .safetyRequiresClarification ===
          true,

        requiredPlanner:
          state
            .safetyRequiredPlanner ||
          null,

        communicationStyle:
          state
            .safetyCommunicationStyle ||
          null
      },

      developer: {
        applicable:
          state
            .shouldRunDeveloperLayer ===
          true,

        responseLocked:
          state
            .developerResponseLocked ===
          true,

        composerPacket:
          state
            .composerDeveloperPacket ||
          null
      },

      canonicalAlignment:
        responsePlan
          .canonicalAlignment ||
        null,

      confidence:
        this.normalizeConfidence(
          responsePlan.confidence ??
          plannerEnvelope.confidence ??
          state.routingConfidence ??
          0.5
        ),

      authority: {
        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canOrderResponseMoves:
          true,

        canDefineAdvicePolicy:
          true,

        canDefineWriterInstructions:
          true,

        canEnforceClarificationAuthorization:
          true,

        canPreventAdvicePermissionSeeking:
          true,

        canChooseOfficialRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        role:
          "final_deliberation_response_strategy"
      }
    };
  },

  /* =====================================================
     WRITER INSTRUCTIONS
  ===================================================== */

  normalizeWriterInstructions({
    writerInstructions = {},
    responsePlan = {},
    responseMoves = [],
    clarificationAuthorized = false,
    adviceExplicitlyRequested = false
  } = {}) {
    const source =
      writerInstructions &&
      typeof writerInstructions ===
        "object" &&
      !Array.isArray(
        writerInstructions
      )
        ? writerInstructions
        : {};

    const shouldAskQuestion =
      clarificationAuthorized &&
      responsePlan
        .shouldAskQuestion ===
      true;

    const questionPurpose =
      shouldAskQuestion
        ? (
            responsePlan
              .questionPurpose ||
            source.questionPurpose ||
            null
          )
        : null;

    const maxSentences =
      Number(
        source.maxSentences
      );

    const maxWords =
      Number(
        source.maxWords
      );

    const required =
      this.mergeUnique(
        source.required,

        responsePlan
          .requiredBehaviors,

        responsePlan.required,

        adviceExplicitlyRequested
          ? [
              "provide_requested_advice_without_permission_seeking"
            ]
          : []
      );

    const avoid =
      this.mergeUnique(
        source.avoid,

        responsePlan
          .forbiddenBehaviors,

        responsePlan.avoid,

        !clarificationAuthorized
          ? [
              "ask_unnecessary_clarifying_question"
            ]
          : [],

        adviceExplicitlyRequested
          ? [
              "ask_permission_for_explicitly_requested_advice"
            ]
          : []
      );

    return {
      ...source,

      posture:
        source.posture ||
        responsePlan
          .responsePosture ||
        null,

      shape:
        source.shape ||
        responsePlan
          .responseShape ||
        null,

      moves:
        responseMoves,

      required,

      avoid,

      constraints:
        this.mergeUnique(
          source.constraints,

          responsePlan.constraints
        ),

      maxSentences:
        Number.isFinite(
          maxSentences
        ) &&
        maxSentences >
        0
          ? maxSentences
          : null,

      maxWords:
        Number.isFinite(
          maxWords
        ) &&
        maxWords >
        0
          ? maxWords
          : null,

      finalQuestionAllowed:
        shouldAskQuestion,

      questionPurpose,

      coachingPermissionRequired:
        adviceExplicitlyRequested
          ? false
          : responsePlan
              .coachingPermissionRequired ===
            true,

      doNotWrite:
        this.mergeUnique(
          source.doNotWrite,

          [
            "internal pipeline commentary",
            "unsupported certainty",
            "semantic reinterpretation",
            "route changes",
            "safety overrides",
            "unnecessary clarification",
            "emotional exploration that replaces the requested task"
          ],

          adviceExplicitlyRequested
            ? [
                "permission seeking for explicitly requested advice"
              ]
            : []
        ),

      composerDirective:
        this.mergeComposerDirective({
          existing:
            source.composerDirective ||
            {},

          obligations: {
            adviceExplicitlyRequested,

            primaryTaskRequired:
              true,

            emotionalSupportExplicitlyRequested:
              false
          },

          clarificationAuthorized
        }),

      authority:
        "writer_instruction_only"
    };
  },

  mergeComposerDirective({
    existing = {},
    obligations = {},
    clarificationAuthorized = false
  } = {}) {
    const source =
      existing &&
      typeof existing ===
        "object" &&
      !Array.isArray(existing)
        ? existing
        : {};

    return {
      ...source,

      preserveCanonicalMoves:
        true,

      preserveMoveOrder:
        true,

      preserveSemanticIntent:
        true,

      preserveConversationPurpose:
        true,

      rejectUnauthorizedClarification:
        !clarificationAuthorized,

      rejectPermissionSeeking:
        obligations
          .adviceExplicitlyRequested ===
        true,

      rejectPrimaryTaskReplacement:
        obligations.primaryTaskRequired ===
          true &&
        obligations
          .emotionalSupportExplicitlyRequested !==
          true,

      safetyRequirementsMustBePreserved:
        true,

      authority:
        "response_planning_composer_directive"
    };
  },

  /* =====================================================
     RESPONSE MOVES
  ===================================================== */

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
            typeof move ===
            "string"
          ) {
            return {
              id:
                move,

              order:
                index + 1,

              required:
                true,

              purpose:
                null,

              contentHint:
                null,

              source:
                "ari-response-planner"
            };
          }

          if (
            !move ||
            typeof move !==
              "object" ||
            Array.isArray(move)
          ) {
            return null;
          }

          const id =
            move.id ||
            move.move ||
            move.name ||
            move.type ||
            null;

          if (!id) {
            return null;
          }

          const numericOrder =
            Number(
              move.order
            );

          return {
            ...move,

            id,

            order:
              Number.isFinite(
                numericOrder
              )
                ? numericOrder
                : index + 1,

            required:
              move.required !==
              false,

            purpose:
              move.purpose ||
              null,

            contentHint:
              move.contentHint ||
              move.hint ||
              move.content ||
              null,

            source:
              move.source ||
              "ari-response-planner"
          };
        }
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.order -
          b.order
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

  readResponseMoves(
    responsePlan = {}
  ) {
    return this.toArray(
      responsePlan.responseMoves ||
      responsePlan.moves ||
      responsePlan
        .writerInstructions
        ?.moves ||
      responsePlan
        .writerDirective
        ?.moves
    );
  },

  readMoveId(
    move = null
  ) {
    if (
      typeof move ===
      "string"
    ) {
      return move;
    }

    if (
      !move ||
      typeof move !==
        "object"
    ) {
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

  readPlanMoveIdentifiers(
    responsePlan = {}
  ) {
    return this.readResponseMoves(
      responsePlan
    )
      .map(
        move =>
          this.normalizeIdentifier(
            this.readMoveId(
              move
            )
          )
      )
      .filter(Boolean);
  },

  readPlanRequiredIdentifiers(
    responsePlan = {}
  ) {
    return this.uniqueIdentifiers(
      this.mergeUnique(
        responsePlan
          .requiredBehaviors,

        responsePlan.required,

        responsePlan
          .writerInstructions
          ?.required,

        responsePlan
          .writerDirective
          ?.required,

        responsePlan.rules
      )
    );
  },

  normalizeResponseOrder({
    responsePlan = {},
    responseMoves = [],
    state = {}
  } = {}) {
    const declaredOrder =
      this.toArray(
        responsePlan.responseOrder ||
        responsePlan.order
      );

    if (declaredOrder.length) {
      return this.dedupeValues(
        declaredOrder
      );
    }

    if (responseMoves.length) {
      return responseMoves.map(
        move =>
          move.id
      );
    }

    return this.mergeUnique(
      state.primaryLane,
      state.supportLaneSuggestions
    );
  },

  /* =====================================================
     EXPRESSION HANDOFF
  ===================================================== */

  buildResponsePlanningHandoff({
    state = {},
    responsePlan = {},
    responseStrategy = {},
    plannerEnvelope = {},
    planValidation = {},
    planAlignment = {}
  } = {}) {
    return {
      schema:
        "ari_response_planning_handoff",

      schemaVersion:
        this.schemaVersion,

      ready:
        responsePlan.usable !==
          false &&
        responseStrategy.ready !==
          false,

      source:
        "ari-response-planning-stage",

      version:
        this.version,

      responsePlan,

      responseStrategy,

      responseGoal:
        responseStrategy
          .responseGoal ||
        null,

      responseShape:
        responseStrategy
          .responseShape ||
        null,

      responsePosture:
        responseStrategy
          .responsePosture ||
        null,

      responseMoves:
        responseStrategy
          .responseMoves ||
        [],

      responseOrder:
        responseStrategy
          .responseOrder ||
        [],

      adviceRequested:
        responseStrategy
          .adviceRequested ===
        true,

      advicePolicy:
        responseStrategy
          .advicePolicy ||
        null,

      coachingPermissionRequired:
        responseStrategy
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        responseStrategy
          .shouldAskQuestion ===
        true,

      questionPurpose:
        responseStrategy
          .questionPurpose ||
        null,

      requiredBehaviors:
        responseStrategy
          .requiredBehaviors ||
        [],

      forbiddenBehaviors:
        responseStrategy
          .forbiddenBehaviors ||
        [],

      constraints:
        responseStrategy.constraints ||
        [],

      rules:
        responseStrategy.rules ||
        [],

      blueprintHint:
        responseStrategy
          .blueprintHint ||
        null,

      writerInstructions:
        responseStrategy
          .writerInstructions ||
        null,

      communicationPlan:
        responseStrategy
          .communicationPlan ||
        null,

      composerDirective:
        responseStrategy
          .composerDirective ||
        null,

      planner: {
        ran:
          state.responsePlannerRan ===
          true,

        usable:
          state.responsePlannerUsable ===
          true,

        source:
          state.responsePlannerSource ||
          null,

        version:
          state.responsePlannerVersion ||
          null,

        envelope:
          plannerEnvelope,

        structuralValidation:
          planValidation,

        alignmentValidation:
          planAlignment
      },

      alignment: {
        accepted:
          state.responsePlanAccepted ===
          true,

        rejectionReason:
          state
            .responsePlanRejectionReason ||
          null,

        validation:
          planAlignment,

        fallbackUsed:
          responsePlan.fallback ===
          true,

        canonicalObligations:
          responsePlan
            .canonicalAlignment
            ?.obligations ||
          null
      },

      handoff: {
        nextPipeline:
          "expression",

        preferredPlanPath:
          "responsePlanningHandoff.responsePlan",

        preferredStrategyPath:
          "responsePlanningHandoff.responseStrategy",

        preferredMovesPath:
          "responsePlanningHandoff.responseMoves",

        preferredWriterInstructionPath:
          "responsePlanningHandoff.writerInstructions",

        preferredComposerDirectivePath:
          "responsePlanningHandoff.composerDirective"
      },

      authority: {
        canHandOffResponsePlan:
          true,

        canHandOffResponseStrategy:
          true,

        canHandOffWriterInstructions:
          true,

        canHandOffComposerDirective:
          true,

        canRenderBlueprintLanguage:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "deliberation_to_expression_response_plan_handoff"
      }
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildResponsePlanningStagePacket(
    summary = {}
  ) {
    const responsePlan =
      summary.responsePlan ||
      summary.ariResponsePlan ||
      null;

    const responseStrategy =
      summary.responseStrategy ||
      null;

    const responseMoves =
      responseStrategy
        ?.responseMoves ||
      responsePlan
        ?.responseMoves ||
      [];

    const alignment =
      summary.responsePlanAlignment ||
      null;

    return {
      schema:
        "ari_response_planning_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
  Boolean(responsePlan) &&
  responsePlan.ready ===
    true &&
  responsePlan.usable ===
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

      planner: {
        ran:
          summary.responsePlannerRan ===
          true,

        usable:
          summary
            .responsePlannerUsable ===
          true,

        source:
          summary
            .responsePlannerSource ||
          null,

        version:
          summary
            .responsePlannerVersion ||
          null,

        envelope:
          summary
            .responsePlannerEnvelope ||
          null,

        raw:
          summary
            .rawResponsePlannerResult ||
          null,

        structuralValidation:
          summary
            .responsePlanValidation ||
          null,

        alignmentValidation:
          alignment
      },

      alignment: {
        accepted:
          summary
            .responsePlanAccepted ===
          true,

        rejectionReason:
          summary
            .responsePlanRejectionReason ||
          null,

        validation:
          alignment,

        canonicalObligations:
          responsePlan
            ?.canonicalAlignment
            ?.obligations ||
          null,

        fallbackUsed:
          responsePlan?.fallback ===
          true
      },

      responsePlan,

      strategy:
        responseStrategy,

      responseControl: {
        goal:
          summary.responseGoal ||
          responsePlan
            ?.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          responsePlan
            ?.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          responsePlan
            ?.responsePosture ||
          null,

        moves:
          responseMoves,

        order:
          summary.responseOrder ||
          responsePlan
            ?.responseOrder ||
          [],

        adviceRequested:
          summary.adviceRequested ===
            true ||
          responsePlan
            ?.adviceRequested ===
            true,

        advicePolicy:
          summary.advicePolicy ||
          responsePlan
            ?.advicePolicy ||
          null,

        coachingPermissionRequired:
          summary
            .coachingPermissionRequired ===
          true,

        shouldAskQuestion:
          summary.shouldAskQuestion ===
          true,

        questionPurpose:
          summary.questionPurpose ||
          null,

        blueprintHint:
          summary.blueprintHint ||
          responsePlan
            ?.blueprintHint ||
          null,

        writerInstructions:
          summary.writerInstructions ||
          responsePlan
            ?.writerInstructions ||
          null,

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      handoff:
        summary
          .responsePlanningHandoff ||
        null,

      quality: {
        canonicalPlanAvailable:
          Boolean(responsePlan),

        canonicalPlanUsable:
          Boolean(responsePlan) &&
          responsePlan.usable !==
            false,

        plannerRan:
          summary.responsePlannerRan ===
          true,

        plannerUsable:
          summary
            .responsePlannerUsable ===
          true,

        structuralValidationPassed:
          summary
            .responsePlanValidation
            ?.valid ===
          true,

        semanticAlignmentPassed:
          alignment?.valid ===
          true,

        plannerPlanAccepted:
          summary
            .responsePlanAccepted ===
          true,

        plannerPlanRejected:
          summary
            .responsePlanAccepted ===
            false &&
          Boolean(
            summary
              .responsePlanRejectionReason
          ),

        fallbackUsed:
          responsePlan?.fallback ===
          true,

        canonicalFallbackUsed:
          responsePlan?.fallback ===
            true &&
          responsePlan
            ?.canonicalAlignment
            ?.generatedFromCanonicalObligations ===
            true,

        responseMoveCount:
          this.toArray(
            responseMoves
          ).length,

        hasWriterInstructions:
          Boolean(
            responsePlan
              ?.writerInstructions
          ),

        hasBlueprintHint:
          Boolean(
            responsePlan
              ?.blueprintHint
          ),

        originalTextPreserved:
          responsePlan
            ?.originalTextPreserved !==
          false,

        unauthorizedClarificationDetected:
          alignment
            ?.errors
            ?.includes(
              "unauthorized_clarifying_question"
            ) ===
          true,

        unauthorizedClarificationPrevented:
          (
            alignment
              ?.errors
              ?.includes(
                "unauthorized_clarifying_question"
              ) ===
            true
          ) &&
          responsePlan?.fallback ===
            true,

        unauthorizedPermissionSeekingDetected:
          alignment
            ?.errors
            ?.includes(
              "unauthorized_advice_permission_request"
            ) ===
          true,

        unauthorizedPermissionSeekingPrevented:
          (
            alignment
              ?.errors
              ?.includes(
                "unauthorized_advice_permission_request"
              ) ===
            true
          ) &&
          responsePlan?.fallback ===
            true,

        primaryTaskReplacementDetected:
          alignment
            ?.errors
            ?.includes(
              "primary_task_replaced_by_emotional_exploration"
            ) ===
          true,

        primaryTaskReplacementPrevented:
          (
            alignment
              ?.errors
              ?.includes(
                "primary_task_replaced_by_emotional_exploration"
              ) ===
            true
          ) &&
          responsePlan?.fallback ===
            true
      },

      authority: {
        canCoordinateResponsePlanner:
          true,

        canValidateResponsePlan:
          true,

        canValidateCanonicalAlignment:
          true,

        canRejectMisalignedPlannerPlan:
          true,

        canPreventUnauthorizedClarification:
          true,

        canPreventUnauthorizedPermissionSeeking:
          true,

        canPreventPrimaryTaskReplacement:
          true,

        canNormalizeResponsePlan:
          true,

        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canOrderResponseMoves:
          true,

        canMergeDeliberationConstraints:
          true,

        canBuildExpressionHandoff:
          true,

        canChooseFinalRoute:
          false,

        canChooseSemanticMeaning:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        canRenderBlueprintLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "canonical_response_plan_orchestration_and_expression_handoff"
      }
    };
  },

  /* =====================================================
     PLANNER FALLBACK ENVELOPES
  ===================================================== */

  buildPlannerFailureResult({
    state = {},
    reason =
      "response_planner_unavailable",
    source =
      "ari-response-planning-stage"
  } = {}) {
    return {
      schema:
        "ari_response_planner_result",

      schemaVersion:
        this.schemaVersion,

      responsePlannerRan:
        false,

      responsePlannerVersion:
        window.AriResponsePlanner
          ?.version ||
        window.Ari
          ?.responsePlanner
          ?.version ||
        null,

      source,

      usable:
        false,

      responsePlan:
        null,

      reason,

      userQuestion:
        this.getOriginalText(
          state
        )
    };
  },

  buildSkippedPlannerResult({
    state = {},
    reason =
      "response_planner_not_required"
  } = {}) {
    const existingPlan =
      this.findCanonicalPlan(
        state
      );

    return {
      schema:
        "ari_response_planner_result",

      schemaVersion:
        this.schemaVersion,

      responsePlannerRan:
        false,

      responsePlannerVersion:
        window.AriResponsePlanner
          ?.version ||
        window.Ari
          ?.responsePlanner
          ?.version ||
        null,

      source:
        "skipped-by-planning-eligibility",

      usable:
        this.isUsablePlan(
          existingPlan
        ),

      responsePlan:
        existingPlan,

      reason
    };
  },

  /* =====================================================
     UPSTREAM CONTRACT READERS
  ===================================================== */

  readReconciliation(
    state = {}
  ) {
    const raw =
      state.perceptionReconciliation ||
      state
        .perceptionReconciliationResult ||
      state.perceptionPacket
        ?.reconciliation
        ?.raw ||
      {};

    return {
      ...raw,

      available:
        raw.perceptionReconciliationRan ===
          true ||
        state.perceptionPacket
          ?.reconciliation
          ?.available ===
          true,

      semanticIntent:
        raw.semanticIntent ||
        state.perceptionPacket
          ?.reconciliation
          ?.semanticIntent ||
        null,

      conversationPurpose:
        raw.conversationPurpose ||
        state.perceptionPacket
          ?.reconciliation
          ?.conversationPurpose ||
        null,

      responseRequirements:
        raw.responseRequirements ||
        state.perceptionPacket
          ?.reconciliation
          ?.responseRequirements ||
        null,

      ambiguity:
        raw.ambiguity ||
        state.perceptionPacket
          ?.reconciliation
          ?.ambiguity ||
        null,

      readiness:
        raw.readiness ||
        state.perceptionPacket
          ?.reconciliation
          ?.readiness ||
        {}
    };
  },

  readIntentPacket(
    state = {},
    reconciliation = {}
  ) {
    return (
      state.conversationIntentPacket ||
      state.unifiedIntentPacket ||
      state.reconciledIntentPacket ||
      reconciliation
        .conversationIntentPacket ||
      reconciliation
        .unifiedIntentPacket ||
      state.perceptionPacket
        ?.conversationIntentPacket ||
      state.perceptionPacket
        ?.unifiedIntentPacket ||
      state.perceptionPacket
        ?.reconciliation
        ?.packet ||
      null
    );
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  isUsablePlan(
    responsePlan = null
  ) {
    return Boolean(
      this.looksLikeResponsePlan(
        responsePlan
      ) &&
      responsePlan.usable !==
        false
    );
  },

  identifiersContainAny(
    identifiers = [],
    candidates = []
  ) {
    const normalizedIdentifiers =
      this.uniqueIdentifiers(
        identifiers
      );

    const normalizedCandidates =
      this.uniqueIdentifiers(
        candidates
      );

    return normalizedIdentifiers.some(
      identifier =>
        normalizedCandidates.some(
          candidate =>
            identifier ===
              candidate ||
            identifier.includes(
              candidate
            ) ||
            candidate.includes(
              identifier
            )
        )
    );
  },

  uniqueIdentifiers(
    values = []
  ) {
    const identifiers =
      this.toArray(values)
        .map(
          value =>
            this.normalizeIdentifier(
              this.valueOf(
                value
              )
            )
        )
        .filter(Boolean);

    return [
      ...new Set(
        identifiers
      )
    ];
  },

  dedupeValues(
    values = []
  ) {
    const seen =
      new Set();

    return this.toArray(values)
      .filter(
        value => {
          const key =
            this.normalizeIdentifier(
              this.valueOf(
                value
              )
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

  mergeUnique(
    ...values
  ) {
    const items =
      values.flatMap(
        value =>
          this.toArray(
            value
          )
      );

    const seen =
      new Set();

    return items.filter(
      item => {
        const key =
          this.normalizeIdentifier(
            this.valueOf(
              item
            )
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
    if (
      Array.isArray(value)
    ) {
      return value.filter(
        item =>
          item !==
            null &&
          item !==
            undefined &&
          item !==
            ""
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [value];
  },

  valueOf(
    value
  ) {
    if (
      value ===
        null ||
      value ===
        undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    if (
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return String(value);
    }

    if (
      typeof value ===
      "object"
    ) {
      return (
        value.id ||
        value.move ||
        value.operation ||
        value.requestedOutput ||
        value.name ||
        value.type ||
        value.value ||
        value.label ||
        value.text ||
        value.purpose ||
        value.claim ||
        ""
      );
    }

    return String(value);
  },

  getOriginalText(
    summary = {}
  ) {
    return String(
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
    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value
          .toLowerCase()
          .trim();

      const labels = {
        none:
          0,

        very_low:
          0.2,

        low:
          0.4,

        medium:
          0.65,

        high:
          0.85,

        very_high:
          0.95
      };

      if (
        labels[normalized] !==
        undefined
      ) {
        return labels[normalized];
      }
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
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
      Math.min(
        1,
        number
      )
    );
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  }
};

console.log(
  "ARI RESPONSE PLANNING STAGE LOADED:",
  window.AriResponsePlanningStage?.version
);