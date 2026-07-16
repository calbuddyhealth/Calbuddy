// ari/continuity/ari-conversation-operating-state.js
// Ari Conversation Operating State
//
// Purpose:
// Build, maintain, and persist one concise authoritative operating state for
// the current conversation turn.
//
// V1.0.0 — Conversation Operating State / Three-Horizon Continuity Context
//
// Architectural flow:
//
// Ari Thread Store
//      ↓
// Ari Conversation Operating State.beginTurn()
//      ↓
// Main Rebirth Pipeline
//      ↓
// Continuity Stage / Reference Resolvers
//      ↓
// Ari Conversation Operating State.completeTurn()
//      ↓
// Ari Thread Store
//
// Responsibilities:
// - Load and normalize stored conversation state.
// - Create one current-turn Conversation Operating State.
// - Preserve the original current-turn text.
// - Preserve immediate prior user and assistant turns.
// - Preserve the active conversation frame.
// - Build concise active claims, entities, constraints, goals, and open loops.
// - Rank prior context into reference candidates.
// - Expose immediate, active, and historical continuity horizons.
// - Preserve compatibility aliases for the existing pipeline.
// - Complete and persist the finished turn after Delivery.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not rewrite the current user turn.
// - Does not resolve elliptical follow-ups.
// - Does not bind entity references.
// - Does not choose the Conversation Function.
// - Does not choose the Situation Contract.
// - Does not determine safety severity.
// - Does not create a Response Plan.
// - Does not create response candidates.
// - Does not write the final response.
// - Does not retrieve long-term user memory.
// - Does not access Supabase.
// - Does not execute tools.
//
// Authority boundary:
// This file organizes and ranks conversation state. Continuity authorities
// remain responsible for resolving references and producing a resolved turn.

window.Ari = window.Ari || {};

