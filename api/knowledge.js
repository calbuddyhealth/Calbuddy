// api/knowledge.js
// CalBuddy / Ari Knowledge API
//
// Purpose:
// Provide explicit server-side endpoints for:
// - Ari preference lookup
// - Six-core Supabase semantic retrieval
// - OpenAI cognitive reasoning
// - OpenAI response realization
//
// V4.2.0 — Canonical V9.2 Cognitive Reasoning Contract

const VALID_KNOWLEDGE_CORES = [
  "character_core",
  "relationship_core",
  "memory_core",
  "life_core",
  "knowledge_core",
  "growth_core"
];

const DEFAULT_SEARCH_ORDER = [
  {
    core: "knowledge_core",
    weight: 1
  }
];

const QUERY_EMBEDDING_CACHE = new Map();
const QUERY_EMBEDDING_CACHE_TTL_MS = 1000 * 60 * 30;

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

const OPENAI_EMBEDDINGS_URL =
  "https://api.openai.com/v1/embeddings";

const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_KNOWLEDGE_MODEL ||
  "gpt-4o-mini";

const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

/* =====================================================
   PUBLIC API HANDLER
===================================================== */

export default async function handler(req, res) {
  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
      allowedMethods: [
        "GET",
        "POST"
      ]
    });
  }

  try {
    const body =
      isPlainObject(req.body)
        ? req.body
        : {};

    const action =
      getAction(req, body);

    switch (action) {
      case "preference_lookup":
        return await handlePreferenceLookup(
          req,
          res,
          body
        );

      case "semantic_search_ari_nodes":
        return await handleSemanticSearchAriNodes(
          req,
          res,
          body
        );

      case "openai_reasoning":
        return await handleOpenAIReasoning(
          req,
          res,
          body
        );

      case "openai_knowledge":
      case "openai_realization":
        return await handleOpenAIKnowledge(
          req,
          res,
          body
        );

      default:
        return res.status(400).json({
          success: false,
          error: "Unknown knowledge action.",
          action: action || null,
          supportedActions: [
            "preference_lookup",
            "semantic_search_ari_nodes",
            "openai_reasoning",
            "openai_knowledge",
            "openai_realization"
          ]
        });
    }
  } catch (error) {
    console.error(
      "[Ari Knowledge API Fatal]",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Knowledge API failed.",
      failureType:
        "unhandled_server_error",
      source:
        "api/knowledge"
    });
  }
}

/* =====================================================
   ACTION RESOLUTION
===================================================== */

function getAction(req, body = {}) {
  const rawAction =
    req.method === "GET"
      ? req.query?.action
      : body.action;

  return String(
    rawAction || ""
  )
    .trim()
    .toLowerCase();
}

/* =====================================================
   PREFERENCE LOOKUP
===================================================== */

