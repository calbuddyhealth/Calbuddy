// =====================================================
// ARI XP
// File: js/ari-latency-hotfix.js
// Version: 1.0.0
// Purpose:
//   Keep ordinary Ari conversation off legacy blocking app hydration.
//   - Capture the message before Home clears the composer.
//   - Use lightweight local personalization for ordinary conversation/advice.
//   - Preserve authoritative hydration for explicit personal ledger/mutation work.
//   - Never make ordinary chat wait for browser GitHub owner verification.
//   - Clear stale cross-document pending turns so refresh does not auto-resend.
//   - Suppress the heavy automatic initiative scan on Home until it has a
//     dedicated lightweight signal path.
// =====================================================

(() => {
  "use strict";

  const PENDING_KEY = "arixp_pending_ari_turn_v1";
  const MESSAGE_TTL_MS = 60_000;
  const CalBuddy = window.CalBuddy;
  if (!CalBuddy) return;

  let activeMessage = "";
  let activeMessageExpiresAt = 0;

  function clean(value = "") {
    return String(value || "").trim();
  }

  function setActiveMessage(message = "") {
    const text = clean(message);
    if (!text) return;
    activeMessage = text;
    activeMessageExpiresAt = Date.now() + MESSAGE_TTL_MS;
    window.__ariLatencyTurnMessage = text;
  }

  function currentMessage() {
    if (!activeMessage || activeMessageExpiresAt <= Date.now()) return "";
    return activeMessage;
  }

  function captureComposerMessage() {
    const input = document.getElementById("ariInput");
    if (input?.value) setActiveMessage(input.value);
  }

  function isDeveloperMessage(message = "") {
    const text = clean(message).toLowerCase();
    return /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|code|file|debug|developer|api|database|sql)\b/.test(text);
  }

  function needsAuthoritativeAppContext(message = "") {
    const text = clean(message).toLowerCase();
    if (!text) return true;

    const mutation = /\b(log|add|save|record|edit|delete|remove|change|update|undo|complete|mark|replace|clear|cancel)\b/.test(text);
    const personalState = /\b(my|mine|today|tonight|this morning|this afternoon|left|remaining|logged|ate|eaten|consumed|burned|current|goal|history|recent)\b/.test(text);
    const appDomain = /\b(calorie|calories|meal|meals|food|macro|macros|protein|carb|carbs|fat|nutrition|weight|weigh|goal|goals|activity|workout|training|exercise)\b/.test(text);
    const exactLedgerQuestion = /\b(what did i eat|what have i eaten|how many calories (?:do i have|are) left|calories left|what did i log|what have i logged)\b/.test(text);

    // Generic coaching/advice should not wait on the whole application ledger.
    // Explicit mutations and questions about the user's actual stored state do.
    return exactLedgerQuestion || (appDomain && (mutation || personalState));
  }

  function readJson(key, fallback = {}) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function localNumber(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number) && number !== 0) return number;
    }
    return 0;
  }

  async function buildLightContext() {
    const goals = readJson("calbuddyGoals", {});
    const session = await CalBuddy.getCurrentSession?.().catch?.(() => null) || null;
    const dailyGoal = localNumber(
      localStorage.getItem("calbuddyDailyCalorieGoal"),
      goals.calorieGoal,
      2100
    ) || 2100;
    const caloriesConsumed = localNumber(localStorage.getItem("calbuddyCaloriesConsumed"));
    const caloriesBurned = localNumber(localStorage.getItem("calbuddyCaloriesBurned"));

    return {
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      dailyGoal,
      caloriesConsumed,
      caloriesBurned,
      caloriesLeft: Math.max(dailyGoal - caloriesConsumed + caloriesBurned, 0),
      currentWeight:
        localStorage.getItem("calbuddyCurrentWeight") ||
        localStorage.getItem("calbuddyLatestWeight") ||
        goals.weight ||
        null,
      goalWeight:
        localStorage.getItem("calbuddyGoalWeight") ||
        goals.targetWeight ||
        null,
      height: localStorage.getItem("calbuddy_height_in") || goals.height || null,
      age: localStorage.getItem("calbuddy_age") || goals.age || null,
      gender: localStorage.getItem("calbuddy_sex") || goals.sex || null,
      activityLevel: localStorage.getItem("calbuddy_activity_level") || goals.activity || null,
      goalType: localStorage.getItem("calbuddy_goal") || goals.goalMode || null,
      mealsToday: [],
      recentMeals: [],
      favoriteFoods: [],
      recentWeights: [],
      ownerVerified: CalBuddy.ownerSessionCache?.isOwner === true,
      ownerMode: CalBuddy.ownerSessionCache?.isOwner === true,
      profile: {},
      contextSource: "ari_light_chat_v1"
    };
  }

  const originalGetUserContext =
    typeof CalBuddy.getUserContext === "function"
      ? CalBuddy.getUserContext.bind(CalBuddy)
      : null;

  if (originalGetUserContext) {
    CalBuddy.getUserContext = async function (...args) {
      const message = currentMessage();
      if (!message || needsAuthoritativeAppContext(message)) {
        return await originalGetUserContext(...args);
      }

      const startedAt = performance.now();
      const context = await buildLightContext();
      window.dispatchEvent(new CustomEvent("ari:clientContextTiming", {
        detail: {
          mode: "light",
          elapsedMs: Math.round(performance.now() - startedAt),
          messageLength: message.length
        }
      }));
      return context;
    };
  }

  const originalVerifyOwnerSession =
    typeof CalBuddy.verifyOwnerSession === "function"
      ? CalBuddy.verifyOwnerSession.bind(CalBuddy)
      : null;

  if (originalVerifyOwnerSession) {
    CalBuddy.verifyOwnerSession = async function (options = {}) {
      const message = currentMessage();
      if (message && !isDeveloperMessage(message)) {
        return CalBuddy.ownerSessionCache?.isOwner === true;
      }
      return await originalVerifyOwnerSession(options);
    };
  }

  // Capture before the inline Home handlers clear the textarea.
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.("#ariSendBtn")) captureComposerMessage();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.target?.id === "ariInput" && event.key === "Enter" && !event.shiftKey) {
      captureComposerMessage();
    }
  }, true);

  // A new document load must never silently resend the prior document's turn.
  // The server-side idempotency ledger still protects any request that finished.
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
  try { window.setAriComposerThinking?.(false); } catch {}
  try { window.finishAriThinkingSequence?.(); } catch {}

  function suppressInitiativeClient(client) {
    if (!client || typeof client !== "object" || client.__homeLatencySuppressed) return client;
    client.__homeLatencySuppressed = true;
    client.check = async function () {
      const result = {
        success: true,
        shouldInitiate: false,
        reason: "home_latency_guard",
        cost: { languageModelCalls: 0 },
        source: "ari_home_latency_hotfix"
      };
      window.dispatchEvent(new CustomEvent("ari:vnextInitiativeQuiet", { detail: result }));
      return result;
    };
    return client;
  }

  if (window.AriVNextInitiative) {
    suppressInitiativeClient(window.AriVNextInitiative);
  } else {
    const existing = Object.getOwnPropertyDescriptor(window, "AriVNextInitiative");
    if (!existing) {
      Object.defineProperty(window, "AriVNextInitiative", {
        configurable: true,
        enumerable: true,
        get() { return undefined; },
        set(value) {
          const patched = suppressInitiativeClient(value);
          Object.defineProperty(window, "AriVNextInitiative", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: patched
          });
        }
      });
    }
  }

  window.AriLatencyHotfix = Object.freeze({
    version: "1.0.0",
    setActiveMessage,
    currentMessage,
    needsAuthoritativeAppContext
  });
})();
