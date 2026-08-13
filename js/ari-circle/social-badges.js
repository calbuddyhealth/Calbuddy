/* =============================================================
   ARI CIRCLE — SOCIAL BADGES
   Version: 1.0.0

   Lightweight unread indicators inspired by familiar social apps.
   - Home ARI Circle card: total unread Circle notifications.
   - Circle message button: unread message count.
   - Buddies tab: pending friend request count.
   - Circle menu Notifications row: unread Circle activity count.

   Performance rules:
   - Never blocks initial page rendering.
   - Uses session cache for instant paint.
   - Refreshes after idle, on focus, and at a relaxed interval.
   - No MutationObserver and no realtime channel.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const CACHE_KEY = "ari_circle_badges_v1";
  const CACHE_MS = 30000;
  const REFRESH_MS = 60000;
  const STYLE_ID = "ariCircleSocialBadgeStyle";

  const state = {
    client: null,
    busy: false,
    started: false,
    timer: 0,
    counts: { activity: 0, messages: 0, buddies: 0 }
  };

  const clampCount = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
  const labelCount = (value) => value > 99 ? "99+" : String(value);

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ari-social-badge{position:absolute;z-index:8;display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:linear-gradient(135deg,#235cff,#7048ff);color:#fff;font:800 11px/1 Inter,system-ui,-apple-system,sans-serif;letter-spacing:-.02em;box-shadow:0 5px 14px rgba(57,74,255,.28),0 0 0 2px rgba(255,255,255,.96);pointer-events:none;transform:translateZ(0)}
      .ari-social-badge[hidden]{display:none!important}
      .nav-circle{position:relative}
      .nav-circle>.ari-social-badge{top:22px;right:24px}
      .circle-v4-message{position:relative}
      .circle-v4-message>.ari-social-badge,#circle-messages-button>.ari-social-badge{top:-5px;right:-6px;min-width:18px;height:18px;padding:0 5px;font-size:10px}
      .feed-tab,.partner-tab,.challenge-tab,#circleV3Nav a{position:relative}
      .feed-tab>.ari-social-badge,.partner-tab>.ari-social-badge,.challenge-tab>.ari-social-badge,#circleV3Nav a>.ari-social-badge{top:2px;right:6px;min-width:16px;height:16px;padding:0 4px;font-size:9px;box-shadow:0 3px 10px rgba(57,74,255,.22),0 0 0 2px rgba(248,250,255,.98)}
      .circle-v4-menu__panel a{position:relative}
      .circle-v4-menu__panel a>.ari-social-badge{top:50%;right:14px;transform:translateY(-50%);min-width:18px;height:18px;padding:0 5px;font-size:10px}
      @media(max-width:480px){.nav-circle>.ari-social-badge{top:20px;right:22px}}
    `;
    document.head.append(style);
  }

  function badgeFor(host, key) {
    if (!host) return null;
    let badge = host.querySelector(`:scope > .ari-social-badge[data-badge="${key}"]`);
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "ari-social-badge";
      badge.dataset.badge = key;
      badge.hidden = true;
      badge.setAttribute("aria-hidden", "true");
      host.append(badge);
    }
    return badge;
  }

  function paintOne(host, key, count) {
    const badge = badgeFor(host, key);
    if (!badge) return;
    const safe = clampCount(count);
    badge.textContent = safe ? labelCount(safe) : "";
    badge.hidden = safe < 1;
  }

  function paint(counts = state.counts) {
    ensureStyle();
    const activity = clampCount(counts.activity);
    const messages = clampCount(counts.messages);
    const buddies = clampCount(counts.buddies);

    document.querySelectorAll(".nav-circle").forEach((host) => paintOne(host, "activity", activity));
    document.querySelectorAll(".circle-v4-message, #circle-messages-button").forEach((host) => paintOne(host, "messages", messages));

    document.querySelectorAll('a[href="ari-circle-partners.html"], a[href$="/ari-circle-partners.html"]').forEach((host) => {
      if (host.closest(".circle-v4-menu__panel")) return;
      paintOne(host, "buddies", buddies);
    });

    document.querySelectorAll('.circle-v4-menu__panel a[href*="panel=notifications"]').forEach((host) => paintOne(host, "activity", activity));
  }

  function readCache() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      if ((Date.now() - Number(parsed.at || 0)) > CACHE_MS) return null;
      return {
        activity: clampCount(parsed.activity),
        messages: clampCount(parsed.messages),
        buddies: clampCount(parsed.buddies)
      };
    } catch { return null; }
  }

  function writeCache(counts) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...counts, at: Date.now() })); } catch {}
  }

  async function getActivityCount() {
    const { count, error } = await state.client
      .from("ari_circle_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    if (error) throw error;
    return clampCount(count);
  }

  async function getMessageCount() {
    const { data, error } = await state.client.rpc("ari_circle_messages_list", { result_limit: 80 });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).reduce((sum, row) => sum + clampCount(row?.unread_count), 0);
  }

  async function getBuddyCount() {
    const { data, error } = await state.client.rpc("ari_circle_my_social_counts");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return clampCount(row?.request_count);
  }

  async function refresh() {
    if (!state.client || state.busy || document.hidden) return;
    state.busy = true;
    try {
      const results = await Promise.allSettled([
        getActivityCount(),
        getMessageCount(),
        getBuddyCount()
      ]);

      if (results[0].status === "fulfilled") state.counts.activity = results[0].value;
      if (results[1].status === "fulfilled") state.counts.messages = results[1].value;
      if (results[2].status === "fulfilled") state.counts.buddies = results[2].value;

      paint();
      writeCache(state.counts);
    } catch (error) {
      console.warn("ARI Circle badges unavailable:", error);
    } finally {
      state.busy = false;
    }
  }

  function scheduleInitialRefresh() {
    const run = () => refresh();
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 1800 });
    else window.setTimeout(run, 900);
  }

  function start() {
    if (state.started) { paint(); return; }
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) {
      window.setTimeout(start, 250);
      return;
    }

    state.started = true;
    ensureStyle();
    const cached = readCache();
    if (cached) {
      state.counts = cached;
      paint();
    } else {
      paint();
    }

    scheduleInitialRefresh();
    window.addEventListener("focus", () => window.setTimeout(refresh, 180));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) window.setTimeout(refresh, 180); });
    state.timer = window.setInterval(refresh, REFRESH_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  document.addEventListener("circle:app-ready", () => { paint(); scheduleInitialRefresh(); });
  window.addEventListener("ari:circle-badges-refresh", refresh);

  window.AriCircleSocialBadges = Object.freeze({ version: VERSION, refresh, paint });
})();
