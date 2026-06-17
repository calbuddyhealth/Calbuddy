// ari/context/ari-context-assembler.js
// Ari Context Assembler
// Purpose: Safely assemble continuity, memory, and relationship context.
// V1.0.0

window.Ari = window.Ari || {};

window.AriContextAssembler = {
  version: "1.0.0",

  assemble(input = {}) {
    const summary = input.summary || input || {};

    const continuity =
      summary.continuityState ||
      summary.conversationContinuity ||
      summary.threadState ||
      {};

    const memoryContext =
      summary.memoryContext ||
      {};

    const relationshipProfile =
      summary.relationshipProfile ||
      {};

    const assembledContext = {
      contextAssemblerRan: true,
      contextAssemblerVersion: this.version,
      contextAssemblerSource: "ari-context-assembler",

      continuity: this.cleanContinuity(continuity),
      memory: this.cleanMemory(memoryContext),
      relationship: this.cleanRelationship(relationshipProfile),

      advisoryFacts: [],
      styleHints: {},
      projectContext: {},
      priorDecisions: [],
      activeThreadFacts: [],
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
      previousAnswerSummary: continuity.previousAnswerSummary || null
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