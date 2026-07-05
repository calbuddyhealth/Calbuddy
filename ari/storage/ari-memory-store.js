// ari/storage/ari-memory-store.js
// Ari Memory Store
// Purpose: Load/save Ari memories.
// V1.2.0 — Supabase First / Session Fallback / Memory-Only

window.Ari = window.Ari || {};

window.AriMemoryStore = {
  version: "1.2.0",

  tableName: "ari_user_memory",
  fallbackTableName: "user_memory",

  async loadRelevant(summary = {}) {
    const query = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const supabaseResult = await this.loadFromSupabase(summary, query);

    if (supabaseResult.success) {
      return {
        memoryStoreRan: true,
        memoryStoreVersion: this.version,
        memoryStoreSource: "ari-memory-store",
        memoryAvailable: supabaseResult.memories.length > 0,
        memories: supabaseResult.memories,
        usableMemories: supabaseResult.memories,
        source: supabaseResult.source
      };
    }

    const memories = this.loadSessionMemories();
    const relevant = query
      ? memories.filter(memory => this.memoryMatchesQuery(memory, query))
      : memories;

    return {
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      memoryAvailable: relevant.length > 0,
      memories: relevant,
      usableMemories: relevant,
      source: "session_fallback",
      supabaseError: supabaseResult.reason || null
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
    if (!memory?.claim) {
      return {
        success: false,
        reason: "No valid memory claim."
      };
    }

    const savedMemory = this.normalizeMemory(memory);
    const supabaseResult = await this.saveToSupabase(savedMemory);

    if (supabaseResult.success) {
      this.saveSessionCopy(savedMemory);

      return {
        success: true,
        memoryStoreRan: true,
        memoryStoreVersion: this.version,
        memoryStoreSource: "ari-memory-store",
        savedMemory,
        source: supabaseResult.source
      };
    }

    this.saveSessionCopy(savedMemory);

    return {
      success: true,
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      savedMemory,
      source: "session_fallback",
      supabaseError: supabaseResult.reason || null
    };
  },

  async saveCandidates(candidates = []) {
    const saved = [];
    const skipped = [];

    for (const candidate of candidates || []) {
      if (!candidate?.claim) {
        skipped.push({ candidate, reason: "missing_claim" });
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

  async loadFromSupabase(summary = {}, query = "") {
    const client = this.getSupabaseClient();
    if (!client) {
      return { success: false, reason: "supabase_client_not_available" };
    }

    const userId = await this.getUserId(client, summary);

    const tables = [this.tableName, this.fallbackTableName];

    for (const table of tables) {
      try {
        let request = client
          .from(table)
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (userId) {
          request = request.eq("user_id", userId);
        }

        const { data, error } = await request;

        if (error) {
          continue;
        }

        const normalized = (Array.isArray(data) ? data : [])
          .map(row => this.fromSupabaseRow(row))
          .filter(memory =>
            query ? this.memoryMatchesQuery(memory, query) : true
          );

        return {
          success: true,
          memories: normalized,
          source: `supabase:${table}`
        };
      } catch (error) {
        console.warn("AriMemoryStore Supabase load failed:", table, error);
      }
    }

    return { success: false, reason: "supabase_load_failed" };
  },

  async saveToSupabase(memory = {}) {
    const client = this.getSupabaseClient();
    if (!client) {
      return { success: false, reason: "supabase_client_not_available" };
    }

    const userId = await this.getUserId(client, memory);

    const row = {
      user_id: userId || memory.userId || null,
      type: memory.type || "general",
      domain: memory.domain || "general",
      key: memory.key || null,
      claim: memory.claim,
      tags: memory.tags || [],
      keywords: memory.keywords || [],
      importance: memory.importance ?? 5,
      confidence: memory.confidence ?? 0.75,
      reason: memory.reason || null,
      source: memory.source || "ari-memory-store",
      updated_at: new Date().toISOString()
    };

    const tables = [this.tableName, this.fallbackTableName];

    for (const table of tables) {
      try {
        const { error } = await client
  .from(table)
  .upsert(row, {
    onConflict: "user_id,claim"
  });

        if (!error) {
          return {
            success: true,
            source: `supabase:${table}`
          };
        }

        console.warn("AriMemoryStore Supabase save failed:", table, error);
      } catch (error) {
        console.warn("AriMemoryStore Supabase save error:", table, error);
      }
    }

    return { success: false, reason: "supabase_save_failed" };
  },

  getSupabaseClient() {
    return (
      window.supabaseClient ||
      window.supabase ||
      window.CalBuddy?.supabase ||
      null
    );
  },

  async getUserId(client, source = {}) {
    if (source.userId || source.user_id) {
      return source.userId || source.user_id;
    }

    if (source.appContext?.user?.id) {
      return source.appContext.user.id;
    }

    try {
      const result = await client.auth?.getUser?.();
      return result?.data?.user?.id || null;
    } catch {
      return null;
    }
  },

  fromSupabaseRow(row = {}) {
    return {
      id: row.id || this.createId("mem"),
      userId: row.user_id || row.userId || null,
      type: row.type || row.memory_type || "general",
      domain: row.domain || "general",
      key: row.key || row.memory_key || null,
      claim: row.claim || row.text || row.memory || row.content || "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      importance: Number(row.importance ?? 5),
      confidence: Number(row.confidence ?? 0.75),
      reason: row.reason || null,
      source: row.source || "supabase_memory",
      createdAt: row.created_at || row.createdAt || null,
      updatedAt: row.updated_at || row.updatedAt || null
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

  saveSessionCopy(memory = {}) {
    const memories = this.loadSessionMemories();

    const filtered = memories.filter(item =>
      this.normalize(item.claim) !== this.normalize(memory.claim)
    );

    filtered.push(memory);
    this.saveSessionMemories(filtered);
  },

  memoryMatchesQuery(memory = {}, query = "") {
    const q = this.normalize(query);
    const haystack = this.normalize([
      memory.claim,
      memory.type,
      memory.domain,
      memory.key,
      ...(memory.tags || []),
      ...(memory.keywords || [])
    ].filter(Boolean).join(" "));

    if (!q) return true;

    const words = q.split(/\s+/).filter(word => word.length > 3);

    return words.some(word => haystack.includes(word));
  },

  loadSessionMemories() {
    try {
      const raw = sessionStorage.getItem("ari_memory_items");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveSessionMemories(memories = []) {
    window.Ari.memoryItems = memories;

    try {
      sessionStorage.setItem("ari_memory_items", JSON.stringify(memories));
    } catch (error) {
      console.warn("AriMemoryStore memory save failed:", error);
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

console.log("ARI MEMORY STORE LOADED:", window.AriMemoryStore?.version);