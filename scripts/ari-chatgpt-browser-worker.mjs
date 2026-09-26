#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const VERSION = "1.1.0";
const MODE = String(process.argv[2] || "worker").toLowerCase();
const PROFILE_DIR = resolve(process.env.ARI_CHATGPT_BROWSER_PROFILE_DIR || ".ari-private/chatgpt-profile");
const OWNER_APP_URL = String(process.env.ARI_OWNER_APP_URL || "https://www.calbuddyhealth.com/").trim();
const BRIDGE_URL = String(process.env.ARI_CHATGPT_BROWSER_BRIDGE_URL || "https://www.calbuddyhealth.com/api/ari-chatgpt-browser-worker").trim();
const WORKER_ID = String(process.env.ARI_CHATGPT_BROWSER_WORKER_ID || `owner-browser-${process.platform}`).trim().toLowerCase();
const ONCE = process.argv.includes("--once");

await mkdir(PROFILE_DIR, { recursive: true });
const { chromium } = await loadPlaywright();

if (MODE === "login") {
  await interactiveSetup();
} else if (MODE === "worker") {
  await runWorker();
} else {
  fail("Usage: node scripts/ari-chatgpt-browser-worker.mjs <login|worker> [--once]");
}

async function interactiveSetup() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1320, height: 900 }
  });

  const ownerPage = context.pages()[0] || await context.newPage();
  await ownerPage.goto(OWNER_APP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  process.stdout.write("Sign in to ARI XP in the browser window. This owner session authorizes the local bridge worker.\n");

  try {
    const ownerSession = await waitForAriOwnerSession(ownerPage, 15 * 60 * 1000);
    process.stdout.write(`ARI XP owner session detected for ${ownerSession.userId}.\n`);

    const chatgptPage = await context.newPage();
    attachChatgptNavigationGuard(chatgptPage, { loginMode: true });
    await chatgptPage.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
    process.stdout.write("Now sign in to ChatGPT in this browser window. Ari never receives or stores your ChatGPT password.\n");
    await waitForComposer(chatgptPage, 15 * 60 * 1000);
    process.stdout.write("ARI XP owner session and ChatGPT browser session are both ready.\n");
  } finally {
    await context.close();
  }
}

async function runWorker() {
  if (!/^https:\/\//i.test(BRIDGE_URL)) fail("ARI_CHATGPT_BROWSER_BRIDGE_URL must be HTTPS.");
  if (!/^https:\/\//i.test(OWNER_APP_URL)) fail("ARI_OWNER_APP_URL must be HTTPS.");

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 }
  });

  const ownerPage = context.pages()[0] || await context.newPage();
  await ownerPage.goto(OWNER_APP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  let ownerSession = await waitForAriOwnerSession(ownerPage, 20000).catch(() => null);
  if (!ownerSession?.accessToken) {
    await context.close();
    fail("ARI XP owner session is missing or expired. Run: npm run chatgpt:browser:login");
  }

  const chatgptPage = await context.newPage();
  attachChatgptNavigationGuard(chatgptPage, { loginMode: false });
  let sessionState = await detectChatgptSessionState(chatgptPage);
  process.stdout.write(`ARI ChatGPT browser worker ${VERSION}: owner authenticated, ChatGPT ${sessionState}.\n`);

  const stop = async () => {
    await context.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (true) {
    ownerSession = await refreshAriOwnerSession(ownerPage).catch(() => null);
    if (!ownerSession?.accessToken) {
      process.stderr.write("ARI XP owner session expired. Run the login command again.\n");
      break;
    }

    const claim = await bridgeRequest({
      operation: "claim",
      workerId: WORKER_ID,
      version: VERSION,
      sessionState
    }, ownerSession.accessToken).catch((error) => ({
      success: false,
      error: error?.message || String(error)
    }));

    if (claim?.job) {
      const job = claim.job;
      let result;

      if (sessionState !== "authenticated") {
        result = {
          success: false,
          errorCode: "CHATGPT_LOGIN_REQUIRED",
          errorMessage: "The local ChatGPT browser profile is not authenticated. Run the login command again."
        };
      } else {
        result = await executeDiscussionTurn(chatgptPage, job).catch((error) => ({
          success: false,
          errorCode: error?.code || "CHATGPT_BROWSER_AUTOMATION_FAILED",
          errorMessage: String(error?.message || error).slice(0, 1000)
        }));
      }

      ownerSession = await refreshAriOwnerSession(ownerPage).catch(() => ownerSession);
      await bridgeRequest({
        operation: "complete",
        workerId: WORKER_ID,
        version: VERSION,
        sessionState,
        jobId: job.id,
        leaseToken: job.leaseToken,
        ...result
      }, ownerSession.accessToken).catch((error) => {
        process.stderr.write(`Bridge completion failed: ${error?.message || error}\n`);
      });

      if (result?.errorCode === "CHATGPT_LOGIN_REQUIRED") sessionState = "login_required";
      if (ONCE) break;
      continue;
    }

    if (ONCE) break;
    await sleep(2500);
    sessionState = await detectChatgptSessionState(chatgptPage);
  }

  await context.close();
}

async function executeDiscussionTurn(page, job) {
  const operation = String(job?.operation || "");
  const message = String(job?.message || "").trim().slice(0, 8000);
  if (!message) throw coded("CHATGPT_MESSAGE_EMPTY", "The queued discussion message is empty.");

  const target = operation === "continue"
    ? validateConversationUrl(job?.conversationUrl)
    : "https://chatgpt.com/";

  if (!target) {
    throw coded(
      "CHATGPT_CONVERSATION_URL_INVALID",
      "The stored ChatGPT conversation URL is not a permitted discussion URL."
    );
  }

  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForComposer(page, 20000).catch(() => {
    throw coded(
      "CHATGPT_LOGIN_REQUIRED",
      "ChatGPT did not expose the message composer. Re-authenticate the local browser profile."
    );
  });

  const before = await assistantMessageCount(page);
  await submitMessage(page, message);
  const reply = await waitForAssistantReply(page, before, 120000);
  const conversationUrl = validateConversationUrl(page.url());

  if (!conversationUrl) {
    throw coded("CHATGPT_CONVERSATION_URL_INVALID", "ChatGPT did not return a normal conversation URL.");
  }
  if (!reply) throw coded("CHATGPT_EMPTY_REPLY", "ChatGPT returned no readable assistant message.");

  return {
    success: true,
    responseText: reply.slice(0, 24000),
    conversationUrl
  };
}

async function refreshAriOwnerSession(page) {
  const session = await readAriOwnerSession(page);
  if (session?.accessToken) return session;
  await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
  return readAriOwnerSession(page);
}

async function waitForAriOwnerSession(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = await readAriOwnerSession(page).catch(() => null);
    if (session?.accessToken && session?.userId) return session;
    await sleep(750);
  }
  throw new Error("ARI XP owner session unavailable.");
}

