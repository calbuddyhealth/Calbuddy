// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Decide which Ari knowledge cores should be searched.
// V4.0.3 — Six-Core / SearchOrder Router / Supabase V3 Compatible

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "4.0.3",

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

    const characterReasoning = summary.characterReasoning || {};
const characterType = String(
  characterReasoning.type || ""
).toLowerCase();

const characterActuallyAnswered =
  characterReasoning.characterAnswerAvailable === true &&
  (
    characterType.includes("identity") ||
    characterType.includes("preference") ||
    characterType.includes("worldview")
  );

if (characterActuallyAnswered) {
  return this.noKnowledge(
    "Character reasoning already produced a valid Ari identity/preference/worldview answer."
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
        { knowledgeRetrievalPlan: plan, knowledgeRetrievalResults: this.lightResults(results) }
      );
    }

    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: true,
      knowledgeRetrievalPlan: plan,
      knowledgeRetrievalResults: this.lightResults(results),

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
      searchedCores: best.searchedCores || [],
      coreResults: best.coreResults || [],

knowledgeTiming: best.timing || null,
knowledgeApiTiming: best.timing || null,

      mealEstimate: best.mealEstimate || null,
      foodAnalysis: best.foodAnalysis || null,
      nutritionEstimate: best.nutritionEstimate || null,
      pendingAction: best.pendingAction || null,

      rawKnowledgeResult: null,
      knowledgeReason: plan.reason
    };
  },

  buildPlan(summary = {}, question = "", requires = {}) {
    const coreRoute = this.routeCores(summary, question, requires);

    const needsKnowledge =
  requires.knowledgeGraph === true ||
  requires.systemKnowledge === true ||
  requires.userMemory === true ||
  requires.liveVerification === true ||
  this.legacyShouldUseKnowledge(summary, question, coreRoute, requires);

    if (!needsKnowledge) {
      return {
        shouldRetrieve: false,
        reason: "Wisdom/advice turn can be answered from the normal reasoning/composer path without Supabase retrieval.",
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

  const domains = summary.situationMap?.domains || summary.domains || [];
  const needs = summary.situationMap?.needs || summary.needs || [];
  const questions = summary.situationMap?.questions || summary.questions || [];

  if (requires.knowledgeGraph === true) add("knowledge", 2);
  if (requires.systemKnowledge === true) add("knowledge", 2);
  if (requires.userMemory === true) add("relationship", 2);
  if (requires.liveVerification === true) add("knowledge", 2);

  if (primary === "ari_self" || primary === "companion") add("character", 4);
  if (primary === "teacher" || primary === "medical_context") add("knowledge", 3);

  if (primary === "executive_decision") {
    add("life", 2);
    add("relationship", 2);
    add("knowledge", 1);
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
    add("relationship", 2);
    add("knowledge", 1);
  }

  if (intent === "implementation_help" || needs.includes("action_or_build_help")) {
    add("life", 2);
    add("knowledge", 2);
  }

  if (domains.includes("relationship_domain") || domains.includes("personal_domain")) {
    add("relationship", 4);
  }

  if (domains.includes("life_domain") || domains.includes("planning_domain")) {
    add("life", 3);
  }

  if (domains.includes("knowledge_domain") || questions.includes("knowledge_question")) {
    add("knowledge", 3);
  }

  if (domains.includes("memory_domain") || domains.includes("continuity_domain")) {
    add("memory", 3);
  }

  if (domains.includes("growth_domain") || domains.includes("reflection_domain")) {
    add("growth", 3);
  }

  const relationshipWords = [
    "wife", "husband", "girlfriend", "boyfriend", "partner", "spouse",
    "relationship", "marriage", "married", "arguing", "argument",
    "fight", "fighting", "conflict", "tension", "communication",
    "trust", "boundaries", "forgiveness", "commitment"
  ];

  const lifeWords = [
    "exhausted", "tired", "sleep", "sleeping", "fatigue", "burnout",
    "burned out", "stress", "stressed", "overwhelmed", "work",
    "after work", "mood", "irritable", "snapping", "health",
    "wellness", "self-care", "self care", "nutrition", "exercise"
  ];

  const characterWords = [
    "who are you", "what are you", "tell me about yourself",
    "your purpose", "your mission", "your values", "your personality",
    "your favorite", "are you ai", "are you real", "your worldview",
    "what do you believe", "what do you stand for"
  ];

  const memoryWords = [
    "earlier", "last time", "previously", "where did we leave off",
    "what did we decide", "continue from", "resume", "what was the last step"
  ];

  const growthWords = [
    "can you change", "can you grow", "evolve", "evolution",
    "reflection", "growth journal", "character audit", "preference change"
  ];

  if (this.hasAny(text, characterWords)) add("character", 4);
  if (this.hasAny(text, memoryWords)) add("memory", 4);
  if (this.hasAny(text, growthWords)) add("growth", 4);

  const hasRelationshipSignal = this.hasAny(text, relationshipWords);
  const hasLifeSignal = this.hasAny(text, lifeWords);

  if (hasRelationshipSignal) add("relationship", 5);
  if (hasLifeSignal) add("life", 4);

  if (hasRelationshipSignal && hasLifeSignal) {
    add("relationship", 2);
    add("life", 2);
    add("knowledge", 1);
  }

  if (
    this.hasAny(text, [
      "what", "who", "when", "where", "why", "how",
      "explain", "teach", "compare", "difference", "define",
      "should", "recommend", "best", "help"
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
    ordered[0].score >= 5 ? "high" :
    ordered[0].score >= 3 ? "medium" :
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
        reason: "No result returned.",
        timing: null
      };
    }

    const answer =
      result.finalResponse ||
      result.knowledgeAnswer ||
      result.answer ||
      result.reply ||
      result.text ||
      null;

    const nodes = Array.isArray(result.nodes)
      ? result.nodes
      : Array.isArray(result.matches)
        ? result.matches
        : [];

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

      timing: result.timing || result.knowledgeApiTiming || null,

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
    
      lightResults(results = []) {
    return results.map(result => ({
      provider: result.provider,
      usable: result.usable,
      confidence: result.confidence,
      sources: result.sources || [],
      nodes: Array.isArray(result.nodes) ? result.nodes : [],
      searchedCores: result.searchedCores || [],
      searchOrder: result.searchOrder || [],
      coreResults: result.coreResults || [],
      timing: result.timing || null,
      error: result.error || null,
      reason: result.reason || null
    }));
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

  legacyShouldUseKnowledge(summary = {}, question = "", coreRoute = {}, requires = {}) {
  const lower = String(question || "").toLowerCase();

  if (!lower.trim()) return false;

  if (
    requires.knowledgeGraph === true ||
    requires.systemKnowledge === true ||
    requires.userMemory === true ||
    requires.liveVerification === true
  ) {
    return true;
  }

  const primary =
    summary.situationContractPrimary ||
    summary.primaryLane ||
    summary.triagePrimaryLane ||
    summary.triage?.primaryLane ||
    "";

  const responseIntent =
    summary.responseIntent ||
    summary.conversationIntent ||
    summary.semanticIntent ||
    "";

  const isJudgmentOrWisdom =
    primary === "executive_decision" ||
    primary === "companion" ||
    responseIntent === "decision_support" ||
    responseIntent === "relationship_context_support" ||
    /\b(what should i do|what do i do|what would you do|do you think|advice|wisdom|best move|next step)\b/.test(lower);

  const needsStoredKnowledge =
    /\b(define|definition|what is|explain|teach|compare|difference|medical|symptom|diagnosis|medication|law|policy|current|latest|today|price|weather|score|code|debug|github|file|remember|previous|earlier)\b/.test(lower);

  if (needsStoredKnowledge) return true;

  if (isJudgmentOrWisdom) return false;

  return coreRoute.shouldRetrieve === true && coreRoute.confidence === "high";
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