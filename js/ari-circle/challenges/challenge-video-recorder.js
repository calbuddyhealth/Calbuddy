/* =============================================================
   ARI CIRCLE — CHALLENGE VIDEO RECORDER
   Version: 1.0.0

   Native-first recorder for Build 5 video challenges.
   - Enabled only inside the Capacitor app.
   - Tap once to record, tap again to stop.
   - Hold to record, release to stop.
   - Automatic hard stop at 10 / 15 / 30 seconds.
   - Front/rear camera switching.
   - Retake / Use Video review flow.
   - Hosted Safari falls back to the platform media picker in challenges.js.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);

  const state = {
    stream: null,
    recorder: null,
    chunks: [],
    limitSeconds: 15,
    startedAt: 0,
    timerFrame: 0,
    facingMode: "user",
    holdTimer: 0,
    holdStarted: false,
    recordedFile: null,
    recordedUrl: "",
    onUse: null,
    onError: null,
    opening: false
  };

  function isNative() {
    if (window.ARI_XP_NATIVE === true) return true;
    const capacitor = window.Capacitor || null;
    if (!capacitor) return false;
    try {
      if (typeof capacitor.isNativePlatform === "function") return Boolean(capacitor.isNativePlatform());
      if (typeof capacitor.getPlatform === "function") return capacitor.getPlatform() !== "web";
    } catch {}
    return false;
  }

  function canUse() {
    return Boolean(
      isNative() &&
      navigator.mediaDevices?.getUserMedia &&
      window.MediaRecorder &&
      $("challengeVideoRecorder")
    );
  }

  function pad(value) {
    return String(Math.max(0, Math.floor(Number(value) || 0))).padStart(2, "0");
  }

  function timerText(seconds) {
    return `00:${pad(seconds)} / 00:${pad(state.limitSeconds)}`;
  }

  function syncTimer(seconds = 0) {
    const elapsed = Math.min(state.limitSeconds, Math.max(0, Number(seconds) || 0));
    const timer = $("challengeRecorderTimer");
    if (timer) timer.textContent = timerText(elapsed);
    const button = $("challengeRecordButton");
    if (button) button.style.setProperty("--record-progress", `${(elapsed / state.limitSeconds) * 360}deg`);
  }

  function stopTimer() {
    if (state.timerFrame) cancelAnimationFrame(state.timerFrame);
    state.timerFrame = 0;
  }

  function tick() {
    if (!state.recorder || state.recorder.state !== "recording") return;
    const elapsed = (performance.now() - state.startedAt) / 1000;
    syncTimer(elapsed);
    if (elapsed >= state.limitSeconds) {
      stopRecording();
      return;
    }
    state.timerFrame = requestAnimationFrame(tick);
  }

  function preferredMimeType() {
    const choices = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    for (const type of choices) {
      try {
        if (MediaRecorder.isTypeSupported(type)) return type;
      } catch {}
    }
    return "";
  }

  function stopStream() {
    if (!state.stream) return;
    state.stream.getTracks().forEach((track) => {
      try { track.stop(); } catch {}
    });
    state.stream = null;
    const video = $("challengeRecorderVideo");
    if (video) video.srcObject = null;
  }

  function revokeRecordedUrl() {
    if (state.recordedUrl) URL.revokeObjectURL(state.recordedUrl);
    state.recordedUrl = "";
  }

  function resetRecordedFile() {
    revokeRecordedUrl();
    state.recordedFile = null;
  }

  async function startCamera() {
    stopStream();
    const video = $("challengeRecorderVideo");
    if (!video) throw new Error("Recorder preview is unavailable.");

    state.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: state.facingMode },
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      },
      audio: true
    });

    video.controls = false;
    video.muted = true;
    video.loop = false;
    video.src = "";
    video.srcObject = state.stream;
    await video.play().catch(() => {});
  }

  function setRecordingUi(recording) {
    const button = $("challengeRecordButton");
    const instruction = $("challengeRecorderInstruction");
    const flip = $("flipChallengeCamera");
    button?.classList.toggle("is-recording", recording);
    button?.setAttribute("aria-label", recording ? "Stop recording" : "Start recording");
    if (instruction) instruction.textContent = recording ? "Tap to stop · release if you are holding" : "Tap to record · or hold and release";
    if (flip) flip.disabled = recording;
  }

  function setReviewUi(reviewing) {
    $("challengeRecorderSurface")?.classList.toggle("is-reviewing", reviewing);
    const controls = $("challengeRecorderControls");
    const review = $("challengeRecorderReview");
    if (controls) controls.hidden = reviewing;
    if (review) review.hidden = !reviewing;
  }

  function reportError(error) {
    console.error("ARI Challenge recorder error:", error);
    if (typeof state.onError === "function") {
      try { state.onError(error); } catch {}
    }
  }

  async function startRecording() {
    if (!state.stream || state.recorder?.state === "recording" || state.recordedFile) return;
    state.chunks = [];
    const mimeType = preferredMimeType();
    try {
      state.recorder = mimeType
        ? new MediaRecorder(state.stream, { mimeType, videoBitsPerSecond: 5_000_000 })
        : new MediaRecorder(state.stream, { videoBitsPerSecond: 5_000_000 });
    } catch {
      state.recorder = new MediaRecorder(state.stream);
    }

    state.recorder.ondataavailable = (event) => {
      if (event.data?.size) state.chunks.push(event.data);
    };

    state.recorder.onerror = (event) => {
      reportError(event.error || new Error("Video recording failed."));
    };

    state.recorder.onstop = finalizeRecording;
    state.startedAt = performance.now();
    setRecordingUi(true);
    syncTimer(0);
    state.recorder.start(200);
    stopTimer();
    state.timerFrame = requestAnimationFrame(tick);
  }

  function stopRecording() {
    stopTimer();
    if (!state.recorder || state.recorder.state !== "recording") {
      setRecordingUi(false);
      return;
    }
    try { state.recorder.stop(); } catch (error) { reportError(error); }
    setRecordingUi(false);
  }

  async function finalizeRecording() {
    stopTimer();
    const elapsed = Math.min(state.limitSeconds, Math.max(.1, (performance.now() - state.startedAt) / 1000));
    syncTimer(elapsed);

    const mimeType = state.recorder?.mimeType || state.chunks[0]?.type || "video/mp4";
    const blob = new Blob(state.chunks, { type: mimeType });
    if (!blob.size) {
      reportError(new Error("No video was recorded."));
      return;
    }

    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    state.recordedFile = new File(
      [blob],
      `ari-challenge-${Date.now()}.${extension}`,
      { type: mimeType, lastModified: Date.now() }
    );
    Object.defineProperty(state.recordedFile, "ariRecordedDuration", {
      configurable: true,
      enumerable: false,
      value: elapsed
    });

    stopStream();
    revokeRecordedUrl();
    state.recordedUrl = URL.createObjectURL(state.recordedFile);
    const video = $("challengeRecorderVideo");
    if (video) {
      video.srcObject = null;
      video.src = state.recordedUrl;
      video.controls = true;
      video.muted = false;
      video.loop = true;
      await video.play().catch(() => {});
    }
    setReviewUi(true);
  }

  async function retake() {
    resetRecordedFile();
    state.recorder = null;
    state.chunks = [];
    syncTimer(0);
    setRecordingUi(false);
    setReviewUi(false);
    try {
      await startCamera();
    } catch (error) {
      reportError(error);
      close();
    }
  }

  async function flipCamera() {
    if (state.recorder?.state === "recording") return;
    state.facingMode = state.facingMode === "user" ? "environment" : "user";
    try {
      await startCamera();
    } catch (error) {
      state.facingMode = state.facingMode === "user" ? "environment" : "user";
      reportError(error);
    }
  }

  function useVideo() {
    const file = state.recordedFile;
    if (!file) return;
    const callback = state.onUse;
    close({ keepFile: true });
    if (typeof callback === "function") {
      try { callback(file); } catch (error) { reportError(error); }
    }
  }

  function close(options = {}) {
    clearTimeout(state.holdTimer);
    state.holdTimer = 0;
    state.holdStarted = false;
    stopTimer();
    if (state.recorder?.state === "recording") {
      state.recorder.onstop = null;
      try { state.recorder.stop(); } catch {}
    }
    state.recorder = null;
    stopStream();
    const dialog = $("challengeVideoRecorder");
    if (dialog?.open) dialog.close();
    const video = $("challengeRecorderVideo");
    if (video) {
      video.pause?.();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load?.();
    }
    if (!options.keepFile) resetRecordedFile();
    else revokeRecordedUrl();
    state.chunks = [];
    state.onUse = null;
    state.onError = null;
    syncTimer(0);
    setRecordingUi(false);
    setReviewUi(false);
  }

  async function open({ limitSeconds = 15, onUse = null, onError = null } = {}) {
    if (!canUse() || state.opening) return false;
    state.opening = true;
    state.limitSeconds = [10,15,30].includes(Number(limitSeconds)) ? Number(limitSeconds) : 15;
    state.onUse = onUse;
    state.onError = onError;
    state.facingMode = "user";
    resetRecordedFile();
    syncTimer(0);
    setRecordingUi(false);
    setReviewUi(false);

    const dialog = $("challengeVideoRecorder");
    try {
      if (!dialog.open) dialog.showModal();
      await startCamera();
      return true;
    } catch (error) {
      reportError(error);
      close();
      return false;
    } finally {
      state.opening = false;
    }
  }

  function bind() {
    const recordButton = $("challengeRecordButton");
    if (!recordButton) return;

    recordButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      clearTimeout(state.holdTimer);
      state.holdStarted = false;
      state.holdTimer = window.setTimeout(() => {
        if (state.recordedFile || state.recorder?.state === "recording") return;
        state.holdStarted = true;
        startRecording();
      }, 320);
      try { recordButton.setPointerCapture(event.pointerId); } catch {}
    });

    recordButton.addEventListener("pointerup", (event) => {
      event.preventDefault();
      clearTimeout(state.holdTimer);
      state.holdTimer = 0;
      if (state.holdStarted) {
        state.holdStarted = false;
        stopRecording();
        return;
      }
      if (state.recordedFile) return;
      if (state.recorder?.state === "recording") stopRecording();
      else startRecording();
    });

    recordButton.addEventListener("pointercancel", () => {
      clearTimeout(state.holdTimer);
      state.holdTimer = 0;
      if (state.holdStarted) stopRecording();
      state.holdStarted = false;
    });

    $("closeChallengeRecorder")?.addEventListener("click", () => close());
    $("flipChallengeCamera")?.addEventListener("click", flipCamera);
    $("retakeChallengeVideo")?.addEventListener("click", retake);
    $("useChallengeVideo")?.addEventListener("click", useVideo);
    $("challengeVideoRecorder")?.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  }

  window.AriChallengeVideoRecorder = Object.freeze({ version: VERSION, canUse, open, close });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
