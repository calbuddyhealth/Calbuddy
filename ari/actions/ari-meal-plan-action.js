// =====================================================
// ARI XP
// File: ari/actions/ari-meal-plan-action.js
// Version: 1.0.0
// Purpose:
//   Canonical Nutrition Meal Plan + Recipe action layer.
//   Uses the central intent router and requires confirmation before writes.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const SOURCE = "ari_meal_plan_action_v1_central_router";
  const INSTALL_FLAG = "__ariMealPlanActionV1";
  const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];

  const clean = (value = "") => String(value ?? "").trim();
  const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const roundMacro = (value) => Math.round(Math.max(0, numeric(value)) * 10) / 10;

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function parseDateKey(value) {
    const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) return null;
    return date;
  }

  function dateLabel(value) {
    const date = value instanceof Date ? value : parseDateKey(value);
    if (!date) return "that day";
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function resolveRequestedDate(text = "", now = new Date()) {
    const value = clean(text).toLowerCase();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const iso = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return formatDateKey(date);
    }

    if (/\btoday\b/.test(value)) return formatDateKey(base);
    if (/\btomorrow\b/.test(value)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return formatDateKey(date);
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let target = 0; target < weekdays.length; target += 1) {
      const match = value.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;
      let delta = (target - base.getDay() + 7) % 7;
      if (clean(match[1]).toLowerCase() === "next" && delta === 0) delta = 7;
      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return formatDateKey(date);
    }

    return null;
  }

  function normalizeSlot(value = "") {
    const text = clean(value).toLowerCase();
    if (/breakfast|morning meal/.test(text)) return "breakfast";
    if (/lunch|midday/.test(text)) return "lunch";
    if (/dinner|supper|evening meal/.test(text)) return "dinner";
    if (/snack/.test(text)) return "snack";
    return "";
  }

  function slotLabel(slot) {
    return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
  }

  function isPlanDecision(decision = {}) {
    return clean(decision.domain) === "nutrition" &&
      clean(decision.target) === "meal_plan" &&
      clean(decision.action) === "plan_meal" &&
      decision.needs_clarification !== true &&
      Number(decision.confidence || 0) >= 0.8;
  }

  function isRecipeDecision(decision = {}) {
    return clean(decision.domain) === "nutrition" &&
      clean(decision.target) === "recipe" &&
      clean(decision.action) === "create_recipe" &&
      decision.needs_clarification !== true &&
      Number(decision.confidence || 0) >= 0.8;
  }

  function isLogPlannedDecision(decision = {}) {
    return clean(decision.domain) === "nutrition" &&
      clean(decision.target) === "meal_plan" &&
      clean(decision.action) === "log_planned_meal" &&
      decision.needs_clarification !== true &&
      Number(decision.confidence || 0) >= 0.8;
  }

  async function getPlanner() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (window.AriNutritionMealPlanner) return window.AriNutritionMealPlanner;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return null;
  }

  function parseJsonObject(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch {
      return null;
    }
  }

  function findStructuredObject(result, key) {
    const direct = result?.[key] || result?.response?.[key] || result?.data?.[key];
    if (direct && typeof direct === "object") return direct;

    const content =
      result?.choices?.[0]?.message?.content ||
      result?.reply ||
      result?.text ||
      "";

    const parsed = parseJsonObject(content);
    if (parsed?.[key] && typeof parsed[key] === "object") return parsed[key];
    if (parsed && key === "mealPlanProposal" && Array.isArray(parsed.meals)) return parsed;
    if (parsed && key === "recipeProposal" && parsed.name) return parsed;
    return null;
  }

  async function requestStructuredProposal(message, instruction) {
    const response = await fetch("/api/ask-calbuddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: clean(message),
        history: [],
        responseFormat: "json",
        aiInstruction: instruction
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Nutrition planning request failed.");
    return data;
  }

  async function readConsumedMeals(dateKey) {
    const user = await window.CalBuddy?.getCurrentUser?.();
    if (!user?.id || !window.calbuddySupabase) return [];

    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("name, calories, category, protein_g, carbs_g, fat_g, nutrition_date, created_at")
      .eq("user_id", user.id)
      .eq("nutrition_date", dateKey)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[ARI Meal Plan Action] Could not read consumed meals:", error.message);
      return [];
    }

    return Array.isArray(data) ? data : [];
  }

  async function planningContext(dateKey) {
    const planner = await getPlanner();
    const base = planner?.getAriContext?.(dateKey) || {};
    const consumedMeals = await readConsumedMeals(dateKey);
    const consumedFromRows = consumedMeals.reduce((sum, meal) => sum + Math.max(0, numeric(meal.calories)), 0);

    const calorieGoal = Math.max(0, numeric(base.calorieGoal || localStorage.getItem("calbuddyDailyCalorieGoal")));
    const consumedCalories = consumedFromRows || Math.max(0, numeric(base.consumedCalories));
    const plannedCalories = Math.max(0, numeric(base.plannedCalories));

    return {
      ...base,
      date: dateKey,
      calorieGoal,
      consumedCalories,
      plannedCalories,
      remainingCalories: calorieGoal
        ? Math.max(0, calorieGoal - consumedCalories - plannedCalories)
        : null,
      consumedMeals
    };
  }

  function normalizeGeneratedMeal(meal = {}, fallbackDate, fallbackSlot = "") {
    const slot = normalizeSlot(meal.meal_slot || meal.slot || meal.category || fallbackSlot);
    const date = clean(meal.plan_date || meal.date || fallbackDate);
    const calories = numeric(meal.calories, -1);
    const protein = numeric(meal.protein_g, -1);
    const carbs = numeric(meal.carbs_g, -1);
    const fat = numeric(meal.fat_g, -1);

    if (!parseDateKey(date) || !SLOT_ORDER.includes(slot)) return null;
    if (![calories, protein, carbs, fat].every((value) => Number.isFinite(value) && value >= 0)) return null;

    return {
      plan_date: date,
      meal_slot: slot,
      name: clean(meal.name) || `${slotLabel(slot)} Idea`,
      calories: Math.round(calories),
      protein_g: roundMacro(protein),
      carbs_g: roundMacro(carbs),
      fat_g: roundMacro(fat),
      serving_size: clean(meal.serving_size) || "Planned by Ari",
      items: Array.isArray(meal.items) ? meal.items : [],
      notes: clean(meal.notes)
    };
  }

  function normalizeMealPlanProposal(raw = {}, dateKey, requestedSlot = "") {
    const sourceMeals = Array.isArray(raw.meals) ? raw.meals : [];
    const meals = sourceMeals
      .map((meal) => normalizeGeneratedMeal(meal, dateKey, requestedSlot))
      .filter(Boolean);

    if (!meals.length) return null;

    return {
      date: dateKey,
      meals,
      summary: clean(raw.summary),
      total_calories: Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0)),
      protein_g: roundMacro(meals.reduce((sum, meal) => sum + meal.protein_g, 0)),
      carbs_g: roundMacro(meals.reduce((sum, meal) => sum + meal.carbs_g, 0)),
      fat_g: roundMacro(meals.reduce((sum, meal) => sum + meal.fat_g, 0))
    };
  }

  async function buildMealPlanProposal(message, decision) {
    const dateText = clean(decision?.entities?.meal_date_text) || message;
    const dateKey = resolveRequestedDate(dateText) || formatDateKey(new Date());
    const requestedSlot = normalizeSlot(decision?.entities?.meal_category);
    const calorieTarget = numeric(decision?.entities?.calorie_target, 0);
    const context = await planningContext(dateKey);

    const singleTarget = requestedSlot
      ? (calorieTarget > 0
          ? calorieTarget
          : context.remainingCalories
            ? Math.min(context.remainingCalories, Math.max(350, Math.round(context.remainingCalories * .34)))
            : 550)
      : (calorieTarget > 0
          ? calorieTarget
          : context.remainingCalories || context.calorieGoal || 2000);

    const instruction = `
This is an ARI Nutrition MEAL PLAN proposal transaction. Do not claim anything is saved.
Return JSON with one top-level object named mealPlanProposal.
mealPlanProposal must contain: summary (string) and meals (array).
Every meal must contain: plan_date, meal_slot, name, calories, protein_g, carbs_g, fat_g, serving_size, items.
items must be an array of concise food/component objects with name and amount strings.
Allowed meal_slot values: breakfast, lunch, dinner, snack.
Use realistic normal foods and internally consistent calorie/macronutrient estimates.
The requested date is ${dateKey} (${dateLabel(dateKey)}).
${requestedSlot ? `Create ONLY ${requestedSlot}. Target about ${Math.round(singleTarget)} kcal unless the user's current message explicitly says otherwise.` : `Create the remaining day plan across appropriate meal slots. Total newly planned calories should be about ${Math.round(singleTarget)} kcal.`}
Daily calorie goal: ${context.calorieGoal || "unknown"}.
Already consumed calories: ${context.consumedCalories || 0}.
Already planned calories: ${context.plannedCalories || 0}.
Calories still unallocated: ${context.remainingCalories ?? "unknown"}.
Already consumed meals: ${JSON.stringify(context.consumedMeals || []).slice(0, 2500)}.
Already planned meals: ${JSON.stringify(context.plannedMeals || []).slice(0, 2500)}.
Do not recreate a meal slot that is already consumed or already planned unless the current user message explicitly asks to replace it.
Current user message: ${clean(message)}
`.trim();

    const result = await requestStructuredProposal(message, instruction);
    const raw = findStructuredObject(result, "mealPlanProposal");
    const proposal = normalizeMealPlanProposal(raw || {}, dateKey, requestedSlot);
    if (!proposal) throw new Error("Ari could not build a complete meal plan proposal.");
    return { proposal, context, requestedSlot };
  }

  function formatMealPlanReply(proposal) {
    const lines = [proposal.summary || `Here’s a plan for ${dateLabel(proposal.date)}.`];
    proposal.meals.forEach((meal) => {
      lines.push(`\n${slotLabel(meal.meal_slot)} — ${meal.name}`);
      lines.push(`${meal.calories} kcal · ${meal.protein_g}g protein · ${meal.carbs_g}g carbs · ${meal.fat_g}g fat`);
      if (meal.items.length) {
        lines.push(meal.items.slice(0, 6).map((item) => `${clean(item?.name)}${clean(item?.amount) ? ` (${clean(item.amount)})` : ""}`).filter(Boolean).join(" · "));
      }
    });
    return lines.join("\n");
  }

  async function createMealPlanPending(CalBuddy, message, decision) {
    const { proposal } = await buildMealPlanProposal(message, decision);
    const slotText = proposal.meals.length === 1
      ? slotLabel(proposal.meals[0].meal_slot)
      : "day plan";

    const action = await CalBuddy.createPendingAction({
      action_type: "plan_meal",
      payload: {
        meals: proposal.meals,
        plan_date: proposal.date,
        source: SOURCE,
        requested_from_message: clean(message),
        intent_router: decision
      },
      confirmation_text:
        proposal.meals.length === 1
          ? `Add ${proposal.meals[0].name} — about ${proposal.meals[0].calories} kcal — to ${dateLabel(proposal.date)} ${slotText.toLowerCase()}?`
          : `Add this ${proposal.total_calories.toLocaleString()} kcal plan to ${dateLabel(proposal.date)}?`
    });

    return { action, proposal };
  }

  function normalizeRecipe(raw = {}) {
    const calories = numeric(raw.calories_per_serving ?? raw.calories, -1);
    const protein = numeric(raw.protein_g_per_serving ?? raw.protein_g, -1);
    const carbs = numeric(raw.carbs_g_per_serving ?? raw.carbs_g, -1);
    const fat = numeric(raw.fat_g_per_serving ?? raw.fat_g, -1);

    if (!clean(raw.name) || ![calories, protein, carbs, fat].every((value) => value >= 0)) return null;

    return {
      name: clean(raw.name),
      description: clean(raw.description),
      servings: Math.max(1, Math.round(numeric(raw.servings, 4))),
      calories_per_serving: Math.round(calories),
      protein_g_per_serving: roundMacro(protein),
      carbs_g_per_serving: roundMacro(carbs),
      fat_g_per_serving: roundMacro(fat),
      ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
      instructions: Array.isArray(raw.instructions) ? raw.instructions.map((step) => clean(step)).filter(Boolean) : [],
      source_type: "ari"
    };
  }

  async function buildRecipeProposal(message, decision) {
    const requestedServings = Math.max(1, Math.round(numeric(decision?.entities?.servings, 4)));
    const calorieTarget = numeric(decision?.entities?.calorie_target, 0);
    const theme = clean(decision?.entities?.recipe_theme || decision?.entities?.food_description || message);
    const requestedSlot = normalizeSlot(decision?.entities?.meal_category);
    const dateKey = resolveRequestedDate(clean(decision?.entities?.meal_date_text) || message);

    const instruction = `
This is an ARI Nutrition RECIPE proposal. Do not claim anything is saved.
Return JSON with one top-level object named recipeProposal.
recipeProposal must contain: name, description, servings, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fat_g_per_serving, ingredients, instructions.
ingredients must be an array of objects with name and amount strings.
instructions must be an array of concise cooking-step strings.
Make the food genuinely appetizing and practical, not bland diet food.
Requested theme: ${theme}.
Requested servings: ${requestedServings}.
${calorieTarget > 0 ? `Target about ${Math.round(calorieTarget)} calories per serving.` : "Use a reasonable serving size and calorie estimate."}
Current user message: ${clean(message)}
`.trim();

    const result = await requestStructuredProposal(message, instruction);
    const raw = findStructuredObject(result, "recipeProposal");
    const recipe = normalizeRecipe(raw || {});
    if (!recipe) throw new Error("Ari could not build a complete recipe proposal.");

    return {
      recipe,
      schedule: dateKey && requestedSlot ? { date: dateKey, slot: requestedSlot } : null
    };
  }

  function formatRecipeReply(recipe) {
    const lines = [
      recipe.name,
      recipe.description,
      `\n${recipe.calories_per_serving} kcal/serving · ${recipe.protein_g_per_serving}g protein · ${recipe.carbs_g_per_serving}g carbs · ${recipe.fat_g_per_serving}g fat`,
      `Serves ${recipe.servings}`
    ].filter(Boolean);

    if (recipe.ingredients.length) {
      lines.push("\nIngredients");
      recipe.ingredients.slice(0, 14).forEach((item) => {
        lines.push(`• ${clean(item?.amount)} ${clean(item?.name)}`.trim());
      });
    }

    if (recipe.instructions.length) {
      lines.push("\nHow to make it");
      recipe.instructions.slice(0, 10).forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    }

    return lines.join("\n");
  }

  async function createRecipePending(CalBuddy, message, decision) {
    const { recipe, schedule } = await buildRecipeProposal(message, decision);
    const action = await CalBuddy.createPendingAction({
      action_type: "save_recipe",
      payload: {
        recipe,
        schedule,
        source: SOURCE,
        requested_from_message: clean(message),
        intent_router: decision
      },
      confirmation_text: schedule
        ? `Save ${recipe.name} and add 1 serving to ${dateLabel(schedule.date)} ${slotLabel(schedule.slot).toLowerCase()}?`
        : `Save ${recipe.name} to My Recipes?`
    });

    return { action, recipe, schedule };
  }

  async function createLogPlannedPending(CalBuddy, message, decision) {
    const dateKey = resolveRequestedDate(clean(decision?.entities?.meal_date_text) || message) || formatDateKey(new Date());
    const slot = normalizeSlot(decision?.entities?.meal_category || message);

    if (!slot) {
      return {
        action: null,
        reply: "Which planned meal did you eat — breakfast, lunch, dinner, or snack?"
      };
    }

    const planner = await getPlanner();
    if (!planner) {
      return { action: null, reply: "Meal Plan is still loading. Try that again in a moment." };
    }

    await planner.refresh?.();
    const items = planner.findPlannedSlot?.(dateKey, slot) || [];

    if (!items.length) {
      return {
        action: null,
        reply: `You don’t have a planned ${slotLabel(slot).toLowerCase()} for ${dateLabel(dateKey)}.`
      };
    }

    const calories = Math.round(items.reduce((sum, item) => sum + numeric(item.calories), 0));
    const names = items.map((item) => clean(item.name)).filter(Boolean).join(" + ");

    const action = await CalBuddy.createPendingAction({
      action_type: "log_planned_meal",
      payload: {
        plan_date: dateKey,
        meal_slot: slot,
        item_ids: items.map((item) => item.id),
        source: SOURCE,
        requested_from_message: clean(message),
        intent_router: decision
      },
      confirmation_text: `Your planned ${slotLabel(slot).toLowerCase()} is ${names} — about ${calories} kcal. Log it as eaten?`
    });

    return { action, reply: action.confirmation_text };
  }

  async function executePlanMeal(payload = {}) {
    const planner = await getPlanner();
    if (!planner) throw new Error("Meal Plan is unavailable.");
    const meals = Array.isArray(payload.meals) ? payload.meals : [];
    const saved = await planner.addGeneratedMeals(meals);
    if (!saved.length) throw new Error("No planned meals were saved.");
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanRefresh"));
    return {
      success: true,
      saved,
      reply: saved.length === 1
        ? `${saved[0].name} is in your meal plan.`
        : `${saved.length} meals are in your meal plan for ${dateLabel(payload.plan_date)}.`
    };
  }

  async function executeSaveRecipe(payload = {}) {
    const planner = await getPlanner();
    if (!planner) throw new Error("Recipe library is unavailable.");
    const recipe = await planner.saveRecipe(payload.recipe || {});
    let planned = null;
    if (payload.schedule?.date && payload.schedule?.slot) {
      planned = await planner.addRecipeToPlan(recipe, payload.schedule.date, payload.schedule.slot, 1);
    }
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanRefresh"));
    return {
      success: true,
      recipe,
      planned,
      reply: planned
        ? `${recipe.name} is saved and scheduled for ${dateLabel(payload.schedule.date)} ${slotLabel(payload.schedule.slot).toLowerCase()}.`
        : `${recipe.name} is saved in My Recipes.`
    };
  }

  async function executeLogPlanned(payload = {}) {
    const planner = await getPlanner();
    if (!planner) throw new Error("Meal Plan is unavailable.");
    return await planner.logSlotAsEaten(payload.plan_date, payload.meal_slot);
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.createPendingAction || !CalBuddy?.executeAction) return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const originalInternal = CalBuddy._askAriInternal.bind(CalBuddy);
    const previousExecuteAction = CalBuddy.executeAction.bind(CalBuddy);

    CalBuddy.executeAction = async function ariMealPlanExecutor(action = {}) {
      const type = clean(action.action_type || action.type);
      if (type === "plan_meal") return await executePlanMeal(action.payload || {});
      if (type === "save_recipe") return await executeSaveRecipe(action.payload || {});
      if (type === "log_planned_meal") return await executeLogPlanned(action.payload || {});
      return await previousExecuteAction(action);
    };

    CalBuddy._askAriInternal = async function ariMealPlanRouter(args = {}) {
      const message = clean(args.message);
      const decision = args.intentDecision || null;

      if (isPlanDecision(decision)) {
        try {
          const { action, proposal } = await createMealPlanPending(CalBuddy, message, decision);
          return {
            reply: `${formatMealPlanReply(proposal)}\n\n${action.confirmation_text}`,
            pendingAction: action,
            mealPlanProposal: proposal,
            intentDecision: decision,
            emotion: "coach",
            source: SOURCE
          };
        } catch (error) {
          console.warn("ARI meal-plan proposal failed:", error?.message || error);
          return {
            reply: "I couldn’t build a complete meal plan from that request. Try giving me the meal, calorie target, or day you want.",
            pendingAction: null,
            intentDecision: decision,
            emotion: "concerned",
            source: `${SOURCE}_proposal_failed`
          };
        }
      }

      if (isRecipeDecision(decision)) {
        try {
          const { action, recipe } = await createRecipePending(CalBuddy, message, decision);
          return {
            reply: `${formatRecipeReply(recipe)}\n\n${action.confirmation_text}`,
            pendingAction: action,
            recipeProposal: recipe,
            intentDecision: decision,
            emotion: "happy",
            source: SOURCE
          };
        } catch (error) {
          console.warn("ARI recipe proposal failed:", error?.message || error);
          return {
            reply: "I couldn’t finish that recipe. Tell me what kind of meal you want and I’ll try again.",
            pendingAction: null,
            intentDecision: decision,
            emotion: "concerned",
            source: `${SOURCE}_recipe_failed`
          };
        }
      }

      if (isLogPlannedDecision(decision)) {
        const result = await createLogPlannedPending(CalBuddy, message, decision);
        return {
          reply: result.reply || result.action?.confirmation_text || "I couldn’t find that planned meal.",
          pendingAction: result.action || null,
          intentDecision: decision,
          emotion: "coach",
          source: SOURCE
        };
      }

      return await originalInternal(args);
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI MEAL PLAN ACTION INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
