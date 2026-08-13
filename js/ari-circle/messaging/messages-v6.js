/* =============================================================
   ARI CIRCLE — MESSAGES V6
   Version: 6.0.0
   - One canonical inbox/thread controller
   - Hold own message -> ••• -> Edit/Delete
   - Edit only newest sent message while unread (server enforced)
   - Swipe conversation left -> Delete
   - Outside tap closes transient actions
   - Presence, search, new-message picker, iPhone viewport support
============================================================= */
(() => {
  "use strict";

  const VERSION = "6.0.0";
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();
  const escapeHtml = (v) => String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

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
    openSwipeId: "",
    holdTimer: 0,
    started: false
  };

  const relativeTime = (value) => {
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
  };

  const initial = (name) => clean(name)?.charAt(0).toUpperCase() || "A";
  const isOnline = (userId) => state.onlineUserIds.has(clean(userId));
  const presenceStatus = (userId) => isOnline(userId) ? "online" : "offline";

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
    if (!state.user) location.replace("signin.html");
    return state.user;
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
      [row.display_name, row.handle, row.last_message_body].some((v) => clean(v).toLowerCase().includes(q))
    );
  }

  function closeTransientActions() {
    state.openSwipeId = "";
    document.querySelectorAll(".ari-message-more,.ari-message-actions").forEach((el) => el.remove());
    document.querySelectorAll(".ari-swipe-row.is-open").forEach((el) => el.classList.remove("is-open"));
  }

  function setInboxState({ loading = false, error = "" } = {}) {
    const status = $("inboxStatus");
    const empty = $("conversationEmpty");
    if (!status || !empty) return;
    if (loading) { status.textContent = "Loading conversations…"; empty.hidden = true; return; }
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
    if (state.query && !rows.length) { empty.hidden = true; status.textContent = "No matching conversations."; }
    else { status.textContent = ""; empty.hidden = state.conversations.length > 0; }

    rows.forEach((row) => {
      const wrap = document.createElement("div");
      wrap.className = "ari-swipe-row";
      wrap.dataset.conversationId = clean(row.conversation_id);
      wrap.innerHTML = `<button class="ari-swipe-delete" type="button">Delete</button>`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "circle-conversation ari-swipe-content";
      const unread = Number(row.unread_count) || 0;
      const preview = clean(row.last_message_body) || "New conversation";
      const presence = presenceStatus(row.other_user_id);
      button.innerHTML = `
        <span class="circle-conversation__avatar-wrap">${avatarMarkup(row)}<span class="circle-conversation__presence-dot" data-status="${presence}"></span></span>
        <span class="circle-conversation__copy"><strong>${escapeHtml(row.display_name || "ARI User")}</strong><span class="${unread > 0 ? "is-unread" : ""}">${escapeHtml(preview)}</span></span>
        <span class="circle-conversation__meta"><span>${escapeHtml(relativeTime(row.last_message_at))}</span>${unread > 0 ? `<span class="circle-conversation__unread-count">${unread > 99 ? "99+" : unread}</span>` : ""}</span>`;

      let startX = 0, currentX = 0, dragging = false;
      button.addEventListener("pointerdown", (e) => { startX = e.clientX; currentX = startX; dragging = false; });
      button.addEventListener("pointermove", (e) => {
        currentX = e.clientX;
        if (Math.abs(currentX - startX) > 8) dragging = true;
      });
      button.addEventListener("pointerup", () => {
        const delta = currentX - startX;
        if (delta < -45) {
          closeTransientActions();
          state.openSwipeId = clean(row.conversation_id);
          wrap.classList.add("is-open");
          return;
        }
        if (delta > 35) { closeTransientActions(); return; }
        if (!dragging && !wrap.classList.contains("is-open")) openConversation(row);
      });

      wrap.querySelector(".ari-swipe-delete")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete conversation with ${row.display_name || "this user"}?`)) return;
        try {
          await rpc("ari_circle_messages_hide_conversation", { requested_conversation_id: row.conversation_id });
          state.conversations = state.conversations.filter((x) => clean(x.conversation_id) !== clean(row.conversation_id));
          renderInbox();
          toast("Conversation deleted.");
        } catch (error) { toast(error.message || "Could not delete conversation."); }
      });

      wrap.append(button);
      host.append(wrap);
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
      console.error("ARI Messages V6 inbox failed", error);
      setInboxState({ error: error.message || "Could not load conversations." });
    } finally { state.inboxBusy = false; }
  }

  function syncThreadPresence() {
    const status = presenceStatus(state.activeConversation?.other_user_id);
    const dot = $("threadPresenceDot");
    const text = $("threadPresenceText");
    if (dot) { dot.dataset.status = status; dot.setAttribute("aria-label", status === "online" ? "Online" : "Offline"); }
    if (text) { text.dataset.status = status; text.textContent = status === "online" ? "Online" : "Offline"; }
  }

  function setThreadIdentity(row) {
    const name = clean(row?.display_name) || "ARI User";
    const handle = clean(row?.handle).replace(/^@+/, "");
    const avatar = $("threadAvatar");
    if (avatar) {
      avatar.replaceChildren();
      const url = clean(row?.avatar_url);
      if (url) { const img = document.createElement("img"); img.src = url; img.alt = ""; avatar.append(img); }
      else avatar.textContent = initial(name);
    }
    $("threadName") && ($("threadName").textContent = name);
    $("threadHandle") && ($("threadHandle").textContent = handle ? `@${handle}` : "");
    const link = $("threadProfileLink");
    if (link && row?.other_user_id) link.href = `ari-circle.html?user=${encodeURIComponent(row.other_user_id)}`;
    syncThreadPresence();
  }

  function setComposerVisible(visible) { const form = $("messageForm"); if (form) form.hidden = !visible; }

  function showMessageMore(rowEl, msg) {
    closeTransientActions();
    const more = document.createElement("button");
    more.type = "button";
    more.className = "ari-message-more";
    more.textContent = "•••";
    more.setAttribute("aria-label", "Message options");
    more.addEventListener("click", (e) => { e.stopPropagation(); showMessageActions(rowEl, msg, more); });
    rowEl.append(more);
  }

  function showMessageActions(rowEl, msg, anchor) {
    document.querySelectorAll(".ari-message-actions").forEach((el) => el.remove());
    const menu = document.createElement("div");
    menu.className = "ari-message-actions";
    if (msg.can_edit) {
      const edit = document.createElement("button");
      edit.type = "button"; edit.textContent = "Edit";
      edit.addEventListener("click", async (e) => {
        e.stopPropagation();
        const next = prompt("Edit message", clean(msg.body));
        if (next === null || !clean(next) || clean(next) === clean(msg.body)) return;
        try {
          await rpc("ari_circle_messages_edit", { requested_message_id: msg.message_id, requested_body: clean(next) });
          await loadThread(state.activeConversationId);
          toast("Message edited.");
        } catch (error) { toast(error.message || "Could not edit message."); }
      });
      menu.append(edit);
    }
    const del = document.createElement("button");
    del.type = "button"; del.textContent = "Delete"; del.className = "is-danger";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this message?")) return;
      try {
        await rpc("ari_circle_messages_delete", { requested_message_id: msg.message_id });
        await loadThread(state.activeConversationId);
        toast("Message deleted.");
      } catch (error) { toast(error.message || "Could not delete message."); }
    });
    menu.append(del);
    rowEl.append(menu);
    anchor.classList.add("is-active");
  }

  function bindLongPress(rowEl, msg) {
    if (clean(msg.sender_user_id) !== clean(state.user?.id) || msg.deleted_at) return;
    const bubble = rowEl.querySelector(".circle-message-bubble");
    if (!bubble) return;
    const clear = () => clearTimeout(state.holdTimer);
    bubble.addEventListener("pointerdown", () => { clear(); state.holdTimer = setTimeout(() => showMessageMore(rowEl, msg), 430); });
    bubble.addEventListener("pointerup", clear);
    bubble.addEventListener("pointercancel", clear);
    bubble.addEventListener("pointermove", clear);
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
      row.className = `circle-message-row${mine ? " is-mine" : ""}${msg.deleted_at ? " is-deleted" : ""}`;
      row.dataset.messageId = clean(msg.message_id);
      row.innerHTML = `<div class="circle-message-bubble">${escapeHtml(msg.body || "")}<span class="circle-message-time">${escapeHtml(relativeTime(msg.created_at))}${msg.edited_at ? " · Edited" : ""}</span></div>`;
      bindLongPress(row, msg);
      host.append(row);
    });
    requestAnimationFrame(() => { host.scrollTop = host.scrollHeight; });
  }

  async function loadThread(conversationId) {
    if (!conversationId || state.threadBusy) return;
    state.threadBusy = true;
    try {
      const rows = await rpc("ari_circle_messages_thread", { requested_conversation_id: conversationId, result_limit: 250 });
      renderThread(Array.isArray(rows) ? rows : []);
      await loadInbox({ force: true });
    } catch (error) { toast(error.message || "Could not open conversation."); }
    finally { state.threadBusy = false; }
  }

  async function openConversation(row) {
    const id = clean(row?.conversation_id), otherUserId = clean(row?.other_user_id);
    if (!id || !otherUserId) return;
    closeTransientActions();
    state.activeConversationId = id;
    state.activeConversation = row;
    setThreadIdentity(row);
    setComposerVisible(true);
    $("circleThread").hidden = false;
    $("messagesPage").classList.add("has-thread");
    history.replaceState(null, "", `ari-circle-messages.html?user=${encodeURIComponent(otherUserId)}`);
    await loadThread(id);
  }

  function closeThread({ updateUrl = true } = {}) {
    closeTransientActions();
    state.activeConversationId = "";
    state.activeConversation = null;
    setComposerVisible(false);
    if ($("circleThread")) $("circleThread").hidden = true;
    $("messagesPage")?.classList.remove("has-thread");
    renderInbox();
    if (updateUrl) history.replaceState(null, "", "ari-circle-messages.html");
  }

  async function profileRowForDirectUser(userId, conversationId) {
    const { data, error } = await state.client.from("ari_circle_profiles").select("user_id, display_name, handle, avatar_url").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data?.user_id) return null;
    return { conversation_id: conversationId, other_user_id: data.user_id, display_name: data.display_name || "ARI User", handle: data.handle || "", avatar_url: data.avatar_url || "", unread_count: 0, last_message_body: "", last_message_at: null };
  }

  async function openRequestedUser() {
    const userId = clean(new URLSearchParams(location.search).get("user"));
    if (!userId || userId === clean(state.user?.id)) { closeThread({ updateUrl: false }); return; }
    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", { requested_user_id: userId });
      await loadInbox({ force: true });
      let row = state.conversations.find((item) => clean(item.conversation_id) === clean(conversationId));
      if (!row) row = await profileRowForDirectUser(userId, conversationId);
      if (!row) throw new Error("Conversation unavailable.");
      await openConversation(row);
    } catch (error) { closeThread({ updateUrl: false }); toast(error.message || "Could not open conversation."); }
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
      await rpc("ari_circle_messages_send", { requested_conversation_id: state.activeConversationId, requested_body: body });
      input.value = ""; input.style.height = "auto";
      await loadThread(state.activeConversationId);
    } catch (error) { toast(error.message || "Message could not be sent."); }
    finally { state.busy = false; $("sendMessageButton").disabled = false; }
  }

  function ensureNewMessageDialog() {
    let dialog = $("newMessageDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "newMessageDialog";
    dialog.className = "ari-new-message-dialog";
    dialog.innerHTML = `<div class="ari-new-message-panel"><header><div><small>ARI CIRCLE</small><h2>New message</h2></div><button type="button" data-new-message-close>×</button></header><div class="ari-new-message-search"><input id="newMessageSearch" type="search" placeholder="Search people"/><button id="newMessageSearchButton" type="button">Search</button></div><p id="newMessageStatus">Search for someone to message.</p><div id="newMessageResults" class="ari-new-message-results"></div></div>`;
    document.body.append(dialog);
    dialog.querySelector("[data-new-message-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    $("newMessageSearchButton")?.addEventListener("click", searchPeopleForMessage);
    $("newMessageSearch")?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); searchPeopleForMessage(); } });
    return dialog;
  }

  async function searchPeopleForMessage() {
    const query = clean($("newMessageSearch")?.value), host = $("newMessageResults"), status = $("newMessageStatus");
    if (!host || !status) return;
    host.replaceChildren(); status.textContent = query ? "Searching…" : "People you may know";
    try {
      const rows = await rpc("ari_circle_discover_people", { search_text: query || null, result_limit: 20 });
      const people = (Array.isArray(rows) ? rows : []).filter((p) => clean(p.user_id || p.id) !== clean(state.user?.id));
      status.textContent = people.length ? `${people.length} result${people.length === 1 ? "" : "s"}` : "No people found.";
      people.forEach((person) => {
        const id = clean(person.user_id || person.id); if (!id) return;
        const name = clean(person.display_name || person.name) || "ARI User", handle = clean(person.handle).replace(/^@+/, "");
        const row = document.createElement("button"); row.type = "button"; row.className = "ari-new-message-person";
        row.innerHTML = `${avatarMarkup(person, "ari-new-message-avatar")}<span><strong>${escapeHtml(name)}</strong><small>${handle ? `@${escapeHtml(handle)}` : "Message"}</small></span>`;
        row.addEventListener("click", () => { ensureNewMessageDialog().close(); location.href = `ari-circle-messages.html?user=${encodeURIComponent(id)}`; });
        host.append(row);
      });
    } catch { status.textContent = "Search is unavailable right now."; }
  }

  function openNewMessage() { const dialog = ensureNewMessageDialog(); if (!dialog.open) dialog.showModal(); setTimeout(() => $("newMessageSearch")?.focus(), 60); searchPeopleForMessage(); }

  function injectStyles() {
    const style = document.createElement("style"); style.id = "ariMessagesV6Style";
    style.textContent = `
      .circle-conversation__unread-count{min-width:21px;height:21px;padding:0 6px;border-radius:999px;display:inline-grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2458ff,#8454ff);font-size:11px;font-weight:800}.circle-conversation__copy .is-unread{font-weight:750;color:#18233c}
      .ari-swipe-row{position:relative;overflow:hidden;border-radius:22px}.ari-swipe-delete{position:absolute;inset:0 0 0 auto;width:92px;border:0;background:#e5484d;color:#fff;font-weight:800;font-size:16px}.ari-swipe-content{position:relative;z-index:1;transition:transform .18s ease;background:#fff}.ari-swipe-row.is-open .ari-swipe-content{transform:translateX(-92px)}
      .circle-message-row{position:relative}.ari-message-more{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:34px;border:1px solid rgba(24,48,100,.12);border-radius:17px;background:#fff;color:#17223b;font-weight:900;box-shadow:0 8px 25px rgba(27,43,83,.12)}.circle-message-row.is-mine .ari-message-more{right:calc(100% + 8px)}.circle-message-row:not(.is-mine) .ari-message-more{left:calc(100% + 8px)}
      .ari-message-actions{position:absolute;z-index:20;top:calc(100% + 6px);right:0;min-width:135px;padding:6px;border:1px solid rgba(24,48,100,.10);border-radius:16px;background:#fff;box-shadow:0 16px 50px rgba(19,31,68,.18)}.ari-message-actions button{width:100%;padding:11px 12px;border:0;border-radius:11px;background:transparent;text-align:left;font-weight:750}.ari-message-actions button:active{background:#f2f5fb}.ari-message-actions .is-danger{color:#d83b42}.circle-message-row.is-deleted .circle-message-bubble{opacity:.58;font-style:italic}.circle-message-time{display:block;margin-top:5px}
      .ari-new-message-dialog{width:min(calc(100vw - 24px),560px);max-height:78dvh;padding:0;border:0;border-radius:28px;background:transparent}.ari-new-message-dialog::backdrop{background:rgba(9,17,37,.28);backdrop-filter:blur(8px)}.ari-new-message-panel{overflow:hidden;border-radius:28px;background:#fbfcff;box-shadow:0 28px 90px rgba(18,33,72,.2)}.ari-new-message-panel header{display:flex;justify-content:space-between;align-items:center;padding:20px}.ari-new-message-panel header button{width:42px;height:42px;border:0;border-radius:50%;background:#fff;font-size:1.4rem}.ari-new-message-search{display:flex;gap:8px;padding:16px}.ari-new-message-search input{flex:1;min-width:0;height:48px;padding:0 15px;border:1px solid rgba(36,88,255,.13);border-radius:16px;background:#f4f7ff;font-size:16px}.ari-new-message-search button{padding:0 16px;border:0;border-radius:16px;color:#fff;background:linear-gradient(135deg,#2458ff,#8454ff);font-weight:800}#newMessageStatus{padding:0 18px 10px;color:#7c879a}.ari-new-message-results{max-height:52dvh;overflow:auto;padding:0 16px 18px}.ari-new-message-person{width:100%;display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center;padding:11px 2px;border:0;border-bottom:1px solid rgba(35,75,160,.07);background:transparent;text-align:left}.ari-new-message-avatar{width:48px;height:48px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#edf3ff;color:#2458ff;font-weight:800}.ari-new-message-avatar img{width:100%;height:100%;object-fit:cover}.ari-new-message-person strong,.ari-new-message-person small{display:block}.ari-new-message-person small{margin-top:3px;color:#7c879a}
      @media(max-width:520px){.ari-new-message-dialog{width:100%;max-height:82dvh;margin:auto 0 0}.ari-new-message-panel{border-radius:28px 28px 0 0}}
    `;
    document.head.append(style);
  }

  function updateViewport() {
    const viewport = window.visualViewport;
    const height = Math.max(320, Math.round(viewport?.height || innerHeight || 0));
    document.documentElement.style.setProperty("--ari-messages-viewport-height", `${height}px`);
  }

  function syncPresenceState(channel) {
    const raw = channel?.presenceState?.() || {}, online = new Set();
    Object.entries(raw).forEach(([key, entries]) => (Array.isArray(entries) ? entries : []).forEach((entry) => {
      if (entry?.visible === false) return; const id = clean(entry?.user_id) || clean(key).replace(/^user:/, ""); if (id && clean(entry?.status).toLowerCase() !== "offline") online.add(id);
    }));
    state.onlineUserIds = online; renderInbox(); syncThreadPresence();
  }

  function connectPresence() {
    if (!state.client || !state.user || state.presenceChannel) return;
    const channel = state.client.channel("ari-circle:presence", { config: { presence: { key: `user:${state.user.id}` } } });
    channel.on("presence", { event: "sync" }, () => syncPresenceState(channel)).on("presence", { event: "join" }, () => syncPresenceState(channel)).on("presence", { event: "leave" }, () => syncPresenceState(channel)).subscribe(async (status) => { if (status === "SUBSCRIBED") try { await channel.track({ user_id: state.user.id, status: "online", visible: true }); } catch {} });
    state.presenceChannel = channel;
  }

  function scheduleRefresh(delay = 100) { clearTimeout(state.refreshTimer); state.refreshTimer = setTimeout(async () => { await loadInbox({ force: true }); if (state.activeConversationId) await loadThread(state.activeConversationId); }, delay); }

  function bind() {
    $("messageForm")?.addEventListener("submit", sendMessage);
    $("messageSearch")?.addEventListener("input", (e) => { state.query = clean(e.currentTarget.value); renderInbox(); });
    $("messageInput")?.addEventListener("input", (e) => { const el=e.currentTarget; el.style.height="auto"; el.style.height=`${Math.min(130,el.scrollHeight)}px`; updateViewport(); });
    $("threadBack")?.addEventListener("click", (e) => { e.preventDefault(); closeThread(); });
    $("newMessageButton")?.addEventListener("click", (e) => { e.preventDefault(); openNewMessage(); });
    $("conversationEmptyAction")?.addEventListener("click", (e) => { e.preventDefault(); openNewMessage(); });
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".ari-message-actions,.ari-message-more,.ari-swipe-row")) closeTransientActions(); });
    window.addEventListener("focus", () => scheduleRefresh(120));
    window.addEventListener("pageshow", () => scheduleRefresh(120));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleRefresh(120); });
    window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport, { passive: true });
  }

  async function init() {
    if (state.started) return; state.started = true;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) { $("messagesLoading").innerHTML = "<strong>Messages unavailable.</strong>"; return; }
    try {
      await requireUser(); if (!state.user) return;
      injectStyles(); bind(); updateViewport(); await loadInbox({ force: true });
      $("messagesPage").hidden = false; $("messagesLoading").hidden = true;
      connectPresence(); await openRequestedUser();
      state.periodicTimer = setInterval(() => { if (!document.hidden) scheduleRefresh(0); }, 15000);
    } catch (error) { console.error("ARI Messages V6 init failed", error); $("messagesLoading").innerHTML = `<strong>${escapeHtml(error.message || "Messages unavailable.")}</strong>`; }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.AriCircleMessagesV6 = Object.freeze({ version: VERSION, refresh: () => scheduleRefresh(0), closeThread });
})();
