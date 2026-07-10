// =====================================================
// ARI REBIRTH
// File: auth.js
// Purpose:
//   Shared Supabase auth helpers for ARI Rebirth.
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

async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    window.location.replace("signin.html");
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
