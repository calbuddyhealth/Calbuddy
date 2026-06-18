// ari/continuity/ari-continuity-entry-point.js
// Ari Continuity Entry Point
// Purpose: Start the continuity branch after Lane Splitter routing.
// V1.1.0 — Orchestrator Only / Sends Results To Continuity Packet / No Answer Authority / No Route Authority

window.Ari = window.Ari || {};

window.Ari.continuityEntryPoint = {
  version: "1.1.0",

  enter(input = {}) {
    const summary = input.summary || input || {};
    const laneSplit = input.laneSplit || summary.laneSplit || {};
    const routing = laneSplit.routing || {};

    const shouldRun =
      routing.useThread ||
      routing.useMemory ||
      routing.useRelationship;

    if (!shouldRun) {
      return this.emptyContinuityResults({
        reason: "direct_route_no_continuity_needed",
        summary,
        laneSplit
      });
    }

    const continuityResults = this.createBaseResults({
      summary,
      laneSplit
    });

    if (routing.useThread) {
      continuityResults.outputs.thread = this.runThreadUnderstanding(summary);
      continuityResults.used.thread = this.outputSucceeded(
        continuityResults.outputs.thread
      );
    }

    if (routing.useMemory) {
      continuityResults.outputs.memory = this.runMemory(summary);
      continuityResults.used.memory = this.outputSucceeded(
        continuityResults.outputs.memory
      );
    }

    if (routing.useRelationship) {
      continuityResults.outputs.relationship = this.runRelationship(summary);
      continuityResults.used.relationship = this.outputSucceeded(
        continuityResults.outputs.relationship
      );
    }

    continuityResults.warnings = this.collectWarnings(continuityResults);
    continuityResults.confidence = this.estimateConfidence(continuityResults);

    return continuityResults;
  },

  createBaseResults({ summary, laneSplit }) {
    return {
      engine: "ari-continuity-entry-point",
      version: this.version,
      source: "ari-continuity-entry-point",

      ran: true,
      reason: "continuity_route_selected",

      lane: laneSplit.lane || "unknown",

      currentTurn: {
        text: this.extractCurrentQuestion(summary),
        lane: laneSplit.lane || null,
        needsPriorContext: laneSplit.lane !== "direct_current_turn"
      },

      routing: {
        useThread: !!laneSplit.routing?.useThread,
        useMemory: !!laneSplit.routing?.useMemory,
        useRelationship: !!laneSplit.routing?.useRelationship,
        goStraightToSituationMap: !!laneSplit.routing?.goStraightToSituationMap
      },

      used: {
        thread: false,
        memory: false,
        relationship: false
      },

      outputs: {
        thread: null,
        memory: null,
        relationship: null
      },

      warnings: [],
      confidence: "low",

      handoff: {
        nextEngine: "ari-continuity-packet",
        expectedMethod: "build",
        shouldBuildPacket: true
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetPriority: false,
        role: "continuity_orchestration_only"
      }
    };
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

  outputSucceeded(output) {
    if (!output) return false;
    if (output.error) return false;
    if (output.ran === false) return false;
    return true;
  },

  collectWarnings(results) {
    const warnings = [];

    Object.entries(results.outputs || {}).forEach(([key, output]) => {
      if (!output) return;

      if (output.error) {
        warnings.push({
          type: "engine_error",
          engine: key,
          error: output.error,
          message: output.message || null
        });
      }

      if (output.ran === false && output.error) {
        warnings.push({
          type: "engine_not_run",
          engine: key,
          reason: output.error
        });
      }
    });

    return warnings;
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

  estimateConfidence(results) {
    let score = 0;

    if (results.used.thread) score += 40;
    if (results.used.memory) score += 25;
    if (results.used.relationship) score += 20;

    if (results.currentTurn?.text) score += 10;

    if ((results.warnings || []).length === 0) score += 5;

    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  },

  emptyContinuityResults({ reason = "not_needed", summary = {}, laneSplit = {} } = {}) {
    return {
      engine: "ari-continuity-entry-point",
      version: this.version,
      source: "ari-continuity-entry-point",

      ran: false,
      reason,

      lane: laneSplit.lane || "direct_current_turn",

      currentTurn: {
        text: this.extractCurrentQuestion(summary),
        lane: laneSplit.lane || "direct_current_turn",
        needsPriorContext: false
      },

      routing: {
        useThread: false,
        useMemory: false,
        useRelationship: false,
        goStraightToSituationMap: true
      },

      used: {
        thread: false,
        memory: false,
        relationship: false
      },

      outputs: {
        thread: null,
        memory: null,
        relationship: null
      },

      warnings: [],
      confidence: "none",

      handoff: {
        nextEngine: "ari-continuity-packet",
        expectedMethod: "build",
        shouldBuildPacket: false
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetPriority: false,
        role: "continuity_orchestration_only"
      }
    };
  }
};

console.log(
  "ARI CONTINUITY ENTRY POINT LOADED:",
  window.Ari.continuityEntryPoint?.version
);