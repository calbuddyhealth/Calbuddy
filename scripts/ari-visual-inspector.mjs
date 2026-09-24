import { chromium } from "@playwright/test";

const requestId = clean(process.env.ARI_VISUAL_REQUEST_ID, 120) || "manual";
const baseUrl = normalizeBaseUrl(process.env.ARI_VISUAL_BASE_URL || "https://www.calbuddyhealth.com");
const targetPath = normalizePath(process.env.ARI_VISUAL_PATH || "/home.html");
const viewportMode = clean(process.env.ARI_VISUAL_VIEWPORTS, 40) || "mobile";
const authMode = clean(process.env.ARI_VISUAL_AUTH_MODE, 40) || "mock_owner";
const actions = parseActions(process.env.ARI_VISUAL_ACTIONS_B64 || "");
const instruction = clean(process.env.ARI_VISUAL_INSTRUCTION, 1200);

const viewports = viewportMode === "both"
  ? [
      { id: "mobile", width: 393, height: 852 },
      { id: "desktop", width: 1440, height: 1000 }
    ]
  : viewportMode === "desktop"
    ? [{ id: "desktop", width: 1440, height: 1000 }]
    : [{ id: "mobile", width: 393, height: 852 }];

const browser = await chromium.launch({ headless: true });
const captures = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "reduce"
    });

    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];

    page.on("pageerror", error => {
      if (consoleErrors.length < 30) consoleErrors.push(`pageerror: ${clean(error?.message, 500)}`);
    });
    page.on("console", msg => {
      if (msg.type() === "error" && consoleErrors.length < 30) {
        consoleErrors.push(`console: ${clean(msg.text(), 500)}`);
      }
    });
    page.on("requestfailed", request => {
      if (failedRequests.length < 30) {
        failedRequests.push({
          url: clean(request.url(), 500),
          method: request.method(),
          error: clean(request.failure()?.errorText, 220)
        });
      }
    });

    if (authMode === "mock_owner") {
      await installReadOnlyOwnerSandbox(page);
    }

    const initialUrl = new URL(targetPath, baseUrl).toString();
    await page.goto(initialUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(900);

    for (const action of actions) {
      await executeSafeAction(page, action);
      await page.waitForTimeout(250);
    }

    const metrics = await collectMetrics(page);
    const interactive = await collectInteractive(page);
    const navigation = await collectNavigation(page);
    const bodyText = clean(await page.locator("body").innerText().catch(() => ""), 6000);
    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: viewport.id === "mobile" ? 48 : 42,
      fullPage: viewport.id === "mobile"
    });

    captures.push({
      viewport,
      url: clean(page.url(), 800),
      title: clean(await page.title().catch(() => ""), 300),
      bodyText,
      metrics,
      interactive,
      navigation,
      consoleErrors,
      failedRequests,
      screenshotDataUrl: `data:image/jpeg;base64,${screenshot.toString("base64")}`
    });

    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  version: "1.0.0",
  requestId,
  generatedAt: new Date().toISOString(),
  baseUrl,
  targetPath,
  instruction,
  authMode,
  actionsApplied: actions,
  captures
};

const encoded = Buffer.from(JSON.stringify(report), "utf8").toString("base64");
console.log(`ARI_VISUAL_RESULT:${encoded}`);

