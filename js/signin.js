// =====================================================
// ARI REBIRTH
// File: signin.js
// Version: 1.2.0
// Purpose: Sign-in page UI and manual post-verification boot flow.
// Requires: supabase-config.js, auth.js
//
// V1.2.0:
// - Removes verification polling.
// - Removes confirmation-code session exchange.
// - Removes automatic ARI initialization after email verification.
// - Does NOT create the app profile during signup.
// - First profile creation happens after the user's first manual sign-in.
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

function setMessage(text = "") {
  if (message) {
    message.textContent = text;
  }
}

function setMode(mode) {
  authMode = mode;
  setMessage("");

  const isSignup = mode === "signup";

  showLoginBtn.classList.toggle("active", !isSignup);
  showSignupBtn.classList.toggle("active", isSignup);

  showLoginBtn.setAttribute(
    "aria-selected",
    String(!isSignup)
  );

  showSignupBtn.setAttribute(
    "aria-selected",
    String(isSignup)
  );

  signupNameWrap.classList.toggle("hidden", !isSignup);
  confirmPasswordWrap.classList.toggle("hidden", !isSignup);

  loginBtn.classList.toggle("hidden", isSignup);
  signupBtn.classList.toggle("hidden", !isSignup);

  forgotPasswordBtn.classList.toggle("hidden", isSignup);

  /*
   * Help password managers understand which password mode is active.
   */
  passwordInput.setAttribute(
    "autocomplete",
    isSignup
      ? "new-password"
      : "current-password"
  );

  updateButtonState();
}

function updateButtonState() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const displayName = displayNameInput.value.trim();

  if (authMode === "login") {
    const ready =
      Boolean(email) &&
      password.length >= 6;

    loginBtn.textContent =
      ready
        ? "INITIALIZE"
        : "ENTER";

    loginBtn.classList.toggle(
      "ready",
      ready
    );

    return;
  }

  const ready =
    Boolean(displayName) &&
    Boolean(email) &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  signupBtn.classList.toggle(
    "ready",
    ready
  );
}

function validateLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    setMessage("Enter your email.");
    return null;
  }

  if (!password) {
    setMessage("Enter your password.");
    return null;
  }

  if (password.length < 6) {
    setMessage(
      "Password must be at least 6 characters."
    );

    return null;
  }

  return {
    email,
    password
  };
}

function validateSignup() {
  const displayName =
    displayNameInput.value.trim();

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  const confirmPassword =
    confirmPasswordInput.value;

  if (!displayName) {
    setMessage(
      "Enter what Ari should call you."
    );

    return null;
  }

  if (!email) {
    setMessage(
      "Enter your email."
    );

    return null;
  }

  if (!password) {
    setMessage(
      "Enter your password."
    );

    return null;
  }

  if (password.length < 6) {
    setMessage(
      "Password must be at least 6 characters."
    );

    return null;
  }

  if (
    password !==
    confirmPassword
  ) {
    setMessage(
      "Passwords do not match."
    );

    return null;
  }

  return {
    displayName,
    email,
    password
  };
}

