/* =============================================================
   ARI CIRCLE — NATIVE WEB CAMERA ENTRY
   Version: 4.0.0

   Launch-safe mobile-web capture:
   - No getUserMedia()
   - No MediaRecorder
   - No custom camera preview
   - No Camera V2 or camera-capture module loading
   - Opens the device/browser native camera flow directly from the tap
   - iPhone camera UI handles front/rear flip and capture
   - feed.js keeps the 30-second video limit after capture
   - Returned photo/video goes straight into the existing ARI preview/upload flow
============================================================= */

(() => {
  "use strict";

  const VERSION = "4.0.0";
  let opening = false;

  function input() {
    return document.getElementById("feedMediaInput");
  }

  function openNativeCamera() {
    if (opening) return;

    const mediaInput = input();
    if (!mediaInput) {
      console.warn("ARI Circle native camera input is unavailable.");
      return;
    }

    opening = true;

    // Reset first so taking the same photo/video twice still fires change.
    // Keep click() synchronous with the user's tap: iOS Safari is most
    // reliable when its native capture UI is opened from the trusted gesture.
    try {
      mediaInput.value = "";
      mediaInput.click();
    } catch (error) {
      console.error("ARI Circle native camera could not open:", error);
    } finally {
      window.setTimeout(() => {
        opening = false;
      }, 400);
    }
  }

  // Capture phase intentionally owns the Camera tap before feed.js or any
  // cached legacy camera handler can intercept it.
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#feedMediaButton");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openNativeCamera();
  }, true);

  window.AriCircleCameraEntry = Object.freeze({
    version: VERSION,
    open: openNativeCamera
  });
})();
