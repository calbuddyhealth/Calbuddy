// ARI vNext — trusted reference-bound weight corrections and deletes.
// Uses the signed-in user's canonical weight_logs row identified by log_date.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_weight_adapter";

  function clean(value = "", max = 180) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  async function sessionAndClient() {
    const client = window.calbuddySupabase;
    const session = typeof window.CalBuddy?.getCurrentSession === "function"
      ? await window.CalBuddy.getCurrentSession()
      : (await client?.auth?.getSession?.())?.data?.session || null;
    if (!session?.user?.id || !client) {
      return { success: false, code: "weight_reference_session_required", message: "Weight changes require a signed-in ARI XP session." };
    }
    return { success: true, session, client, userId: session.user.id };
  }

  async function findWeight(logDate = "") {
    const date = clean(logDate, 40);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { success: false, code: "weight_reference_date_invalid", message: "That weigh-in could not be identified safely." };
    }

    const auth = await sessionAndClient();
    if (!auth.success) return auth;

    const { data, error } = await auth.client
      .from("weight_logs")
      .select("weight_lbs, log_date")
      .eq("user_id", auth.userId)
      .eq("log_date", date)
      .maybeSingle();

    if (error) return { success: false, code: "weight_reference_read_failed", message: error.message || "That weigh-in could not be read." };
    if (!data) return { success: false, code: "weight_reference_not_found", message: "That recent weigh-in is no longer available." };
    return { success: true, ...auth, weight: data };
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
    if (typeof window.CalBuddy?.updateProfile === "function") {
      await window.CalBuddy.updateProfile({ weight_lbs: value });
      return;
    }
    try {
      localStorage.setItem("calbuddyCurrentWeight", String(value));
      localStorage.setItem("calbuddyLatestWeight", String(value));
    } catch {}
  }

  async function updateReferencedWeight({ logDate = "", value = null, unit = "lb" } = {}) {
    const resolved = await findWeight(logDate);
    if (!resolved.success) return resolved;

    const numeric = Number(value);
    const normalizedUnit = clean(unit, 12).toLowerCase();
    const pounds = normalizedUnit === "kg" ? numeric * 2.2046226218 : numeric;
    if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 1500) {
      return { success: false, code: "weight_reference_value_invalid", message: "That weight is outside the supported range." };
    }

    const rounded = Math.round(pounds * 10) / 10;
    const { data, error } = await resolved.client
      .from("weight_logs")
      .update({ weight_lbs: rounded })
      .eq("user_id", resolved.userId)
      .eq("log_date", resolved.weight.log_date)
      .select("weight_lbs, log_date")
      .single();

    if (error || !data) {
      return { success: false, code: "weight_reference_update_failed", message: error?.message || "That weigh-in could not be updated." };
    }

    const latest = await latestWeight(resolved.client, resolved.userId);
    if (latest?.log_date === data.log_date) await syncCurrentProfile(latest.weight_lbs);

    window.dispatchEvent(new CustomEvent("calbuddy:weightsChanged", {
      detail: { action: "update", weight: data, source: SOURCE, version: VERSION }
    }));

    return { success: true, weight: data, source: SOURCE };
  }

  async function deleteReferencedWeight({ logDate = "" } = {}) {
    const resolved = await findWeight(logDate);
    if (!resolved.success) return resolved;

    const { error } = await resolved.client
      .from("weight_logs")
      .delete()
      .eq("user_id", resolved.userId)
      .eq("log_date", resolved.weight.log_date);

    if (error) {
      return { success: false, code: "weight_reference_delete_failed", message: error.message || "That weigh-in could not be deleted." };
    }

    const latest = await latestWeight(resolved.client, resolved.userId);
    if (latest?.weight_lbs) await syncCurrentProfile(latest.weight_lbs);

    window.dispatchEvent(new CustomEvent("calbuddy:weightsChanged", {
      detail: { action: "delete", logDate: resolved.weight.log_date, source: SOURCE, version: VERSION }
    }));

    return { success: true, deleted: true, logDate: resolved.weight.log_date, latestWeight: latest, source: SOURCE };
  }

  window.AriVNextWeightAdapter = Object.freeze({
    version: VERSION,
    source: SOURCE,
    ready: true,
    updateReferencedWeight,
    deleteReferencedWeight
  });

  window.dispatchEvent(new CustomEvent("ari:vnextWeightReady", {
    detail: { version: VERSION }
  }));
})();
