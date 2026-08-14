import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

async function installTrainingSupabaseStub(page) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
(() => {
  const user = {
    id: "training-smoke-user",
    email: "training@arixp.test",
    user_metadata: { display_name: "Training Smoke" }
  };
  const session = { access_token: "training-smoke-token", user };

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
      single() { return Promise.resolve({ data: null, error: null }); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      then(resolve, reject) {
        return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject);
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
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        upload: async () => ({ data: { path: "smoke" }, error: null }),
        remove: async () => ({ data: [], error: null })
      })
    }
  };

  window.supabase = { createClient: () => client };
})();`
    });
  });
}

test.describe("ARI Training live controls", () => {
  test("Add Exercise shows named search results and Cancel opens confirmation", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await installTrainingSupabaseStub(page);
    await page.goto(`${BASE_URL}/ari-training.html`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(() => Boolean(window.AriTrainingLiveInteractions), null, { timeout: 10000 });

    // The smoke account deliberately has no real live workout. Fire the actual
    // DOM handlers directly so this test validates the interaction wiring and
    // resulting modal behavior without fabricating workout data or bypassing
    // the application handlers themselves.
    await page.evaluate(() => {
      document.getElementById("addExerciseToSessionButton")?.click();
    });

    const picker = page.locator("#sessionExercisePicker");
    await expect(picker).toBeVisible();
    await expect(picker).toHaveAttribute("open", "");
    await expect(page.locator("#sessionQuickAddPanel")).toBeVisible();
    await expect(page.locator("#sessionQuickAddChips button")).toHaveCount(6);
    await expect(page.locator("#sessionExerciseSearchResults")).toHaveAttribute("data-quick-hidden", "true");

    // Reproduce the real iPhone failure: typing a search used to render empty,
    // selectable gray fallback buttons because the controller and template
    // used different class names.
    const search = page.locator("#sessionExerciseSearchInput");
    await search.fill("Squat");

    const results = page.locator("#sessionExerciseSearchResults");
    await expect(results).toHaveAttribute("data-quick-hidden", "false");

    const firstResult = results.locator(".ari-session-search-result").first();
    await expect(firstResult).toBeVisible();
    await expect(firstResult.locator(".ari-session-search-result__name")).not.toHaveText("");
    await expect(firstResult.locator(".ari-session-search-result__type")).not.toHaveText("");
    await expect(firstResult.locator(".ari-session-search-result__add")).toHaveText("Add");
    await expect(firstResult).toHaveAttribute("data-action", "add-session-exercise");

    // The broken renderer created bare empty <button> elements at the top
    // level. There must be none after the template-contract repair.
    await expect(results.locator(":scope > button[data-action='add-session-exercise']")).toHaveCount(0);

    const names = await results.locator(".ari-session-search-result__name").allTextContents();
    expect(names.some((name) => /squat/i.test(name))).toBe(true);

    await page.evaluate(() => {
      document.getElementById("closeSessionExercisePickerButton")?.click();
    });
    await expect(picker).not.toBeVisible();

    await page.evaluate(() => {
      document.getElementById("cancelTodayWorkoutButton")?.click();
    });

    const cancelDialog = page.locator("#ariCancelWorkoutConfirm");
    await expect(cancelDialog).toBeVisible();
    await expect(cancelDialog).toHaveAttribute("open", "");
    await expect(cancelDialog.getByRole("button", { name: "Keep Workout" })).toBeVisible();
    await expect(cancelDialog.getByRole("button", { name: "Cancel Workout" })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
