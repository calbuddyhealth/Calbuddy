// ari/storage/ari-memory-store.js
// Ari Memory Store
// Purpose: Load/save Ari memories and relationship profile.
// V1.1.0 — Session Fallback / Supabase Adapter Ready / Candidate Safe

window.Ari = window.Ari || {};

window.AriMemoryStore = {
  version: "1.1.0",

  async loadRelevant(summary = {}) {
    const memories = this.loadSessionMemories();
    const query = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const relevant = query
      ? memories.filter(memory =>
          this.memoryMatchesQuery(memory, query)
        )
      : memories;

    return {
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      memoryAvailable: relevant.length > 0,
      memories: relevant,
      usableMemories: relevant,
      source: "session_fallback"
    };
  },

  async retrieve(summary = {}) {
    return this.loadRelevant(summary);
  },

  async search(summary = {}) {
    return this.loadRelevant(summary);
  },

  async recall(summary = {}) {
    return this.loadRelevant(summary);
  },

  async saveMemory(memory = {}) {
    if (!memory || !memory.claim) {
      return {
        success: false,
        reason: "No valid memory claim."
      };
    }

    const memories = this.loadSessionMemories();

    const savedMemory = this.normalizeMemory(memory);

    const filtered = memories.filter(item =>
      this.normalize(item.claim) !== this.normalize(savedMemory.claim)
    );

    filtered.push(savedMemory);
    this.saveSessionMemories(filtered);

    return {
      success: true,
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      savedMemory,
      source: "session_fallback"
    };
  },

  async saveCandidates(candidates = []) {
    const saved = [];
    const skipped = [];

    for (const candidate of candidates || []) {
      if (!candidate?.claim) {
        skipped.push({
          candidate,
          reason: "missing_claim"
        });
        continue;
      }

      const result = await this.saveMemory(candidate);

      if (result.success) {
        saved.push(result.savedMemory);
      } else {
        skipped.push({
          candidate,
          reason: result.reason || "save_failed"
        });
      }
    }

    return {
      success: true,
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      savedCount: saved.length,
      skippedCount: skipped.length,
      savedMemories: saved,
      skipped
    };
  },

  normalizeMemory(memory = {}) {
    const claim = String(memory.claim || "").trim();

    return {
      id: memory.id || this.createId("mem"),
      userId: memory.userId || memory.user_id || null,
      type: memory.type || "general",
      domain: memory.domain || "general",
      key: memory.key || null,
      claim,
      tags: Array.isArray(memory.tags) ? memory.tags : [],
      keywords: Array.isArray(memory.keywords)
        ? memory.keywords
        : this.extractKeywords(claim),
      importance: Number(memory.importance ?? 5),
      confidence: Number(memory.confidence ?? 0.75),
      reason: memory.reason || null,
      source: memory.source || "ari-memory-store",
      createdAt: memory.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  memoryMatchesQuery(memory = {}, query = "") {
    const q = this.normalize(query);
    const claim = this.normalize(memory.claim || "");
    const type = this.normalize(memory.type || "");
    const domain = this.normalize(memory.domain || "");
    const keywords = Array.isArray(memory.keywords)
      ? memory.keywords.map(word => this.normalize(word))
      : [];

    if (!q) return true;
    if (claim.includes(q)) return true;

    return keywords.some(keyword =>
      keyword && q.includes(keyword)
    ) || q.includes(type) || q.includes(domain);
  },

  async loadRelationshipProfile(summary = {}) {
    const profile =
      window.Ari.relationshipProfile ||
      this.loadSessionRelationshipProfile();

    return {
      relationshipStoreRan: true,
      memoryStoreVersion: this.version,
      relationshipProfile: profile || {},
      source: "session_fallback"
    };
  },

  async saveRelationshipProfile(profile = {}) {
    window.Ari.relationshipProfile = profile || {};

    try {
      sessionStorage.setItem(
        "ari_relationship_profile",
        JSON.stringify(profile || {})
      );
    } catch (error) {
      console.warn("AriMemoryStore relationship save failed:", error);
    }

    return {
      success: true,
      relationshipProfile: profile || {},
      source: "session_fallback"
    };
  },

  loadSessionMemories() {
    try {
      const raw = sessionStorage.getItem("ari_memory_items");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("AriMemoryStore memory load failed:", error);
      return [];
    }
  },

  saveSessionMemories(memories = []) {
    window.Ari.memoryItems = memories;

    try {
      sessionStorage.setItem(
        "ari_memory_items",
        JSON.stringify(memories)
      );
    } catch (error) {
      console.warn("AriMemoryStore memory save failed:", error);
    }
  },

  loadSessionRelationshipProfile() {
    try {
      const raw = sessionStorage.getItem("ari_relationship_profile");
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.warn("AriMemoryStore relationship load failed:", error);
      return {};
    }
  },

  extractKeywords(text = "") {
    const stop = new Set([
      "the", "and", "for", "with", "that", "this",
      "you", "your", "are", "was", "were", "will",
      "have", "has", "had", "but", "not", "from",
      "into", "about", "because", "right", "just"
    ]);

    return this.normalize(text)
      .split(/\s+/)
      .filter(word => word.length > 3 && !stop.has(word))
      .slice(0, 12);
  },

  createId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  "ARI MEMORY STORE LOADED:",
  window.AriMemoryStore?.version
);