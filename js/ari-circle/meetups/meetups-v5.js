/* =============================================================
   ARI CIRCLE V5 — MEET UP
   Real-world meetup discovery, fast hosting, host approval, rooms, and XP.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.3.0";
  const $ = (id) => document.getElementById(id);
  const ACTIVITY = Object.freeze({
    walking: ["Walking", "🚶"], gym: ["Gym", "🏋️"], running: ["Running", "🏃"],
    hiking: ["Hiking", "🥾"], sports: ["Sports", "🏀"], cycling: ["Cycling", "🚴"],
    yoga: ["Yoga", "🧘"], coffee: ["Coffee", "☕"], food: ["Food", "🍴"],
    community: ["Community", "◎"], volunteer: ["Volunteer", "🤝"], other: ["Meetup", "✦"]
  });
  const TIER = Object.freeze({
    new_host: "New Host", organizer: "Organizer", active_host: "Active Host",
    community_leader: "Community Leader", community_builder: "Community Builder"
  });

  const state = {
    client: null,
    user: null,
    rows: [],
    activity: "",
    window: "upcoming",
    requestMeetup: null,
    busy: false,
    toastTimer: 0
  };

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function getClient() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
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

  function showToast(message, duration = 3600) {
    const toast = $("meetupToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = clean(message);
    toast.hidden = false;
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
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

  function dateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time TBD";
    return date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function relativeEnd(value) {
    const ms = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(ms)) return "";
    if (ms <= 0) return "Ready to complete";
    const mins = Math.ceil(ms / 60000);
    if (mins < 60) return `${mins}m until completion`;
    const hours = Math.ceil(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.ceil(hours / 24)}d`;
  }

  function avatar(row) {
    if (clean(row.host_avatar_url)) return `<img src="${escapeHtml(row.host_avatar_url)}" alt="" />`;
    const initial = clean(row.host_display_name).charAt(0).toUpperCase() || "A";
    return `<span aria-hidden="true">${escapeHtml(initial)}</span>`;
  }

  function requestAvatar(row) {
    if (clean(row.avatar_url)) return `<img src="${escapeHtml(row.avatar_url)}" alt="" />`;
    const initial = clean(row.display_name).charAt(0).toUpperCase() || "A";
    return `<span aria-hidden="true">${escapeHtml(initial)}</span>`;
  }

  function activityMeta(key) {
    return ACTIVITY[key] || ACTIVITY.other;
  }

  function inferActivity(title) {
    const text = clean(title).toLowerCase();
    if (!text) return "other";
    if (/\b(hike|hiking|trail)\b/.test(text)) return "hiking";
    if (/\b(gym|lift|lifting|workout|weights|chest|back|shoulder|shoulders|legs|arms)\b/.test(text)) return "gym";
    if (/\b(run|running|jog|jogging)\b/.test(text)) return "running";
    if (/\b(walk|walking|stroll)\b/.test(text)) return "walking";
    if (/\b(bike|biking|cycle|cycling)\b/.test(text)) return "cycling";
    if (/\byoga\b/.test(text)) return "yoga";
    if (/\b(coffee|cafe)\b/.test(text)) return "coffee";
    if (/\b(dinner|lunch|breakfast|brunch|food|eat|meal)\b/.test(text)) return "food";
    if (/\b(volunteer|cleanup|clean-up)\b/.test(text)) return "volunteer";
    if (/\b(basketball|volleyball|soccer|football|pickleball|tennis|sport|sports)\b/.test(text)) return "sports";
    if (/\b(community|charity|awareness|civic)\b/.test(text)) return "community";
    return "other";
  }

  function roomUrl(meetupId) {
    return `ari-circle-meetup-room.html?meetup=${encodeURIComponent(meetupId)}`;
  }

  function guestSpotsOpen(row = {}) {
    const count = Math.max(0, Number(row.participant_count) || 0);
    const capacity = Math.max(0, Number(row.max_participants) || 0);
    return Math.max(0, capacity - count);
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    document.querySelectorAll("button[data-meetup-action], button[data-request-decision], #createMeetupSubmit").forEach((button) => {
      button.disabled = state.busy || button.dataset.permanentDisabled === "true";
    });
  }

  async function loadXpSummary() {
    try {
      const summary = await rpc("ari_circle_xp_summary", { target_user_id: state.user.id });
      const today = Number(summary?.today_xp) || 0;
      const week = Number(summary?.week_xp) || 0;
      $("meetupDailyXp").textContent = `${today} / 10 XP`;
      $("meetupWeeklyXp").textContent = `${week} / 70 XP`;
      $("meetupDailyBar").style.width = `${Math.min(100, today * 10)}%`;
      $("meetupWeeklyBar").style.width = `${Math.min(100, (week / 70) * 100)}%`;
    } catch (error) {
      console.warn("Meet Up XP summary unavailable:", error);
    }
  }

  async function loadHostSummary() {
    const note = document.querySelector("#meetupXpCard .circle-xp-meetup-hud__note");
    if (!note) return;
    try {
      const summary = await rpc("ari_circle_my_host_summary");
      const hosted = Math.max(0, Number(summary?.verified_hosted_meetups) || 0);
      const tier = TIER[clean(summary?.tier)] || "New Host";
      const nextTierKey = clean(summary?.next_tier);
      const nextTier = TIER[nextTierKey] || "";
      const remaining = Math.max(0, Number(summary?.remaining_to_next) || 0);
      const verifiedXp = Math.max(0, Number(summary?.verified_host_xp) || 6);
      note.textContent = nextTier
        ? `${tier} · ${hosted} verified hosted · ${remaining} to ${nextTier} · up to +${verifiedXp} XP`
        : `${tier} · ${hosted} verified hosted · top Host tier · up to +${verifiedXp} XP`;
    } catch (error) {
      console.warn("Meet Up Host progress unavailable:", error);
      note.textContent = "Verified meetups earn XP and build Host status";
    }
  }

  async function loadMeetups() {
    const status = $("meetupStatus");
    if (status) status.textContent = "Finding meetups…";
    try {
      const rows = await rpc("ari_circle_list_meetups", {
        requested_activity: state.activity || null,
        requested_window: state.window,
        result_limit: 40
      });
      state.rows = Array.isArray(rows) ? rows : [];
      renderMeetups();
    } catch (error) {
      console.error("Meet Up loading failed:", error);
      state.rows = [];
      renderMeetups();
      if (status) status.textContent = error.message || "Meet Up is unavailable right now.";
    }
  }

  function renderMeetups() {
    const host = $("meetupList");
    const empty = $("meetupEmpty");
    const status = $("meetupStatus");
    host.replaceChildren();

    if (!state.rows.length) {
      empty.hidden = false;
      status.textContent = "";
      return;
    }

    empty.hidden = true;
    const pending = state.rows.filter((row) => new Date(row.ends_at).getTime() <= Date.now() && row.viewer_joined && !row.viewer_completed).length;
    status.textContent = pending
      ? `${pending} meetup${pending === 1 ? " is" : "s are"} waiting for your completion.`
      : `${state.rows.length} meetup${state.rows.length === 1 ? "" : "s"} available.`;

    state.rows.forEach((row) => host.append(createMeetupCard(row)));
  }

  function createMeetupCard(row) {
    const article = document.createElement("article");
    article.className = "circle-v5-meetup-card";
    const [activityLabel, activityIcon] = activityMeta(row.activity);
    const count = Number(row.participant_count) || 0;
    const capacity = Number(row.max_participants) || 0;
    const guestCount = Math.max(0, count - 1);
    const guestCapacity = Math.max(1, capacity - 1);
    const full = count >= capacity;
    const ended = new Date(row.ends_at).getTime() <= Date.now();
    const handle = clean(row.host_handle) ? `@${clean(row.host_handle).replace(/^@+/, "")}` : "ARI Circle";
    const tier = TIER[row.host_leadership_tier] || "Host";
    const xp = row.viewer_is_host ? Number(row.participant_xp || 0) + 2 : Number(row.participant_xp || 0);
    const joinMode = clean(row.join_mode) || "instant";
    const requestStatus = clean(row.viewer_request_status);
    const requestCount = Number(row.pending_request_count) || 0;

    let primaryLabel = joinMode === "approval" ? "Request to Join" : "Join Meetup";
    let primaryAction = joinMode === "approval" ? "request" : "join";
    let secondary = "";

    if (ended && row.viewer_joined) {
      if (row.viewer_completed) {
        primaryLabel = "Waiting for everyone";
        primaryAction = "waiting";
      } else {
        primaryLabel = "Complete Meetup";
        primaryAction = "complete";
      }
      secondary = `<button class="circle-v5-button" data-meetup-action="room" type="button">Room</button>`;
    } else if (row.viewer_is_host) {
      primaryLabel = "Open Room";
      primaryAction = "room";
      if (joinMode === "approval") {
        secondary += `<button class="circle-v5-button" data-meetup-action="requests" type="button">Requests${requestCount ? ` · ${requestCount}` : ""}</button>`;
      }
      secondary += `<button class="circle-v5-button" data-meetup-action="cancel" type="button">Cancel</button>`;
    } else if (row.viewer_joined) {
      primaryLabel = "Open Room";
      primaryAction = "room";
      secondary = `<button class="circle-v5-button" data-meetup-action="leave" type="button">Leave</button>`;
    } else if (joinMode === "approval" && requestStatus === "pending") {
      primaryLabel = "Requested";
      primaryAction = "requested";
      secondary = `<button class="circle-v5-button" data-meetup-action="withdraw-request" type="button">Withdraw</button>`;
    } else if (joinMode === "approval" && requestStatus === "waitlisted") {
      primaryLabel = "Waitlisted";
      primaryAction = "waitlisted";
      secondary = `<button class="circle-v5-button" data-meetup-action="withdraw-request" type="button">Withdraw</button>`;
    } else if (joinMode === "approval" && requestStatus === "declined") {
      primaryLabel = "Not selected";
      primaryAction = "declined";
    } else if (joinMode === "approval" && full) {
      primaryLabel = "Join Waitlist";
      primaryAction = "request";
    } else if (full) {
      primaryLabel = "Full";
      primaryAction = "full";
    }

    const permanent = ["waiting","requested","waitlisted","declined","full"].includes(primaryAction);
    const joiningCopy = joinMode === "approval" ? "Host approves requests" : "Instant join";

    article.innerHTML = `
      <div class="circle-v5-card-top">
        <a class="circle-v5-avatar" href="ari-circle.html?user=${encodeURIComponent(row.host_user_id)}">${avatar(row)}</a>
        <div class="circle-v5-card-identity"><strong>${escapeHtml(row.host_display_name || "ARI User")}</strong><span>${escapeHtml(handle)} · ${escapeHtml(tier)}</span></div>
        <span class="circle-v5-host-badge">HOST · POC</span>
      </div>
      <h3>${escapeHtml(activityIcon)} ${escapeHtml(row.title)}</h3>
      ${clean(row.description) ? `<p class="circle-v5-meetup-card__copy">${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-v5-meta">
        <span>📍 ${escapeHtml(row.area)}</span>
        <span>◷ ${escapeHtml(dateTime(row.starts_at))}</span>
        <span>👥 ${guestCount} / ${guestCapacity} guests</span>
        <span>${escapeHtml(activityLabel)}</span>
      </div>
      <div class="circle-v5-card-actions">
        <button class="circle-v5-button-primary" data-meetup-action="${primaryAction}" type="button" ${permanent ? 'data-permanent-disabled="true" disabled' : ""}>${escapeHtml(primaryLabel)}</button>
        ${secondary}
        <span class="circle-v5-xp-chip">+${Math.max(0, xp)} XP</span>
      </div>
      <p class="circle-v5-completion-note">${ended ? "Completion is open. The room stays available during the completion window." : `${escapeHtml(joiningCopy)} · ${escapeHtml(relativeEnd(row.ends_at))} · Host is the point of contact.`}</p>
    `;

    article.querySelectorAll("[data-meetup-action]").forEach((button) => {
      if (button.dataset.permanentDisabled === "true") return;
      button.addEventListener("click", () => handleAction(row, button.dataset.meetupAction));
    });
    return article;
  }

  async function openRequests(row) {
    state.requestMeetup = row;
    $("meetupRequestsTitle").textContent = row.title || "Join requests";
    $("meetupRequestsStatus").textContent = "Refreshing capacity…";
    $("meetupRequestsList").replaceChildren();
    const dialog = $("meetupRequestsDialog");
    if (typeof dialog?.showModal === "function" && !dialog.open) dialog.showModal();

    await loadMeetups();
    state.requestMeetup = state.rows.find((item) => item.meetup_id === row.meetup_id) || row;
    await loadRequests();
  }

  async function loadRequests() {
    const row = state.requestMeetup;
    if (!row) return;
    const list = $("meetupRequestsList");
    const status = $("meetupRequestsStatus");
    try {
      const requests = await rpc("ari_circle_list_meetup_requests", { requested_meetup_id: row.meetup_id });
      const rows = Array.isArray(requests) ? requests : [];
      list.replaceChildren();
      if (!rows.length) {
        status.textContent = "No join requests yet.";
        return;
      }

      const actionable = rows.filter((request) => ["pending","waitlisted"].includes(clean(request.request_status))).length;
      const openSpots = guestSpotsOpen(row);
      if (actionable && openSpots > 0) {
        const selectable = Math.min(openSpots, actionable);
        status.textContent = `${openSpots} guest spot${openSpots === 1 ? "" : "s"} open · choose up to ${selectable} of ${actionable} waiting request${actionable === 1 ? "" : "s"}.`;
      } else if (actionable) {
        status.textContent = `Meetup is full · ${actionable} request${actionable === 1 ? " is" : "s are"} waiting. Accept unlocks when a spot opens.`;
      } else {
        status.textContent = "Everyone here has been reviewed.";
      }
      rows.forEach((request) => list.append(createRequestCard(request, openSpots)));
    } catch (error) {
      console.error("Meet Up requests failed:", error);
      status.textContent = error.message || "Could not load requests.";
    }
  }

  function createRequestCard(request, openSpots = 0) {
    const article = document.createElement("article");
    article.className = "circle-v5-meetup-card";
    const handle = clean(request.handle) ? `@${clean(request.handle).replace(/^@+/, "")}` : "ARI Circle";
    const status = clean(request.request_status) || "pending";
    const tier = TIER[request.leadership_tier] || "Member";
    const verified = Number(request.verified_meetups) || 0;
    const canReview = ["pending","waitlisted"].includes(status);
    const canAccept = canReview && openSpots > 0;

    article.innerHTML = `
      <div class="circle-v5-card-top">
        <div class="circle-v5-avatar">${requestAvatar(request)}</div>
        <div class="circle-v5-card-identity">
          <strong>${escapeHtml(request.display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)} · ${verified} verified meetup${verified === 1 ? "" : "s"}</span>
        </div>
        <span class="circle-v5-host-badge">${escapeHtml(status.toUpperCase())}</span>
      </div>
      <p class="circle-v5-completion-note">${escapeHtml(tier)}</p>
      ${canReview ? `<div class="circle-v5-card-actions">
        <button class="circle-v5-button-primary" data-request-decision="accept" type="button" ${canAccept ? "" : 'data-permanent-disabled="true" disabled'}>${canAccept ? "Accept" : "Full"}</button>
        <button class="circle-v5-button" data-request-decision="waitlist" type="button">Waitlist</button>
        <button class="circle-v5-button" data-request-decision="decline" type="button">Decline</button>
      </div>` : ""}
    `;

    article.querySelectorAll("[data-request-decision]").forEach((button) => {
      if (button.dataset.permanentDisabled === "true") return;
      button.addEventListener("click", () => reviewRequest(request.user_id, button.dataset.requestDecision));
    });
    return article;
  }

  async function reviewRequest(userId, decision) {
    const row = state.requestMeetup;
    if (!row || state.busy) return;
    setBusy(true);
    try {
      const result = await rpc("ari_circle_review_meetup_request", {
        requested_meetup_id: row.meetup_id,
        requested_user_id: userId,
        requested_decision: decision
      });
      const status = clean(result?.status) || decision;
      showToast(status === "accepted" ? "Guest accepted. They can now enter the Meetup Room." : status === "waitlisted" ? "Guest moved to the waitlist." : "Request declined.");

      await loadMeetups();
      state.requestMeetup = state.rows.find((item) => item.meetup_id === row.meetup_id) || row;
      await loadRequests();
    } catch (error) {
      console.error("Meet Up request review failed:", error);
      showToast(error.message || "Could not review that request.", 4600);
    } finally {
      setBusy(false);
    }
  }

  async function handleAction(row, action) {
    if (action === "room") {
      location.href = roomUrl(row.meetup_id);
      return;
    }
    if (action === "requests") {
      await openRequests(row);
      return;
    }
    if (state.busy) return;
    setBusy(true);
    try {
      if (action === "join") {
        await rpc("ari_circle_join_meetup", { requested_meetup_id: row.meetup_id });
        location.href = roomUrl(row.meetup_id);
        return;
      } else if (action === "request") {
        const result = await rpc("ari_circle_request_meetup", { requested_meetup_id: row.meetup_id });
        const requestStatus = clean(result?.status);
        if (requestStatus === "waitlisted") showToast("You’re on the waitlist. The host can select you if a spot opens.");
        else if (requestStatus === "declined") showToast("The host has already reviewed this request.");
        else showToast("Request sent to the host.");
      } else if (action === "withdraw-request") {
        await rpc("ari_circle_withdraw_meetup_request", { requested_meetup_id: row.meetup_id });
        showToast("Join request withdrawn.");
      } else if (action === "leave") {
        await rpc("ari_circle_leave_meetup", { requested_meetup_id: row.meetup_id });
        showToast("You left the meetup.");
      } else if (action === "cancel") {
        if (!confirm("Cancel this meetup for everyone?")) return;
        await rpc("ari_circle_cancel_meetup", { requested_meetup_id: row.meetup_id });
        showToast("Meetup cancelled.");
      } else if (action === "complete") {
        const result = await rpc("ari_circle_complete_meetup", { requested_meetup_id: row.meetup_id });
        if (result?.settled) showToast(result.message || `Meetup verified. +${Number(result?.xp_awarded) || 0} XP`);
        else showToast(`Completion saved. Waiting on ${Number(result?.waiting_on) || 0} participant${Number(result?.waiting_on) === 1 ? "" : "s"}.`);
      }
      await Promise.all([loadMeetups(), loadXpSummary(), loadHostSummary()]);
    } catch (error) {
      console.error(`Meet Up ${action} failed:`, error);
      showToast(error.message || "That action could not be completed.", 4600);
    } finally {
      setBusy(false);
    }
  }

  function setMinimumStartTime() {
    const input = $("meetupFormStarts");
    if (!input) return;
    const date = new Date(Date.now() + 15 * 60 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    input.min = local;
    if (!input.value) input.value = local;
  }

  function resetHostForm() {
    $("hostMeetupForm")?.reset();
    const activity = $("meetupFormActivity");
    if (activity) {
      activity.dataset.manual = "false";
      activity.value = "other";
    }
    setMinimumStartTime();
  }

  function openHostDialog() {
    setMinimumStartTime();
    const activity = $("meetupFormActivity");
    if (activity && !activity.dataset.manual) activity.dataset.manual = "false";
    const dialog = $("hostMeetupDialog");
    if (typeof dialog?.showModal === "function" && !dialog.open) dialog.showModal();
  }

  async function createMeetup(event) {
    event.preventDefault();
    if (state.busy) return;
    const startsValue = clean($("meetupFormStarts")?.value);
    const starts = new Date(startsValue);
    if (!startsValue || Number.isNaN(starts.getTime())) {
      showToast("Choose a valid meetup start time.");
      return;
    }

    const guestSpots = Math.max(1, Math.min(Number($("meetupFormGuestSpots")?.value) || 3, 49));
    const activitySelect = $("meetupFormActivity");
    const title = clean($("meetupFormTitle")?.value);
    const activity = clean(activitySelect?.value) || inferActivity(title);

    setBusy(true);
    try {
      const id = await rpc("ari_circle_create_meetup", {
        requested_title: title,
        requested_activity: activity,
        requested_area: clean($("meetupFormArea")?.value),
        requested_starts_at: starts.toISOString(),
        requested_duration_minutes: Number($("meetupFormDuration")?.value) || 60,
        requested_max_participants: guestSpots + 1,
        requested_description: clean($("meetupFormDescription")?.value) || null,
        requested_join_mode: clean($("meetupFormJoinMode")?.value) || "instant"
      });
      $("hostMeetupDialog")?.close();
      resetHostForm();
      if (id) {
        location.href = roomUrl(id);
        return;
      }
      showToast("Meetup published. You’re the point of contact; verified completion builds Host status.");
      state.activity = "";
      syncFilters();
      await loadMeetups();
    } catch (error) {
      console.error("Meetup creation failed:", error);
      showToast(error.message || "Could not publish the meetup.", 4600);
    } finally {
      setBusy(false);
    }
  }

  function syncFilters() {
    document.querySelectorAll("[data-activity]").forEach((button) => button.classList.toggle("is-active", button.dataset.activity === state.activity));
    document.querySelectorAll("[data-window]").forEach((button) => button.classList.toggle("is-active", button.dataset.window === state.window));
  }

  function bind() {
    $("hostMeetupButton")?.addEventListener("click", openHostDialog);
    $("hostMeetupForm")?.addEventListener("submit", createMeetup);
    $("refreshMeetups")?.addEventListener("click", () => Promise.all([loadMeetups(), loadHostSummary()]));
    document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => $(button.dataset.close)?.close()));

    $("meetupFormTitle")?.addEventListener("input", (event) => {
      const activity = $("meetupFormActivity");
      if (!activity || activity.dataset.manual === "true") return;
      activity.value = inferActivity(event.target.value);
    });
    $("meetupFormActivity")?.addEventListener("change", (event) => {
      event.target.dataset.manual = "true";
    });

    $("meetupActivityFilters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-activity]");
      if (!button) return;
      state.activity = button.dataset.activity || "";
      syncFilters();
      loadMeetups();
    });
    $("meetupWindowFilters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-window]");
      if (!button) return;
      state.window = button.dataset.window || "upcoming";
      syncFilters();
      loadMeetups();
    });
  }

  async function init() {
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      resetHostForm();
      $("meetupPage").hidden = false;
      await Promise.all([loadMeetups(), loadXpSummary(), loadHostSummary()]);
      window.AriCircleV5RealWorld?.refresh?.();
    } catch (error) {
      console.error("Meet Up initialization failed:", error);
      $("meetupPage").hidden = false;
      $("meetupStatus").textContent = error.message || "Meet Up could not open.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleMeetupsV5 = Object.freeze({ version: VERSION, refresh: loadMeetups });
})();