// ARI XP — native runtime bridge v1.0.0
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

  window.ARI_XP_NATIVE = true;
  window.ARI_XP_API_ORIGIN = API_ORIGIN;
  window.ARI_XP_PUBLIC_ORIGIN = API_ORIGIN;

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

  // Prevent accidental attempts to navigate the native shell to the hosted
  // frontend. Explicit external links may still open through their normal
  // browser behavior, but ARI XP's internal pages stay bundled/local.
  document.documentElement.dataset.ariNative = "true";
})();
