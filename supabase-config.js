// =====================================================
// ARI REBIRTH
// File: supabase-config.js
// Version: 1.1.8
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
//   - Load the shared ARI Circle control drawer on Circle pages.
//   - Accelerate ARI Circle Profile first paint without dropping background data.
//   - Repair the ARI Training exercise-search template contract before boot.
//   - Load the isolated live-workout interaction repair only on ARI Training.
//   - Load the My Week workout-card hierarchy polish only on Workout Plans.
//   - Load the protected minor-age policy only on Goals.
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
  const CIRCLE_MENU_SCRIPT_ID = "ariCircleMenuV5Script";
  const TRAINING_INTERACTIONS_SCRIPT_ID = "ariTrainingLiveInteractionsScript";
  const WORKOUT_PLAN_POLISH_SCRIPT_ID = "ariWorkoutPlanCardPolishScript";
  const GOALS_AGE_POLICY_SCRIPT_ID = "ariGoalsProtectedAgePolicyScript";

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

  function shouldLoadCircleMenu() {
    const path = String(window.location.pathname || "").toLowerCase();
    return (
      path.includes("ari-circle") ||
      Boolean(document.querySelector(".feed-page, .partner-page, .challenge-page, .ari-circle-page, details.circle-v4-menu"))
    );
  }

  function loadCircleMenu() {
    if (!shouldLoadCircleMenu() || document.getElementById(CIRCLE_MENU_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = CIRCLE_MENU_SCRIPT_ID;
    script.src = "js/ari-circle/circle-menu-v5.js?v=1.0.1";
    script.defer = true;
    document.head.append(script);
  }

  function shouldAccelerateCircleProfile() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/ari-circle.html") && Boolean(document.querySelector(".ari-circle-page"));
  }

  function normalizeCircleId(value) {
    const text = String(value ?? "").trim();
    return text || null;
  }

  function mapFastTopCircleRows(rows) {
    if (!Array.isArray(rows)) return [];

    return rows
      .map((row, index) => {
        const member = row?.member && typeof row.member === "object"
          ? row.member
          : row?.profile && typeof row.profile === "object"
            ? row.profile
            : row;

        const userId = normalizeCircleId(
          member?.user_id ||
          member?.userId ||
          row?.member_user_id ||
          row?.memberUserId ||
          member?.id
        );

        if (!userId) return null;

        const requestedPosition = Number(row?.position);
        return {
          ...member,
          userId,
          position: Number.isFinite(requestedPosition) ? requestedPosition : index
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(a.position) - Number(b.position));
  }

  /*
   * The legacy Circle boot historically kept #ari-circle hidden until it had
   * loaded profile data PLUS conversations, notifications, pending requests,
   * the accepted buddy list, Top Circle and Leave Some Love. Those collections
   * are useful, but they are not required to paint a Profile.
   *
   * This profile-only preboot patch keeps the same data and security model while
   * moving noncritical collections behind first paint. The Circle engine is
   * assigned to window.AriCircleApp immediately before autoBoot(), so an accessor
   * lets us patch that instance before its boot starts without rewriting index.js.
   */
  function installCircleProfileBootAccelerator() {
    if (!shouldAccelerateCircleProfile()) return false;
    if (window.__ariCircleProfileBootAcceleratorInstalled) return true;

    let appRef = window.AriCircleApp || null;

    const patchApp = (app) => {
      if (!app || typeof app !== "object" || app.__ariProfileBootAccelerationV1) return app;

      const api = app.modules?.CircleApi;
      const store = app.modules?.CircleStore;

      if (api && typeof api.resolveProfile === "function") {
        api.loadCircleBundle = async function fastProfileBundle({
          viewerUserId,
          profileUserId,
          profileHandle
        } = {}) {
          const viewerId = normalizeCircleId(viewerUserId);
          const profile = await api.resolveProfile({
            userId: profileUserId,
            handle: profileHandle
          });

          if (!profile) return null;

          const targetId = normalizeCircleId(profile.user_id);
          const connection = viewerId && targetId && viewerId !== targetId && typeof api.getConnection === "function"
            ? await api.getConnection(viewerId, targetId)
            : null;

          // Top Circle + Love hydrate after the profile is already paintable.
          window.setTimeout(() => {
            if (!targetId) return;

            if (typeof api.getTopCircle === "function") {
              Promise.resolve(api.getTopCircle(targetId))
                .then((rows) => {
                  const members = mapFastTopCircleRows(rows);
                  const limit = Number(profile.top_circle_limit) === 4 ? 4 : 6;
                  store?.setTopCircle?.({ limit, members });
                })
                .catch((error) => {
                  console.warn("ARI Circle Profile Top Circle background load failed.", error);
                });
            }

            if (typeof api.getLove === "function") {
              Promise.resolve(api.getLove({ profileUserId: targetId, limit: 20, offset: 0 }))
                .then((love) => {
                  store?.setLoveState?.({
                    items: love?.items || [],
                    total: Number(love?.total) || 0,
                    hasMore: Boolean(love?.hasMore),
                    loading: false
                  });
                })
                .catch((error) => {
                  console.warn("ARI Circle Profile Love background load failed.", error);
                });
            }
          }, 0);

          return {
            profile,
            connection,
            topCircleRows: [],
            love: { items: [], total: 0, hasMore: false }
          };
        };
      }

      if (typeof app.loadViewerData === "function") {
        const originalLoadViewerData = app.loadViewerData.bind(app);
        let initialViewerLoad = null;
        let realtimeRefreshScheduled = false;

        const refreshRealtimeAfterBackgroundData = () => {
          if (realtimeRefreshScheduled) return;
          realtimeRefreshScheduled = true;

          let attempts = 0;
          const refresh = () => {
            attempts += 1;

            if (app.state?.ready) {
              Promise.resolve(app.connectRealtime?.())
                .catch((error) => {
                  console.warn("ARI Circle Profile realtime refresh failed.", error);
                });
              return;
            }

            if (attempts < 60) window.setTimeout(refresh, 50);
          };

          window.setTimeout(refresh, 0);
        };

        app.loadViewerData = async function fastInitialViewerData(viewerUserId) {
          if (this.state?.ready) {
            return originalLoadViewerData(viewerUserId);
          }

          if (!initialViewerLoad) {
            initialViewerLoad = Promise.resolve()
              .then(() => originalLoadViewerData(viewerUserId))
              .then((result) => {
                refreshRealtimeAfterBackgroundData();
                return result;
              })
              .catch((error) => {
                console.warn("ARI Circle Profile background viewer data failed.", error);
                return null;
              });
          }

          // The caller may reveal Profile immediately; background modules update
          // their own stores as the real request settles.
          return {
            conversations: [],
            notifications: [],
            connectionRequests: [],
            connections: []
          };
        };
      }

      try {
        Object.defineProperty(app, "__ariProfileBootAccelerationV1", {
          configurable: false,
          enumerable: false,
          value: true
        });
      } catch {
        app.__ariProfileBootAccelerationV1 = true;
      }

      return app;
    };

    const descriptor = Object.getOwnPropertyDescriptor(window, "AriCircleApp");
    if (descriptor && descriptor.configurable === false && !descriptor.set) {
      appRef = patchApp(appRef);
      window.__ariCircleProfileBootAcceleratorInstalled = Boolean(appRef);
      return Boolean(appRef);
    }

    if (appRef) appRef = patchApp(appRef);

    Object.defineProperty(window, "AriCircleApp", {
      configurable: true,
      enumerable: true,
      get() {
        return appRef;
      },
      set(value) {
        appRef = patchApp(value);
      }
    });

    window.__ariCircleProfileBootAcceleratorInstalled = true;
    return true;
  }

  function shouldLoadTrainingInteractions() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/ari-training.html") || Boolean(document.querySelector(".ari-training-page"));
  }

  /*
   * ARI Training's current HTML template uses the newer
   * `.ari-session-search-result*` class family, while the legacy V4.6
   * renderer still queries the older `.ari-session-exercise-search-result*`
   * names. When those aliases are missing the renderer falls back to an
   * empty button, which is why iPhone search results appear as selectable
   * gray bars with no exercise copy.
   *
   * Patch the inert <template> before ari-training.js boots. This preserves
   * the existing session/add logic and lets the real result card render.
   */
  function patchTrainingExerciseSearchTemplate() {
    if (!shouldLoadTrainingInteractions()) return false;

    const template = document.getElementById("sessionExerciseSearchResultTemplate");
    const root = template?.content?.querySelector(".ari-session-search-result");
    if (!root) return false;

    root.classList.add("ari-session-exercise-search-result");

    const aliases = [
      [".ari-session-search-result__type", "ari-session-exercise-search-result__type"],
      [".ari-session-search-result__name", "ari-session-exercise-search-result__name"],
      [".ari-session-search-result__muscles", "ari-session-exercise-search-result__muscles"]
    ];

    for (const [selector, alias] of aliases) {
      root.querySelector(selector)?.classList.add(alias);
    }

    root.dataset.ariTrainingSearchTemplate = "1.1.7";
    return true;
  }

  function loadTrainingInteractions() {
    if (!shouldLoadTrainingInteractions()) return;

    // This must happen before the legacy Training module renders search rows.
    patchTrainingExerciseSearchTemplate();

    if (document.getElementById(TRAINING_INTERACTIONS_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = TRAINING_INTERACTIONS_SCRIPT_ID;
    script.type = "module";
    script.src = "js/training/training-live-interactions.js?v=1.0.2";
    document.head.append(script);
  }

  function shouldLoadWorkoutPlanCardPolish() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/workout-plans.html") || Boolean(document.querySelector(".ari-workout-plans-page"));
  }

  function loadWorkoutPlanCardPolish() {
    if (!shouldLoadWorkoutPlanCardPolish() || document.getElementById(WORKOUT_PLAN_POLISH_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = WORKOUT_PLAN_POLISH_SCRIPT_ID;
    script.src = "js/training/workout-plans-card-polish.js?v=1.0.0";
    script.defer = true;
    document.head.append(script);
  }

  function shouldLoadGoalsAgePolicy() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/goals.html") || Boolean(document.querySelector(".ari-goals-page"));
  }

  function loadGoalsAgePolicy() {
    if (!shouldLoadGoalsAgePolicy() || document.getElementById(GOALS_AGE_POLICY_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = GOALS_AGE_POLICY_SCRIPT_ID;
    script.src = "js/goals-age-policy.js?v=1.0.0";
    script.defer = true;
    document.head.append(script);
  }

  // Install before index.js publishes AriCircleApp and calls autoBoot().
  installCircleProfileBootAccelerator();

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
    loadCircleMenu();
    loadTrainingInteractions();
    loadWorkoutPlanCardPolish();
    loadGoalsAgePolicy();
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

  // Keep the Circle control drawer consistent across Feed, Buddies,
  // Challenges, and Profile even when legacy V4 markup is still present.
  loadCircleMenu();

  // ARI Training gets a small isolated interaction layer that repairs
  // Safari dialog behavior, the live exercise-search template, and
  // live-workout cancel/add controls.
  loadTrainingInteractions();

  // Workout Plans gets a presentation-only layer that sharpens the My Week
  // date/title/detail/status hierarchy without touching planning behavior.
  loadWorkoutPlanCardPolish();

  // Teen accounts use protected account DOB as Goals age. Adult Goals remain
  // editable exactly as before.
  loadGoalsAgePolicy();

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