async function readAriOwnerSession(page) {
  return page.evaluate(async () => {
    try {
      let session = null;

      if (window.CalBuddy?.getCurrentSession) {
        session = await window.CalBuddy.getCurrentSession();
      }

      if (!session) {
        const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
        if (client?.auth?.getSession) {
          const result = await client.auth.getSession();
          session = result?.data?.session || null;
        }
      }

      const accessToken = String(session?.access_token || "").trim();
      const userId = String(session?.user?.id || "").trim();
      return accessToken && userId ? { accessToken, userId } : null;
    } catch {
      return null;
    }
  });
}

async function detectChatgptSessionState(page) {
  try {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForComposer(page, 10000);
    return "authenticated";
  } catch {
    return "login_required";
  }
}

async function submitMessage(page, message) {
  const composer = await composerLocator(page);
  await composer.click();

  try {
    await composer.fill(message);
  } catch {
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.insertText(message);
  }

  const send = page.locator('button[data-testid="send-button"], button[aria-label*="Send" i]').first();
  if (await send.count() && await send.isEnabled().catch(() => false)) {
    await send.click();
  } else {
    await page.keyboard.press("Enter");
  }
}

async function waitForAssistantReply(page, baseline, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = "";
  let stable = 0;

  while (Date.now() < deadline) {
    const messages = page.locator('[data-message-author-role="assistant"]');
    const count = await messages.count().catch(() => 0);

    if (count > baseline) {
      const text = String(await messages.nth(count - 1).innerText().catch(() => "")).trim();
      const stopVisible = await page
        .locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]')
        .first()
        .isVisible()
        .catch(() => false);

      if (text && text === last && !stopVisible) stable += 1;
      else stable = 0;

      last = text;
      if (stable >= 2) return text;
    }

    await sleep(750);
  }

  throw coded("CHATGPT_REPLY_TIMEOUT", "Timed out waiting for ChatGPT to finish the discussion turn.");
}

async function waitForComposer(page, timeoutMs) {
  const selectors = [
    '#prompt-textarea',
    '[data-testid="prompt-textarea"]',
    'textarea[placeholder*="Message" i]',
    'div[contenteditable="true"]'
  ];

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible().catch(() => false)) return locator;
    }
    await sleep(500);
  }

  throw new Error("ChatGPT composer unavailable.");
}

async function composerLocator(page) {
  return waitForComposer(page, 15000);
}

async function assistantMessageCount(page) {
  return page.locator('[data-message-author-role="assistant"]').count().catch(() => 0);
}

function attachChatgptNavigationGuard(page, { loginMode }) {
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const raw = frame.url();
    if (!/^https?:/i.test(raw)) return;

    let host = "";
    try { host = new URL(raw).hostname; } catch { return; }

    const allowed =
      host === "chatgpt.com" ||
      (loginMode && (host === "auth.openai.com" || host === "openai.com"));

    if (!allowed) {
      process.stderr.write(`Blocked unexpected ChatGPT top-level navigation: ${host}\n`);
      void page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded" }).catch(() => {});
    }
  });
}

function validateConversationUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.hostname !== "chatgpt.com") return "";
    if (!/^\/c\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)) return "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

async function bridgeRequest(payload, accessToken) {
  const token = String(accessToken || "").trim();
  if (!token) throw new Error("ARI XP owner access token is unavailable.");

  const response = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.code || data?.error || `Bridge HTTP ${response.status}`);
  return data;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    fail("Playwright is not installed. Run: npm install --no-save playwright@1.55.0 && npx playwright install chromium");
  }
}

function coded(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(message) {
  process.stderr.write(String(message) + "\n");
  process.exit(1);
}
