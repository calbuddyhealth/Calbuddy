// ari/continuity/ari-conversation-continuity-engine.js
// Ari Conversation Continuity Engine
//
// Purpose:
// Produce canonical, branch-aware, reference-aware thread context for the
// current conversation turn.
//
// V4.0.0 — Canonical Continuity Evidence / Reliable Thread State /
// Context-Dependency Preservation
//
// Architectural responsibilities:
// - Load the best available prior thread state.
// - Preserve recent user and assistant turns.
// - Detect current-turn continuity evidence.
// - Distinguish follow-up detection from context availability.
// - Detect contextual references without resolving them.
// - Maintain stable thread and branch identity.
// - Rank structured reference candidates.
// - Suppress stale or branch-incompatible context.
// - Produce canonical thread context for downstream reference resolution.
// - Persist provisional continuity state for the current turn.
//
// Non-responsibilities:
// - Does not determine the user's canonical semantic meaning.
// - Does not resolve references to final targets.
// - Does not interpret the requested operation.
// - Does not choose intent, conversation function, planner, or response shape.
// - Does not create a semantic frame.
// - Does not answer the user.
// - Does not commit authoritative assistant delivery state.

window.Ari = window.Ari || {};

window.AriConversationContinuityEngine = {
  version: "4.0.0",
  schemaVersion: "2.0.0",

  maxPriorTurns: 20,
  maxRecentTurns: 12,
  maxReferenceCandidates: 40,
  maxStaleContextItems: 20,
  maxUnresolvedItems: 12,

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async analyze(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const currentTurn =
      this.buildCurrentTurn(summary);

    const storedThread =
      await this.loadStoredThread(summary);

    const priorState =
      this.readPriorState({
        summary,
        storedThread
      });

    const previousTurns =
      this.collectPriorTurns({
        summary,
        priorState,
        storedThread,
        currentTurn
      });

    const immediateContext =
      this.resolveImmediateContext(
        previousTurns
      );

    const continuitySignals =
      this.detectContinuitySignals({
        currentTurn,
        immediateContext,
        previousTurns,
        priorState
      });

    const branch =
      this.resolveBranch({
        priorState,
        continuitySignals
      });

    const recentTurns =
      this.buildRecentTurns({
        previousTurns,
        currentTurn,
        continuitySignals,
        branch
      });

    const activeContext =
      this.resolveActiveContext({
        priorState,
        immediateContext,
        recentTurns,
        continuitySignals,
        branch
      });

    const collections =
      this.collectRecentSemanticItems({
        priorState,
        immediateContext,
        recentTurns,
        branch
      });

    const referenceCandidates =
      this.buildReferenceCandidates({
        immediateContext,
        activeContext,
        collections,
        branch
      });

    const staleContext =
      this.identifyStaleContext({
        referenceCandidates,
        recentTurns,
        activeContext,
        branch
      });

    const unresolvedThreadItems =
      this.collectUnresolvedThreadItems({
        priorState,
        branch,
        continuitySignals
      });

    const threadContext =
      this.buildThreadContext({
        priorState,
        currentTurn,
        immediateContext,
        recentTurns,
        activeContext,
        collections,
        referenceCandidates,
        continuitySignals,
        staleContext,
        unresolvedThreadItems,
        branch
      });

    const persistedState =
      this.buildPersistedState({
        priorState,
        threadContext
      });

    window.Ari.threadContext =
      threadContext;

    window.Ari.conversationState =
      persistedState;

    await this.saveStoredThread(
      summary,
      persistedState
    );

    return this.buildReturnPayload({
      threadContext,
      persistedState
    });
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  buildCurrentTurn(summary = {}) {
    const rawText =
      this.clean(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
      );

    const normalizedText =
      this.normalize(rawText);

    return {
      turnId:
        summary.currentTurnId ||
        summary.turnId ||
        this.createId("turn"),

      speaker:
        "user",

      rawText,

      normalizedText,

      createdAt:
        summary.currentTurnCreatedAt ||
        summary.createdAt ||
        new Date().toISOString(),

      wordCount:
        normalizedText
          .split(/\s+/)
          .filter(Boolean)
          .length,

      authority:
        "current_turn_record_only"
    };
  },

  /* =====================================================
     STORAGE
  ===================================================== */

  async loadStoredThread(summary = {}) {
    const store =
      window.AriThreadStore;

    if (
      !store ||
      typeof store.load !== "function"
    ) {
      return {
        available:
          false,

        reason:
          "thread_store_not_available"
      };
    }

    try {
      const loaded =
        await store.load(summary);

      if (
        loaded &&
        typeof loaded === "object"
      ) {
        return loaded;
      }

      return {
        available:
          false,

        reason:
          "thread_store_returned_no_state"
      };
    } catch (error) {
      console.warn(
        "ARI THREAD CONTEXT LOAD FAILED:",
        error
      );

      return {
        available:
          false,

        loadError:
          error?.message ||
          String(error)
      };
    }
  },

  async saveStoredThread(
    summary = {},
    state = {}
  ) {
    const store =
      window.AriThreadStore;

    if (
      !store ||
      typeof store.save !== "function"
    ) {
      return {
        saved:
          false,

        reason:
          "thread_store_not_available"
      };
    }

    try {
      await store.save(
        state,
        summary
      );

      return {
        saved:
          true,

        reason:
          "provisional_continuity_state_saved"
      };
    } catch (error) {
      console.warn(
        "ARI THREAD CONTEXT SAVE FAILED:",
        error
      );

      return {
        saved:
          false,

        reason:
          "thread_store_save_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /* =====================================================
     PRIOR STATE
  ===================================================== */

  readPriorState({
    summary = {},
    storedThread = {}
  } = {}) {
    const candidates = [
      {
        source:
          "summary.threadContext",

        value:
          summary.threadContext
      },

      {
        source:
          "summary.conversationState",

        value:
          summary.conversationState
      },

      {
        source:
          "summary.threadState",

        value:
          summary.threadState
      },

      {
        source:
          "storedThread.threadContext",

        value:
          storedThread.threadContext
      },

      {
        source:
          "storedThread.threadState",

        value:
          storedThread.threadState
      },

      {
        source:
          "storedThread.conversationState",

        value:
          storedThread.conversationState
      },

      {
        source:
          "storedThread",

        value:
          storedThread
      },

      {
        source:
          "window.Ari.threadContext",

        value:
          window.Ari.threadContext
      },

      {
        source:
          "window.Ari.conversationState",

        value:
          window.Ari.conversationState
      }
    ];

    const selected =
      candidates.find(candidate =>
        this.hasUsableThreadState(
          candidate.value
        )
      ) ||
      {
        source:
          "not_available",

        value:
          {}
      };

    const found =
      selected.value ||
      {};

    const storedRoot =
      storedThread &&
      typeof storedThread === "object"
        ? storedThread
        : {};

    const thread =
      this.firstObject([
        found.thread,
        storedRoot.thread
      ]);

    return {
      schema:
        found.schema ||
        storedRoot.schema ||
        "ari_thread_state",

      schemaVersion:
        found.schemaVersion ||
        found.version ||
        storedRoot.schemaVersion ||
        storedRoot.version ||
        null,

      source:
        found.source ||
        storedRoot.source ||
        selected.source,

      selectedStateSource:
        selected.source,

      threadId:
        thread.threadId ||
        found.threadId ||
        storedRoot.threadId ||
        summary.threadId ||
        null,

      branchId:
        thread.branchId ||
        found.branchId ||
        storedRoot.branchId ||
        null,

      thread,

      currentTurn:
        this.firstObject([
          found.currentTurn,
          storedRoot.currentTurn
        ]),

      lastMessages:
  this.firstPopulatedArray([
    found.lastMessages,
    found.recentTurns,
    storedRoot.lastMessages,
    storedRoot.recentTurns,
    summary.lastMessages,
    summary.recentTurns
  ]),

recentTurns:
  this.firstPopulatedArray([
    found.recentTurns,
    found.lastMessages,
    storedRoot.recentTurns,
    storedRoot.lastMessages,
    summary.recentTurns,
    summary.lastMessages
  ]),

      activeTopic:
        this.normalizeContextNode(
          this.firstDefined([
            found.activeTopic,
            found.currentTopic,
            storedRoot.activeTopic,
            storedRoot.currentTopic
          ])
        ),

      activeSubject:
        this.normalizeContextNode(
          this.firstDefined([
            found.activeSubject,
            storedRoot.activeSubject
          ])
        ),

      unresolvedThreadItems:
        this.asArray(
          this.firstDefined([
            found.unresolvedThreadItems,
            found.unresolvedItems,
            storedRoot.unresolvedThreadItems,
            storedRoot.unresolvedItems
          ])
        ),

      referenceCandidates:
        this.asArray(
          this.firstDefined([
            found.referenceCandidates,
            storedRoot.referenceCandidates
          ])
        ),

      staleContext:
        this.asArray(
          this.firstDefined([
            found.staleContext,
            storedRoot.staleContext
          ])
        ),

      continuitySignals:
        this.firstObject([
          found.continuitySignals,
          storedRoot.continuitySignals
        ]),

      previousTopic:
        this.normalizeContextNode(
          this.firstDefined([
            found.previousTopic,
            storedRoot.previousTopic
          ])
        ),

      provisional:
        found.provisional ===
          true ||
        storedRoot.provisional ===
          true,

      deliveryCommitted:
        found.deliveryCommitted ===
          true ||
        storedRoot.deliveryCommitted ===
          true,

      available:
        this.hasUsableThreadState(
          found
        )
    };
  },

  hasUsableThreadState(
    candidate = null
  ) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      return false;
    }

    const thread =
      this.firstObject([
        candidate.thread
      ]);

    const currentTurn =
      this.firstObject([
        candidate.currentTurn
      ]);

    return Boolean(
      candidate.threadId ||
      candidate.branchId ||
      thread.threadId ||
      thread.branchId ||
      this.clean(
        currentTurn.rawText ||
        currentTurn.text ||
        currentTurn.normalizedText ||
        ""
      ) ||
      this.asArray(
        candidate.lastMessages
      ).length ||
      this.asArray(
        candidate.recentTurns
      ).length ||
      candidate.activeTopic ||
      candidate.currentTopic ||
      candidate.activeSubject ||
      this.asArray(
        candidate.referenceCandidates
      ).length ||
      this.asArray(
        candidate.unresolvedThreadItems ||
        candidate.unresolvedItems
      ).length
    );
  },

  /* =====================================================
     PRIOR TURN COLLECTION
  ===================================================== */

  collectPriorTurns({
    summary = {},
    priorState = {},
    storedThread = {},
    currentTurn = {}
  } = {}) {
    const sources = [
      priorState.lastMessages,
      priorState.recentTurns,

      summary.recentTurns,
      summary.recentMessages,
      summary.lastMessages,

      summary.threadState
        ?.lastMessages,

      summary.continuityState
        ?.lastMessages,

      summary
        .conversationHistoryTurns,

      storedThread.lastMessages,
      storedThread.recentTurns
    ];

    const turns = [];

    sources.forEach(source => {
      this.readMessageArray(source)
        .forEach(item => {
          const turn =
            this.normalizeTurn(item);

          if (!turn.text) {
            return;
          }

          const duplicateOfCurrentTurn =
            currentTurn.rawText &&
            turn.speaker === "user" &&
            this.normalize(turn.text) ===
              currentTurn.normalizedText;

          if (
            duplicateOfCurrentTurn
          ) {
            return;
          }

          turns.push(turn);
        });
    });

    return this.dedupeTurns(turns)
      .sort(
        (
          first,
          second
        ) =>
          this.compareTurnOrder(
            first,
            second
          )
      )
      .slice(
        -this.maxPriorTurns
      );
  },

  normalizeTurn(value = {}) {
    if (
      typeof value === "string"
    ) {
      const text =
        this.clean(value);

      return {
        turnId:
          this.createStableTurnId(
            text,
            "unknown"
          ),

        threadId:
          null,

        branchId:
          null,

        speaker:
          "unknown",

        text,

        createdAt:
          null,

        entities: [],
        events: [],
        claims: [],
        quantities: [],
        references: [],
        options: [],
        topicRefs: [],

        meaningRef:
          null,

        frameRef:
          null,

        answerFocus:
          null,

        artifacts: []
      };
    }

    const text =
      this.clean(
        value.text ||
        value.content ||
        value.claim ||
        value.message ||
        value.rawText ||
        ""
      );

    const speaker =
      this.normalizeSpeaker(
        value.role ||
        value.speaker ||
        value.author ||
        "unknown"
      );

    return {
      turnId:
        value.turnId ||
        value.id ||
        this.createStableTurnId(
          text,
          speaker
        ),

      threadId:
        value.threadId ||
        value.thread?.threadId ||
        null,

      branchId:
        value.branchId ||
        value.threadBranchId ||
        value.thread?.branchId ||
        null,

      speaker,

      text,

      createdAt:
        value.createdAt ||
        value.timestamp ||
        value.date ||
        null,

      entities:
        this.readStructuredItems(
          value.entities ||
          value.semanticFrame
            ?.entities ||
          value.canonicalMeaning
            ?.entities
        ),

      events:
        this.readStructuredItems(
          value.events ||
          value.semanticFrame
            ?.events ||
          value.canonicalMeaning
            ?.events
        ),

      claims:
        this.readStructuredItems(
          value.claims ||
          value.semanticFrame
            ?.claims ||
          value.canonicalMeaning
            ?.claims
        ),

      quantities:
        this.readStructuredItems(
          value.quantities ||
          value.semanticFrame
            ?.quantities ||
          value.canonicalMeaning
            ?.quantities
        ),

      references:
        this.readStructuredItems(
          value.references ||
          value.referenceResolution
            ?.references
        ),

      options:
        this.readStructuredItems(
          value.options ||
          value.semanticFrame
            ?.options ||
          value.canonicalMeaning
            ?.options
        ),

      topicRefs:
        this.readStructuredItems(
          value.topicRefs ||
          value.topics
        ),

      meaningRef:
        value.meaningRef ||
        value.canonicalMeaningRef ||
        value.canonicalMeaning
          ?.id ||
        null,

      frameRef:
        value.frameRef ||
        value.semanticFrameRef ||
        value.semanticFrame
          ?.frameId ||
        null,

      answerFocus:
        value.answerFocus ||
        value.semanticFrame
          ?.requestedOutput ||
        value.canonicalMeaning
          ?.requestedOutput ||
        null,

      artifacts:
        this.readStructuredItems(
          value.artifacts ||
          value.generatedArtifacts ||
          value.attachments
        )
    };
  },

  resolveImmediateContext(
    previousTurns = []
  ) {
    const ordered =
      [...previousTurns];

    return {
      immediatePreviousTurn:
        ordered.at(-1) ||
        null,

      immediatePreviousUserTurn:
        [...ordered]
          .reverse()
          .find(turn =>
            turn.speaker === "user"
          ) ||
        null,

      immediatePreviousAssistantTurn:
        [...ordered]
          .reverse()
          .find(turn =>
            turn.speaker ===
            "assistant"
          ) ||
        null
    };
  },

  /* =====================================================
     CONTINUITY SIGNALS
  ===================================================== */

  detectContinuitySignals({
    currentTurn = {},
    immediateContext = {},
    previousTurns = [],
    priorState = {}
  } = {}) {
    const text =
      currentTurn.normalizedText ||
      "";

    const wordCount =
      currentTurn.wordCount ||
      0;

    const explicitReset =
      this.hasExplicitReset(text);

    const correctionPresent =
      this.hasCorrectionSignal(text);

    const continuationCue =
      this.hasContinuationCue(text);

    const bareFollowUp =
      this.isBareFollowUp(text);

    const questionForm =
      this.hasQuestionForm(text);

    const shortContextualTurn =
      wordCount > 0 &&
      wordCount <= 10;

    const shortQuestionFollowUp =
      shortContextualTurn &&
      questionForm;

    const referenceExpressions =
      this.extractReferenceExpressions(
        text
      );

    const referenceExpressionPresent =
      referenceExpressions.length > 0;

    const contextDependentReferences =
      referenceExpressions.filter(
        reference =>
          reference.contextDependent ===
          true
      );

    const contextDependentReferencePresent =
      contextDependentReferences.length >
      0;

    const priorContextAvailable =
      previousTurns.length > 0 ||
      Boolean(
        immediateContext
          .immediatePreviousTurn
      ) ||
      Boolean(
        priorState.activeTopic ||
        priorState.activeSubject
      ) ||
      this.asArray(
        priorState.referenceCandidates
      ).length > 0;

    const concreteNewSubjectPresent =
      this.hasConcreteNewSubjectSignal(
        text
      );

    const linguisticFollowUpSignal =
      contextDependentReferencePresent ||
      continuationCue ||
      correctionPresent ||
      bareFollowUp ||
      shortQuestionFollowUp;

    const likelyFollowUp =
      !explicitReset &&
      linguisticFollowUpSignal;

    const contextRequired =
      !explicitReset &&
      (
        contextDependentReferencePresent ||
        continuationCue ||
        bareFollowUp ||
        correctionPresent
      );

    const contextRequiredButUnavailable =
      contextRequired &&
      !priorContextAvailable;

    const likelyTopicShift =
      explicitReset ||
      (
        concreteNewSubjectPresent &&
        !contextDependentReferencePresent &&
        !continuationCue &&
        !correctionPresent &&
        wordCount >= 6
      );

    const selfContained =
      !contextRequired &&
      !likelyFollowUp;

    return {
      explicitReset,
      correctionPresent,
      continuationCue,
      bareFollowUp,
      questionForm,
      shortContextualTurn,
      shortQuestionFollowUp,

      referenceExpressionPresent,
      contextDependentReferencePresent,

      referenceExpressions,
      contextDependentReferences,

      priorContextAvailable,
      linguisticFollowUpSignal,
      likelyFollowUp,
      contextRequired,
      contextRequiredButUnavailable,
      likelyTopicShift,
      selfContained,

      evidence: {
        wordCount,

        previousTurnCount:
          previousTurns.length,

        immediatePreviousTurnAvailable:
          Boolean(
            immediateContext
              .immediatePreviousTurn
          ),

        immediateAssistantTurnAvailable:
          Boolean(
            immediateContext
              .immediatePreviousAssistantTurn
          ),

        immediateUserTurnAvailable:
          Boolean(
            immediateContext
              .immediatePreviousUserTurn
          ),

        priorActiveTopicAvailable:
          Boolean(
            priorState.activeTopic
          ),

        priorActiveSubjectAvailable:
          Boolean(
            priorState.activeSubject
          ),

        priorReferenceCandidateCount:
          this.asArray(
            priorState.referenceCandidates
          ).length,

        concreteNewSubjectPresent,

        referenceExpressionCount:
          referenceExpressions.length,

        contextDependentReferenceCount:
          contextDependentReferences.length
      },

      authority:
        "continuity_evidence_only"
    };
  },

  hasExplicitReset(text = "") {
    return /\b(?:new topic|separate question|different question|different topic|switch topics|start over|unrelated question|forget that|never mind that|nevermind that|ignore that)\b/.test(
      text
    );
  },

  hasCorrectionSignal(text = "") {
    return /\b(?:no,?\s+i mean|i meant|actually|rather|instead|not that|correction|let me correct that)\b/.test(
      text
    );
  },

  hasContinuationCue(text = "") {
    return (
      /^(?:and|also|but|so|then|next|continue|go on|keep going|what about|based on that)\b/.test(
        text
      ) ||
      /\b(?:same one|other one|the latter|the former|that option|that idea|that plan|as before|like before|do the same)\b/.test(
        text
      )
    );
  },

  isBareFollowUp(text = "") {
    return /^(?:why|how|how so|really|then what|what next|what else|what about that|and then|so what|what happened|are you sure)\??$/.test(
      text
    );
  },

  hasQuestionForm(text = "") {
    return (
      text.includes("?") ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will|was|were|has|have|had)\b/.test(
        text
      )
    );
  },

  hasConcreteNewSubjectSignal(
    text = ""
  ) {
    return /\b(?:my wife|my husband|my spouse|my partner|my father|my dad|my mother|my mom|my child|my son|my daughter|my brother|my sister|my friend|my coworker|my boss|the car|my car|this file|the file|the engine|the pipeline|the patient|the baby|my account|my job|my application)\b/.test(
      text
    );
  },

  extractReferenceExpressions(
    text = ""
  ) {
    const matches = [];

    const pattern =
      /\b(?:it|its|this|that|these|those|they|them|their|he|him|his|she|her|hers|same one|other one|the former|the latter|that amount|that option|that idea|that plan|there|then|the previous one|the last one)\b/g;

    for (
      const match
      of String(text).matchAll(pattern)
    ) {
      const surface =
        match[0];

      const startIndex =
        match.index ??
        0;

      const referenceType =
        this.classifyReference(
          surface
        );

      matches.push({
        id:
          this.createStableReferenceId({
            surface,
            startIndex,
            text
          }),

        surface,

        normalizedSurface:
          this.normalize(surface),

        referenceType,

        startIndex,

        endIndex:
          startIndex +
          surface.length,

        contextDependent:
          this.isLikelyContextDependentReference({
            text,
            surface,
            startIndex,
            referenceType
          }),

        requiredForMeaning:
          this.isReferenceRequiredForMeaning({
            text,
            surface,
            referenceType
          }),

        confidence:
          0.9,

        source:
          "ari-conversation-continuity-engine"
      });
    }

    return matches;
  },

  classifyReference(value = "") {
    const text =
      this.normalize(value);

    if (
      [
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers",
        "they",
        "them",
        "their"
      ].includes(text)
    ) {
      return "pronoun";
    }

    if (
      [
        "this",
        "that",
        "these",
        "those"
      ].includes(text)
    ) {
      return "demonstrative";
    }

    if (
      [
        "same one",
        "other one",
        "the former",
        "the latter",
        "the previous one",
        "the last one"
      ].includes(text)
    ) {
      return "selection_reference";
    }

    if (
      text.startsWith("that ")
    ) {
      return "typed_demonstrative";
    }

    if (
      [
        "there",
        "then"
      ].includes(text)
    ) {
      return "situational_reference";
    }

    return "reference";
  },

  isLikelyContextDependentReference({
    text = "",
    surface = "",
    startIndex = 0,
    referenceType = ""
  } = {}) {
    const normalizedText =
      this.normalize(text);

    const normalizedSurface =
      this.normalize(surface);

    if (
      [
        "demonstrative",
        "selection_reference",
        "typed_demonstrative",
        "pronoun",
        "situational_reference"
      ].includes(
        referenceType
      )
    ) {
      return true;
    }

    const modificationPattern =
      /\b(?:make|change|edit|modify|fix|update|rewrite|redo|remove|add|turn|adjust|improve|enhance|replace|move|resize|darken|lighten|shorten|expand|continue|finish|send|delete|open|close)\b/;

    if (
      modificationPattern.test(
        normalizedText
      ) &&
      [
        "it",
        "its",
        "them",
        "him",
        "her",
        "this",
        "that",
        "these",
        "those"
      ].includes(
        normalizedSurface
      )
    ) {
      return true;
    }

    const impersonalItPatterns = [
      /^it is (?:raining|snowing|hot|cold|late|early)\b/,
      /^it seems\b/,
      /^it appears\b/,
      /^is it possible\b/,
      /^would it be possible\b/,
      /^can it be\b/,
      /^it depends\b/,
      /^it looks like\b/
    ];

    if (
      normalizedSurface === "it" &&
      impersonalItPatterns.some(
        pattern =>
          pattern.test(
            normalizedText
          )
      )
    ) {
      return false;
    }

    const wordCount =
      normalizedText
        .split(/\s+/)
        .filter(Boolean)
        .length;

    if (
      normalizedSurface === "it" &&
      wordCount <= 12
    ) {
      return true;
    }

    return startIndex > 0;
  },

  isReferenceRequiredForMeaning({
    text = "",
    surface = "",
    referenceType = ""
  } = {}) {
    const normalizedText =
      this.normalize(text);

    const normalizedSurface =
      this.normalize(surface);

    if (
      [
        "selection_reference",
        "typed_demonstrative",
        "pronoun"
      ].includes(
        referenceType
      )
    ) {
      return true;
    }

    if (
      /\b(?:make|change|edit|modify|fix|update|rewrite|redo|remove|add|adjust|improve|enhance|replace|continue|finish)\b/.test(
        normalizedText
      ) &&
      [
        "it",
        "this",
        "that",
        "them",
        "him",
        "her"
      ].includes(
        normalizedSurface
      )
    ) {
      return true;
    }

    return false;
  },

  /* =====================================================
     BRANCH RESOLUTION
  ===================================================== */

  resolveBranch({
    priorState = {},
    continuitySignals = {}
  } = {}) {
    const priorBranchId =
      priorState.branchId ||
      priorState.thread
        ?.branchId ||
      null;

    if (
      continuitySignals.explicitReset ||
      continuitySignals.likelyTopicShift
    ) {
      return {
        id:
          this.createId("branch"),

        previousId:
          priorBranchId,

        consistent:
          true,

        createdNew:
          true,

        reason:
          continuitySignals
            .explicitReset
            ? "explicit_reset"
            : "likely_topic_shift"
      };
    }

    return {
      id:
        priorBranchId ||
        this.createId("branch"),

      previousId:
        priorBranchId,

      consistent:
        true,

      createdNew:
        !priorBranchId,

      reason:
        continuitySignals
          .likelyFollowUp
          ? "continued_existing_branch"
          : "no_branch_conflict_detected"
    };
  },

  /* =====================================================
     RECENT TURNS
  ===================================================== */

  buildRecentTurns({
    previousTurns = [],
    currentTurn = {},
    continuitySignals = {},
    branch = {}
  } = {}) {
    const current = {
      turnId:
        currentTurn.turnId,

      threadId:
        null,

      branchId:
        branch.id,

      speaker:
        "user",

      text:
        currentTurn.rawText,

      createdAt:
        currentTurn.createdAt,

      entities: [],
      events: [],
      claims: [],
      quantities: [],

      references:
        this.asArray(
          continuitySignals
            .referenceExpressions
        ),

      options: [],
      topicRefs: [],

      meaningRef:
        null,

      frameRef:
        null,

      answerFocus:
        null,

      artifacts: [],

      continuityMetadata: {
        likelyFollowUp:
          continuitySignals
            .likelyFollowUp ===
          true,

        contextRequired:
          continuitySignals
            .contextRequired ===
          true,

        priorContextAvailable:
          continuitySignals
            .priorContextAvailable ===
          true,

        contextRequiredButUnavailable:
          continuitySignals
            .contextRequiredButUnavailable ===
          true
      }
    };

    const combined = [
      ...previousTurns,
      current
    ];

    return combined
      .slice(
        -this.maxRecentTurns
      )
      .map(
        (
          turn,
          index,
          list
        ) => ({
          ...turn,

          distance:
            list.length -
            1 -
            index,

          branchCompatible:
            !turn.branchId ||
            turn.branchId ===
              branch.id
        })
      );
  },

  /* =====================================================
     ACTIVE CONTEXT
  ===================================================== */

  resolveActiveContext({
    priorState = {},
    immediateContext = {},
    recentTurns = [],
    continuitySignals = {},
    branch = {}
  } = {}) {
    if (
      continuitySignals.explicitReset ||
      continuitySignals.likelyTopicShift
    ) {
      return {
        activeTopic:
          null,

        activeSubject:
          null,

        previousTopic:
          priorState.activeTopic ||
          null,

        inherited:
          false,

        branchId:
          branch.id,

        recentTurnCount:
          recentTurns.length
      };
    }

    const immediateAssistant =
      immediateContext
        .immediatePreviousAssistantTurn;

    const immediateUser =
      immediateContext
        .immediatePreviousUserTurn;

    const topicCandidate =
      this.firstStructuredValue([
        immediateAssistant
          ?.topicRefs?.[0],

        immediateUser
          ?.topicRefs?.[0],

        priorState.activeTopic
      ]);

    const subjectCandidate =
      this.firstStructuredValue([
        this.findPrimaryEntity(
          immediateAssistant
            ?.entities
        ),

        this.findPrimaryEntity(
          immediateUser
            ?.entities
        ),

        priorState.activeSubject
      ]);

    return {
      activeTopic:
        topicCandidate
          ? {
              ...this.normalizeContextNode(
                topicCandidate
              ),

              sourceTurnId:
                topicCandidate
                  ?.sourceTurnId ||
                immediateAssistant
                  ?.turnId ||
                immediateUser
                  ?.turnId ||
                null
            }
          : null,

      activeSubject:
        subjectCandidate
          ? {
              ...this.normalizeContextNode(
                subjectCandidate
              ),

              sourceTurnId:
                subjectCandidate
                  ?.sourceTurnId ||
                immediateAssistant
                  ?.turnId ||
                immediateUser
                  ?.turnId ||
                null
            }
          : null,

      previousTopic:
        priorState.activeTopic ||
        null,

      inherited:
        continuitySignals
          .likelyFollowUp ===
        true,

      branchId:
        branch.id,

      recentTurnCount:
        recentTurns.length
    };
  },

  /* =====================================================
     STRUCTURED COLLECTIONS
  ===================================================== */

  collectRecentSemanticItems({
    priorState = {},
    immediateContext = {},
    recentTurns = [],
    branch = {}
  } = {}) {
    const compatibleTurns =
      recentTurns.filter(turn =>
        turn.branchCompatible !==
        false
      );

    return {
      recentEntities:
        this.collectItemsFromTurns(
          compatibleTurns,
          "entities"
        ),

      recentEvents:
        this.collectItemsFromTurns(
          compatibleTurns,
          "events"
        ),

      recentClaims:
        this.collectItemsFromTurns(
          compatibleTurns,
          "claims"
        ),

      recentQuantities:
        this.collectItemsFromTurns(
          compatibleTurns,
          "quantities"
        ),

      recentOptions:
        this.collectItemsFromTurns(
          compatibleTurns,
          "options"
        ),

      recentArtifacts:
        this.collectItemsFromTurns(
          compatibleTurns,
          "artifacts"
        ),

      immediateEntities:
        this.mergeStructuredItems([
          ...this.asArray(
            immediateContext
              .immediatePreviousAssistantTurn
              ?.entities
          ),

          ...this.asArray(
            immediateContext
              .immediatePreviousUserTurn
              ?.entities
          )
        ]),

      inheritedReferenceCandidates:
        this.asArray(
          priorState.referenceCandidates
        ).filter(candidate =>
          candidate.branchId
            ? candidate.branchId ===
              branch.id
            : true
        )
    };
  },

  collectItemsFromTurns(
    turns = [],
    field = "entities"
  ) {
    const items = [];

    turns.forEach(turn => {
      this.asArray(
        turn[field]
      ).forEach(item => {
        const normalizedItem =
          typeof item === "object"
            ? item
            : {
                value:
                  item
              };

        items.push({
          ...normalizedItem,

          sourceTurnId:
            normalizedItem
              .sourceTurnId ||
            turn.turnId,

          sourceSpeaker:
            normalizedItem
              .sourceSpeaker ||
            turn.speaker,

          turnDistance:
            normalizedItem
              .turnDistance ??
            turn.distance,

          branchId:
            normalizedItem
              .branchId ||
            turn.branchId,

          branchCompatible:
            turn.branchCompatible !==
            false
        });
      });
    });

    return this.mergeStructuredItems(
      items
    );
  },

  /* =====================================================
     REFERENCE CANDIDATES
  ===================================================== */

  buildReferenceCandidates({
    immediateContext = {},
    activeContext = {},
    collections = {},
    branch = {}
  } = {}) {
    const candidates = [];

    const addCandidate = (
      item,
      semanticType,
      defaults = {}
    ) => {
      if (
        item === null ||
        item === undefined
      ) {
        return;
      }

      const object =
        typeof item === "object"
          ? item
          : {
              value:
                item
            };

      const value =
        this.extractSemanticValue(
          object
        );

      if (!value) {
        return;
      }

      const sourceTurnId =
        object.sourceTurnId ||
        defaults.sourceTurnId ||
        null;

      const sourceSpeaker =
        object.sourceSpeaker ||
        defaults.sourceSpeaker ||
        null;

      const turnDistance =
        Number(
          object.turnDistance ??
          defaults.turnDistance ??
          99
        );

      const branchCompatible =
        object.branchCompatible !==
          false &&
        (
          !object.branchId ||
          object.branchId ===
            branch.id
        );

      const recencyScore =
        this.calculateRecencyScore(
          turnDistance
        );

      const salienceScore =
        this.calculateSalienceScore(
          object,
          semanticType
        );

      const stale =
        turnDistance >= 4 ||
        !branchCompatible;

      candidates.push({
        id:
          object.id ||
          this.createStableCandidateId({
            semanticType,
            value,
            sourceTurnId
          }),

        semanticRef:
          object.semanticRef ||
          object.entityRef ||
          object.id ||
          null,

        semanticType,

        value,

        sourceTurnId,
        sourceSpeaker,
        turnDistance,

        branchId:
          object.branchId ||
          branch.id,

        branchCompatible,

        recencyScore,

        topicScore:
          this.clampConfidence(
            object.topicScore ??
            0
          ),

        salienceScore,

        stale,

        confidence:
          this.clampConfidence(
            object.confidence ??
            (
              recencyScore *
              0.7 +
              salienceScore *
              0.3
            )
          ),

        evidenceRefs:
          this.asArray(
            object.evidenceRefs
          ),

        raw:
          object
      });
    };

    const immediateAssistant =
      immediateContext
        .immediatePreviousAssistantTurn;

    const immediateUser =
      immediateContext
        .immediatePreviousUserTurn;

    const addTurnItems = (
      turn,
      distance
    ) => {
      if (!turn) {
        return;
      }

      [
        ["artifacts", "artifact"],
        ["quantities", "quantity"],
        ["options", "option"],
        ["claims", "claim"],
        ["entities", "entity"],
        ["events", "event"]
      ].forEach(
        ([field, type]) => {
          this.asArray(
            turn[field]
          ).forEach(item =>
            addCandidate(
              item,
              type,
              {
                sourceTurnId:
                  turn.turnId,

                sourceSpeaker:
                  turn.speaker,

                turnDistance:
                  distance
              }
            )
          );
        }
      );
    };

    addTurnItems(
      immediateAssistant,
      1
    );

    addTurnItems(
      immediateUser,
      2
    );

    [
      [
        collections.recentArtifacts,
        "artifact"
      ],

      [
        collections.recentOptions,
        "option"
      ],

      [
        collections.recentQuantities,
        "quantity"
      ],

      [
        collections.recentClaims,
        "claim"
      ],

      [
        collections.recentEvents,
        "event"
      ],

      [
        collections.recentEntities,
        "entity"
      ]
    ].forEach(
      ([items, type]) => {
        this.asArray(items)
          .forEach(item =>
            addCandidate(
              item,
              type
            )
          );
      }
    );

    if (activeContext.activeTopic) {
      addCandidate(
        activeContext.activeTopic,
        "topic",
        {
          turnDistance:
            3
        }
      );
    }

    if (activeContext.activeSubject) {
      addCandidate(
        activeContext.activeSubject,
        "subject",
        {
          turnDistance:
            3
        }
      );
    }

    this.asArray(
      collections
        .inheritedReferenceCandidates
    ).forEach(item =>
      addCandidate(
        item,
        item.semanticType ||
        "unknown"
      )
    );

    return this.dedupeCandidates(
      candidates
    )
      .sort(
        (
          first,
          second
        ) => {
          if (
            first.stale !==
            second.stale
          ) {
            return first.stale
              ? 1
              : -1;
          }

          if (
            second.recencyScore !==
            first.recencyScore
          ) {
            return (
              second.recencyScore -
              first.recencyScore
            );
          }

          if (
            second.salienceScore !==
            first.salienceScore
          ) {
            return (
              second.salienceScore -
              first.salienceScore
            );
          }

          return (
            second.confidence -
            first.confidence
          );
        }
      )
      .slice(
        0,
        this.maxReferenceCandidates
      );
  },

  calculateRecencyScore(
    turnDistance = 99
  ) {
    const distance =
      Math.max(
        0,
        Number(
          turnDistance ??
          99
        )
      );

    if (distance <= 1) {
      return 1;
    }

    if (distance === 2) {
      return 0.88;
    }

    if (distance === 3) {
      return 0.72;
    }

    if (distance === 4) {
      return 0.55;
    }

    if (distance <= 6) {
      return 0.4;
    }

    return 0.2;
  },

  calculateSalienceScore(
    item = {},
    semanticType = ""
  ) {
    let score =
      this.clampConfidence(
        item.salience ??
        item.confidence ??
        0.5
      );

    const typeBonuses = {
      artifact:
        0.12,

      quantity:
        0.08,

      option:
        0.06,

      subject:
        0.06,

      topic:
        0.04
    };

    score +=
      typeBonuses[
        semanticType
      ] ||
      0;

    if (
      item.answerFocus === true ||
      item.focus === true ||
      item.primary === true
    ) {
      score += 0.12;
    }

    return this.clampConfidence(
      score
    );
  },

  /* =====================================================
     STALE CONTEXT
  ===================================================== */

  identifyStaleContext({
    referenceCandidates = [],
    recentTurns = [],
    activeContext = {},
    branch = {}
  } = {}) {
    const stale = [];

    referenceCandidates
      .filter(candidate =>
        candidate.stale ||
        candidate.branchCompatible ===
          false
      )
      .forEach(candidate => {
        stale.push({
          semanticRef:
            candidate.semanticRef ||
            candidate.id,

          value:
            candidate.value,

          semanticType:
            candidate.semanticType,

          reason:
            candidate.branchCompatible ===
              false
              ? "branch_mismatch"
              : "low_recency",

          sourceTurnId:
            candidate.sourceTurnId,

          confidence:
            candidate.confidence
        });
      });

    recentTurns
      .filter(turn =>
        turn.branchCompatible ===
        false
      )
      .forEach(turn => {
        stale.push({
          semanticRef:
            turn.turnId,

          value:
            turn.text,

          semanticType:
            "turn",

          reason:
            "branch_mismatch",

          sourceTurnId:
            turn.turnId,

          confidence:
            0.9
        });
      });

    if (
      activeContext.previousTopic &&
      branch.createdNew
    ) {
      stale.push({
        semanticRef:
          activeContext
            .previousTopic
            ?.semanticRef ||
          activeContext
            .previousTopic
            ?.entityRef ||
          null,

        value:
          this.extractSemanticValue(
            activeContext.previousTopic
          ),

        semanticType:
          "topic",

        reason:
          "topic_replaced_by_new_branch",

        sourceTurnId:
          activeContext
            .previousTopic
            ?.sourceTurnId ||
          null,

        confidence:
          0.85
      });
    }

    return this.dedupeStaleContext(
      stale
    ).slice(
      0,
      this.maxStaleContextItems
    );
  },

  /* =====================================================
     UNRESOLVED THREAD ITEMS
  ===================================================== */

  collectUnresolvedThreadItems({
    priorState = {},
    branch = {},
    continuitySignals = {}
  } = {}) {
    if (
      branch.createdNew ||
      continuitySignals.explicitReset
    ) {
      return [];
    }

    return this.asArray(
      priorState
        .unresolvedThreadItems
    )
      .filter(item => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return true;
        }

        return (
          !item.branchId ||
          item.branchId ===
            branch.id
        );
      })
      .slice(
        -this.maxUnresolvedItems
      );
  },

  /* =====================================================
     CANONICAL THREAD CONTEXT
  ===================================================== */

  buildThreadContext({
    priorState = {},
    currentTurn = {},
    immediateContext = {},
    recentTurns = [],
    activeContext = {},
    collections = {},
    referenceCandidates = [],
    continuitySignals = {},
    staleContext = [],
    unresolvedThreadItems = [],
    branch = {}
  } = {}) {
    const confidence =
      this.scoreThreadContextConfidence({
        immediateContext,
        recentTurns,
        referenceCandidates,
        continuitySignals,
        branch
      });

    const warnings =
      this.buildWarnings({
        continuitySignals,
        referenceCandidates,
        branch
      });

const threadId =
  priorState.threadId ||
  priorState.thread?.threadId ||
  this.resolveThreadId(
    recentTurns
  );

    return {
      schema:
  "ari_thread_context",

schemaVersion:
  this.schemaVersion,

version:
  this.schemaVersion,

engineVersion:
  this.version,

      source:
        "ari-conversation-continuity-engine",

      createdAt:
        new Date().toISOString(),

      ran:
        true,

      ready:
        true,

      thread: {
        threadId,

        branchId:
          branch.id,

        previousBranchId:
          branch.previousId ||
          priorState.branchId ||
          null,

        branchConsistent:
          branch.consistent ===
          true,

        branchCreated:
          branch.createdNew ===
          true,

        branchReason:
          branch.reason ||
          null
      },

      currentTurn: {
  turnId:
    currentTurn.turnId,

  threadId,

  branchId:
    branch.id,

  rawText:
    currentTurn.rawText,

        normalizedText:
          currentTurn.normalizedText,

        wordCount:
          currentTurn.wordCount,

        references:
          this.asArray(
            continuitySignals
              .referenceExpressions
          ),

        referenceExpressionPresent:
          continuitySignals
            .referenceExpressionPresent ===
          true,

        contextDependentReferencePresent:
          continuitySignals
            .contextDependentReferencePresent ===
          true,

        likelyFollowUp:
          continuitySignals
            .likelyFollowUp ===
          true,

        contextRequired:
          continuitySignals
            .contextRequired ===
          true,

        priorContextAvailable:
          continuitySignals
            .priorContextAvailable ===
          true,

        contextRequiredButUnavailable:
          continuitySignals
            .contextRequiredButUnavailable ===
          true
      },

      immediatePreviousTurn:
        this.toCanonicalTurnSnapshot(
          immediateContext
            .immediatePreviousTurn
        ),

      immediatePreviousUserTurn:
        this.toCanonicalTurnSnapshot(
          immediateContext
            .immediatePreviousUserTurn
        ),

      immediatePreviousAssistantTurn:
        this.toCanonicalTurnSnapshot(
          immediateContext
            .immediatePreviousAssistantTurn,
          {
            includeAnswerFocus:
              true,

            includeArtifacts:
              true
          }
        ),

      recentTurns:
  recentTurns.map(turn =>
    this.toCanonicalRecentTurn({
      ...turn,

      threadId:
        turn.threadId ||
        threadId
    })
  ),

      activeTopic:
        activeContext.activeTopic,

      activeSubject:
        activeContext.activeSubject,

      previousTopic:
        activeContext.previousTopic,

      inheritedActiveContext:
        activeContext.inherited ===
        true,

      recentEntities:
        collections.recentEntities,

      recentEvents:
        collections.recentEvents,

      recentClaims:
        collections.recentClaims,

      recentQuantities:
        collections.recentQuantities,

      recentOptions:
        collections.recentOptions,

      recentArtifacts:
        collections.recentArtifacts,

      referenceCandidates,

      continuitySignals: {
        explicitReset:
          continuitySignals
            .explicitReset ===
          true,

        likelyFollowUp:
          continuitySignals
            .likelyFollowUp ===
          true,

        linguisticFollowUpSignal:
          continuitySignals
            .linguisticFollowUpSignal ===
          true,

        contextRequired:
          continuitySignals
            .contextRequired ===
          true,

        selfContained:
          continuitySignals
            .selfContained ===
          true,

        referenceExpressionPresent:
          continuitySignals
            .referenceExpressionPresent ===
          true,

        contextDependentReferencePresent:
          continuitySignals
            .contextDependentReferencePresent ===
          true,

        priorContextAvailable:
          continuitySignals
            .priorContextAvailable ===
          true,

        contextRequiredButUnavailable:
          continuitySignals
            .contextRequiredButUnavailable ===
          true,

        likelyTopicShift:
          continuitySignals
            .likelyTopicShift ===
          true,

        correctionPresent:
          continuitySignals
            .correctionPresent ===
          true,

        continuationCue:
          continuitySignals
            .continuationCue ===
          true,

        bareFollowUp:
          continuitySignals
            .bareFollowUp ===
          true,

        shortQuestionFollowUp:
          continuitySignals
            .shortQuestionFollowUp ===
          true,

        shortContextualTurn:
          continuitySignals
            .shortContextualTurn ===
          true,

        referenceExpressions:
          this.asArray(
            continuitySignals
              .referenceExpressions
          ),

        evidence:
          continuitySignals.evidence ||
          {}
      },

      contextDependency: {
        selfContained:
          continuitySignals
            .selfContained ===
          true,

        requiresPriorContext:
          continuitySignals
            .contextRequired ===
          true,

        priorContextAvailable:
          continuitySignals
            .priorContextAvailable ===
          true,

        missingRequiredContext:
          continuitySignals
            .contextRequiredButUnavailable ===
          true,

        dependencyType:
          this.resolveDependencyType(
            continuitySignals
          ),

        requiredContextSources:
          this.resolveRequiredContextSources(
            continuitySignals
          ),

        confidence:
          this.scoreDependencyConfidence(
            continuitySignals
          ),

        evidence:
          this.buildDependencyEvidence(
            continuitySignals
          ),

        authority:
          "context_dependency_evidence_only"
      },

      staleContext,

      unresolvedThreadItems,

      confidence,

      warnings,

      evidenceRefs:
        this.collectThreadEvidenceRefs({
          recentTurns,
          referenceCandidates
        }),

      statePhase:
        "continuity_analysis",

      provisional:
        true,

      deliveryCommitted:
        false,

      authority: {
        canLoadThreadState:
          true,

        canPreserveRecentTurns:
          true,

        canDetectContinuityEvidence:
          true,

        canDetectContextDependency:
          true,

        canRankContextRecency:
          true,

        canProvideReferenceCandidates:
          true,

        canMaintainThreadIdentity:
          true,

        canMaintainBranchIdentity:
          true,

        canResolveReferences:
          false,

        canChooseOperation:
          false,

        canChooseMeaning:
          false,

        canChooseIntent:
          false,

        canChooseFrame:
          false,

        canChoosePlanner:
          false,

        canRecommendNextStep:
          false,

        canAnswerUser:
          false,

        canCommitAuthoritativeDelivery:
          false,

        role:
          "canonical_thread_context_and_continuity_evidence_only"
      }
    };
  },

  buildWarnings({
    continuitySignals = {},
    referenceCandidates = [],
    branch = {}
  } = {}) {
    const warnings = [];

    if (
      continuitySignals
        .contextDependentReferencePresent &&
      !referenceCandidates.length
    ) {
      warnings.push({
        type:
          "reference_candidates_missing",

        message:
          "The current turn contains a contextual reference, but no structured prior candidate is available.",

        recoverable:
          true,

        recommendedDisposition:
          "clarification_or_context_recovery"
      });
    }

    if (
      continuitySignals
        .contextRequiredButUnavailable
    ) {
      warnings.push({
        type:
          "context_required_but_unavailable",

        message:
          "The current turn appears to require prior context, but no usable prior thread context was available.",

        referenceExpressions:
          this.asArray(
            continuitySignals
              .referenceExpressions
          ),

        recoverable:
          true,

        recommendedDisposition:
          "clarification"
      });
    }

    if (
      !branch.consistent
    ) {
      warnings.push({
        type:
          "branch_inconsistency",

        message:
          "The current thread branch is inconsistent with prior context.",

        recoverable:
          true,

        recommendedDisposition:
          "suppress_incompatible_context"
      });
    }

    return warnings;
  },

  resolveDependencyType(
    signals = {}
  ) {
    if (
      signals.explicitReset
    ) {
      return "none";
    }

    if (
      signals
        .contextDependentReferencePresent
    ) {
      return "reference_dependency";
    }

    if (
      signals.correctionPresent
    ) {
      return "correction_dependency";
    }

    if (
      signals.continuationCue
    ) {
      return "continuation_dependency";
    }

    if (
      signals.bareFollowUp
    ) {
      return "elliptical_dependency";
    }

    if (
      signals.shortQuestionFollowUp
    ) {
      return "short_contextual_dependency";
    }

    return "none";
  },

  resolveRequiredContextSources(
    signals = {}
  ) {
    if (
      !signals.contextRequired
    ) {
      return [];
    }

    const sources =
      new Set();

    if (
      signals
        .contextDependentReferencePresent
    ) {
      sources.add(
        "reference_resolution"
      );

      sources.add(
        "thread"
      );
    }

    if (
      signals.continuationCue ||
      signals.bareFollowUp ||
      signals.correctionPresent
    ) {
      sources.add(
        "thread"
      );
    }

    return [...sources];
  },

  scoreDependencyConfidence(
    signals = {}
  ) {
    let score = 0;

    if (
      signals
        .contextDependentReferencePresent
    ) {
      score += 0.55;
    }

    if (
      signals.continuationCue
    ) {
      score += 0.2;
    }

    if (
      signals.correctionPresent
    ) {
      score += 0.2;
    }

    if (
      signals.bareFollowUp
    ) {
      score += 0.3;
    }

    if (
      signals.shortQuestionFollowUp
    ) {
      score += 0.1;
    }

    if (
      signals.explicitReset
    ) {
      score = 0;
    }

    return this.clampConfidence(
      score
    );
  },

  buildDependencyEvidence(
    signals = {}
  ) {
    const evidence = [];

    if (
      signals
        .contextDependentReferencePresent
    ) {
      evidence.push({
        type:
          "contextual_reference",

        references:
          this.asArray(
            signals
              .contextDependentReferences
          )
      });
    }

    if (
      signals.continuationCue
    ) {
      evidence.push({
        type:
          "continuation_cue"
      });
    }

    if (
      signals.correctionPresent
    ) {
      evidence.push({
        type:
          "correction_signal"
      });
    }

    if (
      signals.bareFollowUp
    ) {
      evidence.push({
        type:
          "bare_follow_up"
      });
    }

    if (
      signals
        .contextRequiredButUnavailable
    ) {
      evidence.push({
        type:
          "required_context_missing"
      });
    }

    return evidence;
  },

  scoreThreadContextConfidence({
    immediateContext = {},
    recentTurns = [],
    referenceCandidates = [],
    continuitySignals = {},
    branch = {}
  } = {}) {
    let score =
      0.3;

    if (
      immediateContext
        .immediatePreviousTurn
    ) {
      score += 0.15;
    }

    if (
      immediateContext
        .immediatePreviousAssistantTurn
    ) {
      score += 0.1;
    }

    if (
      immediateContext
        .immediatePreviousUserTurn
    ) {
      score += 0.08;
    }

    if (
      recentTurns.length >= 2
    ) {
      score += 0.08;
    }

    if (
      referenceCandidates.length
    ) {
      score += 0.1;
    }

    if (
      branch.consistent
    ) {
      score += 0.06;
    }

    if (
      continuitySignals
        .likelyFollowUp &&
      continuitySignals
        .priorContextAvailable
    ) {
      score += 0.05;
    }

    if (
      continuitySignals
        .contextDependentReferencePresent &&
      !referenceCandidates.length
    ) {
      score -= 0.15;
    }

    if (
      continuitySignals
        .contextRequiredButUnavailable
    ) {
      score -= 0.2;
    }

    return this.clampConfidence(
      score
    );
  },

  /* =====================================================
     PERSISTED STATE
  ===================================================== */

  buildPersistedState({
    priorState = {},
    threadContext = {}
  } = {}) {
    return {
      ...priorState,

      schema:
  "ari_conversation_state",

stateSchema:
  "ari_conversation_state",

threadContextSchema:
  threadContext.schema,

legacySchema:
  threadContext.schema,

schemaVersion:
  this.schemaVersion,

version:
  this.schemaVersion,

engineVersion:
  this.version,

      source:
        "ari-conversation-continuity-engine",

      threadId:
        threadContext.thread
          ?.threadId ||
        priorState.threadId ||
        null,

      branchId:
        threadContext.thread
          ?.branchId ||
        null,

      thread:
        threadContext.thread,

      currentTurn:
        threadContext.currentTurn,

      immediatePreviousTurn:
        threadContext
          .immediatePreviousTurn,

      immediatePreviousUserTurn:
        threadContext
          .immediatePreviousUserTurn,

      immediatePreviousAssistantTurn:
        threadContext
          .immediatePreviousAssistantTurn,

      recentTurns:
        threadContext.recentTurns,

      lastMessages:
        threadContext.recentTurns.map(
          turn => ({
            turnId:
              turn.turnId,

            threadId:
              turn.threadId,

            role:
              turn.speaker,

            text:
              turn.text,

            createdAt:
              turn.createdAt,

            branchId:
              turn.branchId,

            entities:
              turn.entities,

            events:
              turn.events,

            claims:
              turn.claims,

            quantities:
              turn.quantities,

            references:
              turn.references,

            options:
              turn.options,

            topicRefs:
              turn.topicRefs,

            meaningRef:
              turn.meaningRef,

            frameRef:
              turn.frameRef,

            answerFocus:
              turn.answerFocus,

            artifacts:
              turn.artifacts
          })
        ),

      activeTopic:
        threadContext.activeTopic,

      previousTopic:
        threadContext.previousTopic,

      activeSubject:
        threadContext.activeSubject,

      referenceCandidates:
        threadContext.referenceCandidates,

      staleContext:
        threadContext.staleContext,

      unresolvedThreadItems:
        threadContext
          .unresolvedThreadItems,

      continuitySignals:
        threadContext
          .continuitySignals,

      contextDependency:
        threadContext
          .contextDependency,

      confidence:
        threadContext.confidence,

      warnings:
        threadContext.warnings,

      statePhase:
        "continuity_analysis",

      provisional:
        true,

      deliveryCommitted:
        false,

      updatedAt:
        new Date().toISOString(),

      authority:
        "thread_context_only"
    };
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

  buildReturnPayload({
    threadContext = {},
    persistedState = {}
  } = {}) {
    const signals =
      threadContext
        .continuitySignals ||
      {};

    const contextDependency =
      threadContext
        .contextDependency ||
      {};

    return {
      threadContext,

      continuityState:
        persistedState,

      conversationContinuity:
        persistedState,

      threadState:
        persistedState,

      currentThreadContext:
        threadContext,

      conversationContinuityEngineRan:
        true,

      conversationContinuityEngineVersion:
        this.version,

      conversationContinuityEngineSource:
        "ari-conversation-continuity-engine",

      continuityEngineRan:
        true,

      continuityEngineVersion:
        this.version,

      continuityEngineSource:
        "ari-conversation-continuity-engine",

      immediatePreviousTurn:
        threadContext
          .immediatePreviousTurn,

      immediatePreviousUserTurn:
        threadContext
          .immediatePreviousUserTurn,

      immediatePreviousAssistantTurn:
        threadContext
          .immediatePreviousAssistantTurn,

      referenceCandidates:
        threadContext
          .referenceCandidates,

      staleContext:
        threadContext
          .staleContext,

      currentTopic:
        this.extractSemanticValue(
          threadContext.activeTopic
        ),

      previousTopic:
        this.extractSemanticValue(
          threadContext.previousTopic
        ),

      activeSubject:
        threadContext.activeSubject,

      followUpDetected:
        signals.likelyFollowUp ===
        true,

      followUpType:
        this.compatibilityFollowUpType(
          signals
        ),

      followUpConfidence:
        signals.likelyFollowUp
          ? threadContext.confidence
          : 0,

      shouldReusePriorContext:
        contextDependency
          .requiresPriorContext ===
          true,

      mustReusePriorContext:
        contextDependency
          .requiresPriorContext ===
          true &&
        contextDependency
          .selfContained !==
          true,

      priorContextAvailable:
        contextDependency
          .priorContextAvailable ===
        true,

      contextRequiredButUnavailable:
        contextDependency
          .missingRequiredContext ===
        true,

      referenceExpressionPresent:
        signals
          .referenceExpressionPresent ===
        true,

      referenceExpressions:
        this.asArray(
          signals.referenceExpressions
        ),

      lastMessages:
        persistedState.lastMessages ||
        [],

      unresolvedItems:
        threadContext
          .unresolvedThreadItems ||
        [],

      lastUserIntent:
        null,

      nextStep:
        null,

      continuitySummary: {
        threadId:
          threadContext.thread
            ?.threadId ||
          null,

        branchId:
          threadContext.thread
            ?.branchId ||
          null,

        branchCreated:
          threadContext.thread
            ?.branchCreated ===
          true,

        activeTopic:
          threadContext.activeTopic,

        activeSubject:
          threadContext.activeSubject,

        continuitySignals:
          signals,

        contextDependency,

        recentTurnCount:
          threadContext.recentTurns
            ?.length ||
          0,

        referenceCandidateCount:
          threadContext
            .referenceCandidates
            ?.length ||
          0,

        staleContextCount:
          threadContext
            .staleContext
            ?.length ||
          0,

        confidence:
          threadContext.confidence
      },

      confidence:
        threadContext.confidence,

      warnings:
        threadContext.warnings,

      provisional:
        true,

      deliveryCommitted:
        false,

      authority:
        "thread_context_only"
    };
  },

  compatibilityFollowUpType(
    signals = {}
  ) {
    if (
      signals.explicitReset
    ) {
      return "topic_reset";
    }

    if (
      signals.correctionPresent
    ) {
      return "correction";
    }

    if (
      signals
        .contextRequiredButUnavailable
    ) {
      return "context_required_but_unavailable";
    }

    if (
      signals
        .contextDependentReferencePresent
    ) {
      return "reference_follow_up";
    }

    if (
      signals.bareFollowUp
    ) {
      return "bare_follow_up";
    }

    if (
      signals.continuationCue
    ) {
      return "continuation";
    }

    if (
      signals.shortQuestionFollowUp
    ) {
      return "short_contextual_question";
    }

    if (
      signals.shortContextualTurn
    ) {
      return "short_contextual_turn";
    }

    if (
      signals.likelyFollowUp
    ) {
      return "follow_up";
    }

    return "none";
  },

  /* =====================================================
     CANONICAL TURN FORMATTERS
  ===================================================== */

  toCanonicalTurnSnapshot(
    turn = null,
    options = {}
  ) {
    const base = {
      turnId:
        turn?.turnId ||
        null,

      threadId:
        turn?.threadId ||
        null,

      branchId:
        turn?.branchId ||
        null,

      speaker:
        turn?.speaker ||
        "unknown",

      text:
        turn?.text ||
        "",

      createdAt:
        turn?.createdAt ||
        null,

      entities:
        this.asArray(
          turn?.entities
        ),

      events:
        this.asArray(
          turn?.events
        ),

      claims:
        this.asArray(
          turn?.claims
        ),

      quantities:
        this.asArray(
          turn?.quantities
        ),

      references:
        this.asArray(
          turn?.references
        ),

      options:
        this.asArray(
          turn?.options
        ),

      canonicalMeaningRef:
        turn?.meaningRef ||
        null,

      semanticFrameRef:
        turn?.frameRef ||
        null
    };

    if (
      options.includeAnswerFocus
    ) {
      base.answerFocus =
        turn?.answerFocus ||
        null;
    }

    if (
      options.includeArtifacts
    ) {
      base.artifacts =
        this.asArray(
          turn?.artifacts
        );
    }

    return base;
  },

  toCanonicalRecentTurn(
    turn = {}
  ) {
    return {
      turnId:
        turn.turnId ||
        null,

      threadId:
        turn.threadId ||
        null,

      branchId:
        turn.branchId ||
        null,

      speaker:
        turn.speaker ||
        "unknown",

      text:
        turn.text ||
        "",

      distance:
        Number(
          turn.distance ??
          0
        ),

      createdAt:
        turn.createdAt ||
        null,

      entities:
        this.asArray(
          turn.entities
        ),

      events:
        this.asArray(
          turn.events
        ),

      claims:
        this.asArray(
          turn.claims
        ),

      quantities:
        this.asArray(
          turn.quantities
        ),

      references:
        this.asArray(
          turn.references
        ),

      options:
        this.asArray(
          turn.options
        ),

      topicRefs:
        this.asArray(
          turn.topicRefs
        ),

      meaningRef:
        turn.meaningRef ||
        null,

      frameRef:
        turn.frameRef ||
        null,

      answerFocus:
        turn.answerFocus ||
        null,

      artifacts:
        this.asArray(
          turn.artifacts
        ),

      branchCompatible:
        turn.branchCompatible !==
        false,

      continuityMetadata:
        turn.continuityMetadata ||
        null
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  readMessageArray(value = []) {
    return this.asArray(value);
  },

  readStructuredItems(value = []) {
    return this.asArray(value)
      .filter(item =>
        item !== null &&
        item !== undefined
      );
  },

  normalizeSpeaker(value = "") {
    const speaker =
      this.normalize(value);

    if (
      [
        "assistant",
        "ari",
        "system"
      ].includes(speaker)
    ) {
      return "assistant";
    }

    if (
      [
        "user",
        "human"
      ].includes(speaker)
    ) {
      return "user";
    }

    return "unknown";
  },

  normalizeContextNode(
    value = null
  ) {
    if (!value) {
      return null;
    }

    if (
      typeof value === "string"
    ) {
      return {
        value:
          this.clean(value),

        type:
          null,

        entityRef:
          null,

        sourceTurnId:
          null,

        confidence:
          0.65,

        evidenceRefs:
          []
      };
    }

    const semanticValue =
      this.extractSemanticValue(
        value
      );

    if (!semanticValue) {
      return null;
    }

    return {
      value:
        semanticValue,

      type:
        value.type ||
        value.semanticType ||
        value.entityType ||
        null,

      entityRef:
        value.entityRef ||
        value.semanticRef ||
        value.id ||
        null,

      sourceTurnId:
        value.sourceTurnId ||
        null,

      confidence:
        this.clampConfidence(
          value.confidence ??
          0.65
        ),

      evidenceRefs:
        this.asArray(
          value.evidenceRefs
        )
    };
  },

  findPrimaryEntity(
    entities = []
  ) {
    const usable =
      this.asArray(entities);

    if (!usable.length) {
      return null;
    }

    return (
      usable.find(item =>
        item?.primary === true ||
        item?.focus === true ||
        item?.grammaticalRole ===
          "subject"
      ) ||
      usable[0]
    );
  },

  firstStructuredValue(
    values = []
  ) {
    return values.find(value =>
      value !== null &&
      value !== undefined &&
      Boolean(
        this.extractSemanticValue(
          value
        )
      )
    ) ||
    null;
  },

  firstDefined(
    values = []
  ) {
    return values.find(value =>
      value !== undefined &&
      value !== null
    );
  },

firstPopulatedArray(
  values = []
) {
  for (const value of values) {
    const items =
      this.asArray(value);

    if (items.length > 0) {
      return items;
    }
  }

  return [];
},

  firstObject(
    values = []
  ) {
    return values.find(value =>
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) ||
    {};
  },

  collectThreadEvidenceRefs({
    recentTurns = [],
    referenceCandidates = []
  } = {}) {
    return [
      ...new Set([
        ...recentTurns
          .map(turn =>
            turn.turnId
          )
          .filter(Boolean),

        ...referenceCandidates
          .flatMap(candidate =>
            this.asArray(
              candidate.evidenceRefs
            )
          )
          .filter(Boolean)
      ])
    ];
  },

  resolveThreadId(
    recentTurns = []
  ) {
    const existing =
      recentTurns.find(turn =>
        turn.threadId
      )?.threadId;

    return (
      existing ||
      this.createId("thread")
    );
  },

  extractSemanticValue(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return this.clean(value);
    }

    return this.clean(
      value.value ||
      value.surface ||
      value.label ||
      value.name ||
      value.claim ||
      value.proposition ||
      value.text ||
      value.evidence ||
      value.numericValue ||
      value.filename ||
      value.url ||
      ""
    );
  },

  mergeStructuredItems(
    items = []
  ) {
    const seen =
      new Map();

    this.asArray(items)
      .forEach(item => {
        const object =
          typeof item === "object"
            ? item
            : {
                value:
                  item
              };

        const value =
          this.extractSemanticValue(
            object
          );

        if (!value) {
          return;
        }

        const type =
          this.normalize(
            object.semanticType ||
            object.entityType ||
            object.type ||
            object.kind ||
            "unknown"
          );

        const key =
          `${type}|${this.normalize(
            value
          )}`;

        if (!seen.has(key)) {
          seen.set(
            key,
            {
              ...object
            }
          );

          return;
        }

        const existing =
          seen.get(key);

        existing.confidence =
          Math.max(
            Number(
              existing.confidence ||
              0
            ),

            Number(
              object.confidence ||
              0
            )
          );

        existing.evidenceRefs = [
          ...new Set([
            ...this.asArray(
              existing.evidenceRefs
            ),

            ...this.asArray(
              object.evidenceRefs
            )
          ])
        ];

        existing.sourceTurnIds = [
          ...new Set([
            ...this.asArray(
              existing.sourceTurnIds
            ),

            existing.sourceTurnId,
            object.sourceTurnId
          ].filter(Boolean))
        ];
      });

    return [...seen.values()];
  },

  dedupeTurns(
    turns = []
  ) {
    const seen =
      new Map();

    turns.forEach(turn => {
      const key =
        turn.turnId ||
        [
          turn.speaker,
          this.normalize(turn.text),
          turn.createdAt ||
          ""
        ].join("|");

      if (!key) {
        return;
      }

      seen.set(
        key,
        turn
      );
    });

    return [...seen.values()];
  },

  dedupeCandidates(
    candidates = []
  ) {
    const seen =
      new Map();

    candidates.forEach(candidate => {
      const key = [
        candidate.semanticType,
        this.normalize(
          candidate.value
        ),
        candidate.sourceTurnId ||
        "unknown"
      ].join("|");

      if (!seen.has(key)) {
        seen.set(
          key,
          candidate
        );

        return;
      }

      const existing =
        seen.get(key);

      existing.recencyScore =
        Math.max(
          existing.recencyScore ||
          0,

          candidate.recencyScore ||
          0
        );

      existing.salienceScore =
        Math.max(
          existing.salienceScore ||
          0,

          candidate.salienceScore ||
          0
        );

      existing.confidence =
        Math.max(
          existing.confidence ||
          0,

          candidate.confidence ||
          0
        );

      existing.evidenceRefs = [
        ...new Set([
          ...this.asArray(
            existing.evidenceRefs
          ),

          ...this.asArray(
            candidate.evidenceRefs
          )
        ])
      ];
    });

    return [...seen.values()];
  },

  dedupeStaleContext(
    items = []
  ) {
    const seen =
      new Set();

    return items.filter(item => {
      const key = [
        item.semanticType ||
        "unknown",

        this.normalize(
          item.value
        ),

        item.sourceTurnId ||
        "unknown",

        item.reason ||
        "unknown"
      ].join("|");

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
  },

  compareTurnOrder(
    first = {},
    second = {}
  ) {
    const firstTime =
      this.timestamp(
        first.createdAt
      );

    const secondTime =
      this.timestamp(
        second.createdAt
      );

    if (
      firstTime &&
      secondTime &&
      firstTime !==
        secondTime
    ) {
      return (
        firstTime -
        secondTime
      );
    }

    return 0;
  },

  timestamp(value = null) {
    if (!value) {
      return 0;
    }

    const parsed =
      Date.parse(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  },

  createStableTurnId(
    text = "",
    speaker = "unknown"
  ) {
    return [
      "turn",
      this.hashString(
        `${speaker}|${text}`
      )
    ].join("_");
  },

  createStableReferenceId({
    surface = "",
    startIndex = 0,
    text = ""
  } = {}) {
    return [
      "reference",
      this.hashString(
        [
          surface,
          startIndex,
          text
        ].join("|")
      )
    ].join("_");
  },

  createStableCandidateId({
    semanticType = "unknown",
    value = "",
    sourceTurnId = "unknown"
  } = {}) {
    return [
      "candidate",
      this.hashString(
        [
          semanticType,
          value,
          sourceTurnId
        ].join("|")
      )
    ].join("_");
  },

  hashString(value = "") {
    let hash =
      2166136261;

    const text =
      String(value || "");

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(index);

      hash +=
        (
          hash << 1
        ) +
        (
          hash << 4
        ) +
        (
          hash << 7
        ) +
        (
          hash << 8
        ) +
        (
          hash << 24
        );
    }

    return (
      hash >>> 0
    ).toString(36);
  },

  createId(prefix = "id") {
    return [
      prefix,
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2, 8)
    ].join("_");
  },

  asArray(value = []) {
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

  clampConfidence(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (
      number > 1
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

  clean(value = "") {
    return String(
      value ??
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

window.Ari.conversationContinuityEngine =
  window.AriConversationContinuityEngine;

console.log(
  "ARI CONVERSATION CONTINUITY ENGINE LOADED:",
  window.AriConversationContinuityEngine?.version
);