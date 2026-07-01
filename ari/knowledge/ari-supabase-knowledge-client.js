// ari/knowledge/ari-supabase-knowledge-client.js
// Ari Supabase Knowledge Client
// Purpose: Retrieve Ari Knowledge Graph + system knowledge from Supabase.
// V0.1.0 — Read-Only / Router-Compatible / Safe Fallback

window.Ari = window.Ari || {};

window.AriSupabaseKnowledgeClient = {
  version: "0.1.0",

  getClient() {
    return window.CalBuddy?.supabase || window.supabaseClient || null;
  },

  async searchKnowledgeGraph({ question = "" } = {}) {
    const supabase = this.getClient();

    if (!supabase) {
      return this.unavailable("Supabase client unavailable.");
    }

    const query = this.cleanQuery(question);

    if (!query) {
      return this.empty("No usable knowledge query.");
    }

    try {
      const { data, error } = await supabase
        .from("ari_knowledge_nodes")
        .select("*")
        .or(
          `topic.ilike.%${query}%,summary.ilike.%${query}%,definition.ilike.%${query}%,tags.cs.{${query}}`
        )
        .limit(5);

      if (error) throw error;

      return this.formatNodes(data || [], "ari_knowledge_nodes");
    } catch (error) {
      return this.error(error);
    }
  },

  async searchSystemKnowledge({ question = "" } = {}) {
    const supabase = this.getClient();

    if (!supabase) {
      return this.unavailable("Supabase client unavailable.");
    }

    const query = this.cleanQuery(question);

    if (!query) {
      return this.empty("No usable system knowledge query.");
    }

    try {
      const { data, error } = await supabase
        .from("ari_system_knowledge")
        .select("*")
        .or(
          `topic.ilike.%${query}%,summary.ilike.%${query}%,system_area.ilike.%${query}%,tags.cs.{${query}}`
        )
        .limit(5);

      if (error) throw error;

      return this.formatSystemKnowledge(data || []);
    } catch (error) {
      return this.error(error);
    }
  },

  formatNodes(nodes = [], source = "ari_knowledge_nodes") {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return this.empty("No matching knowledge nodes found.");
    }

    const answer = nodes
      .map(node => {
        return [
          `Topic: ${node.topic || "Untitled"}`,
          node.definition ? `Definition: ${node.definition}` : null,
          node.summary ? `Summary: ${node.summary}` : null,
          node.importance ? `Importance: ${node.importance}` : null
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return {
      finalResponse: null,
      knowledgeAnswer: answer,
      answer,
      confidence: "medium",
      sources: [source],
      nodes,
      provider: "supabase",
      usable: true
    };
  },

  formatSystemKnowledge(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return this.empty("No matching system knowledge found.");
    }

    const answer = rows
      .map(row => {
        return [
          `System Area: ${row.system_area || "unknown"}`,
          `Topic: ${row.topic || "Untitled"}`,
          row.summary ? `Summary: ${row.summary}` : null,
          row.decision ? `Decision: ${row.decision}` : null,
          row.reason ? `Reason: ${row.reason}` : null
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return {
      finalResponse: null,
      knowledgeAnswer: answer,
      answer,
      confidence: "medium",
      sources: ["ari_system_knowledge"],
      nodes: rows,
      provider: "supabase",
      usable: true
    };
  },

  cleanQuery(question = "") {
    return String(question || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(" ")
      .trim();
  },

  empty(reason = "No matching knowledge found.") {
    return {
      finalResponse: null,
      knowledgeAnswer: null,
      answer: null,
      confidence: "none",
      sources: [],
      nodes: [],
      provider: "supabase",
      usable: false,
      reason
    };
  },

  unavailable(reason = "Supabase unavailable.") {
    return {
      ...this.empty(reason),
      error: reason
    };
  },

  error(error = null) {
    const message = error?.message || String(error || "Unknown Supabase error.");

    return {
      ...this.empty(message),
      error: message
    };
  }
};

window.Ari.supabaseKnowledgeClient = window.AriSupabaseKnowledgeClient;

console.log(
  "ARI SUPABASE KNOWLEDGE CLIENT LOADED:",
  window.AriSupabaseKnowledgeClient.version
);