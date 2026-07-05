// ari/storage/ari-memory-store.js
// Ari Memory Store
// Purpose: Load/save Ari memories.
// V1.2.3 — Supabase Schema Aligned / User-Scoped / Session Fallback

window.Ari = window.Ari || {};

window.AriMemoryStore = {
  version: "1.2.3",

  tableName: "ari_user_memory",

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
        source: supabaseResult.source,
        userId: supabaseResult.userId || null
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

    this.saveSessionCopy(savedMemory);

    return {
      success: true,
      memoryStoreRan: true,
      memoryStoreVersion: this.version,
      memoryStoreSource: "ari-memory-store",
      savedMemory,
      source: supabaseResult.success ? supabaseResult.source : "session_fallback",
      userId: supabaseResult.userId || savedMemory.userId || null,
      supabaseError: supabaseResult.success ? null : supabaseResult.reason || null
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

  if (!userId) {
    return { success: false, reason: "no_user_id_session_only" };
  }

  try {
    const { data, error } = await client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      return {
        success: false,
        reason: error.message || "supabase_load_failed"
      };
    }

    const memories = (Array.isArray(data) ? data : [])
      .map(row => this.fromSupabaseRow(row))
      .filter(memory => query ? this.memoryMatchesQuery(memory, query) : true);

    return {
      success: true,
      memories,
      source: `supabase:${this.tableName}`,
      userId
    };
  } catch (error) {
    console.warn("AriMemoryStore Supabase load failed:", error);

    return {
      success: false,
      reason: error?.message || "supabase_load_failed"
    };
  }
},

  async saveToSupabase(memory = {}) {
  const client = this.getSupabaseClient();

  if (!client) {
    return { success: false, reason: "supabase_client_not_available" };
  }

  const userId = await this.getUserId(client, memory);

  if (!userId) {
    return { success: false, reason: "no_user_id_session_only" };
  }

  const row = {
    user_id: userId,
    memory_type: memory.type || "general",
    topic: memory.domain || memory.key || memory.type || "general",
    content: memory.claim,
    importance: memory.importance ?? 5,
    confidence: memory.confidence ?? 0.75,
    tags: Array.isArray(memory.tags) ? memory.tags : [],
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await client
      .from(this.tableName)
      .upsert(row, {
        onConflict: "user_id,content"
      });

    if (error) {
      console.warn("AriMemoryStore Supabase save failed:", error);

      return {
        success: false,
        reason: error.message || "supabase_save_failed",
        userId
      };
    }

    return {
      success: true,
      source: `supabase:${this.tableName}`,
      userId
    };
  } catch (error) {
    console.warn("AriMemoryStore Supabase save error:", error);

    return {
      success: false,
      reason: error?.message || "supabase_save_failed",
      userId
    };
  }
},

  getSupabaseClient() {

  return (

    window.supabaseClient ||

    window.CalBuddy?.supabase ||

    window.supabase ||

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

    if (source.appContext?.userContext?.id) {
      return source.appContext.userContext.id;
    }

    if (source.user?.id) {
      return source.user.id;
    }

    if (source.userContext?.id) {
      return source.userContext.id;
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
      userId: row.user_id || null,
      type: row.memory_type || "general",
      domain: row.topic || "general",
      key: row.topic || null,
      claim: row.content || "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      keywords: this.extractKeywords(row.content || ""),
      importance: Number(row.importance ?? 5),
      confidence: Number(row.confidence ?? 0.75),
      source: "supabase_memory",
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    };
  },

  normalizeMemory(memory = {}) {
    const claim = String(memory.claim || "").trim();

    return {
      id: memory.id || this.createId("mem"),
      userId: memory.userId || memory.user_id || null,
      type: memory.type || "general",
      domain: memory.domain || memory.topic || "general",
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