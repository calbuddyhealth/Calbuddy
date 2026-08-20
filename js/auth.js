// =====================================================
// ARI XP
// File: auth.js
// Purpose: Shared Supabase auth helpers for ARI XP.
// V1.10.14 — Loads central Ari router v1.5.2 / runtime v1.3.3 restoration chain.
// V1.10.13 — Loads central Ari router v1.5.1 / runtime v1.3.2 hardening chain.
// V1.10.12 — Routes signed-in meal writes through the nutrition mutation journal.
// V1.10.11 — Loads nutrition data-quality context on Home + Nutrition.
// V1.10.10 — Loads Nutrition trust layer for transactional plan logging.
// V1.10.9 — Loads unified vNext runtime controller bootstrap.
// V1.10.8 — Loads owner-aware vNext shared runtime bootstrap.
// V1.10.7 — Loads shared vNext Home + Nutrition runtime bootstrap.
// V1.10.6 — Loads deterministic Meal Plan intent router v1.3.1.
// V1.10.5 — Adds Training completed-workout undo safety for iOS focus races.
// V1.10.4 — Adds shared activity Quick Log + Goals burn aggregation loaders.
// V1.10.3 — Guarantees every authenticated user has a minimal profiles row
// before protected app surfaces become usable. No fake health defaults.
// Also boots shared workout dialog controls on the Workout Plans surface.
// =====================================================

const ARI_XP_PUBLIC_ORIGIN = "https://arixp.com";
const ARI_XP_EMAIL_CONFIRM_URL = `${ARI_XP_PUBLIC_ORIGIN}/email-confirmed.html`;
const ARI_MEAL_LEDGER_SYNC_SCRIPT_ID = "ariMealLedgerSyncScript";
const ARI_NUTRITION_TRANSACTION_SCRIPT_ID = "ariNutritionTransactionScript";
const ARI_NUTRITION_TRUST_SCRIPT_ID = "ariNutritionTrustScript";
const ARI_NUTRITION_QUALITY_SCRIPT_ID = "ariNutritionQualityScript";
const ARI_INTENT_ROUTER_SCRIPT_ID = "ariCentralIntentRouterScript";
const ARI_MEAL_ACTION_SCRIPT_ID = "ariMealActionScript";
const ARI_WORKOUT_ACTION_SCRIPT_ID = "ariWorkoutActionSharedScript";
const ARI_NUTRITION_ACTION_UI_SCRIPT_ID = "ariNutritionActionUiScript";
const ARI_GOALS_NEUTRAL_SCRIPT_ID = "ariGoalsNeutralNewUserScript";
const ARI_WORKOUT_DIALOG_FLOATING_CLOSE_SCRIPT_ID = "ariWorkoutDialogFloatingCloseScript";
const ARI_TRAINING_UNDO_SAFETY_SCRIPT_ID = "ariTrainingUndoSafetyScript";
const ARI_TRAINING_QUICK_LOG_SCRIPT_ID = "ariTrainingQuickLogScript";
const ARI_GOALS_BURN_SYNC_SCRIPT_ID = "ariGoalsActivityBurnSyncScript";

function getMinimalProfilePayload(user, displayName = "") {
  const cleanDisplayName = String(displayName || "").trim();
  return {
    id: user.id,
    email: user.email || "",
    display_name:
      cleanDisplayName ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User",
    updated_at: new Date().toISOString()
  };
}

async function createUserProfile(user, displayName = "") {
  if (!user?.id || !window.calbuddySupabase) return null;

  const { data: existing, error: readError } = await window.calbuddySupabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) console.warn("Profile bootstrap read failed:", readError.message);
  if (existing?.id) return existing;

  const profilePayload = getMinimalProfilePayload(user, displayName);
  const { data, error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    console.error("Profile bootstrap failed:", error.message);
    throw error;
  }
  return data || profilePayload;
}

