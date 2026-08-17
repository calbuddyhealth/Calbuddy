/* =============================================================
   ARI CIRCLE — SOCIAL CHALLENGES
   Version: 3.0.0
   Build 5

   - Separate Photo / Video feeds
   - Horizontal swipe switches feeds
   - Server-paged live feed (10 at a time)
   - Recently ended is lazy-loaded and limited to 48 hours
   - New challenges require one media type
   - Video challenges require 10 / 15 / 30 second limits
   - One final entry per participant
   - Native iOS recorder integration with web picker fallback
============================================================= */
(() => {
  "use strict";

  const VERSION = "3.0.0";
  const MEDIA_BUCKET = "ari-circle-challenge-media";
  const PAGE_SIZE = 10;
  const MAX_FEED_ITEMS = 40;
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  const VIDEO_LIMITS = Object.freeze([10, 15, 30]);
  const $ = (id) => document.getElementById(id);

  const MODE_META = Object.freeze({
    participate: { label: "Just for fun", copy: "One final entry. No winner — just see what everyone does." },
    reaction: { label: "Most hype wins", copy: "One final entry. Hype the entries you love." },
    vote: { label: "Vote for a winner", copy: "One final entry. Everyone gets one official vote." }
  });

  const state = {
    client: null,
    user: null,
    age: null,
    mediaType: "image",
    filter: "for-you",
    challenges: [],
    feedOffset: 0,
    feedHasMore: true,
    feedLoading: false,
    activeChallenge: null,
    activeEntries: [],
    coverFile: null,
    coverPreviewUrl: "",
    entryFile: null,
    entryPreviewUrl: "",
    entryDurationSeconds: null,
    busy: false,
    toastTimer: 0,
    deepLinkHandled: false,
    mediaObserver: null,
    videoObserver: null,
    activePreviewVideo: null,
    cardChallengeMap: new WeakMap(),
    entryMediaObserver: null,
    entryMap: new WeakMap(),
    loadObserver: null,
    recentObserver: null,
    recentVisible: false,
    recentLoadedFor: "",
    recentLoading: false,
    swipeStart: null
  };

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function showToast(message, duration = 3400) {
    const toast = $("challengeToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => { toast.hidden = true; }, duration);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (dialog && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function isNative() {
    if (window.ARI_XP_NATIVE === true) return true;
    const capacitor = window.Capacitor || null;
    if (!capacitor) return false;
    try {
      if (typeof capacitor.isNativePlatform === "function") return Boolean(capacitor.isNativePlatform());
      if (typeof capacitor.getPlatform === "function") return capacitor.getPlatform() !== "web";
    } catch {}
    return false;
  }

  function ageBand() {
    const value = state.age;
    if (!value) return "";
    if (Array.isArray(value)) return clean(value[0]?.age_band || value[0]?.band);
    return clean(value.age_band || value.band);
  }

  function ageVerified() {
    const value = state.age;
    if (!value) return false;
    if (Array.isArray(value)) return Boolean(value[0]?.verified);
    return Boolean(value.verified);
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    const user = data?.user || null;
    if (!user) {
      location.replace("signin.html");
      return null;
    }
    state.user = user;
    return user;
  }

  async function loadAge() {
    state.age = await rpc("ari_circle_my_age_state");
    return state.age;
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("ageDateInput")?.value);
    if (!value || state.busy) return;
    state.busy = true;
    try {
      state.age = await rpc("ari_circle_verify_my_age", { requested_date_of_birth: value });
      closeDialog("ageDialog");
      showToast("Age verified. Your birthday stays private.");
      await loadChallenges({ reset: true });
    } catch (error) {
      console.error("Challenge age verification failed:", error);
      showToast(error.message || "Could not verify age.", 4400);
    } finally {
      state.busy = false;
    }
  }

  function initialFor(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function relativeTime(value) {
    const then = new Date(value).getTime();
    if (!Number.isFinite(then)) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  function timeLeft(value) {
    const ms = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return "Ended";
    if (ms < 3600000) return `${Math.max(1, Math.ceil(ms / 60000))}m left`;
    const hours = Math.ceil(ms / 3600000);
    if (hours < 24) return `${hours}h left`;
    return `${Math.ceil(hours / 24)}d left`;
  }

  function endedAgo(value) {
    const ms = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "Just ended";
    const minutes = Math.max(1, Math.floor(ms / 60000));
    if (minutes < 60) return `Ended ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Ended ${hours}h ago`;
    return `Ended ${Math.floor(hours / 24)}d ago`;
  }

  function fileKind(file) {
    const type = clean(file?.type).toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    return "";
  }

  async function videoDuration(file) {
    const captured = Number(file?.ariRecordedDuration);
    if (Number.isFinite(captured) && captured > 0) return captured;
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        video.removeAttribute("src");
        resolve(Number(value) || 0);
      };
      const timer = window.setTimeout(() => finish(0), 7000);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        finish(video.duration);
      };
      video.onerror = () => {
        clearTimeout(timer);
        finish(0);
      };
      video.src = url;
    });
  }

  async function validateMedia(file, { expectedKind = "", maxVideoSeconds = 30 } = {}) {
    if (!file) return { ok: false, duration: null };
    const kind = fileKind(file);
    if (!kind) {
      showToast("Choose a valid photo or video.");
      return { ok: false, duration: null };
    }
    if (expectedKind && kind !== expectedKind) {
      showToast(expectedKind === "video" ? "This challenge accepts video only." : "This challenge accepts photos only.");
      return { ok: false, duration: null };
    }
    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      showToast("Keep challenge videos under 50 MB.");
      return { ok: false, duration: null };
    }
    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      showToast("Keep challenge photos under 15 MB.");
      return { ok: false, duration: null };
    }
    if (kind === "video") {
      const duration = await videoDuration(file);
      if (!duration) {
        showToast("ARI could not verify that video’s length. Choose it again.");
        return { ok: false, duration: null };
      }
      const limit = VIDEO_LIMITS.includes(Number(maxVideoSeconds)) ? Number(maxVideoSeconds) : 30;
      if (duration > limit + 0.5) {
        showToast(`This challenge allows up to ${limit} seconds.`);
        return { ok: false, duration };
      }
      return { ok: true, duration };
    }
    return { ok: true, duration: null };
  }

  function rememberModerationFile(inputId, file) {
    try { window.AriCircleContentModeration?.rememberFile?.(inputId, file || null); } catch {}
  }

  function clearPreview(which) {
    const isCover = which === "cover";
    const urlKey = isCover ? "coverPreviewUrl" : "entryPreviewUrl";
    const fileKey = isCover ? "coverFile" : "entryFile";
    if (state[urlKey]) URL.revokeObjectURL(state[urlKey]);
    state[urlKey] = "";
    state[fileKey] = null;
    if (!isCover) state.entryDurationSeconds = null;
    const host = $(isCover ? "challengeCoverPreviewStage" : "challengeEntryPreviewStage");
    host?.replaceChildren();
    const wrap = $(isCover ? "challengeCoverPreview" : "challengeEntryPreview");
    if (wrap) wrap.hidden = true;
    rememberModerationFile(isCover ? "challengeCoverInput" : "challengeEntryMediaInput", null);
  }

  function currentCreateMediaType() {
    const value = clean(document.querySelector('input[name="challengeMediaType"]:checked')?.value);
    return value === "video" ? "video" : "image";
  }

  function currentVideoLimit() {
    const value = Number(document.querySelector('input[name="challengeVideoSeconds"]:checked')?.value);
    return VIDEO_LIMITS.includes(value) ? value : 15;
  }

  async function previewFile(file, which, challenge = null) {
    const isCover = which === "cover";
    const expectedKind = isCover ? currentCreateMediaType() : clean(challenge?.entry_media_type || state.activeChallenge?.entry_media_type);
    const maxVideoSeconds = isCover ? currentVideoLimit() : Number(challenge?.video_max_seconds || state.activeChallenge?.video_max_seconds || 30);
    const result = await validateMedia(file, { expectedKind, maxVideoSeconds });
    if (!result.ok) return false;

    clearPreview(which);
    const kind = fileKind(file);
    const url = URL.createObjectURL(file);
    const fileKey = isCover ? "coverFile" : "entryFile";
    const urlKey = isCover ? "coverPreviewUrl" : "entryPreviewUrl";
    state[fileKey] = file;
    state[urlKey] = url;
    if (!isCover) state.entryDurationSeconds = result.duration;
    rememberModerationFile(isCover ? "challengeCoverInput" : "challengeEntryMediaInput", file);

    const host = $(isCover ? "challengeCoverPreviewStage" : "challengeEntryPreviewStage");
    const wrap = $(isCover ? "challengeCoverPreview" : "challengeEntryPreview");
    if (!host || !wrap) return true;
    const media = kind === "video" ? document.createElement("video") : document.createElement("img");
    media.src = url;
    if (kind === "video") {
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media.alt = "Selected challenge media";
    }
    host.append(media);
    wrap.hidden = false;
    return true;
  }

  function safeExtension(file) {
    const name = clean(file?.name);
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    if (ext) return ext.slice(0, 8);
    return fileKind(file) === "video" ? "mp4" : "jpg";
  }

  async function uploadMedia(file, prefix) {
    if (!file) return { path: null, type: null };
    const band = ageBand();
    if (!band || !state.user?.id) throw new Error("Verify your age before uploading media.");
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${band}/${state.user.id}/${prefix}-${id}.${safeExtension(file)}`;
    const { error } = await state.client.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    return { path, type: fileKind(file) };
  }

  async function signedUrl(path) {
    const cleanPath = clean(path);
    if (!cleanPath) return "";
    try {
      const { data, error } = await state.client.storage.from(MEDIA_BUCKET).createSignedUrl(cleanPath, 3600);
      if (error) throw error;
      return clean(data?.signedUrl);
    } catch (error) {
      console.warn("Challenge media URL unavailable:", error);
      return "";
    }
  }

  function ensureMediaObservers() {
    if (!state.mediaObserver && "IntersectionObserver" in window) {
      state.mediaObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          state.mediaObserver.unobserve(entry.target);
          const challenge = state.cardChallengeMap.get(entry.target);
          if (challenge) hydrateCardMedia(entry.target, challenge);
        });
      }, { rootMargin: "520px 0px" });
    }

    if (!state.videoObserver && "IntersectionObserver" in window) {
      state.videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= .72 && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
            if (state.activePreviewVideo && state.activePreviewVideo !== video) state.activePreviewVideo.pause();
            state.activePreviewVideo = video;
            video.muted = true;
            video.play().catch(() => {});
          } else {
            video.pause();
            if (state.activePreviewVideo === video) state.activePreviewVideo = null;
          }
        });
      }, { threshold: [0, .72] });
    }

    if (!state.entryMediaObserver && "IntersectionObserver" in window) {
      state.entryMediaObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          state.entryMediaObserver.unobserve(entry.target);
          const row = state.entryMap.get(entry.target);
          if (row) hydrateEntryMedia(entry.target, row);
        });
      }, { rootMargin: "450px 0px" });
    }
  }

  async function hydrateCardMedia(card, challenge) {
    if (!card || card.dataset.mediaHydrated === "true" || !clean(challenge.cover_media_path)) return;
    card.dataset.mediaHydrated = "true";
    const url = await signedUrl(challenge.cover_media_path);
    if (!url || !card.isConnected) return;
    const host = card.querySelector(".challenge-card__media");
    const visual = card.querySelector(".challenge-card__visual");
    if (!host || !visual) return;
    const media = challenge.cover_media_type === "video" ? document.createElement("video") : document.createElement("img");
    media.src = url;
    if (challenge.cover_media_type === "video") {
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = "metadata";
      media.setAttribute("aria-label", "Challenge preview video");
      state.videoObserver?.observe(media);
    } else {
      media.alt = "";
      media.loading = "lazy";
      media.decoding = "async";
    }
    host.replaceChildren(media);
    visual.classList.add("has-media");
  }

  function observeCardMedia(card, challenge) {
    if (!clean(challenge.cover_media_path)) return;
    state.cardChallengeMap.set(card, challenge);
    if (state.mediaObserver) state.mediaObserver.observe(card);
    else hydrateCardMedia(card, challenge);
  }

  function modeMeta(challenge) {
    return MODE_META[challenge?.challenge_mode] || MODE_META.participate;
  }

  function isEntryLocked(challenge) {
    return Boolean(challenge?.viewer_has_entry || challenge?.viewer_completed_at);
  }

  function createChallengeCard(challenge) {
    const card = document.createElement("article");
    card.className = "challenge-card";
    card.dataset.challengeId = challenge.challenge_id;
    card.dataset.mediaType = challenge.entry_media_type || state.mediaType;
    const mode = modeMeta(challenge);
    const avatar = clean(challenge.creator_avatar_url)
      ? `<img src="${escapeHtml(challenge.creator_avatar_url)}" alt="" />`
      : `<span>${escapeHtml(initialFor(challenge.creator_display_name))}</span>`;
    const handle = clean(challenge.creator_handle) ? `@${clean(challenge.creator_handle).replace(/^@+/, "")}` : "ARI Circle";
    const entryCount = Number(challenge.entry_count) || 0;
    const memberCount = Number(challenge.member_count) || 0;
    const friendCount = Number(challenge.friend_member_count) || 0;
    const locked = isEntryLocked(challenge);
    const isOwner = challenge.creator_user_id === state.user?.id;
    const typeLabel = challenge.entry_media_type === "video" ? "VIDEO" : "PHOTO";
    const timerLabel = challenge.entry_media_type === "video" ? `${Number(challenge.video_max_seconds) || 30} SEC MAX` : "ONE PHOTO";
    let scoreCopy = `${entryCount} ${entryCount === 1 ? "entry" : "entries"}`;
    if (challenge.challenge_mode === "reaction") scoreCopy = `${Number(challenge.hype_count) || 0} hype · ${scoreCopy}`;
    if (challenge.challenge_mode === "vote") scoreCopy = `${Number(challenge.vote_count) || 0} votes · ${scoreCopy}`;

    card.innerHTML = `
      <div class="challenge-card__visual">
        <div class="challenge-card__media"><div class="challenge-card__media-placeholder"></div></div>
        <div class="challenge-card__visual-shade"></div>
        <div class="challenge-card__visual-top">
          <div class="challenge-card__visual-badges">
            <span class="challenge-visual-pill">${escapeHtml(typeLabel)}</span>
            <span class="challenge-visual-pill is-timer">${escapeHtml(timerLabel)}</span>
          </div>
          <button class="challenge-card__options" type="button" aria-label="Challenge options">•••</button>
        </div>
        <div class="challenge-card__visual-copy">
          <p class="challenge-kicker">${escapeHtml(mode.label.toUpperCase())}</p>
          <h3>${escapeHtml(challenge.title || "Challenge")}</h3>
          ${clean(challenge.description) ? `<p>${escapeHtml(challenge.description)}</p>` : ""}
        </div>
      </div>
      <div class="challenge-card__head">
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">${avatar}</a>
        <a class="challenge-card__identity" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">
          <strong>${escapeHtml(challenge.creator_display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(challenge.starts_at))}</span>
        </a>
        <div class="challenge-card__social"><span><b>${escapeHtml(timeLeft(challenge.ends_at))}</b></span><span>${escapeHtml(scoreCopy)}</span><span>${memberCount} joined</span></div>
      </div>
      ${friendCount ? `<div class="challenge-card__friend-line"><strong>${friendCount}</strong> ${friendCount === 1 ? "friend is" : "friends are"} in this challenge</div>` : ""}
      <div class="challenge-card__actions">
        <button type="button" data-see>See Entries</button>
        <button type="button" class="is-primary ${locked ? "is-entry-submitted" : ""}" data-primary ${locked ? 'aria-disabled="true"' : ""}>${locked ? "Entry Submitted" : "Join Challenge"}</button>
        <button type="button" class="is-share" data-share aria-label="Share challenge">↗</button>
      </div>`;

    card.querySelector("[data-see]")?.addEventListener("click", () => openEntries(challenge));
    card.querySelector("[data-primary]")?.addEventListener("click", () => {
      if (isEntryLocked(challenge)) {
        showToast("Your final entry for this challenge is already submitted.");
        return;
      }
      openEntry(challenge);
    });
    card.querySelector("[data-share]")?.addEventListener("click", () => shareChallenge(challenge));
    card.querySelector(".challenge-card__options")?.addEventListener("click", () => openChallengeOptions(challenge, isOwner));
    observeCardMedia(card, challenge);
    return card;
  }

  function renderChallenges() {
    const host = $("challengeList");
    const empty = $("challengeEmpty");
    const status = $("challengeStatus");
    const loadMore = $("challengeLoadMore");
    if (!host || !empty || !status) return;
    host.replaceChildren();

    if (!state.challenges.length) {
      empty.hidden = false;
      status.textContent = "";
      $("challengeEmptyCopy").textContent = state.filter === "friends"
        ? `No ${state.mediaType === "video" ? "video" : "photo"} challenges from friends are live right now.`
        : `Start the first live ${state.mediaType === "video" ? "video" : "photo"} challenge.`;
      if (loadMore) loadMore.hidden = true;
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.challenges.length} live ${state.mediaType === "video" ? "video" : "photo"} ${state.challenges.length === 1 ? "challenge" : "challenges"}`;
    state.challenges.forEach((challenge) => host.append(createChallengeCard(challenge)));
    if (loadMore) loadMore.hidden = !state.feedHasMore || Boolean(state.loadObserver);
  }

  async function loadChallenges({ reset = false } = {}) {
    if (state.feedLoading || !ageVerified()) return;
    if (!reset && (!state.feedHasMore || state.challenges.length >= MAX_FEED_ITEMS)) return;
    state.feedLoading = true;
    const status = $("challengeStatus");
    if (reset && status) status.textContent = "Loading live challenges…";

    if (reset) {
      state.feedOffset = 0;
      state.feedHasMore = true;
      state.challenges = [];
      if (state.activePreviewVideo) state.activePreviewVideo.pause();
      state.activePreviewVideo = null;
      $("challengeList")?.replaceChildren();
    }

    try {
      const rows = await rpc("ari_circle_challenge_list_v3", {
        requested_media_type: state.mediaType,
        requested_filter: state.filter,
        result_limit: PAGE_SIZE,
        result_offset: state.feedOffset
      });
      const batch = Array.isArray(rows) ? rows : [];
      const existing = new Set(state.challenges.map((item) => clean(item.challenge_id)));
      batch.forEach((row) => {
        if (!existing.has(clean(row.challenge_id))) state.challenges.push(row);
      });
      state.feedOffset += batch.length;
      state.feedHasMore = batch.length === PAGE_SIZE && state.challenges.length < MAX_FEED_ITEMS;
      renderChallenges();
      await handleChallengeDeepLink();
    } catch (error) {
      console.error("Challenge loading failed:", error);
      if (reset) state.challenges = [];
      renderChallenges();
      if (status) status.textContent = error.message || "Challenges are unavailable right now.";
    } finally {
      state.feedLoading = false;
    }
  }

  function updateMediaUrl() {
    try {
      const url = new URL(location.href);
      url.searchParams.set("type", state.mediaType === "video" ? "video" : "photo");
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {}
  }

  function applyMediaTypeUi() {
    document.querySelectorAll("[data-media-tab]").forEach((button) => {
      const active = button.dataset.mediaTab === state.mediaType;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $("challengeStreamTitle").textContent = state.mediaType === "video" ? "Video challenges" : "Photo challenges";
    $("quickChallengeType").textContent = state.mediaType === "video" ? "VIDEO" : "PHOTO";
    document.querySelectorAll("[data-idea]").forEach((button) => {
      button.hidden = button.dataset.mediaType !== state.mediaType;
    });
  }

  async function setMediaType(type, { load = true, updateUrl = true } = {}) {
    const next = type === "video" ? "video" : "image";
    const changed = next !== state.mediaType;
    state.mediaType = next;
    try { sessionStorage.setItem("ari_challenge_media_type", next); } catch {}
    applyMediaTypeUi();
    if (updateUrl) updateMediaUrl();
    state.recentLoadedFor = "";
    $("challengeRecentList")?.replaceChildren();
    if ($("challengeRecentStatus")) $("challengeRecentStatus").textContent = "";
    if (load && (changed || !state.challenges.length)) await loadChallenges({ reset: true });
    if (state.recentVisible) loadRecentChallenges();
  }

  function setFilter(filter) {
    state.filter = ["for-you", "friends", "trending"].includes(filter) ? filter : "for-you";
    document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === state.filter));
    loadChallenges({ reset: true });
  }

  function resetCreateForm() {
    $("createChallengeForm")?.reset();
    if ($("challengeDuration")) $("challengeDuration").value = "24";
    clearPreview("cover");
    syncCreateMediaType();
  }

  function syncCreateMediaType() {
    const mediaType = currentCreateMediaType();
    const videoLength = $("challengeVideoLength");
    if (videoLength) videoLength.hidden = mediaType !== "video";
    const input = $("challengeCoverInput");
    if (input) input.accept = mediaType === "video"
      ? "video/mp4,video/quicktime,video/webm"
      : "image/jpeg,image/png,image/webp,image/heic,image/heif";
    const hint = $("challengeCoverHint");
    if (hint) hint.textContent = mediaType === "video" ? `optional · up to ${currentVideoLimit()} sec` : "optional photo";
    if (state.coverFile && fileKind(state.coverFile) !== mediaType) clearPreview("cover");
  }

  function syncVideoLimitHint() {
    if (currentCreateMediaType() !== "video") return;
    const hint = $("challengeCoverHint");
    if (hint) hint.textContent = `optional · up to ${currentVideoLimit()} sec`;
    if (state.coverFile && fileKind(state.coverFile) === "video") {
      videoDuration(state.coverFile).then((duration) => {
        if (duration > currentVideoLimit() + .5) {
          clearPreview("cover");
          showToast(`Cover video removed because the new limit is ${currentVideoLimit()} seconds.`);
        }
      });
    }
  }

  function openCreate(prefill = null) {
    if (!ageVerified()) return openDialog("ageDialog");
    resetCreateForm();
    const requestedType = prefill?.mediaType === "video" ? "video" : prefill?.mediaType === "image" ? "image" : state.mediaType;
    const typeRadio = document.querySelector(`input[name="challengeMediaType"][value="${requestedType}"]`);
    if (typeRadio) typeRadio.checked = true;
    if (prefill?.title) $("challengeName").value = prefill.title;
    if (prefill?.mode) {
      const modeRadio = document.querySelector(`input[name="challengeMode"][value="${prefill.mode}"]`);
      if (modeRadio) modeRadio.checked = true;
    }
    if (prefill?.hours) $("challengeDuration").value = String(prefill.hours);
    if (requestedType === "video" && VIDEO_LIMITS.includes(Number(prefill?.videoSeconds))) {
      const secondsRadio = document.querySelector(`input[name="challengeVideoSeconds"][value="${Number(prefill.videoSeconds)}"]`);
      if (secondsRadio) secondsRadio.checked = true;
    }
    syncCreateMediaType();
    openDialog("createChallengeDialog");
  }

  async function createChallenge(event) {
    event.preventDefault();
    if (state.busy) return;
    const title = clean($("challengeName")?.value);
    const description = clean($("challengeDescription")?.value);
    const mode = clean(document.querySelector('input[name="challengeMode"]:checked')?.value) || "participate";
    const mediaType = currentCreateMediaType();
    const videoSeconds = mediaType === "video" ? currentVideoLimit() : null;
    const hours = Number($("challengeDuration")?.value) || 24;
    let uploaded = null;

    state.busy = true;
    $("createChallengeButton").disabled = true;
    try {
      if (state.coverFile) {
        const checked = await validateMedia(state.coverFile, { expectedKind: mediaType, maxVideoSeconds: videoSeconds || 30 });
        if (!checked.ok) return;
        uploaded = await uploadMedia(state.coverFile, "cover");
      }
      const challengeId = await rpc("ari_circle_challenge_create_v3", {
        requested_title: title,
        requested_description: description || null,
        requested_mode: mode,
        requested_hours: hours,
        requested_entry_media_type: mediaType,
        requested_video_max_seconds: videoSeconds,
        requested_cover_media_path: uploaded?.path || null,
        requested_cover_media_type: uploaded?.type || null
      });

      closeDialog("createChallengeDialog");
      resetCreateForm();
      await setMediaType(mediaType, { load: false, updateUrl: true });
      showToast("Challenge created. Add your one final entry.");
      await loadChallenges({ reset: true });
      const created = state.challenges.find((item) => item.challenge_id === challengeId)
        || (await fetchChallenge(challengeId));
      if (created) window.setTimeout(() => openEntry(created), 170);
    } catch (error) {
      console.error("Challenge creation failed:", error);
      if (uploaded?.path) state.client.storage.from(MEDIA_BUCKET).remove([uploaded.path]).catch(() => {});
      showToast(error.message || "Could not create challenge.", 4600);
    } finally {
      state.busy = false;
      $("createChallengeButton").disabled = false;
    }
  }

  function configureEntryPicker(challenge) {
    const video = challenge.entry_media_type === "video";
    const limit = Number(challenge.video_max_seconds) || 30;
    const input = $("challengeEntryMediaInput");
    if (input) input.accept = video
      ? "video/mp4,video/quicktime,video/webm"
      : "image/jpeg,image/png,image/webp,image/heic,image/heif";

    const rule = $("entryMediaRule");
    if (rule) rule.textContent = video ? `VIDEO ONLY · ${limit} SEC MAX` : "PHOTO ONLY · ONE PHOTO";

    const record = $("recordChallengeEntryVideo");
    const nativeRecorder = Boolean(video && window.AriChallengeVideoRecorder?.canUse?.());
    if (record) record.hidden = !nativeRecorder;

    const picker = $("pickChallengeEntryMedia");
    const pickerStrong = picker?.querySelector("strong");
    if (pickerStrong) pickerStrong.textContent = nativeRecorder ? "Library" : "Camera / Library";
    const hint = $("entryPickerHint");
    if (hint) hint.textContent = video ? `Choose one video · ${limit}s max` : "Choose one photo";
  }

  function openEntry(challenge) {
    if (!challenge) return;
    if (new Date(challenge.ends_at).getTime() <= Date.now()) {
      showToast("This challenge has ended. You can still view the results.");
      return;
    }
    if (isEntryLocked(challenge)) {
      showToast("Your final entry for this challenge is already submitted.");
      return;
    }
    state.activeChallenge = challenge;
    clearPreview("entry");
    $("challengeEntryCaption").value = "";
    $("entryChallengeTitle").textContent = challenge.title || "Join the challenge";
    $("entryChallengePrompt").textContent = modeMeta(challenge).copy;
    $("submitChallengeEntry").textContent = "Submit Final Entry";
    configureEntryPicker(challenge);
    openDialog("entryDialog");
  }

  async function openNativeRecorder() {
    const challenge = state.activeChallenge;
    if (!challenge || challenge.entry_media_type !== "video") return;
    const recorder = window.AriChallengeVideoRecorder;
    if (!recorder?.canUse?.()) {
      $("challengeEntryMediaInput")?.click();
      return;
    }
    const opened = await recorder.open({
      limitSeconds: Number(challenge.video_max_seconds) || 30,
      onUse: (file) => previewFile(file, "entry", challenge),
      onError: () => showToast("The native recorder could not start. Use your Library instead.")
    });
    if (!opened) $("challengeEntryMediaInput")?.click();
  }

  async function submitEntry(event) {
    event.preventDefault();
    const challenge = state.activeChallenge;
    if (!challenge || state.busy) return;
    if (isEntryLocked(challenge)) return showToast("Your final entry is already submitted.");
    if (!state.entryFile) return showToast(challenge.entry_media_type === "video" ? "Add your challenge video first." : "Add your challenge photo first.");

    const checked = await validateMedia(state.entryFile, {
      expectedKind: challenge.entry_media_type,
      maxVideoSeconds: Number(challenge.video_max_seconds) || 30
    });
    if (!checked.ok) return;
    if (challenge.entry_media_type === "video") state.entryDurationSeconds = checked.duration;

    const caption = clean($("challengeEntryCaption")?.value);
    let uploaded = null;
    state.busy = true;
    $("submitChallengeEntry").disabled = true;
    try {
      uploaded = await uploadMedia(state.entryFile, "entry");
      await rpc("ari_circle_challenge_submit_entry_v3", {
        requested_challenge_id: challenge.challenge_id,
        requested_caption: caption || null,
        requested_media_path: uploaded.path,
        requested_media_type: uploaded.type,
        requested_media_duration_seconds: challenge.entry_media_type === "video" ? state.entryDurationSeconds : null
      });
      closeDialog("entryDialog");
      clearPreview("entry");
      showToast("Final entry submitted.");
      await loadChallenges({ reset: true });
      const refreshed = state.challenges.find((item) => item.challenge_id === challenge.challenge_id) || { ...challenge, viewer_has_entry: true };
      window.setTimeout(() => openEntries(refreshed), 150);
    } catch (error) {
      console.error("Challenge entry failed:", error);
      if (uploaded?.path) state.client.storage.from(MEDIA_BUCKET).remove([uploaded.path]).catch(() => {});
      showToast(error.message || "Could not submit your entry.", 4700);
    } finally {
      state.busy = false;
      $("submitChallengeEntry").disabled = false;
    }
  }

  async function openEntries(challenge) {
    state.activeChallenge = challenge;
    $("entriesTitle").textContent = challenge.title || "Challenge entries";
    $("entriesKicker").textContent = modeMeta(challenge).label.toUpperCase();
    $("entriesStatus").textContent = "Loading entries…";
    $("challengeEntryList").replaceChildren();
    $("challengeEntriesEmpty").hidden = true;
    openDialog("entriesDialog");
    document.dispatchEvent(new CustomEvent("ari:challenge-entries-opened", { detail: { challengeId: challenge.challenge_id } }));
    await loadEntries(challenge);
  }

  async function loadEntries(challenge = state.activeChallenge) {
    if (!challenge) return;
    try {
      const data = await rpc("ari_circle_challenge_entry_list", {
        requested_challenge_id: challenge.challenge_id,
        result_limit: 30
      });
      state.activeEntries = Array.isArray(data) ? data : [];
      renderEntries(challenge);
    } catch (error) {
      console.error("Challenge entries failed:", error);
      $("entriesStatus").textContent = error.message || "Entries are unavailable right now.";
    }
  }

  function renderEntries(challenge) {
    const host = $("challengeEntryList");
    const empty = $("challengeEntriesEmpty");
    if (!host || !empty) return;
    host.replaceChildren();
    $("entriesStatus").textContent = state.activeEntries.length
      ? `${state.activeEntries.length}${state.activeEntries.length === 30 ? "+" : ""} ${state.activeEntries.length === 1 ? "entry" : "entries"}`
      : "";
    if (!state.activeEntries.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    state.activeEntries.forEach((entry) => host.append(createEntryCard(entry, challenge)));
  }

  function createEntryCard(entry, challenge) {
    const item = document.createElement("article");
    item.className = "challenge-entry-item";
    const avatar = clean(entry.avatar_url)
      ? `<img src="${escapeHtml(entry.avatar_url)}" alt="" />`
      : `<span>${escapeHtml(initialFor(entry.display_name))}</span>`;
    const handle = clean(entry.handle) ? `@${clean(entry.handle).replace(/^@+/, "")}` : "ARI Circle";
    const mine = entry.user_id === state.user?.id;
    item.innerHTML = `
      ${clean(entry.media_path) ? '<div class="challenge-entry-item__media" data-entry-media><div class="challenge-card__media-placeholder"></div></div>' : ""}
      <div class="challenge-entry-item__head">
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(entry.user_id)}">${avatar}</a>
        <a href="ari-circle.html?user=${encodeURIComponent(entry.user_id)}"><strong>${escapeHtml(entry.display_name || "ARI User")}</strong><span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(entry.created_at))}</span></a>
        ${mine ? '<button class="challenge-entry-delete" type="button">Delete</button>' : ""}
      </div>
      ${clean(entry.caption) ? `<p class="challenge-entry-item__caption">${escapeHtml(entry.caption)}</p>` : ""}
      <div class="challenge-entry-item__actions">
        <button type="button" data-hype class="${entry.viewer_hyped ? "is-active" : ""}">Hype · ${Number(entry.hype_count) || 0}</button>
        ${challenge.challenge_mode === "vote" ? `<button type="button" data-vote class="${entry.viewer_voted ? "is-active" : ""}">${entry.viewer_voted ? "Voted" : "Vote"} · ${Number(entry.vote_count) || 0}</button>` : '<button type="button" disabled>Entry</button>'}
      </div>`;

    item.querySelector("[data-hype]")?.addEventListener("click", () => toggleHype(entry));
    item.querySelector("[data-vote]")?.addEventListener("click", () => voteEntry(entry, challenge));
    item.querySelector(".challenge-entry-delete")?.addEventListener("click", () => deleteEntry(entry, challenge));
    if (clean(entry.media_path)) {
      state.entryMap.set(item, entry);
      if (state.entryMediaObserver) state.entryMediaObserver.observe(item);
      else hydrateEntryMedia(item, entry);
    }
    return item;
  }

  async function hydrateEntryMedia(item, entry) {
    if (!item || item.dataset.entryMediaHydrated === "true" || !clean(entry.media_path)) return;
    item.dataset.entryMediaHydrated = "true";
    const url = await signedUrl(entry.media_path);
    if (!url || !item.isConnected) return;
    const host = item.querySelector("[data-entry-media]");
    if (!host) return;
    const media = entry.media_type === "video" ? document.createElement("video") : document.createElement("img");
    media.src = url;
    if (entry.media_type === "video") {
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media.alt = "Challenge entry";
      media.loading = "lazy";
      media.decoding = "async";
    }
    host.replaceChildren(media);
  }

  async function toggleHype(entry) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_toggle_hype", { requested_entry_id: entry.entry_id });
      await Promise.all([loadEntries(), loadChallenges({ reset: true })]);
    } catch (error) {
      showToast(error.message || "Could not hype that entry.", 4100);
    } finally {
      state.busy = false;
    }
  }

  async function voteEntry(entry, challenge) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_vote", {
        requested_challenge_id: challenge.challenge_id,
        requested_entry_id: entry.entry_id
      });
      await Promise.all([loadEntries(challenge), loadChallenges({ reset: true })]);
    } catch (error) {
      showToast(error.message || "Could not vote for that entry.", 4100);
    } finally {
      state.busy = false;
    }
  }

  async function deleteEntry(entry, challenge) {
    if (!confirm("Delete your final challenge entry? You will not be able to submit another entry for this challenge.")) return;
    try {
      const path = await rpc("ari_circle_challenge_delete_entry", { requested_entry_id: entry.entry_id });
      if (path) await state.client.storage.from(MEDIA_BUCKET).remove([path]).catch(() => {});
      showToast("Entry deleted. Your challenge entry slot remains used.");
      await Promise.all([loadEntries(challenge), loadChallenges({ reset: true })]);
    } catch (error) {
      showToast(error.message || "Could not delete entry.", 4200);
    }
  }

  async function shareChallenge(challenge) {
    const url = new URL("ari-circle-challenges.html", location.href);
    url.searchParams.set("challenge", challenge.challenge_id);
    url.searchParams.set("type", challenge.entry_media_type === "video" ? "video" : "photo");
    const shareData = {
      title: challenge.title || "ARI Circle Challenge",
      text: clean(challenge.description) || `Join this ${challenge.entry_media_type === "video" ? "video" : "photo"} challenge on ARI Circle.`,
      url: url.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url.href);
        showToast("Challenge link copied.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Could not share this challenge.");
    }
  }

  function openChallengeOptions(challenge, isOwner) {
    state.activeChallenge = challenge;
    $("cancelChallengeButton").hidden = !isOwner || new Date(challenge.ends_at).getTime() <= Date.now();
    openDialog("challengeOptionsDialog");
  }

  async function cancelChallenge() {
    const challenge = state.activeChallenge;
    if (!challenge || !confirm("Cancel this challenge?")) return;
    try {
      await rpc("ari_circle_challenge_cancel", { requested_challenge_id: challenge.challenge_id });
      closeDialog("challengeOptionsDialog");
      showToast("Challenge canceled.");
      await loadChallenges({ reset: true });
    } catch (error) {
      showToast(error.message || "Could not cancel challenge.", 4300);
    }
  }

  async function fetchChallenge(challengeId) {
    try {
      const data = await rpc("ari_circle_challenge_get_v1", { requested_challenge_id: challengeId });
      if (Array.isArray(data)) return data[0] || null;
      return data || null;
    } catch (error) {
      console.warn("Challenge deep link unavailable:", error);
      return null;
    }
  }

  async function handleChallengeDeepLink() {
    if (state.deepLinkHandled) return;
    const id = clean(new URLSearchParams(location.search).get("challenge"));
    if (!id) {
      state.deepLinkHandled = true;
      return;
    }
    let challenge = state.challenges.find((item) => item.challenge_id === id) || null;
    if (!challenge) challenge = await fetchChallenge(id);
    state.deepLinkHandled = true;
    if (!challenge) return;
    if (challenge.entry_media_type && challenge.entry_media_type !== state.mediaType) {
      await setMediaType(challenge.entry_media_type, { load: true, updateUrl: false });
    }
    window.setTimeout(() => openEntries(challenge), 120);
  }

  function recentResultCopy(challenge) {
    const entries = Number(challenge.entry_count) || 0;
    if (challenge.challenge_mode === "reaction") return `${Number(challenge.hype_count) || 0} hype · ${entries} ${entries === 1 ? "entry" : "entries"}`;
    if (challenge.challenge_mode === "vote") return `${Number(challenge.vote_count) || 0} votes · ${entries} ${entries === 1 ? "entry" : "entries"}`;
    return `${entries} ${entries === 1 ? "entry" : "entries"} · ${Number(challenge.member_count) || 0} joined`;
  }

  function createRecentCard(challenge) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "challenge-recent-card";
    card.innerHTML = `
      <div class="challenge-recent-card__media" data-recent-media></div>
      <div class="challenge-recent-card__shade"></div>
      <div class="challenge-recent-card__body">
        <small>CHALLENGE COMPLETE</small>
        <strong>${escapeHtml(challenge.title || "Challenge")}</strong>
        <span>${escapeHtml(endedAgo(challenge.ends_at))} · ${escapeHtml(recentResultCopy(challenge))}</span>
      </div>`;
    card.addEventListener("click", () => openEntries(challenge));
    if (clean(challenge.cover_media_path)) {
      signedUrl(challenge.cover_media_path).then((url) => {
        if (!url || !card.isConnected) return;
        const host = card.querySelector("[data-recent-media]");
        if (!host) return;
        const media = challenge.cover_media_type === "video" ? document.createElement("video") : document.createElement("img");
        media.src = url;
        if (challenge.cover_media_type === "video") {
          media.muted = true;
          media.playsInline = true;
          media.preload = "metadata";
        } else {
          media.alt = "";
          media.loading = "lazy";
        }
        host.replaceChildren(media);
      });
    }
    return card;
  }

  async function loadRecentChallenges() {
    if (!ageVerified() || state.recentLoading || state.recentLoadedFor === state.mediaType) return;
    state.recentLoading = true;
    const status = $("challengeRecentStatus");
    if (status) status.textContent = "Loading recent results…";
    try {
      const data = await rpc("ari_circle_challenge_recent_v1", {
        requested_media_type: state.mediaType,
        result_limit: 4
      });
      const rows = Array.isArray(data) ? data : [];
      const host = $("challengeRecentList");
      host?.replaceChildren();
      rows.forEach((challenge) => host?.append(createRecentCard(challenge)));
      state.recentLoadedFor = state.mediaType;
      if (status) status.textContent = rows.length ? "" : "No challenges ended in the last 48 hours.";
    } catch (error) {
      console.warn("Recent challenge results unavailable:", error);
      if (status) status.textContent = "Recent results are unavailable right now.";
    } finally {
      state.recentLoading = false;
    }
  }

  function setupObservers() {
    ensureMediaObservers();

    const sentinel = $("challengeLoadSentinel");
    if (sentinel && "IntersectionObserver" in window && !state.loadObserver) {
      state.loadObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadChallenges({ reset: false });
      }, { rootMargin: "800px 0px" });
      state.loadObserver.observe(sentinel);
    }

    const recent = $("challengeRecentSection");
    if (recent && "IntersectionObserver" in window && !state.recentObserver) {
      state.recentObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        state.recentVisible = Boolean(entry?.isIntersecting);
        if (state.recentVisible) loadRecentChallenges();
      }, { rootMargin: "500px 0px" });
      state.recentObserver.observe(recent);
    } else if (recent) {
      state.recentVisible = true;
      loadRecentChallenges();
    }
  }

  function bindSwipe() {
    const surface = $("challengeSwipeSurface");
    if (!surface) return;
    surface.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      state.swipeStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    }, { passive: true });

    surface.addEventListener("touchend", (event) => {
      const start = state.swipeStart;
      state.swipeStart = null;
      if (!start || !event.changedTouches?.length) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const elapsed = performance.now() - start.time;
      if (elapsed > 750 || Math.abs(dx) < 68 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (dx < 0 && state.mediaType === "image") setMediaType("video");
      else if (dx > 0 && state.mediaType === "video") setMediaType("image");
    }, { passive: true });
  }

  function bindUi() {
    [$("openCreateChallenge"), $("emptyCreateChallenge")].filter(Boolean).forEach((button) => button.addEventListener("click", () => openCreate()));
    $("ageForm")?.addEventListener("submit", verifyAge);
    $("createChallengeForm")?.addEventListener("submit", createChallenge);
    $("entryForm")?.addEventListener("submit", submitEntry);
    $("pickChallengeCover")?.addEventListener("click", () => $("challengeCoverInput")?.click());
    $("pickChallengeEntryMedia")?.addEventListener("click", () => $("challengeEntryMediaInput")?.click());
    $("recordChallengeEntryVideo")?.addEventListener("click", openNativeRecorder);
    $("challengeLoadMore")?.addEventListener("click", () => loadChallenges({ reset: false }));

    $("challengeCoverInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) previewFile(file, "cover");
      event.target.value = "";
    });
    $("challengeEntryMediaInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) previewFile(file, "entry", state.activeChallenge);
      event.target.value = "";
    });
    $("removeChallengeCover")?.addEventListener("click", () => clearPreview("cover"));
    $("removeChallengeEntryMedia")?.addEventListener("click", () => clearPreview("entry"));
    $("cancelChallengeButton")?.addEventListener("click", cancelChallenge);
    $("shareChallengeButton")?.addEventListener("click", () => state.activeChallenge && shareChallenge(state.activeChallenge));

    document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));
    document.querySelectorAll("[data-media-tab]").forEach((button) => button.addEventListener("click", () => setMediaType(button.dataset.mediaTab)));
    document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
    document.querySelectorAll("[data-idea]").forEach((button) => button.addEventListener("click", () => openCreate({
      title: button.dataset.idea,
      mode: button.dataset.mode,
      hours: Number(button.dataset.hours),
      mediaType: button.dataset.mediaType,
      videoSeconds: Number(button.dataset.videoSeconds)
    })));
    document.querySelectorAll('input[name="challengeMediaType"]').forEach((radio) => radio.addEventListener("change", syncCreateMediaType));
    document.querySelectorAll('input[name="challengeVideoSeconds"]').forEach((radio) => radio.addEventListener("change", syncVideoLimitHint));

    $("createChallengeDialog")?.addEventListener("close", () => clearPreview("cover"));
    $("entryDialog")?.addEventListener("close", () => {
      clearPreview("entry");
      window.AriChallengeVideoRecorder?.close?.();
    });
    $("entriesDialog")?.addEventListener("close", () => {
      state.activeEntries = [];
      $("challengeEntryList")?.replaceChildren();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.activePreviewVideo) state.activePreviewVideo.pause();
    });

    bindSwipe();
  }

  function initialMediaType() {
    const query = clean(new URLSearchParams(location.search).get("type")).toLowerCase();
    if (query === "video") return "video";
    if (query === "photo" || query === "image") return "image";
    try {
      return sessionStorage.getItem("ari_challenge_media_type") === "video" ? "video" : "image";
    } catch {
      return "image";
    }
  }

  async function init() {
    const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!client) {
      $("challengeLoading").innerHTML = "<strong>ARI Circle data is unavailable.</strong>";
      return;
    }
    state.client = client;
    state.mediaType = initialMediaType();
    bindUi();
    setupObservers();
    applyMediaTypeUi();
    syncCreateMediaType();

    try {
      if (!await requireUser()) return;
      await loadAge();
      $("challengePage").hidden = false;
      $("challengeLoading").hidden = true;
      if (!ageVerified()) {
        openDialog("ageDialog");
        return;
      }
      await loadChallenges({ reset: true });
    } catch (error) {
      console.error("ARI Circle Challenges boot failed:", error);
      $("challengeLoading").innerHTML = `<strong>${escapeHtml(error.message || "Challenges could not open.")}</strong>`;
    }
  }

  window.AriCircleChallenges = Object.freeze({
    version: VERSION,
    refresh: () => loadChallenges({ reset: true }),
    setMediaType
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
