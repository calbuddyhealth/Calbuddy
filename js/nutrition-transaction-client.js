// =====================================================
// ARI XP
// File: js/nutrition-transaction-client.js
// Version: 1.0.0
// Purpose:
//   Replace the canonical browser meal writer with an idempotent, journaled
//   Supabase transaction for signed-in users. Failed cloud writes fail clearly
//   instead of silently becoming a second local truth. Offline/unsigned use
//   preserves the existing canonical local fallback.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const INSTALL_FLAG = "__ariNutritionTransactionClientV1";
  const ACTIVE_PAGES = new Set(["", "home.html", "nutrition.html"]);
  const page = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  if (!ACTIVE_PAGES.has(page)) return;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function makeMutationId() {
    if (typeof window.crypto?.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "00000000-0000-4000-8000-" +
      Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  }

  function localDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const safe = Number.isFinite(date.getTime()) ? date : new Date();
    const year = safe.getFullYear();
    const month = String(safe.getMonth() + 1).padStart(2, "0");
    const day = String(safe.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function currentSession() {
    if (typeof window.CalBuddy?.getCurrentSession === "function") {
      return await window.CalBuddy.getCurrentSession();
    }
    if (typeof window.getCurrentSession === "function") {
      return await window.getCurrentSession();
    }
    if (!window.calbuddySupabase?.auth?.getSession) return null;
    const { data, error } = await window.calbuddySupabase.auth.getSession();
    return error ? null : data?.session || null;
  }

  async function normalizeMeal(meal = {}) {
    const created = new Date(meal?.created_at || new Date());
    const createdAt = Number.isFinite(created.getTime())
      ? created.toISOString()
      : new Date().toISOString();

    let nutritionDate = clean(meal?.nutrition_date);
    if (!nutritionDate && typeof window.CalBuddy?.getNutritionWindow === "function") {
      try {
        nutritionDate = clean((await window.CalBuddy.getNutritionWindow())?.nutritionDate);
      } catch {
        // Fall through to the created-at calendar date.
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nutritionDate)) {
      nutritionDate = localDate(createdAt);
    }

    return {
      name: clean(meal?.name) || "Ari meal",
      calories: Math.round(number(meal?.calories)),
      category: clean(meal?.category) || "Meal",
      nutrition_date: nutritionDate,
      protein_g: Math.max(0, number(meal?.protein_g ?? meal?.protein)),
      carbs_g: Math.max(0, number(meal?.carbs_g ?? meal?.carbs ?? meal?.carbohydrates)),
      fat_g: Math.max(0, number(meal?.fat_g ?? meal?.fat)),
      serving_size: clean(meal?.serving_size) || "Added in ARI XP",
      multiplier: Math.max(0.01, number(meal?.multiplier, 1) || 1),
      is_favorite: meal?.is_favorite === true,
      created_at: createdAt
    };
  }

  function removeUndoToast() {
    document.getElementById("ariNutritionMutationUndo")?.remove();
  }

  function showUndoToast({ mutationId, mealName, todayCalories } = {}) {
    if (!mutationId || !document.body) return;
    removeUndoToast();

    const toast = document.createElement("div");
    toast.id = "ariNutritionMutationUndo";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = [
      "position:fixed",
      "left:16px",
      "right:16px",
      "bottom:calc(20px + env(safe-area-inset-bottom, 0px))",
      "z-index:100000",
      "max-width:620px",
      "margin:0 auto",
      "padding:13px 15px",
      "border-radius:16px",
      "background:rgba(8,18,36,.97)",
      "color:#fff",
      "box-shadow:0 18px 50px rgba(0,0,0,.35)",
      "font:600 14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "display:flex",
      "gap:12px",
      "align-items:center",
      "justify-content:space-between"
    ].join(";");

    const text = document.createElement("span");
    const total = Number.isFinite(Number(todayCalories))
      ? ` · ${Math.round(Number(todayCalories)).toLocaleString()} kcal today`
      : "";
    text.textContent = `${clean(mealName) || "Meal"} logged${total}.`;

    const undo = document.createElement("button");
    undo.type = "button";
    undo.textContent = "Undo";
    undo.style.cssText = "border:0;border-radius:999px;padding:8px 12px;background:#fff;color:#081224;font-weight:800;cursor:pointer";
    undo.addEventListener("click", async () => {
      undo.disabled = true;
      undo.textContent = "Undoing...";
      try {
        await window.CalBuddy.undoNutritionMutation(mutationId);
        removeUndoToast();
      } catch (error) {
        undo.disabled = false;
        undo.textContent = "Undo";
        console.error("[ARI Nutrition Transaction] Undo failed:", error);
      }
    });

    toast.append(text, undo);
    document.body.appendChild(toast);
    window.setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, 10000);
  }

  async function install() {
    const CalBuddy = window.CalBuddy;
    const client = window.calbuddySupabase;

    // Wait until meal-ledger-sync has installed the canonical writer so this
    // wrapper cannot be overwritten later by bootstrap timing.
    if (
      !CalBuddy ||
      !CalBuddy.__ariMealLedgerSyncV1 ||
      typeof CalBuddy.logMeal !== "function" ||
      !client
    ) {
      return false;
    }

    if (CalBuddy[INSTALL_FLAG]) return true;

    const canonicalFallback = CalBuddy.logMeal.bind(CalBuddy);

    CalBuddy.logMeal = async function trustedLogMeal(meal = {}) {
      const session = await currentSession();

      // Existing local behavior remains available when there is no authenticated
      // cloud session. Once signed in, a failed server transaction must be
      // surfaced rather than silently creating a competing local record.
      if (!session?.user?.id || typeof client.rpc !== "function") {
        return await canonicalFallback(meal);
      }

      const payload = await normalizeMeal(meal);
      if (!payload.name) throw new Error("Meal name is required.");
      if (!Number.isFinite(payload.calories) || payload.calories <= 0) {
        throw new Error("Meal calories are required.");
      }

      const mutationId = makeMutationId();
      CalBuddy.setAriMood?.("logging");

      const { data, error } = await client.rpc("ari_log_nutrition_meal", {
        p_mutation_id: mutationId,
        p_meal: payload
      });

      if (error) {
        CalBuddy.setAriMood?.("concerned");
        throw new Error(error.message || "The meal could not be saved. Nothing was changed.");
      }

      const saved = data?.meal && typeof data.meal === "object"
        ? { ...data.meal, source: "supabase" }
        : { ...payload, source: "supabase" };

      Object.defineProperties(saved, {
        ari_mutation_id: { value: mutationId, enumerable: true },
        ari_today_calories: { value: number(data?.todayCalories, null), enumerable: true },
        ari_undo_available: { value: data?.undoAvailable === true, enumerable: true }
      });

      try {
        if (Number.isFinite(Number(data?.todayCalories))) {
          localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
          localStorage.setItem("calbuddyCaloriesConsumedDate", payload.nutrition_date);
        }
      } catch {
        // Storage restrictions do not affect committed server truth.
      }

      window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", {
        detail: {
          action: "log_meal",
          mutationId,
          meal: saved,
          todayCalories: data?.todayCalories ?? null,
          undoAvailable: data?.undoAvailable === true,
          source: "nutrition_transaction_client",
          version: VERSION
        }
      }));

      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
        detail: { action: "log", meal: saved, mutationId }
      }));

      CalBuddy.setAriMood?.("success");
      showUndoToast({
        mutationId,
        mealName: saved.name,
        todayCalories: data?.todayCalories
      });

      return saved;
    };

    CalBuddy.undoNutritionMutation = async function undoNutritionMutation(mutationId) {
      const id = clean(mutationId);
      if (!id) throw new Error("A nutrition mutation ID is required.");

      const session = await currentSession();
      if (!session?.user?.id || typeof client.rpc !== "function") {
        throw new Error("Undo requires a signed-in ARI XP session.");
      }

      const { data, error } = await client.rpc("ari_undo_nutrition_mutation", {
        p_mutation_id: id
      });
      if (error) throw new Error(error.message || "That nutrition change could not be undone.");

      try {
        if (Number.isFinite(Number(data?.todayCalories))) {
          localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
          if (data?.nutritionDate) {
            localStorage.setItem("calbuddyCaloriesConsumedDate", String(data.nutritionDate));
          }
        }
      } catch {
        // Storage restrictions do not affect committed server truth.
      }

      try {
        await CalBuddy.getConsumedCalories?.();
      } catch {
        // The RPC already returned authoritative totals.
      }

      window.dispatchEvent(new CustomEvent("ari:nutritionMutationUndone", {
        detail: {
          mutationId: id,
          todayCalories: data?.todayCalories ?? null,
          source: "nutrition_transaction_client",
          version: VERSION
        }
      }));

      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
        detail: { action: "undo", mutationId: id }
      }));

      return data;
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    console.info(`[ARI Nutrition Transaction] Ready. Version ${VERSION}.`);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(async () => {
    attempts += 1;
    try {
      if (await install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[ARI Nutrition Transaction] Install retry failed:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 50);
})();
