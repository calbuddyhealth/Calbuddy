/* =============================================================
   ARI CIRCLE — UNIFIED MESSAGES
   Version: 1.3.0

   V1.3:
   - Inbox is the default view and clearly identifies itself as Messages.
   - Thread Back is a real link to the inbox (Safari-safe).
   - Composer only appears for a valid active conversation.
   - Empty threads show a proper "No messages yet" state.
   - Direct-message links can build a valid thread identity even before the
     conversation appears in the inbox list.
   - Green means online; grey means offline.
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
    query: "",
    busy: false,
    refreshTimer: 0,
    presenceChannel: null,
    onlineUserIds: new Set()
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
    if (!value) return "";
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

  function isOnline(userId) {
    return state.onlineUserIds.has(clean(userId));
  }

  function presenceStatus(userId) {
    return isOnline(userId) ? "online" : "offline";
  }

  function filteredConversations() {
    const q = state.query.toLowerCase();
    if (!q) return state.conversations;
    return state.conversations.filter((row) => {
      return [row.display_name, row.handle, row.last_message_body]
        .some((value) => clean(value).toLowerCase().includes(q));
    });
  }

  function renderInbox() {
    const host = $("conversationList");
    const empty = $("conversationEmpty");
    const status = $("inboxStatus");
    if (!host || !empty || !status) return;

    const rows = filteredConversations();
    host.replaceChildren();

    if (state.query && !rows.length) {
      empty.hidden = true;
      status.textContent = "No matching conversations.";
    } else {
      empty.hidden = state.conversations.length > 0;
      status.textContent = "";
    }

    rows.forEach((row) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "circle-conversation";
      if (clean(row.conversation_id) === state.activeConversationId) button.classList.add("is-active");

      const unread = Number(row.unread_count) || 0;
      const preview = clean(row.last_message_body) || (row.handle ? `@${clean(row.handle).replace(/^@+/, "")}` : "New conversation");
      const presence = presenceStatus(row.other_user_id);
      button.innerHTML = `
        <span class="circle-conversation__avatar-wrap">
          ${avatarMarkup(row)}
          <span class="circle-conversation__presence-dot" data-status="${presence}" aria-label="${presence === "online" ? "Online" : "Offline"}"></span>
        </span>
        <span class="circle-conversation__copy">
          <strong>${escapeHtml(row.display_name || "ARI User")}</strong>
          <span>${escapeHtml(preview)}</span>
        </span>
        <span class="circle-conversation__meta">
          <span>${escapeHtml(relativeTime(row.last_message_at))}</span>
          ${unread > 0 ? '<span class="circle-conversation__unread-dot" aria-label="Unread message"></span>' : ""}
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

  function syncThreadPresence() {
    const userId = clean(state.activeConversation?.other_user_id);
    const status = presenceStatus(userId);
    const dot = $("threadPresenceDot");
    const text = $("threadPresenceText");

    if (dot) {
      dot.dataset.status = status;
      dot.setAttribute("aria-label", status === "online" ? "Online" : "Offline");
    }

    if (text) {
      text.dataset.status = status;
      text.textContent = status === "online" ? "Online" : "Offline";
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
    syncThreadPresence();
  }

  function setComposerVisible(visible) {
    const form = $("messageForm");
    if (form) form.hidden = !visible;
  }

  function renderThread(messages) {
    const host = $("threadMessages");
    const empty = $("threadEmpty");
    if (!host || !empty) return;

    host.replaceChildren();
    const rows = Array.isArray(messages) ? messages : [];
    empty.hidden = rows.length > 0;

    rows.forEach((msg) => {
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
    const otherUserId = clean(row?.other_user_id);
    if (!id || !otherUserId) return;

    state.activeConversationId = id;
    state.activeConversation = row;
    setThreadIdentity(row);
    setComposerVisible(true);
    $("circleThread").hidden = false;
    $("messagesPage").classList.add("has-thread");
    renderInbox();
    await loadThread(id);
  }

  function closeThread() {
    state.activeConversationId = null;
    state.activeConversation = null;
    setComposerVisible(false);
    $("circleThread").hidden = true;
    $("messagesPage").classList.remove("has-thread");
    renderInbox();
  }

  async function profileRowForDirectUser(userId, conversationId) {
    try {
      const { data, error } = await state.client
        .from("ari_circle_profiles")
        .select("user_id, display_name, handle, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data?.user_id) return null;
      return {
        conversation_id: conversationId,
        other_user_id: data.user_id,
        display_name: data.display_name || "ARI User",
        handle: data.handle || "",
        avatar_url: data.avatar_url || "",
        unread_count: 0,
        last_message_body: "",
        last_message_at: null
      };
    } catch (error) {
      console.warn("ARI Circle direct-message identity unavailable:", error);
      return null;
    }
  }

  async function openRequestedUser() {
    const userId = clean(new URLSearchParams(window.location.search).get("user"));
    if (!userId || userId === clean(state.user?.id)) return;

    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", {
        requested_user_id: userId
      });
      await loadInbox();
      let row = state.conversations.find((item) => clean(item.conversation_id) === clean(conversationId));
      if (!row) row = await profileRowForDirectUser(userId, conversationId);
      if (row) {
        await openConversation(row);
      } else {
        closeThread();
        toast("That conversation is not available yet.");
      }
    } catch (error) {
      console.error("ARI Circle direct message open failed:", error);
      closeThread();
      toast(error.message || "Could not open that conversation.");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (state.busy || !state.activeConversationId || !state.activeConversation?.other_user_id) return;
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

  function syncPresenceState(channel) {
    const raw = channel?.presenceState?.() || {};
    const online = new Set();

    Object.entries(raw).forEach(([key, entries]) => {
      const fallbackId = clean(key).replace(/^user:/, "");
      const list = Array.isArray(entries) ? entries : [];
      if (!list.length && fallbackId) online.add(fallbackId);
      list.forEach((entry) => {
        if (entry?.visible === false) return;
        const userId = clean(entry?.user_id) || fallbackId;
        const status = clean(entry?.status).toLowerCase();
        if (userId && status !== "offline") online.add(userId);
      });
    });

    state.onlineUserIds = online;
    renderInbox();
    syncThreadPresence();
  }

  function connectPresence() {
    if (!state.client || !state.user || state.presenceChannel) return;

    const key = `user:${state.user.id}`;
    const channel = state.client.channel("ari-circle:presence", {
      config: { presence: { key } }
    });

    channel
      .on("presence", { event: "sync" }, () => syncPresenceState(channel))
      .on("presence", { event: "join" }, () => syncPresenceState(channel))
      .on("presence", { event: "leave" }, () => syncPresenceState(channel))
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        try {
          await channel.track({
            user_id: state.user.id,
            status: "online",
            online_at: new Date().toISOString(),
            visible: true
          });
        } catch (error) {
          console.warn("ARI Circle message presence track failed:", error);
        }
      });

    state.presenceChannel = channel;
  }

  async function disconnectPresence() {
    const channel = state.presenceChannel;
    state.presenceChannel = null;
    if (!channel || !state.client) return;
    try { await channel.untrack?.(); } catch {}
    try { await state.client.removeChannel(channel); } catch {}
  }

  function bind() {
    // threadBack is intentionally a normal anchor. A hard navigation back to
    // the inbox is the most reliable behavior on iOS Safari.
    $("messageForm")?.addEventListener("submit", sendMessage);
    $("messageSearch")?.addEventListener("input", (event) => {
      state.query = clean(event.currentTarget.value);
      renderInbox();
    });
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

    window.addEventListener("pagehide", () => { disconnectPresence(); }, { once: true });
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
      connectPresence();
      setComposerVisible(false);
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
