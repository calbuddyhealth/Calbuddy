// =====================================================
// ARI XP
// File: ari/actions/ari-workout-plan-action.js
// Version: 4.0.0
// Purpose:
//   Compatibility tombstone after workout planning moved fully to Ari vNext.
//
// Older cached Home bundles may still request this path. It must not wrap
// CalBuddy._askAriInternal or create a second workout proposal path.
// Ari vNext tools, the canonical exercise registry, WorkoutPlanController,
// and the vNext operation registry own workout planning/editing.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.AriLegacyWorkoutAction = Object.freeze({
    version: "4.0.0",
    removed: true,
    semanticAuthority: false,
    canonicalAuthority: "ari_vnext"
  });
})();
