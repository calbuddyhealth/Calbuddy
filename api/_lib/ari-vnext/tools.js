// ARI vNext — model-visible application capabilities.
// These functions PROPOSE mutations. The trusted app layer validates and executes them.

export const TOOL_REGISTRY_VERSION = "1.7.0";

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

    // Teen Ari may discuss goals and log neutral measurements, but the AI does
    // not receive authority to write calorie/target-weight/weight-loss settings.
    // This is deterministic capability removal, not a prompt-only suggestion.
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

  if (route?.training || route?.nutrition || route?.goals) {
    tools.push(functionTool(
      "propose_track_experiment",
      "Propose starting/tracking Ari's CURRENT investigator experiment only when the CURRENT user explicitly asks to start, run, track, or try that experiment. Never start an experiment automatically. Use the hypothesisId from the ARI Investigator State; do not invent a new hypothesis.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          hypothesisId: { type: "string" }
        },
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

  const args = safeJsonParse(call?.arguments);
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { valid: false, error: "invalid_tool_arguments" };
  }

  const semanticValidation = validateSemantics(call.name, args);
  if (!semanticValidation.valid) return semanticValidation;

  return { valid: true, name: call.name, arguments: args };
}

export function toolToApplicationAction(name = "") {
  return ({
    propose_log_meal: "log_meal",
    propose_log_activity: "log_activity",
    propose_workout_plan: "plan_workout",
    propose_edit_workout: "edit_workout",
    propose_log_weight: "log_weight",
    propose_update_goal: "update_goal",
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

function validNullableRange(value, min, max, allowNull = true) {
  if (value === null || value === undefined || value === "") return allowNull;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
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
