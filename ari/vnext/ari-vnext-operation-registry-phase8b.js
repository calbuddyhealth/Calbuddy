// ARI vNext — temporary failed-pending preservation compatibility hook.
// All domain mutation routing has moved to permanent registry/domain adapters.

(() => {
  "use strict";

  const VERSION = "1.5.0";
  const SOURCE = "ari_vnext_operation_registry_phase8b";
  const INSTALL_FLAG = "__ariOperationRegistryPhase8B";
  const BRIDGE_CLEAR_FLAG = "__ariRegistryFailurePreserveV1";
  let protectedPendingId = null;

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  function installFailurePreservation(registry) {
    const bridge = window.AriVNextBridge;
    if (!bridge?.getPendingAction || !bridge?.setPendingAction || !bridge?.clearPendingAction) return false;

    if (!bridge[BRIDGE_CLEAR_FLAG]) {
      const originalClear = bridge.clearPendingAction.bind(bridge);
      bridge.clearPendingAction = function registryAwarePendingClear() {
        const current = bridge.getPendingAction?.() || null;
        if (protectedPendingId && clean(current?.id, 220) === protectedPendingId) {
          protectedPendingId = null;
          return false;
        }
        return originalClear();
      };
      Object.defineProperty(bridge, BRIDGE_CLEAR_FLAG, { configurable: false, enumerable: false, value: VERSION });
    }

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== false) return execution;
      const pending = pendingFrom(input);
      if (!pending?.id) return execution;
      bridge.setPendingAction(pending);
      protectedPendingId = clean(pending.id, 220);
      const protectedId = protectedPendingId;
      window.setTimeout(() => {
        if (protectedPendingId === protectedId) protectedPendingId = null;
      }, 0);
      return execution;
    }, { source: `${SOURCE}:failure-preservation`, priority: 10000 });
    return true;
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!installFailurePreservation(registry)) return false;

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      migratedOperations: [],
      migratedApplicationActions: []
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8BReady", {
      detail: { version: VERSION, migratedOperations: [] }
    }));
    return true;
  }

  import("./ari-vnext-circle-registry-adapter.js?v=1.0.0").catch((error) => {
    console.warn("[Ari vNext] Circle registry adapter failed to load:", error?.message || error);
  });

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[Ari Phase 8B] install retry:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();
