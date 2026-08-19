// ARI XP Goals — combine completed Training calories + manually/Ari logged activity calories.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  let syncing = false;
  let queued = false;
  let lastCombined = null;

  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function client() {
    return window.calbuddySupabase || window.supabaseClient || null;
  }

  async function user() {
    if (typeof window.getCurrentUser === "function") {
      const current = await window.getCurrentUser();
      if (current?.id) return current;
    }
    const supabase = client();
    const { data } = await supabase?.auth?.getSession?.() || {};
    return data?.session?.user || null;
  }

  function localTrainingCalories(key) {
    let completed = 0;
    try {
      const rows = JSON.parse(localStorage.getItem("ari_training_completed_sessions_v2") || "[]");
      if (Array.isArray(rows)) {
        completed = rows
          .filter((row) => row?.local_date === key && row?.status === "completed")
          .reduce((sum, row) => sum + Math.max(Number(row?.estimated_calories ?? row?.estimatedCalories) || 0, 0), 0);
      }
    } catch {}

    let progress = 0;
    try {
      const raw = JSON.parse(localStorage.getItem("ari_training_workout_progress_v3") || "null");
      const day = raw?.days?.[key] || raw?.[key] || null;
      if (day?.completed === true || day?.status === "complete") {
        progress = Math.max(Number(day?.estimatedCalories ?? day?.estimated_calories) || 0, 0);
      }
    } catch {}

    return Math.round(Math.max(completed, progress));
  }

  async function cloudTrainingCalories(userId, key) {
    const supabase = client();
    if (!supabase?.from || !userId) return 0;
    const { data, error } = await supabase
      .from("ari_workout_sessions")
      .select("estimated_calories")
      .eq("user_id", userId)
      .eq("local_date", key)
      .eq("status", "completed");
    if (error || !Array.isArray(data)) return 0;
    return Math.round(data.reduce((sum, row) => sum + Math.max(Number(row?.estimated_calories) || 0, 0), 0));
  }

  async function otherActivityCalories(userId, key) {
    const supabase = client();
    if (!supabase?.from || !userId) return 0;
    const { data, error } = await supabase
      .from("activity_logs")
      .select("calories_burned")
      .eq("user_id", userId)
      .eq("log_date", key);
    if (error || !Array.isArray(data)) return 0;
    return Math.round(data.reduce((sum, row) => sum + Math.max(Number(row?.calories_burned) || 0, 0), 0));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  function updateLabels(training, other, total) {
    const goalsBurn = document.getElementById("caloriesBurnedText");
    const progressBurn = document.getElementById("progressCaloriesBurned");

    setText("caloriesBurnedText", Math.round(total).toLocaleString());
    setText("progressCaloriesBurned", `${Math.round(total).toLocaleString()} kcal`);

    const progressTile = progressBurn?.closest(".ari-progress-tile");
    const title = progressTile?.querySelector("p");
    const subtitle = progressTile?.querySelector("span");
    if (title) title.textContent = "Calories Burned";
    if (subtitle) subtitle.textContent = other > 0 ? "training + other activity" : "synced from ARI Training";

    const detail = `Training ${Math.round(training)} kcal • Other activity ${Math.round(other)} kcal`;
    if (goalsBurn) {
      goalsBurn.title = detail;
      goalsBurn.setAttribute("aria-label", `${Math.round(total)} calories burned. ${detail}.`);
    }
    if (progressBurn) progressBurn.title = detail;
  }

  async function sync() {
    if (syncing) {
      queued = true;
      return;
    }
    syncing = true;
    try {
      const currentUser = await user();
      if (!currentUser?.id) return;
      const key = dateKey();
      const [cloudTraining, other] = await Promise.all([
        cloudTrainingCalories(currentUser.id, key),
        otherActivityCalories(currentUser.id, key)
      ]);
      const training = Math.max(cloudTraining, localTrainingCalories(key));
      const total = training + other;
      lastCombined = total;
      updateLabels(training, other, total);
      window.dispatchEvent(new CustomEvent("ari:dailyBurnUpdated", {
        detail: { date: key, trainingCalories: training, otherActivityCalories: other, totalCalories: total }
      }));
    } catch (error) {
      console.warn("[ARI Goals Burn Sync] Could not refresh calories burned.", error);
    } finally {
      syncing = false;
      if (queued) {
        queued = false;
        window.setTimeout(() => void sync(), 0);
      }
    }
  }

  function bind() {
    void sync();
    window.addEventListener("focus", () => void sync());
    window.addEventListener("ari:activityLogged", () => void sync());
    window.addEventListener("storage", (event) => {
      if (!event.key || event.key.includes("ari_training") || event.key.includes("calbuddyCaloriesBurned")) void sync();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void sync();
    });

    const target = document.getElementById("caloriesBurnedText");
    if (target) {
      const observer = new MutationObserver(() => {
        const current = Number(String(target.textContent || "").replace(/[^0-9.-]/g, ""));
        if (!syncing && Number.isFinite(current) && current !== lastCombined) {
          window.setTimeout(() => void sync(), 0);
        }
      });
      observer.observe(target, { childList: true, characterData: true, subtree: true });
    }

    window.AriGoalsActivityBurnSync = Object.freeze({ version: VERSION, sync });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