function wait(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

async function typeInitializationLine(
  row,
  finalHtml,
  speed = 12
) {
  const decoder =
    document.createElement(
      "div"
    );

  decoder.innerHTML =
    finalHtml;

  const plainText =
    decoder.textContent ||
    "";

  const cursor =
    document.createElement(
      "span"
    );

  cursor.className =
    "ari-terminal-cursor";

  cursor.textContent =
    "â";

  row.textContent =
    "";

  row.appendChild(
    cursor
  );

  for (
    const character
    of plainText
  ) {
    cursor.insertAdjacentText(
      "beforebegin",
      character
    );

    await wait(
      speed
    );
  }

  row.innerHTML =
    finalHtml;
}

async function startInitialization(
  name = ""
) {
  document.activeElement?.blur();

  authCard.classList.add(
    "hidden"
  );

  verifyCard.classList.add(
    "hidden"
  );

  initScreen.classList.remove(
    "hidden"
  );

  window.scrollTo(
    0,
    0
  );

  document.documentElement.scrollTop =
    0;

  document.body.scrollTop =
    0;

  const welcomeLine =
    name
      ? `> Welcome, ${name}.`
      : "> Welcome.";

  const lines = [
    `<span class="ari-init-big">> Initializing <span class="ari-init-name">ARI</span>...</span>`,
    `<span class="ari-init-big">> Identity verified.</span>`,
    `<span class="ari-init-big ari-memory-line">> Memory link established.</span>`,
    `<span class="ari-init-big">> Synchronizing preferences...</span>`,
    `<span class="ari-init-big">${welcomeLine}</span>`
  ];

  initTerminal.innerHTML =
    "";

  for (
    const line
    of lines
  ) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "ari-init-line";

    initTerminal.appendChild(
      row
    );

    await typeInitializationLine(
      row,
      line,
      8
    );

    await wait(
      45
    );
  }

  await wait(
    200
  );

  window.location.replace(
    "home.html"
  );
}

async function handleLogin() {
  const values =
    validateLogin();

  if (!values) {
    return;
  }

  loginBtn.disabled =
    true;

  setMessage(
    "Verifying identity..."
  );

  try {
    const {
      data,
      error
    } =
      await signInUser(
        values.email,
        values.password
      );

    if (error) {
      setMessage(
        error.message
      );

      loginBtn.disabled =
        false;

      return;
    }

    if (!data?.user) {
      setMessage(
        "Sign in did not return a user. Please try again."
      );

      loginBtn.disabled =
        false;

      return;
    }

    /*
     * This is now the canonical first-run profile creation point.
     *
     * A newly registered user does NOT write the ARI profile during signup.
     * They confirm their email, return to ARI, and sign in normally.
     * Once authenticated, the profile can be safely created/upserted.
     */
    await createUserProfile(
      data.user
    );

    const name =
      data.user
        .user_metadata
        ?.display_name ||
      data.user.email
        ?.split("@")[0] ||
      "";

    await startInitialization(
      name
    );
  } catch (err) {
    console.error(
      err
    );

    setMessage(
      "Sign in error. Please try again."
    );

    loginBtn.disabled =
      false;
  }
}

async function handleSignup() {
  const values =
    validateSignup();

  if (!values) {
    return;
  }

  signupBtn.disabled =
    true;

  setMessage(
    "Creating account..."
  );

  try {
    const {
      data,
      error
    } =
      await signUpUser(
        values.email,
        values.password,
        values.displayName
      );

    if (error) {
      setMessage(
        error.message
      );

      signupBtn.disabled =
        false;

      return;
    }

    if (!data?.user) {
      setMessage(
        "Account creation did not complete. Please try again."
      );

      signupBtn.disabled =
        false;

      return;
    }

    /*
     * IMPORTANT:
     * Do NOT call createUserProfile() here.
     *
     * With email confirmation enabled, signup is not the point where ARI
     * should initialize user-owned database state. That now happens only
     * after the user's first successful manual sign-in.
     */

    /*
     * Defensive safeguard:
     * If Supabase project settings ever return a session immediately from
     * signUp(), clear it so signup still respects ARI's manual-login flow.
     */
    if (
      data.session
    ) {
      try {
        await signOutUser();
      } catch (signOutError) {
        console.warn(
          "ARI signup session cleanup failed:",
          signOutError
        );
      }
    }

    document.activeElement?.blur();

    authCard.classList.add(
      "hidden"
    );

    verifyCard.classList.remove(
      "hidden"
    );

    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            window.scrollTo(
              0,
              0
            );

            document.documentElement.scrollTop =
              0;

            document.body.scrollTop =
              0;

            verifyCard.scrollIntoView({
              behavior:
                "auto",

              block:
                "start"
            });
          }
        );
      }
    );
  } catch (err) {
    console.error(
      err
    );

    setMessage(
      "Account creation error. Please try again."
    );

    signupBtn.disabled =
      false;
  }
}

