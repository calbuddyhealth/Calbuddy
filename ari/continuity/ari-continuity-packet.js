// ari/continuity/ari-continuity-packet.js
// Ari Continuity Packet
// Purpose: Build official continuity handoff object for Situation Map.
// V1.1.0 — Preserves active subject from threadState / prevents follow-up subject loss

window.Ari = window.Ari || {};

window.Ari.continuityPacket = {
  version: "1.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const continuityResults = input.continuityResults || summary.continuityResults || {};
    const laneSplit = input.laneSplit || summary.laneSplit || {};
    const outputs = continuityResults.outputs || {};

    const thread = outputs.thread || null;
    const memory = outputs.memory || null;
    const relationship = outputs.relationship || null;

    const currentTurn = this.buildCurrentTurn({ summary, continuityResults, laneSplit });
    const activeThread = this.buildActiveThread(thread, summary);
    const usableFacts = this.buildUsableFacts({ summary, thread, memory, relationship, activeThread });
    const unresolvedReferences = this.buildUnresolvedReferences({ thread, memory, relationship });
    const sourceTrace = this.buildSourceTrace({ continuityResults, laneSplit, thread, memory, relationship });

    return {
      engine: "ari-continuity-packet",
      version: this.version,
      source: "ari-continuity-packet",

      ran: !!continuityResults.ran,
      reason: continuityResults.reason || null,

      continuityType: continuityResults.lane || laneSplit.lane || "unknown",
      currentTurn,
      activeThread,

      referencedContext: {
        threadUsed: !!continuityResults.used?.thread,
        memoryUsed: !!continuityResults.used?.memory,
        relationshipUsed: !!continuityResults.used?.relationship
      },

      usableFacts,
      usableFactCount: usableFacts.length,

      unresolvedReferences,
      unresolvedReferenceCount: unresolvedReferences.length,

      warnings: continuityResults.warnings || [],
      sourceTrace,

      confidence: this.estimateConfidence({
        continuityResults,
        usableFacts,
        unresolvedReferences,
        activeThread
      }),

      situationMapHandoff: {
        ready: true,
        shouldUseAsContext: !!continuityResults.ran && laneSplit.lane !== "direct_current_turn",
        preferredPlacement: "continuityContext"
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetPriority: false,
        role: "continuity_context_handoff_only"
      }
    };
  },

  buildCurrentTurn({ summary, continuityResults, laneSplit }) {
    const text = String(
      continuityResults.currentTurn?.text ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();

    return {
      text,
      lane: continuityResults.currentTurn?.lane || laneSplit.lane || null,
      needsPriorContext:
        continuityResults.currentTurn?.needsPriorContext ??
        laneSplit.lane !== "direct_current_turn"
    };
  },

  buildActiveThread(thread, summary = {}) {
    const threadState = summary.threadState || {};
    const workingContext = thread?.workingContext || thread?.reconstructedContext || null;

    const activeSubject =
      this.extractSubject(thread?.activeSubject) ||
      this.extractSubject(workingContext?.activeSubject) ||
      this.extractSubject(threadState.activeSubject) ||
      this.extractSubject(summary.activeSubject) ||
      null;

    const activeTopic =
      activeSubject ||
      this.extractSubject(thread?.activeTopic) ||
      this.extractSubject(workingContext?.activeTopic) ||
      this.extractSubject(thread?.threadTopic) ||
      this.extractSubject(threadState.currentTopic) ||
      this.extractSubject(summary.activeTopic) ||
      null;

    return {
      activeTopic,
      activeSubject,
      workingContext,
      threadAvailable: Boolean(thread || threadState?.lastMessages?.length || activeSubject || activeTopic)
    };
  },

  buildUsableFacts({ summary, thread, memory, relationship, activeThread }) {
    const facts = [];

    if (activeThread?.activeSubject) {
      facts.push({
        source: "thread",
        index: 0,
        fact: {
          type: "active_subject",
          claim: `Active subject: ${activeThread.activeSubject}`,
          value: activeThread.activeSubject,
          confidence: 0.9,
          source: "ari-continuity-packet"
        },
        confidence: 0.9,
        usableBySituationMap: true
      });
    }

    this.addFacts(facts, "thread", this.extractThreadFacts(thread));
    this.addFacts(facts, "memory", this.extractMemoryFacts(memory));
    this.addFacts(facts, "relationship", this.extractRelationshipFacts(relationship));

    return facts;
  },

  extractThreadFacts(thread) {
    if (!thread) return [];

    return this.arrayFrom(
      thread.usableThreadFacts ||
      thread.threadFacts ||
      thread.facts ||
      thread.reconstructedContext?.facts ||
      thread.workingContext?.facts
    );
  },

  extractMemoryFacts(memory) {
    if (!memory) return [];

    return this.arrayFrom(
      memory.usableMemoryFacts ||
      memory.memoryFacts ||
      memory.items ||
      memory.relevantMemories ||
      memory.facts
    );
  },

  extractRelationshipFacts(relationship) {
    if (!relationship) return [];

    return this.arrayFrom(
      relationship.usableRelationshipFacts ||
      relationship.relationshipFacts ||
      relationship.facts ||
      relationship.context
    );
  },

  addFacts(target, source, facts = []) {
    facts.forEach((fact, index) => {
      target.push({
        source,
        index,
        fact,
        confidence: this.extractFactConfidence(fact),
        usableBySituationMap: true
      });
    });
  },

  extractFactConfidence(fact) {
    if (fact && typeof fact === "object" && fact.confidence !== undefined) {
      return fact.confidence;
    }

    return null;
  },

  buildUnresolvedReferences({ thread, memory, relationship }) {
    return [
      ...this.tagRefs("thread", this.extractUnresolved(thread)),
      ...this.tagRefs("memory", this.extractUnresolved(memory)),
      ...this.tagRefs("relationship", this.extractUnresolved(relationship))
    ];
  },

  extractUnresolved(output) {
    if (!output) return [];

    return this.arrayFrom(
      output.unresolvedReferences ||
      output.unresolvedContext ||
      output.uncertainties ||
      output.missingContext
    );
  },

  tagRefs(source, refs = []) {
    return refs.map((reference, index) => ({
      source,
      index,
      reference
    }));
  },

  buildSourceTrace({ continuityResults, laneSplit, thread, memory, relationship }) {
    return {
      continuityEntryPoint: {
        ran: !!continuityResults.ran,
        version: continuityResults.version || null,
        source: continuityResults.source || null
      },

      laneSplitter: {
        lane: laneSplit.lane || continuityResults.lane || null,
        confidence: laneSplit.confidence || null,
        source: laneSplit.source || null
      },

      engines: {
        thread: this.engineTrace(thread),
        memory: this.engineTrace(memory),
        relationship: this.engineTrace(relationship)
      }
    };
  },

  engineTrace(output) {
    if (!output) {
      return {
        ran: false,
        source: null,
        version: null,
        error: null
      };
    }

    return {
      ran: output.ran !== false && !output.error,
      source: output.source || output.engine || null,
      version: output.version || null,
      error: output.error || null
    };
  },

  estimateConfidence({ continuityResults, usableFacts, unresolvedReferences, activeThread }) {
    let score = 0;

    if (continuityResults.ran) score += 25;
    if (activeThread?.activeTopic) score += 20;
    if (activeThread?.activeSubject) score += 25;
    if (usableFacts.length > 0) score += 25;
    if (unresolvedReferences.length === 0) score += 15;
    if ((continuityResults.warnings || []).length === 0) score += 10;

    if (score >= 75) return "high";
    if (score >= 45) return "medium";
    return "low";
  },

  extractSubject(value) {
    if (!value) return null;

    if (typeof value === "string") {
      const clean = value.trim();
      if (!clean || clean === "follow_up_context_available") return null;
      return clean;
    }

    if (typeof value === "object") {
      return (
        value.surface ||
        value.name ||
        value.label ||
        value.value ||
        value.claim ||
        value.evidence ||
        null
      );
    }

    return String(value || "").trim() || null;
  },

  arrayFrom(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  }
};

console.log(
  "ARI CONTINUITY PACKET LOADED:",
  window.Ari.continuityPacket?.version
);