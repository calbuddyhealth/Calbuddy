// ari/memory/ari-memory-context-builder.js
// Purpose: Build clean composer-safe memory context.
// V1.1.0

window.Ari = window.Ari || {};

window.AriMemoryContextBuilder = {
  version: "1.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const memories =
      summary.usableMemories ||
      summary.retrievedMemories ||
      summary.memoryRetrieval?.retrievedMemories ||
      summary.memoryRetrieval?.usableMemories ||
      [];

    const memoryFacts = memories
      .map(memory => memory.claim || memory.summary || memory.fact || "")
      .filter(Boolean)
      .slice(0, 8);

    return {
      memoryContextBuilderRan: true,
      memoryContextBuilderVersion: this.version,
      memoryContextSource: "ari-memory-context-builder",
      memoryContext: memoryFacts.length
        ? memoryFacts.map(x => `Memory: ${x}`).join("\n")
        : null,
      memoryFacts,
      usableFacts: memoryFacts,
      memoryCount: memoryFacts.length,
      authority: "advisory_context_only"
    };
  }
};

window.Ari.memoryContextBuilder = window.AriMemoryContextBuilder;

console.log(
  "ARI MEMORY CONTEXT BUILDER LOADED:",
  window.AriMemoryContextBuilder.version
);