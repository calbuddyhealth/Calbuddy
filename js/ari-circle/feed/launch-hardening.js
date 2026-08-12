/* =============================================================
   ARI CIRCLE — FEED LAUNCH HARDENING
   Version: 1.0.0

   Launch-critical behavior:
   - The post ••• button NEVER navigates directly to safety/reporting.
   - ••• opens only Delete / Hide / Report.
   - Delete appears only for the post owner.
   - Camera always starts at the lowest exposed optical zoom.
   - Camera/Moment UI remains safe when legacy/V4 handlers are present.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const MEDIA_BUCKET = "ari-circle-post-media";
  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();

  const state = {
    client: null,
    user: null,
    activePostId: null,
    activeReportUrl: "help-safety.html",
    activeMediaPath: null,
    activePostOwner: false,
    patchedLinks: new WeakSet(),
    observer: null,
    started: false
  };

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const c = client();
    if (!c) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await c.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function toast(message) {
    const host = $("feedToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 2800);
  }

  function buildReportUrl(article, original) {
    const postId = clean(article?.dataset.postId);
    const authorUserId = clean(article?.querySelector(".feed-post__identity")?.href?.match(/[?&]user=([^&]+)/)?.[1]);
    if (original && !/^#|^javascript:/i.test(original)) return original;
    const params = new URLSearchParams({ target_type: "feed_post" });
    if (postId) params.set("target_id", postId);
    if (authorUserId) {
      try { params.set("reported_user_id", decodeURIComponent(authorUserId)); } catch {}
    }
    return `help-safety.html?${params.toString()}`;
  }

  function patchPostOptionControl(control) {
    if (!control || state.patchedLinks.has(control)) return;
    state.patchedLinks.add(control);

    const article = control.closest(".feed-post[data-post-id]");
    const original = clean(control.getAttribute("href"));
    control.dataset.launchReportUrl = buildReportUrl(article, original);
    control.dataset.feedPostOptions = "true";
    control.setAttribute("aria-haspopup", "dialog");
    control.setAttribute("aria-label", "Post options");

    /* Never allow the browser's default anchor navigation to become the
       fallback behavior for the ••• control. */
    if (control.tagName === "A") control.setAttribute("href", "#");
  }

  function patchAllPostControls(root = document) {
    root.querySelectorAll?.(".feed-post .feed-report-link, .feed-post [data-feed-post-options]").forEach(patchPostOptionControl);
  }

  function optionsDialog() {
    let dialog = $("circleLaunchPostOptions");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "circleLaunchPostOptions";
    dialog.className = "circle-launch-post-options";
    dialog.innerHTML = `
      <div class="circle-launch-post-options__panel">
        <div class="circle-launch-post-options__title">Post options</div>
        <button id="circleLaunchDeletePost" data-danger="true" type="button"><span>Delete</span><span>›</span></button>
        <button id="circleLaunchHidePost" type="button"><span>Hide</span><span>›</span></button>
        <button id="circleLaunchReportPost" type="button"><span>Report</span><span>›</span></button>
        <button id="circleLaunchCancelPost" type="button"><span>Cancel</span></button>
      </div>`;
    document.body.append(dialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    $("circleLaunchCancelPost")?.addEventListener("click", () => dialog.close());
    $("circleLaunchDeletePost")?.addEventListener("click", deletePost);
    $("circleLaunchHidePost")?.addEventListener("click", hidePost);
    $("circleLaunchReportPost")?.addEventListener("click", () => {
      dialog.close();
      window.location.href = state.activeReportUrl || "help-safety.html";
    });

    return dialog;
  }

  async function openOptions(control) {
    const article = control.closest(".feed-post[data-post-id]");
    const postId = clean(article?.dataset.postId);
    if (!article || !postId) return;

    state.activePostId = postId;
    state.activeReportUrl = clean(control.dataset.launchReportUrl) || "help-safety.html";
    state.activeMediaPath = null;
    state.activePostOwner = false;

    const dialog = optionsDialog();
    const deleteButton = $("circleLaunchDeletePost");
    if (deleteButton) deleteButton.hidden = true;
    if (!dialog.open) dialog.showModal();

    try {
      const result = await rpc("ari_circle_feed_post_options_context", {
        requested_post_id: postId
      });
      const row = Array.isArray(result) ? result[0] : result;
      state.activePostOwner = Boolean(row?.is_owner);
      state.activeMediaPath = clean(row?.media_path);
      if (deleteButton) deleteButton.hidden = !state.activePostOwner;
    } catch (error) {
      console.warn("ARI Circle post options context unavailable:", error);
    }
  }

  async function hidePost() {
    if (!state.activePostId) return;
    try {
      await rpc("ari_circle_feed_hide_post", {
        requested_post_id: state.activePostId
      });
      $("circleLaunchPostOptions")?.close?.();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(state.activePostId)}"]`)?.remove();
      toast("Post hidden.");
      await window.AriCircleFeed?.refresh?.();
    } catch (error) {
      toast(error.message || "Could not hide that post.");
    }
  }

  async function deletePost() {
    if (!state.activePostId || !state.activePostOwner) return;
    try {
      await rpc("ari_circle_feed_delete_post", {
        requested_post_id: state.activePostId
      });
      if (state.activeMediaPath) {
        try {
          await client()?.storage?.from(MEDIA_BUCKET)?.remove?.([state.activeMediaPath]);
        } catch {}
      }
      $("circleLaunchPostOptions")?.close?.();
      document.querySelector(`.feed-post[data-post-id="${CSS.escape(state.activePostId)}"]`)?.remove();
      toast("Post deleted.");
      await window.AriCircleFeed?.refresh?.();
      await window.AriCircleProfileV4?.refresh?.();
    } catch (error) {
      toast(error.message || "Could not delete that post.");
    }
  }

  function bindPostOptions() {
    document.addEventListener("click", (event) => {
      const control = event.target.closest(".feed-post .feed-report-link, .feed-post [data-feed-post-options]");
      if (!control) return;
      patchPostOptionControl(control);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openOptions(control);
    }, true);
  }

  async function forceLowestCameraZoom() {
    const video = $("ariCameraVideo");
    const track = video?.srcObject?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.();
      const min = Number(caps?.zoom?.min);
      if (!Number.isFinite(min)) return;
      await track.applyConstraints({ advanced: [{ zoom: min }] });
    } catch {
      /* Some iPhone camera tracks do not expose writable zoom. */
    }
  }

  function patchCamera() {
    const video = $("ariCameraVideo");
    if (!video || video.dataset.launchCameraPatched === "true") return;
    video.dataset.launchCameraPatched = "true";
    video.addEventListener("loadedmetadata", () => setTimeout(forceLowestCameraZoom, 40));
    video.addEventListener("playing", () => setTimeout(forceLowestCameraZoom, 40));
  }

  function observeUi() {
    if (state.observer) return;
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(".feed-report-link, [data-feed-post-options]")) patchPostOptionControl(node);
          patchAllPostControls(node);
          if (node.id === "ariCircleCamera" || node.querySelector?.("#ariCameraVideo")) patchCamera();
        });
      }
      patchAllPostControls();
      patchCamera();
    });
    state.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function init() {
    if (state.started || !document.querySelector(".feed-page")) return;
    state.started = true;
    state.client = client();
    if (state.client) {
      try {
        const { data } = await state.client.auth.getUser();
        state.user = data?.user || null;
      } catch {}
    }
    patchAllPostControls();
    bindPostOptions();
    observeUi();
    patchCamera();
    setTimeout(patchAllPostControls, 180);
    setTimeout(patchCamera, 220);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AriCircleLaunchHardening = Object.freeze({
    version: VERSION,
    refresh: () => {
      patchAllPostControls();
      patchCamera();
    }
  });
})();
