// =====================================================
// ARI XP
// File: auth.js
// Purpose:
//   Shared Supabase auth helpers for ARI XP.
//
// V1.2.0
// App Store privacy readiness:
// - Boots the explicit third-party AI processing consent gate on home.
// - Locks the ARI composer before the consent controller finishes loading.
//
// V1.1.0
// Email confirmation handoff:
// - Uses the canonical ARI XP production confirmation URL.
// - Confirmation redirects to email-confirmed.html.
// - email-confirmed.html intentionally does NOT initialize Supabase.
// - The user returns to ARI and signs in manually after confirmation.
// =====================================================

const ARI_XP_PUBLIC_ORIGIN = "https://arixp.com";
const ARI_XP_EMAIL_CONFIRM_URL = `${ARI_XP_PUBLIC_ORIGIN}/email-confirmed.html`;

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

async function signUpUser(
  email,
  password,
  displayName = "",
  registration = {}
) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");
  const cleanDisplayName = String(displayName || "").trim();
  const cleanDateOfBirth = String(registration.dateOfBirth || "").trim();

  return await window.calbuddySupabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      emailRedirectTo: ARI_XP_EMAIL_CONFIRM_URL,
      data: {
        display_name: cleanDisplayName,
        date_of_birth: cleanDateOfBirth,
        arixp_registration: "age-gated-v1",
        age_gate_version: "2026-08-11",
        terms_accepted: registration.termsAccepted === true,
        privacy_accepted: registration.privacyAccepted === true,
        community_guidelines_accepted:
          registration.communityGuidelinesAccepted === true
      }
    }
  });
}

async function resendSignupConfirmation(email) {
  const cleanEmail = String(email || "").trim();

  return await window.calbuddySupabase.auth.resend({
    type: "signup",
    email: cleanEmail,
    options: {
      emailRedirectTo: ARI_XP_EMAIL_CONFIRM_URL
    }
  });
}

async function verifySignupCode(email, token) {
  const cleanEmail = String(email || "").trim();
  const cleanToken = String(token || "").replace(/\D/g, "").slice(0, 6);

  return await window.calbuddySupabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: "signup"
  });
}

async function sendPasswordReset(email) {
  const cleanEmail = String(email || "").trim();

  return await window.calbuddySupabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${ARI_XP_PUBLIC_ORIGIN}/reset-password.html`
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

function bootstrapAIAccessConsent() {
  const page = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  if (page !== "home.html" && page !== "") return;

  const input = document.getElementById("ariInput");
  const send = document.getElementById("ariSendBtn");

  if (input) {
    input.disabled = true;
    input.setAttribute("aria-disabled", "true");
    input.placeholder = "AI processing permission required";
  }

  if (send) {
    send.disabled = true;
    send.setAttribute("aria-disabled", "true");
  }

  if (document.querySelector('script[data-ari-ai-consent="true"]')) return;

  const script = document.createElement("script");
  script.src = "js/ai-processing-consent.js?v=1.0.0";
  script.async = false;
  script.dataset.ariAiConsent = "true";
  document.head.appendChild(script);
}

bootstrapAIAccessConsent();
