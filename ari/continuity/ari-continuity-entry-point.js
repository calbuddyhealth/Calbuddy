// ari/continuity/ari-continuity-entry-point.js
// Ari Continuity Entry Point
// Purpose: Start the continuity branch after Lane Splitter routing.
// V1.0.0 — Orchestrator Only / No Answer Authority / No Route Authority

window.Ari = window.Ari || {};

window.Ari.continuityEntryPoint = {
  version: "1.0.0",

  enter(input = {}) {
    const summary = input.summary || input || {};
    const laneSplit = input.laneSplit || summary.laneSplit || {};

    const routing = laneSplit.routing || {};

    const shouldRun =
      routing.useThread ||
      routing.useMemory ||
      routing.useRelationship;

    if (!shouldRun) {
      return this.emptyPacket("direct_route_no_continuity_needed");
    }

    const packet = {
      engine: "ari-continuity-entry-point",
      version: this.version,
      source: "ari-continuity-entry-point",

      lane: laneSplit.lane || "unknown",

      ran: true,

      used: {
        thread: false,
        memory: false,
        relationship: false
      },

      thread: null,
      memory: null,
      relationship: null,

      activeTopic: null,
      currentQuestion: this.extractCurrentQuestion(summary),
      usableThreadFacts: [],
      usableMemoryFacts: [],
      usableRelationshipFacts: [],
      unresolvedReferences: [],
      continuityWarnings: [],

      confidence: "low",

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "continuity_orchestration_only"
      }
    };

    if (routing.useThread) {
      packet.thread = this.runThreadUnderstanding(summary);
      packet.used.thread = !!packet.thread;
    }

    if (routing.useMemory) {
      packet.memory = this.runMemory(summary);
      packet.used.memory = !!packet.memory;
    }

    if (routing.useRelationship) {
      packet.relationship = this.runRelationship(summary);
      packet.used.relationship = !!packet.relationship;
    }

    this.mergeThread(packet);
    this.mergeMemory(packet);
    this.mergeRelationship(packet);

    packet.confidence = this.estimateConfidence(packet);

    return packet;
  },

  runThreadUnderstanding(summary) {
    const engine =
      window.Ari.threadUnderstandingEngine ||
      window.AriThreadUnderstandingEngine ||
      null;

    if (!engine) {
      return {
        ran: false,
        error: "thread_understanding_engine_not_found"
      };
    }

    try {
      if (typeof engine.understand === "function") {
        return engine.understand(summary);
      }

      if (typeof engine.analyze === "function") {
        return engine.analyze(summary);
      }

      return {
        ran: false,
        error: "thread_engine_has_no_supported_method"
      };
    } catch (error) {
      return {
        ran: false,
        error: "thread_engine_failed",
        message: error?.message || String(error)
      };
    }
  },

  runMemory(summary) {
    const engine =
      window.Ari.memoryEngine ||
      window.AriMemoryEngine ||
      null;

    if (!engine) {
      return {
        ran: false,
        error: "memory_engine_not_found"
      };
    }

    try {
      if (typeof engine.retrieve === "function") {
        return engine.retrieve(summary);
      }

      if (typeof engine.recall === "function") {
        return engine.recall(summary);
      }

      if (typeof engine.getRelevant === "function") {
        return engine.getRelevant(summary);
      }

      return {
        ran: false,
        error: "memory_engine_has_no_supported_method"
      };
    } catch (error) {
      return {
        ran: false,
        error: "memory_engine_failed",
        message: error?.message || String(error)
      };
    }
  },

  runRelationship(summary) {
    const engine =
      window.Ari.relationshipEngine ||
      window.AriRelationshipEngine ||
      null;

    if (!engine) {
      return {
        ran: false,
        error: "relationship_engine_not_found"
      };
    }

    try {
      if (typeof engine.understand === "function") {
        return engine.understand(summary);
      }

      if (typeof engine.analyze === "function") {
        return engine.analyze(summary);
      }

      return {
        ran: false,
        error: "relationship_engine_has_no_supported_method"
      };
    } catch (error) {
      return {
        ran: false,
        error: "relationship_engine_failed",
        message: error?.message || String(error)
      };
    }
  },

  mergeThread(packet) {
    const thread = packet.thread || {};

    packet.activeTopic =
      thread.activeTopic ||
      thread.workingContext?.activeTopic ||
      thread.threadTopic ||
      packet.activeTopic;

    packet.usableThreadFacts = this.arrayFrom(
      thread.usableThreadFacts ||
      thread.threadFacts ||
      thread.reconstructedContext?.facts ||
      thread.workingContext?.facts
    );

    packet.unresolvedReferences.push(
      ...this.arrayFrom(
        thread.unresolvedReferences ||
        thread.unresolvedContext ||
        thread.uncertainties
      )
    );
  },

  mergeMemory(packet) {
    const memory = packet.memory || {};

    packet.usableMemoryFacts = this.arrayFrom(
      memory.usableMemoryFacts ||
      memory.memoryFacts ||
      memory.items ||
      memory.relevantMemories
    );
  },

  mergeRelationship(packet) {
    const relationship = packet.relationship || {};

    packet.usableRelationshipFacts = this.arrayFrom(
      relationship.usableRelationshipFacts ||
      relationship.relationshipFacts ||
      relationship.facts ||
      relationship.context
    );
  },

  extractCurrentQuestion(summary) {
    return String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  estimateConfidence(packet) {
    let score = 0;

    if (packet.used.thread) score += 35;
    if (packet.used.memory) score += 25;
    if (packet.used.relationship) score += 20;
    if (packet.activeTopic) score += 10;

    const totalFacts =
      packet.usableThreadFacts.length +
      packet.usableMemoryFacts.length +
      packet.usableRelationshipFacts.length;

    if (totalFacts > 0) score += 10;

    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  },

  emptyPacket(reason = "not_needed") {
    return {
      engine: "ari-continuity-entry-point",
      version: this.version,
      source: "ari-continuity-entry-point",

      ran: false,
      reason,

      used: {
        thread: false,
        memory: false,
        relationship: false
      },

      activeTopic: null,
      currentQuestion: null,
      usableThreadFacts: [],
      usableMemoryFacts: [],
      usableRelationshipFacts: [],
      unresolvedReferences: [],
      continuityWarnings: [],
      confidence: "none",

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "continuity_orchestration_only"
      }
    };
  },

  arrayFrom(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  }
};

console.log(
  "ARI CONTINUITY ENTRY POINT LOADED:",
  window.Ari.continuityEntryPoint?.version
);