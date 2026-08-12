/* =============================================================
   ARI CIRCLE — CAMERA CAPTURE
   Version: 1.0.0

   One capture control:
   - Tap shutter = photo
   - Hold shutter = video
   - Release = stop recording
   - 30-second progress ring
   - Front/rear camera switch
   - Torch when supported
   - Library fallback
   - Retake / Use / Discard flow
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const MAX_VIDEO_SECONDS = 30;
  const LONG_PRESS_MS = 280;
  const STYLE_ID = "ari-circle-camera-style";
  const DIALOG_ID = "ariCircleCamera";

  const state = {
    initialized: false,
    dialog: null,
    stream: null,
    facingMode: "environment",
    recorder: null,
    chunks: [],
    recording: false,
    recordingStartedAt: 0,
    recordingDuration: 0,
    recordingRaf: 0,
    holdTimer: 0,
    pointerDown: false,
    capturedFile: null,
    capturedKind: null,
    previewUrl: null,
    target: "feed",
    torchOn: false,
    opening: false,
    useInProgress: false
  };

  const $ = (id) => document.getElementById(id);

  const CAMERA_ICON = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h1.15l1-1.5h5.7l1 1.5H17a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"></path>
      <circle cx="12" cy="12" r="3.2"></circle>
    </svg>
  `;

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-camera.css?v=1.0.0";
    document.head.append(link);
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function showToast(message) {
    const host = $("feedToast") || $("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      host.hidden = true;
    }, 3200);
  }

  function createDialog() {
    if (state.dialog) return state.dialog;

    const dialog = document.createElement("dialog");
    dialog.id = DIALOG_ID;
    dialog.className = "ari-camera";
    dialog.innerHTML = `
      <div class="ari-camera__shell">
        <header class="ari-camera__topbar">
          <button class="ari-camera__icon-button" id="ariCameraClose" type="button" aria-label="Close camera">×</button>
          <div class="ari-camera__status" id="ariCameraStatus">Tap for photo · hold for video</div>
          <button class="ari-camera__icon-button ari-camera__flash" id="ariCameraFlash" type="button" aria-label="Toggle flash" aria-pressed="false" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 6.8 12h4.6l-.7 10L17.5 11h-4.7l.4-9Z"></path></svg>
          </button>
        </header>

        <div class="ari-camera__stage" id="ariCameraStage">
          <video id="ariCameraVideo" autoplay muted playsinline></video>
          <div class="ari-camera__flash-frame" id="ariCameraFlashFrame" aria-hidden="true"></div>
          <div class="ari-camera__permission" id="ariCameraPermission" hidden>
            <strong>Camera unavailable</strong>
            <p>Choose a photo or video from your library instead.</p>
            <button id="ariCameraPermissionLibrary" type="button">Open Library</button>
          </div>

          <div class="ari-camera__review" id="ariCameraReview" hidden>
            <div class="ari-camera__review-media" id="ariCameraReviewMedia"></div>
          </div>

          <div class="ari-camera__discard" id="ariCameraDiscard" hidden>
            <div class="ari-camera__discard-card">
              <strong>Discard this capture?</strong>
              <span>You can retake it instead.</span>
              <div>
                <button id="ariCameraKeep" type="button">Keep</button>
                <button id="ariCameraDiscardConfirm" type="button">Discard</button>
              </div>
            </div>
          </div>
        </div>

        <div class="ari-camera__record-meta" id="ariCameraRecordMeta">
          <span id="ariCameraRecordLabel">Tap photo · hold video</span>
          <strong id="ariCameraTimer">0:30</strong>
        </div>

        <footer class="ari-camera__controls" id="ariCameraControls">
          <button class="ari-camera__library" id="ariCameraLibrary" type="button" aria-label="Choose from library">
            <span class="ari-camera__library-icon">▧</span>
            <small>Library</small>
          </button>

          <button class="ari-camera__shutter" id="ariCameraShutter" type="button" aria-label="Tap for photo or hold for video">
            <span class="ari-camera__shutter-core"></span>
          </button>

          <button class="ari-camera__switch" id="ariCameraSwitch" type="button" aria-label="Switch camera">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5.2 8.3A7.5 7.5 0 0 1 18 6.1l1.8 2"></path>
              <path d="M19.8 4.8v3.3h-3.4"></path>
              <path d="M18.8 15.7A7.5 7.5 0 0 1 6 17.9l-1.8-2"></path>
              <path d="M4.2 19.2v-3.3h3.4"></path>
            </svg>
            <small>Flip</small>
          </button>
        </footer>

        <footer class="ari-camera__review-actions" id="ariCameraReviewActions" hidden>
          <button id="ariCameraRetake" type="button">Retake</button>
          <button id="ariCameraUse" type="button">Use Photo</button>
        </footer>

        <input id="ariCameraLibraryInput" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" hidden />
      </div>
    `;

    document.body.append(dialog);
    state.dialog = dialog;
    bindDialog();
    return dialog;
  }

  function activeTrack() {
    return state.stream?.getVideoTracks?.()[0] || null;
  }

  function stopStream() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
    }
    state.stream = null;
    const video = $("ariCameraVideo");
    if (video) video.srcObject = null;
    state.torchOn = false;
  }

  function clearPreview() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
    state.capturedFile = null;
    state.capturedKind = null;
    state.recordingDuration = 0;
    $("ariCameraReviewMedia")?.replaceChildren();
  }

  function updateTorchButton() {
    const button = $("ariCameraFlash");
    const track = activeTrack();
    if (!button || !track) return;

    let supported = false;
    try {
      supported = Boolean(track.getCapabilities?.().torch);
    } catch {}

    button.hidden = !supported;
    button.setAttribute("aria-pressed", state.torchOn ? "true" : "false");
    button.classList.toggle("is-on", state.torchOn);
  }

  async function startStream() {
    const video = $("ariCameraVideo");
    const permission = $("ariCameraPermission");
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      if (permission) permission.hidden = false;
      return false;
    }

    stopStream();
    if (permission) permission.hidden = true;

    const videoConstraints = {
      facingMode: { ideal: state.facingMode },
      width: { ideal: 1080 },
      height: { ideal: 1920 }
    };

    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    } catch (firstError) {
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (error) {
        console.warn("ARI Circle camera permission unavailable:", error || firstError);
        if (permission) permission.hidden = false;
        return false;
      }
    }

    video.srcObject = state.stream;
    try { await video.play(); } catch {}
    updateTorchButton();
    return true;
  }

  function supportedRecorderMime() {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
      "video/mp4;codecs=h264,aac",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];

    return candidates.find((mime) => {
      try { return MediaRecorder.isTypeSupported?.(mime); } catch { return false; }
    }) || "";
  }

  function fileExtensionForMime(mime) {
    return mime.includes("mp4") ? "mp4" : "webm";
  }

  function setRecordingUi(active) {
    state.recording = active;
    const shutter = $("ariCameraShutter");
    const label = $("ariCameraRecordLabel");
    const status = $("ariCameraStatus");
    shutter?.classList.toggle("is-recording", active);
    if (label) label.textContent = active ? "Recording · release to stop" : "Tap photo · hold video";
    if (status) status.textContent = active ? "Recording video" : "Tap for photo · hold for video";
    if (!active) shutter?.style.setProperty("--record-progress", "0deg");
  }

  function updateRecordingProgress() {
    if (!state.recording) return;

    const elapsed = Math.max(0, (performance.now() - state.recordingStartedAt) / 1000);
    const fraction = Math.min(1, elapsed / MAX_VIDEO_SECONDS);
    const degrees = Math.round(fraction * 360);
    $("ariCameraShutter")?.style.setProperty("--record-progress", `${degrees}deg`);

    const remaining = Math.max(0, Math.ceil(MAX_VIDEO_SECONDS - elapsed));
    const timer = $("ariCameraTimer");
    if (timer) timer.textContent = `0:${String(remaining).padStart(2, "0")}`;

    if (elapsed >= MAX_VIDEO_SECONDS) {
      stopRecording();
      return;
    }

    state.recordingRaf = requestAnimationFrame(updateRecordingProgress);
  }

  function startRecording() {
    if (!state.pointerDown || state.recording || !state.stream) return;

    const mime = supportedRecorderMime();
    if (typeof MediaRecorder === "undefined") {
      showToast("Video recording is not supported in this browser.");
      return;
    }

    try {
      state.chunks = [];
      state.recorder = mime
        ? new MediaRecorder(state.stream, {
            mimeType: mime,
            videoBitsPerSecond: 4_000_000,
            audioBitsPerSecond: 128_000
          })
        : new MediaRecorder(state.stream, {
            videoBitsPerSecond: 4_000_000,
            audioBitsPerSecond: 128_000
          });
    } catch (error) {
      console.error("ARI Circle video recorder failed to start:", error);
      showToast("Video recording could not start.");
      return;
    }

    state.recorder.ondataavailable = (event) => {
      if (event.data?.size) state.chunks.push(event.data);
    };

    state.recorder.onstop = () => {
      const duration = Math.min(
        MAX_VIDEO_SECONDS,
        Math.max(0.1, (performance.now() - state.recordingStartedAt) / 1000)
      );
      const actualMime = clean(state.recorder?.mimeType) || mime || "video/webm";
      const blob = new Blob(state.chunks, { type: actualMime });
      const file = new File(
        [blob],
        `ari-circle-${Date.now()}.${fileExtensionForMime(actualMime)}`,
        { type: actualMime, lastModified: Date.now() }
      );
      state.recordingDuration = duration;
      state.recorder = null;
      state.chunks = [];
      setRecordingUi(false);
      cancelAnimationFrame(state.recordingRaf);
      showReview(file, "video");
    };

    try {
      state.recordingStartedAt = performance.now();
      state.recorder.start(250);
      setRecordingUi(true);
      if (navigator.vibrate) navigator.vibrate(12);
      updateRecordingProgress();
    } catch (error) {
      console.error("ARI Circle video recording failed:", error);
      setRecordingUi(false);
      showToast("Video recording could not start.");
    }
  }

  function stopRecording() {
    window.clearTimeout(state.holdTimer);
    if (!state.recording) return;
    try {
      if (state.recorder?.state !== "inactive") state.recorder.stop();
    } catch (error) {
      console.warn("ARI Circle recorder stop failed:", error);
      setRecordingUi(false);
    }
  }

  function flashCaptureFrame() {
    const frame = $("ariCameraFlashFrame");
    if (!frame) return;
    frame.classList.remove("is-flashing");
    void frame.offsetWidth;
    frame.classList.add("is-flashing");
  }

  function takePhoto() {
    const video = $("ariCameraVideo");
    if (!video || !video.videoWidth || !video.videoHeight) {
      showToast("Camera is still getting ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    flashCaptureFrame();
    if (navigator.vibrate) navigator.vibrate(8);

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast("That photo could not be captured.");
        return;
      }
      const file = new File(
        [blob],
        `ari-circle-${Date.now()}.jpg`,
        { type: "image/jpeg", lastModified: Date.now() }
      );
      showReview(file, "image");
    }, "image/jpeg", 0.92);
  }

  function showReview(file, kind) {
    clearPreview();
    state.capturedFile = file;
    state.capturedKind = kind;
    state.previewUrl = URL.createObjectURL(file);
    stopStream();

    const review = $("ariCameraReview");
    const host = $("ariCameraReviewMedia");
    const controls = $("ariCameraControls");
    const reviewActions = $("ariCameraReviewActions");
    const meta = $("ariCameraRecordMeta");
    const use = $("ariCameraUse");

    if (host) {
      host.replaceChildren();
      if (kind === "video") {
        const video = document.createElement("video");
        video.src = state.previewUrl;
        video.controls = true;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = true;
        host.append(video);
        video.play().catch(() => {});
      } else {
        const image = document.createElement("img");
        image.src = state.previewUrl;
        image.alt = "Captured photo preview";
        host.append(image);
      }
    }

    if (review) review.hidden = false;
    if (controls) controls.hidden = true;
    if (reviewActions) reviewActions.hidden = false;
    if (meta) meta.hidden = true;
    if (use) use.textContent = kind === "video" ? "Use Video" : "Use Photo";
  }

  async function retake() {
    clearPreview();
    $("ariCameraReview")?.setAttribute("hidden", "");
    $("ariCameraReviewActions")?.setAttribute("hidden", "");
    $("ariCameraControls")?.removeAttribute("hidden");
    $("ariCameraRecordMeta")?.removeAttribute("hidden");
    const timer = $("ariCameraTimer");
    if (timer) timer.textContent = "0:30";
    await startStream();
  }

  function transferFileToFeed(file) {
    const input = $("feedMediaInput");
    if (!input || !file) return false;

    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (error) {
      console.error("ARI Circle could not hand camera media to the composer:", error);
      return false;
    }
  }

  async function useCapture() {
    if (!state.capturedFile || state.useInProgress) return;
    state.useInProgress = true;

    try {
      const target = state.target;
      const delivered = transferFileToFeed(state.capturedFile);
      if (!delivered) {
        showToast("Could not attach that capture. Try your library instead.");
        return;
      }

      const dialog = state.dialog;
      clearPreview();
      stopStream();
      dialog?.close();

      if (target === "moment") {
        const started = performance.now();
        const waitAndShare = () => {
          const action = $("feedMomentAction");
          const button = $("shareMomentButton");
          if (button && action && !action.hidden) {
            button.click();
            return;
          }
          if (performance.now() - started < 2500) requestAnimationFrame(waitAndShare);
        };
        requestAnimationFrame(waitAndShare);
      }
    } finally {
      state.useInProgress = false;
    }
  }

  async function toggleCamera() {
    if (state.recording) return;
    state.facingMode = state.facingMode === "environment" ? "user" : "environment";
    await startStream();
  }

  async function toggleTorch() {
    const track = activeTrack();
    if (!track) return;
    try {
      const next = !state.torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      state.torchOn = next;
      updateTorchButton();
    } catch (error) {
      console.warn("ARI Circle torch unavailable:", error);
      state.torchOn = false;
      updateTorchButton();
    }
  }

  function openLibrary() {
    $("ariCameraLibraryInput")?.click();
  }

  function previewLibraryFile(file) {
    if (!file) return;
    const type = clean(file.type).toLowerCase();
    const kind = type.startsWith("video/") ? "video" : type.startsWith("image/") ? "image" : null;
    if (!kind) {
      showToast("Choose a photo or short video.");
      return;
    }
    showReview(file, kind);
  }

  function closeOrDiscard() {
    if (state.recording) {
      stopRecording();
      return;
    }

    if (state.capturedFile) {
      $("ariCameraDiscard")?.removeAttribute("hidden");
      return;
    }

    stopStream();
    state.dialog?.close();
  }

  function confirmDiscard() {
    $("ariCameraDiscard")?.setAttribute("hidden", "");
    clearPreview();
    stopStream();
    state.dialog?.close();
  }

  function keepCapture() {
    $("ariCameraDiscard")?.setAttribute("hidden", "");
  }

  function onShutterDown(event) {
    if (state.capturedFile || state.recording) return;
    event.preventDefault();
    state.pointerDown = true;
    const shutter = $("ariCameraShutter");
    try { shutter?.setPointerCapture?.(event.pointerId); } catch {}
    shutter?.classList.add("is-pressed");
    window.clearTimeout(state.holdTimer);
    state.holdTimer = window.setTimeout(startRecording, LONG_PRESS_MS);
  }

  function onShutterUp(event) {
    if (!state.pointerDown) return;
    event.preventDefault();
    state.pointerDown = false;
    const shutter = $("ariCameraShutter");
    shutter?.classList.remove("is-pressed");
    window.clearTimeout(state.holdTimer);

    if (state.recording) {
      stopRecording();
      return;
    }

    takePhoto();
  }

  function onShutterCancel() {
    state.pointerDown = false;
    $("ariCameraShutter")?.classList.remove("is-pressed");
    window.clearTimeout(state.holdTimer);
    if (state.recording) stopRecording();
  }

  function bindDialog() {
    $("ariCameraClose")?.addEventListener("click", closeOrDiscard);
    $("ariCameraFlash")?.addEventListener("click", toggleTorch);
    $("ariCameraSwitch")?.addEventListener("click", toggleCamera);
    $("ariCameraLibrary")?.addEventListener("click", openLibrary);
    $("ariCameraPermissionLibrary")?.addEventListener("click", openLibrary);
    $("ariCameraRetake")?.addEventListener("click", retake);
    $("ariCameraUse")?.addEventListener("click", useCapture);
    $("ariCameraKeep")?.addEventListener("click", keepCapture);
    $("ariCameraDiscardConfirm")?.addEventListener("click", confirmDiscard);

    $("ariCameraLibraryInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0] || null;
      event.target.value = "";
      previewLibraryFile(file);
    });

    const shutter = $("ariCameraShutter");
    shutter?.addEventListener("pointerdown", onShutterDown);
    shutter?.addEventListener("pointerup", onShutterUp);
    shutter?.addEventListener("pointercancel", onShutterCancel);
    shutter?.addEventListener("lostpointercapture", () => {
      if (state.pointerDown) onShutterCancel();
    });

    state.dialog?.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeOrDiscard();
    });

    state.dialog?.addEventListener("close", () => {
      state.pointerDown = false;
      window.clearTimeout(state.holdTimer);
      cancelAnimationFrame(state.recordingRaf);
      if (state.recording) {
        try { state.recorder?.stop(); } catch {}
      }
      stopStream();
      setRecordingUi(false);
      $("ariCameraDiscard")?.setAttribute("hidden", "");
    });
  }

  async function open(options = {}) {
    if (state.opening) return;
    state.opening = true;

    try {
      ensureStyle();
      createDialog();
      state.target = options.target === "moment" ? "moment" : "feed";
      clearPreview();

      $("ariCameraReview")?.setAttribute("hidden", "");
      $("ariCameraReviewActions")?.setAttribute("hidden", "");
      $("ariCameraControls")?.removeAttribute("hidden");
      $("ariCameraRecordMeta")?.removeAttribute("hidden");
      $("ariCameraDiscard")?.setAttribute("hidden", "");
      const timer = $("ariCameraTimer");
      if (timer) timer.textContent = "0:30";

      if (!state.dialog.open) state.dialog.showModal();
      const started = await startStream();
      if (!started) {
        const permission = $("ariCameraPermission");
        if (permission) permission.hidden = false;
      }
    } finally {
      state.opening = false;
    }
  }

  function compactComposerCameraButton() {
    const button = $("feedMediaButton");
    if (!button || button.dataset.ariCameraReady === "true") return;
    button.dataset.ariCameraReady = "true";
    button.classList.add("feed-media-button--camera");
    button.innerHTML = `${CAMERA_ICON}<span>Camera</span>`;
    button.setAttribute("aria-label", "Open camera or media library");
  }

  function bindFeedEntry() {
    if (document.documentElement.dataset.ariCircleCameraBound === "true") return;
    document.documentElement.dataset.ariCircleCameraBound = "true";

    document.addEventListener("click", (event) => {
      const button = event.target.closest("#feedMediaButton");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open({ target: "feed" });
    }, true);
  }

  function init() {
    if (state.initialized) {
      compactComposerCameraButton();
      return;
    }
    state.initialized = true;
    ensureStyle();
    compactComposerCameraButton();
    bindFeedEntry();

    const observer = new MutationObserver(compactComposerCameraButton);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.AriCircleCamera = Object.freeze({
    version: VERSION,
    open,
    refresh: compactComposerCameraButton
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
