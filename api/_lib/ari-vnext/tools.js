// ARI vNext — model-visible application capabilities.
// These functions PROPOSE mutations. The trusted app layer validates and executes them.

export const TOOL_REGISTRY_VERSION = "1.10.0";

export function getAriTools(route = {}) {
  const tools = [];

  if (route?.nutrition) {
    tools.push(functionTool(
      "propose_log_meal",
      "Propose logging food or a meal only when the CURRENT user message explicitly asks to log, add, record, or save it. Do not use for nutrition questions or statements about eating. Estimate nutrition only when needed and clearly mark the estimate source in notes.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: ["number", "null"] },
          unit: { type: "string" },
          servingSize: { type: "string" },
          mealCategory: { type: "string" },
          calories: { type: ["number", "null"] },
          proteinG: { type: ["number", "null"] },
          carbsG: { type: ["number", "null"] },
          fatG: { type: ["number", "null"] },
          notes: { type: "string" }
        },
        required: [
          "name", "quantity", "unit", "servingSize", "mealCategory",
          "calories", "proteinG", "carbsG", "fatG", "notes"
        ]
      }
    ));

    tools.push(functionTool(
      "propose_today_meal_plan",
      "Propose food for ARI XP's TODAY-ONLY Meal Plan when the CURRENT user explicitly asks Ari to make, create, build, plan, or put together a meal plan, a meal for a named slot, or food for the rest of today. This is planned food, not consumed food. Use the saved Daily Calorie Goal, calories already consumed, and active Meal Plan context when the request is budget-based. Never invent a Daily Calorie Goal. If the saved goal is unknown and the user did not give an explicit calorie target, explain that the goal must be set or ask for a target instead of calling this tool. Do not create future dates. Do not replace an already active meal slot unless the user first removes it. Give each selectable component its own nutrition values so partial logging remains possible. Use each meal slot at most once; if several foods belong to the same meal, put them in that meal's items array instead of creating a second meal with the same slot.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          budgetBasis: { type: "string", enum: ["daily_goal", "explicit_user_target", "general"] },
          targetCalories: { type: ["number", "null"] },
          meals: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                mealSlot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                name: { type: "string" },
                calories: { type: "number" },
                proteinG: { type: "number" },
                carbsG: { type: "number" },
                fatG: { type: "number" },
                servingSize: { type: "string" },
                items: {
                  type: "array",
                  minItems: 1,
                  maxItems: 16,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      amount: { type: "string" },
                      calories: { type: "number" },
                      proteinG: { type: "number" },
                      carbsG: { type: "number" },
                      fatG: { type: "number" }
                    },
                    required: ["name", "amount", "calories", "proteinG", "carbsG", "fatG"]
                  }
                },
                notes: { type: "string" }
              },
              required: [
                "mealSlot", "name", "calories", "proteinG", "carbsG", "fatG",
                "servingSize", "items", "notes"
              ]
            }
          }
        },
        required: ["summary", "budgetBasis", "targetCalories", "meals"]
      }
    ));

    tools.push(functionTool(
      "propose_log_planned_meal",
      "Propose logging one meal from TODAY's active Meal Plan only when the CURRENT user explicitly asks Ari to log, record, or save that planned breakfast, lunch, dinner, or snack as eaten. Do not use for a casual statement that food was eaten. The trusted executor will resolve the actual active plan and nutrition; do not invent plan contents.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          mealSlot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] }
        },
        required: ["mealSlot"]
      }
    ));
  }

  if (route?.training) {
    tools.push(functionTool(
      "propose_log_activity",
      "Propose logging a completed manual activity only when the CURRENT user explicitly asks Ari to log, add, record, save, or track something they already did (for example a run, walk, bike ride, hike, sport, push-ups, or an outside workout). If the user gives calories burned, preserve that value. If calories are unknown, leave caloriesBurned null so ARI XP can estimate from the saved Goals/Training profile. Include duration when the user gives it; if both calories and duration are unknown, ask for duration instead of calling the tool.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          activityName: { type: "string" },
          durationMinutes: { type: ["number", "null"] },
          sets: { type: ["number", "null"] },
          repsPerSet: { type: ["number", "null"] },
          caloriesBurned: { type: ["number", "null"] },
          intensity: { type: "string" },
          averageHeartRate: { type: ["number", "null"] },
          dateText: { type: "string" },
          notes: { type: "string" }
        },
        required: [
          "activityName", "durationMinutes", "sets", "repsPerSet",
          "caloriesBurned", "intensity", "averageHeartRate", "dateText", "notes"
        ]
      }
    ));

    tools.push(functionTool(
      "propose_workout_plan",
      "Propose a complete workout plan when the CURRENT user explicitly asks Ari to create, build, make, or plan a workout. Use known training history, current-week overlap, goal, performance and recovery evidence when relevant. Choose recognizable exercise-library names. Give one exact target rep count per exercise rather than a rep range so ARI XP can save the prescription without changing Ari's plan. If the date is not stated, leave dateText empty rather than inventing one.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          focus: { type: "string" },
          dateText: { type: "string" },
          durationMinutes: { type: ["number", "null"] },
          difficulty: { type: "string" },
          warmup: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                sets: { type: ["number", "null"] },
                reps: { type: ["number", "null"] },
                restSeconds: { type: ["number", "null"] },
                notes: { type: "string" }
              },
              required: ["name", "sets", "reps", "restSeconds", "notes"]
            }
          },
          finisher: { type: "string" },
          notes: { type: "string" }
        },
        required: ["focus", "dateText", "durationMinutes", "difficulty", "warmup", "exercises", "finisher", "notes"]
      }
    ));

    tools.push(functionTool(
      "propose_edit_workout",
      "Propose a precise edit to an EXISTING date-specific workout only when the CURRENT user explicitly asks Ari to change it. Supported edits: add an exercise, remove an exercise, replace one exercise with another, move an exercise to a new position, update sets/reps/rest for an exercise, or update the workout title/duration. Preserve everything the user did not ask to change. Never rebuild the whole workout for a small edit. If the date is missing, leave dateText empty rather than guessing.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          dateText: { type: "string" },
          operation: { type: "string", enum: ["add", "remove", "replace", "move", "update"] },
          exercise: { type: "string" },
          replacementExercise: { type: "string" },
          sets: { type: ["number", "null"] },
          reps: { type: ["number", "null"] },
          restSeconds: { type: ["number", "null"] },
          position: { type: ["number", "null"] },
          durationMinutes: { type: ["number", "null"] },
          title: { type: "string" },
          instruction: { type: "string" }
        },
        required: [
          "dateText", "operation", "exercise", "replacementExercise",
          "sets", "reps", "restSeconds", "position", "durationMinutes", "title", "instruction"
        ]
      }
    ));
  }

  if (route?.goals) {
    tools.push(functionTool(
      "propose_log_weight",
      "Propose logging body weight only when the CURRENT user explicitly asks to log, save, record, or update their weight.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "number" },
          unit: { type: "string", enum: ["lb", "kg"] },
          dateText: { type: "string" }
        },
        required: ["value", "unit", "dateText"]
      }
    ));

    if (!route?.teenMode) {
      tools.push(functionTool(
        "propose_update_goal",
        "Propose changing an existing ARI XP goal only when the CURRENT user explicitly asks Ari to update or change it. Choose only one supported goalType. For goal_mode, put the requested lose/gain/maintain wording in instruction and use null for value.",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            goalType: {
              type: "string",
              enum: ["daily_calorie_goal", "target_weight", "weekly_weight_change", "goal_mode"]
            },
            value: { type: ["number", "null"] },
            unit: { type: "string" },
            instruction: { type: "string" }
          },
          required: ["goalType", "value", "unit", "instruction"]
        }
      ));
    }
  }

  // Circle write tools are available only after the server-derived adult Circle
  // entitlement says they are allowed. The social route alone never grants them.
  if (route?.social && route?.circleAllowed === true && route?.teenMode !== true) {
    tools.push(functionTool(
      "propose_create_circle_meetup",
      "Propose hosting a new ARI Circle meetup only when the CURRENT user explicitly asks Ari to host, create, publish, or set up a real-world meetup. Require a clear title/activity, broad area, and future start time. If any of those are missing, ask for the missing detail instead of inventing it. guestSpots excludes the host. Do not expose or request an exact private meeting point in this tool.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          activity: { type: "string", enum: ["walking", "gym", "running", "hiking", "sports", "cycling", "yoga", "coffee", "food", "community", "volunteer", "other"] },
          area: { type: "string" },
          startsAt: { type: "string" },
          durationMinutes: { type: "number" },
          guestSpots: { type: "number" },
          description: { type: "string" },
          joinMode: { type: "string", enum: ["instant", "approval"] }
        },
        required: ["title", "activity", "area", "startsAt", "durationMinutes", "guestSpots", "description", "joinMode"]
      }
    ));

    tools.push(functionTool(
      "propose_join_circle_meetup",
      "Propose joining one specific ARI Circle meetup only when the CURRENT user explicitly asks to join, request a spot, RSVP, or get into that meetup. Use the exact meetup UUID from Action Network context. The trusted server decides whether this becomes an instant join or a host-approval request.",
      {
        type: "object",
        additionalProperties: false,
        properties: { meetupId: { type: "string" } },
        required: ["meetupId"]
      }
    ));

    tools.push(functionTool(
      "propose_leave_circle_meetup",
      "Propose leaving one specific ARI Circle meetup only when the CURRENT user explicitly asks to leave, withdraw, back out, or cancel their own participation/request. Use the exact meetup UUID from Action Network context. The trusted server decides whether to withdraw a pending/waitlisted request or leave an accepted meetup. Do not use this to cancel a meetup the user hosts.",
      {
        type: "object",
        additionalProperties: false,
        properties: { meetupId: { type: "string" } },
        required: ["meetupId"]
      }
    ));

    tools.push(functionTool(
      "propose_cancel_circle_meetup",
      "Propose cancelling an entire hosted ARI Circle meetup only when the CURRENT user explicitly asks to cancel a meetup they host. Use the exact meetup UUID from Action Network context. This affects every participant, so never infer this action from ordinary schedule changes or from a request to leave someone else's meetup.",
      {
        type: "object",
        additionalProperties: false,
        properties: { meetupId: { type: "string" } },
        required: ["meetupId"]
      }
    ));
  }

  if (route?.training || route?.nutrition || route?.goals) {
    tools.push(functionTool(
      "propose_track_experiment",
      "Propose starting/tracking Ari's CURRENT investigator experiment only when the CURRENT user explicitly asks to start, run, track, or try that experiment. Never start an experiment automatically. Use the hypothesisId from the ARI Investigator State; do not invent a new hypothesis.",
      {
        type: "object",
        additionalProperties: false,
        properties: { hypothesisId: { type: "string" } },
        required: ["hypothesisId"]
      }
    ));

    tools.push(functionTool(
      "propose_complete_experiment",
      "Propose completing an ACTIVE Ari experiment only when the CURRENT user explicitly says the experiment is finished, asks to finish it, or clearly reports the tracked experiment's result and wants it recorded. Use the exact active experiment ID from context. Do not silently close an experiment from casual feedback.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          experimentId: { type: "string" },
          outcomeDirection: { type: "string", enum: ["positive", "negative", "mixed", "inconclusive"] },
          summary: { type: "string" },
          confidenceAfter: { type: ["number", "null"] }
        },
        required: ["experimentId", "outcomeDirection", "summary", "confidenceAfter"]
      }
    ));

    tools.push(functionTool(
      "propose_cancel_experiment",
      "Propose cancelling an ACTIVE Ari experiment only when the CURRENT user explicitly asks to stop, abandon, or cancel it. Use the exact active experiment ID from context.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          experimentId: { type: "string" },
          reason: { type: "string" }
        },
        required: ["experimentId", "reason"]
      }
    ));
  }

  return tools;
}