function clean(value, max = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    throw new Error("Invalid visual inspection base URL.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host !== "www.calbuddyhealth.com" &&
    host !== "calbuddyhealth.com" &&
    !host.endsWith(".vercel.app")
  ) {
    throw new Error("Visual inspection base URL is not an allowed ARI XP host.");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizePath(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/")) return "/home.html";
  if (raw.includes("..") || /^\/\//.test(raw)) return "/home.html";
  return raw.slice(0, 500);
}

function parseActions(encoded) {
  if (!encoded) return [];
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const items = JSON.parse(decoded);
    if (!Array.isArray(items)) return [];
    return items.slice(0, 8).map(item => normalizeAction(item)).filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeAction(item = {}) {
  const type = clean(item.type, 40).toLowerCase();
  if (!["click_text", "click_role", "fill_label", "press", "scroll", "wait"].includes(type)) return null;
  return {
    type,
    text: clean(item.text, 180),
    role: clean(item.role, 50),
    name: clean(item.name, 180),
    label: clean(item.label, 180),
    value: clean(item.value, 500),
    key: clean(item.key, 40),
    amount: Math.max(-2000, Math.min(2000, Number(item.amount) || 0)),
    ms: Math.max(0, Math.min(3000, Number(item.ms) || 0))
  };
}

async function executeSafeAction(page, action) {
  if (action.type === "click_text" && action.text) {
    const locator = page.getByText(action.text, { exact: false }).first();
    if (await locator.count()) await locator.click({ timeout: 4000 }).catch(() => {});
    return;
  }
  if (action.type === "click_role" && action.role && action.name) {
    const allowedRoles = new Set(["button", "link", "tab", "menuitem"]);
    if (!allowedRoles.has(action.role)) return;
    const locator = page.getByRole(action.role, { name: action.name, exact: false }).first();
    if (await locator.count()) await locator.click({ timeout: 4000 }).catch(() => {});
    return;
  }
  if (action.type === "fill_label" && action.label) {
    const locator = page.getByLabel(action.label, { exact: false }).first();
    if (await locator.count()) await locator.fill(action.value || "", { timeout: 4000 }).catch(() => {});
    return;
  }
  if (action.type === "press" && action.key) {
    await page.keyboard.press(action.key).catch(() => {});
    return;
  }
  if (action.type === "scroll") {
    await page.evaluate(amount => window.scrollBy(0, amount), action.amount || 600).catch(() => {});
    return;
  }
  if (action.type === "wait") {
    await page.waitForTimeout(action.ms || 500);
  }
}

async function collectMetrics(page) {
  return await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const root = document.documentElement;
    const body = document.body;
    const elements = Array.from(document.querySelectorAll("body *"));
    const offscreen = [];
    const fixedWidthSuspects = [];

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const style = getComputedStyle(element);
      if (
        rect.right > viewportWidth + 1 ||
        rect.left < -1
      ) {
        if (offscreen.length < 25) {
          offscreen.push({
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: String(element.className || "").slice(0, 180),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            position: style.position
          });
        }
      }

      const minWidth = parseFloat(style.minWidth || "0");
      const width = parseFloat(style.width || "0");
      if (
        fixedWidthSuspects.length < 25 &&
        (
          (Number.isFinite(minWidth) && minWidth > viewportWidth + 1) ||
          (Number.isFinite(width) && width > viewportWidth + 1)
        )
      ) {
        fixedWidthSuspects.push({
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: String(element.className || "").slice(0, 180),
          cssWidth: style.width,
          cssMinWidth: style.minWidth
        });
      }
    }

    return {
      viewportWidth,
      viewportHeight,
      scrollWidth: Math.max(root?.scrollWidth || 0, body?.scrollWidth || 0),
      scrollHeight: Math.max(root?.scrollHeight || 0, body?.scrollHeight || 0),
      horizontalOverflow:
        Math.max(root?.scrollWidth || 0, body?.scrollWidth || 0) > viewportWidth + 1,
      overflowPixels:
        Math.max(0, Math.max(root?.scrollWidth || 0, body?.scrollWidth || 0) - viewportWidth),
      offscreen,
      fixedWidthSuspects
    };
  });
}

async function collectInteractive(page) {
  return await page.locator(
    'a,button,input,textarea,select,[role="button"],[role="link"],[role="tab"],[tabindex]'
  ).evaluateAll(nodes => nodes.slice(0, 80).map(node => {
    const rect = node.getBoundingClientRect();
    return {
      tag: node.tagName.toLowerCase(),
      text: String(node.innerText || node.getAttribute("aria-label") || node.getAttribute("placeholder") || "").trim().slice(0, 180),
      id: node.id || null,
      role: node.getAttribute("role") || null,
      href: node.getAttribute("href") || null,
      visible: rect.width > 0 && rect.height > 0
    };
  })).catch(() => []);
}

async function collectNavigation(page) {
  return await page.locator("a[href]").evaluateAll(nodes => {
    const origin = location.origin;
    const seen = new Set();
    const out = [];
    for (const node of nodes) {
      try {
        const url = new URL(node.href, location.href);
        if (url.origin !== origin) continue;
        const key = url.pathname + url.search;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          text: String(node.innerText || node.getAttribute("aria-label") || "").trim().slice(0, 160),
          path: key.slice(0, 400)
        });
        if (out.length >= 50) break;
      } catch {}
    }
    return out;
  }).catch(() => []);
}

async function installReadOnlyOwnerSandbox(page) {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
(() => {
  const user = {
    id: "visual-owner-0001",
    email: "visual-owner@arixp.test",
    user_metadata: { display_name: "ARI Visual Owner" }
  };
  const session = { access_token: "visual-owner-token", user };

  function rowFor(table) {
    if (table === "ari_account_state") {
      return { user_id: user.id, status: "active", setupPending: false };
    }
    if (table === "profiles") {
      return {
        id: user.id,
        email: user.email,
        display_name: "ARI Visual Owner",
        owner_access: true,
        ari_mode: "developer_wonder",
        reset_hour: 4,
        reset_minute: 0,
        reset_ampm: "AM",
        daily_calorie_goal: 2100,
        weight: 185
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
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      updateUser: async () => ({ data: { user }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: table => query(table),
    rpc: async name => ({
      data: /owner|admin/i.test(String(name || "")) ? true : null,
      error: null
    }),
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        upload: async () => ({ data: { path: "visual" }, error: null }),
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

  window.supabase = { createClient: () => client };
})();`
    });
  });

  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (request.method() === "GET" && pathname.includes("ari-owner-intelligence-controls")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          isOwner: true,
          owner_access: true,
          standardAvailable: true,
          advancedAvailable: true
        })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        visualSandbox: true,
        readOnly: true,
        data: []
      })
    });
  });
}
