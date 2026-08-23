(() => {
  "use strict";

  function getNav() {
    return document.getElementById("ariAppHealthNav");
  }

  function setNavState(state = "unknown") {
    const nav = getNav();
    if (!nav) return;

    const normalized = ["healthy", "running", "needs_attention", "warning", "unknown"].includes(state)
      ? state
      : "unknown";

    nav.dataset.healthStatus = normalized;

    const label = nav.querySelector("[data-app-health-nav-state]");
    if (!label) return;

    const labels = {
      healthy: "HEALTHY",
      running: "SWEEP RUNNING",
      needs_attention: "FIX REQUIRED",
      warning: "CHECK REQUIRED",
      unknown: "STATUS CHECK"
    };

    label.textContent = labels[normalized];
  }

  async function getHealthStatus() {
    const headers = await window.CalBuddy.getOwnerRequestHeaders();
    const response = await fetch("/api/ari-app-health", {
      method: "GET",
      headers,
      cache: "no-store"
    });

    if (!response.ok) return "unknown";
    const data = await response.json().catch(() => ({}));
    return data?.overall || "unknown";
  }

  async function initializeOwnerHealthNav() {
    const nav = getNav();
    if (!nav || !window.CalBuddy) return;

    try {
      const session = await window.CalBuddy.getCurrentSession?.();
      if (!session) return;

      const isOwner = await window.CalBuddy.verifyOwnerSession?.();
      if (!isOwner) return;

      nav.hidden = false;
      nav.setAttribute("aria-hidden", "false");
      setNavState("unknown");

      try {
        setNavState(await getHealthStatus());
      } catch {
        setNavState("unknown");
      }
    } catch {
      nav.hidden = true;
      nav.setAttribute("aria-hidden", "true");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(initializeOwnerHealthNav, 350);
    }, { once: true });
  } else {
    window.setTimeout(initializeOwnerHealthNav, 350);
  }
})();
