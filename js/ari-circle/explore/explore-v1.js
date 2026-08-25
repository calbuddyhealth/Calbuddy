/* =============================================================
   ARI CIRCLE — EXPLORE V1
   Read-only Action Network discovery: Opportunities + public Places.
   No device GPS request and no live individual-user location surface.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);
  const state = {
    client: null,
    user: null,
    opportunities: [],
    places: [],
    intents: [],
    activity: "",
    area: "",
    window: "upcoming",
    busy: false
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
      return false;
    }
    return true;
  }

  function dateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function placeTypeLabel(value) {
    return clean(value).replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function opportunityHref(row) {
    return row?.opportunity_type === "mission" ? "ari-circle-quests.html" : "ari-circle-meetup.html";
  }

  function activeIntent() {
    const candidates = state.intents.filter((intent) => intent?.status === "active" || !intent?.status);
    if (!candidates.length) return null;
    if (state.activity) {
      const matching = candidates.find((intent) => ["any", state.activity].includes(clean(intent.activity)));
      if (matching) return matching;
    }
    return candidates[0];
  }

  async function loadIntents() {
    try {
      const rows = await rpc("ari_circle_list_my_action_intents", { include_inactive: false, result_limit: 5 });
      state.intents = Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.warn("Explore intent read skipped:", error?.message || error);
      state.intents = [];
    }
  }

  async function loadOpportunities() {
    const status = $("exploreOpportunityStatus");
    if (status) status.textContent = "Finding things worth doing…";
    try {
      const rows = await rpc("ari_circle_list_opportunities", {
        requested_types: ["meetup", "mission"],
        requested_activity: state.activity || null,
        requested_window: state.window,
        result_limit: 20
      });
      state.opportunities = Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error("Explore opportunity load failed:", error);
      state.opportunities = [];
      if (status) status.textContent = error.message || "Opportunities are unavailable right now.";
    }
    renderOpportunities();
  }

  async function loadPlaces() {
    const status = $("explorePlaceStatus");
    if (status) status.textContent = "Finding public places…";
    const intent = activeIntent();

    try {
      let rows;
      if (intent?.intent_id && !state.area) {
        rows = await rpc("ari_circle_list_places_for_intent", {
          requested_intent_id: intent.intent_id,
          result_limit: 20
        });
      } else {
        rows = await rpc("ari_circle_list_places", {
          requested_activity: state.activity || null,
          requested_area: state.area || null,
          requested_latitude: null,
          requested_longitude: null,
          requested_radius_miles: 25,
          result_limit: 20
        });
      }
      state.places = Array.isArray(rows) ? rows : [];
      syncPlaceBasis(intent);
    } catch (error) {
      console.error("Explore place load failed:", error);
      state.places = [];
      if (status) status.textContent = error.message || "Places are unavailable right now.";
    }
    renderPlaces();
  }

  function syncPlaceBasis(intent) {
    const basis = $("explorePlaceBasis");
    if (!basis) return;
    if (state.area) {
      basis.textContent = `Public places matching “${state.area}”.`;
    } else if (intent?.intent_id) {
      basis.textContent = "Using your private, expiring Action Intent to rank public places. Your intent coordinates are not shown here.";
    } else {
      basis.textContent = "Curated public activity places. Set an Action Intent later for privacy-safe nearby ranking.";
    }
  }

  function renderOpportunities() {
    const list = $("exploreOpportunityList");
    const empty = $("exploreOpportunityEmpty");
    const status = $("exploreOpportunityStatus");
    if (!list || !empty || !status) return;
    list.replaceChildren();

    if (!state.opportunities.length) {
      empty.hidden = false;
      status.textContent = "";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.opportunities.length} current opportunit${state.opportunities.length === 1 ? "y" : "ies"}.`;
    state.opportunities.forEach((row) => list.append(opportunityCard(row)));
  }

  function opportunityCard(row) {
    const article = document.createElement("article");
    article.className = "circle-explore-card";
    const type = row.opportunity_type === "mission" ? "MISSION" : "MEET UP";
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const mission = row.opportunity_type === "mission";
    const progress = Number(metadata.progress_percent);
    const spots = row.spots_remaining === null || row.spots_remaining === undefined ? null : Number(row.spots_remaining);
    const stateLabel = clean(row.viewer_state) === "available" ? "" : clean(row.viewer_state).replaceAll("_", " ");

    article.innerHTML = `
      <div class="circle-explore-card__top">
        <span class="circle-explore-kicker">${escapeHtml(type)} · ${escapeHtml(clean(row.activity) || "activity")}</span>
        ${stateLabel ? `<span class="circle-explore-pill">${escapeHtml(stateLabel)}</span>` : ""}
      </div>
      <h3>${escapeHtml(row.title || "Opportunity")}</h3>
      ${clean(row.description) ? `<p>${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-explore-meta">
        ${row.area ? `<span>${escapeHtml(row.area)}</span>` : ""}
        ${row.starts_at ? `<span>${escapeHtml(dateTime(row.starts_at))}</span>` : ""}
        ${spots !== null && Number.isFinite(spots) ? `<span>${spots} spot${spots === 1 ? "" : "s"} open</span>` : ""}
        ${mission && Number.isFinite(progress) ? `<span>${Math.max(0, Math.min(100, Math.round(progress)))}% complete</span>` : ""}
      </div>
      <a class="circle-v5-button" href="${opportunityHref(row)}">Open</a>
    `;
    return article;
  }

  function renderPlaces() {
    const list = $("explorePlaceList");
    const empty = $("explorePlaceEmpty");
    const status = $("explorePlaceStatus");
    if (!list || !empty || !status) return;
    list.replaceChildren();

    if (!state.places.length) {
      empty.hidden = false;
      status.textContent = "";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.places.length} public place${state.places.length === 1 ? "" : "s"}.`;
    state.places.forEach((row) => list.append(placeCard(row)));
  }

  function placeCard(row) {
    const article = document.createElement("article");
    article.className = "circle-explore-place-card";
    const tags = Array.isArray(row.activity_tags) ? row.activity_tags.slice(0, 6) : [];
    const distance = Number(row.distance_miles);
    const verified = row.verification_state === "partner_verified" ? "Partner verified" : "Curated public place";

    article.innerHTML = `
      <div class="circle-explore-card__top">
        <span class="circle-explore-kicker">${escapeHtml(placeTypeLabel(row.place_type))}</span>
        <span class="circle-explore-pill">${escapeHtml(verified)}</span>
      </div>
      <h3>${escapeHtml(row.place_name || "Public place")}</h3>
      <p>${escapeHtml(row.area || [row.city, row.region].filter(Boolean).join(", "))}</p>
      ${clean(row.description) ? `<p class="circle-explore-place-copy">${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-explore-meta">
        ${Number.isFinite(distance) ? `<span>${distance.toFixed(1)} mi from your intent area</span>` : ""}
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
    return article;
  }

  async function refreshAll() {
    if (state.busy) return;
    state.busy = true;
    try {
      await loadIntents();
      await Promise.all([loadOpportunities(), loadPlaces()]);
    } finally {
      state.busy = false;
    }
  }

  function applySearch(event) {
    event?.preventDefault?.();
    state.area = clean($("exploreAreaInput")?.value).slice(0, 100);
    refreshAll();
  }

  function bind() {
    $("exploreAreaForm")?.addEventListener("submit", applySearch);
    $("exploreClearArea")?.addEventListener("click", () => {
      const input = $("exploreAreaInput");
      if (input) input.value = "";
      state.area = "";
      refreshAll();
    });
    $("exploreRefresh")?.addEventListener("click", refreshAll);

    document.querySelectorAll("[data-explore-activity]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-explore-activity]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        state.activity = clean(button.dataset.exploreActivity);
        refreshAll();
      });
    });

    document.querySelectorAll("[data-explore-window]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-explore-window]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        state.window = clean(button.dataset.exploreWindow) || "upcoming";
        loadOpportunities();
      });
    });
  }

  async function boot() {
    const page = $("explorePage");
    if (!page) return;
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      await refreshAll();
      window.dispatchEvent(new CustomEvent("ari:circleExploreReady", { detail: { version: VERSION } }));
    } catch (error) {
      console.error("Explore V1 boot failed:", error);
      const status = $("exploreOpportunityStatus");
      if (status) status.textContent = error.message || "Explore is unavailable right now.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
