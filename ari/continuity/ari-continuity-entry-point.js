// ari/continuity/ari-continuity-entry-point.js
// Ari Continuity Entry Point
//
// Purpose:
// Orchestrate the continuity branch after official routing has determined
// that prior conversational context may be needed.
//
// V2.0.0 — Ordered Continuity Orchestrator / Structured Handoffs
//
// Execution order:
// 1. Thread Context
// 2. Entity and Reference Resolution
// 3. Memory Context
// 4. Relationship Context
// 5. Continuity Packet
//
// Responsibilities:
// - Follow the route already selected upstream.
// - Run only the continuity capabilities requested by routing.
// - Pass structured thread output into reference resolution.
// - Preserve every engine output separately.
// - Build the official Continuity Packet.
// - Report failures and partial completion.
//
// Non-responsibilities:
// - Does not decide whether continuity is semantically necessary.
// - Does not reinterpret the user's language.
// - Does not resolve semantic operations.
// - Does not choose the semantic frame.
// - Does not choose conversation function.
// - Does not choose the final lane.
// - Does not rewrite the user’s current turn.
// - Does not answer the user.
// - Does not determine safety severity.

window.Ari = window.Ari || {};

window.Ari.continuityEntryPoint = {
  version: "2.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  enter(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const laneSplit =
      input.laneSplit ||
      summary.laneSplit ||
      {};

    const routing =
      this.readRouting({
        summary,
        laneSplit
      });

    const shouldRun =
      this.shouldRunContinuity(
        routing
      );

    if (!shouldRun) {
      const emptyResults =
        this.emptyContinuityResults({
          reason:
            "direct_route_no_continuity_needed",

          summary,
          laneSplit,
          routing
        });

      const packet =
        this.runContinuityPacket({
          summary,
          laneSplit,
          continuityResults:
            emptyResults
        });

      emptyResults.packet =
        packet;

      emptyResults.continuityPacket =
        packet;

      emptyResults.outputs.packet =
        packet;

      emptyResults.used.packet =
        this.outputSucceeded(
          packet
        );

      emptyResults.handoff = {
        ...emptyResults.handoff,

        shouldBuildPacket:
          true,

        packetBuilt:
          emptyResults.used.packet,

        packetReady:
          packet?.ready ===
          true
      };

      return emptyResults;
    }

    const continuityResults =
      this.createBaseResults({
        summary,
        laneSplit,
        routing
      });

    /*
     * Thread context must run before reference resolution.
     *
     * References such as:
     *   "it"
     *   "that"
     *   "him"
     *   "the second one"
     *
     * cannot be safely resolved without an active thread graph.
     */
    if (routing.useThread) {
      continuityResults.executionOrder
        .push("thread");

      continuityResults.outputs.thread =
        this.runThreadUnderstanding(
          summary
        );

      continuityResults.used.thread =
        this.outputSucceeded(
          continuityResults
            .outputs
            .thread
        );
    }

    /*
     * Reference resolution consumes the structured thread output.
     *
     * The enriched summary is local to this branch. It does not
     * overwrite upstream routing or semantic authority.
     */
    if (
      routing.useReferenceResolution
    ) {
      continuityResults.executionOrder
        .push("reference");

      const referenceInput =
        this.buildReferenceInput({
          summary,

          threadOutput:
            continuityResults
              .outputs
              .thread,

          continuityResults,
          laneSplit
        });

      continuityResults.outputs.reference =
        this.runReferenceResolution(
          referenceInput
        );

      /*
       * Compatibility alias for older files that still read
       * outputs.entity.
       */
      continuityResults.outputs.entity =
        continuityResults
          .outputs
          .reference;

      continuityResults.used.reference =
        this.outputSucceeded(
          continuityResults
            .outputs
            .reference
        );

      continuityResults.used.entity =
        continuityResults
          .used
          .reference;
    }

    if (routing.useMemory) {
      continuityResults.executionOrder
        .push("memory");

      const memoryInput =
        this.buildMemoryInput({
          summary,

          threadOutput:
            continuityResults
              .outputs
              .thread,

          referenceOutput:
            continuityResults
              .outputs
              .reference,

          continuityResults,
          laneSplit
        });

      continuityResults.outputs.memory =
        this.runMemory(
          memoryInput
        );

      continuityResults.used.memory =
        this.outputSucceeded(
          continuityResults
            .outputs
            .memory
        );
    }

    if (routing.useRelationship) {
      continuityResults.executionOrder
        .push("relationship");

      const relationshipInput =
        this.buildRelationshipInput({
          summary,

          threadOutput:
            continuityResults
              .outputs
              .thread,

          referenceOutput:
            continuityResults
              .outputs
              .reference,

          memoryOutput:
            continuityResults
              .outputs
              .memory,

          continuityResults,
          laneSplit
        });

      continuityResults
        .outputs
        .relationship =
        this.runRelationship(
          relationshipInput
        );

      continuityResults
        .used
        .relationship =
        this.outputSucceeded(
          continuityResults
            .outputs
            .relationship
        );
    }

    /*
     * The Continuity Packet packages the outputs.
     * It does not reinterpret them.
     */
    continuityResults.executionOrder
      .push("packet");

    const packet =
      this.runContinuityPacket({
        summary,
        laneSplit,
        continuityResults
      });

    continuityResults.outputs.packet =
      packet;

    continuityResults.packet =
      packet;

    continuityResults.continuityPacket =
      packet;

    continuityResults.used.packet =
      this.outputSucceeded(
        packet
      );

    continuityResults.warnings =
      this.collectWarnings(
        continuityResults
      );

    continuityResults.quality =
      this.buildQuality(
        continuityResults
      );

    continuityResults.confidence =
      continuityResults
        .quality
        .confidence;

    continuityResults.handoff = {
      nextEngine:
        "ari-context-assembler",

      expectedMethod:
        "assemble",

      shouldBuildPacket:
        true,

      packetBuilt:
        continuityResults
          .used
          .packet,

      packetReady:
        packet?.ready ===
        true,

      packetPath:
        "continuityResults.outputs.packet",

      preferredSummaryPlacement:
        "continuityPacket",

      readyForContextAssembler:
        packet?.ready ===
          true,

      authority:
        "continuity_handoff_only"
    };

    return continuityResults;
  },

  /* =====================================================
     ROUTING
  ===================================================== */

  readRouting({
    summary = {},
    laneSplit = {}
  } = {}) {
    const route =
      laneSplit.routing ||
      summary.routingContract
        ?.continuity ||
      summary.executivePacket
        ?.runInstructions ||
      {};

    const useThread =
      route.useThread ===
        true ||
      route.thread ===
        true;

    const useMemory =
      route.useMemory ===
        true ||
      route.memory ===
        true;

    const useRelationship =
      route.useRelationship ===
        true ||
      route.relationship ===
        true;

    /*
     * Reference resolution is automatically paired with thread use
     * unless routing explicitly disables it.
     *
     * This does not give the entry point routing authority.
     * It is an internal dependency:
     *
     * thread context
     *     ↓
     * reference resolution
     */
    const useReferenceResolution =
      route.useReferenceResolution ===
        false
        ? false
        : (
            route.useReferenceResolution ===
              true ||
            route.referenceResolution ===
              true ||
            useThread
          );

    return {
      useThread,

      useReferenceResolution,

      useMemory,

      useRelationship,

      goStraightToSituationMap:
        route
          .goStraightToSituationMap ===
          true,

      source:
        laneSplit.routing
          ? "lane_splitter"
          : summary.routingContract
              ?.continuity
            ? "routing_contract"
            : summary.executivePacket
                ?.runInstructions
              ? "executive_packet"
              : "continuity_entry_point_fallback",

      authority:
        "preserved_upstream_routing"
    };
  },

  shouldRunContinuity(
    routing = {}
  ) {
    return Boolean(
      routing.useThread ||
      routing
        .useReferenceResolution ||
      routing.useMemory ||
      routing.useRelationship
    );
  },

  /* =====================================================
     BASE RESULTS
  ===================================================== */

  createBaseResults({
    summary = {},
    laneSplit = {},
    routing = {}
  } = {}) {
    const currentTurn =
      this.buildCurrentTurn({
        summary,
        laneSplit
      });

    return {
      schema:
        "ari_continuity_results",

      schemaVersion:
        "1.0.0",

      engine:
        "ari-continuity-entry-point",

      version:
        this.version,

      source:
        "ari-continuity-entry-point",

      createdAt:
        new Date().toISOString(),

      ran:
        true,

      reason:
        "continuity_route_selected",

      lane:
        laneSplit.lane ||
        summary.contextLane ||
        "unknown",

      currentTurn,

      routing: {
        useThread:
          routing.useThread ===
          true,

        useReferenceResolution:
          routing
            .useReferenceResolution ===
          true,

        useMemory:
          routing.useMemory ===
          true,

        useRelationship:
          routing
            .useRelationship ===
          true,

        goStraightToSituationMap:
          routing
            .goStraightToSituationMap ===
          true,

        source:
          routing.source ||
          null
      },

      executionOrder: [],

      used: {
        thread:
          false,

        reference:
          false,

        entity:
          false,

        memory:
          false,

        relationship:
          false,

        packet:
          false
      },

      outputs: {
        thread:
          null,

        reference:
          null,

        /*
         * Compatibility alias.
         */
        entity:
          null,

        memory:
          null,

        relationship:
          null,

        packet:
          null
      },

      packet:
        null,

      continuityPacket:
        null,

      warnings: [],

      quality: {
        ready:
          false,

        healthy:
          false,

        confidence:
          0
      },

      confidence:
        0,

      handoff: {
        nextEngine:
          "ari-continuity-packet",

        expectedMethod:
          "build",

        shouldBuildPacket:
          true,

        packetBuilt:
          false,

        packetReady:
          false
      },

      authority: {
        canOrchestrateContinuity:
          true,

        canPreserveExecutionOrder:
          true,

        canPassStructuredOutputs:
          true,

        canChooseWhetherContinuityRuns:
          false,

        canChooseLane:
          false,

        canInterpretMeaning:
          false,

        canInterpretRequestedOperation:
          false,

        canResolveReferences:
          false,

        canRewriteCurrentTurn:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChoosePlanner:
          false,

        canAnswerUser:
          false,

        canOverrideSafety:
          false,

        canSetPriority:
          false,

        role:
          "ordered_continuity_orchestration_only"
      }
    };
  },

  buildCurrentTurn({
    summary = {},
    laneSplit = {}
  } = {}) {
    const originalText =
      this.extractCurrentQuestion(
        summary
      );

    const resolvedText =
      this.clean(
        summary.resolvedUserQuestion ||
        summary.resolvedCurrentTurn
          ?.resolvedText ||
        originalText
      );

    return {
      originalText,

      text:
        originalText,

      resolvedText:
        resolvedText ||
        originalText,

      currentTurnWasResolved:
        summary
          .currentTurnWasResolved ===
          true ||
        (
          Boolean(resolvedText) &&
          resolvedText !==
            originalText
        ),

      lane:
        laneSplit.lane ||
        summary.contextLane ||
        null,

      needsPriorContext:
        laneSplit.lane
          ? laneSplit.lane !==
            "direct_current_turn"
          : summary
              .shouldUseContinuity ===
            true,

      preservedExactly:
        !summary
          .currentTurnWasResolved,

      authority:
        "current_turn_record_only"
    };
  },

  /* =====================================================
     THREAD INPUT
  ===================================================== */

  runThreadUnderstanding(
    summary = {}
  ) {
    const engine =
      window.Ari
        .threadUnderstandingEngine ||
      window
        .AriThreadUnderstandingEngine ||
      null;

    if (!engine) {
      return this.engineFailure({
        engine:
          "thread",

        error:
          "thread_understanding_engine_not_found"
      });
    }

    try {
      let output;

      if (
        typeof engine.understand ===
        "function"
      ) {
        output =
          engine.understand(
            summary
          );
      } else if (
        typeof engine.analyze ===
        "function"
      ) {
        output =
          engine.analyze(
            summary
          );
      } else if (
        typeof engine.build ===
        "function"
      ) {
        output =
          engine.build(
            summary
          );
      } else {
        return this.engineFailure({
          engine:
            "thread",

          error:
            "thread_engine_has_no_supported_method"
        });
      }

      return this.validateSynchronousOutput({
        output,
        engine:
          "thread"
      });
    } catch (error) {
      return this.engineFailure({
        engine:
          "thread",

        error:
          "thread_engine_failed",

        message:
          error?.message ||
          String(error)
      });
    }
  },

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  buildReferenceInput({
    summary = {},
    threadOutput = null,
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    const threadUnderstanding =
      threadOutput
        ?.threadUnderstanding ||
      threadOutput
        ?.threadContext ||
      threadOutput ||
      null;

    const workingContext =
      threadOutput
        ?.workingContext ||
      threadUnderstanding
        ?.workingContext ||
      null;

    return {
      ...summary,

      laneSplit,

      continuityResults,

      threadContext:
        threadOutput,

      threadUnderstanding,

      threadWorkingContext:
        workingContext,

      workingContext,

      activeThread:
        threadOutput,

      activeThreadFacts:
        this.collectThreadFacts(
          threadOutput
        ),

      referenceResolutionInput: {
        currentTurn:
          continuityResults
            .currentTurn,

        threadContext:
          threadOutput,

        workingContext,

        authority:
          "reference_resolution_input_only"
      }
    };
  },

  runReferenceResolution(
    summary = {}
  ) {
    const engine =
      window.Ari
        .entityReferenceResolver ||
      window
        .AriEntityReferenceResolver ||
      window.Ari
        .referenceResolver ||
      window
        .AriReferenceResolver ||
      null;

    if (!engine) {
      return this.engineFailure({
        engine:
          "reference",

        error:
          "entity_reference_resolver_not_found"
      });
    }

    try {
      let output;

      if (
        typeof engine.resolve ===
        "function"
      ) {
        output =
          engine.resolve(
            summary
          );
      } else if (
        typeof engine.analyze ===
        "function"
      ) {
        output =
          engine.analyze(
            summary
          );
      } else if (
        typeof engine.build ===
        "function"
      ) {
        output =
          engine.build(
            summary
          );
      } else {
        return this.engineFailure({
          engine:
            "reference",

          error:
            "reference_engine_has_no_supported_method"
        });
      }

      return this.validateSynchronousOutput({
        output,
        engine:
          "reference"
      });
    } catch (error) {
      return this.engineFailure({
        engine:
          "reference",

        error:
          "reference_engine_failed",

        message:
          error?.message ||
          String(error)
      });
    }
  },

  /* =====================================================
     MEMORY
  ===================================================== */

  buildMemoryInput({
    summary = {},
    threadOutput = null,
    referenceOutput = null,
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    return {
      ...summary,

      laneSplit,

      continuityResults,

      threadContext:
        threadOutput,

      threadUnderstanding:
        threadOutput
          ?.threadUnderstanding ||
        threadOutput,

      referenceResolution:
        referenceOutput,

      entityReferenceState:
        referenceOutput
          ?.entityReferenceState ||
        referenceOutput,

      continuityMemoryInput: {
        currentTurn:
          continuityResults
            .currentTurn,

        threadContext:
          threadOutput,

        referenceResolution:
          referenceOutput,

        authority:
          "memory_retrieval_input_only"
      }
    };
  },

  runMemory(
    summary = {}
  ) {
    const engine =
      window.Ari.memoryRetrieval ||
      window.Ari
        .memoryRetrievalEngine ||
      window
        .AriMemoryRetrievalEngine ||
      window.Ari.memoryEngine ||
      window.AriMemoryEngine ||
      null;

    if (!engine) {
      return this.engineFailure({
        engine:
          "memory",

        error:
          "memory_engine_not_found"
      });
    }

    try {
      let output;

      if (
        typeof engine.retrieve ===
        "function"
      ) {
        output =
          engine.retrieve(
            summary
          );
      } else if (
        typeof engine.recall ===
        "function"
      ) {
        output =
          engine.recall(
            summary
          );
      } else if (
        typeof engine.getRelevant ===
        "function"
      ) {
        output =
          engine.getRelevant(
            summary
          );
      } else if (
        typeof engine.analyze ===
        "function"
      ) {
        output =
          engine.analyze(
            summary
          );
      } else {
        return this.engineFailure({
          engine:
            "memory",

          error:
            "memory_engine_has_no_supported_method"
        });
      }

      return this.validateSynchronousOutput({
        output,
        engine:
          "memory"
      });
    } catch (error) {
      return this.engineFailure({
        engine:
          "memory",

        error:
          "memory_engine_failed",

        message:
          error?.message ||
          String(error)
      });
    }
  },

  /* =====================================================
     RELATIONSHIP
  ===================================================== */

  buildRelationshipInput({
    summary = {},
    threadOutput = null,
    referenceOutput = null,
    memoryOutput = null,
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    return {
      ...summary,

      laneSplit,

      continuityResults,

      threadContext:
        threadOutput,

      threadUnderstanding:
        threadOutput
          ?.threadUnderstanding ||
        threadOutput,

      referenceResolution:
        referenceOutput,

      entityReferenceState:
        referenceOutput
          ?.entityReferenceState ||
        referenceOutput,

      memoryContext:
        memoryOutput
          ?.memoryContext ||
        memoryOutput,

      continuityRelationshipInput: {
        currentTurn:
          continuityResults
            .currentTurn,

        threadContext:
          threadOutput,

        referenceResolution:
          referenceOutput,

        memoryContext:
          memoryOutput,

        authority:
          "relationship_context_input_only"
      }
    };
  },

  runRelationship(
    summary = {}
  ) {
    const engine =
      window.Ari
        .relationshipEngine ||
      window
        .AriRelationshipEngine ||
      null;

    if (!engine) {
      return this.engineFailure({
        engine:
          "relationship",

        error:
          "relationship_engine_not_found"
      });
    }

    try {
      let output;

      if (
        typeof engine.understand ===
        "function"
      ) {
        output =
          engine.understand(
            summary
          );
      } else if (
        typeof engine.analyze ===
        "function"
      ) {
        output =
          engine.analyze(
            summary
          );
      } else if (
        typeof engine.build ===
        "function"
      ) {
        output =
          engine.build(
            summary
          );
      } else {
        return this.engineFailure({
          engine:
            "relationship",

          error:
            "relationship_engine_has_no_supported_method"
        });
      }

      return this.validateSynchronousOutput({
        output,
        engine:
          "relationship"
      });
    } catch (error) {
      return this.engineFailure({
        engine:
          "relationship",

        error:
          "relationship_engine_failed",

        message:
          error?.message ||
          String(error)
      });
    }
  },

  /* =====================================================
     CONTINUITY PACKET
  ===================================================== */

  runContinuityPacket({
    summary = {},
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    const engine =
      window.Ari
        .continuityPacket ||
      window
        .AriContinuityPacket ||
      null;

    if (!engine) {
      return this.engineFailure({
        engine:
          "packet",

        error:
          "continuity_packet_not_found"
      });
    }

    try {
      if (
        typeof engine.build !==
        "function"
      ) {
        return this.engineFailure({
          engine:
            "packet",

          error:
            "continuity_packet_has_no_build_method"
        });
      }

      const output =
        engine.build({
          summary: {
            ...summary,

            continuityResults,

            threadContext:
              continuityResults
                .outputs
                ?.thread ||
              summary.threadContext ||
              null,

            referenceResolution:
              continuityResults
                .outputs
                ?.reference ||
              summary
                .referenceResolution ||
              null,

            entityReferenceState:
              continuityResults
                .outputs
                ?.reference
                ?.entityReferenceState ||
              continuityResults
                .outputs
                ?.reference ||
              summary
                .entityReferenceState ||
              null,

            memoryContext:
              continuityResults
                .outputs
                ?.memory
                ?.memoryContext ||
              continuityResults
                .outputs
                ?.memory ||
              summary.memoryContext ||
              null,

            relationshipProfile:
              continuityResults
                .outputs
                ?.relationship
                ?.relationshipProfile ||
              continuityResults
                .outputs
                ?.relationship ||
              summary
                .relationshipProfile ||
              null
          },

          continuityResults,

          laneSplit
        });

      return this.validateSynchronousOutput({
        output,
        engine:
          "packet"
      });
    } catch (error) {
      return this.engineFailure({
        engine:
          "packet",

        error:
          "continuity_packet_failed",

        message:
          error?.message ||
          String(error)
      });
    }
  },

  /* =====================================================
     THREAD FACTS
  ===================================================== */

  collectThreadFacts(
    threadOutput = null
  ) {
    if (
      !threadOutput ||
      typeof threadOutput !==
        "object"
    ) {
      return [];
    }

    const root =
      threadOutput.threadContext ||
      threadOutput
        .threadUnderstanding ||
      threadOutput;

    const facts = [
      ...this.arrayFrom(
        root.keyFacts
      ),

      ...this.arrayFrom(
        root.activeClaims
      ),

      ...this.arrayFrom(
        root.threadFacts
      ),

      ...this.arrayFrom(
        root.workingContext
          ?.keyFacts
      )
    ];

    return this.dedupeValues(
      facts
    );
  },

  /* =====================================================
     OUTPUT VALIDATION
  ===================================================== */

  validateSynchronousOutput({
    output,
    engine = "unknown"
  } = {}) {
    if (
      output &&
      typeof output.then ===
        "function"
    ) {
      return this.engineFailure({
        engine,

        error:
          `${engine}_engine_returned_promise`,

        message:
          "The continuity entry point currently uses a synchronous interface, but this engine returned a Promise."
      });
    }

    if (
      !output ||
      typeof output !==
        "object"
    ) {
      return this.engineFailure({
        engine,

        error:
          `${engine}_engine_returned_invalid_output`
      });
    }

    return output;
  },

  outputSucceeded(
    output
  ) {
    if (!output) {
      return false;
    }

    if (
      output.error
    ) {
      return false;
    }

    if (
      output.ran ===
      false
    ) {
      return false;
    }

    if (
      output.ready ===
      false &&
      output.engine ===
        "ari-continuity-packet"
    ) {
      return false;
    }

    return true;
  },

  engineFailure({
    engine = "unknown",
    error = "engine_failed",
    message = null
  } = {}) {
    return {
      ran:
        false,

      ready:
        false,

      engine,

      source:
        "ari-continuity-entry-point",

      error,

      message,

      authority:
        "failure_report_only"
    };
  },

  /* =====================================================
     WARNINGS
  ===================================================== */

  collectWarnings(
    results = {}
  ) {
    const warnings =
      this.arrayFrom(
        results.warnings
      );

    Object.entries(
      results.outputs ||
      {}
    ).forEach(
      ([engine, output]) => {
        /*
         * entity is only a compatibility alias for reference.
         * Do not report the same failure twice.
         */
        if (
          engine ===
          "entity"
        ) {
          return;
        }

        const wasRequested =
          this.engineWasRequested({
            engine,
            results
          });

        if (
          !wasRequested
        ) {
          return;
        }

        if (!output) {
          warnings.push({
            type:
              "engine_output_missing",

            engine,

            message:
              `The ${engine} continuity engine was requested but returned no output.`
          });

          return;
        }

        if (output.error) {
          warnings.push({
            type:
              "engine_error",

            engine,

            error:
              output.error,

            message:
              output.message ||
              null
          });
        }

        if (
          output.ran ===
            false &&
          output.error
        ) {
          warnings.push({
            type:
              "engine_not_run",

            engine,

            reason:
              output.error
          });
        }
      }
    );

    if (
      results.routing
        ?.useReferenceResolution &&
      !results.used
        ?.thread
    ) {
      warnings.push({
        type:
          "reference_resolution_without_usable_thread",

        engine:
          "reference",

        message:
          "Reference resolution was requested, but structured thread context was unavailable."
      });
    }

    if (
      results.used
        ?.reference &&
      !results.used
        ?.thread
    ) {
      warnings.push({
        type:
          "reference_resolution_used_without_thread",

        engine:
          "reference",

        message:
          "Reference resolution produced output without a successful thread-context handoff."
      });
    }

    if (
      !results.used
        ?.packet
    ) {
      warnings.push({
        type:
          "continuity_packet_unavailable",

        engine:
          "packet",

        message:
          "The continuity branch did not produce a usable Continuity Packet."
      });
    }

    return this.dedupeWarnings(
      warnings
    );
  },

  engineWasRequested({
    engine = "",
    results = {}
  } = {}) {
    const routing =
      results.routing ||
      {};

    const map = {
      thread:
        routing.useThread,

      reference:
        routing
          .useReferenceResolution,

      memory:
        routing.useMemory,

      relationship:
        routing
          .useRelationship,

      packet:
        true
    };

    return map[engine] ===
      true;
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality(
    results = {}
  ) {
    const routing =
      results.routing ||
      {};

    const used =
      results.used ||
      {};

    const warnings =
      results.warnings ||
      [];

    let requestedCount = 1;
    let successfulCount =
      used.packet
        ? 1
        : 0;

    if (routing.useThread) {
      requestedCount += 1;

      if (used.thread) {
        successfulCount += 1;
      }
    }

    if (
      routing
        .useReferenceResolution
    ) {
      requestedCount += 1;

      if (used.reference) {
        successfulCount += 1;
      }
    }

    if (routing.useMemory) {
      requestedCount += 1;

      if (used.memory) {
        successfulCount += 1;
      }
    }

    if (
      routing.useRelationship
    ) {
      requestedCount += 1;

      if (used.relationship) {
        successfulCount += 1;
      }
    }

    const completion =
      requestedCount
        ? successfulCount /
          requestedCount
        : 1;

    const criticalFailure =
      routing.useThread &&
      !used.thread;

    const packetReady =
      results.packet?.ready ===
        true ||
      results
        .continuityPacket
        ?.ready ===
        true;

    const ready =
      packetReady &&
      !criticalFailure;

    const warningPenalty =
      Math.min(
        0.3,
        warnings.length *
        0.05
      );

    const confidence =
      this.normalizeConfidence(
        completion -
        warningPenalty
      );

    return {
      ready,

      healthy:
        ready &&
        warnings.length ===
          0,

      completion,

      requestedEngineCount:
        requestedCount,

      successfulEngineCount:
        successfulCount,

      criticalFailure,

      packetReady,

      warningCount:
        warnings.length,

      confidence
    };
  },

  /* =====================================================
     EMPTY RESULT
  ===================================================== */

  emptyContinuityResults({
    reason = "not_needed",
    summary = {},
    laneSplit = {},
    routing = {}
  } = {}) {
    return {
      schema:
        "ari_continuity_results",

      schemaVersion:
        "1.0.0",

      engine:
        "ari-continuity-entry-point",

      version:
        this.version,

      source:
        "ari-continuity-entry-point",

      createdAt:
        new Date().toISOString(),

      ran:
        false,

      reason,

      lane:
        laneSplit.lane ||
        "direct_current_turn",

      currentTurn:
        this.buildCurrentTurn({
          summary,
          laneSplit
        }),

      routing: {
        useThread:
          false,

        useReferenceResolution:
          false,

        useMemory:
          false,

        useRelationship:
          false,

        goStraightToSituationMap:
          true,

        source:
          routing.source ||
          "direct_route"
      },

      executionOrder: [
        "packet"
      ],

      used: {
        thread:
          false,

        reference:
          false,

        entity:
          false,

        memory:
          false,

        relationship:
          false,

        packet:
          false
      },

      outputs: {
        thread:
          null,

        reference:
          null,

        entity:
          null,

        memory:
          null,

        relationship:
          null,

        packet:
          null
      },

      packet:
        null,

      continuityPacket:
        null,

      warnings: [],

      quality: {
        ready:
          true,

        healthy:
          true,

        completion:
          1,

        confidence:
          1
      },

      confidence:
        1,

      handoff: {
        nextEngine:
          "ari-continuity-packet",

        expectedMethod:
          "build",

        shouldBuildPacket:
          true,

        packetBuilt:
          false,

        packetReady:
          false
      },

      authority: {
        canOrchestrateContinuity:
          true,

        canChooseWhetherContinuityRuns:
          false,

        canChooseLane:
          false,

        canInterpretMeaning:
          false,

        canResolveReferences:
          false,

        canRewriteCurrentTurn:
          false,

        canAnswerUser:
          false,

        canOverrideSafety:
          false,

        role:
          "ordered_continuity_orchestration_only"
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  extractCurrentQuestion(
    summary = {}
  ) {
    return this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );
  },

  dedupeValues(
    values = []
  ) {
    const seen =
      new Set();

    return this.arrayFrom(values)
      .filter(value => {
        const key =
          this.normalize(
            this.extractValue(
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

  dedupeWarnings(
    warnings = []
  ) {
    const seen =
      new Set();

    return this.arrayFrom(warnings)
      .filter(warning => {
        const key =
          [
            warning.type ||
            "warning",

            warning.engine ||
            "none",

            warning.error ||
            warning.reason ||
            warning.message ||
            ""
          ]
            .map(value =>
              this.normalize(value)
            )
            .join("|");

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      });
  },

  extractValue(value) {
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
        value.claim ||
        value.value ||
        value.label ||
        value.text ||
        value.surface ||
        value.name ||
        value.evidence ||
        ""
      );
    }

    return String(value);
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
      !Number.isFinite(number)
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

  arrayFrom(value) {
    if (
      Array.isArray(value)
    ) {
      return value;
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

  clean(value = "") {
    return String(
      value ||
      ""
    )
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.clean(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONTINUITY ENTRY POINT LOADED:",
  window.Ari.continuityEntryPoint?.version
);