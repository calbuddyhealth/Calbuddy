/* =============================================================
   ARI CIRCLE V4 — SOCIAL FLOW FIXES
   Version: 1.0.0

   Keeps the simplified Circle UX consistent across Feed, Profile,
   Buddies, Challenges, comments, posts, friends, and Messages.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-v4-flow-fixes-style";
  const MESSAGE_ICON = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18.25 3.75 20l.85-3.45A7.9 7.9 0 0 1 3 11.75C3 7.47 6.9 4 11.7 4h.6c4.8 0 8.7 3.47 8.7 7.75s-3.9 7.75-8.7 7.75h-.6A9.5 9.5 0 0 1 7 18.25Z"></path>
    </svg>
  `;

  const state = {
    client: null,
    viewerUserId: null,
    profileUserId: null,
    profileResolved: false,
    postOptionsPostId: null,
    postOptionsReportUrl: null,
    postOptionsMediaPath: null,
    postOptionsOwner: false,
    friendDialogUserId: null,
    friendDialogName: null,
    scheduled: false
  };

  const $ = (id) => document.getElementById(id);

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-v4-flow-fixes.css?v=1.0.0";
    document.head.append(link);
  }

  function getClient() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const client = getClient();
    if (!client) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function showToast(message) {
    const host = $("feedToast") || $("partnerToast") || $("challengeToast") || $("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      host.hidden = true;
    }, 3000);
  }

  function standardizePrimaryNav() {
    document.querySelectorAll(".feed-tabs, .partner-tabs, .challenge-tabs, #circleV3Nav").forEach((nav) => {
      [...nav.querySelectorAll("a,button")].forEach((item) => {
        if (clean(item.textContent).toLowerCase() === "me") item.textContent = "Profile";
      });
    });
  }

  function standardizeMessages() {
    document.querySelectorAll(".circle-v4-message").forEach((element) => {
      element.innerHTML = MESSAGE_ICON;
      if (element.tagName === "A") element.setAttribute("href", "ari-circle.html?panel=messages");
      element.setAttribute("aria-label", "Messages");
    });

    const profileButton = $("circle-messages-button");
    if (profileButton) {
      const icon = profileButton.querySelector('span[aria-hidden="true"]');
      if (icon) icon.innerHTML = MESSAGE_ICON;
      profileButton.setAttribute("aria-label", "Messages");
    }
  }

  async function resolveProfileContext() {
    if (state.profileResolved) return;
    const client = getClient();
    if (!client) return;

    try {
      const { data } = await client.auth.getUser();
      state.viewerUserId = clean(data?.user?.id);

      const params = new URLSearchParams(window.location.search);
      const explicitUser = clean(params.get("user"));
      if (explicitUser) {
        state.profileUserId = explicitUser;
      } else {
        const handle = clean(params.get("handle")).replace(/^@+/, "");
        if (handle) {
          const { data: profile } = await client
            .from("ari_circle_profiles")
            .select("user_id")
            .eq("handle", handle)
            .maybeSingle();
          state.profileUserId = clean(profile?.user_id);
        } else {
          state.profileUserId = state.viewerUserId;
        }
      }

      state.profileResolved = Boolean(state.viewerUserId);
    } catch (error) {
      console.warn("ARI Circle V4 profile context could not be resolved:", error);
    }
  }

  function ensureOwnSeeFriends() {
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

  async function syncProfileActions() {
    if (!document.body.classList.contains("ari-circle-page")) return;
    await resolveProfileContext();
    if (!state.viewerUserId || !state.profileUserId) return;

    const isOwner = state.viewerUserId === state.profileUserId;
    const ownerActions = $("circle-owner-actions");
    const visitorActions = $("circle-visitor-actions");
    const connection = $("circle-connection-action");
    const message = $("circle-message-action");

    if (ownerActions) {
      ownerActions.hidden = !isOwner;
      ownerActions.style.display = isOwner ? "grid" : "none";
    }

    if (visitorActions) {
      visitorActions.hidden = isOwner;
      visitorActions.style.display = isOwner ? "none" : "grid";
    }

    if (isOwner) {
      ensureOwnSeeFriends();
      return;
    }

    if (!connection || !message || !visitorActions) return;

    const label = clean(connection.textContent);
    const connected = /friends?\s*✓|in your circle/i.test(label) || connection.dataset.v4TargetFriends === "true";

    visitorActions.classList.toggle("is-connected", connected);

    if (connected) {
      connection.textContent = "See Friends";
      connection.dataset.v4TargetFriends = "true";
      connection.dataset.profileUserId = state.profileUserId;
      connection.removeAttribute("data-circle-action");
      if (visitorActions.firstElementChild !== message) visitorActions.insertBefore(message, connection);
    } else {
      connection.dataset.v4TargetFriends = "false";
      if (label === "Add to Circle") connection.textContent = "Add Friend";
      if (visitorActions.firstElementChild !== connection) visitorActions.insertBefore(connection, message);
    }
  }

  function ensureProfileFriendsDialog() {
    let dialog = $("circle-profile-friends-dialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "circle-profile-friends-dialog";
    dialog.className = "circle-profile-friends-dialog";
    dialog.innerHTML = `
      <div class="circle-profile-friends-dialog__panel">
        <header class="circle-profile-friends-dialog__header">
          <div>
            <h2 id="circleProfileFriendsTitle">Friends</h2>
            <p id="circleProfileFriendsStatus">Loading friends…</p>
          </div>
          <button class="circle-profile-friends-dialog__close" type="button" aria-label="Close">×</button>
        </header>
        <div class="circle-profile-friends-dialog__list" id="circleProfileFriendsList"></div>
      </div>
    `;
    document.body.append(dialog);
    dialog.querySelector(".circle-profile-friends-dialog__close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      dialog.close();
    });
    return dialog;
  }

  async function openProfileFriends(userId) {
    const id = clean(userId);
    if (!id) return;

    const dialog = ensureProfileFriendsDialog();
    const title = $("circleProfileFriendsTitle");
    const status = $("circleProfileFriendsStatus");
    const host = $("circleProfileFriendsList");
    const displayName = clean($("circle-display-name")?.textContent) || "Friends";

    state.friendDialogUserId = id;
    state.friendDialogName = displayName;

    if (title) title.textContent = `${displayName}'s Friends`;
    if (status) status.textContent = "Loading friends…";
    if (host) host.replaceChildren();
    if (!dialog.open) dialog.showModal();

    try {
      const data = await rpc("ari_circle_profile_friends", {
        requested_user_id: id,
        result_limit: 150
      });
      const rows = Array.isArray(data) ? data : [];

      if (status) status.textContent = `${rows.length} ${rows.length === 1 ? "friend" : "friends"}`;
      if (!host) return;

      if (!rows.length) {
        host.innerHTML = '<div class="circle-profile-friends-dialog__empty">No friends to show yet.</div>';
        return;
      }

      rows.forEach((person) => {
        const friendId = clean(person.user_id);
        if (!friendId) return;
        const name = clean(person.display_name) || "ARI User";
        const handle = clean(person.handle).replace(/^@+/, "");
        const avatar = clean(person.avatar_url);
        const profileUrl = `ari-circle.html?user=${encodeURIComponent(friendId)}`;
        const messageUrl = `ari-circle.html?user=${encodeURIComponent(friendId)}&panel=message`;

        const row = document.createElement("article");
        row.className = "circle-profile-friend-row";
        row.innerHTML = `
          <a class="circle-profile-friend-row__avatar" href="${profileUrl}">
            ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy" />` : escapeHtml(name.charAt(0).toUpperCase())}
          </a>
          <a class="circle-profile-friend-row__identity" href="${profileUrl}">
            <strong>${escapeHtml(name)}</strong>
            <span>${handle ? `@${escapeHtml(handle)}` : "View profile"}</span>
          </a>
          <a class="circle-profile-friend-row__message" href="${messageUrl}">Message</a>
        `;
        host.append(row);
      });
    } catch (error) {
      console.error("ARI Circle profile friends failed to load:", error);
      if (status) status.textContent = "Friends unavailable right now.";
      if (host) host.innerHTML = '<div class="circle-profile-friends-dialog__empty">Could not load this friends list.</div>';
    }
  }

  function patchOwnFriendsManager() {
    const dialog = $("circle-members-dialog");
    if (!dialog) return;

    const friendsTab = dialog.querySelector('[data-circle-members-tab="friends"]');
    const onFriends = friendsTab?.classList.contains("active");
    if (!onFriends) return;

    dialog.querySelectorAll('.circle-members-person__actions [data-circle-members-action="open-profile"]').forEach((button) => {
      const userId = clean(button.dataset.userId);
      if (!userId || button.dataset.v4MessageUser === "true") return;
      button.dataset.v4MessageUser = "true";
      button.removeAttribute("data-circle-members-action");
      button.textContent = "Message";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = `ari-circle.html?user=${encodeURIComponent(userId)}&panel=message`;
      });
    });
  }

  function ensurePostOptionsDialog() {
    let dialog = $("circle-post-options-dialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "circle-post-options-dialog";
    dialog.className = "circle-post-options";
    dialog.innerHTML = `
      <div class="circle-post-options__panel">
        <div class="circle-post-options__title">Post options</div>
        <button class="circle-post-options__button circle-post-options__button--danger" id="circlePostDelete" type="button">Delete <span>›</span></button>
        <button class="circle-post-options__button" id="circlePostHide" type="button">Hide <span>›</span></button>
        <button class="circle-post-options__button" id="circlePostReport" type="button">Report <span>›</span></button>
      </div>
    `;
    document.body.append(dialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    $("circlePostDelete")?.addEventListener("click", deleteActivePost);
    $("circlePostHide")?.addEventListener("click", hideActivePost);
    $("circlePostReport")?.addEventListener("click", () => {
      const url = state.postOptionsReportUrl;
      dialog.close();
      if (url) window.location.href = url;
    });
    return dialog;
  }

  async function openPostOptions(anchor) {
    const article = anchor.closest(".feed-post");
    const postId = clean(article?.dataset.postId);
    if (!postId) return;

    state.postOptionsPostId = postId;
    state.postOptionsReportUrl = anchor.getAttribute("href") || "help-safety.html";
    state.postOptionsMediaPath = null;
    state.postOptionsOwner = false;

    const dialog = ensurePostOptionsDialog();
    const deleteButton = $("circlePostDelete");
    if (deleteButton) deleteButton.hidden = true;
    if (!dialog.open) dialog.showModal();

    try {
      const data = await rpc("ari_circle_feed_post_options_context", { requested_post_id: postId });
      const row = Array.isArray(data) ? data[0] : data;
      state.postOptionsOwner = Boolean(row?.is_owner);
      state.postOptionsMediaPath = clean(row?.media_path);
      if (deleteButton) deleteButton.hidden = !state.postOptionsOwner;
    } catch (error) {
      console.warn("ARI Circle post options context unavailable:", error);
    }
  }

  async function hideActivePost() {
    const postId = state.postOptionsPostId;
    if (!postId) return;
    try {
      await rpc("ari_circle_feed_hide_post", { requested_post_id: postId });
      $("circle-post-options-dialog")?.close();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(postId)}"]`)?.remove();
      showToast("Post hidden.");
      window.AriCircleFeed?.refresh?.();
    } catch (error) {
      console.error("ARI Circle hide post failed:", error);
      showToast(error.message || "Could not hide that post.");
    }
  }

  async function deleteActivePost() {
    const postId = state.postOptionsPostId;
    if (!postId || !state.postOptionsOwner) return;
    try {
      await rpc("ari_circle_feed_delete_post", { requested_post_id: postId });

      if (state.postOptionsMediaPath) {
        const client = getClient();
        await client?.storage?.from("ari-circle-post-media")?.remove?.([state.postOptionsMediaPath]);
      }

      $("circle-post-options-dialog")?.close();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(postId)}"]`)?.remove();
      showToast("Post deleted.");
      window.AriCircleFeed?.refresh?.();
      window.AriCircleProfileV4?.refresh?.();
    } catch (error) {
      console.error("ARI Circle delete post failed:", error);
      showToast(error.message || "Could not delete that post.");
    }
  }

  function bindPostOptionsCapture() {
    if (document.documentElement.dataset.circleV4PostOptionsBound === "true") return;
    document.documentElement.dataset.circleV4PostOptionsBound = "true";

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest(".feed-report-link");
      if (anchor) {
        event.preventDefault();
        event.stopPropagation();
        openPostOptions(anchor);
        return;
      }

      const targetFriends = event.target.closest('[data-v4-target-friends="true"]');
      if (targetFriends) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openProfileFriends(targetFriends.dataset.profileUserId || state.profileUserId);
      }
    }, true);
  }

  function reopenRequestedMessagingAfterReady() {
    if (!document.body.classList.contains("ari-circle-page")) return;
    const panel = new URLSearchParams(window.location.search).get("panel");
    if (panel === "messages") {
      window.setTimeout(() => $("circle-messages-button")?.click(), 80);
    }
    if (panel === "message") {
      window.setTimeout(() => $("circle-message-action")?.click(), 100);
    }
  }

  function softenRealtimeFailureToast() {
    const toast = $("circle-toast");
    if (!toast) return;
    const text = clean(toast.textContent).toLowerCase();
    if (text.includes("realtime connection had a problem")) {
      toast.hidden = true;
      console.warn("ARI Circle realtime temporarily disconnected; keeping the UI available.");
    }
  }

  async function run() {
    state.scheduled = false;
    ensureStyle();
    standardizePrimaryNav();
    standardizeMessages();
    bindPostOptionsCapture();
    await syncProfileActions();
    patchOwnFriendsManager();
    softenRealtimeFailureToast();
  }

  function schedule() {
    if (state.scheduled) return;
    state.scheduled = true;
    window.requestAnimationFrame(run);
  }

  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  document.addEventListener("circle:app-ready", () => {
    state.profileResolved = false;
    schedule();
    reopenRequestedMessagingAfterReady();
  });

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["hidden", "class"]
  });

  window.AriCircleV4FlowFixes = Object.freeze({
    version: VERSION,
    refresh: schedule,
    openProfileFriends
  });
})();
