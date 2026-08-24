// =====================================================
// ARI XP
// File: js/ari-latency-hotfix.js
// Version: 1.1.0
// Purpose:
//   Keep ordinary Ari conversation off legacy blocking app hydration without
//   allowing stale browser state to become authoritative personal context.
//   - Capture the message before Home clears the composer.
//   - Use one lightweight, user-scoped Supabase profile read for identity/goals.
//   - Treat localStorage only as a fallback when live profile data is unavailable.
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
    const ledgerDomain = /\b(calorie|calories|meal|meals|food|macro|macros|protein|carb|carbs|fat|nutrition|weight|weigh|goal|goals|activity)\b/.test(text);
    const exactLedgerQuestion = /\b(what did i eat|what have i eaten|how many calories (?:do i have|are) left|calories left|what did i log|what have i logged)\b/.test(text);

    // Generic coaching/advice and Training-only questions should not wait on
    // Nutrition/profile/weight hydration. Canonical Training context is loaded
    // independently by AriVNextBridge when the message is about Training.
    return exactLedgerQuestion || (ledgerDomain && (mutation || personalState));
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

  function ageFromBirthday(value) {
    const raw = clean(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [year, month, day] = raw.split("-").map(Number);
    const now = new Date();
    let age = now.getFullYear() - year;
    const beforeBirthday =
      now.getMonth() + 1 < month ||
      (now.getMonth() + 1 === month && now.getDate() < day);
    if (beforeBirthday) age -= 1;
    return age >= 0 && age <= 130 ? age : null;
  }

  async function loadLiveProfile(session) {
    const userId = clean(session?.user?.id);
    const client = window.calbuddySupabase || window.supabaseClient || CalBuddy.supabase;
    if (!userId || !client?.from) return {};

    try {
      const { data, error } = await client
        .from("profiles")
        .select("id,name,display_name,age,birthday,height_in,height,weight_lbs,current_weight,target_weight_lbs,goal_weight,daily_calorie_goal,sex,gender,activity_level,goal,goal_type,weekly_weight_change_goal")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.warn("Ari lightweight profile read unavailable:", error.message);
        return {};
      }
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      console.warn("Ari lightweight profile read failed:", error?.message || error);
      return {};
    }
  }

  function syncLocalProfileFallback(profile = {}) {
    const mappings = [
      ["calbuddyCurrentWeight", profile.weight_lbs ?? profile.current_weight],
      ["calbuddyLatestWeight", profile.weight_lbs ?? profile.current_weight],
      ["calbuddyGoalWeight", profile.target_weight_lbs ?? profile.goal_weight],
      ["calbuddyDailyCalorieGoal", profile.daily_calorie_goal],
      ["calbuddy_height_in", profile.height_in ?? profile.height],
      ["calbuddy_age", ageFromBirthday(profile.birthday) ?? profile.age],
      ["calbuddy_sex", profile.sex ?? profile.gender],
      ["calbuddy_activity_level", profile.activity_level],
      ["calbuddy_goal", profile.goal ?? profile.goal_type]
    ];
    for (const [key, value] of mappings) {
      if (value === null || value === undefined || value === "") continue;
      try { localStorage.setItem(key, String(value)); } catch {}
    }
  }

  async function buildLightContext() {
    const goals = readJson("calbuddyGoals", {});
    let session = null;
    try {
      session = await CalBuddy.getCurrentSession?.();
    } catch {}

    const profile = await loadLiveProfile(session);
    const profileLoaded = Boolean(profile?.id);
    if (profileLoaded) syncLocalProfileFallback(profile);

    const dailyGoal = localNumber(
      profile.daily_calorie_goal,
      localStorage.getItem("calbuddyDailyCalorieGoal"),
      goals.calorieGoal,
      2100
    ) || 2100;
    const caloriesConsumed = localNumber(localStorage.getItem("calbuddyCaloriesConsumed"));
    const caloriesBurned = localNumber(localStorage.getItem("calbuddyCaloriesBurned"));
    const liveAge = ageFromBirthday(profile.birthday) ?? localNumber(profile.age);

    return {
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      name: profile.display_name || profile.name || null,
      dailyGoal,
      caloriesConsumed,
      caloriesBurned,
      caloriesLeft: Math.max(dailyGoal - caloriesConsumed + caloriesBurned, 0),
      currentWeight:
        profile.weight_lbs ??
        profile.current_weight ??
        localStorage.getItem("calbuddyCurrentWeight") ??
        localStorage.getItem("calbuddyLatestWeight") ??
        goals.weight ??
        null,
      goalWeight:
        profile.target_weight_lbs ??
        profile.goal_weight ??
        localStorage.getItem("calbuddyGoalWeight") ??
        goals.targetWeight ??
        null,
      height:
        profile.height_in ??
        profile.height ??
        localStorage.getItem("calbuddy_height_in") ??
        goals.height ??
        null,
      age:
        liveAge ||
        localStorage.getItem("calbuddy_age") ||
        goals.age ||
        null,
      gender:
        profile.sex ??
        profile.gender ??
        localStorage.getItem("calbuddy_sex") ??
        goals.sex ??
        null,
      activityLevel:
        profile.activity_level ??
        localStorage.getItem("calbuddy_activity_level") ??
        goals.activity ??
        null,
      goalType:
        profile.goal ??
        profile.goal_type ??
        localStorage.getItem("calbuddy_goal") ??
        goals.goalMode ??
        null,
      weeklyWeightChangeGoal: profile.weekly_weight_change_goal ?? null,
      mealsToday: [],
      recentMeals: [],
      favoriteFoods: [],
      recentWeights: [],
      ownerVerified: CalBuddy.ownerSessionCache?.isOwner === true,
      ownerMode: CalBuddy.ownerSessionCache?.isOwner === true,
      profile,
      authoritativeProfileLoaded: profileLoaded,
      contextSource: profileLoaded ? "ari_light_chat_profile_v2" : "ari_light_chat_fallback_v2"
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
          mode: "light_profile_authoritative",
          elapsedMs: Math.round(performance.now() - startedAt),
          messageLength: message.length,
          profileLoaded: context.authoritativeProfileLoaded === true
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
    version: "1.1.0",
    setActiveMessage,
    currentMessage,
    needsAuthoritativeAppContext,
    buildLightContext
  });
})();
