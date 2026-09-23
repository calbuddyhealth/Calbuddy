// =====================================================
// ARI XP
// File: ari/actions/ari-meal-action.js
// Version: 3.0.0
// Purpose:
//   Compatibility tombstone after meal logging moved fully to Ari vNext.
//
// Older cached pages may still request this path. It must not wrap
// CalBuddy._askAriInternal, estimate meals, create pending actions, or call a
// second AI endpoint. vNext tools + food resolution + operation registry own
// the complete meal-log lifecycle.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.AriLegacyMealAction = Object.freeze({
    version: "3.0.0",
    removed: true,
    semanticAuthority: false,
    canonicalAuthority: "ari_vnext"
  });
})();
