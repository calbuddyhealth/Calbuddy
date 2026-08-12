/* ARI CIRCLE — SOCIAL CHALLENGES v2.0.0 */
(() => {
  "use strict";

  const VERSION = "2.0.0";
  const MEDIA_BUCKET = "ari-circle-challenge-media";
  const MAX_VIDEO_SECONDS = 30;
  const $ = (id) => document.getElementById(id);

  const MODE_META = Object.freeze({
    participate: { label: "Join the fun", icon: "✨", copy: "Post an entry and be part of it." },
    reaction: { label: "Most hype wins", icon: "🔥", copy: "Hype the entries you love." },
    vote: { label: "Vote for a winner", icon: "🏆", copy: "Everyone gets one vote." },
    goal: { label: "Goal challenge", icon: "⚡", copy: "Track progress together." }
  });

  const state = {
    client: null,
    user: null,
    age: null,
    challenges: [],
    filter: "for-you",
    activeChallenge: null,
    activeEntries: [],
    coverFile: null,
    coverPreviewUrl: null,
    entryFile: null,
    entryPreviewUrl: null,
    busy: false,
    toastTimer: null,
    deepLinkHandled: false
  };

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function showToast(message, duration = 3200) {
    const toast = $("challengeToast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
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

  function ageBand() {
    const value = state.age;
    if (!value) return "";
    if (Array.isArray(value)) return clean(value[0]?.age_band || value[0]?.band);
    return clean(value.age_band || value.band);
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
      await loadChallenges();
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
    const hours = Math.ceil(ms / 3600000);
    if (hours < 24) return `${hours}h left`;
    const days = Math.ceil(hours / 24);
    return `${days}d left`;
  }

  function fileKind(file) {
    const type = clean(file?.type).toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    return "";
  }

  async function videoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = Number(video.duration) || 0;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      video.src = url;
    });
  }

  async function validateMedia(file) {
    if (!file) return false;
    const kind = fileKind(file);
    if (!kind) {
      showToast("Choose a photo or short video.");
      return false;
    }
    const maxBytes = kind === "video" ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(kind === "video" ? "Keep videos under 50 MB." : "Keep photos under 15 MB.");
      return false;
    }
    if (kind === "video") {
      const duration = await videoDuration(file);
      if (duration > MAX_VIDEO_SECONDS + .5) {
        showToast(`Keep challenge videos to ${MAX_VIDEO_SECONDS} seconds or less.`);
        return false;
      }
    }
    return true;
  }

  function clearPreview(which) {
    const isCover = which === "cover";
    const key = isCover ? "coverPreviewUrl" : "entryPreviewUrl";
    if (state[key]) URL.revokeObjectURL(state[key]);
    state[key] = null;
    state[isCover ? "coverFile" : "entryFile"] = null;
    const host = $(isCover ? "challengeCoverPreviewStage" : "challengeEntryPreviewStage");
    host?.replaceChildren();
    const wrap = $(isCover ? "challengeCoverPreview" : "challengeEntryPreview");
    if (wrap) wrap.hidden = true;
  }

  async function previewFile(file, which) {
    if (!await validateMedia(file)) return;
    clearPreview(which);
    const isCover = which === "cover";
    const kind = fileKind(file);
    const url = URL.createObjectURL(file);
    state[isCover ? "coverFile" : "entryFile"] = file;
    state[isCover ? "coverPreviewUrl" : "entryPreviewUrl"] = url;
    const host = $(isCover ? "challengeCoverPreviewStage" : "challengeEntryPreviewStage");
    const wrap = $(isCover ? "challengeCoverPreview" : "challengeEntryPreview");
    if (!host || !wrap) return;
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

  async function hydrateChallengeMedia(rows) {
    await Promise.all(rows.map(async (row) => {
      row.cover_media_url = row.cover_media_path ? await signedUrl(row.cover_media_path) : "";
    }));
    return rows;
  }

  function scoreChallenge(challenge) {
    return (Number(challenge.entry_count) || 0) * 5
      + (Number(challenge.hype_count) || 0) * 2
      + (Number(challenge.vote_count) || 0) * 3
      + (Number(challenge.member_count) || 0)
      + (Number(challenge.friend_member_count) || 0) * 4;
  }

  function filteredChallenges() {
    let rows = [...state.challenges];
    if (state.filter === "friends") {
      rows = rows.filter((item) => item.creator_is_friend || Number(item.friend_member_count) > 0);
      rows.sort((a, b) => Number(b.friend_member_count || 0) - Number(a.friend_member_count || 0) || scoreChallenge(b) - scoreChallenge(a));
    } else if (state.filter === "trending") {
      rows.sort((a, b) => scoreChallenge(b) - scoreChallenge(a) || new Date(b.starts_at) - new Date(a.starts_at));
    } else {
      rows.sort((a, b) => {
        const socialA = (a.creator_is_friend ? 12 : 0) + Number(a.friend_member_count || 0) * 4 + scoreChallenge(a);
        const socialB = (b.creator_is_friend ? 12 : 0) + Number(b.friend_member_count || 0) * 4 + scoreChallenge(b);
        return socialB - socialA || new Date(b.starts_at) - new Date(a.starts_at);
      });
    }
    return rows;
  }

  async function loadChallenges() {
    const status = $("challengeStatus");
    if (status) status.textContent = "Loading challenges…";
    try {
      const data = await rpc("ari_circle_challenge_list_v2", { result_limit: 70 });
      state.challenges = Array.isArray(data) ? data : [];
      await hydrateChallengeMedia(state.challenges);
      renderChallenges();
      handleChallengeDeepLink();
    } catch (error) {
      console.error("Challenge loading failed:", error);
      state.challenges = [];
      renderChallenges();
      if (status) status.textContent = error.message || "Challenges unavailable right now.";
    }
  }

  function renderChallenges() {
    const host = $("challengeList");
    const empty = $("challengeEmpty");
    const status = $("challengeStatus");
    const copy = $("challengeStreamCopy");
    if (!host || !empty || !status) return;
    host.replaceChildren();

    const rows = filteredChallenges();
    if (state.filter === "friends" && copy) copy.textContent = "Challenges your friends created or joined.";
    else if (state.filter === "trending" && copy) copy.textContent = "The challenges getting the most action.";
    else if (copy) copy.textContent = "A mix of friends, fresh challenges, and what’s getting attention.";

    if (!rows.length) {
      empty.hidden = false;
      status.textContent = "";
      $("challengeEmptyCopy").textContent = state.filter === "friends"
        ? "Your friends haven’t joined anything here yet. Start one and invite them."
        : "Start something people will want to join.";
      return;
    }

    empty.hidden = true;
    status.textContent = `${rows.length} happening now`;
    rows.forEach((challenge) => host.append(createChallengeCard(challenge)));
  }

  function mediaMarkup(challenge) {
    const url = clean(challenge.cover_media_url);
    if (!url) return "";
    if (challenge.cover_media_type === "video") {
      return `<div class="challenge-card__media"><video src="${escapeHtml(url)}" muted playsinline loop controls preload="metadata"></video></div>`;
    }
    return `<div class="challenge-card__media"><img src="${escapeHtml(url)}" alt="" loading="lazy" /></div>`;
  }

  function createChallengeCard(challenge) {
    const card = document.createElement("article");
    card.className = "challenge-card";
    card.dataset.challengeId = challenge.challenge_id;
    const mode = MODE_META[challenge.challenge_mode] || MODE_META.participate;
    const avatar = clean(challenge.creator_avatar_url)
      ? `<img src="${escapeHtml(challenge.creator_avatar_url)}" alt="" />`
      : `<span>${escapeHtml(initialFor(challenge.creator_display_name))}</span>`;
    const handle = clean(challenge.creator_handle) ? `@${clean(challenge.creator_handle).replace(/^@+/, "")}` : "ARI Circle";
    const memberCount = Number(challenge.member_count) || 0;
    const entryCount = Number(challenge.entry_count) || 0;
    const friendCount = Number(challenge.friend_member_count) || 0;
    const hot = scoreChallenge(challenge) >= 14;
    const isOwner = challenge.creator_user_id === state.user?.id;
    const progress = Number(challenge.viewer_progress) || 0;
    const goal = Math.max(1, Number(challenge.goal_value) || 1);
    const percent = Math.min(100, Math.max(0, (progress / goal) * 100));

    let socialMetric = `${memberCount} joined`;
    if (challenge.challenge_mode === "reaction") socialMetric += ` · ${Number(challenge.hype_count) || 0} hype`;
    if (challenge.challenge_mode === "vote") socialMetric += ` · ${Number(challenge.vote_count) || 0} votes`;
    if (entryCount) socialMetric += ` · ${entryCount} ${entryCount === 1 ? "entry" : "entries"}`;

    const primaryLabel = challenge.challenge_mode === "goal"
      ? (challenge.viewer_joined ? "Add Progress" : "Join Challenge")
      : (challenge.viewer_has_entry ? "Update Entry" : "Post Entry");

    card.innerHTML = `
      ${mediaMarkup(challenge)}
      <div class="challenge-card__head">
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">${avatar}</a>
        <a class="challenge-card__identity" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">
          <strong>${escapeHtml(challenge.creator_display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(challenge.starts_at))}</span>
        </a>
        <button class="challenge-card__options" type="button" aria-label="Challenge options">•••</button>
      </div>
      <div class="challenge-card__body">
        <div class="challenge-card__eyebrow">
          <span class="challenge-pill">${mode.icon} ${escapeHtml(mode.label)}</span>
          ${hot ? '<span class="challenge-pill is-hot">🔥 Trending</span>' : ""}
          ${friendCount ? `<span class="challenge-pill is-friend">${friendCount} ${friendCount === 1 ? "friend" : "friends"} joined</span>` : ""}
        </div>
        <h3>${escapeHtml(challenge.title || "Challenge")}</h3>
        ${clean(challenge.description) ? `<p class="challenge-card__description">${escapeHtml(challenge.description)}</p>` : ""}
        <div class="challenge-card__social">
          <span><strong>${escapeHtml(timeLeft(challenge.ends_at))}</strong></span>
          <span>${escapeHtml(socialMetric)}</span>
        </div>
        ${challenge.challenge_mode === "goal" && challenge.viewer_joined ? `
          <div class="challenge-card__progress">
            <div class="challenge-progress__line"><span>Your progress</span><span>${escapeHtml(String(progress))} / ${escapeHtml(String(goal))} ${escapeHtml(challenge.unit_label || "times")}</span></div>
            <div class="challenge-progress__track"><div class="challenge-progress__fill" style="width:${percent}%"></div></div>
          </div>` : ""}
      </div>
      <div class="challenge-card__actions">
        <button type="button" data-see>${challenge.challenge_mode === "goal" ? "Leaderboard" : "See Entries"}</button>
        <button type="button" class="is-primary" data-primary>${escapeHtml(primaryLabel)}</button>
        <button type="button" class="is-share" data-share aria-label="Share challenge">↗</button>
      </div>`;

    card.querySelector("[data-see]")?.addEventListener("click", () => {
      if (challenge.challenge_mode === "goal") openLeaderboard(challenge);
      else openEntries(challenge);
    });
    card.querySelector("[data-primary]")?.addEventListener("click", () => {
      if (challenge.challenge_mode === "goal") {
        if (challenge.viewer_joined) openProgress(challenge);
        else joinChallenge(challenge);
      } else {
        openEntry(challenge);
      }
    });
    card.querySelector("[data-share]")?.addEventListener("click", () => shareChallenge(challenge));
    card.querySelector(".challenge-card__options")?.addEventListener("click", () => openChallengeOptions(challenge, isOwner));
    return card;
  }

  function openCreate(prefill = null) {
    if (!state.age?.verified) return openDialog("ageDialog");
    if (prefill) {
      $("challengeName").value = prefill.title || "";
      const radio = document.querySelector(`input[name="challengeMode"][value="${prefill.mode || "participate"}"]`);
      if (radio) radio.checked = true;
      if (prefill.hours) $("challengeDuration").value = String(prefill.hours);
      syncModeFields();
    }
    openDialog("createChallengeDialog");
  }

  function syncModeFields() {
    const mode = clean(document.querySelector('input[name="challengeMode"]:checked')?.value) || "participate";
    const goalFields = $("challengeGoalFields");
    if (goalFields) goalFields.hidden = mode !== "goal";
  }

  async function createChallenge(event) {
    event.preventDefault();
    if (state.busy) return;
    const title = clean($("challengeName")?.value);
    const description = clean($("challengeDescription")?.value);
    const mode = clean(document.querySelector('input[name="challengeMode"]:checked')?.value) || "participate";
    const hours = Number($("challengeDuration")?.value) || 24;
    let uploaded = null;
    state.busy = true;
    $("createChallengeButton").disabled = true;
    try {
      if (state.coverFile) uploaded = await uploadMedia(state.coverFile, "cover");
      const challengeId = await rpc("ari_circle_challenge_create_v2", {
        requested_title: title,
        requested_description: description || null,
        requested_mode: mode,
        requested_hours: hours,
        requested_cover_media_path: uploaded?.path || null,
        requested_cover_media_type: uploaded?.type || null,
        requested_goal_value: mode === "goal" ? Number($("challengeGoal")?.value) : null,
        requested_unit_label: mode === "goal" ? clean($("challengeUnit")?.value) : null
      });
      closeDialog("createChallengeDialog");
      resetCreateForm();
      showToast("Challenge created. Let’s see who joins 👀");
      await loadChallenges();
      const created = state.challenges.find((item) => item.challenge_id === challengeId);
      if (created && created.challenge_mode !== "goal") setTimeout(() => openEntry(created), 180);
    } catch (error) {
      console.error("Challenge creation failed:", error);
      if (uploaded?.path) state.client.storage.from(MEDIA_BUCKET).remove([uploaded.path]).catch(() => {});
      showToast(error.message || "Could not create challenge.", 4500);
    } finally {
      state.busy = false;
      $("createChallengeButton").disabled = false;
    }
  }

  function resetCreateForm() {
    $("createChallengeForm")?.reset();
    $("challengeDuration").value = "24";
    $("challengeGoal").value = "7";
    $("challengeUnit").value = "times";
    clearPreview("cover");
    syncModeFields();
  }

  async function joinChallenge(challenge) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_join", { requested_challenge_id: challenge.challenge_id });
      showToast("You’re in. Game on.");
      await loadChallenges();
    } catch (error) {
      showToast(error.message || "Could not join challenge.", 4300);
    } finally {
      state.busy = false;
    }
  }

  function openEntry(challenge) {
    state.activeChallenge = challenge;
    clearPreview("entry");
    $("challengeEntryCaption").value = "";
    $("entryChallengeTitle").textContent = challenge.title || "Join the challenge";
    $("entryChallengePrompt").textContent = MODE_META[challenge.challenge_mode]?.copy || "Post your entry.";
    $("submitChallengeEntry").textContent = challenge.viewer_has_entry ? "Update Entry" : "Post Entry";
    openDialog("entryDialog");
  }

  async function submitEntry(event) {
    event.preventDefault();
    const challenge = state.activeChallenge;
    if (!challenge || state.busy) return;
    const caption = clean($("challengeEntryCaption")?.value);
    if (!caption && !state.entryFile) return showToast("Add a photo, video, or a few words.");
    let uploaded = null;
    state.busy = true;
    $("submitChallengeEntry").disabled = true;
    try {
      if (state.entryFile) uploaded = await uploadMedia(state.entryFile, "entry");
      await rpc("ari_circle_challenge_submit_entry", {
        requested_challenge_id: challenge.challenge_id,
        requested_caption: caption || null,
        requested_media_path: uploaded?.path || null,
        requested_media_type: uploaded?.type || null
      });
      closeDialog("entryDialog");
      clearPreview("entry");
      showToast(challenge.viewer_has_entry ? "Entry updated." : "You’re in ✨");
      await loadChallenges();
      const refreshed = state.challenges.find((item) => item.challenge_id === challenge.challenge_id) || challenge;
      setTimeout(() => openEntries(refreshed), 160);
    } catch (error) {
      console.error("Challenge entry failed:", error);
      if (uploaded?.path) state.client.storage.from(MEDIA_BUCKET).remove([uploaded.path]).catch(() => {});
      showToast(error.message || "Could not post your entry.", 4500);
    } finally {
      state.busy = false;
      $("submitChallengeEntry").disabled = false;
    }
  }

  async function openEntries(challenge) {
    state.activeChallenge = challenge;
    $("entriesTitle").textContent = challenge.title || "Challenge entries";
    const meta = MODE_META[challenge.challenge_mode] || MODE_META.participate;
    $("entriesKicker").textContent = meta.label.toUpperCase();
    $("entriesStatus").textContent = "Loading entries…";
    $("challengeEntryList").replaceChildren();
    $("challengeEntriesEmpty").hidden = true;
    openDialog("entriesDialog");
    await loadEntries(challenge);
  }

  async function loadEntries(challenge = state.activeChallenge) {
    if (!challenge) return;
    try {
      const data = await rpc("ari_circle_challenge_entry_list", {
        requested_challenge_id: challenge.challenge_id,
        result_limit: 100
      });
      state.activeEntries = Array.isArray(data) ? data : [];
      await Promise.all(state.activeEntries.map(async (entry) => {
        entry.media_url = entry.media_path ? await signedUrl(entry.media_path) : "";
      }));
      renderEntries(challenge);
    } catch (error) {
      console.error("Challenge entries failed:", error);
      $("entriesStatus").textContent = error.message || "Entries unavailable right now.";
    }
  }

  function renderEntries(challenge) {
    const host = $("challengeEntryList");
    const empty = $("challengeEntriesEmpty");
    if (!host || !empty) return;
    host.replaceChildren();
    $("entriesStatus").textContent = state.activeEntries.length
      ? `${state.activeEntries.length} ${state.activeEntries.length === 1 ? "entry" : "entries"}`
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
    const media = clean(entry.media_url)
      ? (entry.media_type === "video"
        ? `<div class="challenge-entry-item__media"><video src="${escapeHtml(entry.media_url)}" controls playsinline preload="metadata"></video></div>`
        : `<div class="challenge-entry-item__media"><img src="${escapeHtml(entry.media_url)}" alt="Challenge entry" loading="lazy" /></div>`)
      : "";
    item.innerHTML = `
      ${media}
      <div class="challenge-entry-item__head">
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(entry.user_id)}">${avatar}</a>
        <a href="ari-circle.html?user=${encodeURIComponent(entry.user_id)}"><strong>${escapeHtml(entry.display_name || "ARI User")}</strong><span>${escapeHtml(handle)} · ${escapeHtml(relativeTime(entry.created_at))}</span></a>
        ${mine ? '<button class="challenge-entry-delete" type="button">Delete</button>' : ""}
      </div>
      ${clean(entry.caption) ? `<p class="challenge-entry-item__caption">${escapeHtml(entry.caption)}</p>` : ""}
      <div class="challenge-entry-item__actions">
        <button type="button" data-hype class="${entry.viewer_hyped ? "is-active" : ""}">🔥 Hype · ${Number(entry.hype_count) || 0}</button>
        ${challenge.challenge_mode === "vote" ? `<button type="button" data-vote class="${entry.viewer_voted ? "is-active" : ""}">🏆 ${entry.viewer_voted ? "Voted" : "Vote"} · ${Number(entry.vote_count) || 0}</button>` : '<button type="button" disabled>✨ Entry</button>'}
      </div>`;
    item.querySelector("[data-hype]")?.addEventListener("click", () => toggleHype(entry));
    item.querySelector("[data-vote]")?.addEventListener("click", () => voteEntry(entry, challenge));
    item.querySelector(".challenge-entry-delete")?.addEventListener("click", () => deleteEntry(entry, challenge));
    return item;
  }

  async function toggleHype(entry) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_toggle_hype", { requested_entry_id: entry.entry_id });
      await Promise.all([loadEntries(), loadChallenges()]);
    } catch (error) {
      showToast(error.message || "Could not hype that entry.", 4000);
    } finally { state.busy = false; }
  }

  async function voteEntry(entry, challenge) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_vote", {
        requested_challenge_id: challenge.challenge_id,
        requested_entry_id: entry.entry_id
      });
      await Promise.all([loadEntries(challenge), loadChallenges()]);
    } catch (error) {
      showToast(error.message || "Could not vote for that entry.", 4000);
    } finally { state.busy = false; }
  }

  async function deleteEntry(entry, challenge) {
    if (!confirm("Delete this challenge entry?")) return;
    try {
      const path = await rpc("ari_circle_challenge_delete_entry", { requested_entry_id: entry.entry_id });
      if (path) await state.client.storage.from(MEDIA_BUCKET).remove([path]).catch(() => {});
      showToast("Entry deleted.");
      await Promise.all([loadEntries(challenge), loadChallenges()]);
    } catch (error) {
      showToast(error.message || "Could not delete entry.", 4000);
    }
  }

  function openProgress(challenge) {
    state.activeChallenge = challenge;
    $("progressChallengeTitle").textContent = challenge.title || "Add progress";
    $("progressChallengeCopy").textContent = `You’re at ${Number(challenge.viewer_progress) || 0} of ${Number(challenge.goal_value) || 0} ${challenge.unit_label}.`;
    $("progressAmountLabel").textContent = `Add ${challenge.unit_label || "progress"}`;
    $("progressAmount").value = "1";
    openDialog("progressDialog");
  }

  async function addProgress(event) {
    event.preventDefault();
    const challenge = state.activeChallenge;
    if (!challenge || state.busy) return;
    state.busy = true;
    try {
      const result = await rpc("ari_circle_challenge_add_progress", {
        requested_challenge_id: challenge.challenge_id,
        requested_amount: Number($("progressAmount").value)
      });
      closeDialog("progressDialog");
      showToast(result?.completed_now ? "Challenge complete ✨" : "Progress added.");
      await loadChallenges();
    } catch (error) {
      showToast(error.message || "Could not add progress.", 4300);
    } finally { state.busy = false; }
  }

  async function openLeaderboard(challenge) {
    $("leaderboardTitle").textContent = challenge.title || "Challenge board";
    $("leaderboardList").innerHTML = '<p class="challenge-status">Loading leaderboard…</p>';
    openDialog("leaderboardDialog");
    try {
      const data = await rpc("ari_circle_challenge_leaderboard", {
        requested_challenge_id: challenge.challenge_id,
        result_limit: 40
      });
      renderLeaderboard(Array.isArray(data) ? data : [], challenge);
    } catch (error) {
      $("leaderboardList").innerHTML = `<p class="challenge-status">${escapeHtml(error.message || "Leaderboard unavailable.")}</p>`;
    }
  }

  function renderLeaderboard(rows, challenge) {
    const host = $("leaderboardList");
    host.replaceChildren();
    if (!rows.length) {
      host.innerHTML = '<p class="challenge-status">Nobody has joined yet.</p>';
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "challenge-rank";
      const avatar = clean(row.avatar_url) ? `<img src="${escapeHtml(row.avatar_url)}" alt="" />` : `<span>${escapeHtml(initialFor(row.display_name))}</span>`;
      const handle = clean(row.handle) ? `@${clean(row.handle).replace(/^@+/, "")}` : "ARI Circle";
      item.innerHTML = `<div class="challenge-rank__number">${escapeHtml(String(row.rank_number || ""))}</div><a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(row.user_id)}">${avatar}</a><a class="challenge-rank__name" href="ari-circle.html?user=${encodeURIComponent(row.user_id)}"><strong>${escapeHtml(row.display_name || "ARI User")}</strong><span>${escapeHtml(handle)}</span></a><div class="challenge-rank__score">${escapeHtml(String(Number(row.progress) || 0))}<br>${escapeHtml(challenge.unit_label || "")}</div>`;
      host.append(item);
    });
  }

  async function shareChallenge(challenge) {
    const url = new URL("ari-circle-challenges.html", location.href);
    url.searchParams.set("challenge", challenge.challenge_id);
    const shareData = { title: challenge.title || "ARI Circle Challenge", text: clean(challenge.description) || "Join this ARI Circle challenge.", url: url.href };
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
    $("cancelChallengeButton").hidden = !isOwner;
    openDialog("challengeOptionsDialog");
  }

  async function cancelChallenge() {
    const challenge = state.activeChallenge;
    if (!challenge || !confirm("Cancel this challenge?")) return;
    try {
      await rpc("ari_circle_challenge_cancel", { requested_challenge_id: challenge.challenge_id });
      closeDialog("challengeOptionsDialog");
      showToast("Challenge canceled.");
      await loadChallenges();
    } catch (error) {
      showToast(error.message || "Could not cancel challenge.", 4200);
    }
  }

  function setFilter(filter) {
    state.filter = ["for-you","friends","trending"].includes(filter) ? filter : "for-you";
    document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === state.filter));
    renderChallenges();
  }

  function handleChallengeDeepLink() {
    if (state.deepLinkHandled) return;
    const id = new URLSearchParams(location.search).get("challenge");
    if (!id) { state.deepLinkHandled = true; return; }
    const challenge = state.challenges.find((item) => item.challenge_id === id);
    if (!challenge) return;
    state.deepLinkHandled = true;
    setTimeout(() => challenge.challenge_mode === "goal" ? openLeaderboard(challenge) : openEntries(challenge), 120);
  }

  function bindUi() {
    [$("openCreateChallenge"), $("emptyCreateChallenge")].filter(Boolean).forEach((button) => button.addEventListener("click", () => openCreate()));
    $("ageForm")?.addEventListener("submit", verifyAge);
    $("createChallengeForm")?.addEventListener("submit", createChallenge);
    $("entryForm")?.addEventListener("submit", submitEntry);
    $("progressForm")?.addEventListener("submit", addProgress);
    $("pickChallengeCover")?.addEventListener("click", () => $("challengeCoverInput")?.click());
    $("pickChallengeEntryMedia")?.addEventListener("click", () => $("challengeEntryMediaInput")?.click());
    $("challengeCoverInput")?.addEventListener("change", (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) previewFile(file, "cover"); });
    $("challengeEntryMediaInput")?.addEventListener("change", (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) previewFile(file, "entry"); });
    $("removeChallengeCover")?.addEventListener("click", () => clearPreview("cover"));
    $("removeChallengeEntryMedia")?.addEventListener("click", () => clearPreview("entry"));
    $("cancelChallengeButton")?.addEventListener("click", cancelChallenge);
    $("shareChallengeButton")?.addEventListener("click", () => state.activeChallenge && shareChallenge(state.activeChallenge));

    document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));
    document.querySelectorAll('input[name="challengeMode"]').forEach((radio) => radio.addEventListener("change", syncModeFields));
    document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
    document.querySelectorAll("[data-idea]").forEach((button) => button.addEventListener("click", () => openCreate({ title: button.dataset.idea, mode: button.dataset.mode, hours: Number(button.dataset.hours) })));

    ["createChallengeDialog","entryDialog"].forEach((id) => {
      $(id)?.addEventListener("close", () => {
        if (id === "entryDialog") clearPreview("entry");
      });
    });
  }

  async function init() {
    const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!client) {
      $("challengeLoading").innerHTML = "<strong>ARI Circle data is unavailable.</strong>";
      return;
    }
    state.client = client;
    bindUi();
    syncModeFields();
    try {
      if (!await requireUser()) return;
      await loadAge();
      $("challengePage").hidden = false;
      $("challengeLoading").hidden = true;
      if (!state.age?.verified) {
        openDialog("ageDialog");
        return;
      }
      await loadChallenges();
    } catch (error) {
      console.error("ARI Circle Challenges boot failed:", error);
      $("challengeLoading").innerHTML = `<strong>${escapeHtml(error.message || "Challenges could not open.")}</strong>`;
    }
  }

  window.AriCircleChallenges = Object.freeze({ version: VERSION, refresh: loadChallenges });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
