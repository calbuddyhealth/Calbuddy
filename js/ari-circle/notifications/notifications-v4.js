/* =============================================================
   ARI CIRCLE — NOTIFICATIONS V4
   Version: 1.0.0
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-notifications-v4-style";
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();

  const state = {
    client: null,
    observer: null,
    clearing: false,
    cleared: false,
    started: false
  };

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-notifications-v4.css?v=1.0.0";
    document.head.append(link);
  }

  function toast(message) {
    const host = $("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 2600);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function displayName(article) {
    const avatar = article.querySelector(".circle-notification-item__avatar");
    const aria = clean(avatar?.getAttribute("aria-label"));
    if (/^view\s+/i.test(aria)) return aria.replace(/^view\s+/i, "");
    return "Someone";
  }

  function decorateItem(article) {
    if (!article || article.dataset.v4Notification === "true") return;
    article.dataset.v4Notification = "true";

    const type = clean(article.dataset.type);
    const title = article.querySelector(".circle-notification-item__title");
    const text = article.querySelector(".circle-notification-item__text");
    const name = displayName(article);

    if (title) {
      switch (type) {
        case "connection_request":
          title.textContent = `${name} sent you a friend request`;
          break;
        case "connection_accepted":
          title.textContent = `${name} is now your friend`;
          break;
        case "message_request":
          title.textContent = `${name} sent a message request`;
          break;
        case "message":
          title.textContent = `${name} sent you a message`;
          break;
        case "love":
          title.textContent = `${name} interacted with your profile`;
          break;
        default:
          break;
      }
    }

    if (text && title && clean(text.textContent).toLowerCase() === clean(title.textContent).toLowerCase()) {
      text.hidden = true;
    }

    const view = article.querySelector('[data-circle-action="open-incoming-request"]');
    if (view) view.remove();

    article.querySelectorAll(".circle-button--small").forEach((button) => {
      button.classList.add("circle-notification-action");
    });
  }

  function decorate() {
    const dialog = $("circle-notifications-dialog");
    if (!dialog) return;

    const eyebrow = dialog.querySelector(".circle-section-eyebrow");
    if (eyebrow) eyebrow.textContent = "ACTIVITY";

    const note = dialog.querySelector(".circle-notifications-toolbar .circle-section-note");
    if (note) note.textContent = "Friend requests, messages, and Circle activity.";

    const list = $("circle-notifications-list");
    if (state.cleared && list) list.replaceChildren();
    list?.querySelectorAll(".circle-notification-item").forEach(decorateItem);
  }

  function ensureClearButton() {
    const toolbar = document.querySelector("#circle-notifications-dialog .circle-notifications-toolbar");
    if (!toolbar || $("circleNotificationsClear")) return;

    const actions = document.createElement("div");
    actions.className = "circle-notifications-toolbar__actions";

    const markAll = $("circle-notifications-mark-all");
    if (markAll) actions.append(markAll);

    const clear = document.createElement("button");
    clear.id = "circleNotificationsClear";
    clear.className = "circle-text-button circle-notifications-clear";
    clear.type = "button";
    clear.textContent = "Clear";
    clear.addEventListener("click", clearNotifications);
    actions.append(clear);
    toolbar.append(actions);
  }

  async function clearNotifications() {
    if (state.clearing) return;
    const list = $("circle-notifications-list");
    if (!list?.children.length) return;
    if (!window.confirm("Clear all notifications?")) return;

    state.clearing = true;
    const button = $("circleNotificationsClear");
    if (button) button.disabled = true;

    try {
      await rpc("ari_circle_notifications_clear");
      state.cleared = true;
      list.replaceChildren();
      const empty = $("circle-notifications-empty");
      if (empty) {
        empty.hidden = false;
        const p = empty.querySelector("p");
        if (p) p.textContent = "You're all caught up.";
      }
      const badge = $("circle-notification-badge");
      if (badge) {
        badge.hidden = true;
        badge.textContent = "";
      }
      const markAll = $("circle-notifications-mark-all");
      if (markAll) markAll.disabled = true;
      toast("Notifications cleared.");
    } catch (error) {
      console.error("ARI Circle notifications clear failed:", error);
      toast(error.message || "Could not clear notifications.");
      if (button) button.disabled = false;
    } finally {
      state.clearing = false;
    }
  }

  function bindObserver() {
    if (state.observer) return;
    const list = $("circle-notifications-list");
    if (!list) return;
    state.observer = new MutationObserver(() => requestAnimationFrame(decorate));
    state.observer.observe(list, { childList: true });
  }

  function start() {
    if (state.started || !$("circle-notifications-dialog")) return;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) return;
    state.started = true;
    ensureStyle();
    ensureClearButton();
    bindObserver();
    decorate();
  }

  document.addEventListener("DOMContentLoaded", start, { once: true });
  document.addEventListener("circle:app-ready", () => { start(); decorate(); });

  window.AriCircleNotificationsV4 = Object.freeze({
    version: VERSION,
    refresh: decorate
  });
})();
