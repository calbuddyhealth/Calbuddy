// ari/pipeline-stages/deliberation/ari-response-planning-stage.js
// Ari Response Planning Deliberation Stage
//
// Purpose:
// Coordinate canonical response planning after continuity, safety, situation,
// memory, understanding, and reasoning have completed.
//
// V2.1.0 — Canonical Plan Alignment / Unauthorized Clarification Prevention
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
// Canonical ari_response_plan
//    ↓
// Expression Pipeline
//
// Responsibilities:
// - Determine whether response planning should run.
// - Build one structured input for the Response Planner.
// - Run the Response Planner.
// - Extract the canonical response plan from the planner wrapper.
// - Validate and normalize the response plan.
// - Preserve ordered response moves.
// - Preserve advice, clarification, safety, and communication policy.
// - Merge response governance into downstream compatibility fields.
// - Build the official Response Planning Stage Packet.
//
// Non-responsibilities:
// - Does not reinterpret raw language.
// - Does not choose semantic meaning.
// - Does not classify conversation function.
// - Does not choose the official route.
// - Does not override safety.
// - Does not retrieve continuity or memory.
// - Does not perform general reasoning.
// - Does not render blueprint sentences.
// - Does not write final user-facing language.
// - Does not select the final draft.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriResponsePlanningStage = {
  version: "2.0.0",
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

    // =================================================
    // 1. Planning eligibility
    // =================================================

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

    // =================================================
    // 2. Build canonical planner input
    // =================================================

    const responsePlanningInput =
      this.buildResponsePlanningInput(
        state
      );

    state = {
      ...state,

      responsePlanningInput
    };

    // =================================================
    // 3. Run Response Planner
    // =================================================

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
              reason:
                "response_planner_not_loaded",

              source:
                "not-loaded",

              state
            }),

            {
              ...state,

              responsePlanningInput,

              /*
               * Explicit structured aliases for planners that
               * consume input.summary or direct packet fields.
               */
              responsePlannerInput:
                responsePlanningInput,

              canonicalResponsePlanningInput:
                responsePlanningInput
            }
          )
        : this.buildSkippedPlannerResult({
            state,

            reason:
              planningEligibility.reason
          });

    mark(
      "after responsePlanner"
    );

    // =================================================
    // 4. Normalize planner wrapper
    // =================================================

    const plannerEnvelope =
      this.normalizePlannerEnvelope({
        rawPlannerResult,
        state,
        planningEligibility
      });

    const canonicalResponsePlan =
      this.extractCanonicalResponsePlan({
        plannerEnvelope,
        state
      });

        const planValidation =
      this.validateResponsePlan({
        responsePlan:
          canonicalResponsePlan,

        state,
        planningEligibility
      });

    /*
     * Structural validity is not enough.
     *
     * The plan must also preserve the authoritative semantic
     * request, conversation function, clarification policy,
     * response requirements, and explicit advice authorization.
     */
    const planAlignment =
      this.validatePlanAlignment({
        responsePlan:
          canonicalResponsePlan,

        state,
        planningEligibility
      });

    const planAccepted =
      planValidation.valid ===
        true &&
      planAlignment.valid ===
        true;

    const rejectionReason =
      planValidation.valid !==
        true
        ? planValidation.reason
        : planAlignment.reason;

    const finalResponsePlan =
      planAccepted
        ? this.normalizeResponsePlan({
            responsePlan:
              canonicalResponsePlan,

            state,
            plannerEnvelope,

            planAlignment
          })
        : this.buildFallbackResponsePlan({
            state,

            reason:
              rejectionReason ||
              "response_plan_rejected",

            plannerEnvelope,

            planAlignment
          });

    state = {
      ...state,

      responsePlannerResult:
        plannerEnvelope,

      responsePlannerEnvelope:
        plannerEnvelope,

      rawResponsePlannerResult:
        rawPlannerResult,

      responsePlanValidation:
        planValidation,
      
      responsePlanAlignment:
        planAlignment,

      responsePlanAccepted:
        planAccepted,

      responsePlanRejectionReason:
        planAccepted
          ? null
          : rejectionReason,
      /*
       * Canonical response plan.
       */
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
        plannerEnvelope.version ||
        plannerEnvelope
          .responsePlannerVersion ||
        null
    };

    // =================================================
    // 5. Build response strategy
    // =================================================

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
        state.responseGoal ||
        null,

      responseShape:
        responseStrategy
          .responseShape ||
        state.responseShape ||
        "clear_explanation",

      responsePosture:
        responseStrategy
          .responsePosture ||
        state.responsePosture ||
        null,

      responseOrder:
        responseStrategy
          .responseOrder ||
        state.responseOrder ||
        [],

      responseMoves:
        responseStrategy
          .responseMoves ||
        state.responseMoves ||
        [],

      advicePolicy:
        responseStrategy
          .advicePolicy ||
        state.advicePolicy ||
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
        state.blueprintHint ||
        null,

      writerInstructions:
        responseStrategy
          .writerInstructions ||
        state.writerInstructions ||
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
        state.communicationPlan ||
        null,

      composerDirective:
        responseStrategy
          .composerDirective ||
        state.composerDirective ||
        null
    };

    // =================================================
    // 6. Build expression handoff
    // =================================================

    const responsePlanningHandoff =
      this.buildResponsePlanningHandoff({
        state,
        responsePlan:
          finalResponsePlan,

        responseStrategy,
        plannerEnvelope,
        planValidation
      });

    state = {
      ...state,

      responsePlanningHandoff
    };

    // =================================================
    // 7. Stage packet
    // =================================================

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

    const existingCanonicalPlan =
      this.findCanonicalPlan(
        summary
      );

    const existingPlanUsable =
      this.isUsablePlan(
        existingCanonicalPlan
      );

    const runResponsePlanner =
      !developerLocked &&
      !responseLocked;

    return {
      runResponsePlanner,

      developerLocked,

      responseLocked,

      safetyOverride,

      missingContext,

      existingPlanAvailable:
        Boolean(
          existingCanonicalPlan
        ),

      existingPlanUsable,

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : safetyOverride
              ? "safety_response_plan_required"
              : missingContext
                ? "missing_context_clarification_plan_required"
                : "response_plan_required",

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

      // -----------------------------------------------
      // Official upstream contracts
      // -----------------------------------------------

      perception:
        summary.perceptionPacket ||
        null,

      executive:
        summary.executivePacket ||
        null,

      routing:
        summary.routingContract ||
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

      reasoning:
        summary.reasoningStagePacket ||
        null,

      // -----------------------------------------------
      // Structured stage outputs
      // -----------------------------------------------

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
          summary.continuityUsableFacts ||
          [],

        resolvedReferences:
          summary
            .continuityResolvedReferences ||
          [],

        unresolvedReferences:
          summary
            .continuityUnresolvedReferences ||
          [],

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

      // -----------------------------------------------
      // Official response controls
      // -----------------------------------------------

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

      // -----------------------------------------------
      // Existing plan evidence
      // -----------------------------------------------

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

      // -----------------------------------------------
      // Governance
      // -----------------------------------------------

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

        routeMustBePreserved:
          true,

        safetyMustBePreserved:
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
    state = {},
    planningEligibility = {}
  } = {}) {
    const result =
      rawPlannerResult &&
      typeof rawPlannerResult ===
        "object"
        ? rawPlannerResult
        : {};

    const nestedPlan =
      this.findCanonicalPlan(
        result
      );

    return {
      ...result,

      schema:
        result.schema ||
        "ari_response_planner_result",

      schemaVersion:
        result.schemaVersion ||
        this.schemaVersion,

      responsePlannerRan:
        result.responsePlannerRan ===
          true ||
        (
          planningEligibility
            .runResponsePlanner ===
            true &&
          Boolean(
            nestedPlan
          )
        ),

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
          result.responsePlannerRan ===
          true
            ? "ari-response-planner"
            : "ari-response-planning-stage"
        ),

      usable:
        result.usable ===
          true ||
        this.isUsablePlan(
          nestedPlan
        ),

      responsePlan:
        nestedPlan ||
        null,

      raw:
        rawPlannerResult,

      reason:
        result.reason ||
        (
          nestedPlan
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

      /*
       * Compatibility with a planner returning the plan
       * directly instead of a wrapper.
       */
      this.looksLikeResponsePlan(
        plannerEnvelope
      )
        ? plannerEnvelope
        : null,

      /*
       * Existing state is evidence of last resort.
       */
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
        "object"
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
        ?.responsePlan
    ];

    return (
      candidates.find(
        candidate =>
          this.looksLikeResponsePlan(
            candidate
          )
      ) ||
      (
        this.looksLikeResponsePlan(
          source
        )
          ? source
          : null
      )
    );
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
      value.responseGoal ||
      value.responseShape ||
      value.writerInstructions ||
      value.advicePolicy ||
      value.blueprintHint
    );
  },

  validateResponsePlan({
    responsePlan = null,
    state = {},
    planningEligibility = {}
  } = {}) {
    if (!responsePlan) {
      return {
        valid:
          false,

        reason:
          "canonical_response_plan_missing",

        errors: [
          "No canonical response plan was returned by the Response Planner."
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
          "The response plan was not an object."
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

    if (
      responseMoves.length ===
      0
    ) {
      warnings.push(
        "response_moves_missing"
      );
    }

    if (!writerInstructions) {
      warnings.push(
        "writer_instructions_missing"
      );
    }

    const safetyOverride =
      planningEligibility
        .safetyOverride ===
      true;

    if (
      safetyOverride &&
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
          : errors[0] ||
            "response_plan_incomplete",

      errors,

      warnings,

      responseMoveCount:
        responseMoves.length,

      hasResponseGoal:
        Boolean(
          responseGoal
        ),

      hasResponseShape:
        Boolean(
          responseShape
        ),

      hasWriterInstructions:
        Boolean(
          writerInstructions
        ),

      safetyOverridePreserved:
        !safetyOverride ||
        this.planPreservesSafety(
          responsePlan
        ),

      source:
        "ari-response-planning-stage"
    };
  },

  /* =====================================================
     CANONICAL PLAN ALIGNMENT
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
          "The planner did not provide a response plan that could be checked against the canonical request."
        ],

        warnings: [],

        obligations,

        checks: {},

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

    const goalIdentifier =
      this.normalizeIdentifier(
        responsePlan.responseGoal ||
        responsePlan.goal ||
        ""
      );

    const shapeIdentifier =
      this.normalizeIdentifier(
        responsePlan.responseShape ||
        responsePlan.shape ||
        ""
      );

    const blueprintIdentifier =
      this.normalizeIdentifier(
        responsePlan.blueprintHint ||
        ""
      );

    const planIdentifiers =
      this.dedupeValues([
        goalIdentifier,
        shapeIdentifier,
        blueprintIdentifier,
        ...moveIdentifiers,
        ...requiredIdentifiers
      ])
        .map(value =>
          this.normalizeIdentifier(
            this.valueOf(value)
          )
        )
        .filter(Boolean);

    const planShouldAskQuestion =
      responsePlan.shouldAskQuestion ===
        true ||
      responsePlan
        .writerInstructions
        ?.finalQuestionAllowed ===
        true;

    const planQuestionPurpose =
      this.normalizeIdentifier(
        responsePlan.questionPurpose ||
        responsePlan
          .writerInstructions
          ?.questionPurpose ||
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
          "answer_the_requested_question",
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
          "provide_clear_recommendation",
          "evaluate_and_recommend",
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
          "provide_requested_explanation"
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
      obligations.safetyClarificationRequired;

    const unauthorizedQuestion =
      planShouldAskQuestion &&
      !clarificationAuthorized &&
      obligations.directAnswerRequired;

    const unauthorizedPermissionSeeking =
      permissionSeekingPresent &&
      obligations.adviceExplicitlyRequested;

    const unauthorizedEmotionalReplacement =
      emotionalExplorationPresent &&
      !obligations
        .emotionalSupportExplicitlyRequested &&
      obligations.primaryTaskRequired;

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

    const adviceAuthorizationLost =
      obligations.adviceExplicitlyRequested &&
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

    const questionPurposeConflict =
      unauthorizedQuestion &&
      Boolean(
        planQuestionPurpose
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

    if (questionPurposeConflict) {
      warnings.push(
        `unauthorized_question_purpose:${planQuestionPurpose}`
      );
    }

    if (
      obligations.recommendationRequired &&
      responsePlan.adviceRequested !==
        true
    ) {
      warnings.push(
        "planner_failed_to_mark_advice_as_requested"
      );
    }

    if (
      obligations.clarificationRequired &&
      !planShouldAskQuestion
    ) {
      errors.push(
        "required_clarification_missing"
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
        "canonical_safety_requirement_missing"
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
          : errors[0] ||
            "response_plan_semantically_misaligned",

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

        unauthorizedQuestion,

        unauthorizedPermissionSeeking,

        unauthorizedEmotionalReplacement,

        adviceRequestedByPlan,

        adviceAuthorizationLost,

        emotionalExplorationPresent,

        permissionSeekingPresent,

        safetyPreserved:
          planningEligibility
            .safetyOverride !==
            true ||
          this.planPreservesSafety(
            responsePlan
          )
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

        adviceRequested:
          responsePlan.adviceRequested ===
          true,

        advicePolicy:
          responsePlan.advicePolicy ||
          null,

        shouldAskQuestion:
          responsePlan.shouldAskQuestion ===
          true,

        questionPurpose:
          responsePlan.questionPurpose ||
          null,

        coachingPermissionRequired:
          responsePlan
            .coachingPermissionRequired ===
          true
      },

      authority:
        "canonical_response_plan_alignment_validation"
    };
  },

  buildCanonicalResponseObligations(
    state = {}
  ) {
    const reconciliation =
      state.perceptionReconciliation ||
      state
        .perceptionReconciliationResult ||
      state.perceptionPacket
        ?.reconciliation
        ?.raw ||
      {};

    const intentPacket =
      state.conversationIntentPacket ||
      state.unifiedIntentPacket ||
      state.reconciledIntentPacket ||
      reconciliation
        .conversationIntentPacket ||
      reconciliation
        .unifiedIntentPacket ||
      state.perceptionPacket
        ?.conversationIntentPacket ||
      null;

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

    const semanticResponseRequirements =
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

    const conversationFunctionContract =
      state.conversationFunction
        ?.responseContract ||
      state
        .conversationFunctionResult
        ?.responseContract ||
      intentPacket
        ?.conversationPurpose
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
        intentPacket
          ?.semanticIntent
          ?.requestedOperation ||
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

    const mergedMust =
      this.mergeUnique(
        semanticResponseRequirements.must,
        reconciledRequirements.must,
        conversationFunctionContract.must,
        state.responseRequired
      )
        .map(value =>
          this.normalizeIdentifier(
            this.valueOf(value)
          )
        )
        .filter(Boolean);

    const directAnswerRequired =
      semanticResponseRequirements
        .directAnswerRequested ===
        true ||
      semanticResponseRequirements
        .expectsDirectAnswer ===
        true ||
      this.identifiersContainAny(
        mergedMust,
        [
          "answer_the_requested_question",
          "answer_current_request",
          "answer_current_turn",
          "provide_direct_answer"
        ]
      ) ||
      [
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
        "provide_opinion"
      ].includes(operation);

    const recommendationRequired =
      [
        "evaluate_and_recommend",
        "decide_or_prioritize"
      ].includes(operation) ||
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
          "recommend_one"
        ]
      );

    const comparisonRequired =
      operation ===
        "compare_options" ||
      semanticMeaning
        .actionPolicy
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
      semanticResponseRequirements
        .explanationRequested ===
        true ||
      semanticResponseRequirements
        .expectsExplanation ===
        true ||
      semanticMeaning
        .actionPolicy
        ?.explanationRequested ===
        true ||
      [
        "interpret_meaning",
        "explain_or_teach",
        "inspect_and_explain",
        "explain_without_execution"
      ].includes(operation) ||
      this.identifiersContainAny(
        mergedMust,
        [
          "provide_requested_explanation",
          "explain_reasoning",
          "provide_reasoning"
        ]
      );

    const adviceExplicitlyRequested =
      semanticMeaning.actionPolicy
        ?.recommendationRequested ===
        true ||
      recommendationRequired;

    const clarificationRequired =
      ambiguity.requiresClarification ===
        true ||
      reconciliation.readiness
        ?.clarificationRequired ===
        true ||
      reconciledRequirements
        .clarificationRequired ===
        true;

    const missingContext =
      state.contextLane ===
        "missing_context" ||
      state.laneSplit?.lane ===
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
        "provide_emotional_support";

    return {
      operation:
        operation ||
        null,

      requestedOutput:
        requestedOutput ||
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

      emotionalSupportExplicitlyRequested,

      requiredIdentifiers:
        mergedMust,

      source: {
        semanticMeaningAvailable:
          Boolean(
            semanticMeaning
              .requestedOperation
          ),

        reconciliationAvailable:
          reconciliation
            .perceptionReconciliationRan ===
          true,

        intentPacketAvailable:
          Boolean(
            intentPacket
          ),

        conversationFunctionContractAvailable:
          Boolean(
            conversationFunctionContract
          )
      },

      authority:
        "canonical_upstream_response_obligations"
    };
  },

  readPlanMoveIdentifiers(
    responsePlan = {}
  ) {
    return this.readResponseMoves(
      responsePlan
    )
      .map(move =>
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
    return this.mergeUnique(
      responsePlan
        .requiredBehaviors,
      responsePlan.required,
      responsePlan
        .writerInstructions
        ?.required,
      responsePlan.rules
    )
      .map(value =>
        this.normalizeIdentifier(
          this.valueOf(value)
        )
      )
      .filter(Boolean);
  },

  identifiersContainAny(
    identifiers = [],
    candidates = []
  ) {
    const normalizedIdentifiers =
      this.toArray(
        identifiers
      )
        .map(value =>
          this.normalizeIdentifier(
            this.valueOf(value)
          )
        )
        .filter(Boolean);

    const normalizedCandidates =
      this.toArray(
        candidates
      )
        .map(value =>
          this.normalizeIdentifier(
            this.valueOf(value)
          )
        )
        .filter(Boolean);

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

  planPreservesSafety(
    responsePlan = {}
  ) {
    const goal =
      this.normalizeIdentifier(
        responsePlan.responseGoal ||
        responsePlan.goal ||
        ""
      );

    const policy =
      this.normalizeIdentifier(
        responsePlan.advicePolicy ||
        ""
      );

    const moves =
      this.readResponseMoves(
        responsePlan
      )
        .map(move =>
          this.normalizeIdentifier(
            this.readMoveId(move)
          )
        );

    const required =
      this.toArray(
        responsePlan
          .requiredBehaviors ||
        responsePlan.required
      )
        .map(value =>
          this.normalizeIdentifier(
            this.valueOf(value)
          )
        );

    return Boolean(
      goal.includes("safety") ||
      goal.includes("protect") ||
      policy.includes("safety") ||
      moves.some(move =>
        move.includes("safety") ||
        move.includes("emergency")
      ) ||
      required.some(item =>
        item.includes("safety") ||
        item.includes("emergency")
      )
    );
  },

  /* =====================================================
     CANONICAL PLAN NORMALIZATION
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

    const normalizedShouldAskQuestion =
      clarificationAuthorized &&
      responsePlan
        .shouldAskQuestion ===
      true;

    const normalizedAdviceRequested =
      obligations
        .adviceExplicitlyRequested ||
      responsePlan
        .adviceRequested ===
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
        responsePlan.required
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        responsePlan
          .forbiddenBehaviors,
        responsePlan.avoid
      );

    const constraints =
      this.mergeUnique(
        responsePlan.constraints
      );

    const rules =
      this.mergeUnique(
        responsePlan.rules,
        responsePlan.responseRules
      );

    const writerInstructions =
      this.normalizeWriterInstructions({
        writerInstructions:
          responsePlan
            .writerInstructions ||
          responsePlan
            .writerDirective ||
          {},

        responsePlan,
        responseMoves
      });

    return {
      ...responsePlan,

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

      usable:
        responsePlan.usable !==
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
        null,

      currentNeed:
        responsePlan.currentNeed ||
        null,

            adviceRequested:
        normalizedAdviceRequested,

      advicePolicy:
        obligations
          .adviceExplicitlyRequested
          ? "explicitly_requested"
          : responsePlan.advicePolicy ||
            "allowed_if_useful",

      coachingPermissionRequired:
        obligations
          .adviceExplicitlyRequested
          ? false
          : responsePlan
              .coachingPermissionRequired ===
            true,

      shouldAskQuestion:
        normalizedShouldAskQuestion,

            questionPurpose:
        normalizedShouldAskQuestion
          ? (
              responsePlan
                .questionPurpose ||
              (
                obligations
                  .safetyClarificationRequired
                  ? "clarify_safety_risk"
                  : obligations
                      .missingContext
                    ? "recover_missing_context"
                    : "resolve_required_ambiguity"
              )
            )
          : null,

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
        responsePlan
          .composerDirective ||
        writerInstructions
          .composerDirective ||
        null,

      confidence:
        this.normalizeConfidence(
          responsePlan.confidence ??
          plannerEnvelope.confidence ??
          state.routingConfidence ??
          0.5
        ),

      quality:
        responsePlan.quality ||
        {
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
            )
        },

      canonicalAlignment: {
        valid:
          planAlignment.valid ===
          true,

        reason:
          planAlignment.reason ||
          null,

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

              contentHint:
                null,

              purpose:
                null,

              source:
                "ari-response-planner"
            };
          }

          if (
            !move ||
            typeof move !==
              "object"
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

          return {
            ...move,

            id,

            order:
              Number.isFinite(
                Number(
                  move.order
                )
              )
                ? Number(
                    move.order
                  )
                : index + 1,

            required:
              move.required !==
              false,

            contentHint:
              move.contentHint ||
              move.hint ||
              move.content ||
              null,

            purpose:
              move.purpose ||
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

  normalizeWriterInstructions({
    writerInstructions = {},
    responsePlan = {},
    responseMoves = []
  } = {}) {
    const source =
      writerInstructions &&
      typeof writerInstructions ===
        "object"
        ? writerInstructions
        : {};

    const maxSentences =
      Number(
        source.maxSentences
      );

    const maxWords =
      Number(
        source.maxWords
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

      required:
        this.mergeUnique(
          source.required,
          responsePlan
            .requiredBehaviors,
          responsePlan.required
        ),

      avoid:
        this.mergeUnique(
          source.avoid,
          responsePlan
            .forbiddenBehaviors,
          responsePlan.avoid
        ),

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
        source
          .finalQuestionAllowed ===
          true ||
        responsePlan
          .shouldAskQuestion ===
          true,

      questionPurpose:
        source.questionPurpose ||
        responsePlan
          .questionPurpose ||
        null,

      doNotWrite:
        this.mergeUnique(
          source.doNotWrite,
          [
            "internal pipeline commentary",
            "unsupported certainty",
            "semantic reinterpretation",
            "route changes",
            "safety overrides"
          ]
        ),

      authority:
        "writer_instruction_only"
    };
  },

  /* =====================================================
     FALLBACK PLAN
  ===================================================== */

    buildFallbackResponsePlan({
    state = {},
    reason =
      "response_planner_unavailable",
    plannerEnvelope = {},
    planAlignment = {}
  } = {}) {
    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      state
        .safetyShouldStopNormalResponse ===
        true;

    const obligations =
      planAlignment.obligations ||
      this.buildCanonicalResponseObligations(
        state
      );

    const safetyClarification =
      obligations
        .safetyClarificationRequired ===
      true;

    const missingContext =
      obligations.missingContext ===
      true;

    const semanticClarification =
      obligations
        .clarificationRequired ===
      true;

    const clarificationRequired =
      safetyClarification ||
      missingContext ||
      semanticClarification;

    const primaryLane =
      state.primaryLane ||
      state.routingContract
        ?.primaryLane ||
      state.triage
        ?.primaryLane ||
      "general_understanding";

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
    } else if (
      clarificationRequired
    ) {
      addMove({
        id:
          "ask_required_clarifying_question",

        purpose:
          safetyClarification
            ? "clarify_safety_risk"
            : missingContext
              ? "recover_missing_context"
              : "resolve_required_ambiguity"
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
            "Compare the named options using criteria relevant to the user's stated context."
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
            "State which option is recommended without asking permission to provide advice."
        });
      }

      if (
        obligations
          .explanationRequired
      ) {
        addMove({
          id:
            "explain_recommendation_reasoning",

          purpose:
            "fulfill_explanation_request",

          contentHint:
            "Explain the decisive reasons, tradeoffs, and relevant limitations."
        });
      }

      if (
        obligations
          .directAnswerRequired &&
        responseMoves.length ===
          0
      ) {
        addMove({
          id:
            "answer_current_turn",

          purpose:
            "answer_authoritative_current_request"
        });
      }

      if (
        responseMoves.length ===
        0
      ) {
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
      safetyOverride
        ? "address_immediate_safety"
        : clarificationRequired
          ? safetyClarification
            ? "clarify_safety_risk"
            : missingContext
              ? "recover_required_context"
              : "resolve_required_ambiguity"
          : obligations
              .recommendationRequired &&
            obligations
              .comparisonRequired
            ? "compare_options_and_provide_clear_recommendation"
            : obligations
                .recommendationRequired
              ? "provide_clear_recommendation"
              : obligations
                  .comparisonRequired
                ? "compare_presented_options"
                : obligations
                    .explanationRequired
                  ? "provide_requested_explanation"
                  : primaryLane;

    const responseShape =
      safetyOverride
        ? "brief_direct_safety_response"
        : clarificationRequired
          ? "single_clarifying_question"
          : obligations
                .comparisonRequired &&
              obligations
                .recommendationRequired &&
              obligations
                .explanationRequired
            ? "comparison_with_recommendation_and_reasoning"
            : obligations
                  .recommendationRequired &&
                obligations
                  .explanationRequired
              ? "recommendation_with_reasoning"
              : obligations
                  .comparisonRequired
                ? "structured_comparison"
                : state.responseShape ||
                  state.routingContract
                    ?.responseShape ||
                  "clear_explanation";

    const shouldAskQuestion =
      clarificationRequired;

    const questionPurpose =
      shouldAskQuestion
        ? safetyClarification
          ? "clarify_safety_risk"
          : missingContext
            ? "recover_missing_context"
            : "resolve_required_ambiguity"
        : null;

    const requiredBehaviors =
      this.mergeUnique(
        state.responseRequired,

        safetyOverride
          ? [
              "prioritize_immediate_safety",
              "be_direct"
            ]
          : clarificationRequired
            ? [
                "ask_one_clear_question"
              ]
            : [
                obligations
                  .directAnswerRequired
                  ? "answer_the_requested_question"
                  : null,

                obligations
                  .comparisonRequired
                  ? "compare_the_presented_options"
                  : null,

                obligations
                  .recommendationRequired
                  ? "provide_clear_recommendation"
                  : null,

                obligations
                  .explanationRequired
                  ? "provide_requested_explanation"
                  : null,

                obligations
                  .adviceExplicitlyRequested
                  ? "treat_advice_as_explicitly_authorized"
                  : null
              ].filter(Boolean)
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        state.responseAvoid,

        safetyOverride
          ? [
              "delay",
              "casual_tone",
              "abstract_analysis"
            ]
          : clarificationRequired
            ? [
                "invent_missing_context",
                "rewrite_user_meaning"
              ]
            : [
                "invent_missing_context",
                "rewrite_user_meaning",
                "ask_permission_for_explicitly_requested_advice",
                "replace_primary_task_with_emotional_exploration",
                "ask_unnecessary_clarifying_question",
                "omit_required_response_moves"
              ]
      );

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

      responsePosture:
        safetyOverride
          ? "calm_direct"
          : clarificationRequired
            ? "clear_precise"
            : "direct_helpful",

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
        safetyOverride
          ? "safety_urgent_support"
          : clarificationRequired
            ? "required_clarification"
            : obligations
                  .comparisonRequired &&
                obligations
                  .recommendationRequired
              ? "comparison_recommendation_reasoning"
              : obligations
                  .recommendationRequired
                ? "direct_recommendation"
                : "general_direct_response",

      writerInstructions: {
        posture:
          safetyOverride
            ? "calm_direct"
            : clarificationRequired
              ? "clear_precise"
              : "direct_helpful",

        shape:
          responseShape,

        moves:
          responseMoves,

        required:
          requiredBehaviors,

        avoid:
          forbiddenBehaviors,

        constraints:
          this.mergeUnique(
            state.responseConstraints
          ),

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

        questionPurpose,

        doNotWrite: [
          "internal pipeline commentary",
          "unsupported certainty",
          "semantic reinterpretation",
          "permission seeking for explicitly requested advice",
          "emotional exploration that replaces the requested task",
          "unnecessary clarification"
        ],

        authority:
          "writer_instruction_only"
      },

      communicationPlan:
        null,

      composerDirective: {
        preserveCanonicalMoves:
          true,

        preserveMoveOrder:
          true,

        rejectPermissionSeeking:
          obligations
            .adviceExplicitlyRequested,

        rejectUnauthorizedClarification:
          !clarificationRequired,

        rejectPrimaryTaskReplacement:
          true,

        authority:
          "fallback_composer_directive"
      },

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
          ? 0.85
          : obligations
                .directAnswerRequired ||
              obligations
                .recommendationRequired ||
              obligations
                .comparisonRequired
            ? 0.82
            : 0.62,

      plannerEnvelope,

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
  buildPlannerFailureResult({
    reason =
      "response_planner_unavailable",
    source =
      "ari-response-planning-stage",
    state = {}
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
      obligations
        .clarificationRequired ||
      obligations.missingContext ||
      obligations
        .safetyClarificationRequired;

    const shouldAskQuestion =
      clarificationAuthorized &&
      responsePlan
        .shouldAskQuestion ===
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
          .responseRequired
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
          .forbiddenBehaviors
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
        null,

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
        true,

      advicePolicy:
        responsePlan.advicePolicy ||
        null,

      coachingPermissionRequired:
        responsePlan
          .coachingPermissionRequired ===
        true,

            shouldAskQuestion,

      questionPurpose:
        shouldAskQuestion
          ? responsePlan
              .questionPurpose ||
            null
          : null,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules,

      blueprintHint:
        responsePlan
          .blueprintHint ||
        null,

      writerInstructions:
        responsePlan
          .writerInstructions ||
        null,

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
        responsePlan
          .composerDirective ||
        responsePlan
          .writerInstructions
          ?.composerDirective ||
        multiLanePlan
          .composerDirective ||
        null,

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
     EXPRESSION HANDOFF
  ===================================================== */

  buildResponsePlanningHandoff({
    state = {},
    responsePlan = {},
    responseStrategy = {},
    plannerEnvelope = {},
    planValidation = {}
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

      advicePolicy:
        responseStrategy
          .advicePolicy ||
        null,

            coachingPermissionRequired:
        obligations
          .adviceExplicitlyRequested
          ? false
          : responsePlan
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

      alignment: {
        accepted:
          state.responsePlanAccepted ===
          true,

        rejectionReason:
          state
            .responsePlanRejectionReason ||
          null,

        validation:
          state.responsePlanAlignment ||
          null,

        fallbackUsed:
          responsePlan.fallback ===
          true,

        canonicalObligations:
          responsePlan
            .canonicalAlignment
            ?.obligations ||
          null
      },

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

        validation:
          planValidation
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
          "responsePlanningHandoff.writerInstructions"
      },

      authority: {
        canHandOffResponsePlan:
          true,

        canHandOffResponseStrategy:
          true,

        canHandOffWriterInstructions:
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

    return {
      schema:
        "ari_response_planning_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        Boolean(
          responsePlan
        ) &&
        responsePlan?.usable !==
          false,

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
          summary
            .responsePlanAlignment ||
          null,

        canonicalObligations:
          responsePlan
            ?.canonicalAlignment
            ?.obligations ||
          null,

        fallbackUsed:
          responsePlan?.fallback ===
          true
      },

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

        validation:
          summary
            .responsePlanValidation ||
          null
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
          Boolean(
            responsePlan
          ),

        canonicalPlanUsable:
          responsePlan?.usable !==
          false,

        plannerRan:
          summary.responsePlannerRan ===
          true,

        plannerUsable:
          summary
            .responsePlannerUsable ===
          true,

        validationPassed:
          summary
            .responsePlanValidation
            ?.valid ===
          true,

        fallbackUsed:
          responsePlan?.fallback ===
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
          false
      },

      authority: {
        canCoordinateResponsePlanner:
          true,

        canValidateResponsePlan:
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
     GENERAL HELPERS
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

  valueOf(value) {
    if (
      value === null ||
      value === undefined
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
      "number"
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
        value.name ||
        value.type ||
        value.value ||
        value.label ||
        value.text ||
        value.purpose ||
        ""
      );
    }

    return String(value);
  },

  dedupeValues(
    values = []
  ) {
    const seen =
      new Set();

    return this.toArray(values)
      .filter(value => {
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
      });
  },

  toArray(value) {
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

  mergeUnique(...values) {
    const items =
      values.flatMap(
        value =>
          this.toArray(value)
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

    if (
      number >
      1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number /
          100
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
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
};

console.log(
  "ARI RESPONSE PLANNING STAGE LOADED:",
  window.AriResponsePlanningStage?.version
);