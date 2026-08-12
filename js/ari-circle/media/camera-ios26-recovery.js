/* =============================================================
   ARI CIRCLE — LAUNCH-SAFE NATIVE MEDIA CAPTURE
   Version: 3.0.0

   Web launch architecture:
   - No getUserMedia()
   - No MediaRecorder
   - No custom live camera preview
   - Uses the device/browser native photo/video capture picker
   - Keeps Camera V2 completely out of the web launch path
   - Selected media still flows through feed.js preview/upload logic
============================================================= */

(() => {
  "use strict";

  const VERSION = "3.0.0";
  let opening = false;

  function mediaInput() {
    return document.getElementById("feedMediaInput");
  }

  function openNativeCapture() {
    if (opening) return;

    const input = mediaInput();
    if (!input) {
      console.warn("ARI Circle native capture input is unavailable.");
      return;
    }

    opening = true;

    // Keep this call synchronous with the user's tap. iOS Safari is much
    // more reliable when the file/camera chooser is opened directly from
    // the trusted user gesture rather than after async permission work.
    try {
      input.click();
    } finally {
      window.setTimeout(() => {
        opening = false;
      }, 350);
    }
  }

  // Capture phase prevents feed.js or any older camera bridge from turning
  // this tap into a getUserMedia / Camera V2 request.
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#feedMediaButton");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openNativeCapture();
  }, true);

  window.AriCircleCameraEntry = Object.freeze({
    version: VERSION,
    open: openNativeCapture
  });
})();
