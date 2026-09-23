// ARI XP — compatibility tombstone.
// Version: 2.0.0
// Activity local-date normalization and proposal truth are now implemented
// directly in the canonical vNext activity adapter/runtime.

(() => {
  "use strict";
  window.AriActivityGuard = Object.freeze({
    version: "2.0.0",
    removed: true,
    canonicalAuthority: "ari_vnext_activity_adapter"
  });
})();
