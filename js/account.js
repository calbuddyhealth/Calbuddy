/* ARI XP — My Account v3.5.0 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let currentSession = null;
  let currentState = null;
  let currentAgeCorrection = null;

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

  function formatBirthday(value) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "Not available";
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isFinite(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function deriveAge(value, now = new Date()) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const [year, month, day] = text.split("-").map(Number);
    let age = now.getUTCFullYear() - year;
    const monthDelta = now.getUTCMonth() + 1 - month;
    if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < day)) age -= 1;
    return Number.isFinite(age) && age >= 0 && age <= 120 ? age : null;
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

  async function loadAgeCorrectionState() {
    const subtitle = $("birthdayCorrectionSubtitle");
    const fallbackDob = currentState?.date_of_birth || null;

    try {
      const { data, error } = await window.calbuddySupabase.rpc("ari_my_age_correction_status");
      if (error) throw error;
      currentAgeCorrection = data || null;
    } catch (error) {
      // The RPC is introduced by the vNext migration. Until that migration is
      // activated, keep the existing account page usable and show account DOB.
      console.warn("Age correction status unavailable:", error?.message || error);
      currentAgeCorrection = {
        date_of_birth: fallbackDob,
        derived_age: deriveAge(fallbackDob),
        latest_request: null,
        setupPending: true
      };
    }

    const dob = currentAgeCorrection?.date_of_birth || fallbackDob;
    const age = Number(currentAgeCorrection?.derived_age ?? deriveAge(dob));
    const latest = currentAgeCorrection?.latest_request || null;

    if (latest?.status === "pending") {
      subtitle.textContent = "Correction pending owner review";
      return;
    }

    if (Number.isFinite(age)) {
      subtitle.textContent = `Account age ${age} · protected birthday`;
    } else {
      subtitle.textContent = "Protected account birthday";
    }
  }

  async function loadOwnerSafetySummary() {
    const link = $("ownerModerationLink");
    if (!link) return;

    const subtitle = link.querySelector(".ari-action-copy small");
    const pill = link.querySelector(".ari-owner-pill");

    let teenOpen = 0;
    let teenHigh = 0;
    let agePending = 0;
    let boundaryPending = 0;

    try {
      const { data, error } = await window.calbuddySupabase.rpc("ari_admin_teen_safety_summary");
      if (!error && data?.authorized === true) {
        teenOpen = Math.max(0, Number(data.open || 0));
        teenHigh = Math.max(0, Number(data.high_priority || 0));
      }
    } catch (error) {
      console.warn("Owner teen safety summary unavailable:", error?.message || error);
    }

    try {
      const { data, error } = await window.calbuddySupabase.rpc("ari_owner_age_correction_summary");
      if (!error && data?.authorized === true) {
        agePending = Math.max(0, Number(data.pending || 0));
        boundaryPending = Math.max(0, Number(data.age_boundary_changes || 0));
      }
    } catch (error) {
      // Safe during the branch period before the staged migration is activated.
      console.warn("Owner age-correction summary unavailable:", error?.message || error);
    }

    const totalOpen = teenOpen + agePending;
    const urgent = teenHigh + boundaryPending;

    if (subtitle) {
      if (agePending > 0) {
        subtitle.textContent = `${teenOpen.toLocaleString()} teen safety · ${agePending.toLocaleString()} age correction${agePending === 1 ? "" : "s"}`;
      } else if (teenHigh > 0) {
        subtitle.textContent = `${teenOpen.toLocaleString()} teen safety open · ${teenHigh.toLocaleString()} high priority`;
      } else if (teenOpen > 0) {
        subtitle.textContent = `${teenOpen.toLocaleString()} teen safety event${teenOpen === 1 ? "" : "s"} open`;
      } else {
        subtitle.textContent = "Reports, teen safety & age corrections";
      }
    }

    if (pill) {
      pill.textContent = totalOpen > 0 ? `OWNER · ${Math.min(totalOpen, 99)}${totalOpen > 99 ? "+" : ""}` : "OWNER";
      pill.dataset.alert = urgent > 0 ? "high" : totalOpen > 0 ? "open" : "clear";
    }

    link.setAttribute("aria-label", `Owner moderation, ${totalOpen} safety or age-review items open`);
  }

  async function checkOwnerAccess() {
    try {
      const { data, error } = await window.calbuddySupabase.rpc("is_ari_admin");
      if (!error && data === true) {
        $("ownerModerationLink").hidden = false;
        await loadOwnerSafetySummary();
      }
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

  function ensureBlockedUsersLink() {
    if ($("blockedUsersLink")) return;

    const helpSafetyLink = document.querySelector('a.ari-action-card[href="help-safety.html"]');
    const list = helpSafetyLink?.parentElement;
    if (!helpSafetyLink || !list) return;

    const link = document.createElement("a");
    link.className = "ari-action-card";
    link.id = "blockedUsersLink";
    link.href = "blocked-users.html";

    const icon = document.createElement("span");
    icon.className = "ari-action-icon ari-action-icon--muted";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⊘";

    const copy = document.createElement("span");
    copy.className = "ari-action-copy";

    const title = document.createElement("strong");
    title.textContent = "Blocked users";

    const subtitle = document.createElement("small");
    subtitle.textContent = "Review or unblock people";

    const arrow = document.createElement("span");
    arrow.className = "ari-action-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "›";

    copy.append(title, subtitle);
    link.append(icon, copy, arrow);
    list.insertBefore(link, helpSafetyLink);
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

  function openBirthdayCorrection() {
    const latest = currentAgeCorrection?.latest_request || null;
    if (latest?.status === "pending") {
      setStatus("Your birthday correction is already pending owner review. Your current account birthday remains active until a decision is made.", "info");
      return;
    }

    const provider = String(currentSession?.user?.app_metadata?.provider || "email").toLowerCase();
    if (provider !== "email") {
      setStatus("Birthday correction currently requires email/password re-authentication. Contact Help & Safety if this account uses another sign-in method.", "info");
      return;
    }

    const dob = currentAgeCorrection?.date_of_birth || currentState?.date_of_birth || "";
    $("currentBirthdayDisplay").textContent = formatBirthday(dob);
    $("requestedBirthdayInput").value = "";
    $("requestedBirthdayInput").max = new Date().toISOString().slice(0, 10);
    $("birthdayEmailInput").value = currentSession?.user?.email || "";
    $("birthdayPasswordInput").value = "";
    $("birthdayExplanationInput").value = "";
    openDialog("birthdayCorrectionDialog");
  }

  async function requestBirthdayCorrection() {
    const button = $("submitBirthdayCorrectionButton");
    const sessionEmail = String(currentSession?.user?.email || "").trim().toLowerCase();
    const enteredEmail = String($("birthdayEmailInput").value || "").trim().toLowerCase();
    const password = String($("birthdayPasswordInput").value || "");
    const requestedDob = String($("requestedBirthdayInput").value || "").trim();
    const explanation = String($("birthdayExplanationInput").value || "").trim();
    const existingDob = String(currentAgeCorrection?.date_of_birth || currentState?.date_of_birth || "").trim();

    if (!sessionEmail || enteredEmail !== sessionEmail) {
      setStatus("Enter the email address for the account you are currently signed into.", "error");
      return;
    }
    if (!password) {
      setStatus("Enter your current password to verify this request.", "error");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDob) || requestedDob === existingDob) {
      setStatus(requestedDob === existingDob ? "That is already your protected account birthday." : "Enter the correct birthday.", "error");
      return;
    }
    if (explanation.length < 20) {
      setStatus("Please explain why the birthday needs to be corrected.", "error");
      return;
    }

    button.disabled = true;
    setStatus("Verifying your account…", "working");

    try {
      const { data: authData, error: authError } = await window.calbuddySupabase.auth.signInWithPassword({
        email: sessionEmail,
        password
      });
      $("birthdayPasswordInput").value = "";

      if (authError || !authData?.user?.id) {
        throw new Error(authError?.message || "Email or password could not be verified.");
      }
      if (authData.user.id !== currentSession?.user?.id) {
        throw new Error("The verified credentials do not match this account.");
      }

      currentSession = authData.session ? { ...currentSession, ...authData.session, user: authData.user } : currentSession;
      setStatus("Submitting for owner review…", "working");

      const { data, error } = await window.calbuddySupabase.rpc("ari_request_my_age_correction", {
        requested_date_of_birth: requestedDob,
        requested_explanation: explanation
      });
      if (error) throw error;

      closeDialog("birthdayCorrectionDialog");
      currentAgeCorrection = {
        ...(currentAgeCorrection || {}),
        latest_request: {
          id: data?.request_id || null,
          requested_date_of_birth: requestedDob,
          status: "pending",
          requested_at: new Date().toISOString()
        }
      };
      await loadAgeCorrectionState();
      setStatus("Birthday correction submitted. Your current age and safety settings stay unchanged until the owner approves or denies it.", "success");
    } catch (error) {
      $("birthdayPasswordInput").value = "";
      setStatus(error?.message || "Birthday correction could not be submitted.", "error");
    } finally {
      button.disabled = false;
    }
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
    $("birthdayCorrectionButton").addEventListener("click", openBirthdayCorrection);
    $("birthdayCorrectionForm").addEventListener("submit", (event) => {
      event.preventDefault();
      requestBirthdayCorrection();
    });
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
    ensureBlockedUsersLink();
    setAccountControlExpanded(false);

    currentSession = await window.AriSettings.requireSession();
    if (!currentSession) return;

    const email = currentSession.user?.email || "Email unavailable";
    $("userEmail").textContent = email;
    $("userInitial").textContent = email.charAt(0).toUpperCase() || "A";

    currentState = await loadAccountState(currentSession.user.id);
    renderAccountState(currentState);
    await Promise.allSettled([
      loadAgeCorrectionState(),
      checkOwnerAccess()
    ]);

    if (currentState.setupPending) {
      setStatus("Finish the one-time Supabase setup to enable account recovery.", "info");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
