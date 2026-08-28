import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

async function installSupabaseStub(page) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
(() => {
  const user = {
    id: "circle-menu-smoke-user",
    email: "circle-menu@arixp.test",
    user_metadata: {
      display_name: "Circle Menu Smoke",
      ari_ai_processing_consent: true,
      ari_ai_processing_consent_version: "2",
      ari_ai_processing_consented_at: "2026-08-14T00:00:00.000Z"
    }
  };
  const session = { access_token: "circle-menu-smoke-token", user };
  const adultCircleState = {
    verified: true,
    age_band: "adult",
    teen_mode: false,
    circle_allowed: true,
    circle_minimum_age: 18,
    partner_mode: "adult",
    policy: "adults_only_v1"
  };

  function query() {
    const q = {
      select() { return q; }, eq() { return q; }, neq() { return q; }, in() { return q; },
      is() { return q; }, or() { return q; }, match() { return q; }, gte() { return q; },
      lte() { return q; }, gt() { return q; }, lt() { return q; }, order() { return q; },
      range() { return q; }, limit() { return q; }, insert() { return q; }, update() { return q; },
      upsert() { return q; }, delete() { return q; },
      single() { return Promise.resolve({ data: null, error: null }); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
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
    from: () => query(),
    rpc: async (name) => {
      if (name === "ari_circle_my_age_state") return { data: adultCircleState, error: null };
      if (name === "ari_circle_my_age_band") return { data: "adult", error: null };
      if (name === "ari_circle_current_user_is_adult") return { data: true, error: null };
      if (name === "ari_circle_list_meetups") return { data: [], error: null };
      if (name === "ari_circle_xp_summary") return { data: { total_xp: 0, today_xp: 0, week_xp: 0, level: 1, level_progress_xp: 0, verified_meetups: 0, successful_hosts: 0, leadership_tier: "new_host" }, error: null };
      if (name === "ari_circle_profile_xp_activity") return { data: [], error: null };
      return { data: null, error: null };
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
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

test.describe("ARI Circle premium control drawer", () => {
  test("opens Circle controls and keeps ARI Next hidden from a normal member", async ({ page }) => {
    await installSupabaseStub(page);
    await page.goto(`${BASE_URL}/ari-circle-feed.html`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(() => Boolean(window.AriCircleMenuV5 && window.AriCircleV5RealWorld), null, { timeout: 10000 });

    await page.evaluate(() => {
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close?.());
      const feed = document.getElementById("feedPage");
      if (feed) feed.hidden = false;
      window.AriCircleMenuV5?.refresh?.();
      window.AriCircleV5RealWorld?.refresh?.();
    });

    const details = page.locator("details.circle-v4-menu").first();
    await expect(details.locator("summary")).toBeVisible();
    await details.locator("summary").click();

    let panelId = await details.getAttribute("data-circle-menu-panel-id");
    expect(panelId).toBeTruthy();
    let panel = page.locator(`#${panelId}`);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".circle-v5-menu__identity strong")).toHaveText("ARI CIRCLE");
    await expect(panel.locator(".circle-v5-menu__identity small")).toHaveText("Circle controls");
    await expect(panel.locator(".circle-v5-menu__label")).toHaveText([
      "Notifications",
      "Profile",
      "Discover Friends",
      "Profile Options",
      "Privacy & Visibility",
      "Circle Safety",
      "Exit ARI Circle"
    ]);
    await expect(panel.getByText("Find People", { exact: true })).toHaveCount(0);
    await expect(panel.getByText("Buddies", { exact: true })).toHaveCount(0);
    await expect(panel.getByText("Meet Up", { exact: true })).toHaveCount(0);

    const dock = page.locator("#ariCircleV5BottomNav .circle-v5-bottom-nav__dock");
    await expect(dock).toBeVisible();
    await expect(dock.locator("a span")).toHaveText(["Feed", "Connect"]);
    await expect(dock.locator('a[href="ari-circle-feed.html"]')).toHaveCount(1);
    await expect(dock.locator('a[href="ari-circle-meetup.html"]')).toHaveCount(1);
    await expect(dock.locator('a[href="ari-circle-v6.html"]')).toHaveCount(0);
    await expect(dock.locator('a[href="ari-circle-quests.html"]')).toHaveCount(0);

    const geometry = await panel.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const header = document.querySelector(".circle-v51-halo-header");
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: innerHeight,
        radius: parseFloat(style.borderTopLeftRadius || "0"),
        parentTag: node.parentElement?.tagName || "",
        headerPosition: header ? getComputedStyle(header).position : ""
      };
    });
    expect(geometry.width).toBeGreaterThan(300);
    expect(geometry.height).toBeGreaterThan(300);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.radius).toBeGreaterThanOrEqual(25);
    expect(geometry.parentTag).toBe("BODY");
    expect(geometry.headerPosition).toBe("sticky");

    await page.evaluate(() => {
      const menu = document.querySelector("details.circle-v4-menu");
      if (!menu) return;
      menu.innerHTML = `<summary class="feed-icon-button">☰</summary><nav class="circle-v4-menu__panel"><a href="#"><span>Notifications</span><small>Activity</small></a></nav>`;
      window.AriCircleMenuV5?.refresh?.();
    });

    panelId = await details.getAttribute("data-circle-menu-panel-id");
    expect(panelId).toBeTruthy();
    panel = page.locator(`#${panelId}`);
    await expect(panel.locator(".circle-v5-menu__identity")).toBeVisible({ timeout: 3000 });
    await expect(panel.getByText("Discover Friends", { exact: true })).toBeVisible();
    await expect(panel.getByText("Meet Up", { exact: true })).toHaveCount(0);

    await page.evaluate(() => {
      const dialog = document.createElement("dialog");
      dialog.id = "circle-notifications-dialog";
      dialog.innerHTML = `<div class="circle-notifications-toolbar"><button id="circle-notifications-mark-all">Clear</button></div>`;
      document.body.append(dialog);
      window.AriCircleMenuV5?.refresh?.();
    });

    const settings = page.locator("#circle-notifications-dialog .circle-notifications-settings-link");
    await expect(settings).toHaveAttribute("href", "notification-settings.html");
    await expect(settings).toContainText("Settings");
  });

  test("Profile critical data is not blocked by slow social background collections", async ({ page }) => {
    await installSupabaseStub(page);
    await page.route("**/js/ari-circle/index.js*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/javascript", body: "export default {};" });
    });

    await page.goto(`${BASE_URL}/ari-circle.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__ariCircleProfileBootAcceleratorInstalled === true);

    const result = await page.evaluate(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = { topFinished: false, loveFinished: false, viewerFinished: false, realtimeRefreshes: 0, topWrites: 0, loveWrites: 0 };
      const store = { setTopCircle() { state.topWrites += 1; }, setLoveState() { state.loveWrites += 1; } };
      const api = {
        async resolveProfile() { return { user_id: "profile-user", display_name: "Fast Profile", top_circle_limit: 6 }; },
        async getConnection() { return { id: "connection-1", status: "accepted" }; },
        async getTopCircle() { await delay(240); state.topFinished = true; return []; },
        async getLove() { await delay(260); state.loveFinished = true; return { items: [], total: 0, hasMore: false }; },
        async loadCircleBundle() { throw new Error("legacy bundle should have been replaced"); }
      };
      const app = {
        state: { ready: false },
        modules: { CircleApi: api, CircleStore: store },
        async loadViewerData() { await delay(280); state.viewerFinished = true; return { conversations: [], notifications: [], connectionRequests: [], connections: [] }; },
        async connectRealtime() { state.realtimeRefreshes += 1; return true; }
      };
      window.AriCircleApp = app;
      const started = performance.now();
      const bundle = await app.modules.CircleApi.loadCircleBundle({ viewerUserId: "viewer-user", profileUserId: "profile-user" });
      const viewerPlaceholder = await app.loadViewerData("viewer-user");
      const criticalElapsed = performance.now() - started;
      app.state.ready = true;
      await delay(380);
      return { criticalElapsed, profileName: bundle?.profile?.display_name, placeholderConversations: viewerPlaceholder?.conversations?.length, ...state };
    });

    expect(result.profileName).toBe("Fast Profile");
    expect(result.criticalElapsed).toBeLessThan(160);
    expect(result.placeholderConversations).toBe(0);
    expect(result.topFinished).toBe(true);
    expect(result.loveFinished).toBe(true);
    expect(result.viewerFinished).toBe(true);
    expect(result.topWrites).toBe(1);
    expect(result.loveWrites).toBe(1);
    expect(result.realtimeRefreshes).toBeGreaterThanOrEqual(1);
  });
});