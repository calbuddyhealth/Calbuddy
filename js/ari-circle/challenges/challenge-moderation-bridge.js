/* =============================================================
   ARI CIRCLE — CHALLENGE MODERATION BRIDGE
   Version: 1.0.0
   Build 5

   The OpenAI moderation endpoint accepts a maximum of one image per
   moderation request. ARI samples multiple frames from a Challenge video,
   so this bridge combines those frames into one contact-sheet image before
   the existing /api/profile safety request is sent.

   Result:
   - keeps three-point video sampling (start / middle / end)
   - sends one moderation image instead of three
   - avoids provider 400 errors
   - keeps one moderation request per Challenge video for predictable scale
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const PROFILE_PATH = "/api/profile";
  const MAX_FRAMES = 4;
  const CELL_SIZE = 480;
  const JPEG_QUALITY = 0.7;

  if (window.__ariChallengeModerationBridgeV1) return;
  window.__ariChallengeModerationBridgeV1 = true;

  const originalFetch = window.fetch.bind(window);

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

  window.fetch = ariModerationFetch;
  window.AriChallengeModerationBridge = Object.freeze({
    version: VERSION,
    makeContactSheet
  });
})();
