import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

// api/ask-calbuddy.js
// CalBuddy OpenAI Knowledge Client
// Purpose: Server-side OpenAI caller for Ari Rebirth.
// V2.4.1 — Gives named structured meal-plan/recipe contracts a safe response budget.
// V2.4.0 — Honors action-specific JSON contracts and request-scoped output budgets.
// V2.3.0 — Adds server-side provider token/cost accounting.

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
      responseFormat = "json",
      maxTokens = null
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
    const requestedModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const defaultMaxTokens = Number(process.env.OPENAI_MAX_TOKENS || 1200);
    const requestedMaxTokens = Number(maxTokens);
    const structuredActionBudget = /\b(mealPlanProposal|recipeProposal)\b/.test(String(aiInstruction || ""))
      ? 2200
      : defaultMaxTokens;
    const resolvedMaxTokens = Number.isFinite(requestedMaxTokens) && requestedMaxTokens > 0
      ? Math.max(256, Math.min(3000, Math.round(requestedMaxTokens)))
      : structuredActionBudget;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: instruction },
          ...recentHistory,
          { role: "user", content: cleanMessage || "Continue from the provided instruction." }
        ],
        temperature: Number(process.env.OPENAI_TEMPERATURE || 0.45),
        max_tokens: resolvedMaxTokens,
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

    const providerUsage = await recordOpenAIUsage({
      userId: userContext?.userId || userContext?.user_id || null,
      endpoint: "/api/ask-calbuddy",
      usageType: "chat",
      requestCategory: aiInstruction ? "rebirth_deep" : "legacy_chat",
      model: data?.model || requestedModel,
      responseData: data,
      providerRequestId: openaiResponse.headers.get("x-request-id") || data?.id || null,
      metadata: {
        historyTurns: recentHistory.length,
        messageCharacters: cleanMessage.length,
        hasAriInstruction: Boolean(String(aiInstruction || "").trim()),
        responseFormat,
        maxTokens: resolvedMaxTokens
      }
    });

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
      mealEstimate: parsed.mealEstimate || null,
      foodAnalysis: parsed.foodAnalysis || null,
      nutritionEstimate: parsed.nutritionEstimate || null,
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
      rawContent,
      usage: providerUsage ? {
        inputTokens: providerUsage.inputTokens,
        cachedInputTokens: providerUsage.cachedInputTokens,
        outputTokens: providerUsage.outputTokens,
        totalTokens: providerUsage.totalTokens
      } : null,
      model: data?.model || requestedModel
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

  const mealEstimateRule = `
MEAL ESTIMATE RULE:
When the user describes food they ate, asks for calories/macros, or asks Ari to log a meal, estimate the complete meal when reasonably possible.
Return mealEstimate in this exact structure:
{
  "description": "short meal description",
  "totalCalories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "foods": [
    {
      "name": "food",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "confidence": "low|medium|high"
}
Use realistic estimates when exact brand, recipe, portion, or preparation is unknown. Do not pretend an estimate is exact.
If estimating multiple foods, totalCalories and macro totals must represent the entire meal, not only the first ingredient.
In the reply, briefly show calories plus Protein, Carbs, and Fat whenever mealEstimate is present.
If the user asks to log the meal, do NOT say it has already been logged. Say what you estimate and let the app action/confirmation layer perform the actual write.
`;

  if (suppliedInstruction) {
    return `
You are Ari's server-side OpenAI knowledge client.

Your job:
- Follow Ari Rebirth's aiInstruction exactly.
- Do not override Ari Rebirth's lane, contract, safety, or developer decisions.
- Do not invent app changes.
- Do not claim files were edited, committed, deployed, or app data was saved unless the application action layer confirms success.
- If GitHub file content is provided, ground the answer in that exact content.
- Be concise, specific, and useful.
${mealEstimateRule}

ARI REBIRTH INSTRUCTION:
${suppliedInstruction}

${context}

OUTPUT:
${responseFormat === "json"
  ? `Return only valid JSON.
IMPORTANT: If the ARI REBIRTH INSTRUCTION above requests a specific JSON schema, named top-level object, or exact structured contract, that requested contract is authoritative. Return that requested JSON structure directly. Do NOT wrap it in the default Ari response shape below and do NOT omit its required fields.

Only when the ARI REBIRTH INSTRUCTION does NOT specify its own JSON structure, use this default shape:
{
  "reply": "string",
  "emotion": "happy",
  "mealEstimate": null,
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
- Do not claim app data was saved unless an application action actually confirms success.
${mealEstimateRule}
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
  "mealEstimate": null,
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
      mealEstimate: null,
      foodAnalysis: null,
      nutritionEstimate: null,
      pendingAction: null,
      memoryCandidate: null,
      developerIntent: null
    };
  }

  if (responseFormat !== "json") {
    return {
      reply: text,
      emotion: "happy",
      mealEstimate: null,
      foodAnalysis: null,
      nutritionEstimate: null,
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
        mealEstimate: parsed.mealEstimate || null,
        foodAnalysis: parsed.foodAnalysis || null,
        nutritionEstimate: parsed.nutritionEstimate || null,
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
    mealEstimate: null,
    foodAnalysis: null,
    nutritionEstimate: null,
    pendingAction: null,
    memoryCandidate: null,
    developerIntent: null
  };
}
