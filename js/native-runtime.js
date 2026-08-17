// ARI XP — native runtime bridge v1.6.0
(() => {
  "use strict";

  const API_ORIGIN = "https://arixp.com";
  let installed = false;

  const normalizeApiUrl = (value) => {
    const raw = String(value || "");
    if (raw.startsWith("/api/")) return `${API_ORIGIN}${raw}`;
    if (raw.startsWith("api/")) return `${API_ORIGIN}/${raw}`;
    return raw;
  };

  function detectNativeRuntime() {
    const capacitor = window.Capacitor || null;
    const capacitorNative = Boolean(
      capacitor &&
      ((typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web"))
    );

    if (capacitorNative) return true;

    const protocol = String(window.location.protocol || "").toLowerCase();
    return protocol === "capacitor:" || protocol === "ionic:";
  }

  function addNativeStylesheet(href, dataKey) {
    if (document.querySelector(`link[data-${dataKey}]`)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    stylesheet.setAttribute(`data-${dataKey}`, "true");
    document.head.appendChild(stylesheet);
  }

  function installPageSpecificNativeUi() {
    const pathname = String(window.location.pathname || "");

    if (/(^|\/)ari-training\.html$/i.test(pathname)) {
      addNativeStylesheet(
        "assets/css/ari-training-native-header.css?v=1.1.0",
        "ari-native-training-header"
      );
    }

    if (
      /(^|\/)(account|ari-preference-settings|privacy-memory|notification-settings|help-safety|owner-moderation|support-ari|blocked-users|community-guidelines)\.html$/i.test(pathname)
    ) {
      addNativeStylesheet(
        "assets/css/native-settings-header.css?v=1.1.0",
        "ari-native-settings-header"
      );
    }

    if (/(^|\/)workout-plans\.html$/i.test(pathname)) {
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
  }

  function patchNativeNetworking() {
    if (window.__ARI_XP_NATIVE_NETWORK_PATCHED__) return;
    window.__ARI_XP_NATIVE_NETWORK_PATCHED__ = true;

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
  }

  function installNativeRuntime() {
    if (installed) return true;
    if (!detectNativeRuntime()) return false;

    installed = true;

    window.ARI_XP_NATIVE = true;
    window.ARI_XP_API_ORIGIN = API_ORIGIN;
    window.ARI_XP_PUBLIC_ORIGIN = API_ORIGIN;
    document.documentElement.dataset.ariNative = "true";

    // iOS owns the status-bar / Dynamic Island clearance through
    // capacitor.config.json -> ios.contentInset = "always". The runtime only
    // applies native component sizing; it no longer pushes the web viewport
    // edge-to-edge or adds a second CSS safe-area shim.
    installPageSpecificNativeUi();
    patchNativeNetworking();

    return true;
  }

  if (installNativeRuntime()) return;

  // Capacitor can become available a moment after bundled head scripts begin.
  // Never permanently fall back to the web layout just because the bridge was
  // not ready on the first synchronous check.
  let attempts = 0;
  const retry = window.setInterval(() => {
    attempts += 1;
    if (installNativeRuntime() || attempts >= 160) {
      window.clearInterval(retry);
    }
  }, 25);

  document.addEventListener("DOMContentLoaded", installNativeRuntime, { once: true });
  window.addEventListener("load", installNativeRuntime, { once: true });
})();
