// ari/continuity/ari-conversation-continuity-engine.js
// Ari Conversation Continuity Engine
// Purpose: Produce canonical, branch-aware thread context for semantic understanding.
// V3.0.0 — Canonical Thread Context Schema / No Intent / No Planning / No Frame Authority

window.Ari = window.Ari || {};

window.AriConversationContinuityEngine = {
  version: "3.0.0",
  schemaVersion: "1.0.0",

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
        currentTurn,
        priorState,
        continuitySignals
      });

    const recentTurns =
      this.buildRecentTurns({
        previousTurns,
        currentTurn,
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
        immediateContext,
        recentTurns,
        priorState,
        branch
      });

    const referenceCandidates =
      this.buildReferenceCandidates({
        currentTurn,
        immediateContext,
        recentTurns,
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

    window.Ari.conversationState =
      persistedState;

    window.Ari.threadContext =
      threadContext;

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
        new Date().toISOString(),

      wordCount:
        normalizedText
          .split(/\s+/)
          .filter(Boolean)
          .length
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
      return {};
    }

    try {
      const loaded =
        await store.load(summary);

      return (
        loaded &&
        typeof loaded === "object"
          ? loaded
          : {}
      );
    } catch (error) {
      console.warn(
        "ARI THREAD CONTEXT LOAD FAILED:",
        error
      );

      return {
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
      return false;
    }

    try {
      await store.save(
        state,
        summary
      );

      return true;
    } catch (error) {
      console.warn(
        "ARI THREAD CONTEXT SAVE FAILED:",
        error
      );

      return false;
    }
  },

  readPriorState({
    summary = {},
    storedThread = {}
  } = {}) {
    const candidates = [
      summary.threadContext,
      summary.conversationState,
      summary.threadState,
      storedThread.threadContext,
      storedThread.threadState,
      storedThread.conversationState,
      window.Ari.threadContext,
      window.Ari.conversationState
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object"
      ) ||
      {};

    return {
      ...found,

      threadId:
        found.thread?.threadId ||
        found.threadId ||
        storedThread.threadId ||
        summary.threadId ||
        null,

      branchId:
        found.thread?.branchId ||
        found.branchId ||
        null,

      lastMessages:
        this.readMessageArray(
          found.lastMessages ||
          found.recentTurns ||
          storedThread.lastMessages ||
          summary.lastMessages ||
          []
        ),

      activeTopic:
        this.normalizeContextNode(
          found.activeTopic ||
          found.currentTopic ||
          null
        ),

      activeSubject:
        this.normalizeContextNode(
          found.activeSubject ||
          null
        ),

      unresolvedThreadItems:
        this.asArray(
          found.unresolvedThreadItems ||
          found.unresolvedItems ||
          []
        ),

      referenceCandidates:
        this.asArray(
          found.referenceCandidates ||
          []
        ),

      staleContext:
        this.asArray(
          found.staleContext ||
          []
        )
    };
  },

  /* =====================================================
     PRIOR TURN COLLECTION
  ===================================================== */

  collectPriorTurns({
    summary = {},
    priorState = {},
    currentTurn = {}
  } = {}) {
    const sources = [
      priorState.lastMessages,
      priorState.recentTurns,
      summary.recentTurns,
      summary.recentMessages,
      summary.lastMessages,
      summary.threadState?.lastMessages,
      summary.continuityState?.lastMessages,
      summary.conversationHistoryTurns
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

          if (
            currentTurn.rawText &&
            turn.speaker === "user" &&
            this.normalize(turn.text) ===
              currentTurn.normalizedText
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
      .slice(-20);
  },

  normalizeTurn(value = {}) {
    if (
      typeof value === "string"
    ) {
      return {
        turnId:
          this.createStableTurnId(
            value,
            "unknown"
          ),

        speaker:
          "unknown",

        text:
          this.clean(value),

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

        branchId:
          null
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
          value.semanticFrame?.entities ||
          value.canonicalMeaning?.entities ||
          []
        ),

      events:
        this.readStructuredItems(
          value.events ||
          value.semanticFrame?.events ||
          value.canonicalMeaning?.events ||
          []
        ),

      claims:
        this.readStructuredItems(
          value.claims ||
          value.semanticFrame?.claims ||
          value.canonicalMeaning?.claims ||
          []
        ),

      quantities:
        this.readStructuredItems(
          value.quantities ||
          value.semanticFrame?.quantities ||
          value.canonicalMeaning?.quantities ||
          []
        ),

      references:
        this.readStructuredItems(
          value.references ||
          value.referenceResolution?.references ||
          []
        ),

      options:
        this.readStructuredItems(
          value.options ||
          value.semanticFrame?.options ||
          value.canonicalMeaning?.options ||
          []
        ),

      topicRefs:
        this.readStructuredItems(
          value.topicRefs ||
          value.topics ||
          []
        ),

      meaningRef:
        value.meaningRef ||
        value.canonicalMeaningRef ||
        value.canonicalMeaning?.id ||
        null,

      frameRef:
        value.frameRef ||
        value.semanticFrameRef ||
        value.semanticFrame?.frameId ||
        null,

      answerFocus:
        value.answerFocus ||
        value.semanticFrame
          ?.requestedOutput ||
        value.canonicalMeaning
          ?.requestedOutput ||
        null,

      branchId:
        value.branchId ||
        value.threadBranchId ||
        null
    };
  },

  resolveImmediateContext(
    previousTurns = []
  ) {
    const ordered =
      [...previousTurns];

    const immediatePreviousTurn =
      ordered.at(-1) ||
      null;

    const immediatePreviousUserTurn =
      [...ordered]
        .reverse()
        .find(turn =>
          turn.speaker === "user"
        ) ||
      null;

    const immediatePreviousAssistantTurn =
      [...ordered]
        .reverse()
        .find(turn =>
          turn.speaker ===
          "assistant"
        ) ||
      null;

    return {
      immediatePreviousTurn,
      immediatePreviousUserTurn,
      immediatePreviousAssistantTurn
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

    const references =
      this.extractReferenceExpressions(
        text
      );

    const correctionPresent =
      this.hasCorrectionSignal(text);

    const continuationCue =
      this.hasContinuationCue(text);

    const shortContextualTurn =
      wordCount > 0 &&
      wordCount <= 10;

    const priorContextAvailable =
      previousTurns.length > 0 ||
      Boolean(
        immediateContext
          .immediatePreviousTurn
      ) ||
      Boolean(
        priorState.activeTopic ||
        priorState.activeSubject
      );

    const contextDependentReferencePresent =
      references.length > 0;

    const likelyFollowUp =
      !explicitReset &&
      priorContextAvailable &&
      (
        contextDependentReferencePresent ||
        continuationCue ||
        correctionPresent ||
        this.isBareFollowUp(text) ||
        (
          shortContextualTurn &&
          this.hasQuestionForm(text)
        )
      );

    const concreteNewSubjectPresent =
      this.hasConcreteNewSubjectSignal(
        text
      );

    const likelyTopicShift =
      explicitReset ||
      (
        concreteNewSubjectPresent &&
        !contextDependentReferencePresent &&
        !continuationCue &&
        !correctionPresent &&
        wordCount >= 6
      );

    return {
      explicitReset,
      likelyFollowUp,
      contextDependentReferencePresent,
      likelyTopicShift,
      correctionPresent,
      shortContextualTurn,
      continuationCue,
      priorContextAvailable,

      referenceExpressions:
        references,

      evidence: {
        wordCount,
        concreteNewSubjectPresent
      }
    };
  },

  hasExplicitReset(text = "") {
    return /\b(?:new topic|separate question|different question|different topic|switch topics|start over|unrelated question|forget that|never mind that|nevermind that)\b/.test(
      text
    );
  },

  hasCorrectionSignal(text = "") {
    return /\b(?:no i mean|no,? i mean|i meant|actually|rather|instead|not that|correction)\b/.test(
      text
    );
  },

  hasContinuationCue(text = "") {
    return (
      /^(?:and|also|but|so|then|next|continue|go on|keep going|what about|based on that)\b/.test(
        text
      ) ||
      /\b(?:same one|other one|the latter|the former|that option|that idea|that plan|as before)\b/.test(
        text
      )
    );
  },

  isBareFollowUp(text = "") {
    return /^(?:why|how|how so|really|then what|what next|what else|what about that|and then|so what)\??$/.test(
      text
    );
  },

  hasQuestionForm(text = "") {
    return (
      text.includes("?") ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(
        text
      )
    );
  },

  hasConcreteNewSubjectSignal(
    text = ""
  ) {
    return /\b(?:my wife|my husband|my spouse|my partner|my father|my dad|my mother|my mom|my child|my son|my daughter|my friend|my coworker|my boss|the car|my car|this file|the file|the engine|the pipeline|the patient|the baby)\b/.test(
      text
    );
  },

  extractReferenceExpressions(
    text = ""
  ) {
    const matches = [];

    const pattern =
      /\b(?:it|its|this|that|these|those|they|them|their|he|him|his|she|her|hers|same one|other one|the former|the latter|that amount|that option|that idea|that plan|there|then)\b/g;

    for (
      const match
      of String(text).matchAll(pattern)
    ) {
      matches.push({
        surface:
          match[0],

        referenceType:
          this.classifyReference(
            match[0]
          ),

        startIndex:
          match.index ?? null,

        confidence:
          0.9
      });
    }

    return matches;
  },

  classifyReference(
    value = ""
  ) {
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
        "the latter"
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

  /* =====================================================
     BRANCH
  ===================================================== */

  resolveBranch({
    currentTurn = {},
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
    branch = {}
  } = {}) {
    const current = {
      turnId:
        currentTurn.turnId,

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
      references: [],
      options: [],

      topicRefs: [],
      meaningRef:
        null,

      frameRef:
        null,

      branchId:
        branch.id
    };

    const combined = [
      ...previousTurns,
      current
    ];

    return combined
      .slice(-12)
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
          false
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
                  .sourceTurnId ||
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
                  .sourceTurnId ||
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
          .likelyFollowUp === true,

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
    immediateContext = {},
    recentTurns = [],
    priorState = {},
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
        items.push({
          ...(
            typeof item === "object"
              ? item
              : {
                  value:
                    item
                }
          ),

          sourceTurnId:
            item?.sourceTurnId ||
            turn.turnId,

          sourceSpeaker:
            item?.sourceSpeaker ||
            turn.speaker,

          turnDistance:
            item?.turnDistance ??
            turn.distance,

          branchId:
            item?.branchId ||
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
    currentTurn = {},
    immediateContext = {},
    recentTurns = [],
    activeContext = {},
    collections = {},
    branch = {}
  } = {}) {
    const candidates = [];

    const addCandidate =
      (
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

        const value =
          this.extractSemanticValue(
            item
          );

        if (!value) {
          return;
        }

        const sourceTurnId =
          item.sourceTurnId ||
          defaults.sourceTurnId ||
          null;

        const sourceSpeaker =
          item.sourceSpeaker ||
          defaults.sourceSpeaker ||
          null;

        const turnDistance =
          Number(
            item.turnDistance ??
            defaults.turnDistance ??
            99
          );

        const branchCompatible =
          item.branchCompatible !==
          false &&
          (
            !item.branchId ||
            item.branchId ===
              branch.id
          );

        const recencyScore =
          this.calculateRecencyScore(
            turnDistance
          );

        const salienceScore =
          this.calculateSalienceScore(
            item,
            semanticType
          );

        const stale =
          turnDistance >= 4 ||
          !branchCompatible;

        candidates.push({
          id:
            item.id ||
            this.createStableCandidateId({
              semanticType,
              value,
              sourceTurnId
            }),

          semanticRef:
            item.semanticRef ||
            item.id ||
            null,

          semanticType,

          value,

          sourceTurnId,
          sourceSpeaker,
          turnDistance,

          recencyScore,
          topicScore:
            0,

          salienceScore,

          stale,
          branchCompatible,

          confidence:
            this.clampConfidence(
              item.confidence ??
              (
                recencyScore *
                0.7 +
                salienceScore *
                0.3
              )
            ),

          evidenceRefs:
            this.asArray(
              item.evidenceRefs
            ),

          raw:
            item
        });
      };

    const immediateAssistant =
      immediateContext
        .immediatePreviousAssistantTurn;

    const immediateUser =
      immediateContext
        .immediatePreviousUserTurn;

    this.asArray(
      immediateAssistant?.quantities
    ).forEach(item =>
      addCandidate(
        item,
        "quantity",
        {
          sourceTurnId:
            immediateAssistant
              .turnId,

          sourceSpeaker:
            "assistant",

          turnDistance:
            1
        }
      )
    );

    this.asArray(
      immediateAssistant?.claims
    ).forEach(item =>
      addCandidate(
        item,
        "claim",
        {
          sourceTurnId:
            immediateAssistant
              .turnId,

          sourceSpeaker:
            "assistant",

          turnDistance:
            1
        }
      )
    );

    this.asArray(
      immediateAssistant?.entities
    ).forEach(item =>
      addCandidate(
        item,
        "entity",
        {
          sourceTurnId:
            immediateAssistant
              .turnId,

          sourceSpeaker:
            "assistant",

          turnDistance:
            1
        }
      )
    );

    this.asArray(
      immediateAssistant?.events
    ).forEach(item =>
      addCandidate(
        item,
        "event",
        {
          sourceTurnId:
            immediateAssistant
              .turnId,

          sourceSpeaker:
            "assistant",

          turnDistance:
            1
        }
      )
    );

    this.asArray(
      immediateUser?.quantities
    ).forEach(item =>
      addCandidate(
        item,
        "quantity",
        {
          sourceTurnId:
            immediateUser
              .turnId,

          sourceSpeaker:
            "user",

          turnDistance:
            2
        }
      )
    );

    this.asArray(
      immediateUser?.claims
    ).forEach(item =>
      addCandidate(
        item,
        "claim",
        {
          sourceTurnId:
            immediateUser
              .turnId,

          sourceSpeaker:
            "user",

          turnDistance:
            2
        }
      )
    );

    this.asArray(
      immediateUser?.entities
    ).forEach(item =>
      addCandidate(
        item,
        "entity",
        {
          sourceTurnId:
            immediateUser
              .turnId,

          sourceSpeaker:
            "user",

          turnDistance:
            2
        }
      )
    );

    this.asArray(
      collections.recentOptions
    ).forEach(item =>
      addCandidate(
        item,
        "option"
      )
    );

    this.asArray(
      collections.recentQuantities
    ).forEach(item =>
      addCandidate(
        item,
        "quantity"
      )
    );

    this.asArray(
      collections.recentClaims
    ).forEach(item =>
      addCandidate(
        item,
        "claim"
      )
    );

    this.asArray(
      collections.recentEvents
    ).forEach(item =>
      addCandidate(
        item,
        "event"
      )
    );

    this.asArray(
      collections.recentEntities
    ).forEach(item =>
      addCandidate(
        item,
        "entity"
      )
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

          return (
            second.salienceScore -
            first.salienceScore
          );
        }
      )
      .slice(0, 40);
  },

  calculateRecencyScore(
    turnDistance = 99
  ) {
    const distance =
      Math.max(
        0,
        Number(turnDistance || 0)
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

    if (
      semanticType ===
      "quantity"
    ) {
      score += 0.08;
    }

    if (
      semanticType ===
      "option"
    ) {
      score += 0.06;
    }

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
            .semanticRef ||
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
            .sourceTurnId ||
          null,

        confidence:
          0.85
      });
    }

    return this.dedupeStaleContext(
      stale
    ).slice(0, 20);
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
      .slice(-12);
  },

  /* =====================================================
     CANONICAL THREAD CONTEXT
  ===================================================== */

  buildThreadContext({
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
          "The current turn contains a contextual reference, but no structured prior candidate is available."
      });
    }

    if (
      !branch.consistent
    ) {
      warnings.push({
        type:
          "branch_inconsistency",

        message:
          "The current thread branch is not consistent with prior context."
      });
    }

    return {
      schema:
        "ari_thread_context",

      version:
        this.schemaVersion,

      source:
        "ari-conversation-continuity-engine",

      ran:
        true,

      thread: {
        threadId:
          this.resolveThreadId(
            recentTurns
          ),

        branchId:
          branch.id,

        branchConsistent:
          branch.consistent
      },

      currentTurn: {
        turnId:
          currentTurn.turnId,

        rawText:
          currentTurn.rawText,

        normalizedText:
          currentTurn.normalizedText
      },

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
              true
          }
        ),

      recentTurns:
        recentTurns.map(turn =>
          this.toCanonicalRecentTurn(
            turn
          )
        ),

      activeTopic:
        activeContext.activeTopic,

      activeSubject:
        activeContext.activeSubject,

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

      referenceCandidates,

      continuitySignals: {
        explicitReset:
          continuitySignals
            .explicitReset,

        likelyFollowUp:
          continuitySignals
            .likelyFollowUp,

        contextDependentReferencePresent:
          continuitySignals
            .contextDependentReferencePresent,

        likelyTopicShift:
          continuitySignals
            .likelyTopicShift,

        correctionPresent:
          continuitySignals
            .correctionPresent,

        shortContextualTurn:
          continuitySignals
            .shortContextualTurn
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

      authority: {
        canLoadThreadState:
          true,

        canPreserveRecentTurns:
          true,

        canRankContextRecency:
          true,

        canProvideReferenceCandidates:
          true,

        canResolveReferences:
          false,

        canChooseOperation:
          false,

        canChooseMeaning:
          false,

        canChooseFrame:
          false,

        canChoosePlanner:
          false,

        canRecommendNextStep:
          false,

        canAnswerUser:
          false,

        role:
          "thread_context_only"
      }
    };
  },

  scoreThreadContextConfidence({
    immediateContext = {},
    recentTurns = [],
    referenceCandidates = [],
    continuitySignals = {},
    branch = {}
  } = {}) {
    let score =
      0.35;

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
      score += 0.08;
    }

    if (
      branch.consistent
    ) {
      score += 0.06;
    }

    if (
      continuitySignals
        .contextDependentReferencePresent &&
      !referenceCandidates.length
    ) {
      score -= 0.2;
    }

    return this.clampConfidence(
      score
    );
  },

  /* =====================================================
     PERSISTENCE STATE
  ===================================================== */

  buildPersistedState({
    priorState = {},
    threadContext = {}
  } = {}) {
    return {
      ...priorState,

      schema:
        threadContext.schema,

      version:
        threadContext.version,

      source:
        threadContext.source,

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
              turn.frameRef
          })
        ),

      activeTopic:
        threadContext.activeTopic,

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

      confidence:
        threadContext.confidence,

      warnings:
        threadContext.warnings,

      updatedAt:
        new Date().toISOString(),

      authority:
        "thread_context_only"
    };
  },

  /* =====================================================
     RETURN PAYLOAD + COMPATIBILITY
  ===================================================== */

  buildReturnPayload({
    threadContext = {},
    persistedState = {}
  } = {}) {
    const signals =
      threadContext
        .continuitySignals ||
      {};

    return {
      threadContext,

      continuityState:
        persistedState,

      conversationContinuity:
        persistedState,

      threadState:
        persistedState,

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

      // Canonical aliases.
      currentThreadContext:
        threadContext,

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

      // Temporary legacy compatibility aliases.
      currentTopic:
        this.extractSemanticValue(
          threadContext.activeTopic
        ),

      previousTopic:
        this.extractSemanticValue(
          persistedState
            .previousTopic
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
        signals.likelyFollowUp ===
          true ||
        signals
          .contextDependentReferencePresent ===
          true,

      lastMessages:
        persistedState.lastMessages ||
        [],

      unresolvedItems:
        threadContext
          .unresolvedThreadItems ||
        [],

      // Explicitly retired semantic-authority fields.
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

        activeTopic:
          threadContext.activeTopic,

        activeSubject:
          threadContext.activeSubject,

        continuitySignals:
          signals,

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
        .contextDependentReferencePresent
    ) {
      return "reference_follow_up";
    }

    if (
      signals.shortContextualTurn
    ) {
      return "short_contextual_turn";
    }

    if (
      signals.likelyFollowUp
    ) {
      return "continuation";
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
    if (!turn) {
      return {
        turnId:
          null,

        text:
          "",

        entities: [],
        events: [],
        claims: [],
        quantities: [],
        references: [],

        canonicalMeaningRef:
          null,

        semanticFrameRef:
          null,

        ...(
          options.includeAnswerFocus
            ? {
                answerFocus:
                  null
              }
            : {}
        )
      };
    }

    return {
      turnId:
        turn.turnId ||
        null,

      text:
        turn.text ||
        "",

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

      canonicalMeaningRef:
        turn.meaningRef ||
        null,

      semanticFrameRef:
        turn.frameRef ||
        null,

      ...(
        options.includeAnswerFocus
          ? {
              answerFocus:
                turn.answerFocus ||
                null
            }
          : {}
      )
    };
  },

  toCanonicalRecentTurn(
    turn = {}
  ) {
    return {
      turnId:
        turn.turnId ||
        null,

      speaker:
        turn.speaker ||
        "unknown",

      text:
        turn.text ||
        "",

      distance:
        Number(
          turn.distance || 0
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

      branchId:
        turn.branchId ||
        null,

      branchCompatible:
        turn.branchCompatible !==
        false
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  readMessageArray(value = []) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (!value) {
      return [];
    }

    return [value];
  },

  readStructuredItems(
    value = []
  ) {
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

        sourceTurnId:
          null,

        confidence:
          0.65,

        evidenceRefs:
          []
      };
    }

    return {
      value:
        this.extractSemanticValue(
          value
        ),

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
        item.primary === true ||
        item.focus === true ||
        item.grammaticalRole ===
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
      this.extractSemanticValue(
        value
      )
    ) ||
    null;
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
      ""
    );
  },

  mergeStructuredItems(
    items = []
  ) {
    const seen =
      new Map();

    items.forEach(item => {
      const value =
        this.extractSemanticValue(
          item
        );

      if (!value) {
        return;
      }

      const type =
        this.normalize(
          item.semanticType ||
          item.entityType ||
          item.type ||
          item.kind ||
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
            ...(
              typeof item ===
              "object"
                ? item
                : {
                    value:
                      item
                  }
            )
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
            item.confidence ||
            0
          )
        );

      existing.evidenceRefs = [
        ...new Set([
          ...this.asArray(
            existing.evidenceRefs
          ),

          ...this.asArray(
            item.evidenceRefs
          )
        ])
      ];

      existing.sourceTurnIds = [
        ...new Set([
          ...this.asArray(
            existing.sourceTurnIds
          ),

          existing.sourceTurnId,
          item.sourceTurnId
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
          turn.createdAt || ""
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