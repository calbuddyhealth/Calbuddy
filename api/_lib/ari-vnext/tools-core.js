// ARI vNext — model-visible application capabilities.
// Nutrition logging now separates language understanding from nutrition truth:
// the model describes foods/portions and supplies a bounded last-resort estimate,
// while the trusted browser resolver chooses canonical evidence and calculates
// the final meal before confirmation. All non-Nutrition capabilities remain in
// the preserved legacy core to minimize unrelated behavioral change.

import {
  TOOL_REGISTRY_VERSION as LEGACY_TOOL_REGISTRY_VERSION,
  getAriTools as getLegacyAriTools,
  validateToolCall as validateLegacyToolCall,
  toolToApplicationAction as legacyToolToApplicationAction
} from "./tools-core-legacy.js";

export const TOOL_REGISTRY_VERSION = "1.12.0";
export const LEGACY_CORE_TOOL_REGISTRY_VERSION = LEGACY_TOOL_REGISTRY_VERSION;

const RESOLVED_MEAL_TOOL = Object.freeze({
  type: "function",
  name: "propose_log_meal",
  description: [
    "Propose logging food or a meal only when the CURRENT user message explicitly asks to log, add, record, or save it.",
    "Do not decide the final nutrition for foods that ARI XP may be able to resolve from personal mappings, verified branded products, or canonical foods.",
    "Instead describe each food as a structured item with the amount the user gave, including raw/cooked state, preparation, and brand only when supported by the user's wording or current context.",
    "For each item also provide a conservative fallback estimate for THAT REQUESTED PORTION. The trusted Nutrition Resolver ignores the estimate whenever stronger evidence resolves the item and uses it only when authoritative resolution fails.",
    "If one missing fact would materially change the result (for example raw versus cooked weight) and no reasonable estimate can be made, ask one concise clarification question instead of calling this tool.",
    "A casual statement such as 'I ate eggs' is not permission to log food."
  ].join(" "),
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      mealCategory: { type: "string" },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 16,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            userPhrase: { type: "string" },
            foodText: { type: "string" },
            brand: { type: "string" },
            state: { type: "string" },
            preparation: { type: "string" },
            quantity: { type: ["number", "null"] },
            unit: { type: "string" },
            servingHint: { type: "string" },
            fallbackCaloriesLow: { type: ["number", "null"] },
            fallbackCaloriesMid: { type: ["number", "null"] },
            fallbackCaloriesHigh: { type: ["number", "null"] },
            fallbackProteinG: { type: ["number", "null"] },
            fallbackCarbsG: { type: ["number", "null"] },
            fallbackFatG: { type: ["number", "null"] },
            fallbackAlcoholG: { type: ["number", "null"] },
            fallbackConfidence: { type: "number", minimum: 0, maximum: 1 },
            fallbackReason: { type: "string" }
          },
          required: [
            "userPhrase", "foodText", "brand", "state", "preparation", "quantity", "unit", "servingHint",
            "fallbackCaloriesLow", "fallbackCaloriesMid", "fallbackCaloriesHigh", "fallbackProteinG", "fallbackCarbsG",
            "fallbackFatG", "fallbackAlcoholG", "fallbackConfidence", "fallbackReason"
          ]
        }
      },
      notes: { type: "string" }
    },
    required: ["name", "mealCategory", "items", "notes"]
  }
});

export function getAriTools(route = {}) {
  const tools = getLegacyAriTools(route);
  if (route?.nutrition !== true) return tools;
  return tools.map((tool) => tool?.name === "propose_log_meal" ? RESOLVED_MEAL_TOOL : tool);
}

export function validateToolCall(call = {}, route = {}) {
  if (String(call?.name || "").trim() !== "propose_log_meal") {
    return validateLegacyToolCall(call, route);
  }

  if (route?.nutrition !== true) return { valid: false, error: "tool_not_allowed_for_turn" };

  const args = safeJsonParse(call?.arguments);
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { valid: false, error: "invalid_tool_arguments" };
  }

  const name = clean(args?.name, 220);
  if (!name) return { valid: false, error: "meal_name_required" };

  const items = Array.isArray(args?.items) ? args.items : [];
  if (!items.length || items.length > 16) return { valid: false, error: "meal_items_required" };

  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { valid: false, error: "meal_item_invalid" };
    }
    if (!clean(item.foodText, 220)) return { valid: false, error: "meal_item_food_required" };
    if (item.quantity !== null && !validRange(item.quantity, 0.01, 100000)) {
      return { valid: false, error: "meal_item_quantity_out_of_range" };
    }
    if (!validRange(item.fallbackConfidence, 0, 1)) {
      return { valid: false, error: "meal_item_fallback_confidence_invalid" };
    }

    const low = nullableNumber(item.fallbackCaloriesLow);
    const mid = nullableNumber(item.fallbackCaloriesMid);
    const high = nullableNumber(item.fallbackCaloriesHigh);
    for (const value of [low, mid, high]) {
      if (value !== null && (value < 0 || value > 10000)) {
        return { valid: false, error: "meal_item_fallback_calories_out_of_range" };
      }
    }
    if (low !== null && mid !== null && low > mid) return { valid: false, error: "meal_item_fallback_range_invalid" };
    if (mid !== null && high !== null && mid > high) return { valid: false, error: "meal_item_fallback_range_invalid" };
    if (low !== null && high !== null && low > high) return { valid: false, error: "meal_item_fallback_range_invalid" };

    const macroFields = ["fallbackProteinG", "fallbackCarbsG", "fallbackFatG", "fallbackAlcoholG"];
    for (const field of macroFields) {
      const value = nullableNumber(item[field]);
      if (value !== null && (value < 0 || value > 3000)) {
        return { valid: false, error: `meal_item_${field}_out_of_range` };
      }
    }
  }

  return {
    valid: true,
    name: "propose_log_meal",
    arguments: {
      name,
      mealCategory: clean(args.mealCategory, 80) || "Meal",
      items: items.map(normalizeItem),
      notes: clean(args.notes, 1200)
    }
  };
}

export function toolToApplicationAction(name = "") {
  return legacyToolToApplicationAction(name);
}

function normalizeItem(item = {}) {
  return {
    userPhrase: clean(item.userPhrase, 260),
    foodText: clean(item.foodText, 220),
    brand: clean(item.brand, 160),
    state: clean(item.state, 80).toLowerCase(),
    preparation: clean(item.preparation, 100).toLowerCase(),
    quantity: item.quantity === null ? null : Number(item.quantity),
    unit: clean(item.unit, 80).toLowerCase(),
    servingHint: clean(item.servingHint, 180),
    fallbackCaloriesLow: nullableNumber(item.fallbackCaloriesLow),
    fallbackCaloriesMid: nullableNumber(item.fallbackCaloriesMid),
    fallbackCaloriesHigh: nullableNumber(item.fallbackCaloriesHigh),
    fallbackProteinG: nullableNumber(item.fallbackProteinG),
    fallbackCarbsG: nullableNumber(item.fallbackCarbsG),
    fallbackFatG: nullableNumber(item.fallbackFatG),
    fallbackAlcoholG: nullableNumber(item.fallbackAlcoholG),
    fallbackConfidence: clamp(Number(item.fallbackConfidence), 0, 1),
    fallbackReason: clean(item.fallbackReason, 500)
  };
}

function clean(value = "", max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeJsonParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}
