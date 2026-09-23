/* =============================================================
   ARI CIRCLE — PROFILE GALLERY V1.2
   Avatar + four supporting photos = five-photo maximum.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const BUCKET = "ari-circle-post-media";
  const MAX_BYTES = 8 * 1024 * 1024;
  const SIGNED_SECONDS = 60 * 60;
  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();

  const state = {
    client: null,
    viewer: null,
    subjectId: null,
    owner: false,
    rows: new Map(),
    busy: false,
    pending: null,
    retryTimer: 0
  };

  function client() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function resolveSubject() {
    const params = new URLSearchParams(location.search);
    const explicit = clean(params.get("user"));
    if (explicit) return explicit;

    const handle = clean(params.get("handle")).replace(/^@+/, "");
    if (handle) {
      const { data, error } = await state.client
        .from("ari_circle_profiles")
        .select("user_id")
        .eq("handle", handle)
        .maybeSingle();
      if (error) throw error;
      if (data?.user_id) return data.user_id;
    }

    return state.viewer?.id || null;
  }

  async function signedUrl(path) {
    if (!clean(path)) return "";
    const { data, error } = await state.client.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_SECONDS);
    if (error) throw error;
    return clean(data?.signedUrl);
  }

  function ensureStyle() {
    if (document.getElementById("ariCircleProfileGalleryStyle")) return;
    const link = document.createElement("link");
    link.id = "ariCircleProfileGalleryStyle";
    link.rel = "stylesheet";
    link.href = "assets/css/ari-circle-profile-gallery-v1.css?v=1.2.0";
    document.head.append(link);
  }

  function ensureSection() {
    let section = $("circleProfileGallery");
    if (section) return section;
    const profile = $("circle-profile");
    if (!profile) return null;

    section = document.createElement("section");
    section.id = "circleProfileGallery";
    section.className = "circle-profile-gallery";
    section.innerHTML = `
      <div class="circle-profile-gallery__head">
        <div>
          <p>PHOTOS</p>
          <h2>More of me</h2>
        </div>
        ${state.owner ? '<span>4 supporting photos</span>' : ""}
      </div>
      <div class="circle-profile-gallery__notice" id="circleProfileGalleryNotice" hidden>
        <span id="circleProfileGalleryStatus" role="status" aria-live="polite"></span>
        <button id="circleProfileGalleryRetry" type="button" hidden>Try again</button>
      </div>
      <div class="circle-profile-gallery__grid" id="circleProfileGalleryGrid" aria-live="polite"></div>
      <input id="circleProfileGalleryInput" type="file" accept="image/*" hidden />
    `;

    profile.insertAdjacentElement("afterend", section);
    $("circleProfileGalleryInput")?.addEventListener("change", onFileSelected);
    $("circleProfileGalleryRetry")?.addEventListener("click", () => retryPendingUpload({ immediate: true }));
    return section;
  }

  function status(message, { tone = "", retry = false } = {}) {
    const notice = $("circleProfileGalleryNotice");
    const node = $("circleProfileGalleryStatus");
    const button = $("circleProfileGalleryRetry");
    const text = clean(message);

    if (node) node.textContent = text;
    if (notice) {
      notice.hidden = !text;
      notice.dataset.tone = clean(tone);
    }
    if (button) button.hidden = !retry;
  }

  function clearRetryTimer() {
    if (state.retryTimer) {
      window.clearTimeout(state.retryTimer);
      state.retryTimer = 0;
    }
  }

  function isTransientSafetyFailure(error) {
    const code = clean(error?.code).toUpperCase();
    const message = clean(error?.message).toLowerCase();
    return (
      code === "ARI_CIRCLE_MODERATION_PROVIDER_UNAVAILABLE" ||
      code === "ARI_MODERATION_UNAVAILABLE" ||
      Number(error?.status) >= 500 ||
      message.includes("temporarily unavailable") ||
      message.includes("too many requests") ||
      message.includes("could not run its safety check")
    );
  }

  function scheduleRetry(delayMs = 30000) {
    clearRetryTimer();
    state.retryTimer = window.setTimeout(() => {
      state.retryTimer = 0;
      void retryPendingUpload({ immediate: false });
    }, Math.max(5000, delayMs));
  }

  async function retryPendingUpload({ immediate = false } = {}) {
    if (!state.pending || state.busy) return;
    if (immediate) clearRetryTimer();
    await attemptPendingUpload();
  }

  function fileExtension(file) {
    const type = clean(file?.type).toLowerCase();
    if (type === "image/png") return "png";
    if (type === "image/heic" || type === "image/heif") return "heic";
    if (type === "image/webp") return "webp";
    return "jpg";
  }

  async function screenPhoto(file) {
    if (!window.AriCircleProfileSafety?.screen) {
      try {
        await import("./profile-safety.js?v=1.2.1");
      } catch {}
    }
    if (!window.AriCircleProfileSafety?.screen) {
      throw new Error("Photo safety screening is unavailable right now.");
    }
    await window.AriCircleProfileSafety.screen({
      scope: "profile_gallery_photo",
      file
    });
  }

  function slotMarkup(position, row) {
    const url = clean(row?.url);
    if (url) {
      return `
        <div class="circle-profile-gallery__photo">
          <img src="${url}" alt="Profile photo ${position + 1}" />
          ${state.owner ? `<div class="circle-profile-gallery__photo-actions">
            <button type="button" data-gallery-replace="${position}">Replace</button>
            <button type="button" data-gallery-remove="${position}">Remove</button>
          </div>` : ""}
        </div>
      `;
    }

    if (!state.owner) return "";

    return `
      <button class="circle-profile-gallery__empty" type="button" data-gallery-add="${position}">
        <span aria-hidden="true">＋</span>
        <strong>Add photo</strong>
      </button>
    `;
  }

  function render() {
    const section = ensureSection();
    const grid = $("circleProfileGalleryGrid");
    if (!section || !grid) return;

    const html = [1,2,3,4]
      .map((position) => slotMarkup(position, state.rows.get(position)))
      .filter(Boolean)
      .join("");

    if (!html && !state.owner) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    grid.innerHTML = html;

    grid.querySelectorAll("[data-gallery-add],[data-gallery-replace]").forEach((button) => {
      button.addEventListener("click", () => {
        const position = Number(button.dataset.galleryAdd || button.dataset.galleryReplace);
        const input = $("circleProfileGalleryInput");
        if (!input || !position) return;
        input.dataset.position = String(position);
        input.value = "";
        input.click();
      });
    });

    grid.querySelectorAll("[data-gallery-remove]").forEach((button) => {
      button.addEventListener("click", () => removePhoto(Number(button.dataset.galleryRemove)));
    });
  }

  async function load() {
    if (!state.subjectId) return;
    try {
      const rows = await rpc("ari_circle_profile_photos_list", {
        requested_user_id: state.subjectId
      });
      const mapped = new Map();
      for (const row of Array.isArray(rows) ? rows : []) {
        try {
          const url = await signedUrl(row.media_path);
          if (url) mapped.set(Number(row.position), { ...row, url });
        } catch (error) {
          console.warn("Circle profile photo could not be signed:", error?.message || error);
        }
      }
      state.rows = mapped;
      render();
    } catch (error) {
      console.warn("Circle profile gallery unavailable:", error?.message || error);
      if (state.owner) status(error.message || "Profile photos are unavailable right now.");
    }
  }

  async function onFileSelected(event) {
    if (!state.owner || state.busy) return;
    const file = event.target.files?.[0] || null;
    const position = Number(event.target.dataset.position);
    if (!file || !position) return;

    if (!clean(file.type).startsWith("image/")) {
      status("Choose an image.", { tone: "error" });
      return;
    }
    if (file.size > MAX_BYTES) {
      status("Profile photos can be up to 8 MB.", { tone: "error" });
      return;
    }

    clearRetryTimer();
    state.pending = {
      file,
      position,
      safetyAttempts: 0
    };
    await attemptPendingUpload();
  }

  async function attemptPendingUpload() {
    const pending = state.pending;
    if (!pending || state.busy) return;

    state.busy = true;
    pending.safetyAttempts += 1;
    status(
      pending.safetyAttempts > 1
        ? `Safety check is busy. Retrying photo… (${pending.safetyAttempts}/4)`
        : "Checking photo…",
      { tone: "progress" }
    );

    let uploadedPath = "";
    try {
      await screenPhoto(pending.file);

      const ext = fileExtension(pending.file);
      uploadedPath = `${state.viewer.id}/profile-gallery/${crypto.randomUUID()}.${ext}`;

      status("Uploading photo…", { tone: "progress" });
      const { error: uploadError } = await state.client.storage
        .from(BUCKET)
        .upload(uploadedPath, pending.file, {
          cacheControl: "3600",
          contentType: pending.file.type || "image/jpeg",
          upsert: false
        });
      if (uploadError) throw uploadError;

      const result = await rpc("ari_circle_profile_photo_set", {
        requested_position: pending.position,
        requested_media_path: uploadedPath
      });

      const replaced = clean(result?.replaced_path);
      if (replaced && replaced !== uploadedPath) {
        state.client.storage.from(BUCKET).remove([replaced]).catch(() => {});
      }

      state.pending = null;
      clearRetryTimer();
      status("Photo added.", { tone: "success" });
      await load();
      window.setTimeout(() => {
        if (!state.pending) status("");
      }, 1800);
    } catch (error) {
      if (uploadedPath) {
        state.client.storage.from(BUCKET).remove([uploadedPath]).catch(() => {});
      }

      if (isTransientSafetyFailure(error) && pending.safetyAttempts < 8) {
        const providerDelayMs = Number(error?.retryAfterSeconds) > 0
          ? Number(error.retryAfterSeconds) * 1000
          : 0;
        const fallbackDelayMs = [0, 30000, 60000, 90000, 120000, 180000, 240000, 300000][pending.safetyAttempts] || 300000;
        const delayMs = Math.max(providerDelayMs, fallbackDelayMs);
        const seconds = Math.max(1, Math.round(delayMs / 1000));

        status(
          `The photo safety service is temporarily busy. Your photo is still selected. Retrying in about ${seconds} seconds.`,
          { tone: "warning", retry: true }
        );
        scheduleRetry(delayMs);
      } else if (isTransientSafetyFailure(error)) {
        status(
          "The photo safety service is still busy. Your photo has not been published. Tap Try again without reselecting it.",
          { tone: "error", retry: true }
        );
      } else if (clean(error?.code).toUpperCase() === "ARI_CONTENT_BLOCKED") {
        state.pending = null;
        clearRetryTimer();
        status(error.message || "That photo can’t be shared in ARI Circle.", { tone: "error" });
      } else {
        status(error.message || "Could not update that photo.", { tone: "error", retry: true });
      }
    } finally {
      state.busy = false;
    }
  }

  async function removePhoto(position) {
    if (!state.owner || state.busy || !position) return;
    state.busy = true;
    status("Removing photo…", { tone: "progress" });
    try {
      const result = await rpc("ari_circle_profile_photo_remove", {
        requested_position: position
      });
      const removed = clean(result?.removed_path);
      if (removed) state.client.storage.from(BUCKET).remove([removed]).catch(() => {});
      status("");
      await load();
    } catch (error) {
      status(error.message || "Could not remove that photo.", { tone: "error" });
    } finally {
      state.busy = false;
    }
  }

  async function init() {
    ensureStyle();
    state.client = client();
    if (!state.client?.auth || !state.client?.rpc) return;

    try {
      const { data, error } = await state.client.auth.getUser();
      if (error) throw error;
      state.viewer = data?.user || null;
      if (!state.viewer) return;

      state.subjectId = await resolveSubject();
      if (!state.subjectId) return;
      state.owner = state.subjectId === state.viewer.id;
      ensureSection();
      await load();
    } catch (error) {
      console.warn("Circle profile gallery failed to start:", error?.message || error);
    }
  }

  window.AriCircleProfileGalleryV1 = Object.freeze({
    version: VERSION,
    refresh: load
  });

  document.addEventListener("circle:app-ready", () => setTimeout(init, 40), { once: true });
  if (document.readyState !== "loading") setTimeout(init, 80);
})();