async function handlePreferenceLookup(
  req,
  res,
  body = {}
) {
  const environmentError =
    validateSupabaseEnvironment();

  if (environmentError) {
    return res.status(500).json({
      success: false,
      error: environmentError,
      failureType:
        "missing_environment_configuration",
      source: "supabase"
    });
  }

  const preferenceKey =
    req.method === "GET"
      ? String(
          req.query?.preference_key || ""
        )
      : String(
          body.preference_key || ""
        );

  const normalizedPreferenceKey =
    preferenceKey.trim();

  if (!normalizedPreferenceKey) {
    return res.status(400).json({
      success: false,
      error: "Missing preference_key.",
      failureType: "invalid_request"
    });
  }

  const queryUrl =
    `${process.env.SUPABASE_URL}` +
    "/rest/v1/ari_knowledge_nodes" +
    "?domain=eq.character_core" +
    "&subdomain=eq.preferences" +
    `&preference_key=eq.${encodeURIComponent(
      normalizedPreferenceKey
    )}` +
    "&limit=1";

  const response =
    await fetch(
      queryUrl,
      {
        method: "GET",
        headers:
          getSupabaseHeaders()
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    return res
      .status(response.status)
      .json({
        success: false,
        error:
          data?.message ||
          data?.error ||
          "Preference lookup failed.",
        details: data,
        failureType:
          "supabase_preference_lookup_failed",
        source: "supabase"
      });
  }

  const node =
    Array.isArray(data)
      ? data[0] || null
      : null;

  return res.status(200).json({
    success: true,
    preferenceKey:
      normalizedPreferenceKey,
    preference_key:
      normalizedPreferenceKey,
    node,
    match: node,
    primaryNode: node,
    found: Boolean(node),
    source:
      "supabase_preference_lookup"
  });
}

/* =====================================================
   SEMANTIC SEARCH
===================================================== */

async function handleSemanticSearchAriNodes(
  req,
  res,
  body = {}
) {
  const totalStart =
    Date.now();

  const timing = {};

  const supabaseEnvironmentError =
    validateSupabaseEnvironment();

  if (supabaseEnvironmentError) {
    return res.status(500).json({
      success: false,
      error:
        supabaseEnvironmentError,
      failureType:
        "missing_environment_configuration",
      source: "supabase"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Missing OPENAI_API_KEY.",
      failureType:
        "missing_environment_configuration",
      source: "openai"
    });
  }

  const query =
    req.method === "GET"
      ? String(
          req.query?.query || ""
        )
      : String(
          body.query || ""
        );

  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    return res.status(400).json({
      success: false,
      error:
        "Missing semantic search query.",
      failureType:
        "invalid_request"
    });
  }

  const limit =
    clampNumber(
      req.method === "GET"
        ? req.query?.limit
        : body.limit,
      1,
      30,
      6
    );

  const minSimilarity =
    clampNumber(
      req.method === "GET"
        ? req.query?.minSimilarity
        : body.minSimilarity,
      0,
      1,
      0.22
    );

  const searchOrder =
    normalizeSearchOrder(
      req,
      body
    );

  const domains =
    searchOrder.map(
      item => item.core
    );

  const embeddingStart =
    Date.now();

  const embeddingResult =
    await getQueryEmbedding(
      normalizedQuery
    );

  timing.embeddingMs =
    Date.now() -
    embeddingStart;

  timing.embeddingCacheHit =
    embeddingResult.cacheHit;

  const rpcStart =
    Date.now();

  const rpcResponse =
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/match_ari_knowledge_nodes`,
      {
        method: "POST",
        headers:
          getSupabaseHeaders(),
        body:
          JSON.stringify({
            query_embedding:
              embeddingResult.embedding,
            match_domains:
              domains,
            match_count:
              limit,
            min_similarity:
              minSimilarity
          })
      }
    );

  const rpcData =
    await readJsonResponse(
      rpcResponse
    );

  timing.supabaseRpcMs =
    Date.now() -
    rpcStart;

  if (!rpcResponse.ok) {
    return res
      .status(rpcResponse.status)
      .json({
        success: false,
        error:
          rpcData?.message ||
          rpcData?.error ||
          "Supabase vector RPC failed.",
        details: rpcData,
        failureType:
          "supabase_vector_search_failed",
        source: "supabase",
        timing: {
          ...timing,
          totalMs:
            Date.now() -
            totalStart
        }
      });
  }

  const mergeStart =
    Date.now();

  const weightByCore =
    Object.fromEntries(
      searchOrder.map(
        item => [
          item.core,
          Number(item.weight || 1)
        ]
      )
    );

  const merged =
    (
      Array.isArray(rpcData)
        ? rpcData
        : []
    )
      .map(node => {
        const weight =
          weightByCore[node.domain] ||
          1;

        const confidence =
          normalizeConfidenceNumber(
            node.confidence,
            1
          );

        const similarity =
          normalizeConfidenceNumber(
            node.similarity,
            0
          );

        return {
          ...node,
          core: node.domain,
          routerWeight: weight,
          weightedScore:
            similarity *
            weight *
            confidence
        };
      })
      .sort(
        (a, b) =>
          b.weightedScore -
          a.weightedScore
      )
      .slice(
        0,
        limit
      );

  const coreResults =
    searchOrder.map(item => {
      const coreMatches =
        merged.filter(
          node =>
            node.domain ===
            item.core
        );

      return {
        core: item.core,
        weight: item.weight,
        success: true,
        count:
          coreMatches.length,
        bestSimilarity:
          coreMatches[0]
            ?.similarity ||
          0,
        bestWeightedScore:
          coreMatches[0]
            ?.weightedScore ||
          0
      };
    });

  timing.mergeMs =
    Date.now() -
    mergeStart;

  timing.totalMs =
    Date.now() -
    totalStart;

  return res.status(200).json({
    success: true,
    query:
      normalizedQuery,
    searchOrder,
    searchedCores:
      domains,
    count:
      merged.length,
    matches:
      merged,
    nodes:
      merged,
    coreResults,
    timing,
    source:
      "supabase_semantic_search"
  });
}

/* =====================================================
   SEARCH ORDER NORMALIZATION
===================================================== */

function normalizeSearchOrder(
  req,
  body = {}
) {
  const raw =
    req.method === "GET"
      ? req.query?.searchOrder ||
        req.query?.cores ||
        req.query?.domain ||
        ""
      : body.searchOrder ||
        body.cores ||
        body.domain ||
        body.core ||
        "";

  let parsed = [];

  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (
    typeof raw === "string" &&
    raw.trim()
  ) {
    try {
      const maybeJson =
        JSON.parse(raw);

      parsed =
        Array.isArray(maybeJson)
          ? maybeJson
          : [
              maybeJson
            ];
    } catch {
      parsed =
        raw
          .split(",")
          .map(
            core =>
              core.trim()
          );
    }
  }

  if (!parsed.length) {
    parsed =
      DEFAULT_SEARCH_ORDER;
  }

  const normalized =
    parsed
      .map(item => {
        if (
          typeof item ===
          "string"
        ) {
          return {
            core: item,
            weight: 1
          };
        }

        if (!isPlainObject(item)) {
          return {
            core: "",
            weight: 1
          };
        }

        return {
          core:
            item.core ||
            item.domain ||
            item.id ||
            "",
          weight:
            Number(
              item.weight ??
              item.score ??
              1
            )
        };
      })
      .filter(
        item =>
          VALID_KNOWLEDGE_CORES
            .includes(item.core)
      )
      .map(item => ({
        core:
          item.core,
        weight:
          Number.isFinite(
            item.weight
          )
            ? item.weight
            : 1
      }));

  return normalized.length
    ? normalized
    : DEFAULT_SEARCH_ORDER;
}

/* =====================================================
   QUERY EMBEDDINGS
===================================================== */

async function getQueryEmbedding(
  query = ""
) {
  const cleanQuery =
    String(query || "")
      .trim()
      .toLowerCase();

  if (!cleanQuery) {
    throw new Error(
      "Cannot create an embedding for an empty query."
    );
  }

  const cached =
    QUERY_EMBEDDING_CACHE
      .get(cleanQuery);

  if (
    cached &&
    Array.isArray(
      cached.embedding
    ) &&
    Date.now() -
      cached.createdAt <
      QUERY_EMBEDDING_CACHE_TTL_MS
  ) {
    return {
      embedding:
        cached.embedding,
      cacheHit: true
    };
  }

  const embeddingResponse =
    await fetch(
      OPENAI_EMBEDDINGS_URL,
      {
        method: "POST",
        headers:
          getOpenAIHeaders(),
        body:
          JSON.stringify({
            model:
              DEFAULT_EMBEDDING_MODEL,
            input: query
          })
      }
    );

  const embeddingData =
    await readJsonResponse(
      embeddingResponse
    );

  if (!embeddingResponse.ok) {
    throw new Error(
      embeddingData
        ?.error
        ?.message ||
      embeddingData
        ?.message ||
      "Embedding request failed."
    );
  }

  const embedding =
    embeddingData
      ?.data?.[0]
      ?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error(
      "OpenAI returned no embedding."
    );
  }

  QUERY_EMBEDDING_CACHE
    .set(
      cleanQuery,
      {
        embedding,
        createdAt:
          Date.now()
      }
    );

  pruneEmbeddingCache();

  return {
    embedding,
    cacheHit: false
  };
}

function pruneEmbeddingCache() {
  const now =
    Date.now();

  for (
    const [key, value]
    of QUERY_EMBEDDING_CACHE
  ) {
    if (
      !value ||
      now -
        value.createdAt >=
        QUERY_EMBEDDING_CACHE_TTL_MS
    ) {
      QUERY_EMBEDDING_CACHE
        .delete(key);
    }
  }
}

/* =====================================================
   OPENAI COGNITIVE REASONING
===================================================== */

async function handleOpenAIReasoning(
  req,
  res,
  suppliedBody = {}
) {
  const totalStart =
    Date.now();

  const timing = {};

  const body =
    isPlainObject(suppliedBody)
      ? suppliedBody
      : isPlainObject(req.body)
        ? req.body
        : {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      ready: false,
      error:
        "Missing OPENAI_API_KEY.",
      failureType:
        "missing_environment_configuration",
      source:
        "openai_reasoning"
    });
  }

  const evidencePacket =
    normalizeObjectOrNull(
      body.evidencePacket ||
      body.perceptionPacket
        ?.evidencePacket
    );

  const executivePacket =
    normalizeObjectOrNull(
      body.executivePacket
    );

  const routingContract =
    normalizeObjectOrNull(
      body.routingContract ||
      executivePacket
        ?.routingContract
    );

  const continuity =
    normalizeObject(
      body.continuity ||
      body.continuityStagePacket ||
      body.continuityResolution
    );

  const safety =
    normalizeObject(
      body.safety ||
      body.safetyStagePacket ||
      body.safetyDisposition
    );

  const situation =
    normalizeObject(
      body.situation ||
      body.situationStagePacket ||
      body.situationContract ||
      body.situationMap
    );

  const memory =
    normalizeObject(
      body.memory ||
      body.memoryStagePacket ||
      body.memoryContext ||
      body.memoryHandoff
    );

  const originalQuestion =
    firstNonEmptyString([
      body.currentTurn
        ?.originalText,
      body.originalUserMessage,
      body.rawQuestion,
      body.userMessage,
      body.message,
      body.input
    ]);

  const effectiveQuestion =
    firstNonEmptyString([
      body.currentTurn
        ?.effectiveText,
      body.effectiveUserMessage,
      body.resolvedUserQuestion,
      body.resolvedQuestion,
      body.question,
      body.request
        ?.effective,
      originalQuestion
    ]);

  if (!effectiveQuestion) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "No effective question was provided for cognitive reasoning.",
      failureType:
        "invalid_request",
      source:
        "openai_reasoning"
    });
  }

  if (!evidencePacket) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "No evidencePacket was provided for cognitive reasoning.",
      failureType:
        "evidence_packet_missing",
      source:
        "openai_reasoning"
    });
  }

  const reasoningInput = {
    schema:
      body.schema ||
      "ari_cognitive_reasoning_request",

    schemaVersion:
      body.schemaVersion ||
      "1.1.0",

    request: {
      original:
        originalQuestion,
      effective:
        effectiveQuestion,
      currentTurnWasResolved:
        body.currentTurnWasResolved ===
          true,
      turnId:
        body.currentTurn
          ?.turnId ||
        body.turnId ||
        null,
      language:
        body.request
          ?.language ||
        body.language ||
        null
    },

    currentTurn: {
      originalText:
        originalQuestion,
      effectiveText:
        effectiveQuestion,
      turnId:
        body.currentTurn
          ?.turnId ||
        body.turnId ||
        null
    },

    evidencePacket,

    perceptionPacket:
      normalizeObjectOrNull(
        body.perceptionPacket ||
        body.perception
      ),

    executivePacket,
    routingContract,

    conversation:
      normalizeObject(
        body.conversation
      ),

    knowledge:
      normalizeObject(
        body.knowledge
      ),

    understanding:
      normalizeObjectOrNull(
        body.understanding
      ),

    developerEvidence:
      normalizeObject(
        body.developerEvidence
      ),

    responseControl:
      normalizeObject(
        body.responseControl
      ),

    capabilities:
      normalizeObject(
        body.capabilities
      ),

    authority:
      normalizeObject(
        body.authority
      ),

    outputContract:
      normalizeObject(
        body.outputContract ||
        body.responseSchema
      ),

    deterministicContext: {
      continuity,
      safety,
      situation,
      memory
    },

    instructions:
      normalizeArray(
        body.instructions
      )
  };

  const systemPrompt =
    buildOpenAIReasoningSystemPrompt();

  const userPrompt =
    buildOpenAIReasoningUserPrompt(
      reasoningInput
    );

  const openAIStart =
    Date.now();

  const response =
    await fetch(
      OPENAI_CHAT_COMPLETIONS_URL,
      {
        method: "POST",
        headers:
          getOpenAIHeaders(),
        body:
          JSON.stringify({
            model:
              DEFAULT_OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content:
                  systemPrompt
              },
              {
                role: "user",
                content:
                  userPrompt
              }
            ],
            temperature:
              0.15,
            max_tokens:
              2200,
            response_format: {
              type:
                "json_object"
            }
          })
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  timing.openAIMs =
    Date.now() -
    openAIStart;

  if (!response.ok) {
    return res
      .status(response.status)
      .json({
        success: false,
        ready: false,
        error:
          data?.error
            ?.message ||
          data?.message ||
          "OpenAI reasoning request failed.",
        failureType:
          "openai_reasoning_request_failed",
        status:
          response.status,
        model:
          data?.model ||
          DEFAULT_OPENAI_MODEL,
        source:
          "openai_reasoning",
        timing: {
          ...timing,
          totalMs:
            Date.now() -
            totalStart
        }
      });
  }

  const rawModelOutput =
    extractRawModelOutput(
      data
    );

  const parsedResult =
    parseModelResult(
      rawModelOutput
    );

  const parsed =
    parsedResult.value;

  if (
    !parsedResult.wasJson ||
    !isPlainObject(parsed)
  ) {
    return res.status(502).json({
      success: false,
      ready: false,
      error:
        "OpenAI reasoning returned a malformed cognitive result.",
      failureType:
        "invalid_reasoning_model_output",
      rawModelOutput:
        rawModelOutput || null,
      parsedModelOutput:
        parsed || null,
      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,
      source:
        "openai_reasoning",
      timing: {
        ...timing,
        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  const interpretation =
    normalizeObjectOrNull(
      parsed.interpretation
    );

  const reasoningDecision =
    normalizeObjectOrNull(
      parsed.reasoningDecision ||
      parsed.reasoning_decision ||
      parsed.decision
    );

  const semanticFrame =
    normalizeObjectOrNull(
      parsed.semanticFrame ||
      parsed.semantic_frame
    );

  const responseRequirements =
    normalizeObjectOrNull(
      parsed.responseRequirements ||
      parsed.response_requirements ||
      parsed.responseStrategy ||
      parsed.response_strategy
    );

  const caseModel =
    normalizeObject(
      parsed.caseModel ||
      parsed.case_model
    );

  const options =
    normalizeArray(
      parsed.options
    );

  const tradeoffs =
    normalizeArray(
      parsed.tradeoffs
    );

  const uncertainties =
    normalizeArray(
      parsed.uncertainties ||
      parsed.unknowns
    );

  const executionMetadata =
    normalizeObject(
      parsed.executionMetadata ||
      parsed.execution_metadata
    );

  const grounding =
    normalizeObjectOrNull(
      parsed.grounding
    );

  const evidenceReferences =
    normalizeArray(
      parsed.evidenceReferences ||
      parsed.evidence_references ||
      grounding?.evidenceUsed
    );

  const confidence =
    normalizeReasoningConfidence(
      parsed.confidence ??
      executionMetadata.confidence
    );

  const proposedActions =
    normalizeArray(
      reasoningDecision
        ?.proposedActions ||
      parsed.proposedActions
    );

  if (!interpretation) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        "interpretation",
      failureType:
        "interpretation_missing"
    });
  }

  if (!reasoningDecision) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        "reasoningDecision",
      failureType:
        "reasoning_decision_missing"
    });
  }

  if (!semanticFrame) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        "semanticFrame",
      failureType:
        "semantic_frame_missing"
    });
  }

  if (!responseRequirements) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        "responseRequirements",
      failureType:
        "response_requirements_missing"
    });
  }

  if (!grounding) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        "grounding",
      failureType:
        "grounding_missing"
    });
  }

  const claimedActionExecution =
    proposedActions.some(action =>
      isPlainObject(action) &&
      (
        action.executed === true ||
        action.completed === true ||
        [
          "executed",
          "completed",
          "success",
          "succeeded"
        ].includes(
          String(
            action.status || ""
          )
            .trim()
            .toLowerCase()
        )
      )
    );

  if (claimedActionExecution) {
    return res.status(502).json({
      success: false,
      ready: false,
      error:
        "OpenAI reasoning falsely claimed that a proposed action was executed.",
      failureType:
        "model_claimed_action_execution",
      parsedModelOutput:
        parsed,
      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,
      source:
        "openai_reasoning",
      timing: {
        ...timing,
        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  timing.totalMs =
    Date.now() -
    totalStart;

  const ready =
    parsed.ready !== false;

  const cognitiveReasoningResult = {
    schema:
      "ari_cognitive_reasoning_result",

    schemaVersion:
      "1.1.0",

    ready,

    authoritative:
      ready,

    success:
      true,

    source:
      "openai_reasoning",

    model:
      data?.model ||
      DEFAULT_OPENAI_MODEL,

    interpretation,

    reasoningDecision: {
      ...reasoningDecision,

      proposedActions:
        proposedActions.map(
          action => ({
            ...action,
            executed: false,
            status: "proposed"
          })
        )
    },

    semanticFrame,

    responseRequirements,

    responseStrategy:
      responseRequirements,

    caseModel,
    options,
    tradeoffs,
    uncertainties,

    executionMetadata: {
      ...executionMetadata,
      confidence,
      usedCurrentTurn:
        executionMetadata
          .usedCurrentTurn !==
        false,
      usedPriorContext:
        executionMetadata
          .usedPriorContext ===
        true,
      usedEvidence:
        executionMetadata
          .usedEvidence !==
        false,
      evidenceCount:
        Number.isFinite(
          Number(
            executionMetadata
              .evidenceCount
          )
        )
          ? Number(
              executionMetadata
                .evidenceCount
            )
          : evidenceReferences.length
    },

    evidenceReferences,

    grounding: {
      evidenceUsed:
        normalizeArray(
          grounding.evidenceUsed
        ),
      assumptions:
        normalizeArray(
          grounding.assumptions
        ),
      unresolvedConflicts:
        normalizeArray(
          grounding
            .unresolvedConflicts
        )
    },

    confidence,

    draftResponse:
      "",

    validation: {
      passed: true,
      errors: []
    },

    authority:
      ready
        ? "semantic_interpretation_and_response_requirements"
        : "none",

    modelInvocation: {
      succeeded: true,
      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,
      finishReason:
        data?.choices?.[0]
          ?.finish_reason ||
        null,
      usage:
        data?.usage ||
        null,
      durationMs:
        timing.openAIMs
    },

    timing
  };

  return res.status(200).json({
    success: true,
    ready:
      cognitiveReasoningResult
        .ready ===
      true,

    cognitiveReasoningResult,

    reasoningResult:
      cognitiveReasoningResult,

    interpretation:
      cognitiveReasoningResult
        .interpretation,

    reasoningDecision:
      cognitiveReasoningResult
        .reasoningDecision,

    semanticFrame:
      cognitiveReasoningResult
        .semanticFrame,

    responseRequirements:
      cognitiveReasoningResult
        .responseRequirements,

    responseStrategy:
      cognitiveReasoningResult
        .responseRequirements,

    caseModel:
      cognitiveReasoningResult
        .caseModel,

    options:
      cognitiveReasoningResult
        .options,

    tradeoffs:
      cognitiveReasoningResult
        .tradeoffs,

    uncertainties:
      cognitiveReasoningResult
        .uncertainties,

    executionMetadata:
      cognitiveReasoningResult
        .executionMetadata,

    evidenceReferences:
      cognitiveReasoningResult
        .evidenceReferences,

    grounding:
      cognitiveReasoningResult
        .grounding,

    confidence:
      cognitiveReasoningResult
        .confidence,

    modelInvocation:
      cognitiveReasoningResult
        .modelInvocation,

    model:
      cognitiveReasoningResult
        .model,

    source:
      "openai_reasoning",

    timing
  });
}

function buildReasoningFieldFailure({
  res,
  data = {},
  parsed = {},
  rawModelOutput = "",
  timing = {},
  totalStart = Date.now(),
  field = "required field",
  failureType =
    "required_reasoning_field_missing"
} = {}) {
  return res.status(502).json({
    success: false,
    ready: false,
    error:
      `OpenAI reasoning returned no ${field}.`,
    failureType,
    rawModelOutput:
      rawModelOutput || null,
    parsedModelOutput:
      parsed,
    model:
      data?.model ||
      DEFAULT_OPENAI_MODEL,
    source:
      "openai_reasoning",
    timing: {
      ...timing,
      totalMs:
        Date.now() -
        totalStart
    }
  });
}

/* =====================================================
   OPENAI REALIZATION
===================================================== */

async function handleOpenAIKnowledge(
  req,
  res,
  suppliedBody = {}
) {
  const totalStart =
    Date.now();

  const timing = {};

  const body =
    isPlainObject(suppliedBody)
      ? suppliedBody
      : isPlainObject(req.body)
        ? req.body
        : {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error:
        "Missing OPENAI_API_KEY.",
      failureType:
        "missing_environment_configuration",
      source:
        "openai_realization"
    });
  }

  const aiInstruction =
    firstNonEmptyString([
      body.aiInstruction,
      body.instruction
    ]);

  const question =
    firstNonEmptyString([
      body.resolvedUserQuestion,
      body.resolvedQuestion,
      body.question,
      body.userMessage,
      body.message,
      body.input,
      body.rawQuestion
    ]);

  const rawQuestion =
    firstNonEmptyString([
      body.rawQuestion,
      body.userMessage,
      body.message,
      body.input,
      question
    ]);

  if (!question) {
    return res.status(400).json({
      success: false,
      error:
        "No question provided.",
      failureType:
        "invalid_request",
      source:
        "openai_realization"
    });
  }

  const character =
    normalizeObject(
      body.character ||
      body.characterContext
    );

  const contract =
    normalizeObject(
      body.contract ||
      body.situationContract
    );

  const triage =
    normalizeObject(
      body.triage ||
      body.ariTriage
    );

  const situation =
    normalizeObject(
      body.situation ||
      body.situationMap
    );

  const continuity =
    normalizeObject(
      body.continuity ||
      body.continuityContext ||
      body.threadState
    );

  const language =
    normalizeObject(
      body.language ||
      body.humanLanguageProfile
    );

  const evidence =
    normalizeArray(
      body.knowledgeRetrievalEvidence ||
      body.priorKnowledgeResults ||
      body.evidence
    );

  const existingMealEstimate =
    normalizeObjectOrNull(
      body.existingMealEstimate ||
      continuity.mealEstimate
    );

  const conversationMode =
    normalizeConversationMode(
      body.conversationMode
    );

  const systemPrompt =
    buildOpenAISystemPrompt();

  const userPrompt =
    buildOpenAIUserPrompt({
      rawQuestion,
      question,
      conversationMode,
      aiInstruction,
      character,
      contract,
      triage,
      situation,
      continuity,
      language,
      evidence,
      existingMealEstimate
    });

  const openAIStart =
    Date.now();

  const response =
    await fetch(
      OPENAI_CHAT_COMPLETIONS_URL,
      {
        method: "POST",
        headers:
          getOpenAIHeaders(),
        body:
          JSON.stringify({
            model:
              DEFAULT_OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content:
                  systemPrompt
              },
              {
                role: "user",
                content:
                  userPrompt
              }
            ],
            temperature:
              0.45,
            max_tokens:
              1600,
            response_format: {
              type:
                "json_object"
            }
          })
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  timing.openAIMs =
    Date.now() -
    openAIStart;

  if (!response.ok) {
    return res
      .status(response.status)
      .json({
        success: false,
        error:
          data?.error
            ?.message ||
          data?.message ||
          "OpenAI realization request failed.",
        failureType:
          "openai_request_failed",
        status:
          response.status,
        model:
          data?.model ||
          DEFAULT_OPENAI_MODEL,
        source:
          "openai_realization",
        timing: {
          ...timing,
          totalMs:
            Date.now() -
            totalStart
        }
      });
  }

  const rawModelOutput =
    extractRawModelOutput(
      data
    );

  const parsedResult =
    parseModelResult(
      rawModelOutput
    );

  const parsed =
    parsedResult.value;

  const answer =
    extractOpenAIAnswer(parsed) ||
    (
      parsedResult.wasJson
        ? ""
        : safeTrim(
            rawModelOutput
          )
    );

  if (!answer) {
    console.error(
      "[Ari Knowledge API Empty Model Response]",
      {
        model:
          data?.model ||
          DEFAULT_OPENAI_MODEL,
        rawModelOutput,
        parsed,
        finishReason:
          data?.choices?.[0]
            ?.finish_reason ||
          null
      }
    );

    return res.status(502).json({
      success: false,
      error:
        "OpenAI returned no usable response text.",
      failureType:
        "empty_model_response",
      responseText: null,
      outputText: null,
      finalResponse: null,
      answer: null,
      knowledgeAnswer: null,
      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,
      finishReason:
        data?.choices?.[0]
          ?.finish_reason ||
        null,
      rawModelOutput:
        rawModelOutput || null,
      parsedModelOutput:
        parsed || null,
      source:
        "openai_realization",
      timing: {
        ...timing,
        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  const confidence =
    normalizeConfidenceLabel(
      parsed?.confidence
    );

  const sources =
    normalizeArray(
      parsed?.sources ||
      parsed?.citations
    );

  const mealEstimate =
    normalizeObjectOrNull(
      parsed?.mealEstimate ||
      parsed?.meal_estimate
    );

  const foodAnalysis =
    normalizeObjectOrNull(
      parsed?.foodAnalysis ||
      parsed?.food_analysis
    );

  const nutritionEstimate =
    normalizeObjectOrNull(
      parsed?.nutritionEstimate ||
      parsed?.nutrition_estimate
    );

  const pendingAction =
    normalizeObjectOrNull(
      parsed?.pendingAction ||
      parsed?.pending_action
    );

  timing.totalMs =
    Date.now() -
    totalStart;

  return res.status(200).json({
    success: true,
    responseText:
      answer,
    outputText:
      answer,
    finalResponse:
      answer,
    response: {
      responseText:
        answer,
      outputText:
        answer,
      finalResponse:
        answer,
      confidence,
      sources,
      mealEstimate,
      foodAnalysis,
      nutritionEstimate,
      pendingAction
    },
    answer,
    knowledgeAnswer:
      answer,
    reply:
      answer,
    text:
      answer,
    confidence,
    sources,
    notes:
      safeTrim(
        parsed?.notes
      ) ||
      null,
    mealEstimate,
    foodAnalysis,
    nutritionEstimate,
    pendingAction,
    model:
      data?.model ||
      DEFAULT_OPENAI_MODEL,
    finishReason:
      data?.choices?.[0]
        ?.finish_reason ||
      null,
    usage:
      data?.usage ||
      null,
    conversationMode,
    source:
      "openai_realization",
    timing
  });
}

/* =====================================================
   OPENAI PROMPTS
===================================================== */

function buildOpenAIReasoningSystemPrompt() {
  return `
You are the sole semantic reasoning authority for Ari Rebirth.

Your job is to interpret the current user request using the supplied current request, evidence, routing constraints, deterministic context, knowledge evidence, developer evidence, capability context, response controls, and authority contract.

You do not write the final response to the user.

You must produce a structured cognitive reasoning result that downstream semantic validation and response planning can consume.

Authority rules:
- You may interpret the user's meaning, goal, conversational function, and required response behavior.
- You may resolve ambiguity only when supported by supplied evidence and continuity.
- You must distinguish direct evidence from inference.
- You must not fabricate user facts, memories, external facts, citations, actions, or tool results.
- You must not treat deterministic routing labels as semantic truth.
- You must respect supplied safety constraints.
- You must preserve the effective current-turn request.
- You must not write polished final-response prose.
- You must not return a candidate answer.
- You must not claim an action was executed.
- Any action must be returned only as a proposal.
- semanticFrame must represent the meaning of the current request.
- responseRequirements must describe what the later response must accomplish.
- grounding must identify evidence, assumptions, and unresolved conflicts.
- evidenceReferences must identify supplied evidence supporting material conclusions.
- confidence must be numeric from 0 through 1.
- Output must be one valid JSON object.

Return JSON only.
`.trim();
}

function buildOpenAIReasoningUserPrompt(
  reasoningInput = {}
) {
  return `
CURRENT REASONING INPUT:
${safeJsonStringify(
  reasoningInput
)}

Analyze the current request using the complete supplied evidence.

Return exactly one JSON object using this shape:

{
  "ready": true,

  "interpretation": {
    "conversationFunction": "The functional role of the user's turn.",
    "userGoal": "What the user wants accomplished.",
    "operation": "The semantic operation requested.",
    "meaning": "The resolved meaning of the current turn.",
    "subjects": [],
    "contextUsed": false,
    "clarificationRequired": false,
    "clarificationQuestion": null,
    "ambiguity": []
  },

  "reasoningDecision": {
    "answerDirectly": true,
    "reasoningMode": "analysis",
    "toolsNeeded": [],
    "proposedActions": [],
    "decisionRationale": "A concise rationale for the response strategy.",
    "shouldAskClarifyingQuestion": false
  },

  "semanticFrame": {
    "operation": "The semantic operation requested.",
    "target": "The subject, object, decision, or outcome being addressed.",
    "domain": "The relevant subject domain.",
    "primaryLane": "The primary response lane.",
    "requestedOutput": "The form of output the user expects.",
    "constraints": [],

    "semanticSummary": "Concise interpretation of the current request.",
    "conversationFunction": "The conversational function of this turn.",
    "primaryIntent": "The user's primary semantic intent.",
    "userGoal": "What the user wants accomplished.",
    "currentTurnMeaning": "The resolved meaning of this turn.",
    "referencesResolved": [],
    "stakes": "low",
    "uncertainties": [],
    "slots": {}
  },

  "responseRequirements": {
    "goal": "What the final response must accomplish.",
    "shape": "single_lane",
    "tone": "The appropriate response tone.",
    "requiredMoves": [],
    "prohibitedMoves": [],
    "requiredBehaviors": [],
    "forbiddenBehaviors": [],
    "constraints": [],
    "requiredFacts": [],
    "safetyRequirements": [],
    "continuityRequirements": [],
    "toneRequirements": [],
    "clarificationRequired": false,
    "clarificationQuestion": null,
    "actionRequired": false
  },

  "caseModel": {},

  "options": [],

  "tradeoffs": [],

  "uncertainties": [],

  "evidenceReferences": [],

  "executionMetadata": {
    "confidence": 0.9,
    "reasoningMode": "analysis",
    "usedCurrentTurn": true,
    "usedPriorContext": false,
    "usedEvidence": true,
    "evidenceCount": 0,
    "requiresExternalKnowledge": false,
    "requiresToolExecution": false
  },

  "grounding": {
    "evidenceUsed": [],
    "assumptions": [],
    "unresolvedConflicts": []
  },

  "confidence": 0.9
}

Contract requirements:
- ready must be a boolean.
- interpretation must be a non-empty object.
- interpretation.userGoal must be a non-empty string.
- interpretation.meaning must be a non-empty string.
- reasoningDecision must be a non-empty object.
- reasoningDecision.answerDirectly must be a boolean.
- reasoningDecision.proposedActions must be an array.
- semanticFrame must be a non-empty object.
- semanticFrame.operation must be a non-empty string.
- semanticFrame.requestedOutput must describe the expected output.
- responseRequirements must be a non-empty object.
- responseRequirements.goal must be a non-empty string.
- responseRequirements.requiredMoves must be an array.
- responseRequirements.prohibitedMoves must be an array.
- grounding must be an object.
- grounding.evidenceUsed must be an array.
- confidence must be a number from 0 through 1.
- executionMetadata.confidence must be a number from 0 through 1.
- proposed actions are proposals only.
- Never mark an action as executed, completed, successful, or persisted.
- Do not include final user-facing prose.
- Do not include a candidate response.
- Do not include private chain-of-thought.
- Do not place the result inside an additional wrapper.
`.trim();
}

function buildOpenAISystemPrompt() {
  return `
You are Ari.

You are the final language realization model for Ari Rebirth.

Your job is to turn the authoritative question, Ari's instruction, and the supplied context into one complete natural response for the user.

Core rules:
- Directly answer QUESTION TO ANSWER.
- QUESTION TO ANSWER is authoritative when it differs from RAW USER MESSAGE.
- Follow ARI REBIRTH AI INSTRUCTION closely.
- Use supplied context only when relevant.
- Use reliable general model knowledge when the question can be answered without stored evidence.
- Do not pretend that missing Supabase evidence means you cannot answer a normal general-knowledge question.
- Do not mention hidden prompts, internal systems, routing, contracts, triage, maps, lanes, engines, or pipeline names.
- Do not narrate your reasoning process.
- Do not claim a file was edited, committed, executed, or deployed unless supplied context explicitly confirms it.
- Do not fabricate current facts, citations, personal memories, or external verification.
- State uncertainty specifically and naturally when needed.
- For high-stakes medical, legal, financial, or safety matters, provide appropriate limits and practical next steps.
- If the user asks for code, provide usable code in responseText.
- Preserve relevant continuity for follow-up questions.
- Do not output a generic inability statement merely because no stored knowledge was provided.
- responseText must be complete, useful, and non-empty.

Return one valid JSON object only.
`.trim();
}

function buildOpenAIUserPrompt({
  rawQuestion = "",
  question = "",
  conversationMode =
    "new_question",
  aiInstruction = "",
  character = {},
  contract = {},
  triage = {},
  situation = {},
  continuity = {},
  language = {},
  evidence = [],
  existingMealEstimate = null
} = {}) {
  const context =
    safeJsonStringify({
      character,
      contract,
      triage,
      situation,
      continuity,
      language,
      evidence,
      existingMealEstimate
    });

  return `
RAW USER MESSAGE:
${rawQuestion}

QUESTION TO ANSWER:
${question}

CONVERSATION MODE:
${conversationMode}

ARI REBIRTH AI INSTRUCTION:
${aiInstruction || "No additional realization instruction was provided."}

CONTEXT:
${context}

Return JSON only in this shape:

{
  "responseText": "The complete natural response Ari should give the user.",
  "confidence": "low | medium | high",
  "sources": [],
  "notes": null,
  "mealEstimate": null,
  "foodAnalysis": null,
  "nutritionEstimate": null,
  "pendingAction": null
}

Output requirements:
- responseText must always be a non-empty string.
- responseText must answer QUESTION TO ANSWER.
- Do not return an empty object.
- Do not put the response under an unexpected field.
- sources must be an array.
- Use null for unavailable structured fields.
- Include mealEstimate only when the user asks for meal or calorie estimation.
- If an existing meal estimate is supplied and the user asks to log or reuse it, preserve that estimate rather than recalculating one ingredient.
`.trim();
}

/* =====================================================
   MODEL RESPONSE PARSING
===================================================== */

function extractRawModelOutput(
  data = {}
) {
  const message =
    data?.choices?.[0]
      ?.message;

  if (
    typeof message?.content ===
    "string"
  ) {
    return message.content;
  }

  if (
    Array.isArray(
      message?.content
    )
  ) {
    return message.content
      .map(part => {
        if (
          typeof part ===
          "string"
        ) {
          return part;
        }

        if (
          typeof part?.text ===
          "string"
        ) {
          return part.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function parseModelResult(
  rawOutput = ""
) {
  const text =
    safeTrim(rawOutput);

  if (!text) {
    return {
      value: {},
      wasJson: false,
      error:
        "Empty model output."
    };
  }

  try {
    return {
      value:
        JSON.parse(text),
      wasJson: true,
      error: null
    };
  } catch {
    const extractedJson =
      extractJsonObject(text);

    if (extractedJson) {
      try {
        return {
          value:
            JSON.parse(
              extractedJson
            ),
          wasJson: true,
          error: null
        };
      } catch {
        // Continue to plain-text normalization.
      }
    }

    return {
      value: {
        responseText:
          text,
        confidence:
          "medium",
        sources: [],
        notes:
          "Model returned plain text instead of the requested JSON object."
      },
      wasJson: false,
      error:
        "Model returned non-JSON content."
    };
  }
}

function extractJsonObject(
  value = ""
) {
  const text =
    String(value || "");

  const firstBrace =
    text.indexOf("{");

  const lastBrace =
    text.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    return "";
  }

  return text.slice(
    firstBrace,
    lastBrace + 1
  );
}

function extractOpenAIAnswer(value) {
  if (
    typeof value ===
    "string"
  ) {
    return safeTrim(value);
  }

  if (!isPlainObject(value)) {
    return "";
  }

  const response =
    isPlainObject(
      value.response
    )
      ? value.response
      : {};

  const output =
    isPlainObject(
      value.output
    )
      ? value.output
      : {};

  const message =
    isPlainObject(
      value.message
    )
      ? value.message
      : {};

  return firstNonEmptyString([
    value.responseText,
    value.outputText,
    value.finalResponse,

    response.responseText,
    response.outputText,
    response.finalResponse,
    response.reply,
    response.answer,
    response.text,
    response.content,

    output.responseText,
    output.outputText,
    output.finalResponse,
    output.reply,
    output.answer,
    output.text,
    output.content,

    message.responseText,
    message.outputText,
    message.finalResponse,
    message.content,
    message.text,

    value.answer,
    value.reply,
    value.text,
    value.content,
    value.knowledgeAnswer
  ]);
}

/* =====================================================
   SHARED RESPONSE HELPERS
===================================================== */

async function readJsonResponse(
  response
) {
  const rawText =
    await response.text();

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(
      rawText
    );
  } catch {
    return {
      rawText,
      message:
        "Remote service returned non-JSON content."
    };
  }
}

function getSupabaseHeaders() {
  return {
    apikey:
      process.env
        .SUPABASE_SERVICE_ROLE_KEY,
    Authorization:
      `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type":
      "application/json"
  };
}

