/* =============================================================
   ARI CIRCLE — MOMENT REPLIES
   Version: 2.0.0

   Messaging V5 rule:
   - Moments never send DMs directly.
   - Reply / quick reaction routes into ARI Messages.
   - ARI Messages remains the single direct-message surface.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.0.0";
  const REACTIONS = ["❤️", "😂", "🔥", "👏"];
  const state = { client:null, user:null, moments:[], activeIndex:-1, bound:false };
  const clean = (value) => String(value ?? "").trim();
  const $ = (id) => document.getElementById(id);

  function injectStyles() {
    if ($("ariMomentRepliesStyle")) return;
    const style = document.createElement("style");
    style.id = "ariMomentRepliesStyle";
    style.textContent = `
      #momentViewer[open] .feed-moment-viewer__card{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important}
      .ari-moment-replybar{position:fixed;z-index:10020;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));width:min(calc(100vw - 24px),520px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:9px;border:1px solid rgba(255,255,255,.42);border-radius:26px;background:rgba(250,252,255,.88);box-shadow:0 18px 52px rgba(4,10,28,.28);backdrop-filter:blur(22px) saturate(145%);-webkit-backdrop-filter:blur(22px) saturate(145%)}
      .ari-moment-replyform{display:flex;align-items:center;gap:7px;min-width:0;flex:1}.ari-moment-replyinput{min-width:0;flex:1;height:46px;padding:0 16px;border:1px solid rgba(49,74,138,.13);border-radius:999px;outline:none;color:#10182d;background:rgba(255,255,255,.94);font-size:16px}.ari-moment-replyinput:focus{border-color:rgba(36,88,255,.38);box-shadow:0 0 0 4px rgba(36,88,255,.07)}
      .ari-moment-send{width:46px;height:46px;display:grid;place-items:center;flex:0 0 46px;border:0;border-radius:50%;color:#fff;background:linear-gradient(135deg,#19cfff,#2458ff 52%,#8950ff);font-weight:900;box-shadow:0 10px 24px rgba(49,72,210,.24)}
      .ari-moment-reactions{display:flex;align-items:center;gap:4px;flex:0 0 auto}.ari-moment-reaction{width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:50%;background:rgba(255,255,255,.82);font-size:1.22rem;transition:transform .16s ease}.ari-moment-reaction:active{transform:scale(.84)}
      .ari-moment-replybar.is-own{justify-content:center;padding:12px 18px;color:#667189;font-weight:750}
      @media(max-width:430px){.ari-moment-replybar{gap:6px;padding:7px}.ari-moment-reaction{width:36px;height:36px;font-size:1.08rem}.ari-moment-send{width:42px;height:42px;flex-basis:42px}.ari-moment-replyinput{height:42px;padding:0 13px}}
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
      const data = await rpc("ari_circle_moments_list", { result_limit:80 });
      state.moments = Array.isArray(data) ? data : [];
      mapMomentBubbles();
    } catch (error) {
      console.warn("ARI Circle Moment reply context unavailable:", error);
    }
  }

  function latestBubbleIndexes() {
    const seen = new Set(), indexes = [];
    state.moments.forEach((moment,index) => {
      const userId = clean(moment?.author_user_id);
      if (!userId || seen.has(userId)) return;
      seen.add(userId); indexes.push(index);
    });
    return indexes;
  }

  function mapMomentBubbles() {
    const strip = $("momentsStrip");
    if (!strip) return;
    const indexes = latestBubbleIndexes();
    [...strip.querySelectorAll(".feed-moment-bubble")].forEach((button,bubbleIndex) => {
      const flatIndex = indexes[bubbleIndex];
      if (Number.isInteger(flatIndex)) button.dataset.momentReplyIndex = String(flatIndex);
    });
  }

  function activeMoment() { return state.activeIndex >= 0 ? state.moments[state.activeIndex] : null; }
  function removeBar() { document.querySelector(".ari-moment-replybar")?.remove(); }

  function routeToMessages(text = "") {
    const moment = activeMoment();
    const recipientId = clean(moment?.author_user_id);
    if (!recipientId || recipientId === clean(state.user?.id)) return;
    try {
      sessionStorage.setItem("ariCircleMessageDraft", clean(text));
      sessionStorage.setItem("ariCircleMessageContext", "Moment");
    } catch {}
    location.href = `ari-circle-messages.html?user=${encodeURIComponent(recipientId)}`;
  }

  function ensureBar() {
    const dialog = $("momentViewer");
    if (!dialog?.open) { removeBar(); return; }
    const moment = activeMoment();
    if (!moment) return;
    removeBar();
    const bar = document.createElement("div");
    bar.className = "ari-moment-replybar";

    if (clean(moment.author_user_id) === clean(state.user?.id)) {
      bar.classList.add("is-own");
      bar.innerHTML = "<span>Your Moment</span>";
      document.body.append(bar);
      return;
    }

    const name = clean(moment.display_name) || "this user";
    bar.innerHTML = `<form class="ari-moment-replyform" autocomplete="off"><input class="ari-moment-replyinput" maxlength="600" placeholder="Message ${name}…" aria-label="Message ${name}" /><button class="ari-moment-send" type="submit" aria-label="Open in Messages">➤</button></form><div class="ari-moment-reactions" aria-label="Quick reactions">${REACTIONS.map((emoji)=>`<button class="ari-moment-reaction" type="button" data-moment-emoji="${emoji}" aria-label="React ${emoji}">${emoji}</button>`).join("")}</div>`;
    bar.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      routeToMessages(bar.querySelector(".ari-moment-replyinput")?.value || "");
    });
    bar.querySelectorAll("[data-moment-emoji]").forEach((button) => button.addEventListener("click", () => routeToMessages(`↳ Moment\n${button.dataset.momentEmoji || ""}`)));
    document.body.append(bar);
  }

  function bindViewerTracking() {
    if (state.bound) return;
    state.bound = true;
    document.addEventListener("click", (event) => {
      const bubble = event.target.closest?.(".feed-moment-bubble[data-moment-reply-index]");
      if (bubble) { state.activeIndex = Number(bubble.dataset.momentReplyIndex); setTimeout(ensureBar,30); return; }
      if (event.target.closest?.("#momentPrevButton")) { if(state.moments.length) state.activeIndex=(state.activeIndex-1+state.moments.length)%state.moments.length; setTimeout(ensureBar,0); return; }
      if (event.target.closest?.("#momentNextButton")) { if(state.moments.length) state.activeIndex=(state.activeIndex+1)%state.moments.length; setTimeout(ensureBar,0); return; }
      if (event.target.closest?.('[data-close-dialog="momentViewer"]')) removeBar();
    }, true);
    $("momentViewer")?.addEventListener("close", removeBar);
    const strip = $("momentsStrip");
    if (strip && "MutationObserver" in window) {
      new MutationObserver(() => {
        clearTimeout(bindViewerTracking.refreshTimer);
        bindViewerTracking.refreshTimer = setTimeout(refreshMoments,80);
      }).observe(strip,{childList:true});
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
      injectStyles(); bindViewerTracking(); await refreshMoments();
    } catch (error) {
      console.warn("ARI Circle Moment replies did not initialize:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", init, { once:true });
  window.AriCircleMomentReplies = Object.freeze({ version:VERSION, refresh:refreshMoments });
})();
