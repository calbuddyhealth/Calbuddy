/* =============================================================
   ARI CIRCLE — PROFILE SOCIAL FLOW
   Version: 1.0.0

   Profile-only relationship state, actions, and friends list.
   Feed post controls are intentionally owned elsewhere.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-profile-social-flow-style";
  const state = {
    client: null,
    viewerUserId: null,
    profileUserId: null,
    relationship: "unknown",
    connectionId: null,
    applyingActions: false,
    actionObserver: null,
    started: false
  };

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-profile-social-flow.css?v=1.0.0";
    document.head.append(link);
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

  async function resolveProfileContext() {
    const current = client();
    if (!current?.auth) return;
    const { data } = await current.auth.getUser();
    state.viewerUserId = clean(data?.user?.id);
    if (!state.viewerUserId) return;

    const params = new URLSearchParams(location.search);
    const user = clean(params.get("user"));
    if (user) {
      state.profileUserId = user;
      return;
    }

    const handle = clean(params.get("handle")).replace(/^@+/, "");
    if (handle) {
      const { data: profile } = await current
        .from("ari_circle_profiles")
        .select("user_id")
        .eq("handle", handle)
        .maybeSingle();
      state.profileUserId = clean(profile?.user_id);
      return;
    }

    state.profileUserId = state.viewerUserId;
  }

  async function resolveRelationship() {
    if (!state.viewerUserId || !state.profileUserId) return;
    if (state.viewerUserId === state.profileUserId) {
      state.relationship = "self";
      state.connectionId = null;
      return;
    }

    try {
      const result = await rpc("ari_circle_relationship_state", {
        requested_user_id: state.profileUserId
      });
      const row = Array.isArray(result) ? result[0] : result;
      state.relationship = clean(row?.relationship_state) || "stranger";
      state.connectionId = clean(row?.connection_id) || null;
    } catch (error) {
      console.warn("ARI Circle relationship state unavailable:", error);
      state.relationship = "stranger";
      state.connectionId = null;
    }
  }

  function ensureOwnSeeFriends() {
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
    return button;
  }

  function setText(element, text) {
    if (element && clean(element.textContent) !== text) element.textContent = text;
  }

  function wireProfileMessage(button) {
    if (!button || !state.profileUserId) return;
    button.disabled = false;
    button.hidden = false;
    setText(button, "Message");
    button.removeAttribute("data-circle-action");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      location.href = `ari-circle-messages.html?user=${encodeURIComponent(state.profileUserId)}`;
    };
  }

  function wireTargetFriends(button) {
    if (!button || !state.profileUserId) return;
    button.disabled = false;
    button.hidden = false;
    setText(button, "See Friends");
    button.dataset.profileTargetFriends = "true";
    button.removeAttribute("data-circle-action");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openProfileFriends(state.profileUserId);
    };
  }

  function restoreLegacyConnectionAction(button) {
    if (!button) return;
    button.dataset.profileTargetFriends = "false";
    button.onclick = null;
    button.disabled = false;
    button.hidden = false;
    button.dataset.circleAction = "connection";
  }

  function applyProfileActions() {
    if (state.applyingActions || !document.body.classList.contains("ari-circle-page")) return;
    const ownerActions = $("circle-owner-actions");
    const visitorActions = $("circle-visitor-actions");
    if (!ownerActions || !visitorActions) return;

    state.applyingActions = true;
    try {
      const edit = $("circle-edit-profile-action");
      const connection = $("circle-connection-action");
      const message = $("circle-message-action");
      const owner = state.relationship === "self" || state.viewerUserId === state.profileUserId;

      ownerActions.hidden = !owner;
      visitorActions.hidden = owner;
      ownerActions.style.display = owner ? "grid" : "none";
      visitorActions.style.display = owner ? "none" : "grid";

      if (owner) {
        if (edit) {
          edit.hidden = false;
          edit.disabled = false;
          setText(edit, "Edit Profile");
        }
        ensureOwnSeeFriends();
        return;
      }

      if (!connection || !message) return;
      visitorActions.classList.toggle("is-connected", state.relationship === "friend");
      wireProfileMessage(message);

      switch (state.relationship) {
        case "friend":
          wireTargetFriends(connection);
          if (visitorActions.firstElementChild !== message) visitorActions.insertBefore(message, connection);
          break;
        case "outgoing_pending":
          restoreLegacyConnectionAction(connection);
          connection.removeAttribute("data-circle-action");
          setText(connection, "Requested ✓");
          connection.disabled = true;
          if (visitorActions.firstElementChild !== connection) visitorActions.insertBefore(connection, message);
          break;
        case "incoming_pending":
          restoreLegacyConnectionAction(connection);
          setText(connection, "Respond");
          if (visitorActions.firstElementChild !== connection) visitorActions.insertBefore(connection, message);
          break;
        case "blocked":
          connection.hidden = true;
          message.hidden = true;
          break;
        case "stranger":
        default:
          restoreLegacyConnectionAction(connection);
          setText(connection, "Add Friend");
          if (visitorActions.firstElementChild !== connection) visitorActions.insertBefore(connection, message);
          break;
      }
    } finally {
      state.applyingActions = false;
    }
  }

  function bindProfileActionGuard() {
    if (state.actionObserver || !document.body.classList.contains("ari-circle-page")) return;
    const ownerActions = $("circle-owner-actions");
    const visitorActions = $("circle-visitor-actions");
    if (!ownerActions || !visitorActions) return;

    state.actionObserver = new MutationObserver(() => {
      if (state.applyingActions) return;
      requestAnimationFrame(applyProfileActions);
    });

    [ownerActions, visitorActions].forEach((node) => {
      state.actionObserver.observe(node, {
        attributes: true,
        attributeFilter: ["hidden", "style", "class"]
      });
    });
  }

  async function syncProfileActions() {
    if (!document.body.classList.contains("ari-circle-page")) return;
    await resolveProfileContext();
    if (!state.viewerUserId || !state.profileUserId) return;
    await resolveRelationship();
    applyProfileActions();
    bindProfileActionGuard();
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
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    return dialog;
  }

  async function openProfileFriends(userId) {
    const id = clean(userId);
    if (!id) return;
    const dialog = friendsDialog();
    const title = $("circleProfileFriendsTitle");
    const status = $("circleProfileFriendsStatus");
    const host = $("circleProfileFriendsList");
    const name = clean($("circle-display-name")?.textContent) || "Their";
    title.textContent = id === state.viewerUserId ? "Your Friends" : `${name}'s Friends`;
    status.textContent = "Loading friends…";
    host.replaceChildren();
    if (!dialog.open) dialog.showModal();

    try {
      const rows = await rpc("ari_circle_profile_friends", { requested_user_id: id, result_limit: 150 });
      const friends = Array.isArray(rows) ? rows : [];
      status.textContent = `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`;
      if (!friends.length) {
        host.innerHTML = '<div class="circle-profile-friends-dialog__empty">No friends to show yet.</div>';
        return;
      }
      friends.forEach((person) => {
        const friendId = clean(person.user_id);
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
    } catch (error) {
      console.error("ARI Circle friend list failed:", error);
      status.textContent = "Friends unavailable right now.";
      host.innerHTML = '<div class="circle-profile-friends-dialog__empty">Could not load this friends list.</div>';
    }
  }

  function patchOwnFriendsManager() {
    const dialog = $("circle-members-dialog");
    if (!dialog) return;
    dialog.querySelectorAll('.circle-members-person__actions [data-circle-members-action="open-profile"]').forEach((button) => {
      const userId = clean(button.dataset.userId);
      if (!userId || button.dataset.profileMessageUser === "true") return;
      button.dataset.profileMessageUser = "true";
      button.removeAttribute("data-circle-members-action");
      button.textContent = "Message";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.href = `ari-circle-messages.html?user=${encodeURIComponent(userId)}`;
      }, true);
    });
  }

  function bindFriendsManagerPatch() {
    document.addEventListener("click", (event) => {
      if (event.target.closest("#circle-see-friends-action, [data-circle-action='view-entire-circle']")) {
        setTimeout(patchOwnFriendsManager, 60);
        setTimeout(patchOwnFriendsManager, 220);
      }
    });
  }

  async function run() {
    ensureStyle();
    await syncProfileActions();
    patchOwnFriendsManager();
  }

  function start() {
    if (state.started || !document.body.classList.contains("ari-circle-page")) return;
    state.started = true;
    ensureStyle();
    bindFriendsManagerPatch();
    run();
    setTimeout(run, 180);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
  document.addEventListener("circle:app-ready", () => { run(); setTimeout(run, 100); });

  window.AriCircleProfileSocialFlow = Object.freeze({
    version: VERSION,
    refresh: run,
    openProfileFriends,
    relationship: () => state.relationship
  });
})();