export function validateToolCall(call = {}, route = {}) {
  const available = new Map(getAriTools(route).map((tool) => [tool.name, tool]));
  if (!call?.name || !available.has(call.name)) {
    return { valid: false, error: "tool_not_allowed_for_turn" };
  }

  let args = safeJsonParse(call?.arguments);
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { valid: false, error: "invalid_tool_arguments" };
  }

  args = normalizeToolArguments(call.name, args);
  const semanticValidation = validateSemantics(call.name, args);
  if (!semanticValidation.valid) return semanticValidation;

  return { valid: true, name: call.name, arguments: args };
}

export function toolToApplicationAction(name = "") {
  return ({
    propose_log_meal: "log_meal",
    propose_today_meal_plan: "plan_meal",
    propose_log_planned_meal: "log_planned_meal",
    propose_log_activity: "log_activity",
    propose_workout_plan: "plan_workout",
    propose_edit_workout: "edit_workout",
    propose_log_weight: "log_weight",
    propose_update_goal: "update_goal",
    propose_create_circle_meetup: "create_circle_meetup",
    propose_join_circle_meetup: "join_circle_meetup",
    propose_leave_circle_meetup: "leave_circle_meetup",
    propose_cancel_circle_meetup: "cancel_circle_meetup",
    propose_track_experiment: "track_experiment",
    propose_complete_experiment: "complete_experiment",
    propose_cancel_experiment: "cancel_experiment"
  })[name] || "none";
}

