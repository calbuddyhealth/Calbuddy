// =====================================================
// ARI XP
// File: auth.js
// Purpose: Shared Supabase auth helpers for ARI XP.
// V1.9.0 — Home and Nutrition share one OpenAI central intent router and
// canonical domain action services.
// =====================================================

const ARI_XP_PUBLIC_ORIGIN = "https://arixp.com";
const ARI_XP_EMAIL_CONFIRM_URL = `${ARI_XP_PUBLIC_ORIGIN}/email-confirmed.html`;
const ARI_MEAL_LEDGER_SYNC_SCRIPT_ID = "ariMealLedgerSyncScript";
const ARI_INTENT_ROUTER_SCRIPT_ID = "ariCentralIntentRouterScript";
const ARI_MEAL_ACTION_SCRIPT_ID = "ariMealActionScript";
const ARI_WORKOUT_ACTION_SCRIPT_ID = "ariWorkoutActionSharedScript";
const ARI_NUTRITION_ACTION_UI_SCRIPT_ID = "ariNutritionActionUiScript";

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
    reset_hour: 12,
    reset_minute: 0,
    reset_ampm: "AM",
    updated_at: new Date().toISOString()
  };

  const { error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (error) console.error("Profile save error:", error.message);
}

async function signInUser(email, password) {
  return await window.calbuddySupabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || "")
  });
}

async function signUpUser(email, password, displayName = "", registration = {}) {
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
  return await window.calbuddySupabase.auth.resend({
    type: "signup",
    email: String(email || "").trim(),
    options: { emailRedirectTo: ARI_XP_EMAIL_CONFIRM_URL }
  });
}

async function verifySignupCode(email, token) {
  return await window.calbuddySupabase.auth.verifyOtp({
    email: String(email || "").trim(),
    token: String(token || "").replace(/\D/g, "").slice(0, 6),
    type: "signup"
  });
}

async function sendPasswordReset(email) {
  return await window.calbuddySupabase.auth.resetPasswordForEmail(
    String(email || "").trim(),
    { redirectTo: `${ARI_XP_PUBLIC_ORIGIN}/reset-password.html` }
  );
}

async function getCurrentSession() {
  if (!window.calbuddySupabase) return null;
  const { data: { session }, error } = await window.calbuddySupabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

async function getAriAccountState(userId = null) {
  const resolvedUserId = userId || (await getCurrentUser())?.id || null;
  if (!resolvedUserId || !window.calbuddySupabase) return null;

  const { data, error } = await window.calbuddySupabase
    .from("ari_account_state")
    .select("*")
    .eq("user_id", resolvedUserId)
    .maybeSingle();

  if (error) {
    console.warn("ARI account state unavailable:", error.message);
    return { user_id: resolvedUserId, status: "active", setupPending: true };
  }

  return data || { user_id: resolvedUserId, status: "active", setupPending: true };
}

function isAriAccountRecoveryPage(pathname = window.location.pathname) {
  const page = String(pathname || "").split("/").pop().toLowerCase();
  return ["account.html", "help-safety.html", "community-guidelines.html"].includes(page);
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
  sessionStorage.setItem("ari_boot_intro", mode === "new" ? "new" : "returning");
}

function getAriBootIntro() {
  return sessionStorage.getItem("ari_boot_intro");
}

function clearAriBootIntro() {
  sessionStorage.removeItem("ari_boot_intro");
}

function bootstrapAIAccessConsent() {
  const page = String(window.location.pathname || "").split("/").pop().toLowerCase();
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
}

function bootstrapCanonicalMealLedger() {
  if (document.getElementById(ARI_MEAL_LEDGER_SYNC_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = ARI_MEAL_LEDGER_SYNC_SCRIPT_ID;
  script.src = "js/meal-ledger-sync.js?v=1.0.1";
  script.defer = true;
  document.head.appendChild(script);
}

function currentAriSurface() {
  const page = String(window.location.pathname || "").split("/").pop().toLowerCase();
  if (page === "nutrition.html") return "nutrition";
  if (page === "home.html" || page === "") return "home";
  return "other";
}

function appendOrderedScript(id, src) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = false;
  document.head.appendChild(script);
}

function bootstrapAriCentralIntentRouter() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(
    ARI_INTENT_ROUTER_SCRIPT_ID,
    "ari/intent/ari-central-intent-router.js?v=1.1.0"
  );
}

function bootstrapAriMealAction() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(
    ARI_MEAL_ACTION_SCRIPT_ID,
    "ari/actions/ari-meal-action.js?v=2.0.0"
  );
}

function bootstrapAriWorkoutActionForNutrition() {
  // Home loads this same canonical file directly in home.html.
  if (currentAriSurface() !== "nutrition") return;
  appendOrderedScript(
    ARI_WORKOUT_ACTION_SCRIPT_ID,
    "ari/actions/ari-workout-plan-action.js?v=3.0.0"
  );
}

function bootstrapNutritionActionUi() {
  if (currentAriSurface() !== "nutrition") return;
  appendOrderedScript(
    ARI_NUTRITION_ACTION_UI_SCRIPT_ID,
    "ari/actions/ari-nutrition-action-ui.js?v=1.1.0"
  );
}

bootstrapCanonicalMealLedger();
bootstrapAriCentralIntentRouter();
bootstrapAriMealAction();
bootstrapAriWorkoutActionForNutrition();
bootstrapNutritionActionUi();
bootstrapAIAccessConsent();
