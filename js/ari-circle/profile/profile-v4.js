/* =============================================================
   ARI CIRCLE — PROFILE V4
   Version: 4.3.1

   Lightweight social profile layer.
   - Feed / Meet Up / Quests navigation
   - Posts + About only
   - No profile flair or reaction scoring
   - Supports private photo/video posts with signed media URLs
   - Reuses the already-loaded Circle context to avoid duplicate identity calls
   - Renders post copy before private media signing finishes
   - Keeps the existing legacy profile renderer/editor/controllers
   - Keeps the existing one-time age safety boundary
============================================================= */

(() => {
  "use strict";

  const VERSION = "4.3.1";
  const MEDIA_BUCKET = "ari-circle-post-media";
  const SIGNED_URL_SECONDS = 60 * 60;
  const AGE_CACHE_KEY = "ari_circle_profile_verified_age_v1";
  const AGE_CACHE_MS = 15 * 60 * 1000;
  const $ = (id) => document.getElementById(id);

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
    postsHydrationToken: 0,
    tab: "posts",
    started: false,
    socialAvailable: true,
    signedUrlCache: new Map()
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

  function primeFromLegacyContext() {
    const app = window.AriCircleApp || window.Ari?.circle || null;
    const store = app?.modules?.CircleStore || null;
    const context = store?.get?.("context") || store?.getState?.()?.context || null;
    const viewerId = clean(context?.viewerUserId);
    const profileId = clean(context?.profileUserId);

    if (!viewerId || !profileId) return false;

    state.viewer = { id: viewerId };
    state.profileUserId = profileId;
    state.isOwner = viewerId === profileId;
    return true;
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
      <a href="ari-circle-meetup.html">Meet Up</a>
      <a href="ari-circle-quests.html">Quests</a>
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

  function readVerifiedAgeCache() {
    const viewerId = clean(state.viewer?.id);
    if (!viewerId) return null;

    try {
      const parsed = JSON.parse(sessionStorage.getItem(AGE_CACHE_KEY) || "null");
      if (!parsed || clean(parsed.viewerId) !== viewerId || parsed.age?.verified !== true) return null;
      if (Date.now() - Number(parsed.savedAt || 0) > AGE_CACHE_MS) return null;
      return parsed.age;
    } catch {
      return null;
    }
  }

  function writeVerifiedAgeCache(age) {
    const viewerId = clean(state.viewer?.id);
    if (!viewerId) return;

    try {
      if (age?.verified === true) {
        sessionStorage.setItem(AGE_CACHE_KEY, JSON.stringify({ viewerId, age, savedAt: Date.now() }));
      } else {
        sessionStorage.removeItem(AGE_CACHE_KEY);
      }
    } catch {
      // Cache is a speed enhancement only.
    }
  }

  async function loadAgeState({ preserveVerifiedOnError = false } = {}) {
    try {
      state.age = await rpc("ari_circle_my_age_state");
      writeVerifiedAgeCache(state.age);
    } catch (error) {
      console.warn("ARI Circle V4 age state unavailable:", error);
      if (!preserveVerifiedOnError) state.age = null;
    }
    renderAgeGate();
    return state.age;
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
      <p>Verify your birthday once to confirm you’re eligible for ARI Circle. Your birthday is not shown here.</p>
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
      writeVerifiedAgeCache(state.age);
      renderAgeGate();
      showToast("Age verified. Your birthday stays private.");
      await loadPosts();
    } catch (error) {
      console.error("ARI Circle V4 age verification failed:", error);
      showToast(error.message || "Could not verify age.");
    }
  }

  async function signedMediaUrl(path) {
    const cleanPath = clean(path);
    if (!cleanPath) return "";
    if (state.signedUrlCache.has(cleanPath)) return state.signedUrlCache.get(cleanPath);

    try {
      const { data, error } = await state.client.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(cleanPath, SIGNED_URL_SECONDS);
      if (error) throw error;
      const url = clean(data?.signedUrl);
      if (url) state.signedUrlCache.set(cleanPath, url);
      return url;
    } catch (error) {
      console.warn("ARI Circle profile media unavailable:", error);
      return "";
    }
  }

  async function hydratePosts(posts) {
    await Promise.all(posts.map(async (post) => {
      post.signed_media_url = clean(post.media_path)
        ? await signedMediaUrl(post.media_path)
        : clean(post.legacy_media_url || post.media_url);
    }));
    return posts;
  }

  async function loadPosts() {
    if (!state.profileUserId) return;

    const hydrationToken = ++state.postsHydrationToken;

    try {
      const result = await rpc("ari_circle_profile_posts_v2", {
        requested_user_id: state.profileUserId,
        result_limit: 30
      });
      state.socialAvailable = true;
      state.posts = Array.isArray(result) ? result : [];

      // Public/legacy URLs can paint now. Private paths are signed afterward.
      state.posts.forEach((post) => {
        post.signed_media_url = clean(post.media_path)
          ? ""
          : clean(post.legacy_media_url || post.media_url);
      });

      // First paint: post text, timestamps and structure appear immediately.
      renderPosts();

      // Media signing is deliberately non-blocking. When it finishes, repaint
      // only if this is still the newest posts request.
      void hydratePosts(state.posts)
        .then(() => {
          if (hydrationToken === state.postsHydrationToken) renderPosts();
        })
        .catch((error) => {
          console.warn("ARI Circle V4 profile media hydration failed:", error);
        });
    } catch (error) {
      console.warn("ARI Circle V4 profile posts unavailable:", error);
      state.socialAvailable = false;
      state.posts = [];
      renderUnavailableSocial();
    }
  }

  function appendPostMedia(card, post) {
    const url = clean(post.signed_media_url);
    if (!url) return;

    if (post.media_type === "video") {
      const video = document.createElement("video");
      video.className = "circle-v3-post__media circle-v3-post__video";
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      card.append(video);
      return;
    }

    const image = document.createElement("img");
    image.className = "circle-v3-post__media";
    image.src = url;
    image.alt = "Shared ARI Circle photo";
    image.loading = "lazy";
    card.append(image);
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
      const card = document.createElement("article");
      card.className = "circle-v3-post";

      const meta = document.createElement("div");
      meta.className = "circle-v3-post__meta";
      meta.innerHTML = `<time class="circle-v3-post__time">${escapeHtml(relativeTime(post.created_at))}</time>`;
      card.append(meta);

      if (clean(post.body)) {
        const body = document.createElement("p");
        body.className = "circle-v3-post__body";
        body.textContent = post.body;
        card.append(body);
      }

      appendPostMedia(card, post);
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
      // The legacy Circle boot has already resolved this context before it
      // reveals the page. Reuse it instead of repeating auth.getUser() and,
      // on handle routes, another profile lookup.
      const primed = primeFromLegacyContext();

      if (!primed) {
        const viewer = await resolveViewer();
        if (!viewer) return;
        await resolveProfileUserId();
        if (!state.profileUserId) return;
        state.isOwner = state.profileUserId === viewer.id;
      }

      injectMainNav();
      ensureSafetyAnchor();
      injectProfileTabs();
      selectInitialTab();

      const cachedAge = readVerifiedAgeCache();
      if (cachedAge) {
        state.age = cachedAge;
        renderAgeGate();
        void loadPosts();
        void loadAgeState({ preserveVerifiedOnError: true });
        return;
      }

      await loadAgeState();
      if (state.age?.verified) void loadPosts();
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
      }, 100);
    }, { once: true });
  }

  window.AriCircleProfileV4 = Object.freeze({
    version: VERSION,
    refresh: loadPosts
  });

  bootWhenReady();
})();