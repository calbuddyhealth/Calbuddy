/* =============================================================
   ARI CIRCLE — PROFILE V4
   Version: 4.1.0

   Lightweight social profile layer.
   - Feed / Me / Buddies / Challenges navigation
   - Posts + About only
   - No profile flair, reward, or reaction-score queries
   - Keeps the existing legacy profile renderer/editor/controllers
   - Keeps the existing one-time age safety boundary
============================================================= */

(() => {
  "use strict";

  const VERSION = "4.1.0";
  const $ = (id) => document.getElementById(id);

  const POST_META = Object.freeze({
    thought: { label: "Post", icon: "" },
    workout: { label: "Workout", icon: "💪" },
    progress: { label: "Progress", icon: "↗" },
    meal: { label: "Meal", icon: "🍽️" },
    activity: { label: "Activity", icon: "⚡" },
    partner: { label: "Buddy", icon: "◎" }
  });

  const ABOUT_SECTION_IDS = [
    "circle-about",
    "circle-interests",
    "circle-icebreakers"
  ];

  const state = {
    client: null,
    viewer: null,
    profileUserId: null,
    isOwner: false,
    age: null,
    posts: [],
    tab: "posts",
    started: false,
    socialAvailable: true
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = $("circle-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 45) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  async function resolveViewer() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.viewer = data?.user || null;
    return state.viewer;
  }

  async function resolveProfileUserId() {
    const params = new URLSearchParams(window.location.search);
    const explicitUser = clean(params.get("user"));
    if (explicitUser) {
      state.profileUserId = explicitUser;
      return explicitUser;
    }

    const handle = clean(params.get("handle")).replace(/^@+/, "");
    if (handle) {
      const { data, error } = await state.client
        .from("ari_circle_profiles")
        .select("user_id")
        .eq("handle", handle)
        .maybeSingle();
      if (error) throw error;
      state.profileUserId = data?.user_id || null;
      return state.profileUserId;
    }

    state.profileUserId = state.viewer?.id || null;
    return state.profileUserId;
  }

  function injectMainNav() {
    if ($("circleV3Nav")) return;
    const main = $("ari-circle");
    const profile = $("circle-profile");
    if (!main || !profile) return;

    const nav = document.createElement("nav");
    nav.id = "circleV3Nav";
    nav.className = "circle-v3-nav";
    nav.setAttribute("aria-label", "ARI Circle sections");
    nav.innerHTML = `
      <a href="ari-circle-feed.html">Feed</a>
      <a class="is-active" href="ari-circle.html" aria-current="page">Me</a>
      <a href="ari-circle-partners.html">Buddies</a>
      <a href="ari-circle-challenges.html">Challenges</a>
    `;
    main.insertBefore(nav, profile);
  }

  function ensureSafetyAnchor() {
    if ($("circleV3Hubs")) return;
    const profile = $("circle-profile");
    if (!profile) return;

    const anchor = document.createElement("div");
    anchor.id = "circleV3Hubs";
    anchor.hidden = true;
    anchor.setAttribute("aria-hidden", "true");
    profile.insertAdjacentElement("afterend", anchor);
  }

  function injectProfileTabs() {
    if ($("circleV3ProfileTabs")) return;
    const top = $("circle-top");
    if (!top) return;

    const tabs = document.createElement("nav");
    tabs.id = "circleV3ProfileTabs";
    tabs.className = "circle-v3-profile-tabs";
    tabs.setAttribute("aria-label", "Profile sections");
    tabs.innerHTML = `
      <button type="button" data-v3-profile-tab="posts" class="is-active" aria-selected="true">Posts</button>
      <button type="button" data-v3-profile-tab="about" aria-selected="false">About</button>
    `;

    const postsPanel = document.createElement("section");
    postsPanel.id = "circleV3PostsPanel";
    postsPanel.className = "circle-v3-panel";
    postsPanel.innerHTML = `
      <header class="circle-v3-panel__header">
        <div><h2>Posts</h2></div>
        ${state.isOwner ? '<a class="circle-v3-panel__link" href="ari-circle-feed.html">Share</a>' : ''}
      </header>
      <div id="circleV3Posts" class="circle-v3-posts" aria-live="polite"></div>
    `;

    top.insertAdjacentElement("afterend", tabs);
    tabs.insertAdjacentElement("afterend", postsPanel);

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-v3-profile-tab]");
      if (!button) return;
      setTab(button.dataset.v3ProfileTab || "posts");
    });
  }

  function setTab(tab) {
    state.tab = tab === "about" ? "about" : "posts";

    document.querySelectorAll("[data-v3-profile-tab]").forEach((button) => {
      const active = button.dataset.v3ProfileTab === state.tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    $("circleV3PostsPanel")?.classList.toggle("circle-v3-tab-hidden", state.tab !== "posts");

    ABOUT_SECTION_IDS.forEach((id) => {
      $(id)?.classList.toggle("circle-v3-tab-hidden", state.tab !== "about");
    });
  }

  async function loadAgeState() {
    try {
      state.age = await rpc("ari_circle_my_age_state");
    } catch (error) {
      console.warn("ARI Circle V4 age state unavailable:", error);
      state.age = null;
    }
    renderAgeGate();
  }

  function renderAgeGate() {
    $("circleV4AgeGate")?.remove();
    if (state.age?.verified || !state.isOwner) return;

    const profile = $("circle-profile");
    if (!profile) return;

    const gate = document.createElement("section");
    gate.id = "circleV4AgeGate";
    gate.className = "circle-v3-safety-gate";
    gate.innerHTML = `
      <strong>Unlock the social side of your Circle</strong>
      <p>Verify your birthday once so ARI can keep teen and adult discovery, messaging, feeds, and challenges separated. Your birthday is not shown here.</p>
      <form id="circleV4AgeForm">
        <input id="circleV4AgeInput" type="date" autocomplete="bday" required aria-label="Date of birth" />
        <button type="submit">Verify</button>
      </form>
    `;
    profile.insertAdjacentElement("afterend", gate);
    $("circleV4AgeForm")?.addEventListener("submit", verifyAge);
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("circleV4AgeInput")?.value);
    if (!value) return;

    try {
      state.age = await rpc("ari_circle_verify_my_age", { requested_date_of_birth: value });
      renderAgeGate();
      showToast("Age verified. Your birthday stays private.");
      await loadPosts();
    } catch (error) {
      console.error("ARI Circle V4 age verification failed:", error);
      showToast(error.message || "Could not verify age.");
    }
  }

  async function loadPosts() {
    if (!state.profileUserId) return;

    try {
      const result = await rpc("ari_circle_profile_posts", {
        requested_user_id: state.profileUserId,
        result_limit: 30
      });
      state.socialAvailable = true;
      state.posts = Array.isArray(result) ? result : [];
      renderPosts();
    } catch (error) {
      console.warn("ARI Circle V4 profile posts unavailable:", error);
      state.socialAvailable = false;
      state.posts = [];
      renderUnavailableSocial();
    }
  }

  function renderPosts() {
    const host = $("circleV3Posts");
    if (!host) return;
    host.replaceChildren();

    if (!state.posts.length) {
      host.innerHTML = `<div class="circle-v3-empty">${state.isOwner ? 'Nothing shared yet. Share your first post from the Feed.' : 'No Circle posts yet.'}</div>`;
      return;
    }

    state.posts.forEach((post) => {
      const meta = POST_META[post.post_type] || POST_META.thought;
      const card = document.createElement("article");
      card.className = "circle-v3-post";

      const reactions = Array.isArray(post.reaction_summary) ? post.reaction_summary : [];
      const typeText = [meta.icon, meta.label].filter(Boolean).join(" ");

      card.innerHTML = `
        <div class="circle-v3-post__meta">
          <span class="circle-v3-post__type">${escapeHtml(typeText)}</span>
          <time class="circle-v3-post__time">${escapeHtml(relativeTime(post.created_at))}</time>
        </div>
        <p class="circle-v3-post__body">${escapeHtml(post.body || "")}</p>
        ${post.activity ? `<span class="circle-v3-post__activity">${escapeHtml(post.activity)}</span>` : ""}
        ${post.media_url ? `<img class="circle-v3-post__media" src="${escapeHtml(post.media_url)}" alt="Shared ARI Circle media" loading="lazy" />` : ""}
        <div class="circle-v3-post__footer">
          ${reactions.slice(0,5).map((item) => `<span class="circle-v3-reaction-pill">${escapeHtml(item.emoji)} ${Number(item.count) || 0}</span>`).join("")}
          <span>${Number(post.comment_count) || 0} comments</span>
        </div>
      `;
      host.append(card);
    });
  }

  function renderUnavailableSocial() {
    const posts = $("circleV3Posts");
    if (posts) posts.innerHTML = '<div class="circle-v3-empty">Social activity is not available for this profile.</div>';

    if (!state.isOwner) {
      [$("circle-message-action"), $("circle-connection-action")]
        .filter(Boolean)
        .forEach((button) => { button.hidden = true; });
    }
  }

  function selectInitialTab() {
    const hash = clean(window.location.hash).replace(/^#/, "").toLowerCase();
    setTab(hash === "about" ? "about" : "posts");
  }

  async function start() {
    if (state.started) return;
    const main = $("ari-circle");
    if (!main || main.hidden) return;

    state.client = window.calbuddySupabase || window.supabaseClient || null;
    if (!state.client) return;

    state.started = true;

    try {
      const viewer = await resolveViewer();
      if (!viewer) return;
      await resolveProfileUserId();
      if (!state.profileUserId) return;

      state.isOwner = state.profileUserId === viewer.id;

      injectMainNav();
      ensureSafetyAnchor();
      injectProfileTabs();
      selectInitialTab();

      await loadAgeState();
      if (state.age?.verified) await loadPosts();
      else if (!state.isOwner) renderUnavailableSocial();
    } catch (error) {
      console.error("ARI Circle V4 profile enhancement failed:", error);
    }
  }

  function bootWhenReady() {
    document.addEventListener("circle:app-ready", start, { once: true });
    document.addEventListener("DOMContentLoaded", () => {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        const main = $("ari-circle");
        if (main && !main.hidden) {
          window.clearInterval(timer);
          start();
        } else if (attempts > 50) {
          window.clearInterval(timer);
        }
      }, 200);
    }, { once: true });
  }

  window.AriCircleProfileV4 = Object.freeze({
    version: VERSION,
    refresh: loadPosts
  });

  bootWhenReady();
})();
