/* =============================================================
   ARI CIRCLE — BUDDIES SOCIAL DISCOVERY
   Version: 1.1.0

   Adds the ordinary friend layer to Buddies:
   - Search people by display name / @handle
   - Show eligible people to discover
   - Send friend requests
   - Surface Friends and Requests entry points
   - Preserve the separate plans/activities lane below
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const DISCOVERY_LIMIT = 8;

  const state = {
    client: null,
    user: null,
    people: [],
    query: "",
    loading: false,
    started: false
  };

  const $ = (id) => document.getElementById(id);

  function clean(value) {
    return String(value ?? "").trim();
  }

  function initial(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function profileUrl(userId) {
    return `ari-circle.html?user=${encodeURIComponent(userId)}`;
  }

  function validImageUrl(value) {
    const url = clean(value);
    return /^(https?:|blob:)/i.test(url) ? url : "";
  }

  function setStatus(message) {
    const element = $("buddySocialStatus");
    if (element) element.textContent = message;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    return state.user;
  }

  function buildShell() {
    if ($("buddySocial")) return;

    const page = $("partnerPage");
    const tabs = page?.querySelector(".partner-tabs");
    if (!page || !tabs) return;

    const section = document.createElement("section");
    section.id = "buddySocial";
    section.className = "buddy-social";
    section.setAttribute("aria-labelledby", "buddySocialTitle");
    section.innerHTML = `
      <form id="buddySocialSearch" class="buddy-social__search" role="search">
        <label class="sr-only" for="buddySocialInput">Search people by name or handle</label>
        <input id="buddySocialInput" type="search" maxlength="80" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search people by name or @handle" />
        <button type="submit">Search</button>
      </form>

      <div class="buddy-social__quick" aria-label="Friend shortcuts">
        <a href="ari-circle.html?panel=friends">
          <strong>See Friends</strong>
          <span id="buddyFriendCount">—</span>
        </a>
        <a href="ari-circle.html?panel=requests">
          <strong>Requests</strong>
          <span id="buddyRequestCount">—</span>
        </a>
      </div>

      <div class="buddy-social__heading">
        <div>
          <h2 id="buddySocialTitle">People to Discover</h2>
          <p>Meet people in your ARI Circle social space.</p>
        </div>
        <button id="buddySocialMore" class="buddy-social__more" type="button">See More</button>
      </div>

      <p id="buddySocialStatus" class="buddy-social__status" role="status" aria-live="polite">Finding people…</p>
      <div id="buddySocialPeople" class="buddy-people" aria-live="polite"></div>
      <div id="buddySocialEmpty" class="buddy-social__empty" hidden>No people found yet.</div>
    `;

    tabs.insertAdjacentElement("afterend", section);

    const hero = page.querySelector(".partner-hero");
    if (hero) hero.classList.add("circle-v4-activity-cta");
  }

  async function loadCounts() {
    if (!state.user) return;
    const id = state.user.id;

    try {
      const [friendsResult, requestsResult] = await Promise.all([
        state.client
          .from("ari_circle_connections")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`requester_user_id.eq.${id},addressee_user_id.eq.${id}`),
        state.client
          .from("ari_circle_connections")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("addressee_user_id", id)
      ]);

      if ($("buddyFriendCount")) $("buddyFriendCount").textContent = String(friendsResult.count || 0);
      if ($("buddyRequestCount")) $("buddyRequestCount").textContent = String(requestsResult.count || 0);
    } catch (error) {
      console.warn("ARI Circle buddy counts unavailable:", error);
    }
  }

  async function discover(query = "") {
    if (state.loading || !state.client || !state.user) return;

    state.loading = true;
    state.query = clean(query);
    setStatus(state.query ? `Searching for “${state.query}”…` : "Finding people…");

    const more = $("buddySocialMore");
    if (more) more.disabled = true;

    try {
      const { data, error } = await state.client.rpc("ari_circle_discover_people", {
        search_text: state.query || null,
        result_limit: DISCOVERY_LIMIT
      });
      if (error) throw error;

      state.people = Array.isArray(data) ? data : [];
      renderPeople();

      if (!state.people.length) {
        setStatus(state.query ? "No matching people found." : "No new people are available right now.");
      } else {
        setStatus(state.query
          ? `${state.people.length} result${state.people.length === 1 ? "" : "s"}`
          : "People you can discover in ARI Circle");
      }
    } catch (error) {
      console.warn("ARI Circle friend discovery unavailable:", error);
      state.people = [];
      renderPeople();
      setStatus("Friend discovery is temporarily unavailable.");
    } finally {
      state.loading = false;
      if (more) more.disabled = false;
    }
  }

  function renderPeople() {
    const host = $("buddySocialPeople");
    const empty = $("buddySocialEmpty");
    if (!host) return;

    host.replaceChildren();
    if (empty) empty.hidden = state.people.length > 0;

    state.people.forEach((person) => {
      const userId = clean(person.user_id || person.id);
      if (!userId) return;

      const name = clean(person.display_name || person.name) || "ARI Circle User";
      const handle = clean(person.handle).replace(/^@+/, "");
      const bio = clean(person.bio);
      const imageUrl = validImageUrl(person.avatar_url);

      const card = document.createElement("article");
      card.className = "buddy-person";

      const profile = document.createElement("a");
      profile.className = "buddy-person__profile";
      profile.href = profileUrl(userId);
      profile.setAttribute("aria-label", `Open ${name}'s profile`);

      const avatar = document.createElement("span");
      avatar.className = "buddy-person__avatar";
      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "";
        image.loading = "lazy";
        avatar.append(image);
      } else {
        avatar.textContent = initial(name);
      }

      const identity = document.createElement("span");
      identity.className = "buddy-person__name";
      const strong = document.createElement("strong");
      strong.textContent = name;
      const small = document.createElement("small");
      small.textContent = handle ? `@${handle}` : "View profile";
      identity.append(strong, small);
      profile.append(avatar, identity);

      const bioLine = document.createElement("p");
      bioLine.className = "buddy-person__bio";
      bioLine.textContent = bio || "Open their profile to learn more.";

      const add = document.createElement("button");
      add.className = "buddy-person__add";
      add.type = "button";
      add.textContent = "Add Friend";
      add.addEventListener("click", () => sendFriendRequest(userId, add));

      card.append(profile, bioLine, add);
      host.append(card);
    });
  }

  async function sendFriendRequest(targetUserId, button) {
    if (!state.user || !targetUserId || button.disabled) return;

    button.disabled = true;
    button.textContent = "Sending…";

    try {
      const { error } = await state.client
        .from("ari_circle_connections")
        .insert({
          requester_user_id: state.user.id,
          addressee_user_id: targetUserId,
          status: "pending",
          blocked_by_user_id: null
        });

      if (error && error.code !== "23505") throw error;

      button.textContent = "Requested ✓";
      button.classList.add("is-requested");
      await loadCounts();
    } catch (error) {
      console.error("ARI Circle friend request failed:", error);
      button.disabled = false;
      button.textContent = "Add Friend";
      setStatus(error.message || "Could not send that friend request.");
    }
  }

  function bind() {
    $("buddySocialSearch")?.addEventListener("submit", (event) => {
      event.preventDefault();
      discover($("buddySocialInput")?.value || "");
    });

    $("buddySocialMore")?.addEventListener("click", () => {
      if ($("buddySocialInput")) $("buddySocialInput").value = "";
      discover("");
    });
  }

  async function start() {
    if (state.started || !document.querySelector(".partner-page")) return;

    state.client = window.calbuddySupabase || window.supabaseClient || null;
    if (!state.client) return;

    state.started = true;
    buildShell();
    bind();

    try {
      const user = await requireUser();
      if (!user) return;
      await Promise.all([loadCounts(), discover("")]);
    } catch (error) {
      console.warn("ARI Circle Buddies social layer could not start:", error);
      setStatus("Friend discovery is temporarily unavailable.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.AriCircleBuddiesSocial = Object.freeze({
    version: VERSION,
    refresh: () => Promise.all([loadCounts(), discover(state.query)])
  });
})();
