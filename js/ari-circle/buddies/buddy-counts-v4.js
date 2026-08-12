/* =============================================================
   ARI CIRCLE — BUDDY COUNTS V4
   Version: 1.0.0

   Uses one dedicated server-side count RPC so the Buddies shortcuts
   always reflect the actual accepted-friend and incoming-request state.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);
  const state = {
    client: null,
    refreshing: false,
    started: false,
    retryTimer: 0
  };

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
    } finally {
      state.refreshing = false;
    }
  }

  function bind() {
    window.addEventListener("focus", () => setTimeout(refresh, 80));
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-accept], [data-decline], .buddy-person__add")) {
        setTimeout(refresh, 220);
      }
    });
  }

  function start() {
    if (state.started || !document.querySelector(".partner-page")) return;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) return;
    state.started = true;
    bind();
    refresh();
    setTimeout(refresh, 280);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.AriCircleBuddyCountsV4 = Object.freeze({ version: VERSION, refresh });
})();
