// ari/knowledge/ari-supabase-knowledge-client.js
// Ari Supabase Knowledge Client
// Purpose: Retrieve Ari Knowledge Graph + system knowledge from Supabase.
// V0.2.1 — Keyword Candidate Retrieval / Router-Compatible / Semantic-Safe

window.Ari = window.Ari || {};

window.AriSupabaseKnowledgeClient = {
  version: "0.2.1",

  getClient() {
  return (
    window.calbuddySupabase ||
    window.CalBuddy?.supabase ||
    window.CalBuddy?.supabaseClient ||
    window.CalBuddy?.db ||
    window.supabaseClient ||
    window.supabase ||
    window.sb ||
    null
  );
},

async searchKnowledgeGraph({ question = "" } = {}) {
  const cleanQuestion = String(question || "").trim();

  if (!cleanQuestion) {
    return this.empty("No usable semantic knowledge query.");
  }

  try {
    const url =
      `/api/knowledge?action=semantic_search_ari_nodes` +
      `&query=${encodeURIComponent(cleanQuestion)}` +
      `&limit=5`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Semantic knowledge search failed.");
    }

    const matches = Array.isArray(data.matches) ? data.matches : [];

    return this.formatNodes(
      matches,
      "ari_knowledge_nodes_semantic",
      [cleanQuestion]
    );
  } catch (error) {
    return this.error(error);
  }
},

  async searchSystemKnowledge({ question = "" } = {}) {
    const supabase = this.getClient();

    if (!supabase) return this.unavailable("Supabase client unavailable.");

    const terms = this.extractSearchTerms(question);
    if (!terms.length) return this.empty("No usable system knowledge query.");

    try {
      const filters = this.buildOrFilter(terms, [
        "topic",
        "summary",
        "decision",
        "reason",
        "file_path",
        "status"
      ]);

      const { data, error } = await supabase
        .from("ari_system_knowledge")
        .select("*")
        .or(filters)
        .limit(10);

      if (error) throw error;

      return this.formatSystemKnowledge((data || []).slice(0, 5), terms);
    } catch (error) {
      return this.error(error);
    }
  },

  extractSearchTerms(question = "") {
    const stopWords = new Set([
      "what", "who", "when", "where", "why", "how",
      "is", "are", "was", "were", "the", "a", "an",
      "of", "to", "for", "in", "on", "and", "or",
      "does", "do", "did", "can", "you", "me", "my",
      "about", "explain", "define", "tell"
    ]);

    return String(question || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 3)
      .filter(word => !stopWords.has(word))
      .slice(0, 8);
  },

  buildOrFilter(terms = [], columns = []) {
    const safeTerms = terms
      .map(term => this.escapeSupabaseFilterTerm(term))
      .filter(Boolean);

    const filters = [];

    for (const term of safeTerms) {
      for (const column of columns) {
        filters.push(`${column}.ilike.%${term}%`);
      }
    }

    return filters.join(",");
  },

  escapeSupabaseFilterTerm(term = "") {
    return String(term || "")
      .replace(/[%(),]/g, "")
      .trim();
  },

  rankNodes(nodes = [], terms = []) {
    return [...nodes]
      .map(node => ({
        ...node,
        __ariScore: this.scoreNode(node, terms)
      }))
      .sort((a, b) => b.__ariScore - a.__ariScore);
  },

  scoreNode(node = {}, terms = []) {
    const text = [
      node.topic,
      node.summary,
      node.definition,
      node.purpose,
      node.importance,
      node.how_it_works,
      node.deep_understanding,
      node.universal_principle,
      node.knowledge_id,
      node.knowledge_path,
      node.knowledge_type,
      node.domain,
      node.subdomain,
      Array.isArray(node.tags) ? node.tags.join(" ") : ""
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (!term) continue;
      if (text.includes(term)) score += 1;
      if (String(node.topic || "").toLowerCase().includes(term)) score += 2;
      if (Array.isArray(node.tags) && node.tags.map(String).some(tag => tag.toLowerCase().includes(term))) {
        score += 2;
      }
    }

    return score;
  },

  formatNodes(nodes = [], source = "ari_knowledge_nodes", terms = []) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return this.empty("No matching knowledge nodes found.");
    }

    const answer = nodes
      .map(node => {
        return [
          `Topic: ${node.topic || "Untitled"}`,
          node.definition ? `Definition: ${node.definition}` : null,
          node.summary ? `Summary: ${node.summary}` : null,
          node.purpose ? `Purpose: ${node.purpose}` : null,
          node.importance ? `Importance: ${node.importance}` : null,
          node.how_it_works ? `How it works: ${node.how_it_works}` : null,
          node.universal_principle ? `Universal principle: ${node.universal_principle}` : null
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const bestScore = nodes[0]?.similarity || nodes[0]?.__ariScore || 0;

    return {
      finalResponse: null,
      knowledgeAnswer: answer,
      answer,
      confidence: bestScore >= 0.5 ? "high" : "medium",
      sources: [source],
      nodes,
      provider: "supabase",
      usable: true,
      searchTerms: terms,
      bestScore
    };
  },

  formatSystemKnowledge(rows = [], terms = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return this.empty("No matching system knowledge found.");
    }

    const answer = rows
      .map(row => {
        return [
          row.topic ? `Topic: ${row.topic}` : null,
          row.summary ? `Summary: ${row.summary}` : null,
          row.decision ? `Decision: ${row.decision}` : null,
          row.reason ? `Reason: ${row.reason}` : null,
          row.file_path ? `File: ${row.file_path}` : null,
          row.status ? `Status: ${row.status}` : null
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
      usable: true,
      searchTerms: terms
    };
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