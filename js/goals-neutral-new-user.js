// =====================================================
// ARI XP
// File: js/goals-neutral-new-user.js
// Version: 1.2.0
// Purpose:
//   Prevent accounts from seeing legacy developer/template health values on
//   My Goals. Supabase is authoritative for authenticated health-profile data.
//
// V1.2.0:
//   - Clears each legacy fallback when that specific cloud field is blank.
//   - Treats a profile as configured only when its real health baseline exists.
//   - Ignores historical database-only goal/calorie defaults.
//   - Clears device health caches for an authenticated blank profile so one
//     account can never inherit another account's local health information.
// =====================================================

(() => {
  "use strict";

  const LEGACY_LOCAL_KEYS = [
    "calbuddyGoals",
    "calbuddyDailyCalorieGoal",
    "calbuddyDailyCalorieGoalMode",
    "calbuddyCurrentWeight",
    "calbuddyAge",
    "calbuddyRestingHeartRate",
    "calbuddyEstimatedMaxHeartRate",
    "calbuddyConfirmedMaxHeartRate",
    "calbuddyMaxHeartRateMode",
    "calbuddyMacroNutritionStrategy",
    "calbuddyDailyNutritionTargets"
  ];

  const BASELINE_FIELDS = [
    "age",
    "sex",
    "weight_lbs",
    "height_in",
    "activity_level"
  ];

  const CLOUD_TO_UI_FIELDS = Object.freeze({
    age: "age",
    sex: "sex",
    weight_lbs: "weight",
    height_in: "height",
    activity_level: "activity",
    goal: "goalMode",
    target_weight_lbs: "targetWeight",
    daily_calorie_goal: "dailyCalorieGoalInput"
  });

  const isPresent = value =>
    value !== null && value !== undefined && String(value).trim() !== "";

  function profileIsConfigured(profile = {}) {
    return BASELINE_FIELDS.every(key => isPresent(profile?.[key]));
  }

  function clearInput(id) {
    const element = document.getElementById(id);
    if (!element) return;

    if (element.tagName === "SELECT") {
      element.value = "";
      if (element.value !== "") element.selectedIndex = -1;
      return;
    }

    element.value = "";
  }

  function clearMissingCloudFields(profile = {}) {
    for (const [cloudField, inputId] of Object.entries(CLOUD_TO_UI_FIELDS)) {
      if (!isPresent(profile?.[cloudField])) {
        clearInput(inputId);
      }
    }

    const maxHr = document.getElementById("estimatedMaxHeartRate");
    if (!isPresent(profile?.age) && maxHr?.dataset.mode !== "custom") {
      maxHr.value = "";
      maxHr.dataset.mode = "auto";
    }

    if (!isPresent(profile?.daily_calorie_goal)) {
      const dailyGoal = document.getElementById("dailyCalorieGoalInput");
      if (dailyGoal) dailyGoal.dataset.mode = "auto";
    }

    if (!isPresent(profile?.goal)) {
      const weeklyGroup = document.getElementById("weeklyChangeGroup");
      if (weeklyGroup) weeklyGroup.style.display = "none";
    }
  }

  function resetNeutralUiLabels() {
    const heightConversion = document.getElementById("heightConversion");
    if (!document.getElementById("height")?.value && heightConversion) {
      heightConversion.textContent = "Equivalent: —";
    }

    const maxHrSource = document.getElementById("maxHeartRateSource");
    if (maxHrSource) maxHrSource.textContent = "AUTO";

    const modeChip = document.getElementById("dailyCalorieGoalModeChip");
    if (modeChip && !document.getElementById("dailyCalorieGoalInput")?.value) {
      modeChip.textContent = "AUTO ESTIMATE";
    }
  }

  function clearCrossAccountHealthCaches() {
    LEGACY_LOCAL_KEYS.forEach(key => localStorage.removeItem(key));
  }

  function applyAuthoritativeProfile(profile = {}) {
    const configured = profileIsConfigured(profile);

    clearMissingCloudFields(profile);

    if (!configured) {
      clearCrossAccountHealthCaches();
    }

    resetNeutralUiLabels();

    try {
      if (typeof window.calculateGoals === "function") {
        window.calculateGoals();
      }
    } catch (error) {
      console.warn("Neutral Goals recalculation skipped:", error?.message || error);
    }

    document.documentElement.dataset.ariGoalsNeutralized = configured
      ? "missing-fields"
      : "new-user";
  }

  async function fetchOwnProfile() {
    if (!window.calbuddySupabase) return null;

    const { data: sessionData } = await window.calbuddySupabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return null;

    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("age,sex,weight_lbs,height_in,activity_level,goal,target_weight_lbs,daily_calorie_goal")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not verify Goals profile:", error.message);
      return null;
    }

    return data || {};
  }

  async function runOnceHydrated() {
    const page = String(window.location.pathname || "").split("/").pop().toLowerCase();
    if (page !== "goals.html") return;

    // Wait until goals.js has applied its persisted/default state. The
    // daily-goal mode is assigned during applyGoals(), so this avoids racing
    // the page's own asynchronous Supabase hydration.
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const dailyGoal = document.getElementById("dailyCalorieGoalInput");
      if (dailyGoal?.dataset?.mode) break;
      await new Promise(resolve => window.setTimeout(resolve, 50));
    }

    const profile = await fetchOwnProfile();
    if (profile === null) return; // Fail safe: never erase when verification fails.

    applyAuthoritativeProfile(profile);

    if (!profileIsConfigured(profile)) {
      console.info("[ARI Goals] New account initialized with neutral health fields.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void runOnceHydrated();
    }, { once: true });
  } else {
    void runOnceHydrated();
  }
})();
