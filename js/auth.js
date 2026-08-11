// =====================================================
// ARI REBIRTH
// File: auth.js
// Purpose:
//   Shared Supabase auth helpers for ARI Rebirth.
//
// V1.0.0
// Email confirmation handoff:
// - New account confirmation redirects to email-confirmed.html.
// - email-confirmed.html intentionally does NOT initialize Supabase.
// - The user returns to ARI and signs in manually after confirmation.
// =====================================================

async function createUserProfile(user, displayName = "") {
  if (!user || !user.id) return;

  const cleanDisplayName = String(displayName || "").trim();

  const profilePayload = {
    id: user.id,
    email: user.email || "",
    display_name:
      cleanDisplayName ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User",
    daily_calorie_goal: 2100,
    reset_hour: 4,
    updated_at: new Date().toISOString()
  };

  const { error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (error) {
    console.error("Profile save error:", error.message);
  }
}

async function signInUser(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  return await window.calbuddySupabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });
}

async function signUpUser(email, password, displayName = "") {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");
  const cleanDisplayName = String(displayName || "").trim();

  return await window.calbuddySupabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      /*
       * IMPORTANT:
       *
       * Do NOT redirect email confirmation back into signin.html or any
       * page that initializes the Supabase client.
       *
       * Supabase confirms the email first, then redirects here.
       * email-confirmed.html does not initialize Supabase, so the returned
       * auth payload is never consumed into ARI's browser session.
       *
       * Result:
       *   1. User confirms email.
       *   2. Confirmation page says thank you.
       *   3. User returns to ARI manually.
       *   4. User signs in normally with email + password.
       */
      emailRedirectTo:
        `${window.location.origin}/email-confirmed.html`,

      data: {
        display_name: cleanDisplayName
      }
    }
  });
}

async function sendPasswordReset(email) {
  const cleanEmail = String(email || "").trim();

  return await window.calbuddySupabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: window.location.origin + "/reset-password.html"
  });
}

async function getCurrentSession() {
  if (!window.calbuddySupabase) return null;

  const {
    data: { session },
    error
  } = await window.calbuddySupabase.auth.getSession();

  if (error || !session) return null;

  return session;
}

async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

async function getAriAccountState(userId = null) {
  const resolvedUserId =
    userId ||
    (await getCurrentUser())?.id ||
    null;

  if (!resolvedUserId || !window.calbuddySupabase) {
    return null;
  }

  const { data, error } = await window.calbuddySupabase
    .from("ari_account_state")
    .select("*")
    .eq("user_id", resolvedUserId)
    .maybeSingle();

  if (error) {
    /*
     * During the one-time database rollout, treat a missing table as active
     * so the existing application remains usable. The account page surfaces
     * the setup reminder to the owner.
     */
    console.warn("ARI account state unavailable:", error.message);
    return {
      user_id: resolvedUserId,
      status: "active",
      setupPending: true
    };
  }

  return data || {
    user_id: resolvedUserId,
    status: "active",
    setupPending: true
  };
}

function isAriAccountRecoveryPage(pathname = window.location.pathname) {
  const page = String(pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  return [
    "account.html",
    "help-safety.html",
    "community-guidelines.html"
  ].includes(page);
}

async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    window.location.replace("signin.html");
    return null;
  }

  const accountState = await getAriAccountState(session.user.id);

  if (
    accountState?.status &&
    accountState.status !== "active" &&
    !isAriAccountRecoveryPage()
  ) {
    window.location.replace("account.html");
    return null;
  }

  return session;
}

async function signOutUser() {
  sessionStorage.removeItem("ari_boot_intro");

  return await window.calbuddySupabase.auth.signOut();
}

function setAriBootIntro(mode = "returning") {
  const normalizedMode = mode === "new" ? "new" : "returning";
  sessionStorage.setItem("ari_boot_intro", normalizedMode);
}

function getAriBootIntro() {
  return sessionStorage.getItem("ari_boot_intro");
}

function clearAriBootIntro() {
  sessionStorage.removeItem("ari_boot_intro");
}
