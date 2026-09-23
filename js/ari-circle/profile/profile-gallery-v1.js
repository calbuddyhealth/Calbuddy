/* =============================================================
   ARI CIRCLE — PROFILE GALLERY V1.3
   Private upload first, queue moderation second, publish last.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.3.0";
  const BUCKET = "ari-circle-post-media";
  const MAX_BYTES = 8 * 1024 * 1024;
  const SIGNED_SECONDS = 60 * 60;
  const STATUS_POLL_MS = 15000;
  const STATUS_POLL_LIMIT = 20;
  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();

  const state = {
    client: null,
    viewer: null,
    subjectId: null,
    owner: false,
    rows: new Map(),
    busy: false,
    statusPollTimer: 0,
    statusPollCount: 0,
    localPreviewUrl: ""
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
    link.href = "assets/css/ari-circle-profile-gallery-v1.css?v=1.3.0";
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
      </div>
      <div class="circle-profile-gallery__grid" id="circleProfileGalleryGrid" aria-live="polite"></div>
      <input id="circleProfileGalleryInput" type="file" accept="image/*" hidden />
    `;

    profile.insertAdjacentElement("afterend", section);
    $("circleProfileGalleryInput")?.addEventListener("change", onFileSelected);
    return section;
  }

  function status(message, { tone = "" } = {}) {
    const notice = $("circleProfileGalleryNotice");
    const node = $("circleProfileGalleryStatus");
    const text = clean(message);

    if (node) node.textContent = text;
    if (notice) {
      notice.hidden = !text;
      notice.dataset.tone = clean(tone);
    }
  }

  function fileExtension(file) {
    const type = clean(file?.type).toLowerCase();
    if (type === "image/png") return "png";
    if (type === "image/heic" || type === "image/heif") return "heic";
    if (type === "image/webp") return "webp";
    return "jpg";
  }

  function moderationLabel(row) {
    const moderationStatus = clean(row?.moderation_status).toLowerCase();
    if (moderationStatus === "pending" || moderationStatus === "uploading") return "Checking…";
    if (moderationStatus === "rejected") return "Not approved";
    return "";
  }

  function slotMarkup(position, row) {
    const url = clean(row?.url);
    if (url) {
      const label = state.owner ? moderationLabel(row) : "";
      return `
        <div class="circle-profile-gallery__photo" data-moderation-status="${clean(row?.moderation_status)}">
          <img src="${url}" alt="Profile photo ${position + 1}" />
          ${label ? `<span class="circle-profile-gallery__moderation-badge">${label}</span>` : ""}
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

  function clearStatusPoll() {
    if (state.statusPollTimer) {
      window.clearTimeout(state.statusPollTimer);
      state.statusPollTimer = 0;
    }
  }

  function hasPendingRows() {
    return [...state.rows.values()].some(
      (row) => clean(row?.moderation_status).toLowerCase() === "pending"
    );
  }

  function scheduleStatusPoll() {
    if (!state.owner || !hasPendingRows()) {
      clearStatusPoll();
      state.statusPollCount = 0;
      return;
    }

    if (state.statusPollTimer || state.statusPollCount >= STATUS_POLL_LIMIT) return;

    state.statusPollTimer = window.setTimeout(async () => {
      state.statusPollTimer = 0;
      state.statusPollCount += 1;
      await load({ fromPoll: true });

      if (hasPendingRows()) {
        if (state.statusPollCount >= STATUS_POLL_LIMIT) {
          status("Photo is still pending review. You can leave this page; it will publish automatically after approval.", {
            tone: "progress"
          });
        } else {
          scheduleStatusPoll();
        }
      }
    }, STATUS_POLL_MS);
  }

  function releaseLocalPreview() {
    if (state.localPreviewUrl) {
      try { URL.revokeObjectURL(state.localPreviewUrl); } catch {}
      state.localPreviewUrl = "";
    }
  }

  async function load({ fromPoll = false } = {}) {
    if (!state.subjectId) return;
    const priorPending = hasPendingRows();

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

      if (!state.owner) return;

      const pending = hasPendingRows();
      const rejected = [...state.rows.values()].some(
        (row) => clean(row?.moderation_status).toLowerCase() === "rejected"
      );

      if (pending) {
        status("Photo uploaded. Checking before it becomes visible to other people.", { tone: "progress" });
        scheduleStatusPoll();
      } else {
        clearStatusPoll();
        state.statusPollCount = 0;

        if (priorPending && fromPoll) {
          status("Photo published.", { tone: "success" });
          window.setTimeout(() => status(""), 1800);
        } else if (rejected) {
          status("A photo was not approved. Replace or remove it.", { tone: "error" });
        }
      }
    } catch (error) {
      console.warn("Circle profile gallery unavailable:", error?.message || error);
      if (state.owner) status(error.message || "Profile photos are unavailable right now.", { tone: "error" });
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

    await uploadPendingPhoto(file, position);
  }

  async function uploadPendingPhoto(file, position) {
    if (state.busy) return;
    state.busy = true;
    clearStatusPoll();
    state.statusPollCount = 0;

    releaseLocalPreview();
    state.localPreviewUrl = URL.createObjectURL(file);
    state.rows.set(position, {
      position,
      media_path: "",
      moderation_status: "uploading",
      url: state.localPreviewUrl
    });
    render();
    status("Uploading photo…", { tone: "progress" });

    let uploadedPath = "";
    try {
      const ext = fileExtension(file);
      uploadedPath = `${state.viewer.id}/profile-gallery-pending/${crypto.randomUUID()}.${ext}`;

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

      releaseLocalPreview();
      status("Photo uploaded. Checking before it becomes visible to other people.", { tone: "progress" });
      await load();
    } catch (error) {
      if (uploadedPath) {
        state.client.storage.from(BUCKET).remove([uploadedPath]).catch(() => {});
      }
      releaseLocalPreview();
      status(error.message || "Could not upload that photo.", { tone: "error" });
      await load();
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

  window.addEventListener("pagehide", () => {
    clearStatusPoll();
    releaseLocalPreview();
  }, { once: true });

  document.addEventListener("circle:app-ready", () => setTimeout(init, 40), { once: true });
  if (document.readyState !== "loading") setTimeout(init, 80);
})();
