#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const VERSION = "1.0.0";
const MODE = String(process.argv[2] || "worker").toLowerCase();
const PROFILE_DIR = resolve(process.env.ARI_CHATGPT_BROWSER_PROFILE_DIR || ".ari-private/chatgpt-profile");
const BRIDGE_URL = String(process.env.ARI_CHATGPT_BROWSER_BRIDGE_URL || "https://www.calbuddyhealth.com/api/ari-chatgpt-browser-worker").trim();
const WORKER_SECRET = String(process.env.ARI_CHATGPT_BROWSER_WORKER_SECRET || "").trim();
const WORKER_ID = String(process.env.ARI_CHATGPT_BROWSER_WORKER_ID || `owner-browser-${process.platform}`).trim().toLowerCase();
const ONCE = process.argv.includes("--once");

await mkdir(PROFILE_DIR, { recursive: true });

const { chromium } = await loadPlaywright();

if (MODE === "login") {
  await interactiveLogin();
} else if (MODE === "worker") {
  await runWorker();
} else {
  fail("Usage: node scripts/ari-chatgpt-browser-worker.mjs <login|worker> [--once]");
}

async function interactiveLogin() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1320, height: 900 }
  });
  const page = context.pages()[0] || await context.newPage();
  attachTopLevelNavigationGuard(page, { loginMode: true });
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
  process.stdout.write("Sign in to ChatGPT in the browser window. Ari never receives or stores your password.\n");
  try {
    await waitForComposer(page, 15 * 60 * 1000);
    process.stdout.write("Authenticated ChatGPT browser profile is ready.\n");
  } finally {
    await context.close();
  }
}

async function runWorker() {
  if (!WORKER_SECRET) fail("ARI_CHATGPT_BROWSER_WORKER_SECRET is required.");
  if (!/^https:\/\//i.test(BRIDGE_URL)) fail("ARI_CHATGPT_BROWSER_BRIDGE_URL must be HTTPS.");

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 }
  });
  const page = context.pages()[0] || await context.newPage();
  attachTopLevelNavigationGuard(page, { loginMode: false });

  let sessionState = await detectSessionState(page);
  process.stdout.write(`ARI ChatGPT browser worker ${VERSION}: ${sessionState}.\n`);

  const stop = async () => {
    await context.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (true) {
    const claim = await bridgeRequest({
      operation: "claim",
      workerId: WORKER_ID,
      version: VERSION,
      sessionState
    }).catch((error) => ({ success: false, error: error?.message || String(error) }));

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
        result = await executeDiscussionTurn(page, job).catch((error) => ({
          success: false,
          errorCode: error?.code || "CHATGPT_BROWSER_AUTOMATION_FAILED",
          errorMessage: String(error?.message || error).slice(0, 1000)
        }));
      }

      await bridgeRequest({
        operation: "complete",
        workerId: WORKER_ID,
        version: VERSION,
        sessionState,
        jobId: job.id,
        leaseToken: job.leaseToken,
        ...result
      }).catch((error) => {
        process.stderr.write(`Bridge completion failed: ${error?.message || error}\n`);
      });

      if (result?.errorCode === "CHATGPT_LOGIN_REQUIRED") sessionState = "login_required";
      if (ONCE) break;
      continue;
    }

    if (ONCE) break;
    await sleep(2500);
    sessionState = await detectSessionState(page);
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

  if (!target) throw coded("CHATGPT_CONVERSATION_URL_INVALID", "The stored ChatGPT conversation URL is not a permitted discussion URL.");

  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForComposer(page, 20000).catch(() => {
    throw coded("CHATGPT_LOGIN_REQUIRED", "ChatGPT did not expose the message composer. Re-authenticate the local browser profile.");
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

async function detectSessionState(page) {
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
      const stopVisible = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').first().isVisible().catch(() => false);
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

function attachTopLevelNavigationGuard(page, { loginMode }) {
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const raw = frame.url();
    if (!/^https?:/i.test(raw)) return;
    let host = "";
    try { host = new URL(raw).hostname; } catch { return; }
    const allowed = host === "chatgpt.com" || (loginMode && (host === "auth.openai.com" || host === "openai.com"));
    if (!allowed) {
      process.stderr.write(`Blocked unexpected top-level navigation: ${host}\n`);
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

async function bridgeRequest(payload) {
  const response = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WORKER_SECRET}`,
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
