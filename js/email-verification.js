// =====================================================
// ARI XP
// File: js/email-verification.js
// Version: 1.0.0
// Purpose:
//   Smooth email confirmation fallback for new accounts.
//   Supports resend + optional 6-digit signup OTP verification.
// =====================================================

(() => {
  "use strict";

  const STORAGE_KEY = "arixp_pending_signup_email";

  const signupForm = document.getElementById("signupDetailsStep");
  const signupEmail = document.getElementById("signupEmail");
  const verifyCard = document.getElementById("verifyCard");
  const verifyEmailLabel = document.getElementById("verifyEmailLabel");
  const verifyCodeInput = document.getElementById("verifyCodeInput");
  const verifyCodeButton = document.getElementById("verifyCodeButton");
  const resendConfirmationButton = document.getElementById("resendConfirmationButton");
  const verificationMessage = document.getElementById("verificationMessage");

  function cleanEmail(value = "") {
    return String(value || "").trim().toLowerCase();
  }

  function pendingEmail() {
    const current = cleanEmail(signupEmail?.value);
    if (current) return current;

    try {
      return cleanEmail(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return "";
    }
  }

  function rememberEmail(email) {
    const clean = cleanEmail(email);
    if (!clean) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, clean);
    } catch {
      // Non-critical. The form field remains available in the current page.
    }
  }

  function setVerificationMessage(text = "", type = "") {
    if (!verificationMessage) return;
    verificationMessage.textContent = text;
    verificationMessage.classList.remove("error", "success");
    if (type) verificationMessage.classList.add(type);
  }

  function syncEmailLabel() {
    if (!verifyEmailLabel) return;
    const email = pendingEmail();
    verifyEmailLabel.textContent = email || "your email";
  }

  signupForm?.addEventListener("submit", () => {
    rememberEmail(signupEmail?.value);
    window.setTimeout(syncEmailLabel, 0);
  }, true);

  signupEmail?.addEventListener("input", () => {
    rememberEmail(signupEmail.value);
  });

  verifyCodeInput?.addEventListener("input", () => {
    verifyCodeInput.value = verifyCodeInput.value.replace(/\D/g, "").slice(0, 6);
    setVerificationMessage("");
  });

  verifyCodeButton?.addEventListener("click", async () => {
    const email = pendingEmail();
    const token = String(verifyCodeInput?.value || "").replace(/\D/g, "").slice(0, 6);

    if (!email) {
      setVerificationMessage("Return to Create Account and enter your email again.", "error");
      return;
    }

    if (token.length !== 6) {
      setVerificationMessage("Enter the 6-digit code from your email.", "error");
      verifyCodeInput?.focus();
      return;
    }

    verifyCodeButton.disabled = true;
    verifyCodeButton.textContent = "Verifying…";
    setVerificationMessage("");

    try {
      const { error } = await verifySignupCode(email, token);

      if (error) {
        setVerificationMessage("That code is invalid or expired. Request a new email and try again.", "error");
        return;
      }

      try {
        await window.calbuddySupabase.auth.signOut();
      } catch {
        // Confirmation succeeded even if cleanup is unavailable.
      }

      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Non-critical.
      }

      window.location.replace("/email-confirmed.html");
    } catch (error) {
      console.error("ARI XP confirmation code failed:", error);
      setVerificationMessage("Unable to verify that code right now. Try again.", "error");
    } finally {
      verifyCodeButton.disabled = false;
      verifyCodeButton.textContent = "Verify code";
    }
  });

  resendConfirmationButton?.addEventListener("click", async () => {
    const email = pendingEmail();

    if (!email) {
      setVerificationMessage("Return to Create Account and enter your email again.", "error");
      return;
    }

    resendConfirmationButton.disabled = true;
    resendConfirmationButton.textContent = "Sending…";
    setVerificationMessage("");

    try {
      const { error } = await resendSignupConfirmation(email);

      if (error) {
        setVerificationMessage(error.message || "Unable to resend the confirmation email.", "error");
        return;
      }

      setVerificationMessage("New confirmation email sent.", "success");
    } catch (error) {
      console.error("ARI XP confirmation resend failed:", error);
      setVerificationMessage("Unable to resend the confirmation email right now.", "error");
    } finally {
      resendConfirmationButton.disabled = false;
      resendConfirmationButton.textContent = "Resend email";
    }
  });

  if (verifyCard) {
    const observer = new MutationObserver(() => {
      if (!verifyCard.classList.contains("hidden")) syncEmailLabel();
    });
    observer.observe(verifyCard, { attributes: true, attributeFilter: ["class"] });
  }

  syncEmailLabel();
})();
