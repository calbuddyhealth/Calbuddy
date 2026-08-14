/* =============================================================
   ARI CIRCLE — SOFT PRIMARY NAV
   Version: 1.0.1
   Normalizes order to Feed · Buddies · Challenges · Profile
   and decorates the shared navigation with lightweight line icons.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.1";
  const NAV_SELECTORS = [
    ".feed-tabs",
    ".partner-tabs",
    ".challenge-tabs",
    ".circle-v3-nav"
  ];

  const ORDER = ["Feed", "Buddies", "Challenges", "Profile"];

  const ICONS = {
    Feed: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4.5" width="16" height="15" rx="2.5"></rect>
        <path d="M8 8.5h8M8 12h5M8 15.5h6"></path>
      </svg>`,
    Buddies: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3"></circle>
        <path d="M3.8 18c.6-3.1 2.4-4.8 5.2-4.8s4.6 1.7 5.2 4.8"></path>
        <circle cx="17.2" cy="9" r="2.2"></circle>
        <path d="M15.8 14c2.8-.3 4.5 1 4.9 3.4"></path>
      </svg>`,
    Challenges: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z"></path>
        <path d="M8 6H4.5v1.3A4.7 4.7 0 0 0 8.8 12M16 6h3.5v1.3A4.7 4.7 0 0 1 15.2 12"></path>
        <path d="M12 11.5V16M8.5 20h7M9.5 16h5"></path>
      </svg>`,
    Profile: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5"></circle>
        <path d="M5.3 19c.8-4 3-6 6.7-6s5.9 2 6.7 6"></path>
      </svg>`
  };

  function cleanLabel(item) {
    return String(
      item?.dataset?.circleSoftLabel ||
      item?.querySelector?.(".circle-soft-primary-tab__label")?.textContent ||
      item?.textContent ||
      ""
    ).trim();
  }

  function decorateItem(item, label) {
    if (!item || !label) return;

    item.dataset.circleSoftLabel = label;
    item.classList.add("circle-soft-primary-tab");

    if (item.dataset.circleSoftDecorated === "true") return;

    item.innerHTML = `
      <span class="circle-soft-primary-tab__icon" aria-hidden="true">${ICONS[label] || ""}</span>
      <span class="circle-soft-primary-tab__label">${label}</span>
    `;

    item.dataset.circleSoftDecorated = "true";
  }

  function normalizeNav(nav) {
    if (!nav) return false;

    const items = [...nav.children].filter((node) =>
      node.matches?.("a, button")
    );

    if (!items.length) return false;

    const labels = items.map(cleanLabel);
    const byLabel = new Map();

    for (const item of items) {
      const label = cleanLabel(item);
      if (ORDER.includes(label)) byLabel.set(label, item);
    }

    if (byLabel.size !== ORDER.length) return false;

    nav.classList.add("circle-soft-primary-nav");

    for (const label of ORDER) {
      decorateItem(byLabel.get(label), label);
    }

    const needsReorder = ORDER.some((label, index) => labels[index] !== label);
    if (needsReorder) {
      for (const label of ORDER) {
        nav.appendChild(byLabel.get(label));
      }
    }

    nav.dataset.circleSoftReady = "true";
    return true;
  }

  function refresh() {
    for (const selector of NAV_SELECTORS) {
      document.querySelectorAll(selector).forEach(normalizeNav);
    }
  }

  let refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      refresh();
    });
  }

  document.addEventListener("DOMContentLoaded", refresh, { once: true });
  document.addEventListener("circle:app-ready", queueRefresh);

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length)) queueRefresh();
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  refresh();

  window.AriCirclePrimaryNav = Object.freeze({
    version: VERSION,
    refresh
  });
})();
