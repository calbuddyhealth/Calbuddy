// ari/pipeline-stages/deliberation/ari-memory-stage.js
// Ari Memory Deliberation Stage
// Purpose: Retrieve relevant user memory and convert it into usable response context.
// V1.0.0 — Memory Retrieval / Context Orchestration Foundation

window.Ari = window.Ari || {};

window.AriMemoryStage = {
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
      activeDeliberationStage: "memory"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const memoryEligibility =
      this.resolveMemoryEligibility({
        state,
        runInstructions
      });

    state = {
      ...state,

      memoryEligibility,

      shouldRetrieveMemory:
        memoryEligibility.retrieve,

      shouldBuildMemoryContext:
        memoryEligibility.buildContext
    };

    // =================================================
    // 1. Memory Retrieval
    // =================================================

    mark("before memoryRetrieval");

    const memoryRetrievalResult =
      memoryEligibility.retrieve &&
      window.AriMemoryRetrievalEngine
        ? await runEngine(
            window.AriMemoryRetrievalEngine,

            ["retrieve", "search", "recall"],

            {
              memoryRetrievalRan: false,

              memoryRetrievalSource:
                "not-loaded",

              memoryAvailable:
                false,

              memories: [],

              usableMemories: [],

              reason:
                "memory_retrieval_engine_not_loaded"
            },

            {
              ...state,

              memoryStageInput:
                this.buildMemoryStageInput(state)
            }
          )
        : {
            memoryRetrievalRan:
              false,

            memoryRetrievalSource:
              memoryEligibility.retrieve
                ? "not-loaded"
                : "skipped-by-executive-routing",

            memoryAvailable:
              false,

            memories: [],

            usableMemories: [],

            reason:
              memoryEligibility.retrieve
                ? "memory_retrieval_engine_not_loaded"
                : "memory_not_required"
          };

    const memories =
      memoryRetrievalResult.memories ||
      memoryRetrievalResult.retrievedMemories ||
      memoryRetrievalResult.results ||
      [];

    const usableMemories =
      memoryRetrievalResult.usableMemories ||
      memoryRetrievalResult.retrievedMemories ||
      memoryRetrievalResult.memories ||
      [];

    const memoryAvailable =
      memoryRetrievalResult.memoryAvailable === true ||
      usableMemories.length > 0;

    state = {
      ...state,

      memoryRetrieval:
        memoryRetrievalResult,

      memoryRetrievalRan:
        memoryRetrievalResult
          .memoryRetrievalRan === true,

      memoryRetrievalSource:
        memoryRetrievalResult
          .memoryRetrievalSource ||
        memoryRetrievalResult.source ||
        "unknown",

      memoryAvailable,

      memories,

      usableMemories,

      memoryRetrievalReason:
        memoryRetrievalResult.reason ||
        null
    };

    mark("after memoryRetrieval");

    // =================================================
    // 2. Memory Context Builder
    // =================================================

    mark("before memoryContextBuilder");

    const memoryContextEngine =
      window.AriMemoryContextBuilder ||
      window.Ari?.memoryContextBuilder;

    const memoryContextResult =
      memoryEligibility.buildContext &&
      memoryAvailable &&
      memoryContextEngine
        ? await runEngine(
            memoryContextEngine,

            ["build", "create"],

            {
              memoryContextBuilderRan:
                false,

              memoryContextSource:
                "not-loaded",

              memoryContext:
                null,

              memoryFacts: [],

              reason:
                "memory_context_builder_not_loaded"
            },

            {
              ...state,

              memoryStageInput:
                this.buildMemoryStageInput(state),

              memoryRetrieval:
                memoryRetrievalResult,

              usableMemories
            }
          )
        : {
            memoryContextBuilderRan:
              false,

            memoryContextSource:
              memoryEligibility.buildContext
                ? memoryAvailable
                  ? "not-loaded"
                  : "skipped-no-usable-memory"
                : "skipped-by-executive-routing",

            memoryContext:
              null,

            memoryFacts: [],

            reason:
              memoryEligibility.buildContext
                ? memoryAvailable
                  ? "memory_context_builder_not_loaded"
                  : "no_usable_memories"
                : "memory_context_not_required"
          };

    const memoryFacts =
      memoryContextResult.memoryFacts ||
      memoryContextResult.usableFacts ||
      usableMemories ||
      [];

    state = {
      ...state,

      memoryContext:
        memoryContextResult.memoryContext ||
        null,

      memoryContextResult,

      memoryContextBuilderRan:
        memoryContextResult
          .memoryContextBuilderRan === true,

      memoryContextSource:
        memoryContextResult
          .memoryContextSource ||
        memoryContextResult.source ||
        "unknown",

      memoryFacts,

      memoryContextReason:
        memoryContextResult.reason ||
        null
    };

    mark("after memoryContextBuilder");

    // =================================================
    // 3. Normalize memory handoff
    // =================================================

    const memoryHandoff =
      this.buildMemoryHandoff(state);

    state = {
      ...state,

      memoryHandoff,

      responseRequired:
        this.mergeUnique(
          state.responseRequired,

          memoryHandoff.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,

          memoryHandoff.forbiddenBehaviors
        )
    };

    // =================================================
    // 4. Memory Stage Packet
    // =================================================

    state.memoryStagePacket =
      this.buildMemoryStagePacket(state);

    state.memoryStageRan =
      true;

    state.memoryStageSource =
      "ari-memory-stage";

    state.memoryStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveMemoryEligibility({
    state = {},
    runInstructions = {}
  } = {}) {
    const text = String(
      state.resolvedUserQuestion ||
      state.userMessage ||
      state.message ||
      state.input ||
      ""
    );

    const routeRequestsMemory =
      runInstructions.memory === true ||
      state.routingContract?.run?.memory === true ||
      state.shouldUseMemory === true ||
      state.laneSplit?.routing?.useMemory === true;

    const executiveRequestsMemory =
      state.cognitiveExecutive
        ?.requires?.userMemory === true ||
      state.reasoningRequirements
        ?.requires?.userMemory === true;

    const explicitMemoryLanguage =
      /\b(remember|do you remember|what did i say|what do you know about me|my preference|my goal|last time|previously|before|from now on|going forward)\b/i.test(
        text
      );

    const continuityNeedsMemory =
      state.continuityEligibility
        ?.useMemory === true ||
      state.continuityEntryPointUsed
        ?.memory === true;

    const developerLocked =
      state.developerResponseLocked === true;

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const retrieve =
      !developerLocked &&
      !safetyOverride &&
      (
        routeRequestsMemory ||
        executiveRequestsMemory ||
        explicitMemoryLanguage ||
        continuityNeedsMemory
      );

    return {
      retrieve,

      buildContext:
        retrieve,

      routeRequestsMemory,

      executiveRequestsMemory,

      explicitMemoryLanguage,

      continuityNeedsMemory,

      developerLocked,

      safetyOverride,

      source:
        "ari-memory-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : safetyOverride
            ? "safety_override_suppresses_memory_retrieval"
            : retrieve
              ? "memory_context_required"
              : "memory_not_required"
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildMemoryStageInput(summary = {}) {
    return {
      request: {
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

      reasoning:
        summary.reasoningStagePacket ||
        null,

      existingMemory: {
        threadMemory:
          summary.continuityEntryPointOutputs
            ?.memory ||
          null,

        previousFacts:
          summary.memoryFacts ||
          [],

        previousContext:
          summary.memoryContext ||
          null
      },

      retrievalScope: {
        userMemory:
          true,

        projectMemory:
          summary.routingContract?.mode ===
          "developer",

        relationshipMemory:
          summary.shouldUseRelationship === true,

        recentConversation:
          summary.shouldUseThread === true
      }
    };
  },

  // ===================================================
  // Memory handoff
  // ===================================================

  buildMemoryHandoff(summary = {}) {
    const facts =
      summary.memoryFacts ||
      [];

    const context =
      summary.memoryContext ||
      null;

    return {
      available:
        summary.memoryAvailable === true,

      retrievalRan:
        summary.memoryRetrievalRan === true,

      contextBuilt:
        summary.memoryContextBuilderRan === true,

      context,

      facts,

      factCount:
        facts.length,

      usableMemories:
        summary.usableMemories ||
        [],

      requiredBehaviors:
        context?.requiredBehaviors ||
        [],

      forbiddenBehaviors:
        context?.forbiddenBehaviors ||
        [],

      personalizationAllowed:
        context?.personalizationAllowed !== false,

      shouldMentionMemory:
        context?.shouldMentionMemory === true,

      confidence:
        context?.confidence ||
        summary.memoryRetrieval
          ?.confidence ||
        null,

      source:
        summary.memoryContextBuilderRan === true
          ? "memory_context_builder"
          : summary.memoryRetrievalRan === true
            ? "memory_retrieval"
            : "none"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildMemoryStagePacket(summary = {}) {
    return {
      ready:
        true,

      source:
        "ari-memory-stage",

      version:
        this.version,

      eligibility:
        summary.memoryEligibility ||
        null,

      retrieval: {
        ran:
          summary.memoryRetrievalRan === true,

        source:
          summary.memoryRetrievalSource ||
          null,

        reason:
          summary.memoryRetrievalReason ||
          null,

        available:
          summary.memoryAvailable === true,

        memories:
          summary.memories ||
          [],

        usableMemories:
          summary.usableMemories ||
          [],

        raw:
          summary.memoryRetrieval ||
          null
      },

      context: {
        ran:
          summary.memoryContextBuilderRan === true,

        source:
          summary.memoryContextSource ||
          null,

        reason:
          summary.memoryContextReason ||
          null,

        value:
          summary.memoryContext ||
          null,

        facts:
          summary.memoryFacts ||
          []
      },

      handoff:
        summary.memoryHandoff ||
        null,

      responseControl: {
        requiredBehaviors:
          summary.memoryHandoff
            ?.requiredBehaviors ||
          [],

        forbiddenBehaviors:
          summary.memoryHandoff
            ?.forbiddenBehaviors ||
          [],

        personalizationAllowed:
          summary.memoryHandoff
            ?.personalizationAllowed !== false,

        shouldMentionMemory:
          summary.memoryHandoff
            ?.shouldMentionMemory === true
      },

      authority: {
        canRetrieveMemory:
          true,

        canBuildMemoryContext:
          true,

        canProvidePersonalizationFacts:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canPerformGeneralReasoning:
          false,

        canWriteFinalLanguage:
          false,

        canPersistNewMemory:
          false,

        role:
          "memory_retrieval_and_context_handoff"
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

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(...values) {
    return [
      ...new Set(
        values.flatMap(value =>
          this.toArray(value)
        )
      )
    ];
  }
};

console.log(
  "ARI MEMORY STAGE LOADED:",
  window.AriMemoryStage?.version
);