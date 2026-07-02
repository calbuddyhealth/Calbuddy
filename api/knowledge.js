// api/knowledge.js
// CalBuddy / Ari Knowledge API
// Purpose: Router-driven six-core Supabase retrieval + Ari OpenAI knowledge client.
// V3.0.0 — Six-Core / Multi-Core Semantic Retrieval / Legacy-Safe

const VALID_KNOWLEDGE_CORES = [
  "character_core",
  "relationship_core",
  "memory_core",
  "life_core",
  "knowledge_core",
  "growth_core"
];

const LEGACY_DOMAINS = ["ari_legacy"];

const DEFAULT_SEARCH_ORDER = [
  { core: "knowledge_core", weight: 1.0 }
];

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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase server environment variables."
      });
    }

    return res.status(400).json({ error: "Unknown knowledge action." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Knowledge API failed."
    });
  }
}

async function handleSemanticSearchAriNodes(req, res, body = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: "Missing Supabase server environment variables."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
  }

  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json"
  };

  const query =
    req.method === "GET"
      ? String(req.query.query || "")
      : String(body.query || "");

  if (!query.trim()) {
    return res.status(400).json({ error: "Missing semantic search query." });
  }

  const limit = clampNumber(
    req.method === "GET" ? req.query.limit : body.limit,
    1,
    30,
    8
  );

  const limitPerCore = clampNumber(
    req.method === "GET" ? req.query.limitPerCore : body.limitPerCore,
    1,
    10,
    5
  );

  const minSimilarity = clampNumber(
    req.method === "GET" ? req.query.minSimilarity : body.minSimilarity,
    0,
    1,
    0.35
  );

  const searchOrder = normalizeSearchOrder(req, body);

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
    return res.status(embeddingResponse.status).json({
      error: embeddingData?.error?.message || "Embedding failed."
    });
  }

  const queryEmbedding = embeddingData?.data?.[0]?.embedding;

  const allMatches = [];
  const coreResults = [];

  for (const item of searchOrder) {
    const core = item.core;
    const weight = Number(item.weight || 1);

    const url =
      `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes` +
      `?select=*` +
      `&embedding=not.is.null` +
      `&domain=eq.${encodeURIComponent(core)}` +
      `&limit=500`;

    const nodesResponse = await fetch(url, { method: "GET", headers });
    const nodes = await nodesResponse.json();

    if (!nodesResponse.ok) {
      coreResults.push({
        core,
        weight,
        success: false,
        error: nodes,
        count: 0
      });
      continue;
    }

    const matches = (nodes || [])
      .filter(node => !isLegacyNode(node))
      .map(node => {
        const { embedding, ...cleanNode } = node;
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        const confidence = Number(cleanNode.confidence || 0.8);
        const weightedScore = similarity * weight * confidence;

        return {
          ...cleanNode,
          core,
          routerWeight: weight,
          similarity,
          weightedScore
        };
      })
      .filter(node => Number.isFinite(node.similarity))
      .filter(node => node.similarity >= minSimilarity)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, limitPerCore);

    allMatches.push(...matches);

    coreResults.push({
      core,
      weight,
      success: true,
      count: matches.length,
      bestSimilarity: matches[0]?.similarity || 0,
      bestWeightedScore: matches[0]?.weightedScore || 0
    });
  }

  const merged = dedupeNodes(allMatches)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, limit);

  return res.status(200).json({
    success: true,
    query,
    searchOrder,
    searchedCores: searchOrder.map(item => item.core),
    count: merged.length,
    matches: merged,
    coreResults
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
        return {
          core: item,
          weight: 1.0
        };
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

function isLegacyNode(node = {}) {
  return (
    LEGACY_DOMAINS.includes(node.domain) ||
    (Array.isArray(node.tags) && node.tags.includes("legacy"))
  );
}

function dedupeNodes(nodes = []) {
  const seen = new Set();
  const result = [];

  for (const node of nodes) {
    const key = node.knowledge_id || node.id || `${node.domain}:${node.topic}`;

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(node);
  }

  return result;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
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

Authority order:
1. Safety and medical risk boundaries
2. The user's resolved question
3. The provided AI instruction
4. Situation contract and triage
5. Ari character voice and communication style

Rules:
- Answer the user's actual question.
- Follow the AI instruction closely when provided.
- Use the provided context to shape the answer.
- Do not mention internal systems, pipeline names, contracts, triage, or hidden architecture.
- Do not output placeholders.
- Do not sound robotic.
- Be natural, useful, direct, and concise.
- If the user is asking for code, provide code.
- If the user is asking for a patch, provide the patch.
- If unsure, say what is missing and what to inspect next.
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
${JSON.stringify(
  {
    character,
    contract,
    triage,
    situation,
    continuity,
    language
  },
  null,
  2
)}

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

  const raw = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      answer: raw,
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

function parseVector(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .map(Number)
      .filter(Number.isFinite);
  }

  return [];
}

function cosineSimilarity(a = [], b = []) {
  const vectorA = parseVector(a);
  const vectorB = parseVector(b);

  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dot += vectorA[i] * vectorB[i];
    magA += vectorA[i] * vectorA[i];
    magB += vectorB[i] * vectorB[i];
  }

  if (!magA || !magB) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}