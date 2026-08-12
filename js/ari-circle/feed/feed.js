/* =============================================================
   ARI CIRCLE — FEED
   Version: 1.0.0

   Functional social feed for ARI Circle V3.
   - Verified-age cohort separation is enforced by Supabase RPCs.
   - Posts, comments, and emoji reactions are live database records.
   - Adults and teens never share a discovery feed.
   - Blocked accounts are excluded from feed interactions.
   - Rewards are read from ari_circle_user_rewards.
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
      copy: "Posted your first ARI Circle moment.",
      asset: "assets/ari-circle/rewards/first-share.svg"
    },
    momentum_5: {
      title: "Momentum",
      copy: "Shared 5 moments with your Circle.",
      asset: "assets/ari-circle/rewards/momentum.svg"
    },
    signal_10: {
      title: "Signal Strong",
      copy: "Shared 10 moments. You’re showing up.",
      asset: "assets/ari-circle/rewards/signal.svg"
    },
    hype_10: {
      title: "Hype Machine",
      copy: "Reacted to 10 Circle moments.",
      asset: "assets/ari-circle/rewards/hype.svg"
    },
    community_voice_5: {
      title: "Community Voice",
      copy: "Left 5 comments that kept the conversation moving.",
      asset: "assets/ari-circle/rewards/community.svg"
    }
  });

  const REWARD_ORDER = [
    "first_share",
    "momentum_5",
    "signal_10",
    "hype_10",
    "community_voice_5"
  ];

  const state = {
    client: null,
    user: null,
    profile: null,
    age: null,
    postType: "thought",
    posts: [],
    rewards: [],
    nextBefore: null,
    activeReactionPostId: null,
    activeCommentsPost: null,
    busy: false,
    toastTimer: null
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

  function profileUrl(userId) {
    return `ari-circle.html?user=${encodeURIComponent(userId)}`;
  }

  function reportUrl(post) {
    const params = new URLSearchParams({
      target_type: "feed_post",
      target_id: String(post.post_id || ""),
      reported_user_id: String(post.author_user_id || "")
    });
    return `help-safety.html?${params.toString()}`;
  }

  function initialFor(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function showToast(message, duration = 3200) {
    const toast = $("feedToast");
    if (!toast) return;

    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;

    state.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, duration);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  function setBusy(isBusy) {
    state.busy = Boolean(isBusy);
    [$("publishPostButton"), $("verifyAgeButton")]
      .filter(Boolean)
      .forEach((button) => {
        button.disabled = state.busy;
      });
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;

    const user = data?.user || null;
    if (!user) {
      window.location.replace("signin.html");
      return null;
    }

    state.user = user;
    return user;
  }

  async function loadOwnProfile() {
    const { data, error } = await state.client
      .from("ari_circle_profiles")
      .select("user_id,display_name,handle,avatar_url")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (error) {
      console.warn("ARI Circle feed could not load own profile:", error);
      return null;
    }

    state.profile = data || null;
    renderComposerAvatar();
    return state.profile;
  }

  function renderComposerAvatar() {
    const host = $("composerAvatar");
    if (!host) return;

    const name = state.profile?.display_name || state.user?.email || "ARI";
    const avatar = clean(state.profile?.avatar_url);

    host.innerHTML = avatar
      ? `<img src="${escapeHtml(avatar)}" alt="" />`
      : `<span>${escapeHtml(initialFor(name))}</span>`;
  }

  async function loadAgeState() {
    state.age = await rpc("ari_circle_my_age_state");
    return state.age;
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("ageDateInput").value);

    if (!value) {
      showToast("Enter your date of birth to continue.");
      return;
    }

    setBusy(true);
    try {
      state.age = await rpc("ari_circle_verify_my_age", {
        requested_date_of_birth: value
      });
      closeDialog("ageDialog");
      showToast("Age verified. Your birthday stays private.");
      await refreshFeed();
      await loadRewards();
    } catch (error) {
      console.error("ARI Circle feed age verification failed:", error);
      showToast(error.message || "Could not verify age.", 4500);
    } finally {
      setBusy(false);
    }
  }

  function relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 45) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  function syncPostTypeChips() {
    document.querySelectorAll("[data-post-type]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.postType === state.postType);
    });
  }

  function bindPostTypes() {
    $("postTypeStrip")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-post-type]");
      if (!button) return;
      state.postType = button.dataset.postType || "thought";
      syncPostTypeChips();

      const placeholders = {
        thought: "Share something worth showing up for…",
        workout: "What did you train today?",
        progress: "What changed? What are you proud of?",
        meal: "What did you make or discover?",
        activity: "What are you getting into?",
        partner: "What do you want someone to join you for?"
      };
      $("feedPostBody").placeholder = placeholders[state.postType] || placeholders.thought;
    });
  }

  async function publishPost(event) {
    event.preventDefault();
    if (state.busy) return;

    if (!state.age?.verified) {
      openDialog("ageDialog");
      return;
    }

    const body = clean($("feedPostBody").value);
    const activity = clean($("feedPostActivity").value);

    if (!body) {
      showToast("Write something before sharing.");
      return;
    }

    setBusy(true);
    try {
      await rpc("ari_circle_feed_create_post", {
        requested_post_type: state.postType,
        requested_body: body,
        requested_media_url: null,
        requested_activity: activity || null
      });

      $("feedPostBody").value = "";
      $("feedPostActivity").value = "";
      $("postCharCount").textContent = "0";
      state.postType = "thought";
      syncPostTypeChips();
      showToast("Shared to your Circle.");

      await Promise.all([
        refreshFeed(),
        loadRewards()
      ]);
    } catch (error) {
      console.error("ARI Circle feed post failed:", error);
      showToast(error.message || "Could not share that post.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function loadFeed({ append = false } = {}) {
    const status = $("feedStatus");
    if (!append) status.textContent = "Loading your Circle…";

    try {
      const data = await rpc("ari_circle_feed_list", {
        result_limit: 20,
        before_created_at: append ? state.nextBefore : null
      });

      const rows = Array.isArray(data) ? data : [];
      state.posts = append ? [...state.posts, ...rows] : rows;
      state.nextBefore = rows.length
        ? rows[rows.length - 1].created_at
        : null;

      renderFeed();
      $("loadMoreButton").hidden = rows.length < 20;
    } catch (error) {
      console.error("ARI Circle feed loading failed:", error);
      if (!append) state.posts = [];
      renderFeed();
      status.textContent = error.message || "Feed unavailable right now.";
    }
  }

  async function refreshFeed() {
    state.nextBefore = null;
    return loadFeed({ append: false });
  }

  function renderFeed() {
    const host = $("feedList");
    const empty = $("feedEmpty");
    const status = $("feedStatus");

    host.replaceChildren();

    if (!state.posts.length) {
      empty.hidden = false;
      status.textContent = "Nothing posted in your Circle yet.";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.posts.length} ${state.posts.length === 1 ? "moment" : "moments"}`;
    state.posts.forEach((post) => host.append(createPostCard(post)));
  }

  function createAvatar(name, avatarUrl, userId) {
    const link = document.createElement("a");
    link.className = "feed-avatar";
    link.href = profileUrl(userId);
    link.setAttribute("aria-label", `View ${clean(name) || "profile"}`);

    const avatar = clean(avatarUrl);
    link.innerHTML = avatar
      ? `<img src="${escapeHtml(avatar)}" alt="" />`
      : `<span>${escapeHtml(initialFor(name))}</span>`;

    return link;
  }

  function createPostCard(post) {
    const article = document.createElement("article");
    article.className = "feed-post";
    article.dataset.postId = post.post_id;

    const meta = POST_META[post.post_type] || POST_META.thought;
    const handle = clean(post.handle)
      ? `@${clean(post.handle).replace(/^@+/, "")}`
      : "ARI Circle";

    const reactions = Array.isArray(post.reaction_summary)
      ? post.reaction_summary
      : [];
    const viewerReactions = new Set(Array.isArray(post.viewer_reactions) ? post.viewer_reactions : []);

    const header = document.createElement("div");
    header.className = "feed-post__header";
    header.append(createAvatar(post.display_name, post.avatar_url, post.author_user_id));

    const identity = document.createElement("a");
    identity.className = "feed-post__identity";
    identity.href = profileUrl(post.author_user_id);
    identity.innerHTML = `
      <strong>${escapeHtml(post.display_name || "ARI User")}</strong>
      <span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(post.created_at))}</span>
    `;
    header.append(identity);

    const kind = document.createElement("span");
    kind.className = "feed-post__kind";
    kind.textContent = `${meta.icon} ${meta.label}`;
    header.append(kind);
    article.append(header);

    const body = document.createElement("div");
    body.className = "feed-post__body";
    body.innerHTML = `<p>${escapeHtml(post.body || "")}</p>`;

    if (clean(post.activity)) {
      const activity = document.createElement("span");
      activity.className = "feed-post__activity";
      activity.textContent = post.activity;
      body.append(activity);
    }
    article.append(body);

    if (clean(post.media_url)) {
      const image = document.createElement("img");
      image.className = "feed-post__media";
      image.src = post.media_url;
      image.alt = "Shared ARI Circle media";
      image.loading = "lazy";
      article.append(image);
    }

    const reactionHost = document.createElement("div");
    reactionHost.className = "feed-post__reactions";
    reactions.forEach((reaction) => {
      const emoji = clean(reaction?.emoji);
      const count = Number(reaction?.count) || 0;
      if (!emoji || count <= 0) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "feed-reaction-pill";
      if (viewerReactions.has(emoji)) button.classList.add("is-active");
      button.textContent = `${emoji} ${count}`;
      button.addEventListener("click", () => toggleReaction(post.post_id, emoji));
      reactionHost.append(button);
    });
    article.append(reactionHost);

    const actions = document.createElement("div");
    actions.className = "feed-post__actions";

    const reactButton = document.createElement("button");
    reactButton.type = "button";
    reactButton.innerHTML = `<span aria-hidden="true">☺</span><span>React${Number(post.reaction_count) ? ` · ${Number(post.reaction_count)}` : ""}</span>`;
    reactButton.addEventListener("click", () => openReactionPicker(post.post_id));
    actions.append(reactButton);

    const commentButton = document.createElement("button");
    commentButton.type = "button";
    commentButton.innerHTML = `<span aria-hidden="true">◌</span><span>Comment${Number(post.comment_count) ? ` · ${Number(post.comment_count)}` : ""}</span>`;
    commentButton.addEventListener("click", () => openComments(post));
    actions.append(commentButton);

    const reportLink = document.createElement("a");
    reportLink.className = "feed-report-link";
    reportLink.href = reportUrl(post);
    reportLink.setAttribute("aria-label", "Report post or get safety help");
    reportLink.textContent = "•••";
    actions.append(reportLink);

    article.append(actions);
    return article;
  }

  function openReactionPicker(postId) {
    state.activeReactionPostId = postId;
    $("customReactionInput").value = "";
    openDialog("reactionDialog");
  }

  async function toggleReaction(postId, emoji) {
    const cleanEmoji = clean(emoji);
    if (!postId || !cleanEmoji || state.busy) return;

    state.busy = true;
    try {
      await rpc("ari_circle_feed_toggle_reaction", {
        requested_post_id: postId,
        requested_emoji: cleanEmoji
      });
      closeDialog("reactionDialog");
      await Promise.all([refreshFeed(), loadRewards()]);
    } catch (error) {
      console.error("ARI Circle reaction failed:", error);
      showToast(error.message || "Could not react.", 4200);
    } finally {
      state.busy = false;
    }
  }

  function bindReactionPicker() {
    $("quickReactionGrid")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reaction]");
      if (!button) return;
      toggleReaction(state.activeReactionPostId, button.dataset.reaction);
    });

    $("customReactionForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = clean($("customReactionInput").value);
      if (!value) {
        showToast("Choose or enter an emoji.");
        return;
      }
      toggleReaction(state.activeReactionPostId, value);
    });
  }

  async function openComments(post) {
    state.activeCommentsPost = post;
    $("commentInput").value = "";
    openDialog("commentsDialog");
    await loadComments(post.post_id);
  }

  async function loadComments(postId) {
    const host = $("commentsList");
    const empty = $("commentsEmpty");
    host.innerHTML = `<p class="feed-status">Loading comments…</p>`;
    empty.hidden = true;

    try {
      const data = await rpc("ari_circle_feed_list_comments", {
        requested_post_id: postId,
        result_limit: 80
      });
      renderComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ARI Circle comments failed to load:", error);
      host.replaceChildren();
      empty.hidden = false;
      empty.querySelector("p").textContent = error.message || "Comments unavailable right now.";
    }
  }

  function renderComments(comments) {
    const host = $("commentsList");
    const empty = $("commentsEmpty");
    host.replaceChildren();

    if (!comments.length) {
      empty.hidden = false;
      empty.querySelector("p").textContent = "No comments yet. Say something.";
      return;
    }

    empty.hidden = true;
    comments.forEach((comment) => {
      const row = document.createElement("article");
      row.className = "feed-comment";
      row.append(createAvatar(comment.display_name, comment.avatar_url, comment.author_user_id));

      const bubble = document.createElement("div");
      bubble.className = "feed-comment__bubble";
      bubble.innerHTML = `
        <strong>${escapeHtml(comment.display_name || "ARI User")}</strong>
        <p>${escapeHtml(comment.body || "")}</p>
        <small>${escapeHtml(relativeTime(comment.created_at))}</small>
      `;
      row.append(bubble);
      host.append(row);
    });
  }

  async function addComment(event) {
    event.preventDefault();
    const post = state.activeCommentsPost;
    const body = clean($("commentInput").value);

    if (!post || !body || state.busy) return;
    state.busy = true;

    try {
      await rpc("ari_circle_feed_add_comment", {
        requested_post_id: post.post_id,
        requested_body: body
      });
      $("commentInput").value = "";
      await Promise.all([
        loadComments(post.post_id),
        refreshFeed(),
        loadRewards()
      ]);
    } catch (error) {
      console.error("ARI Circle comment failed:", error);
      showToast(error.message || "Could not add comment.", 4200);
    } finally {
      state.busy = false;
    }
  }

  async function loadRewards() {
    try {
      const data = await rpc("ari_circle_my_feed_rewards");
      state.rewards = Array.isArray(data) ? data : [];
      renderRewards();
    } catch (error) {
      console.warn("ARI Circle rewards unavailable:", error);
      state.rewards = [];
      renderRewards();
    }
  }

  function renderRewards() {
    const host = $("rewardStrip");
    const unlocked = new Set(state.rewards.map((reward) => reward.reward_key));
    host.replaceChildren();

    REWARD_ORDER.forEach((key) => {
      const meta = REWARD_META[key];
      const card = document.createElement("article");
      card.className = "feed-reward-card";
      if (!unlocked.has(key)) card.classList.add("is-locked");

      card.innerHTML = `
        <img src="${escapeHtml(meta.asset)}" alt="" />
        <strong>${escapeHtml(meta.title)}</strong>
        <small>${escapeHtml(unlocked.has(key) ? meta.copy : `Locked · ${meta.copy}`)}</small>
      `;
      host.append(card);
    });

    $("rewardCount").textContent = `${unlocked.size} unlocked`;
  }

  function bindCommonUi() {
    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close-dialog]");
      if (close) closeDialog(close.dataset.closeDialog);
    });

    $("feedPostBody")?.addEventListener("input", () => {
      $("postCharCount").textContent = String($("feedPostBody").value.length);
    });

    $("feedComposerForm")?.addEventListener("submit", publishPost);
    $("ageForm")?.addEventListener("submit", verifyAge);
    $("commentForm")?.addEventListener("submit", addComment);
    $("refreshFeedButton")?.addEventListener("click", refreshFeed);
    $("loadMoreButton")?.addEventListener("click", () => loadFeed({ append: true }));
    $("emptyComposeButton")?.addEventListener("click", () => {
      $("feedPostBody")?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.querySelectorAll("[data-coming-soon]").forEach((button) => {
      button.addEventListener("click", () => {
        showToast(`${button.dataset.comingSoon} is the next ARI Circle layer.`);
      });
    });
  }

  async function init() {
    try {
      state.client = window.calbuddySupabase || window.supabaseClient || null;
      if (!state.client) throw new Error("Supabase is unavailable.");

      const user = await requireUser();
      if (!user) return;

      bindPostTypes();
      bindReactionPicker();
      bindCommonUi();

      await Promise.all([
        loadOwnProfile(),
        loadAgeState()
      ]);

      $("feedPage").hidden = false;
      $("feedLoading").hidden = true;

      if (!state.age?.verified) {
        $("feedStatus").textContent = "Verify your age to open your Circle feed.";
        openDialog("ageDialog");
        renderRewards();
        return;
      }

      await Promise.all([
        refreshFeed(),
        loadRewards()
      ]);
    } catch (error) {
      console.error("ARI Circle feed failed to start:", error);
      $("feedLoading").innerHTML = `
        <strong>ARI Circle couldn’t open.</strong>
        <span>${escapeHtml(error.message || "Please try again.")}</span>
        <a class="feed-secondary" href="ari-circle.html">Back to ARI Circle</a>
      `;
    }
  }

  window.AriCircleFeed = Object.freeze({
    version: VERSION,
    refresh: refreshFeed
  });

  document.addEventListener("DOMContentLoaded", init);
})();