// ari/knowledge/ari-supabase-knowledge-client.js
// Ari Supabase Knowledge Client
// Purpose: Retrieve Ari Knowledge Graph + system knowledge from Supabase.
// V0.3.4 — Relaxed Semantic + Keyword Fallback / Six-Core Compatible

window.Ari = window.Ari || {};

window.AriSupabaseKnowledgeClient = {
  version: "0.3.4",

  async searchKnowledgeGraph({ summary = {}, question = "" } = {}) {
    const cleanQuestion = String(question || "").trim();
    if (!cleanQuestion) return this.empty("No usable semantic knowledge query.");

    try {
      const router = summary.knowledgeRouter || summary.knowledgeRetrievalPlan || {};
      const searchOrder =
        router.searchOrder ||
        router.cores ||
        summary.searchOrder ||
        [{ core: "knowledge_core", weight: 1.0 }];

      const semantic = await this.semanticSearch(cleanQuestion, searchOrder, 0.22);

      if (semantic.matches.length) {
        return this.formatNodes(
          semantic.matches,
          "ari_knowledge_nodes_semantic",
          [cleanQuestion],
          semantic.raw
        );
      }

      const keyword = await this.keywordFallbackSearch(cleanQuestion, searchOrder);

      if (keyword.matches.length) {
        return this.formatNodes(
          keyword.matches,
          "ari_knowledge_nodes_keyword_fallback",
          this.extractSearchTerms(cleanQuestion),
          keyword.raw
        );
      }

      return this.empty("No semantic or keyword knowledge node matched.");
    } catch (error) {
      return this.error(error);
    }
  },

  async semanticSearch(query = "", searchOrder = [], minSimilarity = 0.22) {
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "semantic_search_ari_nodes",
        query,
        searchOrder,
        limit: 6,
        limitPerCore: 3,
        minSimilarity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Semantic knowledge search failed.");
    }

    return {
      matches: Array.isArray(data.matches) ? data.matches : [],
      raw: data
    };
  },

  async keywordFallbackSearch(question = "", searchOrder = []) {
    const supabase = this.getClient();
    if (!supabase) return { matches: [], raw: { reason: "Supabase client unavailable." } };

    const terms = this.extractSearchTerms(question);
    if (!terms.length) return { matches: [], raw: { reason: "No keyword fallback terms." } };

    const cores = searchOrder
      .map(item => item.core)
      .filter(Boolean);

    const columns = [
      "topic",
      "summary",
      "purpose",
      "importance",
      "how_ari_should_use_this",
      "definition",
      "deep_understanding"
    ];

    const filters = this.buildOrFilter(terms, columns);

    let query = supabase
      .from("ari_knowledge_nodes")
      .select("*")
      .or(filters)
      .limit(8);

    if (cores.length) {
  query = query.in("domain", cores);
}

    const { data, error } = await query;
    if (error) throw error;

    const matches = (data || [])
      .map(node => ({
        ...node,
        __ariScore: this.keywordScore(node, terms, cores)
      }))
      .sort((a, b) => b.__ariScore - a.__ariScore)
      .slice(0, 6);

    return {
      matches,
      raw: {
        success: true,
        fallback: "keyword",
        query: question,
        searchOrder,
        searchedCores: cores,
        terms,
        count: matches.length
      }
    };
  },

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

  keywordScore(node = {}, terms = [], cores = []) {
    const text = [
      node.topic,
      node.summary,
      node.purpose,
      node.importance,
      node.how_ari_should_use_this,
      node.definition,
      node.deep_understanding,
      Array.isArray(node.practical_applications)
        ? node.practical_applications.join(" ")
        : ""
    ].join(" ").toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (text.includes(term)) score += 2;
    }

    if (cores.includes(node.domain)) score += 2;
    if (node.topic) score += 1;

    return score;
  },

  extractSearchTerms(question = "") {
    const stopWords = new Set([
      "what", "who", "when", "where", "why", "how",
      "is", "are", "was", "were", "the", "a", "an",
      "of", "to", "for", "in", "on", "and", "or",
      "does", "do", "did", "can", "you", "me", "my",
      "about", "explain", "define", "tell", "should",
      "approach", "because"
    ]);

    return String(question || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 3)
      .filter(word => !stopWords.has(word))
      .slice(0, 10);
  },

  buildOrFilter(terms = [], columns = []) {
    return terms
      .flatMap(term =>
        columns.map(column => `${column}.ilike.%${this.escapeSupabaseFilterTerm(term)}%`)
      )
      .join(",");
  },

  escapeSupabaseFilterTerm(term = "") {
    return String(term || "").replace(/[%(),]/g, "").trim();
  },

  formatNodes(nodes = [], source = "ari_knowledge_nodes", terms = [], rawSearch = null) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return this.empty("No matching knowledge nodes found.");
  }

  const trimmedNodes = nodes.slice(0, 6).map(node => ({
    id: node.id,
    domain: node.domain,
    subdomain: node.subdomain,
    topic: node.topic,
    summary: node.summary,
    definition: node.definition,
    purpose: node.purpose,
    importance: node.importance,
    how_it_works: node.how_it_works,
    deep_understanding: node.deep_understanding,
    how_ari_should_use_this: node.how_ari_should_use_this,
    knowledge_id: node.knowledge_id,
    knowledge_type: node.knowledge_type,
    core: node.core || node.domain,
    similarity: node.similarity,
    weightedScore: node.weightedScore,
    routerWeight: node.routerWeight,
    __ariScore: node.__ariScore
  }));

  const bestScore =
    trimmedNodes[0]?.weightedScore ||
    trimmedNodes[0]?.similarity ||
    trimmedNodes[0]?.__ariScore ||
    0;

  return {
    finalResponse: null,
    knowledgeAnswer: null,
    answer: null,

    confidence: bestScore >= 0.5 ? "high" : "medium",
    sources: [source],
    nodes: trimmedNodes,

    provider: "supabase",
    usable: trimmedNodes.length > 0,

    searchTerms: terms,
    bestScore,

    searchedCores: rawSearch?.searchedCores || [],
    searchOrder: rawSearch?.searchOrder || [],
    coreResults: rawSearch?.coreResults || [],

    timing: rawSearch?.timing || null,
    knowledgeApiTiming: rawSearch?.timing || null,

    rawSearch: null
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

  error(error = null) {
    const message = error?.message || String(error || "Unknown Supabase error.");
    return { ...this.empty(message), error: message };
  }
};

window.Ari.supabaseKnowledgeClient = window.AriSupabaseKnowledgeClient;

console.log(
  "ARI SUPABASE KNOWLEDGE CLIENT LOADED:",
  window.AriSupabaseKnowledgeClient.version
);