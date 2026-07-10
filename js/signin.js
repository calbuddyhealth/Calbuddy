// =====================================================
// ARI REBIRTH
// File: signin.js
// Purpose: Sign-in page UI and boot flow.
// Requires: supabase-config.js, auth.js
// =====================================================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const displayNameInput = document.getElementById("displayName");

const message = document.getElementById("authMessage");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");

const signupNameWrap = document.getElementById("signupNameWrap");
const confirmPasswordWrap = document.getElementById("confirmPasswordWrap");

const authCard = document.getElementById("authCard");
const verifyCard = document.getElementById("verifyCard");
const initScreen = document.getElementById("initScreen");
const initTerminal = document.getElementById("initTerminal");

const bootLogo = document.getElementById("ariBootLogo");
const bootMeaning = document.getElementById("ariBootMeaning");

let authMode = "login";
let verifyPoll = null;

function setMessage(text = "") {
  if (message) message.textContent = text;
}

function setMode(mode) {
  authMode = mode;
  setMessage("");

  const isSignup = mode === "signup";

  showLoginBtn.classList.toggle("active", !isSignup);
  showSignupBtn.classList.toggle("active", isSignup);

  signupNameWrap.classList.toggle("hidden", !isSignup);
  confirmPasswordWrap.classList.toggle("hidden", !isSignup);

  loginBtn.classList.toggle("hidden", isSignup);
  signupBtn.classList.toggle("hidden", !isSignup);

  forgotPasswordBtn.classList.toggle("hidden", isSignup);

  updateButtonState();
}

function updateButtonState() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  const displayName = displayNameInput.value.trim();

  if (authMode === "login") {
    const ready = email && password.length >= 6;
    loginBtn.textContent = ready ? "INITIALIZE" : "ENTER";
    loginBtn.classList.toggle("ready", ready);
    return;
  }

  const ready =
    displayName &&
    email &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  signupBtn.classList.toggle("ready", ready);
}

function validateLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email) return setMessage("Enter your email."), null;
  if (!password) return setMessage("Enter your password."), null;
  if (password.length < 6) return setMessage("Password must be at least 6 characters."), null;

  return { email, password };
}

function validateSignup() {
  const displayName = displayNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!displayName) return setMessage("Enter what Ari should call you."), null;
  if (!email) return setMessage("Enter your email."), null;
  if (!password) return setMessage("Enter your password."), null;
  if (password.length < 6) return setMessage("Password must be at least 6 characters."), null;
  if (password !== confirmPassword) return setMessage("Passwords do not match."), null;

  return { displayName, email, password };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeInitializationLine(row, finalHtml, speed = 12) {
  const decoder = document.createElement("div");
  decoder.innerHTML = finalHtml;

  const plainText = decoder.textContent || "";
  const cursor = document.createElement("span");

  cursor.className = "ari-terminal-cursor";
  cursor.textContent = "█";

  row.textContent = "";
  row.appendChild(cursor);

  for (const character of plainText) {
    cursor.insertAdjacentText("beforebegin", character);
    await wait(speed);
  }

  row.innerHTML = finalHtml;
}

async function startInitialization(name = "", isReturning = true) {
  document.activeElement?.blur();

  authCard.classList.add("hidden");
  verifyCard.classList.add("hidden");
  initScreen.classList.remove("hidden");

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const welcomeLine =
    isReturning && name
      ? `> Welcome back, ${name}.`
      : name
        ? `> Welcome, ${name}.`
        : "> Welcome.";

  const lines = [
    ...(!isReturning
      ? [
          `<span class="ari-init-big">> Email verified.</span>`
        ]
      : []),

    `<span class="ari-init-big">> Initializing <span class="ari-init-name">ARI</span>...</span>`,
    `<span class="ari-init-big">> Identity verified.</span>`,
    `<span class="ari-init-big ari-memory-line">> Memory link established.</span>`,
    `<span class="ari-init-big">> Synchronizing preferences...</span>`,
    `<span class="ari-init-big">${welcomeLine}</span>`
  ];

  initTerminal.innerHTML = "";

  const characterSpeed = isReturning ? 8 : 10;
  const linePauseTime = isReturning ? 45 : 60;

  for (const line of lines) {
    const row = document.createElement("div");
    row.className = "ari-init-line";

    initTerminal.appendChild(row);

    await typeInitializationLine(
      row,
      line,
      characterSpeed
    );

    await wait(linePauseTime);
  }

  await wait(200);

  window.location.replace("home.html");
}

async function handleLogin() {
  const values = validateLogin();
  if (!values) return;

  loginBtn.disabled = true;
  setMessage("Verifying identity...");

  try {
    const { data, error } = await signInUser(values.email, values.password);

    if (error) {
      setMessage(error.message);
      loginBtn.disabled = false;
      return;
    }

    if (data?.user) {
      await createUserProfile(data.user);

      const name =
        data.user.user_metadata?.display_name ||
        data.user.email?.split("@")[0] ||
        "";

      await startInitialization(name, true);
    }
  } catch (err) {
    console.error(err);
    setMessage("Sign in error. Please try again.");
    loginBtn.disabled = false;
  }
}

