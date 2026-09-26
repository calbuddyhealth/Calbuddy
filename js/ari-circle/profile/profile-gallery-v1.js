/* =============================================================
   ARI CIRCLE — PROFILE SHOWCASE V2.2
   Four fixed slots. Each slot can be an image, a text card, or a video
   up to 30 seconds. Avatar remains separate from these four slots.

   Images keep the existing private-upload moderation queue. Text and short
   video publish directly after normal authenticated/adult access checks.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.2.0";
  const BUCKET = "ari-circle-post-media";
  const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
  const MAX_VIDEO_SECONDS = 30;
  const MAX_TEXT_LENGTH = 600;
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
    localPreviewUrl: "",
    activePosition: 0,
    activeMediaType: ""
  };

  function client() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
    link.href = "assets/css/ari-circle-profile-gallery-v1.css?v=2.2.0";
    document.head.append(link);
  }

  function ensureDialogs() {
    if (!$("circleProfileShowcasePicker")) {
      const picker = document.createElement("dialog");
      picker.id = "circleProfileShowcasePicker";
      picker.className = "circle-showcase-dialog";
      picker.innerHTML = `
        <div class="circle-showcase-dialog__card">
          <div class="circle-showcase-dialog__head">
            <div><small>MORE OF ME</small><h3>Choose what to share</h3></div>
            <button type="button" data-showcase-close aria-label="Close">×</button>
          </div>
          <div class="circle-showcase-dialog__choices">
            <button type="button" data-showcase-type="image"><span aria-hidden="true">▧</span><strong>Photo</strong><small>Share an image</small></button>
            <button type="button" data-showcase-type="video"><span aria-hidden="true">▶</span><strong>Video</strong><small>Up to 30 seconds</small></button>
            <button type="button" data-showcase-type="text"><span aria-hidden="true">Aa</span><strong>Text</strong><small>Say something</small></button>
          </div>
        </div>`;
      document.body.append(picker);
      picker.querySelector("[data-showcase-close]")?.addEventListener("click", () => picker.close());
      picker.querySelectorAll("[data-showcase-type]").forEach((button) => {
        button.addEventListener("click", () => chooseType(button.dataset.showcaseType));
      });
    }

    if (!$("circleProfileShowcaseTextDialog")) {
      const dialog = document.createElement("dialog");
      dialog.id = "circleProfileShowcaseTextDialog";
      dialog.className = "circle-showcase-dialog";
      dialog.innerHTML = `
        <form class="circle-showcase-dialog__card" id="circleProfileShowcaseTextForm">
          <div class="circle-showcase-dialog__head">
            <div><small>TEXT CARD</small><h3>Say something</h3></div>
            <button type="button" data-showcase-text-close aria-label="Close">×</button>
          </div>
          <label class="circle-showcase-text-field">
            <textarea id="circleProfileShowcaseText" maxlength="${MAX_TEXT_LENGTH}" rows="7" placeholder="Share something about yourself…"></textarea>
            <span><b id="circleProfileShowcaseTextCount">0</b> / ${MAX_TEXT_LENGTH}</span>
          </label>
          <button class="circle-showcase-save" type="submit">Save to profile</button>
        </form>`;
      document.body.append(dialog);

      const textarea = $("circleProfileShowcaseText");
      textarea?.addEventListener("input", () => {
        const count = $("circleProfileShowcaseTextCount");
        if (count) count.textContent = String(textarea.value.length);
      });
      dialog.querySelector("[data-showcase-text-close]")?.addEventListener("click", () => dialog.close());
      $("circleProfileShowcaseTextForm")?.addEventListener("submit", onTextSubmit);
    }
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
          <p>PROFILE SHOWCASE</p>
          <h2>More of me</h2>
        </div>
        ${state.owner ? '<span>4 slots</span>' : ""}
      </div>
      <div class="circle-profile-gallery__notice" id="circleProfileGalleryNotice" hidden>
        <span id="circleProfileGalleryStatus" role="status" aria-live="polite"></span>
      </div>
      <div class="circle-profile-gallery__grid" id="circleProfileGalleryGrid" aria-live="polite"></div>
      <input id="circleProfileGalleryInput" type="file" accept="image/*,video/*" hidden />
    `;

    profile.insertAdjacentElement("afterend", section);
    $("circleProfileGalleryInput")?.addEventListener("change", onFileSelected);
    ensureDialogs();
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
    const name = clean(file?.name);
    const fromName = name.includes(".") ? name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    if (fromName && fromName.length <= 6) return fromName;

    const type = clean(file?.type).toLowerCase();
    if (type === "image/png") return "png";
    if (type === "image/heic" || type === "image/heif") return "heic";
    if (type === "image/webp") return "webp";
    if (type === "video/quicktime") return "mov";
    if (type === "video/webm") return "webm";
    if (type.startsWith("video/")) return "mp4";
    return "jpg";
  }

  function moderationLabel(row) {
    if (clean(row?.content_type || "image") !== "image") return "";
    const moderationStatus = clean(row?.moderation_status).toLowerCase();
    if (moderationStatus === "pending" || moderationStatus === "uploading") return "Checking…";
    if (moderationStatus === "rejected") return "Not approved";
    return "";
  }

  function mediaMarkup(position, row) {
    const type = clean(row?.content_type || "image").toLowerCase();
    const url = clean(row?.url);
    const moderation = clean(row?.moderation_status);
    const label = state.owner ? moderationLabel(row) : "";
    const actions = state.owner ? `
      <details class="circle-profile-gallery__item-menu" data-gallery-menu="${position}">
        <summary aria-label="Show profile item options" title="Profile item options">
          <span aria-hidden="true">•••</span>
        </summary>
        <div class="circle-profile-gallery__item-menu-popover" role="menu">
          <button type="button" role="menuitem" data-gallery-edit="${position}">
            <span aria-hidden="true">✎</span>
            <span>Edit</span>
          </button>
          <button class="is-danger" type="button" role="menuitem" data-gallery-remove="${position}">
            <span aria-hidden="true">⌫</span>
            <span>Delete</span>
          </button>
        </div>
      </details>` : "";

    if (type === "text") {
      return `
        <article class="circle-profile-gallery__item circle-profile-gallery__text" data-content-type="text">
          <p>${escapeHtml(row?.text_content || "")}</p>
          ${actions}
        </article>`;
    }

    if (type === "video" && url) {
      return `
        <div class="circle-profile-gallery__item circle-profile-gallery__video" data-content-type="video">
          <video src="${escapeHtml(url)}" controls playsinline preload="metadata" aria-label="Profile video ${position}"></video>
          <span class="circle-profile-gallery__type-badge">VIDEO · ≤30s</span>
          ${actions}
        </div>`;
    }

    if (url) {
      return `
        <div class="circle-profile-gallery__item circle-profile-gallery__photo" data-content-type="image" data-moderation-status="${escapeHtml(moderation)}">
          <img src="${escapeHtml(url)}" alt="Profile showcase image ${position}" />
          ${label ? `<span class="circle-profile-gallery__moderation-badge">${escapeHtml(label)}</span>` : ""}
          ${actions}
        </div>`;
    }

    return "";
  }

  function slotMarkup(position, row) {
    const content = row ? mediaMarkup(position, row) : "";
    if (content) return content;
    if (!state.owner) return "";

    return `
      <button class="circle-profile-gallery__empty" type="button" data-gallery-add="${position}">
        <span aria-hidden="true">＋</span>
        <strong>Add to profile</strong>
        <small>Photo · Video · Text</small>
      </button>`;
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

    grid.querySelectorAll("[data-gallery-add],[data-gallery-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const position = Number(button.dataset.galleryAdd || button.dataset.galleryEdit);
        if (!position) return;
        closeItemMenus();
        openPicker(position);
      });
    });

    grid.querySelectorAll("[data-gallery-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        const position = Number(button.dataset.galleryRemove);
        if (!position) return;
        closeItemMenus();
        await removeItem(position);
      });
    });

    grid.querySelectorAll("[data-gallery-menu]").forEach((menu) => {
      menu.addEventListener("toggle", () => {
        if (!menu.open) return;
        grid.querySelectorAll("[data-gallery-menu][open]").forEach((other) => {
          if (other !== menu) other.removeAttribute("open");
        });
      });
    });
  }

  function closeItemMenus() {
    document.querySelectorAll("[data-gallery-menu][open]").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }

  function openPicker(position) {
    if (!state.owner || state.busy || !position) return;
    state.activePosition = position;
    const dialog = $("circleProfileShowcasePicker");
    if (dialog && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  }

  function chooseType(type) {
    const normalized = clean(type).toLowerCase();
    const picker = $("circleProfileShowcasePicker");
    if (picker?.open) picker.close();

    if (normalized === "text") {
      const existing = state.rows.get(state.activePosition);
      const textarea = $("circleProfileShowcaseText");
      if (textarea) {
        textarea.value = clean(existing?.content_type) === "text" ? clean(existing?.text_content) : "";
        textarea.dispatchEvent(new Event("input"));
      }
      const dialog = $("circleProfileShowcaseTextDialog");
      if (dialog && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
      return;
    }

    if (!["image","video"].includes(normalized)) return;
    state.activeMediaType = normalized;
    const input = $("circleProfileGalleryInput");
    if (!input) return;
    input.dataset.position = String(state.activePosition);
    input.accept = normalized === "video" ? "video/*" : "image/*";
    input.value = "";
    input.click();
  }

  function clearStatusPoll() {
    if (state.statusPollTimer) {
      window.clearTimeout(state.statusPollTimer);
      state.statusPollTimer = 0;
    }
  }

  function hasPendingRows() {
    return [...state.rows.values()].some((row) =>
      clean(row?.content_type || "image") === "image" &&
      clean(row?.moderation_status).toLowerCase() === "pending"
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
          status("An image is still being checked. You can leave this page; it will publish after approval.", {
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

      for (const raw of Array.isArray(rows) ? rows : []) {
        const row = {
          ...raw,
          content_type: clean(raw?.content_type || "image").toLowerCase()
        };
        if (row.content_type === "text") {
          mapped.set(Number(row.position), row);
          continue;
        }

        try {
          const url = await signedUrl(row.media_path);
          if (url) mapped.set(Number(row.position), { ...row, url });
        } catch (error) {
          console.warn("Circle profile showcase media could not be signed:", error?.message || error);
        }
      }

      state.rows = mapped;
      render();
      if (!state.owner) return;

      const pending = hasPendingRows();
      const rejected = [...state.rows.values()].some((row) =>
        clean(row?.content_type || "image") === "image" &&
        clean(row?.moderation_status).toLowerCase() === "rejected"
      );

      if (pending) {
        status("Image uploaded. Checking before it becomes visible to other people.", { tone: "progress" });
        scheduleStatusPoll();
      } else {
        clearStatusPoll();
        state.statusPollCount = 0;

        if (priorPending && fromPoll) {
          status("Image published.", { tone: "success" });
          window.setTimeout(() => status(""), 1800);
        } else if (rejected) {
          status("An image was not approved. Replace or remove it.", { tone: "error" });
        }
      }
    } catch (error) {
      const message = clean(error?.message);
      const transientNetworkError =
        error instanceof TypeError ||
        /load failed|failed to fetch|network request|networkerror/i.test(message);

      console.warn("Circle profile showcase refresh failed:", message || error);

      if (state.owner) {
        if (priorPending || hasPendingRows()) {
          status("Image uploaded. Checking before it becomes visible to other people.", {
            tone: "progress"
          });
        } else if (transientNetworkError) {
          status("Profile showcase couldn’t refresh. It will retry automatically.", {
            tone: "progress"
          });
        } else {
          status("Profile showcase is temporarily unavailable.", {
            tone: "error"
          });
        }
      }
    }
  }

  async function readVideoDuration(file) {
    return await new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      const cleanup = () => {
        try { URL.revokeObjectURL(url); } catch {}
        video.removeAttribute("src");
      };
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("Could not read that video's duration."));
      }, 12000);

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        const duration = Number(video.duration);
        cleanup();
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error("Could not read that video's duration."));
          return;
        }
        resolve(duration);
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("That video format could not be read."));
      };
      video.src = url;
    });
  }

  async function onFileSelected(event) {
    if (!state.owner || state.busy) return;
    const file = event.target.files?.[0] || null;
    const position = Number(event.target.dataset.position);
    if (!file || !position) return;

    const type = clean(file.type).toLowerCase();
    const requestedType = state.activeMediaType;
    if (requestedType === "image" && !type.startsWith("image/")) {
      status("Choose an image file.", { tone: "error" });
      return;
    }
    if (requestedType === "video" && !type.startsWith("video/")) {
      status("Choose a video file.", { tone: "error" });
      return;
    }

    if (requestedType === "image" && file.size > MAX_IMAGE_BYTES) {
      status("That image is unusually large. Choose one under 20 MB.", { tone: "error" });
      return;
    }
    if (requestedType === "video" && file.size > MAX_VIDEO_BYTES) {
      status("That video is unusually large. Choose one under 50 MB.", { tone: "error" });
      return;
    }

    let duration = null;
    if (requestedType === "video") {
      try {
        duration = await readVideoDuration(file);
      } catch (error) {
        status(error.message || "Could not read that video.", { tone: "error" });
        return;
      }
      if (duration > MAX_VIDEO_SECONDS + 0.15) {
        status("Profile videos can be up to 30 seconds.", { tone: "error" });
        return;
      }
    }

    await uploadMedia(file, position, requestedType, duration);
  }

  async function uploadMedia(file, position, contentType, durationSeconds = null) {
    if (state.busy) return;
    state.busy = true;
    clearStatusPoll();
    state.statusPollCount = 0;

    releaseLocalPreview();
    state.localPreviewUrl = URL.createObjectURL(file);
    state.rows.set(position, {
      position,
      content_type: contentType,
      media_path: "",
      media_mime: file.type || (contentType === "video" ? "video/mp4" : "image/jpeg"),
      duration_seconds: durationSeconds,
      moderation_status: contentType === "image" ? "uploading" : "approved",
      url: state.localPreviewUrl
    });
    render();
    status(`Uploading ${contentType === "video" ? "video" : "image"}…`, { tone: "progress" });

    let uploadedPath = "";
    try {
      const ext = fileExtension(file);
      uploadedPath = `${state.viewer.id}/profile-gallery-pending/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await state.client.storage
        .from(BUCKET)
        .upload(uploadedPath, file, {
          cacheControl: "3600",
          contentType: file.type || (contentType === "video" ? "video/mp4" : "image/jpeg"),
          upsert: false
        });
      if (uploadError) throw uploadError;

      const result = await rpc("ari_circle_profile_showcase_set", {
        requested_position: position,
        requested_content_type: contentType,
        requested_media_path: uploadedPath,
        requested_text_content: null,
        requested_media_mime: file.type || (contentType === "video" ? "video/mp4" : "image/jpeg"),
        requested_duration_seconds: durationSeconds
      });

      const replaced = clean(result?.replaced_path);
      if (replaced && replaced !== uploadedPath) {
        state.client.storage.from(BUCKET).remove([replaced]).catch(() => {});
      }

      releaseLocalPreview();
      if (contentType === "image") {
        status("Image uploaded. Checking before it becomes visible to other people.", { tone: "progress" });
      } else {
        status("Video published.", { tone: "success" });
        window.setTimeout(() => status(""), 1800);
      }
      await load();
    } catch (error) {
      if (uploadedPath) state.client.storage.from(BUCKET).remove([uploadedPath]).catch(() => {});
      releaseLocalPreview();
      status(error.message || "Could not add that media.", { tone: "error" });
      await load();
    } finally {
      state.busy = false;
    }
  }

  async function onTextSubmit(event) {
    event.preventDefault();
    if (!state.owner || state.busy || !state.activePosition) return;

    const textarea = $("circleProfileShowcaseText");
    const text = clean(textarea?.value);
    if (!text) {
      status("Write something first.", { tone: "error" });
      textarea?.focus();
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      status(`Text cards can be up to ${MAX_TEXT_LENGTH} characters.`, { tone: "error" });
      return;
    }

    state.busy = true;
    const dialog = $("circleProfileShowcaseTextDialog");
    try {
      const result = await rpc("ari_circle_profile_showcase_set", {
        requested_position: state.activePosition,
        requested_content_type: "text",
        requested_media_path: null,
        requested_text_content: text,
        requested_media_mime: null,
        requested_duration_seconds: null
      });

      const replaced = clean(result?.replaced_path);
      if (replaced) state.client.storage.from(BUCKET).remove([replaced]).catch(() => {});
      if (dialog?.open) dialog.close();
      status("Profile updated.", { tone: "success" });
      window.setTimeout(() => status(""), 1500);
      await load();
    } catch (error) {
      status(error.message || "Could not save that text.", { tone: "error" });
    } finally {
      state.busy = false;
    }
  }

  async function removeItem(position) {
    if (!state.owner || state.busy || !position) return;
    state.busy = true;
    status("Removing from profile…", { tone: "progress" });

    try {
      const result = await rpc("ari_circle_profile_photo_remove", {
        requested_position: position
      });
      const removed = clean(result?.removed_path);
      if (removed) state.client.storage.from(BUCKET).remove([removed]).catch(() => {});
      status("");
      await load();
    } catch (error) {
      status(error.message || "Could not remove that item.", { tone: "error" });
    } finally {
      state.busy = false;
    }
  }

  async function init() {
    ensureStyle();
    ensureDialogs();

    document.addEventListener("click", (event) => {
      if (!event.target?.closest?.("[data-gallery-menu]")) closeItemMenus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeItemMenus();
    });
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
      console.warn("Circle profile showcase failed to start:", error?.message || error);
    }
  }

  window.AriCircleProfileGalleryV1 = Object.freeze({
    version: VERSION,
    refresh: load,
    slotLimit: 4,
    supportedTypes: Object.freeze(["image","video","text"])
  });

  window.addEventListener("pagehide", () => {
    clearStatusPoll();
    releaseLocalPreview();
  }, { once: true });

  document.addEventListener("circle:app-ready", () => setTimeout(init, 40), { once: true });
  if (document.readyState !== "loading") setTimeout(init, 80);
})();
