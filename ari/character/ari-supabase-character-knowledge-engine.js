// ari/character/ari-supabase-character-knowledge-engine.js
// Purpose: Retrieve Ari's character knowledge from Supabase and build a character knowledge packet.
// V0.1.0 — Supabase Character Retrieval / Exact + Semantic / Advisory Only

window.Ari = window.Ari || {};

window.AriSupabaseCharacterKnowledgeEngine = {
  version: "0.1.0",

  async retrieve(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      {};

    if (!question) {
      return this.empty("No character knowledge query.");
    }

    if (!this.shouldRun(context, question)) {
      return this.empty("Character knowledge not requested.");
    }

    try {
      const exact = await this.searchExactCharacterNode({ question, context });

      if (exact.primaryNode) {
        return this.packet({
          question,
          context,
          exactMatch: true,
          primaryNode: exact.primaryNode,
          supportingNodes: exact.supportingNodes,
          confidence: "high",
          reason: "Exact character node matched."
        });
      }

      const semantic = await this.searchSemanticCharacterNodes({ question, context });

      if (semantic.primaryNode) {
        return this.packet({
          question,
          context,
          exactMatch: false,
          primaryNode: semantic.primaryNode,
          supportingNodes: semantic.supportingNodes,
          confidence: semantic.score >= 0.55 ? "high" : "medium",
          reason: "Semantic character node matched."
        });
      }

      return this.packet({
        question,
        context,
        exactMatch: false,
        primaryNode: null,
        supportingNodes: [],
        confidence: "low",
        inferenceNeeded: true,
        reason: "No exact or semantic character node matched. Character inference may be needed."
      });
    } catch (error) {
      return this.error(error);
    }
  },

  shouldRun(context = {}, question = "") {
    if (context.characterUseAllowed === true) return true;

    const text = String(question || "").toLowerCase();

    return /\b(who are you|what are you|your favorite|what'?s your favorite|what is your favorite|do you like|what do you like|what do you value|your values|your beliefs|what do you believe|what do you stand for|what do you think|your opinion|your purpose|your mission|ari)\b/.test(text);
  },

  async searchExactCharacterNode({ question = "", context = {} } = {}) {
    const focus =
      context.characterFocus ||
      this.inferFocus(question);

    const exactKnowledgeId = this.focusToKnowledgeId(focus);

    if (!exactKnowledgeId) {
      return {
        primaryNode: null,
        supportingNodes: []
      };
    }

    const url =
      `/api/knowledge?action=semantic_search_ari_nodes` +
      `&query=${encodeURIComponent(exactKnowledgeId)}` +
      `&limit=8`;

    const data = await this.fetchJson(url);
    const matches = Array.isArray(data.matches) ? data.matches : [];

    const primaryNode =
      matches.find(node => node.knowledge_id === exactKnowledgeId) ||
      null;

    const supportingNodes = matches
      .filter(node => node.id !== primaryNode?.id)
      .filter(node => this.isCharacterNode(node))
      .slice(0, 3);

    return {
      primaryNode,
      supportingNodes
    };
  },

  async searchSemanticCharacterNodes({ question = "" } = {}) {
    const url =
      `/api/knowledge?action=semantic_search_ari_nodes` +
      `&query=${encodeURIComponent(question)}` +
      `&limit=10`;

    const data = await this.fetchJson(url);
    const matches = Array.isArray(data.matches) ? data.matches : [];

    const characterMatches = matches
      .filter(node => this.isCharacterNode(node))
      .filter(node => Number(node.similarity || 0) >= 0.5)
      .sort((a, b) => Number(b.similarity || 0) - Number(a.similarity || 0));

    return {
      primaryNode: characterMatches[0] || null,
      supportingNodes: characterMatches.slice(1, 4),
      score: Number(characterMatches[0]?.similarity || 0)
    };
  },

  async fetchJson(url = "") {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Character knowledge request failed.");
    }

    return data;
  },

  isCharacterNode(node = {}) {
    const type = String(node.knowledge_type || "").toLowerCase();
    const subdomain = String(node.subdomain || "").toLowerCase();

    return (
      type.includes("character_") ||
      subdomain.includes("character") ||
      subdomain.includes("preference") ||
      subdomain.includes("worldview")
    );
  },

  inferFocus(question = "") {
    const text = String(question || "").toLowerCase();

    if (text.includes("favorite color") || text.includes("favourite color")) return "favoriteColor";
    if (text.includes("favorite quote")) return "favoriteQuote";
    if (text.includes("mission")) return "mission";
    if (text.includes("purpose")) return "purpose";
    if (text.includes("values") || text.includes("value")) return "values";
    if (text.includes("laws") || text.includes("rules")) return "laws";
    if (text.includes("ai") || text.includes("artificial intelligence")) return "artificialIntelligence";
    if (text.includes("meaning of life") || text.includes("meaning")) return "meaningPurpose";
    if (text.includes("who are you") || text.includes("what are you") || text.includes("identity")) return "identity";

    return null;
  },

  focusToKnowledgeId(focus = "") {
    const map = {
      identity: "ARI-CORE-IDENTITY",
      mission: "ARI-CORE-MISSION",
      values: "ARI-CORE-VALUES",
      laws: "ARI-CORE-LAWS",
      favoriteColor: "ARI-PREF-FAVORITE-COLOR",
      favoriteQuote: "ARI-PREF-FAVORITE-QUOTE",
      purpose: "ARI-WORLDVIEW-PURPOSE",
      meaningPurpose: "ARI-WORLDVIEW-PURPOSE",
      artificialIntelligence: "ARI-WORLDVIEW-AI"
    };

    return map[focus] || null;
  },

  packet({
    question = "",
    context = {},
    exactMatch = false,
    primaryNode = null,
    supportingNodes = [],
    confidence = "medium",
    inferenceNeeded = false,
    reason = ""
  } = {}) {
    return {
      supabaseCharacterKnowledgeRan: true,
      supabaseCharacterKnowledgeVersion: this.version,
      supabaseCharacterKnowledgeSource: "ari-supabase-character-knowledge-engine",

      characterKnowledgeAvailable: Boolean(primaryNode),
      exactMatch,
      inferenceNeeded,

      question,
      characterMode: context.characterMode || null,
      characterFocus: context.characterFocus || null,

      primaryNode,
      supportingNodes,

      nodes: [primaryNode, ...supportingNodes].filter(Boolean),

      confidence,
      reason,

      authority: "advisory_character_knowledge_only",

      cannotSet: [
        "primaryLane",
        "riskLevel",
        "finalResponse",
        "medicalEscalation",
        "legalAdvice",
        "financialAdvice",
        "diagnosis",
        "toolExecutionClaim"
      ]
    };
  },

  empty(reason = "No character knowledge available.") {
    return {
      supabaseCharacterKnowledgeRan: true,
      supabaseCharacterKnowledgeVersion: this.version,
      supabaseCharacterKnowledgeSource: "ari-supabase-character-knowledge-engine",
      characterKnowledgeAvailable: false,
      exactMatch: false,
      inferenceNeeded: false,
      primaryNode: null,
      supportingNodes: [],
      nodes: [],
      confidence: "none",
      reason,
      authority: "advisory_character_knowledge_only"
    };
  },

  error(error = null) {
    const message = error?.message || String(error || "Unknown character knowledge error.");

    return {
      ...this.empty(message),
      error: message
    };
  },

  getQuestion(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  }
};

window.Ari.supabaseCharacterKnowledgeEngine =
  window.AriSupabaseCharacterKnowledgeEngine;

console.log(
  "ARI SUPABASE CHARACTER KNOWLEDGE ENGINE LOADED:",
  window.AriSupabaseCharacterKnowledgeEngine.version
);