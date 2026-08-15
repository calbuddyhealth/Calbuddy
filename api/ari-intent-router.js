// =====================================================
// ARI XP
// File: api/ari-intent-router.js
// Version: 1.0.0
// Purpose:
//   OpenAI semantic intent router for all Ari surfaces.
//   Returns one strict structured decision. It NEVER executes app actions.
// =====================================================

const ROUTER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      enum: ["conversation", "nutrition", "training", "health", "goals", "social", "developer", "navigation", "unknown"]
    },
    intent: {
      type: "string",
      enum: ["conversation", "question", "create", "log", "edit", "delete", "view", "navigate", "update", "clarify"]
    },
    target: {
      type: "string",
      enum: ["none", "meal", "workout_plan", "workout_exercise", "weight", "profile", "calorie_goal", "goal", "social", "developer_task", "page", "unknown"]
    },
    action: {
      type: "string",
      enum: ["none", "log_meal", "plan_workout", "edit_workout", "delete_workout", "log_weight", "update_profile", "update_goal", "developer_action", "navigate"]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    requires_confirmation: { type: "boolean" },
    needs_clarification: { type: "boolean" },
    clarification_question: { type: "string" },
    reason: { type: "string" },
    entities: {
      type: "object",
      additionalProperties: false,
      properties: {
        food_description: { type: "string" },
        quantity: { type: ["number", "null"] },
        size: { type: "string" },
        meal_category: { type: "string" },
        workout_focus: { type: "string" },
        workout_date_text: { type: "string" },
        duration_minutes: { type: ["number", "null"] },
        difficulty: { type: "string" },
        exercise: { type: "string" },
        weight_value: { type: ["number", "null"] },
        weight_unit: { type: "string" },
        goal_value: { type: ["number", "null"] },
        goal_unit: { type: "string" }
      },
      required: [
        "food_description", "quantity", "size", "meal_category",
        "workout_focus", "workout_date_text", "duration_minutes", "difficulty", "exercise",
        "weight_value", "weight_unit", "goal_value", "goal_unit"
      ]
    }
  },
  required: [
    "domain", "intent", "target", "action", "confidence",
    "requires_confirmation", "needs_clarification", "clarification_question",
    "reason", "entities"
  ]
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const message = String(req.body?.message || "").trim();
  const appContext = req.body?.appContext && typeof req.body.appContext === "object"
    ? req.body.appContext
    : {};

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const system = `
You are ARI XP's CENTRAL INTENT ROUTER.
Your only job is to interpret the CURRENT user message into the supplied schema.
Do not answer the user. Do not execute anything. Do not claim anything was saved.

CRITICAL RULES:
- Base executable actions on the CURRENT message only. Never infer a data mutation from old conversation history.
- Ordinary questions and statements must use action="none".
- "I ate an egg roll" is not automatically a log request.
- "Log an egg roll", "add an egg roll", "record 2 beers", and "I ate an egg roll, log it" are nutrition log_meal actions.
- "How many calories are in an egg roll?" is a nutrition question with action="none".
- Workout creation/editing must route to training, never nutrition, even if the user says "log" colloquially.
- "Create a shoulder workout tomorrow" => training / create / workout_plan / plan_workout.
- "Add lateral raises to tomorrow's shoulder workout" => training / edit / workout_exercise / edit_workout.
- "How should I train shoulders?" => training question with action="none".
- Weight/profile/goal commands must never route to meal logging.
- If a mutation target is genuinely ambiguous, set needs_clarification=true, action="none", and provide one concise clarification question.
- Mutating actions require confirmation unless they are only navigation/view operations.
- Extract only entities explicitly present in the CURRENT message. Use empty strings/null for missing values.
- confidence reflects how sure you are about the semantic classification, not nutrition accuracy.

CURRENT APP SURFACE:
${JSON.stringify(appContext).slice(0, 2000)}
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_ROUTER_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ari_intent_decision",
            strict: true,
            schema: ROUTER_SCHEMA
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Intent router request failed"
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const decision = JSON.parse(content);

    return res.status(200).json({
      routerVersion: "1.0.0",
      decision
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Intent router failed"
    });
  }
}
