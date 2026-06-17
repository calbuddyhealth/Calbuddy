// ari/storage/ari-memory-store.js
// Ari Memory Store
// Purpose: Load/save Ari memories and relationship profile.
// V1.0.0 — Session fallback, Supabase-ready

window.Ari = window.Ari || {};

window.AriMemoryStore = {
  version: "1.0.0",

  async loadRelevant(summary = {}) {
    const memories = this.loadSessionMemories();

    return {
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      memories
    };
  },

  async saveMemory(memory = {}) {
    if (!memory || !memory.claim) {
      return {
        success: false,
        reason: "No valid memory claim."
      };
    }

    const memories = this.loadSessionMemories();

    const savedMemory = {
      id: memory.id || this.createId("mem"),
      type: memory.type || "general",
      domain: memory.domain || "general",
      key: memory.key || null,
      claim: memory.claim,
      tags: memory.tags || [],
      keywords: memory.keywords || this.extractKeywords(memory.claim),
      importance: memory.importance ?? 5,
      confidence: memory.confidence ?? 0.75,
      source: memory.source || "ari-memory-store",
      createdAt: memory.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const filtered = memories.filter(item =>
      this.normalize(item.claim) !== this.normalize(savedMemory.claim)
    );

    filtered.push(savedMemory);

    this.saveSessionMemories(filtered);

    return {
      success: true,
      memoryStoreVersion: this.version,
      savedMemory
    };
  },

  async saveCandidates(candidates = []) {
    const saved = [];

    for (const candidate of candidates || []) {
      const result = await this.saveMemory(candidate);
      if (result.success) saved.push(result.savedMemory);
    }

    return {
      success: true,
      savedCount: saved.length,
      savedMemories: saved
    };
  },

  async loadRelationshipProfile(summary = {}) {
    const profile =
      window.Ari.relationshipProfile ||
      this.loadSessionRelationshipProfile();

    return {
      relationshipStoreRan: true,
      memoryStoreVersion: this.version,
      relationshipProfile: profile || {}
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
      relationshipProfile: profile || {}
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
      "have", "has", "had", "but", "not", "from"
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