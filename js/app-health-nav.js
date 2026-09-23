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

  function getOwnerOnlyNavItems() {
    return Array.from(document.querySelectorAll("[data-ari-owner-only]"));
  }

  function setOwnerOnlyVisibility(visible) {
    getOwnerOnlyNavItems().forEach((item) => {
      item.hidden = !visible;
      item.setAttribute("aria-hidden", visible ? "false" : "true");
    });
  }

  async function initializeOwnerHealthNav() {
    const nav = getNav();
    if ((!nav && !getOwnerOnlyNavItems().length) || !window.CalBuddy) return;

    try {
      const session = await window.CalBuddy.getCurrentSession?.();
      if (!session) return;

      const isOwner = await window.CalBuddy.verifyOwnerSession?.();
      if (!isOwner) return;

      setOwnerOnlyVisibility(true);

      if (!nav) return;
      setNavState("unknown");

      try {
        setNavState(await getHealthStatus());
      } catch {
        setNavState("unknown");
      }
    } catch {
      setOwnerOnlyVisibility(false);
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
