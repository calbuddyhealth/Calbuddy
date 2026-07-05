// ari/memory/ari-memory-context-builder.js
// Purpose: Build clean composer-safe memory context.
// V1.1.1 — Retrieval Shape Compatible

window.Ari = window.Ari || {};

window.AriMemoryContextBuilder = {
  version: "1.1.1",

  build(input = {}) {
    const summary = input.summary || input || {};

    const memories = this.collectMemories(summary);
    const memoryFacts = this.toFacts(memories).slice(0, 8);

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

      authority: "advisory_context_only",
      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse"
      ]
    };
  },

  collectMemories(summary = {}) {
    return [
      ...(summary.usableMemories || []),
      ...(summary.retrievedMemories || []),
      ...(summary.memoryRetrieval?.usableMemories || []),
      ...(summary.memoryRetrieval?.retrievedMemories || []),
      ...(summary.memoryRetrieval?.memories || []),
      ...(summary.memoryRetrieval?.results || [])
    ].filter(Boolean);
  },

  toFacts(memories = []) {
    const seen = new Set();

    return memories
      .map(memory =>
        memory.claim ||
        memory.summary ||
        memory.fact ||
        memory.text ||
        ""
      )
      .map(text => String(text || "").trim())
      .filter(text => {
        if (!text) return false;

        const key = this.normalize(text);
        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      });
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.memoryContextBuilder = window.AriMemoryContextBuilder;

console.log(
  "ARI MEMORY CONTEXT BUILDER LOADED:",
  window.AriMemoryContextBuilder.version
);