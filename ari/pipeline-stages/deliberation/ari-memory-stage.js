// ari/pipeline-stages/deliberation/ari-memory-stage.js
// Ari Memory Deliberation Stage
// Purpose: Retrieve relevant user memory and attach advisory learned personalization.
// V1.1.0 — Memory + Deterministic Personalization Context

window.Ari = window.Ari || {};

window.AriMemoryStage = {
  version: "1.1.0",

  _personalizationLoadPromise: null,

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
    // 3. Deterministic Personalization
    //
    // This is intentionally separate from explicit preferences.
    // It observes recent Training + Nutrition behavior only.
    // Circle/social behavior is explicitly excluded.
    // =================================================

    mark("before personalization");

    const personalizationEligibility =
      this.resolvePersonalizationEligibility(state);

    let personalizationResult =
      this.personalizationFallback(
        personalizationEligibility.run
          ? "personalization_engine_not_loaded"
          : personalizationEligibility.reason
      );

    if (personalizationEligibility.run) {
      try {
        const engine =
          await this.ensurePersonalizationEngine();

        if (engine?.analyze) {
          personalizationResult =
            await engine.analyze({
              summary: state,
              appContext:
                state.appContext ||
                null
            });
        }
      } catch (error) {
        personalizationResult =
          this.personalizationFallback(
            error?.message ||
            "personalization_engine_failed"
          );
      }
    }

    const personalizationFacts =
      Array.isArray(
        personalizationResult?.facts
      )
        ? personalizationResult.facts
        : [];

    const personalizationAvailable =
      personalizationResult?.available ===
        true &&
      personalizationFacts.length > 0;

    const combinedMemoryFacts =
      this.mergeUnique(
        state.memoryFacts,
        personalizationFacts
      );

    const combinedMemoryContext =
      this.mergeContextText(
        state.memoryContext,
        personalizationAvailable
          ? personalizationResult
              .instructionText
          : null,
        personalizationFacts
      );

    state = {
      ...state,

      personalizationEligibility,

      personalizationStagePacket:
        personalizationResult,

      personalizationFacts,

      personalizationAvailable,

      personalizationConfidence:
        personalizationResult
          ?.confidence ||
        null,

      memoryAvailable:
        state.memoryAvailable === true ||
        personalizationAvailable,

      memoryFacts:
        combinedMemoryFacts,

      memoryContext:
        combinedMemoryContext,

      responseRequired:
        personalizationAvailable
          ? this.mergeUnique(
              state.responseRequired,
              [
                "Treat learned behavioral patterns as advisory observations only; explicit user instructions, explicit goals, and saved Ari preferences take precedence.",
                "Do not present learned behavioral patterns as diagnoses, causal findings, or guaranteed outcomes.",
                "Do not infer, score, or use Ari Circle/social behavior for personalization."
              ]
            )
          : state.responseRequired
    };

    mark("after personalization");

    // =================================================
    // 4. Normalize memory handoff
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
    // 5. Memory Stage Packet
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

  resolvePersonalizationEligibility(
    state = {}
  ) {
    const developerLocked =
      state.developerResponseLocked === true;

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const developerMode =
      String(
        state.routingContract?.mode ||
        state.primaryLane ||
        ""
      ).toLowerCase().includes(
        "developer"
      );

    const run =
      !developerLocked &&
      !safetyOverride &&
      !developerMode;

    return {
      run,
      source:
        "ari-personalization-eligibility",
      developerLocked,
      safetyOverride,
      developerMode,
      circleIncluded:
        false,
      reason:
        developerLocked
          ? "developer_response_locked"
          : safetyOverride
            ? "safety_override_suppresses_personalization"
            : developerMode
              ? "developer_mode_skips_coaching_personalization"
              : "user_behavior_personalization_allowed"
    };
  },

  // ===================================================
  // Personalization Loader / Fallback
  // ===================================================

  async ensurePersonalizationEngine() {
    if (
      window.AriPersonalizationEngine
        ?.analyze
    ) {
      return window.AriPersonalizationEngine;
    }

    if (
      typeof document === "undefined"
    ) {
      return null;
    }

    if (this._personalizationLoadPromise) {
      return this._personalizationLoadPromise;
    }

    this._personalizationLoadPromise =
      new Promise(resolve => {
        const src =
          "ari/personalization/ari-personalization-engine.js?v=1.0.0";

        const existing =
          document.querySelector(
            'script[data-ari-personalization-engine="1"]'
          );

        if (existing) {
          if (
            window.AriPersonalizationEngine
              ?.analyze
          ) {
            resolve(
              window.AriPersonalizationEngine
            );
            return;
          }

          existing.addEventListener(
            "load",
            () => resolve(
              window.AriPersonalizationEngine ||
              null
            ),
            { once: true }
          );

          existing.addEventListener(
            "error",
            () => resolve(null),
            { once: true }
          );

          return;
        }

        const script =
          document.createElement("script");

        script.src = src;
        script.async = true;
        script.dataset
          .ariPersonalizationEngine =
          "1";

        script.onload =
          () => resolve(
            window.AriPersonalizationEngine ||
            null
          );

        script.onerror =
          () => resolve(null);

        document.head.appendChild(script);
      }).finally(() => {
        this._personalizationLoadPromise =
          null;
      });

    return this._personalizationLoadPromise;
  },

  personalizationFallback(
    reason = "personalization_unavailable"
  ) {
    return {
      ready:
        true,
      available:
        false,
      source:
        "ari-personalization-fallback",
      version:
        "1.0.0",
      facts: [],
      patterns: [],
      confidence:
        "insufficient",
      excludedDomains: [
        "circle",
        "social",
        "feed",
        "friends",
        "challenges"
      ],
      reason,
      authority: {
        role:
          "advisory_behavioral_personalization",
        mayOverrideExplicitUserPreference:
          false,
        mayPersistPreferenceChanges:
          false,
        mayOverrideSafety:
          false,
        mayUseCircleData:
          false
      }
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

      personalization:
        summary.personalizationStagePacket ||
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
          summary.shouldUseThread === true,

        learnedTrainingPatterns:
          true,

        learnedNutritionPatterns:
          true,

        circleSocialPatterns:
          false
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
        summary.memoryContextBuilderRan === true ||
        summary.personalizationAvailable === true,

      context,

      facts,

      factCount:
        facts.length,

      usableMemories:
        summary.usableMemories ||
        [],

      personalization:
        summary.personalizationStagePacket ||
        null,

      learnedPatternCount:
        summary.personalizationFacts
          ?.length ||
        0,

      requiredBehaviors:
        [],

      forbiddenBehaviors:
        [],

      personalizationAllowed:
        true,

      shouldMentionMemory:
        false,

      confidence:
        summary.personalizationConfidence ||
        summary.memoryRetrieval
          ?.confidence ||
        null,

      source:
        summary.personalizationAvailable === true
          ? "memory_plus_personalization"
          : summary.memoryContextBuilderRan === true
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
          summary.memoryContextBuilderRan === true ||
          summary.personalizationAvailable === true,

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

      personalization: {
        ran:
          summary.personalizationEligibility
            ?.run === true,

        available:
          summary.personalizationAvailable === true,

        confidence:
          summary.personalizationConfidence ||
          null,

        facts:
          summary.personalizationFacts ||
          [],

        packet:
          summary.personalizationStagePacket ||
          null,

        circleIncluded:
          false
      },

      handoff:
        summary.memoryHandoff ||
        null,

      responseControl: {
        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        personalizationAllowed:
          true,

        shouldMentionMemory:
          false
      },

      authority: {
        canRetrieveMemory:
          true,

        canBuildMemoryContext:
          true,

        canProvidePersonalizationFacts:
          true,

        canInferBehaviorPatterns:
          true,

        canUseCircleSocialBehavior:
          false,

        canOverrideExplicitPreferences:
          false,

        canPersistPreferenceChanges:
          false,

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
          "memory_retrieval_and_advisory_personalization_handoff"
      }
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  mergeContextText(...values) {
    const parts = [];

    values.flatMap(value =>
      Array.isArray(value)
        ? value
        : [value]
    ).forEach(value => {
      const text =
        String(value || "").trim();

      if (
        text &&
        !parts.includes(text)
      ) {
        parts.push(text);
      }
    });

    return parts.length
      ? parts.join("\n")
      : null;
  },

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
