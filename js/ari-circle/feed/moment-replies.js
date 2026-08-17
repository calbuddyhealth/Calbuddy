/* =============================================================
   ARI CIRCLE — MOMENT REPLIES
   Version: 3.0.0

   Facebook-style private Moment interaction:
   - Send a text reply without leaving the Moment viewer
   - Send quick emoji reactions
   - Replies/reactions become normal ARI Circle direct messages
   - Existing message access, block, age, and moderation rules still apply
============================================================= */
(() => {
  "use strict";

  const VERSION = "3.0.0";
  const MEDIA_BUCKET = "ari-circle-post-media";
  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();

  const state = {
    client: null,
    user: null,
    moments: [],
    currentMoment: null,
    busy: false,
    observer: null,
    started: false
  };

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params = {}) {
    const c = client();
    if (!c) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await c.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function toast(message, duration = 2600) {
    const host = $("feedToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, duration);
  }

  function normalizePath(value) {
    return clean(value)
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\/+/, "")
      .split("?")[0];
  }

  function mediaPathFromViewer() {
    const media = document.querySelector("#momentViewerMedia img, #momentViewerMedia video");
    const raw = clean(media?.currentSrc || media?.src);
    if (!raw) return "";

    try {
      const url = new URL(raw, window.location.href);
      let pathname = url.pathname;
      try { pathname = decodeURIComponent(pathname); } catch {}

      const markers = [
        `/storage/v1/object/sign/${MEDIA_BUCKET}/`,
        `/storage/v1/object/public/${MEDIA_BUCKET}/`,
        `/storage/v1/object/authenticated/${MEDIA_BUCKET}/`,
        `/${MEDIA_BUCKET}/`
      ];

      for (const marker of markers) {
        const index = pathname.indexOf(marker);
        if (index >= 0) return normalizePath(pathname.slice(index + marker.length));
      }
    } catch {}

    return "";
  }

  async function loadMoments() {
    try {
      const data = await rpc("ari_circle_moments_list", { result_limit: 80 });
      state.moments = Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("ARI Circle Moment replies could not refresh Moments:", error);
      state.moments = [];
    }
    return state.moments;
  }

  function findMomentByPath(path) {
    const target = normalizePath(path);
    if (!target) return null;

    return state.moments.find((moment) => {
      const candidate = normalizePath(moment?.media_path);
      if (!candidate) return false;
      return candidate === target || candidate.endsWith(`/${target}`) || target.endsWith(`/${candidate}`);
    }) || null;
  }

  function setBusy(value) {
    state.busy = Boolean(value);
    const bar = $("ariMomentReplyBar");
    if (bar) bar.classList.toggle("is-busy", state.busy);
    const send = $("ariMomentReplySend");
    if (send) send.disabled = state.busy;
    document.querySelectorAll("[data-ari-moment-reaction]").forEach((button) => {
      button.disabled = state.busy;
    });
  }

  function ensureReplyBar() {
    let bar = $("ariMomentReplyBar");
    if (bar) return bar;

    const card = document.querySelector("#momentViewer .feed-moment-viewer__card");
    if (!card) return null;

    bar = document.createElement("div");
    bar.id = "ariMomentReplyBar";
    bar.className = "ari-moment-replybar";
    bar.hidden = true;
    bar.innerHTML = `
      <form class="ari-moment-replybar__form" id="ariMomentReplyForm">
        <div class="ari-moment-replybar__input-wrap">
          <input
            class="ari-moment-replybar__input"
            id="ariMomentReplyInput"
            type="text"
            maxlength="3600"
            autocomplete="off"
            enterkeyhint="send"
            placeholder="Send message..."
            aria-label="Reply to this Moment"
          />
          <button class="ari-moment-replybar__send" id="ariMomentReplySend" type="submit" aria-label="Send reply">↑</button>
        </div>
        <button class="ari-moment-replybar__reaction" type="button" data-ari-moment-reaction="❤️" aria-label="React with heart">❤️</button>
        <button class="ari-moment-replybar__reaction" type="button" data-ari-moment-reaction="👍" aria-label="React with thumbs up">👍</button>
        <button class="ari-moment-replybar__reaction" type="button" data-ari-moment-reaction="😂" aria-label="React with laughing face">😂</button>
      </form>`;

    card.append(bar);

    $("ariMomentReplyForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = $("ariMomentReplyInput");
      const text = clean(input?.value);
      if (!text || state.busy) return;
      const sent = await sendToMomentOwner(`Replied to your Moment: ${text}`);
      if (sent && input) input.value = "";
    });

    bar.querySelectorAll("[data-ari-moment-reaction]").forEach((button) => {
      button.addEventListener("click", async () => {
        const emoji = clean(button.dataset.ariMomentReaction);
        if (!emoji || state.busy) return;
        await sendToMomentOwner(`Reacted ${emoji} to your Moment.`);
      });
    });

    return bar;
  }

  async function sendToMomentOwner(body) {
    const moment = state.currentMoment;
    const recipientId = clean(moment?.author_user_id);
    if (!moment || !recipientId || recipientId === clean(state.user?.id) || !body) return false;

    setBusy(true);
    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", {
        requested_user_id: recipientId
      });

      if (!conversationId) throw new Error("Conversation unavailable.");

      await rpc("ari_circle_messages_send", {
        requested_conversation_id: conversationId,
        requested_body: body
      });

      toast(`Sent to ${clean(moment.display_name) || "this person"}.`);
      return true;
    } catch (error) {
      console.error("ARI Circle Moment reply failed:", error);
      toast(error.message || "Could not send that reply.", 4200);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function syncCurrentMoment({ refresh = false } = {}) {
    const dialog = $("momentViewer");
    const bar = ensureReplyBar();
    if (!dialog || !bar) return;

    if (!dialog.open) {
      bar.hidden = true;
      state.currentMoment = null;
      return;
    }

    if (refresh || !state.moments.length) await loadMoments();

    const mediaPath = mediaPathFromViewer();
    let moment = findMomentByPath(mediaPath);

    if (!moment && !refresh) {
      await loadMoments();
      moment = findMomentByPath(mediaPath);
    }

    state.currentMoment = moment;
    const isOwnMoment = clean(moment?.author_user_id) === clean(state.user?.id);
    bar.hidden = !moment || isOwnMoment;

    if (!bar.hidden) {
      const input = $("ariMomentReplyInput");
      if (input) input.placeholder = `Message ${clean(moment.display_name) || "this person"}...`;
    }
  }

  function scheduleSync(delay = 30) {
    window.setTimeout(() => syncCurrentMoment(), delay);
  }

  function bindViewer() {
    const dialog = $("momentViewer");
    const mediaHost = $("momentViewerMedia");
    if (!dialog || !mediaHost) return;

    dialog.addEventListener("close", () => {
      const bar = $("ariMomentReplyBar");
      if (bar) bar.hidden = true;
      state.currentMoment = null;
      const input = $("ariMomentReplyInput");
      if (input) input.value = "";
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest?.(".feed-moment-bubble, #momentPrevButton, #momentNextButton")) {
        scheduleSync(60);
      }
    });

    state.observer = new MutationObserver(() => scheduleSync(20));
    state.observer.observe(mediaHost, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }

  async function init() {
    if (state.started || !$("momentViewer")) return;
    state.started = true;
    state.client = client();
    if (!state.client) return;

    try {
      const { data } = await state.client.auth.getUser();
      state.user = data?.user || null;
    } catch {}

    ensureReplyBar();
    bindViewer();
    await loadMoments();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AriCircleMomentReplies = Object.freeze({
    version: VERSION,
    refresh: () => syncCurrentMoment({ refresh: true })
  });
})();
