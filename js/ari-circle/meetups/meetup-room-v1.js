/* =============================================================
   ARI CIRCLE — MEETUP ROOM V1
   Private room for joined attendees and the host/POC.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.1";
  const $ = (id) => document.getElementById(id);
  const TIER = Object.freeze({
    new_host: "New Host", organizer: "Organizer", active_host: "Active Host",
    community_leader: "Community Leader", community_builder: "Community Builder"
  });

  const state = {
    client: null,
    user: null,
    meetupId: "",
    room: null,
    busy: false,
    firstMessageLoad: true,
    messageTimer: 0,
    roomTimer: 0,
    toastTimer: 0
  };

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function getClient() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  async function waitForClient(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const client = getClient();
      if (client?.auth && client?.rpc) return client;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("ARI Circle could not connect right now.");
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

  function showToast(message, duration = 3000) {
    const toast = $("meetupRoomToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = clean(message);
    toast.hidden = false;
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
  }

  function dateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time TBD";
    return date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function shortTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function avatarMarkup(url, name) {
    const safeUrl = clean(url);
    const initial = clean(name).charAt(0).toUpperCase() || "A";
    return safeUrl ? `<img src="${escapeHtml(safeUrl)}" alt="" loading="lazy" />` : escapeHtml(initial);
  }

  function titleCaseStatus(status) {
    const value = clean(status).toLowerCase();
    if (value === "completed") return "Completed";
    if (value === "cancelled") return "Cancelled";
    return "Scheduled";
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    [$("saveMeetingPoint"), $("meetupRoomSend")].forEach((button) => {
      if (button) button.disabled = state.busy;
    });
  }

  async function loadRoom({ silent = false } = {}) {
    if (!silent) $("meetupRoomLoading").textContent = "Opening meetup room…";
    const room = await rpc("ari_circle_get_meetup_room", { requested_meetup_id: state.meetupId });
    if (!room?.meetup_id) throw new Error("Meetup room unavailable.");
    state.room = room;
    renderRoom();
  }

  function renderRoom() {
    const room = state.room;
    const attendees = Array.isArray(room?.attendees) ? room.attendees : [];
    $("meetupRoomTitle").textContent = room.title || "Meetup";
    $("meetupRoomStatusBadge").textContent = titleCaseStatus(room.status);
    $("meetupRoomTime").textContent = `◷ ${dateTime(room.starts_at)}`;
    $("meetupRoomArea").textContent = `📍 ${room.area || "Area TBD"}`;
    $("meetupRoomCount").textContent = `👥 ${attendees.length} going`;

    const description = clean(room.description);
    $("meetupRoomDescription").hidden = !description;
    $("meetupRoomDescription").textContent = description;

    renderMeetingPoint();
    renderHost();
    renderAttendees(attendees);
    syncChatState();

    const archiveAt = new Date(room.room_archives_at);
    $("meetupRoomArchiveNote").textContent = Number.isNaN(archiveAt.getTime())
      ? ""
      : `This room becomes archived after ${archiveAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`;

    const page = $("meetupRoomPage");
    const loader = $("meetupRoomLoading");
    const firstReveal = page.hidden;
    loader.hidden = true;
    page.hidden = false;
    if (firstReveal) requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  function renderMeetingPoint() {
    const room = state.room;
    const point = clean(room.meeting_point);
    const value = $("meetingPointValue");
    value.textContent = point || "The host has not shared the exact meeting point yet.";
    $("copyMeetingPoint").hidden = !point;

    const form = $("meetingPointForm");
    form.hidden = !room.viewer_is_host;
    if (room.viewer_is_host) {
      const input = $("meetingPointInput");
      if (document.activeElement !== input) input.value = point;
    }
  }

  function renderHost() {
    const room = state.room;
    const name = clean(room.host_display_name) || "ARI User";
    const handle = clean(room.host_handle).replace(/^@+/, "");
    const tier = TIER[room.host_leadership_tier] || "Host";
    const avatar = $("meetupHostProfile");
    avatar.href = `ari-circle.html?user=${encodeURIComponent(room.host_user_id)}`;
    avatar.innerHTML = avatarMarkup(room.host_avatar_url, name);
    $("meetupHostName").textContent = name;
    $("meetupHostMeta").textContent = `${handle ? `@${handle} · ` : ""}${tier} · HOST · POC`;

    const message = $("messageMeetupHost");
    message.hidden = Boolean(room.viewer_is_host);
    message.href = `ari-circle-messages.html?user=${encodeURIComponent(room.host_user_id)}`;
  }

  function renderAttendees(attendees) {
    const host = $("meetupAttendeeList");
    host.replaceChildren();
    $("goingCount").textContent = String(attendees.length);

    attendees.forEach((person) => {
      const row = document.createElement("div");
      row.className = "meetup-room-attendee";
      const name = clean(person.display_name) || "ARI User";
      const handle = clean(person.handle).replace(/^@+/, "");
      const verified = Number(person.verified_meetups) || 0;
      const role = clean(person.role) === "host" ? "HOST · POC" : "GOING";
      const tier = TIER[person.leadership_tier] || "Member";
      row.innerHTML = `
        <a class="meetup-room-attendee__avatar" href="ari-circle.html?user=${encodeURIComponent(person.user_id)}">${avatarMarkup(person.avatar_url, name)}</a>
        <div class="meetup-room-attendee__copy">
          <strong>${escapeHtml(name)}</strong>
          <span>${handle ? `@${escapeHtml(handle)} · ` : ""}${escapeHtml(tier)} · ${verified} verified meetup${verified === 1 ? "" : "s"}</span>
        </div>
        <span class="meetup-room-attendee__role">${escapeHtml(role)}</span>`;
      host.append(row);
    });
  }

  function syncChatState() {
    const open = Boolean(state.room?.chat_open);
    $("meetupChatState").textContent = open ? "Live" : "Read-only";
    $("meetupRoomMessageForm").hidden = !open;
    $("meetupRoomReadonly").hidden = open;
  }

  async function loadMessages({ silent = false } = {}) {
    try {
      const rows = await rpc("ari_circle_list_meetup_messages", {
        requested_meetup_id: state.meetupId,
        result_limit: 120
      });
      renderMessages(Array.isArray(rows) ? rows : []);
    } catch (error) {
      if (!silent) showToast(error.message || "Could not load meetup chat.");
    }
  }

  function renderMessages(rows) {
    const host = $("meetupRoomMessages");
    const wasNearBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 90;
    host.replaceChildren();
    $("meetupChatEmpty").hidden = rows.length > 0;

    rows.forEach((message) => {
      const item = document.createElement("div");
      item.className = `meetup-room-message${message.viewer_is_sender ? " is-mine" : ""}`;
      const name = clean(message.display_name) || "ARI User";
      const role = clean(message.member_role) === "host" ? " · Host" : "";
      item.innerHTML = `
        <div class="meetup-room-message__avatar">${avatarMarkup(message.avatar_url, name)}</div>
        <div class="meetup-room-message__stack">
          ${message.viewer_is_sender ? "" : `<p class="meetup-room-message__name">${escapeHtml(name)}${escapeHtml(role)}</p>`}
          <div class="meetup-room-message__bubble">${escapeHtml(message.body)}</div>
          <span class="meetup-room-message__time">${escapeHtml(shortTime(message.created_at))}</span>
        </div>`;
      host.append(item);
    });

    if (state.firstMessageLoad || wasNearBottom) host.scrollTop = host.scrollHeight;
    state.firstMessageLoad = false;
  }

  async function saveMeetingPoint(event) {
    event.preventDefault();
    if (state.busy || !state.room?.viewer_is_host) return;
    setBusy(true);
    try {
      await rpc("ari_circle_set_meetup_point", {
        requested_meetup_id: state.meetupId,
        requested_meeting_point: clean($("meetingPointInput").value) || null
      });
      await loadRoom({ silent: true });
      showToast("Meeting point updated for joined attendees.");
    } catch (error) {
      showToast(error.message || "Could not update the meeting point.", 4200);
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (state.busy || !state.room?.chat_open) return;
    const input = $("meetupRoomMessageInput");
    const body = clean(input.value);
    if (!body) return;
    setBusy(true);
    try {
      await rpc("ari_circle_send_meetup_message", {
        requested_meetup_id: state.meetupId,
        requested_body: body
      });
      input.value = "";
      input.style.height = "auto";
      await loadMessages({ silent: true });
    } catch (error) {
      showToast(error.message || "Message could not be sent.", 4200);
    } finally {
      setBusy(false);
    }
  }

  async function copyMeetingPoint() {
    const point = clean(state.room?.meeting_point);
    if (!point) return;
    try {
      await navigator.clipboard.writeText(point);
      showToast("Meeting point copied.");
    } catch {
      showToast(point, 5000);
    }
  }

  function bind() {
    $("meetingPointForm")?.addEventListener("submit", saveMeetingPoint);
    $("meetupRoomMessageForm")?.addEventListener("submit", sendMessage);
    $("copyMeetingPoint")?.addEventListener("click", copyMeetingPoint);
    $("meetupRoomMessageInput")?.addEventListener("input", (event) => {
      const input = event.currentTarget;
      input.style.height = "auto";
      input.style.height = `${Math.min(116, input.scrollHeight)}px`;
    });
    window.addEventListener("focus", () => refreshAll());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshAll(); });
  }

  async function refreshAll() {
    if (!state.client || !state.meetupId || document.hidden) return;
    try {
      await Promise.all([loadRoom({ silent: true }), loadMessages({ silent: true })]);
    } catch {}
  }

  function startPolling() {
    clearInterval(state.messageTimer);
    clearInterval(state.roomTimer);
    state.messageTimer = setInterval(() => { if (!document.hidden) loadMessages({ silent: true }); }, 8000);
    state.roomTimer = setInterval(() => { if (!document.hidden) loadRoom({ silent: true }).catch(() => {}); }, 20000);
  }

  async function init() {
    try {
      state.meetupId = clean(new URLSearchParams(location.search).get("meetup"));
      if (!state.meetupId) throw new Error("No meetup was selected.");
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      await loadRoom();
      await loadMessages({ silent: true });
      startPolling();
      window.AriCircleV5RealWorld?.refresh?.();
    } catch (error) {
      console.error("Meetup Room V1 init failed:", error);
      $("meetupRoomLoading").innerHTML = `<strong>${escapeHtml(error.message || "Meetup room unavailable.")}</strong><br><a href="ari-circle-meetup.html">Back to Meet Up</a>`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleMeetupRoomV1 = Object.freeze({ version: VERSION, refresh: refreshAll });
})();
