/* =============================================================
   ARI CIRCLE — LAUNCH-SAFE HYBRID CAMERA ENTRY
   Version: 3.1.0

   Keeps the important ARI camera features:
   - Front/rear camera flip
   - Tap for photo
   - Hold for video
   - 30-second recording limit

   Launch-safe behavior:
   - Camera code is lazy-loaded only after the user taps Camera.
   - Uses the lighter camera-capture module, not Camera V2.
   - If the custom camera cannot open, falls back to the device's
     native photo/video capture picker instead of freezing Circle.
============================================================= */

(() => {
  "use strict";

  const VERSION = "3.1.0";
  const SCRIPT_ID = "ari-circle-camera-capture-script";
  const SCRIPT_SRC = "js/ari-circle/media/camera-capture.js?v=1.0.2";
  let loadPromise = null;
  let opening = false;

  function toast(message) {
    const host = document.getElementById("feedToast") || document.getElementById("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 3200);
  }

  function nativeInput() {
    return document.getElementById("feedMediaInput");
  }

  function openNativeFallback() {
    const input = nativeInput();
    if (!input) return;
    input.click();
  }

  function loadCamera() {
    if (window.AriCircleCamera?.open) {
      return Promise.resolve(window.AriCircleCamera);
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        const started = Date.now();
        const timer = setInterval(() => {
          if (window.AriCircleCamera?.open) {
            clearInterval(timer);
            resolve(window.AriCircleCamera);
            return;
          }
          if (Date.now() - started > 4000) {
            clearInterval(timer);
            reject(new Error("Camera module timed out."));
          }
        }, 50);
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        if (window.AriCircleCamera?.open) resolve(window.AriCircleCamera);
        else reject(new Error("Camera module loaded without an API."));
      };
      script.onerror = () => reject(new Error("Camera module could not load."));
      document.head.appendChild(script);
    }).catch((error) => {
      loadPromise = null;
      throw error;
    });

    return loadPromise;
  }

  async function openCamera(target = "feed") {
    if (opening) return;
    opening = true;

    const button = document.getElementById("feedMediaButton");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }

    try {
      const camera = await loadCamera();
      await camera.open({ target });
    } catch (error) {
      console.error("ARI Circle camera could not open:", error);
      toast("Camera couldn't open. Using your device camera instead.");
      openNativeFallback();
    } finally {
      opening = false;
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#feedMediaButton");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openCamera("feed");
  }, true);

  window.AriCircleCameraEntry = Object.freeze({
    version: VERSION,
    load: loadCamera,
    open: openCamera,
    fallback: openNativeFallback
  });
})();
