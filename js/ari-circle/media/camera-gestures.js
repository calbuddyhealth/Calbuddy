/* =============================================================
   ARI CIRCLE — CAMERA GESTURES
   Version: 1.0.0

   Lightweight progressive enhancements:
   - Swipe down to dismiss / discard
   - Pinch to zoom when the active camera exposes zoom capability
   - No fake zoom buttons on unsupported devices
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const state = {
    initialized: false,
    oneFingerStartY: null,
    dragging: false,
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    zoomMin: 1,
    zoomMax: 1,
    zoomStep: .1,
    lastAppliedZoom: null
  };

  const $ = (id) => document.getElementById(id);

  function distance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function activeTrack() {
    return $("ariCameraVideo")?.srcObject?.getVideoTracks?.()[0] || null;
  }

  function readZoomCapabilities() {
    const track = activeTrack();
    if (!track) return null;

    try {
      const capabilities = track.getCapabilities?.();
      const settings = track.getSettings?.();
      if (!capabilities?.zoom) return null;

      state.zoomMin = Number(capabilities.zoom.min) || 1;
      state.zoomMax = Number(capabilities.zoom.max) || state.zoomMin;
      state.zoomStep = Number(capabilities.zoom.step) || .1;
      state.pinchStartZoom = Number(settings?.zoom) || state.zoomMin;

      if (state.zoomMax <= state.zoomMin) return null;
      return { track, capabilities, settings };
    } catch {
      return null;
    }
  }

  function applyZoom(value) {
    const track = activeTrack();
    if (!track) return;

    const clamped = Math.min(state.zoomMax, Math.max(state.zoomMin, value));
    const stepped = Math.round(clamped / state.zoomStep) * state.zoomStep;
    if (state.lastAppliedZoom !== null && Math.abs(stepped - state.lastAppliedZoom) < state.zoomStep * .45) return;
    state.lastAppliedZoom = stepped;

    track.applyConstraints({ advanced: [{ zoom: stepped }] }).catch(() => {});
  }

  function resetDrag() {
    state.oneFingerStartY = null;
    state.dragging = false;
    const shell = document.querySelector(".ari-camera__shell");
    shell?.style.removeProperty("--camera-drag-y");
    shell?.classList.remove("is-dragging");
  }

  function onTouchStart(event) {
    const dialog = $("ariCircleCamera");
    if (!dialog?.open) return;

    if (event.touches.length === 2) {
      const zoom = readZoomCapabilities();
      if (!zoom) return;
      state.pinchStartDistance = distance(event.touches[0], event.touches[1]);
      state.lastAppliedZoom = state.pinchStartZoom;
      resetDrag();
      return;
    }

    if (event.touches.length === 1) {
      state.oneFingerStartY = event.touches[0].clientY;
      state.dragging = false;
    }
  }

  function onTouchMove(event) {
    const dialog = $("ariCircleCamera");
    if (!dialog?.open) return;

    if (event.touches.length === 2 && state.pinchStartDistance > 0) {
      const current = distance(event.touches[0], event.touches[1]);
      const ratio = current / state.pinchStartDistance;
      applyZoom(state.pinchStartZoom * ratio);
      return;
    }

    if (event.touches.length !== 1 || state.oneFingerStartY === null) return;
    if (document.querySelector(".ari-camera__shutter.is-recording")) return;

    const delta = Math.max(0, event.touches[0].clientY - state.oneFingerStartY);
    if (delta < 12) return;

    state.dragging = true;
    const shell = document.querySelector(".ari-camera__shell");
    shell?.classList.add("is-dragging");
    shell?.style.setProperty("--camera-drag-y", `${Math.min(150, delta * .72)}px`);
  }

  function onTouchEnd(event) {
    const dialog = $("ariCircleCamera");
    if (!dialog?.open) return;

    if (state.dragging && state.oneFingerStartY !== null) {
      const endY = event.changedTouches?.[0]?.clientY ?? state.oneFingerStartY;
      const delta = Math.max(0, endY - state.oneFingerStartY);
      resetDrag();
      if (delta >= 120) {
        $("ariCameraClose")?.click();
      }
    } else {
      resetDrag();
    }

    state.pinchStartDistance = 0;
    state.lastAppliedZoom = null;
  }

  function bind(dialog) {
    if (!dialog || dialog.dataset.ariGestureReady === "true") return;
    dialog.dataset.ariGestureReady = "true";

    const stage = $("ariCameraStage");
    if (!stage) return;

    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    stage.addEventListener("touchcancel", () => {
      resetDrag();
      state.pinchStartDistance = 0;
      state.lastAppliedZoom = null;
    }, { passive: true });
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    const current = $("ariCircleCamera");
    if (current) bind(current);

    const observer = new MutationObserver(() => {
      const dialog = $("ariCircleCamera");
      if (dialog) bind(dialog);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.AriCircleCameraGestures = Object.freeze({ version: VERSION });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
