// ari/intent/ari-action-intent-classifier.js
// Purpose: Decide whether the user is conversing, asking, logging, updating app data, or requesting developer work.
// V1.0.0 — Intent Lane Classifier / No App Writes / No Execution

window.Ari = window.Ari || {};

window.Ari.actionIntentClassifier = {
  version: "1.0.0",

  classify(input = {}) {
    const message = this.clean(input.message || input.userMessage || "");
    const lower = message.toLowerCase();
    const context = input.context || input.userContext || {};
    const history = Array.isArray(input.history) ? input.history : [];

    const lane = this.detectLane(lower, context, history);
    const confidence = this.scoreConfidence(lane, lower);

    return {
      classifierRan: true,
      classifierVersion: this.version,
      originalMessage: message,
      lane,
      confidence,
      wantsDataChange: this.wantsDataChange(lane),
      wantsLogging: lane === "explicit_log_request",
      wantsProfileUpdate: lane === "explicit_profile_update",
      wantsGoalUpdate: lane === "explicit_goal_update",
      wantsDeveloperAction: lane === "developer_action",
      target: this.detectTarget(lower, lane),
      reason: this.reasonForLane(lane)
    };
  },

  detectLane(text, context, history) {
    if (!text) return "conversation_only";

    if (this.isDeveloperAction(text)) return "developer_action";

    if (this.isHealthOrSymptomQuestion(text)) return "health_symptom_question";

    if (this.isExplicitLogRequest(text)) return "explicit_log_request";

    if (this.isExplicitGoalUpdate(text)) return "explicit_goal_update";

    if (this.isExplicitProfileUpdate(text)) return "explicit_profile_update";

    if (this.isCalorieEstimateQuestion(text)) return "calorie_estimate_only";

    if (this.isNutritionQuestion(text)) return "nutrition_question";

    if (this.isFoodStatement(text)) return "food_statement";

    return "conversation_only";
  },

  isDeveloperAction(text) {
    return (
      /\b(homepage|layout|design|style|css|index\.html|calbuddy-core|app bridge|github|repo|repository|commit|deploy|vercel|supabase)\b/.test(text) &&
      /\b(change|update|move|remove|add|fix|redesign|build|read|search|edit|replace|commit|deploy)\b/.test(text)
    );
  },

  isHealthOrSymptomQuestion(text) {
    return (
      /\b(diarrhea|diarrhoea|stomach|nausea|vomit|throw up|constipation|heartburn|acid reflux|cramps|pain|sick|allergy|allergic|rash|pregnant|pregnancy|safe|unsafe|poison|food poisoning|bloated|gas|gassy|hurt|symptom)\b/.test(text) ||
      /\b(will|can|could|would|should)\b.{0,40}\b(make me|cause|give me|hurt|affect|safe|bad|sick)\b/.test(text)
    );
  },

  isExplicitLogRequest(text) {
    return (
      /\b(log|add|track|save)\b.{0,40}\b(meal|food|intake|calories|breakfast|lunch|dinner|snack|that|it|this)\b/.test(text) ||
      /\b(can you|please|could you)\b.{0,40}\b(log|add|track|save)\b/.test(text)
    );
  },

  isExplicitGoalUpdate(text) {
    return (
      /\b(set|change|update|make|use)\b.{0,40}\b(calorie goal|daily goal|calories|kcal|goal weight|target weight|weekly goal|lose weight|gain weight|maintain weight|that|this|it)\b/.test(text)
    );
  },

  isExplicitProfileUpdate(text) {
    return (
      /\b(set|change|update|log)\b.{0,40}\b(weight|height|age|sex|gender|activity level|reset time)\b/.test(text) ||
      /\b(i weigh|my weight is|my height is|i am \d{2}|i'm \d{2})\b/.test(text)
    );
  },

  isCalorieEstimateQuestion(text) {
    return (
      /\b(how many calories|how much calories|calorie estimate|estimate calories|calories is that|calories are in)\b/.test(text)
    );
  },

  isNutritionQuestion(text) {
    return (
      /\b(what should|how much should|daily intake|calorie intake|protein|carbs|fat|macros|meal plan|healthy|nutrition)\b/.test(text)
    );
  },

  isFoodStatement(text) {
    return (
      /\b(i ate|i had|i drank|for breakfast|for lunch|for dinner|snack)\b/.test(text)
    );
  },

  wantsDataChange(lane) {
    return [
      "explicit_log_request",
      "explicit_profile_update",
      "explicit_goal_update",
      "developer_action"
    ].includes(lane);
  },

  detectTarget(text, lane) {
    if (lane === "developer_action") return "developer_task";
    if (lane === "explicit_log_request") return "meal_or_activity";
    if (lane === "explicit_goal_update") return "goal";
    if (lane === "explicit_profile_update") return "profile";
    if (lane === "calorie_estimate_only") return "estimate_only";
    if (lane === "health_symptom_question") return "health_conversation";
    return "conversation";
  },

  scoreConfidence(lane, text) {
    if (lane === "conversation_only") return 0.7;
    if (lane === "health_symptom_question") return 0.92;
    if (lane === "developer_action") return 0.88;
    if (lane.startsWith("explicit")) return 0.86;
    if (lane === "calorie_estimate_only") return 0.84;
    if (lane === "food_statement") return 0.68;
    return 0.72;
  },

  reasonForLane(lane) {
    const reasons = {
      conversation_only: "No clear request to change app data.",
      health_symptom_question: "User is asking about symptoms, safety, or health effects, not logging.",
      calorie_estimate_only: "User is asking for a calorie estimate only.",
      nutrition_question: "User is asking for nutrition guidance.",
      food_statement: "User mentioned food but did not ask to log it.",
      explicit_log_request: "User explicitly asked to log/add/track/save something.",
      explicit_goal_update: "User explicitly asked to update a goal.",
      explicit_profile_update: "User explicitly asked to update profile data.",
      developer_action: "Owner/developer request about app files or layout."
    };

    return reasons[lane] || "General classification.";
  },

  clean(value = "") {
    return String(value || "").trim();
  }
};