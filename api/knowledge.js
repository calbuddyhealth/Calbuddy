// api/knowledge.js 
// CalBuddy / Ari Knowledge API
// Purpose: Router-driven six-core Supabase retrieval + Ari OpenAI knowledge client.
// V3.0.5 — Semantic Retrieval Timing / Embedding Cache Diagnostics / RPC Profiling

const VALID_KNOWLEDGE_CORES = [
  "character_core",
  "relationship_core",
  "memory_core",
  "life_core",
  "knowledge_core",
  "growth_core"
];

const DEFAULT_SEARCH_ORDER = [
  { core: "knowledge_core", weight: 1.0 }
];

const QUERY_EMBEDDING_CACHE = new Map();
const QUERY_EMBEDDING_CACHE_TTL_MS = 1000 * 60 * 30;

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const action = req.method === "GET" ? req.query.action : body.action;

    if (action === "semantic_search_ari_nodes") {
      return await handleSemanticSearchAriNodes(req, res, body);
    }

    if (
      action === "openai_knowledge" ||
      body.aiInstruction ||
      body.question ||
      body.resolvedUserQuestion ||
      body.userMessage ||
      body.message
    ) {
      return await handleOpenAIKnowledge(req, res);
    }

    return res.status(400).json({ error: "Unknown knowledge action." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Knowledge API failed."
    });
  }
}

async function handleSemanticSearchAriNodes(req, res, body = {}) {
  const totalStart = Date.now();
  const timing = {};

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase server environment variables." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
  }

  const query =
    req.method === "GET"
      ? String(req.query.query || "")
      : String(body.query || "");

  if (!query.trim()) {
    return res.status(400).json({ error: "Missing semantic search query." });
  }

  const limit = clampNumber(req.method === "GET" ? req.query.limit : body.limit, 1, 30, 6);
  const minSimilarity = clampNumber(
    req.method === "GET" ? req.query.minSimilarity : body.minSimilarity,
    0,
    1,
    0.22
  );

  const searchOrder = normalizeSearchOrder(req, body);
  const domains = searchOrder.map(item => item.core);

  const embeddingStart = Date.now();
  const embeddingResult = await getQueryEmbedding(query);
  timing.embeddingMs = Date.now() - embeddingStart;
  timing.embeddingCacheHit = embeddingResult.cacheHit;

  const rpcStart = Date.now();

  const rpcResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/match_ari_knowledge_nodes`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query_embedding: embeddingResult.embedding,
        match_domains: domains,
        match_count: limit,
        min_similarity: minSimilarity
      })
    }
  );

  const rpcData = await rpcResponse.json();
  timing.supabaseRpcMs = Date.now() - rpcStart;

  if (!rpcResponse.ok) {
    return res.status(rpcResponse.status).json({
      error: rpcData?.message || rpcData?.error || "Supabase vector RPC failed.",
      details: rpcData,
      timing: {
        ...timing,
        totalMs: Date.now() - totalStart
      }
    });
  }

  const mergeStart = Date.now();

  const weightByCore = Object.fromEntries(
    searchOrder.map(item => [item.core, Number(item.weight || 1)])
  );

  const merged = (Array.isArray(rpcData) ? rpcData : [])
    .map(node => {
      const weight = weightByCore[node.domain] || 1;
      const confidence = Number(node.confidence || 1);

      return {
        ...node,
        core: node.domain,
        routerWeight: weight,
        weightedScore: Number(node.similarity || 0) * weight * confidence
      };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, limit);

  const coreResults = searchOrder.map(item => {
    const coreMatches = merged.filter(node => node.domain === item.core);

    return {
      core: item.core,
      weight: item.weight,
      success: true,
      count: coreMatches.length,
      bestSimilarity: coreMatches[0]?.similarity || 0,
      bestWeightedScore: coreMatches[0]?.weightedScore || 0
    };
  });

  timing.mergeMs = Date.now() - mergeStart;
  timing.totalMs = Date.now() - totalStart;

  return res.status(200).json({
    success: true,
    query,
    searchOrder,
    searchedCores: domains,
    count: merged.length,
    matches: merged,
    coreResults,
    timing
  });
}

function normalizeSearchOrder(req, body = {}) {
  const raw =
    req.method === "GET"
      ? req.query.searchOrder || req.query.cores || req.query.domain || ""
      : body.searchOrder || body.cores || body.domain || body.core || "";

  let parsed = [];

  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const maybeJson = JSON.parse(raw);
      parsed = Array.isArray(maybeJson) ? maybeJson : [maybeJson];
    } catch {
      parsed = raw.split(",").map(core => core.trim());
    }
  }

  if (!parsed.length) parsed = DEFAULT_SEARCH_ORDER;

  const normalized = parsed
    .map(item => {
      if (typeof item === "string") {
        return { core: item, weight: 1.0 };
      }

      return {
        core: item.core || item.domain || item.id || "",
        weight: Number(item.weight ?? item.score ?? 1.0)
      };
    })
    .filter(item => VALID_KNOWLEDGE_CORES.includes(item.core))
    .map(item => ({
      core: item.core,
      weight: Number.isFinite(item.weight) ? item.weight : 1.0
    }));

  return normalized.length ? normalized : DEFAULT_SEARCH_ORDER;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

async function getQueryEmbedding(query = "") {
  const cleanQuery = String(query || "").trim().toLowerCase();
  const cached = QUERY_EMBEDDING_CACHE.get(cleanQuery);

  if (
    cached &&
    Array.isArray(cached.embedding) &&
    Date.now() - cached.createdAt < QUERY_EMBEDDING_CACHE_TTL_MS
  ) {
    return {
      embedding: cached.embedding,
      cacheHit: true
    };
  }

  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query
    })
  });

  const embeddingData = await embeddingResponse.json();

  if (!embeddingResponse.ok) {
    throw new Error(embeddingData?.error?.message || "Embedding failed.");
  }

  const embedding = embeddingData?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("No embedding returned.");
  }

  QUERY_EMBEDDING_CACHE.set(cleanQuery, {
    embedding,
    createdAt: Date.now()
  });

  return {
    embedding,
    cacheHit: false
  };
}

async function handleOpenAIKnowledge(req, res) {
  const body = req.body || {};

  const aiInstruction = body.aiInstruction || body.instruction || "";

  const question =
    body.resolvedUserQuestion ||
    body.resolvedQuestion ||
    body.question ||
    body.userMessage ||
    body.message ||
    body.input ||
    body.rawQuestion ||
    "";

  const rawQuestion =
    body.rawQuestion ||
    body.userMessage ||
    body.message ||
    body.input ||
    question ||
    "";

  const character = body.character || body.characterContext || {};
  const contract = body.contract || body.situationContract || {};
  const triage = body.triage || body.ariTriage || {};
  const situation = body.situation || body.situationMap || {};
  const continuity = body.continuity || body.continuityContext || body.threadState || {};
  const language = body.language || body.humanLanguageProfile || {};
  const conversationMode = body.conversationMode || "new_question";

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
  }

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: "No question provided." });
  }

  const cleanQuestion = String(question).trim();

  const systemPrompt = `
