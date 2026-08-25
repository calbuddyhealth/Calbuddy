/* =============================================================
   ARI CIRCLE — MEETUP ROOM V1.1
   Compact private coordination room for joined attendees.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
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
    pointEditorOpen: false,
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
    return date.toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
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

  function countdownText(room) {
    if (clean(room?.status).toLowerCase() !== "scheduled") return "";
    const starts = new Date(room?.starts_at);
    if (Number.isNaN(starts.getTime())) return "";
    const ends = new Date(room?.ends_at);
    const now = Date.now();
    const startMs = starts.getTime();

    if (!Number.isNaN(ends.getTime()) && now >= startMs && now <= ends.getTime()) return "Happening now";
    if (now >= startMs) return "";

    const totalMinutes = Math.max(1, Math.round((startMs - now) / 60000));
    if (totalMinutes >= 1440) {
      const days = Math.ceil(totalMinutes / 1440);
      return `Starts in ${days} day${days === 1 ? "" : "s"}`;
    }
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `Starts in ${hours}h${minutes ? ` ${minutes}m` : ""}`;
    }
    return `Starts in ${totalMinutes}m`;
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    [$("saveMeetingPoint"), $("meetupRoomSend"), ...document.querySelectorAll("[data-meetup-quick-message]")].forEach((button) => {
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
    const people = normalizePeople(attendees);

    $("meetupRoomTitle").textContent = room.title || "Meetup";
    $("meetupRoomStatusBadge").textContent = titleCaseStatus(room.status);
    $("meetupRoomTime").textContent = `◷ ${dateTime(room.starts_at)}`;
    $("meetupRoomArea").textContent = `📍 ${room.area || "Area TBD"}`;
    $("meetupRoomCount").textContent = `👥 ${people.length} going`;

    const countdown = countdownText(room);
    $("meetupRoomCountdown").hidden = !countdown;
    $("meetupRoomCountdown").textContent = countdown;

    const description = clean(room.description);
    $("meetupRoomDescription").hidden = !description;
    $("meetupRoomDescription").textContent = description;

    renderMeetingPoint();
    renderPeople(people);
    syncChatState();

    const archiveAt = new Date(room.room_archives_at);
    $("meetupRoomArchiveNote").textContent = Number.isNaN(archiveAt.getTime())
      ? ""
      : `Chat available until ${archiveAt.toLocaleString(undefined, {
          month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
        })}`;

    const page = $("meetupRoomPage");
    const loader = $("meetupRoomLoading");
    const firstReveal = page.hidden;
    loader.hidden = true;
    page.hidden = false;
    if (firstReveal) requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  function normalizePeople(attendees) {
    const room = state.room || {};
    const people = [];
    const seen = new Set();

    attendees.forEach((person) => {
      const id = clean(person?.user_id);
      if (!id || seen.has(id)) return;
      seen.add(id);
      people.push(person);
    });

    const hostId = clean(room.host_user_id);
    if (hostId && !seen.has(hostId)) {
      people.unshift({
        user_id: hostId,
        display_name: room.host_display_name,
        handle: room.host_handle,
        avatar_url: room.host_avatar_url,
        leadership_tier: room.host_leadership_tier,
        verified_meetups: room.host_verified_meetups || 0,
        role: "host"
      });
    }

    people.sort((a, b) => {
      const aHost = clean(a?.user_id) === hostId || clean(a?.role) === "host";
      const bHost = clean(b?.user_id) === hostId || clean(b?.role) === "host";
      return Number(bHost) - Number(aHost);
    });

    return people;
  }

  function renderMeetingPoint() {
    const room = state.room;
    const point = clean(room.meeting_point);
    const value = $("meetingPointValue");
    value.textContent = point || (room.viewer_is_host ? "Not set yet" : "Host hasn’t set this yet.");

    $("copyMeetingPoint").hidden = !point;

    const edit = $("editMeetingPoint");
    edit.hidden = !room.viewer_is_host;
    edit.textContent = point ? "Edit" : "Set";
    edit.setAttribute("aria-expanded", String(Boolean(room.viewer_is_host && state.pointEditorOpen)));

    const form = $("meetingPointForm");
    form.hidden = !(room.viewer_is_host && state.pointEditorOpen);
    if (room.viewer_is_host) {
      const input = $("meetingPointInput");
      if (document.activeElement !== input) input.value = point;
    }
  }

  function toggleMeetingPointEditor(open) {
    if (!state.room?.viewer_is_host) return;
    state.pointEditorOpen = Boolean(open);
    renderMeetingPoint();
    if (state.pointEditorOpen) {
      requestAnimationFrame(() => {
        const input = $("meetingPointInput");
        input?.focus({ preventScroll: true });
        input?.select();
      });
    }
  }

  function renderPeople(people) {
    const host = $("meetupAttendeeList");
    host.replaceChildren();
    const hostId = clean(state.room?.host_user_id);

    people.forEach((person) => {
      const row = document.createElement("div");
      row.className = "meetup-room-attendee";

      const id = clean(person.user_id);
      const name = clean(person.display_name) || "ARI User";
      const handle = clean(person.handle).replace(/^@+/, "");
      const verified = Number(person.verified_meetups) || 0;
      const isHost = id === hostId || clean(person.role) === "host";
      const tier = TIER[person.leadership_tier] || (isHost ? "Host" : "Member");
      const verifiedLabel = `${verified} verified meetup${verified === 1 ? "" : "s"}`;

      const hostActions = isHost
        ? `<div class="meetup-room-attendee__actions">
            <span class="meetup-room-attendee__role">HOST</span>
            ${state.room.viewer_is_host ? "" : `<a class="circle-v5-button meetup-room-attendee__message" href="ari-circle-messages.html?user=${encodeURIComponent(id)}">Message</a>`}
          </div>`
        : "";

      row.innerHTML = `
        <a class="meetup-room-attendee__avatar" href="ari-circle.html?user=${encodeURIComponent(id)}">${avatarMarkup(person.avatar_url, name)}</a>
        <div class="meetup-room-attendee__copy">
          <strong>${escapeHtml(name)}</strong>
          <span>${handle ? `@${escapeHtml(handle)} · ` : ""}${escapeHtml(tier)} · ${escapeHtml(verifiedLabel)}</span>
        </div>
        ${hostActions}`;
      host.append(row);
    });
  }

  function syncChatState() {
    const open = Boolean(state.room?.chat_open);
    $("meetupChatState").textContent = open ? "Live" : "Read-only";
    $("meetupRoomMessageForm").hidden = !open;
    $("meetupRoomQuickActions").hidden = !open;
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
      state.pointEditorOpen = false;
      await loadRoom({ silent: true });
      showToast("Meeting point updated.");
    } catch (error) {
      showToast(error.message || "Could not update the meeting point.", 4200);
    } finally {
      setBusy(false);
    }
  }

  async function postMessage(body, { clearInput = false } = {}) {
    const message = clean(body);
    if (state.busy || !state.room?.chat_open || !message) return;
    setBusy(true);
    try {
      await rpc("ari_circle_send_meetup_message", {
        requested_meetup_id: state.meetupId,
        requested_body: message
      });
      if (clearInput) {
        const input = $("meetupRoomMessageInput");
        input.value = "";
        input.style.height = "auto";
      }
      await loadMessages({ silent: true });
    } catch (error) {
      showToast(error.message || "Message could not be sent.", 4200);
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    await postMessage($("meetupRoomMessageInput").value, { clearInput: true });
  }

  async function sendQuickMessage(event) {
    const button = event.target.closest("[data-meetup-quick-message]");
    if (!button) return;
    await postMessage(button.dataset.meetupQuickMessage);
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
    $("editMeetingPoint")?.addEventListener("click", () => toggleMeetingPointEditor(true));
    $("cancelMeetingPoint")?.addEventListener("click", () => toggleMeetingPointEditor(false));
    $("meetupRoomMessageForm")?.addEventListener("submit", sendMessage);
    $("meetupRoomQuickActions")?.addEventListener("click", sendQuickMessage);
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
      console.error("Meetup Room V1.1 init failed:", error);
      $("meetupRoomLoading").innerHTML = `<strong>${escapeHtml(error.message || "Meetup room unavailable.")}</strong><br><a href="ari-circle-meetup.html">Back to Meet Up</a>`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleMeetupRoomV1 = Object.freeze({ version: VERSION, refresh: refreshAll });
})();
