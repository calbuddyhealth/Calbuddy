// =====================================================
// ARI XP
// File: js/goals-neutral-new-user.js
// Version: 1.0.0
// Purpose:
//   Prevent brand-new accounts from seeing legacy developer/template health
//   values on My Goals. Existing configured users keep their saved profile.
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

  const PROFILE_FIELDS = [
    "age",
    "sex",
    "weight_lbs",
    "height_in",
    "activity_level",
    "goal",
    "target_weight_lbs"
  ];

  const isPresent = value =>
    value !== null && value !== undefined && String(value).trim() !== "";

  function profileIsConfigured(profile = {}) {
    return PROFILE_FIELDS.some(key => isPresent(profile?.[key]));
  }

  function clearInput(id) {
    const element = document.getElementById(id);
    if (!element) return;

    if (element.tagName === "SELECT") {
      element.value = "";
      if (element.value !== "") element.selectedIndex = 0;
      return;
    }

    element.value = "";
  }

  function neutralizeGoalsUi() {
    [
      "age",
      "sex",
      "weight",
      "height",
      "restingHeartRate",
      "estimatedMaxHeartRate",
      "activity",
      "goalMode",
      "targetWeight",
      "dailyCalorieGoalInput"
    ].forEach(clearInput);

    const maxHr = document.getElementById("estimatedMaxHeartRate");
    if (maxHr) maxHr.dataset.mode = "auto";

    const dailyGoal = document.getElementById("dailyCalorieGoalInput");
    if (dailyGoal) dailyGoal.dataset.mode = "auto";

    const weeklyGroup = document.getElementById("weeklyChangeGroup");
    if (weeklyGroup) weeklyGroup.style.display = "none";

    const heightConversion = document.getElementById("heightConversion");
    if (heightConversion) heightConversion.textContent = "Equivalent: —";

    const maxHrSource = document.getElementById("maxHeartRateSource");
    if (maxHrSource) maxHrSource.textContent = "AUTO";

    const modeChip = document.getElementById("dailyCalorieGoalModeChip");
    if (modeChip) modeChip.textContent = "AUTO ESTIMATE";

    LEGACY_LOCAL_KEYS.forEach(key => localStorage.removeItem(key));

    try {
      if (typeof window.calculateGoals === "function") {
        window.calculateGoals();
      }
    } catch (error) {
      console.warn("Neutral Goals recalculation skipped:", error?.message || error);
    }

    document.documentElement.dataset.ariGoalsNeutralized = "true";
  }

  async function fetchOwnProfile() {
    if (!window.calbuddySupabase) return null;

    const { data: sessionData } = await window.calbuddySupabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return null;

    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("age,sex,weight_lbs,height_in,activity_level,goal,target_weight_lbs")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not verify new-user Goals profile:", error.message);
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

    if (!profileIsConfigured(profile)) {
      neutralizeGoalsUi();
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
