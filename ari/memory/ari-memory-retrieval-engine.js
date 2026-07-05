// ari/memory/ari-memory-retrieval-engine.js
// Ari Memory Retrieval Engine
// Purpose: Retrieve relevant advisory memories only when memory is actually needed.
// V1.1.0 — Supabase-Memory-Only / Advisory Context / No Routing Authority

window.Ari = window.Ari || {};

window.AriMemoryRetrievalEngine = {
  version: "1.1.0",

  async retrieve(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const shouldRetrieve = this.shouldRetrieveMemory(summary, text);

    if (!shouldRetrieve.value) {
      return this.skipped(text, shouldRetrieve.reason);
    }

    const storeMemories = await this.loadMemories(summary);
    const localMemories = this.getLocalFallbackMemories(summary);

    const allMemories = this.dedupeMemories([
      ...storeMemories,
      ...localMemories
    ]);

    const rankedResult =
      window.AriMemoryRankingEngine?.rank
        ? window.AriMemoryRankingEngine.rank({
            ...summary,
            memories: allMemories
          })
        : null;

    const rankedMemories =
      rankedResult?.rankedMemories ||
      allMemories
        .map(memory => ({
          ...memory,
          retrievalScore: this.basicScore(memory, text)
        }))
        .sort((a, b) => b.retrievalScore - a.retrievalScore);

    const usableMemories = rankedMemories
      .filter(memory => memory.pinned === true || memory.retrievalScore >= 20)
      .slice(0, 7);

    const memoryContext = this.buildMemoryContext(usableMemories);

    return {
      memoryRetrievalEngineRan: true,
      memoryRetrievalEngineVersion: this.version,
      memoryRetrievalEngineSource: "ari-memory-retrieval-engine",

      memoryRetrievalQuery: text,
      memoryRetrievalReason: shouldRetrieve.reason,
      memoryStoreAvailable: storeMemories.length > 0,
      rawMemoryCount: allMemories.length,

      memories: usableMemories,
      usableMemories,
      retrievedMemories: usableMemories,
      rankedMemories,
      memoryContext,
      memoryAvailable: usableMemories.length > 0,

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

  shouldRetrieveMemory(summary = {}, text = "") {
    if (summary.laneSplit?.routing?.useMemory === true) {
      return { value: true, reason: "lane_split_requested_memory" };
    }

    if (summary.cognitiveExecutive?.requires?.userMemory === true) {
      return { value: true, reason: "cognitive_executive_requested_user_memory" };
    }

    if (
      /\b(remember|do you remember|what did i say|what do you know about me|my preference|my goal|last time|previously|before|what did we decide|did we decide)\b/i.test(text)
    ) {
      return { value: true, reason: "explicit_memory_recall_request" };
    }

    return { value: false, reason: "memory_not_needed_for_current_turn" };
  },

  skipped(query = "", reason = "memory_not_needed_for_current_turn") {
    return {
      memoryRetrievalEngineRan: false,
      memoryRetrievalEngineVersion: this.version,
      memoryRetrievalEngineSource: "ari-memory-retrieval-engine",
      memoryRetrievalSource: "skipped",
      memoryRetrievalQuery: query,
      reason,

      memoryStoreAvailable: false,
      rawMemoryCount: 0,
      memories: [],
      usableMemories: [],
      retrievedMemories: [],
      rankedMemories: [],
      memoryContext: null,
      memoryAvailable: false,

      authority: "advisory_context_only"
    };
  },

  async loadMemories(summary = {}) {
    try {
      if (window.AriMemoryStore?.loadRelevant) {
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

    const seed =
      window.Ari?.localMemorySeed ||
      summary.localMemorySeed ||
      [];

    if (Array.isArray(seed)) memories.push(...seed);

    const continuity = summary.continuityState || summary.threadState || {};

    if (continuity.currentTopic) {
      memories.push({
        id: "active_thread_topic",
        type: "conversation_thread",
        domain: "active_context",
        claim: `Current topic is ${continuity.currentTopic}.`,
        tags: [continuity.currentTopic, "current topic", "thread"],
        keywords: [continuity.currentTopic, "thread", "continuity"],
        importance: 5,
        confidence: 0.75,
        source: "conversation_continuity",
        temporary: true
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

    text.split(/\s+/)
      .filter(word => word.length > 3)
      .forEach(word => {
        if (haystack.includes(word)) score += 6;
      });

    if (memory.importance != null) score += Math.min(20, Number(memory.importance) || 0);
    if (memory.confidence != null) score += Math.min(10, (Number(memory.confidence) || 0) * 10);
    if (memory.pinned === true) score += 100;

    return Math.round(score);
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