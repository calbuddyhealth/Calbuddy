// ARI vNext — permanent pending-action reliability core.
// Failed trusted execution preserves the same turn-bound pending action for retry,
// while suppressing only the runtime's immediate clear. A later explicit clear or
// cancel still works normally.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_pending_reliability";
  const BRIDGE_CLEAR_FLAG = "__ariPendingReliabilityV1";
  let protectedPendingId = null;
  let installed = false;

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  function install() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    const bridge = window.AriVNextBridge;
    if (!registry?.ready || typeof registry.registerAfterExecution !== "function") return false;
    if (!bridge?.getPendingAction || !bridge?.setPendingAction || !bridge?.clearPendingAction) return false;

    if (!bridge[BRIDGE_CLEAR_FLAG]) {
      const originalClear = bridge.clearPendingAction.bind(bridge);
      bridge.clearPendingAction = function pendingReliabilityAwareClear() {
        const current = bridge.getPendingAction?.() || null;
        if (protectedPendingId && clean(current?.id) === protectedPendingId) {
          protectedPendingId = null;
          return false;
        }
        return originalClear();
      };
      Object.defineProperty(bridge, BRIDGE_CLEAR_FLAG, {
        configurable: false,
        enumerable: false,
        value: VERSION
      });
    }

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== false) return execution;
      const pending = pendingFrom(input);
      const pendingId = clean(pending?.id);
      if (!pendingId) return execution;

      bridge.setPendingAction(pending);
      protectedPendingId = pendingId;
      const protectedId = pendingId;
      window.setTimeout(() => {
        if (protectedPendingId === protectedId) protectedPendingId = null;
      }, 0);
      return execution;
    }, { source: SOURCE, priority: 10000 });

    installed = true;
    window.AriVNextPendingReliability = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true
    });

    // Temporary readiness alias for Phase 8C while that file is retired next.
    // No Phase 8B behavior or routing remains behind this marker.
    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: "retired",
      source: SOURCE,
      ready: true,
      retired: true,
      successor: "AriVNextPendingReliability"
    });

    window.dispatchEvent(new CustomEvent("ari:vnextPendingReliabilityReady", {
      detail: { version: VERSION, source: SOURCE }
    }));
    return true;
  }

  if (!install()) {
    window.addEventListener?.("ari:vnextOperationRegistryReady", install, { once: true });
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();
