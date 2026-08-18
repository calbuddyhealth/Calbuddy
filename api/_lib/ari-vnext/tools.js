// ARI vNext — model-visible application capabilities.
// These functions PROPOSE mutations. The trusted app layer validates and executes them.

export const TOOL_REGISTRY_VERSION = "1.2.0";

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
      "propose_workout_plan",
      "Propose a complete workout plan when the CURRENT user explicitly asks Ari to create, build, make, or plan a workout. Use known training context and goals when relevant. If the date is not stated, leave dateText empty rather than inventing one.",
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
                reps: { type: "string" },
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
      "Propose editing an existing workout when the CURRENT user explicitly asks to add, remove, replace, move, or change exercises or workout details. Do not infer a workout edit from nutrition language.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          dateText: { type: "string" },
          operation: { type: "string", enum: ["add", "remove", "replace", "move", "update"] },
          exercise: { type: "string" },
          replacementExercise: { type: "string" },
          instruction: { type: "string" }
        },
        required: ["dateText", "operation", "exercise", "replacementExercise", "instruction"]
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
    propose_workout_plan: "plan_workout",
    propose_edit_workout: "edit_workout",
    propose_log_weight: "log_weight",
    propose_update_goal: "update_goal"
  })[name] || "none";
}

function validateSemantics(name, args) {
  if (name === "propose_log_meal") {
    if (!String(args?.name || "").trim()) return { valid: false, error: "meal_name_required" };
    if (args?.calories !== null && (!Number.isFinite(Number(args.calories)) || Number(args.calories) <= 0 || Number(args.calories) > 10000)) {
      return { valid: false, error: "meal_calories_out_of_range" };
    }
  }

  if (name === "propose_workout_plan") {
    if (!String(args?.focus || "").trim()) return { valid: false, error: "workout_focus_required" };
    if (!Array.isArray(args?.exercises) || args.exercises.length === 0 || args.exercises.length > 20) {
      return { valid: false, error: "workout_exercises_required" };
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

  return { valid: true };
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
