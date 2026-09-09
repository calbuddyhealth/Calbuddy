// ARI XP — Home composer daily question quota UI v1.0.0
(() => {
  "use strict";

  const pill = document.getElementById("ariDailyQuotaPill");
  const detail = document.getElementById("ariDailyQuotaDetail");
  const send = document.getElementById("ariSendBtn");
  if (!pill || !send) return;

  let quota = null;
  let detailTimer = null;

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function setDetail(text = "") {
    if (!detail) return;
    detail.textContent = text;
    detail.hidden = !text;
    clearTimeout(detailTimer);
    if (text) detailTimer = setTimeout(() => { detail.hidden = true; }, 3200);
  }

  function applyQuota(next = null) {
    if (!next || typeof next !== "object") return;
    quota = next;
    pill.hidden = false;

    if (next.unlimited === true) {
      pill.textContent = "UNLIMITED";
      pill.dataset.state = "unlimited";
      pill.setAttribute("aria-label", "Ari questions unlimited");
      if (send.dataset.ariQuotaDisabled === "true") send.disabled = false;
      delete send.dataset.ariQuotaDisabled;
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

    if (exhausted) {
      if (!send.disabled) send.dataset.ariQuotaDisabled = "true";
      send.disabled = true;
      send.setAttribute("aria-disabled", "true");
    } else if (send.dataset.ariQuotaDisabled === "true") {
      send.disabled = false;
      send.removeAttribute("aria-disabled");
      delete send.dataset.ariQuotaDisabled;
    }
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

  window.addEventListener("ari:dailyQuota", (event) => applyQuota(event?.detail?.quota));

  // Supabase config loads before this file, but auth restoration can finish a
  // moment later on mobile Safari. Load now and once more after auth settles.
  loadQuota();
  window.setTimeout(loadQuota, 650);
})();
