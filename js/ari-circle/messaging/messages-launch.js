/* =============================================================
   ARI CIRCLE — MESSAGES LAUNCH HARDENING
   Version: 1.0.0

   Launch-critical iPhone fixes:
   - Prevent Safari's input-focus zoom by pairing with 16px form controls.
   - Keep the Send button inside the visible viewport while the keyboard is open.
   - Make the in-thread back button reliably return to the inbox.
   - Keep direct-message URLs from trapping users in an empty thread state.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  function updateVisualViewport() {
    const viewport = window.visualViewport;
    const height = Math.max(320, Math.round(viewport?.height || window.innerHeight || 0));
    const top = Math.max(0, Math.round(viewport?.offsetTop || 0));
    root.style.setProperty("--ari-messages-viewport-height", `${height}px`);
    root.style.setProperty("--ari-messages-viewport-top", `${top}px`);
  }

  function clearDirectUserFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("user")) return;
      url.searchParams.delete("user");
      history.replaceState({ ariCircleInbox: true }, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {}
  }

  function returnToInbox(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const thread = $("circleThread");
    const page = $("messagesPage");
    if (thread) thread.hidden = true;
    page?.classList.remove("has-thread");
    clearDirectUserFromUrl();

    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    updateVisualViewport();

    requestAnimationFrame(() => {
      $("messageSearch")?.focus?.({ preventScroll: true });
      $("messageSearch")?.blur?.();
    });
  }

  function bindBackButton() {
    const back = $("threadBack");
    if (!back || back.dataset.launchBackBound === "true") return;
    back.dataset.launchBackBound = "true";
    back.addEventListener("click", returnToInbox, true);
  }

  function keepComposerVisible() {
    updateVisualViewport();
    requestAnimationFrame(() => {
      const composer = document.querySelector(".circle-thread__composer");
      if (!composer) return;
      composer.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  function bindKeyboard() {
    const input = $("messageInput");
    if (!input || input.dataset.launchKeyboardBound === "true") return;
    input.dataset.launchKeyboardBound = "true";
    input.addEventListener("focus", () => {
      setTimeout(keepComposerVisible, 40);
      setTimeout(keepComposerVisible, 220);
    });
    input.addEventListener("input", keepComposerVisible);
  }

  function bindViewport() {
    updateVisualViewport();
    window.addEventListener("resize", updateVisualViewport, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(updateVisualViewport, 120), { passive: true });
    window.visualViewport?.addEventListener("resize", updateVisualViewport, { passive: true });
    window.visualViewport?.addEventListener("scroll", updateVisualViewport, { passive: true });
  }

  function bindHistory() {
    window.addEventListener("popstate", () => {
      const thread = $("circleThread");
      const page = $("messagesPage");
      if (thread && !thread.hidden && !new URLSearchParams(location.search).get("user")) {
        thread.hidden = true;
        page?.classList.remove("has-thread");
      }
    });
  }

  function run() {
    bindBackButton();
    bindKeyboard();
    updateVisualViewport();
  }

  function init() {
    bindViewport();
    bindHistory();
    run();

    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AriCircleMessagesLaunch = Object.freeze({
    version: VERSION,
    refresh: run,
    returnToInbox
  });
})();
