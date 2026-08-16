// ARI XP — native runtime bridge v1.3.0
(() => {
  "use strict";

  const capacitor = window.Capacitor || null;
  const isNative = Boolean(
    capacitor &&
    ((typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
      (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web"))
  );

  if (!isNative) return;

  const API_ORIGIN = "https://arixp.com";
  const normalizeApiUrl = (value) => {
    const raw = String(value || "");
    if (raw.startsWith("/api/")) return `${API_ORIGIN}${raw}`;
    if (raw.startsWith("api/")) return `${API_ORIGIN}/${raw}`;
    return raw;
  };

  const addNativeStylesheet = (href, dataKey) => {
    if (document.querySelector(`link[data-${dataKey}]`)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    stylesheet.setAttribute(`data-${dataKey}`, "true");
    document.head.appendChild(stylesheet);
  };

  // Make iPhone safe-area environment variables reliable on every bundled page.
  // Pages that already declare viewport-fit=cover are left unchanged.
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const currentViewport = String(viewport.getAttribute("content") || "");
    if (!/viewport-fit\s*=\s*cover/i.test(currentViewport)) {
      viewport.setAttribute(
        "content",
        `${currentViewport}${currentViewport ? ", " : ""}viewport-fit=cover`
      );
    }
  }

  window.ARI_XP_NATIVE = true;
  window.ARI_XP_API_ORIGIN = API_ORIGIN;
  window.ARI_XP_PUBLIC_ORIGIN = API_ORIGIN;

  // Mark the document before page content paints so native-only CSS can
  // reserve iPhone safe areas without changing the hosted web experience.
  document.documentElement.dataset.ariNative = "true";

  // Training uses a compact native header layer that accounts for the iPhone
  // camera / Dynamic Island and strengthens the left/right navigation controls.
  if (/(^|\/)ari-training\.html$/i.test(window.location.pathname)) {
    addNativeStylesheet(
      "assets/css/ari-training-native-header.css?v=1.0.0",
      "ari-native-training-header"
    );
  }

  // My Account and Personalize Ari had controls too close to the iPhone status
  // area. Give both pages dedicated native safe-area spacing and larger targets.
  if (/(^|\/)(account|ari-preference-settings)\.html$/i.test(window.location.pathname)) {
    addNativeStylesheet(
      "assets/css/native-settings-header.css?v=1.0.0",
      "ari-native-settings-header"
    );
  }

  // Workout editor sheets can become much taller than the viewport. Keep only
  // the close control visually anchored while the title/content scroll normally.
  if (/(^|\/)workout-plans\.html$/i.test(window.location.pathname)) {
    addNativeStylesheet(
      "assets/css/workout-plans-native-dialog.css?v=1.0.0",
      "ari-native-workout-dialog"
    );

    const setupFloatingDialogCloseControls = () => {
      ["workoutDayEditor", "workoutExercisePicker"].forEach((dialogId) => {
        const dialog = document.getElementById(dialogId);
        const panel = dialog?.querySelector(".workout-dialog__panel");
        const closeButton = dialog?.querySelector(".workout-dialog__close");
        if (!dialog || !panel || !closeButton) return;

        closeButton.classList.add("ari-native-floating-dialog-close");

        let frame = 0;
        const sync = () => {
          frame = 0;
          const scrollTop = Math.max(0, Number(panel.scrollTop || 0));
          closeButton.style.setProperty(
            "--ari-native-dialog-scroll-y",
            `${scrollTop}px`
          );
          closeButton.classList.toggle(
            "is-ari-dialog-scrolled",
            scrollTop > 8
          );
        };

        const scheduleSync = () => {
          if (frame) return;
          frame = window.requestAnimationFrame(sync);
        };

        panel.addEventListener("scroll", scheduleSync, { passive: true });

        const observer = new MutationObserver((mutations) => {
          if (mutations.some((mutation) => mutation.attributeName === "open")) {
            window.requestAnimationFrame(sync);
          }
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });

        sync();
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        setupFloatingDialogCloseControls,
        { once: true }
      );
    } else {
      setupFloatingDialogCloseControls();
    }
  }

  // CapacitorHttp is enabled in capacitor.config.json. The bridge patches the
  // platform fetch/XHR implementations before application scripts execute.
  // This thin wrapper only converts same-origin web API paths to the production
  // backend so the bundled UI can remain local inside the app.
  const platformFetch = window.fetch.bind(window);
  window.fetch = function ariNativeFetch(resource, options) {
    if (typeof resource === "string") {
      return platformFetch(normalizeApiUrl(resource), options);
    }

    if (resource instanceof URL) {
      return platformFetch(new URL(normalizeApiUrl(resource.toString())), options);
    }

    if (typeof Request !== "undefined" && resource instanceof Request) {
      const nextUrl = normalizeApiUrl(resource.url);
      if (nextUrl !== resource.url) {
        return platformFetch(new Request(nextUrl, resource), options);
      }
    }

    return platformFetch(resource, options);
  };

  if (window.XMLHttpRequest?.prototype?.open) {
    const platformOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function ariNativeXhrOpen(method, url, ...rest) {
      return platformOpen.call(this, method, normalizeApiUrl(url), ...rest);
    };
  }
})();