async function handleSignup() {
  const values = validateSignup();
  if (!values) return;

  signupBtn.disabled = true;
  setMessage("Creating account...");

  try {
    const { data, error } = await signUpUser(
      values.email,
      values.password,
      values.displayName
    );

    if (error) {
      setMessage(error.message);
      signupBtn.disabled = false;
      return;
    }

    if (data?.user) {
  await createUserProfile(data.user, values.displayName);
}

document.activeElement?.blur();

authCard.classList.add("hidden");
verifyCard.classList.remove("hidden");

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    verifyCard.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  });
});

startVerificationWatch(values.displayName);
  } catch (err) {
    console.error(err);
    setMessage("Account creation error. Please try again.");
    signupBtn.disabled = false;
  }
}

function startVerificationWatch(displayName = "") {
  if (verifyPoll) clearInterval(verifyPoll);

  verifyPoll = setInterval(async () => {
    const session = await getCurrentSession();

    if (session?.user?.email_confirmed_at) {
      clearInterval(verifyPoll);
      await createUserProfile(session.user, displayName);
      await startInitialization(displayName, false);
    }
  }, 3000);
}

async function handleForgotPassword() {
  const email = emailInput.value.trim();

  if (!email) {
    setMessage("Enter your email first, then tap Forgot Password.");
    return;
  }

  forgotPasswordBtn.disabled = true;
  setMessage("Sending password reset email...");

  try {
    const { error } = await sendPasswordReset(email);

    if (error) {
      setMessage(error.message);
      forgotPasswordBtn.disabled = false;
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
    forgotPasswordBtn.disabled = false;
  } catch (err) {
    console.error(err);
    setMessage("Unable to send reset email. Try again.");
    forgotPasswordBtn.disabled = false;
  }
}

async function playHeaderBoot() {
  if (!bootLogo || !bootMeaning) return;

  bootLogo.classList.remove("booted");
  bootMeaning.textContent = "";

  await wait(1200);

  const firstText = "ARTIFICIAL REASONING INTELLIG...";
  const finalText = "ARTIFICIAL REASONING INTELLIGENCE";

  for (let i = 0; i < firstText.length; i++) {
    bootMeaning.textContent = firstText.substring(0, i + 1) + "█";
    await wait(38 + Math.random() * 18);
  }

  await wait(300);

  for (let i = firstText.length; i > "ARTIFICIAL REASONING INTELLIG".length; i--) {
    bootMeaning.textContent = firstText.substring(0, i - 1) + "█";
    await wait(55);
  }

  await wait(180);

  for (let i = "ARTIFICIAL REASONING INTELLIG".length; i < finalText.length; i++) {
    bootMeaning.textContent = finalText.substring(0, i + 1) + "█";
    await wait(38 + Math.random() * 18);
  }

  await wait(450);

  bootMeaning.textContent = finalText + "█";
  await wait(180);

  bootMeaning.textContent = finalText;

  await wait(350);

  bootLogo.classList.add("booted");
}

[emailInput, passwordInput, confirmPasswordInput, displayNameInput].forEach(input => {
  input.addEventListener("input", updateButtonState);
});

showLoginBtn.addEventListener("click", () => setMode("login"));
showSignupBtn.addEventListener("click", () => setMode("signup"));

loginBtn.addEventListener("click", handleLogin);
signupBtn.addEventListener("click", handleSignup);
forgotPasswordBtn.addEventListener("click", handleForgotPassword);

async function initializeSignInPage() {
  const params = new URLSearchParams(window.location.search);

  const justVerified =
    params.get("verified") === "1";

  const authCode =
    params.get("code");

  try {
    if (authCode) {
      const { error: exchangeError } =
        await window.calbuddySupabase.auth.exchangeCodeForSession(
          authCode
        );

      if (exchangeError) {
        console.warn(
          "Verification session exchange failed:",
          exchangeError.message
        );
      }
    }

    let session = await getCurrentSession();

    if (justVerified && !session) {
      await wait(500);
      session = await getCurrentSession();
    }

    if (session?.user) {
      const displayName =
        session.user.user_metadata?.display_name ||
        session.user.email?.split("@")[0] ||
        "";

      if (justVerified) {
        await createUserProfile(
          session.user,
          displayName
        );

        window.history.replaceState(
          {},
          document.title,
          "/signin.html"
        );

        await startInitialization(
          displayName,
          false
        );

        return;
      }

      window.location.replace("home.html");
      return;
    }
  } catch (error) {
    console.warn(
      "Existing session check failed:",
      error
    );
  }

  setMode("login");
  await playHeaderBoot();
}

initializeSignInPage();
