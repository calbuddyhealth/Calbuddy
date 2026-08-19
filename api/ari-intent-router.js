import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

// =====================================================
// ARI XP
// File: api/ari-intent-router.js
// Version: 1.2.1
// Purpose:
//   OpenAI semantic intent router for all Ari surfaces.
//   Returns one strict structured decision. It NEVER executes app actions.
// =====================================================

const ROUTER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    domain: { type: "string", enum: ["conversation", "nutrition", "training", "health", "goals", "social", "developer", "navigation", "unknown"] },
    intent: { type: "string", enum: ["conversation", "question", "create", "log", "edit", "delete", "view", "navigate", "update", "clarify"] },
    target: { type: "string", enum: ["none", "meal", "meal_plan", "recipe", "workout_plan", "workout_exercise", "weight", "profile", "calorie_goal", "goal", "social", "developer_task", "page", "unknown"] },
    action: { type: "string", enum: ["none", "log_meal", "plan_meal", "log_planned_meal", "create_recipe", "plan_workout", "edit_workout", "delete_workout", "log_weight", "update_profile", "update_goal", "developer_action", "navigate"] },
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
        meal_date_text: { type: "string" },
        calorie_target: { type: ["number", "null"] },
        recipe_theme: { type: "string" },
        servings: { type: ["number", "null"] },
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
        "food_description", "quantity", "size", "meal_category", "meal_date_text", "calorie_target", "recipe_theme", "servings",
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  const message = String(req.body?.message || "").trim();
  const appContext = req.body?.appContext && typeof req.body.appContext === "object" ? req.body.appContext : {};
  if (!message) return res.status(400).json({ error: "Message is required" });

  const system = `
You are ARI XP's CENTRAL INTENT ROUTER.
Your only job is to interpret the CURRENT user message into the supplied schema.
Do not answer the user. Do not execute anything. Do not claim anything was saved.

CRITICAL RULES:
- Base executable actions on the CURRENT message only. Never infer a data mutation from old conversation history.
- Ordinary questions and statements must use action="none" unless the statement clearly reports food/drink consumption as described below.
- A clear first-person consumption statement such as "I ate an egg roll", "I had chicken and rice", or "I drank two beers" routes to nutrition / log / meal / log_meal. The app will still require confirmation before saving.
- "Log an egg roll", "add an egg roll", "record 2 beers", and "I ate an egg roll, log it" are also nutrition log_meal actions.
- "How many calories are in an egg roll?" is a nutrition question with action="none".
- A request to create food for a FUTURE meal or day using phrases such as "meal plan", "plan my meals", "make me a 500 calorie lunch", or "plan the rest of today" routes to nutrition / create / meal_plan / plan_meal.
- "Make me a 500 calorie lunch" => nutrition / create / meal_plan / plan_meal, meal_category="Lunch", calorie_target=500.
- "Make me a meal plan for today" => nutrition / create / meal_plan / plan_meal, meal_date_text="today".
- If the user refers to a planned slot instead of naming foods, such as "log that I ate today's breakfast" or "I ate my planned lunch", route to nutrition / log / meal_plan / log_planned_meal. Preserve meal_category and meal_date_text.
- Recipe/cooking requests that emphasize a dish, cooking instructions, delicious/tasty food, "recipe", taco night, pasta dinner, salmon dinner, carne asada, etc. route to nutrition / create / recipe / create_recipe unless the user explicitly asks for a meal plan instead.
- If a recipe request explicitly includes a meal slot and day, preserve both so the recipe can be scheduled after confirmation. Example: "Give me a tasty salmon dinner Tuesday" => create_recipe with meal_category="Dinner" and meal_date_text="Tuesday".
- "How do I cook salmon?" can remain a nutrition question with action="none" unless the user asks Ari to create/save a reusable recipe.
- Workout creation/editing must route to training, never nutrition, even if the user says "log" colloquially.
- "Create a shoulder workout tomorrow" => training / create / workout_plan / plan_workout.
- "Add lateral raises to tomorrow's shoulder workout" => training / edit / workout_exercise / edit_workout.
- "How should I train shoulders?" => training question with action="none".
- Weight/profile/goal commands must never route to meal logging.
- If a mutation target is genuinely ambiguous, set needs_clarification=true, action="none", and provide one concise clarification question.
- Mutating actions require confirmation unless they are only navigation/view operations.
- Extract only entities explicitly present in the CURRENT message. Use empty strings/null for missing values.
- meal_category should be Breakfast, Lunch, Dinner, or Snack only when the user explicitly names or clearly implies that slot.
- meal_date_text should preserve words like today, tomorrow, Tuesday, next Monday, or an explicit date when present.
- calorie_target is the calories the user explicitly wants the NEW planned meal/day/recipe to contain, such as "500 calorie lunch" or "dinner around 700 calories"; otherwise null.
- A number described as the user's budget or balance, such as "I have 1,400 calories remaining", "fits within 1,400 calories remaining", or "I have 900 calories left", is NOT by itself calorie_target for one meal. It is context/budget. Leave calorie_target=null unless the user separately tells you how many calories the new meal itself should contain.
- recipe_theme is the requested dish/style/flavor when present; otherwise empty string.
- servings is the requested recipe serving count when explicitly stated; otherwise null.
- confidence reflects how sure you are about the semantic classification, not nutrition accuracy.

CURRENT APP SURFACE:
${JSON.stringify(appContext).slice(0, 2000)}
`.trim();

  try {
    const requestedModel = process.env.OPENAI_ROUTER_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: requestedModel,
        temperature: 0,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "ari_intent_decision", strict: true, schema: ROUTER_SCHEMA }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Intent router request failed" });
    }

    await recordOpenAIUsage({
      userId: appContext?.userId || appContext?.user_id || null,
      endpoint: "/api/ari-intent-router",
      usageType: "router",
      requestCategory: "semantic_intent",
      model: data?.model || requestedModel,
      responseData: data,
      providerRequestId: response.headers.get("x-request-id") || data?.id || null,
      metadata: {
        messageCharacters: message.length,
        surface: String(appContext?.surface || appContext?.page || "unknown").slice(0, 120)
      }
    });

    const content = data?.choices?.[0]?.message?.content || "";
    const decision = JSON.parse(content);

    return res.status(200).json({ routerVersion: "1.2.1", decision });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Intent router failed" });
  }
}
