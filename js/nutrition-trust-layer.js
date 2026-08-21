// =====================================================
// ARI XP
// File: js/nutrition-trust-layer.js
// Version: 1.1.0
// Purpose:
//   Reliability boundary for Nutrition mutations.
//   - Uses one shared anomaly validator with Ari context.
//   - Consumes planned meals through one atomic Supabase RPC.
//   - Uses mutation IDs so retries cannot double-log the same action.
//   - Preserves partial-meal identity by renaming the remaining plan.
//   - Returns verified totals and offers immediate Undo.
//   - Observes only meal-list containers, never the entire document body.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const VALIDATOR_SCRIPT_ID = "ariNutritionValidatorScript";
  const VALIDATOR_SRC = "js/nutrition-validator.js?v=1.0.0";
  const PAGE = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  if (PAGE !== "nutrition.html") return;
  if (window.AriNutritionTrustLayer?.version === VERSION) return;

  const state = {
    busy: false,
    repairRunning: false,
    legacyRepairAttempted: false,
    observers: [],
    scanTimer: null
  };

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const round1 = (value) => Math.round(Math.max(0, number(value)) * 10) / 10;

  function ensureValidator() {
    if (typeof window.AriNutritionValidator?.detect === "function") {
      return Promise.resolve(window.AriNutritionValidator);
    }

    return new Promise((resolve, reject) => {
      let script = document.getElementById(VALIDATOR_SCRIPT_ID);

      const finish = () => {
        if (typeof window.AriNutritionValidator?.detect === "function") {
          resolve(window.AriNutritionValidator);
        } else {
          reject(new Error("Shared Nutrition validator did not initialize."));
        }
      };

      if (!script) {
        script = document.createElement("script");
        script.id = VALIDATOR_SCRIPT_ID;
        script.src = VALIDATOR_SRC;
        script.async = false;
        script.addEventListener("load", finish, { once: true });
        script.addEventListener("error", () => reject(new Error("Shared Nutrition validator could not be loaded.")), { once: true });
        document.head.appendChild(script);
        return;
      }

      script.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 0);
    });
  }

  function detectAnomalies(entry = {}) {
    return typeof window.AriNutritionValidator?.detect === "function"
      ? window.AriNutritionValidator.detect(entry)
      : [];
  }

  function slotLabel(value = "") {
    const slot = clean(value).toLowerCase();
    if (slot === "breakfast") return "Breakfast";
    if (slot === "lunch") return "Lunch";
    if (slot === "dinner") return "Dinner";
    if (slot === "snack") return "Snack";
    return "Meal";
  }

  function makeMutationId() {
    if (typeof window.crypto?.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "00000000-0000-4000-8000-" +
      Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  }

  function normalizedItems(plan = {}) {
    const source = Array.isArray(plan?.items) ? plan.items : [];
    if (source.length) {
      return source
        .map((item, index) => {
          const name = clean(item?.name);
          if (!name) return null;
          return {
            id: clean(item?.id) || `component-${index}`,
            name,
            amount: clean(item?.amount || item?.serving_size),
            calories: Math.max(0, number(item?.calories)),
            protein_g: round1(item?.protein_g ?? item?.proteinG ?? item?.protein),
            carbs_g: round1(item?.carbs_g ?? item?.carbsG ?? item?.carbs ?? item?.carbohydrates),
            fat_g: round1(item?.fat_g ?? item?.fatG ?? item?.fat)
          };
        })
        .filter(Boolean);
    }

    return [{
      id: "whole-meal",
      name: clean(plan?.name) || "Meal",
      amount: clean(plan?.serving_size),
      calories: Math.max(0, number(plan?.calories)),
      protein_g: round1(plan?.protein_g),
      carbs_g: round1(plan?.carbs_g),
      fat_g: round1(plan?.fat_g)
    }];
  }

  function sumItems(items = []) {
    return items.reduce((totals, item) => {
      totals.calories += Math.max(0, number(item?.calories));
      totals.protein_g += Math.max(0, number(item?.protein_g));
      totals.carbs_g += Math.max(0, number(item?.carbs_g));
      totals.fat_g += Math.max(0, number(item?.fat_g));
      return totals;
    }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }

  function deriveRemainder(plan = {}, remainingItems = []) {
    const items = Array.isArray(remainingItems) ? remainingItems.filter(Boolean) : [];
    if (!items.length) return null;

    const totals = sumItems(items);
    const names = items.map((item) => clean(item?.name)).filter(Boolean);
    const name = names.length <= 3
      ? names.join(" + ")
      : `${slotLabel(plan?.meal_slot)} remaining items`;

    return {
      name: name || `${slotLabel(plan?.meal_slot)} remaining items`,
      calories: Math.round(totals.calories),
      protein_g: round1(totals.protein_g),
      carbs_g: round1(totals.carbs_g),
      fat_g: round1(totals.fat_g),
      serving_size: "Remaining planned items",
      items
    };
  }

  function buildConsumed(plan = {}, items = null) {
    if (!Array.isArray(items)) {
      return {
        name: clean(plan?.name) || "Meal",
        calories: Math.round(Math.max(0, number(plan?.calories))),
        category: slotLabel(plan?.meal_slot),
        protein_g: round1(plan?.protein_g),
        carbs_g: round1(plan?.carbs_g),
        fat_g: round1(plan?.fat_g),
        serving_size: clean(plan?.serving_size) || "From today's meal plan"
      };
    }

    const totals = sumItems(items);
    const names = items.map((item) => clean(item?.name)).filter(Boolean);

    return {
      name: names.length <= 3
        ? names.join(" + ")
        : `${clean(plan?.name) || slotLabel(plan?.meal_slot)} · selected items`,
      calories: Math.round(totals.calories),
      category: slotLabel(plan?.meal_slot),
      protein_g: round1(totals.protein_g),
      carbs_g: round1(totals.carbs_g),
      fat_g: round1(totals.fat_g),
      serving_size: "Selected from today's meal plan"
    };
  }

  async function getUser() {
    try {
      if (typeof window.getCurrentUser === "function") {
        return await window.getCurrentUser();
      }
      if (typeof window.CalBuddy?.getCurrentUser === "function") {
        return await window.CalBuddy.getCurrentUser();
      }
      if (window.calbuddySupabase?.auth?.getUser) {
        const { data } = await window.calbuddySupabase.auth.getUser();
        return data?.user || null;
      }
    } catch (error) {
      console.warn("[ARI Nutrition Trust] User lookup failed:", error?.message || error);
    }
    return null;
  }

  function getPlan(planId) {
    const planner = window.AriNutritionMealPlanner;
    if (!planner || typeof planner.getState !== "function") return null;
    const plans = planner.getState()?.plans;
    return Array.isArray(plans)
      ? plans.find((plan) => String(plan?.id) === String(planId)) || null
      : null;
  }

  function selectedIndexesFor(planId) {
    const selector = document.querySelector(
      `[data-selector-for="${CSS.escape(String(planId))}"]`
    );
    if (!selector) return [];

    return Array.from(selector.querySelectorAll('input[type="checkbox"]:checked'))
      .map((input) => Number(input.value))
      .filter(Number.isInteger);
  }

  function setPlanButtonsDisabled(disabled) {
    document.querySelectorAll('[data-plan-action="eat-all"], [data-plan-action="log-selected"]')
      .forEach((button) => {
        button.disabled = Boolean(disabled);
        button.setAttribute("aria-busy", String(Boolean(disabled)));
      });
  }

  async function refreshAll() {
    const jobs = [];

    if (typeof window.AriNutritionMealPlanner?.refresh === "function") {
      jobs.push(
        Promise.resolve(window.AriNutritionMealPlanner.refresh())
          .catch((error) => console.warn("[ARI Nutrition Trust] Meal Plan refresh failed:", error?.message || error))
      );
    }

    if (typeof window.AriNutritionPage?.refresh === "function") {
      jobs.push(
        Promise.resolve(window.AriNutritionPage.refresh())
          .catch((error) => console.warn("[ARI Nutrition Trust] Nutrition refresh failed:", error?.message || error))
      );
    } else if (typeof window.refreshNutritionPage === "function") {
      jobs.push(
        Promise.resolve(window.refreshNutritionPage())
          .catch((error) => console.warn("[ARI Nutrition Trust] Nutrition refresh failed:", error?.message || error))
      );
    }

    if (jobs.length) await Promise.allSettled(jobs);

    try {
      await window.CalBuddy?.getConsumedCalories?.();
    } catch {
      // Cache refresh is best effort; the transaction already committed truth.
    }

    scanRenderedMealsForAnomalies();
  }

  function removeToast() {
    document.getElementById("ariNutritionTrustToast")?.remove();
  }

  function showToast(message, options = {}) {
    removeToast();

    const toast = document.createElement("div");
    toast.id = "ariNutritionTrustToast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = [
      "position:fixed",
      "left:16px",
      "right:16px",
      "bottom:calc(20px + env(safe-area-inset-bottom, 0px))",
      "z-index:99999",
      "max-width:620px",
      "margin:0 auto",
      "padding:14px 16px",
      "border-radius:16px",
      "background:rgba(8,18,36,.96)",
      "color:#fff",
      "box-shadow:0 18px 50px rgba(0,0,0,.35)",
      "font:600 14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "display:flex",
      "gap:12px",
      "align-items:center",
      "justify-content:space-between"
    ].join(";");

    const text = document.createElement("span");
    text.textContent = clean(message);
    toast.appendChild(text);

    if (options.mutationId) {
      const undo = document.createElement("button");
      undo.type = "button";
      undo.textContent = "Undo";
      undo.style.cssText = "border:0;border-radius:999px;padding:8px 12px;background:#fff;color:#081224;font-weight:800;cursor:pointer";
      undo.addEventListener("click", () => void undoMutation(options.mutationId, undo));
      toast.appendChild(undo);
    }

    document.body.appendChild(toast);
    window.setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, options.mutationId ? 10000 : 3500);
  }

  async function undoMutation(mutationId, button) {
    if (state.busy || !mutationId) return;
    const client = window.calbuddySupabase;
    if (!client?.rpc) return;

    state.busy = true;
    if (button) {
      button.disabled = true;
      button.textContent = "Undoing...";
    }

    try {
      const { data, error } = await client.rpc("ari_undo_nutrition_mutation", {
        p_mutation_id: mutationId
      });
      if (error) throw error;

      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
        detail: { action: "trusted_mutation_undone", mutationId, version: VERSION }
      }));

      await refreshAll();

      window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
        detail: {
          action: "transaction_undone",
          mutationId,
          source: "nutrition_trust_layer",
          version: VERSION
        }
      }));

      showToast(`Undone. ${Math.round(number(data?.todayCalories, 0)).toLocaleString()} kcal logged for today.`);
    } catch (error) {
      console.error("[ARI Nutrition Trust] Undo failed:", error);
      showToast(error?.message || "That nutrition change could not be undone.");
    } finally {
      state.busy = false;
    }
  }

  async function consumePlanTransactional(plan, selectedIndexes = null) {
    const client = window.calbuddySupabase;
    const user = await getUser();

    if (!client?.rpc || !user?.id || !plan?.id) {
      throw new Error("The trusted nutrition transaction service is unavailable.");
    }

    const components = normalizedItems(plan);
    let consumedItems = null;
    let remainingItems = [];

    if (Array.isArray(selectedIndexes)) {
      const selectedSet = new Set(
        selectedIndexes.filter((index) => Number.isInteger(index) && components[index])
      );
      consumedItems = components.filter((_, index) => selectedSet.has(index));
      remainingItems = components.filter((_, index) => !selectedSet.has(index));

      if (!consumedItems.length) {
        throw new Error("Select at least one planned item first.");
      }
    }

    const consumed = buildConsumed(plan, consumedItems);
    const remaining = Array.isArray(selectedIndexes)
      ? deriveRemainder(plan, remainingItems)
      : null;

    const anomalies = detectAnomalies(consumed);
    if (anomalies.length) {
      const proceed = window.confirm(
        `Check this entry before logging:\n\n${consumed.name} — ${consumed.calories} kcal\n\n${anomalies.join("\n")}\n\nLog it anyway?`
      );
      if (!proceed) return null;
    }

    const mutationId = makeMutationId();
    const { data, error } = await client.rpc("ari_consume_nutrition_plan", {
      p_plan_id: plan.id,
      p_mutation_id: mutationId,
      p_consumed: consumed,
      p_remaining: remaining
    });

    if (error) throw error;

    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: { action: "trusted_plan_consumption", mutationId, version: VERSION }
    }));

    await refreshAll();

    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: {
        action: remaining ? "transaction_partially_eaten" : "transaction_eaten",
        planId: plan.id,
        mutationId,
        source: "nutrition_trust_layer",
        version: VERSION
      }
    }));

    const total = Math.round(number(data?.todayCalories, 0)).toLocaleString();
    showToast(`${consumed.name} logged. ${total} kcal logged today.`, { mutationId });

    return data;
  }

  async function handleTrustedPlanAction(button, action, plan) {
    if (state.busy) return;
    state.busy = true;
    setPlanButtonsDisabled(true);

    try {
      const indexes = action === "log-selected"
        ? selectedIndexesFor(plan.id)
        : null;
      await consumePlanTransactional(plan, indexes);
    } catch (error) {
      console.error("[ARI Nutrition Trust] Transaction failed:", error);
      showToast(error?.message || "That meal could not be logged. Nothing was changed.");
    } finally {
      state.busy = false;
      setPlanButtonsDisabled(false);
    }
  }

  function onPlanClickCapture(event) {
    const button = event.target?.closest?.("[data-plan-action]");
    if (!button) return;

    const action = clean(button.dataset.planAction);
    if (action !== "eat-all" && action !== "log-selected") return;

    const planId = clean(button.dataset.planId);
    const plan = getPlan(planId);

    // Local-only/offline plans retain the existing local fallback behavior.
    // Supabase plans are intercepted so the write and plan-state transition
    // occur inside one server transaction.
    if (!plan || plan.storage_source !== "supabase" || !window.calbuddySupabase?.rpc) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    void handleTrustedPlanAction(button, action, plan);
  }

  function readManualEntryFromDom() {
    return {
      name: clean(document.getElementById("mealName")?.value || document.getElementById("manualFoodName")?.value),
      calories: number(document.getElementById("mealCalories")?.value || document.getElementById("manualCalories")?.value, NaN),
      protein_g: number(document.getElementById("mealProtein")?.value || document.getElementById("manualProtein")?.value, 0),
      carbs_g: number(document.getElementById("mealCarbs")?.value || document.getElementById("manualCarbs")?.value, 0),
      fat_g: number(document.getElementById("mealFat")?.value || document.getElementById("manualFat")?.value, 0),
      serving_size: "Manual entry"
    };
  }

  function onManualSaveCapture(event) {
    const button = event.target?.closest?.("#saveMealBtn");
    if (!button) return;

    const databaseSelection = document.getElementById("mealFoodSelection");
    if (databaseSelection && !databaseSelection.hidden) return;

    const entry = readManualEntryFromDom();
    const anomalies = detectAnomalies(entry);
    if (!anomalies.length) return;

    const proceed = window.confirm(
      `Check this entry before saving:\n\n${entry.name || "Meal"} — ${Number.isFinite(entry.calories) ? entry.calories : "?"} kcal\n\n${anomalies.join("\n")}\n\nSave it anyway?`
    );

    if (!proceed) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showToast("Nothing was saved. Review the meal details and try again.");
    }
  }

  function suspiciousRenderedMeal(card) {
    const name = clean(card.querySelector("h3")?.textContent || card.querySelector("h4")?.textContent);
    const caloriesText = clean(card.querySelector(".nutrition-meal-calories")?.textContent);
    const meta = clean(card.querySelector(".nutrition-meal-meta")?.textContent);
    const match = caloriesText.match(/([\d,.]+)\s*kcal/i);
    if (!match) return [];

    return detectAnomalies({
      name,
      calories: Number(match[1].replace(/,/g, "")),
      serving_size: meta
    });
  }

  function scanRenderedMealsForAnomalies() {
    document.querySelectorAll("#todayMealList .nutrition-meal-card, #recentMealList .nutrition-meal-card, #recentMealList .nutrition-recent-meal")
      .forEach((card) => {
        card.querySelector(".ari-trust-warning")?.remove();
        const findings = suspiciousRenderedMeal(card);
        if (!findings.length) return;

        const warning = document.createElement("button");
        warning.type = "button";
        warning.className = "ari-trust-warning";
        warning.textContent = "Check entry";
        warning.title = findings.join(" ");
        warning.style.cssText = "margin-top:8px;border:1px solid rgba(255,190,70,.65);border-radius:999px;padding:5px 9px;background:rgba(255,190,70,.12);color:inherit;font-size:12px;font-weight:800";
        warning.addEventListener("click", () => {
          window.alert(findings.join("\n"));
        });
        card.appendChild(warning);
      });
  }

  function scheduleScan() {
    window.clearTimeout(state.scanTimer);
    state.scanTimer = window.setTimeout(scanRenderedMealsForAnomalies, 60);
  }

  async function repairPartialRemainders() {
    if (state.repairRunning) return;
    const client = window.calbuddySupabase;
    const user = await getUser();
    if (!client || !user?.id) return;

    state.repairRunning = true;
    try {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .select("id,meal_slot,name,calories,protein_g,carbs_g,fat_g,serving_size,items,notes,status")
        .eq("user_id", user.id)
        .eq("status", "planned")
        .ilike("notes", "%Partially eaten%");

      if (error) throw error;

      for (const plan of Array.isArray(data) ? data : []) {
        const items = normalizedItems(plan);
        const remainder = deriveRemainder(plan, items);
        if (!remainder) continue;

        const needsRepair =
          clean(plan.name) !== clean(remainder.name) ||
          clean(plan.serving_size) !== "Remaining planned items" ||
          Math.round(number(plan.calories)) !== Math.round(number(remainder.calories));

        if (!needsRepair) continue;

        const { error: updateError } = await client
          .from("nutrition_plan_items")
          .update({
            name: remainder.name,
            calories: remainder.calories,
            protein_g: remainder.protein_g,
            carbs_g: remainder.carbs_g,
            fat_g: remainder.fat_g,
            serving_size: "Remaining planned items",
            items: remainder.items,
            updated_at: new Date().toISOString()
          })
          .eq("id", plan.id)
          .eq("user_id", user.id)
          .eq("status", "planned");

        if (updateError) {
          console.warn("[ARI Nutrition Trust] Partial remainder repair failed:", updateError.message);
        }
      }
    } catch (error) {
      console.warn("[ARI Nutrition Trust] Remainder repair unavailable:", error?.message || error);
    } finally {
      state.repairRunning = false;
    }
  }

  function installObservers() {
    if (!("MutationObserver" in window)) return;

    for (const id of ["todayMealList", "recentMealList"]) {
      const target = document.getElementById(id);
      if (!target || target.dataset.ariTrustObserved === "true") continue;

      target.dataset.ariTrustObserved = "true";
      const observer = new MutationObserver(scheduleScan);
      observer.observe(target, { childList: true, subtree: false });
      state.observers.push(observer);
    }
  }

  function runLegacyRepairOnce() {
    if (state.legacyRepairAttempted) return;
    state.legacyRepairAttempted = true;
    void repairPartialRemainders().then(() => refreshAll());
  }

  function install() {
    document.addEventListener("click", onPlanClickCapture, true);
    document.addEventListener("click", onManualSaveCapture, true);

    document.addEventListener("click", (event) => {
      if (event.target?.closest?.('#nutritionTodayModeTabs [data-mode="plan"]')) {
        runLegacyRepairOnce();
      }
    });

    window.addEventListener("ari:nutritionMealPlanChanged", (event) => {
      if (event?.detail?.source === "nutrition_trust_layer") {
        scheduleScan();
        return;
      }
      void repairPartialRemainders().then(() => refreshAll());
    });

    window.addEventListener("ari:meal-ledger-synced", scheduleScan);
    window.addEventListener("calbuddy:mealsChanged", scheduleScan);

    installObservers();
    scanRenderedMealsForAnomalies();

    console.info(`[ARI Nutrition Trust] Ready. Version ${VERSION}.`);
  }

  async function boot() {
    try {
      await ensureValidator();
    } catch (error) {
      console.warn("[ARI Nutrition Trust] Shared validator unavailable:", error?.message || error);
    }
    install();
  }

  window.AriNutritionTrustLayer = Object.freeze({
    version: VERSION,
    validatorVersion: () => window.AriNutritionValidator?.version || null,
    detectAnomalies,
    deriveRemainder,
    repairPartialRemainders,
    refresh: refreshAll
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
