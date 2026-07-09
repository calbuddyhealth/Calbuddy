// CalBuddy Auth Helper Functions
// ARI Rebirth Auth Upgrade
// Adds display_name support, new/returning user flags, and boot intro handoff.

async function createUserProfile(user, displayName = "") {
  if (!user || !user.id) return;

  const cleanDisplayName = String(displayName || "").trim();
  const fallbackName = user.email ? user.email.split("@")[0] : "User";

  const profilePayload = {
    id: user.id,
    email: user.email,
    display_name: cleanDisplayName || fallbackName,
    daily_calorie_goal: 2100,
    reset_hour: 4,
    updated_at: new Date().toISOString()
  };

  const { error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(profilePayload, {
      onConflict: "id"
    });

  if (error) {
    console.error("Profile creation error:", error.message);
  }
}

async function signUp(email, password, displayName) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");
  const cleanDisplayName = String(displayName || "").trim();

  if (!cleanEmail) {
    return { success: false, error: "Please enter your email." };
  }

  if (!cleanPassword) {
    return { success: false, error: "Please enter a password." };
  }

  if (!cleanDisplayName) {
    return { success: false, error: "Please enter what Ari should call you." };
  }

  const { data, error } = await window.calbuddySupabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      data: {
        display_name: cleanDisplayName
      }
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await createUserProfile(data.user, cleanDisplayName);
  }

  return {
    success: true,
    user: data.user,
    session: data.session || null,
    isNewUser: true
  };
}

async function signIn(email, password) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail) {
    return { success: false, error: "Please enter your email." };
  }

  if (!cleanPassword) {
    return { success: false, error: "Please enter your password." };
  }

  const { data, error } = await window.calbuddySupabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await createUserProfile(data.user);
  }

  return {
    success: true,
    user: data.user,
    session: data.session || null,
    isNewUser: false
  };
}

