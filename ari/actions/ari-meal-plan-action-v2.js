// =====================================================
// ARI XP
// File: ari/actions/ari-meal-plan-action-v2.js
// Version: 2.0.0
// Purpose:
//   Canonical today-only Meal Plan action service.
//   Works from Home and Nutrition. The Meal Plan UI is only a viewer/logger.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "2.0.0";
  const SOURCE = "ari_meal_plan_action_v2_today_only";
  const INSTALL_FLAG = "__ariMealPlanActionV2";
  const PLAN_LOCAL_KEY = "ariNutritionMealPlanV1";
  const LOCAL_MEALS_KEY = "calbuddyMeals";
  const RECIPE_LOCAL_KEY = "ariNutritionRecipesV1";
  const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];

  const clean = (value = "") => String(value ?? "").trim();
  const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const roundMacro = (value) => Math.round(Math.max(0, numeric(value)) * 10) / 10;

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function todayLabel() {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(new Date());
  }

  function resolveDateText(text = "", now = new Date()) {
    const value = clean(text).toLowerCase();
    if (!value) return null;

    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const iso = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    if (/\btoday\b/.test(value)) return todayKey();
    if (/\btomorrow\b/.test(value)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let target = 0; target < weekdays.length; target += 1) {
      const match = value.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;
      let delta = (target - base.getDay() + 7) % 7;
      if (clean(match[1]).toLowerCase() === "next" && delta === 0) delta = 7;
      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    return null;
  }

  function normalizeSlot(value = "") {
    const text = clean(value).toLowerCase();
    if (/breakfast|morning/.test(text)) return "breakfast";
    if (/lunch|midday/.test(text)) return "lunch";
    if (/dinner|supper|evening/.test(text)) return "dinner";
    if (/snack/.test(text)) return "snack";
    return "";
  }

  function slotLabel(slot = "") {
    const value = normalizeSlot(slot) || clean(slot).toLowerCase();
    if (value === "breakfast") return "Breakfast";
    if (value === "lunch") return "Lunch";
    if (value === "dinner") return "Dinner";
    if (value === "snack") return "Snack";
    return "Meal";
  }

  function readLocalArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalArray(key, values) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(values) ? values : []));
  }

  function localId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function getUser() {
    try {
      if (typeof window.CalBuddy?.getCurrentUser === "function") {
        return await window.CalBuddy.getCurrentUser();
      }
      if (typeof window.getCurrentUser === "function") {
        return await window.getCurrentUser();
      }
      if (window.calbuddySupabase?.auth?.getUser) {
        const { data } = await window.calbuddySupabase.auth.getUser();
        return data?.user || null;
      }
    } catch (error) {
      console.warn("[ARI Meal Plan V2] User lookup failed:", error?.message || error);
    }
    return null;
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

    const content = result?.choices?.[0]?.message?.content || result?.reply || result?.text || "";
    const parsed = parseJsonObject(content);
    if (parsed?.[key] && typeof parsed[key] === "object") return parsed[key];
    if (key === "mealPlanProposal" && Array.isArray(parsed?.meals)) return parsed;
    if (key === "recipeProposal" && parsed?.name) return parsed;
    return null;
  }

  async function readConsumedMeals() {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("meals")
        .select("name, calories, category, protein_g, carbs_g, fat_g, nutrition_date, created_at")
        .eq("user_id", user.id)
        .eq("nutrition_date", todayKey())
        .order("created_at", { ascending: true });

      if (!error) return Array.isArray(data) ? data : [];
      console.warn("[ARI Meal Plan V2] Consumed meal read failed:", error.message);
    }

    return readLocalArray(LOCAL_MEALS_KEY).filter((meal) => clean(meal.nutrition_date) === todayKey());
  }

  async function readPlannedMeals(slot = "") {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const normalizedSlot = normalizeSlot(slot);

    if (user?.id && client) {
      let query = client
        .from("nutrition_plan_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", todayKey())
        .eq("status", "planned");

      if (normalizedSlot) query = query.eq("meal_slot", normalizedSlot);
      const { data, error } = await query.order("created_at", { ascending: true });
      if (!error) return (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
      console.warn("[ARI Meal Plan V2] Plan read failed:", error.message);
    }

    return readLocalArray(PLAN_LOCAL_KEY)
      .filter((item) => item.plan_date === todayKey() && item.status === "planned" && (!normalizedSlot || normalizeSlot(item.meal_slot) === normalizedSlot))
      .map((item) => ({ ...item, storage_source: "local" }));
  }

  async function planningContext() {
    const [consumedMeals, plannedMeals] = await Promise.all([
      readConsumedMeals(),
      readPlannedMeals()
    ]);

    const calorieGoal = Math.max(0, numeric(localStorage.getItem("calbuddyDailyCalorieGoal")));
    const consumedCalories = consumedMeals.reduce((sum, meal) => sum + Math.max(0, numeric(meal.calories)), 0);
    const plannedCalories = plannedMeals.reduce((sum, meal) => sum + Math.max(0, numeric(meal.calories)), 0);

    return {
      date: todayKey(),
      calorieGoal,
      consumedCalories,
      plannedCalories,
      remainingCalories: calorieGoal ? Math.max(0, calorieGoal - consumedCalories - plannedCalories) : null,
      consumedMeals,
      plannedMeals
    };
  }

  function normalizeComponent(item = {}, index = 0) {
    const name = clean(item.name);
    if (!name) return null;
    const calories = numeric(item.calories, -1);
    const protein = numeric(item.protein_g, -1);
    const carbs = numeric(item.carbs_g, -1);
    const fat = numeric(item.fat_g, -1);
    if (![calories, protein, carbs, fat].every((value) => Number.isFinite(value) && value >= 0)) return null;

    return {
      id: clean(item.id) || `component-${index}`,
      name,
      amount: clean(item.amount || item.serving_size),
      calories: Math.round(calories),
      protein_g: roundMacro(protein),
      carbs_g: roundMacro(carbs),
      fat_g: roundMacro(fat)
    };
  }

  function normalizeGeneratedMeal(meal = {}, fallbackSlot = "") {
    const slot = normalizeSlot(meal.meal_slot || meal.slot || meal.category || fallbackSlot);
    const calories = numeric(meal.calories, -1);
    const protein = numeric(meal.protein_g, -1);
    const carbs = numeric(meal.carbs_g, -1);
    const fat = numeric(meal.fat_g, -1);

    if (!SLOT_ORDER.includes(slot)) return null;
    if (![calories, protein, carbs, fat].every((value) => Number.isFinite(value) && value >= 0)) return null;

    let items = (Array.isArray(meal.items) ? meal.items : [])
      .map(normalizeComponent)
      .filter(Boolean);

    if (!items.length) {
      items = [{
        id: "whole-meal",
        name: clean(meal.name) || `${slotLabel(slot)} meal`,
        amount: clean(meal.serving_size) || "1 planned serving",
        calories: Math.round(calories),
        protein_g: roundMacro(protein),
        carbs_g: roundMacro(carbs),
        fat_g: roundMacro(fat)
      }];
    }

    return {
      plan_date: todayKey(),
      meal_slot: slot,
      name: clean(meal.name) || `${slotLabel(slot)} Idea`,
      calories: Math.round(calories),
      protein_g: roundMacro(protein),
      carbs_g: roundMacro(carbs),
      fat_g: roundMacro(fat),
      serving_size: clean(meal.serving_size) || "Planned by Ari",
      items,
      notes: clean(meal.notes)
    };
  }

  function normalizeMealPlanProposal(raw = {}, requestedSlot = "") {
    const meals = (Array.isArray(raw.meals) ? raw.meals : [])
      .map((meal) => normalizeGeneratedMeal(meal, requestedSlot))
      .filter(Boolean);

    if (!meals.length) return null;
    return {
      date: todayKey(),
      meals,
      summary: clean(raw.summary),
      total_calories: Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0))
    };
  }

  async function buildMealPlanProposal(message, decision) {
    const explicitDateText = clean(decision?.entities?.meal_date_text);
    const requestedDate = explicitDateText ? resolveDateText(explicitDateText) : null;

    if (requestedDate && requestedDate !== todayKey()) {
      return {
        todayOnly: true,
        reply: `Meal Plan is intentionally today-only. Ask me on that day and I can build it then; I won’t schedule food into a future calendar.`
      };
    }

    const requestedSlot = normalizeSlot(decision?.entities?.meal_category);
    const calorieTarget = Math.max(0, numeric(decision?.entities?.calorie_target));
    const context = await planningContext();

    if (requestedSlot) {
      const existing = context.plannedMeals.filter((item) => normalizeSlot(item.meal_slot) === requestedSlot);
      if (existing.length) {
        return {
          conflict: true,
          reply: `You already have ${slotLabel(requestedSlot).toLowerCase()} in today’s Meal Plan. Discard that plan first if you want me to make a different one.`
        };
      }
    }

    const remainingSlots = SLOT_ORDER.filter((slot) => {
      const planned = context.plannedMeals.some((item) => normalizeSlot(item.meal_slot) === slot);
      const consumed = context.consumedMeals.some((meal) => normalizeSlot(meal.category) === slot);
      return !planned && !consumed;
    });

    if (!requestedSlot && !remainingSlots.length) {
      return {
        conflict: true,
        reply: "You already have food logged or planned for all of today’s main meal slots."
      };
    }

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
This is an ARI Nutrition TODAY-ONLY MEAL PLAN proposal. Do not claim anything is saved.
Return JSON with one top-level object named mealPlanProposal.
mealPlanProposal must contain summary (string) and meals (array).
Every meal must contain: meal_slot, name, calories, protein_g, carbs_g, fat_g, serving_size, items.
Every item in items MUST contain: name, amount, calories, protein_g, carbs_g, fat_g.
The item nutrition is required because the user may later log only selected components of the meal.
Allowed meal_slot values: breakfast, lunch, dinner, snack.
All meals are for TODAY (${todayKey()}, ${todayLabel()}). Do not create future dates.
Use realistic, normal foods and internally consistent nutrition estimates.
${requestedSlot
  ? `Create ONLY ${requestedSlot}. Target about ${Math.round(singleTarget)} kcal unless the CURRENT user message gives a different explicit meal calorie target.`
  : `Create only the still-open meal slots from this list: ${remainingSlots.join(", ")}. Total newly planned calories should be about ${Math.round(singleTarget)} kcal.`}
Daily calorie goal: ${context.calorieGoal || "unknown"}.
Already consumed calories today: ${context.consumedCalories}.
Already planned calories today: ${context.plannedCalories}.
Unallocated calories today: ${context.remainingCalories ?? "unknown"}.
Already consumed meals: ${JSON.stringify(context.consumedMeals).slice(0, 2500)}.
Already planned meals: ${JSON.stringify(context.plannedMeals).slice(0, 2500)}.
Do not recreate a slot that is already consumed or planned.
Current user message: ${clean(message)}
`.trim();

    const result = await requestStructuredProposal(message, instruction);
    const raw = findStructuredObject(result, "mealPlanProposal");
    const proposal = normalizeMealPlanProposal(raw || {}, requestedSlot);
    if (!proposal) throw new Error("Ari could not build a complete today meal plan proposal.");
    return { proposal, context, requestedSlot };
  }

  function formatMealPlanReply(proposal) {
    const lines = [proposal.summary || "Here’s a plan for today."];
    proposal.meals.forEach((meal) => {
      lines.push(`\n${slotLabel(meal.meal_slot)} — ${meal.name}`);
      lines.push(`${meal.calories} kcal · ${meal.protein_g}g protein · ${meal.carbs_g}g carbs · ${meal.fat_g}g fat`);
      if (meal.items.length) {
        lines.push(
          meal.items
            .slice(0, 8)
            .map((item) => `${clean(item.name)}${clean(item.amount) ? ` (${clean(item.amount)})` : ""}`)
            .join(" · ")
        );
      }
    });
    return lines.join("\n");
  }

  async function createPlanPending(CalBuddy, message, decision) {
    const built = await buildMealPlanProposal(message, decision);
    if (built.todayOnly || built.conflict) return { action: null, reply: built.reply };

    const { proposal } = built;
    const first = proposal.meals[0];
    const action = await CalBuddy.createPendingAction({
      action_type: "plan_meal",
      payload: {
        meals: proposal.meals,
        plan_date: todayKey(),
        source: SOURCE,
        requested_from_message: clean(message),
        intent_router: decision
      },
      confirmation_text: proposal.meals.length === 1
        ? `Add ${first.name} — about ${first.calories} kcal — to today’s ${slotLabel(first.meal_slot).toLowerCase()} Meal Plan?`
        : `Add this ${proposal.total_calories.toLocaleString()} kcal plan to today’s Meal Plan?`
    });

    return {
      action,
      proposal,
      reply: `${formatMealPlanReply(proposal)}\n\n${action.confirmation_text}`
    };
  }

  async function insertPlanMeal(meal) {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const record = {
      plan_date: todayKey(),
      meal_slot: normalizeSlot(meal.meal_slot),
      name: clean(meal.name) || "Ari meal",
      calories: Math.max(0, Math.round(numeric(meal.calories))),
      protein_g: Math.max(0, roundMacro(meal.protein_g)),
      carbs_g: Math.max(0, roundMacro(meal.carbs_g)),
      fat_g: Math.max(0, roundMacro(meal.fat_g)),
      serving_size: clean(meal.serving_size) || "Planned by Ari",
      multiplier: 1,
      source_type: "ari",
      source_ref: SOURCE,
      items: Array.isArray(meal.items) ? meal.items : [],
      notes: clean(meal.notes),
      status: "planned",
      position: 0,
      updated_at: new Date().toISOString()
    };

    if (!SLOT_ORDER.includes(record.meal_slot)) throw new Error("Ari returned an invalid meal slot.");

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();
      if (!error && data) return { ...data, storage_source: "supabase" };
      console.warn("[ARI Meal Plan V2] Cloud plan save failed; using local fallback:", error?.message || "unknown error");
    }

    const saved = {
      id: localId("plan"),
      ...record,
      created_at: new Date().toISOString(),
      storage_source: "local"
    };
    const local = readLocalArray(PLAN_LOCAL_KEY);
    local.push(saved);
    writeLocalArray(PLAN_LOCAL_KEY, local);
    return saved;
  }

  async function executePlanMeal(payload = {}) {
    if (clean(payload.plan_date) && clean(payload.plan_date) !== todayKey()) {
      throw new Error("Meal Plan only accepts meals for today.");
    }

    const meals = Array.isArray(payload.meals) ? payload.meals : [];
    if (!meals.length) throw new Error("No meal plan was provided.");

    const saved = [];
    for (const meal of meals) {
      const slot = normalizeSlot(meal.meal_slot);
      const existing = await readPlannedMeals(slot);
      if (existing.length) {
        throw new Error(`Today’s ${slotLabel(slot).toLowerCase()} already has an active meal plan.`);
      }
      saved.push(await insertPlanMeal({ ...meal, meal_slot: slot }));
    }

    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: { action: "ari_plan_saved", date: todayKey(), source: SOURCE, version: VERSION }
    }));

    return {
      success: true,
      saved,
      reply: saved.length === 1
        ? `${saved[0].name} is in today’s Meal Plan.`
        : `${saved.length} meals are in today’s Meal Plan.`
    };
  }

  async function insertConsumedMealFromPlan(plan) {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const record = {
      name: clean(plan.name) || "Planned meal",
      calories: Math.max(0, Math.round(numeric(plan.calories))),
      category: slotLabel(plan.meal_slot),
      nutrition_date: todayKey(),
      protein_g: Math.max(0, roundMacro(plan.protein_g)),
      carbs_g: Math.max(0, roundMacro(plan.carbs_g)),
      fat_g: Math.max(0, roundMacro(plan.fat_g)),
      serving_size: clean(plan.serving_size) || "Meal plan",
      multiplier: Math.max(.01, numeric(plan.multiplier, 1) || 1),
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    if (user?.id && client) {
      const { data, error } = await client
        .from("meals")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();
      if (!error && data) return { ...data, source: "supabase" };
      console.warn("[ARI Meal Plan V2] Cloud meal log failed; using local fallback:", error?.message || "unknown error");
    }

    const saved = { id: localId("meal"), ...record, source: "local" };
    const local = readLocalArray(LOCAL_MEALS_KEY);
    local.push(saved);
    writeLocalArray(LOCAL_MEALS_KEY, local);
    return saved;
  }

  async function markPlanEaten(plan, mealId) {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (plan.storage_source === "supabase" && user?.id && client) {
      const { error } = await client
        .from("nutrition_plan_items")
        .update({ status: "eaten", consumed_meal_id: String(mealId || ""), updated_at: new Date().toISOString() })
        .eq("id", plan.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return;
    }

    const local = readLocalArray(PLAN_LOCAL_KEY);
    const index = local.findIndex((item) => String(item.id) === String(plan.id));
    if (index >= 0) {
      local[index] = {
        ...local[index],
        status: "eaten",
        consumed_meal_id: String(mealId || ""),
        updated_at: new Date().toISOString()
      };
      writeLocalArray(PLAN_LOCAL_KEY, local);
    }
  }

  async function createLogPlannedPending(CalBuddy, message, decision) {
    const explicitDate = clean(decision?.entities?.meal_date_text);
    const requestedDate = explicitDate ? resolveDateText(explicitDate) : todayKey();
    if (requestedDate && requestedDate !== todayKey()) {
      return { action: null, reply: "Meal Plan only tracks today, so there isn’t a future planned meal for me to log." };
    }

    const slot = normalizeSlot(decision?.entities?.meal_category || message);
    if (!slot) {
      return { action: null, reply: "Which meal from today’s Meal Plan did you eat — breakfast, lunch, dinner, or snack?" };
    }

    const plans = await readPlannedMeals(slot);
    if (!plans.length) {
      return { action: null, reply: `There is no active ${slotLabel(slot).toLowerCase()} in today’s Meal Plan.` };
    }

    const calories = Math.round(plans.reduce((sum, plan) => sum + numeric(plan.calories), 0));
    const names = plans.map((plan) => clean(plan.name)).filter(Boolean).join(" + ");
    const action = await CalBuddy.createPendingAction({
      action_type: "log_planned_meal",
      payload: {
        meal_slot: slot,
        item_ids: plans.map((plan) => plan.id),
        source: SOURCE,
        requested_from_message: clean(message),
        intent_router: decision
      },
      confirmation_text: `Today’s planned ${slotLabel(slot).toLowerCase()} is ${names} — about ${calories} kcal. Log it as eaten?`
    });

    return { action, reply: action.confirmation_text };
  }

  async function executeLogPlanned(payload = {}) {
    const slot = normalizeSlot(payload.meal_slot);
    if (!slot) throw new Error("The planned meal slot is missing.");

    const plans = await readPlannedMeals(slot);
    if (!plans.length) throw new Error(`There is no active ${slotLabel(slot).toLowerCase()} to log.`);

    const meals = [];
    for (const plan of plans) {
      const meal = await insertConsumedMealFromPlan(plan);
      await markPlanEaten(plan, meal.id);
      meals.push(meal);
    }

    try {
      await window.AriNutritionPage?.refresh?.();
    } catch {}

    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: { action: "ari_plan_eaten", date: todayKey(), source: SOURCE, version: VERSION }
    }));

    return {
      success: true,
      meals,
      reply: plans.length === 1
        ? `${plans[0].name} is logged as eaten.`
        : `Today’s ${slotLabel(slot).toLowerCase()} is logged as eaten.`
    };
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
    const calorieTarget = Math.max(0, numeric(decision?.entities?.calorie_target));
    const theme = clean(decision?.entities?.recipe_theme || decision?.entities?.food_description || message);
    const slot = normalizeSlot(decision?.entities?.meal_category);
    const dateText = clean(decision?.entities?.meal_date_text);
    const date = dateText ? resolveDateText(dateText) : null;

    const instruction = `
This is an ARI Nutrition RECIPE proposal. Do not claim anything is saved.
Return JSON with one top-level object named recipeProposal.
recipeProposal must contain: name, description, servings, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fat_g_per_serving, ingredients, instructions.
ingredients must be an array of objects with name and amount strings.
instructions must be an array of concise cooking-step strings.
Make the food genuinely appetizing and practical.
Requested theme: ${theme}.
Requested servings: ${requestedServings}.
${calorieTarget > 0 ? `Target about ${Math.round(calorieTarget)} calories per serving.` : "Use a reasonable serving size and nutrition estimate."}
Current user message: ${clean(message)}
`.trim();

    const result = await requestStructuredProposal(message, instruction);
    const recipe = normalizeRecipe(findStructuredObject(result, "recipeProposal") || {});
    if (!recipe) throw new Error("Ari could not build a complete recipe proposal.");

    return {
      recipe,
      schedule: date === todayKey() && slot ? { date: todayKey(), slot } : null,
      futureRequested: Boolean(date && date !== todayKey())
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
      recipe.ingredients.slice(0, 14).forEach((item) => lines.push(`• ${clean(item?.amount)} ${clean(item?.name)}`.trim()));
    }

    if (recipe.instructions.length) {
      lines.push("\nHow to make it");
      recipe.instructions.slice(0, 10).forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    }

    return lines.join("\n");
  }

  async function createRecipePending(CalBuddy, message, decision) {
    const { recipe, schedule, futureRequested } = await buildRecipeProposal(message, decision);
    const action = await CalBuddy.createPendingAction({
      action_type: "save_recipe",
      payload: { recipe, schedule, source: SOURCE, requested_from_message: clean(message), intent_router: decision },
      confirmation_text: schedule
        ? `Save ${recipe.name} and add 1 serving to today’s ${slotLabel(schedule.slot).toLowerCase()} Meal Plan?`
        : `Save ${recipe.name} to your recipes?`
    });

    const futureNote = futureRequested
      ? "\n\nMeal Plan is today-only, so I won’t schedule this recipe for a future day."
      : "";

    return {
      action,
      recipe,
      reply: `${formatRecipeReply(recipe)}${futureNote}\n\n${action.confirmation_text}`
    };
  }

  async function saveRecipeRecord(recipe) {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const record = {
      ...recipe,
      source_type: "ari",
      is_favorite: false,
      updated_at: new Date().toISOString()
    };

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_recipes")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();
      if (!error && data) return { ...data, storage_source: "supabase" };
      console.warn("[ARI Meal Plan V2] Recipe cloud save failed; using local fallback:", error?.message || "unknown error");
    }

    const saved = { id: localId("recipe"), ...record, created_at: new Date().toISOString(), storage_source: "local" };
    const local = readLocalArray(RECIPE_LOCAL_KEY);
    local.unshift(saved);
    writeLocalArray(RECIPE_LOCAL_KEY, local);
    return saved;
  }

  async function executeSaveRecipe(payload = {}) {
    const recipe = await saveRecipeRecord(payload.recipe || {});
    let planned = null;

    if (payload.schedule?.date === todayKey() && normalizeSlot(payload.schedule?.slot)) {
      const slot = normalizeSlot(payload.schedule.slot);
      const existing = await readPlannedMeals(slot);
      if (!existing.length) {
        planned = await insertPlanMeal({
          meal_slot: slot,
          name: recipe.name,
          calories: recipe.calories_per_serving,
          protein_g: recipe.protein_g_per_serving,
          carbs_g: recipe.carbs_g_per_serving,
          fat_g: recipe.fat_g_per_serving,
          serving_size: "1 serving",
          items: [],
          notes: "Saved recipe"
        });
      }
    }

    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: { action: "recipe_saved", date: todayKey(), source: SOURCE, version: VERSION }
    }));

    return {
      success: true,
      recipe,
      planned,
      reply: planned
        ? `${recipe.name} is saved and added to today’s ${slotLabel(planned.meal_slot).toLowerCase()} Meal Plan.`
        : `${recipe.name} is saved.`
    };
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.createPendingAction || !CalBuddy?.executeAction) return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const originalInternal = CalBuddy._askAriInternal.bind(CalBuddy);
    const previousExecuteAction = CalBuddy.executeAction.bind(CalBuddy);

    CalBuddy.executeAction = async function ariTodayMealPlanExecutor(action = {}) {
      const type = clean(action.action_type || action.type);
      if (type === "plan_meal") return await executePlanMeal(action.payload || {});
      if (type === "save_recipe") return await executeSaveRecipe(action.payload || {});
      if (type === "log_planned_meal") return await executeLogPlanned(action.payload || {});
      return await previousExecuteAction(action);
    };

    CalBuddy._askAriInternal = async function ariTodayMealPlanRouter(args = {}) {
      const message = clean(args.message);
      const decision = args.intentDecision || null;

      if (isPlanDecision(decision)) {
        try {
          const result = await createPlanPending(CalBuddy, message, decision);
          return {
            reply: result.reply,
            pendingAction: result.action || null,
            mealPlanProposal: result.proposal || null,
            intentDecision: decision,
            emotion: result.action ? "coach" : "idle",
            source: SOURCE
          };
        } catch (error) {
          console.warn("ARI today meal-plan proposal failed:", error?.message || error);
          return {
            reply: "I couldn’t build a complete meal plan from that request. Try telling me what you want for breakfast, lunch, dinner, snack, or the rest of today.",
            pendingAction: null,
            intentDecision: decision,
            emotion: "concerned",
            source: `${SOURCE}_proposal_failed`
          };
        }
      }

      if (isLogPlannedDecision(decision)) {
        const result = await createLogPlannedPending(CalBuddy, message, decision);
        return {
          reply: result.reply,
          pendingAction: result.action || null,
          intentDecision: decision,
          emotion: "coach",
          source: SOURCE
        };
      }

      if (isRecipeDecision(decision)) {
        try {
          const result = await createRecipePending(CalBuddy, message, decision);
          return {
            reply: result.reply,
            pendingAction: result.action,
            recipeProposal: result.recipe,
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

      return await originalInternal(args);
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI TODAY MEAL PLAN ACTION INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
