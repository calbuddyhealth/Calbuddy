/* =============================================================
   ARI CIRCLE — FEED ENTRY GUARD
   Version: 1.0.0

   Prevents ARI Circle from appearing frozen when auth/profile/age
   initialization is slow or a mobile browser restores a stale page.
============================================================= */

(() => {
  "use strict";

  const SOFT_TIMEOUT_MS = 2200;
  const HARD_TIMEOUT_MS = 8000;
  const $ = (id) => document.getElementById(id);

  function isFeedReady() {
    const page = $("feedPage");
    const loading = $("feedLoading");
    return Boolean(page && !page.hidden && (!loading || loading.hidden));
  }

  function revealShell() {
    const page = $("feedPage");
    if (page) page.hidden = false;
  }

  function showRecoverableLoading() {
    if (isFeedReady()) return;
    revealShell();

    const loading = $("feedLoading");
    if (!loading) return;

    loading.hidden = false;
    loading.innerHTML = `
      <div class="feed-loading__orb" aria-hidden="true"></div>
      <strong>Opening ARI Circle…</strong>
      <span>Connecting your social space.</span>
    `;
  }

  function showRecoveryActions() {
    if (isFeedReady()) return;
    revealShell();

    const loading = $("feedLoading");
    if (!loading) return;

    loading.hidden = false;
    loading.innerHTML = `
      <strong>ARI Circle is taking too long to open.</strong>
      <span>Your account is safe. Retry the Circle connection.</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px">
        <button id="circleEntryRetry" class="feed-primary" type="button">Try Again</button>
        <a class="feed-secondary" href="home.html">Back Home</a>
      </div>
    `;

    $("circleEntryRetry")?.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("retry", String(Date.now()));
      window.location.replace(url.toString());
    }, { once: true });
  }

  function clearStaleUi() {
    document.documentElement.style.removeProperty("overflow");
    document.body?.style?.removeProperty("overflow");

    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      if (dialog.id === "ageDialog") return;
      try { dialog.close(); } catch {}
    });
  }

  function startTimers() {
    window.setTimeout(showRecoverableLoading, SOFT_TIMEOUT_MS);
    window.setTimeout(showRecoveryActions, HARD_TIMEOUT_MS);
  }

  window.addEventListener("pageshow", () => {
    clearStaleUi();
    if (!isFeedReady()) startTimers();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      clearStaleUi();
      startTimers();
    }, { once: true });
  } else {
    clearStaleUi();
    startTimers();
  }
})();
