// =====================================================
// ARI REBIRTH
// File: supabase-config.js
// Purpose: Create and expose the shared Supabase client.
// =====================================================

// Replace these values with your actual Supabase project credentials.

const SUPABASE_URL = "https://qmyrfdhveqqkhsynhzci.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA";


if (!window.supabase) {
  throw new Error(
    "Supabase is not loaded. Load the Supabase CDN before supabase-config.js."
  );
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_ANON_KEY is missing."
  );
}

window.calbuddySupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "calbuddy-auth-session"
    }
  }
);

// Expose the shared Supabase client to Ari Rebirth.
window.CalBuddy = window.CalBuddy || {};
window.CalBuddy.supabase = window.calbuddySupabase;
window.supabaseClient = window.calbuddySupabase;

// Track basic authentication state changes.
window.calbuddySupabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);

  if (session?.user) {
    localStorage.setItem(
      "calbuddyLastUserId",
      session.user.id
    );

    localStorage.setItem(
      "calbuddyLastUserEmail",
      session.user.email || ""
    );
  }

  if (event === "SIGNED_OUT") {
    localStorage.removeItem("calbuddyLastUserId");
    localStorage.removeItem("calbuddyLastUserEmail");
    sessionStorage.removeItem("ari_boot_intro");
  }
});