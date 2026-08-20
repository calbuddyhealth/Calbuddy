// =====================================================
// ARI XP
// File: js/nutrition-transaction-client.js
// Version: 1.1.0
// Purpose:
//   Trust boundary for signed-in Nutrition mutations.
//   - Journaled/idempotent normal meal logging + Undo.
//   - Offline-first Meal Plan migration through user-scoped RPCs.
//   - No direct browser DML privilege is required for nutrition_plan_items.
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

// =====================================================
// Meal Plan scoped synchronization adapter
// =====================================================
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const TABLE = "nutrition_plan_items";
  const LOCAL_KEY = "ariNutritionMealPlanV1";
  const CLIENT_FLAG = "__ariNutritionPlanSyncAdapterV1";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function makeLocalId() {
    if (typeof window.crypto?.randomUUID === "function") {
      return `plan-${window.crypto.randomUUID()}`;
    }
    return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeLocal(values) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.isArray(values) ? values : []));
    } catch {
      // Local mirroring is a resilience layer. Cloud truth remains authoritative.
    }
  }

  async function currentSession(client) {
    if (typeof window.CalBuddy?.getCurrentSession === "function") {
      return await window.CalBuddy.getCurrentSession();
    }
    if (typeof window.getCurrentSession === "function") {
      return await window.getCurrentSession();
    }
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    return error ? null : data?.session || null;
  }

  function localIdFor(plan = {}) {
    const explicit = clean(plan.local_id || plan.localId);
    if (explicit) return explicit;
    const id = clean(plan.id);
    return id && !UUID_RE.test(id) ? id : "";
  }

  function cloudIdFor(plan = {}) {
    const explicit = clean(plan.cloud_id || plan.cloudId);
    if (UUID_RE.test(explicit)) return explicit;
    const id = clean(plan.id);
    return UUID_RE.test(id) ? id : "";
  }

  function syncPayload(plan = {}, forcedLocalId = "") {
    const localId = clean(forcedLocalId) || localIdFor(plan);
    const cloudId = cloudIdFor(plan);
    const syncKey = clean(plan.client_sync_key || plan.sync_key) || (localId ? `local:${localId}` : "");

    return {
      localId: localId || null,
      cloudId: cloudId || null,
      sync_key: syncKey || null,
      plan_date: clean(plan.plan_date) || todayKey(),
      meal_slot: clean(plan.meal_slot).toLowerCase(),
      name: clean(plan.name) || "Meal",
      calories: Math.max(0, number(plan.calories)),
      protein_g: Math.max(0, number(plan.protein_g)),
      carbs_g: Math.max(0, number(plan.carbs_g)),
      fat_g: Math.max(0, number(plan.fat_g)),
      serving_size: clean(plan.serving_size) || "Meal Plan",
      multiplier: Math.max(0.01, number(plan.multiplier, 1) || 1),
      source_type: clean(plan.source_type) || "ari",
      source_ref: clean(plan.source_ref) || null,
      items: Array.isArray(plan.items) ? plan.items : [],
      notes: clean(plan.notes),
      status: clean(plan.status).toLowerCase() || "planned",
      consumed_meal_id: clean(plan.consumed_meal_id) || null,
      position: Math.max(0, Math.round(number(plan.position))),
      updated_at: clean(plan.updated_at) || new Date().toISOString()
    };
  }

  function mirrorCloud(rows = []) {
    const date = todayKey();
    const existing = readLocal().filter((item) => clean(item?.plan_date) !== date);
    const mirrored = (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      cloud_id: clean(row?.id) || null,
      local_id: clean(row?.client_sync_key).startsWith("local:")
        ? clean(row.client_sync_key).slice(6)
        : null,
      storage_source: "supabase"
    }));
    writeLocal([...existing, ...mirrored]);
    return mirrored;
  }

  function asError(error, fallback = "Meal Plan synchronization failed.") {
    if (error && typeof error === "object" && clean(error.message)) return error;
    return { message: clean(error) || fallback };
  }

  function matchesFilter(row, filter) {
    const { kind, column, value } = filter;
    if (column === "user_id") return true; // RPC already scopes by auth.uid().
    const actual = row?.[column];

    if (kind === "eq") {
      return String(actual ?? "") === String(value ?? "");
    }

    if (kind === "ilike") {
      const needle = String(value ?? "").replace(/%/g, "").toLowerCase();
      return String(actual ?? "").toLowerCase().includes(needle);
    }

    return true;
  }

  function sortRows(rows, orders = []) {
    if (!orders.length) return rows;
    return [...rows].sort((left, right) => {
      for (const order of orders) {
        const a = left?.[order.column];
        const b = right?.[order.column];
        if (a === b) continue;
        const direction = order.ascending === false ? -1 : 1;
        if (a === null || a === undefined) return 1 * direction;
        if (b === null || b === undefined) return -1 * direction;
        if (a < b) return -1 * direction;
        if (a > b) return 1 * direction;
      }
      return 0;
    });
  }

  function installPlanSync(client) {
    if (!client?.rpc || typeof client.from !== "function") return false;
    if (client[CLIENT_FLAG]) return true;

    const nativeFrom = client.from.bind(client);

    async function requireSession() {
      const session = await currentSession(client);
      if (!session?.user?.id) throw new Error("A signed-in ARI XP session is required for cloud Meal Plan sync.");
      return session;
    }

    async function pushRecords(records = []) {
      await requireSession();
      const payloads = (Array.isArray(records) ? records : [])
        .filter(Boolean)
        .map((plan) => syncPayload(plan));

      const combined = {
        success: true,
        syncedCount: 0,
        acceptedCount: 0,
        staleCount: 0,
        mappings: []
      };

      for (let index = 0; index < payloads.length; index += 32) {
        const chunk = payloads.slice(index, index + 32);
        const { data, error } = await client.rpc("ari_sync_nutrition_plans", { p_plans: chunk });
        if (error) throw error;
        combined.syncedCount += number(data?.syncedCount);
        combined.acceptedCount += number(data?.acceptedCount);
        combined.staleCount += number(data?.staleCount);
        if (Array.isArray(data?.mappings)) combined.mappings.push(...data.mappings);
      }

      return combined;
    }

    async function listCloud() {
      await requireSession();
      const { data, error } = await client.rpc("ari_list_today_nutrition_plans");
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    }

    async function synchronizeLocal() {
      const date = todayKey();
      const localToday = readLocal().filter((item) => clean(item?.plan_date) === date);
      if (localToday.length) await pushRecords(localToday);
      const cloud = mirrorCloud(await listCloud());

      window.dispatchEvent(new CustomEvent("ari:nutritionPlanSynced", {
        detail: {
          date,
          count: cloud.length,
          source: "nutrition_plan_sync_adapter",
          version: VERSION
        }
      }));

      return cloud;
    }

    async function insertCloud(record = {}) {
      const localId = makeLocalId();
      const candidate = {
        ...record,
        id: localId,
        local_id: localId,
        client_sync_key: `local:${localId}`,
        updated_at: clean(record.updated_at) || new Date().toISOString()
      };
      const result = await pushRecords([candidate]);
      const mapping = result.mappings.find((item) => clean(item?.localId) === localId) || result.mappings[0];
      const rows = mirrorCloud(await listCloud());
      const cloudId = clean(mapping?.cloudId);
      const saved = rows.find((item) => clean(item?.id) === cloudId);
      if (!saved) throw new Error("The cloud Meal Plan was not returned after synchronization.");
      return saved;
    }

    async function updateCloud(records = []) {
      const payloads = (Array.isArray(records) ? records : [records]).map((record) => ({
        ...record,
        updated_at: clean(record?.updated_at) || new Date().toISOString()
      }));
      await pushRecords(payloads);
      return mirrorCloud(await listCloud());
    }

    async function ensureCloudPlan(plan = {}) {
      const existingCloudId = cloudIdFor(plan);
      if (existingCloudId) {
        const rows = await synchronizeLocal();
        const match = rows.find((row) => clean(row?.id) === existingCloudId);
        if (match) return match;
      }

      const localId = localIdFor(plan) || makeLocalId();
      const candidate = {
        ...plan,
        id: localId,
        local_id: localId,
        client_sync_key: clean(plan.client_sync_key) || `local:${localId}`,
        updated_at: clean(plan.updated_at) || new Date().toISOString()
      };
      const result = await pushRecords([candidate]);
      const mapping = result.mappings.find((item) => clean(item?.localId) === localId) || result.mappings[0];
      const rows = mirrorCloud(await listCloud());
      const cloudId = clean(mapping?.cloudId);
      const saved = rows.find((row) => clean(row?.id) === cloudId);
      if (!saved) throw new Error("The Meal Plan could not be promoted to cloud truth.");
      return saved;
    }

    class PlanQuery {
      constructor() {
        this.operation = null;
        this.payload = null;
        this.filters = [];
        this.orders = [];
        this.resultLimit = null;
        this.singleMode = false;
        this.maybeSingleMode = false;
        this.promise = null;
      }

      select() {
        if (!this.operation) this.operation = "select";
        return this;
      }

      insert(payload) {
        this.operation = "insert";
        this.payload = Array.isArray(payload) ? payload : [payload];
        return this;
      }

      update(payload) {
        this.operation = "update";
        this.payload = payload && typeof payload === "object" ? payload : {};
        return this;
      }

      eq(column, value) {
        this.filters.push({ kind: "eq", column: clean(column), value });
        return this;
      }

      ilike(column, value) {
        this.filters.push({ kind: "ilike", column: clean(column), value });
        return this;
      }

      order(column, options = {}) {
        this.orders.push({ column: clean(column), ascending: options?.ascending !== false });
        return this;
      }

      limit(value) {
        const parsed = Math.max(0, Math.round(number(value)));
        this.resultLimit = parsed || null;
        return this;
      }

      single() {
        this.singleMode = true;
        return this.execute();
      }

      maybeSingle() {
        this.maybeSingleMode = true;
        return this.execute();
      }

      then(resolve, reject) {
        return this.execute().then(resolve, reject);
      }

      async execute() {
        if (this.promise) return this.promise;
        this.promise = this._execute();
        return this.promise;
      }

      async _execute() {
        try {
          let rows;

          if (!this.operation || this.operation === "select") {
            rows = await synchronizeLocal();
          } else if (this.operation === "insert") {
            rows = [];
            for (const item of this.payload || []) rows.push(await insertCloud(item));
          } else if (this.operation === "update") {
            const current = await synchronizeLocal();
            const targets = current.filter((row) => this.filters.every((filter) => matchesFilter(row, filter)));
            if (!targets.length) {
              if (this.singleMode) return { data: null, error: asError("No matching Meal Plan was found.") };
              return { data: [], error: null };
            }
            const ids = new Set(targets.map((row) => clean(row.id)));
            const merged = targets.map((row) => ({
              ...row,
              ...(this.payload || {}),
              cloud_id: row.id,
              updated_at: clean(this.payload?.updated_at) || new Date().toISOString()
            }));
            const refreshed = await updateCloud(merged);
            rows = refreshed.filter((row) => ids.has(clean(row.id)));
          } else {
            throw new Error("Unsupported Meal Plan query operation.");
          }

          if (this.operation !== "update") {
            rows = rows.filter((row) => this.filters.every((filter) => matchesFilter(row, filter)));
          }
          rows = sortRows(rows, this.orders);
          if (this.resultLimit) rows = rows.slice(0, this.resultLimit);

          if (this.singleMode) {
            return rows.length
              ? { data: rows[0], error: null }
              : { data: null, error: asError("No matching Meal Plan was found.") };
          }

          if (this.maybeSingleMode) {
            return { data: rows[0] || null, error: null };
          }

          return { data: rows, error: null };
        } catch (error) {
          return { data: null, error: asError(error) };
        }
      }
    }

    client.from = function ariNutritionPlanAwareFrom(tableName) {
      if (clean(tableName) === TABLE) return new PlanQuery();
      return nativeFrom(tableName);
    };

    Object.defineProperty(client, CLIENT_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    window.AriNutritionPlanSync = Object.freeze({
      version: VERSION,
      loadAllToday: synchronizeLocal,
      loadToday: async () => (await synchronizeLocal()).filter((row) => clean(row?.status) === "planned"),
      ensureCloudPlan,
      pushRecords,
      listCloud,
      mirrorCloud
    });

    console.info(`[ARI Nutrition Plan Sync] Ready. Version ${VERSION}.`);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (installPlanSync(window.calbuddySupabase)) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[ARI Nutrition Plan Sync] Install retry failed:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 20);
})();
