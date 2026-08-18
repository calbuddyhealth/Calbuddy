// ARI vNext — model-visible application capabilities.
// These functions PROPOSE mutations. The trusted app layer validates and executes them.

export const TOOL_REGISTRY_VERSION = "1.0.0";

export function getAriTools(route = {}) {
  const tools = [];

  if (route?.nutrition) {
    tools.push(functionTool(
      "propose_log_meal",
      "Propose logging food or a meal only when the current user message explicitly asks to log, add, record, or save it. Do not use for nutrition questions or statements about eating.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          quantity: { type: ["number", "null"] },
          unit: { type: "string" },
          mealCategory: { type: "string" }
        },
        required: ["description", "quantity", "unit", "mealCategory"]
      }
    ));
  }

  if (route?.training) {
    tools.push(functionTool(
      "propose_workout_plan",
      "Propose creating a workout plan when the current user explicitly asks Ari to create, build, make, or plan a workout.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          focus: { type: "string" },
          dateText: { type: "string" },
          durationMinutes: { type: ["number", "null"] },
          difficulty: { type: "string" },
          notes: { type: "string" }
        },
        required: ["focus", "dateText", "durationMinutes", "difficulty", "notes"]
      }
    ));

    tools.push(functionTool(
      "propose_edit_workout",
      "Propose editing an existing workout when the current user explicitly asks to add, remove, replace, move, or change exercises or workout details.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          dateText: { type: "string" },
          instruction: { type: "string" },
          exercise: { type: "string" }
        },
        required: ["dateText", "instruction", "exercise"]
      }
    ));
  }

  if (route?.goals) {
    tools.push(functionTool(
      "propose_log_weight",
      "Propose logging body weight only when the current user explicitly asks to log, save, record, or update their weight.",
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
      "Propose changing a user goal only when the current user explicitly asks Ari to update or change it.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          goalType: { type: "string" },
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
