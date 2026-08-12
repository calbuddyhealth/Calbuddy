/* =============================================================
   ARI CIRCLE — iOS CAMERA RECOVERY
   Version: 1.0.0

   iPhone / Safari hardening:
   - Lets the ARI camera shell paint before Safari shows permissions.
   - Owns the Feed camera tap so legacy file-input behavior cannot race it.
   - Replays / reattaches a granted MediaStream when iOS 26 delays frames.
   - Performs one clean camera restart if the first stream stays blank.
   - Keeps the live preview uncropped so framing matches the captured file.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const MAX_WAIT_FOR_MODULE_MS = 1800;
  const FIRST_FRAME_WAIT_MS = 1800;
  const SECOND_FRAME_WAIT_MS = 1200;
  const $ = (id) => document.getElementById(id);

  let opening = false;
  let recoveryAttempt = 0;
  let retryBound = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nextPaint = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  function cameraIsOpen() {
    const dialog = $("ariCircleCamera");
    return Boolean(dialog && (dialog.open || !dialog.hidden));
  }

  function frameReady(video) {
    return Boolean(
      video &&
      video.srcObject &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    );
  }

  function prepareVideo(video) {
    if (!video) return;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.setProperty("object-fit", "contain", "important");
    video.style.setProperty("background", "#000", "important");
  }

  function setStatus(message) {
    const status = $("ariCameraStatus");
    if (status) status.textContent = message;
  }

  function hideFailurePanel() {
    const panel = $("ariCameraPermission");
    if (panel) panel.hidden = true;
  }

  function showRetryPanel() {
    const panel = $("ariCameraPermission");
    if (!panel) return;

    const title = panel.querySelector("strong");
    const text = panel.querySelector("p");
    if (title) title.textContent = "Camera needs another try";
    if (text) text.textContent = "Safari granted access, but the camera preview did not start. Try the camera again or choose from your library.";

    let retry = $("ariCameraRetry");
    if (!retry) {
      retry = document.createElement("button");
      retry.id = "ariCameraRetry";
      retry.type = "button";
      retry.textContent = "Try Camera Again";
      panel.insertBefore(retry, $("ariCameraPermissionLibrary") || null);
    }

    if (!retryBound) {
      retryBound = true;
      retry.addEventListener("click", () => {
        recoveryAttempt = 0;
        openCamera({ force: true });
      });
    }

    panel.hidden = false;
  }

  async function waitForCameraModule() {
    const started = performance.now();
    while (performance.now() - started < MAX_WAIT_FOR_MODULE_MS) {
      if (typeof window.AriCircleCamera?.open === "function") return true;
      await sleep(30);
    }
    return false;
  }

  async function withPaintedPermissionRequest(callback) {
    const media = navigator.mediaDevices;
    const original = media?.getUserMedia;
    if (!media || typeof original !== "function") return callback();

    let patched = false;
    try {
      media.getUserMedia = function delayedGetUserMedia(constraints) {
        return new Promise((resolve, reject) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              Promise.resolve(original.call(media, constraints)).then(resolve, reject);
            });
          });
        });
      };
      patched = media.getUserMedia !== original;
    } catch {
      patched = false;
    }

    try {
      return await callback();
    } finally {
      if (patched) {
        try { media.getUserMedia = original; } catch {}
      }
    }
  }

  async function waitForFrame(video, timeoutMs) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (!cameraIsOpen()) return false;
      if (frameReady(video)) return true;
      try { await video?.play?.(); } catch {}
      await sleep(90);
    }
    return frameReady(video);
  }

  async function reattachStream(video) {
    const stream = video?.srcObject;
    if (!video || !stream) return false;

    prepareVideo(video);
    try { video.pause(); } catch {}
    try { video.srcObject = null; } catch {}
    await nextPaint();
    try { video.srcObject = stream; } catch {}
    prepareVideo(video);
    try { await video.play(); } catch {}
    return waitForFrame(video, SECOND_FRAME_WAIT_MS);
  }

  async function recoverPreview() {
    const video = $("ariCameraVideo");
    if (!video || !cameraIsOpen()) return false;

    prepareVideo(video);
    hideFailurePanel();
    setStatus("Starting camera…");

    try { await video.play(); } catch {}
    if (await waitForFrame(video, FIRST_FRAME_WAIT_MS)) {
      setStatus("Tap for photo · hold for video");
      recoveryAttempt = 0;
      return true;
    }

    setStatus("Waking camera…");
    if (await reattachStream(video)) {
      setStatus("Tap for photo · hold for video");
      recoveryAttempt = 0;
      return true;
    }

    if (recoveryAttempt < 1 && typeof window.AriCircleCamera?.open === "function") {
      recoveryAttempt += 1;
      setStatus("Restarting camera…");
      await withPaintedPermissionRequest(() => window.AriCircleCamera.open({ target: "feed" }));
      await nextPaint();
      const restarted = $("ariCameraVideo");
      prepareVideo(restarted);
      if (await waitForFrame(restarted, FIRST_FRAME_WAIT_MS + 700)) {
        hideFailurePanel();
        setStatus("Tap for photo · hold for video");
        recoveryAttempt = 0;
        return true;
      }
    }

    setStatus("Camera unavailable");
    showRetryPanel();
    return false;
  }

  async function openCamera({ force = false } = {}) {
    if (opening && !force) return;
    opening = true;

    try {
      if (!(await waitForCameraModule())) {
        $("feedMediaInput")?.click();
        return;
      }

      setStatus("Starting camera…");
      await withPaintedPermissionRequest(() => window.AriCircleCamera.open({ target: "feed" }));
      await nextPaint();
      await recoverPreview();
    } catch (error) {
      console.warn("ARI Circle iOS camera recovery failed:", error);
      if (cameraIsOpen()) showRetryPanel();
      else $("feedMediaInput")?.click();
    } finally {
      opening = false;
    }
  }

  function bindFeedCamera() {
    if (document.documentElement.dataset.ariIosCameraRecovery === VERSION) return;
    document.documentElement.dataset.ariIosCameraRecovery = VERSION;

    /* Prevent the dynamically loaded legacy camera module from installing a
       second Feed click handler. Its camera implementation is still reused. */
    document.documentElement.dataset.ariCircleCameraBound = "true";

    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("#feedMediaButton");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      recoveryAttempt = 0;
      openCamera();
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && cameraIsOpen()) {
        setTimeout(() => recoverPreview(), 120);
      }
    });
  }

  bindFeedCamera();

  window.AriCircleIOSCameraRecovery = Object.freeze({
    version: VERSION,
    open: openCamera,
    recover: recoverPreview
  });
})();
