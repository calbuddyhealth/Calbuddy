// ari/memory-system/ari-memory-engine.js
// Ari Memory Engine
// Purpose: Classify potential memories by type, importance, stability, and meaning.
// V3.0
// Upgrade:
// - Remember less, remember better.
// - Adds memory categories for preferences, identity, journey, milestone, relationship, project, values, and lessons.
// - Adds safety guards against temporary emotions.
// - Adds confidence, lifespan, update behavior, and memory key.
// - Designed for future Owner Brain + Language Memory.

window.Ari = window.Ari || {};

window.Ari.memoryEngine = {
  version: "3.0.0",

  classify(message = "", context = {}) {
    const rawText = String(message || "").trim();
    const text = rawText.toLowerCase();

    const observation = context.observation || {};
    const attention = context.attention || {};
    const memorySignals = observation.memory || {};
    const emotionSignals = observation.emotion || {};

    const base = this.base();

    if (!text) return base;

    const explicitMemory =
      memorySignals.explicitMemoryIntent ||
      this.has(text, [
        "remember that",
        "remember this",
        "save this",
        "store this",
        "add this to memory",
        "don't forget",
        "keep this in mind",
        "from now on"
      ]);

    const forgetRequest =
      this.has(text, [
        "forget that",
        "forget this",
        "delete that memory",
        "remove that memory",
        "don't remember that anymore",
        "stop remembering"
      ]);

    if (forgetRequest) {
      return {
        ...base,
        shouldRemember: false,
        shouldForget: true,
        memoryType: "forget_request",
        importance: "user_controlled",
        stability: "stable",
        confidence: "high",
        reason: "User requested forgetting or memory removal.",
        memoryKey: "forget_request",
        source: "ari-memory-engine"
      };
    }

    const temporaryEmotion = this.isTemporaryEmotion(text, emotionSignals);

    if (temporaryEmotion && !explicitMemory) {
      return {
        ...base,
        shouldRemember: false,
        memoryType: "temporary_emotion",
        importance: "session",
        stability: "temporary",
        confidence: "high",
        lifespan: "session_only",
        reason: "Temporary emotional state detected. Do not store as long-term memory."
      };
    }

    const candidates = [];

    this.addPreferenceCandidate(candidates, text, explicitMemory, memorySignals);
    this.addIdentityCandidate(candidates, text, explicitMemory, memorySignals);
    this.addJourneyCandidate(candidates, text, explicitMemory, memorySignals);
    this.addMilestoneCandidate(candidates, text, explicitMemory, memorySignals);
    this.addProjectCandidate(candidates, text, explicitMemory, memorySignals);
    this.addRelationshipCandidate(candidates, text, explicitMemory, memorySignals);
    this.addValuesCandidate(candidates, text, explicitMemory, memorySignals);
    this.addReflectionCandidate(candidates, text, explicitMemory, memorySignals);
    this.addLanguageMemoryCandidate(candidates, text, explicitMemory, memorySignals);

    if (!candidates.length && explicitMemory) {
      candidates.push(this.candidate({
        shouldRemember: true,
        memoryType: "user_requested_memory",
        importance: "longTerm",
        stability: "unknown",
        confidence: "medium",
        lifespan: "until_changed",
        updateBehavior: "append_or_clarify",
        memoryKey: "explicit_user_memory",
        reason: "User explicitly requested memory, but type is unclear."
      }));
    }

    if (!candidates.length) return base;

    candidates.sort((a, b) => {
      const importanceRank = this.importanceRank(b.importance) - this.importanceRank(a.importance);
      if (importanceRank !== 0) return importanceRank;

      const confidenceRank = this.confidenceRank(b.confidence) - this.confidenceRank(a.confidence);
      if (confidenceRank !== 0) return confidenceRank;

      return this.stabilityRank(b.stability) - this.stabilityRank(a.stability);
    });

    return {
      ...base,
      ...candidates[0],
      source: "ari-memory-engine"
    };
  },

  base() {
    return {
      shouldRemember: false,
      shouldForget: false,
      memoryType: "temporary",
      importance: "temporary",
      stability: "temporary",
      confidence: "low",
      lifespan: "none",
      updateBehavior: "ignore",
      memoryKey: null,
      reason: "No stable memory signal detected.",
      source: "ari-memory-engine"
    };
  },

  candidate(data = {}) {
    return {
      shouldRemember: Boolean(data.shouldRemember),
      memoryType: data.memoryType || "unknown",
      importance: data.importance || "temporary",
      stability: data.stability || "temporary",
      confidence: data.confidence || "low",
      lifespan: data.lifespan || "unknown",
      updateBehavior: data.updateBehavior || "append_or_clarify",
      memoryKey: data.memoryKey || data.memoryType || "unknown",
      reason: data.reason || "Memory candidate detected."
    };
  },

  addPreferenceCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      memorySignals.preferenceSignal ||
      this.has(text, [
        "i prefer",
        "i like when you",
        "i don't like when you",
        "talk to me",
        "be blunt",
        "be direct",
        "don't sugarcoat",
        "no sugarcoating",
        "be gentle",
        "be concise",
        "explain more",
        "less detail",
        "call me",
        "use male energy",
        "use humor"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "preference",
      importance: explicitMemory ? "longTerm" : "mediumTerm",
      stability: "stable",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_changed",
      updateBehavior: "replace_if_same_key",
      memoryKey: "communication_preference",
      reason: explicitMemory
        ? "User explicitly requested memory of a stable preference."
        : "Stable communication or behavior preference detected."
    }));
  },

  addIdentityCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      memorySignals.identitySignal ||
      this.has(text, [
        "my name is",
        "i go by",
        "call me",
        "i am a nurse",
        "i'm a nurse",
        "i work as",
        "my job is",
        "i'm in the navy",
        "i am in the navy",
        "i'm a father",
        "i am a father",
        "my daughter",
        "my son",
        "my wife",
        "my fiancé",
        "my fiance"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "identity",
      importance: "longTerm",
      stability: "stable",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_changed",
      updateBehavior: "replace_if_same_key",
      memoryKey: "user_identity",
      reason: "Stable identity information detected."
    }));
  },

  addJourneyCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      memorySignals.journeySignal ||
      this.has(text, [
        "i want to become",
        "i am trying to become",
        "i'm trying to become",
        "my goal is",
        "my plan is",
        "pmhnp journey",
        "leaving the navy",
        "joining selres",
        "becoming a father",
        "planning a wedding",
        "building ari rebirth",
        "building calbuddy",
        "calbuddy",
        "ari rebirth"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "journey",
      importance: "longTerm",
      stability: "developing",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_completed_or_changed",
      updateBehavior: "merge_with_existing",
      memoryKey: "life_journey_or_project",
      reason: "Long-term journey, goal, or life transition detected."
    }));
  },

  addMilestoneCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      memorySignals.milestoneSignal ||
      this.has(text, [
        "i passed",
        "i graduated",
        "got married",
        "we got married",
        "baby was born",
        "daughter was born",
        "son was born",
        "i got promoted",
        "i separated",
        "i resigned",
        "i finished",
        "ari was born",
        "calbuddy launched"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "milestone",
      importance: "sacred",
      stability: "stable",
      confidence: "high",
      lifespan: "permanent_unless_forgotten",
      updateBehavior: "append",
      memoryKey: "major_life_milestone",
      reason: "Major milestone detected."
    }));
  },

  addProjectCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      this.has(text, [
        "ari rebirth",
        "calbuddy",
        "cal buddy",
        "memory v2",
        "observer v2",
        "emotion v2",
        "mouth director",
        "owner brain",
        "relationship engine",
        "executive function",
        "priority engine",
        "wellness wheel"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "project_memory",
      importance: "longTerm",
      stability: "developing",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_project_changes",
      updateBehavior: "merge_with_existing",
      memoryKey: "ari_or_calbuddy_project",
      reason: "Long-term project architecture or roadmap memory detected."
    }));
  },

  addRelationshipCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      this.has(text, [
        "my fiancé",
        "my fiance",
        "my wife",
        "my girlfriend",
        "my daughter",
        "my son",
        "my father",
        "my mother",
        "my family",
        "my boss",
        "my coworker",
        "my friend"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: explicitMemory,
      memoryType: "relationship_context",
      importance: explicitMemory ? "longTerm" : "session",
      stability: explicitMemory ? "stable" : "temporary",
      confidence: explicitMemory ? "high" : "low",
      lifespan: explicitMemory ? "until_changed" : "session_only",
      updateBehavior: explicitMemory ? "merge_with_existing" : "ignore",
      memoryKey: "relationship_context",
      reason: explicitMemory
        ? "User explicitly requested relationship context memory."
        : "Relationship context detected but not stored without explicit memory intent."
    }));
  },

  addValuesCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      this.has(text, [
        "i value",
        "what matters to me",
        "i care about",
        "wisdom matters",
        "family matters",
        "presence matters",
        "i believe",
        "i don't want to become",
        "i want to be the kind of person"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "values",
      importance: "longTerm",
      stability: "stable",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_changed",
      updateBehavior: "merge_with_existing",
      memoryKey: "user_values",
      reason: "Stable value, belief, or identity principle detected."
    }));
  },

  addReflectionCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      memorySignals.reflectionSignal ||
      this.has(text, [
        "i learned that",
        "i realized that",
        "this taught me",
        "what i learned",
        "i noticed that",
        "i keep doing",
        "my pattern is"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "reflection",
      importance: "longTerm",
      stability: "developing",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_refined",
      updateBehavior: "merge_with_existing",
      memoryKey: "user_reflection_or_pattern",
      reason: "Reflection, lesson, or recurring pattern detected."
    }));
  },

  addLanguageMemoryCandidate(candidates, text, explicitMemory, memorySignals) {
    const match =
      this.has(text, [
        "don't repeat",
        "stop saying",
        "say it like",
        "answer like",
        "sound more",
        "sound less",
        "be less robotic",
        "be more human",
        "more like ari",
        "less generic"
      ]);

    if (!match) return;

    candidates.push(this.candidate({
      shouldRemember: true,
      memoryType: "language_memory",
      importance: "longTerm",
      stability: "stable",
      confidence: explicitMemory ? "high" : "medium",
      lifespan: "until_changed",
      updateBehavior: "replace_if_same_key",
      memoryKey: "ari_language_preference",
      reason: "Language style or repetition preference detected."
    }));
  },

  isTemporaryEmotion(text = "", emotionSignals = {}) {
    return Boolean(
      emotionSignals.isTemporaryEmotion ||
      this.has(text, [
        "i feel",
        "i'm feeling",
        "i am feeling",
        "i felt",
        "right now",
        "today",
        "tonight",
        "this morning",
        "this afternoon",
        "this evening",
        "currently",
        "at the moment"
      ])
    );
  },

  has(text = "", phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  importanceRank(value = "") {
    const ranks = {
      sacred: 5,
      longTerm: 4,
      mediumTerm: 3,
      session: 2,
      temporary: 1,
      user_controlled: 5
    };

    return ranks[value] || 0;
  },

  confidenceRank(value = "") {
    const ranks = {
      high: 3,
      medium: 2,
      low: 1
    };

    return ranks[value] || 0;
  },

  stabilityRank(value = "") {
    const ranks = {
      stable: 4,
      developing: 3,
      unknown: 2,
      temporary: 1
    };

    return ranks[value] || 0;
  },

  shouldForget(memory = {}) {
    if (!memory) return true;
    if (memory.forgetRequest === true) return true;
    if (memory.shouldForget === true) return true;
    if (memory.importance === "temporary") return true;
    if (memory.stability === "temporary") return true;
    if (memory.expired === true) return true;
    if (memory.userRequestedForget === true) return true;
    return false;
  }
};