/* =============================================================
   ARI CIRCLE V4 — UI SIMPLIFICATION LAYER
   Version: 4.3.0

   UI-only enhancement layer. It intentionally leaves the existing
   Supabase tables, RPCs, stores, and persistence behavior untouched.
============================================================= */

(() => {
  "use strict";

  const VERSION = "4.3.0";
  const POLISH_STYLE_ID = "ari-circle-v4-polish-style";
  let scheduled = false;
  let panelHandled = false;
  let buddiesLoaded = false;
  let flowFixesLoaded = false;
  let appReady = false;

  const $ = (id) => document.getElementById(id);

  const MESSAGE_ICON = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18.25 3.75 20l.85-3.45A7.9 7.9 0 0 1 3 11.75C3 7.47 6.9 4 11.7 4h.6c4.8 0 8.7 3.47 8.7 7.75s-3.9 7.75-8.7 7.75h-.6A9.5 9.5 0 0 1 7 18.25Z"></path>
    </svg>
  `;

  function hide(id) {
    const element = $(id);
    if (element) element.hidden = true;
  }

  function ensurePolishStyle() {
    if (document.getElementById(POLISH_STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = POLISH_STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-v4-polish.css?v=4.1.0";
    document.head.append(link);
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
      </nav>
    `;
  }

  function standardizeExistingMenus() {
    document.querySelectorAll(".feed-header > .circle-v4-menu, .partner-header > .circle-v4-menu, .challenge-header > .circle-v4-menu").forEach((details) => {
      if (details.dataset.v41Menu === "true") return;
      details.innerHTML = circleMenuMarkup(false);
      details.dataset.v41Menu = "true";
    });
  }

  function standardizeMessageIcons() {
    document.querySelectorAll(".circle-v4-message").forEach((element) => {
      element.innerHTML = MESSAGE_ICON;
      element.dataset.v41Message = "true";
      if (element.tagName === "A") element.href = "ari-circle.html?panel=messages";
      element.setAttribute("aria-label", "Messages");
    });

    const button = $("circle-messages-button");
    if (button) {
      const icon = button.querySelector('span[aria-hidden="true"]');
      if (icon) icon.innerHTML = MESSAGE_ICON;
      button.dataset.v41Message = "true";
      button.setAttribute("aria-label", "Messages");
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

  function bindProfileOptions() {
    document.querySelectorAll("[data-v4-profile-options]").forEach((button) => {
      if (button.dataset.v41Bound === "true") return;
      button.dataset.v41Bound = "true";
      button.addEventListener("click", () => {
        const original = $("circle-profile-menu-button");
        original?.click();
        button.closest("details")?.removeAttribute("open");
      });
    });
  }

  function renameConnectionButton() {
    const button = $("circle-connection-action");
    if (!button) return;

    const replacements = new Map([
      ["Add to Circle", "Add Friend"],
      ["In Your Circle ✓", "Friends ✓"],
      ["Sign in to Connect", "Sign in to Add Friend"],
      ["Respond to Request", "Respond"],
      ["Requested ✓", "Requested ✓"]
    ]);

    const current = String(button.textContent || "").trim();
    const next = replacements.get(current);
    if (next && next !== current) button.textContent = next;
  }

  function simplifyProfileMenu() {
    const share = $("circle-share-profile-button");
    if (share && share.textContent.trim() !== "Share Profile") share.textContent = "Share Profile";

    const remove = $("circle-remove-connection-button");
    if (remove && remove.textContent.trim() !== "Remove Friend") remove.textContent = "Remove Friend";
  }

  function ensureSeeFriendsButton() {
    const ownerActions = $("circle-owner-actions");
    if (!ownerActions || $("circle-see-friends-action")) return;

    const button = document.createElement("button");
    button.id = "circle-see-friends-action";
    button.className = "circle-button circle-button--secondary";
    button.type = "button";
    button.dataset.circleAction = "view-entire-circle";
    button.textContent = "See Friends";
    ownerActions.append(button);
  }

  function reorderVisitorActions() {
    const actions = $("circle-visitor-actions");
    const connection = $("circle-connection-action");
    const message = $("circle-message-action");
    if (!actions || !connection || !message) return;

    const connected = connection.dataset.v4TargetFriends === "true" || /friends?\s*✓|see friends|in your circle/i.test(connection.textContent || "");
    if (connected) {
      if (actions.firstElementChild !== message) actions.insertBefore(message, connection);
      return;
    }

    if (actions.firstElementChild !== connection) actions.insertBefore(connection, message);
  }

  function simplifyProfile() {
    const nav = $("circleV3Nav");
    if (nav) {
      nav.innerHTML = `
        <a href="ari-circle-feed.html">Feed</a>
        <a class="is-active" href="ari-circle.html" aria-current="page">Profile</a>
        <a href="ari-circle-partners.html">Buddies</a>
        <a href="ari-circle-challenges.html">Challenges</a>
      `;
      nav.dataset.v4Ready = "true";
    }

    hide("circleV3Hubs");
    hide("circle-top");
    hide("circle-love");
    hide("circle-details");
    hide("circleV3AchievementsPanel");

    $("circleV3Summary")?.remove();
    document.querySelector(".circle-v3-name-flair")?.remove();
    document.querySelector('[data-v3-profile-tab="achievements"]')?.remove();

    const tabs = $("circleV3ProfileTabs");
    if (tabs && !tabs.querySelector('[data-v3-profile-tab="posts"].is-active') && !tabs.querySelector('[data-v3-profile-tab="about"].is-active')) {
      tabs.querySelector('[data-v3-profile-tab="posts"]')?.click();
    }

    ensureProfileHeader();
    ensureSeeFriendsButton();
    reorderVisitorActions();
    renameConnectionButton();
    simplifyProfileMenu();
  }

  function cleanProfileEditorLabels() {
    const editor = $("circle-profile-editor");
    if (!editor) return;

    const prompts = [
      ["ask me about", "Ask me about..."],
      ["current obsession", "Current obsession..."],
      ["dream trip", "Dream trip..."],
      ["best way to make me laugh", "Best way to make me laugh..."],
      ["comfort show/movie", "My comfort show/movie..."],
      ["song i know every word to", "Song I know every word to..."],
      ["unpopular opinion", "Unpopular opinion..."],
      ["something i want to learn", "Something I want to learn..."],
      ["weirdly good at", "Weirdly good at..."],
      ["perfect night looks like", "Perfect night looks like..."]
    ];

    editor.querySelectorAll("label, legend, .circle-editor-field__label").forEach((element) => {
      const text = String(element.textContent || "").trim();
      const lower = text.toLowerCase();
      const match = prompts.find(([needle]) => lower.includes(needle));
      if (match && text !== match[1]) element.textContent = match[1];
    });
  }

  function simplifyFriendsDialog() {
    const dialog = $("circle-members-dialog");
    if (!dialog) return;

    const eyebrow = dialog.querySelector(".circle-section-eyebrow");
    if (eyebrow && eyebrow.textContent.trim() !== "YOUR SOCIAL CIRCLE") eyebrow.textContent = "YOUR SOCIAL CIRCLE";

    const title = dialog.querySelector(".circle-dialog__header h2");
    if (title) {
      const count = $("circle-members-title-count");
      const first = title.firstChild;
      if (first?.nodeType === Node.TEXT_NODE && first.textContent.trim() !== "Friends") first.textContent = "Friends ";
      if (count && count.parentElement !== title) title.append(count);
    }
  }

  function renameLegacyPartnerLabels() {
    document.querySelectorAll(".feed-post__type, .circle-v3-post__type").forEach((element) => {
      const current = String(element.textContent || "");
      if (/\bPartner\b/i.test(current)) element.textContent = current.replace(/Partner/gi, "Buddy");
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

  function openMembersPanel(panel) {
    const button = $("circle-see-friends-action") || document.querySelector('[data-circle-action="view-entire-circle"]');
    if (!button) return false;

    button.click();
    panelHandled = true;

    if (panel === "requests" || panel === "sent") {
      window.setTimeout(() => {
        document.querySelector(`[data-circle-members-tab="${panel}"]`)?.click();
      }, 80);
    }

    return true;
  }

  function openRequestedPanel() {
    if (panelHandled || !appReady) return;
    if (!document.body.classList.contains("ari-circle-page")) return;

    const panel = new URLSearchParams(window.location.search).get("panel");
    if (!panel) {
      panelHandled = true;
      return;
    }

    if (["friends", "requests", "sent"].includes(panel)) {
      openMembersPanel(panel);
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
        window.setTimeout(() => button.click(), 40);
      }
      return;
    }

    if (panel === "message") {
      const button = $("circle-message-action");
      if (button) {
        panelHandled = true;
        window.setTimeout(() => button.click(), 60);
      }
    }
  }

  function loadBuddiesSocial() {
    if (buddiesLoaded || !document.querySelector(".partner-page")) return;
    buddiesLoaded = true;
    import("/js/ari-circle/buddies/buddies-social.js?v=1.0.0").catch((error) => {
      buddiesLoaded = false;
      console.warn("ARI Circle Buddies social discovery failed to load:", error);
    });
  }

  function loadFlowFixes() {
    if (flowFixesLoaded) return;
    flowFixesLoaded = true;
    import("/js/ari-circle/v4-flow-fixes.js?v=1.0.0").catch((error) => {
      flowFixesLoaded = false;
      console.warn("ARI Circle V4 flow fixes failed to load:", error);
    });
  }

  function run() {
    scheduled = false;
    ensurePolishStyle();
    standardizeExistingMenus();
    standardizeMessageIcons();
    simplifyProfile();
    cleanProfileEditorLabels();
    simplifyFriendsDialog();
    renameLegacyPartnerLabels();
    bindProfileOptions();
    closeMenuOnNavigation();
    openRequestedPanel();
    loadBuddiesSocial();
    loadFlowFixes();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  }

  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  document.addEventListener("circle:app-ready", () => {
    appReady = true;
    schedule();
  });

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
