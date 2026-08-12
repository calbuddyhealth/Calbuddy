/* =============================================================
   ARI CIRCLE V4 — UI SIMPLIFICATION LAYER
   Version: 4.0.0

   UI-only enhancement layer. It intentionally leaves the existing
   Supabase tables, RPCs, stores, and persistence behavior untouched.
============================================================= */

(() => {
  "use strict";

  const VERSION = "4.0.0";
  let scheduled = false;
  let panelHandled = false;

  const $ = (id) => document.getElementById(id);

  function hide(id) {
    const element = $(id);
    if (element) element.hidden = true;
  }

  function renameConnectionButton() {
    const button = $("circle-connection-action");
    if (!button) return;

    const replacements = new Map([
      ["Add to Circle", "Add Friend"],
      ["In Your Circle ✓", "Friends ✓"],
      ["Sign in to Connect", "Sign in to Add Friend"],
      ["Respond to Request", "Respond"]
    ]);

    const current = String(button.textContent || "").trim();
    const next = replacements.get(current);
    if (next && next !== current) button.textContent = next;
  }

  function simplifyProfileMenu() {
    const share = $("circle-share-profile-button");
    if (share && share.textContent.trim() !== "Share Profile") {
      share.textContent = "Share Profile";
    }

    const remove = $("circle-remove-connection-button");
    if (remove && remove.textContent.trim() !== "Remove Friend") {
      remove.textContent = "Remove Friend";
    }
  }

  function simplifyProfile() {
    const nav = $("circleV3Nav");
    if (nav && nav.dataset.v4Ready !== "true") {
      nav.innerHTML = `
        <a href="ari-circle-feed.html">Feed</a>
        <a class="is-active" href="ari-circle.html" aria-current="page">Me</a>
        <a href="ari-circle-partners.html">Buddies</a>
        <a href="ari-circle-challenges.html">Challenges</a>
      `;
      nav.dataset.v4Ready = "true";
    }

    $("circleV3Hubs")?.remove();
    hide("circle-top");
    hide("circle-love");
    hide("circle-details");
    hide("circleV3AchievementsPanel");

    const achievementsTab = document.querySelector('[data-v3-profile-tab="achievements"]');
    achievementsTab?.remove();

    const tabs = $("circleV3ProfileTabs");
    if (tabs && !tabs.querySelector('[data-v3-profile-tab="posts"].is-active') && !tabs.querySelector('[data-v3-profile-tab="about"].is-active')) {
      tabs.querySelector('[data-v3-profile-tab="posts"]')?.click();
    }

    const back = $("circle-back-button");
    if (back) {
      back.href = "ari-circle-feed.html";
      back.setAttribute("aria-label", "Back to ARI Circle Feed");
    }

    const brand = document.querySelector(".circle-header__brand");
    if (brand) brand.href = "ari-circle-feed.html";

    renameConnectionButton();
    simplifyProfileMenu();
  }

  function renameLegacyPartnerLabels() {
    document.querySelectorAll(".feed-post__type, .circle-v3-post__type").forEach((element) => {
      const current = String(element.textContent || "");
      if (/\bPartner\b/i.test(current)) {
        element.textContent = current.replace(/Partner/gi, "Buddy");
      }
    });
  }

  function closeMenuOnNavigation() {
    document.querySelectorAll(".circle-v4-menu").forEach((details) => {
      if (details.dataset.v4Bound === "true") return;
      details.dataset.v4Bound = "true";
      details.addEventListener("click", (event) => {
        if (event.target.closest("a")) details.open = false;
      });
    });
  }

  function openRequestedPanel() {
    if (panelHandled) return;
    if (!document.body.classList.contains("ari-circle-page")) return;

    const panel = new URLSearchParams(window.location.search).get("panel");
    if (!panel) {
      panelHandled = true;
      return;
    }

    if (panel === "notifications") {
      const button = $("circle-notifications-button");
      if (button) {
        panelHandled = true;
        button.click();
      }
      return;
    }

    if (panel === "messages") {
      const button = $("circle-messages-button");
      if (button) {
        panelHandled = true;
        button.click();
      }
    }
  }

  function run() {
    scheduled = false;
    simplifyProfile();
    renameLegacyPartnerLabels();
    closeMenuOnNavigation();
    openRequestedPanel();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  }

  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  document.addEventListener("circle:app-ready", schedule);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  window.AriCircleV4 = Object.freeze({
    version: VERSION,
    refresh: schedule
  });
})();
