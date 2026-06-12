// ari/memory-system/ari-memory-store.js
// Ari Memory Store
// Purpose: Store only memories approved by Ari Memory Engine.
// V1.0

window.Ari = window.Ari || {};

window.Ari.memoryStore = {
  version: "1.0.0",
  storageKey: "ari_memory_store_v1",

  createEmptyStore() {
    return {
      memories: [],
      lastUpdated: new Date().toISOString()
    };
  },

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return this.createEmptyStore();
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Ari Memory Store load failed:", error);
      return this.createEmptyStore();
    }
  },

  save(store) {
    try {
      store.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(store));
      return true;
    } catch (error) {
      console.warn("Ari Memory Store save failed:", error);
      return false;
    }
  },

  normalizeText(text = "") {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");
  },

  makeMemoryId(text = "", classification = {}) {
    const clean = this.normalizeText(text).slice(0, 60);
    const type = classification.memoryType || "unknown";
    const stamp = Date.now();
    return `mem_${type}_${stamp}_${clean.replace(/\s/g, "_")}`;
  },

  isDuplicate(store, text = "", classification = {}) {
    const clean = this.normalizeText(text);
    const type = classification.memoryType || "unknown";

    return store.memories.some((memory) => {
      return (
        memory.normalizedText === clean ||
        (
          memory.memoryType === type &&
          memory.normalizedText.includes(clean)
        ) ||
        (
          memory.memoryType === type &&
          clean.includes(memory.normalizedText)
        )
      );
    });
  },

  add(message = "", context = {}) {
    if (!window.Ari.memoryEngine) {
      console.warn("Ari Memory Engine not found.");
      return {
        stored: false,
        reason: "Memory Engine missing."
      };
    }

    const classification = window.Ari.memoryEngine.classify(message, context);

    if (!classification.shouldRemember) {
      return {
        stored: false,
        classification,
        reason: classification.reason
      };
    }

    const store = this.load();

    if (this.isDuplicate(store, message, classification)) {
      return {
        stored: false,
        duplicate: true,
        classification,
        reason: "Duplicate memory avoided."
      };
    }

    const memory = {
      id: this.makeMemoryId(message, classification),
      text: message,
      normalizedText: this.normalizeText(message),

      memoryType: classification.memoryType,
      importance: classification.importance,
      stability: classification.stability,
      confidence: classification.confidence,
      reason: classification.reason,
      source: classification.source || "ari-memory-store",

      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      seenCount: 1,
      archived: false
    };

    store.memories.push(memory);
    this.save(store);

    return {
      stored: true,
      memory,
      classification
    };
  },

  reinforce(message = "", context = {}) {
    const store = this.load();
    const clean = this.normalizeText(message);

    const existing = store.memories.find((memory) => {
      return (
        memory.normalizedText === clean ||
        clean.includes(memory.normalizedText) ||
        memory.normalizedText.includes(clean)
      );
    });

    if (existing) {
      existing.seenCount += 1;
      existing.lastSeen = new Date().toISOString();

      if (existing.confidence === "low") existing.confidence = "medium";
      else if (existing.confidence === "medium") existing.confidence = "high";

      this.save(store);

      return {
        reinforced: true,
        memory: existing
      };
    }

    return this.add(message, context);
  },

  getAll() {
    return this.load().memories.filter((m) => !m.archived);
  },

  getByType(type = "") {
    return this.getAll().filter((memory) => memory.memoryType === type);
  },

  getLongTerm() {
    return this.getAll().filter((memory) => {
      return (
        memory.importance === "longTerm" ||
        memory.importance === "sacred"
      );
    });
  },

  getContext(limit = 8) {
    const memories = this.getAll();

    const priority = {
      sacred: 5,
      longTerm: 4,
      session: 2,
      temporary: 1
    };

    return memories
      .sort((a, b) => {
        const aScore = (priority[a.importance] || 0) + a.seenCount;
        const bScore = (priority[b.importance] || 0) + b.seenCount;
        return bScore - aScore;
      })
      .slice(0, limit);
  },

  archive(memoryId = "") {
    const store = this.load();

    const memory = store.memories.find((m) => m.id === memoryId);
    if (!memory) {
      return {
        archived: false,
        reason: "Memory not found."
      };
    }

    memory.archived = true;
    memory.archivedAt = new Date().toISOString();

    this.save(store);

    return {
      archived: true,
      memory
    };
  },

  clear() {
    localStorage.removeItem(this.storageKey);
    return this.createEmptyStore();
  }
};