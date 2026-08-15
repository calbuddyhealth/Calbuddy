// ARI XP — native-feeling conversation scrolling + conversation session loader
(() => {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "assets/css/home-menu-polish.css?v=1.0.0";
  document.head.appendChild(style);

  const sessions = document.createElement("script");
  sessions.src = "js/ari-conversation-sessions.js?v=1.0.0";
  document.body.appendChild(sessions);
})();

(() => {
  "use strict";

  const BOTTOM_THRESHOLD = 96;
  const KEYBOARD_THRESHOLD = 120;

  let thread = null;
  let jumpButton = null;
  let nearBottom = true;
  let keyboardOpen = false;
  let viewportTimer = null;

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

  function updateKeyboardState() {
    const vv = window.visualViewport;
    if (!vv) return;
    const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const nextOpen = obscured >= KEYBOARD_THRESHOLD;
    const changed = nextOpen !== keyboardOpen;
    keyboardOpen = nextOpen;
    document.documentElement.style.setProperty("--ari-visual-viewport-height", `${Math.round(vv.height)}px`);
    document.body.classList.toggle("ari-keyboard-open", keyboardOpen);
    if (changed && keyboardOpen && document.activeElement?.id === "ariInput" && nearBottom) {
      clearTimeout(viewportTimer);
      viewportTimer = setTimeout(() => scrollToBottom({ smooth: false }), 90);
    }
  }

  function bindVisualViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    vv.addEventListener("resize", updateKeyboardState, { passive: true });
    vv.addEventListener("scroll", updateKeyboardState, { passive: true });
    updateKeyboardState();
  }

  function initialize() {
    thread = document.getElementById("ariMessages");
    const shell = document.getElementById("ariConversationShell");
    if (!thread || !shell) return;
    jumpButton = createJumpButton(shell);
    nearBottom = isNearBottom();
    thread.addEventListener("scroll", onThreadScroll, { passive: true });
    const observer = new MutationObserver(handleThreadMutation);
    observer.observe(thread, { childList: true, subtree: true });
    document.getElementById("ariInput")?.addEventListener("focus", () => {
      nearBottom = isNearBottom();
      setTimeout(updateKeyboardState, 0);
    });
    bindVisualViewport();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
