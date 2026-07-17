// api/knowledge.js
// CalBuddy / Ari Knowledge API
//
// Purpose:
// Provide explicit server-side endpoints for:
// - Ari preference lookup
// - Six-core Supabase semantic retrieval
// - OpenAI response realization
//
// V4.0.0 — Explicit Action Routing / Realization-Native Response Contract
//
// Responsibilities:
// - Validate all API actions explicitly.
// - Retrieve Ari knowledge nodes from Supabase.
// - Generate query embeddings with short-term caching.
// - Send Ari Rebirth realization instructions to OpenAI.
// - Return realization-native response fields.
// - Preserve legacy response fields for temporary compatibility.
// - Report empty or malformed model responses as honest failures.
//
// Non-responsibilities:
// - Does not choose conversation intent.
// - Does not reinterpret semantic meaning.
// - Does not determine safety severity.
// - Does not create hidden fallback answers.
// - Does not claim success when OpenAI returns no usable response.

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

const QUERY_EMBEDDING_CACHE =
  new Map();

const QUERY_EMBEDDING_CACHE_TTL_MS =
  1000 *
  60 *
  30;

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

export default async function handler(
  req,
  res
) {
  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res
      .status(405)
      .json({
        success: false,
        error:
          "Method not allowed.",
        allowedMethods: [
          "GET",
          "POST"
        ]
      });
  }

  try {
    const body =
      isPlainObject(
        req.body
      )
        ? req.body
        : {};

    const action =
      getAction(
        req,
        body
      );

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

      case "openai_knowledge":
      case "openai_realization":
        return await handleOpenAIKnowledge(
          req,
          res,
          body
        );

      default:
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Unknown knowledge action.",
            action:
              action ||
              null,
            supportedActions: [
              "preference_lookup",
              "semantic_search_ari_nodes",
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

    return res
      .status(500)
      .json({
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

function getAction(
  req,
  body = {}
) {
  const rawAction =
    req.method === "GET"
      ? req.query?.action
      : body.action;

  return String(
    rawAction ||
    ""
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
    return res
      .status(500)
      .json({
        success: false,
        error:
          environmentError,
        failureType:
          "missing_environment_configuration",
        source:
          "supabase"
      });
  }

  const preferenceKey =
    req.method === "GET"
      ? String(
          req.query
            ?.preference_key ||
          ""
        )
      : String(
          body.preference_key ||
          ""
        );

  const normalizedPreferenceKey =
    preferenceKey.trim();

  if (
    !normalizedPreferenceKey
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          "Missing preference_key.",
        failureType:
          "invalid_request"
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

  if (
    !response.ok
  ) {
    return res
      .status(
        response.status
      )
      .json({
        success: false,
        error:
          data?.message ||
          data?.error ||
          "Preference lookup failed.",
        details:
          data,
        failureType:
          "supabase_preference_lookup_failed",
        source:
          "supabase"
      });
  }

  const node =
    Array.isArray(
      data
    )
      ? data[0] ||
        null
      : null;

  return res
    .status(200)
    .json({
      success: true,

      preferenceKey:
        normalizedPreferenceKey,

      preference_key:
        normalizedPreferenceKey,

      node,
      match:
        node,
      primaryNode:
        node,

      found:
        Boolean(
          node
        ),

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

  if (
    supabaseEnvironmentError
  ) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          supabaseEnvironmentError,
        failureType:
          "missing_environment_configuration",
        source:
          "supabase"
      });
  }

  if (
    !process.env
      .OPENAI_API_KEY
  ) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          "Missing OPENAI_API_KEY.",
        failureType:
          "missing_environment_configuration",
        source:
          "openai"
      });
  }

  const query =
    req.method === "GET"
      ? String(
          req.query?.query ||
          ""
        )
      : String(
          body.query ||
          ""
        );

  const normalizedQuery =
    query.trim();

  if (
    !normalizedQuery
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          "Missing semantic search query.",
        failureType:
          "invalid_request"
      });
  }

  const limit =
    clampNumber(
      req.method ===
        "GET"
        ? req.query?.limit
        : body.limit,
      1,
      30,
      6
    );

  const minSimilarity =
    clampNumber(
      req.method ===
        "GET"
        ? req.query
            ?.minSimilarity
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
      item =>
        item.core
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
    embeddingResult
      .cacheHit;

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
              embeddingResult
                .embedding,

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

  if (
    !rpcResponse.ok
  ) {
    return res
      .status(
        rpcResponse.status
      )
      .json({
        success: false,

        error:
          rpcData?.message ||
          rpcData?.error ||
          "Supabase vector RPC failed.",

        details:
          rpcData,

        failureType:
          "supabase_vector_search_failed",

        source:
          "supabase",

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
          Number(
            item.weight ||
            1
          )
        ]
      )
    );

  const merged =
    (
      Array.isArray(
        rpcData
      )
        ? rpcData
        : []
    )
      .map(
        node => {
          const weight =
            weightByCore[
              node.domain
            ] ||
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

            core:
              node.domain,

            routerWeight:
              weight,

            weightedScore:
              similarity *
              weight *
              confidence
          };
        }
      )
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
    searchOrder.map(
      item => {
        const coreMatches =
          merged.filter(
            node =>
              node.domain ===
              item.core
          );

        return {
          core:
            item.core,

          weight:
            item.weight,

          success:
            true,

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
      }
    );

  timing.mergeMs =
    Date.now() -
    mergeStart;

  timing.totalMs =
    Date.now() -
    totalStart;

  return res
    .status(200)
    .json({
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
      ? req.query
          ?.searchOrder ||
        req.query
          ?.cores ||
        req.query
          ?.domain ||
        ""
      : body.searchOrder ||
        body.cores ||
        body.domain ||
        body.core ||
        "";

  let parsed = [];

  if (
    Array.isArray(
      raw
    )
  ) {
    parsed =
      raw;
  } else if (
    typeof raw ===
      "string" &&
    raw.trim()
  ) {
    try {
      const maybeJson =
        JSON.parse(
          raw
        );

      parsed =
        Array.isArray(
          maybeJson
        )
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

  if (
    !parsed.length
  ) {
    parsed =
      DEFAULT_SEARCH_ORDER;
  }

  const normalized =
    parsed
      .map(
        item => {
          if (
            typeof item ===
            "string"
          ) {
            return {
              core:
                item,
              weight:
                1
            };
          }

          if (
            !isPlainObject(
              item
            )
          ) {
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
        }
      )
      .filter(
        item =>
          VALID_KNOWLEDGE_CORES
            .includes(
              item.core
            )
      )
      .map(
        item => ({
          core:
            item.core,

          weight:
            Number.isFinite(
              item.weight
            )
              ? item.weight
              : 1
        })
      );

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
    String(
      query ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    !cleanQuery
  ) {
    throw new Error(
      "Cannot create an embedding for an empty query."
    );
  }

  const cached =
    QUERY_EMBEDDING_CACHE
      .get(
        cleanQuery
      );

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
      cacheHit:
        true
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

            input:
              query
          })
      }
    );

  const embeddingData =
    await readJsonResponse(
      embeddingResponse
    );

  if (
    !embeddingResponse.ok
  ) {
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

  if (
    !Array.isArray(
      embedding
    )
  ) {
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
    cacheHit:
      false
  };
}

function pruneEmbeddingCache() {
  const now =
    Date.now();

  for (
    const [
      key,
      value
    ]
    of QUERY_EMBEDDING_CACHE
  ) {
    if (
      !value ||
      now -
        value.createdAt >=
        QUERY_EMBEDDING_CACHE_TTL_MS
    ) {
      QUERY_EMBEDDING_CACHE
        .delete(
          key
        );
    }
  }
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
    isPlainObject(
      suppliedBody
    )
      ? suppliedBody
      : isPlainObject(
          req.body
        )
        ? req.body
        : {};

  if (
    !process.env
      .OPENAI_API_KEY
  ) {
    return res
      .status(500)
      .json({
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

  if (
    !question
  ) {
    return res
      .status(400)
      .json({
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
                role:
                  "system",
                content:
                  systemPrompt
              },
              {
                role:
                  "user",
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

  if (
    !response.ok
  ) {
    return res
      .status(
        response.status
      )
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
    extractOpenAIAnswer(
      parsed
    ) ||
    (
      parsedResult.wasJson
        ? ""
        : safeTrim(
            rawModelOutput
          )
    );

  if (
    !answer
  ) {
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

    return res
      .status(502)
      .json({
        success: false,

        error:
          "OpenAI returned no usable response text.",

        failureType:
          "empty_model_response",

        responseText:
          null,

        outputText:
          null,

        finalResponse:
          null,

        answer:
          null,

        knowledgeAnswer:
          null,

        model:
          data?.model ||
          DEFAULT_OPENAI_MODEL,

        finishReason:
          data?.choices?.[0]
            ?.finish_reason ||
          null,

        rawModelOutput:
          rawModelOutput ||
          null,

        parsedModelOutput:
          parsed ||
          null,

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

  return res
    .status(200)
    .json({
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

      // Temporary compatibility fields.
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
- Do not claim a file was edited, committed, executed, or deployed unless the supplied context explicitly confirms it.
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
      .map(
        part => {
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
        }
      )
      .filter(
        Boolean
      )
      .join("\n")
      .trim();
  }

  return "";
}

function parseModelResult(
  rawOutput = ""
) {
  const text =
    safeTrim(
      rawOutput
    );

  if (
    !text
  ) {
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
        JSON.parse(
          text
        ),
      wasJson:
        true,
      error:
        null
    };
  } catch {
    const extractedJson =
      extractJsonObject(
        text
      );

    if (
      extractedJson
    ) {
      try {
        return {
          value:
            JSON.parse(
              extractedJson
            ),
          wasJson:
            true,
          error:
            null
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
      wasJson:
        false,
      error:
        "Model returned non-JSON content."
    };
  }
}

function extractJsonObject(
  value = ""
) {
  const text =
    String(
      value ||
      ""
    );

  const firstBrace =
    text.indexOf(
      "{"
    );

  const lastBrace =
    text.lastIndexOf(
      "}"
    );

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <=
      firstBrace
  ) {
    return "";
  }

  return text.slice(
    firstBrace,
    lastBrace +
      1
  );
}

function extractOpenAIAnswer(
  value
) {
  if (
    typeof value ===
    "string"
  ) {
    return safeTrim(
      value
    );
  }

  if (
    !isPlainObject(
      value
    )
  ) {
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

  if (
    !rawText
  ) {
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
  if (
    !process.env
      .SUPABASE_URL
  ) {
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
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
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
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.max(
    0,
    number
  );
}

function normalizeConfidenceLabel(
  value
) {
  const normalized =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    [
      "low",
      "medium",
      "high"
    ].includes(
      normalized
    )
  ) {
    return normalized;
  }

  return "medium";
}

function normalizeConversationMode(
  value
) {
  const normalized =
    String(
      value ||
      ""
    )
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

function normalizeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}

function normalizeObject(
  value
) {
  return isPlainObject(
    value
  )
    ? value
    : {};
}

function normalizeObjectOrNull(
  value
) {
  return isPlainObject(
    value
  )
    ? value
    : null;
}

function firstNonEmptyString(
  values = []
) {
  for (
    const value
    of values
  ) {
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

function safeTrim(
  value
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function safeJsonStringify(
  value
) {
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

function isPlainObject(
  value
) {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  );
}