async function handleForgotPassword() {
  const email =
    emailInput.value.trim();

  if (!email) {
    setMessage(
      "Enter your email first, then tap Forgot Password."
    );

    return;
  }

  forgotPasswordBtn.disabled =
    true;

  setMessage(
    "Sending password reset email..."
  );

  try {
    const {
      error
    } =
      await sendPasswordReset(
        email
      );

    if (error) {
      setMessage(
        error.message
      );

      forgotPasswordBtn.disabled =
        false;

      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox."
    );

    forgotPasswordBtn.disabled =
      false;
  } catch (err) {
    console.error(
      err
    );

    setMessage(
      "Unable to send reset email. Try again."
    );

    forgotPasswordBtn.disabled =
      false;
  }
}

async function playHeaderBoot() {
  if (
    !bootLogo ||
    !bootMeaning
  ) {
    return;
  }

  bootLogo.classList.remove(
    "booted"
  );

  bootMeaning.textContent =
    "";

  await wait(
    1200
  );

  const firstText =
    "ARTIFICIAL REASONING INTELLIG...";

  const finalText =
    "ARTIFICIAL REASONING INTELLIGENCE";

  for (
    let i = 0;
    i < firstText.length;
    i++
  ) {
    bootMeaning.textContent =
      firstText.substring(
        0,
        i + 1
      ) +
      "â";

    await wait(
      38 +
      Math.random() *
      18
    );
  }

  await wait(
    300
  );

  const stablePrefix =
    "ARTIFICIAL REASONING INTELLIG";

  for (
    let i =
      firstText.length;
    i >
      stablePrefix.length;
    i--
  ) {
    bootMeaning.textContent =
      firstText.substring(
        0,
        i - 1
      ) +
      "â";

    await wait(
      55
    );
  }

  await wait(
    180
  );

  for (
    let i =
      stablePrefix.length;
    i <
      finalText.length;
    i++
  ) {
    bootMeaning.textContent =
      finalText.substring(
        0,
        i + 1
      ) +
      "â";

    await wait(
      38 +
      Math.random() *
      18
    );
  }

  await wait(
    450
  );

  bootMeaning.textContent =
    finalText +
    "â";

  await wait(
    180
  );

  bootMeaning.textContent =
    finalText;

  await wait(
    350
  );

  bootLogo.classList.add(
    "booted"
  );
}

[
  emailInput,
  passwordInput,
  confirmPasswordInput,
  displayNameInput
].forEach(
  input => {
    input.addEventListener(
      "input",
      updateButtonState
    );
  }
);

showLoginBtn.addEventListener(
  "click",
  () =>
    setMode(
      "login"
    )
);

showSignupBtn.addEventListener(
  "click",
  () =>
    setMode(
      "signup"
    )
);

loginBtn.addEventListener(
  "click",
  handleLogin
);

signupBtn.addEventListener(
  "click",
  handleSignup
);

forgotPasswordBtn.addEventListener(
  "click",
  handleForgotPassword
);

async function initializeSignInPage() {
  /*
   * No verification-code processing belongs on signin.html anymore.
   *
   * Email confirmation lands on /email-confirmed.html, which intentionally
   * does not initialize Supabase. Users then return here and sign in
   * manually.
   */

  try {
    const session =
      await getCurrentSession();

    /*
     * Preserve normal behavior for somebody who is already genuinely
     * signed in and intentionally visits signin.html.
     */
    if (session?.user) {
      window.location.replace(
        "home.html"
      );

      return;
    }
  } catch (error) {
    console.warn(
      "Existing session check failed:",
      error
    );
  }

  setMode(
    "login"
  );

  await playHeaderBoot();
}

initializeSignInPage();