You are Ari.

You are the OpenAI language brain for Ari Rebirth.
Your job is to turn Ari Rebirth's instruction and context into a natural final answer.

Rules:
- Answer the user's actual question.
- Follow the AI instruction closely when provided.
- Do not mention internal systems, pipeline names, contracts, triage, or hidden architecture.
- Be natural, useful, direct, and concise.
- If the user is asking for code, provide code.
- Never claim a file was edited, committed, or deployed unless the app confirms it.

Return only valid JSON.
`.trim();

  const userPrompt = `
RAW USER MESSAGE:
${String(rawQuestion || "").trim()}

QUESTION TO ANSWER:
${cleanQuestion}

CONVERSATION MODE:
${conversationMode}

ARI REBIRTH AI INSTRUCTION:
${String(aiInstruction || "").trim() || "No special instruction provided."}

CONTEXT:
${JSON.stringify({ character, contract, triage, situation, continuity, language }, null, 2)}

Return JSON only:
{
  "answer": "natural final answer Ari should say to the user",
  "confidence": "low | medium | high",
  "sources": [],
  "notes": "optional"
}
`.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.55,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "OpenAI knowledge request failed."
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  } catch {
    parsed = {
      answer: data.choices?.[0]?.message?.content || "",
      confidence: "medium",
      sources: [],
      notes: "Model returned non-JSON content."
    };
  }

  const answer =
    parsed.answer ||
    parsed.finalResponse ||
    parsed.reply ||
    parsed.text ||
    "I don’t have enough reliable information to answer that clearly yet.";

  return res.status(200).json({
    answer,
    finalResponse: answer,
    knowledgeAnswer: answer,
    response: answer,
    text: answer,
    confidence: parsed.confidence || "medium",
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    notes: parsed.notes || null,
    model: data.model || "gpt-4o-mini",
    source: "openai_knowledge",
    success: true
  });
}