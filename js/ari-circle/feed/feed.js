/* =============================================================
   ARI CIRCLE — FEED
   Version: 2.0.0

   V2:
   - One simple composer: text, photo, or short video.
   - Removes post categories and manual activity labels.
   - Private Supabase Storage media with signed read URLs.
   - 30-second video limit.
   - 24-hour ARI Circle Moments.
   - Keeps comments, native emoji reactions, age separation, and blocking.
============================================================= */

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const MEDIA_BUCKET = "ari-circle-post-media";
  const SIGNED_URL_SECONDS = 60 * 60;
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
  const MAX_VIDEO_SECONDS = 30;

  const $ = (id) => document.getElementById(id);

  const state = {
    client: null,
    user: null,
    profile: null,
    age: null,
    posts: [],
    moments: [],
    nextBefore: null,
    activeReactionPostId: null,
    activeCommentsPost: null,
    selectedMedia: null,
    previewUrl: null,
    momentIndex: 0,
    busy: false,
    toastTimer: null,
    signedUrlCache: new Map()
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function profileUrl(userId) {
    return `ari-circle.html?user=${encodeURIComponent(userId)}`;
  }

  function reportUrl(post) {
    const params = new URLSearchParams({
      target_type: "feed_post",
      target_id: String(post.post_id || ""),
      reported_user_id: String(post.author_user_id || "")
    });
    return `help-safety.html?${params.toString()}`;
  }

  function initialFor(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 45) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function showToast(message, duration = 3200) {
    const toast = $("feedToast");
    if (!toast) return;

    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;

    state.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, duration);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  function setBusy(isBusy) {
    state.busy = Boolean(isBusy);
    [
      $("publishPostButton"),
      $("verifyAgeButton"),
      $("shareMomentButton"),
      $("feedMediaButton")
    ]
      .filter(Boolean)
      .forEach((button) => {
        button.disabled = state.busy;
      });
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;

    const user = data?.user || null;
    if (!user) {
      window.location.replace("signin.html");
      return null;
    }

    state.user = user;
    return user;
  }

  async function loadOwnProfile() {
    const { data, error } = await state.client
      .from("ari_circle_profiles")
      .select("user_id,display_name,handle,avatar_url")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (error) {
      console.warn("ARI Circle feed could not load own profile:", error);
      return null;
    }

    state.profile = data || null;
    renderComposerAvatar();
    return state.profile;
  }

  function renderComposerAvatar() {
    const host = $("composerAvatar");
    if (!host) return;

    const name = state.profile?.display_name || state.user?.email || "ARI";
    const avatar = clean(state.profile?.avatar_url);

    host.innerHTML = avatar
      ? `<img src="${escapeHtml(avatar)}" alt="" />`
      : `<span>${escapeHtml(initialFor(name))}</span>`;
  }

  async function loadAgeState() {
    state.age = await rpc("ari_circle_my_age_state");
    return state.age;
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("ageDateInput")?.value);

    if (!value) {
      showToast("Enter your date of birth to continue.");
      return;
    }

    setBusy(true);
    try {
      state.age = await rpc("ari_circle_verify_my_age", {
        requested_date_of_birth: value
      });
      closeDialog("ageDialog");
      showToast("Age verified. Your birthday stays private.");
      await Promise.all([refreshFeed(), loadMoments()]);
    } catch (error) {
      console.error("ARI Circle feed age verification failed:", error);
      showToast(error.message || "Could not verify age.", 4500);
    } finally {
      setBusy(false);
    }
  }

  function mediaKind(file) {
    const type = clean(file?.type).toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    return null;
  }

  function mediaExtension(file, kind) {
    const mime = clean(file?.type).toLowerCase();
    const known = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm"
    };

    if (known[mime]) return known[mime];

    const fromName = clean(file?.name).split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (fromName && fromName.length <= 5) return fromName;
    return kind === "video" ? "mp4" : "jpg";
  }

  function readVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadedmetadata = () => {
        const duration = Number(video.duration);
        cleanup();
        if (!Number.isFinite(duration)) reject(new Error("Could not read video length."));
        else resolve(duration);
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("That video could not be opened."));
      };

      video.src = url;
    });
  }

  async function selectMedia(file) {
    if (!file) return;

    const kind = mediaKind(file);
    if (!kind) {
      showToast("Choose a photo or short video.");
      return;
    }

    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      showToast("Photos can be up to 8 MB.", 4200);
      return;
    }

    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      showToast("Videos can be up to 25 MB.", 4200);
      return;
    }

    let duration = null;
    if (kind === "video") {
      try {
        duration = await readVideoDuration(file);
      } catch (error) {
        showToast(error.message || "Could not open that video.", 4200);
        return;
      }

      if (duration > MAX_VIDEO_SECONDS + 0.15) {
        showToast("Keep Circle videos to 30 seconds or less.", 4500);
        return;
      }
    }

    clearSelectedMedia();
    state.selectedMedia = { file, kind, duration };
    state.previewUrl = URL.createObjectURL(file);
    renderSelectedMedia();
  }

  function renderSelectedMedia() {
    const preview = $("feedMediaPreview");
    const stage = $("feedMediaPreviewStage");
    const meta = $("feedMediaPreviewMeta");
    const momentAction = $("feedMomentAction");
    if (!preview || !stage || !meta || !momentAction) return;

    const selected = state.selectedMedia;
    if (!selected || !state.previewUrl) {
      preview.hidden = true;
      momentAction.hidden = true;
      stage.replaceChildren();
      meta.replaceChildren();
      return;
    }

    preview.hidden = false;
    momentAction.hidden = false;
    stage.replaceChildren();

    if (selected.kind === "video") {
      const video = document.createElement("video");
      video.src = state.previewUrl;
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      stage.append(video);
    } else {
      const image = document.createElement("img");
      image.src = state.previewUrl;
      image.alt = "Selected photo preview";
      stage.append(image);
    }

    const left = selected.kind === "video"
      ? `Video · ${Math.ceil(selected.duration || 0)}s`
      : "Photo";

    meta.innerHTML = `<span>${escapeHtml(left)}</span><span>${escapeHtml(formatBytes(selected.file.size))}</span>`;
  }

  function clearSelectedMedia() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
    state.selectedMedia = null;
    if ($("feedMediaInput")) $("feedMediaInput").value = "";
    renderSelectedMedia();
  }

  function clearComposer() {
    if ($("feedPostBody")) $("feedPostBody").value = "";
    if ($("postCharCount")) $("postCharCount").textContent = "0";
    clearSelectedMedia();
  }

  async function uploadSelectedMedia(folder) {
    const selected = state.selectedMedia;
    if (!selected || !state.user) return null;

    const extension = mediaExtension(selected.file, selected.kind);
    const path = `${state.user.id}/${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await state.client.storage
      .from(MEDIA_BUCKET)
      .upload(path, selected.file, {
        cacheControl: "3600",
        contentType: selected.file.type || undefined,
        upsert: false
      });

    if (error) throw error;

    return {
      path,
      type: selected.kind,
      duration: selected.kind === "video" ? selected.duration : null
    };
  }

  async function removeUploadedPath(path) {
    if (!path) return;
    try {
      await state.client.storage.from(MEDIA_BUCKET).remove([path]);
    } catch (error) {
      console.warn("ARI Circle could not clean up an unused upload:", error);
    }
  }

  async function publishPost(event) {
    event.preventDefault();
    if (state.busy) return;

    if (!state.age?.verified) {
      openDialog("ageDialog");
      return;
    }

    const body = clean($("feedPostBody")?.value);
    if (!body && !state.selectedMedia) {
      showToast("Write something or add a photo or video.");
      return;
    }

    let uploaded = null;
    setBusy(true);
    try {
      if (state.selectedMedia) {
        showToast("Uploading media…", 1200);
        uploaded = await uploadSelectedMedia("posts");
      }

      await rpc("ari_circle_feed_create_post_v2", {
        requested_body: body || null,
        requested_media_path: uploaded?.path || null,
        requested_media_type: uploaded?.type || null,
        requested_media_duration_seconds: uploaded?.duration ?? null
      });

      clearComposer();
      showToast("Shared to your Circle.");
      await refreshFeed();
    } catch (error) {
      if (uploaded?.path) await removeUploadedPath(uploaded.path);
      console.error("ARI Circle feed post failed:", error);
      showToast(error.message || "Could not share that post.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function publishMoment() {
    if (state.busy) return;

    if (!state.age?.verified) {
      openDialog("ageDialog");
      return;
    }

    if (!state.selectedMedia) {
      showToast("Add a photo or video first.");
      return;
    }

    const caption = clean($("feedPostBody")?.value);
    if (caption.length > 280) {
      showToast("Moment captions can be up to 280 characters.", 4500);
      return;
    }

    let uploaded = null;
    setBusy(true);
    try {
      showToast("Adding your Moment…", 1200);
      uploaded = await uploadSelectedMedia("moments");

      await rpc("ari_circle_moment_create", {
        requested_media_path: uploaded.path,
        requested_media_type: uploaded.type,
        requested_caption: caption || null,
        requested_media_duration_seconds: uploaded.duration ?? null
      });

      clearComposer();
      showToast("Moment added for 24 hours.");
      await loadMoments();
    } catch (error) {
      if (uploaded?.path) await removeUploadedPath(uploaded.path);
      console.error("ARI Circle Moment failed:", error);
      showToast(error.message || "Could not add that Moment.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function signedMediaUrl(path) {
    const cleanPath = clean(path);
    if (!cleanPath) return "";
    if (state.signedUrlCache.has(cleanPath)) return state.signedUrlCache.get(cleanPath);

    try {
      const { data, error } = await state.client.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(cleanPath, SIGNED_URL_SECONDS);

      if (error) throw error;
      const url = clean(data?.signedUrl);
      if (url) state.signedUrlCache.set(cleanPath, url);
      return url;
    } catch (error) {
      console.warn("ARI Circle media URL unavailable:", error);
      return "";
    }
  }

  async function hydrateMediaRows(rows) {
    await Promise.all(rows.map(async (row) => {
      row.signed_media_url = clean(row.media_path)
        ? await signedMediaUrl(row.media_path)
        : clean(row.legacy_media_url || row.media_url);
    }));
    return rows;
  }

  async function loadFeed({ append = false } = {}) {
    const status = $("feedStatus");
    if (!append && status) status.textContent = "Loading your Circle…";

    try {
      const data = await rpc("ari_circle_feed_list_v2", {
        result_limit: 20,
        before_created_at: append ? state.nextBefore : null
      });

      const rows = Array.isArray(data) ? data : [];
      await hydrateMediaRows(rows);

      state.posts = append ? [...state.posts, ...rows] : rows;
      state.nextBefore = rows.length ? rows[rows.length - 1].created_at : null;

      renderFeed();
      if ($("loadMoreButton")) $("loadMoreButton").hidden = rows.length < 20;
    } catch (error) {
      console.error("ARI Circle feed loading failed:", error);
      if (!append) state.posts = [];
      renderFeed();
      if (status) status.textContent = error.message || "Feed unavailable right now.";
    }
  }

  async function refreshFeed() {
    state.nextBefore = null;
    return loadFeed({ append: false });
  }

  function renderFeed() {
    const host = $("feedList");
    const empty = $("feedEmpty");
    const status = $("feedStatus");
    if (!host || !empty || !status) return;

    host.replaceChildren();

    if (!state.posts.length) {
      empty.hidden = false;
      status.textContent = "Nothing posted in your Circle yet.";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.posts.length} ${state.posts.length === 1 ? "post" : "posts"}`;
    state.posts.forEach((post) => host.append(createPostCard(post)));
  }

  function createAvatar(name, avatarUrl, userId) {
    const link = document.createElement("a");
    link.className = "feed-avatar";
    link.href = profileUrl(userId);
    link.setAttribute("aria-label", `View ${clean(name) || "profile"}`);

    const avatar = clean(avatarUrl);
    link.innerHTML = avatar
      ? `<img src="${escapeHtml(avatar)}" alt="" />`
      : `<span>${escapeHtml(initialFor(name))}</span>`;

    return link;
  }

  const videoObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: [0, 0.65, 1] })
    : null;

  function appendPostMedia(article, post) {
    const url = clean(post.signed_media_url);
    if (!url) return;

    if (post.media_type === "video") {
      const video = document.createElement("video");
      video.className = "feed-post__video";
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      article.append(video);
      videoObserver?.observe(video);
      return;
    }

    const image = document.createElement("img");
    image.className = "feed-post__media";
    image.src = url;
    image.alt = "Shared ARI Circle photo";
    image.loading = "lazy";
    article.append(image);
  }

  function createPostCard(post) {
    const article = document.createElement("article");
    article.className = "feed-post";
    article.dataset.postId = post.post_id;

    const handle = clean(post.handle)
      ? `@${clean(post.handle).replace(/^@+/, "")}`
      : "ARI Circle";

    const reactions = Array.isArray(post.reaction_summary) ? post.reaction_summary : [];
    const viewerReactions = new Set(Array.isArray(post.viewer_reactions) ? post.viewer_reactions : []);

    const header = document.createElement("div");
    header.className = "feed-post__header";
    header.append(createAvatar(post.display_name, post.avatar_url, post.author_user_id));

    const identity = document.createElement("a");
    identity.className = "feed-post__identity";
    identity.href = profileUrl(post.author_user_id);
    identity.innerHTML = `
      <strong>${escapeHtml(post.display_name || "ARI User")}</strong>
      <span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(post.created_at))}</span>
    `;
    header.append(identity);

    const reportLink = document.createElement("a");
    reportLink.className = "feed-report-link";
    reportLink.href = reportUrl(post);
    reportLink.setAttribute("aria-label", "Post options and safety");
    reportLink.textContent = "•••";
    header.append(reportLink);
    article.append(header);

    if (clean(post.body)) {
      const body = document.createElement("div");
      body.className = "feed-post__body";
      body.innerHTML = `<p>${escapeHtml(post.body)}</p>`;
      article.append(body);
    }

    appendPostMedia(article, post);

    const reactionHost = document.createElement("div");
    reactionHost.className = "feed-post__reactions";
    reactions.forEach((reaction) => {
      const emoji = clean(reaction?.emoji);
      const count = Number(reaction?.count) || 0;
      if (!emoji || count <= 0) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "feed-reaction-pill";
      if (viewerReactions.has(emoji)) button.classList.add("is-active");
      button.textContent = `${emoji} ${count}`;
      button.addEventListener("click", () => toggleReaction(post.post_id, emoji));
      reactionHost.append(button);
    });
    article.append(reactionHost);

    const actions = document.createElement("div");
    actions.className = "feed-post__actions";

    const reactButton = document.createElement("button");
    reactButton.type = "button";
    reactButton.innerHTML = `<span aria-hidden="true">☺</span><span>React${Number(post.reaction_count) ? ` · ${Number(post.reaction_count)}` : ""}</span>`;
    reactButton.addEventListener("click", () => openReactionPicker(post.post_id));
    actions.append(reactButton);

    const commentButton = document.createElement("button");
    commentButton.type = "button";
    commentButton.innerHTML = `<span aria-hidden="true">◌</span><span>Comment${Number(post.comment_count) ? ` · ${Number(post.comment_count)}` : ""}</span>`;
    commentButton.addEventListener("click", () => openComments(post));
    actions.append(commentButton);

    article.append(actions);
    return article;
  }

  async function loadMoments() {
    const section = $("momentsSection");
    try {
      const data = await rpc("ari_circle_moments_list", { result_limit: 80 });
      const rows = Array.isArray(data) ? data : [];
      await hydrateMediaRows(rows);
      state.moments = rows.filter((row) => clean(row.signed_media_url));
      renderMoments();
    } catch (error) {
      console.warn("ARI Circle Moments unavailable:", error);
      state.moments = [];
      if (section) section.hidden = true;
    }
  }

  function renderMoments() {
    const section = $("momentsSection");
    const strip = $("momentsStrip");
    if (!section || !strip) return;

    strip.replaceChildren();
    if (!state.moments.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;

    const latestByAuthor = new Map();
    state.moments.forEach((moment, index) => {
      if (!latestByAuthor.has(moment.author_user_id)) {
        latestByAuthor.set(moment.author_user_id, { moment, index });
      }
    });

    [...latestByAuthor.values()].forEach(({ moment, index }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "feed-moment-bubble";
      button.setAttribute("aria-label", `Open ${clean(moment.display_name) || "user"}'s Moment`);

      const avatar = clean(moment.avatar_url);
      button.innerHTML = `
        <span class="feed-moment-bubble__ring">
          <span class="feed-moment-bubble__avatar">
            ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" />` : `<span>${escapeHtml(initialFor(moment.display_name))}</span>`}
          </span>
        </span>
        <strong>${escapeHtml(moment.author_user_id === state.user?.id ? "You" : (moment.display_name || "ARI User"))}</strong>
      `;

      button.addEventListener("click", () => openMoment(index));
      strip.append(button);
    });
  }

  function openMoment(index) {
    if (!state.moments.length) return;
    state.momentIndex = Math.max(0, Math.min(Number(index) || 0, state.moments.length - 1));
    renderMomentViewer();
    openDialog("momentViewer");
  }

  function renderMomentViewer() {
    const moment = state.moments[state.momentIndex];
    const identity = $("momentViewerIdentity");
    const media = $("momentViewerMedia");
    const caption = $("momentViewerCaption");
    if (!moment || !identity || !media || !caption) return;

    const avatar = clean(moment.avatar_url);
    identity.innerHTML = `
      ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" />` : `<span class="moment-initial">${escapeHtml(initialFor(moment.display_name))}</span>`}
      <div>
        <strong>${escapeHtml(moment.display_name || "ARI User")}</strong>
        <span>${escapeHtml(relativeTime(moment.created_at))}</span>
      </div>
    `;

    media.replaceChildren();
    const url = clean(moment.signed_media_url);

    if (moment.media_type === "video") {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      media.append(video);
      video.play().catch(() => {});
    } else {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "ARI Circle Moment";
      media.append(image);
    }

    caption.textContent = clean(moment.caption);
    caption.hidden = !clean(moment.caption);
  }

  function moveMoment(direction) {
    if (!state.moments.length) return;
    const total = state.moments.length;
    state.momentIndex = (state.momentIndex + direction + total) % total;
    renderMomentViewer();
  }

  function openReactionPicker(postId) {
    state.activeReactionPostId = postId;
    if ($("customReactionInput")) $("customReactionInput").value = "";
    openDialog("reactionDialog");
  }

  async function toggleReaction(postId, emoji) {
    const cleanEmoji = clean(emoji);
    if (!postId || !cleanEmoji || state.busy) return;

    state.busy = true;
    try {
      await rpc("ari_circle_feed_toggle_reaction", {
        requested_post_id: postId,
        requested_emoji: cleanEmoji
      });
      closeDialog("reactionDialog");
      await refreshFeed();
    } catch (error) {
      console.error("ARI Circle reaction failed:", error);
      showToast(error.message || "Could not react.", 4200);
    } finally {
      state.busy = false;
    }
  }

  function bindReactionPicker() {
    $("quickReactionGrid")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reaction]");
      if (!button) return;
      toggleReaction(state.activeReactionPostId, button.dataset.reaction);
    });

    $("customReactionForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = clean($("customReactionInput")?.value);
      if (!value) {
        showToast("Choose or enter an emoji.");
        return;
      }
      toggleReaction(state.activeReactionPostId, value);
    });
  }

  async function openComments(post) {
    state.activeCommentsPost = post;
    if ($("commentInput")) $("commentInput").value = "";
    openDialog("commentsDialog");
    await loadComments(post.post_id);
  }

  async function loadComments(postId) {
    const host = $("commentsList");
    const empty = $("commentsEmpty");
    if (!host || !empty) return;

    host.innerHTML = `<p class="feed-status">Loading comments…</p>`;
    empty.hidden = true;

    try {
      const data = await rpc("ari_circle_feed_list_comments", {
        requested_post_id: postId,
        result_limit: 80
      });
      renderComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ARI Circle comments failed to load:", error);
      host.replaceChildren();
      empty.hidden = false;
      empty.querySelector("p").textContent = error.message || "Comments unavailable right now.";
    }
  }

  function renderComments(comments) {
    const host = $("commentsList");
    const empty = $("commentsEmpty");
    if (!host || !empty) return;

    host.replaceChildren();

    if (!comments.length) {
      empty.hidden = false;
      empty.querySelector("p").textContent = "No comments yet. Say something.";
      return;
    }

    empty.hidden = true;
    comments.forEach((comment) => {
      const row = document.createElement("article");
      row.className = "feed-comment";
      row.append(createAvatar(comment.display_name, comment.avatar_url, comment.author_user_id));

      const bubble = document.createElement("div");
      bubble.className = "feed-comment__bubble";
      bubble.innerHTML = `
        <strong>${escapeHtml(comment.display_name || "ARI User")}</strong>
        <p>${escapeHtml(comment.body || "")}</p>
        <small>${escapeHtml(relativeTime(comment.created_at))}</small>
      `;
      row.append(bubble);
      host.append(row);
    });
  }

  async function addComment(event) {
    event.preventDefault();
    const post = state.activeCommentsPost;
    const body = clean($("commentInput")?.value);

    if (!post || !body || state.busy) return;
    state.busy = true;

    try {
      await rpc("ari_circle_feed_add_comment", {
        requested_post_id: post.post_id,
        requested_body: body
      });
      $("commentInput").value = "";
      await Promise.all([loadComments(post.post_id), refreshFeed()]);
    } catch (error) {
      console.error("ARI Circle comment failed:", error);
      showToast(error.message || "Could not add comment.", 4200);
    } finally {
      state.busy = false;
    }
  }

  function bindMediaUi() {
    $("feedMediaButton")?.addEventListener("click", () => $("feedMediaInput")?.click());
    $("feedMediaInput")?.addEventListener("change", (event) => selectMedia(event.target.files?.[0] || null));
    $("removeFeedMedia")?.addEventListener("click", clearSelectedMedia);
    $("shareMomentButton")?.addEventListener("click", publishMoment);
  }

  function bindCommonUi() {
    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close-dialog]");
      if (close) closeDialog(close.dataset.closeDialog);
    });

    $("feedPostBody")?.addEventListener("input", () => {
      if ($("postCharCount")) $("postCharCount").textContent = String($("feedPostBody").value.length);
    });

    $("feedComposerForm")?.addEventListener("submit", publishPost);
    $("ageForm")?.addEventListener("submit", verifyAge);
    $("commentForm")?.addEventListener("submit", addComment);
    $("refreshFeedButton")?.addEventListener("click", () => Promise.all([refreshFeed(), loadMoments()]));
    $("loadMoreButton")?.addEventListener("click", () => loadFeed({ append: true }));
    $("emptyComposeButton")?.addEventListener("click", () => {
      $("feedPostBody")?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $("momentPrevButton")?.addEventListener("click", () => moveMoment(-1));
    $("momentNextButton")?.addEventListener("click", () => moveMoment(1));
  }

  async function init() {
    try {
      state.client = window.calbuddySupabase || window.supabaseClient || null;
      if (!state.client) throw new Error("Supabase is unavailable.");

      const user = await requireUser();
      if (!user) return;

      bindMediaUi();
      bindReactionPicker();
      bindCommonUi();

      await Promise.all([loadOwnProfile(), loadAgeState()]);

      $("feedPage").hidden = false;
      $("feedLoading").hidden = true;

      if (!state.age?.verified) {
        $("feedStatus").textContent = "Verify your age to open your Circle feed.";
        openDialog("ageDialog");
        return;
      }

      await Promise.all([refreshFeed(), loadMoments()]);
    } catch (error) {
      console.error("ARI Circle feed failed to start:", error);
      $("feedLoading").innerHTML = `
        <strong>ARI Circle couldn’t open.</strong>
        <span>${escapeHtml(error.message || "Please try again.")}</span>
        <a class="feed-secondary" href="ari-circle.html">Back to ARI Circle</a>
      `;
    }
  }

  window.AriCircleFeed = Object.freeze({
    version: VERSION,
    refresh: () => Promise.all([refreshFeed(), loadMoments()])
  });

  document.addEventListener("DOMContentLoaded", init);
})();
