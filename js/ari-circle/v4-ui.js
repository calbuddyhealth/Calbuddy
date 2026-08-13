/* =============================================================
   ARI CIRCLE V4 — STABLE UI SHELL
   Version: 4.8.0

   V4.8.0:
   - Removes duplicate Notifications V4 post-processing layer.
   - Core circle-notifications.js is now the single owner of notification UI.
   - Keeps unified menus, messages, profile polish and feed modules.
============================================================= */
(() => {
  "use strict";

  const VERSION = "4.8.0";
  const POLISH_STYLE_ID = "ari-circle-v4-polish-style";
  const UX_STYLE_ID = "ari-circle-v4-ux-fixes-style";
  let appReady = false;
  let panelHandled = false;
  let buddiesLoaded = false;
  let buddyCountsLoaded = false;
  let flowFixesLoaded = false;
  let feedPolishLoaded = false;
  let feedModerationLoaded = false;
  let momentRepliesLoaded = false;
  let launchSocialLoaded = false;
  let outsideMenuBound = false;

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

  function ensureStyles() {
    ensureStyle(POLISH_STYLE_ID, "assets/css/ari-circle-v4-polish.css?v=4.1.0");
    ensureStyle(UX_STYLE_ID, "assets/css/ari-circle-v4-ux-fixes.css?v=1.0.1");
  }

  function circleMenuMarkup(includeProfileOptions = false) {
    return `
      <summary class="feed-icon-button" aria-label="Open Circle menu">☰</summary>
      <nav class="circle-v4-menu__panel" aria-label="Circle menu">
        <a href="ari-circle.html?panel=notifications"><span>Notifications</span><small>Activity</small></a>
        <a href="ari-circle-partners.html"><span>Find People</span><small>Buddies</small></a>
        ${includeProfileOptions ? '<button type="button" data-v4-profile-options><span>Profile Options</span><small>Share / Safety</small></button>' : ''}
        <div class="circle-v4-menu__divider"></div>
        <a href="notification-settings.html"><span>Notification Settings</span><small>Alerts</small></a>
        <a href="account.html"><span>Privacy & Visibility</span><small>Account</small></a>
        <a href="help-safety.html"><span>Circle Safety</span><small>Help</small></a>
        <div class="circle-v4-menu__divider"></div>
        <a href="home.html"><span>Exit ARI Circle</span><small>ARI XP</small></a>
      </nav>`;
  }

  function closeOtherMenus(current = null) {
    document.querySelectorAll("details.circle-v4-menu[open]").forEach((details) => {
      if (details !== current) details.removeAttribute("open");
    });
  }

  function bindOutsideMenuClose() {
    if (outsideMenuBound) return;
    outsideMenuBound = true;
    document.addEventListener("pointerdown", (event) => {
      const menu = event.target.closest?.("details.circle-v4-menu");
      if (menu) {
        if (menu.open) closeOtherMenus(menu);
        return;
      }
      closeOtherMenus();
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOtherMenus();
    });
  }

  function standardizeMenus() {
    document.querySelectorAll(".feed-header > .circle-v4-menu, .partner-header > .circle-v4-menu, .challenge-header > .circle-v4-menu").forEach((details) => {
      if (details.dataset.v471Menu === "true") return;
      details.innerHTML = circleMenuMarkup(false);
      details.dataset.v471Menu = "true";
    });
    bindOutsideMenuClose();
  }

  function routeToMessages(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    window.location.href = "ari-circle-messages.html";
  }

  function standardizeMessages() {
    document.querySelectorAll(".circle-v4-message").forEach((el) => {
      if (el.dataset.v471Message === "true") return;
      el.innerHTML = MESSAGE_ICON;
      el.setAttribute("aria-label", "Messages");
      if (el.tagName === "A") el.setAttribute("href", "ari-circle-messages.html");
      el.dataset.v471Message = "true";
    });
    const profileButton = $("circle-messages-button");
    if (profileButton && profileButton.dataset.v471Message !== "true") {
      const icon = profileButton.querySelector('span[aria-hidden="true"]');
      if (icon) icon.innerHTML = MESSAGE_ICON;
      profileButton.removeAttribute("data-circle-action");
      profileButton.setAttribute("aria-label", "Messages");
      profileButton.addEventListener("click", routeToMessages, true);
      profileButton.dataset.v471Message = "true";
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
      menu.innerHTML = circleMenuMarkup(true);
      header.prepend(menu);
    }
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
    if (!nav || nav.dataset.v471Ready === "true") return;
    nav.innerHTML = `<a href="ari-circle-feed.html">Feed</a><a class="is-active" href="ari-circle.html" aria-current="page">Profile</a><a href="ari-circle-partners.html">Buddies</a><a href="ari-circle-challenges.html">Challenges</a>`;
    nav.dataset.v471Ready = "true";
  }

  function simplifyProfile() {
    if (!document.body.classList.contains("ari-circle-page")) return;
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

  function bindProfileOptions() {
    document.querySelectorAll("[data-v4-profile-options]").forEach((button) => {
      if (button.dataset.v471Bound === "true") return;
      button.dataset.v471Bound = "true";
      button.addEventListener("click", () => {
        $("circle-profile-menu-button")?.click();
        button.closest("details")?.removeAttribute("open");
      });
    });
  }

  function cleanProfileEditorLabels() {
    const editor = $("circle-profile-editor");
    if (!editor || editor.dataset.v471Labels === "true") return;
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
    editor.dataset.v471Labels = "true";
  }

  function openRequestedPanel() {
    if (panelHandled || !appReady || !document.body.classList.contains("ari-circle-page")) return;
    const panel = new URLSearchParams(window.location.search).get("panel");
    if (!panel) { panelHandled = true; return; }
    if (panel === "messages" || panel === "message") {
      panelHandled = true;
      const user = new URLSearchParams(window.location.search).get("user");
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
      if (button) { panelHandled = true; button.click(); }
    }
  }

  function loadModules() {
    if (!launchSocialLoaded) {
      launchSocialLoaded = true;
      import("/js/ari-circle/launch-social-v5.js?v=5.0.1").catch((error) => {
        launchSocialLoaded = false;
        console.warn("ARI Circle Launch Social V5 failed to load:", error);
      });
    }
    if (!flowFixesLoaded) {
      flowFixesLoaded = true;
      import("/js/ari-circle/v4-flow-fixes.js?v=1.2.1").catch((error) => {
        flowFixesLoaded = false;
        console.warn("ARI Circle flow fixes failed to load:", error);
      });
    }
    if (!buddiesLoaded && document.querySelector(".partner-page")) {
      buddiesLoaded = true;
      import("/js/ari-circle/buddies/buddies-social.js?v=1.2.0").catch((error) => {
        buddiesLoaded = false;
        console.warn("ARI Circle Buddies social discovery failed to load:", error);
      });
    }
    if (!buddyCountsLoaded && document.querySelector(".partner-page")) {
      buddyCountsLoaded = true;
      import("/js/ari-circle/buddies/buddy-counts-v4.js?v=1.1.0").catch((error) => {
        buddyCountsLoaded = false;
        console.warn("ARI Circle Buddy launch workflow failed to load:", error);
      });
    }
    if (!feedPolishLoaded && document.querySelector(".feed-page")) {
      feedPolishLoaded = true;
      import("/js/ari-circle/feed/feed-polish.js?v=1.0.1").catch((error) => {
        feedPolishLoaded = false;
        console.warn("ARI Circle feed polish failed to load:", error);
      });
    }
    if (!feedModerationLoaded && document.querySelector(".feed-page")) {
      feedModerationLoaded = true;
      import("/js/ari-circle/feed/feed-moderation.js?v=1.1.0").catch((error) => {
        feedModerationLoaded = false;
        console.warn("ARI Circle feed ownership controls failed to load:", error);
      });
    }
    if (!momentRepliesLoaded && document.querySelector(".feed-page")) {
      momentRepliesLoaded = true;
      import("/js/ari-circle/feed/moment-replies.js?v=1.0.0").catch((error) => {
        momentRepliesLoaded = false;
        console.warn("ARI Circle Moment replies failed to load:", error);
      });
    }
  }

  function run() {
    ensureStyles();
    standardizeMenus();
    standardizeMessages();
    simplifyProfile();
    cleanProfileEditorLabels();
    bindProfileOptions();
    loadModules();
    openRequestedPanel();
  }

  document.addEventListener("DOMContentLoaded", () => { run(); setTimeout(run, 120); }, { once:true });
  document.addEventListener("circle:app-ready", () => { appReady = true; run(); setTimeout(run, 120); });
  window.AriCircleV4 = Object.freeze({ version:VERSION, refresh:run });
})();