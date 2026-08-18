/* =============================================================
   ARI CIRCLE — CHALLENGE CREATOR FLOW BRIDGE
   Version: 1.2.0

   Moderation now runs centrally through content-moderation.js and the
   dedicated /api/ari-circle-moderation endpoint. Video frames stay separate
   so start / middle / end samples are checked independently.

   This bridge now owns only the creator-entry UX:
   - media supplied while creating a Challenge is the creator's final entry
   - prevents the redundant Final Entry sheet immediately after creation
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const CREATOR_FLOW_WINDOW_MS = 8000;

  if (window.__ariChallengeModerationBridgeV1) return;
  window.__ariChallengeModerationBridgeV1 = true;

  let creatorMediaSubmissionUntil = 0;

  function clean(value) {
    return String(value ?? "").trim();
  }

  function creatorMediaFlowActive() {
    return Date.now() < creatorMediaSubmissionUntil;
  }

  function setupCreatorFlow() {
    const form = document.getElementById("createChallengeForm");
    const preview = document.getElementById("challengeCoverPreview");
    const entryDialog = document.getElementById("entryDialog");
    const toast = document.getElementById("challengeToast");
    const attachButton = document.getElementById("pickChallengeCover");
    const removeButton = document.getElementById("removeChallengeCover");

    const attachLabel = attachButton?.querySelector("strong");
    if (attachLabel) attachLabel.textContent = "Add your entry";
    if (removeButton) removeButton.setAttribute("aria-label", "Remove selected entry");

    form?.addEventListener("submit", () => {
      const hasCreatorMedia = Boolean(
        preview &&
        preview.hidden === false &&
        preview.firstElementChild
      );

      creatorMediaSubmissionUntil = hasCreatorMedia
        ? Date.now() + CREATOR_FLOW_WINDOW_MS
        : 0;
    }, true);

    if (toast) {
      const normalizeCreatorToast = () => {
        if (!creatorMediaFlowActive()) return;
        const message = clean(toast.textContent);
        if (
          message === "Challenge created. Add your one final entry." ||
          message === "Your final entry for this challenge is already submitted."
        ) {
          toast.textContent = "Challenge created. Your final entry is live.";
        }
      };

      new MutationObserver(normalizeCreatorToast).observe(toast, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    if (entryDialog) {
      new MutationObserver(() => {
        if (creatorMediaFlowActive() && entryDialog.open) {
          entryDialog.close();
        }
      }).observe(entryDialog, {
        attributes: true,
        attributeFilter: ["open"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCreatorFlow, { once: true });
  } else {
    setupCreatorFlow();
  }

  window.AriChallengeModerationBridge = Object.freeze({
    version: VERSION
  });
})();
