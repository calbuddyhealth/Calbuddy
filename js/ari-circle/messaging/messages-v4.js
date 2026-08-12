/* =============================================================
   ARI CIRCLE — UNIFIED MESSAGES
   Version: 1.0.0
============================================================= */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    client: null,
    user: null,
    conversations: [],
    activeConversationId: null,
    activeConversation: null,
    busy: false,
    refreshTimer: 0
  };

  const clean = (v) => String(v ?? "").trim();
  const escapeHtml = (v) => String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function initial(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function relativeTime(value) {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    if (!Number.isFinite(diff)) return "";
    const minutes = Math.max(0, Math.floor(diff / 60000));
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function toast(message) {
    const host = $("messagesToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 3200);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    if (!state.user) {
      window.location.href = "signin.html";
      return null;
    }
    return state.user;
  }

  function avatarMarkup(row, className = "circle-conversation__avatar") {
    const url = clean(row?.avatar_url);
    const name = clean(row?.display_name) || "ARI User";
    return `<span class="${className}">${url ? `<img src="${escapeHtml(url)}" alt="" loading="lazy" />` : escapeHtml(initial(name))}</span>`;
  }

  function renderInbox() {
    const host = $("conversationList");
    const empty = $("conversationEmpty");
    const status = $("inboxStatus");
    if (!host || !empty || !status) return;

    host.replaceChildren();
    empty.hidden = state.conversations.length > 0;
    status.textContent = state.conversations.length
      ? `${state.conversations.length} conversation${state.conversations.length === 1 ? "" : "s"}`
      : "";

    state.conversations.forEach((row) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "circle-conversation";
      if (clean(row.conversation_id) === state.activeConversationId) button.classList.add("is-active");

      const unread = Number(row.unread_count) || 0;
      button.innerHTML = `
        ${avatarMarkup(row)}
        <span class="circle-conversation__copy">
          <strong>${escapeHtml(row.display_name || "ARI User")}</strong>
          <span>${escapeHtml(row.last_message_body || (row.handle ? `@${row.handle}` : "Open conversation"))}</span>
        </span>
        <span class="circle-conversation__meta">
          <span>${escapeHtml(relativeTime(row.last_message_at))}</span>
          ${unread > 0 ? `<span class="circle-conversation__badge">${unread > 99 ? "99+" : unread}</span>` : ""}
        </span>
      `;
      button.addEventListener("click", () => openConversation(row));
      host.append(button);
    });
  }

  async function loadInbox() {
    try {
      const rows = await rpc("ari_circle_messages_list", { result_limit: 80 });
      state.conversations = Array.isArray(rows) ? rows : [];
      renderInbox();
    } catch (error) {
      console.error("ARI Circle messages inbox failed:", error);
      $("inboxStatus").textContent = error.message || "Messages unavailable right now.";
    }
  }

  function setThreadIdentity(row) {
    const name = clean(row?.display_name) || "ARI User";
    const handle = clean(row?.handle).replace(/^@+/, "");
    const avatar = $("threadAvatar");
    if (avatar) {
      avatar.replaceChildren();
      const url = clean(row?.avatar_url);
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        avatar.append(img);
      } else {
        avatar.textContent = initial(name);
      }
    }
    $("threadName").textContent = name;
    $("threadHandle").textContent = handle ? `@${handle}` : "";
    const link = $("threadProfileLink");
    if (link && row?.other_user_id) link.href = `ari-circle.html?user=${encodeURIComponent(row.other_user_id)}`;
  }

  function renderThread(messages) {
    const host = $("threadMessages");
    const empty = $("threadEmpty");
    if (!host || !empty) return;
    host.replaceChildren();
    empty.hidden = messages.length > 0;

    messages.forEach((msg) => {
      const mine = clean(msg.sender_user_id) === clean(state.user?.id);
      const row = document.createElement("div");
      row.className = `circle-message-row${mine ? " is-mine" : ""}`;
      row.innerHTML = `
        <div class="circle-message-bubble">
          ${escapeHtml(msg.body || "")}
          <span class="circle-message-time">${escapeHtml(relativeTime(msg.created_at))}</span>
        </div>
      `;
      host.append(row);
    });

    requestAnimationFrame(() => { host.scrollTop = host.scrollHeight; });
  }

  async function loadThread(conversationId) {
    try {
      const rows = await rpc("ari_circle_messages_thread", {
        requested_conversation_id: conversationId,
        result_limit: 250
      });
      renderThread(Array.isArray(rows) ? rows : []);
      await loadInbox();
    } catch (error) {
      console.error("ARI Circle message thread failed:", error);
      toast(error.message || "Could not open that conversation.");
    }
  }

  async function openConversation(row) {
    const id = clean(row?.conversation_id);
    if (!id) return;
    state.activeConversationId = id;
    state.activeConversation = row;
    setThreadIdentity(row);
    $("circleThread").hidden = false;
    $("messagesPage").classList.add("has-thread");
    renderInbox();
    await loadThread(id);
  }

  function closeThread() {
    state.activeConversationId = null;
    state.activeConversation = null;
    $("circleThread").hidden = true;
    $("messagesPage").classList.remove("has-thread");
    renderInbox();
  }

  async function openRequestedUser() {
    const userId = clean(new URLSearchParams(window.location.search).get("user"));
    if (!userId) return;

    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", {
        requested_user_id: userId
      });
      await loadInbox();
      const row = state.conversations.find((item) => clean(item.conversation_id) === clean(conversationId));
      if (row) await openConversation(row);
    } catch (error) {
      console.error("ARI Circle direct message open failed:", error);
      toast(error.message || "Could not start that conversation.");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (state.busy || !state.activeConversationId) return;
    const input = $("messageInput");
    const body = clean(input?.value);
    if (!body) return;

    state.busy = true;
    $("sendMessageButton").disabled = true;
    try {
      await rpc("ari_circle_messages_send", {
        requested_conversation_id: state.activeConversationId,
        requested_body: body
      });
      input.value = "";
      input.style.height = "auto";
      await loadThread(state.activeConversationId);
    } catch (error) {
      console.error("ARI Circle message send failed:", error);
      toast(error.message || "Message could not be sent.");
    } finally {
      state.busy = false;
      $("sendMessageButton").disabled = false;
    }
  }

  function bind() {
    $("threadBack")?.addEventListener("click", closeThread);
    $("messageForm")?.addEventListener("submit", sendMessage);
    $("messageInput")?.addEventListener("input", (event) => {
      const el = event.currentTarget;
      el.style.height = "auto";
      el.style.height = `${Math.min(130, el.scrollHeight)}px`;
    });

    window.addEventListener("focus", () => {
      clearTimeout(state.refreshTimer);
      state.refreshTimer = setTimeout(async () => {
        await loadInbox();
        if (state.activeConversationId) await loadThread(state.activeConversationId);
      }, 120);
    });
  }

  async function init() {
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) {
      $("messagesLoading").innerHTML = "<strong>Messages unavailable.</strong>";
      return;
    }

    try {
      const user = await requireUser();
      if (!user) return;
      bind();
      await loadInbox();
      $("messagesPage").hidden = false;
      $("messagesLoading").hidden = true;
      await openRequestedUser();
    } catch (error) {
      console.error("ARI Circle messages failed to start:", error);
      $("messagesLoading").innerHTML = `<strong>${escapeHtml(error.message || "Could not open Messages.")}</strong>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();