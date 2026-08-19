// ARI vNext — semantic action verification for missed explicit app mutations.
// This is a bounded GPT-4o-mini fallback after the primary vNext model chose
// conversation instead of a tool. It never executes an action itself.

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";

export async function reviewExplicitApplicationIntent({ turn = {}, route = {}, tools = [] } = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  const availableTools = (Array.isArray(tools) ? tools : [])
    .filter((tool) => tool?.type === "function" && typeof tool?.name === "string")
    .map((tool) => String(tool.name).trim())
    .filter(Boolean);

  if (!availableTools.length) return null;

  const decisions = ["none", "blocked_future_meal_plan", ...availableTools];
  const verifierTool = {
    type: "function",
    name: "verify_action_intent",
    description: "Classify whether the CURRENT user message explicitly requests one available ARI XP app mutation.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        decision: { type: "string", enum: decisions },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason: { type: "string" }
      },
      required: ["decision", "confidence", "reason"]
    }
  };

  const instructions = [
    "You are Ari vNext's semantic action verifier.",
    "The primary Ari model already answered without calling an app tool. Review only the CURRENT user message and determine whether that was correct.",
    "Do not infer permission to mutate from conversation history, app state, or a statement of fact.",
    "A statement such as 'I ate eggs' is NOT permission to log food. A question such as 'is chicken healthy?' is NOT a mutation request.",
    "If the user explicitly asks Ari to log, save, record, create, build, plan, edit, change, replace, remove, update, start, complete, or cancel something and a matching tool is available, select that tool.",
    "Interpret natural language semantically. The user does not need to use the exact tool or feature name. For example, 'figure out what I should eat for the rest of today using my calories left' can be a request to create today's Meal Plan.",
    "ARI XP Meal Plan is strictly TODAY ONLY. If the user asks Ari to create or schedule a Meal Plan for tomorrow or another future day, select blocked_future_meal_plan instead of any tool.",
    "Do not select blocked_future_meal_plan for a general future nutrition question that is not asking to create/schedule the ARI XP Meal Plan.",
    `Available app tools: ${availableTools.join(", ")}.`,
    `Current route: ${JSON.stringify({ nutrition: Boolean(route?.nutrition), training: Boolean(route?.training), goals: Boolean(route?.goals), teenMode: Boolean(route?.teenMode) })}.`,
    "Use decision=none when the message is advice, explanation, casual conversation, a factual statement, or otherwise does not explicitly authorize a write."
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const body = {
    model: process.env.ARI_VNEXT_FAST_MODEL || "gpt-4o-mini",
    instructions,
    input: [{ role: "user", content: String(turn?.message || "").trim() }],
    tools: [verifierTool],
    tool_choice: { type: "function", name: "verify_action_intent" },
    parallel_tool_calls: false,
    max_output_tokens: 180,
    store: false
  };

  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-action:${userId.slice(0, 53)}`.slice(0, 64);
  }

  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;

    const call = Array.isArray(data?.output)
      ? data.output.find((item) => item?.type === "function_call" && item?.name === "verify_action_intent")
      : null;
    if (!call) return null;

    let args = {};
    try {
      args = JSON.parse(String(call?.arguments || "{}"));
    } catch {
      return null;
    }

    const decision = String(args?.decision || "none").trim();
    const confidence = Number.isFinite(Number(args?.confidence))
      ? Math.max(0, Math.min(1, Number(args.confidence)))
      : 0;

    if (!decisions.includes(decision)) return null;

    return {
      version: "1.0.0",
      decision,
      confidence,
      reason: String(args?.reason || "").trim().slice(0, 500),
      model: data?.model || body.model,
      providerRequestId: data?.id || null,
      usage: data?.usage || null
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