async function signOut() {
  sessionStorage.removeItem("ari_boot_intro");

  const { error } = await window.calbuddySupabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function getCurrentUser() {
  const {
    data: { session },
    error
  } = await window.calbuddySupabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.user;
}

async function isUserAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
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
/* =====================================================
ARI AUTH — DARK SPACE TERMINAL FINAL
===================================================== */

body.ari-auth-body {
  background:
    radial-gradient(circle at 50% 18%, rgba(87,255,231,.08), transparent 34%),
    linear-gradient(180deg, #00040a 0%, #020814 52%, #00040a 100%) !important;
}

body.ari-auth-body::before {
  opacity: .18 !important;
  background-size: 32px 32px !important;
}

body.ari-auth-body .ari-auth-card {
  border-radius: 0 !important;
  padding: 42px 18px 34px !important;
  background:
    linear-gradient(90deg, rgba(87,255,231,.045) 1px, transparent 1px),
    linear-gradient(rgba(87,255,231,.035) 1px, transparent 1px),
    linear-gradient(180deg, rgba(1,8,15,.94), rgba(0,2,7,.98)) !important;
  background-size: 32px 32px, 32px 32px, auto !important;
  border: 1px solid rgba(87,255,231,.52) !important;
  box-shadow:
    0 0 30px rgba(87,255,231,.14),
    inset 0 0 42px rgba(87,255,231,.035) !important;
  clip-path: polygon(
    22px 0,
    calc(100% - 22px) 0,
    100% 22px,
    100% calc(100% - 22px),
    calc(100% - 22px) 100%,
    22px 100%,
    0 calc(100% - 22px),
    0 22px
  );
}

body.ari-auth-body .ari-auth-brand h1 {
  font-family: "Courier New", monospace !important;
  font-size: clamp(2.05rem, 9vw, 3rem) !important;
  letter-spacing: .22em !important;
  color: rgba(105,255,255,.92) !important;
}

body.ari-auth-body .ari-auth-brand h1::before {
  content: none !important;
  display: none !important;
}

body.ari-auth-body .ari-auth-tab,
body.ari-auth-body .ari-auth-main-btn,
body.ari-auth-body .ari-auth-field input {
  border-radius: 3px !important;
  font-family: "Courier New", monospace !important;
  border-color: rgba(87,255,231,.55) !important;
  background: rgba(0,3,10,.72) !important;
}

body.ari-auth-body .ari-auth-tab.active::after,
body.ari-auth-body .ari-auth-main-btn::before,
body.ari-auth-body .ari-auth-field::after {
  content: "█";
  color: rgba(105,255,255,.75);
  animation: ariCursorBlink .8s steps(1) infinite;
}

body.ari-auth-body .ari-auth-field {
  position: relative;
}

body.ari-auth-body .ari-auth-field::after {
  position: absolute;
  left: 31px;
  bottom: 19px;
  font-size: 1rem;
  pointer-events: none;
}

body.ari-auth-body .ari-auth-field input:not(:placeholder-shown) + span,
body.ari-auth-body .ari-auth-field input:focus + span {
  display: none;
}

body.ari-auth-body .ari-auth-field label {
  font-family: "Courier New", monospace !important;
  letter-spacing: .18em !important;
}

body.ari-auth-body .ari-auth-field label::before {
  content: "> ";
}

body.ari-auth-body .ari-auth-main-btn {
  position: relative !important;
  color: rgba(105,255,255,.90) !important;
}

body.ari-auth-body .ari-auth-main-btn::before {
  position: absolute;
  left: 28px;
}

body.ari-auth-body .ari-auth-link-btn {
  font-family: "Courier New", monospace !important;
}

body.ari-auth-body .ari-auth-link-btn::before {
  content: "> ";
}

/* =====================================================
ARI AUTH — REMOVE FAKE BLINKING CURSORS
===================================================== */

body.ari-auth-body .ari-auth-tab.active::after,
body.ari-auth-body .ari-auth-main-btn::before,
body.ari-auth-body .ari-auth-field::after {
  content: none !important;
  display: none !important;
  animation: none !important;
}

/* Optional: also hide the real typing caret */
body.ari-auth-body input {
  caret-color: transparent !important;
}

/* =====================================================
ARI INIT SCREEN — TRUE BLACK TERMINAL BOOT
===================================================== */

body.ari-auth-body .ari-init-screen {
  min-height: 100dvh !important;
  width: 100% !important;
  background: #000 !important;
  color: #9ffcff !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: flex-start !important;
  padding: 46px 22px !important;
}

body.ari-auth-body .ari-terminal-shell,
body.ari-auth-body .ari-init-terminal {
  width: 100% !important;
  min-height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  background: #000 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

body.ari-auth-body .terminal-grid,
body.ari-auth-body .terminal-glow {
  display: none !important;
}

body.ari-auth-body .ari-init-terminal {
  display: block !important;
  font-family: "Courier New", "IBM Plex Mono", "JetBrains Mono", monospace !important;
}

body.ari-auth-body .ari-init-line {
  min-height: 24px !important;
  font-family: "Courier New", "IBM Plex Mono", "JetBrains Mono", monospace !important;
  font-size: 15px !important;
  line-height: 1.55 !important;
  letter-spacing: 0.02em !important;
  color: #9ffcff !important;
  text-shadow:
    0 0 5px rgba(159, 252, 255, 0.45),
    0 0 14px rgba(34, 211, 238, 0.20) !important;
}

body.ari-auth-body .ari-init-big {
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #9ffcff !important;
}

body.ari-auth-body .ari-init-name,
body.ari-auth-body .ari-memory-line {
  color: #9ffcff !important;
  text-shadow:
    0 0 5px rgba(159, 252, 255, 0.45),
    0 0 14px rgba(34, 211, 238, 0.20) !important;
}

body.ari-auth-body .ari-terminal-cursor {
  display: inline-block !important;
  margin-left: 4px !important;
  color: #9ffcff !important;
  animation: ariCursorBlink 0.75s steps(1) infinite !important;
}
/* =====================================================
ARI AUTH — HEADER BOOT REVEAL
===================================================== */

body.ari-auth-body #ariBootLogo {
  opacity: 0.34 !important;
  filter: brightness(0.55) !important;
  transition: none !important;
}

body.ari-auth-body #ariBootLogo.booted {
  opacity: 1 !important;
  filter: brightness(1.35) !important;
  color: rgba(145, 255, 255, 0.98) !important;
  text-shadow:
    0 0 6px rgba(145,255,255,.95),
    0 0 18px rgba(87,255,231,.68),
    0 0 42px rgba(87,255,231,.34),
    0 0 72px rgba(87,255,231,.18) !important;
  animation: ariLogoPowerOn .8s steps(1) 1 !important;
}

body.ari-auth-body #ariBootMeaning {
  min-height: 24px !important;
  margin: -18px 0 28px !important;
  font-family: "Courier New", monospace !important;
  font-size: clamp(.62rem, 2.6vw, .86rem) !important;
  letter-spacing: .12em !important;
  color: rgba(145,255,255,.82) !important;
  text-shadow:
    0 0 5px rgba(145,255,255,.36),
    0 0 14px rgba(87,255,231,.16) !important;
  white-space: nowrap !important;
}

@keyframes ariLogoPowerOn {
  0% { opacity: .12; filter: brightness(.25); }
  10% { opacity: 1; filter: brightness(1.8); }
  18% { opacity: .18; filter: brightness(.25); }
  30% { opacity: .92; filter: brightness(1.2); }
  42% { opacity: .28; filter: brightness(.4); }
  58% { opacity: 1; filter: brightness(1.9); }
  72% { opacity: .62; filter: brightness(.9); }
  100% { opacity: 1; filter: brightness(1.35); }
}