/* =============================================================
   ARI CIRCLE — PROFILE SAFETY BRIDGE
   Version: 1.1.0

   Extends the shared ARI Circle safety layer to profile-only paths that
   use direct table/storage calls instead of the RPC moderation wrapper:
   - profile text
   - Profile Wall text
   - Profile Wall photos
   - avatar photos
   - cover/background photos

   Teen media is stored only in the private Teen Circle media bucket.
   Safety behavior is fail-closed: if required safety screening cannot run,
   the content is not persisted.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const MODERATION_SCRIPT_ID = "ariCircleProfileSafetyModeration";
  const MODERATION_SCRIPT_SRC = "js/ari-circle/content-moderation.js?v=1.4.0";
  const PRIVATE_BUCKET = "ari-circle-teen-media";
  const PRIVATE_PREFIX = `ari-private://${PRIVATE_BUCKET}/`;
  const MAX_IMAGE_EDGE = 768;
  const JPEG_QUALITY = 0.68;
  const PATCH_FLAG = "__ariProfileSafetyV11";

  let moderationLoader = null;
  let patchAttempts = 0;
  let ageBandPromise = null;

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

  function safetyError(message, code = "ARI_MODERATION_UNAVAILABLE") {
    const error = new Error(clean(message) || "ARI Circle could not run its safety check. Try again.");
    error.code = code;
    return error;
  }

  function ensureModeration() {
    if (window.AriCircleContentModeration?.moderate) {
      return Promise.resolve(window.AriCircleContentModeration);
    }

    if (moderationLoader) return moderationLoader;

    moderationLoader = new Promise((resolve, reject) => {
      const existing =
        document.getElementById(MODERATION_SCRIPT_ID) ||
        document.querySelector('script[src*="ari-circle/content-moderation.js"]');

      const finish = () => {
        const api = window.AriCircleContentModeration;
        if (api?.moderate) resolve(api);
        else reject(safetyError("ARI Circle safety screening did not start."));
      };

      if (existing) {
        if (window.AriCircleContentModeration?.moderate) {
          resolve(window.AriCircleContentModeration);
          return;
        }
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener(
          "error",
          () => reject(safetyError("ARI Circle safety screening could not load.")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.id = MODERATION_SCRIPT_ID;
      script.src = MODERATION_SCRIPT_SRC;
      script.async = false;
      script.addEventListener("load", finish, { once: true });
      script.addEventListener(
        "error",
        () => reject(safetyError("ARI Circle safety screening could not load.")),
        { once: true }
      );
      document.head.appendChild(script);
    });

    return moderationLoader;
  }

  function waitFor(target, eventName, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      let timer = null;

      const cleanup = () => {
        if (timer) window.clearTimeout(timer);
        target.removeEventListener(eventName, onEvent);
        target.removeEventListener("error", onError);
      };

      const onEvent = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(safetyError("ARI Circle could not read that image."));
      };

      timer = window.setTimeout(() => {
        cleanup();
        reject(safetyError("ARI Circle image safety check timed out."));
      }, timeoutMs);

      target.addEventListener(eventName, onEvent, { once: true });
      target.addEventListener("error", onError, { once: true });
    });
  }

  async function imageDataUrl(file) {
    if (!(file instanceof Blob)) {
      throw safetyError("Choose a valid image before continuing.", "ARI_MEDIA_INVALID");
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";

    try {
      image.src = objectUrl;
      if (typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          await waitFor(image, "load");
        }
      } else {
        await waitFor(image, "load");
      }

      const width = Number(image.naturalWidth || image.width || 0);
      const height = Number(image.naturalHeight || image.height || 0);
      if (!width || !height) {
        throw safetyError("ARI Circle could not inspect that image.");
      }

      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw safetyError("ARI Circle could not prepare that image for its safety check.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    } finally {
      URL.revokeObjectURL(objectUrl);
      image.src = "";
    }
  }

  async function getMyAgeBand() {
    if (ageBandPromise) return ageBandPromise;

    ageBandPromise = (async () => {
      const client = resolveClient();
      if (!client?.rpc) throw safetyError("ARI Circle age verification is unavailable.");
      const { data, error } = await client.rpc("ari_circle_my_age_band");
      if (error) throw safetyError(error.message || "ARI Circle could not verify your age group.");
      const band = clean(data).toLowerCase();
      if (!band) throw safetyError("Verify your age before using ARI Circle.");
      return band;
    })().catch((error) => {
      ageBandPromise = null;
      throw error;
    });

    return ageBandPromise;
  }

  async function screenTeenText(scope, text) {
    const safeText = clean(text);
    if (!safeText) return true;

    const client = resolveClient();
    if (!client?.rpc) {
      throw safetyError("ARI Circle teen safety screening is unavailable.", "ARI_TEEN_SAFETY_UNAVAILABLE");
    }

    const { data, error } = await client.rpc("ari_circle_screen_my_teen_text", {
      requested_surface: clean(scope).slice(0, 80) || "ari_circle_profile",
      requested_text: safeText.slice(0, 8000),
      requested_related_user_id: null
    });

    if (error) {
      throw safetyError(
        error.message || "ARI Circle could not run its teen safety check.",
        error.code === "ARI_TEEN_SAFETY_BLOCKED"
          ? "ARI_TEEN_SAFETY_BLOCKED"
          : "ARI_TEEN_SAFETY_UNAVAILABLE"
      );
    }

    if (data?.allowed === false) {
      throw safetyError(
        clean(data?.message) || "That information cannot be shared from a Teen Circle account.",
        "ARI_TEEN_SAFETY_BLOCKED"
      );
    }

    return true;
  }

  async function logAiBlock(scope, text, blockedCategories) {
    const client = resolveClient();
    if (!client?.rpc) return;

    try {
      await client.rpc("ari_circle_log_my_teen_moderation_event", {
        requested_surface: clean(scope).slice(0, 80) || "ari_circle_profile",
        requested_categories: Array.isArray(blockedCategories)
          ? blockedCategories.map(clean).filter(Boolean).slice(0, 20)
          : [],
        requested_excerpt: clean(text).slice(0, 8000) || null
      });
    } catch (error) {
      console.warn("ARI Circle profile safety event could not be recorded:", error?.message || error);
    }
  }

  async function screen({ scope, text = "", file = null } = {}) {
    const safeScope = clean(scope).slice(0, 80) || "ari_circle_profile";
    const safeText = clean(text).slice(0, 8000);

    await screenTeenText(safeScope, safeText);

    const moderation = await ensureModeration();
    const imageUrls = file ? [await imageDataUrl(file)] : [];
    const result = await moderation.moderate({
      scope: safeScope,
      text: safeText,
      imageUrls
    });

    if (result?.allowed !== true) {
      await logAiBlock(safeScope, safeText, result?.blocked_categories);
      throw safetyError(
        file
          ? "That image can’t be shared in ARI Circle. Choose another image and try again."
          : "That content can’t be shared in ARI Circle. Edit it and try again.",
        "ARI_CONTENT_BLOCKED"
      );
    }

    return true;
  }

  function profileText(profile) {
    const icebreakers =
      profile?.icebreakers && typeof profile.icebreakers === "object"
        ? Object.values(profile.icebreakers)
        : [];

    return [
      profile?.display_name,
      profile?.displayName,
      profile?.handle,
      profile?.username,
      profile?.bio,
      profile?.location,
      profile?.goal,
      profile?.bucket_list,
      profile?.bucketList,
      profile?.favorite_song,
      profile?.favoriteSong,
      profile?.favorite_food,
      profile?.favoriteFood,
      profile?.favorite_movie,
      profile?.favoriteMovie,
      profile?.favorite_hobby,
      profile?.favoriteHobby,
      ...icebreakers
    ]
      .map(clean)
      .filter(Boolean)
      .join("\n")
      .slice(0, 8000);
  }

  function safeFileName(file) {
    const raw = clean(file?.name) || "image.webp";
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "image.webp";
  }

  function privateRef(path) {
    const safePath = clean(path).replace(/^\/+/, "");
    return safePath ? `${PRIVATE_PREFIX}${safePath}` : "";
  }

  function privatePath(value) {
    const ref = clean(value);
    return ref.startsWith(PRIVATE_PREFIX) ? ref.slice(PRIVATE_PREFIX.length) : "";
  }

  async function assertOwnProfileUpload(api, ownerUserId) {
    const ownerId = clean(ownerUserId);
    const authenticatedId = clean(await api.getAuthenticatedUserId?.());

    if (!ownerId || !authenticatedId || ownerId !== authenticatedId) {
      throw safetyError(
        "You can only change images on your own ARI Circle profile.",
        "ARI_PROFILE_MEDIA_FORBIDDEN"
      );
    }
    return ownerId;
  }

  async function uploadPrivateObject(path, file) {
    const client = resolveClient();
    if (!client?.storage?.from) throw safetyError("Teen Circle private media is unavailable.");

    const { error } = await client.storage.from(PRIVATE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file?.type || "image/webp"
    });

    if (error) throw safetyError(error.message || "Could not upload private Teen Circle media.");
    return privateRef(path);
  }

  async function removePrivateRef(value) {
    const path = privatePath(value);
    if (!path) return false;
    const client = resolveClient();
    const { error } = await client.storage.from(PRIVATE_BUCKET).remove([path]);
    if (error) console.warn("ARI Circle private media cleanup failed:", error.message || error);
    return !error;
  }

  async function applyTeenProfilePrivacy() {
    let band;
    try {
      band = await getMyAgeBand();
    } catch {
      return;
    }
    if (band !== "teen") return;

    for (const id of ["circle-about-location-row", "circle-about-birthday-row"]) {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    }

    const hideSensitiveEditorFields = () => {
      for (const selector of ['[name="location"]', '[name="birthday"]']) {
        const input = document.querySelector(`#circle-profile-editor ${selector}`);
        const field = input?.closest?.(".circle-editor-field, label");
        if (field) field.hidden = true;
        if (input) input.value = "";
      }
    };

    hideSensitiveEditorFields();
    document.addEventListener("click", (event) => {
      if (event.target?.closest?.('[data-circle-action="edit-profile"]')) {
        window.setTimeout(hideSensitiveEditorFields, 0);
      }
    }, true);
  }

  function patchApi(api) {
    if (!api || typeof api !== "object") return false;
    if (api[PATCH_FLAG]) return true;

    const originalSaveProfile = api.saveProfile?.bind(api);
    const originalCreateLove = api.createLove?.bind(api);
    const originalUploadLovePhoto = api.uploadLovePhoto?.bind(api);
    const originalDeleteLove = api.deleteLove?.bind(api);
    const originalUploadProfileMedia = api.uploadProfileMedia?.bind(api);
    const originalRemoveProfileMedia = api.removeProfileMedia?.bind(api);

    if (
      typeof originalSaveProfile !== "function" ||
      typeof originalCreateLove !== "function" ||
      typeof originalUploadLovePhoto !== "function" ||
      typeof originalDeleteLove !== "function" ||
      typeof originalUploadProfileMedia !== "function" ||
      typeof originalRemoveProfileMedia !== "function"
    ) {
      return false;
    }

    api.saveProfile = async function safeSaveProfile(profile, options = {}) {
      const band = await getMyAgeBand();
      const nextProfile = { ...(profile || {}) };

      if (band === "teen") {
        nextProfile.location = null;
        nextProfile.birthday = null;
      }

      await screen({
        scope: "profile_text",
        text: profileText(nextProfile)
      });
      return originalSaveProfile(nextProfile, options);
    };

    api.createLove = async function safeCreateLove(payload = {}) {
      const text = clean(payload?.text);
      if (text) {
        await screen({
          scope: "profile_wall_text",
          text
        });
      }
      return originalCreateLove(payload);
    };

    api.uploadLovePhoto = async function safeUploadLovePhoto(payload = {}) {
      const file = payload?.file;
      await screen({
        scope: "profile_wall_photo",
        file
      });

      const band = await getMyAgeBand();
      if (band !== "teen") return originalUploadLovePhoto(payload);

      const authorId = clean(payload?.authorUserId);
      const profileId = clean(payload?.profileUserId);
      const authenticatedId = clean(await api.getAuthenticatedUserId?.());
      if (!authorId || !profileId || authorId !== authenticatedId) {
        throw safetyError("You can only upload your own Profile Wall photos.", "ARI_PROFILE_MEDIA_FORBIDDEN");
      }

      const path = `${authorId}/love/${profileId}/${Date.now()}-${safeFileName(file)}`;
      const ref = await uploadPrivateObject(path, file);
      return { publicUrl: ref, path: ref };
    };

    api.deleteLove = async function safeDeleteLove(commentId) {
      const client = resolveClient();
      const table = api.table?.("love") || "ari_circle_comments";
      const { data: existing, error: readError } = await client
        .from(table)
        .select("id,image_path")
        .eq("id", commentId)
        .maybeSingle();

      if (readError || !privatePath(existing?.image_path)) {
        return originalDeleteLove(commentId);
      }

      const { error: deleteError } = await client.from(table).delete().eq("id", commentId);
      if (deleteError) throw safetyError(deleteError.message || "Could not remove profile post.");
      await removePrivateRef(existing.image_path);
      return true;
    };

    api.uploadProfileMedia = async function safeUploadProfileMedia(payload = {}) {
      const ownerId = await assertOwnProfileUpload(api, payload?.ownerUserId);
      const mediaType = clean(payload?.mediaType).toLowerCase();
      if (mediaType !== "avatar" && mediaType !== "cover") {
        throw safetyError("Choose a valid profile image type.", "ARI_MEDIA_INVALID");
      }

      await screen({
        scope: mediaType === "cover" ? "profile_cover" : "profile_avatar",
        file: payload?.file
      });

      const band = await getMyAgeBand();
      if (band !== "teen") return originalUploadProfileMedia(payload);

      const client = resolveClient();
      const table = api.table?.("profiles") || "ari_circle_profiles";
      const column = mediaType === "avatar" ? "avatar_url" : "cover_url";
      const { data: previous } = await client.from(table).select(column).eq("user_id", ownerId).maybeSingle();

      const path = `${ownerId}/${mediaType}/${Date.now()}-${safeFileName(payload?.file)}`;
      const ref = await uploadPrivateObject(path, payload?.file);

      const { data: profile, error } = await client
        .from(table)
        .update({ [column]: ref })
        .eq("user_id", ownerId)
        .select("*")
        .single();

      if (error) {
        await removePrivateRef(ref);
        throw safetyError(error.message || "Could not update your Teen Circle profile image.");
      }

      if (privatePath(previous?.[column]) && previous[column] !== ref) {
        await removePrivateRef(previous[column]);
      }

      return { path: ref, publicUrl: ref, profile };
    };

    api.removeProfileMedia = async function safeRemoveProfileMedia(payload = {}) {
      const ownerId = await assertOwnProfileUpload(api, payload?.ownerUserId);
      const band = await getMyAgeBand();
      if (band !== "teen") return originalRemoveProfileMedia(payload);

      const mediaType = clean(payload?.mediaType).toLowerCase();
      if (mediaType !== "avatar" && mediaType !== "cover") {
        throw safetyError("Choose a valid profile image type.", "ARI_MEDIA_INVALID");
      }

      const client = resolveClient();
      const table = api.table?.("profiles") || "ari_circle_profiles";
      const column = mediaType === "avatar" ? "avatar_url" : "cover_url";
      const { data: previous, error: readError } = await client
        .from(table)
        .select(column)
        .eq("user_id", ownerId)
        .maybeSingle();
      if (readError) throw safetyError(readError.message || "Could not read your profile image.");

      const { data: profile, error } = await client
        .from(table)
        .update({ [column]: null })
        .eq("user_id", ownerId)
        .select("*")
        .single();
      if (error) throw safetyError(error.message || "Could not remove your profile image.");

      if (privatePath(previous?.[column])) await removePrivateRef(previous[column]);
      return { profile, removedPath: privatePath(previous?.[column]) || null };
    };

    try {
      Object.defineProperty(api, PATCH_FLAG, {
        configurable: false,
        enumerable: false,
        value: true
      });
    } catch {
      api[PATCH_FLAG] = true;
    }

    return true;
  }

  function findApi() {
    return window.AriCircleApp?.modules?.CircleApi || null;
  }

  function install() {
    const api = findApi();
    if (patchApi(api)) {
      void applyTeenProfilePrivacy();
      return true;
    }

    patchAttempts += 1;
    if (patchAttempts < 120) {
      window.setTimeout(install, 50);
    }
    return false;
  }

  ensureModeration().catch((error) => {
    console.error("ARI Circle profile safety bootstrap failed:", error?.message || error);
  });

  install();
  document.addEventListener("circle:app-ready", install);

  window.AriCircleProfileSafety = Object.freeze({
    version: VERSION,
    screen,
    refresh: install,
    isReady: () => Boolean(findApi()?.[PATCH_FLAG])
  });
})();
