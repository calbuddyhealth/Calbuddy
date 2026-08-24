/* =============================================================
   ARI CIRCLE V5 — REAL WORLD PUBLICATION MODERATION
   Reuses the existing Circle moderation endpoint for new V5 UGC mutations.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.1.0";
  if (window.AriCircleRealWorldModerationV5?.version === VERSION) return;

  const CONTENT_MODERATION_SRC = "js/ari-circle/content-moderation.js?v=1.5.0";
  const RULES = Object.freeze({
    ari_circle_create_meetup: Object.freeze({
      scope: "meetup_create",
      textKeys: ["requested_title", "requested_area", "requested_description"]
    }),
    ari_circle_set_meetup_point: Object.freeze({
      scope: "meetup_room_location",
      textKeys: ["requested_meeting_point"]
    }),
    ari_circle_send_meetup_message: Object.freeze({
      scope: "meetup_room_message",
      textKeys: ["requested_body"]
    }),
    ari_circle_create_quest: Object.freeze({
      scope: "quest_create",
      textKeys: ["requested_title", "requested_description"]
    }),
    ari_circle_submit_quest_completion: Object.freeze({
      scope: "quest_completion",
      textKeys: ["requested_note"]
    })
  });

  let patchedClient = null;
  let moderationLoader = null;
  let attempts = 0;

  const clean = (value) => String(value ?? "").trim();

  function resolveClient() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  function textFor(rule, params = {}) {
    return rule.textKeys
      .map((key) => clean(params?.[key]))
      .filter(Boolean)
      .join("\n")
      .slice(0, 8000);
  }

  function ensureModerationService() {
    if (window.AriCircleContentModeration?.moderate) {
      return Promise.resolve(window.AriCircleContentModeration);
    }
    if (moderationLoader) return moderationLoader;

    moderationLoader = new Promise((resolve, reject) => {
      const finish = () => {
        if (window.AriCircleContentModeration?.moderate) resolve(window.AriCircleContentModeration);
        else reject(new Error("ARI Circle safety screening did not become available."));
      };

      const existing = [...document.scripts].find((script) => script.src.includes("js/ari-circle/content-moderation.js"));
      if (existing) {
        if (window.AriCircleContentModeration?.moderate) return resolve(window.AriCircleContentModeration);
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => reject(new Error("ARI Circle safety screening failed to load.")), { once: true });
        setTimeout(finish, 1200);
        return;
      }

      const script = document.createElement("script");
      script.src = CONTENT_MODERATION_SRC;
      script.async = false;
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", () => reject(new Error("ARI Circle safety screening failed to load.")), { once: true });
      document.head.append(script);
    });

    return moderationLoader;
  }

  function moderationError(message, code = "ARI_CONTENT_BLOCKED") {
    return { message, code, details: null, hint: null };
  }

  async function moderate(name, params) {
    const rule = RULES[name];
    if (!rule) return null;
    const text = textFor(rule, params);
    if (!text) return null;

    const service = await ensureModerationService();
    const result = await service.moderate({ scope: rule.scope, text, imageUrls: [] });
    if (result?.allowed !== true) {
      const error = new Error("That content can’t be shared in ARI Circle. Please edit it and try again.");
      error.code = "ARI_CONTENT_BLOCKED";
      throw error;
    }
    return result;
  }

  function patch() {
    const client = resolveClient();
    if (!client || typeof client.rpc !== "function") return false;
    if (client === patchedClient && client.rpc.__ariRealWorldModerationWrapped) return true;
    if (client.rpc.__ariRealWorldModerationWrapped) {
      patchedClient = client;
      return true;
    }

    const originalRpc = client.rpc.bind(client);
    const wrapped = async function ariRealWorldModeratedRpc(name, params = {}, options) {
      const mutationName = clean(name);
      if (RULES[mutationName]) {
        try {
          await moderate(mutationName, params || {});
        } catch (error) {
          return {
            data: null,
            error: moderationError(
              clean(error?.message) || "ARI Circle could not run its safety check. Try again.",
              clean(error?.code) || "ARI_MODERATION_UNAVAILABLE"
            )
          };
        }
      }
      return await originalRpc(name, params, options);
    };

    wrapped.__ariRealWorldModerationWrapped = true;
    client.rpc = wrapped;
    patchedClient = client;
    return true;
  }

  function start() {
    ensureModerationService().catch((error) => console.warn("ARI Circle V5 moderation preload:", error?.message || error));
    if (patch()) return;
    const retry = () => {
      attempts += 1;
      if (patch() || attempts >= 80) return;
      setTimeout(retry, 75);
    };
    retry();
  }

  window.AriCircleRealWorldModerationV5 = Object.freeze({
    version: VERSION,
    refresh: patch,
    moderate
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
