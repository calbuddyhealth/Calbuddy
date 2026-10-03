// ARI XP — native-feeling conversation scrolling + conversation session loader
(() => {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "assets/css/home-menu-polish.css?v=1.1.0";
  document.head.appendChild(style);

  const sessions = document.createElement("script");
  sessions.src = "js/ari-conversation-sessions.js?v=1.1.0";
  document.body.appendChild(sessions);
})();

(() => {
  "use strict";

  const BOTTOM_THRESHOLD = 96;
  const KEYBOARD_THRESHOLD = 120;
  const VIEWPORT_SETTLE_DELAYS = [0, 80, 180, 360];

  let thread = null;
  let jumpButton = null;
  let nearBottom = true;
  let keyboardOpen = false;
  let viewportTimer = null;
  let lastViewportHeight = 0;
  let lastViewportOffsetTop = 0;

  function distanceFromBottom() {
    if (!thread) return 0;
    return Math.max(0, thread.scrollHeight - thread.clientHeight - thread.scrollTop);
  }

  function isNearBottom() {
    return distanceFromBottom() <= BOTTOM_THRESHOLD;
  }

  function setJumpVisible(show) {
    if (!jumpButton) return;
    jumpButton.classList.toggle("is-visible", Boolean(show));
    jumpButton.setAttribute("aria-hidden", show ? "false" : "true");
    jumpButton.tabIndex = show ? 0 : -1;
  }

  function scrollToBottom({ smooth = true } = {}) {
    if (!thread) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior: smooth && !keyboardOpen ? "smooth" : "auto" });
    nearBottom = true;
    setJumpVisible(false);
  }

  function onThreadScroll() {
    nearBottom = isNearBottom();
    if (nearBottom) setJumpVisible(false);
  }

  function createJumpButton(shell) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ari-thread-jump";
    button.textContent = "NEW";
    button.setAttribute("aria-label", "Jump to newest Ari message");
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
    button.addEventListener("click", () => scrollToBottom({ smooth: true }));
    shell.appendChild(button);
    return button;
  }

  function handleThreadMutation(records) {
    const addedMessage = records.some((record) => [...record.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE && (node.matches?.(".ari-message") || node.querySelector?.(".ari-message"))));
    if (!addedMessage) return;
    if (nearBottom) requestAnimationFrame(() => scrollToBottom({ smooth: !keyboardOpen }));
    else setJumpVisible(true);
  }

  function syncVisualViewport() {
    const vv = window.visualViewport;
    const rawHeight = vv?.height || window.innerHeight || document.documentElement.clientHeight;
    const rawOffsetTop = vv?.offsetTop || 0;
    const height = Math.max(1, Math.round(rawHeight));
    const offsetTop = Math.max(0, Math.round(rawOffsetTop));
    const obscured = Math.max(0, (window.innerHeight || height) - height - offsetTop);
    const nextOpen = obscured >= KEYBOARD_THRESHOLD;
    const keyboardChanged = nextOpen !== keyboardOpen;
    const viewportChanged = height !== lastViewportHeight || offsetTop !== lastViewportOffsetTop;

    keyboardOpen = nextOpen;
    lastViewportHeight = height;
    lastViewportOffsetTop = offsetTop;

    document.documentElement.style.setProperty("--ari-visual-viewport-height", `${height}px`);
    document.documentElement.style.setProperty("--ari-visual-viewport-offset-top", `${offsetTop}px`);
    document.body.classList.toggle("ari-keyboard-open", keyboardOpen);

    if ((viewportChanged || keyboardChanged) && nearBottom) {
      requestAnimationFrame(() => scrollToBottom({ smooth: false }));
    }
  }

  function scheduleVisualViewportSync() {
    clearTimeout(viewportTimer);
    syncVisualViewport();
    VIEWPORT_SETTLE_DELAYS.slice(1).forEach((delay, index) => {
      window.setTimeout(syncVisualViewport, delay + index);
    });
  }

  function bindVisualViewport() {
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", scheduleVisualViewportSync, { passive: true });
      vv.addEventListener("scroll", scheduleVisualViewportSync, { passive: true });
    }
    window.addEventListener("resize", scheduleVisualViewportSync, { passive: true });
    window.addEventListener("orientationchange", scheduleVisualViewportSync, { passive: true });
    window.addEventListener("pageshow", scheduleVisualViewportSync, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleVisualViewportSync();
    });
    scheduleVisualViewportSync();
  }

  function initialize() {
    thread = document.getElementById("ariMessages");
    const shell = document.getElementById("ariConversationShell");
    const input = document.getElementById("ariInput");
    if (!thread || !shell) return;
    jumpButton = createJumpButton(shell);
    nearBottom = isNearBottom();
    thread.addEventListener("scroll", onThreadScroll, { passive: true });
    const observer = new MutationObserver(handleThreadMutation);
    observer.observe(thread, { childList: true, subtree: true });
    input?.addEventListener("focus", () => {
      nearBottom = isNearBottom();
      scheduleVisualViewportSync();
    });
    input?.addEventListener("blur", scheduleVisualViewportSync);
    bindVisualViewport();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
