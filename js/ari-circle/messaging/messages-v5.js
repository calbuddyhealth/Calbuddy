/* =============================================================
   ARI CIRCLE — MESSAGES V5
   Version: 5.0.0

   Single-owner messaging controller.
   - One inbox query / one renderer / one active thread state.
   - Profile, Buddies, Notifications and Moments route here.
   - No rescue renderer and no page-wide MutationObserver.
   - New Message picker lives inside Messages.
   - iPhone keyboard handling uses visualViewport only.
   - Green = online, grey = offline.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();
  const escapeHtml = (v) => String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const state = {
    client: null,
    user: null,
    conversations: [],
    activeConversationId: "",
    activeConversation: null,
    query: "",
    busy: false,
    inboxBusy: false,
    threadBusy: false,
    refreshTimer: 0,
    periodicTimer: 0,
    presenceChannel: null,
    onlineUserIds: new Set(),
    started: false
  };

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
    toast.timer = setTimeout(() => { host.hidden = true; }, 2600);
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
      location.replace("signin.html");
      return null;
    }
    return state.user;
  }

  function isOnline(userId) {
    return state.onlineUserIds.has(clean(userId));
  }

  function presenceStatus(userId) {
    return isOnline(userId) ? "online" : "offline";
  }

  function avatarMarkup(row, className = "circle-conversation__avatar") {
    const url = clean(row?.avatar_url);
    const name = clean(row?.display_name) || "ARI User";
    return `<span class="${className}">${url ? `<img src="${escapeHtml(url)}" alt="" loading="lazy" />` : escapeHtml(initial(name))}</span>`;
  }

  function filteredConversations() {
    const q = state.query.toLowerCase();
    if (!q) return state.conversations;
    return state.conversations.filter((row) =>
      [row.display_name, row.handle, row.last_message_body]
        .some((value) => clean(value).toLowerCase().includes(q))
    );
  }

  function setInboxState({ loading = false, error = "" } = {}) {
    const status = $("inboxStatus");
    const empty = $("conversationEmpty");
    if (!status || !empty) return;
    if (loading) {
      status.textContent = "Loading conversations…";
      empty.hidden = true;
      return;
    }
    if (error) {
      status.innerHTML = `${escapeHtml(error)} <button type="button" id="messagesRetry">Retry</button>`;
      $("messagesRetry")?.addEventListener("click", () => loadInbox({ force: true }));
      empty.hidden = true;
      return;
    }
    status.textContent = "";
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
      status.textContent = "";
      empty.hidden = state.conversations.length > 0;
    }

    rows.forEach((row) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "circle-conversation";
      if (clean(row.conversation_id) === state.activeConversationId) button.classList.add("is-active");

      const unread = Number(row.unread_count) || 0;
      const preview = clean(row.last_message_body) || "New conversation";
      const presence = presenceStatus(row.other_user_id);
      button.innerHTML = `
        <span class="circle-conversation__avatar-wrap">
          ${avatarMarkup(row)}
          <span class="circle-conversation__presence-dot" data-status="${presence}" aria-label="${presence === "online" ? "Online" : "Offline"}"></span>
        </span>
        <span class="circle-conversation__copy">
          <strong>${escapeHtml(row.display_name || "ARI User")}</strong>
          <span class="${unread > 0 ? "is-unread" : ""}">${escapeHtml(preview)}</span>
        </span>
        <span class="circle-conversation__meta">
          <span>${escapeHtml(relativeTime(row.last_message_at))}</span>
          ${unread > 0 ? `<span class="circle-conversation__unread-count" aria-label="${unread} unread">${unread > 99 ? "99+" : unread}</span>` : ""}
        </span>`;
      button.addEventListener("click", () => openConversation(row));
      host.append(button);
    });
  }

  async function loadInbox({ force = false } = {}) {
    if (state.inboxBusy && !force) return;
    state.inboxBusy = true;
    if (!state.conversations.length) setInboxState({ loading: true });
    try {
      const rows = await rpc("ari_circle_messages_list", { result_limit: 100 });
      state.conversations = Array.isArray(rows) ? rows : [];
      renderInbox();
    } catch (error) {
      console.error("ARI Circle Messages V5 inbox failed:", error);
      setInboxState({ error: error.message || "Could not load conversations." });
    } finally {
      state.inboxBusy = false;
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
      } else avatar.textContent = initial(name);
    }
    if ($("threadName")) $("threadName").textContent = name;
    if ($("threadHandle")) $("threadHandle").textContent = handle ? `@${handle}` : "";
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
      row.innerHTML = `<div class="circle-message-bubble">${escapeHtml(msg.body || "")}<span class="circle-message-time">${escapeHtml(relativeTime(msg.created_at))}</span></div>`;
      host.append(row);
    });
    requestAnimationFrame(() => { host.scrollTop = host.scrollHeight; });
  }

  async function loadThread(conversationId) {
    if (!conversationId || state.threadBusy) return;
    state.threadBusy = true;
    try {
      const rows = await rpc("ari_circle_messages_thread", {
        requested_conversation_id: conversationId,
        result_limit: 250
      });
      renderThread(Array.isArray(rows) ? rows : []);
      await loadInbox({ force: true });
    } catch (error) {
      console.error("ARI Circle Messages V5 thread failed:", error);
      toast(error.message || "Could not open that conversation.");
    } finally {
      state.threadBusy = false;
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
    history.replaceState(null, "", `ari-circle-messages.html?user=${encodeURIComponent(otherUserId)}`);
    await loadThread(id);
  }

  function closeThread({ updateUrl = true } = {}) {
    state.activeConversationId = "";
    state.activeConversation = null;
    setComposerVisible(false);
    if ($("circleThread")) $("circleThread").hidden = true;
    $("messagesPage")?.classList.remove("has-thread");
    renderInbox();
    if (updateUrl) history.replaceState(null, "", "ari-circle-messages.html");
  }

  async function profileRowForDirectUser(userId, conversationId) {
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
  }

  async function openRequestedUser() {
    const params = new URLSearchParams(location.search);
    const userId = clean(params.get("user"));
    if (!userId || userId === clean(state.user?.id)) {
      closeThread({ updateUrl: false });
      return;
    }
    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", { requested_user_id: userId });
      await loadInbox({ force: true });
      let row = state.conversations.find((item) => clean(item.conversation_id) === clean(conversationId));
      if (!row) row = await profileRowForDirectUser(userId, conversationId);
      if (!row) throw new Error("Conversation unavailable.");
      await openConversation(row);
    } catch (error) {
      console.error("ARI Circle Messages V5 direct open failed:", error);
      closeThread({ updateUrl: false });
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
      console.error("ARI Circle Messages V5 send failed:", error);
      toast(error.message || "Message could not be sent.");
    } finally {
      state.busy = false;
      $("sendMessageButton").disabled = false;
    }
  }

  function ensureNewMessageDialog() {
    let dialog = $("newMessageDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "newMessageDialog";
    dialog.className = "ari-new-message-dialog";
    dialog.innerHTML = `
      <div class="ari-new-message-panel">
        <header><div><small>ARI CIRCLE</small><h2>New message</h2></div><button type="button" data-new-message-close aria-label="Close">×</button></header>
        <div class="ari-new-message-search"><input id="newMessageSearch" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search people" /><button id="newMessageSearchButton" type="button">Search</button></div>
        <p id="newMessageStatus">Search for someone to message.</p>
        <div id="newMessageResults" class="ari-new-message-results"></div>
      </div>`;
    document.body.append(dialog);
    dialog.querySelector("[data-new-message-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    $("newMessageSearchButton")?.addEventListener("click", searchPeopleForMessage);
    $("newMessageSearch")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); searchPeopleForMessage(); }
    });
    return dialog;
  }

  async function searchPeopleForMessage() {
    const query = clean($("newMessageSearch")?.value);
    const host = $("newMessageResults");
    const status = $("newMessageStatus");
    if (!host || !status) return;
    host.replaceChildren();
    status.textContent = query ? "Searching…" : "People you may know";
    try {
      const rows = await rpc("ari_circle_discover_people", {
        search_text: query || null,
        result_limit: 20
      });
      const people = (Array.isArray(rows) ? rows : []).filter((p) => clean(p.user_id || p.id) !== clean(state.user?.id));
      status.textContent = people.length ? `${people.length} result${people.length === 1 ? "" : "s"}` : "No people found.";
      people.forEach((person) => {
        const id = clean(person.user_id || person.id);
        if (!id) return;
        const name = clean(person.display_name || person.name) || "ARI User";
        const handle = clean(person.handle).replace(/^@+/, "");
        const row = document.createElement("button");
        row.type = "button";
        row.className = "ari-new-message-person";
        row.innerHTML = `${avatarMarkup(person, "ari-new-message-avatar")}<span><strong>${escapeHtml(name)}</strong><small>${handle ? `@${escapeHtml(handle)}` : "Message"}</small></span>`;
        row.addEventListener("click", () => {
          ensureNewMessageDialog().close();
          location.href = `ari-circle-messages.html?user=${encodeURIComponent(id)}`;
        });
        host.append(row);
      });
    } catch (error) {
      console.error("ARI Circle Messages V5 people search failed:", error);
      status.textContent = "Search is unavailable right now.";
    }
  }

  function openNewMessage() {
    const dialog = ensureNewMessageDialog();
    if (!dialog.open) dialog.showModal();
    setTimeout(() => $("newMessageSearch")?.focus(), 60);
    searchPeopleForMessage();
  }

  function injectV5Styles() {
    if ($("ariMessagesV5Style")) return;
    const style = document.createElement("style");
    style.id = "ariMessagesV5Style";
    style.textContent = `
      .circle-conversation__unread-count{min-width:21px;height:21px;padding:0 6px;border-radius:999px;display:inline-grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2458ff,#8454ff);font-size:11px;font-weight:800}
      .circle-conversation__copy .is-unread{font-weight:750;color:#18233c}
      #inboxStatus button{margin-left:8px;border:0;background:none;color:#2458ff;font:inherit;font-weight:800}
      .ari-new-message-dialog{width:min(calc(100vw - 24px),560px);max-height:78dvh;padding:0;border:0;border-radius:28px;background:transparent}
      .ari-new-message-dialog::backdrop{background:rgba(9,17,37,.28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .ari-new-message-panel{overflow:hidden;border:1px solid rgba(255,255,255,.95);border-radius:28px;background:#fbfcff;box-shadow:0 28px 90px rgba(18,33,72,.2)}
      .ari-new-message-panel header{display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid rgba(35,75,160,.08)}
      .ari-new-message-panel header small{color:#2458ff;font-weight:800;letter-spacing:.16em}.ari-new-message-panel h2{margin:4px 0 0;color:#0b1730;font-size:1.45rem}.ari-new-message-panel header button{width:42px;height:42px;border:1px solid rgba(35,75,160,.1);border-radius:50%;background:#fff;font-size:1.4rem}
      .ari-new-message-search{display:flex;gap:8px;padding:16px}.ari-new-message-search input{min-width:0;flex:1;height:48px;padding:0 15px;border:1px solid rgba(36,88,255,.13);border-radius:16px;background:#f4f7ff;font-size:16px}.ari-new-message-search button{padding:0 16px;border:0;border-radius:16px;color:#fff;background:linear-gradient(135deg,#2458ff,#8454ff);font-weight:800}
      #newMessageStatus{margin:0;padding:0 18px 10px;color:#7c879a;font-size:.78rem}.ari-new-message-results{max-height:52dvh;overflow:auto;padding:0 16px 18px}.ari-new-message-person{width:100%;display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;align-items:center;padding:11px 2px;border:0;border-bottom:1px solid rgba(35,75,160,.07);background:transparent;text-align:left}.ari-new-message-avatar{width:48px;height:48px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#edf3ff;color:#2458ff;font-weight:800}.ari-new-message-avatar img{width:100%;height:100%;object-fit:cover}.ari-new-message-person strong,.ari-new-message-person small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ari-new-message-person strong{color:#0b1730}.ari-new-message-person small{margin-top:3px;color:#7c879a}
      @media(max-width:520px){.ari-new-message-dialog{width:100%;max-height:82dvh;margin:auto 0 0}.ari-new-message-panel{border-radius:28px 28px 0 0}}
    `;
    document.head.append(style);
  }

  function updateViewport() {
    const viewport = window.visualViewport;
    const height = Math.max(320, Math.round(viewport?.height || innerHeight || 0));
    document.documentElement.style.setProperty("--ari-messages-viewport-height", `${height}px`);
    const composer = document.querySelector(".circle-thread__composer:not([hidden])");
    if (document.activeElement === $("messageInput")) requestAnimationFrame(() => composer?.scrollIntoView?.({ block: "nearest" }));
  }

  function syncPresenceState(channel) {
    const raw = channel?.presenceState?.() || {};
    const online = new Set();
    Object.entries(raw).forEach(([key, entries]) => {
      const fallbackId = clean(key).replace(/^user:/, "");
      const list = Array.isArray(entries) ? entries : [];
      list.forEach((entry) => {
        if (entry?.visible === false) return;
        const userId = clean(entry?.user_id) || fallbackId;
        if (userId && clean(entry?.status).toLowerCase() !== "offline") online.add(userId);
      });
    });
    state.onlineUserIds = online;
    renderInbox();
    syncThreadPresence();
  }

  function connectPresence() {
    if (!state.client || !state.user || state.presenceChannel) return;
    const channel = state.client.channel("ari-circle:presence", { config: { presence: { key: `user:${state.user.id}` } } });
    channel
      .on("presence", { event: "sync" }, () => syncPresenceState(channel))
      .on("presence", { event: "join" }, () => syncPresenceState(channel))
      .on("presence", { event: "leave" }, () => syncPresenceState(channel))
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        try { await channel.track({ user_id: state.user.id, status: "online", online_at: new Date().toISOString(), visible: true }); } catch {}
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

  function scheduleRefresh(delay = 100) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(async () => {
      await loadInbox({ force: true });
      if (state.activeConversationId) await loadThread(state.activeConversationId);
    }, delay);
  }

  function bind() {
    $("messageForm")?.addEventListener("submit", sendMessage);
    $("messageSearch")?.addEventListener("input", (event) => {
      state.query = clean(event.currentTarget.value);
      renderInbox();
    });
    $("messageInput")?.addEventListener("input", (event) => {
      const el = event.currentTarget;
      el.style.height = "auto";
      el.style.height = `${Math.min(130, el.scrollHeight)}px`;
      updateViewport();
    });
    $("messageInput")?.addEventListener("focus", () => setTimeout(updateViewport, 80));
    $("threadBack")?.addEventListener("click", (event) => {
      event.preventDefault();
      closeThread();
    });
    $("newMessageButton")?.addEventListener("click", (event) => {
      event.preventDefault();
      openNewMessage();
    });
    $("conversationEmptyAction")?.addEventListener("click", (event) => {
      event.preventDefault();
      openNewMessage();
    });
    window.addEventListener("focus", () => scheduleRefresh(120));
    window.addEventListener("pageshow", () => scheduleRefresh(120));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleRefresh(120); });
    window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
    window.visualViewport?.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport, { passive: true });
    window.addEventListener("pagehide", () => { disconnectPresence(); clearInterval(state.periodicTimer); }, { once: true });
  }

  async function init() {
    if (state.started) return;
    state.started = true;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) {
      $("messagesLoading").innerHTML = "<strong>Messages unavailable.</strong>";
      return;
    }
    try {
      await requireUser();
      if (!state.user) return;
      injectV5Styles();
      bind();
      updateViewport();
      await loadInbox({ force: true });
      $("messagesPage").hidden = false;
      $("messagesLoading").hidden = true;
      connectPresence();
      await openRequestedUser();
      state.periodicTimer = setInterval(() => {
        if (!document.hidden) scheduleRefresh(0);
      }, 15000);
    } catch (error) {
      console.error("ARI Circle Messages V5 failed to initialize:", error);
      $("messagesLoading").innerHTML = `<strong>${escapeHtml(error.message || "Messages unavailable.")}</strong>`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleMessagesV5 = Object.freeze({
    version: VERSION,
    refresh: () => scheduleRefresh(0),
    openNewMessage
  });
})();
