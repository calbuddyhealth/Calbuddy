// ari/character/ari-supabase-character-knowledge-engine.js
// Purpose: Retrieve Ari's character knowledge from Supabase and build a character knowledge packet.
// V0.2.4 — Exact Preference Lookup / Semantic Fallback / Inference Last

window.Ari = window.Ari || {};

window.AriSupabaseCharacterKnowledgeEngine = {
  version: "0.2.4",

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
          inferenceNeeded: false,
          reason: "Direct character node matched."
        });
      }

      const exactPreference = await this.searchExactPreferenceNode({ question });

      if (exactPreference?.primaryNode) {
        return this.packet({
          question,
          context,
          exactMatch: true,
          primaryNode: exactPreference.primaryNode,
          supportingNodes: exactPreference.supportingNodes || [],
          confidence: "high",
          inferenceNeeded: false,
          reason: "Exact Supabase preference node matched."
        });
      }

      const semantic = await this.searchSemanticCharacterNodes({ question });

      if (semantic.primaryNode) {
        return this.packet({
          question,
          context,
          exactMatch: semantic.score >= 0.75,
          primaryNode: semantic.primaryNode,
          supportingNodes: semantic.supportingNodes || [],
          confidence: semantic.score >= 0.55 ? "high" : "medium",
          inferenceNeeded: false,
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
          "No exact or semantic character node matched. Character inference may be needed."
      });
    } catch (error) {
      return this.error(error);
    }
  },

  shouldRun(context = {}, question = "") {
    const text = String(question || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'");

    const userStatePattern =
      /\b(i am|i'm|im|i feel|i have|i need|i want|my|me)\b.*\b(exhausted|tired|sleeping|sleep|eating|junk|snapping|stressed|burned out|burnout|overwhelmed|anxious|sad|angry|irritable|hungry|cravings|workout|exercise|nutrition|health|relationship|wife|husband|partner|friend|family|mother|father|job|school)\b/;

    if (userStatePattern.test(text)) return false;

    const explicitCharacterQuestion =
      /\b(who are you|what are you|what is your name|what's your name|tell me about yourself|your identity|your purpose|what'?s your purpose|your mission|what do you value|your values|your beliefs|what do you believe|what do you stand for|are you ai|do you identify)\b/;

    const explicitPreferenceQuestion =
      /\b(what is your favorite|what'?s your favorite|whats your favorite|your favorite|do you like|what do you like|your opinion)\b/;

    if (explicitCharacterQuestion.test(text)) return true;
    if (explicitPreferenceQuestion.test(text)) return true;

    return false;
  },

  async searchExactPreferenceNode({ question = "" } = {}) {
    const preferenceKey = this.extractPreferenceKey(question);

    if (!preferenceKey) {
      return {
        primaryNode: null,
        supportingNodes: [],
        score: 0,
        inferenceNeeded: false,
        reason: "No exact preference key detected."
      };
    }

    const url =
      `/api/knowledge?action=preference_lookup` +
      `&preference_key=${encodeURIComponent(preferenceKey)}`;

    const data = await this.fetchJson(url);

    const node =
      data.node ||
      data.match ||
      data.primaryNode ||
      null;

    if (!node) {
      return {
        primaryNode: null,
        supportingNodes: [],
        score: 0,
        inferenceNeeded: false,
        preferenceKey,
        reason: "No Supabase preference node matched exact preference key."
      };
    }

    return {
      primaryNode: node,
      supportingNodes: [],
      score: 1,
      inferenceNeeded: false,
      preferenceKey,
      reason: "Supabase preference node matched exact preference key."
    };
  },

  extractPreferenceKey(question = "") {
    const text = String(question || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^\w\s']/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const favoriteMatch = text.match(
      /\b(?:what is|what's|whats)\s+your\s+favorite\s+(.+)$/
    );

    if (!favoriteMatch) return null;

    const rawPreference = favoriteMatch[1]
      .replace(/\bthing\b/g, "")
      .replace(/\bkind of\b/g, "")
      .replace(/\btype of\b/g, "")
      .trim();

    if (!rawPreference) return null;

    return "favorite_" + this.slug(rawPreference);
  },

  slug(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");
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