// ari/context/ari-context-assembler.js
// Ari Context Assembler
// Purpose: Safely assemble continuity, memory, relationship, thread, and entity context.
// V1.1.0

window.Ari = window.Ari || {};

window.AriContextAssembler = {
  version: "1.1.0",

  assemble(input = {}) {
    const summary = input.summary || input || {};

    const continuity =
      summary.continuityState ||
      summary.conversationContinuity ||
      summary.threadState ||
      {};

    const memoryContext = summary.memoryContext || {};
    const relationshipProfile = summary.relationshipProfile || {};
    const thread = summary.threadUnderstanding || {};
    const entity = summary.entityReference || summary.entityReferenceState || {};

    const assembledContext = {
      contextAssemblerRan: true,
      contextAssemblerVersion: this.version,
      contextAssemblerSource: "ari-context-assembler",

      continuity: this.cleanContinuity(continuity),
      memory: this.cleanMemory(memoryContext),
      relationship: this.cleanRelationship(relationshipProfile),
      thread: this.cleanThread(thread),
      entity: this.cleanEntity(entity),

      advisoryFacts: [],
      styleHints: {},
      projectContext: {},
      priorDecisions: [],
      activeThreadFacts: [],
      activeEntities: [],
      activeProblems: [],
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
        "medicalEscalation"
      ]
    };

    this.addContinuityFacts(assembledContext);
    this.addThreadFacts(assembledContext);
    this.addEntityFacts(assembledContext);
    this.addMemoryFacts(assembledContext);
    this.addRelationshipHints(assembledContext);

    return {
      contextAssemblerRan: true,
      contextAssemblerVersion: this.version,
      contextAssemblerSource: "ari-context-assembler",

      assembledContext,
      advisoryContext: assembledContext,

      advisoryFacts: assembledContext.advisoryFacts,
      styleHints: assembledContext.styleHints,
      projectContext: assembledContext.projectContext,
      priorDecisions: assembledContext.priorDecisions,
      activeThreadFacts: assembledContext.activeThreadFacts,
      activeEntities: assembledContext.activeEntities,
      activeProblems: assembledContext.activeProblems,
      contextConflicts: assembledContext.conflicts,

      authority: "advisory_context_only"
    };
  },

  cleanContinuity(continuity = {}) {
    return {
      currentTopic: continuity.currentTopic || null,
      previousTopic: continuity.previousTopic || null,
      followUpDetected: Boolean(continuity.followUpDetected),
      followUpType: continuity.followUpType || "none",
      shouldReusePriorContext: Boolean(continuity.shouldReusePriorContext),
      unresolvedItems: Array.isArray(continuity.unresolvedItems)
        ? continuity.unresolvedItems.slice(0, 8)
        : [],
      nextStep: continuity.nextStep || null,
      previousAnswerSummary: continuity.previousAnswerSummary || null,
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
    return {
      domain: thread.domain || null,
      laneHint: thread.laneHint || null,
      confidence: thread.confidence ?? null,
      activeSubject: thread.activeSubject || null,
      activeIssue: thread.activeIssue || null,
      activeProblem: thread.activeProblem || null,
      impliedQuestion: thread.impliedQuestion || null,
      resolvedMeaning: thread.resolvedMeaning || null,
      workingContext: thread.workingContext || null,
      continuityUsed: Boolean(thread.continuityUsed)
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

  addContinuityFacts(context = {}) {
    const c = context.continuity || {};

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
        claim: item,
        confidence: 0.75,
        source: "continuity"
      });
    });
  },

  addThreadFacts(context = {}) {
    const t = context.thread || {};
    const wc = t.workingContext || {};

    if (t.domain) {
      context.activeThreadFacts.push({
        type: "thread_domain",
        claim: t.domain,
        confidence: t.confidence ?? 0.7,
        source: "thread_understanding"
      });
    }

    if (t.laneHint) {
      context.activeThreadFacts.push({
        type: "thread_lane_hint",
        claim: t.laneHint,
        confidence: t.confidence ?? 0.7,
        source: "thread_understanding"
      });
    }

    if (t.activeSubject) {
      context.activeEntities.push({
        type: "active_subject",
        claim: t.activeSubject.label || t.activeSubject.evidence || "active subject",
        confidence: t.activeSubject.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeSubject
      });
    }

    if (t.activeIssue) {
      context.activeProblems.push({
        type: "active_issue",
        claim: t.activeIssue.label || t.activeIssue.evidence || t.activeIssue.type || "active issue",
        confidence: t.activeIssue.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeIssue
      });
    }

    if (t.activeProblem) {
      context.activeProblems.push({
        type: "active_problem",
        claim: t.activeProblem.label || t.activeProblem.evidence || t.activeProblem.type || "active problem",
        confidence: t.activeProblem.confidence ?? t.confidence ?? 0.7,
        source: "thread_understanding",
        raw: t.activeProblem
      });
    }

    if (t.impliedQuestion?.resolvedText) {
      context.activeThreadFacts.push({
        type: "implied_question",
        claim: t.impliedQuestion.resolvedText,
        confidence: t.impliedQuestion.confidence ?? t.confidence ?? 0.65,
        source: "thread_understanding"
      });
    }

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
        claim: active.surface || active.label || active.evidence || "active entity",
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
          "unresolved"
        }`,
        confidence: ref.confidence ?? 0.6,
        source: ref.source || "entity_reference_resolver"
      });
    });
  },

  addMemoryFacts(context = {}) {
    const memory = context.memory || {};

    memory.relevantMemories.forEach(memoryItem => {
      context.advisoryFacts.push({
        type: memoryItem.type || "memory",
        claim: memoryItem.claim,
        confidence: memoryItem.confidence ?? null,
        source: memoryItem.source || "memory",
        retrievalScore: memoryItem.retrievalScore ?? null
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
  }
};

console.log(
  "ARI CONTEXT ASSEMBLER LOADED:",
  window.AriContextAssembler?.version
);