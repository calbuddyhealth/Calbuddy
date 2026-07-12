// ari/pipelines/ari-executive-routing-pipeline.js
// Ari Executive Routing Pipeline
// Purpose: Select context usage and downstream execution eligibility
// from the canonical reconciled perception contract.
// V2.0.0 — Canonical Intent Routing / Legacy Classification Isolation

window.Ari = window.Ari || {};

window.AriExecutiveRoutingPipeline = {
  version: "2.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activePipelineLayer:
        "executive_routing",

      executiveRoutingErrors:
        []
    };

    /* =====================================================
       1. READ CANONICAL PERCEPTION INPUT
    ===================================================== */

    const perceptionPacket =
      state.perceptionPacket ||
      this.buildFallbackPerceptionPacket(
        state
      );

    const reconciliation =
      this.readReconciliation(
        state,
        perceptionPacket
      );

    const intentPacket =
      this.readIntentPacket(
        state,
        perceptionPacket,
        reconciliation
      );

    state = {
      ...state,

      perceptionPacket,

      executiveReconciliation:
        reconciliation,

      executiveIntentPacket:
        intentPacket,

      executiveCanonicalIntentAvailable:
        Boolean(intentPacket),

      executiveReconciliationAvailable:
        reconciliation.available === true
    };

    /* =====================================================
       2. CONTEXT LANE SELECTION
       Lane Splitter chooses only context applicability:
       current turn, thread, memory, relationship, correction.
    ===================================================== */

    mark("before laneSplitter");

    const laneSplit =
      window.Ari?.laneSplitterEngine?.split
        ? await window.Ari
            .laneSplitterEngine
            .split({
              summary: state,

              perceptionPacket,

              conversationIntentPacket:
                intentPacket,

              reconciliation:
                reconciliation.raw,

              routingEvidence:
                state.routingEvidence ||
                perceptionPacket
                  .routingEvidence
                  ?.raw ||
                null,

              routingPressures:
                state.routingPressures ||
                perceptionPacket
                  .routingEvidence
                  ?.pressures ||
                {},

              semanticFrame:
                state.semanticFrameOutput ||
                perceptionPacket
                  .semantic
                  ?.raw ||
                null,

              primarySemanticFrame:
                state.primarySemanticFrame ||
                perceptionPacket
                  .semantic
                  ?.primaryFrame ||
                null,

              semanticSummary:
                state.semanticSummary ||
                perceptionPacket
                  .semantic
                  ?.summary ||
                null,

              semanticContinuity:
                reconciliation.continuity ||
                state.semanticContinuity ||
                perceptionPacket
                  .semantic
                  ?.continuity ||
                {},

              semanticAmbiguity:
                reconciliation.ambiguity ||
                state.semanticAmbiguity ||
                perceptionPacket
                  .semantic
                  ?.ambiguity ||
                {}
            })
        : this.fallbackLaneSplit();

    state = {
      ...state,

      laneSplit,

      lane:
        laneSplit.lane ||
        "direct_current_turn",

      contextLane:
        laneSplit.lane ||
        "direct_current_turn",

      routingDecision:
        laneSplit.routing ||
        {},

      laneSplitterRan:
        laneSplit.engine ===
        "ari-lane-splitter-engine",

      laneSplitterSource:
        laneSplit.source ||
        "not-loaded",

      laneSplitterConfidence:
        laneSplit.confidence ||
        null,

      laneSplitterScores:
        laneSplit.scores ||
        {},

      laneSplitterSemanticAware:
        laneSplit.semanticAware === true,

      laneSplitterSemanticFirst:
        laneSplit.semanticFirst === true,

      laneSplitterLexicalFallbackUsed:
        laneSplit
          .lexicalFallbackUsed === true,

      laneSplitterSemanticFrameType:
        laneSplit.semanticFrameType ||
        null,

      laneSplitterSemanticIntent:
        laneSplit.semanticIntent ||
        null,

      laneSplitterExplanation:
        laneSplit.explanation ||
        null
    };

    mark("after laneSplitter");

    /* =====================================================
       3. CANONICAL MODE
       Mode is derived from the selected context lane.
       Classifier conversationType cannot override it.
    ===================================================== */

    const mode =
      this.resolveModeFromLane(
        laneSplit
      );

    state = {
      ...state,

      routingMode:
        mode,

      conversationMode:
        mode.mode,

      isFollowUp:
        mode.isFollowUp,

      isCorrection:
        mode.isCorrection,

      mustReusePriorContext:
        mode.mustReusePriorContext,

      mayUsePriorContext:
        mode.mayUsePriorContext
    };

    /* =====================================================
       4. EXECUTION APPLICABILITY
       Uses reconciliation and semantic action authorization.
       No developer keyword guessing.
    ===================================================== */

    const applicability =
      this.resolveApplicability({
        summary: state,
        perceptionPacket,
        reconciliation,
        intentPacket,
        laneSplit,
        mode
      });

    state = {
      ...state,

      routingApplicability:
        applicability,

      shouldUseCurrentTurn:
        applicability.currentTurn,

      shouldUseContinuity:
        applicability.continuity,

      shouldUseThread:
        applicability.thread,

      shouldUseMemory:
        applicability.memory,

      shouldUseRelationship:
        applicability.relationship,

      shouldRunSituationMap:
        applicability.situationMap,

      shouldRunTriage:
        applicability.triage,

      shouldRunDeveloperLayer:
        applicability.developer,

      shouldRunHeavyReasoning:
        applicability.heavyReasoning,

      shouldUseFastPath:
        applicability.fastPath
    };

    /* =====================================================
       5. CANONICAL ROUTING CONTRACT
       Reconciliation supplies intent.
       Lane Splitter supplies context mode.
       Executive Routing supplies execution eligibility.
    ===================================================== */

    const routingContract =
      this.buildRoutingContract({
        summary: state,
        perceptionPacket,
        reconciliation,
        intentPacket,
        laneSplit,
        mode,
        applicability
      });

    state = {
      ...state,

      routingContract,

      primaryIntent:
        routingContract.primaryIntent ||
        "respond",

      secondaryIntents:
        routingContract.secondaryIntents ||
        [],

      conversationDomain:
        routingContract.domain ||
        "general_understanding",

      contextLane:
        routingContract.contextLane ||
        "direct_current_turn",

      primaryLane:
        routingContract.primaryLane ||
        null,

      requiredCapabilities:
        routingContract.capabilities ||
        [],

      selectedPlanner:
        routingContract.planner ||
        null,

      routingConfidence:
        routingContract.confidence ||
        {},

      routingAuthority:
        routingContract.authority ||
        {}
    };

    /* =====================================================
       6. EXECUTIVE DIAGNOSTICS
    ===================================================== */

    const diagnostics =
      this.buildDiagnostics({
        perceptionPacket,
        reconciliation,
        intentPacket,
        laneSplit,
        mode,
        applicability,
        routingContract
      });

    state = {
      ...state,

      executiveRoutingDiagnostics:
        diagnostics,

      executiveRoutingHealthy:
        diagnostics.healthy,

      executiveRoutingWarnings:
        diagnostics.warnings,

      executiveRoutingErrors:
        diagnostics.errors
    };

    /* =====================================================
       7. EXECUTIVE PACKET
    ===================================================== */

    state.executivePacket =
      this.buildExecutivePacket(
        state
      );

    state.executiveRoutingPipelineRan =
      true;

    state.executiveRoutingPipelineSource =
      "ari-executive-routing-pipeline";

    state.executiveRoutingPipelineVersion =
      this.version;

    state.executiveRoutingPipelineComplete =
      diagnostics.complete;

    return state;
  },

  /* =====================================================
     RECONCILIATION READERS
  ===================================================== */

  readReconciliation(
    summary = {},
    perceptionPacket = {}
  ) {
    const raw =
      summary.perceptionReconciliation ||
      summary
        .perceptionReconciliationResult ||
      perceptionPacket
        .reconciliation
        ?.raw ||
      {};

    const readiness =
      raw.readiness ||
      perceptionPacket
        .reconciliation
        ?.readiness ||
      {};

    return {
      available:
        raw.perceptionReconciliationRan ===
          true ||
        perceptionPacket
          .reconciliation
          ?.available === true,

      raw,

      semanticIntent:
        raw.semanticIntent ||
        perceptionPacket
          .reconciliation
          ?.semanticIntent ||
        null,

      conversationPurpose:
        raw.conversationPurpose ||
        perceptionPacket
          .reconciliation
          ?.conversationPurpose ||
        null,

      supportingPurposes:
        raw.supportingPurposes ||
        perceptionPacket
          .reconciliation
          ?.supportingPurposes ||
        [],

      safety:
        raw.safety ||
        perceptionPacket
          .reconciliation
          ?.safety ||
        null,

      continuity:
        raw.continuity ||
        perceptionPacket
          .reconciliation
          ?.continuity ||
        null,

      ambiguity:
        raw.ambiguity ||
        perceptionPacket
          .reconciliation
          ?.ambiguity ||
        null,

      context:
        raw.context ||
        perceptionPacket
          .reconciliation
          ?.context ||
        null,

      agreement:
        raw.agreement ||
        perceptionPacket
          .reconciliation
          ?.agreement ||
        null,

      governance:
        raw.governance ||
        perceptionPacket
          .reconciliation
          ?.governance ||
        null,

      responseRequirements:
        raw.responseRequirements ||
        perceptionPacket
          .reconciliation
          ?.responseRequirements ||
        null,

      readiness,

      packetUsable:
        readiness.packetUsable === true,

      readyForRouting:
        readiness.readyForRouting === true,

      readyForPlanning:
        readiness.readyForPlanning === true,

      readyForResponsePreparation:
        readiness
          .readyForResponsePreparation ===
        true,

      clarificationRequired:
        readiness
          .clarificationRequired === true,

      immediateSafetyResponseRequired:
        readiness
          .immediateSafetyResponseRequired ===
        true
    };
  },

  readIntentPacket(
    summary = {},
    perceptionPacket = {},
    reconciliation = {}
  ) {
    return (
      summary.conversationIntentPacket ||
      summary.unifiedIntentPacket ||
      summary.reconciledIntentPacket ||
      reconciliation.raw
        ?.conversationIntentPacket ||
      reconciliation.raw
        ?.unifiedIntentPacket ||
      perceptionPacket
        .conversationIntentPacket ||
      perceptionPacket
        .unifiedIntentPacket ||
      perceptionPacket
        .reconciliation
        ?.packet ||
      null
    );
  },

  /* =====================================================
     MODE RESOLUTION
  ===================================================== */

  resolveModeFromLane(
    laneSplit = {}
  ) {
    const lane =
      laneSplit.lane ||
      "direct_current_turn";

    const routing =
      laneSplit.routing ||
      {};

    const isFollowUp =
      lane ===
      "continuity_follow_up";

    const isCorrection =
      lane ===
      "correction_or_revision";

    const isRecall =
      lane ===
      "recall_or_memory_request";

    const isRelationshipContinuation =
      lane ===
      "relationship_continuity";

    let mode =
      "current_turn";

    if (isFollowUp) {
      mode =
        "follow_up";
    } else if (isCorrection) {
      mode =
        "correction";
    } else if (isRecall) {
      mode =
        "recall";
    } else if (
      isRelationshipContinuation
    ) {
      mode =
        "relationship_continuity";
    }

    const useThread =
      routing.useThread === true;

    return {
      mode,

      lane,

      isFollowUp,
      isCorrection,
      isRecall,

      isNewTopic:
        false,

      mustReusePriorContext:
        useThread,

      mayUsePriorContext:
        useThread,

      reason:
        laneSplit.explanation ||
        (
          useThread
            ? "The selected context lane requires prior thread context."
            : "The selected context lane uses the current turn directly."
        ),

      source:
        "lane_splitter",

      authority:
        "canonical_context_mode"
    };
  },

  /* =====================================================
     APPLICABILITY
  ===================================================== */

  resolveApplicability({
    summary = {},
    perceptionPacket = {},
    reconciliation = {},
    intentPacket = null,
    laneSplit = {},
    mode = {}
  } = {}) {
    const laneRouting =
      laneSplit.routing ||
      {};

    const semanticMeaning =
      summary.semanticFrameOutput
        ?.canonicalMeaning ||
      perceptionPacket
        .semantic
        ?.raw
        ?.canonicalMeaning ||
      {};

    const artifactAction =
      semanticMeaning.artifactAction ||
      {};

    const actionPolicy =
      semanticMeaning.actionPolicy ||
      {};

    const responseRequirements =
      reconciliation
        .responseRequirements ||
      semanticMeaning
        .responseRequirements ||
      summary
        .semanticResponseCharacteristics ||
      {};

    const safety =
      reconciliation.safety ||
      {};

    const immediateSafety =
      reconciliation
        .immediateSafetyResponseRequired ===
        true ||
      safety
        .immediateResponseRequired ===
        true ||
      summary
        .safetyContextGate
        ?.shouldStopNormalResponse ===
        true;

    const clarificationRequired =
      reconciliation
        .clarificationRequired === true;

    const executionAllowed =
      actionPolicy.executionAllowed !==
        false &&
      semanticMeaning.executionAllowed !==
        false;

    const analysisOnly =
      actionPolicy.analysisOnly === true ||
      semanticMeaning.analysisOnly === true;

    const developer =
      artifactAction.executionRequested ===
        true &&
      artifactAction.isArtifactRequest ===
        true &&
      executionAllowed &&
      !analysisOnly;

    const investigation =
      artifactAction.isInvestigation ===
        true;

    const continuity =
      laneRouting.useThread === true ||
      laneRouting.useMemory === true ||
      laneRouting.useRelationship ===
        true;

    const directCurrentTurn =
      laneSplit.lane ===
        "direct_current_turn" &&
      continuity === false;

    const semanticOperation =
      reconciliation.semanticIntent
        ?.requestedOperation ||
      intentPacket
        ?.semanticIntent
        ?.requestedOperation ||
      semanticMeaning.requestedOperation ||
      "respond";

    const complexOperation =
      this.isComplexOperation(
        semanticOperation
      );

    const multipleRequirements =
      Array.isArray(
        responseRequirements.must
      ) &&
      responseRequirements.must.length >
        2;

    const heavyReasoning =
      !immediateSafety &&
      (
        complexOperation ||
        multipleRequirements ||
        investigation ||
        reconciliation
          .agreement
          ?.unresolvedConflictPresent ===
          true ||
        responseRequirements
          .requirementConflicts
          ?.present === true
      );

    const fastPath =
      directCurrentTurn &&
      !immediateSafety &&
      !clarificationRequired &&
      !developer &&
      !heavyReasoning;

    return {
      currentTurn:
        laneRouting.useCurrentTurn !==
        false,

      continuity,

      thread:
        laneRouting.useThread === true,

      memory:
        laneRouting.useMemory === true,

      relationship:
        laneRouting.useRelationship ===
        true,

      deepSafety:
        immediateSafety,

      situationMap:
        !fastPath ||
        immediateSafety ||
        clarificationRequired,

      triage:
        !fastPath ||
        immediateSafety ||
        clarificationRequired,

      developer,

      artifactInvestigation:
        investigation,

      executionAllowed,

      analysisOnly,

      clarificationRequired,

      immediateSafety,

      heavyReasoning,

      fastPath,

      semanticOperation,

      source:
        "canonical_reconciliation_and_lane_contract",

      authoritative:
        true
    };
  },

  isComplexOperation(
    operation = ""
  ) {
    const normalized =
      String(operation || "")
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .trim();

    return [
      "decide",
      "recommend",
      "evaluate",
      "compare",
      "plan",
      "diagnose",
      "analyze",
      "reason",
      "prioritize",
      "implement",
      "modify",
      "create",
      "investigate"
    ].some(term =>
      normalized.includes(term)
    );
  },

  /* =====================================================
     ROUTING CONTRACT
  ===================================================== */

  buildRoutingContract({
    summary = {},
    perceptionPacket = {},
    reconciliation = {},
    intentPacket = null,
    laneSplit = {},
    mode = {},
    applicability = {}
  } = {}) {
    const semanticMeaning =
      summary.semanticFrameOutput
        ?.canonicalMeaning ||
      perceptionPacket
        .semantic
        ?.raw
        ?.canonicalMeaning ||
      {};

    const semanticIntent =
      reconciliation.semanticIntent ||
      intentPacket?.semanticIntent ||
      {};

    const conversationPurpose =
      reconciliation
        .conversationPurpose ||
      intentPacket
        ?.conversationPurpose ||
      {};

    const supportingPurposes =
      reconciliation
        .supportingPurposes ||
      intentPacket
        ?.supportingPurposes ||
      [];

    const responseRequirements =
      reconciliation
        .responseRequirements ||
      intentPacket
        ?.responseRequirements ||
      semanticMeaning
        .responseRequirements ||
      {};

    const requestedOperation =
      semanticIntent.requestedOperation ||
      intentPacket?.requestedOperation ||
      semanticMeaning.requestedOperation ||
      "respond";

    const requestedOutput =
      semanticIntent.requestedOutput ||
      intentPacket?.requestedOutput ||
      semanticMeaning.requestedOutput ||
      "response";

    const userGoal =
      semanticIntent.userGoal ||
      intentPacket?.userGoal ||
      semanticMeaning.userGoal ||
      requestedOperation;

    const primaryIntent =
      requestedOperation;

    const secondaryIntents =
      supportingPurposes
        .map(item =>
          typeof item === "string"
            ? item
            : (
                item?.name ||
                item?.purpose ||
                item?.operation ||
                null
              )
        )
        .filter(Boolean);

    const domain =
      semanticIntent.domain ||
      intentPacket?.domain ||
      semanticMeaning.targetDomain ||
      semanticMeaning.domain?.primary ||
      "general_understanding";

    const capabilities =
      this.resolveCapabilities({
        requestedOperation,
        requestedOutput,
        applicability,
        responseRequirements
      });

    const planner =
      this.resolvePlanner({
        requestedOperation,
        applicability,
        reconciliation
      });

    return {
      ready:
        reconciliation.readyForRouting ||
        Boolean(requestedOperation),

      source:
        "ari-executive-routing-pipeline",

      version:
        this.version,

      conversationIntentPacket:
        intentPacket,

      mode:
        mode.mode,

      modeContract:
        mode,

      speechAct: {
        primary:
          conversationPurpose.name ||
          semanticMeaning.speechAct ||
          "respond",

        family:
          conversationPurpose.family ||
          semanticMeaning
            .interactionFamily ||
          "general",

        secondary:
          secondaryIntents,

        authoritative:
          reconciliation.available ===
          true
      },

      primaryIntent,

      requestedOperation,

      requestedOutput,

      userGoal,

      secondaryIntents,

      domain,

      domains:
        semanticMeaning.domain
          ?.secondary
          ? [
              domain,
              ...semanticMeaning
                .domain
                .secondary
            ]
          : [domain],

      contextLane:
        laneSplit.lane ||
        "direct_current_turn",

      primaryLane:
        null,

      capabilities,

      planner,

      responseShape:
        null,

      responseRequirements,

      governance:
        reconciliation.governance ||
        null,

      safety:
        reconciliation.safety ||
        null,

      continuity:
        reconciliation.continuity ||
        null,

      ambiguity:
        reconciliation.ambiguity ||
        null,

      run: {
        currentTurn:
          applicability.currentTurn !==
          false,

        continuity:
          applicability.continuity ===
          true,

        thread:
          applicability.thread === true,

        memory:
          applicability.memory === true,

        relationship:
          applicability.relationship ===
          true,

        deepSafety:
          applicability.deepSafety ===
          true,

        situationMap:
          applicability.situationMap !==
          false,

        triage:
          applicability.triage !==
          false,

        developer:
          applicability.developer ===
          true,

        heavyReasoning:
          applicability.heavyReasoning ===
          true,

        fastPath:
          applicability.fastPath === true
      },

      confidence: {
        reconciliation:
          reconciliation.raw
            ?.confidence ??
          0,

        reconciliationScore:
          reconciliation.raw
            ?.confidenceScore ??
          0,

        reconciliationLabel:
          reconciliation.raw
            ?.confidenceLabel ||
          "very_low",

        lane:
          laneSplit.confidence ||
          null
      },

      evidence: {
        perceptionPacketAvailable:
          Boolean(perceptionPacket),

        reconciliationAvailable:
          reconciliation.available,

        reconciliationPacketUsable:
          reconciliation.packetUsable,

        canonicalIntentPacketAvailable:
          Boolean(intentPacket),

        semanticMeaningAvailable:
          Boolean(
            semanticMeaning
              .requestedOperation
          ),

        laneSplit:
          laneSplit,

        legacyClassification: {
          type:
            summary
              .universalConversationClassification
              ?.conversationType ||
            null,

          intent:
            summary
              .universalConversationClassification
              ?.conversationIntent ||
            null,

          advisoryOnly:
            true
        }
      },

      authority: {
        authoritative:
          true,

        compatibilityMode:
          false,

        ownsContextMode:
          true,

        ownsExecutionApplicability:
          true,

        consumesCanonicalIntent:
          true,

        ownsSemanticIntent:
          false,

        ownsFinalTriageLane:
          false,

        ownsFinalResponse:
          false,

        reason:
          "Context mode comes from the Lane Splitter; intent comes from Perception Reconciliation."
      }
    };
  },

  resolveCapabilities({
    requestedOperation = "",
    requestedOutput = "",
    applicability = {},
    responseRequirements = {}
  } = {}) {
    const capabilities = [
      "current_turn_response"
    ];

    const normalizedOperation =
      String(requestedOperation)
        .toLowerCase();

    if (applicability.thread) {
      capabilities.push(
        "thread_context"
      );
    }

    if (applicability.memory) {
      capabilities.push(
        "memory_retrieval"
      );
    }

    if (applicability.relationship) {
      capabilities.push(
        "relationship_context"
      );
    }

    if (applicability.developer) {
      capabilities.push(
        "developer_execution"
      );
    }

    if (
      applicability
        .artifactInvestigation
    ) {
      capabilities.push(
        "artifact_investigation"
      );
    }

    if (
      normalizedOperation.includes(
        "explain"
      )
    ) {
      capabilities.push(
        "explanation"
      );
    }

    if (
      normalizedOperation.includes(
        "recommend"
      ) ||
      normalizedOperation.includes(
        "decide"
      ) ||
      normalizedOperation.includes(
        "evaluate"
      )
    ) {
      capabilities.push(
        "decision_support"
      );
    }

    if (
      responseRequirements
        .clarificationRequired === true
    ) {
      capabilities.push(
        "clarification"
      );
    }

    if (
      String(requestedOutput)
        .toLowerCase()
        .includes("code") &&
      applicability.developer
    ) {
      capabilities.push(
        "code_generation"
      );
    }

    return [
      ...new Set(capabilities)
    ];
  },

  resolvePlanner({
    requestedOperation = "",
    applicability = {},
    reconciliation = {}
  } = {}) {
    if (
      reconciliation
        .immediateSafetyResponseRequired
    ) {
      return "safety_response_planner";
    }

    if (
      reconciliation
        .clarificationRequired
    ) {
      return "clarification_planner";
    }

    if (applicability.developer) {
      return "developer_execution_planner";
    }

    const normalized =
      String(requestedOperation)
        .toLowerCase();

    if (
      normalized.includes("decide") ||
      normalized.includes("recommend") ||
      normalized.includes("evaluate") ||
      normalized.includes("compare")
    ) {
      return "decision_planner";
    }

    if (
      normalized.includes("plan")
    ) {
      return "planning_planner";
    }

    if (
      normalized.includes("explain") ||
      normalized.includes("information")
    ) {
      return "explanation_planner";
    }

    return applicability.fastPath
      ? "direct_response_planner"
      : "general_response_planner";
  },

  /* =====================================================
     DIAGNOSTICS
  ===================================================== */

  buildDiagnostics({
    perceptionPacket = {},
    reconciliation = {},
    intentPacket = null,
    laneSplit = {},
    mode = {},
    applicability = {},
    routingContract = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    if (!perceptionPacket) {
      errors.push(
        "perception_packet_missing"
      );
    }

    if (!reconciliation.available) {
      warnings.push(
        "reconciliation_not_available"
      );
    }

    if (!intentPacket) {
      warnings.push(
        "canonical_intent_packet_missing"
      );
    }

    if (
      !laneSplit ||
      !laneSplit.lane
    ) {
      errors.push(
        "context_lane_missing"
      );
    }

    if (
      mode.mustReusePriorContext ===
        true &&
      laneSplit.routing?.useThread !==
        true
    ) {
      errors.push(
        "mode_lane_context_conflict"
      );
    }

    if (
      mode.mode === "follow_up" &&
      laneSplit.lane !==
        "continuity_follow_up"
    ) {
      errors.push(
        "follow_up_mode_without_continuity_lane"
      );
    }

    if (
      applicability.developer === true &&
      applicability.executionAllowed ===
        false
    ) {
      errors.push(
        "developer_execution_without_authorization"
      );
    }

    if (
      applicability.fastPath === true &&
      applicability.triage === true
    ) {
      warnings.push(
        "fast_path_still_runs_triage"
      );
    }

    if (
      !routingContract.primaryIntent
    ) {
      errors.push(
        "primary_intent_missing"
      );
    }

    return {
      executiveRoutingDiagnosticsRan:
        true,

      executiveRoutingDiagnosticsVersion:
        this.version,

      healthy:
        errors.length === 0,

      complete:
        errors.length === 0 &&
        Boolean(
          routingContract.primaryIntent
        ) &&
        Boolean(laneSplit.lane),

      errors,
      warnings,

      checks: {
        perceptionPacket:
          Boolean(perceptionPacket),

        reconciliation:
          reconciliation.available,

        intentPacket:
          Boolean(intentPacket),

        contextLane:
          Boolean(laneSplit.lane),

        modeLaneAligned:
          !errors.includes(
            "mode_lane_context_conflict"
          ) &&
          !errors.includes(
            "follow_up_mode_without_continuity_lane"
          ),

        executionAuthorizationAligned:
          !errors.includes(
            "developer_execution_without_authorization"
          )
      },

      authority: {
        canValidateRouting: true,
        canChooseFinalTriageLane: false,
        canAnswerUser: false,

        role:
          "executive_routing_quality_assurance"
      }
    };
  },

  /* =====================================================
     EXECUTIVE PACKET
  ===================================================== */

  buildExecutivePacket(
    summary = {}
  ) {
    return {
      ready:
        summary
          .executiveRoutingDiagnostics
          ?.complete === true,

      source:
        "ari-executive-routing-pipeline",

      version:
        this.version,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      conversationIntentPacket:
        summary.executiveIntentPacket ||
        null,

      reconciliation:
        summary.executiveReconciliation ||
        null,

      routingContract:
        summary.routingContract ||
        null,

      laneSplit:
        summary.laneSplit ||
        null,

      mode:
        summary.routingMode ||
        null,

      applicability:
        summary.routingApplicability ||
        {},

      selectedRoute: {
        speechAct:
          summary.routingContract
            ?.speechAct ||
          null,

        mode:
          summary.conversationMode ||
          "current_turn",

        primaryIntent:
          summary.primaryIntent ||
          "respond",

        secondaryIntents:
          summary.secondaryIntents ||
          [],

        domain:
          summary.conversationDomain ||
          "general_understanding",

        contextLane:
          summary.contextLane ||
          "direct_current_turn",

        primaryLane:
          null,

        capabilities:
          summary.requiredCapabilities ||
          [],

        planner:
          summary.selectedPlanner ||
          null
      },

      runInstructions: {
        currentTurn:
          summary.shouldUseCurrentTurn !==
          false,

        continuity:
          summary.shouldUseContinuity ===
          true,

        thread:
          summary.shouldUseThread === true,

        memory:
          summary.shouldUseMemory === true,

        relationship:
          summary.shouldUseRelationship ===
          true,

        deepSafety:
          summary.routingApplicability
            ?.deepSafety === true,

        situationMap:
          summary.shouldRunSituationMap !==
          false,

        triage:
          summary.shouldRunTriage !==
          false,

        developer:
          summary
            .shouldRunDeveloperLayer ===
          true,

        heavyReasoning:
          summary
            .shouldRunHeavyReasoning ===
          true,

        fastPath:
          summary.shouldUseFastPath ===
          true
      },

      diagnostics:
        summary
          .executiveRoutingDiagnostics ||
        null,

      authority: {
        canCollectEvidence: false,
        canBuildSemanticMeaning: false,

        canChooseContextMode: true,
        canChooseApplicability: true,
        canSelectCapabilities: true,
        canSelectPlanner: true,

        canChooseFinalTriageLane: false,
        canPerformReasoning: false,
        canWriteFinalLanguage: false,

        role:
          "canonical_routing_and_execution_eligibility"
      }
    };
  },

  /* =====================================================
     FALLBACKS
  ===================================================== */

  fallbackLaneSplit() {
    return {
      engine:
        "ari-lane-splitter-engine",

      source:
        "not-loaded",

      lane:
        "direct_current_turn",

      routing: {
        useCurrentTurn: true,
        useThread: false,
        useMemory: false,
        useRelationship: false,
        goStraightToSituationMap:
          true
      },

      confidence:
        "very_low",

      scores: {},

      explanation:
        "Lane Splitter was unavailable. Direct-current-turn fallback used.",

      semanticAware:
        false,

      semanticFirst:
        false,

      lexicalFallbackUsed:
        false
    };
  },

  buildFallbackPerceptionPacket(
    summary = {}
  ) {
    const message =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    return {
      ready:
        false,

      source:
        "ari-executive-routing-pipeline-fallback",

      version:
        this.version,

      message: {
        raw:
          message,

        normalized:
          summary.normalizedMessage ||
          String(message)
            .toLowerCase()
            .trim()
      },

      conversationIntentPacket:
        summary
          .conversationIntentPacket ||
        null,

      unifiedIntentPacket:
        summary
          .unifiedIntentPacket ||
        null,

      safetyScreen: {
        raw:
          summary.safetyContextGate ||
          null
      },

      observer: {
        raw:
          summary.observerEvidence ||
          null,

        observations:
          summary.observations ||
          []
      },

      conversationFunction: {
        raw:
          summary
            .conversationFunction ||
          null,

        primary:
          summary
            .conversationFunction
            ?.primaryFunction ||
          "unknown"
      },

      classification: {
        raw:
          summary
            .universalConversationClassification ||
          null,

        type:
          summary.conversationType ||
          "unknown",

        intent:
          summary.conversationIntent ||
          "unknown"
      },

      routingEvidence: {
        raw:
          summary.routingEvidence ||
          null,

        pressures:
          summary.routingPressures ||
          {}
      },

      semantic: {
        raw:
          summary.semanticFrameOutput ||
          null,

        primaryFrame:
          summary.primarySemanticFrame ||
          null,

        summary:
          summary.semanticSummary ||
          null,

        continuity:
          summary.semanticContinuity ||
          {},

        ambiguity:
          summary.semanticAmbiguity ||
          {}
      },

      reconciliation: {
        raw:
          summary
            .perceptionReconciliation ||
          null,

        available:
          summary
            .perceptionReconciliation
            ?.perceptionReconciliationRan ===
          true,

        packet:
          summary
            .conversationIntentPacket ||
          summary.unifiedIntentPacket ||
          null
      },

      authority: {
        canChooseFinalRoute: false,
        canChoosePlanner: false,
        canAnswerUser: false,

        role:
          "compatibility_perception_fallback"
      }
    };
  }
};

console.log(
  "ARI EXECUTIVE ROUTING PIPELINE LOADED:",
  window.AriExecutiveRoutingPipeline?.version
);