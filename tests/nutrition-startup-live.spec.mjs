import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

function supabaseStub({ holdMealReads = false } = {}) {
  return `
(() => {
  const user = { id: "nutrition-perf-user", email: "nutrition@arixp.test", user_metadata: { display_name: "Nutrition Test" } };
  const session = { access_token: "nutrition-test-token", user };
  const mealResolvers = [];
  const HOLD_MEAL_READS = ${holdMealReads ? "true" : "false"};
  window.__nutritionMealReadCount = 0;
  window.__nutritionMealReadQueries = [];
  window.__releaseNutritionMealReads = () => {
    while (mealResolvers.length) mealResolvers.shift()?.();
  };

  function rowFor(table) {
    if (table === "ari_account_state") return { user_id: user.id, status: "active", setupPending: false };
    if (table === "profiles") return {
      id: user.id,
      email: user.email,
      display_name: "Nutrition Test",
      reset_hour: 4,
      reset_minute: 0,
      reset_ampm: "AM",
      daily_calorie_goal: 2100
    };
    return null;
  }

  function query(table) {
    const ops = [];
    const add = (name, args) => {
      ops.push([name, ...Array.from(args).map((value) => {
        if (value && typeof value === "object") {
          try { return JSON.stringify(value); } catch { return String(value); }
        }
        return String(value);
      })]);
      return q;
    };

    const q = {
      select(...args) { return add("select", args); },
      eq(...args) { return add("eq", args); },
      neq(...args) { return add("neq", args); },
      in(...args) { return add("in", args); },
      is(...args) { return add("is", args); },
      or(...args) { return add("or", args); },
      match(...args) { return add("match", args); },
      gte(...args) { return add("gte", args); },
      lte(...args) { return add("lte", args); },
      gt(...args) { return add("gt", args); },
      lt(...args) { return add("lt", args); },
      ilike(...args) { return add("ilike", args); },
      order(...args) { return add("order", args); },
      range(...args) { return add("range", args); },
      limit(...args) { return add("limit", args); },
      insert(...args) { return add("insert", args); },
      update(...args) { return add("update", args); },
      upsert(...args) { return add("upsert", args); },
      delete(...args) { return add("delete", args); },
      single() { return Promise.resolve({ data: rowFor(table), error: null }); },
      maybeSingle() { return Promise.resolve({ data: rowFor(table), error: null }); },
      then(resolve, reject) {
        const finish = () => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject);
        if (table === "meals") {
          window.__nutritionMealReadCount += 1;
          window.__nutritionMealReadQueries.push(ops.map((op) => op.join(":"))); 
          if (HOLD_MEAL_READS) return new Promise((release) => mealResolvers.push(release)).then(finish);
        }
        return finish();
      }
    };
    return q;
  }

  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null })
    },
    from: (table) => query(table),
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() {} }),
    removeChannel() {}
  };

  window.supabase = { createClient: () => client };
})();`;
}

async function stubExternalRuntime(page, options = {}) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: supabaseStub(options)
  }));
}

test("Nutrition stays interactive before and during on-demand food hydration", async ({ page }) => {
  let foodRequests = 0;
  let zxingRequests = 0;
  let releaseFoodRequests;
  const foodGate = new Promise((resolve) => { releaseFoodRequests = resolve; });

  await stubExternalRuntime(page);

  await page.route("**/ari/nutrition/data/**", async (route) => {
    foodRequests += 1;
    await foodGate;
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  await page.route("https://unpkg.com/@zxing/browser@0.2.1/**", async (route) => {
    zxingRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.ZXingBrowser = { BrowserMultiFormatReader: class { async decodeFromVideoDevice() { throw new Error("camera intentionally unavailable in smoke test"); } } };`
    });
  });

  try {
    await page.goto(`${BASE_URL}/nutrition.html`, { waitUntil: "domcontentloaded" });

    expect(zxingRequests).toBe(0);

    await page.waitForTimeout(1000);
    expect(foodRequests).toBe(0);

    const advanced = page.locator(".ari-advanced-nutrition");
    await advanced.locator("summary").click();
    await expect(advanced).toHaveJSProperty("open", true);

    const recent = page.locator("#recentMealsSection");
    await recent.locator("summary").click();
    await expect(recent).toHaveJSProperty("open", true);

    const todayMeals = page.locator("#todayMealsSection");
    await todayMeals.locator("summary").click();
    await expect(todayMeals).toHaveJSProperty("open", true);

    await page.locator("#mealName").focus();
    await expect.poll(() => foodRequests, { timeout: 3000 }).toBeGreaterThan(0);
    expect(foodRequests).toBeLessThanOrEqual(3);

    await advanced.locator("summary").click();
    await expect(advanced).toHaveJSProperty("open", false);
    await recent.locator("summary").click();
    await expect(recent).toHaveJSProperty("open", false);

    await page.locator("#scanBarcodeBtn").click();
    await expect(page.locator("#nutritionScanSheet")).toBeVisible();
    await expect.poll(() => zxingRequests, { timeout: 3000 }).toBe(1);

    expect(foodRequests).toBeGreaterThan(0);
    expect(foodRequests).toBeLessThanOrEqual(3);
  } finally {
    releaseFoodRequests?.();
  }
});

test("Recent Meals and Meals Today toggle immediately while meal reads are slow", async ({ page }) => {
  await stubExternalRuntime(page, { holdMealReads: true });

  try {
    await page.goto(`${BASE_URL}/nutrition.html`, { waitUntil: "domcontentloaded" });

    await expect.poll(
      () => page.evaluate(() => window.__nutritionMealReadCount || 0),
      { timeout: 3000 }
    ).toBeGreaterThanOrEqual(2);

    await page.waitForTimeout(150);
    const diagnostics = await page.evaluate(() => ({
      count: window.__nutritionMealReadCount || 0,
      queries: window.__nutritionMealReadQueries || []
    }));

    expect(
      diagnostics.count,
      `Expected exactly the Today and Recent startup reads. Queries:\n${diagnostics.queries.map((query, index) => `${index + 1}. ${query.join(" | ")}`).join("\n")}`
    ).toBe(2);

    const recent = page.locator("#recentMealsSection");
    await recent.locator("summary").click();
    await expect(recent).toHaveJSProperty("open", true);

    const todayMeals = page.locator("#todayMealsSection");
    await todayMeals.locator("summary").click();
    await expect(todayMeals).toHaveJSProperty("open", true);

    await recent.locator("summary").click();
    await expect(recent).toHaveJSProperty("open", false);
    await todayMeals.locator("summary").click();
    await expect(todayMeals).toHaveJSProperty("open", false);
  } finally {
    await page.evaluate(() => window.__releaseNutritionMealReads?.()).catch(() => {});
  }
});
