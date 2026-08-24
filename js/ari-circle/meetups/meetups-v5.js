/* =============================================================
   ARI CIRCLE V5 — MEET UP
   Real-world meetup discovery, hosting, mutual completion, and XP.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
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

  function activityMeta(key) {
    return ACTIVITY[key] || ACTIVITY.other;
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    document.querySelectorAll("button[data-meetup-action], #createMeetupSubmit").forEach((button) => {
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
    const full = count >= Number(row.max_participants || 0);
    const ended = new Date(row.ends_at).getTime() <= Date.now();
    const handle = clean(row.host_handle) ? `@${clean(row.host_handle).replace(/^@+/, "")}` : "ARI Circle";
    const tier = TIER[row.host_leadership_tier] || "Host";
    const xp = row.viewer_is_host ? Number(row.participant_xp || 0) + 2 : Number(row.participant_xp || 0);

    let primaryLabel = "Join Meetup";
    let primaryAction = "join";
    let secondary = "";

    if (ended && row.viewer_joined) {
      if (row.viewer_completed) {
        primaryLabel = "Waiting for everyone";
        primaryAction = "waiting";
      } else {
        primaryLabel = "Complete Meetup";
        primaryAction = "complete";
      }
    } else if (row.viewer_is_host) {
      primaryLabel = "Hosting";
      primaryAction = "hosting";
      secondary = `<button class="circle-v5-button" data-meetup-action="cancel" type="button">Cancel</button>`;
    } else if (row.viewer_joined) {
      primaryLabel = "Joined";
      primaryAction = "joined";
      secondary = `<button class="circle-v5-button" data-meetup-action="leave" type="button">Leave</button>`;
    } else if (full) {
      primaryLabel = "Full";
      primaryAction = "full";
    }

    article.innerHTML = `
      <div class="circle-v5-card-top">
        <a class="circle-v5-avatar" href="ari-circle.html?user=${encodeURIComponent(row.host_user_id)}">${avatar(row)}</a>
        <div class="circle-v5-card-identity"><strong>${escapeHtml(row.host_display_name || "ARI User")}</strong><span>${escapeHtml(handle)} · ${escapeHtml(tier)}</span></div>
        <span class="circle-v5-host-badge">${escapeHtml(tier)}</span>
      </div>
      <h3>${escapeHtml(activityIcon)} ${escapeHtml(row.title)}</h3>
      ${clean(row.description) ? `<p class="circle-v5-meetup-card__copy">${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-v5-meta">
        <span>📍 ${escapeHtml(row.area)}</span>
        <span>◷ ${escapeHtml(dateTime(row.starts_at))}</span>
        <span>👥 ${count} / ${Number(row.max_participants) || 0}</span>
        <span>${escapeHtml(activityLabel)}</span>
      </div>
      <div class="circle-v5-card-actions">
        <button class="circle-v5-button-primary" data-meetup-action="${primaryAction}" type="button" ${["waiting","hosting","joined","full"].includes(primaryAction) ? 'data-permanent-disabled="true" disabled' : ""}>${escapeHtml(primaryLabel)}</button>
        ${secondary}
        <span class="circle-v5-xp-chip">+${Math.max(0, xp)} XP</span>
      </div>
      <p class="circle-v5-completion-note">${ended ? "Completion is open. XP releases only when every joined participant confirms." : `${escapeHtml(relativeEnd(row.ends_at))} · Creating or joining earns 0 XP.`}</p>
    `;

    article.querySelectorAll("[data-meetup-action]").forEach((button) => {
      if (button.dataset.permanentDisabled === "true") return;
      button.addEventListener("click", () => handleAction(row, button.dataset.meetupAction));
    });
    return article;
  }

  async function handleAction(row, action) {
    if (state.busy) return;
    setBusy(true);
    try {
      if (action === "join") {
        await rpc("ari_circle_join_meetup", { requested_meetup_id: row.meetup_id });
        showToast("You’re in. XP is earned only after verified completion.");
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
      await Promise.all([loadMeetups(), loadXpSummary()]);
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

    setBusy(true);
    try {
      const id = await rpc("ari_circle_create_meetup", {
        requested_title: clean($("meetupFormTitle")?.value),
        requested_activity: clean($("meetupFormActivity")?.value),
        requested_area: clean($("meetupFormArea")?.value),
        requested_starts_at: starts.toISOString(),
        requested_duration_minutes: Number($("meetupFormDuration")?.value) || 60,
        requested_max_participants: Number($("meetupFormCapacity")?.value) || 8,
        requested_description: clean($("meetupFormDescription")?.value) || null
      });
      $("hostMeetupDialog")?.close();
      $("hostMeetupForm")?.reset();
      setMinimumStartTime();
      showToast("Meetup published. Hosting itself earns 0 XP—completion earns it.");
      state.activity = "";
      syncFilters();
      await loadMeetups();
      if (id) history.replaceState(null, "", `ari-circle-meetup.html?meetup=${encodeURIComponent(id)}`);
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
    $("refreshMeetups")?.addEventListener("click", loadMeetups);
    document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => $(button.dataset.close)?.close()));
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
      setMinimumStartTime();
      $("meetupPage").hidden = false;
      await Promise.all([loadMeetups(), loadXpSummary()]);
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
