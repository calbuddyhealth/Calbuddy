/* ARI XP — Blocked Users v1.0.1 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    rows: [],
    pending: null,
    busy: false
  };

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function displayName(row = {}) {
    return clean(row.display_name) || clean(row.handle) || "ARI user";
  }

  function setStatus(message = "", type = "") {
    const node = $("blockedUsersStatus");
    if (!node) return;
    node.textContent = message;
    node.dataset.state = type;
    node.hidden = !message;
  }

  function formatBlockedDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `Blocked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`;
  }

  function createAvatar(row) {
    const avatar = document.createElement("span");
    avatar.className = "ari-blocked-avatar";
    avatar.setAttribute("aria-hidden", "true");

    const name = displayName(row);
    avatar.textContent = name.charAt(0).toUpperCase() || "A";

    const url = clean(row.avatar_url);
    if (/^https:\/\//i.test(url)) {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => image.remove(), { once: true });
      avatar.appendChild(image);
    }

    return avatar;
  }

  function createUserCard(row) {
    const card = document.createElement("article");
    card.className = "ari-blocked-user-card";
    card.dataset.userId = clean(row.user_id);

    const copy = document.createElement("div");
    copy.className = "ari-blocked-user-copy";

    const name = document.createElement("strong");
    name.textContent = displayName(row);
    copy.appendChild(name);

    const handle = clean(row.handle);
    if (handle) {
      const handleNode = document.createElement("span");
      handleNode.className = "ari-blocked-user-handle";
      handleNode.textContent = handle.startsWith("@") ? handle : `@${handle}`;
      copy.appendChild(handleNode);
    }

    const blockedDate = formatBlockedDate(row.blocked_at);
    if (blockedDate) {
      const dateNode = document.createElement("span");
      dateNode.className = "ari-blocked-user-date";
      dateNode.textContent = blockedDate;
      copy.appendChild(dateNode);
    }

    const button = document.createElement("button");
    button.className = "ari-unblock-button";
    button.type = "button";
    button.textContent = "Unblock";
    button.setAttribute("aria-label", `Unblock ${displayName(row)}`);
    button.addEventListener("click", () => openUnblockDialog(row));

    card.append(createAvatar(row), copy, button);
    return card;
  }

  function render() {
    const list = $("blockedUsersList");
    const empty = $("blockedUsersEmpty");
    const loading = $("blockedUsersLoading");
    if (!list || !empty || !loading) return;

    loading.hidden = true;
    list.replaceChildren();

    if (!state.rows.length) {
      list.hidden = true;
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.hidden = false;

    for (const row of state.rows) {
      list.appendChild(createUserCard(row));
    }
  }

  async function loadBlockedUsers() {
    const loading = $("blockedUsersLoading");
    if (loading) loading.hidden = false;
    setStatus("");

    const { data, error } = await window.calbuddySupabase.rpc("ari_circle_list_blocked_users");

    if (error) {
      if (loading) loading.hidden = true;
      state.rows = [];
      render();
      setStatus(error.message || "Could not load blocked users.", "error");
      return;
    }

    state.rows = Array.isArray(data) ? data : [];
    render();
  }

  function openUnblockDialog(row) {
    if (state.busy) return;

    state.pending = row;
    const name = displayName(row);
    $("unblockDialogTitle").textContent = `Unblock ${name}?`;
    $("unblockDialogText").textContent =
      "This removes your block and lets normal ARI Circle visibility rules apply again. It does not restore a previous Circle connection or request.";

    const dialog = $("unblockDialog");
    if (dialog?.showModal && !dialog.open) dialog.showModal();
  }

  function closeUnblockDialog() {
    if (state.busy) return;
    state.pending = null;
    const dialog = $("unblockDialog");
    if (dialog?.open) dialog.close();
  }

  async function unblockPendingUser() {
    const row = state.pending;
    const targetUserId = clean(row?.user_id);
    if (!targetUserId || state.busy) return;

    state.busy = true;
    $("confirmUnblockButton").disabled = true;
    $("cancelUnblockButton").disabled = true;
    $("unblockDialogClose").disabled = true;
    setStatus("Removing block…", "working");

    const { data, error } = await window.calbuddySupabase.rpc("ari_circle_unblock_user", {
      target_user_id: targetUserId
    });

    state.busy = false;
    $("confirmUnblockButton").disabled = false;
    $("cancelUnblockButton").disabled = false;
    $("unblockDialogClose").disabled = false;

    if (error) {
      setStatus(error.message || "Could not unblock this user.", "error");
      return;
    }

    const dialog = $("unblockDialog");
    if (dialog?.open) dialog.close();
    state.pending = null;

    state.rows = state.rows.filter((item) => clean(item.user_id) !== targetUserId);
    render();

    sessionStorage.removeItem("ari_circle_badges_v1");
    setStatus(data === false ? "This user was already unblocked." : "User unblocked.", "success");
  }

  function bindEvents() {
    $("unblockDialogClose")?.addEventListener("click", closeUnblockDialog);
    $("cancelUnblockButton")?.addEventListener("click", closeUnblockDialog);
    $("unblockDialogForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      unblockPendingUser();
    });
  }

  async function init() {
    bindEvents();

    const { data, error } = await window.calbuddySupabase.auth.getUser();
    if (error || !data?.user) {
      window.location.replace("signin.html");
      return;
    }

    await loadBlockedUsers();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
