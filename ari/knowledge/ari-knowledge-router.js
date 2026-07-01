// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Choose where Ari should retrieve knowledge from.
// V3.0.2 — ACE-Aware / Source Router / Supabase-Ready / OpenAI Fallback

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "3.0.2",

  async route(input = {}) {
  const summary = input.summary || input || {};
  const question = this.getQuestion(summary);
  const ace = summary.cognitiveExecutive || {};
  const requires = ace.requires || {};

  if (
    summary.characterReasoning?.characterAnswerAvailable === true ||
    summary.characterAnswerAvailable === true
  ) {
    return this.noKnowledge(
      "Character reasoning already produced the Ari identity/preference/worldview answer."
    );
  }

  const plan = this.buildPlan(summary, question, requires);

  if (!plan.shouldRetrieve) {
    return this.noKnowledge(plan.reason);
  }

  const results = [];

  for (const source of plan.sources) {
    const result = await this.runSource(source, summary, question);
    if (result) results.push(result);
    if (result?.usable === true && source.stopOnUsable !== false) break;
  }

  const best = this.chooseBestResult(results);

  if (!best) {
    return this.noKnowledge("Knowledge retrieval ran, but no usable knowledge was found.", true, {
      plan,
      results
    });
  }

  return {
    knowledgeRouterRan: true,
    knowledgeRouterVersion: this.version,
    knowledgeRouterSource: "ari-knowledge-router",

    shouldUseKnowledge: true,
    knowledgeRetrievalPlan: plan,
    knowledgeRetrievalResults: results,

    knowledgeAnswer: best.answer || null,
    finalResponse: best.finalResponse || best.answer || null,

    knowledgeConfidence: best.confidence || "medium",
    knowledgeSources: best.sources || [],
    knowledgeProvider: best.provider || "unknown",
    knowledgeError: best.error || null,

    openAIKnowledgeUsed: best.provider === "openai",
    openAIKnowledgeSource: best.provider === "openai" ? best.source || "api/knowledge" : null,

    mealEstimate: best.mealEstimate || null,
    foodAnalysis: best.foodAnalysis || null,
    nutritionEstimate: best.nutritionEstimate || null,
    pendingAction: best.pendingAction || null,

    rawKnowledgeResult: best.raw || null,
    knowledgeReason: plan.reason
  };
},

  buildPlan(summary = {}, question = "", requires = {}) {
    const sources = [];

    const needsKnowledge =
      requires.knowledgeGraph === true ||
      requires.systemKnowledge === true ||
      requires.userMemory === true ||
      requires.liveVerification === true ||
      this.legacyShouldUseKnowledge(summary, question);

    if (!needsKnowledge) {
      return {
        shouldRetrieve: false,
        reason: "ACE and semantic pipeline did not request knowledge retrieval.",
        sources: []
      };
    }

    if (requires.userMemory === true) {
      sources.push({
        id: "user_memory",
        priority: 10,
        stopOnUsable: false
      });
    }

    if (requires.systemKnowledge === true) {
      sources.push({
        id: "system_knowledge",
        priority: 20,
        stopOnUsable: false
      });
    }

    if (requires.knowledgeGraph === true) {
      sources.push({
        id: "supabase_knowledge_graph",
        priority: 30,
        stopOnUsable: true
      });
    }

    if (requires.liveVerification === true) {
      sources.push({
        id: "live_verification",
        priority: 40,
        stopOnUsable: true
      });
    }

    if (!this.isAriIdentityOrPreferenceQuestion(question)) {
  sources.push({
    id: "openai",
    priority: 90,
    stopOnUsable: true
  });
}

    return {
      shouldRetrieve: true,
      reason: this.getKnowledgeReason(summary, question, requires),
      sources: sources.sort((a, b) => a.priority - b.priority),
      aceAuthority: summary.cognitiveExecutive?.authority || "none",
      aceState: summary.cognitiveExecutive?.cognitiveState || null,
      aceRequires: requires
    };
  },

  async runSource(source = {}, summary = {}, question = "") {
    switch (source.id) {
      case "user_memory":
        return await this.queryUserMemory(summary, question);

      case "system_knowledge":
        return await this.querySystemKnowledge(summary, question);

      case "supabase_knowledge_graph":
        return await this.querySupabaseKnowledge(summary, question);

      case "live_verification":
        return await this.queryLiveVerification(summary, question);

      case "openai":
        return await this.queryOpenAI(summary, question);

      default:
        return null;
    }
  },

  async queryUserMemory(summary = {}, question = "") {
    const engine =
      window.AriMemoryRetrievalEngine ||
      window.Ari?.memoryRetrievalEngine;

    if (!engine) {
      return this.unavailable("user_memory", "User memory retrieval engine unavailable.");
    }

    const method =
      typeof engine.retrieve === "function"
        ? "retrieve"
        : typeof engine.search === "function"
          ? "search"
          : null;

    if (!method) {
      return this.unavailable("user_memory", "User memory retrieval method unavailable.");
    }

    try {
      const result = await engine[method]({ summary, question });
      return this.normalizeResult("user_memory", result);
    } catch (error) {
      return this.errorResult("user_memory", error);
    }
  },

  async querySystemKnowledge(summary = {}, question = "") {
    const client =
      window.AriSupabaseKnowledgeClient ||
      window.Ari?.supabaseKnowledgeClient;

    if (!client || typeof client.searchSystemKnowledge !== "function") {
      return this.unavailable("system_knowledge", "System knowledge client unavailable.");
    }

    try {
      const result = await client.searchSystemKnowledge({ summary, question });
      return this.normalizeResult("system_knowledge", result);
    } catch (error) {
      return this.errorResult("system_knowledge", error);
    }
  },

  async querySupabaseKnowledge(summary = {}, question = "") {
    const client =
      window.AriSupabaseKnowledgeClient ||
      window.Ari?.supabaseKnowledgeClient;

    if (!client || typeof client.searchKnowledgeGraph !== "function") {
      return this.unavailable("supabase_knowledge_graph", "Supabase knowledge graph client unavailable.");
    }

    try {
      const result = await client.searchKnowledgeGraph({ summary, question });
      return this.normalizeResult("supabase_knowledge_graph", result);
    } catch (error) {
      return this.errorResult("supabase_knowledge_graph", error);
    }
  },

  async queryLiveVerification(summary = {}, question = "") {
    const client =
      window.AriLiveVerificationClient ||
      window.Ari?.liveVerificationClient;

    if (!client || typeof client.verify !== "function") {
      return this.unavailable("live_verification", "Live verification client unavailable.");
    }

    try {
      const result = await client.verify({ summary, question });
      return this.normalizeResult("live_verification", result);
    } catch (error) {
      return this.errorResult("live_verification", error);
    }
  },

  async queryOpenAI(summary = {}, question = "") {
    const client = window.AriOpenAIKnowledgeClient;

    if (!client || typeof client.ask !== "function") {
      return this.unavailable("openai", "OpenAI knowledge client unavailable.");
    }

    try {
      const result = await client.ask({ summary, question });
      return this.normalizeResult("openai", result);
    } catch (error) {
      return this.errorResult("openai", error);
    }
  },

  normalizeResult(provider = "unknown", result = null) {
    if (!result) {
      return {
        provider,
        usable: false,
        answer: null,
        confidence: "none",
        sources: [],
        raw: null,
        reason: "No result returned."
      };
    }

    const answer =
      result.finalResponse ||
      result.knowledgeAnswer ||
      result.answer ||
      result.reply ||
      result.text ||
      null;

    const sources =
      result.knowledgeSources ||
      result.knowledgeCitations ||
      result.sources ||
      result.citations ||
      [];

    const confidence =
      result.knowledgeConfidence ||
      result.confidence ||
      (answer ? "medium" : "none");

    return {
      provider,
      usable: Boolean(answer) || Array.isArray(result.nodes) && result.nodes.length > 0,
      answer,
      finalResponse: result.finalResponse || null,
      confidence,
      sources,
      nodes: result.nodes || [],
      raw: result,

      mealEstimate: result.mealEstimate || null,
      foodAnalysis: result.foodAnalysis || null,
      nutritionEstimate: result.nutritionEstimate || null,
      pendingAction: result.pendingAction || null,

      error: result.knowledgeError || result.error || null,
      source: result.knowledgeProvider || result.source || provider
    };
  },

  chooseBestResult(results = []) {
    return results.find(result => result?.usable === true) || null;
  },

  unavailable(provider = "unknown", reason = "Provider unavailable.") {
    return {
      provider,
      usable: false,
      answer: null,
      confidence: "none",
      sources: [],
      error: reason,
      reason
    };
  },

  errorResult(provider = "unknown", error = null) {
    const message = error?.message || String(error || "Unknown error.");

    return {
      provider,
      usable: false,
      answer: null,
      confidence: "none",
      sources: [],
      error: message,
      reason: message
    };
  },

