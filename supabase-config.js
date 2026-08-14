// =====================================================
// ARI REBIRTH
// File: supabase-config.js
// Version: 1.1.2
//
// Purpose:
//   Create and expose one shared Supabase browser client.
//
// Responsibilities:
//   - Validate that the Supabase CDN loaded.
//   - Create a single reusable client.
//   - Configure persistent authentication.
//   - Expose compatibility aliases used by older files.
//   - Track basic authentication state changes.
//   - Lazily load ARI Circle notification badges only on relevant pages.
//   - Load the isolated live-workout interaction repair only on ARI Training.
//
// Non-responsibilities:
//   - Does not perform sign-in or sign-up.
//   - Does not create user profiles.
//   - Does not control authentication-page UI.
// =====================================================

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://qmyrfdhveqqkhsynhzci.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA";

  const AUTH_STORAGE_KEY = "calbuddy-auth-session";
  const SOCIAL_BADGES_SCRIPT_ID = "ariCircleSocialBadgesScript";
  const TRAINING_INTERACTIONS_SCRIPT_ID = "ariTrainingLiveInteractionsScript";

  function shouldLoadSocialBadges() {
    const path = String(window.location.pathname || "").toLowerCase();
    return (
      path.endsWith("/home.html") ||
      path.includes("ari-circle") ||
      Boolean(document.querySelector(".nav-circle, .feed-page, .partner-page, .challenge-page, .ari-circle-page"))
    );
  }

  function scheduleSocialBadges() {
    if (!shouldLoadSocialBadges() || document.getElementById(SOCIAL_BADGES_SCRIPT_ID)) return;

    const load = () => {
      if (document.getElementById(SOCIAL_BADGES_SCRIPT_ID)) return;
      const script = document.createElement("script");
      script.id = SOCIAL_BADGES_SCRIPT_ID;
      script.src = "js/ari-circle/social-badges.js?v=1.0.0";
      script.defer = true;
      document.head.append(script);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(load, { timeout: 1800 });
    } else {
      window.setTimeout(load, 900);
    }
  }

  function shouldLoadTrainingInteractions() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/ari-training.html") || Boolean(document.querySelector(".ari-training-page"));
  }

  function loadTrainingInteractions() {
    if (!shouldLoadTrainingInteractions() || document.getElementById(TRAINING_INTERACTIONS_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = TRAINING_INTERACTIONS_SCRIPT_ID;
    script.type = "module";
    script.src = "js/training/training-live-interactions.js?v=1.0.0";
    document.head.append(script);
  }

  // -----------------------------------------------------
  // Dependency validation
  // -----------------------------------------------------

  if (!window.supabase?.createClient) {
    throw new Error(
      "Supabase is unavailable. Load the Supabase CDN before supabase-config.js."
    );
  }

  if (
    typeof SUPABASE_URL !== "string" ||
    !SUPABASE_URL.trim()
  ) {
    throw new Error("SUPABASE_URL is missing.");
  }

  if (
    typeof SUPABASE_ANON_KEY !== "string" ||
    !SUPABASE_ANON_KEY.trim()
  ) {
    throw new Error("SUPABASE_ANON_KEY is missing.");
  }

  // -----------------------------------------------------
  // Reuse an existing client if this file loads twice
  // -----------------------------------------------------

  if (window.calbuddySupabase) {
    window.CalBuddy = window.CalBuddy || {};
    window.CalBuddy.supabase = window.calbuddySupabase;
    window.supabaseClient = window.calbuddySupabase;
    scheduleSocialBadges();
    loadTrainingInteractions();
    return;
  }

  // -----------------------------------------------------
  // Shared Supabase client
  // -----------------------------------------------------

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: AUTH_STORAGE_KEY
      }
    }
  );

  // Primary global reference.
  window.calbuddySupabase = client;

  // Compatibility references used by existing Ari files.
  window.CalBuddy = window.CalBuddy || {};
  window.CalBuddy.supabase = client;
  window.supabaseClient = client;

  // Badge loading is intentionally delayed until the browser is idle so
  // ARI Circle navigation and page rendering remain the priority.
  scheduleSocialBadges();

  // ARI Training gets a small isolated interaction layer that repairs
  // Safari dialog behavior and live-workout cancel/add controls.
  loadTrainingInteractions();

  // -----------------------------------------------------
  // Authentication-state tracking
  // -----------------------------------------------------

  client.auth.onAuthStateChange((event, session) => {
    console.info("[Ari Auth]", event);

    const user = session?.user || null;

    if (user) {
      localStorage.setItem(
        "calbuddyLastUserId",
        user.id
      );

      localStorage.setItem(
        "calbuddyLastUserEmail",
        user.email || ""
      );
    }

    if (event === "SIGNED_OUT") {
      localStorage.removeItem("calbuddyLastUserId");
      localStorage.removeItem("calbuddyLastUserEmail");

      sessionStorage.removeItem("ari_boot_intro");
      sessionStorage.removeItem("ari_circle_badges_v1");
    }
  });
})();