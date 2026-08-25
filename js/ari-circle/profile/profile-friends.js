/* =============================================================
   ARI CIRCLE — PROFILE FRIENDS
   Version: 1.0.0

   Profile-only friends UI.
   Relationship state stays owned by ConnectionsController.
   Direct-message routing stays owned by MessagesController.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-profile-friends-style";
  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const state = {
    client: null,
    viewerUserId: null,
    started: false
  };

  function app() {
    return window.AriCircleApp || window.Ari?.circle || null;
  }

  function store() {
    return app()?.modules?.CircleStore || null;
  }

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const current = client();
    if (!current?.rpc) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await current.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-profile-friends.css?v=1.0.0";
    document.head.append(link);
  }

  async function resolveViewerUserId() {
    const context = store()?.get?.("context") || store()?.getState?.()?.context || null;
    const fromStore = clean(context?.viewerUserId || context?.viewer_user_id);
    if (fromStore) {
      state.viewerUserId = fromStore;
      return fromStore;
    }

    const current = client();
    if (!current?.auth) return null;
    const { data } = await current.auth.getUser();
    state.viewerUserId = clean(data?.user?.id);
    return state.viewerUserId || null;
  }

  function ensureOwnSeeFriends() {
    const currentStore = store();
    const context = currentStore?.get?.("context") || currentStore?.getState?.()?.context || null;
    if (!context?.isOwner) return null;

    const actions = $("circle-owner-actions");
    if (!actions) return null;

    let button = $("circle-see-friends-action");
    if (!button) {
      button = document.createElement("button");
      button.id = "circle-see-friends-action";
      button.className = "circle-button circle-button--secondary";
      button.type = "button";
      button.dataset.circleAction = "view-entire-circle";
      button.textContent = "See Friends";
      actions.append(button);
    }

    button.hidden = false;
    button.disabled = false;
    return button;
  }

  function friendsDialog() {
    let dialog = $("circle-profile-friends-dialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "circle-profile-friends-dialog";
    dialog.className = "circle-profile-friends-dialog";
    dialog.innerHTML = `
      <div class="circle-profile-friends-dialog__panel">
        <header class="circle-profile-friends-dialog__header">
          <div><h2 id="circleProfileFriendsTitle">Friends</h2><p id="circleProfileFriendsStatus">Loading…</p></div>
          <button class="circle-profile-friends-dialog__close" type="button" aria-label="Close">×</button>
        </header>
        <div class="circle-profile-friends-dialog__list" id="circleProfileFriendsList"></div>
      </div>`;

    document.body.append(dialog);
    dialog.querySelector(".circle-profile-friends-dialog__close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  async function openProfileFriends(userId) {
    const id = clean(userId);
    if (!id) return false;

    await resolveViewerUserId();
    const dialog = friendsDialog();
    const title = $("circleProfileFriendsTitle");
    const status = $("circleProfileFriendsStatus");
    const host = $("circleProfileFriendsList");
    const currentProfile = store()?.get?.("profile") || store()?.getState?.()?.profile || null;
    const profileName = clean(currentProfile?.display_name || currentProfile?.displayName || $("circle-display-name")?.textContent) || "Their";

    if (title) title.textContent = id === state.viewerUserId ? "Your Friends" : `${profileName}'s Friends`;
    if (status) status.textContent = "Loading friends…";
    host?.replaceChildren();
    if (!dialog.open) dialog.showModal();

    try {
      const rows = await rpc("ari_circle_profile_friends", {
        requested_user_id: id,
        result_limit: 150
      });
      const friends = Array.isArray(rows) ? rows : [];

      if (status) status.textContent = `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`;
      if (!host) return true;

      if (!friends.length) {
        host.innerHTML = '<div class="circle-profile-friends-dialog__empty">No friends to show yet.</div>';
        return true;
      }

      friends.forEach((person) => {
        const friendId = clean(person.user_id);
        if (!friendId) return;

        const displayName = clean(person.display_name) || "ARI User";
        const handle = clean(person.handle).replace(/^@+/, "");
        const avatar = clean(person.avatar_url);
        const row = document.createElement("article");
        row.className = "circle-profile-friend-row";
        row.innerHTML = `
          <a class="circle-profile-friend-row__avatar" href="ari-circle.html?user=${encodeURIComponent(friendId)}">
            ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy" />` : escapeHtml(displayName.charAt(0).toUpperCase())}
          </a>
          <a class="circle-profile-friend-row__identity" href="ari-circle.html?user=${encodeURIComponent(friendId)}">
            <strong>${escapeHtml(displayName)}</strong><span>${handle ? `@${escapeHtml(handle)}` : "View profile"}</span>
          </a>
          <a class="circle-profile-friend-row__message" href="ari-circle-messages.html?user=${encodeURIComponent(friendId)}">Message</a>`;
        host.append(row);
      });
      return true;
    } catch (error) {
      console.error("ARI Circle friend list failed:", error);
      if (status) status.textContent = "Friends unavailable right now.";
      if (host) host.innerHTML = '<div class="circle-profile-friends-dialog__empty">Could not load this friends list.</div>';
      return false;
    }
  }

  function ensureConnectedProfileFriendsShortcut() {
    const currentStore = store();
    const stateSnapshot = currentStore?.getState?.() || null;
    const context = currentStore?.get?.("context") || stateSnapshot?.context || null;
    const connection = currentStore?.get?.("connection") || stateSnapshot?.connection || null;
    const profile = currentStore?.get?.("profile") || stateSnapshot?.profile || null;
    const profileUserId = clean(profile?.user_id || profile?.userId || profile?.id);
    const actions = $("circle-visitor-actions");

    let button = $("circle-view-profile-friends-action");
    const shouldShow = Boolean(context?.isVisitor && profileUserId && String(connection?.status || "").toLowerCase() === "connected");

    if (!shouldShow) {
      if (button) button.hidden = true;
      return null;
    }

    if (!actions) return null;
    if (!button) {
      button = document.createElement("button");
      button.id = "circle-view-profile-friends-action";
      button.className = "circle-button circle-button--secondary";
      button.type = "button";
      button.textContent = "See Friends";
      button.addEventListener("click", () => openProfileFriends(profileUserId));
      actions.append(button);
    }

    button.hidden = false;
    button.disabled = false;
    return button;
  }

  function refresh() {
    if (!document.body.classList.contains("ari-circle-page")) return;
    ensureStyle();
    ensureOwnSeeFriends();
    ensureConnectedProfileFriendsShortcut();
  }

  function bindStore() {
    const currentStore = store();
    if (!currentStore?.subscribe || currentStore.__ariProfileFriendsSubscribed) return;
    currentStore.__ariProfileFriendsSubscribed = true;
    currentStore.subscribe((_, change) => {
      const keys = Array.isArray(change?.keys) ? change.keys : [];
      if (!keys.length || keys.includes("context") || keys.includes("connection") || keys.includes("profile")) {
        refresh();
      }
    });
  }

  function start() {
    if (state.started || !document.body.classList.contains("ari-circle-page")) return;
    state.started = true;
    ensureStyle();
    bindStore();
    refresh();
    requestAnimationFrame(() => {
      bindStore();
      refresh();
    });
    document.addEventListener("circle:app-ready", () => {
      bindStore();
      refresh();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  window.AriCircleProfileFriends = Object.freeze({
    version: VERSION,
    refresh,
    openProfileFriends
  });
})();