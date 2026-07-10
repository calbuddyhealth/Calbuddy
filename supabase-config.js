// =====================================================
// ARI REBIRTH
// File: supabase-config.js
// Version: 1.1.0
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
    }
  });
})();