// api/ari-knowledge-openai.js
// Ari Knowledge OpenAI Endpoint
// Purpose: Securely ask OpenAI for factual teaching content.
// V1.0

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Knowledge endpoint failed."
    });
  }
}