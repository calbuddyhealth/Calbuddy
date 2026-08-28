// ARI XP — canonical Goals/Profile domain service.
// Owns normalized profile/goal persistence while CalBuddy compatibility methods
// remain available during the migration.

export const GoalsProfileService = Object.freeze({
  normalize(updates = {}) {
    const normalized = { ...updates };
    if (normalized.current_weight && !normalized.weight_lbs) normalized.weight_lbs = normalized.current_weight;
    if (normalized.weight_lbs && !normalized.current_weight) normalized.current_weight = normalized.weight_lbs;
    if (normalized.goal_weight && !normalized.target_weight_lbs) normalized.target_weight_lbs = normalized.goal_weight;
    if (normalized.target_weight_lbs && !normalized.goal_weight) normalized.goal_weight = normalized.target_weight_lbs;
    if (normalized.targetWeight && !normalized.target_weight_lbs) normalized.target_weight_lbs = normalized.targetWeight;
    if (normalized.gender && !normalized.sex) normalized.sex = normalized.gender;
    if (normalized.sex && !normalized.gender) normalized.gender = normalized.sex;
    if (normalized.height && !normalized.height_in) normalized.height_in = normalized.height;
    if (normalized.height_in && !normalized.height) normalized.height = normalized.height_in;
    if (normalized.activityLevel && !normalized.activity_level) normalized.activity_level = normalized.activityLevel;
    if (normalized.activity_level && !normalized.activityLevel) normalized.activityLevel = normalized.activity_level;
    if (normalized.goalType && !normalized.goal) normalized.goal = normalized.goalType;
    if (normalized.goal && !normalized.goalType) normalized.goalType = normalized.goal;
    if (normalized.weeklyChange && !normalized.weekly_weight_change_goal) normalized.weekly_weight_change_goal = normalized.weeklyChange;
    if (normalized.calorieGoal && !normalized.daily_calorie_goal) normalized.daily_calorie_goal = normalized.calorieGoal;
    return normalized;
  },

  updateLocalGoals(updates = {}) {
    const goals = JSON.parse(localStorage.getItem("calbuddyGoals") || "{}");
    if (updates.name !== undefined) goals.name = updates.name;
    if (updates.age !== undefined) goals.age = updates.age;
    if (updates.sex !== undefined) goals.sex = updates.sex;
    if (updates.weight_lbs !== undefined) goals.weight = updates.weight_lbs;
    if (updates.height_in !== undefined) goals.height = updates.height_in;
    if (updates.activity_level !== undefined) goals.activity = updates.activity_level;
    if (updates.goal !== undefined) goals.goalMode = updates.goal;
    if (updates.target_weight_lbs !== undefined) goals.targetWeight = updates.target_weight_lbs;
    if (updates.weekly_weight_change_goal !== undefined) goals.weeklyChange = updates.weekly_weight_change_goal;
    if (updates.daily_calorie_goal !== undefined) goals.calorieGoal = updates.daily_calorie_goal;
    localStorage.setItem("calbuddyGoals", JSON.stringify(goals));
    return goals;
  },

  async updateProfile(updates = {}, options = {}) {
    const CalBuddy = window.CalBuddy || {};
    const normalized = this.normalize(updates);
    const user = await CalBuddy.getCurrentUser?.();

    Object.entries(normalized).forEach(([key, value]) => {
      if (value !== undefined && value !== null) localStorage.setItem(`calbuddy_${key}`, value);
    });
    if (normalized.daily_calorie_goal) localStorage.setItem("calbuddyDailyCalorieGoal", normalized.daily_calorie_goal);
    if (normalized.weight_lbs) {
      localStorage.setItem("calbuddyCurrentWeight", normalized.weight_lbs);
      localStorage.setItem("calbuddyLatestWeight", normalized.weight_lbs);
    }
    if (normalized.target_weight_lbs) localStorage.setItem("calbuddyGoalWeight", normalized.target_weight_lbs);
    this.updateLocalGoals(normalized);

    if (user && window.calbuddySupabase) {
      const profile = {
        id: user.id,
        email: user.email || null,
        updated_at: new Date().toISOString()
      };
      [
        "name", "age", "sex", "weight_lbs", "height_in", "activity_level", "goal",
        "target_weight_lbs", "weekly_weight_change_goal", "daily_calorie_goal",
        "reset_hour", "reset_minute", "reset_ampm"
      ].forEach((key) => {
        if (normalized[key] !== undefined && normalized[key] !== null) profile[key] = normalized[key];
      });
      const { error } = await window.calbuddySupabase.from("profiles").upsert(profile, { onConflict: "id" });
      if (error) throw error;
    }

    if (options.refresh !== false) await CalBuddy.refreshDashboard?.();
    return normalized;
  }
});

export default GoalsProfileService;
