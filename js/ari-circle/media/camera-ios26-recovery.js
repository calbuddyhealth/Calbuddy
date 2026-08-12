/* =============================================================
   ARI CIRCLE — CAMERA ENTRY BRIDGE
   Version: 2.0.0

   Launch-safe architecture:
   - Does NOT initialize camera APIs during ARI Circle startup.
   - Camera V2 is downloaded only after the user taps Camera.
   - Prevents camera failures from blocking Feed/Profile/Buddies/Challenges.
   - Falls back to the normal media picker if Camera V2 cannot load.
============================================================= */

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const SCRIPT_ID = "ari-circle-camera-v2-script";
  const SCRIPT_SRC = "js/ari-circle/media/camera-v2.js?v=2.0.1";
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

  function loadCameraV2() {
    if (window.AriCircleCameraV2?.open) {
      return Promise.resolve(window.AriCircleCameraV2);
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        const started = Date.now();
        const timer = setInterval(() => {
          if (window.AriCircleCameraV2?.open) {
            clearInterval(timer);
            resolve(window.AriCircleCameraV2);
            return;
          }
          if (Date.now() - started > 5000) {
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
        if (window.AriCircleCameraV2?.open) {
          resolve(window.AriCircleCameraV2);
        } else {
          reject(new Error("Camera module loaded without an API."));
        }
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
      // Give Safari a paint before any camera work begins.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const camera = await loadCameraV2();
      await camera.open({ target });
    } catch (error) {
      console.error("ARI Circle camera could not open:", error);
      toast("Camera couldn't open. Choose a photo or video instead.");
      document.getElementById("feedMediaInput")?.click();
    } finally {
      opening = false;
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    }
  }

  // Capture phase is intentional: feed.js also has a legacy media-picker
  // click handler. We stop that handler only when the user explicitly taps
  // Camera, then lazy-load Camera V2.
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
    load: loadCameraV2,
    open: openCamera
  });
})();
