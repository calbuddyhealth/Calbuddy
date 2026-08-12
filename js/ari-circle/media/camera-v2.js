/* =============================================================
   ARI CIRCLE — CAMERA V2
   Version: 2.0.0

   Launch-safe camera pipeline for iPhone/Safari:
   - Camera permission only when opening the camera.
   - Microphone permission is deferred until video recording.
   - Tap shutter = photo; hold = video; release = stop.
   - True 1x when Safari exposes writable zoom.
   - Live preview uses the complete stream frame (no CSS crop).
   - Captured photo framing matches the live video frame.
   - Front/rear switching restarts only the video track.
   - Reliable native iPhone camera fallback if WebRTC preview stalls.
============================================================= */

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const DIALOG_ID = "ariCircleCamera";
  const STYLE_ID = "ari-circle-camera-style";
  const MAX_VIDEO_SECONDS = 30;
  const LONG_PRESS_MS = 300;
  const FRAME_TIMEOUT_MS = 3500;

  const state = {
    dialog: null,
    videoStream: null,
    micStream: null,
    recorder: null,
    recorderStream: null,
    chunks: [],
    facingMode: "environment",
    target: "feed",
    opening: false,
    recording: false,
    recordingStarting: false,
    pointerDown: false,
    holdTimer: 0,
    recordRaf: 0,
    recordStartedAt: 0,
    capturedFile: null,
    capturedKind: null,
    capturedDuration: 0,
    previewUrl: null,
    torchOn: false,
    fallbackAttempted: false,
    useInProgress: false
  };

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  function toast(message, duration = 3200) {
    const host = $("feedToast") || $("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, duration);
  }

  function setStatus(message) {
    const status = $("ariCameraStatus");
    if (status) status.textContent = message;
  }

  function stopTracks(stream) {
    stream?.getTracks?.().forEach((track) => {
      try { track.stop(); } catch {}
    });
  }

  function stopMic() {
    stopTracks(state.micStream);
    state.micStream = null;
  }

  function stopVideo() {
    stopTracks(state.videoStream);
    state.videoStream = null;
    const video = $("ariCameraVideo");
    if (video) {
      try { video.pause(); } catch {}
      try { video.srcObject = null; } catch {}
    }
    state.torchOn = false;
    updateTorchButton();
  }

  function stopAllMedia() {
    stopMic();
    stopVideo();
    state.recorderStream = null;
  }

  function clearPreview() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
    state.capturedFile = null;
    state.capturedKind = null;
    state.capturedDuration = 0;
    $("ariCameraReviewMedia")?.replaceChildren();
  }

  function createDialog() {
    const existing = $(DIALOG_ID);
    if (existing) {
      state.dialog = existing;
      return existing;
    }

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
          <video id="ariCameraVideo" autoplay muted playsinline webkit-playsinline></video>
          <div class="ari-camera__zoom-indicator" id="ariCameraOneX" aria-hidden="true">1×</div>
          <div class="ari-camera__flash-frame" id="ariCameraFlashFrame" aria-hidden="true"></div>

          <div class="ari-camera__permission" id="ariCameraPermission" hidden>
            <strong id="ariCameraPermissionTitle">Camera unavailable</strong>
            <p id="ariCameraPermissionText">Try the camera again or use the iPhone camera.</p>
            <button id="ariCameraRetry" type="button">Try Camera Again</button>
            <button id="ariCameraNative" type="button">Use iPhone Camera</button>
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
        <input id="ariCameraNativeInput" type="file" accept="image/*,video/*" capture="environment" hidden />
      </div>
    `;

    document.body.append(dialog);
    state.dialog = dialog;
    bindDialog();
    return dialog;
  }

  function prepareVideoElement() {
    const video = $("ariCameraVideo");
    if (!video) return null;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.setProperty("object-fit", "contain", "important");
    video.style.setProperty("object-position", "50% 50%", "important");
    video.style.setProperty("transform", "none", "important");
    video.style.setProperty("background", "#000", "important");
    return video;
  }

  function videoFrameReady(video) {
    return Boolean(
      video &&
      video.srcObject &&
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    );
  }

  function waitForMetadata(video, timeoutMs = 2200) {
    if (!video) return Promise.resolve(false);
    if (video.videoWidth > 0 && video.videoHeight > 0) return Promise.resolve(true);

    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        video.removeEventListener("loadedmetadata", onMetadata);
        video.removeEventListener("resize", onMetadata);
        resolve(value);
      };
      const onMetadata = () => finish(video.videoWidth > 0 && video.videoHeight > 0);
      const timer = setTimeout(() => finish(video.videoWidth > 0 && video.videoHeight > 0), timeoutMs);
      video.addEventListener("loadedmetadata", onMetadata, { once: true });
      video.addEventListener("resize", onMetadata, { once: true });
    });
  }

  async function waitForFrame(video, timeoutMs = FRAME_TIMEOUT_MS) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (videoFrameReady(video)) return true;
      try { await video?.play?.(); } catch {}
      await sleep(100);
    }
    return videoFrameReady(video);
  }

  async function applyOneX() {
    const track = state.videoStream?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.();
      const min = Number(caps?.zoom?.min);
      const max = Number(caps?.zoom?.max);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return;
      const oneX = Math.min(max, Math.max(min, 1));
      await track.applyConstraints({ advanced: [{ zoom: oneX }] });
    } catch {}
  }

  function updateTorchButton() {
    const button = $("ariCameraFlash");
    const track = state.videoStream?.getVideoTracks?.()[0];
    if (!button) return;

    let supported = false;
    try { supported = Boolean(track?.getCapabilities?.().torch); } catch {}
    button.hidden = !supported;
    button.classList.toggle("is-on", state.torchOn);
    button.setAttribute("aria-pressed", state.torchOn ? "true" : "false");
  }

  async function requestVideoStream(fallback = false) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera is not supported in this browser.");
    }

    const preferred = fallback
      ? { video: true, audio: false }
      : {
          video: {
            facingMode: { ideal: state.facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

    return navigator.mediaDevices.getUserMedia(preferred);
  }

  function showCameraFailure(error) {
    console.warn("ARI Circle camera could not start:", error);
    setStatus("Camera unavailable");
    const panel = $("ariCameraPermission");
    if (!panel) return;
    const title = $("ariCameraPermissionTitle");
    const text = $("ariCameraPermissionText");
    if (title) title.textContent = "Camera needs another try";
    if (text) text.textContent = "Your iPhone allowed camera access, but Safari did not start the live preview. Try again or use the iPhone camera.";
    panel.hidden = false;
  }

  async function startCamera({ fallback = false } = {}) {
    const video = prepareVideoElement();
    if (!video) return false;

    stopVideo();
    $("ariCameraPermission")?.setAttribute("hidden", "");
    setStatus("Starting camera…");

    let stream;
    try {
      stream = await requestVideoStream(fallback);
    } catch (error) {
      showCameraFailure(error);
      return false;
    }

    state.videoStream = stream;
    video.srcObject = stream;
    prepareVideoElement();

    try { await video.play(); } catch {}
    await waitForMetadata(video);
    await applyOneX();
    try { await video.play(); } catch {}

    if (await waitForFrame(video)) {
      state.fallbackAttempted = false;
      setStatus("Tap for photo · hold for video");
      updateTorchButton();
      return true;
    }

    if (!fallback && !state.fallbackAttempted) {
      state.fallbackAttempted = true;
      stopVideo();
      await sleep(120);
      return startCamera({ fallback: true });
    }

    showCameraFailure(new Error("Safari returned a camera stream without a renderable frame."));
    return false;
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

  function extensionForMime(mime) {
    return String(mime || "").includes("mp4") ? "mp4" : "webm";
  }

  async function ensureMicrophone() {
    if (state.micStream?.getAudioTracks?.().some((track) => track.readyState === "live")) return true;
    if (!navigator.mediaDevices?.getUserMedia) return false;

    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return Boolean(state.micStream?.getAudioTracks?.().length);
    } catch (error) {
      console.warn("ARI Circle microphone unavailable; recording silent video:", error);
      stopMic();
      return false;
    }
  }

  function setRecordingUi(active) {
    state.recording = active;
    const shutter = $("ariCameraShutter");
    shutter?.classList.toggle("is-recording", active);
    const label = $("ariCameraRecordLabel");
    const status = $("ariCameraStatus");
    if (label) label.textContent = active ? "Recording · release to stop" : "Tap photo · hold video";
    if (status) status.textContent = active ? "Recording video" : "Tap for photo · hold for video";
    if (!active) shutter?.style.setProperty("--record-progress", "0deg");
  }

  function updateRecordingProgress() {
    if (!state.recording) return;
    const elapsed = Math.max(0, (performance.now() - state.recordStartedAt) / 1000);
    const fraction = Math.min(1, elapsed / MAX_VIDEO_SECONDS);
    $("ariCameraShutter")?.style.setProperty("--record-progress", `${Math.round(fraction * 360)}deg`);
    const remaining = Math.max(0, Math.ceil(MAX_VIDEO_SECONDS - elapsed));
    const timer = $("ariCameraTimer");
    if (timer) timer.textContent = `0:${String(remaining).padStart(2, "0")}`;
    if (elapsed >= MAX_VIDEO_SECONDS) {
      stopRecording();
      return;
    }
    state.recordRaf = requestAnimationFrame(updateRecordingProgress);
  }

  async function startRecording() {
    if (state.recording || state.recordingStarting || !state.videoStream) return;
    state.recordingStarting = true;
    setStatus("Preparing video…");

    try {
      await ensureMicrophone();
      if (!state.pointerDown) {
        setStatus("Microphone ready · hold again to record");
        setTimeout(() => {
          if (!state.recording) setStatus("Tap for photo · hold for video");
        }, 1800);
        return;
      }

      const videoTracks = state.videoStream.getVideoTracks();
      const audioTracks = state.micStream?.getAudioTracks?.() || [];
      state.recorderStream = new MediaStream([...videoTracks, ...audioTracks]);

      const mime = supportedRecorderMime();
      const options = {
        videoBitsPerSecond: 4_000_000,
        ...(audioTracks.length ? { audioBitsPerSecond: 128_000 } : {})
      };
      if (mime) options.mimeType = mime;

      state.chunks = [];
      state.recorder = new MediaRecorder(state.recorderStream, options);
      state.recorder.ondataavailable = (event) => {
        if (event.data?.size) state.chunks.push(event.data);
      };
      state.recorder.onstop = () => {
        const duration = Math.min(
          MAX_VIDEO_SECONDS,
          Math.max(0.1, (performance.now() - state.recordStartedAt) / 1000)
        );
        const actualMime = clean(state.recorder?.mimeType) || mime || "video/mp4";
        const blob = new Blob(state.chunks, { type: actualMime });
        const file = new File(
          [blob],
          `ari-circle-${Date.now()}.${extensionForMime(actualMime)}`,
          { type: actualMime, lastModified: Date.now() }
        );
        state.capturedDuration = duration;
        state.recorder = null;
        state.recorderStream = null;
        state.chunks = [];
        cancelAnimationFrame(state.recordRaf);
        setRecordingUi(false);
        stopMic();
        showReview(file, "video");
      };

      state.recordStartedAt = performance.now();
      state.recorder.start(250);
      setRecordingUi(true);
      updateRecordingProgress();
    } catch (error) {
      console.warn("ARI Circle video recording failed:", error);
      setRecordingUi(false);
      toast("Video recording could not start.");
    } finally {
      state.recordingStarting = false;
    }
  }

  function stopRecording() {
    clearTimeout(state.holdTimer);
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
    if (!videoFrameReady(video)) {
      toast("Camera is still getting ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    flashCaptureFrame();

    canvas.toBlob((blob) => {
      if (!blob) {
        toast("That photo could not be captured.");
        return;
      }
      const file = new File([blob], `ari-circle-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now()
      });
      showReview(file, "image");
    }, "image/jpeg", 0.92);
  }

  function showReview(file, kind) {
    clearPreview();
    state.capturedFile = file;
    state.capturedKind = kind;
    state.previewUrl = URL.createObjectURL(file);

    const review = $("ariCameraReview");
    const host = $("ariCameraReviewMedia");
    if (host) {
      host.replaceChildren();
      const media = document.createElement(kind === "video" ? "video" : "img");
      media.src = state.previewUrl;
      media.style.objectFit = "contain";
      media.style.objectPosition = "50% 50%";
      if (kind === "video") {
        media.controls = true;
        media.playsInline = true;
        media.loop = true;
        media.autoplay = true;
        media.muted = false;
      } else {
        media.alt = "Captured photo preview";
      }
      host.append(media);
      if (kind === "video") media.play().catch(() => {});
    }

    stopAllMedia();
    if (review) review.hidden = false;
    $("ariCameraControls")?.setAttribute("hidden", "");
    $("ariCameraRecordMeta")?.setAttribute("hidden", "");
    $("ariCameraReviewActions")?.removeAttribute("hidden");
    const use = $("ariCameraUse");
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
    state.fallbackAttempted = false;
    await startCamera();
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
      console.error("ARI Circle could not attach camera media:", error);
      return false;
    }
  }

  async function useCapture() {
    if (!state.capturedFile || state.useInProgress) return;
    state.useInProgress = true;
    try {
      const target = state.target;
      if (!transferFileToFeed(state.capturedFile)) {
        toast("Could not attach that capture. Try your library instead.");
        return;
      }

      clearPreview();
      stopAllMedia();
      state.dialog?.close();

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
    if (state.recording || state.recordingStarting) return;
    state.facingMode = state.facingMode === "environment" ? "user" : "environment";
    state.fallbackAttempted = false;
    await startCamera();
  }

  async function toggleTorch() {
    const track = state.videoStream?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const next = !state.torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      state.torchOn = next;
      updateTorchButton();
    } catch {
      state.torchOn = false;
      updateTorchButton();
    }
  }

  function openLibrary() {
    $("ariCameraLibraryInput")?.click();
  }

  function openNativeCamera() {
    const input = $("ariCameraNativeInput");
    if (input) input.setAttribute("capture", state.facingMode === "user" ? "user" : "environment");
    input?.click();
  }

  function previewFile(file) {
    if (!file) return;
    const type = clean(file.type).toLowerCase();
    const kind = type.startsWith("video/") ? "video" : type.startsWith("image/") ? "image" : null;
    if (!kind) {
      toast("Choose a photo or short video.");
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
    stopAllMedia();
    state.dialog?.close();
  }

  function confirmDiscard() {
    $("ariCameraDiscard")?.setAttribute("hidden", "");
    clearPreview();
    stopAllMedia();
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
    clearTimeout(state.holdTimer);
    state.holdTimer = setTimeout(startRecording, LONG_PRESS_MS);
  }

  function onShutterUp(event) {
    if (!state.pointerDown) return;
    event.preventDefault();
    state.pointerDown = false;
    $("ariCameraShutter")?.classList.remove("is-pressed");
    clearTimeout(state.holdTimer);

    if (state.recording) {
      stopRecording();
      return;
    }
    if (state.recordingStarting) return;
    takePhoto();
  }

  function onShutterCancel() {
    state.pointerDown = false;
    $("ariCameraShutter")?.classList.remove("is-pressed");
    clearTimeout(state.holdTimer);
    if (state.recording) stopRecording();
  }

  function bindDialog() {
    $("ariCameraClose")?.addEventListener("click", closeOrDiscard);
    $("ariCameraFlash")?.addEventListener("click", toggleTorch);
    $("ariCameraSwitch")?.addEventListener("click", toggleCamera);
    $("ariCameraLibrary")?.addEventListener("click", openLibrary);
    $("ariCameraPermissionLibrary")?.addEventListener("click", openLibrary);
    $("ariCameraNative")?.addEventListener("click", openNativeCamera);
    $("ariCameraRetry")?.addEventListener("click", async () => {
      state.fallbackAttempted = false;
      await startCamera();
    });
    $("ariCameraRetake")?.addEventListener("click", retake);
    $("ariCameraUse")?.addEventListener("click", useCapture);
    $("ariCameraKeep")?.addEventListener("click", keepCapture);
    $("ariCameraDiscardConfirm")?.addEventListener("click", confirmDiscard);

    $("ariCameraLibraryInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0] || null;
      event.target.value = "";
      previewFile(file);
    });
    $("ariCameraNativeInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0] || null;
      event.target.value = "";
      previewFile(file);
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
      clearTimeout(state.holdTimer);
      cancelAnimationFrame(state.recordRaf);
      if (state.recording) {
        try { state.recorder?.stop(); } catch {}
      }
      setRecordingUi(false);
      stopAllMedia();
      $("ariCameraDiscard")?.setAttribute("hidden", "");
    });
  }

  function resetUi() {
    clearPreview();
    $("ariCameraReview")?.setAttribute("hidden", "");
    $("ariCameraReviewActions")?.setAttribute("hidden", "");
    $("ariCameraControls")?.removeAttribute("hidden");
    $("ariCameraRecordMeta")?.removeAttribute("hidden");
    $("ariCameraDiscard")?.setAttribute("hidden", "");
    $("ariCameraPermission")?.setAttribute("hidden", "");
    const timer = $("ariCameraTimer");
    if (timer) timer.textContent = "0:30";
    setRecordingUi(false);
  }

  async function open(options = {}) {
    if (state.opening) return;
    state.opening = true;
    try {
      ensureStyle();
      createDialog();
      state.target = options.target === "moment" ? "moment" : "feed";
      state.fallbackAttempted = false;
      resetUi();

      if (!state.dialog.open) state.dialog.showModal();
      await startCamera();
    } finally {
      state.opening = false;
    }
  }

  function compactComposerCameraButton() {
    const button = $("feedMediaButton");
    if (!button) return;
    button.classList.add("feed-media-button--camera");
    button.innerHTML = `${CAMERA_ICON}<span>Camera</span>`;
    button.setAttribute("aria-label", "Open ARI Camera");
  }

  function bindFeedEntry() {
    document.documentElement.dataset.ariCircleCameraBound = "true";
    if (document.documentElement.dataset.ariCircleCameraV2Bound === VERSION) return;
    document.documentElement.dataset.ariCircleCameraV2Bound = VERSION;

    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("#feedMediaButton");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open({ target: "feed" });
    }, true);
  }

  const api = Object.freeze({ version: VERSION, open, refresh: compactComposerCameraButton });
  let legacyCamera = null;

  /* The V4 shell still dynamically imports the old camera module. Keep that
     import harmless: its assignment is captured here while every caller sees
     Camera V2. This lets Moments and Feed use one implementation immediately. */
  try {
    Object.defineProperty(window, "AriCircleCamera", {
      configurable: true,
      enumerable: true,
      get: () => api,
      set: (value) => { legacyCamera = value; }
    });
  } catch {
    window.AriCircleCamera = api;
  }

  window.AriCircleCameraV2 = api;
  window.AriCircleLegacyCamera = () => legacyCamera;

  function init() {
    ensureStyle();
    compactComposerCameraButton();
    bindFeedEntry();
    const observer = new MutationObserver(compactComposerCameraButton);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
