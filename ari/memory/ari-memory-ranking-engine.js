// ari/memory/ari-memory-ranking-engine.js
// Ari Memory Ranking Engine
// Purpose: Rank recalled memories as advisory context only.
// V1.1.0 — Relevance / Recency / Safety-Aware Ranking

window.Ari = window.Ari || {};

window.AriMemoryRankingEngine = {
  version: "1.1.0",

  rank(input = {}) {
    const summary = input.summary || input || {};

    const memories =
      summary.usableMemories ||
      summary.memories ||
      summary.memoryRetrieval?.usableMemories ||
      summary.memoryRetrieval?.memories ||
      [];

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const ranked = (Array.isArray(memories) ? memories : [])
      .map(memory => ({
        ...memory,
        retrievalScore: this.score(memory, text),
        retrievalReason: this.explainScore(memory, text)
      }))
      .filter(memory => memory.retrievalScore > 0)
      .sort((a, b) => b.retrievalScore - a.retrievalScore);

    return {
      memoryRankingEngineRan: true,
      memoryRankingEngineVersion: this.version,
      memoryRankingEngineSource: "ari-memory-ranking-engine",

      rankedMemories: ranked,
      topMemories: ranked.slice(0, 5),
      usableMemories: ranked.slice(0, 5),
      memoryAvailable: ranked.length > 0,

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

    const claim = this.normalize(memory.claim || memory.text || "");
    const type = this.normalize(memory.type || "");
    const domain = this.normalize(memory.domain || "");
    const key = this.normalize(memory.key || "");

    const tags = Array.isArray(memory.tags) ? memory.tags : [];
    const keywords = Array.isArray(memory.keywords)
      ? memory.keywords
      : this.extractKeywords(claim);

    if (!claim) return 0;

    if (text && claim.includes(text)) score += 40;
    if (text && text.includes(claim)) score += 40;

    for (const tag of tags) {
      if (text.includes(this.normalize(tag))) score += 25;
    }

    for (const word of keywords) {
      const clean = this.normalize(word);
      if (clean.length > 2 && text.includes(clean)) score += 15;
    }

    if (type && text.includes(type)) score += 20;
    if (domain && text.includes(domain)) score += 15;
    if (key && text.includes(key)) score += 20;

    score += this.importanceScore(memory.importance);
    score += this.confidenceScore(memory.confidence);
    score += this.recencyScore(memory.updatedAt || memory.createdAt);

    if (memory.pinned === true) score += 100;

    if (this.looksStaleOrWeak(memory)) score -= 20;

    return Math.max(0, Math.round(score));
  },

  explainScore(memory = {}, text = "") {
    const reasons = [];

    const claim = this.normalize(memory.claim || memory.text || "");
    const keywords = Array.isArray(memory.keywords)
      ? memory.keywords
      : this.extractKeywords(claim);

    if (memory.pinned === true) reasons.push("pinned");
    if (Number(memory.importance || 0) >= 8) reasons.push("high_importance");
    if (Number(memory.confidence || 0) >= 0.85) reasons.push("high_confidence");

    if (
      keywords.some(word =>
        text.includes(this.normalize(word))
      )
    ) {
      reasons.push("keyword_match");
    }

    if (this.recencyScore(memory.updatedAt || memory.createdAt) > 0) {
      reasons.push("recent");
    }

    return reasons;
  },

  importanceScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(25, n * 2.5));
  },

  confidenceScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(20, n * 20));
  },

  recencyScore(dateValue) {
    if (!dateValue) return 0;

    const time = new Date(dateValue).getTime();
    if (!Number.isFinite(time)) return 0;

    const ageDays = (Date.now() - time) / 86400000;

    if (ageDays <= 7) return 15;
    if (ageDays <= 30) return 10;
    if (ageDays <= 180) return 5;

    return 0;
  },

  looksStaleOrWeak(memory = {}) {
    const claim = this.normalize(memory.claim || memory.text || "");

    if (claim.length < 8) return true;
    if (Number(memory.confidence || 0) < 0.5) return true;

    return false;
  },

  extractKeywords(text = "") {
    const stop = new Set([
      "the", "and", "for", "with", "that", "this",
      "you", "your", "are", "was", "were", "will",
      "have", "has", "had", "but", "not", "from",
      "about", "because", "really", "just"
    ]);

    return this.normalize(text)
      .split(/\s+/)
      .filter(word => word.length > 3 && !stop.has(word))
      .slice(0, 16);
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI MEMORY RANKING ENGINE LOADED:",
  window.AriMemoryRankingEngine?.version
);