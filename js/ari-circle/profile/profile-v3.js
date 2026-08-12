/* =============================================================
   ARI CIRCLE — PROFILE HUB V3
   Version: 1.0.0

   Enhances the existing profile page without replacing its controllers.
   - Adds Feed / Partners / Challenges / Me navigation.
   - Shows real profile feed posts.
   - Shows earned ARI flair and lets owners choose one to wear.
   - Keeps legacy Top Circle and About content intact.
   - Adds a one-time age safety gate for legacy accounts.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);

  const POST_META = Object.freeze({
    thought: { label: "Thought", icon: "✦" },
    workout: { label: "Workout", icon: "💪" },
    progress: { label: "Progress", icon: "↗" },
    meal: { label: "Meal", icon: "🍽️" },
    activity: { label: "Activity", icon: "⚡" },
    partner: { label: "Partner", icon: "◎" }
  });

  const REWARD_META = Object.freeze({
    first_share: {
      title: "First Share",
      copy: "Shared your first ARI Circle moment.",
      asset: "assets/ari-circle/rewards/first-share.svg"
    },
    momentum_5: {
      title: "Momentum",
      copy: "Shared 5 moments with your Circle.",
      asset: "assets/ari-circle/rewards/momentum.svg"
    },
    signal_10: {
      title: "Signal Strong",
      copy: "Shared 10 moments and kept showing up.",
      asset: "assets/ari-circle/rewards/signal.svg"
    },
    hype_10: {
      title: "Hype Machine",
      copy: "Reacted to 10 Circle moments.",
      asset: "assets/ari-circle/rewards/hype.svg"
    },
    community_voice_5: {
      title: "Community Voice",
      copy: "Left 5 comments that kept people talking.",
      asset: "assets/ari-circle/rewards/community.svg"
    },
    challenge_creator: {
      title: "Challenge Maker",
      copy: "Created a challenge for the Circle.",
      asset: "assets/ari-circle/rewards/challenge-maker.svg"
    },
    challenge_joiner: {
      title: "Game On",
      copy: "Joined an ARI Circle challenge.",
      asset: "assets/ari-circle/rewards/game-on.svg"
    },
    challenge_finisher: {
      title: "Challenge Complete",
      copy: "Finished an ARI Circle challenge.",
      asset: "assets/ari-circle/rewards/challenge-complete.svg"
    },
    spark_10: {
      title: "Spark",
      copy: "One post got reactions from 10 different people.",
      asset: "assets/ari-circle/rewards/spark.svg"
    },
    electric_25: {
      title: "Electric",
      copy: "One post got reactions from 25 different people.",
      asset: "assets/ari-circle/rewards/electric.svg"
    },
    liftoff_50: {
      title: "Lift Off",
      copy: "One post got reactions from 50 different people.",
      asset: "assets/ari-circle/rewards/liftoff.svg"
    },
    iconic_100: {
      title: "Iconic",
      copy: "One post got reactions from 100 different people.",
      asset: "assets/ari-circle/rewards/iconic.svg"
    }
  });

  const ABOUT_SECTION_IDS = [
    "circle-love",
    "circle-about",
    "circle-interests",
    "circle-icebreakers",
    "circle-details"
  ];

  const state = {
    client: null,
    viewer: null,
    profileUserId: null,
    isOwner: false,
    age: null,
    summary: null,
    rewards: [],
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

  function rewardMeta(key, metadata = {}) {
    const known = REWARD_META[key];
    if (known) return known;
    return {
      title: clean(metadata?.title) || clean(key).replaceAll("_", " ") || "ARI Flair",
      copy: "Unlocked in ARI Circle.",
      asset: ""
    };
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
      <a href="ari-circle-partners.html">Partners</a>
      <a href="ari-circle-challenges.html">Challenges</a>
      <a class="is-active" href="ari-circle.html" aria-current="page">Me</a>
    `;
    main.insertBefore(nav, profile);
  }

  function injectHubCards() {
    if ($("circleV3Hubs")) return;
    const profile = $("circle-profile");
    if (!profile) return;

    const hubs = document.createElement("section");
    hubs.id = "circleV3Hubs";
    hubs.className = "circle-v3-hubs";
    hubs.setAttribute("aria-label", "Explore ARI Circle");
    hubs.innerHTML = `
      <a class="circle-v3-hub" href="ari-circle-feed.html">
        <span class="circle-v3-hub__icon" aria-hidden="true">✦</span>
        <strong>Feed</strong>
        <small>Share and react.</small>
      </a>
      <a class="circle-v3-hub" href="ari-circle-partners.html">
        <span class="circle-v3-hub__icon" aria-hidden="true">◎</span>
        <strong>Partners</strong>
        <small>Find your people.</small>
      </a>
      <a class="circle-v3-hub" href="ari-circle-challenges.html">
        <span class="circle-v3-hub__icon" aria-hidden="true">◇</span>
        <strong>Challenges</strong>
        <small>Compete together.</small>
      </a>
    `;
    profile.insertAdjacentElement("afterend", hubs);
  }

  function injectSummary() {
    if ($("circleV3Summary")) return;
    const body = document.querySelector(".circle-profile__body");
    const actions = state.isOwner ? $("circle-owner-actions") : $("circle-visitor-actions");
    if (!body) return;

    const summary = document.createElement("div");
    summary.id = "circleV3Summary";
    summary.className = "circle-v3-summary";
    summary.setAttribute("aria-label", "Circle profile activity");
    summary.innerHTML = `
      <div class="circle-v3-summary__item"><strong id="circleV3PostCount">–</strong><span>Posts</span></div>
      <div class="circle-v3-summary__item"><strong id="circleV3RewardCount">–</strong><span>Flair</span></div>
      <div class="circle-v3-summary__item"><strong id="circleV3ReactionCount">–</strong><span>Reactions</span></div>
    `;

    if (actions) body.insertBefore(summary, actions);
    else body.append(summary);
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
      <button type="button" data-v3-profile-tab="achievements" aria-selected="false">Achievements</button>
      <button type="button" data-v3-profile-tab="about" aria-selected="false">About</button>
    `;

    const postsPanel = document.createElement("section");
    postsPanel.id = "circleV3PostsPanel";
    postsPanel.className = "circle-v3-panel";
    postsPanel.innerHTML = `
      <header class="circle-v3-panel__header">
        <div><p class="circle-v3-panel__eyebrow">PROFILE ACTIVITY</p><h2>Posts</h2></div>
        ${state.isOwner ? '<a class="circle-v3-panel__link" href="ari-circle-feed.html">Share</a>' : '<a class="circle-v3-panel__link" href="ari-circle-feed.html">Open Feed</a>'}
      </header>
      <div id="circleV3Posts" class="circle-v3-posts" aria-live="polite"></div>
    `;

    const rewardsPanel = document.createElement("section");
    rewardsPanel.id = "circleV3AchievementsPanel";
    rewardsPanel.className = "circle-v3-panel circle-v3-tab-hidden";
    rewardsPanel.innerHTML = `
      <header class="circle-v3-panel__header">
        <div>
          <p class="circle-v3-panel__eyebrow">ARI FLAIR</p>
          <h2>Achievements</h2>
        </div>
        ${state.isOwner ? '<button id="circleV3ClearFlair" class="circle-v3-clear-flair" type="button">Clear flair</button>' : ''}
      </header>
      <div id="circleV3Achievements" class="circle-v3-achievements" aria-live="polite"></div>
    `;

    top.insertAdjacentElement("afterend", tabs);
    tabs.insertAdjacentElement("afterend", postsPanel);
    postsPanel.insertAdjacentElement("afterend", rewardsPanel);

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-v3-profile-tab]");
      if (!button) return;
      setTab(button.dataset.v3ProfileTab || "posts");
    });

    $("circleV3ClearFlair")?.addEventListener("click", () => setFlair(null));
  }

  function setTab(tab) {
    state.tab = ["posts", "achievements", "about"].includes(tab) ? tab : "posts";

    document.querySelectorAll("[data-v3-profile-tab]").forEach((button) => {
      const active = button.dataset.v3ProfileTab === state.tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    $("circleV3PostsPanel")?.classList.toggle("circle-v3-tab-hidden", state.tab !== "posts");
    $("circleV3AchievementsPanel")?.classList.toggle("circle-v3-tab-hidden", state.tab !== "achievements");

    ABOUT_SECTION_IDS.forEach((id) => {
      $(id)?.classList.toggle("circle-v3-tab-hidden", state.tab !== "about");
    });

    if (state.tab === "about") {
      const note = $("circle-love-owner-note");
      if (note) note.textContent = "Leave a comment, a photo, or both on this profile.";
    }
  }

  function relabelLegacyWall() {
    const eyebrow = $("circle-love")?.querySelector(".circle-section-eyebrow");
    const title = $("circle-love-title");
    const input = $("circle-love-input");
    const empty = $("circle-love-empty")?.querySelector("p");
    if (eyebrow) eyebrow.textContent = "PROFILE COMMENTS";
    if (title) title.textContent = "Leave Some Love";
    if (input) input.placeholder = "Leave something positive…";
    if (empty) empty.textContent = "No profile comments yet.";
  }

  async function loadAgeState() {
    try {
      state.age = await rpc("ari_circle_my_age_state");
    } catch (error) {
      console.warn("ARI Circle V3 age state unavailable:", error);
      state.age = null;
    }
    renderAgeGate();
  }

  function renderAgeGate() {
    $("circleV3AgeGate")?.remove();
    if (state.age?.verified || !state.isOwner) return;

    const hubs = $("circleV3Hubs");
    if (!hubs) return;

    const gate = document.createElement("section");
    gate.id = "circleV3AgeGate";
    gate.className = "circle-v3-safety-gate";
    gate.innerHTML = `
      <strong>Unlock the social side of your Circle</strong>
      <p>Verify your birthday once so ARI can keep teen and adult discovery, messaging, feeds, and challenges separated. Your birthday is not shown here.</p>
      <form id="circleV3AgeForm">
        <input id="circleV3AgeInput" type="date" autocomplete="bday" required aria-label="Date of birth" />
        <button type="submit">Verify</button>
      </form>
    `;
    hubs.insertAdjacentElement("afterend", gate);
    $("circleV3AgeForm")?.addEventListener("submit", verifyAge);
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("circleV3AgeInput")?.value);
    if (!value) return;

    try {
      state.age = await rpc("ari_circle_verify_my_age", { requested_date_of_birth: value });
      renderAgeGate();
      showToast("Age verified. Your birthday stays private.");
      await loadSocialData();
    } catch (error) {
      console.error("ARI Circle V3 age verification failed:", error);
      showToast(error.message || "Could not verify age.");
    }
  }

  async function loadSocialData() {
    if (!state.profileUserId) return;

    try {
      const [summaryResult, rewardsResult, postsResult] = await Promise.all([
        rpc("ari_circle_profile_social_summary", { requested_user_id: state.profileUserId }),
        rpc("ari_circle_profile_rewards", { requested_user_id: state.profileUserId }),
        rpc("ari_circle_profile_posts", { requested_user_id: state.profileUserId, result_limit: 30 })
      ]);

      state.socialAvailable = true;
      state.summary = Array.isArray(summaryResult) ? summaryResult[0] || null : summaryResult || null;
      state.rewards = Array.isArray(rewardsResult) ? rewardsResult : [];
      state.posts = Array.isArray(postsResult) ? postsResult : [];
      renderSummary();
      renderNameFlair();
      renderPosts();
      renderAchievements();
    } catch (error) {
      console.warn("ARI Circle V3 social profile unavailable:", error);
      state.socialAvailable = false;
      state.summary = null;
      state.rewards = [];
      state.posts = [];
      renderUnavailableSocial();
    }
  }

  function renderSummary() {
    const summary = state.summary || {};
    if ($("circleV3PostCount")) $("circleV3PostCount").textContent = String(Number(summary.post_count) || 0);
    if ($("circleV3RewardCount")) $("circleV3RewardCount").textContent = String(Number(summary.reward_count) || 0);
    if ($("circleV3ReactionCount")) $("circleV3ReactionCount").textContent = String(Number(summary.reaction_count) || 0);
  }

  function renderNameFlair() {
    document.querySelector(".circle-v3-name-flair")?.remove();
    const selectedKey = clean(state.summary?.selected_reward_key);
    if (!selectedKey) return;

    const reward = state.rewards.find((item) => item.reward_key === selectedKey) || {};
    const meta = rewardMeta(selectedKey, reward.metadata);
    if (!meta.asset) return;

    const name = $("circle-display-name");
    if (!name) return;

    const flair = document.createElement("span");
    flair.className = "circle-v3-name-flair";
    flair.title = meta.title;
    flair.setAttribute("aria-label", `${meta.title} ARI flair`);
    flair.innerHTML = `<img src="${escapeHtml(meta.asset)}" alt="" />`;
    name.append(flair);
  }

  function renderPosts() {
    const host = $("circleV3Posts");
    if (!host) return;
    host.replaceChildren();

    if (!state.posts.length) {
      host.innerHTML = `<div class="circle-v3-empty">${state.isOwner ? 'Nothing shared yet. Your first post can be a workout, meal, progress update, activity, or just a thought.' : 'No Circle posts yet.'}</div>`;
      return;
    }

    state.posts.forEach((post) => {
      const meta = POST_META[post.post_type] || POST_META.thought;
      const card = document.createElement("article");
      card.className = "circle-v3-post";

      const reactions = Array.isArray(post.reaction_summary) ? post.reaction_summary : [];
      card.innerHTML = `
        <div class="circle-v3-post__meta">
          <span class="circle-v3-post__type">${escapeHtml(meta.icon)} ${escapeHtml(meta.label)}</span>
          <time class="circle-v3-post__time">${escapeHtml(relativeTime(post.created_at))}</time>
        </div>
        <p class="circle-v3-post__body">${escapeHtml(post.body || "")}</p>
        ${post.activity ? `<span class="circle-v3-post__activity">${escapeHtml(post.activity)}</span>` : ""}
        ${post.media_url ? `<img class="circle-v3-post__media" src="${escapeHtml(post.media_url)}" alt="Shared ARI Circle media" loading="lazy" />` : ""}
        <div class="circle-v3-post__footer">
          ${reactions.slice(0,5).map((item) => `<span class="circle-v3-reaction-pill">${escapeHtml(item.emoji)} ${Number(item.count) || 0}</span>`).join("")}
          <span>${Number(post.reaction_count) || 0} reactions</span>
          <span>·</span>
          <span>${Number(post.comment_count) || 0} comments</span>
        </div>
      `;
      host.append(card);
    });
  }

  function renderAchievements() {
    const host = $("circleV3Achievements");
    if (!host) return;
    host.replaceChildren();

    if (!state.rewards.length) {
      host.innerHTML = `<div class="circle-v3-empty">No ARI flair unlocked yet. Posting, participating, encouraging people, and earning reactions unlocks profile rewards.</div>`;
      return;
    }

    state.rewards.forEach((reward) => {
      const key = clean(reward.reward_key);
      const meta = rewardMeta(key, reward.metadata);
      const selected = Boolean(reward.is_selected) || key === clean(state.summary?.selected_reward_key);
      const card = document.createElement("article");
      card.className = `circle-v3-achievement${selected ? " is-selected" : ""}`;
      card.innerHTML = `
        <div class="circle-v3-achievement__asset">
          ${meta.asset ? `<img src="${escapeHtml(meta.asset)}" alt="" />` : `<span>✦</span>`}
        </div>
        <div>
          <strong>${escapeHtml(meta.title)}</strong>
          <small>${escapeHtml(meta.copy)}</small>
          ${state.isOwner ? `<button class="circle-v3-wear${selected ? " is-selected" : ""}" type="button" data-wear-flair="${escapeHtml(key)}">${selected ? "Wearing" : "Wear after name"}</button>` : ""}
        </div>
      `;
      card.querySelector("[data-wear-flair]")?.addEventListener("click", () => setFlair(key));
      host.append(card);
    });
  }

  async function setFlair(key) {
    if (!state.isOwner) return;
    try {
      const selected = await rpc("ari_circle_set_profile_flair", { requested_reward_key: key || null });
      if (!state.summary) state.summary = {};
      state.summary.selected_reward_key = selected || null;
      state.rewards = state.rewards.map((reward) => ({
        ...reward,
        is_selected: reward.reward_key === selected
      }));
      renderNameFlair();
      renderAchievements();
      showToast(selected ? "Profile flair updated." : "Profile flair cleared.");
    } catch (error) {
      console.error("ARI Circle flair update failed:", error);
      showToast(error.message || "Could not update flair.");
    }
  }

  function renderUnavailableSocial() {
    if ($("circleV3PostCount")) $("circleV3PostCount").textContent = "–";
    if ($("circleV3RewardCount")) $("circleV3RewardCount").textContent = "–";
    if ($("circleV3ReactionCount")) $("circleV3ReactionCount").textContent = "–";

    const posts = $("circleV3Posts");
    if (posts) posts.innerHTML = '<div class="circle-v3-empty">Social activity is not available for this profile.</div>';
    const achievements = $("circleV3Achievements");
    if (achievements) achievements.innerHTML = '<div class="circle-v3-empty">Achievement details are not available for this profile.</div>';

    if (!state.isOwner) {
      [$("circle-message-action"), $("circle-connection-action")]
        .filter(Boolean)
        .forEach((button) => { button.hidden = true; });
    }
  }

  function selectInitialTab() {
    const hash = clean(window.location.hash).replace(/^#/, "").toLowerCase();
    if (["posts","achievements","about"].includes(hash)) setTab(hash);
    else setTab("posts");
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
      injectHubCards();
      injectSummary();
      injectProfileTabs();
      relabelLegacyWall();
      selectInitialTab();

      await loadAgeState();
      if (state.age?.verified) await loadSocialData();
      else if (!state.isOwner) renderUnavailableSocial();
    } catch (error) {
      console.error("ARI Circle V3 profile enhancement failed:", error);
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

  window.AriCircleProfileV3 = Object.freeze({
    version: VERSION,
    refresh: loadSocialData
  });

  bootWhenReady();
})();
