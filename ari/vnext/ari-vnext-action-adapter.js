// ARI vNext — temporary compatibility facade.
// Legacy callers may still use the ActionAdapter name during runtime cutover,
// but all preparation, pending creation, and execution authority belongs to
// AriVNextOperationRegistry and permanent domain handlers.

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const SOURCE = "ari_vnext_action_adapter_compat";

  window.Ari = window.Ari || {};

  async function registry(timeoutMs = 5000) {
    const started = Date.now();
    while (!window.AriVNextOperationRegistry?.ready) {
      if (Date.now() - started > timeoutMs) {
        throw new Error("Ari's permanent operation registry is unavailable.");
      }
      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }
    return window.AriVNextOperationRegistry;
  }

  async function prepareCalBuddyAction(pendingAction = {}) {
    const target = await registry();
    return await target.prepare(pendingAction);
  }

  async function createCalBuddyPendingAction(pendingAction = {}) {
    const target = await registry();
    return await target.createPending(pendingAction);
  }

  async function executeConfirmed(input = {}) {
    const target = await registry();
    return await target.executeConfirmed(input);
  }

  const api = Object.freeze({
    version: VERSION,
    source: SOURCE,
    compatibilityOnly: true,
    prepareCalBuddyAction,
    createCalBuddyPendingAction,
    executeConfirmed
  });

  window.AriVNextActionAdapter = api;
  window.Ari.vNextActionAdapter = api;
  window.dispatchEvent(new CustomEvent("ari:vnextActionAdapterReady", {
    detail: { version: VERSION, source: SOURCE, compatibilityOnly: true }
  }));
})();
