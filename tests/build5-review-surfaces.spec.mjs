import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ARI_SMOKE_BASE_URL || "http://127.0.0.1:4173";

test("Current review surfaces expose legal, safety and moderated Circle controls", async ({ browser }) => {
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
      controls: ["#feedPostBody", "#publishPostButton"],
      moderation: 'script[src*="js/ari-circle/content-moderation.js"]'
    },
    {
      path: "ari-circle-messages.html",
      controls: ["#messageInput", "#sendMessageButton"],
      moderation: 'script[src*="js/ari-circle/content-moderation.js"]'
    },
    {
      path: "ari-circle-meetup.html",
      controls: ["#hostMeetupButton", "#hostMeetupForm"],
      moderation: 'script[src*="js/ari-circle/real-world-moderation-v5.js"]'
    },
    {
      path: "ari-circle-quests.html",
      controls: ["#createQuestButton", "#createQuestForm"],
      moderation: 'script[src*="js/ari-circle/real-world-moderation-v5.js"]'
    }
  ];

  for (const surface of circlePages) {
    await page.goto(`${BASE_URL}/${surface.path}`, { waitUntil: "domcontentloaded" });

    for (const selector of surface.controls) {
      await expect(page.locator(selector)).toHaveCount(1);
    }

    await expect(page.locator(surface.moderation)).toHaveCount(1);
  }

  await context.close();
});
