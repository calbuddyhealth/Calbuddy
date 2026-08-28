/* =============================================================
   ARI CIRCLE — INTENT BUNDLES V1
   V6 composition:
   private Action Intent → compatible people + public place + current opportunity.
   This layer can hand a one-time draft to the canonical Meet Up host form, but
   never auto-invites, auto-joins, or mutates meetup membership itself.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const DRAFT_STORAGE_KEY = "ariCircleMatchedMeetupDraftV1";
  const MAX_INTENTS = 2;
  const MAX_PEOPLE = 3;
  const state = { client: null, busy: false, refreshTimer: null };

  const $ = (id) => document.getElementById(id);
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
    throw new Error("Circle matching is unavailable right now.");
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    return Boolean(data?.user);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function activityLabel(value) {
    return clean(value || "activity", 80)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  function opportunityHref(row = {}) {
    return clean(row?.opportunity_type, 20) === "mission"
      ? "ari-circle-quests.html"
      : "ari-circle-meetup.html";
  }

  function profileHref(person = {}) {
    const handle = clean(person?.handle, 80).replace(/^@+/, "");
    return handle ? `ari-circle.html?handle=${encodeURIComponent(handle)}` : "ari-circle.html";
  }

  function normalizeIntent(row = {}) {
    return {
      intentId: clean(row?.intent_id, 120),
      activity: clean(row?.activity, 40) || "any",
      area: clean(row?.area, 100),
      startsAt: row?.time_window_start || null,
      endsAt: row?.time_window_end || null,
      desiredGroupMin: Math.max(1, Number(row?.desired_group_min) || 1),
      desiredGroupMax: Math.max(1, Number(row?.desired_group_max) || 8)
    };
  }

  async function bundleForIntent(intent) {
    const [people, opportunities, places] = await Promise.all([
      rpc("ari_circle_match_people_for_intent", {
        requested_intent_id: intent.intentId,
        result_limit: MAX_PEOPLE
      }),
      rpc("ari_circle_match_opportunities", {
        requested_intent_id: intent.intentId,
        result_limit: 3
      }),
      rpc("ari_circle_list_places_for_intent", {
        requested_intent_id: intent.intentId,
        result_limit: 3
      })
    ]);

    return {
      intent,
      people: people.slice(0, MAX_PEOPLE),
      opportunity: opportunities[0] || null,
      place: places[0] || null
    };
  }

  async function loadBundles() {
    if (state.busy) return;
    const section = $("v6IntentBundles");
    const list = $("v6IntentBundleList");
    const status = $("v6IntentBundleStatus");
    if (!section || !list) return;

    state.busy = true;
    if (status) status.textContent = "Matching people, place, and time…";

    try {
      const intentsRaw = await rpc("ari_circle_list_my_action_intents", {
        include_inactive: false,
        result_limit: MAX_INTENTS
      });
      const intents = intentsRaw.map(normalizeIntent).filter((intent) => intent.intentId).slice(0, MAX_INTENTS);

      if (!intents.length) {
        list.replaceChildren();
        section.hidden = true;
        if (status) status.textContent = "";
        return;
      }

      const bundles = await Promise.all(intents.map(bundleForIntent));
      renderBundles(bundles);
      section.hidden = false;
      if (status) status.textContent = "";
    } catch (error) {
      console.warn("[ARI Circle Intent Bundles]", error);
      list.replaceChildren();
      section.hidden = false;
      if (status) status.textContent = clean(error?.message, 240) || "Could not assemble your current matches.";
    } finally {
      state.busy = false;
    }
  }

  function renderBundles(bundles = []) {
    const list = $("v6IntentBundleList");
    if (!list) return;
    list.replaceChildren();

    for (const bundle of bundles) {
      list.append(bundleCard(bundle));
    }
  }

  function bundleCard(bundle = {}) {
    const { intent = {}, people = [], opportunity = null, place = null } = bundle;
    const article = document.createElement("article");
    article.className = "v6-intent-bundle";

    const opportunityTitle = clean(opportunity?.title, 120);
    const placeName = clean(place?.place_name, 120);
    const timeLabel = [dateTime(intent?.startsAt), dateTime(intent?.endsAt)].filter(Boolean).join(" → ");
    const reasons = Array.isArray(opportunity?.match_reasons) ? opportunity.match_reasons.slice(0, 2) : [];

    article.innerHTML = `
      <div class="v6-card-topline">
        <span class="v6-eyebrow">ARI MATCHED PLAN · ${escapeHtml(activityLabel(intent?.activity))}</span>
        <span class="v6-fit-pill">SUGGESTED</span>
      </div>
      <h3>${escapeHtml(opportunityTitle || `${activityLabel(intent?.activity)} around your intent`)}</h3>
      <div class="v6-bundle-facts">
        ${timeLabel ? `<div><span>WHEN</span><strong>${escapeHtml(timeLabel)}</strong></div>` : ""}
        ${placeName ? `<div><span>WHERE</span><strong>${escapeHtml(placeName)}</strong><small>${escapeHtml(clean(place?.area, 100) || [place?.city, place?.region].filter(Boolean).join(", "))}</small></div>` : ""}
        ${opportunityTitle ? `<div><span>WHAT</span><strong>${escapeHtml(opportunityTitle)}</strong><small>${escapeHtml(clean(opportunity?.area, 100))}</small></div>` : ""}
      </div>
      ${reasons.length ? `<div class="v6-reasons">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>` : ""}
      <div class="v6-bundle-people" data-bundle-people></div>
      <p class="v6-bundle-disclosure">People shown here are compatibility suggestions only. They are not invited, accepted, or assumed to be attending.</p>
      <div class="v6-card-actions" data-bundle-actions></div>
    `;

    const peopleNode = article.querySelector("[data-bundle-people]");
    if (peopleNode) renderPeople(peopleNode, people);

    const actions = article.querySelector("[data-bundle-actions]");
    if (actions) renderBundleActions(actions, bundle);

    return article;
  }

  function renderBundleActions(actions, bundle = {}) {
    const opportunity = bundle?.opportunity || null;
    const opportunityTitle = clean(opportunity?.title, 120);
    const opportunityType = clean(opportunity?.opportunity_type, 20).toLowerCase();

    if (opportunityTitle && opportunityType === "meetup") {
      const open = document.createElement("a");
      open.className = "v6-card-action is-primary";
      open.href = opportunityHref(opportunity);
      open.textContent = "Open existing meetup";
      actions.append(open);

      const host = document.createElement("button");
      host.className = "v6-card-action";
      host.type = "button";
      host.textContent = "Host a new one";
      host.addEventListener("click", () => handoffMatchedPlan(bundle));
      actions.append(host);
      return;
    }

    const make = document.createElement("button");
    make.className = "v6-card-action is-primary";
    make.type = "button";
    make.textContent = "Make this happen";
    make.addEventListener("click", () => handoffMatchedPlan(bundle));
    actions.append(make);

    if (opportunityTitle) {
      const open = document.createElement("a");
      open.className = "v6-card-action";
      open.href = opportunityHref(opportunity);
      open.textContent = "Open match";
      actions.append(open);
    }
  }

  function draftTitle(intent = {}, place = null) {
    const activity = activityLabel(intent?.activity === "any" ? "Meetup" : intent?.activity);
    const placeName = clean(place?.place_name, 60);
    return clean(placeName ? `${activity} at ${placeName}` : `${activity} meetup`, 90);
  }

  function draftArea(intent = {}, place = null) {
    const placeName = clean(place?.place_name, 60);
    const placeArea = clean(place?.area, 80) || clean([place?.city, place?.region].filter(Boolean).join(", "), 80);
    if (placeName && placeArea) return clean(`${placeName} · ${placeArea}`, 100);
    if (placeName) return placeName;
    if (placeArea) return placeArea;
    return clean(intent?.area, 100);
  }

  function draftPeople(people = []) {
    return (Array.isArray(people) ? people : []).slice(0, MAX_PEOPLE).map((person) => ({
      displayName: clean(person?.display_name, 80),
      handle: clean(person?.handle, 80).replace(/^@+/, ""),
      avatarUrl: clean(person?.avatar_url, 1000)
    }));
  }

  function matchedDraft(bundle = {}) {
    const intent = bundle?.intent || {};
    const maxGroup = Math.max(2, Math.min(50, Number(intent?.desiredGroupMax) || 8));
    return {
      version: 1,
      source: "ari_circle_intent_bundle_v1",
      createdAt: new Date().toISOString(),
      intentId: clean(intent?.intentId, 120),
      title: draftTitle(intent, bundle?.place),
      activity: clean(intent?.activity, 40) || "other",
      area: draftArea(intent, bundle?.place),
      startsAt: intent?.startsAt || null,
      durationMinutes: 60,
      guestSpots: Math.max(1, maxGroup - 1),
      joinMode: "approval",
      people: draftPeople(bundle?.people)
    };
  }

  function handoffMatchedPlan(bundle = {}) {
    const status = $("v6IntentBundleStatus");
    try {
      const draft = matchedDraft(bundle);
      if (!draft.intentId) throw new Error("This matched plan no longer has an active intent.");
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      window.location.assign("ari-circle-meetup.html?draft=matched");
    } catch (error) {
      if (status) status.textContent = clean(error?.message, 240) || "Could not prepare this meetup draft.";
    }
  }

  function renderPeople(node, people = []) {
    node.replaceChildren();
    const rows = Array.isArray(people) ? people.slice(0, MAX_PEOPLE) : [];

    const heading = document.createElement("div");
    heading.className = "v6-bundle-people__heading";
    heading.innerHTML = `<span>WHO FITS</span><small>${rows.length ? `${rows.length} compatible ${rows.length === 1 ? "person" : "people"}` : "No strong people match yet"}</small>`;
    node.append(heading);

    for (const person of rows) {
      const link = document.createElement("a");
      link.className = "v6-bundle-person";
      link.href = profileHref(person);

      const avatar = clean(person?.avatar_url, 1000);
      const name = clean(person?.display_name || person?.handle, 80) || "Circle member";
      const handle = clean(person?.handle, 80);
      const reasons = Array.isArray(person?.match_reasons) ? person.match_reasons.slice(0, 2) : [];

      link.innerHTML = `
        ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy" />` : `<span class="v6-bundle-person__avatar" aria-hidden="true">${escapeHtml(name.slice(0, 1).toUpperCase())}</span>`}
        <span class="v6-bundle-person__copy">
          <strong>${escapeHtml(name)}</strong>
          <small>${handle ? `@${escapeHtml(handle.replace(/^@+/, ""))}` : "Compatible Circle member"}</small>
          ${reasons.length ? `<em>${escapeHtml(reasons.join(" · "))}</em>` : ""}
        </span>
        <span aria-hidden="true">›</span>
      `;
      node.append(link);
    }
  }

  function scheduleRefresh(delay = 120) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => loadBundles(), delay);
  }

  function bind() {
    window.addEventListener("ari:circleChanged", () => scheduleRefresh(160));
    $("v6Refresh")?.addEventListener("click", () => scheduleRefresh(250));
  }

  async function boot() {
    try {
      state.client = await waitForClient();
      if (!(await requireUser())) return;
      bind();
      await loadBundles();
    } catch (error) {
      console.warn("[ARI Circle Intent Bundles]", error);
    }
  }

  window.AriCircleIntentBundlesV1 = Object.freeze({
    version: VERSION,
    refresh: loadBundles
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();