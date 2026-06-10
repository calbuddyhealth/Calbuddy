// ari/memory-system/ari-memory-engine.js
// Ari Memory Engine
// Purpose: Classify potential memories by type, importance, stability, and meaning.
// V2: Remember less. Remember better.

window.Ari = window.Ari || {};

window.Ari.memoryEngine = {
  version: "2.0.0",

  classify(message = "", context = {}) {
    const text = String(message || "").toLowerCase().trim();
    const observation = context.observation || {};
    const attention = context.attention || {};
    const memorySignals = observation.memory || {};
    const emotionSignals = observation.emotion || {};

    const base = {
      shouldRemember: false,
      memoryType: "temporary",
      importance: "temporary",
      stability: "temporary",
      confidence: "low",
      reason: "No stable memory signal detected.",
      source: "ari-memory-engine"
    };

    if (!text) return base;

    const has = (phrases = []) => phrases.some((p) => text.includes(p));

    const temporaryEmotion =
      emotionSignals.isTemporaryEmotion ||
      has([
        "i feel",
        "i'm feeling",
        "i am feeling",
        "today",
        "right now",
        "tonight",
        "this morning",
        "this afternoon"
      ]);

    const explicitMemory = memorySignals.explicitMemoryIntent;

    const preference =
      memorySignals.preferenceSignal ||
      has([
        "i prefer",
        "i value",
        "direct feedback",
        "don't sugarcoat",
        "no sugarcoating",
        "be blunt",
        "be gentle",
        "talk to me"
      ]);

    const identity =
      memorySignals.identitySignal ||
      has([
        "my name is",
        "call me",
        "i go by",
        "i am a nurse",
        "i'm a nurse",
        "i work as",
        "my job is"
      ]);

    const journey =
      memorySignals.journeySignal ||
      has([
        "i want to become",
        "i am trying to become",
        "i'm trying to become",
        "my goal is",
        "pmhnp journey",
        "leaving the navy",
        "becoming a father",
        "planning a wedding",
        "building ari rebirth"
      ]);

    const milestone =
      memorySignals.milestoneSignal &&
      has([
        "i passed",
        "i graduated",
        "got married",
        "baby was born",
        "daughter was born",
        "son was born",
        "ari was born"
      ]);

    const reflection =
      memorySignals.reflectionSignal ||
      has([
        "i learned that",
        "i realized that",
        "this taught me",
        "what i learned"
      ]);

    if (temporaryEmotion && !explicitMemory) {
      return {
        ...base,
        shouldRemember: false,
        memoryType: "temporary",
        importance: "session",
        stability: "temporary",
        confidence: "medium",
        reason: "Temporary emotional state detected. Do not store as long-term memory."
      };
    }

    if (explicitMemory && preference) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "preference",
        importance: "longTerm",
        stability: "stable",
        confidence: "high",
        reason: "User explicitly requested memory of a stable preference."
      };
    }

    if (identity) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "identity",
        importance: "longTerm",
        stability: "stable",
        confidence: "high",
        reason: "Stable identity information detected."
      };
    }

    if (milestone) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "story",
        importance: "sacred",
        stability: "stable",
        confidence: "high",
        reason: "Major milestone detected."
      };
    }

    if (journey) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "journey",
        importance: "longTerm",
        stability: "developing",
        confidence: "medium",
        reason: "Long-term journey or life transition detected."
      };
    }

    if (reflection) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "reflection",
        importance: "longTerm",
        stability: "stable",
        confidence: "medium",
        reason: "Reflection or lesson detected."
      };
    }

    if (explicitMemory) {
      return {
        ...base,
        shouldRemember: true,
        memoryType: "reflection",
        importance: "longTerm",
        stability: "unknown",
        confidence: "medium",
        reason: "User explicitly requested memory, but type is unclear."
      };
    }

    return base;
  },

  shouldForget(memory = {}) {
    if (!memory) return true;
    if (memory.forgetRequest === true) return true;
    if (memory.importance === "temporary") return true;
    if (memory.expired === true) return true;
    if (memory.userRequestedForget === true) return true;
    return false;
  }
};