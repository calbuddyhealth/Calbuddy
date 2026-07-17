// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
//
// Purpose:
// Decide whether the current turn requires stored knowledge, user memory,
// system knowledge, live verification, or general OpenAI knowledge.
//
// V5.0.0 — Retrieval Governance / Evidence Aggregation / No Writer Authority
//
// Architectural role:
//
// Canonical Turn Summary
//      ↓
// Ari Knowledge Router
//      ↓
// Retrieval Plan
//      ↓
// Optional Knowledge Sources
//      ├── User Memory
//      ├── System Knowledge
//      ├── Supabase Knowledge Graph
//      ├── Live Verification
//      └── OpenAI General Knowledge
//      ↓
// Best Knowledge Result
//
// Responsibilities:
// - Determine whether external or stored knowledge is needed.
// - Route explicit memory requests to user memory.
// - Route Ari/project requests to system knowledge.
// - Route durable knowledge requests to Supabase.
// - Route time-sensitive requests to live verification.
// - Permit OpenAI general knowledge when appropriate.
// - Preserve structured nutrition and action data.
// - Aggregate evidence without treating retrieval as response-writing authority.
// - Return one normalized knowledge packet.
//
// Non-responsibilities:
// - Does not interpret raw language independently.
// - Does not override semantic meaning.
// - Does not choose the final response strategy.
// - Does not write the final user-facing response.
// - Does not use Blueprint Writer.
// - Does not decide safety severity.
// - Does not replace the Response Realization Engine.

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "5.0.0",

  source: "ari-knowledge-router",

  cores: {
    character: "character_core",
    relationship: "relationship_core",
    memory: "memory_core",
    life: "life_core",
    knowledge: "knowledge_core",
    growth: "growth_core"
  },

  sourcePriority: {
    live_verification: 100,
    system_knowledge: 90,
    user_memory: 85,
    supabase_knowledge_graph: 75,
    openai: 60
  },

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async route(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const question =
      this.getQuestion(
        summary
      );

    if (!question) {
      return this.noKnowledge(
        "No usable question was available for knowledge routing."
      );
    }

    const cognitiveExecutive =
      summary.cognitiveExecutive ||
      {};

    const requires =
      cognitiveExecutive.requires ||
      summary.requires ||
      {};

    if (
      this.characterAuthorityAlreadyAnswered(
        summary
      )
    ) {
      return this.noKnowledge(
        "Character authority already produced a valid identity, preference, or worldview answer."
      );
    }

    if (
      this.shouldBlockRetrievalForPresenceFirst(
        summary
      )
    ) {
      return this.noKnowledge(
        "The current turn requires emotional presence before retrieval."
      );
    }

    const plan =
      this.buildPlan({
        summary,
        question,
        requires
      });

    if (
      !plan.shouldRun
    ) {
      return this.noKnowledge(
        plan.reason,
        false,
        {
          knowledgeRetrievalPlan:
            plan
        }
      );
    }

    const results = [];

    let workingSummary = {
      ...summary,
      knowledgeRetrievalPlan:
        plan
    };

    for (
      const source
      of plan.sources
    ) {
      const result =
        await this.runSource({
          source,
          summary:
            workingSummary,
          question,
          plan,
          priorResults:
            results
        });

      if (!result) {
        continue;
      }

      results.push(
        result
      );

      workingSummary = {
        ...workingSummary,

        knowledgeRetrievalEvidence:
          this.buildEvidencePacket(
            results
          ),

        priorKnowledgeResults:
          this.lightResults(
            results
          )
      };

      if (
        result.usable === true &&
        source.stopOnUsable === true
      ) {
        break;
      }
    }

    const best =
      this.chooseBestResult(
        results,
        plan
      );

    if (!best) {
      return this.noKnowledge(
        "Knowledge routing ran, but no usable result was produced.",
        true,
        {
          knowledgeRetrievalPlan:
            plan,

          knowledgeRetrievalResults:
            this.lightResults(
              results
            )
        }
      );
    }

    return this.buildRouterResult({
      plan,
      best,
      results
    });
  },

  /* =====================================================
     PLAN BUILDING
  ===================================================== */

  buildPlan({
    summary = {},
    question = "",
    requires = {}
  } = {}) {
    const signals =
      this.detectKnowledgeNeeds({
        summary,
        question,
        requires
      });

    const coreRoute =
      this.routeCores({
        summary,
        question,
        requires,
        signals
      });

    const sources = [];

    if (
      signals.needsUserMemory
    ) {
      sources.push({
        id: "user_memory",
        priority: 10,
        stopOnUsable: false
      });
    }

    if (
      signals.needsSystemKnowledge
    ) {
      sources.push({
        id: "system_knowledge",
        priority: 20,
        stopOnUsable: false
      });
    }

    if (
      signals.needsStoredKnowledge
    ) {
      sources.push({
        id:
          "supabase_knowledge_graph",

        priority: 30,

        stopOnUsable:
          false,

        searchOrder:
          coreRoute.searchOrder
      });
    }

    if (
      signals.needsLiveVerification
    ) {
      sources.push({
        id: "live_verification",
        priority: 40,
        stopOnUsable: true
      });
    }

    if (
      signals.allowOpenAI
    ) {
      sources.push({
        id: "openai",
        priority: 90,
        stopOnUsable: true
      });
    }

    const orderedSources =
      sources.sort(
        (a, b) =>
          a.priority -
          b.priority
      );

    if (
      !orderedSources.length
    ) {
      return {
        shouldRun: false,

        reason:
          signals.reason ||
          "The turn does not require stored, live, memory, system, or general model knowledge.",

        primaryCore: null,
        secondaryCores: [],
        searchOrder: [],
        sources: [],
        signals
      };
    }

    return {
      shouldRun: true,

      reason:
        signals.reason ||
        coreRoute.reason ||
        "Knowledge routing was requested.",

      primaryCore:
        coreRoute.primaryCore,

      secondaryCores:
        coreRoute.secondaryCores,

      searchOrder:
        coreRoute.searchOrder,

      routeSignals:
        coreRoute.signals,

      routeConfidence:
        coreRoute.confidence,

      sources:
        orderedSources,

      aceAuthority:
        summary.cognitiveExecutive
          ?.authority ||
        "none",

      aceState:
        summary.cognitiveExecutive
          ?.cognitiveState ||
        null,

      aceRequires:
        requires,

      signals
    };
  },

  detectKnowledgeNeeds({
    summary = {},
    question = "",
    requires = {}
  } = {}) {
    const text =
      this.normalizeText(
        question
      );

    const primary =
      this.getPrimaryLane(
        summary
      );

    const functionType =
      this.getConversationFunction(
        summary
      );

    const intent =
      this.getConversationIntent(
        summary
      );

    const explicitMemory =
      requires.userMemory === true ||
      this.matchesAny(
        text,
        [
          /\bremember\b/,
          /\bwhat do you remember\b/,
          /\bdid i tell you\b/,
          /\bwhat do you know about me\b/,
          /\bmy history\b/,
          /\blast time\b/,
          /\bpreviously\b/,
          /\bearlier\b/,
          /\bwhat did we decide\b/,
          /\bwhere did we leave off\b/,
          /\bcontinue from\b/,
          /\bresume\b/
        ]
      );

    const explicitSystemKnowledge =
      requires.systemKnowledge === true ||
      this.matchesAny(
        text,
        [
          /\bcalbuddy\b/,
          /\bari rebirth\b/,
          /\bari pipeline\b/,
          /\bapp bridge\b/,
          /\bknowledge router\b/,
          /\bresponse realization\b/,
          /\bsupabase\b/,
          /\bgithub\b/,
          /\bproject file\b/,
          /\bcurrent architecture\b/
        ]
      );

    const explicitStoredKnowledge =
      requires.knowledgeGraph === true ||
      this.matchesAny(
        text,
        [
          /\bstored knowledge\b/,
          /\bknowledge node\b/,
          /\bstored node\b/,
          /\bsaved rule\b/,
          /\bwhat did you learn\b/,
          /\bbased on my saved\b/,
          /\bbased on what you know\b/
        ]
      );

    const explicitLiveVerification =
      requires.liveVerification === true ||
      this.matchesAny(
        text,
        [
          /\bcurrent\b/,
          /\blatest\b/,
          /\btoday\b/,
          /\btonight\b/,
          /\bright now\b/,
          /\brecent\b/,
          /\bnews\b/,
          /\bweather\b/,
          /\bprice\b/,
          /\bstock\b/,
          /\bscore\b/,
          /\bschedule\b/,
          /\bstandings\b/,
          /\blaw\b/,
          /\bpolicy\b/,
          /\bregulation\b/,
          /\bavailability\b/,
          /\brelease date\b/
        ]
      );

    const generalKnowledgeQuestion =
      this.isGeneralKnowledgeQuestion({
        summary,
        text,
        primary,
        functionType,
        intent
      });

    const highStakesKnowledge =
      this.matchesAny(
        text,
        [
          /\bdiagnosis\b/,
          /\bmedical\b/,
          /\bmedication\b/,
          /\bdose\b/,
          /\bpregnan/,
          /\bbleeding\b/,
          /\bchest pain\b/,
          /\bemergency\b/,
          /\bsuicid/,
          /\blaw\b/,
          /\blegal\b/,
          /\bfinancial advice\b/
        ]
      );

    const openAIDisabled =
      summary.mayUseGeneralModelKnowledge ===
        false ||
      requires.openAI ===
        false ||
      requires.generalModelKnowledge ===
        false;

    const normalPresenceLane =
      [
        "emotion",
        "relationship",
        "companion",
        "casual"
      ].includes(
        String(
          primary
        ).toLowerCase()
      );

    const allowOpenAI =
      !openAIDisabled &&
      (
        generalKnowledgeQuestion ||
        highStakesKnowledge ||
        explicitMemory ||
        explicitSystemKnowledge ||
        explicitStoredKnowledge
      ) &&
      !(
        normalPresenceLane &&
        !generalKnowledgeQuestion &&
        !highStakesKnowledge
      );

    const needsStoredKnowledge =
      explicitStoredKnowledge ||
      requires.knowledgeGraph ===
        true;

    const reason =
      explicitLiveVerification
        ? "The answer may have changed and requires live verification."
        : explicitMemory
          ? "The user requested prior personal or conversational memory."
          : explicitSystemKnowledge
            ? "The user requested Ari, CalBuddy, project, or system knowledge."
            : explicitStoredKnowledge
              ? "The user requested stored or durable knowledge."
              : generalKnowledgeQuestion
                ? "The turn asks for a factual explanation or general knowledge answer."
                : highStakesKnowledge
                  ? "The turn requires careful factual grounding."
                  : "No explicit knowledge requirement was detected.";

    return {
      needsUserMemory:
        explicitMemory,

      needsSystemKnowledge:
        explicitSystemKnowledge,

      needsStoredKnowledge,

      needsLiveVerification:
        explicitLiveVerification,

      needsGeneralKnowledge:
        generalKnowledgeQuestion,

      highStakesKnowledge,

      allowOpenAI,

      reason
    };
  },

  isGeneralKnowledgeQuestion({
    summary = {},
    text = "",
    primary = "",
    functionType = "",
    intent = ""
  } = {}) {
    if (!text) {
      return false;
    }

    const directQuestion =
      /^(what|who|when|where|why|how|is|are|does|do|did|can|could|should|would)\b/.test(
        text
      );

    const teachingRequest =
      this.matchesAny(
        text,
        [
          /\bdefine\b/,
          /\bdefinition\b/,
          /\bexplain\b/,
          /\bteach me\b/,
          /\bwhat does\b/,
          /\bwhat is\b/,
          /\bwhat are\b/,
          /\bdifference between\b/,
          /\bcompare\b/,
          /\bmeaning of\b/
        ]
      );

    const upstreamKnowledgeIntent =
      [
        "teacher",
        "medical_context",
        "builder"
      ].includes(
        String(
          primary
        ).toLowerCase()
      ) ||
      [
        "answer_question",
        "explain",
        "teach_clearly",
        "implementation_help"
      ].includes(
        String(
          intent
        ).toLowerCase()
      ) ||
      [
        "developer_artifact_request",
        "build_or_debug_request",
        "knowledge_question"
      ].includes(
        String(
          functionType
        ).toLowerCase()
      );

    return Boolean(
      directQuestion ||
      teachingRequest ||
      upstreamKnowledgeIntent ||
      summary.directAnswerNeeded ===
        true ||
      summary.semanticExpectsDirectAnswer ===
        true
    );
  },

  /* =====================================================
     CORE ROUTING
  ===================================================== */

  routeCores({
    summary = {},
    question = "",
    requires = {},
    signals = {}
  } = {}) {
    const text =
      this.normalizeText(
        question
      );

    const scores = {
      character: 0,
      relationship: 0,
      memory: 0,
      life: 0,
      knowledge: 0,
      growth: 0
    };

    const add = (
      core,
      amount = 1
    ) => {
      if (
        scores[core] ===
        undefined
      ) {
        return;
      }

      scores[core] +=
        Number(
          amount
        ) ||
        0;
    };

    const primary =
      this.getPrimaryLane(
        summary
      );

    const intent =
      this.getConversationIntent(
        summary
      );

    const functionType =
      this.getConversationFunction(
        summary
      );

    const domains =
      summary.situationMap
        ?.domains ||
      summary.domains ||
      [];

    const needs =
      summary.situationMap
        ?.needs ||
      summary.needs ||
      [];

    const questions =
      summary.situationMap
        ?.questions ||
      summary.questions ||
      [];

    if (
      requires.knowledgeGraph ===
      true
    ) {
      add(
        "knowledge",
        5
      );
    }

    if (
      requires.systemKnowledge ===
      true
    ) {
      add(
        "knowledge",
        4
      );
    }

    if (
      requires.userMemory ===
      true
    ) {
      add(
        "memory",
        5
      );
    }

    if (
      primary ===
      "ari_self"
    ) {
      add(
        "character",
        5
      );
    }

    if (
      primary ===
        "teacher" ||
      primary ===
        "medical_context"
    ) {
      add(
        "knowledge",
        5
      );
    }

    if (
      primary ===
      "builder"
    ) {
      add(
        "knowledge",
        4
      );

      add(
        "memory",
        1
      );
    }

    if (
      primary ===
      "executive_decision"
    ) {
      add(
        "life",
        3
      );

      add(
        "relationship",
        2
      );

      add(
        "knowledge",
        1
      );
    }

    if (
      functionType ===
        "developer_artifact_request" ||
      functionType ===
        "build_or_debug_request"
    ) {
      add(
        "knowledge",
        4
      );

      add(
        "memory",
        1
      );
    }

    if (
      [
        "answer_question",
        "explain",
        "teach_clearly"
      ].includes(
        intent
      )
    ) {
      add(
        "knowledge",
        4
      );
    }

    if (
      intent ===
        "decision_support" ||
      needs.includes(
        "decision_support"
      )
    ) {
      add(
        "life",
        3
      );

      add(
        "relationship",
        2
      );
    }

    if (
      intent ===
        "implementation_help" ||
      needs.includes(
        "action_or_build_help"
      )
    ) {
      add(
        "knowledge",
        3
      );

      add(
        "life",
        1
      );
    }

    if (
      domains.includes(
        "relationship_domain"
      ) ||
      domains.includes(
        "personal_domain"
      )
    ) {
      add(
        "relationship",
        4
      );
    }

    if (
      domains.includes(
        "life_domain"
      ) ||
      domains.includes(
        "planning_domain"
      )
    ) {
      add(
        "life",
        3
      );
    }

    if (
      domains.includes(
        "knowledge_domain"
      ) ||
      questions.includes(
        "knowledge_question"
      )
    ) {
      add(
        "knowledge",
        4
      );
    }

    if (
      domains.includes(
        "memory_domain"
      ) ||
      domains.includes(
        "continuity_domain"
      )
    ) {
      add(
        "memory",
        4
      );
    }

    if (
      domains.includes(
        "growth_domain"
      ) ||
      domains.includes(
        "reflection_domain"
      )
    ) {
      add(
        "growth",
        4
      );
    }

    if (
      signals.needsUserMemory
    ) {
      add(
        "memory",
        5
      );
    }

    if (
      signals.needsSystemKnowledge ||
      signals.needsStoredKnowledge ||
      signals.needsGeneralKnowledge ||
      signals.needsLiveVerification
    ) {
      add(
        "knowledge",
        4
      );
    }

    this.applyLexicalCoreSignals({
      text,
      add
    });

    const ordered =
      Object.entries(
        scores
      )
        .map(
          ([
            key,
            score
          ]) => ({
            key,
            core:
              this.cores[key],
            score
          })
        )
        .filter(
          item =>
            item.score >
            0
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    if (
      !ordered.length
    ) {
      return {
        primaryCore:
          this.cores
            .knowledge,

        secondaryCores: [],

        searchOrder: [
          {
            core:
              this.cores
                .knowledge,

            weight: 1
          }
        ],

        confidence:
          "low",

        signals:
          scores,

        reason:
          "No strong core signal was available; knowledge_core was selected as the safe default."
      };
    }

    const primaryCore =
      ordered[0].core;

    const secondaryCores =
      ordered
        .slice(
          1,
          4
        )
        .map(
          item =>
            item.core
        );

    const searchOrder =
      ordered
        .slice(
          0,
          4
        )
        .map(
          (
            item,
            index
          ) => ({
            core:
              item.core,

            weight:
              this.scoreToWeight(
                item.score,
                index
              )
          })
        );

    const confidence =
      ordered[0].score >= 6
        ? "high"
        : ordered[0].score >= 3
          ? "medium"
          : "low";

    return {
      primaryCore,
      secondaryCores,
      searchOrder,
      confidence,
      signals:
        scores,

      reason:
        `Knowledge routing selected ${primaryCore}.`
    };
  },

  applyLexicalCoreSignals({
    text = "",
    add = () => {}
  } = {}) {
    const phraseGroups = {
      character: [
        "who are you",
        "what are you",
        "your purpose",
        "your mission",
        "your values",
        "your personality",
        "your worldview",
        "what do you believe",
        "what do you stand for"
      ],

      relationship: [
        "wife",
        "husband",
        "girlfriend",
        "boyfriend",
        "partner",
        "spouse",
        "relationship",
        "marriage",
        "argument",
        "conflict",
        "trust",
        "boundaries",
        "commitment"
      ],

      memory: [
        "remember",
        "last time",
        "previously",
        "earlier",
        "where did we leave off",
        "what did we decide",
        "continue from",
        "resume"
      ],

      life: [
        "exhausted",
        "tired",
        "sleep",
        "fatigue",
        "burnout",
        "stressed",
        "overwhelmed",
        "work",
        "self care",
        "nutrition",
        "exercise",
        "planning"
      ],

      growth: [
        "can you change",
        "can you grow",
        "evolve",
        "reflection",
        "growth journal",
        "character audit"
      ],

      knowledge: [
        "what",
        "who",
        "when",
        "where",
        "why",
        "how",
        "explain",
        "define",
        "compare",
        "difference",
        "teach",
        "medical",
        "diagnosis",
        "code",
        "debug"
      ]
    };

    for (
      const [
        core,
        phrases
      ]
      of Object.entries(
        phraseGroups
      )
    ) {
      if (
        this.hasAny(
          text,
          phrases
        )
      ) {
        add(
          core,
          core ===
            "knowledge"
            ? 2
            : 3
        );
      }
    }
  },

  /* =====================================================
     SOURCE EXECUTION
  ===================================================== */

  async runSource({
    source = {},
    summary = {},
    question = "",
    plan = {},
    priorResults = []
  } = {}) {
    switch (
      source.id
    ) {
      case "user_memory":
        return await this.queryUserMemory({
          summary,
          question
        });

      case "system_knowledge":
        return await this.querySystemKnowledge({
          summary,
          question
        });

      case "supabase_knowledge_graph":
        return await this.querySupabaseKnowledge({
          summary,
          question,
          plan
        });

      case "live_verification":
        return await this.queryLiveVerification({
          summary,
          question
        });

      case "openai":
        return await this.queryOpenAI({
          summary,
          question,
          plan,
          priorResults
        });

      default:
        return null;
    }
  },

  async queryUserMemory({
    summary = {},
    question = ""
  } = {}) {
    const engine =
      window
        .AriMemoryRetrievalEngine ||
      window.Ari
        ?.memoryRetrievalEngine;

    if (!engine) {
      return this.unavailable(
        "user_memory",
        "User memory retrieval engine is unavailable."
      );
    }

    const method =
      typeof engine.retrieve ===
        "function"
        ? "retrieve"
        : typeof engine.search ===
            "function"
          ? "search"
          : null;

    if (!method) {
      return this.unavailable(
        "user_memory",
        "User memory retrieval method is unavailable."
      );
    }

    try {
      const result =
        await engine[method]({
          summary,
          question
        });

      return this.normalizeResult(
        "user_memory",
        result
      );
    } catch (error) {
      return this.errorResult(
        "user_memory",
        error
      );
    }
  },

  async querySystemKnowledge({
    summary = {},
    question = ""
  } = {}) {
    const client =
      window
        .AriSupabaseKnowledgeClient ||
      window.Ari
        ?.supabaseKnowledgeClient;

    if (
      !client ||
      typeof client
        .searchSystemKnowledge !==
        "function"
    ) {
      return this.unavailable(
        "system_knowledge",
        "System knowledge client is unavailable."
      );
    }

    try {
      const result =
        await client
          .searchSystemKnowledge({
            summary,
            question
          });

      return this.normalizeResult(
        "system_knowledge",
        result
      );
    } catch (error) {
      return this.errorResult(
        "system_knowledge",
        error
      );
    }
  },

  async querySupabaseKnowledge({
    summary = {},
    question = "",
    plan = {}
  } = {}) {
    const client =
      window
        .AriSupabaseKnowledgeClient ||
      window.Ari
        ?.supabaseKnowledgeClient;

    if (
      !client ||
      typeof client
        .searchKnowledgeGraph !==
        "function"
    ) {
      return this.unavailable(
        "supabase_knowledge_graph",
        "Supabase knowledge graph client is unavailable."
      );
    }

    try {
      const enrichedSummary = {
        ...summary,

        knowledgeRouter: {
          ...(
            summary
              .knowledgeRouter ||
            {}
          ),

          primaryCore:
            plan.primaryCore,

          secondaryCores:
            plan.secondaryCores ||
            [],

          searchOrder:
            plan.searchOrder ||
            [],

          routeSignals:
            plan.routeSignals ||
            {},

          routeConfidence:
            plan.routeConfidence ||
            null
        },

        knowledgeRetrievalPlan:
          plan
      };

      const result =
        await client
          .searchKnowledgeGraph({
            summary:
              enrichedSummary,

            question
          });

      return this.normalizeResult(
        "supabase_knowledge_graph",
        result
      );
    } catch (error) {
      return this.errorResult(
        "supabase_knowledge_graph",
        error
      );
    }
  },

  async queryLiveVerification({
    summary = {},
    question = ""
  } = {}) {
    const client =
      window
        .AriLiveVerificationClient ||
      window.Ari
        ?.liveVerificationClient;

    if (
      !client ||
      typeof client.verify !==
        "function"
    ) {
      return this.unavailable(
        "live_verification",
        "Live verification client is unavailable."
      );
    }

    try {
      const result =
        await client.verify({
          summary,
          question
        });

      return this.normalizeResult(
        "live_verification",
        result
      );
    } catch (error) {
      return this.errorResult(
        "live_verification",
        error
      );
    }
  },

  async queryOpenAI({
    summary = {},
    question = "",
    plan = {},
    priorResults = []
  } = {}) {
    const client =
      window
        .AriOpenAIKnowledgeClient;

    if (
      !client ||
      typeof client.ask !==
        "function"
    ) {
      return this.unavailable(
        "openai",
        "OpenAI knowledge client is unavailable."
      );
    }

    const normalizedQuestion =
      String(
        question ||
        ""
      ).trim();

    const enrichedSummary = {
      ...summary,

      userMessage:
        summary.userMessage ||
        normalizedQuestion,

      message:
        summary.message ||
        normalizedQuestion,

      input:
        summary.input ||
        normalizedQuestion,

      resolvedUserQuestion:
        summary
          .resolvedUserQuestion ||
        normalizedQuestion,

      knowledgeRetrievalPlan:
        plan,

      knowledgeRetrievalEvidence:
        this.buildEvidencePacket(
          priorResults
        ),

      priorKnowledgeResults:
        this.lightResults(
          priorResults
        )
    };

    try {
      const result =
        await client.ask({
          summary:
            enrichedSummary
        });

      return this.normalizeResult(
        "openai",
        result
      );
    } catch (error) {
      return this.errorResult(
        "openai",
        error
      );
    }
  },

  /* =====================================================
     RESULT NORMALIZATION
  ===================================================== */

  normalizeResult(
    provider = "unknown",
    result = null
  ) {
    if (!result) {
      return {
        provider,
        usable: false,
        answer: null,
        finalResponse: null,
        confidence: "none",
        sources: [],
        nodes: [],
        raw: null,
        reason:
          "No result was returned.",
        timing: null
      };
    }

    const answer =
      this.extractResultAnswer(
        result
      );

    const nodes =
      Array.isArray(
        result.nodes
      )
        ? result.nodes
        : Array.isArray(
            result.matches
          )
          ? result.matches
          : Array.isArray(
              result
                .knowledgeNodes
            )
            ? result
                .knowledgeNodes
            : [];

    const sources =
      result.knowledgeSources ||
      result.knowledgeCitations ||
      result.sources ||
      result.citations ||
      [];

    const confidence =
      result
        .knowledgeConfidence ||
      result.confidence ||
      (
        answer ||
        nodes.length
          ? "medium"
          : "none"
      );

    const explicitFailure =
      result
        .openAIKnowledgeUsed ===
        false &&
      Boolean(
        result
          .knowledgeError
      );

    return {
      provider,

      usable:
        !explicitFailure &&
        Boolean(
          answer ||
          nodes.length >
            0
        ),

      answer,

      finalResponse:
        this.firstString([
          result.responseText,
          result.outputText,
          result.finalResponse
        ]) ||
        answer ||
        null,

      confidence,

      sources:
        Array.isArray(
          sources
        )
          ? sources
          : [],

      nodes,

      raw:
        result,

      searchedCores:
        result
          .searchedCores ||
        [],

      searchOrder:
        result.searchOrder ||
        [],

      coreResults:
        result.coreResults ||
        [],

      timing:
        result.timing ||
        result
          .knowledgeApiTiming ||
        null,

      mealEstimate:
        result.mealEstimate ||
        result
          .lastMealEstimate ||
        null,

      foodAnalysis:
        result.foodAnalysis ||
        null,

      nutritionEstimate:
        result
          .nutritionEstimate ||
        null,

      pendingAction:
        result.pendingAction ||
        null,

      error:
        result
          .knowledgeError ||
        result.error ||
        null,

      reason:
        result.reason ||
        null,

      source:
        result
          .knowledgeSource ||
        result
          .openAIKnowledgeSource ||
        result.source ||
        provider
    };
  },

  extractResultAnswer(
    result = {}
  ) {
    if (
      typeof result ===
      "string"
    ) {
      return this.safeTrim(
        result
      );
    }

    if (
      !result ||
      typeof result !==
        "object"
    ) {
      return null;
    }

    const responseObject =
      result.response &&
      typeof result.response ===
        "object"
        ? result.response
        : {};

    const outputObject =
      result.output &&
      typeof result.output ===
        "object"
        ? result.output
        : {};

    return (
      this.firstString([
        result.responseText,
        result.outputText,
        result.finalResponse,

        responseObject.responseText,
        responseObject.outputText,
        responseObject.finalResponse,
        responseObject.reply,
        responseObject.answer,
        responseObject.text,

        outputObject.responseText,
        outputObject.outputText,
        outputObject.finalResponse,
        outputObject.reply,
        outputObject.answer,
        outputObject.text,

        result.reply,
        result.text,
        result.content,
        result.answer,
        result.knowledgeAnswer,

        typeof result.response ===
          "string"
          ? result.response
          : null,

        typeof result.output ===
          "string"
          ? result.output
          : null
      ]) ||
      null
    );
  },

  chooseBestResult(
    results = [],
    plan = {}
  ) {
    const usable =
      results.filter(
        result =>
          result?.usable ===
          true
      );

    if (
      !usable.length
    ) {
      return null;
    }

    const scored =
      usable
        .map(
          result => ({
            result,

            score:
              this.scoreResult(
                result,
                plan
              )
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    return (
      scored[0]
        ?.result ||
      null
    );
  },

  scoreResult(
    result = {},
    plan = {}
  ) {
    let score =
      this.sourcePriority[
        result.provider
      ] ||
      50;

    const confidence =
      String(
        result.confidence ||
        ""
      ).toLowerCase();

    if (
      confidence ===
      "high"
    ) {
      score += 20;
    } else if (
      confidence ===
      "medium"
    ) {
      score += 10;
    } else if (
      confidence ===
      "low"
    ) {
      score += 2;
    }

    if (
      result.answer
    ) {
      score += 20;
    }

    if (
      Array.isArray(
        result.sources
      ) &&
      result.sources.length >
        0
    ) {
      score += 8;
    }

    if (
      Array.isArray(
        result.nodes
      ) &&
      result.nodes.length >
        0
    ) {
      score += 5;
    }

    if (
      result.error
    ) {
      score -= 30;
    }

    if (
      plan.signals
        ?.needsLiveVerification &&
      result.provider ===
        "live_verification"
    ) {
      score += 50;
    }

    if (
      plan.signals
        ?.needsUserMemory &&
      result.provider ===
        "user_memory"
    ) {
      score += 40;
    }

    if (
      plan.signals
        ?.needsSystemKnowledge &&
      result.provider ===
        "system_knowledge"
    ) {
      score += 40;
    }

    if (
      plan.signals
        ?.needsGeneralKnowledge &&
      result.provider ===
        "openai"
    ) {
      score += 20;
    }

    return score;
  },

  /* =====================================================
     ROUTER RESULT
  ===================================================== */

  buildRouterResult({
    plan = {},
    best = {},
    results = []
  } = {}) {
    return {
      knowledgeRouterRan:
        true,

      knowledgeRouterVersion:
        this.version,

      knowledgeRouterSource:
        this.source,

      shouldUseKnowledge:
        true,

      knowledgeRetrievalPlan:
        plan,

      knowledgeRetrievalResults:
        this.lightResults(
          results
        ),

      knowledgeEvidence:
        this.buildEvidencePacket(
          results
        ),

      primaryCore:
        plan.primaryCore ||
        null,

      secondaryCores:
        plan.secondaryCores ||
        [],

      searchOrder:
        plan.searchOrder ||
        [],

      knowledgeAnswer:
        best.answer ||
        null,

      finalResponse:
        best.finalResponse ||
        best.answer ||
        null,

      responseText:
        best.finalResponse ||
        best.answer ||
        null,

      outputText:
        best.finalResponse ||
        best.answer ||
        null,

      knowledgeConfidence:
        best.confidence ||
        "medium",

      knowledgeSources:
        best.sources ||
        [],

      knowledgeProvider:
        best.provider ||
        "unknown",

      knowledgeError:
        best.error ||
        null,

      openAIKnowledgeUsed:
        best.provider ===
        "openai",

      openAIKnowledgeSource:
        best.provider ===
          "openai"
          ? best.source ||
            "api/knowledge"
          : null,

      knowledgeNodes:
        best.nodes ||
        [],

      searchedCores:
        best.searchedCores ||
        [],

      coreResults:
        best.coreResults ||
        [],

      knowledgeTiming:
        best.timing ||
        null,

      knowledgeApiTiming:
        best.timing ||
        null,

      mealEstimate:
        best.mealEstimate ||
        null,

      foodAnalysis:
        best.foodAnalysis ||
        null,

      nutritionEstimate:
        best
          .nutritionEstimate ||
        null,

      pendingAction:
        best.pendingAction ||
        null,

      rawKnowledgeResult:
        best.raw ||
        null,

      knowledgeReason:
        plan.reason ||
        null,

      source:
        this.source
    };
  },

  buildEvidencePacket(
    results = []
  ) {
    return results
      .filter(
        result =>
          result &&
          (
            result.usable ===
              true ||
            result.error
          )
      )
      .map(
        result => ({
          provider:
            result.provider,

          usable:
            result.usable ===
            true,

          answer:
            result.answer ||
            null,

          confidence:
            result.confidence ||
            "none",

          sources:
            result.sources ||
            [],

          nodes:
            result.nodes ||
            [],

          error:
            result.error ||
            null
        })
      );
  },

  lightResults(
    results = []
  ) {
    return results.map(
      result => ({
        provider:
          result.provider,

        usable:
          result.usable ===
          true,

        hasAnswer:
          Boolean(
            result.answer
          ),

        confidence:
          result.confidence ||
          "none",

        sources:
          result.sources ||
          [],

        nodeCount:
          Array.isArray(
            result.nodes
          )
            ? result.nodes.length
            : 0,

        searchedCores:
          result.searchedCores ||
          [],

        searchOrder:
          result.searchOrder ||
          [],

        coreResults:
          result.coreResults ||
          [],

        timing:
          result.timing ||
          null,

        error:
          result.error ||
          null,

        reason:
          result.reason ||
          null
      })
    );
  },

  /* =====================================================
     ROUTING GUARDS
  ===================================================== */

  shouldBlockRetrievalForPresenceFirst(
    summary = {}
  ) {
    const primary =
      this.getPrimaryLane(
        summary
      );

    const responseShape =
      summary
        .triageResponseShape ||
      summary.responseShape ||
      summary.ariTriage
        ?.responseShape ||
      summary.triage
        ?.responseShape ||
      "";

    const constraints = [
      ...(
        summary
          .triageResponseConstraints ||
        []
      ),

      ...(
        summary.ariTriage
          ?.responseConstraints ||
        []
      ),

      ...(
        summary.triage
          ?.responseConstraints ||
        []
      ),

      ...(
        summary
          .responseConstraints ||
        []
      )
    ];

    const conversationType =
      summary
        .conversationType ||
      summary
        .universalConversationClassifier
        ?.conversationType ||
      summary.classifier
        ?.conversationType ||
      "";

    const conversationIntent =
      this.getConversationIntent(
        summary
      );

    const presenceFirst =
      primary ===
        "emotion" ||
      responseShape ===
        "emotion_then_ground" ||
      conversationType ===
        "emotional_support_request" ||
      conversationIntent ===
        "comfort_and_grounding" ||
      constraints.includes(
        "emotional_presence_first"
      ) ||
      constraints.includes(
        "do_not_lead_with_knowledge"
      );

    const retrievalExplicitlyRequired =
      constraints.includes(
        "knowledge_required"
      ) ||
      constraints.includes(
        "use_knowledge_graph"
      ) ||
      constraints.includes(
        "requires_factual_grounding"
      ) ||
      constraints.includes(
        "requires_live_verification"
      ) ||
      summary.cognitiveExecutive
        ?.requires
        ?.knowledgeGraph ===
        true ||
      summary.cognitiveExecutive
        ?.requires
        ?.liveVerification ===
        true;

    return (
      presenceFirst &&
      !retrievalExplicitlyRequired
    );
  },

  characterAuthorityAlreadyAnswered(
    summary = {}
  ) {
    const reasoning =
      summary
        .characterReasoning ||
      {};

    const type =
      String(
        reasoning.type ||
        ""
      ).toLowerCase();

    return Boolean(
      reasoning
        .characterAnswerAvailable ===
        true &&
      (
        type.includes(
          "identity"
        ) ||
        type.includes(
          "preference"
        ) ||
        type.includes(
          "worldview"
        )
      )
    );
  },

  /* =====================================================
     RESULT HELPERS
  ===================================================== */

  unavailable(
    provider = "unknown",
    reason =
      "Provider unavailable."
  ) {
    return {
      provider,
      usable: false,
      answer: null,
      finalResponse: null,
      confidence: "none",
      sources: [],
      nodes: [],
      error: reason,
      reason,
      raw: null,
      timing: null
    };
  },

  errorResult(
    provider = "unknown",
    error = null
  ) {
    const message =
      error?.message ||
      String(
        error ||
        "Unknown error."
      );

    return {
      provider,
      usable: false,
      answer: null,
      finalResponse: null,
      confidence: "none",
      sources: [],
      nodes: [],
      error: message,
      reason: message,
      raw: null,
      timing: null
    };
  },

  noKnowledge(
    reason =
      "No knowledge retrieval was needed.",
    unavailable = false,
    extra = {}
  ) {
    return {
      knowledgeRouterRan:
        true,

      knowledgeRouterVersion:
        this.version,

      knowledgeRouterSource:
        this.source,

      shouldUseKnowledge:
        false,

      primaryCore:
        null,

      secondaryCores:
        [],

      searchOrder:
        [],

      knowledgeAnswer:
        null,

      finalResponse:
        null,

      responseText:
        null,

      outputText:
        null,

      knowledgeConfidence:
        "none",

      knowledgeSources:
        [],

      knowledgeProvider:
        unavailable
          ? "unknown"
          : null,

      knowledgeError:
        unavailable
          ? reason
          : null,

      openAIKnowledgeUsed:
        false,

      openAIKnowledgeSource:
        null,

      knowledgeNodes:
        [],

      searchedCores:
        [],

      coreResults:
        [],

      knowledgeReason:
        reason,

      source:
        this.source,

      ...extra
    };
  },

  /* =====================================================
     SUMMARY READERS
  ===================================================== */

  getQuestion(
    summary = {}
  ) {
    return String(
      summary
        .resolvedUserQuestion ||
      summary.threadQuestion
        ?.resolvedUserQuestion ||
      summary
        .resolvedCurrentTurn
        ?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary
        .normalizedMessage ||
      ""
    ).trim();
  },

  getPrimaryLane(
    summary = {}
  ) {
    return String(
      summary
        .situationContractPrimary ||
      summary.primaryLane ||
      summary
        .triagePrimaryLane ||
      summary.triage
        ?.primaryLane ||
      summary.ariTriage
        ?.primaryLane ||
      ""
    ).toLowerCase();
  },

  getConversationIntent(
    summary = {}
  ) {
    return String(
      summary
        .conversationIntent ||
      summary.semanticIntent ||
      summary
        .laneSplitterSemanticIntent ||
      summary.responseIntent ||
      summary
        .universalConversationClassifier
        ?.conversationIntent ||
      summary.classifier
        ?.conversationIntent ||
      ""
    ).toLowerCase();
  },

  getConversationFunction(
    summary = {}
  ) {
    return String(
      summary.primaryFunction ||
      summary
        .conversationFunction
        ?.primaryFunction ||
      summary
        .conversationFunctionType ||
      ""
    ).toLowerCase();
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  scoreToWeight(
    score = 1,
    index = 0
  ) {
    const normalized =
      Math.max(
        0.35,
        Math.min(
          1,
          Number(
            score ||
            1
          ) /
            6
        )
      );

    const rankPenalty =
      index *
      0.08;

    return Number(
      Math.max(
        0.25,
        normalized -
          rankPenalty
      ).toFixed(
        2
      )
    );
  },

  firstString(
    candidates = []
  ) {
    for (
      const candidate
      of candidates
    ) {
      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return "";
  },

  matchesAny(
    text = "",
    patterns = []
  ) {
    return patterns.some(
      pattern => {
        if (
          pattern instanceof
          RegExp
        ) {
          return pattern.test(
            text
          );
        }

        return text.includes(
          String(
            pattern ||
            ""
          ).toLowerCase()
        );
      }
    );
  },

  hasAny(
    text = "",
    phrases = []
  ) {
    return phrases.some(
      phrase =>
        text.includes(
          String(
            phrase ||
            ""
          ).toLowerCase()
        )
    );
  },

  normalizeText(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  safeTrim(
    value
  ) {
    if (
      typeof value !==
      "string"
    ) {
      return "";
    }

    return value.trim();
  }
};

window.Ari.knowledgeRouter =
  window.AriKnowledgeRouter;

console.log(
  "ARI KNOWLEDGE ROUTER LOADED:",
  window
    .AriKnowledgeRouter
    ?.version
);