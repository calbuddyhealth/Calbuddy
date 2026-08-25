/* =============================================================
   ARI CIRCLE — PROFILE CONNECTION ACTION AUTHORITY
   Version: 1.0.0
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const state = { started:false, applying:false, observer:null, unsubscribe:null };
  const normalize = (value) => String(value ?? "").trim().toLowerCase();
  const app = () => window.AriCircleApp || window.Ari?.circle || null;
  const store = () => app()?.modules?.CircleStore || null;
  const button = () => document.getElementById("circle-connection-action");

  function canonicalState() {
    const currentStore = store();
    if (!currentStore) return null;
    const context = currentStore.get?.("context") || currentStore.getState?.()?.context || null;
    const connection = currentStore.get?.("connection") || currentStore.getState?.()?.connection || {};
    return { context, status: normalize(connection?.status) || "none" };
  }

  function apply() {
    if (state.applying) return;
    const target = button();
    const current = canonicalState();
    if (!target || !current?.context?.isVisitor) return;

    const status = current.status;
    if (!["none", "outgoing_pending", "incoming_pending"].includes(status)) return;

    state.applying = true;
    try {
      target.hidden = false;
      target.disabled = false;
      target.dataset.circleAction = "connection";
      target.dataset.connectionState = status;

      if (status === "outgoing_pending") {
        target.textContent = "Requested ✓";
        target.setAttribute("aria-label", "Cancel Circle request");
      } else if (status === "incoming_pending") {
        target.textContent = "Respond to Request";
        target.setAttribute("aria-label", "Respond to Circle request");
      } else {
        target.textContent = "Add to Circle";
        target.setAttribute("aria-label", "Add to Circle");
      }
    } finally {
      state.applying = false;
    }
  }

  function observeButton() {
    const target = button();
    if (!target || state.observer) return;
    state.observer = new MutationObserver(() => {
      if (state.applying) return;
      queueMicrotask(apply);
    });
    state.observer.observe(target, {
      attributes:true,
      attributeFilter:["disabled","hidden","data-circle-action","data-connection-state","aria-label"],
      childList:true,
      subtree:true
    });
  }

  function bindStore() {
    const currentStore = store();
    if (!currentStore?.subscribe || state.unsubscribe) return;
    state.unsubscribe = currentStore.subscribe((_, change) => {
      const keys = Array.isArray(change?.keys) ? change.keys : [];
      if (!keys.length || keys.includes("connection") || keys.includes("context") || keys.includes("profile")) apply();
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  document.addEventListener("circle:app-ready", refresh);
  document.addEventListener("circle:connection-changed", refresh);
  document.addEventListener("circle:connection-requested", refresh);

  window.AriCircleProfileConnectionAuthority = Object.freeze({ version: VERSION, refresh });
})();
