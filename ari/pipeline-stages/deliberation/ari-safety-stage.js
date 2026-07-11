// ari/pipeline-stages/deliberation/ari-safety-stage.js
// Ari Safety Deliberation Stage
// Purpose: Resolve deeper safety context after perception, routing, and continuity.
// V1.0.0 — Deep Safety Orchestration Foundation

window.Ari = window.Ari || {};

window.AriSafetyDeliberationStage = {
  version: "1.0.0",

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
      activeDeliberationStage: "safety"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const earlyGate =
      state.safetyContextGate ||
      state.perceptionPacket?.safetyScreen?.raw ||
      null;

    const safetyEligibility =
      this.resolveSafetyEligibility({
        state,
        earlyGate,
        runInstructions
      });

    state = {
      ...state,
      safetyEligibility,

      shouldRunDeepSafety:
        safetyEligibility.runDeepSafety,

      immediateSafetyOverride:
        safetyEligibility.immediateOverride
    };

    // =================================================
    // 1. Deep Safety Reasoning
    // =================================================

    mark("before deepSafetyReasoning");

    const deepSafetyResult =
      safetyEligibility.runDeepSafety &&
      window.AriDeepSafetyReasoningEngine
        ? await runEngine(
            window.AriDeepSafetyReasoningEngine,
            ["evaluate", "reason", "analyze"],
            this.buildDeepSafetyFallback(
              state,
              "deep_safety_engine_failed_or_returned_empty"
            ),
            {
              ...state,

              safetyReviewInput:
                this.buildSafetyReviewInput(state),

              safetyEligibility
            }
          )
        : this.buildDeepSafetyFallback(
            state,
            safetyEligibility.runDeepSafety
              ? "deep_safety_engine_not_loaded"
              : "deep_safety_not_required"
          );

    state = {
      ...state,

      deepSafetyResult,

      deepSafetyReasoning:
        deepSafetyResult,

      deepSafetyReasoningRan:
        deepSafetyResult
          .deepSafetyReasoningRan === true,

      deepSafetySource:
        deepSafetyResult.source ||
        "unknown",

      resolvedSafetyRiskLevel:
        deepSafetyResult.riskLevel ||
        earlyGate?.riskLevel ||
        "none",

      resolvedSafetyRiskType:
        deepSafetyResult.riskType ||
        earlyGate?.riskType ||
        "none",

      resolvedSafetyAuthority:
        deepSafetyResult.safetyAuthority ||
        (
          earlyGate?.shouldStopNormalResponse === true
            ? "early_gate_override"
            : "none"
        ),

      safetyResponseContract:
        deepSafetyResult.responseContract ||
        null
    };

    mark("after deepSafetyReasoning");

    // =================================================
    // 2. Resolve final safety disposition
    // =================================================

    const safetyDisposition =
      this.resolveSafetyDisposition({
        state,
        earlyGate,
        deepSafetyResult
      });

    state = {
      ...state,

      safetyDisposition,

      safetyApplicable:
        safetyDisposition.applicable,

      safetyShouldStopNormalResponse:
        safetyDisposition.shouldStopNormalResponse,

      safetyRequiresClarification:
        safetyDisposition.requiresClarification,

      safetyRequiredPlanner:
        safetyDisposition.requiredPlanner,

      safetyRequiredBehaviors:
        safetyDisposition.requiredBehaviors,

      safetyForbiddenBehaviors:
        safetyDisposition.forbiddenBehaviors,

      safetyCommunicationStyle:
        safetyDisposition.communicationStyle
    };

    // =================================================
    // 3. Merge safety constraints without writing language
    // =================================================

    state = {
      ...state,

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          safetyDisposition.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          safetyDisposition.forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          safetyDisposition.constraints
        )
    };

    // =================================================
    // 4. Safety Stage Packet
    // =================================================

    state.safetyStagePacket =
      this.buildSafetyStagePacket(state);

    state.safetyStageRan = true;
    state.safetyStageSource =
      "ari-safety-stage";
    state.safetyStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveSafetyEligibility({
    state = {},
    earlyGate = null,
    runInstructions = {}
  } = {}) {
    const semanticAmbiguity =
      state.perceptionPacket?.semantic?.ambiguity ||
      state.semanticAmbiguity ||
      {};

    const observations =
      state.perceptionPacket?.observer?.observations ||
      state.observations ||
      [];

    const hasPossibleSafetyObservation =
      observations.some(item =>
        [
          "safety_language",
          "possible_safety_signal",
          "possible_body_symptom_term",
          "body_symptom"
        ].includes(item?.type)
      );

    const immediateOverride =
      earlyGate?.shouldStopNormalResponse === true ||
      earlyGate?.override === "emergency" ||
      earlyGate?.override === "urgent";

    const ambiguousSafety =
      earlyGate?.requiresDeeperSafetyReview === true ||
      earlyGate?.followUpNeeded === true ||
      earlyGate?.shouldAskRiskClarification === true ||
      semanticAmbiguity?.safetyAmbiguous === true ||
      semanticAmbiguity?.riskAmbiguous === true;

    const routingRequested =
      runInstructions.deepSafety === true ||
      state.routingApplicability?.deepSafety === true ||
      state.routingContract?.run?.deepSafety === true;

    const runDeepSafety =
      !immediateOverride &&
      (
        routingRequested ||
        ambiguousSafety ||
        hasPossibleSafetyObservation
      );

    return {
      runDeepSafety,
      immediateOverride,
      routingRequested,
      ambiguousSafety,
      hasPossibleSafetyObservation,

      source:
        "ari-safety-stage-eligibility",

      reason:
        immediateOverride
          ? "early_gate_immediate_override"
          : runDeepSafety
            ? "deeper_contextual_safety_review_required"
            : "no_meaningful_safety_review_required"
    };
  },

  // ===================================================
  // Deep safety input
  // ===================================================

  buildSafetyReviewInput(summary = {}) {
    return {
      message: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          ""
      },

      earlyGate:
        summary.safetyContextGate ||
        null,

      perception:
        summary.perceptionPacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      continuity: {
        packet:
          summary.continuityPacket ||
          null,

        usableFacts:
          summary.continuityUsableFacts ||
          [],

        unresolvedReferences:
          summary.continuityUnresolvedReferences ||
          []
      },

      semantic: {
        frame:
          summary.primarySemanticFrame ||
          summary.perceptionPacket
            ?.semantic?.primaryFrame ||
          null,

        summary:
          summary.semanticSummary ||
          summary.perceptionPacket
            ?.semantic?.summary ||
          null,

        ambiguity:
          summary.semanticAmbiguity ||
          summary.perceptionPacket
            ?.semantic?.ambiguity ||
          {}
      },

      observations:
        summary.observations ||
        summary.perceptionPacket
          ?.observer?.observations ||
        []
    };
  },

  // ===================================================
  // Fallback
  // ===================================================

  buildDeepSafetyFallback(
    summary = {},
    reason = "deep_safety_not_required"
  ) {
    const earlyGate =
      summary.safetyContextGate ||
      null;

    return {
      deepSafetyReasoningRan: false,

      source:
        reason === "deep_safety_not_required"
          ? "skipped-by-routing"
          : "not-loaded",

      applicable:
        earlyGate?.riskLevel !== "none" ||
        earlyGate?.shouldStopNormalResponse === true,

      riskLevel:
        earlyGate?.riskLevel ||
        "none",

      riskType:
        earlyGate?.riskType ||
        "none",

      safetyAuthority:
        earlyGate?.shouldStopNormalResponse === true
          ? "early_gate_override"
          : "none",

      responseContract: null,

      evidence:
        earlyGate?.evidence ||
        [],

      reasons:
        earlyGate?.reasons ||
        [],

      reason
    };
  },

  // ===================================================
  // Final disposition
  // ===================================================

  resolveSafetyDisposition({
    state = {},
    earlyGate = null,
    deepSafetyResult = {}
  } = {}) {
    const deepContract =
      deepSafetyResult.responseContract ||
      {};

    const deepOverride =
      [
        "override",
        "emergency_override",
        "urgent_override"
      ].includes(
        deepSafetyResult.safetyAuthority
      );

    const earlyOverride =
      earlyGate?.shouldStopNormalResponse === true;

    const shouldStopNormalResponse =
      deepSafetyResult.shouldStopNormalResponse === true ||
      deepOverride ||
      earlyOverride;

    const requiresClarification =
      deepSafetyResult.requiresClarification === true ||
      deepContract.requiresClarification === true ||
      (
        !shouldStopNormalResponse &&
        (
          earlyGate?.followUpNeeded === true ||
          earlyGate?.shouldAskRiskClarification === true
        )
      );

    const applicable =
      deepSafetyResult.applicable === true ||
      shouldStopNormalResponse ||
      requiresClarification ||
      (
        deepSafetyResult.riskLevel &&
        deepSafetyResult.riskLevel !== "none"
      );

    return {
      applicable,

      riskLevel:
        deepSafetyResult.riskLevel ||
        earlyGate?.riskLevel ||
        "none",

      riskType:
        deepSafetyResult.riskType ||
        earlyGate?.riskType ||
        "none",

      safetyAuthority:
        deepSafetyResult.safetyAuthority ||
        (
          earlyOverride
            ? "early_gate_override"
            : "none"
        ),

      shouldStopNormalResponse,

      requiresClarification,

      requiredPlanner:
        deepSafetyResult.requiredPlanner ||
        deepContract.requiredPlanner ||
        (
          shouldStopNormalResponse
            ? "safety_response_planner"
            : null
        ),

      communicationStyle:
        deepSafetyResult.communicationStyle ||
        deepContract.communicationStyle ||
        (
          shouldStopNormalResponse
            ? "direct_calm_supportive"
            : null
        ),

      requiredBehaviors:
        this.toArray(
          deepSafetyResult.requiredBehaviors ||
          deepContract.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          deepSafetyResult.forbiddenBehaviors ||
          deepContract.forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          deepSafetyResult.constraints ||
          deepContract.constraints
        ),

      evidence:
        this.toArray(
          deepSafetyResult.evidence ||
          earlyGate?.evidence
        ),

      reasons:
        this.toArray(
          deepSafetyResult.reasons ||
          earlyGate?.reasons
        ),

      source:
        deepSafetyResult
          .deepSafetyReasoningRan === true
          ? "deep_safety_reasoning"
          : earlyOverride
            ? "early_safety_gate"
            : "safety_stage_fallback"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildSafetyStagePacket(summary = {}) {
    return {
      ready: true,

      source:
        "ari-safety-stage",

      version:
        this.version,

      eligibility:
        summary.safetyEligibility ||
        null,

      earlyGate:
        summary.safetyContextGate ||
        null,

      deepReview:
        summary.deepSafetyResult ||
        null,

      disposition:
        summary.safetyDisposition ||
        null,

      responseControl: {
        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse === true,

        requiresClarification:
          summary
            .safetyRequiresClarification === true,

        requiredPlanner:
          summary.safetyRequiredPlanner ||
          null,

        communicationStyle:
          summary.safetyCommunicationStyle ||
          null,

        requiredBehaviors:
          summary.safetyRequiredBehaviors ||
          [],

        forbiddenBehaviors:
          summary.safetyForbiddenBehaviors ||
          [],

        constraints:
          summary.safetyDisposition
            ?.constraints ||
          []
      },

      authority: {
        canEvaluateDeepSafety:
          true,

        canSetSafetyConstraints:
          true,

        canOverrideNormalResponse:
          true,

        canChooseGeneralConversationRoute:
          false,

        canPerformMedicalTriage:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "contextual_safety_adjudication_and_constraints"
      }
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (value === undefined || value === null) {
      return [];
    }

    return [value].filter(Boolean);
  },

  mergeUnique(existing = [], incoming = []) {
    return [
      ...new Set([
        ...this.toArray(existing),
        ...this.toArray(incoming)
      ])
    ];
  }
};

console.log(
  "ARI SAFETY DELIBERATION STAGE LOADED:",
  window.AriSafetyDeliberationStage?.version
);