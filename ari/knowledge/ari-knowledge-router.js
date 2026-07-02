// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Decide which Ari knowledge cores should be searched.
// V4.0.0 — Six-Core / SearchOrder Router / Supabase V3 Compatible

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "4.0.0",

  cores: {
    character: "character_core",
    relationship: "relationship_core",
    memory: "memory_core",
    life: "life_core",
    knowledge: "knowledge_core",
    growth: "growth_core"
  },

  async route(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const ace = summary.cognitiveExecutive || {};
    const requires = ace.requires || {};

    if (!question) {
      return this.noKnowledge("No usable question for knowledge routing.");
    }

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
      return this.noKnowledge(plan.reason, false, { knowledgeRetrievalPlan: plan });
    }

    const results = [];

    for (const source of plan.sources) {
      const result = await this.runSource(source, summary, question, plan);
      if (result) results.push(result);
      if (result?.usable === true && source.stopOnUsable !== false) break;
    }

    const best = this.chooseBestResult(results);

    if (!best) {
      return this.noKnowledge(
        "Knowledge retrieval ran, but no usable knowledge was found.",
        true,
        { knowledgeRetrievalPlan: plan, knowledgeRetrievalResults: results }
      );
    }

    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: true,
      knowledgeRetrievalPlan: plan,
      knowledgeRetrievalResults: results,

      primaryCore: plan.primaryCore,
      secondaryCores: plan.secondaryCores,
      searchOrder: plan.searchOrder,

      knowledgeAnswer: best.answer || null,
      finalResponse: best.finalResponse || null,

      knowledgeConfidence: best.confidence || "medium",
      knowledgeSources: best.sources || [],
      knowledgeProvider: best.provider || "unknown",
      knowledgeError: best.error || null,

      openAIKnowledgeUsed: best.provider === "openai",
      openAIKnowledgeSource:
        best.provider === "openai" ? best.source || "api/knowledge" : null,

      knowledgeNodes: best.nodes || [],
      searchedCores: best.raw?.searchedCores || best.searchedCores || [],
      coreResults: best.raw?.coreResults || best.coreResults || [],

      mealEstimate: best.mealEstimate || null,
      foodAnalysis: best.foodAnalysis || null,
      nutritionEstimate: best.nutritionEstimate || null,
      pendingAction: best.pendingAction || null,

      rawKnowledgeResult: best.raw || null,
      knowledgeReason: plan.reason
    };
  },

  buildPlan(summary = {}, question = "", requires = {}) {
    const coreRoute = this.routeCores(summary, question, requires);

    const needsKnowledge =
      coreRoute.shouldRetrieve === true ||
      requires.knowledgeGraph === true ||
      requires.systemKnowledge === true ||
      requires.userMemory === true ||
      requires.liveVerification === true ||
      this.legacyShouldUseKnowledge(summary, question);

    if (!needsKnowledge) {
      return {
        shouldRetrieve: false,
        reason: "No knowledge core was needed for this turn.",
        primaryCore: null,
        secondaryCores: [],
        searchOrder: [],
        sources: []
      };
    }

    const sources = [];

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

    sources.push({
      id: "supabase_knowledge_graph",
      priority: 30,
      stopOnUsable: true,
      searchOrder: coreRoute.searchOrder
    });

    if (requires.liveVerification === true) {
      sources.push({
        id: "live_verification",
        priority: 40,
        stopOnUsable: true
      });
    }

    if (coreRoute.allowOpenAI === true) {
      sources.push({
        id: "openai",
        priority: 90,
        stopOnUsable: true
      });
    }

    return {
      shouldRetrieve: true,
      reason: coreRoute.reason || this.getKnowledgeReason(summary, question, requires),
      primaryCore: coreRoute.primaryCore,
      secondaryCores: coreRoute.secondaryCores,
      searchOrder: coreRoute.searchOrder,
      sources: sources.sort((a, b) => a.priority - b.priority),

      aceAuthority: summary.cognitiveExecutive?.authority || "none",
      aceState: summary.cognitiveExecutive?.cognitiveState || null,
      aceRequires: requires,

      routeSignals: coreRoute.signals || {},
      routeConfidence: coreRoute.confidence || "medium"
    };
  },
    routeCores(summary = {}, question = "", requires = {}) {
    const text = this.normalizeText(question);

    const signals = {
      character: 0,
      relationship: 0,
      memory: 0,
      life: 0,
      knowledge: 0,
      growth: 0
    };

    const add = (core, amount = 1) => {
      if (signals[core] === undefined) return;
      signals[core] += amount;
    };

    const primary =
      summary.situationContractPrimary ||
      summary.primaryLane ||
      summary.triagePrimaryLane ||
      summary.triage?.primaryLane ||
      "";

    const semanticFrame =
      summary.primarySemanticFrame ||
      summary.activeSemanticFrame ||
      summary.semanticFrameOutput?.primaryFrame ||
      "";

    const intent =
      summary.conversationIntent ||
      summary.semanticIntent ||
      summary.laneSplitterSemanticIntent ||
      summary.responseIntent ||
      "";

    const functionType =
      summary.primaryFunction ||
      summary.conversationFunction?.primaryFunction ||
      "";

    const domains =
      summary.situationMap?.domains ||
      summary.domains ||
      [];

    const needs =
      summary.situationMap?.needs ||
      summary.needs ||
      [];

    const questions =
      summary.situationMap?.questions ||
      summary.questions ||
      [];

    if (requires.knowledgeGraph === true) add("knowledge", 2);
    if (requires.systemKnowledge === true) add("knowledge", 2);
    if (requires.userMemory === true) add("relationship", 2);
    if (requires.liveVerification === true) add("knowledge", 2);

    if (primary === "ari_self" || primary === "companion") add("character", 4);
    if (primary === "teacher" || primary === "medical_context") add("knowledge", 3);
    if (primary === "executive_decision") {
      add("life", 2);
      add("knowledge", 1);
      add("relationship", 1);
    }
    if (primary === "builder") {
      add("knowledge", 2);
      add("memory", 1);
    }

    if (functionType === "developer_artifact_request" || functionType === "build_or_debug_request") {
      add("knowledge", 3);
      add("memory", 1);
    }

    if (intent === "answer_question" || intent === "explain" || intent === "teach_clearly") {
      add("knowledge", 3);
    }

    if (intent === "decision_support" || needs.includes("decision_support")) {
      add("life", 3);
      add("relationship", 1);
      add("knowledge", 1);
    }

    if (intent === "implementation_help" || needs.includes("action_or_build_help")) {
      add("life", 2);
      add("knowledge", 2);
    }

    if (intent === "summarize" || intent === "rewrite" || intent === "write") {
      add("knowledge", 1);
      add("memory", 1);
    }

    if (
      domains.includes("knowledge_domain") ||
      questions.includes("knowledge_question") ||
      questions.includes("instruction_question")
    ) {
      add("knowledge", 3);
    }

    if (
      domains.includes("relationship_domain") ||
      domains.includes("personal_domain") ||
      needs.includes("personalization")
    ) {
      add("relationship", 3);
    }

    if (
      domains.includes("memory_domain") ||
      domains.includes("continuity_domain") ||
      summary.laneSplit?.routing?.useThread === true ||
      summary.laneSplit?.routing?.useMemory === true
    ) {
      add("memory", 3);
    }

    if (
      domains.includes("life_domain") ||
      domains.includes("planning_domain") ||
      needs.includes("prioritization") ||
      needs.includes("planning")
    ) {
      add("life", 3);
    }

    if (
      domains.includes("growth_domain") ||
      domains.includes("reflection_domain")
    ) {
      add("growth", 3);
    }

    if (
      this.hasAny(text, [
        "who are you",
        "what are you",
        "tell me about yourself",
        "your purpose",
        "your mission",
        "your values",
        "your personality",
        "your favorite",
        "do you identify",
        "are you ai",
        "are you real",
        "your worldview",
        "what do you believe",
        "what do you stand for"
      ])
    ) {
      add("character", 4);
    }

    if (
      this.hasAny(text, [
        "about me",
        "do you remember me",
        "my goal",
        "my goals",
        "my preferences",
        "my communication style",
        "what do you know about me"
      ])
    ) {
      add("relationship", 4);
    }

    if (
      this.hasAny(text, [
        "earlier",
        "last time",
        "previously",
        "where did we leave off",
        "what did we decide",
        "continue from",
        "resume",
        "what was the last step",
        "what did you say before"
      ])
    ) {
      add("memory", 4);
    }

    if (
      this.hasAny(text, [
        "stressed",
        "overwhelmed",
        "prioritize",
        "dilemma",
        "what should i work on",
        "to do",
        "todo",
        "task",
        "deadline",
        "current situation",
        "right now",
        "this week",
        "today"
      ])
    ) {
      add("life", 4);
    }

    if (
      this.hasAny(text, [
        "can you change",
        "can you grow",
        "evolve",
        "evolution",
        "reflection",
        "why did you change",
        "growth journal",
        "character audit",
        "preference change"
      ])
    ) {
      add("growth", 4);
    }

    if (
      this.hasAny(text, [
        "what",
        "who",
        "when",
        "where",
        "why",
        "how",
        "explain",
        "teach",
        "compare",
        "difference",
        "define",
        "calculate",
        "calories",
        "code",
        "debug",
        "fix",
        "build",
        "implement"
      ])
    ) {
      add("knowledge", 1);
    }

    const ordered = Object.entries(signals)
      .map(([key, score]) => ({
        key,
        core: this.cores[key],
        score
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!ordered.length) {
      return {
        shouldRetrieve: false,
        primaryCore: null,
        secondaryCores: [],
        searchOrder: [],
        confidence: "none",
        allowOpenAI: true,
        signals,
        reason: "No meaningful knowledge-core signal found."
      };
    }

    const primaryCore = ordered[0].core;
    const secondaryCores = ordered.slice(1, 4).map(item => item.core);

    const searchOrder = ordered.slice(0, 4).map((item, index) => ({
      core: item.core,
      weight: this.scoreToWeight(item.score, index)
    }));

    const confidence =
      ordered[0].score >= 4 ? "high" :
      ordered[0].score >= 2 ? "medium" :
      "low";

    return {
      shouldRetrieve: true,
      primaryCore,
      secondaryCores,
      searchOrder,
      confidence,
      allowOpenAI: primaryCore !== this.cores.character && primaryCore !== this.cores.growth,
      signals,
      reason: `Knowledge router selected ${primaryCore}.`
    };
  },

  scoreToWeight(score = 1, index = 0) {
    const base = Math.max(0.35, Math.min(1, Number(score || 1) / 5));
    const rankPenalty = index * 0.08;
    return Number(Math.max(0.25, base - rankPenalty).toFixed(2));
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => text.includes(String(phrase || "").toLowerCase()));
  },

  normalizeText(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  },
    async runSource(source = {}, summary = {}, question = "", plan = {}) {
    switch (source.id) {
      case "user_memory":
        return await this.queryUserMemory(summary, question);

      case "system_knowledge":
        return await this.querySystemKnowledge(summary, question);

      case "supabase_knowledge_graph":
        return await this.querySupabaseKnowledge(summary, question, plan);

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

  async querySupabaseKnowledge(summary = {}, question = "", plan = {}) {
    const client =
      window.AriSupabaseKnowledgeClient ||
      window.Ari?.supabaseKnowledgeClient;

    if (!client || typeof client.searchKnowledgeGraph !== "function") {
      return this.unavailable(
        "supabase_knowledge_graph",
        "Supabase knowledge graph client unavailable."
      );
    }

    try {
      const enrichedSummary = {
        ...summary,
        knowledgeRouter: {
          ...(summary.knowledgeRouter || {}),
          primaryCore: plan.primaryCore,
          secondaryCores: plan.secondaryCores || [],
          searchOrder: plan.searchOrder || [],
          routeSignals: plan.routeSignals || {},
          routeConfidence: plan.routeConfidence || null
        },
        knowledgeRetrievalPlan: plan
      };

      const result = await client.searchKnowledgeGraph({
        summary: enrichedSummary,
        question
      });

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
        nodes: [],
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

    const nodes = Array.isArray(result.nodes) ? result.nodes : [];

    const sources =
      result.knowledgeSources ||
      result.knowledgeCitations ||
      result.sources ||
      result.citations ||
      [];

    const confidence =
      result.knowledgeConfidence ||
      result.confidence ||
      (answer || nodes.length ? "medium" : "none");

    return {
      provider,
      usable: Boolean(answer) || nodes.length > 0,
      answer,
      finalResponse: result.finalResponse || null,
      confidence,
      sources,
      nodes,
      raw: result,

      searchedCores: result.searchedCores || [],
      searchOrder: result.searchOrder || [],
      coreResults: result.coreResults || [],

      mealEstimate: result.mealEstimate || null,
      foodAnalysis: result.foodAnalysis || null,
      nutritionEstimate: result.nutritionEstimate || null,
      pendingAction: result.pendingAction || null,

      error: result.knowledgeError || result.error || null,
      source: result.knowledgeProvider || result.source || provider
    };
  },

  chooseBestResult(results = []) {
    const usable = results.filter(result => result?.usable === true);

    if (!usable.length) return null;

    const supabase = usable.find(result => result.provider === "supabase_knowledge_graph");
    if (supabase) return supabase;

    return usable[0];
  },
    unavailable(provider = "unknown", reason = "Provider unavailable.") {
    return {
      provider,
      usable: false,
      answer: null,
      confidence: "none",
      sources: [],
      nodes: [],
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
      nodes: [],
      error: message,
      reason: message
    };
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
    if (domains.includes("relationship_domain")) return true;
    if (domains.includes("memory_domain")) return true;
    if (domains.includes("life_domain")) return true;
    if (domains.includes("growth_domain")) return true;

    if (needs.includes("understanding")) return true;
    if (needs.includes("decision_support")) return true;
    if (needs.includes("action_or_build_help")) return true;
    if (needs.includes("writing_or_rewrite")) return true;
    if (needs.includes("calculation")) return true;
    if (needs.includes("conversation")) return true;
    if (needs.includes("planning")) return true;
    if (needs.includes("prioritization")) return true;
    if (needs.includes("personalization")) return true;

    if (questions.includes("knowledge_question")) return true;
    if (questions.includes("instruction_question")) return true;
    if (questions.includes("decision_question")) return true;

    return /\b(what|who|when|where|why|how|explain|teach|compare|difference|should|recommend|best|fix|debug|code|help|write|rewrite|summarize|favorite|color|stressed|overwhelmed|remember|previous|earlier|task|todo|dilemma|priority|prioritize|change|evolve|reflection)\b/.test(lower);
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
      return "Direct answer needed; knowledge routing may provide supporting evidence.";
    }

    if (summary.semanticExpectsDirectAnswer === true) {
      return "Semantic frame expects a direct answer.";
    }

    return "Knowledge retrieval requested by six-core semantic fallback.";
  },

  noKnowledge(reason = "No outside/AI knowledge needed.", unavailable = false, extra = {}) {
    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: false,

      primaryCore: null,
      secondaryCores: [],
      searchOrder: [],

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