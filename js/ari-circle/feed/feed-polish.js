/* =============================================================
   ARI CIRCLE — FEED POLISH
   Version: 1.0.2

   - Cleaner composer copy
   - Inline recent comments without extra taps
   - Pull-to-refresh instead of a permanent Refresh button
   - Quick Add Moment camera entry when Moments are visible
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.2";
  const STYLE_ID = "ari-circle-feed-polish-style";

  const state = {
    initialized: false,
    client: null,
    previewTimer: 0,
    previewBusy: false,
    touchStartY: 0,
    pulling: false,
    refreshing: false,
    feedObserver: null,
    momentObserver: null
  };

  const $ = (id) => document.getElementById(id);

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

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-feed-polish.css?v=1.0.0";
    document.head.append(link);
  }

  function getClient() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const client = getClient();
    if (!client) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function simplifyComposer() {
    const title = $("composerTitle");
    if (title && title.textContent.trim() !== "Share something") title.textContent = "Share something";

    const helper = document.querySelector(".feed-composer__top p");
    if (helper) helper.hidden = true;

    const textarea = $("feedPostBody");
    if (textarea && textarea.placeholder !== "What are you up to?") textarea.placeholder = "What are you up to?";

    const refresh = $("refreshFeedButton");
    if (refresh) {
      refresh.hidden = true;
      refresh.setAttribute("aria-hidden", "true");
      refresh.tabIndex = -1;
    }
  }

  function ensurePullIndicator() {
    let indicator = $("circlePullRefresh");
    if (indicator) return indicator;

    indicator = document.createElement("div");
    indicator.id = "circlePullRefresh";
    indicator.className = "circle-pull-refresh";
    indicator.setAttribute("aria-live", "polite");
    indicator.innerHTML = `
      <span class="circle-pull-refresh__orb" aria-hidden="true"></span>
      <strong>Pull to refresh</strong>
    `;

    const header = document.querySelector(".feed-header");
    if (header) header.insertAdjacentElement("afterend", indicator);
    else document.querySelector(".feed-page")?.prepend(indicator);
    return indicator;
  }

  function setPullState(mode, distance = 0) {
    const indicator = ensurePullIndicator();
    if (!indicator) return;

    indicator.classList.toggle("is-visible", mode !== "idle");
    indicator.classList.toggle("is-ready", mode === "ready");
    indicator.classList.toggle("is-refreshing", mode === "refreshing");
    indicator.style.setProperty("--pull-distance", `${Math.min(64, Math.max(0, distance * 0.42))}px`);

    const label = indicator.querySelector("strong");
    if (!label) return;
    if (mode === "ready") label.textContent = "Release to refresh";
    else if (mode === "refreshing") label.textContent = "Refreshing Circle";
    else label.textContent = "Pull to refresh";
  }

  async function refreshFeed() {
    if (state.refreshing) return;
    state.refreshing = true;
    setPullState("refreshing", 64);

    try {
      await window.AriCircleFeed?.refresh?.();
      scheduleCommentPreviews(80);
    } finally {
      window.setTimeout(() => {
        state.refreshing = false;
        state.pulling = false;
        setPullState("idle", 0);
      }, 350);
    }
  }

  function bindPullToRefresh() {
    if (document.documentElement.dataset.circlePullRefreshBound === "true") return;
    document.documentElement.dataset.circlePullRefreshBound = "true";

    document.addEventListener("touchstart", (event) => {
      if (state.refreshing || window.scrollY > 2 || event.touches.length !== 1) return;
      state.touchStartY = event.touches[0].clientY;
      state.pulling = true;
    }, { passive: true });

    document.addEventListener("touchmove", (event) => {
      if (!state.pulling || state.refreshing || !event.touches.length) return;
      const distance = Math.max(0, event.touches[0].clientY - state.touchStartY);
      if (distance < 8) return;
      setPullState(distance >= 82 ? "ready" : "pulling", distance);
    }, { passive: true });

    document.addEventListener("touchend", (event) => {
      if (!state.pulling || state.refreshing) return;
      const endY = event.changedTouches?.[0]?.clientY ?? state.touchStartY;
      const distance = Math.max(0, endY - state.touchStartY);
      state.pulling = false;
      if (distance >= 82 && window.scrollY <= 4) refreshFeed();
      else setPullState("idle", 0);
    }, { passive: true });

    document.addEventListener("touchcancel", () => {
      state.pulling = false;
      if (!state.refreshing) setPullState("idle", 0);
    }, { passive: true });
  }

  function openCommentsForArticle(article) {
    const actions = article?.querySelector(".feed-post__actions");
    const buttons = actions ? [...actions.querySelectorAll("button")] : [];
    const comment = buttons.find((button) => /comment/i.test(button.textContent || ""));
    comment?.click();
  }

  function renderCommentPreview(article, comments) {
    if (!article) return;
    article.querySelector(".feed-comment-preview")?.remove();

    if (!Array.isArray(comments) || !comments.length) return;

    const preview = document.createElement("div");
    preview.className = "feed-comment-preview";

    comments.forEach((comment) => {
      const name = clean(comment.display_name) || "ARI User";
      const body = clean(comment.body);
      if (!body) return;

      const row = document.createElement("button");
      row.type = "button";
      row.className = "feed-comment-preview__row";
      row.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${escapeHtml(body)}</span>`;
      row.addEventListener("click", () => openCommentsForArticle(article));
      preview.append(row);
    });

    const countText = [...article.querySelectorAll(".feed-post__actions button")]
      .map((button) => clean(button.textContent))
      .find((text) => /^comment/i.test(text));
    const countMatch = countText?.match(/(\d+)\s*$/);
    const total = Number(countMatch?.[1]) || comments.length;

    if (total > comments.length) {
      const all = document.createElement("button");
      all.type = "button";
      all.className = "feed-comment-preview__all";
      all.textContent = `View all ${total} comments`;
      all.addEventListener("click", () => openCommentsForArticle(article));
      preview.append(all);
    }

    const actions = article.querySelector(".feed-post__actions");
    article.insertBefore(preview, actions || null);
  }

  async function loadCommentPreviews() {
    if (state.previewBusy) return;
    const articles = [...document.querySelectorAll(".feed-post[data-post-id]")];
    const ids = articles.map((article) => clean(article.dataset.postId)).filter(Boolean);
    if (!ids.length) return;

    state.previewBusy = true;
    try {
      const rows = await rpc("ari_circle_feed_comment_previews", {
        requested_post_ids: ids,
        result_per_post: 2
      });

      const map = new Map((Array.isArray(rows) ? rows : []).map((row) => [clean(row.post_id), row.comments]));
      articles.forEach((article) => {
        const postId = clean(article.dataset.postId);
        renderCommentPreview(article, map.get(postId) || []);
      });
    } catch (error) {
      console.warn("ARI Circle comment previews unavailable:", error);
    } finally {
      state.previewBusy = false;
    }
  }

  function scheduleCommentPreviews(delay = 120) {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(loadCommentPreviews, delay);
  }

  function ensureMomentCameraEntry() {
    const section = $("momentsSection");
    const strip = $("momentsStrip");
    if (!section || !strip || section.hidden) return;
    if (strip.querySelector(".feed-moment-add")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "feed-moment-bubble feed-moment-add";
    button.setAttribute("aria-label", "Add a Moment");
    button.innerHTML = `
      <span class="feed-moment-bubble__ring">
        <span class="feed-moment-bubble__avatar feed-moment-add__avatar">+</span>
      </span>
      <strong>Add</strong>
    `;
    button.addEventListener("click", () => window.AriCircleCamera?.open?.({ target: "moment" }));
    strip.prepend(button);
  }

  function watchFeed() {
    const list = $("feedList");
    if (list && !state.feedObserver) {
      state.feedObserver = new MutationObserver((mutations) => {
        const feedChanged = mutations.some((mutation) => mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length));
        if (feedChanged) scheduleCommentPreviews(90);
      });
      state.feedObserver.observe(list, { childList: true });
    }

    const moments = $("momentsSection");
    const strip = $("momentsStrip");
    if (moments && strip && !state.momentObserver) {
      state.momentObserver = new MutationObserver(() => ensureMomentCameraEntry());
      state.momentObserver.observe(moments, { attributes: true, attributeFilter: ["hidden"] });
      state.momentObserver.observe(strip, { childList: true });
    }
  }

  function init() {
    if (state.initialized) return;
    if (!document.querySelector(".feed-page")) return;
    state.initialized = true;

    ensureStyle();
    simplifyComposer();
    ensurePullIndicator();
    bindPullToRefresh();
    watchFeed();
    ensureMomentCameraEntry();
    scheduleCommentPreviews(250);
  }

  window.AriCircleFeedPolish = Object.freeze({
    version: VERSION,
    refresh: () => {
      simplifyComposer();
      watchFeed();
      ensureMomentCameraEntry();
      scheduleCommentPreviews(40);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();