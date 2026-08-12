/* =============================================================
   ARI CIRCLE — MESSAGES LAUNCH HARDENING
   Version: 1.1.0

   Launch-critical iPhone fixes:
   - Prevent Safari's input-focus zoom by pairing with 16px form controls.
   - Keep the Send button inside the visible viewport while the keyboard is open.
   - Leave the in-thread Back control as a normal href so Safari can always
     navigate back to the Messages inbox reliably.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  function updateVisualViewport() {
    const viewport = window.visualViewport;
    const height = Math.max(320, Math.round(viewport?.height || window.innerHeight || 0));
    const top = Math.max(0, Math.round(viewport?.offsetTop || 0));
    root.style.setProperty("--ari-messages-viewport-height", `${height}px`);
    root.style.setProperty("--ari-messages-viewport-top", `${top}px`);
  }

  function keepComposerVisible() {
    updateVisualViewport();
    requestAnimationFrame(() => {
      const composer = document.querySelector(".circle-thread__composer:not([hidden])");
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

  function run() {
    bindKeyboard();
    updateVisualViewport();
  }

  function init() {
    bindViewport();
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
    refresh: run
  });
})();
