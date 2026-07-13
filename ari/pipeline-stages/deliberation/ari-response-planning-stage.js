// ari/pipeline-stages/deliberation/ari-response-planning-stage.js
// Ari Response Planning Deliberation Stage
//
// Purpose:
// Coordinate canonical response planning after continuity, safety, situation,
// memory, understanding, and reasoning have completed.
//
// V2.0.0 — Canonical Response Plan Orchestration / Structured Writer Handoff
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

    const finalResponsePlan =
      planValidation.valid
        ? this.normalizeResponsePlan({
            responsePlan:
              canonicalResponsePlan,

            state,
            plannerEnvelope
          })
        : this.buildFallbackResponsePlan({
            state,

            reason:
              planValidation.reason,

            plannerEnvelope
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
    plannerEnvelope = {}
  } = {}) {
    const originalText =
      this.getOriginalText(
        state
      );

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
        responsePlan.adviceRequested ===
        true,

      advicePolicy:
        responsePlan.advicePolicy ||
        "allowed_if_useful",

      coachingPermissionRequired:
        responsePlan
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        responsePlan
          .shouldAskQuestion ===
        true,

      questionPurpose:
        responsePlan.questionPurpose ||
        null,

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
    plannerEnvelope = {}
  } = {}) {
    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      state
        .safetyShouldStopNormalResponse ===
        true;

    const safetyClarification =
      state
        .safetyRequiresClarification ===
      true;

    const missingContext =
      state.contextLane ===
        "missing_context" ||
      state.laneSplit?.lane ===
        "missing_context";

    const primaryLane =
      state.primaryLane ||
      state.routingContract
        ?.primaryLane ||
      state.triage
        ?.primaryLane ||
      "general_understanding";

    const responseMoves =
      safetyOverride
        ? [
            {
              id:
                "prioritize_immediate_safety",

              order:
                1,

              required:
                true
            },

            {
              id:
                "give_direct_safety_step",

              order:
                2,

              required:
                true
            }
          ]
        : safetyClarification ||
          missingContext
          ? [
              {
                id:
                  "ask_required_clarifying_question",

                order:
                  1,

                required:
                  true
              }
            ]
          : [
              {
                id:
                  "answer_current_turn",

                order:
                  1,

                required:
                  true
              },

              {
                id:
                  "give_brief_useful_context",

                order:
                  2,

                required:
                  false
              }
            ];

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

      responseGoal:
        safetyOverride
          ? "address_immediate_safety"
          : safetyClarification
            ? "clarify_safety_risk"
            : missingContext
              ? "recover_required_context"
              : primaryLane,

      responseShape:
        safetyOverride
          ? "brief_direct_safety_response"
          : safetyClarification ||
              missingContext
            ? "single_clarifying_question"
            : state.responseShape ||
              state.routingContract
                ?.responseShape ||
              "clear_explanation",

      responsePosture:
        safetyOverride
          ? "calm_direct"
          : "direct_helpful",

      currentNeed:
        safetyOverride
          ? "immediate_safety"
          : safetyClarification ||
              missingContext
            ? "required_clarification"
            : "answer_current_request",

      adviceRequested:
        false,

      advicePolicy:
        safetyOverride
          ? "safety_first"
          : "allowed_if_useful",

      coachingPermissionRequired:
        false,

      shouldAskQuestion:
        safetyClarification ||
        missingContext,

      questionPurpose:
        safetyClarification
          ? "clarify_safety_risk"
          : missingContext
            ? "recover_missing_context"
            : null,

      responseMoves,

      responseOrder:
        responseMoves.map(
          move =>
            move.id
        ),

      requiredBehaviors:
        this.mergeUnique(
          state.responseRequired,
          safetyOverride
            ? [
                "prioritize_immediate_safety",
                "be_direct"
              ]
            : safetyClarification ||
                missingContext
              ? [
                  "ask_one_clear_question"
                ]
              : [
                  "answer_current_request"
                ]
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          state.responseAvoid,
          safetyOverride
            ? [
                "delay",
                "casual_tone",
                "abstract_analysis"
              ]
            : [
                "invent_missing_context",
                "rewrite_user_meaning"
              ]
        ),

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
          : safetyClarification ||
              missingContext
            ? "required_clarification"
            : "general_direct_response",

      writerInstructions: {
        posture:
          safetyOverride
            ? "calm_direct"
            : "direct_helpful",

        shape:
          safetyOverride
            ? "brief_direct_safety_response"
            : safetyClarification ||
                missingContext
              ? "single_clarifying_question"
              : "clear_explanation",

        moves:
          responseMoves,

        required:
          safetyOverride
            ? [
                "prioritize_immediate_safety",
                "be_direct"
              ]
            : [
                "answer_current_request"
              ],

        avoid:
          safetyOverride
            ? [
                "delay",
                "casual_tone"
              ]
            : [
                "invent_missing_context",
                "generic_template_language"
              ],

        maxSentences:
          safetyOverride
            ? 4
            : safetyClarification ||
                missingContext
              ? 1
              : 4,

        finalQuestionAllowed:
          safetyClarification ||
          missingContext,

        questionPurpose:
          safetyClarification
            ? "clarify_safety_risk"
            : missingContext
              ? "recover_missing_context"
              : null,

        doNotWrite: [
          "internal pipeline commentary",
          "unsupported certainty",
          "semantic reinterpretation"
        ]
      },

      communicationPlan:
        null,

      composerDirective:
        null,

      confidence:
        safetyOverride
          ? 0.85
          : 0.55,

      plannerEnvelope,

      authority: {
        canDefineFallbackResponsePlan:
          true,

        canPreserveSafety:
          true,

        canPreserveOriginalTurn:
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
          "safe_response_plan_fallback"
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

      shouldAskQuestion:
        responsePlan
          .shouldAskQuestion ===
        true,

      questionPurpose:
        responsePlan
          .questionPurpose ||
        null,

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