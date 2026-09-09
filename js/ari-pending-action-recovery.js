// ARI XP — pending-action recovery + quota protection v1.0.0
(() => {
  "use strict";

  const CONFIRM_RE = /^(?:(?:yes|yep|yeah)(?:[,\s]+(?:please|(?:log|save|add|do) it))?|(?:i )?confirm(?:ed| it| that)?|do it|go ahead|save it|log it|add it|make it|update it|that's right|correct)[.!\s]*$/i;
  const CANCEL_RE = /^(?:no|nope|(?:please )?cancel(?: it| that| this)?|never mind|nevermind|(?:don't|do not)(?: (?:log|save|add|do) (?:it|that|this))?|stop)[.!\s]*$/i;

  function clean(value = "") {
    return String(value || "").replace(/’/g, "'").trim();
  }

  function currentPendingAction() {
    const legacy = window.CalBuddy?.getPendingAction?.() || null;
    if (legacy) return legacy;
    return window.AriVNextBridge?.getPendingAction?.() || null;
  }

  function pendingConfirmationText(action = {}) {
    const direct = clean(action?.confirmation_text || action?.confirmationText);
    if (direct) return direct;

    const name = clean(action?.name || action?.action_type).toLowerCase();
    if (name === "edit_workout") return "Apply this workout change?";
    if (name === "plan_workout") return "Save this workout plan?";
    if (name === "log_meal") return "Log this meal?";
    if (name === "log_activity") return "Log this activity?";
    if (name === "log_weight") return "Log this weight?";
    if (name === "update_goal") return "Update this goal?";
    return "Confirm this action?";
  }

  function showRecoveredPending(action = currentPendingAction()) {
    const bar = document.getElementById("pendingActionBar");
    const text = document.getElementById("pendingActionText");
    if (!bar || !text || !action) return false;

    text.textContent = pendingConfirmationText(action);
    bar.classList.add("show");
    bar.setAttribute("data-ari-pending-recovered", "true");
    return true;
  }

  function hideRecoveredPendingIfEmpty() {
    if (currentPendingAction()) return false;
    const bar = document.getElementById("pendingActionBar");
    if (!bar) return false;
    bar.classList.remove("show");
    bar.removeAttribute("data-ari-pending-recovered");
    return true;
  }

  function clearComposer() {
    const input = document.getElementById("ariInput");
    if (!input) return;
    input.value = "";
    try { window.autoResizeAriInput?.(); } catch {}
  }

  async function interceptPendingConfirmation(message = "") {
    const pending = currentPendingAction();
    if (!pending) return false;

    const text = clean(message);
    if (CONFIRM_RE.test(text)) {
      clearComposer();
      showRecoveredPending(pending);
      await window.confirmAriAction?.();
      return true;
    }

    if (CANCEL_RE.test(text)) {
      clearComposer();
      showRecoveredPending(pending);
      await window.cancelAriAction?.();
      return true;
    }

    return false;
  }

  function installSendGuard() {
    const original = window.sendAriMessage;
    if (typeof original !== "function" || original.__ariPendingRecoveryWrapped) return false;

    async function guardedSendAriMessage(...args) {
      const input = document.getElementById("ariInput");
      const message = clean(input?.value);

      // A confirmation/cancellation belongs to the already-created pending action.
      // Execute it locally so a rendering glitch can never spend another AI turn.
      if (message && await interceptPendingConfirmation(message)) {
        window.setTimeout(() => {
          if (currentPendingAction()) showRecoveredPending();
          else hideRecoveredPendingIfEmpty();
        }, 0);
        return;
      }

      const result = await original.apply(this, args);

      // Home's normal renderer only sees response.pendingAction. Recover from the
      // authoritative pending stores when another wrapper dropped that property.
      if (currentPendingAction()) showRecoveredPending();
      else hideRecoveredPendingIfEmpty();
      return result;
    }

    guardedSendAriMessage.__ariPendingRecoveryWrapped = true;
    guardedSendAriMessage.__ariPendingRecoveryOriginal = original;
    window.sendAriMessage = guardedSendAriMessage;
    return true;
  }

  function syncPendingActionBar() {
    installSendGuard();
    if (currentPendingAction()) showRecoveredPending();
    else hideRecoveredPendingIfEmpty();
  }

  window.addEventListener("calbuddy:pendingAction", syncPendingActionBar);
  window.addEventListener("ari:vnextPendingAction", syncPendingActionBar);
  window.addEventListener("ari:runtimeReady", () => window.setTimeout(syncPendingActionBar, 0));
  window.addEventListener("calbuddy:pendingActionCleared", hideRecoveredPendingIfEmpty);
  window.addEventListener("ari:vnextPendingActionCleared", hideRecoveredPendingIfEmpty);
  window.addEventListener("focus", syncPendingActionBar);
  window.addEventListener("pageshow", () => window.setTimeout(syncPendingActionBar, 0));

  document.addEventListener("DOMContentLoaded", () => {
    syncPendingActionBar();
    window.setTimeout(syncPendingActionBar, 250);
    window.setTimeout(syncPendingActionBar, 900);
  });

  // home.js is normally already loaded when this patch executes.
  syncPendingActionBar();
})();
