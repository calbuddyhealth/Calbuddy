// ari/intent/ari-action-intent-classifier.js
// Purpose: Decide whether the user is conversing, asking, logging, updating app data, planning a workout, or requesting developer work.
// V1.3.0 — Adds explicit Nutrition vs Training domain separation so editable meal/workout actions cannot cross-route.

window.Ari = window.Ari || {};

window.Ari.actionIntentClassifier = {
  version: "1.3.0",

  classify(input = {}) {
    const message = this.clean(input.message || input.userMessage || "");
    const lower = message.toLowerCase();
    const context = input.context || input.userContext || {};
    const history = Array.isArray(input.history) ? input.history : [];

    const domain = this.detectActionDomain(lower);
    const lane = this.detectLane(lower, context, history, domain);
    const confidence = this.scoreConfidence(lane, lower);

    return {
      classifierRan: true,
      classifierVersion: this.version,
      originalMessage: message,
      domain,
      domainConflict: domain === "conflict",
      lane,
      confidence,
      wantsDataChange: this.wantsDataChange(lane),
      wantsLogging: lane === "explicit_log_request",
      wantsWorkoutPlan: lane === "explicit_workout_plan",
      wantsProfileUpdate: lane === "explicit_profile_update",
      wantsGoalUpdate: lane === "explicit_goal_update",
      wantsDeveloperAction: lane === "developer_action",
      target: this.detectTarget(lower, lane),
      reason: this.reasonForLane(lane)
    };
  },

  detectLane(text, context, history, domain = this.detectActionDomain(text)) {
    if (!text) return "conversation_only";

    if (this.isDeveloperAction(text)) return "developer_action";

    if (this.isHealthOrSymptomQuestion(text)) return "health_symptom_question";

    // If a sentence contains strong meal AND workout write signals, do not guess.
    // Ari should clarify the target instead of mutating either store.
    if (domain === "conflict") return "conversation_only";

    if (domain === "training" && this.isExplicitWorkoutPlanRequest(text)) {
      return "explicit_workout_plan";
    }

    // Profile/weight logging must be resolved before meal logging so phrases such
    // as "log my weight" can never fall into the nutrition lane.
    if (this.isExplicitProfileUpdate(text)) return "explicit_profile_update";

    if (this.isExplicitGoalUpdate(text)) return "explicit_goal_update";

    if (domain === "nutrition" && this.isExplicitMealLogRequest(text)) {
      return "explicit_log_request";
    }

    if (this.isCalorieEstimateQuestion(text)) return "calorie_estimate_only";

    if (this.isNutritionQuestion(text)) return "nutrition_question";

    if (this.isFoodStatement(text)) return "food_statement";

    return "conversation_only";
  },

  detectActionDomain(text = "") {
    const value = String(text || "").toLowerCase();

    const nutritionSignals =
      /\b(meal|food|breakfast|lunch|dinner|snack|ate|eaten|eating|drink|drank|nutrition|macros?|protein|carbs?|carbohydrates?|dietary fat|kcal|calorie intake|calories consumed)\b/.test(value);

    const trainingSignals =
      /\b(workout|training|exercise|lifting|gym|sets?|reps?|chest|back|shoulders?|delts?|legs?|quads?|hamstrings?|glutes?|biceps?|triceps?|core|abs?|cardio|running|mobility)\b/.test(value);

    const mutationVerb =
      /\b(log|add|save|track|record|edit|change|update|replace|remove|delete|swap|create|build|plan|schedule|set up|put together)\b/.test(value);

    if (mutationVerb && nutritionSignals && trainingSignals) return "conflict";
    if (trainingSignals) return "training";
    if (nutritionSignals) return "nutrition";
    return "general";
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

  isExplicitWorkoutPlanRequest(text) {
    // Strong Nutrition context blocks a workout mutation unless the user also
    // explicitly names a workout/training object. This prevents "edit my meal"
    // from leaking into Training because it contains words like add/change.
    const explicitWorkoutObject =
      /\b(workout|training session|training plan|exercise session|gym session|workout plan)\b/.test(text);

    const bodyPartWorkoutPhrase =
      /\b(hitting|training|working)\s+(?:my\s+)?(chest|back|shoulders?|delts?|legs?|quads?|hamstrings?|glutes?|arms?|biceps?|triceps?|core|abs?)\b/.test(text);

    const planningVerb =
      /\b(make|build|create|plan|schedule|set up|put together|give me|add|replace|edit|change|update)\b/.test(text);

    const loggingOnly =
      /\b(log|track|record|completed|finished|burned|calories burned)\b/.test(text);

    return (explicitWorkoutObject || bodyPartWorkoutPhrase) && planningVerb && !loggingOnly;
  },

  isExplicitMealLogRequest(text) {
    const hasWriteVerb = /\b(log|add|track|save|record)\b/.test(text);
    if (!hasWriteVerb) return false;

    // Explicit non-meal targets always win. This is intentionally conservative.
    if (
      /\b(workout|exercise|training|sets?|reps?|weight|body weight|blood pressure|heart rate|steps?|sleep|water|medication|medicine|dose|symptom|mood|note|journal|error|bug|console|github|code|account|sign[- ]?in|login)\b/.test(text)
    ) {
      return false;
    }

    const explicitMealContext =
      /\b(meal|food|intake|breakfast|lunch|dinner|snack|calories|calorie|kcal|macros?|protein|carbs?|carbohydrates?|fat)\b/.test(text);

    const eatingContext =
      /\b(i ate|i had|i drank|just ate|just had|just drank|ate a|ate an|had a|had an)\b/.test(text);

    // Do NOT classify bare "log that / save it" here. The legacy quick-action
    // path has no reliable proof that the pronoun refers to the current meal.
    // Rebirth will resolve those follow-ups against the live conversation instead.
    return explicitMealContext || eatingContext;
  },

  // Backward-compatible alias for older callers.
  isExplicitLogRequest(text) {
    return this.isExplicitMealLogRequest(text);
  },

  isExplicitGoalUpdate(text) {
    return (
      /\b(set|change|update|make|use)\b.{0,40}\b(calorie goal|daily goal|calories|kcal|goal weight|target weight|weekly goal|lose weight|gain weight|maintain weight|that|this|it)\b/.test(text)
    );
  },

  isExplicitProfileUpdate(text) {
    return (
      /\b(set|change|update|log|record)\b.{0,40}\b(weight|height|age|sex|gender|activity level|reset time)\b/.test(text) ||
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
      "explicit_workout_plan",
      "explicit_profile_update",
      "explicit_goal_update",
      "developer_action"
    ].includes(lane);
  },

  detectTarget(text, lane) {
    if (lane === "developer_action") return "developer_task";
    if (lane === "explicit_workout_plan") return "workout_plan";
    if (lane === "explicit_log_request") return "meal";
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
    if (lane === "explicit_workout_plan") return 0.94;
    if (lane === "explicit_log_request") return 0.94;
    if (lane.startsWith("explicit")) return 0.86;
    if (lane === "calorie_estimate_only") return 0.84;
    if (lane === "food_statement") return 0.68;
    return 0.72;
  },

  reasonForLane(lane) {
    const reasons = {
      conversation_only: "No unambiguous request to change one application data domain.",
      health_symptom_question: "User is asking about symptoms, safety, or health effects, not logging.",
      calorie_estimate_only: "User is asking for a calorie estimate only.",
      nutrition_question: "User is asking for nutrition guidance.",
      food_statement: "User mentioned food but did not ask to log it.",
      explicit_log_request: "User explicitly requested a Nutrition meal log/save action.",
      explicit_workout_plan: "User explicitly requested a Training workout create/edit action.",
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