/* =============================================================
   ARI CIRCLE — ARI NEXT OWNER BETA V1
   ARI Next stays private while Circle builds enough local density.
   Public Circle keeps Feed + Connect; the ARI Next experiment loads only
   after the signed-in session passes the existing server-side owner check.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const MODULES = Object.freeze([
    "js/ari-circle/v6/action-network-v6.js?v=0.3.0",
    "js/ari-circle/v6/ari-next-assist-v1.js?v=1.1.0",
    "js/ari-circle/v6/intent-bundles-v1.js?v=1.3.0",
    "js/ari-circle/v6/for-you-commit-v1.js?v=1.1.0",
    "js/ari-circle/meetups/host-flow-v2.js?v=2.0.1"
  ]);

  let verificationPromise = null;

  function client() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitForClient(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const found = client();
      if (found?.auth) return found;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return null;
  }

  async function verifyOwnerAccess({ force = false } = {}) {
    if (verificationPromise && !force) return verificationPromise;

    verificationPromise = (async () => {
      const supabase = await waitForClient();
      if (!supabase) return { signedIn: false, isOwner: false };

      const { data, error } = await supabase.auth.getSession();
      const session = error ? null : data?.session || null;
      const token = String(session?.access_token || "").trim();
      if (!token) return { signedIn: false, isOwner: false };

      try {
        const response = await fetch("/api/ari-github-read", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const body = await response.json().catch(() => ({}));
        return {
          signedIn: true,
          isOwner: response.ok && body?.isOwner === true
        };
      } catch (error) {
        console.warn("[ARI Next Owner Beta] owner verification unavailable:", error?.message || error);
        return { signedIn: true, isOwner: false };
      }
    })();

    try {
      return await verificationPromise;
    } finally {
      verificationPromise = null;
    }
  }

  function loadScript(src) {
    const path = src.split("?")[0];
    const existing = [...document.scripts].find((script) => String(script.src || "").includes(path));
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.ariNextOwnerBetaModule = VERSION;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error(`Could not load ${path}.`)), { once: true });
      document.body.append(script);
    });
  }

  async function boot() {
    document.documentElement.setAttribute("data-ari-next-beta-access", "checking");

    const access = await verifyOwnerAccess();
    if (!access.signedIn) {
      window.location.replace("signin.html");
      return;
    }

    if (!access.isOwner) {
      document.documentElement.setAttribute("data-ari-next-beta-access", "denied");
      window.location.replace("ari-circle-feed.html");
      return;
    }

    document.documentElement.setAttribute("data-ari-next-beta-access", "owner");

    try {
      for (const src of MODULES) await loadScript(src);
      window.dispatchEvent(new CustomEvent("ari-next:owner-beta-ready", {
        detail: { version: VERSION }
      }));
    } catch (error) {
      console.error("[ARI Next Owner Beta]", error);
      const status = document.getElementById("v6PageStatus");
      document.getElementById("v6Page")?.removeAttribute("hidden");
      if (status) status.textContent = "ARI Next beta could not finish loading. Refresh and try again.";
    }
  }

  window.AriNextOwnerBetaV1 = Object.freeze({
    version: VERSION,
    verifyOwnerAccess
  });

  boot();
})();
