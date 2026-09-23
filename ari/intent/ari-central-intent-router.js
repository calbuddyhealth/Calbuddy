// =====================================================
// ARI XP
// File: ari/intent/ari-central-intent-router.js
// Version: 2.0.0
// Purpose:
//   Compatibility tombstone after the vNext single-authority cutover.
//
// Older cached auth bundles may still request this file. It must never wrap
// CalBuddy.askAri or classify mutations. Its only permitted behavior is to
// ensure the canonical vNext runtime controller is present.
// =====================================================

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const SCRIPT_ID = "ariVNextRuntimeController";
  const SRC = "ari/runtime/ari-runtime-controller.js?v=1.4.0";

  window.Ari = window.Ari || {};

  function ensureVNextRuntime() {
    if (typeof window.Ari?.Runtime?.ask === "function") return true;
    if (document.getElementById(SCRIPT_ID)) return true;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SRC;
    script.async = false;
    script.dataset.ariCompatibilityLoader = "central-intent-router-tombstone";
    document.head.appendChild(script);
    return true;
  }

  ensureVNextRuntime();

  window.AriLegacyIntentRouter = Object.freeze({
    version: VERSION,
    removed: true,
    semanticAuthority: false,
    runtime: "vnext"
  });
})();
