/* =============================================================
   ARI CIRCLE — FEED OWNERSHIP CONTROLS
   Version: 1.0.0

   Adds:
   - Delete for your comments (and comments on your own post)
   - Delete for your own Moments
   - Stable ownership-aware controls without rebuilding Feed
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-feed-moderation-style";
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();

  const state = {
    client: null,
    user: null,
    activePostId: null,
    postOwner: false,
    commentRows: [],
    moments: [],
    activeMomentIndex: -1,
    commentTimer: 0,
    momentTimer: 0,
    bound: false
  };

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-feed-moderation.css?v=1.0.0";
    document.head.append(link);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function toast(message) {
    const host = $("feedToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 3000);
  }

  async function resolvePostOwner() {
    state.postOwner = false;
    if (!state.activePostId) return;
    try {
      const data = await rpc("ari_circle_feed_post_options_context", { requested_post_id: state.activePostId });
      const row = Array.isArray(data) ? data[0] : data;
      state.postOwner = Boolean(row?.is_owner);
    } catch {}
  }

  async function decorateComments() {
    clearTimeout(state.commentTimer);
    if (!state.activePostId || !state.user || !$("commentsList")) return;
    try {
      const [rows] = await Promise.all([
        rpc("ari_circle_feed_list_comments", { requested_post_id: state.activePostId, result_limit: 100 }),
        resolvePostOwner()
      ]);
      state.commentRows = Array.isArray(rows) ? rows : [];
      const nodes = [...$("commentsList").querySelectorAll(".feed-comment")];
      nodes.forEach((node, index) => {
        const comment = state.commentRows[index];
        if (!comment || node.querySelector(".feed-comment__delete")) return;
        const canDelete = clean(comment.author_user_id) === clean(state.user.id) || state.postOwner;
        if (!canDelete) return;
        const bubble = node.querySelector(".feed-comment__bubble") || node;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "feed-comment__delete";
        button.textContent = "Delete";
        button.setAttribute("aria-label", "Delete comment");
        button.addEventListener("click", () => deleteComment(comment.comment_id));
        bubble.append(button);
      });
    } catch (error) {
      console.warn("ARI Circle comment ownership controls unavailable:", error);
    }
  }

  async function deleteComment(commentId) {
    if (!commentId) return;
    try {
      await rpc("ari_circle_feed_delete_comment", { requested_comment_id: commentId });
      toast("Comment deleted.");
      await window.AriCircleFeed?.refresh?.();
      const trigger = document.querySelector(`.feed-post[data-post-id="${CSS.escape(state.activePostId)}"] .feed-post__actions button:last-child`);
      if (trigger && /comment/i.test(trigger.textContent || "")) {
        trigger.click();
      } else {
        $("commentsDialog")?.close?.();
      }
      scheduleComments(160);
    } catch (error) {
      console.error("ARI Circle comment delete failed:", error);
      toast(error.message || "Could not delete that comment.");
    }
  }

  function scheduleComments(delay = 120) {
    clearTimeout(state.commentTimer);
    state.commentTimer = setTimeout(decorateComments, delay);
  }

  async function mirrorMoments() {
    if (!state.client || !state.user) return;
    try {
      const rows = await rpc("ari_circle_moments_list", { result_limit: 120 });
      state.moments = Array.isArray(rows) ? rows : [];
      mapMomentBubbles();
      syncMomentDelete();
    } catch (error) {
      console.warn("ARI Circle Moment ownership controls unavailable:", error);
    }
  }

  function mapMomentBubbles() {
    const strip = $("momentsStrip");
    if (!strip || !state.moments.length) return;
    const latestByAuthor = new Map();
    state.moments.forEach((moment, index) => {
      if (!latestByAuthor.has(moment.author_user_id)) latestByAuthor.set(moment.author_user_id, index);
    });
    const indexes = [...latestByAuthor.values()];
    const bubbles = [...strip.querySelectorAll(".feed-moment-bubble:not(.feed-moment-add)")];
    bubbles.forEach((bubble, i) => {
      if (indexes[i] == null) return;
      bubble.dataset.v4MomentIndex = String(indexes[i]);
    });
  }

  function currentMoment() {
    if (state.activeMomentIndex < 0 || !state.moments.length) return null;
    return state.moments[state.activeMomentIndex] || null;
  }

  function syncMomentDelete() {
    const viewer = $("momentViewer");
    const top = viewer?.querySelector(".feed-moment-viewer__top");
    if (!top) return;
    top.querySelector("#deleteMomentButton")?.remove();
    const moment = currentMoment();
    if (!moment || clean(moment.author_user_id) !== clean(state.user?.id)) return;

    const button = document.createElement("button");
    button.id = "deleteMomentButton";
    button.className = "feed-moment-delete";
    button.type = "button";
    button.setAttribute("aria-label", "Delete Moment");
    button.textContent = "Delete";
    button.addEventListener("click", () => deleteMoment(moment));
    const close = top.querySelector("[data-close-dialog='momentViewer']");
    top.insertBefore(button, close || null);
  }

  async function deleteMoment(moment) {
    if (!moment?.moment_id) return;
    try {
      const mediaPath = await rpc("ari_circle_moment_delete", { requested_moment_id: moment.moment_id });
      if (clean(mediaPath)) {
        try { await state.client.storage.from("ari-circle-post-media").remove([clean(mediaPath)]); } catch {}
      }
      $("momentViewer")?.close?.();
      toast("Moment deleted.");
      state.activeMomentIndex = -1;
      await window.AriCircleFeed?.refresh?.();
      await mirrorMoments();
    } catch (error) {
      console.error("ARI Circle Moment delete failed:", error);
      toast(error.message || "Could not delete that Moment.");
    }
  }

  function scheduleMoments(delay = 120) {
    clearTimeout(state.momentTimer);
    state.momentTimer = setTimeout(mirrorMoments, delay);
  }

  function bind() {
    if (state.bound) return;
    state.bound = true;

    document.addEventListener("click", (event) => {
      const article = event.target.closest(".feed-post[data-post-id]");
      const button = event.target.closest("button");
      if (article && button && /comment/i.test(button.textContent || "")) {
        state.activePostId = clean(article.dataset.postId);
        scheduleComments(120);
        scheduleComments(360);
      }

      const bubble = event.target.closest(".feed-moment-bubble:not(.feed-moment-add)");
      if (bubble?.dataset.v4MomentIndex != null) {
        state.activeMomentIndex = Number(bubble.dataset.v4MomentIndex);
        setTimeout(syncMomentDelete, 50);
      }

      if (event.target.closest("#momentPrevButton")) {
        if (state.moments.length) state.activeMomentIndex = (state.activeMomentIndex - 1 + state.moments.length) % state.moments.length;
        setTimeout(syncMomentDelete, 40);
      }
      if (event.target.closest("#momentNextButton")) {
        if (state.moments.length) state.activeMomentIndex = (state.activeMomentIndex + 1) % state.moments.length;
        setTimeout(syncMomentDelete, 40);
      }
    }, true);

    $("commentForm")?.addEventListener("submit", () => scheduleComments(300));

    const comments = $("commentsList");
    if (comments) new MutationObserver(() => scheduleComments(80)).observe(comments, { childList: true });
    const moments = $("momentsStrip");
    if (moments) new MutationObserver(() => scheduleMoments(80)).observe(moments, { childList: true });
  }

  async function init() {
    if (!document.querySelector(".feed-page")) return;
    state.client = window.calbuddySupabase || window.supabaseClient || null;
    if (!state.client) return;
    const { data } = await state.client.auth.getUser();
    state.user = data?.user || null;
    if (!state.user) return;
    ensureStyle();
    bind();
    scheduleMoments(300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleFeedModeration = Object.freeze({ version: VERSION, refresh: () => { scheduleComments(40); scheduleMoments(40); } });
})();