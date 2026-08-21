import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

function supabaseStub() {
  return `
(() => {
  const user = { id: "nutrition-perf-user", email: "nutrition@arixp.test", user_metadata: { display_name: "Nutrition Test" } };
  const session = { access_token: "nutrition-test-token", user };

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
    const q = {
      select() { return q; },
      eq() { return q; },
      neq() { return q; },
      in() { return q; },
      is() { return q; },
      or() { return q; },
      match() { return q; },
      gte() { return q; },
      lte() { return q; },
      gt() { return q; },
      lt() { return q; },
      order() { return q; },
      range() { return q; },
      limit() { return q; },
      insert() { return q; },
      update() { return q; },
      upsert() { return q; },
      delete() { return q; },
      single() { return Promise.resolve({ data: rowFor(table), error: null }); },
      maybeSingle() { return Promise.resolve({ data: rowFor(table), error: null }); },
      then(resolve, reject) { return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject); }
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

test("Nutrition controls stay interactive while the food database hydrates", async ({ page }) => {
  let foodRequests = 0;
  let zxingRequests = 0;
  let releaseFoodRequests;
  const foodGate = new Promise((resolve) => { releaseFoodRequests = resolve; });

  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: supabaseStub()
  }));

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

    await page.locator("#mealName").focus();
    await expect.poll(() => foodRequests, { timeout: 3000 }).toBeGreaterThan(0);

    const advanced = page.locator(".ari-advanced-nutrition");
    await advanced.locator("summary").click();
    await expect(advanced).toHaveJSProperty("open", true);

    const recent = page.locator("#recentMealsSection");
    await recent.locator("summary").click();
    await expect(recent).toHaveJSProperty("open", true);

    const todayMeals = page.locator("#todayMealsSection");
    await todayMeals.locator("summary").click();
    await expect(todayMeals).toHaveJSProperty("open", true);

    await page.locator("#scanBarcodeBtn").click();
    await expect(page.locator("#nutritionScanSheet")).toBeVisible();
    await expect.poll(() => zxingRequests, { timeout: 3000 }).toBe(1);

    // The database requests are still unresolved here; the controls above must
    // not depend on them finishing.
    expect(foodRequests).toBeGreaterThan(0);
  } finally {
    releaseFoodRequests?.();
  }
});