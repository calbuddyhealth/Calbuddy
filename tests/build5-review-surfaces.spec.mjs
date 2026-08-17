import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

test("Build 5 review surfaces expose legal, safety and moderated Circle controls", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  });
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

  const circlePages = [
    {
      path: "ari-circle-feed.html",
      controls: ["#feedPostBody", "#publishPostButton"]
    },
    {
      path: "ari-circle-messages.html",
      controls: ["#messageInput", "#sendMessageButton"]
    },
    {
      path: "ari-circle-challenges.html",
      controls: ["#openCreateChallenge", "#challengeEntryMediaInput"]
    }
  ];

  for (const surface of circlePages) {
    await page.goto(`${BASE_URL}/${surface.path}`, { waitUntil: "domcontentloaded" });

    for (const selector of surface.controls) {
      await expect(page.locator(selector)).toHaveCount(1);
    }

    const moderationScripts = page.locator('script[src*="js/ari-circle/content-moderation.js"]');
    await expect(moderationScripts).toHaveCount(1);
  }

  await context.close();
});
