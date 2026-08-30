// ARI vNext — browser initiative client + trusted operation bootstrap.
// The initiative client remains deterministic; the bootstrap guarantees the
// canonical operation registry is installed before runtime readiness is exposed.

window.Ari = window.Ari || {};

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const OPERATION_REGISTRY_SRC = "ari/vnext/ari-vnext-operation-registry.js?v=1.0.0";

  function registryReady() {
    return window.AriVNextOperationRegistry?.ready === true;
  }

  function existingRegistryScript() {
    return [...document.scripts].find((script) => {
      const src = String(script.getAttribute("src") || "").split("?")[0];
      return src.endsWith("ari/vnext/ari-vnext-operation-registry.js");
    });
  }

  async function waitForRegistry(timeoutMs = 5000) {
    if (registryReady()) return true;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 25));
      if (registryReady()) return true;
    }
    throw new Error("Ari operation registry did not initialize.");
  }

  async function ensureRegistry() {
    if (registryReady()) return true;

    if (!existingRegistryScript()) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = OPERATION_REGISTRY_SRC;
        script.async = false;
        script.dataset.ariVNextCapability = "operation-registry";
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", () => reject(new Error("Ari operation registry failed to load.")), { once: true });
        document.head.appendChild(script);
      });
    }

    return await waitForRegistry();
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

        // This message is used only to make the existing context builder load the
        // canonical training/goal history. It is never sent to an LLM.
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

  ensureRegistry()
    .then(() => {
      window.AriVNextInitiative = createClient();
      window.dispatchEvent(new CustomEvent("ari:vnextInitiativeReady", {
        detail: { version: VERSION, operationRegistryVersion: window.AriVNextOperationRegistry?.version || null }
      }));
    })
    .catch((error) => {
      console.error("[Ari vNext] Operation registry bootstrap failed:", error?.message || error);
    });
})();