isAriIdentityOrPreferenceQuestion(question = "") {
  const text = String(question || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'");

  return (
    /\b(what'?s your favorite|what is your favorite|your favorite|do you like|what do you like|what would you choose|what would you prefer|what do you value|your values|your beliefs|what do you believe|what do you stand for|who are you|what are you|tell me about yourself|your mission|your purpose|your opinion|what do you think)\b/.test(text) &&
    /\b(you|your|ari|yourself)\b/.test(text)
  );
},

  legacyShouldUseKnowledge(summary = {}, question = "") {
    const lower = String(question || "").toLowerCase();

    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};
    const map = summary.situationMap || {};
    const responseIntent = summary.responseIntent || "";

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      "";

    const domains = map.domains || summary.domains || [];
    const needs = map.needs || summary.needs || [];
    const questions = map.questions || summary.questions || [];

    if (!lower.trim()) return false;

    if (summary.resolvedUserQuestion || summary.threadQuestion?.resolvedUserQuestion) return true;
    if (summary.semanticExpectsDirectAnswer === true) return true;
    if (summary.directAnswerNeeded === true) return true;

    if (
      [
        "teacher",
        "builder",
        "executive_decision",
        "medical_context",
        "ari_self",
        "writer",
        "companion"
      ].includes(primary)
    ) return true;

    if (
      [
        "teach_clearly",
        "explain",
        "answer_question",
        "implementation_help",
        "decision_support",
        "write",
        "rewrite",
        "summarize"
      ].includes(responseIntent)
    ) return true;

    if (domains.includes("knowledge_domain")) return true;
    if (domains.includes("builder_domain")) return true;
    if (domains.includes("writing_domain")) return true;

    if (needs.includes("understanding")) return true;
    if (needs.includes("decision_support")) return true;
    if (needs.includes("action_or_build_help")) return true;
    if (needs.includes("writing_or_rewrite")) return true;
    if (needs.includes("calculation")) return true;
    if (needs.includes("conversation")) return true;

    if (questions.includes("knowledge_question")) return true;
    if (questions.includes("instruction_question")) return true;
    if (questions.includes("decision_question")) return true;

    return /\b(what|who|when|where|why|how|explain|teach|compare|difference|should|recommend|best|fix|debug|code|help|write|rewrite|summarize|favorite|color)\b/.test(lower);
  },

  getQuestion(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  getKnowledgeReason(summary = {}, question = "", requires = {}) {
    if (requires.liveVerification) {
      return "ACE requested live verification because the answer may change over time.";
    }

    if (requires.knowledgeGraph) {
      return "ACE requested the knowledge graph for grounded understanding.";
    }

    if (requires.systemKnowledge) {
      return "ACE requested system knowledge for Ari/CalBuddy/project context.";
    }

    if (requires.userMemory) {
      return "ACE requested user memory for personalized context.";
    }

    if (summary.directAnswerNeeded === true) {
      return "Direct answer needed; OpenAI fallback may generate a natural response.";
    }

    if (summary.semanticExpectsDirectAnswer === true) {
      return "Semantic frame expects a direct answer.";
    }

    return "Knowledge retrieval requested by semantic fallback.";
  },

  noKnowledge(reason = "No outside/AI knowledge needed.", unavailable = false, extra = {}) {
    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: false,

      knowledgeAnswer: null,
      finalResponse: null,
      knowledgeConfidence: "none",
      knowledgeSources: [],
      knowledgeProvider: unavailable ? "unknown" : null,
      knowledgeError: unavailable ? reason : null,
      openAIKnowledgeUsed: false,
      openAIKnowledgeSource: null,
      knowledgeReason: reason,

      ...extra
    };
  }
};

console.log(
  "ARI KNOWLEDGE ROUTER LOADED:",
  window.AriKnowledgeRouter?.version
);