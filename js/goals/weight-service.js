// ARI XP — canonical Weight domain service.

import GoalsProfileService from "./profile-service.js";

const SOURCE = "weight_service";
const VERSION = "1.1.0";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clean(value = "", max = 180) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function userAndClient() {
  const CalBuddy = window.CalBuddy || {};
  const user = await CalBuddy.getCurrentUser?.();
  const client = window.calbuddySupabase;
  if (!user?.id || !client) throw new Error("Weight changes require a signed-in ARI XP session.");
  return { user, client };
}

async function latestWeight(client, userId) {
  const { data, error } = await client
    .from("weight_logs")
    .select("weight_lbs, log_date")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

async function syncCurrentProfile(weightLbs) {
  const value = Number(weightLbs);
  if (!Number.isFinite(value) || value <= 0) return;
  localStorage.setItem("calbuddyCurrentWeight", String(value));
  localStorage.setItem("calbuddyLatestWeight", String(value));
  await GoalsProfileService.updateProfile({ weight_lbs: value });
}

async function findWeight(logDate = "") {
  const date = clean(logDate, 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("That weigh-in could not be identified safely.");
  const { user, client } = await userAndClient();
  const { data, error } = await client
    .from("weight_logs")
    .select("weight_lbs, log_date")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw new Error(error.message || "That weigh-in could not be read.");
  if (!data) throw new Error("That recent weigh-in is no longer available.");
  return { user, client, weight: data };
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
  },

  async updateWeight({ logDate = "", value = null, unit = "lb" } = {}) {
    const resolved = await findWeight(logDate);
    const numeric = Number(value);
    const pounds = clean(unit, 12).toLowerCase() === "kg" ? numeric * 2.2046226218 : numeric;
    if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 1500) throw new Error("That weight is outside the supported range.");
    const rounded = Math.round(pounds * 10) / 10;
    const { data, error } = await resolved.client
      .from("weight_logs")
      .update({ weight_lbs: rounded })
      .eq("user_id", resolved.user.id)
      .eq("log_date", resolved.weight.log_date)
      .select("weight_lbs, log_date")
      .single();
    if (error || !data) throw new Error(error?.message || "That weigh-in could not be updated.");
    const latest = await latestWeight(resolved.client, resolved.user.id);
    if (latest?.log_date === data.log_date) await syncCurrentProfile(latest.weight_lbs);
    window.dispatchEvent?.(new CustomEvent("calbuddy:weightsChanged", { detail: { action: "update", weight: data, source: SOURCE, version: VERSION } }));
    return { success: true, weight: data };
  },

  async deleteWeight({ logDate = "" } = {}) {
    const resolved = await findWeight(logDate);
    const { error } = await resolved.client
      .from("weight_logs")
      .delete()
      .eq("user_id", resolved.user.id)
      .eq("log_date", resolved.weight.log_date);
    if (error) throw new Error(error.message || "That weigh-in could not be deleted.");
    const latest = await latestWeight(resolved.client, resolved.user.id);
    if (latest?.weight_lbs) await syncCurrentProfile(latest.weight_lbs);
    window.dispatchEvent?.(new CustomEvent("calbuddy:weightsChanged", { detail: { action: "delete", logDate: resolved.weight.log_date, source: SOURCE, version: VERSION } }));
    return { success: true, deleted: true, logDate: resolved.weight.log_date, latestWeight: latest };
  }
});

export default WeightService;
