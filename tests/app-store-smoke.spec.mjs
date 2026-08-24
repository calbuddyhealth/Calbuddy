import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

function collectBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

async function installAppStubs(page) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
(() => {
  const user = {
    id: "smoke-user-0001",
    email: "smoke@arixp.test",
    user_metadata: { display_name: "Smoke Test" }
  };

  let session = {
    access_token: "smoke-access-token",
    user
  };

  function isGuestPage() {
    const path = String(location.pathname || "").toLowerCase();
    return path.endsWith("/signin.html") || window.__ARI_SMOKE_FORCE_GUEST === true;
  }

  function rowFor(table) {
    if (table === "ari_account_state") {
      return { user_id: user.id, status: "active", setupPending: false };
    }
    if (table === "profiles") {
      return {
        id: user.id,
        email: user.email,
        display_name: "Smoke Test",
        reset_hour: 4,
        reset_minute: 0,
        reset_ampm: "AM",
        daily_calorie_goal: 2100
      };
    }
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
      then(resolve, reject) {
        return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject);
      }
    };
    return q;
  }

  const client = {
    auth: {
      getSession: async () => ({
        data: { session: isGuestPage() ? null : session },
        error: null
      }),
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      updateUser: async ({ data = {}, email } = {}) => {
        if (email) user.email = email;
        if (data && typeof data === "object") {
          user.user_metadata = { ...(user.user_metadata || {}), ...data };
        }
        session = { ...session, user };
        return { data: { user }, error: null };
      },
      signInWithPassword: async () => ({ data: { session, user }, error: null }),
      signUp: async () => ({ data: { session: null, user }, error: null }),
      resend: async () => ({ data: {}, error: null }),
      verifyOtp: async () => ({ data: { session, user }, error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (table) => query(table),
    rpc: async (name) => ({
      data: name === "is_ari_admin" ? false : null,
      error: null
    }),
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        upload: async () => ({ data: { path: "smoke" }, error: null }),
        remove: async () => ({ data: [], error: null })
      })
    },
    channel: () => ({
      on() { return this; },
      subscribe() { return this; },
      unsubscribe() {}
    }),
    removeChannel() {}
  };

  window.supabase = {
    createClient: () => client
  };
})();`
    });
  });

  await page.route("**/api/profile", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = request.postDataJSON?.() || {};
      if (body.action === "submit_support_request") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, reference: "SMOKE-1234" })
        });
      }
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true })
    });
  });

  await page.route("**/api/ari-github-read", (route) => route.fulfill({
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({ success: false, isOwner: false })
  }));

  await page.route("**/api/ari-conversation", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, reply: "Smoke test reply." })
  }));

  await page.route("**/api/knowledge", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, answer: "Smoke test knowledge reply." })
  }));
}

test.describe("ARI XP App Store browser smoke", () => {
  test("signup age gate advances to account details for an adult", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await installAppStubs(page);

    await page.goto(`${BASE_URL}/signin.html`, { waitUntil: "domcontentloaded" });
    await page.locator("#showSignupBtn").click();

    await page.locator("#birthMonth").fill("01");
    await page.locator("#birthDay").fill("01");
    await page.locator("#birthYear").fill("2000");
    await page.locator("#ageContinueBtn").click();

    await expect(page.locator("#signupDetailsStep")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("signed-out Help & Safety submits through the guest support path", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.addInitScript(() => {
      window.__ARI_SMOKE_FORCE_GUEST = true;
    });
    await installAppStubs(page);

    let submittedBody = null;
    await page.route("**/api/profile", async (route) => {
      submittedBody = route.request().postDataJSON?.() || {};
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reference: "SMOKE-1234" })
      });
    });

    await page.goto(`${BASE_URL}/help-safety.html`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("arixpcircle@gmail.com")).toBeVisible();
    await expect(page.locator('a[href="mailto:arixpcircle@gmail.com"]')).toHaveCount(1);
    await expect(page.locator("#reportStatus")).toContainText("without signing in");

    await page.locator("#reportDetails").fill("Smoke test support request with enough detail.");
    await page.locator("#reportEmail").fill("smoke@example.com");
    await page.locator("#submitReportButton").click();

    await expect(page.locator("#reportStatus")).toContainText("SMOKE-1234");
    expect(submittedBody?.action).toBe("submit_support_request");
    expect(submittedBody?.email).toBe("smoke@example.com");
    expect(errors).toEqual([]);
  });

  test("signed-in Help & Safety preserves session authentication on support requests", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await installAppStubs(page);

    let submittedBody = null;
    let authorization = "";

    await page.route("**/api/profile", async (route) => {
      const request = route.request();
      submittedBody = request.postDataJSON?.() || {};
      authorization = request.headers().authorization || "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reference: "SIGNED-1234" })
      });
    });

    await page.goto(`${BASE_URL}/help-safety.html`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("#reportEmail")).toHaveValue("smoke@arixp.test");
    await page.locator("#reportDetails").fill("Signed-in smoke test support request with enough detail.");
    await page.locator("#submitReportButton").click();

    await expect(page.locator("#reportStatus")).toContainText("SIGNED-1234");
    expect(submittedBody?.action).toBe("submit_support_request");
    expect(submittedBody?.email).toBe("smoke@arixp.test");
    expect(authorization).toBe("Bearer smoke-access-token");
    expect(errors).toEqual([]);
  });

  test("web Support ARI keeps Cash App and Venmo on the website", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await installAppStubs(page);

    await page.goto(`${BASE_URL}/support-ari.html`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("#webSupportPanel")).toBeVisible();
    await expect(page.locator("#cashAppSupportButton")).toBeVisible();
    await expect(page.locator("#venmoSupportButton")).toBeVisible();
    await expect(page.locator("#nativeTipPanel")).toBeHidden();
    await expect(page.locator("#nativeSupportUnavailablePanel")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("native shell without StoreKit hides external payment methods", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.addInitScript(() => {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => "ios"
      };
    });
    await installAppStubs(page);

    await page.goto(`${BASE_URL}/support-ari.html`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("#nativeSupportUnavailablePanel")).toBeVisible();
    await expect(page.locator("#nativeSupportUnavailablePanel")).toContainText("not available in this iOS version");
    await expect(page.locator("#webSupportPanel")).toBeHidden();
    await expect(page.locator("#cashAppSupportButton")).toBeHidden();
    await expect(page.locator("#venmoSupportButton")).toBeHidden();
    await expect(page.locator("#nativeTipPanel")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("AI consent can be declined and then enabled without duplicate dialogs", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await installAppStubs(page);

    await page.goto(`${BASE_URL}/home.html`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("#ariAiConsentDialog")).toHaveCount(1);
    await expect(page.locator("#ariAiConsentDialog")).toBeVisible();
    await expect(page.locator("#ariInput")).toBeDisabled();
    await expect(page.locator("#ariSendBtn")).toBeDisabled();

    await page.locator("#ariAiConsentLater").click();
    await expect(page.locator("#ariAiConsentDialog")).not.toBeVisible();
    await expect(page.locator("#ariInput")).toBeDisabled();

    await page.evaluate(() => window.AriAIConsent.show());
    await expect(page.locator("#ariAiConsentDialog")).toBeVisible();
    await page.locator("#ariAiConsentAllow").click();

    await expect(page.locator("#ariAiConsentDialog")).not.toBeVisible();
    await expect(page.locator("#ariInput")).toBeEnabled();
    await expect(page.locator("#ariSendBtn")).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test("account deletion UI requires typing DELETE before scheduling", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await installAppStubs(page);

    await page.goto(`${BASE_URL}/account.html`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("#userEmail")).toHaveText("smoke@arixp.test");
    await page.locator("#accountControlToggle").click();
    await expect(page.locator("#accountControlContent")).toBeVisible();

    await page.locator("#deleteAccountButton").click();
    await expect(page.locator("#deleteDialog")).toBeVisible();
    await expect(page.locator("#confirmDeleteButton")).toBeDisabled();

    await page.locator("#deleteConfirmInput").fill("DELETE");
    await expect(page.locator("#confirmDeleteButton")).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test("review-critical public and current Circle surfaces render expected controls", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    const publicPages = [
      ["support-ari.html", "Support ARI XP"],
      ["privacy.html", "Privacy Notice"],
      ["terms.html", "Terms of Use"],
      ["community-guidelines.html", "Community guidelines"]
    ];

    for (const [path, expected] of publicPages) {
      await page.goto(`${BASE_URL}/${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(expected, { exact: false }).first()).toBeVisible();
      await expect(page.getByText("arixpcircle@gmail.com")).toBeVisible();
    }

    await page.goto(`${BASE_URL}/ari-circle-feed.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#feedPostBody")).toHaveCount(1);
    await expect(page.locator("#publishPostButton")).toHaveCount(1);
    await expect(page.locator('script[src*="content-moderation.js?v=1.4.0"]')).toHaveCount(1);
    await expect(page.locator('a[href="ari-circle-meetup.html"]')).toHaveCount(1);
    await expect(page.locator('a[href="ari-circle-quests.html"]')).toHaveCount(1);

    await page.goto(`${BASE_URL}/ari-circle-messages.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#messageInput")).toHaveCount(1);
    await expect(page.locator("#sendMessageButton")).toHaveCount(1);
    await expect(page.locator('script[src*="content-moderation.js?v=1.4.0"]')).toHaveCount(1);

    await page.goto(`${BASE_URL}/ari-circle-meetup.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#hostMeetupButton")).toHaveCount(1);
    await expect(page.locator("#hostMeetupForm")).toHaveCount(1);
    await expect(page.locator('script[src*="real-world-moderation-v5.js?v=5.0.0"]')).toHaveCount(1);

    await page.goto(`${BASE_URL}/ari-circle-quests.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#createQuestButton")).toHaveCount(1);
    await expect(page.locator("#createQuestForm")).toHaveCount(1);
    await expect(page.locator('script[src*="real-world-moderation-v5.js?v=5.0.0"]')).toHaveCount(1);

    await context.close();
  });
});