/* =============================================================
   ARI CIRCLE — CHALLENGE VIDEO RUNTIME
   Version: 1.0.0
   Build 5

   Mobile reliability layer for Challenge video entries:
   - makes iPhone/Safari video duration detection reliable before validation
   - normalizes common iOS video MIME types
   - keeps Challenge errors visible while a modal dialog is open
   - uses video/* for the web Camera / Library picker
   - autoplays visible Challenge videos muted and inline
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ENTRY_INPUT_ID = "challengeEntryMediaInput";
  const REPLAY_FLAG = "ariChallengeVideoReplay";
  const VIDEO_LIMITS = Object.freeze([10, 15, 30]);
  const $ = (id) => document.getElementById(id);

  let activeVideo = null;
  let playbackObserver = null;
  let domObserver = null;
  let toastObserver = null;

  function clean(value) {
    return String(value ?? "").trim();
  }

  function isVideoEntryOpen() {
    const dialog = $("entryDialog");
    const rule = clean($("entryMediaRule")?.textContent).toUpperCase();
    return Boolean(dialog?.open && rule.startsWith("VIDEO"));
  }

  function currentLimit() {
    const text = clean($("entryMediaRule")?.textContent);
    const match = text.match(/(10|15|30)\s*SEC/i);
    const value = Number(match?.[1]);
    return VIDEO_LIMITS.includes(value) ? value : 30;
  }

  function inferVideoMime(file) {
    const type = clean(file?.type).toLowerCase();
    if (type.startsWith("video/")) return type;

    const name = clean(file?.name).toLowerCase();
    if (/\.mov$/i.test(name)) return "video/quicktime";
    if (/\.(mp4|m4v)$/i.test(name)) return "video/mp4";
    if (/\.webm$/i.test(name)) return "video/webm";
    return "";
  }

  function normalizeVideoMime(file) {
    const mime = inferVideoMime(file);
    if (!mime || clean(file?.type).toLowerCase().startsWith("video/")) return mime;

    try {
      Object.defineProperty(file, "type", {
        configurable: true,
        enumerable: false,
        value: mime
      });
    } catch {}

    return mime;
  }

  function setKnownDuration(file, duration) {
    const value = Number(duration);
    if (!file || !Number.isFinite(value) || value <= 0) return;
    try {
      Object.defineProperty(file, "ariRecordedDuration", {
        configurable: true,
        enumerable: false,
        value
      });
    } catch {}
  }

  function waitForDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      let settled = false;
      let fallbackStarted = false;
      let timer = 0;

      const cleanup = () => {
        if (timer) window.clearTimeout(timer);
        video.onloadedmetadata = null;
        video.ondurationchange = null;
        video.ontimeupdate = null;
        video.onerror = null;
        video.removeAttribute("src");
        try { video.load(); } catch {}
        URL.revokeObjectURL(url);
      };

      const finish = (value) => {
        if (settled) return;
        settled = true;
        const duration = Number(value);
        cleanup();
        resolve(Number.isFinite(duration) && duration > 0 ? duration : 0);
      };

      const read = () => {
        const duration = Number(video.duration);
        if (Number.isFinite(duration) && duration > 0) {
          finish(duration);
          return true;
        }
        return false;
      };

      const startSafariFallback = () => {
        if (fallbackStarted || settled) return;
        fallbackStarted = true;
        video.ondurationchange = read;
        video.ontimeupdate = read;
        try {
          video.currentTime = 1e10;
        } catch {}
      };

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        if (!read()) startSafariFallback();
      };
      video.onerror = () => finish(0);
      timer = window.setTimeout(() => finish(video.duration), 9000);
      video.src = url;
      try { video.load(); } catch {}
    });
  }

  function ensureEntryStatus() {
    let status = $("challengeVideoRuntimeStatus");
    if (status) return status;

    const actions = document.querySelector("#entryDialog .challenge-entry-media-actions");
    if (!actions) return null;

    status = document.createElement("p");
    status.id = "challengeVideoRuntimeStatus";
    status.className = "challenge-video-runtime-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    actions.insertAdjacentElement("afterend", status);
    return status;
  }

  function setEntryStatus(message = "", state = "info") {
    const status = ensureEntryStatus();
    if (!status) return;
    status.textContent = clean(message);
    status.dataset.state = state;
    status.hidden = !clean(message);
  }

  function configurePicker() {
    const input = $(ENTRY_INPUT_ID);
    if (!input || !isVideoEntryOpen()) return;
    input.accept = "video/*";
  }

  async function interceptEntryVideoChange(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.id !== ENTRY_INPUT_ID) return;

    if (input.dataset[REPLAY_FLAG] === "1") {
      delete input.dataset[REPLAY_FLAG];
      return;
    }

    if (!isVideoEntryOpen()) return;
    const file = input.files?.[0] || null;
    if (!file) return;

    event.stopImmediatePropagation();
    normalizeVideoMime(file);

    const mime = inferVideoMime(file);
    if (!mime) {
      setEntryStatus("That file is not a supported video. Choose an MP4, MOV, or WebM video.", "error");
      input.value = "";
      return;
    }

    const sizeMb = Number(file.size || 0) / (1024 * 1024);
    if (sizeMb > 50) {
      setEntryStatus(`This video is ${sizeMb.toFixed(1)} MB. Challenge videos must stay under 50 MB. Record a shorter clip or choose a smaller video.`, "error");
      input.value = "";
      return;
    }

    setEntryStatus("Checking video length…", "working");
    const duration = await waitForDuration(file);
    if (!duration) {
      setEntryStatus("ARI could not read this video's length. Choose the video again or record a new clip.", "error");
      input.value = "";
      return;
    }

    setKnownDuration(file, duration);
    const limit = currentLimit();
    if (duration > limit + 0.5) {
      setEntryStatus(`This video is ${duration.toFixed(1)} seconds. This challenge allows ${limit} seconds maximum.`, "error");
    } else {
      setEntryStatus(`Video ready · ${duration.toFixed(1)}s of ${limit}s`, "success");
    }

    input.dataset[REPLAY_FLAG] = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function topOpenDialog() {
    const dialogs = Array.from(document.querySelectorAll("dialog[open]"));
    return dialogs.length ? dialogs[dialogs.length - 1] : null;
  }

  function placeToastInTopLayer() {
    const toast = $("challengeToast");
    if (!toast) return;

    const dialog = topOpenDialog();
    if (!toast.hidden && dialog && !dialog.contains(toast)) {
      dialog.appendChild(toast);
      return;
    }

    if ((toast.hidden || !dialog) && toast.parentElement !== document.body) {
      document.body.appendChild(toast);
    }
  }

  function configureToast() {
    const toast = $("challengeToast");
    if (!toast || toastObserver) return;

    toastObserver = new MutationObserver(placeToastInTopLayer);
    toastObserver.observe(toast, {
      attributes: true,
      attributeFilter: ["hidden"],
      childList: true,
      characterData: true,
      subtree: true
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("close", () => window.setTimeout(placeToastInTopLayer, 0));
    });
  }

  function ensurePlaybackObserver() {
    if (playbackObserver || !("IntersectionObserver" in window)) return;

    playbackObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const canPlay =
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.68 &&
          !document.hidden &&
          !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

        if (canPlay) {
          if (activeVideo && activeVideo !== video) activeVideo.pause();
          activeVideo = video;
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
          if (activeVideo === video) activeVideo = null;
        }
      });
    }, { threshold: [0, 0.68, 1] });
  }

  function configurePlaybackVideo(video) {
    if (!(video instanceof HTMLVideoElement) || video.dataset.ariChallengeAutoplay === "1") return;
    video.dataset.ariChallengeAutoplay = "1";
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    ensurePlaybackObserver();
    if (playbackObserver) playbackObserver.observe(video);
    else video.play().catch(() => {});
  }

  function scanPlayback(root = document) {
    if (root instanceof HTMLVideoElement && root.matches(".challenge-card video, .challenge-entry-item video, .challenge-recent-card video")) {
      configurePlaybackVideo(root);
    }

    root?.querySelectorAll?.(".challenge-card video, .challenge-entry-item video, .challenge-recent-card video")
      .forEach(configurePlaybackVideo);
  }

  function watchDom() {
    if (domObserver || !document.documentElement) return;

    domObserver = new MutationObserver((mutations) => {
      let shouldConfigurePicker = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.target?.id === "entryDialog") {
          shouldConfigurePicker = true;
        }
        mutation.addedNodes?.forEach((node) => {
          if (node instanceof Element) scanPlayback(node);
        });
      });

      if (shouldConfigurePicker) {
        configurePicker();
        if (!isVideoEntryOpen()) setEntryStatus("");
      }
      placeToastInTopLayer();
    });

    domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"]
    });
  }

  function installStyles() {
    if ($("challengeVideoRuntimeStyles")) return;
    const style = document.createElement("style");
    style.id = "challengeVideoRuntimeStyles";
    style.textContent = `
      .challenge-video-runtime-status {
        margin: 10px 0 2px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(18, 52, 118, .06);
        color: #506078;
        font: 700 12px/1.45 Inter, system-ui, sans-serif;
      }
      .challenge-video-runtime-status[data-state="success"] { color: #087c64; background: rgba(15, 167, 132, .08); }
      .challenge-video-runtime-status[data-state="error"] { color: #a7374a; background: rgba(193, 54, 78, .08); }
      .challenge-video-runtime-status[data-state="working"] { color: #3058b8; }
      dialog[open] > .challenge-toast {
        position: fixed !important;
        z-index: 2147483647 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    installStyles();
    configureToast();
    configurePicker();
    scanPlayback(document);
    watchDom();

    document.addEventListener("change", interceptEntryVideoChange, true);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && activeVideo) activeVideo.pause();
    });
  }

  window.AriChallengeVideoRuntime = Object.freeze({
    version: VERSION,
    refresh() {
      configurePicker();
      scanPlayback(document);
      placeToastInTopLayer();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