async function ensureAuthenticatedProfile(user = null) {
  const resolvedUser = user || (await getCurrentUser());
  if (!resolvedUser?.id) return null;
  return await createUserProfile(resolvedUser);
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
        community_guidelines_accepted: registration.communityGuidelinesAccepted === true
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
    token: String(token || "").replace(/\D/g, "").slice(0, 10),
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

  try {
    await ensureAuthenticatedProfile(session.user);
  } catch (error) {
    console.error("Authenticated profile provisioning failed:", error);
    return null;
  }

  const accountState = await getAriAccountState(session.user.id);
  if (accountState?.status && accountState.status !== "active" && !isAriAccountRecoveryPage()) {
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
function getAriBootIntro() { return sessionStorage.getItem("ari_boot_intro"); }
function clearAriBootIntro() { sessionStorage.removeItem("ari_boot_intro"); }

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
  if (page === "goals.html") return "goals";
  if (page === "ari-training.html") return "training";
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

function bootstrapNutritionTransactionClient() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(ARI_NUTRITION_TRANSACTION_SCRIPT_ID, "js/nutrition-transaction-client.js?v=1.0.0");
}

function bootstrapNutritionTrustLayer() {
  if (currentAriSurface() !== "nutrition") return;
  appendOrderedScript(ARI_NUTRITION_TRUST_SCRIPT_ID, "js/nutrition-trust-layer.js?v=1.0.0");
}

function bootstrapNutritionDataQuality() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(ARI_NUTRITION_QUALITY_SCRIPT_ID, "js/ari-nutrition-data-quality.js?v=1.0.0");
}

function bootstrapAriCentralIntentRouter() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(ARI_INTENT_ROUTER_SCRIPT_ID, "ari/intent/ari-central-intent-router.js?v=1.5.2");
}

function bootstrapAriMealAction() {
  const surface = currentAriSurface();
  if (surface !== "home" && surface !== "nutrition") return;
  appendOrderedScript(ARI_MEAL_ACTION_SCRIPT_ID, "ari/actions/ari-meal-action.js?v=2.0.0");
}

function bootstrapAriWorkoutActionForNutrition() {
  if (currentAriSurface() !== "nutrition") return;
  appendOrderedScript(ARI_WORKOUT_ACTION_SCRIPT_ID, "ari/actions/ari-workout-plan-action.js?v=3.0.0");
}

function bootstrapNutritionActionUi() {
  if (currentAriSurface() !== "nutrition") return;
  appendOrderedScript(ARI_NUTRITION_ACTION_UI_SCRIPT_ID, "ari/actions/ari-nutrition-action-ui.js?v=1.1.0");
}

function bootstrapNeutralGoalsForNewUsers() {
  if (currentAriSurface() !== "goals") return;
  appendOrderedScript(ARI_GOALS_NEUTRAL_SCRIPT_ID, "js/goals-neutral-new-user.js?v=1.2.0");
}

function bootstrapWorkoutDialogFloatingClose() {
  const page = String(window.location.pathname || "").split("/").pop().toLowerCase();
  if (page !== "workout-plans.html") return;
  appendOrderedScript(ARI_WORKOUT_DIALOG_FLOATING_CLOSE_SCRIPT_ID, "js/workout-dialog-floating-close.js?v=1.0.0");
}

function bootstrapTrainingUndoSafety() {
  if (currentAriSurface() !== "training") return;
  appendOrderedScript(ARI_TRAINING_UNDO_SAFETY_SCRIPT_ID, "js/training/training-undo-safety.js?v=1.0.0");
}

function bootstrapTrainingQuickLog() {
  if (currentAriSurface() !== "training") return;
  appendOrderedScript(ARI_TRAINING_QUICK_LOG_SCRIPT_ID, "js/training/activity-quick-log.js?v=1.1.0");
}

function bootstrapGoalsActivityBurnSync() {
  if (currentAriSurface() !== "goals") return;
  appendOrderedScript(ARI_GOALS_BURN_SYNC_SCRIPT_ID, "js/goals-activity-burn-sync.js?v=1.0.0");
}

bootstrapCanonicalMealLedger();
bootstrapNutritionTransactionClient();
bootstrapNutritionTrustLayer();
bootstrapNutritionDataQuality();
bootstrapAriCentralIntentRouter();
bootstrapAriMealAction();
bootstrapAriWorkoutActionForNutrition();
bootstrapNutritionActionUi();
bootstrapNeutralGoalsForNewUsers();
bootstrapWorkoutDialogFloatingClose();
bootstrapTrainingUndoSafety();
bootstrapTrainingQuickLog();
bootstrapGoalsActivityBurnSync();
bootstrapAIAccessConsent();
