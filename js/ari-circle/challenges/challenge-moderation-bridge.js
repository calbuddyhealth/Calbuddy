/* =============================================================
   ARI CIRCLE — CHALLENGE MODERATION + CREATOR FLOW BRIDGE
   Version: 1.1.0
   Build 5

   Moderation:
   - combines sampled Challenge video frames into one contact-sheet image
   - keeps start / middle / end coverage in one moderation request
   - falls back to the middle frame if contact-sheet creation fails

   Creator flow:
   - media supplied while creating a Challenge is the creator's final entry
   - prevents the redundant Final Entry sheet immediately after creation
   - keeps the creation messaging aligned with the one-entry rule
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const PROFILE_PATH = "/api/profile";
  const MAX_FRAMES = 4;
  const CELL_SIZE = 480;
  const JPEG_QUALITY = 0.7;
  const CREATOR_FLOW_WINDOW_MS = 8000;

  if (window.__ariChallengeModerationBridgeV1) return;
  window.__ariChallengeModerationBridgeV1 = true;

  const originalFetch = window.fetch.bind(window);
  let creatorMediaSubmissionUntil = 0;

  function clean(value) {
    return String(value ?? "").trim();
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    return clean(input?.url);
  }

  function isProfileRequest(input) {
    const value = requestUrl(input);
    if (!value) return false;
    try {
      const url = new URL(value, window.location.href);
      return url.pathname === PROFILE_PATH;
    } catch {
      return value.includes(PROFILE_PATH);
    }
  }

  function readBody(init) {
    if (!init || typeof init.body !== "string") return null;
    try {
      return JSON.parse(init.body);
    } catch {
      return null;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not prepare a video safety frame."));
      image.src = src;
    });
  }

  function drawContained(context, image, x, y, width, height) {
    const sourceWidth = Number(image.naturalWidth || image.width || 0);
    const sourceHeight = Number(image.naturalHeight || image.height || 0);
    if (!sourceWidth || !sourceHeight) return;

    const scale = Math.min(width / sourceWidth, height / sourceHeight);
    const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
    const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
    const drawX = x + Math.round((width - drawWidth) / 2);
    const drawY = y + Math.round((height - drawHeight) / 2);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  async function makeContactSheet(urls) {
    const sources = (Array.isArray(urls) ? urls : [])
      .map(clean)
      .filter(Boolean)
      .slice(0, MAX_FRAMES);

    if (sources.length <= 1) return sources[0] || "";

    const images = await Promise.all(sources.map(loadImage));
    const columns = sources.length <= 2 ? sources.length : 2;
    const rows = Math.ceil(sources.length / columns);
    const canvas = document.createElement("canvas");
    canvas.width = CELL_SIZE * columns;
    canvas.height = CELL_SIZE * rows;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not prepare Challenge safety frames.");

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((image, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      drawContained(
        context,
        image,
        column * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  async function ariModerationFetch(input, init = {}) {
    if (!isProfileRequest(input) || String(init?.method || "GET").toUpperCase() !== "POST") {
      return originalFetch(input, init);
    }

    const body = readBody(init);
    const images = Array.isArray(body?.image_urls) ? body.image_urls.filter(Boolean) : [];

    if (body?.action !== "moderate_circle_content" || images.length <= 1) {
      return originalFetch(input, init);
    }

    let moderationImage = "";
    try {
      moderationImage = await makeContactSheet(images);
    } catch (error) {
      console.warn("ARI Challenge moderation contact sheet failed; using the middle sampled frame.", error);
      moderationImage = clean(images[Math.floor(images.length / 2)] || images[0]);
    }

    const nextBody = {
      ...body,
      image_urls: moderationImage ? [moderationImage] : [],
      moderation_strategy: "challenge_video_contact_sheet_v1"
    };

    return originalFetch(input, {
      ...init,
      body: JSON.stringify(nextBody)
    });
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
      const hasCreatorMedia = Boolean(preview && preview.hidden === false && preview.firstElementChild);
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

    // Database state should already mark the creator entry as submitted. This
    // observer is a UI fallback for a stale client list so the duplicate sheet
    // never flashes open immediately after creation.
    if (entryDialog) {
      new MutationObserver(() => {
        if (creatorMediaFlowActive() && entryDialog.open) {
          entryDialog.close();
        }
      }).observe(entryDialog, { attributes: true, attributeFilter: ["open"] });
    }
  }

  window.fetch = ariModerationFetch;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCreatorFlow, { once: true });
  } else {
    setupCreatorFlow();
  }

  window.AriChallengeModerationBridge = Object.freeze({
    version: VERSION,
    makeContactSheet
  });
})();
