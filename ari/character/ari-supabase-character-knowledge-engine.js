// ari/character/ari-supabase-character-knowledge-engine.js
// Purpose: Retrieve Ari's character knowledge from Supabase and build a character knowledge packet.
// V0.2.0 — Single Semantic Character Retrieval / Domain-Locked / Faster

window.Ari = window.Ari || {};

window.AriSupabaseCharacterKnowledgeEngine = {
  version: "0.2.0",

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
  const direct = this.directCharacterNode(question);

  if (direct) {
    return this.packet({
      question,
      context,
      exactMatch: true,
      primaryNode: direct,
      supportingNodes: [],
      confidence: "high",
      reason: "Direct character node matched."
    });
  }

  const semantic = await this.searchSemanticCharacterNodes({ question });

      if (semantic.primaryNode) {
        return this.packet({
          question,
          context,
          exactMatch: semantic.score >= 0.75,
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
        reason:
          "No semantic character node matched. Character inference may be needed."
      });
    } catch (error) {
      return this.error(error);
    }
  },

  shouldRun(context = {}, question = "") {
    if (context.characterUseAllowed === true) return true;

    const text = String(question || "").toLowerCase();

    return /\b(who are you|what are you|your favorite|what'?s your favorite|what is your favorite|do you like|what do you like|what do you value|your values|your beliefs|what do you believe|what do you stand for|what do you think|your opinion|your purpose|your mission|ari|are you ai|do you identify)\b/.test(text);
  },

directCharacterNode(question = "") {
  const text = String(question || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'");

  if (/\b(your purpose|your mission|what'?s your purpose|what is your purpose)\b/.test(text)) {
    return {
      domain: "character_core",
      subdomain: "identity",
      topic: "Ari Purpose",
      summary:
        "Ari's purpose is to help the user become healthier, wiser, stronger, and more fulfilled while never feeling alone in the journey.",
      definition:
        "Ari exists to provide support, guidance, clarity, companionship, and practical help in a way aligned with health, wisdom, strength, fulfillment, and connection.",
      knowledge_id: "direct_character_purpose",
      knowledge_type: "direct_character_node",
      confidence: 1.0,
      similarity: 1.0
    };
  }

  if (/\b(who are you|what are you|tell me about yourself|your identity)\b/.test(text)) {
    return {
      domain: "character_core",
      subdomain: "identity",
      topic: "Ari Identity",
      summary:
        "Ari is the user's AI companion and cognitive partner for health, life, projects, reflection, and support.",
      definition:
        "Ari is designed to be useful, honest, grounded, warm, direct, and protective without pretending to be human.",
      knowledge_id: "direct_character_identity",
      knowledge_type: "direct_character_node",
      confidence: 1.0,
      similarity: 1.0
    };
  }

  if (/\b(your values|what do you value|what do you believe|your beliefs|what do you stand for)\b/.test(text)) {
    return {
      domain: "character_core",
      subdomain: "values",
      topic: "Ari Values",
      summary:
        "Ari values truth, health, wisdom, loyalty, growth, dignity, responsibility, courage, and human connection.",
      definition:
        "Ari's values guide how responses should be shaped, especially during emotional, difficult, or important conversations.",
      knowledge_id: "direct_character_values",
      knowledge_type: "direct_character_node",
      confidence: 1.0,
      similarity: 1.0
    };
  }

  return null;
},

  async searchSemanticCharacterNodes({ question = "" } = {}) {
    const url =
      `/api/knowledge?action=semantic_search_ari_nodes` +
      `&query=${encodeURIComponent(question)}` +
      `&domain=character_core` +
      `&limit=5`;

    const data = await this.fetchJson(url);
    const matches = Array.isArray(data.matches) ? data.matches : [];

    const characterMatches = matches
      .filter(node => this.isCharacterNode(node))
      .filter(node => Number(node.similarity || 0) >= 0.45)
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
    const domain = String(node.domain || "").toLowerCase();
    const type = String(node.knowledge_type || "").toLowerCase();
    const subdomain = String(node.subdomain || "").toLowerCase();

    return (
      domain === "character_core" ||
      type.includes("character") ||
      subdomain.includes("character") ||
      subdomain.includes("preference") ||
      subdomain.includes("worldview")
    );
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
      supabaseCharacterKnowledgeSource:
        "ari-supabase-character-knowledge-engine",

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
      supabaseCharacterKnowledgeSource:
        "ari-supabase-character-knowledge-engine",
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
    const message =
      error?.message || String(error || "Unknown character knowledge error.");

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