/* =============================================================
   ARI CIRCLE — PROFILE CONNECTION ACTION AUTHORITY
   Version: 1.0.1
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.1";
  const state = {
    started: false,
    applying: false,
    scheduled: false,
    observer: null,
    unsubscribe: null
  };

  const normalize = (value) => String(value ?? "").trim().toLowerCase();
  const app = () => window.AriCircleApp || window.Ari?.circle || null;
  const store = () => app()?.modules?.CircleStore || null;
  const button = () => document.getElementById("circle-connection-action");

  function canonicalState() {
    const currentStore = store();
    if (!currentStore) return null;

    const context = currentStore.get?.("context") || currentStore.getState?.()?.context || null;
    const connection = currentStore.get?.("connection") || currentStore.getState?.()?.connection || {};

    return {
      context,
      status: normalize(connection?.status) || "none"
    };
  }

  function desiredUi(status) {
    if (status === "outgoing_pending") {
      return {
        text: "Requested ✓",
        ariaLabel: "Cancel Circle request"
      };
    }

    if (status === "incoming_pending") {
      return {
        text: "Respond to Request",
        ariaLabel: "Respond to Circle request"
      };
    }

    return {
      text: "Add to Circle",
      ariaLabel: "Add to Circle"
    };
  }

  function apply() {
    if (state.applying) return false;

    const target = button();
    const current = canonicalState();
    if (!target || !current?.context?.isVisitor) return false;

    const status = current.status;
    if (!["none", "outgoing_pending", "incoming_pending"].includes(status)) return false;

    const desired = desiredUi(status);
    let changed = false;

    state.applying = true;
    try {
      if (target.hidden) {
        target.hidden = false;
        changed = true;
      }

      if (target.disabled) {
        target.disabled = false;
        changed = true;
      }

      if (target.dataset.circleAction !== "connection") {
        target.dataset.circleAction = "connection";
        changed = true;
      }

      if (target.dataset.connectionState !== status) {
        target.dataset.connectionState = status;
        changed = true;
      }

      if (target.textContent !== desired.text) {
        target.textContent = desired.text;
        changed = true;
      }

      if (target.getAttribute("aria-label") !== desired.ariaLabel) {
        target.setAttribute("aria-label", desired.ariaLabel);
        changed = true;
      }
    } finally {
      state.applying = false;
    }

    return changed;
  }

  function scheduleApply() {
    if (state.applying || state.scheduled) return;

    state.scheduled = true;
    queueMicrotask(() => {
      state.scheduled = false;
      apply();
    });
  }

  function observeButton() {
    const target = button();
    if (!target || state.observer) return;

    state.observer = new MutationObserver(() => {
      scheduleApply();
    });

    state.observer.observe(target, {
      attributes: true,
      attributeFilter: [
        "disabled",
        "hidden",
        "data-circle-action",
        "data-connection-state",
        "aria-label"
      ],
      childList: true
    });
  }

  function bindStore() {
    const currentStore = store();
    if (!currentStore?.subscribe || state.unsubscribe) return;

    state.unsubscribe = currentStore.subscribe((_, change) => {
      const keys = Array.isArray(change?.keys) ? change.keys : [];
      if (
        !keys.length ||
        keys.includes("connection") ||
        keys.includes("context") ||
        keys.includes("profile")
      ) {
        apply();
      }
    });
  }

  function refresh() {
    bindStore();
    observeButton();
    apply();
  }

  function start() {
    if (state.started || !document.body.classList.contains("ari-circle-page")) return;

    state.started = true;
    refresh();
    requestAnimationFrame(refresh);
    setTimeout(refresh, 120);
    setTimeout(refresh, 320);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  document.addEventListener("circle:app-ready", refresh);
  document.addEventListener("circle:connection-changed", refresh);
  document.addEventListener("circle:connection-requested", refresh);

  window.AriCircleProfileConnectionAuthority = Object.freeze({
    version: VERSION,
    refresh
  });
})();
