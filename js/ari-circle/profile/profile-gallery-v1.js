/* =============================================================
   ARI CIRCLE — PROFILE GALLERY V1
   Avatar + four supporting photos = five-photo maximum.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
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
    busy: false
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
    link.href = "assets/css/ari-circle-profile-gallery-v1.css?v=1.0.0";
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
      <div class="circle-profile-gallery__grid" id="circleProfileGalleryGrid" aria-live="polite"></div>
      <input id="circleProfileGalleryInput" type="file" accept="image/*" hidden />
      <p class="circle-profile-gallery__status" id="circleProfileGalleryStatus" role="status" aria-live="polite"></p>
    `;

    profile.insertAdjacentElement("afterend", section);
    $("circleProfileGalleryInput")?.addEventListener("change", onFileSelected);
    return section;
  }

  function status(message) {
    const node = $("circleProfileGalleryStatus");
    if (node) node.textContent = clean(message);
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
        await import("./profile-safety.js?v=1.1.0");
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
      status("Choose an image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      status("Profile photos can be up to 8 MB.");
      return;
    }

    state.busy = true;
    status("Checking photo…");
    let uploadedPath = "";

    try {
      await screenPhoto(file);
      const ext = fileExtension(file);
      uploadedPath = `${state.viewer.id}/profile-gallery/${crypto.randomUUID()}.${ext}`;

      status("Uploading photo…");
      const { error: uploadError } = await state.client.storage
        .from(BUCKET)
        .upload(uploadedPath, file, {
          cacheControl: "3600",
          contentType: file.type || "image/jpeg",
          upsert: false
        });
      if (uploadError) throw uploadError;

      const result = await rpc("ari_circle_profile_photo_set", {
        requested_position: position,
        requested_media_path: uploadedPath
      });

      const replaced = clean(result?.replaced_path);
      if (replaced && replaced !== uploadedPath) {
        state.client.storage.from(BUCKET).remove([replaced]).catch(() => {});
      }

      status("");
      await load();
    } catch (error) {
      if (uploadedPath) {
        state.client.storage.from(BUCKET).remove([uploadedPath]).catch(() => {});
      }
      status(error.message || "Could not update that photo.");
    } finally {
      state.busy = false;
    }
  }

  async function removePhoto(position) {
    if (!state.owner || state.busy || !position) return;
    state.busy = true;
    status("Removing photo…");
    try {
      const result = await rpc("ari_circle_profile_photo_remove", {
        requested_position: position
      });
      const removed = clean(result?.removed_path);
      if (removed) state.client.storage.from(BUCKET).remove([removed]).catch(() => {});
      status("");
      await load();
    } catch (error) {
      status(error.message || "Could not remove that photo.");
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
