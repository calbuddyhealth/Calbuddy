// ARI XP — canonical Weight domain service.

import GoalsProfileService from "./profile-service.js";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const WeightService = Object.freeze({
  async logWeight({ weight, notes = "" } = {}) {
    const CalBuddy = window.CalBuddy || {};
    const user = await CalBuddy.getCurrentUser?.();
    const numericWeight = safeNumber(weight, 0);
    if (numericWeight <= 0) throw new Error("Valid weight is required.");

    const entry = {
      weight: numericWeight,
      weight_lbs: numericWeight,
      notes: String(notes || "").trim(),
      log_date: formatLocalDate(new Date()),
      created_at: new Date().toISOString()
    };

    localStorage.setItem("calbuddyCurrentWeight", String(numericWeight));
    localStorage.setItem("calbuddyLatestWeight", String(numericWeight));

    if (user && window.calbuddySupabase) {
      const { error } = await window.calbuddySupabase
        .from("weight_logs")
        .upsert(
          { user_id: user.id, weight_lbs: numericWeight, log_date: entry.log_date },
          { onConflict: "user_id,log_date" }
        );
      if (error) throw new Error(error.message || "Could not save weight.");
    }

    await GoalsProfileService.updateProfile({ weight_lbs: numericWeight });
    return entry;
  },

  async listRecent(limit = 8) {
    const CalBuddy = window.CalBuddy || {};
    const user = await CalBuddy.getCurrentUser?.();
    if (!user || !window.calbuddySupabase) return [];

    const { data, error } = await window.calbuddySupabase
      .from("weight_logs")
      .select("weight_lbs, log_date")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []).map((entry) => ({ ...entry, weight: Number(entry.weight_lbs || 0) }));
  }
});

export default WeightService;
