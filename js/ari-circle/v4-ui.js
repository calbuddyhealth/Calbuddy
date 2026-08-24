/* =============================================================
   ARI CIRCLE — PROFILE COMPATIBILITY SHELL
   Version: 5.2.9

   Feed · Meet Up · Quests use the current V5 runtime directly. This file
   now exists only to bridge the legacy Profile DOM into the shared V5 shell.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.2.9";
  const POLISH_STYLE_ID = "ari-circle-v4-polish-style";
  const UX_STYLE_ID = "ari-circle-v4-ux-fixes-style";
  let appReady = false;
  let panelHandled = false;
  let launchSocialLoaded = false;
  let realWorldLoaded = false;

  const $ = (id) => document.getElementById(id);
  const MESSAGE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.25 3.75 20l.85-3.45A7.9 7.9 0 0 1 3 11.75C3 7.47 6.9 4 11.7 4h.6c4.8 0 8.7 3.47 8.7 7.75s-3.9 7.75-8.7 7.75h-.6A9.5 9.5 0 0 1 7 18.25Z"></path></svg>`;

  function hide(id) {
    const el = $(id);
    if (el && !el.hidden) el.hidden = true;
  }

  function ensureStyle(id, href) {
    if ($(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }

  function isProfileRoute() {
    return Boolean(document.body?.classList.contains("ari-circle-page"));
  }

  function ensureStyles() {
    ensureStyle(POLISH_STYLE_ID, "assets/css/ari-circle-v4-polish.css?v=4.1.0");
    ensureStyle(UX_STYLE_ID, "assets/css/ari-circle-v4-ux-fixes.css?v=1.0.1");
    ensureStyle("ari-circle-v5-real-world-style", "assets/css/ari-circle-v5-real-world.css?v=5.0.0");
  }

  function standardizeMenus() {
    window.AriCircleMenuV5?.refresh?.();
  }

  function routeToMessages(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    window.location.href = "ari-circle-messages.html";
  }

  function standardizeMessages() {
    document.querySelectorAll(".circle-v4-message").forEach((el) => {
      if (el.dataset.v5Message === "true") return;
      el.innerHTML = MESSAGE_ICON;
      el.setAttribute("aria-label", "Messages");
      if (el.tagName === "A") el.setAttribute("href", "ari-circle-messages.html");
      el.dataset.v5Message = "true";
    });

    const profileButton = $("circle-messages-button");
    if (profileButton && profileButton.dataset.v5Message !== "true") {
      const icon = profileButton.querySelector('span[aria-hidden="true"]');
      if (icon) icon.innerHTML = MESSAGE_ICON;
      profileButton.removeAttribute("data-circle-action");
      profileButton.setAttribute("aria-label", "Messages");
      profileButton.addEventListener("click", routeToMessages, true);
      profileButton.dataset.v5Message = "true";
    }
  }

  function ensureProfileHeader() {
    const header = $("circle-header");
    if (!header) return;

    header.classList.add("circle-v4-profile-header");
    let menu = header.querySelector(":scope > .circle-v4-menu");
    if (!menu) {
      menu = document.createElement("details");
      menu.className = "circle-v4-menu circle-v4-menu--profile";
      header.prepend(menu);
    }
    window.AriCircleMenuV5?.refresh?.();

    const brand = header.querySelector(".circle-header__brand");
    if (brand) {
      brand.href = "ari-circle-feed.html";
      brand.setAttribute("aria-label", "ARI Circle Feed");
      if (brand.parentElement !== header) header.append(brand);
    }

    const messages = $("circle-messages-button");
    if (messages && messages.parentElement !== header) header.append(messages);

    const left = header.querySelector(".circle-header__left");
    if (left) left.hidden = true;
    const actions = header.querySelector(".circle-header__actions");
    if (actions) actions.hidden = true;
    hide("circle-profile-menu-button");
    hide("circle-back-button");
  }

  function ensureProfileNav() {
    const nav = $("circleV3Nav");
    if (!nav || nav.dataset.v5Ready === "true") return;
    nav.innerHTML = `<a href="ari-circle-feed.html">Feed</a><a href="ari-circle-meetup.html">Meet Up</a><a href="ari-circle-quests.html">Quests</a>`;
    nav.dataset.v5Ready = "true";
  }

  function simplifyProfile() {
    ensureProfileNav();
    ensureProfileHeader();
    ["circleV3Hubs","circle-top","circle-love","circle-details","circleV3AchievementsPanel"].forEach(hide);
    $("circleV3Summary")?.remove();
    document.querySelector(".circle-v3-name-flair")?.remove();
    document.querySelector('[data-v3-profile-tab="achievements"]')?.remove();

    const share = $("circle-share-profile-button");
    if (share && share.textContent.trim() !== "Share Profile") share.textContent = "Share Profile";
    const remove = $("circle-remove-connection-button");
    if (remove && remove.textContent.trim() !== "Remove Friend") remove.textContent = "Remove Friend";
  }

  function cleanProfileEditorLabels() {
    const editor = $("circle-profile-editor");
    if (!editor || editor.dataset.v5Labels === "true") return;
    const prompts = [
      ["ask me about", "Ask me about..."], ["current obsession", "Current obsession..."],
      ["dream trip", "Dream trip..."], ["best way to make me laugh", "Best way to make me laugh..."],
      ["comfort show/movie", "My comfort show/movie..."], ["song i know every word to", "Song I know every word to..."],
      ["unpopular opinion", "Unpopular opinion..."], ["something i want to learn", "Something I want to learn..."],
      ["weirdly good at", "Weirdly good at..."], ["perfect night looks like", "Perfect night looks like..."]
    ];
    editor.querySelectorAll("label, legend, .circle-editor-field__label").forEach((el) => {
      const lower = String(el.textContent || "").trim().toLowerCase();
      const match = prompts.find(([needle]) => lower.includes(needle));
      if (match) el.textContent = match[1];
    });
    editor.dataset.v5Labels = "true";
  }

  function openRequestedPanel() {
    if (panelHandled || !appReady) return;
    const params = new URLSearchParams(window.location.search);
    const panel = params.get("panel");
    if (!panel) {
      panelHandled = true;
      return;
    }

    if (panel === "messages" || panel === "message") {
      panelHandled = true;
      const user = params.get("user");
      window.location.replace(user ? `ari-circle-messages.html?user=${encodeURIComponent(user)}` : "ari-circle-messages.html");
      return;
    }

    if (["friends","requests","sent"].includes(panel)) {
      const button = $("circle-see-friends-action") || document.querySelector('[data-circle-action="view-entire-circle"]');
      if (button) {
        panelHandled = true;
        button.click();
        if (panel !== "friends") setTimeout(() => document.querySelector(`[data-circle-members-tab="${panel}"]`)?.click(), 80);
      }
      return;
    }

    if (panel === "notifications") {
      const button = $("circle-notifications-button");
      if (button) {
        panelHandled = true;
        button.click();
      }
    }
  }

  function loadModules() {
    if (!realWorldLoaded && !window.AriCircleV5RealWorld) {
      realWorldLoaded = true;
      import("/js/ari-circle/v5-real-world.js?v=5.2.3").catch((error) => {
        realWorldLoaded = false;
        console.warn("ARI Circle V5 Real World shell failed to load:", error);
      });
    }

    if (!launchSocialLoaded) {
      launchSocialLoaded = true;
      import("/js/ari-circle/launch-social-v5.js?v=5.0.2").catch((error) => {
        launchSocialLoaded = false;
        console.warn("ARI Circle Launch Social V5 failed to load:", error);
      });
    }
  }

  function run() {
    if (!isProfileRoute()) return;
    ensureStyles();
    standardizeMenus();
    standardizeMessages();
    simplifyProfile();
    cleanProfileEditorLabels();
    loadModules();
    openRequestedPanel();
  }

  document.addEventListener("DOMContentLoaded", () => {
    run();
    setTimeout(run, 120);
  }, { once: true });

  document.addEventListener("circle:app-ready", () => {
    appReady = true;
    run();
    setTimeout(run, 120);
  });

  window.AriCircleV4 = Object.freeze({ version: VERSION, refresh: run });
})();