// ari/memory-system/ari-memory-engine.js
// Ari Memory Engine
// Purpose: Classify potential memories by type and importance.

window.Ari = window.Ari || {};

window.Ari.memoryEngine = {
  version: "1.0.0",

  memoryTypes: [
    "identity",
    "preference",
    "journey",
    "relationship",
    "reflection",
    "story"
  ],

  importanceLevels: [
    "temporary",
    "session",
    "longTerm",
    "sacred"
  ],

  classify(message = "", context = {}) {
    const text = String(message || "").toLowerCase();

    const result = {
      shouldRemember: false,
      memoryType: "temporary",
      importance: "temporary",
      reason: "No meaningful memory detected.",
      source: "ari-memory-engine"
    };

    if (!text.trim()) return result;

    if (
      text.includes("remember") ||
      text.includes("from now on") ||
      text.includes("going forward")
    ) {
      return {
        shouldRemember: true,
        memoryType: "preference",
        importance: "longTerm",
        reason: "User explicitly requested memory or future preference.",
        source: "ari-memory-engine"
      };
    }

    if (
      text.includes("i am") ||
      text.includes("i'm") ||
      text.includes("my name") ||
      text.includes("my wife") ||
      text.includes("my daughter") ||
      text.includes("my son")
    ) {
      return {
        shouldRemember: true,
        memoryType: "identity",
        importance: "longTerm",
        reason: "Identity or important relationship information detected.",
        source: "ari-memory-engine"
      };
    }

    if (
      text.includes("milestone") ||
      text.includes("passed") ||
      text.includes("graduated") ||
      text.includes("got married") ||
      text.includes("baby was born") ||
      text.includes("rebirth")
    ) {
      return {
        shouldRemember: true,
        memoryType: "story",
        importance: "sacred",
        reason: "Meaningful milestone or story event detected.",
        source: "ari-memory-engine"
      };
    }

    if (
      text.includes("i learned") ||
      text.includes("i realized") ||
      text.includes("this means") ||
      text.includes("i discovered")
    ) {
      return {
        shouldRemember: true,
        memoryType: "reflection",
        importance: "longTerm",
        reason: "Reflection or lesson detected.",
        source: "ari-memory-engine"
      };
    }

    return result;
  },

  shouldForget(memory = {}) {
    if (!memory) return true;

    if (memory.importance === "temporary") return true;

    if (memory.expired === true) return true;

    if (memory.userRequestedForget === true) return true;

    return false;
  }
};