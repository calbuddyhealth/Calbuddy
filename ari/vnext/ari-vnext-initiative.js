// ARI vNext — browser initiative client + final capability bootstrap.
// The runtime loads this file last. AriVNextInitiative is exposed only after
// trusted reference capabilities and evidence-resolved Nutrition are ready.

window.Ari = window.Ari || {};

(() => {
  "use strict";

  const VERSION = "1.3.0";
  const PENDING_SYNC_FLAG = "__ariPendingActionSyncV1";
  const CAPABILITY_SCRIPTS = [
    "ari/vnext/ari-vnext-nutrition-resolution-adapter.js?v=1.1.0",
    "ari/vnext/ari-vnext-nutrition-reference-adapter.js?v=1.0.0",
    "ari/vnext/ari-vnext-weight-adapter.js?v=1.0.0",
    "ari/vnext/ari-vnext-reference-capability-extension.js?v=1.0.0",
    "ari/vnext/ari-vnext-structured-reference-capabilities.js?v=1.0.0"
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

  function clearMatchingPendingCopies(pendingAction = null) {
    const pendingId = clean(pendingAction?.id);
    if (!pendingId) return false;

    const bridge = window.AriVNextBridge;
    const bridgePending = bridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id) === pendingId) bridge?.clearPendingAction?.();

    const CalBuddy = window.CalBuddy;
    const legacyPending = CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id) === pendingId) CalBuddy?.clearPendingAction?.();
    return true;
  }

  function reconcileOrphanedLegacyPending() {
    const CalBuddy = window.CalBuddy;
    const bridge = window.AriVNextBridge;
    if (!CalBuddy?.getPendingAction || !CalBuddy?.clearPendingAction || !bridge?.getPendingAction) return false;

    const legacyPending = CalBuddy.getPendingAction() || null;
    const linkedId = clean(legacyPending?.vnext_action_id);
    if (!linkedId) return false;

    const bridgePending = bridge.getPendingAction() || null;
    if (clean(bridgePending?.id) === linkedId) return false;

    CalBuddy.clearPendingAction();
    return true;
  }

  function installPendingActionSync() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter[PENDING_SYNC_FLAG]) {
      reconcileOrphanedLegacyPending();
      return true;
    }
    if (typeof adapter.executeConfirmed !== "function") return false;

    const originalExecute = adapter.executeConfirmed.bind(adapter);
    adapter.executeConfirmed = async function pendingStateSynchronizedExecute(input = {}) {
      const pendingAction = input?.vnextPendingAction || null;
      const execution = await originalExecute(input);
      if (execution?.success === true) clearMatchingPendingCopies(pendingAction);
      return execution;
    };

    Object.defineProperty(adapter, PENDING_SYNC_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    reconcileOrphanedLegacyPending();
    return true;
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
      if (!installPendingActionSync()) throw new Error("Ari pending-action synchronization did not initialize.");
      window.AriVNextInitiative = createClient();
      window.dispatchEvent(new CustomEvent("ari:vnextInitiativeReady", { detail: { version: VERSION } }));
    })
    .catch((error) => {
      console.error("[Ari vNext] Capability bootstrap failed:", error?.message || error);
    });
})();