function validateSemantics(name, args) {
  if (name === "propose_log_meal") {
    if (!String(args?.name || "").trim()) return { valid: false, error: "meal_name_required" };
    if (args?.calories !== null && (!Number.isFinite(Number(args.calories)) || Number(args.calories) <= 0 || Number(args.calories) > 10000)) {
      return { valid: false, error: "meal_calories_out_of_range" };
    }
  }

  if (name === "propose_today_meal_plan") {
    const supportedBudgetBasis = new Set(["daily_goal", "explicit_user_target", "general"]);
    if (!supportedBudgetBasis.has(String(args?.budgetBasis || ""))) {
      return { valid: false, error: "meal_plan_budget_basis_required" };
    }
    if (args?.targetCalories !== null && !validNullableRange(args?.targetCalories, 1, 10000)) {
      return { valid: false, error: "meal_plan_target_out_of_range" };
    }

    const meals = Array.isArray(args?.meals) ? args.meals : [];
    if (!meals.length || meals.length > 4) return { valid: false, error: "meal_plan_meals_required" };
    const slots = new Set();
    for (const meal of meals) {
      const slot = String(meal?.mealSlot || "");
      if (!["breakfast", "lunch", "dinner", "snack"].includes(slot)) return { valid: false, error: "meal_plan_slot_invalid" };
      if (slots.has(slot)) return { valid: false, error: "meal_plan_duplicate_slot" };
      slots.add(slot);
      if (!String(meal?.name || "").trim()) return { valid: false, error: "meal_plan_name_required" };
      if (!validNullableRange(meal?.calories, 1, 5000, false)) return { valid: false, error: "meal_plan_calories_out_of_range" };
      if (!validNullableRange(meal?.proteinG, 0, 1000, false)) return { valid: false, error: "meal_plan_protein_out_of_range" };
      if (!validNullableRange(meal?.carbsG, 0, 1500, false)) return { valid: false, error: "meal_plan_carbs_out_of_range" };
      if (!validNullableRange(meal?.fatG, 0, 1000, false)) return { valid: false, error: "meal_plan_fat_out_of_range" };
      const items = Array.isArray(meal?.items) ? meal.items : [];
      if (!items.length || items.length > 16) return { valid: false, error: "meal_plan_items_required" };
      for (const item of items) {
        if (!String(item?.name || "").trim()) return { valid: false, error: "meal_plan_item_name_required" };
        if (!validNullableRange(item?.calories, 0, 5000, false)) return { valid: false, error: "meal_plan_item_calories_out_of_range" };
        if (!validNullableRange(item?.proteinG, 0, 1000, false)) return { valid: false, error: "meal_plan_item_protein_out_of_range" };
        if (!validNullableRange(item?.carbsG, 0, 1500, false)) return { valid: false, error: "meal_plan_item_carbs_out_of_range" };
        if (!validNullableRange(item?.fatG, 0, 1000, false)) return { valid: false, error: "meal_plan_item_fat_out_of_range" };
      }
    }
  }

  if (name === "propose_log_planned_meal") {
    if (!["breakfast", "lunch", "dinner", "snack"].includes(String(args?.mealSlot || ""))) {
      return { valid: false, error: "planned_meal_slot_required" };
    }
  }

  if (name === "propose_log_activity") {
    if (!String(args?.activityName || "").trim()) return { valid: false, error: "activity_name_required" };
    const duration = args?.durationMinutes;
    const calories = args?.caloriesBurned;
    if ((duration === null || duration === undefined || duration === "") && (calories === null || calories === undefined || calories === "")) {
      return { valid: false, error: "activity_duration_or_calories_required" };
    }
    if (!validNullableRange(duration, 1, 1440)) return { valid: false, error: "activity_duration_out_of_range" };
    if (!validNullableRange(args?.sets, 1, 100)) return { valid: false, error: "activity_sets_out_of_range" };
    if (!validNullableRange(args?.repsPerSet, 1, 10000)) return { valid: false, error: "activity_reps_out_of_range" };
    if (!validNullableRange(calories, 1, 10000)) return { valid: false, error: "activity_calories_out_of_range" };
    if (!validNullableRange(args?.averageHeartRate, 30, 240)) return { valid: false, error: "activity_heart_rate_out_of_range" };
  }

  if (name === "propose_workout_plan") {
    if (!String(args?.focus || "").trim()) return { valid: false, error: "workout_focus_required" };
    if (!Array.isArray(args?.exercises) || args.exercises.length === 0 || args.exercises.length > 20) {
      return { valid: false, error: "workout_exercises_required" };
    }
    for (const exercise of args.exercises) {
      if (!String(exercise?.name || "").trim()) return { valid: false, error: "workout_exercise_name_required" };
      if (!validNullableRange(exercise?.sets, 1, 12)) return { valid: false, error: "workout_sets_out_of_range" };
      if (!validNullableRange(exercise?.reps, 1, 100)) return { valid: false, error: "workout_reps_out_of_range" };
      if (!validNullableRange(exercise?.restSeconds, 0, 900)) return { valid: false, error: "workout_rest_out_of_range" };
    }
  }

  if (name === "propose_edit_workout") {
    const operation = String(args?.operation || "");
    const exercise = String(args?.exercise || "").trim();
    const replacement = String(args?.replacementExercise || "").trim();
    if (!String(args?.dateText || "").trim()) return { valid: false, error: "workout_edit_date_required" };
    if (!["add", "remove", "replace", "move", "update"].includes(operation)) return { valid: false, error: "unsupported_workout_edit" };
    if (["remove", "replace", "move"].includes(operation) && !exercise) return { valid: false, error: "workout_edit_target_required" };
    if (operation === "add" && !exercise && !replacement) return { valid: false, error: "workout_edit_add_exercise_required" };
    if (operation === "replace" && !replacement) return { valid: false, error: "workout_edit_replacement_required" };
    if (operation === "move" && !validNullableRange(args?.position, 1, 20, false)) return { valid: false, error: "workout_edit_position_required" };
    if (!validNullableRange(args?.sets, 1, 12)) return { valid: false, error: "workout_edit_sets_out_of_range" };
    if (!validNullableRange(args?.reps, 1, 100)) return { valid: false, error: "workout_edit_reps_out_of_range" };
    if (!validNullableRange(args?.restSeconds, 0, 900)) return { valid: false, error: "workout_edit_rest_out_of_range" };
    if (!validNullableRange(args?.durationMinutes, 10, 240)) return { valid: false, error: "workout_edit_duration_out_of_range" };
    if (operation === "update") {
      const hasExerciseUpdate = Boolean(exercise) && [args?.sets, args?.reps, args?.restSeconds].some((value) => value !== null && value !== undefined);
      const hasWorkoutUpdate = Boolean(String(args?.title || "").trim()) || (args?.durationMinutes !== null && args?.durationMinutes !== undefined);
      if (!hasExerciseUpdate && !hasWorkoutUpdate) return { valid: false, error: "workout_edit_update_fields_required" };
    }
  }

  if (name === "propose_log_weight") {
    const value = Number(args?.value);
    if (!Number.isFinite(value) || value <= 0 || value > 1500) return { valid: false, error: "weight_out_of_range" };
  }

  if (name === "propose_update_goal") {
    const supported = new Set(["daily_calorie_goal", "target_weight", "weekly_weight_change", "goal_mode"]);
    if (!supported.has(String(args?.goalType || ""))) return { valid: false, error: "unsupported_goal_type" };
  }

  if (name === "propose_create_circle_meetup") {
    const activities = new Set(["walking", "gym", "running", "hiking", "sports", "cycling", "yoga", "coffee", "food", "community", "volunteer", "other"]);
    const title = String(args?.title || "").trim();
    const activity = String(args?.activity || "").trim().toLowerCase();
    const area = String(args?.area || "").trim();
    const starts = Date.parse(String(args?.startsAt || ""));
    if (title.length < 3 || title.length > 90) return { valid: false, error: "circle_meetup_title_invalid" };
    if (!activities.has(activity)) return { valid: false, error: "circle_meetup_activity_invalid" };
    if (area.length < 2 || area.length > 100) return { valid: false, error: "circle_meetup_area_invalid" };
    if (!Number.isFinite(starts)) return { valid: false, error: "circle_meetup_start_invalid" };
    if (!validNullableRange(args?.durationMinutes, 30, 480, false)) return { valid: false, error: "circle_meetup_duration_invalid" };
    if (!validNullableRange(args?.guestSpots, 1, 49, false)) return { valid: false, error: "circle_meetup_guest_spots_invalid" };
    if (!["instant", "approval"].includes(String(args?.joinMode || "").toLowerCase())) return { valid: false, error: "circle_meetup_join_mode_invalid" };
    if (String(args?.description || "").length > 500) return { valid: false, error: "circle_meetup_description_too_long" };
  }

  if (["propose_join_circle_meetup", "propose_leave_circle_meetup", "propose_cancel_circle_meetup"].includes(name)) {
    if (!isUuid(args?.meetupId)) return { valid: false, error: "circle_meetup_id_invalid" };
  }

  if (name === "propose_track_experiment") {
    if (!String(args?.hypothesisId || "").trim()) return { valid: false, error: "experiment_hypothesis_required" };
  }

  if (name === "propose_complete_experiment") {
    if (!String(args?.experimentId || "").trim()) return { valid: false, error: "experiment_id_required" };
    if (!["positive", "negative", "mixed", "inconclusive"].includes(String(args?.outcomeDirection || ""))) {
      return { valid: false, error: "experiment_outcome_required" };
    }
    if (!String(args?.summary || "").trim()) return { valid: false, error: "experiment_result_summary_required" };
    if (args?.confidenceAfter !== null && !validNullableRange(args?.confidenceAfter, 0, 0.98)) {
      return { valid: false, error: "experiment_confidence_out_of_range" };
    }
  }

  if (name === "propose_cancel_experiment") {
    if (!String(args?.experimentId || "").trim()) return { valid: false, error: "experiment_id_required" };
  }

  return { valid: true };
}