window.AriConversationOperatingState = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-conversation-operating-state",
  authorityLevel: "conversation_operating_state_authority",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  async beginTurn(summary = {}) {
    const input =
      this.normalizeCurrentTurnInput(
        summary
      );

    const storedState =
      await this.loadStoredState();

    const normalizedStored =
      this.normalizeStoredState(
        storedState
      );

    const recentTurns =
      this.buildRecentTurns({
        summary,
        storedState:
          normalizedStored
      });

    const immediate =
      this.resolveImmediateHorizon(
        recentTurns
      );

    const activeFrame =
      this.buildActiveFrame({
        summary,
        storedState:
          normalizedStored,
        immediate
      });

    const activeHorizon =
      this.buildActiveHorizon({
        summary,
        storedState:
          normalizedStored,
        activeFrame
      });

    const historicalHorizon =
      this.buildHistoricalHorizon({
        summary,
        storedState:
          normalizedStored,
        recentTurns,
        activeFrame,
        activeHorizon,
        currentTurn:
          input.currentTurn
      });

    const continuityMode =
      this.resolveContinuityMode({
        currentTurn:
          input.currentTurn,
        immediate,
        activeFrame,
        historicalHorizon
      });

    const operatingState = {
      schema:
        "ari_conversation_operating_state",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      createdAt:
        new Date()
          .toISOString(),

      conversationId:
        normalizedStored
          .conversationId ||
        summary.conversationId ||
        this.createConversationId(),

      turnIndex:
        this.resolveTurnIndex({
          summary,
          storedState:
            normalizedStored,
          recentTurns
        }),

      currentTurn:
        input.currentTurn,

      immediateHorizon:
        immediate,

      activeHorizon,

      historicalHorizon,

      activeFrame,

      continuityMode,

      priorContextAvailable:
        recentTurns.length >
        0,

      referenceCandidates:
        historicalHorizon
          .referenceCandidates,

      openLoops:
        activeHorizon
          .openLoops,

      unresolvedItems:
        activeHorizon
          .unresolvedItems,

      confidence:
        this.calculateOperatingStateConfidence({
          currentTurn:
            input.currentTurn,
          immediate,
          activeFrame,
          recentTurns
        }),

      compactContext:
        this.buildCompactContext({
          currentTurn:
            input.currentTurn,
          immediate,
          activeFrame,
          activeHorizon,
          historicalHorizon
        }),

      rawStoredState:
        normalizedStored,

      authority:
        this.getAuthorityBoundaries()
    };

    return this.attachCompatibilityAliases({
      summary,
      operatingState,
      storedState:
        normalizedStored,
      recentTurns,
      immediate,
      activeFrame,
      activeHorizon
    });
  },

  build(summary = {}) {
    return this.beginTurn(
      summary
    );
  },

  async update(summary = {}) {
    const existing =
      summary
        .conversationOperatingState;

    if (
      !existing ||
      typeof existing !==
        "object"
    ) {
      return this.beginTurn(
        summary
      );
    }

    const activeFrame =
      this.buildActiveFrame({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        immediate:
          existing.immediateHorizon ||
          {}
      });

    const activeHorizon =
      this.buildActiveHorizon({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        activeFrame
      });

    const historicalHorizon =
      this.buildHistoricalHorizon({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        recentTurns:
          this.toArray(
            existing
              .immediateHorizon
              ?.recentTurns
          ),
        activeFrame,
        activeHorizon,
        currentTurn:
          existing.currentTurn ||
          this.normalizeCurrentTurnInput(
            summary
          ).currentTurn
      });

    const operatingState = {
      ...existing,

      updatedAt:
        new Date()
          .toISOString(),

      activeFrame,

      activeHorizon,

      historicalHorizon,

      referenceCandidates:
        historicalHorizon
          .referenceCandidates,

      openLoops:
        activeHorizon
          .openLoops,

      unresolvedItems:
        activeHorizon
          .unresolvedItems,

      compactContext:
        this.buildCompactContext({
          currentTurn:
            existing.currentTurn,
          immediate:
            existing.immediateHorizon,
          activeFrame,
          activeHorizon,
          historicalHorizon
        })
    };

    return this.attachCompatibilityAliases({
      summary,
      operatingState,
      storedState:
        existing.rawStoredState ||
        {},
      recentTurns:
        existing.immediateHorizon
          ?.recentTurns ||
        [],
      immediate:
        existing.immediateHorizon ||
        {},
      activeFrame,
      activeHorizon
    });
  },

  async completeTurn(summary = {}) {
    const existing =
      summary
        .conversationOperatingState ||
      (
        await this.beginTurn(
          summary
        )
      ).conversationOperatingState;

    const finalResponse =
      this.extractFinalResponse(
        summary
      );

    const now =
      new Date()
        .toISOString();

    const completedTurns =
      this.completeRecentTurns({
        existingTurns:
          existing
            .immediateHorizon
            ?.recentTurns ||
          existing
            .rawStoredState
            ?.recentTurns ||
          [],
        currentTurn:
          existing.currentTurn,
        finalResponse,
        summary,
        createdAt:
          now
      });

    const completedFrame =
      this.buildCompletedActiveFrame({
        summary,
        existing,
        finalResponse
      });

    const persistedState =
      this.buildPersistedState({
        summary,
        existing,
        recentTurns:
          completedTurns,
        activeFrame:
          completedFrame,
        finalResponse,
        createdAt:
          now
      });

    const saveResult =
      await this.saveStoredState(
        persistedState
      );

    const immediate =
      this.resolveImmediateHorizon(
        completedTurns
      );

    const operatingState = {
      ...existing,

      completedAt:
        now,

      completed:
        true,

      turnIndex:
        persistedState.turnIndex,

      immediateHorizon:
        immediate,

      activeFrame:
        completedFrame,

      activeHorizon: {
        ...existing.activeHorizon,

        topic:
          completedFrame.topic,

        subject:
          completedFrame.subject,

        issue:
          completedFrame.issue,

        goal:
          completedFrame.goal,

        claims:
          persistedState
            .activeClaims,

        entities:
          persistedState
            .activeEntities,

        events:
          persistedState
            .activeEvents,

        relations:
          persistedState
            .activeRelations,

        constraints:
          persistedState
            .activeConstraints,

        openLoops:
          persistedState
            .openLoops,

        unresolvedItems:
          persistedState
            .unresolvedItems
      },

      finalResponse,

      persistence: {
        attempted:
          true,

        saved:
          saveResult.saved ===
          true,

        source:
          saveResult.source,

        reason:
          saveResult.reason ||
          null,

        error:
          saveResult.error ||
          null
      },

      rawStoredState:
        persistedState,

      compactContext:
        this.buildCompactContext({
          currentTurn:
            existing.currentTurn,
          immediate,
          activeFrame:
            completedFrame,
          activeHorizon:
            existing.activeHorizon,
          historicalHorizon:
            existing.historicalHorizon
        })
    };

    return this.attachCompatibilityAliases({
      summary: {
        ...summary,

        threadSaveRan:
          saveResult.saved ===
          true,

        threadSaveSource:
          saveResult.source,

        threadSaveReason:
          saveResult.reason ||
          null,

        threadSaveError:
          saveResult.error ||
          null
      },
      operatingState,
      storedState:
        persistedState,
      recentTurns:
        completedTurns,
      immediate,
      activeFrame:
        completedFrame,
      activeHorizon:
        operatingState.activeHorizon
    });
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  normalizeCurrentTurnInput(
    summary = {}
  ) {
    const originalText =
      this.cleanText(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const turnId =
      summary.currentTurnId ||
      summary.turnId ||
      this.createTurnId();

    return {
      currentTurn: {
        schema:
          "ari_conversation_turn",

        schemaVersion:
          this.schemaVersion,

        id:
          turnId,

        role:
          "user",

        originalText,

        resolvedText:
          null,

        effectiveText:
          originalText,

        normalizedText:
          this.normalizeForComparison(
            originalText
          ),

        createdAt:
          new Date()
            .toISOString(),

        resolutionStatus:
          "unresolved",

        textWasRewritten:
          false,

        originalTextPreserved:
          true,

        authority:
          "current_turn_input_only"
      }
    };
  },

  resolveTurnIndex({
    summary = {},
    storedState = {},
    recentTurns = []
  } = {}) {
    const explicit =
      Number(
        summary.turnIndex
      );

    if (
      Number.isFinite(
        explicit
      )
    ) {
      return explicit;
    }

    const stored =
      Number(
        storedState.turnIndex
      );

    if (
      Number.isFinite(
        stored
      )
    ) {
      return stored + 1;
    }

    return recentTurns.filter(
      turn =>
        turn.role ===
          "user"
    ).length + 1;
  },

  /* =====================================================
     THREAD STORE
  ===================================================== */

  async loadStoredState() {
    const store =
      window.AriThreadStore;

    if (!store) {
      return null;
    }

    try {
      if (
        typeof store.load ===
        "function"
      ) {
        return await store.load();
      }

      if (
        typeof store.get ===
        "function"
      ) {
        return await store.get();
      }

      if (
        typeof store.read ===
        "function"
      ) {
        return await store.read();
      }
    } catch (error) {
      console.error(
        "Ari COS thread load failed:",
        error
      );
    }

    return null;
  },

  async saveStoredState(
    state = {}
  ) {
    const store =
      window.AriThreadStore;

    if (
      !store ||
      typeof store.save !==
        "function"
    ) {
      return {
        saved:
          false,

        source:
          "not-loaded",

        reason:
          "thread_store_not_available"
      };
    }

    try {
      await store.save(
        state
      );

      return {
        saved:
          true,

        source:
          "ari-thread-store"
      };
    } catch (error) {
      console.error(
        "Ari COS thread save failed:",
        error
      );

      return {
        saved:
          false,

        source:
          "save-error",

        reason:
          "thread_store_save_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  normalizeStoredState(
    state = null
  ) {
    const raw =
      state &&
      typeof state ===
        "object"
        ? state
        : {};

    return {
      ...raw,

      schema:
        raw.schema ||
        "ari_persisted_conversation_state",

      schemaVersion:
        raw.schemaVersion ||
        this.schemaVersion,

      conversationId:
        raw.conversationId ||
        null,

      turnIndex:
        this.numberOr(
          raw.turnIndex,
          0
        ),

      currentTopic:
        this.normalizeTopic(
          raw.currentTopic ||
          raw.activeTopic
        ),

      activeSubject:
        raw.activeSubject ||
        null,

      activeIssue:
        raw.activeIssue ||
        null,

      activeGoal:
        raw.activeGoal ||
        null,

      recentTurns:
        this.normalizeStoredRecentTurns(
          raw
        ),

      activeClaims:
        this.toArray(
          raw.activeClaims
        ),

      activeEntities:
        this.toArray(
          raw.activeEntities
        ),

      activeEvents:
        this.toArray(
          raw.activeEvents
        ),

      activeRelations:
        this.toArray(
          raw.activeRelations
        ),

      activeConstraints:
        this.toArray(
          raw.activeConstraints
        ),

      unresolvedItems:
        this.toArray(
          raw.unresolvedItems
        ),

      openLoops:
        this.toArray(
          raw.openLoops ||
          raw
            .conversationMeaningOpenLoops
        ),

      topicHistory:
        this.toArray(
          raw.topicHistory
        ),

      previousAnswerSummary:
        this.cleanText(
          raw.previousAnswerSummary ||
          ""
        ) ||
        null,

      lastFinalResponse:
        this.cleanText(
          raw.lastFinalResponse ||
          ""
        ) ||
        null,

      continuitySummary:
        raw.continuitySummary ||
        null,

      latestConversationMeaning:
        raw.latestConversationMeaning ||
        null,

      activeSemanticFrame:
        raw.activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        raw.conversationMeaningFocus ||
        null,

      conversationMeaningHistory:
        this.toArray(
          raw
            .conversationMeaningHistory
        ),

      activeSemanticTimeline:
        this.toArray(
          raw.activeSemanticTimeline
        ),

      lastMealEstimate:
        raw.lastMealEstimate ||
        null,

      lastUpdatedAt:
        raw.lastUpdatedAt ||
        null
    };
  },

  /* =====================================================
     RECENT TURNS
  ===================================================== */

  buildRecentTurns({
    summary = {},
    storedState = {}
  } = {}) {
    const appHistory =
      this.toArray(
        summary.appContext
          ?.history
      )
        .map(
          (
            turn,
            index
          ) =>
            this.normalizeTurnRecord(
              turn,
              index
            )
        )
        .filter(Boolean);

    const stored =
      this.toArray(
        storedState.recentTurns
      );

    return this.dedupeRecentTurns([
      ...stored,
      ...appHistory
    ]).slice(-12);
  },

  normalizeStoredRecentTurns(
    storedState = {}
  ) {
    const direct =
      this.toArray(
        storedState.recentTurns
      )
        .map(
          (
            turn,
            index
          ) =>
            this.normalizeTurnRecord(
              turn,
              index
            )
        )
        .filter(Boolean);

    if (direct.length) {
      return this
        .dedupeRecentTurns(
          direct
        )
        .slice(-12);
    }

    const legacy =
      this.toArray(
        storedState.lastMessages
      )
        .map(
          (
            message,
            index
          ) =>
            this.normalizeTurnRecord(
              typeof message ===
                "string"
                ? {
                    role:
                      "user",

                    text:
                      message
                  }
                : message,
              index
            )
        )
        .filter(Boolean);

    const previousAnswer =
      this.cleanText(
        storedState
          .lastFinalResponse ||
        storedState
          .previousAnswerSummary ||
        ""
      );

    if (previousAnswer) {
      legacy.push({
        id:
          null,

        role:
          "assistant",

        text:
          previousAnswer,

        createdAt:
          storedState
            .lastUpdatedAt ||
          null
      });
    }

    return this
      .dedupeRecentTurns(
        legacy
      )
      .slice(-12);
  },

  normalizeTurnRecord(
    turn = null,
    index = 0
  ) {
    if (
      turn === null ||
      turn === undefined
    ) {
      return null;
    }

    if (
      typeof turn ===
        "string"
    ) {
      const text =
        this.cleanText(
          turn
        );

      return text
        ? {
            id:
              null,

            role:
              "unknown",

            text,

            createdAt:
              null,

            index
          }
        : null;
    }

    const text =
      this.cleanText(
        turn.text ||
        turn.content ||
        turn.message ||
        turn.claim ||
        turn.value ||
        ""
      );

    if (!text) {
      return null;
    }

    return {
      id:
        turn.id ||
        turn.turnId ||
        turn.messageId ||
        null,

      role:
        this.normalizeTurnRole(
          turn.role
        ),

      text,

      createdAt:
        turn.createdAt ||
        turn.created_at ||
        turn.timestamp ||
        turn.updatedAt ||
        null,

      topic:
        this.normalizeTopic(
          turn.topic ||
          turn.activeTopic ||
          turn.situationFrame
        ),

      semanticMeaning:
        turn.semanticMeaning ||
        turn.meaning ||
        null,

      emotionalState:
        turn.emotionalState ||
        turn.emotion ||
        null,

      index
    };
  },

  normalizeTurnRole(
    role = ""
  ) {
    const value =
      String(
        role ||
        ""
      )
        .toLowerCase()
        .trim();

    if (
      [
        "assistant",
        "ari",
        "ai"
      ].includes(
        value
      )
    ) {
      return "assistant";
    }

    if (
      [
        "user",
        "human"
      ].includes(
        value
      )
    ) {
      return "user";
    }

    if (
      value ===
      "system"
    ) {
      return "system";
    }

    return "unknown";
  },

  dedupeRecentTurns(
    turns = []
  ) {
    const seen =
      new Set();

    return this.toArray(
      turns
    ).filter(
      turn => {
        if (
          !turn ||
          !turn.text
        ) {
          return false;
        }

        const key = [
          turn.role ||
          "unknown",

          this
            .normalizeForComparison(
              turn.text
            )
        ].join("|");

        if (
          !key ||
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
  },

  resolveImmediateHorizon(
    recentTurns = []
  ) {
    const turns =
      this.toArray(
        recentTurns
      );

    const previousUserTurn =
      [...turns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "user"
        ) ||
      null;

    const previousAssistantTurn =
      [...turns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "assistant"
        ) ||
      null;

    return {
      schema:
        "ari_conversation_immediate_horizon",

      previousUserTurn,

      previousAssistantTurn,

      previousExchange: {
        user:
          previousUserTurn,

        assistant:
          previousAssistantTurn
      },

      recentTurns:
        turns,

      available:
        Boolean(
          previousUserTurn ||
          previousAssistantTurn
        ),

      authority:
        "immediate_prior_turn_context_only"
    };
  },

  /* =====================================================
     ACTIVE FRAME
  ===================================================== */

  buildActiveFrame({
    summary = {},
    storedState = {},
    immediate = {}
  } = {}) {
    const semanticFrame =
      summary
        .activeSemanticFrame ||
      summary
        .currentSemanticStructure ||
      summary.semanticStructure ||
      storedState
        .activeSemanticFrame ||
      {};

    const topic =
      this.normalizeTopic(
        summary
          .resolvedPrimarySubject ||
        summary.activeTopic ||
        summary.activeSubject ||
        summary
          .continuityPacket
          ?.activeThread
          ?.activeTopic ||
        summary
          .situationMap
          ?.situations
          ?.[0] ||
        semanticFrame.topic ||
        storedState.currentTopic ||
        immediate
          .previousUserTurn
          ?.topic ||
        null
      );

    const subject =
      summary
        .resolvedPrimarySubject ||
      summary.activeSubject ||
      semanticFrame.subject ||
      storedState.activeSubject ||
      null;

    const issue =
      summary.activeIssue ||
      summary
        .continuityActiveSituation ||
      semanticFrame.issue ||
      storedState.activeIssue ||
      null;

    const goal =
      summary.activeGoal ||
      semanticFrame.goal ||
      storedState.activeGoal ||
      null;

    return {
      schema:
        "ari_conversation_active_frame",

      topic:
        topic ||
        this.deriveTopicFromText(
          immediate
            .previousUserTurn
            ?.text
        ) ||
        null,

      subject,

      issue,

      goal,

      currentNeed:
        summary.currentNeed ||
        summary
          .responseStrategy
          ?.currentNeed ||
        null,

      primaryLane:
        summary.primaryLane ||
        summary
          .routingContract
          ?.primaryLane ||
        null,

      contextLane:
        summary.contextLane ||
        summary
          .routingContract
          ?.contextLane ||
        null,

      conversationFunction:
        summary
          .conversationFunction ||
        null,

      semanticFrame:
        semanticFrame &&
        Object.keys(
          semanticFrame
        ).length
          ? semanticFrame
          : null,

      confidence:
        this.calculateFrameConfidence({
          topic,
          subject,
          issue,
          goal
        }),

      authority:
        "active_conversation_frame_organization_only"
    };
  },

  buildCompletedActiveFrame({
    summary = {},
    existing = {},
    finalResponse = ""
  } = {}) {
    const current =
      this.buildActiveFrame({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        immediate:
          existing.immediateHorizon ||
          {}
      });

    return {
      ...existing.activeFrame,
      ...current,

      lastFinalResponse:
        finalResponse ||
        existing.activeFrame
          ?.lastFinalResponse ||
        null,

      updatedAt:
        new Date()
          .toISOString()
    };
  },

  calculateFrameConfidence({
    topic = null,
    subject = null,
    issue = null,
    goal = null
  } = {}) {
    const available = [
      topic,
      subject,
      issue,
      goal
    ].filter(Boolean).length;

    return Math.min(
      0.55 +
      available *
        0.1,
      0.95
    );
  },

  /* =====================================================
     ACTIVE HORIZON
  ===================================================== */

  buildActiveHorizon({
    summary = {},
    storedState = {},
    activeFrame = {}
  } = {}) {
    return {
      schema:
        "ari_conversation_active_horizon",

      topic:
        activeFrame.topic,

      subject:
        activeFrame.subject,

      issue:
        activeFrame.issue,

      goal:
        activeFrame.goal,

      claims:
        this.mergeUnique(
          summary.semanticClaims,
          summary
            .currentSemanticStructure
            ?.claims,
          summary
            .semanticStructure
            ?.claims,
          storedState.activeClaims
        ).slice(-16),

      entities:
        this.mergeUnique(
          summary.semanticEntities,
          summary
            .currentSemanticStructure
            ?.entities,
          summary
            .semanticStructure
            ?.entities,
          storedState.activeEntities
        ).slice(-16),

      events:
        this.mergeUnique(
          summary.semanticEvents,
          summary
            .currentSemanticStructure
            ?.events,
          summary
            .semanticStructure
            ?.events,
          storedState.activeEvents
        ).slice(-12),

      relations:
        this.mergeUnique(
          summary.semanticRelations,
          summary
            .currentSemanticStructure
            ?.relations,
          summary
            .semanticStructure
            ?.relations,
          storedState.activeRelations
        ).slice(-16),

      constraints:
        this.mergeUnique(
          summary.activeConstraints,
          summary.semanticConstraints,
          storedState
            .activeConstraints
        ).slice(-12),

      openLoops:
        this.mergeUnique(
          summary
            .conversationMeaningOpenLoops,
          summary.openLoops,
          storedState.openLoops
        ).slice(-12),

      unresolvedItems:
        this.mergeUnique(
          summary
            .continuityPacket
            ?.unresolvedReferences,
          summary.semanticUnresolved,
          storedState.unresolvedItems
        ).slice(-12),

      latestConversationMeaning:
        summary
          .latestConversationMeaning ||
        storedState
          .latestConversationMeaning ||
        null,

      conversationMeaningFocus:
        summary
          .conversationMeaningFocus ||
        storedState
          .conversationMeaningFocus ||
        null,

      authority:
        "active_conversation_material_only"
    };
  },

  /* =====================================================
     HISTORICAL HORIZON
  ===================================================== */

  buildHistoricalHorizon({
    summary = {},
    storedState = {},
    recentTurns = [],
    activeFrame = {},
    activeHorizon = {},
    currentTurn = {}
  } = {}) {
    const candidates =
      this.buildReferenceCandidates({
        summary,
        storedState,
        recentTurns,
        activeFrame,
        activeHorizon,
        currentTurn
      });

    return {
      schema:
        "ari_conversation_historical_horizon",

      retrievalRequired:
        this.shouldRetrieveHistoricalContext({
          currentTurn,
          activeFrame,
          candidates
        }),

      referenceCandidates:
        candidates,

      topCandidates:
        candidates.slice(
          0,
          8
        ),

      topicHistory:
        this.toArray(
          storedState.topicHistory
        ).slice(-12),

      meaningHistory:
        this.toArray(
          storedState
            .conversationMeaningHistory
        ).slice(-12),

      semanticTimeline:
        this.toArray(
          storedState
            .activeSemanticTimeline
        ).slice(-12),

      authority:
        "ranked_prior_conversation_context_only"
    };
  },

  buildReferenceCandidates({
    summary = {},
    storedState = {},
    recentTurns = [],
    activeFrame = {},
    activeHorizon = {},
    currentTurn = {}
  } = {}) {
    const candidates = [];

    const add = ({
      id = null,
      semanticRef = null,
      semanticType = "claim",
      label = "",
      value = null,
      source = "conversation_state",
      turnDistance = 1,
      role = null,
      status = null,
      baseConfidence = 0.65
    } = {}) => {
      const resolvedLabel =
        this.cleanText(
          label ||
          this.extractLabel(
            value
          )
        );

      if (!resolvedLabel) {
        return;
      }

      const scores =
        this.scoreReferenceCandidate({
          label:
            resolvedLabel,
          value,
          semanticType,
          turnDistance,
          activeFrame,
          currentTurn,
          baseConfidence
        });

      candidates.push({
        id:
          id ||
          semanticRef ||
          null,

        semanticRef:
          semanticRef ||
          id ||
          null,

        semanticType,

        label:
          resolvedLabel,

        value,

        source,

        role,

        status,

        turnDistance,

        scores,

        salience:
          scores.salience,

        confidence:
          scores.confidence
      });
    };

    add({
      semanticRef:
        "active_topic",

      semanticType:
        "topic",

      value:
        activeFrame.topic,

      source:
        "conversation_operating_state.activeFrame.topic",

      baseConfidence:
        0.9
    });

    add({
      semanticRef:
        "active_subject",

      semanticType:
        "entity",

      value:
        activeFrame.subject,

      source:
        "conversation_operating_state.activeFrame.subject",

      baseConfidence:
        0.88
    });

    add({
      semanticRef:
        "active_issue",

      semanticType:
        "claim",

      value:
        activeFrame.issue,

      source:
        "conversation_operating_state.activeFrame.issue",

      baseConfidence:
        0.86
    });

    add({
      semanticRef:
        "active_goal",

      semanticType:
        "goal",

      value:
        activeFrame.goal,

      source:
        "conversation_operating_state.activeFrame.goal",

      baseConfidence:
        0.82
    });

    this.toArray(
      activeHorizon.entities
    ).forEach(
      (
        entity,
        index
      ) => {
        add({
          id:
            entity?.id ||
            `active_entity_${index}`,

          semanticRef:
            entity?.semanticRef ||
            entity?.entityRef ||
            entity?.id ||
            `active_entity_${index}`,

          semanticType:
            entity?.semanticType ||
            entity?.entityType ||
            entity?.type ||
            "entity",

          value:
            entity,

          source:
            "conversation_operating_state.activeHorizon.entities",

          status:
            entity?.status ||
            null,

          baseConfidence:
            entity?.confidence ??
            0.78
        });
      }
    );

    this.toArray(
      activeHorizon.claims
    ).forEach(
      (
        claim,
        index
      ) => {
        add({
          id:
            claim?.id ||
            `active_claim_${index}`,

          semanticRef:
            claim?.semanticRef ||
            claim?.id ||
            `active_claim_${index}`,

          semanticType:
            "claim",

          value:
            claim,

          source:
            "conversation_operating_state.activeHorizon.claims",

          status:
            claim?.status ||
            null,

          baseConfidence:
            claim?.confidence ??
            0.75
        });
      }
    );

    this.toArray(
      activeHorizon.openLoops
    ).forEach(
      (
        loop,
        index
      ) => {
        add({
          id:
            loop?.id ||
            `open_loop_${index}`,

          semanticRef:
            loop?.semanticRef ||
            loop?.id ||
            `open_loop_${index}`,

          semanticType:
            "open_loop",

          value:
            loop,

          source:
            "conversation_operating_state.activeHorizon.openLoops",

          status:
            loop?.status ||
            "active",

          baseConfidence:
            loop?.confidence ??
            0.82
        });
      }
    );

    this.toArray(
      recentTurns
    )
      .slice(-8)
      .forEach(
        (
          turn,
          index,
          collection
        ) => {
          const turnDistance =
            collection.length -
            index;

          add({
            id:
              turn.id ||
              `recent_turn_${index}`,

            semanticRef:
              turn.id ||
              `recent_turn_${index}`,

            semanticType:
              turn.role ===
                "assistant"
                ? "assistant_answer"
                : "user_turn",

            label:
              turn.text,

            value:
              turn,

            source:
              `conversation_operating_state.recentTurns.${turn.role}`,

            role:
              turn.role,

            turnDistance,

            baseConfidence:
              turn.role ===
                "user"
                ? 0.8
                : 0.72
          });
        }
      );

    this.toArray(
      storedState.topicHistory
    )
      .slice(-6)
      .forEach(
        (
          topic,
          index,
          collection
        ) => {
          add({
            id:
              `topic_history_${index}`,

            semanticRef:
              `topic_history_${index}`,

            semanticType:
              "historical_topic",

            value:
              topic,

            source:
              "conversation_operating_state.topicHistory",

            turnDistance:
              collection.length -
              index +
              2,

            baseConfidence:
              0.58
          });
        }
      );

    const seen =
      new Set();

    return candidates
      .filter(
        candidate => {
          const key = [
            candidate.semanticType,
            this
              .normalizeForComparison(
                candidate.label
              )
          ].join("|");

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return false;
          }

          seen.add(
            key
          );

          return true;
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          b.salience -
          a.salience
      )
      .slice(
        0,
        24
      );
  },

  scoreReferenceCandidate({
    label = "",
    value = null,
    semanticType = "claim",
    turnDistance = 1,
    activeFrame = {},
    currentTurn = {},
    baseConfidence = 0.65
  } = {}) {
    const currentText =
      this
        .normalizeForComparison(
          currentTurn.originalText ||
          currentTurn.effectiveText ||
          ""
        );

    const candidateText =
      this
        .normalizeForComparison(
          label ||
          this.extractLabel(
            value
          )
        );

    const activeText =
      this
        .normalizeForComparison([
          activeFrame.topic,
          activeFrame.subject,
          activeFrame.issue,
          activeFrame.goal
        ]
          .filter(Boolean)
          .join(" ")
        );

    const recency =
      Math.max(
        0.15,
        1 -
        (
          Math.max(
            1,
            turnDistance
          ) -
          1
        ) *
          0.11
      );

    const tokenOverlap =
      this.calculateTokenOverlap(
        currentText,
        candidateText
      );

    const activeFrameMatch =
      this.calculateTokenOverlap(
        activeText,
        candidateText
      );

    const grammaticalCompatibility =
      this.calculateGrammaticalCompatibility({
        currentText,
        semanticType
      });

    const typeWeight = {
      open_loop:
        0.95,

      assistant_answer:
        0.9,

      entity:
        0.88,

      topic:
        0.86,

      goal:
        0.8,

      claim:
        0.78,

      user_turn:
        0.75,

      historical_topic:
        0.55
    }[semanticType] ??
    0.65;

    const salience =
      recency *
        0.25 +
      activeFrameMatch *
        0.22 +
      tokenOverlap *
        0.18 +
      grammaticalCompatibility *
        0.15 +
      typeWeight *
        0.1 +
      this.clamp(
        baseConfidence
      ) *
        0.1;

    return {
      recency:
        this.roundScore(
          recency
        ),

      tokenOverlap:
        this.roundScore(
          tokenOverlap
        ),

      activeFrameMatch:
        this.roundScore(
          activeFrameMatch
        ),

      grammaticalCompatibility:
        this.roundScore(
          grammaticalCompatibility
        ),

      typeWeight:
        this.roundScore(
          typeWeight
        ),

      baseConfidence:
        this.roundScore(
          this.clamp(
            baseConfidence
          )
        ),

      salience:
        this.roundScore(
          this.clamp(
            salience
          )
        ),

      confidence:
        this.roundScore(
          this.clamp(
            baseConfidence *
              0.55 +
            salience *
              0.45
          )
        )
    };
  },

  calculateTokenOverlap(
    a = "",
    b = ""
  ) {
    const left =
      new Set(
        this.tokenize(
          a
        )
      );

    const right =
      new Set(
        this.tokenize(
          b
        )
      );

    if (
      !left.size ||
      !right.size
    ) {
      return 0;
    }

    let overlap = 0;

    left.forEach(
      token => {
        if (
          right.has(
            token
          )
        ) {
          overlap += 1;
        }
      }
    );

    return overlap /
      Math.max(
        left.size,
        right.size
      );
  },

  calculateGrammaticalCompatibility({
    currentText = "",
    semanticType = ""
  } = {}) {
    if (!currentText) {
      return 0.4;
    }

    const elliptical =
      /^(why|how|really|when|where|who|which|what about|and|but|so|then|because|okay|ok|yes|no)\b/i
        .test(
          currentText
        ) ||
      currentText.split(
        /\s+/
      ).length <=
        5;

    const pronounReference =
      /\b(it|that|this|they|them|he|she|him|her|those|these|one|ones|other|another)\b/i
        .test(
          currentText
        );

    if (
      semanticType ===
        "assistant_answer" &&
      elliptical
    ) {
      return 1;
    }

    if (
      semanticType ===
        "entity" &&
      pronounReference
    ) {
      return 1;
    }

    if (
      semanticType ===
        "open_loop" &&
      (
        elliptical ||
        pronounReference
      )
    ) {
      return 0.95;
    }

    if (
      semanticType ===
        "topic" &&
      elliptical
    ) {
      return 0.85;
    }

    return 0.45;
  },

  shouldRetrieveHistoricalContext({
    currentTurn = {},
    activeFrame = {},
    candidates = []
  } = {}) {
    const text =
      this.normalizeForComparison(
        currentTurn.originalText ||
        ""
      );

    const elliptical =
      text.split(
        /\s+/
      ).filter(Boolean).length <=
        5 ||
      /\b(it|that|this|they|them|he|she|him|her|other|another|before|earlier|previous)\b/i
        .test(
          text
        );

    const strongCandidate =
      candidates.some(
        candidate =>
          candidate.salience >=
          0.72
      );

    return Boolean(
      elliptical &&
      (
        strongCandidate ||
        activeFrame.topic
      )
    );
  },

  /* =====================================================
     CONTINUITY MODE
  ===================================================== */

  resolveContinuityMode({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    historicalHorizon = {}
  } = {}) {
    const text =
      this
        .normalizeForComparison(
          currentTurn.originalText ||
          ""
        );

    const wordCount =
      text
        .split(
          /\s+/
        )
        .filter(Boolean)
        .length;

    const explicitPriorReference =
      /\b(earlier|before|previous|last time|we discussed|you said|you mentioned|that|this|it|they|them|he|she|him|her|the other one|another one)\b/i
        .test(
          text
        );

    const elliptical =
      wordCount <=
        5 ||
      /^(why|how|really|what about|and|but|so|then|okay|ok|yes|no)\b/i
        .test(
          text
        );

    if (
      !immediate.available &&
      !activeFrame.topic
    ) {
      return "direct_current_turn";
    }

    if (
      explicitPriorReference &&
      historicalHorizon
        .topCandidates
        ?.length
    ) {
      return "reference_follow_up";
    }

    if (
      elliptical &&
      immediate.available
    ) {
      return "likely_follow_up";
    }

    if (
      activeFrame.topic
    ) {
      return "active_topic_continuation";
    }

    return "direct_current_turn";
  },

  /* =====================================================
     COMPACT CONTEXT
  ===================================================== */

  buildCompactContext({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    activeHorizon = {},
    historicalHorizon = {}
  } = {}) {
    return {
      currentTurn: {
        id:
          currentTurn.id ||
          null,

        originalText:
          currentTurn.originalText ||
          "",

        role:
          currentTurn.role ||
          "user"
      },

      previousTurn: {
        user:
          immediate
            .previousUserTurn
            ? {
                id:
                  immediate
                    .previousUserTurn
                    .id ||
                  null,

                text:
                  immediate
                    .previousUserTurn
                    .text
              }
            : null,

        assistant:
          immediate
            .previousAssistantTurn
            ? {
                id:
                  immediate
                    .previousAssistantTurn
                    .id ||
                  null,

                text:
                  immediate
                    .previousAssistantTurn
                    .text
              }
            : null
      },

      activeFrame: {
        topic:
          activeFrame.topic ||
          null,

        subject:
          activeFrame.subject ||
          null,

        issue:
          activeFrame.issue ||
          null,

        goal:
          activeFrame.goal ||
          null
      },

      openLoops:
        this.toArray(
          activeHorizon.openLoops
        ).slice(
          0,
          5
        ),

      unresolvedItems:
        this.toArray(
          activeHorizon
            .unresolvedItems
        ).slice(
          0,
          5
        ),

      activeEntities:
        this.toArray(
          activeHorizon.entities
        ).slice(
          0,
          8
        ),

      activeClaims:
        this.toArray(
          activeHorizon.claims
        ).slice(
          0,
          8
        ),

      referenceCandidates:
        this.toArray(
          historicalHorizon
            .topCandidates
        ).map(
          candidate => ({
            id:
              candidate.id,

            semanticRef:
              candidate.semanticRef,

            semanticType:
              candidate.semanticType,

            label:
              candidate.label,

            salience:
              candidate.salience,

            confidence:
              candidate.confidence,

            source:
              candidate.source
          })
        )
    };
  },

  /* =====================================================
     PERSISTENCE
  ===================================================== */

  completeRecentTurns({
    existingTurns = [],
    currentTurn = {},
    finalResponse = "",
    summary = {},
    createdAt = null
  } = {}) {
    const turns =
      this.toArray(
        existingTurns
      );

    const userText =
      this.cleanText(
        currentTurn.originalText ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const additions = [];

    if (userText) {
      additions.push({
        id:
          currentTurn.id ||
          null,

        role:
          "user",

        text:
          userText,

        createdAt:
          currentTurn.createdAt ||
          createdAt,

        topic:
          this.normalizeTopic(
            summary.activeTopic ||
            summary.activeSubject
          ),

        semanticMeaning:
          summary
            .latestConversationMeaning ||
          summary.semanticSummary ||
          null,

        emotionalState:
          summary.humanState
            ?.primaryState ||
          summary.humanState
            ?.state ||
          summary.emotion ||
          null
      });
    }

    if (finalResponse) {
      additions.push({
        id:
          null,

        role:
          "assistant",

        text:
          finalResponse,

        createdAt,

        topic:
          this.normalizeTopic(
            summary.activeTopic ||
            summary.activeSubject
          ),

        semanticMeaning:
          null,

        emotionalState:
          summary.emotion ||
          null
      });
    }

    return this
      .dedupeRecentTurns([
        ...turns,
        ...additions
      ])
      .slice(-12);
  },

  buildPersistedState({
    summary = {},
    existing = {},
    recentTurns = [],
    activeFrame = {},
    finalResponse = "",
    createdAt = null
  } = {}) {
    const previous =
      existing.rawStoredState ||
      {};

    const userTurns =
      recentTurns.filter(
        turn =>
          turn.role ===
          "user"
      );

    const assistantTurns =
      recentTurns.filter(
        turn =>
          turn.role ===
          "assistant"
      );

    const activeHorizon =
      existing.activeHorizon ||
      {};

    const topic =
      activeFrame.topic ||
      previous.currentTopic ||
      this.deriveTopicFromText(
        existing.currentTurn
          ?.originalText
      ) ||
      "general_thread";

    return {
      ...previous,

      schema:
        "ari_persisted_conversation_state",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      conversationId:
        existing.conversationId ||
        previous.conversationId ||
        this.createConversationId(),

      turnIndex:
        this.numberOr(
          existing.turnIndex,
          0
        ),

      currentTopic:
        topic,

      activeTopic:
        topic,

      activeSubject:
        activeFrame.subject ||
        previous.activeSubject ||
        null,

      activeIssue:
        activeFrame.issue ||
        previous.activeIssue ||
        null,

      activeGoal:
        activeFrame.goal ||
        previous.activeGoal ||
        null,

      recentTurns,

      lastMessages:
        userTurns
          .map(
            turn =>
              turn.text
          )
          .slice(-8),

      immediatePreviousUserTurn:
        userTurns.length
          ? userTurns[
              userTurns.length -
              1
            ]
          : null,

      immediatePreviousAssistantTurn:
        assistantTurns.length
          ? assistantTurns[
              assistantTurns.length -
              1
            ]
          : null,

      activeClaims:
        this.toArray(
          activeHorizon.claims
        ).slice(-16),

      activeEntities:
        this.toArray(
          activeHorizon.entities
        ).slice(-16),

      activeEvents:
        this.toArray(
          activeHorizon.events
        ).slice(-12),

      activeRelations:
        this.toArray(
          activeHorizon.relations
        ).slice(-16),

      activeConstraints:
        this.toArray(
          activeHorizon.constraints
        ).slice(-12),

      openLoops:
        this.toArray(
          activeHorizon.openLoops
        ).slice(-12),

      unresolvedItems:
        this.toArray(
          activeHorizon
            .unresolvedItems
        ).slice(-12),

      topicHistory:
        this.buildTopicHistory({
          previous:
            previous.topicHistory,
          currentTopic:
            topic,
          createdAt
        }),

      continuitySummary:
        existing.currentTurn
          ?.originalText &&
        finalResponse
          ? `User said: ${existing.currentTurn.originalText}. Ari answered: ${finalResponse.slice(0, 300)}`
          : previous
              .continuitySummary ||
            null,

      previousAnswerSummary:
        finalResponse
          ? finalResponse.slice(
              0,
              500
            )
          : previous
              .previousAnswerSummary ||
            null,

      lastFinalResponse:
        finalResponse ||
        previous.lastFinalResponse ||
        null,

      latestConversationMeaning:
        summary
          .latestConversationMeaning ||
        previous
          .latestConversationMeaning ||
        null,

      activeSemanticFrame:
        summary
          .activeSemanticFrame ||
        previous
          .activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        summary
          .conversationMeaningFocus ||
        previous
          .conversationMeaningFocus ||
        null,

      conversationMeaningHistory:
        summary
          .conversationMeaningHistory ||
        previous
          .conversationMeaningHistory ||
        [],

      activeSemanticTimeline:
        summary
          .activeSemanticTimeline ||
        previous
          .activeSemanticTimeline ||
        [],

      lastMealEstimate:
        summary.mealEstimate ||
        summary.lastMealEstimate ||
        previous.lastMealEstimate ||
        null,

      lastUpdatedAt:
        createdAt ||
        new Date()
          .toISOString()
    };
  },

  buildTopicHistory({
    previous = [],
    currentTopic = null,
    createdAt = null
  } = {}) {
    const history =
      this.toArray(
        previous
      )
        .map(
          item => {
            if (
              typeof item ===
              "string"
            ) {
              return {
                topic:
                  this.normalizeTopic(
                    item
                  ),

                createdAt:
                  null
              };
            }

            return {
              ...item,

              topic:
                this.normalizeTopic(
                  item?.topic ||
                  item?.label ||
                  item?.value ||
                  item
                )
            };
          }
        )
        .filter(
          item =>
            item.topic
        );

    const latest =
      history.length
        ? history[
            history.length -
            1
          ].topic
        : null;

    if (
      currentTopic &&
      this
        .normalizeForComparison(
          latest
        ) !==
      this
        .normalizeForComparison(
          currentTopic
        )
    ) {
      history.push({
        topic:
          currentTopic,

        createdAt:
          createdAt ||
          new Date()
            .toISOString()
      });
    }

    return history.slice(-12);
  },

  /* =====================================================
     COMPATIBILITY
  ===================================================== */

  attachCompatibilityAliases({
    summary = {},
    operatingState = {},
    storedState = {},
    recentTurns = [],
    immediate = {},
    activeFrame = {},
    activeHorizon = {}
  } = {}) {
    const threadContext = {
      schema:
        "ari_thread_context",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      ran:
        true,

      available:
        operatingState
          .priorContextAvailable ===
        true,

      currentTopic:
        activeFrame.topic ||
        null,

      activeTopic:
        activeFrame.topic ||
        null,

      activeSubject:
        activeFrame.subject ||
        null,

      activeIssue:
        activeFrame.issue ||
        null,

      activeGoal:
        activeFrame.goal ||
        null,

      previousAnswer:
        immediate
          .previousAssistantTurn
          ?.text ||
        storedState
          .previousAnswerSummary ||
        storedState
          .lastFinalResponse ||
        null,

      previousAnswerSummary:
        storedState
          .previousAnswerSummary ||
        null,

      lastFinalResponse:
        storedState
          .lastFinalResponse ||
        null,

      immediatePreviousUserTurn:
        immediate
          .previousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        immediate
          .previousAssistantTurn ||
        null,

      recentTurns,

      recentMessages:
        recentTurns,

      lastMessages:
        recentTurns
          .filter(
            turn =>
              turn.role ===
              "user"
          )
          .map(
            turn =>
              turn.text
          ),

      continuitySummary:
        storedState
          .continuitySummary ||
        null,

      workingContext: {
        summary:
          storedState
            .continuitySummary ||
          null,

        activeTopic:
          activeFrame.topic ||
          null,

        activeSubject:
          activeFrame.subject ||
          null,

        activeIssue:
          activeFrame.issue ||
          null,

        activeGoal:
          activeFrame.goal ||
          null,

        immediatePreviousUserTurn:
          immediate
            .previousUserTurn ||
          null,

        immediatePreviousAssistantTurn:
          immediate
            .previousAssistantTurn ||
          null,

        recentTurns,

        keyFacts:
          activeHorizon.claims ||
          [],

        openLoops:
          activeHorizon
            .openLoops ||
          [],

        constraints:
          activeHorizon
            .constraints ||
          [],

        unresolvedItems:
          activeHorizon
            .unresolvedItems ||
          [],

        authority:
          "conversation_operating_state_compatibility_alias"
      },

      activeClaims:
        activeHorizon.claims ||
        [],

      activeEntities:
        activeHorizon.entities ||
        [],

      activeEvents:
        activeHorizon.events ||
        [],

      activeRelations:
        activeHorizon.relations ||
        [],

      activeConstraints:
        activeHorizon
          .constraints ||
        [],

      unresolvedItems:
        activeHorizon
          .unresolvedItems ||
        [],

      openLoops:
        activeHorizon
          .openLoops ||
        [],

      topicHistory:
        storedState
          .topicHistory ||
        [],

      conversationMeaningHistory:
        storedState
          .conversationMeaningHistory ||
        [],

      latestConversationMeaning:
        activeHorizon
          .latestConversationMeaning ||
        null,

      activeSemanticTimeline:
        storedState
          .activeSemanticTimeline ||
        [],

      activeSemanticFrame:
        activeFrame.semanticFrame ||
        storedState
          .activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        activeHorizon
          .conversationMeaningFocus ||
        null,

      conversationMeaningOpenLoops:
        activeHorizon
          .openLoops ||
        [],

      referenceCandidates:
        operatingState
          .referenceCandidates ||
        [],

      confidence:
        operatingState.confidence ||
        0,

      authority: {
        canProvideStoredThreadContext:
          true,

        canPreserveRecentTurns:
          true,

        canChooseCurrentMeaning:
          false,

        canChooseRequestedOperation:
          false,

        canResolveReferences:
          false,

        canChooseRoute:
          false,

        canAnswerUser:
          false,

        role:
          "conversation_operating_state_compatibility_projection"
      }
    };

    return {
      ...summary,

      conversationOperatingState:
        operatingState,

      conversationOperatingStateReady:
        true,

      conversationOperatingStateRan:
        true,

      conversationOperatingStateSource:
        this.source,

      conversationOperatingStateVersion:
        this.version,

      threadStateLoaded:
        Boolean(
          storedState &&
          Object.keys(
            storedState
          ).length
        ),

      threadState:
        storedState,

      threadContext,

      currentThreadContext:
        threadContext,

      recentTurns,

      recentMessages:
        recentTurns,

      immediatePreviousUserTurn:
        immediate
          .previousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        immediate
          .previousAssistantTurn ||
        null,

      workingContext:
        threadContext
          .workingContext,

      activeTopic:
        activeFrame.topic ||
        summary.activeTopic ||
        null,

      activeSubject:
        activeFrame.subject ||
        summary.activeSubject ||
        null,

      activeIssue:
        activeFrame.issue ||
        summary.activeIssue ||
        null,

      activeGoal:
        activeFrame.goal ||
        summary.activeGoal ||
        null,

      previousAnswerSummary:
        threadContext
          .previousAnswerSummary ||
        null,

      conversationMeaningHistory:
        threadContext
          .conversationMeaningHistory,

      latestConversationMeaning:
        threadContext
          .latestConversationMeaning,

      activeSemanticTimeline:
        threadContext
          .activeSemanticTimeline,

      activeSemanticFrame:
        threadContext
          .activeSemanticFrame,

      conversationMeaningFocus:
        threadContext
          .conversationMeaningFocus,

      conversationMeaningOpenLoops:
        threadContext
          .conversationMeaningOpenLoops,

      priorMeaningForFollowUp:
        threadContext
          .latestConversationMeaning ||
        null,

      referenceCandidates:
        operatingState
          .referenceCandidates ||
        summary.referenceCandidates ||
        []
    };
  },

  /* =====================================================
     FINAL RESPONSE
  ===================================================== */

  extractFinalResponse(
    summary = {}
  ) {
    const candidate =
      summary.finalResponse ||
      summary.selectedDraft
        ?.text ||
      summary.selectedDraft ||
      summary.aiWriterDraft ||
      summary.blueprintWriterDraft ||
      summary.response ||
      "";

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      return this.cleanText(
        candidate.text ||
        candidate.reply ||
        candidate.response ||
        candidate.content ||
        candidate.answer ||
        candidate.draft ||
        ""
      );
    }

    return this.cleanText(
      candidate
    );
  },

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  calculateOperatingStateConfidence({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    recentTurns = []
  } = {}) {
    let score =
      currentTurn.originalText
        ? 0.5
        : 0.2;

    if (
      immediate.available
    ) {
      score +=
        0.15;
    }

    if (
      activeFrame.topic
    ) {
      score +=
        0.12;
    }

    if (
      activeFrame.subject
    ) {
      score +=
        0.08;
    }

    if (
      recentTurns.length >=
      2
    ) {
      score +=
        0.08;
    }

    return this.roundScore(
      this.clamp(
        score
      )
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canLoadThreadState:
        true,

      canNormalizeStoredTurns:
        true,

      canBuildImmediateHorizon:
        true,

      canBuildActiveHorizon:
        true,

      canBuildHistoricalHorizon:
        true,

      canRankReferenceCandidates:
        true,

      canPreserveCompatibilityAliases:
        true,

      canPersistCompletedTurn:
        true,

      canRewriteCurrentTurn:
        false,

      canResolveEllipticalFollowUp:
        false,

      canBindEntityReference:
        false,

      canInterpretSemanticMeaning:
        false,

      canClassifyConversation:
        false,

      canChooseConversationFunction:
        false,

      canChooseSituationContract:
        false,

      canDetermineSafetySeverity:
        false,

      canChooseRoute:
        false,

      canCreateResponsePlan:
        false,

      canRegisterResponseCandidate:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canExecuteTools:
        false,

      role:
        "conversation_state_organization_ranking_and_persistence"
    };
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canRewriteCurrentTurn",
      "canResolveEllipticalFollowUp",
      "canBindEntityReference",
      "canInterpretSemanticMeaning",
      "canClassifyConversation",
      "canChooseConversationFunction",
      "canChooseSituationContract",
      "canDetermineSafetySeverity",
      "canChooseRoute",
      "canCreateResponsePlan",
      "canRegisterResponseCandidate",
      "canSelectFinalDraft",
      "canWriteFinalResponse",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canExecuteTools"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const warnings = [];

    if (
      !window.AriThreadStore
    ) {
      warnings.push(
        "AriThreadStore_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-conversation-operating-state-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        threeHorizonModel:
          true,

        originalTurnPreserved:
          true,

        referenceResolutionSeparated:
          authority
            .canResolveEllipticalFollowUp ===
          false,

        semanticInterpretationSeparated:
          authority
            .canInterpretSemanticMeaning ===
          false,

        routeAuthorityDisabled:
          authority
            .canChooseRoute ===
          false,

        responsePlanAuthorityDisabled:
          authority
            .canCreateResponsePlan ===
          false,

        finalResponseAuthorityDisabled:
          authority
            .canWriteFinalResponse ===
          false,

        supabaseDisabled:
          authority
            .canAccessSupabase ===
          false
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  createConversationId() {
    return [
      "conversation",
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(2, 8)
    ].join("_");
  },

  createTurnId() {
    return [
      "turn",
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(2, 8)
    ].join("_");
  },

  deriveTopicFromText(
    text = ""
  ) {
    const clean =
      this.cleanText(
        text
      );

    if (!clean) {
      return null;
    }

    return clean.length >
      140
      ? `${clean.slice(
          0,
          137
        )}...`
      : clean;
  },

  normalizeTopic(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return this.cleanText(
        value
      ) || null;
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.normalizeTopic(
        value.topic ||
        value.activeTopic ||
        value.label ||
        value.name ||
        value.title ||
        value.claim ||
        value.proposition ||
        value.summary ||
        value.description ||
        value.value ||
        value.text ||
        value.situation ||
        value.type ||
        null
      );
    }

    return null;
  },

  extractLabel(
    value = null
  ) {
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
      return this.cleanText(
        value
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.cleanText(
        value.label ||
        value.name ||
        value.title ||
        value.claim ||
        value.proposition ||
        value.value ||
        value.text ||
        value.surface ||
        value.description ||
        value.topic ||
        value.id ||
        ""
      );
    }

    return this.cleanText(
      String(
        value
      )
    );
  },

  tokenize(
    value = ""
  ) {
    const stopWords =
      new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "to",
        "of",
        "in",
        "on",
        "for",
        "with",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "i",
        "you",
        "it",
        "that",
        "this"
      ]);

    return this
      .normalizeForComparison(
        value
      )
      .split(
        /\s+/
      )
      .filter(
        token =>
          token.length >=
            3 &&
          !stopWords.has(
            token
          )
      );
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  clamp(
    value,
    min = 0,
    max = 1
  ) {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return min;
    }

    return Math.max(
      min,
      Math.min(
        max,
        number
      )
    );
  },

  roundScore(
    value
  ) {
    return Math.round(
      this.clamp(
        value
      ) *
      1000
    ) /
    1000;
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
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

    return [
      value
    ];
  },

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(
        value =>
          this.toArray(
            value
          )
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.semanticRef ||
                    value?.name ||
                    value?.label ||
                    value?.type ||
                    value?.value ||
                    value?.claim ||
                    this.safeJSONStringify(
                      value
                    )
                  );

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return;
          }

          seen.add(
            key
          );

          output.push(
            value
          );
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (error) {
      return "";
    }
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  normalizeForComparison(
    value = ""
  ) {
    return this
      .cleanText(
        value
      )
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s']/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

window.Ari.conversationOperatingState =
  window.AriConversationOperatingState;

console.log(
  "ARI CONVERSATION OPERATING STATE LOADED:",
  window
    .AriConversationOperatingState
    ?.version,
  window
    .AriConversationOperatingState
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);
