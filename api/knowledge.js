// api/knowledge.js
// CalBuddy / Ari Knowledge API
// Purpose: Supabase knowledge library + Ari OpenAI knowledge client.
// V2.2.0 — Ari Rebirth Compatible / aiInstruction Ready

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const action = req.method === "GET" ? req.query.action : body.action;

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

    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const user_id = req.method === "GET" ? req.query.user_id : body.user_id;

    if (!action) return res.status(400).json({ error: "Missing action." });
    
    if (action === "semantic_search_ari_nodes") {
  const query =
    req.method === "GET"
      ? String(req.query.query || "")
      : String(body.query || "");

  const limit = Number(req.method === "GET" ? req.query.limit || 5 : body.limit || 5);

  if (!query.trim()) {
    return res.status(400).json({ error: "Missing semantic search query." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
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
    return res.status(embeddingResponse.status).json({
      error: embeddingData?.error?.message || "Embedding failed."
    });
  }

  const queryEmbedding = embeddingData?.data?.[0]?.embedding;

  const nodesResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes?select=*&embedding=not.is.null&limit=200`,
    { method: "GET", headers }
  );

  const nodes = await nodesResponse.json();

  if (!nodesResponse.ok) {
    return res.status(nodesResponse.status).json({ error: nodes });
  }

  const matches = (nodes || [])
    .map(node => ({
      ...node,
      similarity: cosineSimilarity(queryEmbedding, node.embedding)
    }))
    .filter(node => Number.isFinite(node.similarity))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return res.status(200).json({
    success: true,
    query,
    count: matches.length,
    matches
  });
}
    
    if (!user_id) return res.status(400).json({ error: "Missing user_id." });

    if (action === "create_document") {
      const {
        title,
        document_type = "unknown",
        source = "user_upload",
        storage_path = null,
        copyright_status = "unknown",
        use_allowed = false,
        notes = ""
      } = body;

      if (!title) return res.status(400).json({ error: "Missing document title." });

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/knowledge_documents`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          owner_user_id: user_id,
          title,
          document_type,
          source,
          storage_path,
          copyright_status,
          use_allowed,
          notes
        })
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data });

      return res.status(200).json({ success: true, document: data?.[0] || null });
    }

    if (action === "add_chunk") {
      const {
        document_id,
        chunk_title = null,
        chunk_text,
        category = null,
        page_start = null,
        page_end = null,
        tags = []
      } = body;

      if (!document_id || !chunk_text) {
        return res.status(400).json({ error: "document_id and chunk_text are required." });
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/knowledge_chunks`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          document_id,
          chunk_title,
          chunk_text,
          category,
          page_start,
          page_end,
          tags
        })
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data });

      return res.status(200).json({ success: true, chunk: data?.[0] || null });
    }

    if (action === "add_lesson") {
      const {
        document_id,
        lesson_title = null,
        lesson_summary,
        application_notes = null,
        category = null
      } = body;

      if (!document_id || !lesson_summary) {
        return res.status(400).json({ error: "document_id and lesson_summary are required." });
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/document_lessons`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          document_id,
          lesson_title,
          lesson_summary,
          application_notes,
          category
        })
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data });

      return res.status(200).json({ success: true, lesson: data?.[0] || null });
    }

    if (action === "search_knowledge") {
      const query =
        req.method === "GET"
          ? String(req.query.query || "")
          : String(body.query || "");

      if (!query.trim()) return res.status(400).json({ error: "Missing search query." });

      const encodedQuery = encodeURIComponent(`%${query}%`);

      const chunksResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=*,knowledge_documents!inner(owner_user_id,title,document_type,source,use_allowed)&chunk_text=ilike.${encodedQuery}&knowledge_documents.owner_user_id=eq.${user_id}&limit=10`,
        { method: "GET", headers }
      );

      const chunks = await chunksResponse.json();

      const lessonsResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/document_lessons?select=*,knowledge_documents!inner(owner_user_id,title,document_type,source,use_allowed)&lesson_summary=ilike.${encodedQuery}&knowledge_documents.owner_user_id=eq.${user_id}&limit=10`,
        { method: "GET", headers }
      );

      const lessons = await lessonsResponse.json();

      return res.status(200).json({
        success: true,
        results: {
          chunks: chunksResponse.ok ? chunks : [],
          lessons: lessonsResponse.ok ? lessons : []
        }
      });
    }

    if (action === "list_documents") {
      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/knowledge_documents?owner_user_id=eq.${user_id}&order=created_at.desc&limit=50`,
        { method: "GET", headers }
      );

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data });

      return res.status(200).json({ success: true, documents: data || [] });
    }

    if (action === "save_uploaded_file") {
      const {
        file_name,
        file_type = null,
        file_category = null,
        storage_path = null,
        public_url = null,
        summary = null,
        extracted_text = null
      } = body;

      if (!file_name) return res.status(400).json({ error: "Missing file_name." });

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/uploaded_files`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          user_id,
          file_name,
          file_type,
          file_category,
          storage_path,
          public_url,
          summary,
          extracted_text,
          ai_processed: Boolean(summary || extracted_text)
        })
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data });

      return res.status(200).json({ success: true, file: data?.[0] || null });
    }

    return res.status(400).json({ error: "Unknown knowledge action." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Knowledge API failed."
    });
  }
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

  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) return 0;

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