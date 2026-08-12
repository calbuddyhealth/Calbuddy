/* =============================================================
   ARI CIRCLE — BUDDY COUNTS + LAUNCH WORKFLOW
   Version: 1.1.0

   - Keeps Friends / Requests counts current.
   - Activity Buddy cards use only View profile + Message.
   - Removes the old Say hey / invite detour.
   - Prevents iOS Safari form-focus zoom on the Buddies page.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const $ = (id) => document.getElementById(id);
  const state = { client:null, refreshing:false, started:false, retryTimer:0, observer:null };

  function writeCounts(row) {
    const friendCount = Number(row?.friend_count ?? 0);
    const requestCount = Number(row?.request_count ?? 0);
    const friends = $("buddyFriendCount");
    const requests = $("buddyRequestCount");
    if (friends) friends.textContent = String(Number.isFinite(friendCount) ? friendCount : 0);
    if (requests) requests.textContent = String(Number.isFinite(requestCount) ? requestCount : 0);
    return Boolean(friends || requests);
  }

  async function refresh() {
    if (!state.client || state.refreshing) return false;
    state.refreshing = true;
    try {
      const { data, error } = await state.client.rpc("ari_circle_my_social_counts");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const painted = writeCounts(row || {});
      if (!painted) {
        clearTimeout(state.retryTimer);
        state.retryTimer = setTimeout(refresh, 160);
      }
      return true;
    } catch (error) {
      console.warn("ARI Circle social counts unavailable:", error);
      return false;
    } finally { state.refreshing = false; }
  }

  function ensureMobileInputSafety() {
    if ($("ariCircleBuddyLaunchStyle")) return;
    const style = document.createElement("style");
    style.id = "ariCircleBuddyLaunchStyle";
    style.textContent = `@media(max-width:900px){.partner-page input,.partner-page textarea,.partner-page select{font-size:16px!important}}`;
    document.head.append(style);
  }

  function patchPartnerCards(root = document) {
    root.querySelectorAll?.(".partner-person-card").forEach((card) => {
      const profile = card.querySelector('.partner-secondary[href*="ari-circle.html?user="]');
      const old = card.querySelector("[data-interest-intent]");
      if (!profile || !old || old.dataset.launchMessage === "true") return;
      let userId = "";
      try { userId = new URL(profile.href, location.href).searchParams.get("user") || ""; } catch {}
      if (!userId) return;
      const link = document.createElement("a");
      link.className = "partner-primary";
      link.href = `ari-circle-messages.html?user=${encodeURIComponent(userId)}`;
      link.textContent = "Message";
      link.dataset.launchMessage = "true";
      old.replaceWith(link);
    });
  }

  function observeCards() {
    if (state.observer) return;
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) patchPartnerCards(node.matches?.(".partner-person-card") ? node.parentElement : node);
      });
      patchPartnerCards();
    });
    state.observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  function bind() {
    window.addEventListener("focus", () => setTimeout(refresh, 80));
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-accept], [data-decline], .buddy-person__add")) setTimeout(refresh, 220);
    });
  }

  function start() {
    if (state.started || !document.querySelector(".partner-page")) return;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) return;
    state.started = true;
    ensureMobileInputSafety();
    bind();
    observeCards();
    patchPartnerCards();
    refresh();
    setTimeout(() => { refresh(); patchPartnerCards(); }, 280);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.AriCircleBuddyCountsV4 = Object.freeze({ version:VERSION, refresh, patchPartnerCards });
})();
