// ARI vNext — browser initiative client + final capability bootstrap.
// The runtime loads this file last. AriVNextInitiative is exposed only after
// trusted reference capabilities, authoritative reference rehydration,
// evidence-resolved Nutrition, the finalized canonical operation registry,
// Phase 9B correction continuity, and Phase 9D refresh/relaunch continuity are
// ready.

window.Ari = window.Ari || {};

(() => {
  "use strict";

  const VERSION = "1.6.0";
  const CAPABILITY_SCRIPTS = [
    "ari/vnext/ari-vnext-nutrition-resolution-adapter.js?v=1.1.0",
    "ari/vnext/ari-vnext-nutrition-reference-adapter.js?v=1.0.0",
    "ari/vnext/ari-vnext-weight-adapter.js?v=1.0.0",
    "ari/vnext/ari-vnext-reference-capability-extension.js?v=1.0.0",
    "ari/vnext/ari-vnext-structured-reference-capabilities.js?v=1.0.0",
    "ari/vnext/ari-vnext-authoritative-reference-rehydration.js?v=1.0.0",
    "ari/vnext/ari-vnext-operation-registry.js?v=1.0.0",
    "ari/vnext/ari-vnext-operation-registry-phase8b.js?v=1.0.0",
    "ari/vnext/ari-vnext-operation-registry-phase8c.js?v=1.0.0",
    "ari/vnext/ari-vnext-phase9b-correction-continuity.js?v=1.0.0",
    "ari/vnext/ari-vnext-phase9d-continuity-reliability.js?v=1.0.0"
  ];

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function scriptBase(src = "") {
    return String(src || "").split("?")[0];
  }

  function ready(src = "") {
    const base = scriptBase(src);
    if (base.endsWith("ari-vnext-nutrition-resolution-adapter.js")) return window.AriVNextNutritionResolutionAdapter?.ready === true;
    if (base.endsWith("ari-vnext-nutrition-reference-adapter.js")) return window.AriVNextNutritionReferenceAdapter?.ready === true;
    if (base.endsWith("ari-vnext-weight-adapter.js")) return window.AriVNextWeightAdapter?.ready === true;
    if (base.endsWith("ari-vnext-reference-capability-extension.js")) return window.AriVNextReferenceCapabilityExtension?.ready === true;
    if (base.endsWith("ari-vnext-structured-reference-capabilities.js")) return window.AriVNextStructuredReferenceCapabilities?.ready === true;
    if (base.endsWith("ari-vnext-authoritative-reference-rehydration.js")) return window.AriVNextAuthoritativeReferenceRehydration?.ready === true;
    if (base.endsWith("ari-vnext-operation-registry.js")) return window.AriVNextOperationRegistry?.ready === true;
    if (base.endsWith("ari-vnext-operation-registry-phase8b.js")) return window.AriVNextOperationRegistryPhase8B?.ready === true;
    if (base.endsWith("ari-vnext-operation-registry-phase8c.js")) return window.AriVNextOperationRegistryPhase8C?.ready === true;
    if (base.endsWith("ari-vnext-phase9b-correction-continuity.js")) return window.AriVNextPhase9BCorrectionContinuity?.ready === true;
    if (base.endsWith("ari-vnext-phase9d-continuity-reliability.js")) return window.AriVNextPhase9DContinuityReliability?.ready === true;
    return true;
  }

  function loadScript(src) {
    if (ready(src)) return Promise.resolve(true);
    const base = scriptBase(src);
    const existing = [...document.scripts].find((script) => scriptBase(script.getAttribute("src") || "") === base);
    if (existing) {
      return new Promise((resolve, reject) => {
        const started = Date.now();
        const timer = window.setInterval(() => {
          if (ready(src)) {
            window.clearInterval(timer);
            resolve(true);
          } else if (Date.now() - started > 5000) {
            window.clearInterval(timer);
            reject(new Error(`Ari capability dependency did not initialize: ${base}`));
          }
        }, 25);
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => {
        const started = Date.now();
        const timer = window.setInterval(() => {
          if (ready(src)) {
            window.clearInterval(timer);
            resolve(true);
          } else if (Date.now() - started > 5000) {
            window.clearInterval(timer);
            reject(new Error(`Ari capability dependency did not initialize: ${base}`));
          }
        }, 25);
      };
      script.onerror = () => reject(new Error(`Ari capability dependency failed to load: ${base}`));
      document.head.appendChild(script);
    });
  }

  async function installCapabilities() {
    for (const src of CAPABILITY_SCRIPTS) await loadScript(src);
  }

  function createClient() {
    return {
      version: VERSION,
      source: "ari-vnext-initiative-client",

      async check(options = {}) {
        const bridge = window.AriVNextBridge;
        if (!bridge?.getSession || !bridge?.buildContext) throw new Error("Ari vNext bridge is not available.");

        const session = await bridge.getSession();
        const accessToken = String(session?.access_token || "").trim();
        if (!accessToken) throw new Error("A signed-in ARI session is required.");

        const context = await bridge.buildContext({
          ...options,
          message: "Review recent training goals weight trend adherence experiments and recovery for meaningful changes",
          history: []
        });
        const surface = options?.page || options?.surface || window.location.pathname || "app_open";

        const response = await fetch("/api/ari-vnext-initiative", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action: "check", surface, context }),
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Ari initiative check failed.");

        if (data?.shouldInitiate && data?.initiative) {
          window.dispatchEvent(new CustomEvent("ari:vnextInitiative", { detail: data }));
        } else {
          window.dispatchEvent(new CustomEvent("ari:vnextInitiativeQuiet", { detail: data }));
        }
        return data;
      },

      async engage(initiative) {
        return this.updateStatus(initiative, "engage");
      },

      async dismiss(initiative) {
        return this.updateStatus(initiative, "dismiss");
      },

      async updateStatus(initiative, action) {
        const bridge = window.AriVNextBridge;
        const session = await bridge?.getSession?.();
        const accessToken = String(session?.access_token || "").trim();
        const initiativeId = String(initiative?.id || "").trim();
        if (!accessToken) throw new Error("A signed-in ARI session is required.");
        if (!initiativeId) throw new Error("Ari initiative identity is missing.");

        const response = await fetch("/api/ari-vnext-initiative", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action, initiativeId }),
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false) throw new Error(data?.error || data?.code || "Ari initiative update failed.");
        window.dispatchEvent(new CustomEvent(action === "engage" ? "ari:vnextInitiativeEngaged" : "ari:vnextInitiativeDismissed", { detail: data }));
        return data;
      }
    };
  }

  installCapabilities()
    .then(() => {
      window.AriVNextInitiative = createClient();
      window.dispatchEvent(new CustomEvent("ari:vnextInitiativeReady", { detail: { version: VERSION } }));
    })
    .catch((error) => {
      console.error("[Ari vNext] Capability bootstrap failed:", error?.message || error);
    });
})();
