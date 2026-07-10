/*
=====================================================
ARI REBIRTH
File: account.js
Version: 1.0.0
Purpose:
  Account page behavior.
=====================================================
*/

document.addEventListener("DOMContentLoaded", loadAccount);

function goHome() {
  window.location.replace("index.html");
}

function setStatus(message = "", type = "") {
  const statusEl = document.getElementById("accountStatus");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("error", "success");

  if (type) {
    statusEl.classList.add(type);
  }
}

async function getSessionOrRedirect() {
  if (!window.calbuddySupabase) {
    setStatus("Supabase is not loaded. Check supabase-config.js.", "error");
    return null;
  }

  const {
    data: { session },
    error
  } = await window.calbuddySupabase.auth.getSession();

  if (error) {
    setStatus(error.message, "error");
    return null;
  }

  if (!session) {
    window.location.href = "signin.html";
    return null;
  }

  return session;
}

async function loadAccount() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  const emailEl = document.getElementById("userEmail");

  if (emailEl) {
    emailEl.textContent = session.user?.email || "No email found.";
  }

  setStatus("Account session active.", "success");
}

async function changeEmail() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  const currentEmail = session.user?.email || "";
  const newEmail = prompt("Enter your new email address:", currentEmail);

  if (!newEmail) return;

  const cleanEmail = String(newEmail).trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    setStatus("Please enter a valid email address.", "error");
    return;
  }

  setStatus("Sending confirmation email...", "");

  const { error } = await window.calbuddySupabase.auth.updateUser({
    email: cleanEmail
  });

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  setStatus("Confirmation email sent to your new address.", "success");
}

async function resetPassword() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  const email = session.user?.email;

  if (!email) {
    setStatus("No email address found for this account.", "error");
    return;
  }

  setStatus("Sending password reset email...", "");

  const { error } = await window.calbuddySupabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: window.location.origin + "/reset-password.html"
    }
  );

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  setStatus("Password reset email sent.", "success");
}

async function logoutUser() {
  if (!window.calbuddySupabase) {
    window.location.replace("signin.html");
    return;
  }

  setStatus("Signing out...", "");

  sessionStorage.removeItem("ari_boot_intro");

  const { error } = await window.calbuddySupabase.auth.signOut();

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  window.location.replace("signin.html");
}
