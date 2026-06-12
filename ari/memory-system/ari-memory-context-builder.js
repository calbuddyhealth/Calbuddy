// ari/memory-system/ari-memory-context-builder.js
// Ari Memory Context Builder
// Purpose: Turn stored memories into clean, useful context for Ari.
// V1.0

window.Ari = window.Ari || {};

window.Ari.memoryContextBuilder = {
  version: "1.0.0",

  build(options = {}) {
    if (!window.Ari.memoryStore) {
      return {
        system: "memory-context-builder",
        available: false,
        contextText: "",
        memories: []
      };
    }

    const limit = options.limit || 8;
    const memories = window.Ari.memoryStore.getContext(limit);

    const grouped = {
      identity: [],
      preference: [],
      journey: [],
      reflection: [],
      story: []
    };

    memories.forEach((memory) => {
      if (grouped[memory.memoryType]) {
        grouped[memory.memoryType].push(memory);
      }
    });

    const contextLines = [];

    grouped.identity.forEach((m) => {
      contextLines.push(`Identity: ${m.text}`);
    });

    grouped.preference.forEach((m) => {
      contextLines.push(`Preference: ${m.text}`);
    });

    grouped.journey.forEach((m) => {
      contextLines.push(`Journey: ${m.text}`);
    });

    grouped.reflection.forEach((m) => {
      contextLines.push(`Reflection: ${m.text}`);
    });

    grouped.story.forEach((m) => {
      contextLines.push(`Important story/milestone: ${m.text}`);
    });

    return {
      system: "memory-context-builder",
      available: true,
      version: this.version,
      contextText: contextLines.join("\n"),
      memories,
      grouped
    };
  }
};