/* =============================================================
   ARI CIRCLE — ACTION NETWORK V6 EXPERIENCE LAB
   Intent → worthwhile Opportunities → Places → Crews → Moments.
   Read authority comes from the bounded Ari Circle context endpoint.
   The only mutation here is the signed-in user's own private Action Intent.
============================================================= */
(() => {
  "use strict";

  const VERSION = "0.1.0";
  const $ = (id) => document.getElementById(id);
  const state = {
    client: null,
    user: null,
    context: null,
    busyIntent: false
  };

  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function client() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitForClient(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const found = client();
      if (found?.auth && found?.rpc) return found;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("ARI Circle could not connect right now.");
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    if (!state.user) {
      location.replace("signin.html");
      return false;
    }
    return true;
  }

  async function accessToken() {
    const { data } = await state.client.auth.getSession();
    return clean(data?.session?.access_token, 7000) || null;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function loadContext() {
    const token = await accessToken();
    if (!token) throw new Error("Your ARI session needs to be refreshed.");
    const response = await fetch("/api/ari-vnext-circle-context", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ surface: "circle_v6_experience" }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(clean(data?.error) || "Action Network is unavailable right now.");
    if (data?.locked === true) throw new Error("ARI Circle is unavailable for this account.");
    state.context = data?.available === true ? data : null;
    return state.context;
  }

  function opportunityHref(item = {}) {
    return item?.type === "mission" ? "ari-circle-quests.html" : "ari-circle-meetup.html";
  }

  function dateTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function relativeWindowLabel(intent = {}) {
    const start = dateTime(intent?.timeWindowStart);
    const end = dateTime(intent?.timeWindowEnd);
    return [start, end].filter(Boolean).join(" → ");
  }

  function render() {
    const context = state.context || {};
    renderSummary(context.summary || {});
    renderActiveIntent((context.activeIntents || [])[0] || null);
    renderForYou(context.bestMatches || []);
    renderSchedule(context.schedule || []);
    renderPlaces(context.places || []);
    renderCrews(context.crews || [], context.crewCandidates || []);
    renderMomentsBridge();
  }

  function renderSummary(summary = {}) {
    const node = $("v6NetworkSummary");
    if (!node) return;
    const opportunityCount = Math.max(0, Number(summary.opportunityCount) || 0);
    const matchCount = Math.max(0, Number(summary.bestMatchCount) || 0);
    const crewCount = Math.max(0, Number(summary.activeCrewCount) || 0);
    const parts = [];
    if (matchCount) parts.push(`${matchCount} good fit${matchCount === 1 ? "" : "s"}`);
    if (opportunityCount) parts.push(`${opportunityCount} current opportunit${opportunityCount === 1 ? "y" : "ies"}`);
    if (crewCount) parts.push(`${crewCount} active Crew${crewCount === 1 ? "" : "s"}`);
    node.textContent = parts.length ? parts.join(" · ") : "Tell Circle what you are up for and it will start narrowing the world down.";
  }

  function renderActiveIntent(intent) {
    const node = $("v6ActiveIntent");
    if (!node) return;
    node.replaceChildren();
    if (!intent) {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    const activity = clean(intent.activity) || "anything";
    const area = clean(intent.area);
    const group = [intent.desiredGroupMin, intent.desiredGroupMax].filter((value) => Number.isFinite(Number(value))).join("–");
    node.innerHTML = `
      <div class="v6-intent-live__copy">
        <span class="v6-eyebrow">ACTIVE INTENT</span>
        <strong>${escapeHtml(activityLabel(activity))}</strong>
        <span>${escapeHtml(relativeWindowLabel(intent))}${area ? ` · ${escapeHtml(area)}` : ""}${group ? ` · ${escapeHtml(group)} people` : ""}</span>
      </div>
      <button class="v6-quiet-button" id="v6CancelIntent" type="button">Clear</button>
    `;
    $("v6CancelIntent")?.addEventListener("click", () => cancelIntent(intent.intentId));
  }

  function renderForYou(matches = []) {
    const list = $("v6ForYouList");
    const empty = $("v6ForYouEmpty");
    if (!list || !empty) return;
    list.replaceChildren();
    const rows = matches.slice(0, 6);
    empty.hidden = rows.length > 0;
    rows.forEach((item, index) => list.append(opportunityCard(item, index === 0)));
  }

  function opportunityCard(item = {}, featured = false) {
    const article = document.createElement("article");
    article.className = `v6-opportunity${featured ? " is-featured" : ""}`;
    const mission = item?.type === "mission";
    const reasons = Array.isArray(item?.matchReasons) ? item.matchReasons.slice(0, 3) : [];
    const missionProgress = Number(item?.mission?.progressPercent);
    const spots = Number(item?.spotsRemaining);
    const meta = [
      clean(item?.area),
      item?.startsAt ? dateTime(item.startsAt) : "",
      Number.isFinite(spots) ? `${Math.max(0, Math.trunc(spots))} open` : "",
      mission && Number.isFinite(missionProgress) ? `${Math.max(0, Math.min(100, Math.round(missionProgress)))}% complete` : ""
    ].filter(Boolean);

    article.innerHTML = `
      <div class="v6-card-topline">
        <span class="v6-eyebrow">${mission ? "MISSION" : "MEET UP"} · ${escapeHtml(activityLabel(item?.activity))}</span>
        ${featured ? '<span class="v6-fit-pill">BEST FIT</span>' : ""}
      </div>
      <h3>${escapeHtml(item?.title || "Opportunity")}</h3>
      <div class="v6-meta">${meta.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
      ${reasons.length ? `<div class="v6-reasons">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>` : ""}
      <a class="v6-primary-link" href="${opportunityHref(item)}">Open</a>
    `;
    return article;
  }

  function renderSchedule(schedule = []) {
    const list = $("v6ScheduleList");
    const empty = $("v6ScheduleEmpty");
    if (!list || !empty) return;
    list.replaceChildren();
    const rows = schedule.slice(0, 4);
    empty.hidden = rows.length > 0;
    rows.forEach((item) => {
      const link = document.createElement("a");
      link.className = "v6-schedule-row";
      link.href = opportunityHref(item);
      link.innerHTML = `
        <span><strong>${escapeHtml(item?.title || "Scheduled activity")}</strong><small>${escapeHtml(dateTime(item?.startsAt) || clean(item?.viewerState))}</small></span>
        <span aria-hidden="true">›</span>
      `;
      list.append(link);
    });
  }

  function renderPlaces(places = []) {
    const list = $("v6PlaceList");
    const empty = $("v6PlaceEmpty");
    if (!list || !empty) return;
    list.replaceChildren();
    const rows = places.slice(0, 4);
    empty.hidden = rows.length > 0;
    rows.forEach((place) => {
      const card = document.createElement("article");
      card.className = "v6-place";
      const tags = Array.isArray(place?.activityTags) ? place.activityTags.slice(0, 4) : [];
      const distance = Number(place?.distanceMiles);
      card.innerHTML = `
        <span class="v6-eyebrow">${escapeHtml(placeTypeLabel(place?.type))}</span>
        <h3>${escapeHtml(place?.name || "Public place")}</h3>
        <p>${escapeHtml(clean(place?.area) || [place?.city, place?.region].filter(Boolean).join(", "))}</p>
        <div class="v6-meta">
          ${Number.isFinite(distance) ? `<span>${distance.toFixed(1)} mi from your intent area</span>` : ""}
          ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
      `;
      list.append(card);
    });
  }

  function renderCrews(crews = [], candidates = []) {
    const inviteList = $("v6CrewInviteList");
    const crewList = $("v6CrewList");
    const candidateList = $("v6CrewCandidateList");
    const empty = $("v6CrewEmpty");
    if (!inviteList || !crewList || !candidateList || !empty) return;
    inviteList.replaceChildren();
    crewList.replaceChildren();
    candidateList.replaceChildren();

    const invites = crews.filter((crew) => crew?.viewerStatus === "invited");
    const active = crews.filter((crew) => crew?.viewerStatus === "active");
    const earned = candidates.filter((candidate) => Number(candidate?.completedTogether) >= 2);

    invites.forEach((crew) => inviteList.append(crewCard(crew, "INVITATION")));
    active.forEach((crew) => crewList.append(crewCard(crew, crew?.status === "active" ? "CREW" : "FORMING")));
    earned.slice(0, 3).forEach((candidate) => candidateList.append(crewCandidateCard(candidate)));
    empty.hidden = invites.length + active.length + earned.length > 0;
  }

  function crewCard(crew = {}, kicker = "CREW") {
    const article = document.createElement("article");
    article.className = "v6-crew-card";
    const members = Array.isArray(crew?.members) ? crew.members : [];
    const names = members.map((member) => clean(member?.displayName || member?.handle)).filter(Boolean).slice(0, 5);
    article.innerHTML = `
      <div class="v6-card-topline"><span class="v6-eyebrow">${escapeHtml(kicker)}</span><span class="v6-fit-pill">${escapeHtml(clean(crew?.viewerStatus || crew?.status))}</span></div>
      <h3>${escapeHtml(crew?.name || "Your Crew")}</h3>
      ${names.length ? `<p>${escapeHtml(names.join(" · "))}</p>` : ""}
      <div class="v6-meta">
        <span>${Math.max(0, Number(crew?.completedActivityCount) || 0)} shared activities</span>
        <span>${Math.max(0, Number(crew?.activeMemberCount) || 0)} active</span>
      </div>
      ${crew?.viewerStatus === "invited" ? '<p class="v6-note">Ari can help you accept or decline this invitation.</p>' : ""}
    `;
    return article;
  }

  function crewCandidateCard(candidate = {}) {
    const article = document.createElement("article");
    article.className = "v6-crew-card is-candidate";
    const members = Array.isArray(candidate?.members) ? candidate.members : [];
    const names = members
      .filter((member) => member?.isViewer !== true)
      .map((member) => clean(member?.displayName || member?.handle))
      .filter(Boolean)
      .slice(0, 4);
    const count = Math.max(0, Number(candidate?.completedTogether) || 0);
    article.innerHTML = `
      <div class="v6-card-topline"><span class="v6-eyebrow">CREW CANDIDATE</span><span class="v6-fit-pill">EARNED</span></div>
      <h3>${count} activities together</h3>
      ${names.length ? `<p>${escapeHtml(names.join(" · "))}</p>` : ""}
      ${clean(candidate?.topActivity) ? `<div class="v6-meta"><span>${escapeHtml(activityLabel(candidate.topActivity))}</span></div>` : ""}
      <p class="v6-note">Repeated real-world activity made this group eligible. Ari can explain why before you decide whether to create a Crew.</p>
    `;
    return article;
  }

  function renderMomentsBridge() {
    const node = $("v6MomentsBridge");
    if (!node) return;
    node.innerHTML = `
      <div>
        <span class="v6-eyebrow">MOMENTS</span>
        <h2>Share what actually happened.</h2>
        <p>Moments stay downstream of real life: activity first, content second.</p>
      </div>
      <a class="v6-primary-link" href="ari-circle-feed.html">Open Moments</a>
    `;
  }

  async function submitIntent(event) {
    event.preventDefault();
    if (state.busyIntent) return;
    const activity = clean($("v6IntentActivity")?.value).toLowerCase() || "any";
    const preset = clean($("v6IntentWhen")?.value) || "next3h";
    const area = clean($("v6IntentArea")?.value).slice(0, 100) || null;
    const group = clean($("v6IntentGroup")?.value) || "1-8";
    const [groupMin, groupMax] = group.split("-").map((value) => Number(value));
    const window = intentWindow(preset);
    const button = $("v6IntentSubmit");
    const status = $("v6IntentStatus");

    state.busyIntent = true;
    if (button) button.disabled = true;
    if (status) status.textContent = "Finding your window…";
    try {
      await rpc("ari_circle_create_action_intent", {
        requested_activity: activity,
        requested_time_window_start: window.start.toISOString(),
        requested_time_window_end: window.end.toISOString(),
        requested_experience_level: "any",
        requested_intensity: "any",
        requested_group_min: groupMin,
        requested_group_max: groupMax,
        requested_area: area,
        requested_radius_miles: 25,
        requested_note: null,
        requested_latitude: null,
        requested_longitude: null
      });
      if (status) status.textContent = "Intent saved. Re-ranking what is worth doing…";
      await loadContext();
      render();
      if (status) status.textContent = "";
    } catch (error) {
      if (status) status.textContent = clean(error?.message) || "That intent could not be saved.";
    } finally {
      state.busyIntent = false;
      if (button) button.disabled = false;
    }
  }

  async function cancelIntent(intentId) {
    const id = clean(intentId);
    if (!id || state.busyIntent) return;
    const status = $("v6IntentStatus");
    state.busyIntent = true;
    try {
      await rpc("ari_circle_cancel_action_intent", { requested_intent_id: id });
      if (status) status.textContent = "Intent cleared.";
      await loadContext();
      render();
    } catch (error) {
      if (status) status.textContent = clean(error?.message) || "That intent could not be cleared.";
    } finally {
      state.busyIntent = false;
    }
  }

  function intentWindow(preset) {
    const now = new Date();
    if (preset === "tomorrow_evening") {
      const start = new Date(now);
      start.setDate(start.getDate() + 1);
      start.setHours(17, 0, 0, 0);
      const end = new Date(start);
      end.setHours(21, 0, 0, 0);
      return { start, end };
    }
    if (preset === "weekend") {
      const start = new Date(now);
      const day = start.getDay();
      const daysToSaturday = (6 - day + 7) % 7;
      start.setDate(start.getDate() + daysToSaturday);
      start.setHours(daysToSaturday === 0 ? Math.max(start.getHours(), 7) : 7, 0, 0, 0);
      if (start.getTime() <= now.getTime() + 10 * 60 * 1000) start.setTime(now.getTime() + 15 * 60 * 1000);
      const end = new Date(start);
      const remainingToSunday = (7 - end.getDay()) % 7;
      end.setDate(end.getDate() + remainingToSunday);
      end.setHours(20, 0, 0, 0);
      if (end <= start) end.setTime(start.getTime() + 8 * 60 * 60 * 1000);
      return { start, end };
    }
    if (preset === "next7d") {
      const start = new Date(now.getTime() + 15 * 60 * 1000);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    }
    const start = new Date(now.getTime() + 15 * 60 * 1000);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return { start, end };
  }

  function activityLabel(value) {
    const text = clean(value || "activity").replaceAll("_", " ");
    return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function placeTypeLabel(value) {
    return activityLabel(clean(value || "public place"));
  }

  function bind() {
    $("v6IntentForm")?.addEventListener("submit", submitIntent);
    $("v6Refresh")?.addEventListener("click", async () => {
      const button = $("v6Refresh");
      if (button) button.disabled = true;
      try {
        await loadContext();
        render();
      } catch (error) {
        const status = $("v6PageStatus");
        if (status) status.textContent = clean(error?.message) || "Could not refresh Circle.";
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  async function boot() {
    const status = $("v6PageStatus");
    try {
      state.client = await waitForClient();
      if (!(await requireUser())) return;
      bind();
      await loadContext();
      render();
      $("v6Page")?.removeAttribute("hidden");
      if (status) status.textContent = "";
    } catch (error) {
      console.error("[ARI Circle V6]", error);
      $("v6Page")?.removeAttribute("hidden");
      if (status) status.textContent = clean(error?.message) || "The Action Network lab is unavailable right now.";
    }
  }

  window.AriCircleActionNetworkV6 = Object.freeze({ version: VERSION, refresh: loadContext });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();