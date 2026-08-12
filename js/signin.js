// =====================================================
// ARI XP
// File: signin.js
// Version: 2.0.0
// Purpose: Sign-in and age-first account creation.
// Requires: supabase-config.js, auth.js, arixp-age-gate.js
// =====================================================

(() => {
  "use strict";

  const authCard = document.getElementById("authCard");
  const verifyCard = document.getElementById("verifyCard");
  const initScreen = document.getElementById("initScreen");
  const initTerminal = document.getElementById("initTerminal");

  const showLoginBtn = document.getElementById("showLoginBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");
  const loginPanel = document.getElementById("loginPanel");
  const signupFlow = document.getElementById("signupFlow");
  const ageStep = document.getElementById("ageStep");
  const signupDetailsStep = document.getElementById("signupDetailsStep");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

  const birthMonthInput = document.getElementById("birthMonth");
  const birthDayInput = document.getElementById("birthDay");
  const birthYearInput = document.getElementById("birthYear");
  const ageContinueBtn = document.getElementById("ageContinueBtn");
  const signupSignInBtn = document.getElementById("signupSignInBtn");

  const displayNameInput = document.getElementById("displayName");
  const signupEmailInput = document.getElementById("signupEmail");
  const signupPasswordInput = document.getElementById("signupPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const legalConsentInput = document.getElementById("legalConsent");
  const signupBtn = document.getElementById("signupBtn");
  const signupBackBtn = document.getElementById("signupBackBtn");

  const message = document.getElementById("authMessage");

  const AGE_RECHECK_STORAGE_KEY = "arixp_age_recheck_after";
  const AGE_RECHECK_DELAY_MS = 24 * 60 * 60 * 1000;

  let authMode = "login";
  let pendingDateOfBirth = "";

  function setMessage(text = "", type = "") {
    message.textContent = text;
    message.classList.remove("error", "success");

    if (type) {
      message.classList.add(type);
    }
  }

  function setInvalid(input, invalid) {
    input.setAttribute("aria-invalid", String(Boolean(invalid)));
  }

  function clearInvalidState(input) {
    input.removeAttribute("aria-invalid");
  }

  function showAgeStep() {
    ageStep.classList.remove("hidden");
    signupDetailsStep.classList.add("hidden");
    setMessage("");
  }

  function showSignupDetails() {
    ageStep.classList.add("hidden");
    signupDetailsStep.classList.remove("hidden");
    setMessage("");
    requestAnimationFrame(() => displayNameInput.focus({ preventScroll: true }));
  }

  function setMode(mode) {
    authMode = mode === "signup" ? "signup" : "login";
    const isSignup = authMode === "signup";

    showLoginBtn.classList.toggle("active", !isSignup);
    showSignupBtn.classList.toggle("active", isSignup);
    showLoginBtn.setAttribute("aria-selected", String(!isSignup));
    showSignupBtn.setAttribute("aria-selected", String(isSignup));
    loginPanel.classList.toggle("hidden", isSignup);
    signupFlow.classList.toggle("hidden", !isSignup);

    if (isSignup) {
      showAgeStep();
    } else {
      setMessage("");
    }
  }

  function isValidEmail(input) {
    return Boolean(input.value.trim()) && !input.validity.typeMismatch;
  }

  function validateLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const emailIsValid = isValidEmail(emailInput);

    setInvalid(emailInput, !emailIsValid);
    setInvalid(passwordInput, !password);

    if (!emailIsValid) {
      setMessage("Enter a valid email.", "error");
      emailInput.focus();
      return null;
    }

    if (!password) {
      setMessage("Enter your password.", "error");
      passwordInput.focus();
      return null;
    }

    return { email, password };
  }

  function getAgeRecheckTime() {
    try {
      return Number(window.localStorage.getItem(AGE_RECHECK_STORAGE_KEY) || 0);
    } catch {
      return 0;
    }
  }

  function temporarilyBlockAgeRecheck() {
    try {
      window.localStorage.setItem(
        AGE_RECHECK_STORAGE_KEY,
        String(Date.now() + AGE_RECHECK_DELAY_MS)
      );
    } catch {
      // The server-side age policy remains authoritative when storage is unavailable.
    }
  }

  function validateSignup() {
    const displayName = displayNameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const checks = [
      [displayNameInput, Boolean(displayName), "Enter a display name."],
      [signupEmailInput, isValidEmail(signupEmailInput), "Enter a valid email."],
      [signupPasswordInput, password.length >= 8, "Use at least 8 characters."],
      [confirmPasswordInput, password === confirmPassword && Boolean(confirmPassword), "Passwords do not match."],
      [legalConsentInput, legalConsentInput.checked, "Accept the terms to continue."]
    ];

    for (const [input, valid, errorMessage] of checks) {
      setInvalid(input, !valid);

      if (!valid) {
        setMessage(errorMessage, "error");
        input.focus();
        return null;
      }
    }

    if (!pendingDateOfBirth) {
      showAgeStep();
      setMessage("Enter your date of birth.", "error");
      return null;
    }

    return { displayName, email, password };
  }

  async function typeLine(row, text, speed = 12) {
    row.textContent = "";

    for (const character of text) {
      row.insertAdjacentText("beforeend", character);
      await new Promise(resolve => window.setTimeout(resolve, speed));
    }
  }

  async function startInitialization(name = "") {
    document.activeElement?.blur();
    authCard.classList.add("hidden");
    verifyCard.classList.add("hidden");
    initScreen.classList.remove("hidden");
    initTerminal.replaceChildren();
    window.scrollTo(0, 0);

    const lines = ["ARI XP", name ? `Welcome, ${name}.` : "Welcome."];

    for (const text of lines) {
      const row = document.createElement("div");
      row.className = "ari-init-line";
      initTerminal.appendChild(row);
      await typeLine(row, text, 18);
    }

    if (typeof setAriBootIntro === "function") {
      setAriBootIntro("returning");
    }

    await new Promise(resolve => window.setTimeout(resolve, 260));
    window.location.replace("home.html");
  }

  async function handleLogin(event) {
    event.preventDefault();
    const values = validateLogin();

    if (!values) return;

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";
    setMessage("");

    try {
      const { data, error } = await signInUser(values.email, values.password);

      if (error) {
        setMessage(error.message, "error");
        return;
      }

      if (!data?.user) {
        setMessage("Unable to sign in. Try again.", "error");
        return;
      }

      await createUserProfile(data.user);
      const accountState = await getAriAccountState(data.user.id);

      if (accountState?.status && accountState.status !== "active") {
        window.location.replace("account.html");
        return;
      }

      const name =
        data.user.user_metadata?.display_name ||
        data.user.email?.split("@")[0] ||
        "";

      await startInitialization(name);
    } catch (error) {
      console.error("ARI XP sign-in failed:", error);
      setMessage("Unable to sign in. Try again.", "error");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in";
    }
  }

  function handleAgeContinue() {
    if (getAgeRecheckTime() > Date.now()) {
      setMessage("You’re not eligible to create an account.", "error");
      return;
    }

    const result = window.AriXpAgeGate?.evaluate({
      month: birthMonthInput.value,
      day: birthDayInput.value,
      year: birthYearInput.value
    });

    const inputs = [birthMonthInput, birthDayInput, birthYearInput];

    if (!result?.valid) {
      inputs.forEach(input => setInvalid(input, true));
      setMessage("Enter a valid date of birth.", "error");
      birthMonthInput.focus();
      return;
    }

    if (!result.eligible) {
      temporarilyBlockAgeRecheck();
      pendingDateOfBirth = "";
      inputs.forEach(input => {
        input.value = "";
        setInvalid(input, true);
      });
      setMessage("You’re not eligible to create an account.", "error");
      return;
    }

    pendingDateOfBirth = result.dateOfBirth;
    inputs.forEach(clearInvalidState);
    showSignupDetails();
  }

  function normalizeSignupError(error) {
    const errorText = String(error?.message || "");

    if (/eligibility|date of birth|age gate|registration requirement/i.test(errorText)) {
      return "Unable to create this account.";
    }

    return errorText || "Unable to create this account.";
  }

  async function handleSignup(event) {
    event.preventDefault();
    const values = validateSignup();

    if (!values) return;

    signupBtn.disabled = true;
    signupBtn.textContent = "Creating…";
    setMessage("");

    try {
      const { data, error } = await signUpUser(
        values.email,
        values.password,
        values.displayName,
        {
          dateOfBirth: pendingDateOfBirth,
          termsAccepted: true,
          privacyAccepted: true,
          communityGuidelinesAccepted: true
        }
      );

      if (error) {
        setMessage(normalizeSignupError(error), "error");
        return;
      }

      if (!data?.user) {
        setMessage("Unable to create this account.", "error");
        return;
      }

      if (data.session) {
        try {
          await signOutUser();
        } catch (signOutError) {
          console.warn("Signup session cleanup failed:", signOutError);
        }
      }

      authCard.classList.add("hidden");
      verifyCard.classList.remove("hidden");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("ARI XP signup failed:", error);
      setMessage("Unable to create this account.", "error");
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = "Create account";
    }
  }

  async function handleForgotPassword() {
    const email = emailInput.value.trim();

    if (!isValidEmail(emailInput)) {
      setInvalid(emailInput, true);
      setMessage("Enter your email first.", "error");
      emailInput.focus();
      return;
    }

    forgotPasswordBtn.disabled = true;
    setMessage("Sending reset email…");

    try {
      const { error } = await sendPasswordReset(email);

      if (error) {
        setMessage(error.message, "error");
        return;
      }

      setMessage("Password reset email sent.", "success");
    } catch (error) {
      console.error("Password reset failed:", error);
      setMessage("Unable to send reset email.", "error");
    } finally {
      forgotPasswordBtn.disabled = false;
    }
  }

  function wireNumericDateFields() {
    const fields = [birthMonthInput, birthDayInput, birthYearInput];

    fields.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, input.maxLength);
        clearInvalidState(input);
        setMessage("");

        if (input.value.length === input.maxLength && fields[index + 1]) {
          fields[index + 1].focus();
        }
      });

      input.addEventListener("keydown", event => {
        if (event.key === "Backspace" && !input.value && fields[index - 1]) {
          fields[index - 1].focus();
        }
      });
    });
  }

  async function initialize() {
    try {
      const session = await getCurrentSession();

      if (session?.user) {
        const accountState = await getAriAccountState(session.user.id);
        window.location.replace(
          accountState?.status && accountState.status !== "active"
            ? "account.html"
            : "home.html"
        );
        return;
      }
    } catch (error) {
      console.warn("Existing session check failed:", error);
    }

    setMode("login");
  }

  [
    emailInput,
    passwordInput,
    displayNameInput,
    signupEmailInput,
    signupPasswordInput,
    confirmPasswordInput,
    legalConsentInput
  ].forEach(input => {
    input.addEventListener("input", () => {
      clearInvalidState(input);
      setMessage("");
    });
  });

  showLoginBtn.addEventListener("click", () => setMode("login"));
  showSignupBtn.addEventListener("click", () => setMode("signup"));
  signupSignInBtn.addEventListener("click", () => setMode("login"));
  signupBackBtn.addEventListener("click", showAgeStep);
  ageContinueBtn.addEventListener("click", handleAgeContinue);
  loginPanel.addEventListener("submit", handleLogin);
  signupDetailsStep.addEventListener("submit", handleSignup);
  forgotPasswordBtn.addEventListener("click", handleForgotPassword);

  wireNumericDateFields();
  initialize();
})();
