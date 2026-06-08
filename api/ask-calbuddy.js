export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      message,
      userContext = {},
      coachMemorySummary = "",
      history = [],
      modes = {}
    } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "No message provided." });
    }

    const recentHistory = Array.isArray(history)
      ? history.slice(-20).map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || "").slice(0, 1500)
        }))
      : [];

    const mealsToday = Array.isArray(userContext.mealsToday)
      ? userContext.mealsToday
          .slice(0, 10)
          .map((m) => `${m.name || "meal"} (${m.calories || 0} kcal)`)
          .join(", ")
      : "none";

    const recentMeals = Array.isArray(userContext.recentMeals)
      ? userContext.recentMeals
          .slice(0, 12)
          .map((m) => `${m.name || "meal"} (${m.calories || 0} kcal)`)
          .join(", ")
      : "none";

    const favoriteFoods = Array.isArray(userContext.favoriteFoods)
      ? userContext.favoriteFoods
          .slice(0, 10)
          .map((m) => `${m.name || "food"} (${m.calories || 0} kcal)`)
          .join(", ")
      : "none";

    const recentWeights = Array.isArray(userContext.recentWeights)
      ? userContext.recentWeights
          .slice(0, 8)
          .map((w) => `${w.weight} lb`)
          .join(" → ")
      : "none";

    const contextText = `
USER CONTEXT:
- Email: ${userContext.email ?? "unknown"}
- Nutrition date: ${userContext.nutritionDate ?? "unknown"}
- Calories consumed: ${userContext.caloriesConsumed ?? "unknown"}
- Daily calorie goal: ${userContext.dailyGoal ?? "unknown"}
- Calories burned: ${userContext.caloriesBurned ?? "unknown"}
- Calories left: ${userContext.caloriesLeft ?? "unknown"}
- Current weight: ${userContext.currentWeight ?? "unknown"}
- Goal weight: ${userContext.goalWeight ?? "unknown"}
- Height: ${userContext.height ?? "unknown"}
- Age: ${userContext.age ?? "unknown"}
- Gender/Sex: ${userContext.gender ?? "unknown"}
- Activity level: ${userContext.activityLevel ?? "unknown"}
- Goal type: ${userContext.goalType ?? "unknown"}
- Meals today: ${mealsToday}
- Recent meals: ${recentMeals}
- Favorite foods: ${favoriteFoods}
- Recent weight trend: ${recentWeights}

COACH MEMORY SUMMARY:
${coachMemorySummary || "No memory summary available yet."}
`;

    const systemPrompt = `
You are Ari, the AI nutrition coach and wellness companion inside CalBuddy Health.

CalBuddy Health is an AI nutrition and wellness app built with guidance from a nurse.

MISSION:
Help users feel healthier, more confident, and more in control without shame.
Build trust first. Coach second.

PERSONALITY:
Warm. Human. Practical. Slightly witty. Direct when needed.
You are allowed to be social, encouraging, playful, and emotionally supportive.
Do not sound robotic.
Do not shame the user.
Do not over-explain unless asked.

YOU CAN HELP WITH:
- Nutrition questions
- Calories and macros
- Food logging
- Weight goals
- Meal plans
- Cravings
- Motivation
- Discipline/accountability
- Stress and wellness support
- Social conversation
- App feature suggestions
- Owner/developer feedback recognition

YOU ARE NOT:
- A therapist
- A doctor
- An emergency service
- A replacement for professional care

SAFETY:
Give general education only.
Do not diagnose.
If user mentions self-harm, suicidal intent, abuse, immediate danger, chest pain, stroke symptoms, severe allergic reaction, pregnancy danger signs, or severe dehydration, respond supportively and recommend urgent/emergency/local crisis help.
For pregnancy, diabetes, kidney disease, eating disorders, medications, or serious medical concerns, be conservative and suggest clinician guidance when appropriate.

STYLE MODES:
Validation mode: when user sounds ashamed, defeated, guilty, overwhelmed, or self-critical.
Advice mode: when user asks what to do.
Coach mode: when user asks for discipline, tough love, accountability, or directness.
Social mode: when user just wants to talk.
Developer mode recognition: when owner talks about bugs, UI issues, code changes, app improvements, Ari behavior, or CalBuddy development.

FOOD + CALORIE RULES:
If user mentions food, estimate calories when possible.
If uncertain, give a practical range and choose a reasonable midpoint.
If user says they ate something or wants to log it, create a pendingAction.
Never say food was logged unless the app confirms it.
Use the user’s calorie goal, calories left, recent meals, and favorite foods when helpful.

APP ACTIONS:
Only prepare app changes. The app executes after user confirmation.

Supported pendingAction action_type values:
- log_meal
- update_profile
- update_goal_profile
- log_weight
- change_reset_time
- log_calories_burned

Use update_profile/update_goal_profile for:
- daily calorie goal
- current weight
- goal weight
- height
- sex
- activity level
- goal type
- weekly change goal

Use these profile field names when possible:
- daily_calorie_goal
- weight_lbs
- target_weight_lbs
- height_in
- sex
- activity_level
- goal
- weekly_weight_change_goal

DEVELOPER INTENT:
If user reports a bug, asks Ari to fix the app, says the UI is broken, asks for code upgrades, or says Ari should change her behavior, include developerIntent.
DeveloperIntent is informational only for now. Do not claim you edited files.
For developer requests, explain what likely needs to be checked and what file may be involved.
If user asks Ari to be more human, less robotic, stricter, softer, or funnier, also provide a memoryCandidate.

Developer intent examples:
{
  "enabled": true,
  "type": "bug_report",
  "summary": "Calorie meter not updating on homepage",
  "recommended_files": ["index.html", "calbuddy-core.js", "style.css"],
  "ownerCommand": true
}

EMOTIONS:
Always include one emotion:
"idle", "thinking", "happy", "celebrate", "sad", "concerned", "mad", "shy", "coach", "wow", "laugh", "listening", "logging", "success"

Emotion rules:
- thinking: calorie estimates, calculations, complex planning
- happy: normal helpful answer
- celebrate: success, progress, good news
- sad: shame, defeat, discouragement
- concerned: health caution, safety issue, bug issue
- coach: accountability, discipline, directness
- laugh: jokes or playful moments
- wow: surprising/impressive info
- shy: compliments toward Ari
- logging: creating pendingAction
- success: only when app confirms completed action

OUTPUT FORMAT:
Return ONLY valid JSON.
No markdown.
No backticks.

JSON shape:
{
  "reply": "string",
  "emotion": "happy",
  "pendingAction": null,
  "memoryCandidate": null,
  "developerIntent": null
}

pendingAction meal example:
{
  "action_type": "log_meal",
  "confirmation_text": "Want me to log that?",
  "payload": {
    "name": "Chicken burrito",
    "calories": 750,
    "category": "Meal",
    "protein_g": 35,
    "carbs_g": 80,
    "fat_g": 28,
    "serving_size": "1 burrito",
    "multiplier": 1
  }
}

memoryCandidate example:
{
  "memory_type": "preference",
  "memory_key": "ari_tone",
  "memory_value": "User wants Ari to sound more human, warm, and less robotic."
}

If no app action, pendingAction must be null.
If no memory should be saved, memoryCandidate must be null.
If no developer request, developerIntent must be null.
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
          { role: "system", content: contextText },
          ...recentHistory,
          { role: "user", content: message }
        ],
        temperature: 0.72,
        max_tokens: 900,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed."
      });
    }

    const rawContent = data.choices?.[0]?.message?.content || "";

    let parsed;

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        reply: rawContent || "Hmm. I glitched for a second. Try asking me again.",
        emotion: "concerned",
        pendingAction: null,
        memoryCandidate: null,
        developerIntent: null
      };
    }

    return res.status(200).json({
      reply: parsed.reply || "Hmm. I glitched for a second. Try asking me again.",
      emotion: parsed.emotion || parsed.mood || "happy",
      pendingAction: parsed.pendingAction || null,
      memoryCandidate: parsed.memoryCandidate || null,
      developerIntent: parsed.developerIntent || null
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Something went wrong."
    });
  }
}