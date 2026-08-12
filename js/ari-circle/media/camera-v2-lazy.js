/* =============================================================
   ARI CIRCLE — CAMERA V2 LAZY LOADER
   Version: 1.0.0

   Keeps Camera V2 completely out of ARI Circle startup.
   The module is downloaded and initialized only after the user
   explicitly taps the Camera button.
============================================================= */

(() => {
  "use strict";

  const SCRIPT_ID = "ari-circle-camera-v2-script";
  const SCRIPT_SRC = "js/ari-circle/media/camera-v2.js?v=2.0.1";
  let loadPromise = null;

  function toast(message) {
    const host = document.getElementById("feedToast") || document.getElementById("circle-toast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    window.setTimeout(() => { host.hidden = true; }, 3200);
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
        const timer = window.setInterval(() => {
          if (window.AriCircleCameraV2?.open) {
            window.clearInterval(timer);
            resolve(window.AriCircleCameraV2);
          } else if (Date.now() - started > 5000) {
            window.clearInterval(timer);
            reject(new Error("Camera module did not initialize."));
          }
        }, 50);
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        if (window.AriCircleCameraV2?.open) resolve(window.AriCircleCameraV2);
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
    const button = document.getElementById("feedMediaButton");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }

    try {
      const camera = await loadCameraV2();
      await camera.open({ target });
    } catch (error) {
      console.error("ARI Circle Camera V2 lazy load failed:", error);
      toast("Camera couldn't open. Try again.");
      document.getElementById("feedMediaInput")?.click();
    } finally {
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

  window.AriCircleCameraLazy = Object.freeze({
    load: loadCameraV2,
    open: openCamera
  });
})();
