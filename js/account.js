/* ARI XP — My Account v3.2.0 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let currentSession = null;
  let currentState = null;

  function setStatus(message = "", type = "") {
    window.AriSettings?.setStatus($("accountStatus"), message, type);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (dialog?.showModal) dialog.showModal();
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  function setAccountControlExpanded(expanded) {
    const toggle = $("accountControlToggle");
    const content = $("accountControlContent");
    const icon = $("accountControlToggleIcon");
    const arrow = $("accountControlToggleArrow");

    if (!toggle || !content) return;

    const isExpanded = Boolean(expanded);
    toggle.setAttribute("aria-expanded", String(isExpanded));
    content.hidden = !isExpanded;

    if (icon) icon.textContent = isExpanded ? "−" : "+";
    if (arrow) arrow.textContent = isExpanded ? "⌄" : "›";
  }

  function formatDeletionDate(value) {
    if (!value) return "seven days after the request";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "short"
    }).format(new Date(value));
  }

  async function loadAccountState(userId) {
    const { data, error } = await window.calbuddySupabase
      .from("ari_account_state")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Account state unavailable:", error.message);
      return { user_id: userId, status: "active", setupPending: true };
    }

    return data || { user_id: userId, status: "active", setupPending: true };
  }

  function renderAccountState(state) {
    const recovery = $("accountRecoveryCard");
    const activeContent = $("accountActiveContent");
    const status = state?.status || "active";
    const isActive = status === "active";

    recovery.hidden = isActive;
    activeContent.hidden = !isActive;

    if (isActive) return;

    if (status === "pending_deletion") {
      $("recoveryKicker").textContent = "DELETION PENDING";
      $("recoveryTitle").textContent = "You still have time.";
      $("recoveryMessage").textContent =
        `Your account is scheduled for permanent deletion on ${formatDeletionDate(state.deletion_scheduled_for)}. Keep it now to cancel deletion.`;
      $("restoreAccountButton").textContent = "Keep my account";
      return;
    }

    if (status === "suspended_by_admin") {
      $("recoveryKicker").textContent = "ACCOUNT SUSPENDED";
      $("recoveryTitle").textContent = "This account needs review.";
      $("recoveryMessage").textContent = "Contact ARI Help & Safety for assistance with this account.";
      $("restoreAccountButton").textContent = "Contact Help & Safety";
      return;
    }

    $("recoveryKicker").textContent = "ACCOUNT PAUSED";
    $("recoveryTitle").textContent = "Your Ari is waiting.";
    $("recoveryMessage").textContent = "Your information stayed protected while you were away. Reactivate whenever you are ready.";
    $("restoreAccountButton").textContent = "Reactivate account";
  }

  async function checkOwnerAccess() {
    try {
      const { data, error } = await window.calbuddySupabase.rpc("is_ari_admin");
      if (!error && data === true) $("ownerModerationLink").hidden = false;
    } catch (error) {
      console.warn("Owner moderation check failed:", error);
    }
  }

  function configureSupportLink() {
    const config = window.ARI_SUPPORT_CONFIG || {};
    const supportUrl = String(config.supportUrl || "support-ari.html").trim();
    const link = $("supportAriLink");

    if (!link) return;

    if (config.enabled === true && supportUrl) {
      link.href = supportUrl;
      link.hidden = false;
      return;
    }

    link.hidden = true;
  }

  async function changeEmail() {
    const cleanEmail = String($("newEmailInput").value || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setStatus("Enter a valid email address.", "error");
      return;
    }

    $("confirmEmailButton").disabled = true;
    setStatus("Sending confirmation…", "working");

    const { error } = await window.calbuddySupabase.auth.updateUser({ email: cleanEmail });
    $("confirmEmailButton").disabled = false;

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    closeDialog("emailDialog");
    setStatus("Confirmation sent to your new email address.", "success");
  }

  async function resetPassword() {
    const email = currentSession?.user?.email;
    if (!email) return setStatus("No email address was found.", "error");

    $("changePasswordButton").disabled = true;
    setStatus("Sending your secure reset link…", "working");

    const { error } = await window.calbuddySupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    $("changePasswordButton").disabled = false;
    setStatus(
      error ? error.message : "Password reset email sent.",
      error ? "error" : "success"
    );
  }

  async function signOut(scope = "local") {
    setStatus("Signing out…", "working");
    sessionStorage.removeItem("ari_boot_intro");
    const { error } = await window.calbuddySupabase.auth.signOut({ scope });
    if (error) return setStatus(error.message, "error");
    window.location.replace("signin.html");
  }

  async function pauseAccount() {
    $("confirmPauseButton").disabled = true;
    const { error } = await window.calbuddySupabase.rpc("pause_my_ari_account");
    if (error) {
      $("confirmPauseButton").disabled = false;
      closeDialog("pauseDialog");
      return setStatus(error.message, "error");
    }
    await signOut("global");
  }

  async function requestDeletion() {
    if ($("deleteConfirmInput").value.trim().toUpperCase() !== "DELETE") return;

    $("confirmDeleteButton").disabled = true;
    const { error } = await window.calbuddySupabase.rpc("request_my_ari_account_deletion");
    if (error) {
      $("confirmDeleteButton").disabled = false;
      closeDialog("deleteDialog");
      return setStatus(error.message, "error");
    }
    await signOut("global");
  }

  async function restoreAccount() {
    if (currentState?.status === "suspended_by_admin") {
      window.location.assign("help-safety.html?type=account");
      return;
    }

    $("restoreAccountButton").disabled = true;
    setStatus("Restoring your account…", "working");
    const { data, error } = await window.calbuddySupabase.rpc("restore_my_ari_account");

    if (error) {
      $("restoreAccountButton").disabled = false;
      return setStatus(error.message, "error");
    }

    currentState = data;
    window.location.replace("home.html");
  }

  function goHome() {
    if ((currentState?.status || "active") !== "active") {
      setStatus("Reactivate your account before returning home.", "error");
      return;
    }
    window.location.assign("home.html");
  }

  function bindEvents() {
    $("accountBackButton").addEventListener("click", goHome);
    $("accountHomeButton").addEventListener("click", goHome);
    $("changeEmailButton").addEventListener("click", () => {
      $("newEmailInput").value = currentSession?.user?.email || "";
      openDialog("emailDialog");
    });
    $("emailDialogForm").addEventListener("submit", (event) => {
      event.preventDefault();
      changeEmail();
    });
    $("changePasswordButton").addEventListener("click", resetPassword);
    $("accountControlToggle").addEventListener("click", () => {
      const expanded = $("accountControlToggle").getAttribute("aria-expanded") === "true";
      setAccountControlExpanded(!expanded);
    });
    $("signOutButton").addEventListener("click", () => signOut("local"));
    $("pauseAccountButton").addEventListener("click", () => openDialog("pauseDialog"));
    $("confirmPauseButton").addEventListener("click", (event) => {
      event.preventDefault();
      pauseAccount();
    });
    $("deleteAccountButton").addEventListener("click", () => {
      $("deleteConfirmInput").value = "";
      $("confirmDeleteButton").disabled = true;
      openDialog("deleteDialog");
    });
    $("deleteConfirmInput").addEventListener("input", () => {
      $("confirmDeleteButton").disabled =
        $("deleteConfirmInput").value.trim().toUpperCase() !== "DELETE";
    });
    $("deleteDialogForm").addEventListener("submit", (event) => {
      event.preventDefault();
      requestDeletion();
    });
    $("restoreAccountButton").addEventListener("click", restoreAccount);
  }

  async function init() {
    bindEvents();
    configureSupportLink();
    setAccountControlExpanded(false);

    currentSession = await window.AriSettings.requireSession();
    if (!currentSession) return;

    const email = currentSession.user?.email || "Email unavailable";
    $("userEmail").textContent = email;
    $("userInitial").textContent = email.charAt(0).toUpperCase() || "A";

    currentState = await loadAccountState(currentSession.user.id);
    renderAccountState(currentState);
    await checkOwnerAccess();

    if (currentState.setupPending) {
      setStatus("Finish the one-time Supabase setup to enable account recovery.", "info");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
