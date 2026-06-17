// ari/memory/ari-memory-ranking-engine.js
// Ari Memory Ranking Engine
// Purpose: Score memories for retrieval without controlling reasoning.
// V1.0.0

window.Ari = window.Ari || {};

window.AriMemoryRankingEngine = {
  version: "1.0.0",

  rank(input = {}) {
    const summary = input.summary || input || {};
    const memories = Array.isArray(summary.memories)
      ? summary.memories
      : [];

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const ranked = memories
      .map(memory => ({
        ...memory,
        retrievalScore: this.score(memory, text)
      }))
      .sort((a, b) => b.retrievalScore - a.retrievalScore);

    return {
      memoryRankingEngineRan: true,
      memoryRankingEngineVersion: this.version,
      memoryRankingEngineSource: "ari-memory-ranking-engine",

      rankedMemories: ranked,
      topMemories: ranked.slice(0, 5),

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

  score(memory = {}, text = "") {
    let score = 0;

    const tags = Array.isArray(memory.tags) ? memory.tags : [];
    const keywords = Array.isArray(memory.keywords)
      ? memory.keywords
      : [];

    for (const tag of tags) {
      if (text.includes(this.normalize(tag))) score += 30;
    }

    for (const word of keywords) {
      if (text.includes(this.normalize(word))) score += 20;
    }

    if (memory.importance != null) {
      score += Math.max(
        0,
        Math.min(20, Number(memory.importance))
      );
    }

    if (memory.recencyWeight != null) {
      score += Math.max(
        0,
        Math.min(10, Number(memory.recencyWeight))
      );
    }

    if (memory.pinned === true) {
      score += 100;
    }

    return score;
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

console.log(
  "ARI MEMORY RANKING ENGINE LOADED:",
  window.AriMemoryRankingEngine?.version
);