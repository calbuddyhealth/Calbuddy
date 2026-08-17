/* =============================================================
   ARI CIRCLE — CHALLENGE VIDEO WEB RECOVERY
   Version: 1.0.0

   Safari/PWA reliability layer for Build 5 Challenges:
   - Accepts iPhone MOV/MP4 selections even when the browser omits MIME type.
   - Reads duration before challenges.js validates the selected file.
   - Replays the normalized file into the existing Challenge upload flow.
   - Keeps one visible Challenge video autoplaying muted + inline.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const INPUT_IDS = new Set(["challengeEntryMediaInput", "challengeCoverInput"]);
  let playbackObserver = null;
  let mutationObserver = null;
  let activeVideo = null;

  const clean = (value) => String(value ?? "").trim();

  function inferredMime(file) {
    const current = clean(file?.type).toLowerCase();
    if (current.startsWith("video/") || current.startsWith("image/")) return current;

    const name = clean(file?.name).toLowerCase();
    if (/\.mov$/.test(name)) return "video/quicktime";
    if (/\.(mp4|m4v)$/.test(name)) return "video/mp4";
    if (/\.webm$/.test(name)) return "video/webm";
    if (/\.heic$/.test(name)) return "image/heic";
    if (/\.heif$/.test(name)) return "image/heif";
    if (/\.png$/.test(name)) return "image/png";
    if (/\.webp$/.test(name)) return "image/webp";
    if (/\.(jpg|jpeg)$/.test(name)) return "image/jpeg";
    return current;
  }

  function normalizeFile(file) {
    if (!(file instanceof Blob)) return file;
    const mime = inferredMime(file);
    if (!mime || clean(file.type).toLowerCase() === mime) return file;

    try {
      return new File(
        [file],
        clean(file.name) || (mime.startsWith("video/") ? "ari-challenge.mov" : "ari-challenge.jpg"),
        {
          type: mime,
          lastModified: Number(file.lastModified) || Date.now()
        }
      );
    } catch {
      return file;
    }
  }

  function replaceInputFile(input, file) {
    if (!input || !file || typeof DataTransfer !== "function") return false;
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      return input.files?.length === 1;
    } catch {
      return false;
    }
  }

  function attachDuration(file, duration) {
    if (!file || !Number.isFinite(duration) || duration <= 0) return;
    try {
      Object.defineProperty(file, "ariRecordedDuration", {
        configurable: true,
        enumerable: false,
        value: duration
      });
    } catch {}
  }

  function inspectDuration(file) {
    return new Promise((resolve) => {
      if (!(file instanceof Blob)) return resolve(0);

      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      let finished = false;
      let triedInfinitySeek = false;

      const finish = (value) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { video.pause(); } catch {}
        video.removeAttribute("src");
        try { video.load(); } catch {}
        URL.revokeObjectURL(url);
        const duration = Number(value);
        resolve(Number.isFinite(duration) && duration > 0 ? duration : 0);
      };

      const inspect = () => {
        const duration = Number(video.duration);
        if (Number.isFinite(duration) && duration > 0) {
          finish(duration);
          return;
        }
        if (duration === Infinity && !triedInfinitySeek) {
          triedInfinitySeek = true;
          try { video.currentTime = 1e101; } catch {}
        }
      };

      const timer = window.setTimeout(() => finish(video.duration), 9000);
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.addEventListener("loadedmetadata", inspect);
      video.addEventListener("durationchange", inspect);
      video.addEventListener("canplay", inspect);
      video.addEventListener("error", () => finish(0), { once: true });
      video.src = url;
      try { video.load(); } catch {}
    });
  }

  async function interceptSelection(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !INPUT_IDS.has(input.id)) return;
    if (input.dataset.ariNormalizedDispatch === "1") return;

    const original = input.files?.[0];
    if (!original) return;

    const normalized = normalizeFile(original);
    const mime = inferredMime(normalized);

    if (!mime.startsWith("video/")) {
      if (normalized !== original) replaceInputFile(input, normalized);
      try { window.AriCircleContentModeration?.rememberFile?.(input.id, normalized); } catch {}
      return;
    }

    // Prevent challenges.js from receiving the original iOS File until its
    // MIME and duration have been normalized. Then replay exactly one change.
    event.stopImmediatePropagation();

    const duration = await inspectDuration(normalized);
    attachDuration(normalized, duration);
    replaceInputFile(input, normalized);
    try { window.AriCircleContentModeration?.rememberFile?.(input.id, normalized); } catch {}

    input.dataset.ariNormalizedDispatch = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    delete input.dataset.ariNormalizedDispatch;
  }

  function preparePicker(event) {
    const button = event.target?.closest?.("#pickChallengeEntryMedia, #pickChallengeCover");
    if (!button) return;

    const input = button.id === "pickChallengeCover"
      ? document.getElementById("challengeCoverInput")
      : document.getElementById("challengeEntryMediaInput");

    if (!input) return;
    const accept = clean(input.accept).toLowerCase();
    if (accept.includes("video")) input.accept = "video/*";
    else if (accept.includes("image")) input.accept = "image/*";
  }

  function qualifies(video) {
    return Boolean(video?.closest?.(
      ".challenge-card__media, .challenge-entry-item__media, .challenge-recent-card__media"
    ));
  }

  function prepareVideo(video) {
    if (!(video instanceof HTMLVideoElement) || !qualifies(video)) return;
    if (video.dataset.ariChallengePlayback === VERSION) return;

    video.dataset.ariChallengePlayback = VERSION;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = true;
    video.autoplay = true;
    video.preload = "metadata";
    playbackObserver?.observe(video);
  }

  function scan(root = document) {
    if (root instanceof HTMLVideoElement) prepareVideo(root);
    root?.querySelectorAll?.(
      ".challenge-card__media video, .challenge-entry-item__media video, .challenge-recent-card__media video"
    )?.forEach(prepareVideo);
  }

  function setupPlayback() {
    if ("IntersectionObserver" in window) {
      playbackObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const video = entry.target;
          const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

          if (entry.isIntersecting && entry.intersectionRatio >= .62 && !reducedMotion) {
            if (activeVideo && activeVideo !== video) {
              try { activeVideo.pause(); } catch {}
            }
            activeVideo = video;
            video.muted = true;
            video.play().catch(() => {});
          } else {
            try { video.pause(); } catch {}
            if (activeVideo === video) activeVideo = null;
          }
        }
      }, { threshold: [0, .62, 1] });
    }

    scan(document);

    if (document.documentElement) {
      mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes || []) {
            if (node instanceof Element) scan(node);
          }
        }
      });
      mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && activeVideo) {
        try { activeVideo.pause(); } catch {}
      }
    });
  }

  function init() {
    document.addEventListener("click", preparePicker, true);
    document.addEventListener("change", (event) => { void interceptSelection(event); }, true);
    setupPlayback();
  }

  init();
  window.AriChallengeVideoWebFix = Object.freeze({ version: VERSION, refresh: () => scan(document) });
})();
