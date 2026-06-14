// api/knowledge.js
// CalBuddy / Ari Knowledge API
// Purpose: Supabase knowledge library + Ari OpenAI teaching knowledge.
// V2.0 

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const action = req.method === "GET" ? req.query.action : req.body?.action;

    // OPENAI KNOWLEDGE MODE
    // This runs before Supabase checks so Ari can ask OpenAI without user_id.
    if (
      action === "openai_knowledge" ||
      (req.method === "POST" && req.body?.question && !action)
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

    const user_id = req.method === "GET" ? req.query.user_id : req.body?.user_id;

    if (!action) {
      return res.status(400).json({ error: "Missing action." });
    }

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id." });
    }

    if (action === "create_document") {
      const {
        title,
        document_type = "unknown",
        source = "user_upload",
        storage_path = null,
        copyright_status = "unknown",
        use_allowed = false,
        notes = ""
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Missing document title." });
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/knowledge_documents`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        document: data?.[0] || null
      });
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
      } = req.body;

      if (!document_id || !chunk_text) {
        return res.status(400).json({
          error: "document_id and chunk_text are required."
        });
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/knowledge_chunks`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            document_id,
            chunk_title,
            chunk_text,
            category,
            page_start,
            page_end,
            tags
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        chunk: data?.[0] || null
      });
    }

    if (action === "add_lesson") {
      const {
        document_id,
        lesson_title = null,
        lesson_summary,
        application_notes = null,
        category = null
      } = req.body;

      if (!document_id || !lesson_summary) {
        return res.status(400).json({
          error: "document_id and lesson_summary are required."
        });
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/document_lessons`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            document_id,
            lesson_title,
            lesson_summary,
            application_notes,
            category
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        lesson: data?.[0] || null
      });
    }

    if (action === "search_knowledge") {
      const query =
        req.method === "GET"
          ? String(req.query.query || "")
          : String(req.body?.query || "");

      if (!query.trim()) {
        return res.status(400).json({ error: "Missing search query." });
      }

      const encodedQuery = encodeURIComponent(`%${query}%`);

      const chunksResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=*,knowledge_documents!inner(owner_user_id,title,document_type,source,use_allowed)&chunk_text=ilike.${encodedQuery}&knowledge_documents.owner_user_id=eq.${user_id}&limit=10`,
        {
          method: "GET",
          headers
        }
      );

      const chunks = await chunksResponse.json();

      const lessonsResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/document_lessons?select=*,knowledge_documents!inner(owner_user_id,title,document_type,source,use_allowed)&lesson_summary=ilike.${encodedQuery}&knowledge_documents.owner_user_id=eq.${user_id}&limit=10`,
        {
          method: "GET",
          headers
        }
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
        {
          method: "GET",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        documents: data || []
      });
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
      } = req.body;

      if (!file_name) {
        return res.status(400).json({ error: "Missing file_name." });
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/uploaded_files`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        file: data?.[0] || null
      });
    }

    return res.status(400).json({
      error: "Unknown knowledge action."
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Knowledge API failed."
    });
  }
}

async function handleOpenAIKnowledge(req, res) {
  const { question, summary = {} } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
  }

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: "No question provided." });
  }

  const cleanQuestion = String(question).trim();

  const systemPrompt = `
You are Ari's Knowledge Engine.

Your job is to provide accurate factual teaching content for Ari Rebirth.

Rules:
- Answer the user's question directly.
- Be clear, simple, and useful.
- Do not sound emotional, therapeutic, mystical, or overly philosophical.
- Do not mention Ari's internal systems.
- Do not say "as an AI".
- If the question is uncertain, explain what is known and what is still debated.
- If the question is medical, legal, financial, or safety-related, give general education and recommend qualified professional help when appropriate.
- If you are unsure, say so clearly.
- Return only valid JSON.
`;

  const userPrompt = `
Question:
${cleanQuestion}

Context:
${JSON.stringify(
  {
    responseIntent: summary.responseIntent || null,
    domainLead: summary.domainLead || null,
    primaryHumanNeed: summary.primaryHumanNeed || null
  },
  null,
  2
)}

Return JSON in this shape:
{
  "answer": "clear factual answer",
  "confidence": "low | medium | high",
  "sources": [],
  "notes": "optional brief limitation"
}
`;

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
      temperature: 0.25,
      max_tokens: 900,
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

  return res.status(200).json({
    answer:
      parsed.answer ||
      "I do not have enough reliable information to answer that clearly yet.",
    confidence: parsed.confidence || "medium",
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    notes: parsed.notes || null,
    model: data.model || "gpt-4o-mini"
  });
}