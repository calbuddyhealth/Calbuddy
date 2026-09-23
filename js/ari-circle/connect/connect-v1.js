/* =============================================================
   ARI CIRCLE — CONNECT V1
   Activity-first meetup discovery. No progression, completion flow, or ranking.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const $ = (id) => document.getElementById(id);
  const ACTIVITY = Object.freeze({
    walking: ["Walking", "🚶"],
    gym: ["Gym", "🏋️"],
    running: ["Running", "🏃"],
    hiking: ["Hiking", "🥾"],
    sports: ["Sports", "🏀"],
    cycling: ["Cycling", "🚴"],
    yoga: ["Yoga", "🧘"],
    coffee: ["Coffee", "☕"],
    food: ["Food", "🍴"],
    community: ["Community", "◎"],
    volunteer: ["Volunteer", "🤝"],
    other: ["Meetup", "✦"]
  });

  const state = {
    client: null,
    user: null,
    rows: [],
    activity: "",
    requestMeetup: null,
    busy: false,
    toastTimer: 0
  };

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

  function showToast(message, duration = 3400) {
    const toast = $("meetupToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = clean(message);
    toast.hidden = false;
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    document.querySelectorAll("button[data-meetup-action], button[data-request-decision], #createMeetupSubmit")
      .forEach((button) => {
        button.disabled = state.busy || button.dataset.permanentDisabled === "true";
      });
  }

  function dateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time TBD";
    return date.toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function fullDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time TBD";
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function relativeStart(value) {
    const ms = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(ms)) return "";
    if (ms <= 0) return "Happening now";
    const mins = Math.ceil(ms / 60000);
    if (mins < 60) return `Starts in ${mins} min`;
    const hours = Math.ceil(mins / 60);
    if (hours < 24) return `Starts in ${hours} hr${hours === 1 ? "" : "s"}`;
    return fullDateTime(value);
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

  function roomUrl(meetupId) {
    return `ari-circle-meetup-room.html?meetup=${encodeURIComponent(meetupId)}`;
  }

  function guestSpotsOpen(row = {}) {
    const count = Math.max(0, Number(row.participant_count) || 0);
    const capacity = Math.max(0, Number(row.max_participants) || 0);
    return Math.max(0, capacity - count);
  }

  function isSameLocalDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function tomorrowFrom(now = new Date()) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  function weekendBounds(now = new Date()) {
    const day = now.getDay();
    const daysToSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() + daysToSaturday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 2);
    return { start, end };
  }

  function bucketRows(rows) {
    const now = new Date();
    const { start: weekendStart, end: weekendEnd } = weekendBounds(now);
    const tomorrow = tomorrowFrom(now);
    const buckets = { now: [], today: [], tomorrow: [], weekend: [], later: [] };

    rows.forEach((row) => {
      const start = new Date(row.starts_at);
      const end = new Date(row.ends_at);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      if (end <= now) return;

      if (start <= now && end > now) {
        buckets.now.push(row);
      } else if (isSameLocalDay(start, now)) {
        buckets.today.push(row);
      } else if (isSameLocalDay(start, tomorrow)) {
        buckets.tomorrow.push(row);
      } else if (start >= weekendStart && start < weekendEnd) {
        buckets.weekend.push(row);
      } else {
        buckets.later.push(row);
      }
    });

    buckets.now.sort((a, b) => {
      const aInstant = clean(a.join_mode || "instant") === "instant" ? 0 : 1;
      const bInstant = clean(b.join_mode || "instant") === "instant" ? 0 : 1;
      if (aInstant !== bInstant) return aInstant - bInstant;
      const aDistance = Number.isFinite(Number(a.distance_miles)) ? Number(a.distance_miles) : Number.POSITIVE_INFINITY;
      const bDistance = Number.isFinite(Number(b.distance_miles)) ? Number(b.distance_miles) : Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });

    return buckets;
  }

  function cardActionState(row, { live = false } = {}) {
    const count = Number(row.participant_count) || 0;
    const capacity = Number(row.max_participants) || 0;
    const full = capacity > 0 && count >= capacity;
    const joinMode = clean(row.join_mode) || "instant";
    const requestStatus = clean(row.viewer_request_status);
    const requestCount = Number(row.pending_request_count) || 0;

    if (row.viewer_is_host) {
      return {
        primaryLabel: "Open Room",
        primaryAction: "room",
        secondary: [
          joinMode === "approval"
            ? `<button class="circle-v5-button circle-connect-card__requests" data-meetup-action="requests" type="button">Requests${requestCount ? ` · ${requestCount}` : ""}</button>`
            : "",
          `<details class="circle-connect-card-menu">
            <summary aria-label="Meetup options">•••</summary>
            <div class="circle-connect-card-menu__panel">
              <button data-meetup-action="cancel" type="button">Cancel meetup</button>
            </div>
          </details>`
        ].join(""),
        disabled: false
      };
    }

    if (row.viewer_joined) {
      return {
        primaryLabel: "Open Room",
        primaryAction: "room",
        secondary: `<button class="circle-v5-button" data-meetup-action="leave" type="button">Leave</button>`,
        disabled: false
      };
    }

    if (joinMode === "approval" && requestStatus === "pending") {
      return {
        primaryLabel: "Requested",
        primaryAction: "requested",
        secondary: `<button class="circle-v5-button" data-meetup-action="withdraw-request" type="button">Withdraw</button>`,
        disabled: true
      };
    }

    if (joinMode === "approval" && requestStatus === "waitlisted") {
      return {
        primaryLabel: "Waitlisted",
        primaryAction: "waitlisted",
        secondary: `<button class="circle-v5-button" data-meetup-action="withdraw-request" type="button">Withdraw</button>`,
        disabled: true
      };
    }

    if (joinMode === "approval" && requestStatus === "declined") {
      return { primaryLabel: "Not selected", primaryAction: "declined", secondary: "", disabled: true };
    }

    if (joinMode === "approval" && full) {
      return { primaryLabel: "Join Waitlist", primaryAction: "request", secondary: "", disabled: false };
    }

    if (full) {
      return { primaryLabel: "Full", primaryAction: "full", secondary: "", disabled: true };
    }

    return {
      primaryLabel: joinMode === "approval" ? "Request to Join" : (live ? "Join now" : "Join"),
      primaryAction: joinMode === "approval" ? "request" : "join",
      secondary: "",
      disabled: false
    };
  }

  function createMeetupCard(row, { live = false } = {}) {
    const article = document.createElement("article");
    article.className = `circle-connect-card${live ? " is-live" : ""}`;
    article.dataset.meetupId = clean(row.meetup_id);

    const [activityLabel, activityIcon] = activityMeta(row.activity);
    const count = Math.max(0, Number(row.participant_count) || 0);
    const capacity = Math.max(0, Number(row.max_participants) || 0);
    const openSpots = Math.max(0, capacity - count);
    const action = cardActionState(row, { live });
    const handle = clean(row.host_handle)
      ? `@${clean(row.host_handle).replace(/^@+/, "")}`
      : "ARI Circle";
    const distance = Number(row.distance_miles);
    const distanceLabel = Number.isFinite(distance) ? `${distance.toFixed(distance < 10 ? 1 : 0)} mi` : "";
    const joinMode = clean(row.join_mode) || "instant";
    const jumpInReady = live
      && joinMode === "instant"
      && openSpots > 0
      && !row.viewer_is_host
      && !row.viewer_joined;

    article.innerHTML = `
      ${live ? `<div class="circle-connect-live-strip">
        <span><i aria-hidden="true"></i> LIVE NOW</span>
        <strong>${jumpInReady ? "Jump in" : joinMode === "approval" ? "Approval required" : "In progress"}</strong>
      </div>` : ""}
      <div class="circle-connect-card__top">
        <a class="circle-connect-avatar" href="ari-circle.html?user=${encodeURIComponent(row.host_user_id)}">${avatar(row)}</a>
        <div class="circle-connect-identity">
          <strong>${escapeHtml(row.host_display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)}</span>
        </div>
        <span class="circle-connect-activity-badge">${escapeHtml(activityIcon)} ${escapeHtml(activityLabel)}</span>
      </div>

      <div class="circle-connect-card__body">
        <h3>${escapeHtml(row.title || "Meetup")}</h3>
        ${clean(row.description) ? `<p>${escapeHtml(row.description)}</p>` : ""}
        <div class="circle-connect-facts">
          <span>📍 ${escapeHtml(row.area || "General area")}${distanceLabel ? ` · ${escapeHtml(distanceLabel)}` : ""}</span>
          <span class="circle-connect-facts__sep" aria-hidden="true">·</span>
          <span>◷ ${escapeHtml(dateTime(row.starts_at))}</span>
          <span class="circle-connect-facts__sep" aria-hidden="true">·</span>
          <span>👥 ${count} going${openSpots ? ` · ${openSpots} spot${openSpots === 1 ? "" : "s"} left` : ""}</span>
        </div>
      </div>

      <div class="circle-connect-card__actions">
        <button class="circle-v5-button-primary" data-meetup-action="${escapeHtml(action.primaryAction)}" type="button" ${action.disabled ? 'data-permanent-disabled="true" disabled' : ""}>${escapeHtml(action.primaryLabel)}</button>
        ${action.secondary}
      </div>
    `;

    article.querySelectorAll("[data-meetup-action]").forEach((button) => {
      if (button.dataset.permanentDisabled === "true") return;
      button.addEventListener("click", () => handleAction(row, button.dataset.meetupAction));
    });

    return article;
  }

  function renderBucket(name, rows) {
    const list = $(`meetup${name}List`);
    const section = $(`meetup${name}Section`);
    if (!list || !section) return;

    list.replaceChildren();
    rows.forEach((row) => list.append(createMeetupCard(row, { live: name === "Now" })));
    const count = section.querySelector("[data-meetup-count]");
    if (count) count.textContent = String(rows.length);
    section.hidden = rows.length === 0;
  }

  function renderMeetups() {
    const rows = state.rows.filter((row) => new Date(row.ends_at).getTime() > Date.now());
    const buckets = bucketRows(rows);
    renderBucket("Now", buckets.now);
    renderBucket("Today", buckets.today);
    renderBucket("Tomorrow", buckets.tomorrow);
    renderBucket("Weekend", buckets.weekend);
    renderBucket("Later", buckets.later);

    const total = rows.length;
    $("meetupEmpty").hidden = total > 0;
    $("meetupStatus").textContent = total
      ? `${total} thing${total === 1 ? "" : "s"} nearby`
      : "";

    const params = new URLSearchParams(location.search);
    const focusId = clean(params.get("meetup"));
    if (focusId) {
      requestAnimationFrame(() => {
        const target = document.querySelector(`[data-meetup-id="${CSS.escape(focusId)}"]`);
        target?.classList.add("is-focused");
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }

    const requestId = clean(params.get("requests"));
    if (requestId) {
      const row = rows.find((item) => clean(item.meetup_id) === requestId && item.viewer_is_host);
      if (row) setTimeout(() => openRequests(row), 100);
    }
  }

  async function loadMeetups() {
    const status = $("meetupStatus");
    if (status) status.textContent = "Finding things happening nearby…";
    try {
      const rows = await rpc("ari_circle_list_meetups", {
        requested_activity: state.activity || null,
        requested_window: "upcoming",
        result_limit: 60
      });
      state.rows = Array.isArray(rows) ? rows : [];
      renderMeetups();
    } catch (error) {
      console.error("ARI Circle Connect loading failed:", error);
      state.rows = [];
      renderMeetups();
      if (status) status.textContent = error.message || "Connect is unavailable right now.";
    }
  }

  async function openRequests(row) {
    state.requestMeetup = row;
    $("meetupRequestsTitle").textContent = row.title || "Join requests";
    $("meetupRequestsStatus").textContent = "Loading requests…";
    $("meetupRequestsList").replaceChildren();
    const dialog = $("meetupRequestsDialog");
    if (typeof dialog?.showModal === "function" && !dialog.open) dialog.showModal();
    await loadRequests();
  }

  async function loadRequests() {
    const row = state.requestMeetup;
    if (!row) return;
    const list = $("meetupRequestsList");
    const status = $("meetupRequestsStatus");

    try {
      const requests = await rpc("ari_circle_list_meetup_requests", {
        requested_meetup_id: row.meetup_id
      });
      const rows = Array.isArray(requests) ? requests : [];
      list.replaceChildren();

      if (!rows.length) {
        status.textContent = "No join requests yet.";
        return;
      }

      const openSpots = guestSpotsOpen(row);
      status.textContent = openSpots
        ? `${openSpots} spot${openSpots === 1 ? "" : "s"} open.`
        : "This meetup is full.";

      rows.forEach((request) => {
        const article = document.createElement("article");
        article.className = "circle-connect-request";
        const requestStatus = clean(request.request_status) || "pending";
        const canReview = ["pending", "waitlisted"].includes(requestStatus);
        const canAccept = canReview && openSpots > 0;
        const handle = clean(request.handle)
          ? `@${clean(request.handle).replace(/^@+/, "")}`
          : "ARI Circle";

        article.innerHTML = `
          <a class="circle-connect-avatar" href="ari-circle.html?user=${encodeURIComponent(request.user_id)}">${requestAvatar(request)}</a>
          <div class="circle-connect-request__identity">
            <strong>${escapeHtml(request.display_name || "ARI User")}</strong>
            <span>${escapeHtml(handle)}</span>
          </div>
          <span class="circle-connect-request__state">${escapeHtml(requestStatus)}</span>
          ${canReview ? `<div class="circle-connect-request__actions">
            <button class="circle-v5-button-primary" data-request-decision="accept" type="button" ${canAccept ? "" : 'data-permanent-disabled="true" disabled'}>${canAccept ? "Accept" : "Full"}</button>
            <button class="circle-v5-button" data-request-decision="waitlist" type="button">Waitlist</button>
            <button class="circle-v5-button" data-request-decision="decline" type="button">Decline</button>
          </div>` : ""}
        `;

        article.querySelectorAll("[data-request-decision]").forEach((button) => {
          if (button.dataset.permanentDisabled === "true") return;
          button.addEventListener("click", () => reviewRequest(request.user_id, button.dataset.requestDecision));
        });
        list.append(article);
      });
    } catch (error) {
      console.error("ARI Circle join requests failed:", error);
      status.textContent = error.message || "Could not load requests.";
    }
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
      showToast(
        status === "accepted"
          ? "Guest accepted."
          : status === "waitlisted"
            ? "Guest moved to the waitlist."
            : "Request declined."
      );
      await loadMeetups();
      state.requestMeetup = state.rows.find((item) => item.meetup_id === row.meetup_id) || row;
      await loadRequests();
    } catch (error) {
      showToast(error.message || "Could not review that request.", 4400);
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
      }

      if (action === "request") {
        const result = await rpc("ari_circle_request_meetup", {
          requested_meetup_id: row.meetup_id
        });
        const status = clean(result?.status);
        showToast(status === "waitlisted" ? "You’re on the waitlist." : "Request sent.");
      } else if (action === "withdraw-request") {
        await rpc("ari_circle_withdraw_meetup_request", {
          requested_meetup_id: row.meetup_id
        });
        showToast("Request withdrawn.");
      } else if (action === "leave") {
        await rpc("ari_circle_leave_meetup", {
          requested_meetup_id: row.meetup_id
        });
        showToast("You left the meetup.");
      } else if (action === "cancel") {
        if (!confirm("Cancel this meetup for everyone?")) return;
        await rpc("ari_circle_cancel_meetup", {
          requested_meetup_id: row.meetup_id
        });
        showToast("Meetup cancelled.");
      }

      await loadMeetups();
    } catch (error) {
      console.error(`ARI Circle Connect ${action} failed:`, error);
      showToast(error.message || "That action could not be completed.", 4400);
    } finally {
      setBusy(false);
    }
  }

  function setMinimumStartTime() {
    const input = $("meetupFormStarts");
    if (!input) return;
    const date = new Date(Date.now() + 15 * 60 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
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

    const guestSpots = Math.max(
      1,
      Math.min(Number($("meetupFormGuestSpots")?.value) || 3, 49)
    );
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

      showToast("Meetup published.");
      state.activity = "";
      syncFilters();
      await loadMeetups();
    } catch (error) {
      console.error("Meetup creation failed:", error);
      showToast(error.message || "Could not publish the meetup.", 4400);
    } finally {
      setBusy(false);
    }
  }

  function syncFilters() {
    document.querySelectorAll("[data-activity]").forEach((button) => {
      button.classList.toggle("is-active", (button.dataset.activity || "") === state.activity);
    });
  }

  function bind() {
    $("hostMeetupButton")?.addEventListener("click", openHostDialog);
    $("hostMeetupForm")?.addEventListener("submit", createMeetup);
    $("refreshMeetups")?.addEventListener("click", loadMeetups);

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => $(button.dataset.close)?.close());
    });

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

    window.addEventListener("ari:circleSearchLocationChanged", loadMeetups);
  }

  async function init() {
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      resetHostForm();
      $("meetupPage").hidden = false;
      await loadMeetups();
      window.AriCircleV5RealWorld?.refresh?.();
    } catch (error) {
      console.error("ARI Circle Connect initialization failed:", error);
      $("meetupPage").hidden = false;
      $("meetupStatus").textContent = error.message || "Connect could not open.";
    }
  }

  window.AriCircleConnectV1 = Object.freeze({
    version: VERSION,
    refresh: loadMeetups
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