function normalizeToolArguments(name, args) {
  if (name !== "propose_today_meal_plan" || !Array.isArray(args?.meals)) return args;

  const bySlot = new Map();
  const orderedSlots = [];
  for (const meal of args.meals) {
    const slot = String(meal?.mealSlot || "").trim().toLowerCase();
    if (!slot || !["breakfast", "lunch", "dinner", "snack"].includes(slot)) {
      if (!bySlot.has(slot)) {
        bySlot.set(slot, meal);
        orderedSlots.push(slot);
      }
      continue;
    }
    if (!bySlot.has(slot)) {
      bySlot.set(slot, { ...meal, mealSlot: slot });
      orderedSlots.push(slot);
      continue;
    }
    const current = bySlot.get(slot) || {};
    bySlot.set(slot, mergeSameSlotMeals(current, meal, slot));
  }

  return {
    ...args,
    meals: orderedSlots.map((slot) => bySlot.get(slot)).filter(Boolean).slice(0, 4)
  };
}

function mergeSameSlotMeals(first = {}, second = {}, slot = "") {
  const names = uniqueText([first?.name, second?.name]);
  const servings = uniqueText([first?.servingSize, second?.servingSize]);
  const notes = uniqueText([first?.notes, second?.notes]);
  const items = [
    ...(Array.isArray(first?.items) ? first.items : []),
    ...(Array.isArray(second?.items) ? second.items : [])
  ].slice(0, 16);

  return {
    ...first,
    mealSlot: slot,
    name: names.join(" + ").slice(0, 220) || String(first?.name || second?.name || slot),
    calories: addNumbers(first?.calories, second?.calories),
    proteinG: addNumbers(first?.proteinG, second?.proteinG),
    carbsG: addNumbers(first?.carbsG, second?.carbsG),
    fatG: addNumbers(first?.fatG, second?.fatG),
    servingSize: servings.join(" + ").slice(0, 220),
    items,
    notes: notes.join(" | ").slice(0, 800)
  };
}

function addNumbers(a, b) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return NaN;
  return Number((left + right).toFixed(4));
}

function uniqueText(values = []) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function validNullableRange(value, min, max, allowNull = true) {
  if (value === null || value === undefined || value === "") return allowNull;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function functionTool(name, description, parameters) {
  return { type: "function", name, description, strict: true, parameters };
}

function safeJsonParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}
