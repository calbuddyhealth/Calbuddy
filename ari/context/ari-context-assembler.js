// ari/context/ari-context-assembler.js
// Ari Context Assembler
// Purpose: Safely assemble continuity, memory, relationship, thread, entity, and semantic-frame context.
// V1.5.0 — Semantic Frame Context Handoff / Advisory Only

window.Ari = window.Ari || {};

window.AriContextAssembler = {
  version: "1.5.0",

  assemble(input = {}) {
    const summary = input.summary || input || {};

    const continuity =
      summary.continuityState ||
      summary.conversationContinuity ||
      summary.threadState ||
      {};

    const memoryContext = summary.memoryContext || {};
    const relationshipProfile = summary.relationshipProfile || {};

    const thread =
      summary.continuityPacket?.activeThread ||
      summary.continuityResults?.outputs?.thread ||
      summary.threadUnderstanding ||
      {};

    const entity =
      summary.entityReference ||
      summary.entityReferenceState ||
      {};

    const semanticFrame =
      this.readSemanticFrame(summary, thread, continuity);

    const assembledContext = {
      contextAssemblerRan: true,
      contextAssemblerVersion: this.version,
      contextAssemblerSource: "ari-context-assembler",

      continuity: this.cleanContinuity(continuity),
      memory: this.cleanMemory(memoryContext),
      relationship: this.cleanRelationship(relationshipProfile),
      thread: this.cleanThread(thread),
      entity: this.cleanEntity(entity),

      semanticFrame,
      activeSemanticFrame: semanticFrame,

      activeSituation: null,
      keyFacts: [],
      activeSituationSource: null,
      contextAuthority: "advisory_context_only",

      advisoryFacts: [],
      styleHints: {},
      projectContext: {},
      priorDecisions: [],
      activeThreadFacts: [],
      activeEntities: [],
      activeProblems: [],
      activeGoals: [],
      activeConstraints: [],
      activeAttempts: [],
      domainSignals: [],
      intentSignals: [],
      conflicts: [],

      authority: "advisory_context_only",

      cannotSet: [
  "primaryLane",
  "primaryLaneSuggestion",
  "triagePrimaryLane",
  "situationContractPrimary",
  "riskLevel",
  "override",
  "finalResponse",
  "medicalEscalation",
  "responseShape",
  "recommendation"
]
    };

    this.addSemanticFrameFacts(assembledContext);
    this.addActiveSituationFacts(assembledContext);
    this.addContinuityFacts(assembledContext);
    this.addThreadFacts(assembledContext);
    this.addEntityFacts(assembledContext);
    this.addMemoryFacts(assembledContext);
    this.addRelationshipHints(assembledContext);
    this.finalize(assembledContext);

    return {
      contextAssemblerRan: true,
      contextAssemblerVersion: this.version,
      contextAssemblerSource: "ari-context-assembler",

      assembledContext,
      advisoryContext: assembledContext,
      continuityContext: this.buildContinuityContext(assembledContext),

      semanticFrame: assembledContext.semanticFrame,
      activeSemanticFrame: assembledContext.activeSemanticFrame,

      activeSituation: assembledContext.activeSituation,
      keyFacts: assembledContext.keyFacts,
      activeSituationSource: assembledContext.activeSituationSource,
      contextAuthority: assembledContext.contextAuthority,

      advisoryFacts: assembledContext.advisoryFacts,
      styleHints: assembledContext.styleHints,
      projectContext: assembledContext.projectContext,
      priorDecisions: assembledContext.priorDecisions,
      activeThreadFacts: assembledContext.activeThreadFacts,
      activeEntities: assembledContext.activeEntities,
      activeProblems: assembledContext.activeProblems,
      activeGoals: assembledContext.activeGoals,
      activeConstraints: assembledContext.activeConstraints,
      activeAttempts: assembledContext.activeAttempts,
      domainSignals: assembledContext.domainSignals,
      intentSignals: assembledContext.intentSignals,
      contextConflicts: assembledContext.conflicts,

      authority: "advisory_context_only"
    };
  },
    readSemanticFrame(summary = {}, thread = {}, continuity = {}) {
  const workingContext = thread.workingContext || {};
  const semanticFrameOutput = summary.semanticFrameOutput || {};

  const candidates = [
    semanticFrameOutput.normalizedFrame,
    semanticFrameOutput.primaryFrame,
    semanticFrameOutput.semanticSummary,

    summary.primarySemanticFrame,
    summary.normalizedSemanticFrame,

    summary.semanticFrame?.primaryFrame,
    summary.semanticFrame?.normalizedFrame,
    summary.semanticFrame,

    summary.currentSemanticFrame,
    summary.activeSemanticFrame,

    thread.semanticFrame?.primaryFrame,
    thread.semanticFrame,
    thread.activeSemanticFrame,
    thread.resolvedMeaning?.semanticFrame,

    workingContext.semanticFrame?.primaryFrame,
    workingContext.semanticFrame,
    workingContext.activeSemanticFrame,
    workingContext.semanticState?.semanticFrame?.primaryFrame,
    workingContext.semanticState?.semanticFrame,

    continuity.semanticFrame,
    continuity.activeSemanticFrame,
    continuity.activeSemanticFrameState,

    summary.threadState?.semanticFrame,
    summary.threadState?.activeSemanticFrame
  ];

  const found = candidates.find(frame =>
    frame &&
    typeof frame === "object" &&
    (
      frame.frameType ||
      frame.primaryMeaning ||
      frame.intent ||
      frame.domain ||
      frame.operation
    )
  );

  if (!found) return null;

  return {
    ...found,
    source: found.source || found.semanticFrameSource || "ari-context-assembler"
  };
},

  cleanContinuity(continuity = {}) {
  const currentTopic = this.stringifyTopic(continuity.currentTopic);

  return {
    currentTopic,
    previousTopic: this.stringifyTopic(continuity.previousTopic),

    semanticFrame:
      continuity.semanticFrame ||
      continuity.activeSemanticFrame ||
      continuity.activeSemanticFrameState ||
      null,

    followUpDetected:
  Boolean(
    continuity.followUpDetected ||
    continuity.shouldReusePriorContext ||
    (
      continuity.followUpType &&
      continuity.followUpType !== "none"
    )
  ),

    followUpType: continuity.followUpType || "none",

    shouldReusePriorContext:
  Boolean(
    continuity.shouldReusePriorContext ||
    continuity.followUpDetected ||
    (
      continuity.followUpType &&
      continuity.followUpType !== "none"
    )
  ),

    unresolvedItems: Array.isArray(continuity.unresolvedItems)
      ? continuity.unresolvedItems.slice(0, 8)
      : [],

    nextStep: continuity.nextStep || null,
    previousAnswerSummary: continuity.previousAnswerSummary || continuity.lastFinalResponse || null,

    lastMessages: Array.isArray(continuity.lastMessages)
      ? continuity.lastMessages.slice(-8)
      : []
  };
},

  cleanMemory(memory = {}) {
    return {
      relevantMemories: Array.isArray(memory.relevantMemories)
        ? memory.relevantMemories.slice(0, 7)
        : [],

      userPreferences: memory.userPreferences || {},
      projectContext: memory.projectContext || {},

      priorDecisions: Array.isArray(memory.priorDecisions)
        ? memory.priorDecisions.slice(0, 7)
        : [],

      relationshipPatterns: Array.isArray(memory.relationshipPatterns)
        ? memory.relationshipPatterns.slice(0, 7)
        : [],

      activeThreadFacts: Array.isArray(memory.activeThreadFacts)
        ? memory.activeThreadFacts.slice(0, 7)
        : [],

      conflicts: Array.isArray(memory.conflicts)
        ? memory.conflicts.slice(0, 5)
        : [],

      confidence: memory.confidence ?? 0
    };
  },

  cleanRelationship(profile = {}) {
    return {
      communicationStyle: profile.communicationStyle || "direct_warm_practical",
      depth: profile.depth || "normal",
      collaborationMode: profile.collaborationMode || "standard",
      challengeTolerance: profile.challengeTolerance || "medium",
      technicalComfort: profile.technicalComfort || "unknown",
      preferredFormat: profile.preferredFormat || "clear_steps",

      activeProjects: Array.isArray(profile.activeProjects)
        ? profile.activeProjects.slice(0, 8)
        : [],

      stablePreferences: profile.stablePreferences || {},

      reasons: Array.isArray(profile.reasons)
        ? profile.reasons.slice(0, 8)
        : []
    };
  },

  cleanThread(thread = {}) {
    const workingContext = thread.workingContext || {};

    const semanticFrame =
      thread.semanticFrame ||
      thread.activeSemanticFrame ||
      thread.resolvedMeaning?.semanticFrame ||
      workingContext.semanticFrame ||
      workingContext.activeSemanticFrame ||
      workingContext.semanticState?.semanticFrame ||
      null;

    return {
      confidence: thread.confidence ?? null,

      semanticFrame,
      activeSemanticFrame: semanticFrame,

      activeSituation:
        thread.activeSituation ||
        workingContext.activeSituation ||
        thread.resolvedMeaning?.activeSituation ||
        null,

      keyFacts:
        Array.isArray(thread.keyFacts) && thread.keyFacts.length
          ? thread.keyFacts
          : Array.isArray(workingContext.keyFacts) && workingContext.keyFacts.length
            ? workingContext.keyFacts
            : Array.isArray(thread.resolvedMeaning?.keyFacts)
              ? thread.resolvedMeaning.keyFacts
              : [],

      staleContextSuppressed:
        Boolean(
          thread.staleContextSuppressed ||
          thread.resolvedMeaning?.staleContextSuppressed
        ),

      suppressedTopics:
        Array.isArray(thread.suppressedTopics)
          ? thread.suppressedTopics
          : [],

      activeSubject:
        thread.activeSubject ||
        workingContext.activeSubject ||
        null,

      activeObject:
        thread.activeObject ||
        workingContext.activeObject ||
        thread.resolvedMeaning?.resolvedObject ||
        semanticFrame?.slots?.object ||
        null,

      activeIssue:
        thread.activeIssue ||
        workingContext.activeIssue ||
        thread.resolvedMeaning?.resolvedIssue ||
        semanticFrame?.slots?.problem ||
        null,

      activeGoal:
        thread.activeGoal ||
        workingContext.activeGoal ||
        thread.resolvedMeaning?.resolvedGoal ||
        semanticFrame?.slots?.goal ||
        null,

      activeConstraints:
        thread.activeConstraints ||
        workingContext.activeConstraints ||
        semanticFrame?.slots?.constraints ||
        [],

      activeAttempts:
        thread.activeAttempts ||
        workingContext.activeAttempts ||
        [],

      unresolvedItems:
        thread.unresolvedItems ||
        workingContext.unresolvedItems ||
        semanticFrame?.missingSlots ||
        [],

      impliedQuestion: thread.impliedQuestion || null,
      resolvedMeaning: thread.resolvedMeaning || null,
      workingContext,

      domainSignals:
        thread.domainSignals ||
        workingContext.domainSignals ||
        [],

      intentSignals:
        thread.intentSignals ||
        workingContext.intentSignals ||
        [],

      stateChange: thread.stateChange || null,
      topicTransition: thread.topicTransition || null
    };
  },

  cleanEntity(entity = {}) {
    return {
      activeSubject: entity.activeSubject || entity.activeEntity || null,
      activeEntity: entity.activeEntity || entity.activeSubject || null,
      activeReference: entity.activeReference || null,

      resolvedReferences: Array.isArray(entity.resolvedReferences)
        ? entity.resolvedReferences.slice(0, 8)
        : [],

      activeSubjects: Array.isArray(entity.activeSubjects)
        ? entity.activeSubjects.slice(0, 8)
        : [],

      activeEntities: Array.isArray(entity.activeEntities)
        ? entity.activeEntities.slice(0, 8)
        : [],

      confidence: entity.confidence ?? null
    };
  },
    addSemanticFrameFacts(context = {}) {
    const frame = context.semanticFrame || context.thread?.semanticFrame || null;
    if (!frame) return;

    context.semanticFrame = frame;
    context.activeSemanticFrame = frame;

    context.advisoryFacts.unshift({
      type: "semantic_frame",
      claim:
        frame.summary ||
        frame.label ||
        frame.operation ||
        "semantic frame available",
      confidence: frame.confidence ?? frame.frameConfidence ?? 0.86,
      source: frame.source || "semantic_frame",
      raw: frame
    });

    context.activeThreadFacts.unshift({
      type: "semantic_frame",
      claim:
        frame.summary ||
        frame.label ||
        frame.operation ||
        "semantic frame available",
      confidence: frame.confidence ?? frame.frameConfidence ?? 0.86,
      source: frame.source || "semantic_frame",
      raw: frame
    });

    if (frame.operation) {
      context.intentSignals.push({
        category: "intent",
        type: "semantic_operation",
        value: frame.operation,
        evidence: frame.operation,
        confidence: frame.confidence ?? frame.frameConfidence ?? 0.84,
        source: frame.source || "semantic_frame"
      });
    }

    const slots = frame.slots || {};

    if (slots.object) {
      context.activeEntities.push({
        type: "semantic_object",
        claim: this.slotClaim(slots.object),
        confidence: 0.84,
        source: frame.source || "semantic_frame",
        raw: slots.object
      });
    }

    if (slots.goal) {
      context.activeGoals.push({
        type: "semantic_goal",
        claim: this.slotClaim(slots.goal),
        confidence: 0.84,
        source: frame.source || "semantic_frame",
        raw: slots.goal
      });
    }

    if (slots.problem) {
      context.activeProblems.push({
        type: "semantic_problem",
        claim: this.slotClaim(slots.problem),
        confidence: 0.84,
        source: frame.source || "semantic_frame",
        raw: slots.problem
      });
    }

    if (slots.criteria || slots.constraints) {
      const items = []
        .concat(slots.criteria || [])
        .concat(slots.constraints || []);

      items.forEach(item => {
        context.activeConstraints.push({
          type: "semantic_constraint",
          claim: this.slotClaim(item),
          confidence: item?.confidence ?? 0.78,
          source: frame.source || "semantic_frame",
          raw: item
        });
      });
    }

    if (Array.isArray(frame.missingSlots) && frame.missingSlots.length) {
      frame.missingSlots.forEach(slot => {
        context.activeProblems.push({
          type: "missing_semantic_slot",
          claim: `Missing semantic slot: ${slot}`,
          confidence: 0.78,
          source: frame.source || "semantic_frame"
        });
      });
    }
  },

  addActiveSituationFacts(context = {}) {
    const t = context.thread || {};

    const activeSituation =
      t.activeSituation ||
      t.resolvedMeaning?.activeSituation ||
      null;

    const keyFacts =
      Array.isArray(t.keyFacts) && t.keyFacts.length
        ? t.keyFacts
        : Array.isArray(t.resolvedMeaning?.keyFacts)
          ? t.resolvedMeaning.keyFacts
          : [];

    if (activeSituation) {
      context.activeSituation = activeSituation;
      context.activeSituationSource = "thread_understanding";
      context.contextAuthority = "active_situation_first";

      context.advisoryFacts.unshift({
        type: "active_situation",
        claim:
          activeSituation.value ||
          activeSituation.label ||
          activeSituation.evidence ||
          "active situation",
        confidence: activeSituation.confidence ?? t.confidence ?? 0.88,
        source: "thread_understanding",
        raw: activeSituation
      });

      context.activeThreadFacts.unshift({
        type: "active_situation",
        claim:
          activeSituation.value ||
          activeSituation.label ||
          activeSituation.evidence ||
          "active situation",
        confidence: activeSituation.confidence ?? t.confidence ?? 0.88,
        source: "thread_understanding",
        raw: activeSituation
      });
    }

    if (keyFacts.length) {
      context.keyFacts = keyFacts
        .map(fact =>
          typeof fact === "string"
            ? fact
            : fact.claim || fact.value || fact.label || fact.evidence || ""
        )
        .filter(Boolean);

      context.keyFacts.forEach(fact => {
        context.advisoryFacts.unshift({
          type: "key_fact",
          claim: fact,
          confidence: 0.86,
          source: "thread_understanding"
        });

        context.activeThreadFacts.unshift({
          type: "key_fact",
          claim: fact,
          confidence: 0.86,
          source: "thread_understanding"
        });
      });
    }
  },

  addContinuityFacts(context = {}) {
    const c = context.continuity || {};

    if (c.semanticFrame && !context.semanticFrame) {
      context.semanticFrame = c.semanticFrame;
      context.activeSemanticFrame = c.semanticFrame;
    }

    if (c.currentTopic) {
      context.activeThreadFacts.push({
        type: "current_topic",
        claim: `Current topic: ${c.currentTopic}`,
        confidence: 0.85,
        source: "continuity"
      });
    }

    (c.lastMessages || []).slice(-4).forEach(message => {
      const text = typeof message === "string" ? message : message?.text;
      if (!text) return;

      context.activeThreadFacts.push({
        type: "recent_message",
        claim: text,
        confidence: 0.82,
        source: "continuity"
      });
    });

    if (c.followUpDetected) {
      context.advisoryFacts.push({
        type: "follow_up",
        claim: `User appears to be asking a follow-up: ${c.followUpType}.`,
        confidence: 0.78,
        source: "continuity"
      });
    }

    if (c.nextStep) {
      context.advisoryFacts.push({
        type: "next_step",
        claim: c.nextStep,
        confidence: 0.8,
        source: "continuity"
      });
    }

    c.unresolvedItems.forEach(item => {
      context.activeThreadFacts.push({
        type: "unresolved_item",
        claim:
          typeof item === "string"
            ? item
            : item.label || item.kind || item.claim || "unresolved item",
        confidence: item.confidence ?? 0.75,
        source: "continuity",
        raw: item
      });
    });
  },
    addThreadFacts(context = {}) {
    const t = context.thread || {};
    const wc = t.workingContext || {};

    const semanticFrame =
      context.semanticFrame ||
      t.semanticFrame ||
      t.activeSemanticFrame ||
      wc.semanticFrame ||
      wc.activeSemanticFrame ||
      null;

    if (semanticFrame) {
      context.semanticFrame = semanticFrame;
      context.activeSemanticFrame = semanticFrame;
    }

    if (t.activeSubject) {
      context.activeEntities.push({
        type: "active_subject",
        claim:
          t.activeSubject.label ||
          t.activeSubject.evidence ||
          t.activeSubject.value ||
          "active subject",
        confidence: t.activeSubject.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeSubject
      });
    }

    if (t.activeObject) {
      context.activeEntities.push({
        type: "active_object",
        claim:
          t.activeObject.label ||
          t.activeObject.evidence ||
          t.activeObject.value ||
          "active object",
        confidence: t.activeObject.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeObject
      });
    }

    if (t.activeIssue) {
      context.activeProblems.push({
        type: "active_issue",
        claim:
          t.activeIssue.label ||
          t.activeIssue.evidence ||
          t.activeIssue.kind ||
          t.activeIssue.value ||
          "active issue",
        confidence: t.activeIssue.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeIssue
      });
    }

    if (t.activeGoal) {
      context.activeGoals.push({
        type: "active_goal",
        claim:
          t.activeGoal.label ||
          t.activeGoal.evidence ||
          t.activeGoal.kind ||
          t.activeGoal.value ||
          "active goal",
        confidence: t.activeGoal.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeGoal
      });
    }

    (t.activeConstraints || []).forEach(item => {
      context.activeConstraints.push({
        type: "active_constraint",
        claim:
          item.label ||
          item.evidence ||
          item.kind ||
          item.value ||
          "active constraint",
        confidence: item.confidence ?? 0.7,
        source: "thread_understanding",
        raw: item
      });
    });

    (t.activeAttempts || []).forEach(item => {
      context.activeAttempts.push({
        type: "active_attempt",
        claim:
          item.label ||
          item.evidence ||
          item.kind ||
          item.value ||
          "active attempt",
        confidence: item.confidence ?? 0.7,
        source: "thread_understanding",
        raw: item
      });
    });

    (t.unresolvedItems || []).forEach(item => {
      context.activeProblems.push({
        type: "unresolved_item",
        claim:
          item.label ||
          item.evidence ||
          item.kind ||
          item.value ||
          item ||
          "unresolved item",
        confidence: item.confidence ?? 0.7,
        source: "thread_understanding",
        raw: item
      });
    });

    if (t.impliedQuestion?.resolvedText) {
      context.activeThreadFacts.push({
        type: "implied_question",
        claim: t.impliedQuestion.resolvedText,
        confidence: t.impliedQuestion.confidence ?? t.confidence ?? 0.65,
        source: "thread_understanding"
      });
    }

    if (t.resolvedMeaning?.resolvedText) {
      context.activeThreadFacts.push({
        type: "resolved_meaning",
        claim: t.resolvedMeaning.resolvedText,
        confidence: t.resolvedMeaning.confidence ?? t.confidence ?? 0.65,
        source: "thread_understanding"
      });
    }

    if (t.resolvedMeaning?.semanticFrame && !context.semanticFrame) {
      context.semanticFrame = t.resolvedMeaning.semanticFrame;
      context.activeSemanticFrame = t.resolvedMeaning.semanticFrame;
    }

    (t.domainSignals || []).forEach(signal => {
      context.domainSignals.push({
        ...signal,
        source: signal.source || "thread_understanding"
      });
    });

    (t.intentSignals || []).forEach(signal => {
      context.intentSignals.push({
        ...signal,
        source: signal.source || "thread_understanding"
      });
    });

    (wc.timeline || []).slice(-5).forEach(item => {
      if (!item?.text) return;

      context.activeThreadFacts.push({
        type: "recent_message",
        claim: item.text,
        confidence: 0.82,
        source: "thread_working_context"
      });
    });
  },

  addEntityFacts(context = {}) {
    const e = context.entity || {};

    if (e.activeSubject || e.activeEntity) {
      const active = e.activeSubject || e.activeEntity;

      context.activeEntities.push({
        type: "entity_active_subject",
        claim:
          active.surface ||
          active.label ||
          active.evidence ||
          active.value ||
          "active entity",
        confidence: active.confidence ?? e.confidence ?? 0.7,
        source: "entity_reference_resolver",
        raw: active
      });
    }

    e.resolvedReferences.forEach(ref => {
      context.activeThreadFacts.push({
        type: "resolved_reference",
        claim: `${ref.reference || "reference"} -> ${
          ref.resolvedTo?.surface ||
          ref.resolvedTo?.label ||
          ref.resolvedTo?.evidence ||
          ref.resolvedTo?.value ||
          "unresolved"
        }`,
        confidence: ref.confidence ?? 0.6,
        source: ref.source || "entity_reference_resolver",
        raw: ref
      });
    });
  },

  addMemoryFacts(context = {}) {
    const memory = context.memory || {};

    memory.relevantMemories.forEach(memoryItem => {
      context.advisoryFacts.push({
        type: memoryItem.type || "memory",
        claim:
          memoryItem.claim ||
          memoryItem.value ||
          memoryItem.label ||
          memoryItem.evidence ||
          "",
        confidence: memoryItem.confidence ?? null,
        source: memoryItem.source || "memory",
        retrievalScore: memoryItem.retrievalScore ?? null,
        raw: memoryItem
      });
    });

    context.projectContext = {
      ...context.projectContext,
      ...(memory.projectContext || {})
    };

    context.priorDecisions = [
      ...context.priorDecisions,
      ...(memory.priorDecisions || [])
    ];

    context.activeThreadFacts = [
      ...context.activeThreadFacts,
      ...(memory.activeThreadFacts || [])
    ];

    context.conflicts = [
      ...context.conflicts,
      ...(memory.conflicts || [])
    ];
  },

  addRelationshipHints(context = {}) {
    const r = context.relationship || {};

    context.styleHints = {
      communicationStyle: r.communicationStyle,
      depth: r.depth,
      collaborationMode: r.collaborationMode,
      challengeTolerance: r.challengeTolerance,
      technicalComfort: r.technicalComfort,
      preferredFormat: r.preferredFormat,
      stablePreferences: r.stablePreferences
    };

    if (r.activeProjects?.length) {
      context.projectContext.activeProjects = r.activeProjects;
    }

    r.reasons.forEach(reason => {
      context.advisoryFacts.push({
        type: "relationship_style_reason",
        claim: reason,
        confidence: 0.7,
        source: "relationship"
      });
    });
  },
    buildContinuityContext(context = {}) {
  const c = context.continuity || {};
  const hasThreadFacts = Array.isArray(context.activeThreadFacts) && context.activeThreadFacts.length > 0;
  const hasKeyFacts = Array.isArray(context.keyFacts) && context.keyFacts.length > 0;

  return {
    ready: true,
    authority: "context_handoff_to_situation_map",

    shouldUseAsContext:
      Boolean(
        c.shouldReusePriorContext ||
        c.followUpDetected ||
        hasThreadFacts ||
        hasKeyFacts ||
        c.previousAnswerSummary
      ),

    semanticFrame: context.semanticFrame || null,
    activeSemanticFrame: context.activeSemanticFrame || context.semanticFrame || null,

    activeSituation: context.activeSituation || null,
    keyFacts: context.keyFacts || [],
    activeThreadFacts: context.activeThreadFacts || [],

    currentTopic: c.currentTopic || null,
    previousAnswerSummary: c.previousAnswerSummary || null,
    lastMessages: c.lastMessages || [],

    domainSignals: context.domainSignals || [],
    intentSignals: context.intentSignals || [],

    source: "ari-context-assembler"
  };
},

  finalize(context = {}) {
    context.activeThreadFacts = this.uniqueByClaim(context.activeThreadFacts);
    context.advisoryFacts = this.uniqueByClaim(context.advisoryFacts);
    context.activeEntities = this.uniqueByClaim(context.activeEntities);
    context.activeProblems = this.uniqueByClaim(context.activeProblems);
    context.activeGoals = this.uniqueByClaim(context.activeGoals);
    context.activeConstraints = this.uniqueByClaim(context.activeConstraints);
    context.activeAttempts = this.uniqueByClaim(context.activeAttempts);
    context.domainSignals = this.uniqueSignals(context.domainSignals);
    context.intentSignals = this.uniqueSignals(context.intentSignals);

    if (!context.activeSemanticFrame && context.semanticFrame) {
      context.activeSemanticFrame = context.semanticFrame;
    }
  },

stringifyTopic(topic) {
  if (!topic) return null;
  if (typeof topic === "string") return topic;

  return (
    topic.surface ||
    topic.label ||
    topic.value ||
    topic.claim ||
    topic.evidence ||
    null
  );
},

  slotClaim(slot) {
    if (!slot) return "";

    if (typeof slot === "string") return slot;

    if (Array.isArray(slot)) {
      return slot
        .map(item => this.slotClaim(item))
        .filter(Boolean)
        .join(", ");
    }

    return (
      slot.claim ||
      slot.value ||
      slot.label ||
      slot.evidence ||
      slot.text ||
      slot.name ||
      JSON.stringify(slot)
    );
  },

  uniqueByClaim(list = []) {
    const seen = new Set();

    return (list || []).filter(item => {
      const key = `${item.type || ""}:${item.claim || ""}`.toLowerCase();
      if (!item?.claim || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  uniqueSignals(list = []) {
    const seen = new Set();

    return (list || []).filter(item => {
      const key = `${item.category || ""}:${item.type || ""}:${item.value || ""}`.toLowerCase();
      if (!item?.value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

console.log(
  "ARI CONTEXT ASSEMBLER LOADED:",
  window.AriContextAssembler?.version
);