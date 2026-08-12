/* =============================================================
   ARI CIRCLE — MOMENT REPLIES
   Version: 1.0.0

   Adds a Messenger-style interaction bar to the Moment viewer:
   - Private reply without leaving the Moment
   - Quick emoji replies
   - Own Moments never show a DM composer
   - Uses the existing ARI Circle direct-message RPCs
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const REACTIONS = ["❤️", "😂", "🔥", "👏"];

  const state = {
    client: null,
    user: null,
    moments: [],
    activeIndex: -1,
    busy: false,
    bound: false
  };

  const clean = (value) => String(value ?? "").trim();
  const $ = (id) => document.getElementById(id);

  function injectStyles() {
    if ($("ariMomentRepliesStyle")) return;
    const style = document.createElement("style");
    style.id = "ariMomentRepliesStyle";
    style.textContent = `
      #momentViewer[open] .feed-moment-viewer__card{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important}
      .ari-moment-replybar{
        position:fixed;z-index:10020;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));
        width:min(calc(100vw - 24px),520px);transform:translateX(-50%);
        display:flex;align-items:center;gap:8px;padding:9px;
        border:1px solid rgba(255,255,255,.42);border-radius:26px;
        background:rgba(250,252,255,.88);box-shadow:0 18px 52px rgba(4,10,28,.28);
        backdrop-filter:blur(22px) saturate(145%);-webkit-backdrop-filter:blur(22px) saturate(145%)
      }
      .ari-moment-replyform{display:flex;align-items:center;gap:7px;min-width:0;flex:1}
      .ari-moment-replyinput{
        min-width:0;flex:1;height:46px;padding:0 16px;border:1px solid rgba(49,74,138,.13);
        border-radius:999px;outline:none;color:#10182d;background:rgba(255,255,255,.94);font-size:16px
      }
      .ari-moment-replyinput:focus{border-color:rgba(36,88,255,.38);box-shadow:0 0 0 4px rgba(36,88,255,.07)}
      .ari-moment-send{
        width:46px;height:46px;display:grid;place-items:center;flex:0 0 46px;border:0;border-radius:50%;
        color:#fff;background:linear-gradient(135deg,#19cfff,#2458ff 52%,#8950ff);font-weight:900;
        box-shadow:0 10px 24px rgba(49,72,210,.24)
      }
      .ari-moment-send:disabled{opacity:.45}
      .ari-moment-reactions{display:flex;align-items:center;gap:4px;flex:0 0 auto}
      .ari-moment-reaction{
        width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:50%;
        background:rgba(255,255,255,.82);font-size:1.22rem;transition:transform .16s ease,background .16s ease
      }
      .ari-moment-reaction:active{transform:scale(.84)}
      .ari-moment-replybar.is-own{justify-content:center;padding:12px 18px;color:#667189;font-weight:750}
      .ari-moment-sent{animation:ariMomentPop .34s cubic-bezier(.2,.8,.2,1)}
      @keyframes ariMomentPop{0%{transform:translateX(-50%) scale(.96)}65%{transform:translateX(-50%) scale(1.025)}100%{transform:translateX(-50%) scale(1)}}
      @media(max-width:430px){
        .ari-moment-replybar{gap:6px;padding:7px}
        .ari-moment-reaction{width:36px;height:36px;font-size:1.08rem}
        .ari-moment-send{width:42px;height:42px;flex-basis:42px}
        .ari-moment-replyinput{height:42px;padding:0 13px}
      }
    `;
    document.head.append(style);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function refreshMoments() {
    if (!state.client || !state.user) return;
    try {
      const data = await rpc("ari_circle_moments_list", { result_limit: 80 });
      state.moments = Array.isArray(data) ? data : [];
      mapMomentBubbles();
    } catch (error) {
      console.warn("ARI Circle Moment reply context unavailable:", error);
    }
  }

  function latestBubbleIndexes() {
    const seen = new Set();
    const indexes = [];
    state.moments.forEach((moment, index) => {
      const userId = clean(moment?.author_user_id);
      if (!userId || seen.has(userId)) return;
      seen.add(userId);
      indexes.push(index);
    });
    return indexes;
  }

  function mapMomentBubbles() {
    const strip = $("momentsStrip");
    if (!strip) return;
    const indexes = latestBubbleIndexes();
    [...strip.querySelectorAll(".feed-moment-bubble")].forEach((button, bubbleIndex) => {
      const flatIndex = indexes[bubbleIndex];
      if (Number.isInteger(flatIndex)) button.dataset.momentReplyIndex = String(flatIndex);
    });
  }

  function activeMoment() {
    return state.activeIndex >= 0 ? state.moments[state.activeIndex] : null;
  }

  function removeBar() {
    document.querySelector(".ari-moment-replybar")?.remove();
  }

  function ensureBar() {
    const dialog = $("momentViewer");
    if (!dialog?.open) {
      removeBar();
      return;
    }

    const moment = activeMoment();
    if (!moment) return;

    removeBar();
    const bar = document.createElement("div");
    bar.className = "ari-moment-replybar";

    if (clean(moment.author_user_id) === clean(state.user?.id)) {
      bar.classList.add("is-own");
      bar.innerHTML = `<span>Your Moment</span>`;
      document.body.append(bar);
      return;
    }

    const name = clean(moment.display_name) || "this user";
    bar.innerHTML = `
      <form class="ari-moment-replyform" autocomplete="off">
        <input class="ari-moment-replyinput" maxlength="600" placeholder="Message ${name}…" aria-label="Reply privately to ${name}" />
        <button class="ari-moment-send" type="submit" aria-label="Send reply">➤</button>
      </form>
      <div class="ari-moment-reactions" aria-label="Quick reactions">
        ${REACTIONS.map((emoji) => `<button class="ari-moment-reaction" type="button" data-moment-emoji="${emoji}" aria-label="React ${emoji}">${emoji}</button>`).join("")}
      </div>
    `;

    bar.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = bar.querySelector(".ari-moment-replyinput");
      const body = clean(input?.value);
      if (!body) return;
      await sendMomentReply(body, input);
    });

    bar.querySelectorAll("[data-moment-emoji]").forEach((button) => {
      button.addEventListener("click", async () => {
        await sendMomentReply(button.dataset.momentEmoji || "", null, true);
      });
    });

    document.body.append(bar);
  }

  async function sendMomentReply(body, input = null, reactionOnly = false) {
    const moment = activeMoment();
    const recipientId = clean(moment?.author_user_id);
    const text = clean(body);
    if (!recipientId || recipientId === clean(state.user?.id) || !text || state.busy) return;

    state.busy = true;
    const bar = document.querySelector(".ari-moment-replybar");
    bar?.querySelectorAll("button,input").forEach((el) => { el.disabled = true; });

    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", {
        requested_user_id: recipientId
      });
      if (!conversationId) throw new Error("Conversation unavailable.");

      const messageBody = reactionOnly
        ? `↳ Moment\n${text}`
        : `↳ Moment\n${text}`;

      await rpc("ari_circle_messages_send", {
        requested_conversation_id: conversationId,
        requested_body: messageBody
      });

      if (input) input.value = "";
      if (bar) {
        bar.classList.remove("ari-moment-sent");
        void bar.offsetWidth;
        bar.classList.add("ari-moment-sent");
      }
      const toast = $("feedToast");
      if (toast) {
        toast.textContent = reactionOnly ? "Reaction sent ✓" : "Message sent ✓";
        toast.hidden = false;
        window.setTimeout(() => { toast.hidden = true; }, 1800);
      }
    } catch (error) {
      console.error("ARI Circle Moment reply failed:", error);
      const toast = $("feedToast");
      if (toast) {
        toast.textContent = error.message || "Could not send that reply.";
        toast.hidden = false;
        window.setTimeout(() => { toast.hidden = true; }, 3200);
      }
    } finally {
      state.busy = false;
      bar?.querySelectorAll("button,input").forEach((el) => { el.disabled = false; });
    }
  }

  function bindViewerTracking() {
    if (state.bound) return;
    state.bound = true;

    document.addEventListener("click", (event) => {
      const bubble = event.target.closest?.(".feed-moment-bubble[data-moment-reply-index]");
      if (bubble) {
        state.activeIndex = Number(bubble.dataset.momentReplyIndex);
        window.setTimeout(ensureBar, 30);
        return;
      }

      if (event.target.closest?.("#momentPrevButton")) {
        if (state.moments.length) state.activeIndex = (state.activeIndex - 1 + state.moments.length) % state.moments.length;
        window.setTimeout(ensureBar, 0);
        return;
      }

      if (event.target.closest?.("#momentNextButton")) {
        if (state.moments.length) state.activeIndex = (state.activeIndex + 1) % state.moments.length;
        window.setTimeout(ensureBar, 0);
        return;
      }

      if (event.target.closest?.('[data-close-dialog="momentViewer"]')) {
        removeBar();
      }
    }, true);

    $("momentViewer")?.addEventListener("close", removeBar);

    const strip = $("momentsStrip");
    if (strip && "MutationObserver" in window) {
      new MutationObserver(() => {
        window.clearTimeout(bindViewerTracking.refreshTimer);
        bindViewerTracking.refreshTimer = window.setTimeout(refreshMoments, 80);
      }).observe(strip, { childList: true });
    }
  }

  async function init() {
    if (!document.querySelector(".feed-page")) return;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) return;

    try {
      const { data, error } = await state.client.auth.getUser();
      if (error) throw error;
      state.user = data?.user || null;
      if (!state.user) return;
      injectStyles();
      bindViewerTracking();
      await refreshMoments();
    } catch (error) {
      console.warn("ARI Circle Moment replies did not initialize:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
  window.AriCircleMomentReplies = Object.freeze({ version: VERSION, refresh: refreshMoments });
})();
