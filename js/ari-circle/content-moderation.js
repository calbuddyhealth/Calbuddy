/* =============================================================
   ARI XP — ARI CIRCLE CONTENT MODERATION
   Version: 1.2.0

   Pre-publication safety screening for ARI Circle UGC.
   Covers Feed, comments, Moments, Messages, and Challenges.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const PROFILE_API = "/api/profile";
  const CONSENT_SCRIPT = "js/ai-processing-consent.js?v=1.1.0";
  const AI_CONSENT_KEY = "ari_ai_processing_consent";
  const AI_CONSENT_VERSION_KEY = "ari_ai_processing_consent_version";
  const REQUIRED_AI_CONSENT_VERSION = "2";
  const MAX_IMAGE_EDGE = 768;
  const VIDEO_SAMPLE_EDGE = 640;
  const JPEG_QUALITY = 0.68;

  const mutationRules = Object.freeze({
    ari_circle_feed_create_post_v2: Object.freeze({
      scope: "feed_post",
      textKeys: ["requested_body"],
      mediaPathKey: "requested_media_path",
      mediaTypeKey: "requested_media_type",
      mediaInputId: "feedMediaInput",
      mediaBucket: "ari-circle-post-media"
    }),
    ari_circle_feed_add_comment: Object.freeze({
      scope: "feed_comment",
      textKeys: ["requested_body"]
    }),
    ari_circle_moment_create: Object.freeze({
      scope: "moment",
      textKeys: ["requested_caption"],
      mediaPathKey: "requested_media_path",
      mediaTypeKey: "requested_media_type",
      mediaInputId: "feedMediaInput",
      mediaBucket: "ari-circle-post-media"
    }),
    ari_circle_messages_send: Object.freeze({
      scope: "direct_message",
      textKeys: ["requested_body"]
    }),
    ari_circle_messages_edit: Object.freeze({
      scope: "direct_message_edit",
      textKeys: ["requested_body"]
    }),
    ari_circle_challenge_create: Object.freeze({
      scope: "challenge_create",
      textKeys: ["requested_title", "requested_description", "requested_unit_label"]
    }),
    ari_circle_challenge_create_v2: Object.freeze({
      scope: "challenge_create",
      textKeys: ["requested_title", "requested_description", "requested_unit_label"],
      mediaPathKey: "requested_cover_media_path",
      mediaTypeKey: "requested_cover_media_type",
      mediaInputId: "challengeCoverInput",
      mediaBucket: "ari-circle-challenge-media"
    }),
    ari_circle_challenge_submit_entry: Object.freeze({
      scope: "challenge_entry",
      textKeys: ["requested_caption"],
      mediaPathKey: "requested_media_path",
      mediaTypeKey: "requested_media_type",
      mediaInputId: "challengeEntryMediaInput",
      mediaBucket: "ari-circle-challenge-media"
    })
  });

  const moderatedInputIds = new Set(
    Object.values(mutationRules)
      .map((rule) => rule.mediaInputId)
      .filter(Boolean)
  );

  const state = {
    client: null,
    originalRpc: null,
    patched: false,
    selectedMediaFiles: new Map(),
    initAttempts: 0,
    consentLoader: null
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function resolveClient() {
    return (
      window.calbuddySupabase ||
      window.supabaseClient ||
      window.CalBuddy?.supabase ||
      null
    );
  }

  function safeMessage(error, fallback) {
    return clean(error?.message || error) || fallback;
  }

  function makeSupabaseError(message, code = "ARI_CONTENT_BLOCKED") {
    return { message, code, details: null, hint: null };
  }

  function rememberSelectedMedia(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!moderatedInputIds.has(input.id)) return;
    state.selectedMediaFiles.set(input.id, input.files?.[0] || null);
  }

  function ensureConsentController() {
    if (window.AriAIConsent) return Promise.resolve(window.AriAIConsent);
    if (state.consentLoader) return state.consentLoader;

    state.consentLoader = new Promise((resolve) => {
      const existing = document.querySelector('script[src*="ai-processing-consent.js"]');
      if (existing) {
        if (window.AriAIConsent) return resolve(window.AriAIConsent);
        existing.addEventListener("load", () => resolve(window.AriAIConsent || null), { once: true });
        existing.addEventListener("error", () => resolve(null), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = CONSENT_SCRIPT;
      script.async = false;
      script.addEventListener("load", () => resolve(window.AriAIConsent || null), { once: true });
      script.addEventListener("error", () => resolve(null), { once: true });
      document.head.appendChild(script);
    });

    return state.consentLoader;
  }

  async function currentSession() {
    const client = state.client || resolveClient();
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  function sessionHasCurrentConsent(session) {
    const metadata = session?.user?.user_metadata || {};
    return (
      metadata[AI_CONSENT_KEY] === true &&
      String(metadata[AI_CONSENT_VERSION_KEY] || "") === REQUIRED_AI_CONSENT_VERSION
    );
  }

  async function requireCurrentConsent() {
    await ensureConsentController();
    const session = await currentSession();

    if (!session) {
      const error = new Error("Sign in again before sharing to ARI Circle.");
      error.code = "ARI_SESSION_REQUIRED";
      throw error;
    }

    if (!sessionHasCurrentConsent(session)) {
      window.AriAIConsent?.show?.();
      const error = new Error(
        "Allow AI processing before sharing in ARI Circle. The permission is used for pre-publication safety screening."
      );
      error.code = "ARI_AI_CONSENT_REQUIRED";
      throw error;
    }

    return session;
  }

  function canvasDataUrl(source, maxEdge = MAX_IMAGE_EDGE) {
    const width = Number(source.videoWidth || source.naturalWidth || source.width || 0);
    const height = Number(source.videoHeight || source.naturalHeight || source.height || 0);
    if (!width || !height) throw new Error("ARI Circle could not read that media.");

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("ARI Circle could not prepare that media.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  function waitFor(target, eventName, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      let timer = null;
      const cleanup = () => {
        if (timer) window.clearTimeout(timer);
        target.removeEventListener(eventName, onEvent);
        target.removeEventListener("error", onError);
      };
      const onEvent = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error("ARI Circle could not read that media.")); };
      timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("ARI Circle media safety check timed out."));
      }, timeoutMs);
      target.addEventListener(eventName, onEvent, { once: true });
      target.addEventListener("error", onError, { once: true });
    });
  }

  async function sampleImageFile(file) {
    if (!file) return [];
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    try {
      image.src = url;
      if (image.decode) await image.decode();
      else await waitFor(image, "load");
      return [canvasDataUrl(image, MAX_IMAGE_EDGE)];
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function seekVideo(video, time) {
    const safeTime = Math.max(0, Math.min(Number(video.duration || 0), Number(time || 0)));
    if (Math.abs(Number(video.currentTime || 0) - safeTime) < 0.03) return;
    video.currentTime = safeTime;
    await waitFor(video, "seeked", 4500);
  }

  async function sampleVideoFile(file) {
    if (!file) return [];
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    try {
      video.src = url;
      video.load();
      await waitFor(video, "loadedmetadata", 6000);
      const duration = Number(video.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("ARI Circle could not inspect that video.");
      }

      const lastFrame = Math.max(0, duration - 0.05);
      const sampleTimes = [
        Math.min(duration * 0.12, lastFrame),
        Math.min(duration * 0.5, lastFrame),
        Math.min(duration * 0.88, lastFrame)
      ];
      const frames = [];
      for (const time of sampleTimes) {
        await seekVideo(video, time);
        frames.push(canvasDataUrl(video, VIDEO_SAMPLE_EDGE));
      }
      return frames;
    } finally {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    }
  }

  async function signedImageUrl(bucket, mediaPath) {
    const path = clean(mediaPath);
    if (!path || !bucket) return "";
    const client = state.client || resolveClient();
    if (!client?.storage) return "";
    const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 120);
    if (error) throw error;
    return clean(data?.signedUrl);
  }

  async function mediaInputs(rule, params = {}) {
    const mediaPath = rule.mediaPathKey ? clean(params?.[rule.mediaPathKey]) : "";
    const mediaType = rule.mediaTypeKey ? clean(params?.[rule.mediaTypeKey]).toLowerCase() : "";
    if (!mediaPath || !mediaType) return [];

    const selected = rule.mediaInputId
      ? state.selectedMediaFiles.get(rule.mediaInputId)
      : null;

    if (mediaType === "image") {
      if (selected?.type?.toLowerCase().startsWith("image/")) {
        return await sampleImageFile(selected);
      }
      const signed = await signedImageUrl(rule.mediaBucket, mediaPath);
      if (!signed) throw new Error("ARI Circle could not inspect that photo.");
      return [signed];
    }

    if (mediaType === "video") {
      if (!selected?.type?.toLowerCase().startsWith("video/")) {
        throw new Error("ARI Circle could not run the video safety check. Select the video again and retry.");
      }
      const frames = await sampleVideoFile(selected);
      if (!frames.length) throw new Error("ARI Circle could not run the video safety check.");
      return frames;
    }

    return [];
  }

  function mutationText(rule, params = {}) {
    return (rule.textKeys || [])
      .map((key) => clean(params?.[key]))
      .filter(Boolean)
      .join("\n")
      .slice(0, 8000);
  }

  async function requestModeration({ scope, text = "", imageUrls = [], session = null } = {}) {
    const resolvedSession = session || await requireCurrentConsent();
    const token = clean(resolvedSession?.access_token);
    if (!token) throw new Error("Sign in again before sharing to ARI Circle.");

    const response = await fetch(PROFILE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: "moderate_circle_content",
        scope: clean(scope).slice(0, 80),
        text: clean(text).slice(0, 8000),
        image_urls: Array.isArray(imageUrls) ? imageUrls.slice(0, 4) : []
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 403 && data?.code === "AI_PROCESSING_CONSENT_REQUIRED") {
        window.AriAIConsent?.show?.();
        const consentError = new Error(
          "Allow AI processing before sharing in ARI Circle. The permission is used for pre-publication safety screening."
        );
        consentError.code = "ARI_AI_CONSENT_REQUIRED";
        throw consentError;
      }
      throw new Error(clean(data?.error) || "ARI Circle could not run its safety check. Try again.");
    }
    return data;
  }

  async function moderateMutation(name, params = {}) {
    const rule = mutationRules[name];
    if (!rule) return;

    const session = await requireCurrentConsent();
    const text = mutationText(rule, params);
    const imageUrls = await mediaInputs(rule, params);
    const result = await requestModeration({ scope: rule.scope, text, imageUrls, session });

    if (result?.allowed !== true) {
      const error = new Error("That content can’t be shared in ARI Circle. Please edit it and try again.");
      error.code = "ARI_CONTENT_BLOCKED";
      throw error;
    }
  }

  function patchRpc() {
    if (state.patched) return true;
    const client = resolveClient();
    if (!client || typeof client.rpc !== "function") return false;

    state.client = client;
    state.originalRpc = client.rpc.bind(client);

    const wrappedRpc = async function ariModeratedRpc(name, params = {}, options) {
      try {
        await moderateMutation(String(name || ""), params || {});
      } catch (error) {
        const blocked = error?.code === "ARI_CONTENT_BLOCKED";
        const consentRequired = error?.code === "ARI_AI_CONSENT_REQUIRED";
        const message = blocked
          ? safeMessage(error, "That content can’t be shared in ARI Circle.")
          : consentRequired
            ? safeMessage(error, "Allow AI processing before sharing in ARI Circle.")
            : safeMessage(error, "ARI Circle could not run its safety check. Try again.");
        return {
          data: null,
          error: makeSupabaseError(
            message,
            blocked ? "ARI_CONTENT_BLOCKED" : consentRequired ? "ARI_AI_CONSENT_REQUIRED" : "ARI_MODERATION_UNAVAILABLE"
          )
        };
      }
      return await state.originalRpc(name, params, options);
    };

    wrappedRpc.__ariContentModerationWrapped = true;
    client.rpc = wrappedRpc;
    state.patched = true;
    return true;
  }

  function init() {
    document.addEventListener("change", rememberSelectedMedia, true);
    ensureConsentController();
    if (patchRpc()) return;

    const retry = () => {
      state.initAttempts += 1;
      if (patchRpc() || state.initAttempts >= 20) return;
      window.setTimeout(retry, 100);
    };
    retry();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AriCircleContentModeration = Object.freeze({
    version: VERSION,
    moderate: requestModeration,
    refresh: patchRpc,
    isReady: () => state.patched === true
  });
})();
