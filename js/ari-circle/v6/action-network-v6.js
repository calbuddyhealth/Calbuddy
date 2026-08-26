/* =============================================================
   ARI CIRCLE — ACTION NETWORK V6 EXPERIENCE LAB
   Intent → worthwhile Opportunities → Places → Crews → Moments.
   Read authority comes from the bounded Ari Circle context endpoint.
   Mutations are limited to the signed-in user's private Action Intents and
   guarded Crew lifecycle RPCs. No direct table access or service-role use.
============================================================= */
(() => {
  "use strict";

  const VERSION = "0.3.0";
  const $ = (id) => document.getElementById(id);
  const ALLOWED_RADIUS_MILES = new Set([5, 10, 25, 50, 100]);
  const state = {
    client: null,
    user: null,
    context: null,
    busyIntent: false,
    busyCrew: new Set(),
    crewCreateOperationIds: new Map()
  };

  const clean = (value, max = 1000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
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
    if (data?.available !== true) {
      const code = clean(data?.code, 120);
      throw new Error(code === "ACTION_NETWORK_NOT_MIGRATED"
        ? "The Action Network lab is staged, but its Circle database layer is not active in this environment yet."
        : "The Action Network is unavailable right now.");
    }

    state.context = data;
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
    renderActiveIntents(context.activeIntents || []);
    renderAttention(context.actionableEvents || [], context.summary || {});
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
    const inviteCount = Math.max(0, Number(summary.crewInviteCount) || 0);
    const parts = [];
    if (matchCount) parts.push(`${matchCount} good fit${matchCount === 1 ? "" : "s"}`);
    if (opportunityCount) parts.push(`${opportunityCount} current opportunit${opportunityCount === 1 ? "y" : "ies"}`);
    if (crewCount) parts.push(`${crewCount} active Crew${crewCount === 1 ? "" : "s"}`);
    if (inviteCount) parts.push(`${inviteCount} Crew invite${inviteCount === 1 ? "" : "s"}`);
    node.textContent = parts.length
      ? parts.join(" · ")
      : "Tell Circle what you are up for and it will start narrowing the world down.";
  }

  function renderActiveIntents(intents = []) {
    const node = $("v6ActiveIntent");
    if (!node) return;
    node.replaceChildren();

    const rows = Array.isArray(intents) ? intents.slice(0, 3) : [];
    if (!rows.length) {
      node.hidden = true;
      return;
    }

    const radiusControl = $("v6IntentRadius");
    const preferredRadius = Number(rows[0]?.radiusMiles);
    if (radiusControl && ALLOWED_RADIUS_MILES.has(preferredRadius)) {
      radiusControl.value = String(preferredRadius);
    }

    node.hidden = false;
    node.classList.toggle("has-multiple", rows.length > 1);
    rows.forEach((intent) => {
      const row = document.createElement("div");
      row.className = "v6-intent-live__row";
      const activity = clean(intent?.activity) || "anything";
      const area = clean(intent?.area);
      const group = [intent?.desiredGroupMin, intent?.desiredGroupMax]
        .filter((value) => Number.isFinite(Number(value)))
        .join("–");
      const radius = Number(intent?.radiusMiles);
      const radiusLabel = ALLOWED_RADIUS_MILES.has(radius) ? `${radius} mi` : "";

      row.innerHTML = `
        <div class="v6-intent-live__copy">
          <span class="v6-eyebrow">ACTIVE INTENT</span>
          <strong>${escapeHtml(activityLabel(activity))}</strong>
          <span>${escapeHtml(relativeWindowLabel(intent))}${area ? ` · ${escapeHtml(area)}` : ""}${group ? ` · ${escapeHtml(group)} people` : ""}${radiusLabel ? ` · within ${escapeHtml(radiusLabel)}` : ""}</span>
        </div>
      `;

      const clear = document.createElement("button");
      clear.className = "v6-quiet-button";
      clear.type = "button";
      clear.textContent = "Clear";
      clear.setAttribute("aria-label", `Clear ${activityLabel(activity)} intent`);
      clear.addEventListener("click", () => cancelIntent(intent?.intentId, clear));
      row.append(clear);
      node.append(row);
    });
  }

  function renderAttention(events = [], summary = {}) {
    const section = $("v6Attention");
    const list = $("v6AttentionList");
    if (!section || !list) return;

    list.replaceChildren();
    const items = [];
    const hostPending = Math.max(0, Number(summary?.hostPendingRequestCount) || 0);
    if (hostPending) {
      items.push({
        key: "host-requests",
        label: `${hostPending} meetup request${hostPending === 1 ? "" : "s"} waiting for you`,
        detail: "Open Meet Up to review the people asking to join.",
        href: "ari-circle-meetup.html"
      });
    }

    for (const event of Array.isArray(events) ? events : []) {
      const mapped = attentionItem(event);
      if (mapped) items.push(mapped);
    }

    const unique = [];
    const seen = new Set();
    for (const item of items) {
      if (!item?.key || seen.has(item.key)) continue;
      seen.add(item.key);
      unique.push(item);
      if (unique.length >= 5) break;
    }

    section.hidden = unique.length === 0;
    for (const item of unique) {
      const link = document.createElement("a");
      link.className = "v6-attention-row";
      link.href = item.href;
      link.innerHTML = `
        <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail)}</small></span>
        <span aria-hidden="true">›</span>
      `;
      list.append(link);
    }
  }

  function attentionItem(event = {}) {
    const type = clean(event?.type, 80).toLowerCase();
    const actor = clean(event?.actor?.displayName || event?.actor?.handle, 80);
    const who = actor || "The host";
    const base = {
      key: clean(event?.eventId, 160) || `${type}:${clean(event?.subjectId, 160)}`,
      href: type.startsWith("mission.") ? "ari-circle-quests.html" : "ari-circle-meetup.html"
    };

    if (type === "meetup.accepted") return { ...base, label: `${who} accepted your meetup request`, detail: "Review the meetup and your upcoming schedule." };
    if (type === "meetup.cancelled") return { ...base, label: "A meetup you were attending was cancelled", detail: "Open Meet Up to choose what to do next." };
    if (type === "meetup.waitlisted") return { ...base, label: "Your meetup request moved to the waitlist", detail: "Your status changed; other current fits remain available." };
    if (type === "meetup.declined") return { ...base, label: "A meetup request was not accepted", detail: "Open For You or Explore for another option." };
    if (type === "meetup.requested") return { ...base, label: "Someone requested a spot in your meetup", detail: "Open Meet Up to review the request." };
    if (type === "mission.progress_submitted") return { ...base, label: "Mission progress needs review", detail: "Open Missions to review the submitted progress." };
    if (type === "mission.progress_rejected") return { ...base, label: "Mission progress was not verified", detail: "Review the current Mission state before submitting anything else." };
    if (type === "mission.progress_verified") return { ...base, label: "Your Mission progress was verified", detail: "Open Missions to see where the objective stands." };
    if (type === "mission.objective_reached") return { ...base, label: "A Mission reached its objective", detail: "See the verified result and what the group accomplished." };
    if (type === "meetup.spot_opened") return { ...base, label: "A spot opened in one of your current matches", detail: "Review why it fits before deciding whether to join." };
    if (type === "crew.invited") return { ...base, label: "You have a Crew invitation", detail: "Review the Crew below before accepting or declining.", href: "#crews" };
    return null;
  }

  function renderForYou(matches = []) {
    const list = $("v6ForYouList");
    const empty = $("v6ForYouEmpty");
    if (!list || !empty) return;
    list.replaceChildren();
    const rows = (Array.isArray(matches) ? matches : []).slice(0, 6);
    empty.hidden = rows.length > 0;
    rows.forEach((item, index) => list.append(opportunityCard(item, index === 0)));
  }

  function opportunityCard(item = {}, featured = false) {
    const article = document.createElement("article");
    article.className = `v6-opportunity${featured ? " is-featured" : ""}`;
    const mission = item?.type === "mission";
    const reasons = Array.isArray(item?.matchReasons) ? item.matchReasons.slice(0, 3) : [];
    const missionProgress = Number(item?.mission?.progressPercent);
    const spots = item?.spotsRemaining === null || item?.spotsRemaining === undefined ? null : Number(item.spotsRemaining);
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
    const rows = (Array.isArray(schedule) ? schedule : []).slice(0, 4);
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
    const rows = (Array.isArray(places) ? places : []).slice(0, 4);
    empty.hidden = rows.length > 0;
    rows.forEach((place) => {
      const card = document.createElement("article");
      card.className = "v6-place";
      const tags = Array.isArray(place?.activityTags) ? place.activityTags.slice(0, 4) : [];
      const distance = place?.distanceMiles === null || place?.distanceMiles === undefined ? null : Number(place.distanceMiles);
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

    const safeCrews = Array.isArray(crews) ? crews : [];
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const invites = safeCrews.filter((crew) => crew?.viewerStatus === "invited");
    const active = safeCrews.filter((crew) => crew?.viewerStatus === "active" && crew?.status !== "archived");
    const earned = safeCandidates.filter((candidate) => Number(candidate?.completedTogether) >= 2);

    invites.forEach((crew) => inviteList.append(crewCard(crew, "INVITATION")));
    active.forEach((crew) => crewList.append(crewCard(crew, crew?.status === "active" ? "CREW" : "FORMING")));
    earned.slice(0, 3).forEach((candidate) => candidateList.append(crewCandidateCard(candidate)));

    toggleSubsection(inviteList, invites.length > 0);
    toggleSubsection(crewList, active.length > 0);
    toggleSubsection(candidateList, earned.length > 0);
    empty.hidden = invites.length + active.length + earned.length > 0;
  }

  function toggleSubsection(list, visible) {
    const section = list?.closest?.(".v6-subsection");
    if (section) section.hidden = !visible;
  }

  function crewCard(crew = {}, kicker = "CREW") {
    const article = document.createElement("article");
    article.className = "v6-crew-card";
    const crewId = clean(crew?.crewId, 120);
    const members = Array.isArray(crew?.members) ? crew.members : [];
    const names = members.map((member) => clean(member?.displayName || member?.handle, 80)).filter(Boolean).slice(0, 5);

    article.innerHTML = `
      <div class="v6-card-topline"><span class="v6-eyebrow">${escapeHtml(kicker)}</span><span class="v6-fit-pill">${escapeHtml(clean(crew?.viewerStatus || crew?.status))}</span></div>
      <h3>${escapeHtml(crew?.name || "Your Crew")}</h3>
      ${names.length ? `<p>${escapeHtml(names.join(" · "))}</p>` : ""}
      <div class="v6-meta">
        <span>${Math.max(0, Number(crew?.completedActivityCount) || 0)} shared activities</span>
        <span>${Math.max(0, Number(crew?.activeMemberCount) || 0)} active</span>
      </div>
      <p class="v6-card-status" role="status" aria-live="polite"></p>
    `;

    const actions = document.createElement("div");
    actions.className = "v6-card-actions";

    if (crew?.viewerStatus === "invited" && crewId) {
      actions.append(
        crewActionButton("Accept", "primary", () => respondCrewInvite(crewId, true, article)),
        crewActionButton("Decline", "quiet", () => respondCrewInvite(crewId, false, article))
      );
    } else if (crew?.viewerStatus === "active" && crewId) {
      if (crew?.viewerRole === "owner") {
        actions.append(crewActionButton("Archive Crew", "danger", () => archiveCrew(crewId, crew?.name, article)));
      } else {
        actions.append(crewActionButton("Leave Crew", "quiet", () => leaveCrew(crewId, crew?.name, article)));
      }
    }

    if (actions.childElementCount) article.append(actions);
    return article;
  }

  function crewActionButton(label, kind, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = kind === "primary"
      ? "v6-card-action is-primary"
      : kind === "danger"
        ? "v6-card-action is-danger"
        : "v6-card-action";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function crewCandidateCard(candidate = {}) {
    const article = document.createElement("article");
    article.className = "v6-crew-card is-candidate";
    const candidateKey = clean(candidate?.candidateKey, 64).toLowerCase();
    const members = Array.isArray(candidate?.members) ? candidate.members : [];
    const names = members
      .filter((member) => member?.isViewer !== true)
      .map((member) => clean(member?.displayName || member?.handle, 80))
      .filter(Boolean)
      .slice(0, 4);
    const count = Math.max(0, Number(candidate?.completedTogether) || 0);

    article.innerHTML = `
      <div class="v6-card-topline"><span class="v6-eyebrow">CREW CANDIDATE</span><span class="v6-fit-pill">EARNED</span></div>
      <h3>${count} activities together</h3>
      ${names.length ? `<p>${escapeHtml(names.join(" · "))}</p>` : ""}
      ${clean(candidate?.topActivity) ? `<div class="v6-meta"><span>${escapeHtml(activityLabel(candidate.topActivity))}</span></div>` : ""}
      <p class="v6-note">Repeated real-world activity made this group eligible. Creating a Crew sends invitations; nobody is silently added.</p>
      <p class="v6-card-status" role="status" aria-live="polite"></p>
    `;

    if (/^[0-9a-f]{32}$/.test(candidateKey)) {
      const form = document.createElement("form");
      form.className = "v6-crew-create";
      const input = document.createElement("input");
      input.className = "circle-v5-input";
      input.maxLength = 60;
      input.minLength = 3;
      input.required = true;
      input.placeholder = crewNameSuggestion(candidate);
      input.setAttribute("aria-label", "Crew name");
      const button = document.createElement("button");
      button.type = "submit";
      button.className = "v6-card-action is-primary";
      button.textContent = "Create Crew";
      form.append(input, button);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = clean(input.value || input.placeholder, 60);
        createCrew(candidateKey, name, article, button);
      });
      article.append(form);
    }

    return article;
  }

  function crewNameSuggestion(candidate = {}) {
    const activity = clean(candidate?.topActivity, 40);
    return activity ? `${activityLabel(activity)} Crew` : "My Crew";
  }

  async function respondCrewInvite(crewId, accept, article) {
    const key = `respond:${crewId}`;
    if (!crewId || state.busyCrew.has(key)) return;
    if (!accept && !window.confirm("Decline this Crew invitation?")) return;
    state.busyCrew.add(key);
    setCrewCardBusy(article, true);
    setCrewCardStatus(article, accept ? "Accepting invitation…" : "Declining invitation…");
    try {
      await rpc("ari_circle_respond_crew_invite", {
        requested_crew_id: crewId,
        requested_accept: accept
      });
      await refreshAfterCircleMutation(accept ? "Crew invitation accepted." : "Crew invitation declined.");
    } catch (error) {
      setCrewCardStatus(article, clean(error?.message) || "That Crew invitation could not be updated.");
    } finally {
      state.busyCrew.delete(key);
      setCrewCardBusy(article, false);
    }
  }

  async function leaveCrew(crewId, name, article) {
    const key = `leave:${crewId}`;
    if (!crewId || state.busyCrew.has(key)) return;
    if (!window.confirm(`Leave ${clean(name, 60) || "this Crew"}?`)) return;
    state.busyCrew.add(key);
    setCrewCardBusy(article, true);
    setCrewCardStatus(article, "Leaving Crew…");
    try {
      await rpc("ari_circle_leave_crew", { requested_crew_id: crewId });
      await refreshAfterCircleMutation("You left the Crew.");
    } catch (error) {
      setCrewCardStatus(article, clean(error?.message) || "You could not leave this Crew.");
    } finally {
      state.busyCrew.delete(key);
      setCrewCardBusy(article, false);
    }
  }

  async function archiveCrew(crewId, name, article) {
    const key = `archive:${crewId}`;
    if (!crewId || state.busyCrew.has(key)) return;
    if (!window.confirm(`Archive ${clean(name, 60) || "this Crew"}? Members will keep the shared history, but the Crew will no longer be active.`)) return;
    state.busyCrew.add(key);
    setCrewCardBusy(article, true);
    setCrewCardStatus(article, "Archiving Crew…");
    try {
      await rpc("ari_circle_archive_crew", { requested_crew_id: crewId });
      await refreshAfterCircleMutation("Crew archived.");
    } catch (error) {
      setCrewCardStatus(article, clean(error?.message) || "This Crew could not be archived.");
    } finally {
      state.busyCrew.delete(key);
      setCrewCardBusy(article, false);
    }
  }

  async function createCrew(candidateKey, name, article, button) {
    const key = `create:${candidateKey}`;
    if (!/^[0-9a-f]{32}$/.test(candidateKey) || state.busyCrew.has(key)) return;
    if (name.length < 3 || name.length > 60) {
      setCrewCardStatus(article, "Crew name must be 3 to 60 characters.");
      return;
    }

    state.busyCrew.add(key);
    setCrewCardBusy(article, true);
    if (button) button.disabled = true;
    setCrewCardStatus(article, "Creating Crew and preparing invitations…");
    const operationId = crewOperationId(candidateKey);

    try {
      await rpc("ari_circle_create_crew", {
        requested_candidate_key: candidateKey,
        requested_name: name,
        requested_operation_id: operationId
      });
      state.crewCreateOperationIds.delete(candidateKey);
      await refreshAfterCircleMutation("Crew created. The other founding members were invited.");
    } catch (error) {
      setCrewCardStatus(article, clean(error?.message) || "This Crew could not be created.");
    } finally {
      state.busyCrew.delete(key);
      setCrewCardBusy(article, false);
      if (button) button.disabled = false;
    }
  }

  function crewOperationId(candidateKey) {
    if (state.crewCreateOperationIds.has(candidateKey)) return state.crewCreateOperationIds.get(candidateKey);
    const id = stableUuid();
    state.crewCreateOperationIds.set(candidateKey, id);
    return id;
  }

  function stableUuid() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch {}
    const bytes = new Uint8Array(16);
    try {
      globalThis.crypto?.getRandomValues?.(bytes);
    } catch {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function setCrewCardStatus(article, text) {
    const node = article?.querySelector?.(".v6-card-status");
    if (node) node.textContent = clean(text, 300);
  }

  function setCrewCardBusy(article, busy) {
    article?.querySelectorAll?.("button,input")?.forEach((node) => {
      node.disabled = Boolean(busy);
    });
  }

  async function refreshAfterCircleMutation(message = "") {
    window.dispatchEvent(new CustomEvent("ari:circleChanged", { detail: { source: "circle_v6_experience" } }));
    await loadContext();
    render();
    const status = $("v6PageStatus");
    if (status) status.textContent = message;
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
    const activity = clean($("v6IntentActivity")?.value, 40).toLowerCase() || "any";
    const preset = clean($("v6IntentWhen")?.value, 40) || "next3h";
    const area = clean($("v6IntentArea")?.value, 100) || null;
    const group = clean($("v6IntentGroup")?.value, 20) || "1-8";
    const radius = Number(clean($("v6IntentRadius")?.value, 8) || "25");
    const [groupMin, groupMax] = group.split("-").map((value) => Number(value));
    const window = intentWindow(preset);
    const button = $("v6IntentSubmit");
    const status = $("v6IntentStatus");

    if (!Number.isInteger(groupMin) || !Number.isInteger(groupMax) || groupMin < 1 || groupMax < groupMin) {
      if (status) status.textContent = "Choose a valid group size.";
      return;
    }

    if (!ALLOWED_RADIUS_MILES.has(radius)) {
      if (status) status.textContent = "Choose a valid search distance.";
      return;
    }

    state.busyIntent = true;
    if (button) button.disabled = true;
    if (status) status.textContent = "Finding what fits…";
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
        requested_radius_miles: radius,
        requested_note: null,
        requested_latitude: null,
        requested_longitude: null
      });
      window.dispatchEvent(new CustomEvent("ari:circleChanged", { detail: { source: "circle_v6_intent" } }));
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

  async function cancelIntent(intentId, button = null) {
    const id = clean(intentId, 120);
    if (!id || state.busyIntent) return;
    const status = $("v6IntentStatus");
    state.busyIntent = true;
    if (button) button.disabled = true;
    try {
      await rpc("ari_circle_cancel_action_intent", { requested_intent_id: id });
      window.dispatchEvent(new CustomEvent("ari:circleChanged", { detail: { source: "circle_v6_intent" } }));
      if (status) status.textContent = "Intent cleared.";
      await loadContext();
      render();
    } catch (error) {
      if (status) status.textContent = clean(error?.message) || "That intent could not be cleared.";
    } finally {
      state.busyIntent = false;
      if (button) button.disabled = false;
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
    const text = clean(value || "activity", 80).replaceAll("_", " ");
    return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function placeTypeLabel(value) {
    return activityLabel(clean(value || "public place", 80));
  }

  function bind() {
    $("v6IntentForm")?.addEventListener("submit", submitIntent);
    $("v6Refresh")?.addEventListener("click", async () => {
      const button = $("v6Refresh");
      const status = $("v6PageStatus");
      if (button) button.disabled = true;
      try {
        await loadContext();
        render();
        if (status) status.textContent = "";
      } catch (error) {
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

  window.AriCircleActionNetworkV6 = Object.freeze({
    version: VERSION,
    refresh: async () => {
      const context = await loadContext();
      render();
      return context;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();