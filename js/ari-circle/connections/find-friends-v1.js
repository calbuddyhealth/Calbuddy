/* =============================================================
   ARI CIRCLE — FIND FRIENDS V1
   Local radar + mutual-connection suggestions.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.1";
  const $ = (id) => document.getElementById(id);

  const state = {
    client: null,
    user: null,
    rows: [],
    query: "",
    loading: false,
    requested: new Set(),
    toastTimer: 0
  };

  const clean = (value, max = 240) =>
    String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

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
      if (client?.auth && client?.rpc && client?.from) return client;
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
      return null;
    }
    return state.user;
  }

  function showToast(message, duration = 3200) {
    const toast = $("friendsToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = clean(message);
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, duration);
  }

  function setStatus(message) {
    const node = $("friendsStatus");
    if (node) node.textContent = clean(message);
  }

  function initials(row) {
    const name = clean(row.display_name);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return clean(row.handle).slice(0, 1).toUpperCase() || "A";
  }

  function profileUrl(row) {
    return `ari-circle.html?user=${encodeURIComponent(row.user_id)}`;
  }

  function avatarMarkup(row) {
    const src = clean(row.avatar_url, 1200);
    if (src) {
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(clean(row.display_name) || "Profile")} profile photo" loading="lazy" />`;
    }
    return `<span aria-hidden="true">${escapeHtml(initials(row))}</span>`;
  }

  function metaMarkup(row) {
    const parts = [];
    const distance = Number(row.distance_miles);
    const mutual = Math.max(0, Number(row.mutual_count) || 0);
    const locationLabel = clean(row.profile_location, 80);

    if (Number.isFinite(distance)) {
      parts.push(`<span>${distance < 0.1 ? "Nearby" : `${escapeHtml(distance.toFixed(1))} mi away`}</span>`);
    } else if (locationLabel) {
      parts.push(`<span>${escapeHtml(locationLabel)}</span>`);
    }

    if (mutual > 0) {
      parts.push(`<span class="is-mutual">${mutual} mutual${mutual === 1 ? "" : "s"}</span>`);
    }

    return parts.join("");
  }

  function friendCard(row) {
    const displayName = clean(row.display_name) || "ARI Circle User";
    const handle = clean(row.handle);
    const bio = clean(row.bio, 180);
    const requested = state.requested.has(row.user_id);
    const href = profileUrl(row);

    return `
      <article class="circle-friend-card" data-friend-user="${escapeHtml(row.user_id)}">
        <a class="circle-friend-card__avatar" href="${href}" aria-label="View ${escapeHtml(displayName)}'s profile">
          ${avatarMarkup(row)}
        </a>
        <div class="circle-friend-card__body">
          <a class="circle-friend-card__identity" href="${href}">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${handle ? `@${escapeHtml(handle)}` : ""}</span>
          </a>
          ${bio ? `<p class="circle-friend-card__bio">${escapeHtml(bio)}</p>` : ""}
        </div>
        <div class="circle-friend-card__meta">${metaMarkup(row)}</div>
        <div class="circle-friend-card__actions">
          <a href="${href}">View Profile</a>
          <button type="button" data-friend-add="${escapeHtml(row.user_id)}"${requested ? " disabled" : ""}>
            ${requested ? "Requested" : "Add Friend"}
          </button>
        </div>
      </article>
    `;
  }

  function renderList(id, rows) {
    const host = $(id);
    if (!host) return;
    host.innerHTML = rows.map(friendCard).join("");
  }

  function render() {
    const query = clean(state.query);
    const searchSection = $("friendsSearchSection");
    const suggestedSection = $("friendsSuggestedSection");
    const nearbySection = $("friendsNearbySection");
    const empty = $("friendsEmpty");

    if (query) {
      if (searchSection) searchSection.hidden = false;
      if (suggestedSection) suggestedSection.hidden = true;
      if (nearbySection) nearbySection.hidden = true;
      renderList("friendsSearchList", state.rows);
      if ($("friendsSearchCount")) $("friendsSearchCount").textContent = String(state.rows.length);
      if (empty) empty.hidden = state.rows.length > 0;
      return;
    }

    const suggested = state.rows
      .filter((row) => row.is_suggested === true || Number(row.mutual_count) > 0)
      .sort((a, b) => (Number(b.mutual_count) || 0) - (Number(a.mutual_count) || 0))
      .slice(0, 12);

    const nearby = state.rows
      .filter((row) => row.is_nearby === true)
      .sort((a, b) => {
        const aMutual = Number(a.mutual_count) || 0;
        const bMutual = Number(b.mutual_count) || 0;
        if (aMutual !== bMutual) return bMutual - aMutual;
        const ad = Number.isFinite(Number(a.distance_miles)) ? Number(a.distance_miles) : Number.POSITIVE_INFINITY;
        const bd = Number.isFinite(Number(b.distance_miles)) ? Number(b.distance_miles) : Number.POSITIVE_INFINITY;
        return ad - bd;
      });

    if (searchSection) searchSection.hidden = true;
    if (suggestedSection) suggestedSection.hidden = suggested.length === 0;
    if (nearbySection) nearbySection.hidden = nearby.length === 0;

    renderList("friendsSuggestedList", suggested);
    renderList("friendsNearbyList", nearby);

    if ($("friendsSuggestedCount")) $("friendsSuggestedCount").textContent = String(suggested.length);
    if ($("friendsNearbyCount")) $("friendsNearbyCount").textContent = String(nearby.length);
    if (empty) empty.hidden = suggested.length > 0 || nearby.length > 0;
  }

  async function load(query = state.query) {
    if (!state.client || state.loading) return false;

    state.loading = true;
    state.query = clean(query, 80);
    setStatus(state.query ? `Searching for "${state.query}"…` : "Finding people around your radar…");

    try {
      const { data, error } = await state.client.rpc("ari_circle_find_friends_v1", {
        search_text: state.query || null,
        result_limit: 100
      });
      if (error) throw error;

      state.rows = Array.isArray(data) ? data : [];
      render();

      if (state.query) {
        setStatus(state.rows.length
          ? `${state.rows.length} result${state.rows.length === 1 ? "" : "s"} found.`
          : "No matching people found.");
      } else {
        const nearbyCount = state.rows.filter((row) => row.is_nearby === true).length;
        const suggestedCount = state.rows.filter((row) => row.is_suggested === true || Number(row.mutual_count) > 0).length;
        if (!nearbyCount && !suggestedCount) {
          setStatus("No people matched this radar yet.");
        } else {
          const parts = [];
          if (nearbyCount) parts.push(`${nearbyCount} nearby`);
          if (suggestedCount) parts.push(`${suggestedCount} suggested`);
          setStatus(parts.join(" · "));
        }
      }
      return true;
    } catch (error) {
      console.warn("Find Friends failed:", error?.message || error);
      state.rows = [];
      render();
      setStatus(error?.message || "Could not load people right now.");
      return false;
    } finally {
      state.loading = false;
    }
  }

  async function addFriend(userId, button) {
    const target = clean(userId, 80);
    if (!target || state.requested.has(target) || !state.user?.id) return false;

    button.disabled = true;
    button.textContent = "Sending…";

    try {
      const { error } = await state.client
        .from("ari_circle_connections")
        .insert({
          requester_user_id: state.user.id,
          addressee_user_id: target,
          status: "pending",
          blocked_by_user_id: null
        });

      if (error) throw error;

      state.requested.add(target);
      button.textContent = "Requested";
      showToast("Friend request sent.");
      return true;
    } catch (error) {
      console.warn("Friend request failed:", error?.message || error);
      button.disabled = false;
      button.textContent = "Add Friend";
      showToast(error?.message || "Could not send friend request.");
      return false;
    }
  }

  function settleVisualViewport() {
    const active = document.activeElement;
    if (active && typeof active.blur === "function" && active !== document.body) {
      active.blur();
    }
  }

  function bind() {
    $("friendsSearchForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      settleVisualViewport();
      void load($("friendsSearchInput")?.value || "");
    });

    $("friendsClearSearch")?.addEventListener("click", () => {
      if ($("friendsSearchInput")) $("friendsSearchInput").value = "";
      void load("");
    });

    $("friendsRefresh")?.addEventListener("click", () => {
      void load(state.query);
    });

    document.addEventListener("click", (event) => {
      const profileLink = event.target.closest?.(
        ".circle-friend-card__avatar, .circle-friend-card__identity, .circle-friend-card__actions a"
      );
      if (profileLink) {
        settleVisualViewport();
        return;
      }

      const button = event.target.closest?.("[data-friend-add]");
      if (!button) return;
      settleVisualViewport();
      void addFriend(button.dataset.friendAdd, button);
    });

    window.addEventListener("ari:circleSearchLocationChanged", () => {
      state.query = "";
      if ($("friendsSearchInput")) $("friendsSearchInput").value = "";
      void load("");
    });
  }

  async function boot() {
    bind();

    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;

      const page = $("friendsPage");
      if (page) page.hidden = false;

      await load("");
    } catch (error) {
      console.warn("Find Friends startup failed:", error?.message || error);
      const page = $("friendsPage");
      if (page) page.hidden = false;
      setStatus(error?.message || "Find Friends could not start.");
    }
  }

  window.AriCircleFindFriends = Object.freeze({
    version: VERSION,
    refresh: () => load(state.query)
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    void boot();
  }
})();
