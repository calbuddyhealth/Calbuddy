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

    await page.evaluate(() => {
      document.getElementById("addExerciseToSessionButton")?.click();
    });

    const picker = page.locator("#sessionExercisePicker");
    await expect(picker).toBeVisible();
    await expect(picker).toHaveAttribute("open", "");
    await expect(page.locator("#sessionQuickAddPanel")).toBeVisible();
    await expect(page.locator("#sessionQuickAddChips button")).toHaveCount(6);
    await expect(page.locator("#sessionExerciseSearchResults")).toHaveAttribute("data-quick-hidden", "true");

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

  test("Workout Plans makes workout name dominant over the date", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await installTrainingSupabaseStub(page);
    await page.goto(`${BASE_URL}/workout-plans.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.AriWorkoutPlanCardHierarchy), null, { timeout: 10000 });

    await page.evaluate(() => {
      const grid = document.getElementById("workoutWeekGrid");
      grid.innerHTML = `
        <article class="workout-day-card" data-type="workout">
          <button class="workout-day-card__button" type="button">
            <div class="workout-day-card__header">
              <span class="workout-day-card__day">MON AUG 10</span>
              <span class="workout-day-card__type">WORKOUT</span>
            </div>
            <h3 class="workout-day-card__title">Back Day</h3>
            <p class="workout-day-card__summary">5 exercises</p>
            <span class="workout-day-card__open">Edit Workout →</span>
          </button>
        </article>
        <article class="workout-day-card" data-type="workout">
          <button class="workout-day-card__button" type="button">
            <div class="workout-day-card__header">
              <span class="workout-day-card__day">WED AUG 12</span>
              <span class="workout-day-card__type">WORKOUT</span>
            </div>
            <h3 class="workout-day-card__title">Endurance</h3>
            <p class="workout-day-card__summary">3 exercises</p>
            <span class="workout-day-card__open">Edit Workout →</span>
          </button>
        </article>
      `;
      window.AriWorkoutPlanCardHierarchy.refresh();
    });

    const cards = page.locator("#workoutWeekGrid .workout-day-card");
    const firstCard = cards.nth(0);
    const enduranceCard = cards.nth(1);

    await expect(firstCard.locator(".workout-day-card__day")).toHaveText("MON • AUG 10");
    await expect(firstCard.locator(".workout-day-card__title")).toHaveText("Back Day");
    await expect(firstCard.locator(".workout-day-card__summary")).toHaveText("5 exercises");
    await expect(firstCard.locator(".workout-day-card__type")).toHaveText("WORKOUT");
    await expect(firstCard).toHaveAttribute("data-plan-kind", "workout");

    await expect(enduranceCard.locator(".workout-day-card__type")).toHaveText("ENDURANCE");
    await expect(enduranceCard).toHaveAttribute("data-plan-kind", "endurance");

    const hierarchy = await firstCard.evaluate((card) => {
      const day = card.querySelector(".workout-day-card__day");
      const title = card.querySelector(".workout-day-card__title");
      const type = card.querySelector(".workout-day-card__type");
      return {
        daySize: parseFloat(getComputedStyle(day).fontSize),
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        railWidth: getComputedStyle(card, "::before").width,
        typeBackground: getComputedStyle(type).backgroundColor
      };
    });

    expect(hierarchy.titleSize).toBeGreaterThan(hierarchy.daySize);
    expect(hierarchy.railWidth).toBe("4px");
    expect(hierarchy.typeBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(pageErrors).toEqual([]);
  });

  test("Edit Training Day is a large readable mobile sheet", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await installTrainingSupabaseStub(page);
    await page.goto(`${BASE_URL}/workout-plans.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.AriWorkoutPlanCardHierarchy), null, { timeout: 10000 });
    await page.waitForFunction(() => Boolean(document.getElementById("ariWorkoutDayEditorMobileStyle")?.sheet), null, { timeout: 10000 });

    await page.evaluate(() => {
      const title = document.getElementById("workoutDayEditorTitle");
      title.textContent = "SUN AUG 9";
      window.AriWorkoutPlanCardHierarchy.refresh();
      document.getElementById("workoutDayEditor")?.showModal();
    });

    const editor = page.locator("#workoutDayEditor");
    await expect(editor).toBeVisible();
    await expect(page.locator("#workoutDayEditorTitle")).toHaveText("SUN • AUG 9");

    const metrics = await editor.evaluate((dialog) => {
      const panel = dialog.querySelector(".workout-dialog__panel");
      const title = dialog.querySelector("#workoutDayEditorTitle");
      const select = dialog.querySelector("#workoutDayType");
      const add = dialog.querySelector("#workoutAddExerciseButton");
      const empty = dialog.querySelector("#workoutDayExerciseEmpty");
      return {
        panelWidth: panel.getBoundingClientRect().width,
        panelMaxHeight: getComputedStyle(panel).maxHeight,
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        selectHeight: select.getBoundingClientRect().height,
        selectSize: parseFloat(getComputedStyle(select).fontSize),
        addHeight: add.getBoundingClientRect().height,
        emptySize: parseFloat(getComputedStyle(empty).fontSize)
      };
    });

    expect(metrics.panelWidth).toBeGreaterThan(360);
    expect(metrics.panelMaxHeight).toBe("708.953px");
    expect(metrics.titleSize).toBeGreaterThanOrEqual(24);
    expect(metrics.selectHeight).toBeGreaterThanOrEqual(56);
    expect(metrics.selectSize).toBe(18);
    expect(metrics.addHeight).toBeGreaterThanOrEqual(52);
    expect(metrics.emptySize).toBeGreaterThanOrEqual(16);
    expect(pageErrors).toEqual([]);
  });
});
