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
  test("Add Exercise opens a compact Quick Add dialog and Cancel opens confirmation", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await installTrainingSupabaseStub(page);
    await page.goto(`${BASE_URL}/ari-training.html`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(() => Boolean(window.AriTrainingLiveInteractions), null, { timeout: 10000 });

    await page.evaluate(() => {
      const live = document.getElementById("todaysTrainingSession");
      const add = document.getElementById("addExerciseToSessionButton");
      const cancel = document.getElementById("cancelTodayWorkoutButton");
      if (live) live.hidden = false;
      if (add) add.hidden = false;
      if (cancel) cancel.hidden = false;
    });

    await page.locator("#addExerciseToSessionButton").click();

    const picker = page.locator("#sessionExercisePicker");
    await expect(picker).toBeVisible();
    await expect(picker).toHaveAttribute("open", "");
    await expect(page.locator("#sessionQuickAddPanel")).toBeVisible();
    await expect(page.locator("#sessionQuickAddChips button")).toHaveCount(6);
    await expect(page.locator("#sessionExerciseSearchResults")).toHaveAttribute("data-quick-hidden", "true");

    await page.locator("#closeSessionExercisePickerButton").click();
    await expect(picker).not.toBeVisible();

    await page.locator("#cancelTodayWorkoutButton").click();
    const cancelDialog = page.locator("#ariCancelWorkoutConfirm");
    await expect(cancelDialog).toBeVisible();
    await expect(cancelDialog).toHaveAttribute("open", "");
    await expect(cancelDialog.getByRole("button", { name: "Keep Workout" })).toBeVisible();
    await expect(cancelDialog.getByRole("button", { name: "Cancel Workout" })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
