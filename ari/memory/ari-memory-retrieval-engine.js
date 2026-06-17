// ari/memory/ari-memory-retrieval-engine.js
// Ari Memory Retrieval Engine
// Purpose: Retrieve relevant advisory memories without controlling routing.
// V1.0.0

window.Ari = window.Ari || {};

window.AriMemoryRetrievalEngine = {
  version: "1.0.0",

  async retrieve(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const storeMemories = await this.loadMemories(summary);
    const localMemories = this.getLocalFallbackMemories(summary);

    const allMemories = this.dedupeMemories([
      ...storeMemories,
      ...localMemories
    ]);

    let rankedResult = null;

    if (
      window.AriMemoryRankingEngine &&
      typeof window.AriMemoryRankingEngine.rank === "function"
    ) {
      rankedResult = window.AriMemoryRankingEngine.rank({
        ...summary,
        memories: allMemories
      });
    }

    const rankedMemories =
      rankedResult?.rankedMemories ||
      allMemories.map(memory => ({
        ...memory,
        retrievalScore: this.basicScore(memory, text)
      })).sort((a, b) => b.retrievalScore - a.retrievalScore);

    const relevantMemories = rankedMemories
      .filter(memory => memory.retrievalScore >= 20 || memory.pinned === true)
      .slice(0, 7);

    const memoryContext = this.buildMemoryContext(relevantMemories);

    return {
      memoryRetrievalEngineRan: true,
      memoryRetrievalEngineVersion: this.version,
      memoryRetrievalEngineSource: "ari-memory-retrieval-engine",

      memoryRetrievalQuery: text,
      memoryStoreAvailable: storeMemories.length > 0,
      rawMemoryCount: allMemories.length,
      retrievedMemories: relevantMemories,
      rankedMemories,
      memoryContext,

      authority: "advisory_context_only",
      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation"
      ]
    };
  },

  async loadMemories(summary = {}) {
    try {
      if (
        window.AriMemoryStore &&
        typeof window.AriMemoryStore.loadRelevant === "function"
      ) {
        const result = await window.AriMemoryStore.loadRelevant(summary);
        return Array.isArray(result?.memories) ? result.memories : [];
      }
    } catch (error) {
      console.warn("AriMemoryRetrievalEngine store load failed:", error);
    }

    return [];
  },

  getLocalFallbackMemories(summary = {}) {
    const memories = [];

    const projectMemories =
      window.Ari?.localMemorySeed ||
      summary.localMemorySeed ||
      [];

    if (Array.isArray(projectMemories)) {
      memories.push(...projectMemories);
    }

    const continuity = summary.continuityState || summary.threadState || {};

    if (continuity.currentTopic) {
      memories.push({
        id: "active_thread_topic",
        type: "conversation_thread",
        domain: "active_context",
        claim: `Current topic is ${continuity.currentTopic}.`,
        tags: [continuity.currentTopic, "current topic", "thread"],
        keywords: [continuity.currentTopic, "thread", "continuity"],
        importance: 8,
        confidence: 0.85,
        source: "conversation_continuity",
        temporary: true
      });
    }

    if (Array.isArray(continuity.unresolvedItems)) {
      continuity.unresolvedItems.forEach((item, index) => {
        memories.push({
          id: `unresolved_item_${index}`,
          type: "conversation_thread",
          domain: "active_context",
          claim: item,
          tags: ["unresolved", "next step", "thread"],
          keywords: String(item).toLowerCase().split(/\s+/).slice(0, 8),
          importance: 7,
          confidence: 0.8,
          source: "conversation_continuity",
          temporary: true
        });
      });
    }

    return memories;
  },

  buildMemoryContext(memories = []) {
    const context = {
      relevantMemories: [],
      userPreferences: {},
      projectContext: {},
      priorDecisions: [],
      relationshipPatterns: [],
      activeThreadFacts: [],
      conflicts: [],
      confidence: 0,
      authority: "advisory_context_only"
    };

    memories.forEach(memory => {
      const item = {
        id: memory.id || null,
        type: memory.type || "general",
        domain: memory.domain || "general",
        claim: memory.claim || memory.summary || memory.fact || "",
        confidence: memory.confidence ?? null,
        retrievalScore: memory.retrievalScore ?? 0,
        source: memory.source || "memory"
      };

      if (!item.claim) return;

      context.relevantMemories.push(item);

      if (memory.type === "user_preference") {
        context.userPreferences[memory.key || item.domain] = item.claim;
      }

      if (memory.type === "project_fact") {
        context.projectContext[memory.key || item.domain] = item.claim;
      }

      if (memory.type === "prior_decision") {
        context.priorDecisions.push(item);
      }

      if (memory.type === "relationship_pattern") {
        context.relationshipPatterns.push(item);
      }

      if (memory.type === "conversation_thread") {
        context.activeThreadFacts.push(item);
      }
    });

    context.confidence = this.averageConfidence(context.relevantMemories);

    return context;
  },

  basicScore(memory = {}, text = "") {
    let score = 0;

    const haystack = this.normalize([
      memory.claim,
      memory.summary,
      memory.fact,
      memory.domain,
      memory.type,
      ...(memory.tags || []),
      ...(memory.keywords || [])
    ].filter(Boolean).join(" "));

    const words = text.split(/\s+/).filter(word => word.length > 3);

    words.forEach(word => {
      if (haystack.includes(word)) score += 6;
    });

    if (memory.importance != null) score += Math.min(20, Number(memory.importance) || 0);
    if (memory.confidence != null) score += Math.min(10, (Number(memory.confidence) || 0) * 10);
    if (memory.pinned === true) score += 100;

    return score;
  },

  dedupeMemories(memories = []) {
    const seen = new Set();

    return memories.filter(memory => {
      const key = this.normalize(
        memory.id ||
        memory.claim ||
        memory.summary ||
        memory.fact ||
        JSON.stringify(memory)
      );

      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  averageConfidence(items = []) {
    const values = items
      .map(item => Number(item.confidence))
      .filter(value => Number.isFinite(value));

    if (!values.length) return 0;

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 100) / 100;
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
  "ARI MEMORY RETRIEVAL ENGINE LOADED:",
  window.AriMemoryRetrievalEngine?.version
);