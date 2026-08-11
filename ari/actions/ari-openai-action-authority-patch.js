// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-openai-action-authority-patch.js
// Version: 1.0.0
// Purpose:
//   Prevent the legacy CalBuddy keyword/action classifier from intercepting
//   a user turn before the OpenAI-authority runtime sees it.
//
// OpenAI proposes application operations. AriAppControlRuntime validates and
// executes registered operations after application confirmation.
// =====================================================

(() => {
  "use strict";

  if (!window.CalBuddy) return;

  window.CalBuddy.legacyDetectAriActionFromMessage =
    window.CalBuddy.legacyDetectAriActionFromMessage ||
    window.CalBuddy.detectAriActionFromMessage ||
    null;

  window.CalBuddy.detectAriActionFromMessage = async function () {
    return null;
  };

  window.CalBuddy.ariActionSemanticAuthority = "openai";
  window.CalBuddy.ariActionExecutionAuthority = "ari-app-control-runtime";
})();