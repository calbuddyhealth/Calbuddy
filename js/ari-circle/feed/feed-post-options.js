/* =============================================================
   ARI CIRCLE — FEED POST OPTIONS
   Version: 1.0.0

   Feed-only hide, delete, and report controls for posts.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STYLE_ID = "ari-circle-feed-post-options-style";
  const state = {
    client: null,
    postId: null,
    postOwner: false,
    postMediaPath: null,
    reportUrl: "help-safety.html",
    started: false
  };

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-feed-post-options.css?v=1.0.0";
    document.head.append(link);
  }

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const current = client();
    if (!current?.rpc) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await current.rpc(name, params);
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

  function postOptionsDialog() {
    let dialog = $("circle-post-options-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "circle-post-options-dialog";
    dialog.className = "circle-post-options";
    dialog.innerHTML = `<div class="circle-post-options__panel">
      <div class="circle-post-options__title">Post options</div>
      <button class="circle-post-options__button circle-post-options__button--danger" id="circlePostDelete" type="button">Delete <span>›</span></button>
      <button class="circle-post-options__button" id="circlePostHide" type="button">Hide <span>›</span></button>
      <button class="circle-post-options__button" id="circlePostReport" type="button">Report <span>›</span></button>
    </div>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    $("circlePostDelete")?.addEventListener("click", deletePost);
    $("circlePostHide")?.addEventListener("click", hidePost);
    $("circlePostReport")?.addEventListener("click", () => {
      dialog.close();
      location.href = state.reportUrl;
    });
    return dialog;
  }

  async function openPostOptions(anchor) {
    const article = anchor.closest(".feed-post");
    state.postId = clean(article?.dataset.postId);
    if (!state.postId) return;

    state.reportUrl = anchor.getAttribute("href") || "help-safety.html";
    state.postOwner = false;
    state.postMediaPath = null;

    const dialog = postOptionsDialog();
    const remove = $("circlePostDelete");
    if (remove) remove.hidden = true;
    if (!dialog.open) dialog.showModal();

    try {
      const data = await rpc("ari_circle_feed_post_options_context", { requested_post_id: state.postId });
      const row = Array.isArray(data) ? data[0] : data;
      state.postOwner = Boolean(row?.is_owner);
      state.postMediaPath = clean(row?.media_path);
      if (remove) remove.hidden = !state.postOwner;
    } catch (error) {
      console.warn("ARI Circle post options context unavailable:", error);
    }
  }

  async function hidePost() {
    if (!state.postId) return;
    try {
      await rpc("ari_circle_feed_hide_post", { requested_post_id: state.postId });
      $("circle-post-options-dialog")?.close();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(state.postId)}"]`)?.remove();
      toast("Post hidden.");
      window.AriCircleFeed?.refresh?.();
    } catch (error) {
      toast(error.message || "Could not hide that post.");
    }
  }

  async function deletePost() {
    if (!state.postId || !state.postOwner) return;
    try {
      await rpc("ari_circle_feed_delete_post", { requested_post_id: state.postId });
      if (state.postMediaPath) {
        await client()?.storage?.from("ari-circle-post-media")?.remove?.([state.postMediaPath]);
      }
      $("circle-post-options-dialog")?.close();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(state.postId)}"]`)?.remove();
      toast("Post deleted.");
      window.AriCircleFeed?.refresh?.();
    } catch (error) {
      toast(error.message || "Could not delete that post.");
    }
  }

  function bindPostOptions() {
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest(".feed-report-link");
      if (!anchor) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openPostOptions(anchor);
    }, true);
  }

  function start() {
    if (state.started || !document.querySelector(".feed-page")) return;
    state.started = true;
    ensureStyle();
    bindPostOptions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.AriCircleFeedPostOptions = Object.freeze({
    version: VERSION,
    open: openPostOptions
  });
})();
