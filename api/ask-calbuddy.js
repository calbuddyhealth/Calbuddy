// api/ask-calbuddy.js
// CalBuddy OpenAI Knowledge Client
// Purpose: Server-side OpenAI caller for Ari Rebirth.
// V2.0.0 — Lean / Rebirth-Compatible / Legacy-Safe

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      message = "",
      aiInstruction = "",
      userContext = {},
      coachMemorySummary = "",
      history = [],
      githubFileContext = null,
      developerInvestigation = null,
      responseFormat = "json"
    } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    const cleanMessage = String(message || "").trim();

    if (!cleanMessage && !aiInstruction) {
      return res.status(400).json({ error: "No message or aiInstruction provided." });
    }

    const instruction = buildInstruction({
      aiInstruction,
      message: cleanMessage,
      userContext,
      coachMemorySummary,
      githubFileContext,
      developerInvestigation,
      responseFormat
    });

    const recentHistory = normalizeHistory(history);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: instruction
          },
          ...recentHistory,
          {
            role: "user",
            content: cleanMessage || "Continue from the provided instruction."
          }
        ],
        temperature: Number(process.env.OPENAI_TEMPERATURE || 0.45),
        max_tokens: Number(process.env.OPENAI_MAX_TOKENS || 1200),
        ...(responseFormat === "json"
          ? { response_format: { type: "json_object" } }
          : {})
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || "OpenAI request failed."
      });
    }

    const rawContent = data?.choices?.[0]?.message?.content || "";

    const parsed = parseModelResponse(rawContent, responseFormat);

    return res.status(200).json({
      reply:
        parsed.reply ||
        parsed.finalResponse ||
        parsed.answer ||
        parsed.text ||
        rawContent ||
        "I heard you, but I need a cleaner response path.",
      emotion: parsed.emotion || parsed.mood || "happy",
      pendingAction: parsed.pendingAction || null,
      memoryCandidate: parsed.memoryCandidate || null,
      developerIntent: parsed.developerIntent || null,
      finalResponse:
        parsed.finalResponse ||
        parsed.reply ||
        parsed.answer ||
        rawContent ||
        null,
      knowledgeAnswer:
        parsed.knowledgeAnswer ||
        parsed.answer ||
        parsed.reply ||
        rawContent ||
        null,
      response: parsed,
      rawContent
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong."
    });
  }
}

function buildInstruction({
  aiInstruction = "",
  message = "",
  userContext = {},
  coachMemorySummary = "",
  githubFileContext = null,
  developerInvestigation = null,
  responseFormat = "json"
}) {
  const suppliedInstruction = String(aiInstruction || "").trim();

  const fileContext = githubFileContext?.content
    ? `
GITHUB FILE CONTEXT:
File path: ${githubFileContext.filePath || "unknown"}

File content:
${String(githubFileContext.content).slice(0, 30000)}
`
    : "GITHUB FILE CONTEXT: none.";

  const investigationContext = developerInvestigation
    ? `
DEVELOPER INVESTIGATION:
${JSON.stringify(developerInvestigation, null, 2).slice(0, 12000)}
`
    : "DEVELOPER INVESTIGATION: none.";

  const context = `
CALBUDDY CONTEXT:
${JSON.stringify(
  {
    userContext,
    coachMemorySummary
  },
  null,
  2
).slice(0, 12000)}

${fileContext}

${investigationContext}
`.trim();

  if (suppliedInstruction) {
    return `
You are Ari's server-side OpenAI knowledge client.

Your job:
- Follow Ari Rebirth's aiInstruction exactly.
- Do not override Ari Rebirth's lane, contract, safety, or developer decisions.
- Do not invent app changes.
- Do not claim files were edited, committed, or deployed.
- If GitHub file content is provided, ground the answer in that exact content.
- Be concise, specific, and useful.

ARI REBIRTH INSTRUCTION:
${suppliedInstruction}

${context}

OUTPUT:
${responseFormat === "json"
  ? `Return only valid JSON.
Required shape:
{
  "reply": "string",
  "emotion": "happy",
  "pendingAction": null,
  "memoryCandidate": null,
  "developerIntent": null
}`
  : "Return plain text only."}
`.trim();
  }

  return `
You are Ari, CalBuddy Health's AI nutrition coach and product-aware assistant.

This is legacy compatibility mode.
Ari Rebirth should normally send aiInstruction. Since none was provided, answer the user directly.

Rules:
- Be warm, direct, practical, and concise.
- Use CalBuddy context when relevant.
- For food questions, estimate calories when reasonable.
- For app/code questions, do not claim edits were made.
- If exact repository content is provided, use it.
- If exact repository content is not provided, say what should be inspected first.

USER MESSAGE:
${message}

${context}

Return only valid JSON:
{
  "reply": "string",
  "emotion": "happy",
  "pendingAction": null,
  "memoryCandidate": null,
  "developerIntent": null
}
`.trim();
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history.slice(-12).map(item => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: String(item?.content || "").slice(0, 2000)
  }));
}

function parseModelResponse(rawContent = "", responseFormat = "json") {
  const text = String(rawContent || "").trim();

  if (!text) {
    return {
      reply: "I heard you, but I need a cleaner response path.",
      emotion: "concerned",
      pendingAction: null,
      memoryCandidate: null,
      developerIntent: null
    };
  }

  if (responseFormat !== "json") {
    return {
      reply: text,
      emotion: "happy",
      pendingAction: null,
      memoryCandidate: null,
      developerIntent: null
    };
  }

  try {
    const parsed = JSON.parse(text);

    if (parsed && typeof parsed === "object") {
      return {
        reply:
          parsed.reply ||
          parsed.finalResponse ||
          parsed.answer ||
          parsed.text ||
          "I heard you, but I need a cleaner response path.",
        emotion: parsed.emotion || parsed.mood || "happy",
        pendingAction: parsed.pendingAction || null,
        memoryCandidate: parsed.memoryCandidate || null,
        developerIntent: parsed.developerIntent || null,
        ...parsed
      };
    }
  } catch {
    // fall through
  }

  return {
    reply: text,
    emotion: "happy",
    pendingAction: null,
    memoryCandidate: null,
    developerIntent: null
  };
}