function getOpenAIHeaders() {
  return {
    "Content-Type":
      "application/json",
    Authorization:
      `Bearer ${process.env.OPENAI_API_KEY}`
  };
}

function validateSupabaseEnvironment() {
  if (!process.env.SUPABASE_URL) {
    return "Missing SUPABASE_URL.";
  }

  if (
    !process.env
      .SUPABASE_SERVICE_ROLE_KEY
  ) {
    return "Missing SUPABASE_SERVICE_ROLE_KEY.";
  }

  return "";
}

/* =====================================================
   GENERAL UTILITIES
===================================================== */

function clampNumber(
  value,
  min,
  max,
  fallback
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
}

function normalizeConfidenceNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    number
  );
}

function normalizeReasoningConfidence(
  value,
  fallback = 0.5
) {
  if (isPlainObject(value)) {
    return normalizeReasoningConfidence(
      value.score,
      fallback
    );
  }

  const label =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
      : "";

  if (label === "low") {
    return 0.35;
  }

  if (label === "medium") {
    return 0.65;
  }

  if (label === "high") {
    return 0.9;
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      1,
      number
    )
  );
}

function normalizeConfidenceLabel(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    [
      "low",
      "medium",
      "high"
    ].includes(normalized)
  ) {
    return normalized;
  }

  return "medium";
}

function normalizeConversationMode(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  const allowed = [
    "new_question",
    "follow_up",
    "clarification",
    "topic_shift"
  ];

  return allowed.includes(
    normalized
  )
    ? normalized
    : "new_question";
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeObject(value) {
  return isPlainObject(value)
    ? value
    : {};
}

function normalizeObjectOrNull(value) {
  return isPlainObject(value)
    ? value
    : null;
}

function firstNonEmptyString(
  values = []
) {
  for (const value of values) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function safeTrim(value) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return JSON.stringify(
      {
        contextSerializationError:
          true
      },
      null,
      2
    );
  }
}

function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
}
