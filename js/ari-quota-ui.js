// ARI XP — Home composer daily question quota UI v1.0.2
(() => {
  "use strict";

  const pill = document.getElementById("ariDailyQuotaPill");
  const detail = document.getElementById("ariDailyQuotaDetail");
  const send = document.getElementById("ariSendBtn");
  const input = document.getElementById("ariInput");
  if (!pill || !send || !input) return;

  let quota = null;
  let detailTimer = null;
  let enforcingButtonState = false;
  const defaultPlaceholder = input.getAttribute("placeholder") || "What are you working on?";
  const CONFIRM_RE = /^(?:(?:yes|yep|yeah)(?:[,\s]+(?:please|(?:log|save|add|do) it))?|(?:i )?confirm(?:ed| it| that)?|do it|go ahead|save it|log it|add it|make it|update it|that's right|correct)[.!\s]*$/i;
  const CANCEL_RE = /^(?:no|nope|(?:please )?cancel(?: it| that| this)?|never mind|nevermind|(?:don't|do not)(?: (?:log|save|add|do) (?:it|that|this))?|stop)[.!\s]*$/i;

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function isExhausted() {
    if (!quota || quota.unlimited === true) return false;
    const remaining = finite(quota.remaining);
    return remaining !== null && (remaining <= 0 || quota.allowed === false);
  }

  function setDetail(text = "") {
    if (!detail) return;
    detail.textContent = text;
    detail.hidden = !text;
    clearTimeout(detailTimer);
    if (text) detailTimer = setTimeout(() => { detail.hidden = true; }, 3200);
  }

  function currentPendingAction() {
    return (
      window.CalBuddy?.getPendingAction?.() ||
      window.AriVNextBridge?.getPendingAction?.() ||
      null
    );
  }

  function isPendingResolutionText(value = input.value) {
    const text = String(value || "").replace(/’/g, "'").trim();
    return Boolean(currentPendingAction() && (CONFIRM_RE.test(text) || CANCEL_RE.test(text)));
  }

  function refreshComposerPresentation() {
    if (!isExhausted()) {
      input.placeholder = defaultPlaceholder;
      return;
    }
    input.placeholder = currentPendingAction()
      ? "Daily limit reached — use YES/CANCEL above"
      : "Daily limit reached — resets at midnight";
  }

  function enforceSendState() {
    if (enforcingButtonState || send.classList.contains("ari-stop-btn")) return;
    enforcingButtonState = true;
    try {
      const allowPendingResolution = isExhausted() && isPendingResolutionText();
      const shouldDisable = isExhausted() && !allowPendingResolution;

      if (shouldDisable) {
        if (send.dataset.ariQuotaDisabled !== "true") {
          send.dataset.ariQuotaDisabled = "true";
          send.disabled = true;
          send.setAttribute("aria-disabled", "true");
        }
      } else if (send.dataset.ariQuotaDisabled === "true") {
        send.disabled = false;
        send.removeAttribute("aria-disabled");
        delete send.dataset.ariQuotaDisabled;
      }

      refreshComposerPresentation();
    } finally {
      enforcingButtonState = false;
    }
  }

  function applyQuota(next = null) {
    if (!next || typeof next !== "object") return;
    quota = next;
    pill.hidden = false;

    if (next.unlimited === true) {
      pill.textContent = "UNLIMITED";
      pill.dataset.state = "unlimited";
      pill.setAttribute("aria-label", "Ari questions unlimited");
      enforceSendState();
      return;
    }

    const remaining = finite(next.remaining);
    const limit = finite(next.dailyLimit);
    if (remaining === null || limit === null) {
      pill.hidden = true;
      return;
    }

    const exhausted = remaining <= 0 || next.allowed === false;
    pill.textContent = exhausted ? "LIMIT REACHED" : `${remaining} LEFT`;
    pill.dataset.state = exhausted ? "exhausted" : remaining <= 3 ? "low" : "normal";
    pill.setAttribute(
      "aria-label",
      exhausted
        ? `Daily Ari question limit reached. ${limit} questions per day. Resets at midnight.`
        : `${remaining} of ${limit} Ari questions remaining. Resets at midnight.`
    );
    enforceSendState();
  }

  async function loadQuota() {
    const client = window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient;
    if (!client?.auth?.getSession) return;

    try {
      const { data } = await client.auth.getSession();
      const token = String(data?.session?.access_token || "").trim();
      if (!token) return;

      const response = await fetch("/api/ari-daily-chat-quota", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body?.quota) applyQuota(body.quota);
    } catch (error) {
      console.warn("Ari quota status could not be loaded:", error?.message || error);
    }
  }

  pill.addEventListener("click", () => {
    if (!quota) return;
    if (quota.unlimited === true) {
      setDetail("Owner access · Unlimited Ari questions");
      return;
    }
    const remaining = finite(quota.remaining);
    const limit = finite(quota.dailyLimit);
    if (remaining === null || limit === null) return;
    setDetail(`${remaining} of ${limit} Ari questions remaining · Resets at midnight`);
  });

  pill.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    pill.click();
  });

  // The Home composer temporarily turns SEND into STOP while Ari is thinking.
  // When it changes back to SEND, re-apply a zero-quota lock if needed.
  new MutationObserver(() => queueMicrotask(enforceSendState)).observe(send, {
    attributes: true,
    attributeFilter: ["class", "disabled"]
  });

  // At zero quota, a brand-new AI question is blocked. Resolving an already
  // prepared action is different: YES/CANCEL is local and must remain free.
  input.addEventListener("input", enforceSendState);
  input.addEventListener("keydown", (event) => {
    if (!isExhausted() || event.key !== "Enter" || event.shiftKey) return;
    if (isPendingResolutionText()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const limit = finite(quota?.dailyLimit) || 10;
    setDetail(`You've used your ${limit} Ari questions for today · Resets at midnight`);
  }, true);

  window.addEventListener("ari:dailyQuota", (event) => applyQuota(event?.detail?.quota));
  for (const eventName of [
    "calbuddy:pendingAction",
    "ari:vnextPendingAction",
    "calbuddy:pendingActionCleared",
    "ari:vnextPendingActionCleared"
  ]) {
    window.addEventListener(eventName, () => queueMicrotask(enforceSendState));
  }

  // Supabase config loads before this file, but auth restoration can finish a
  // moment later on mobile Safari. Load now and once more after auth settles.
  loadQuota();
  window.setTimeout(loadQuota, 650);
})();
