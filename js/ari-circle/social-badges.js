/* =============================================================
   ARI CIRCLE — SOCIAL BADGES
   Version: 1.3.0

   Lightweight unread indicators for current Circle surfaces.
   - Home ARI Circle card: total unread Circle notifications.
   - Circle message button: unread message count.
   - Discover Friends: pending Circle request count.
   - Circle menu Notifications row: unread Circle activity count.
   - During the ARI Next owner beta, public app entry lands on Feed.

   Performance/privacy rules:
   - Never blocks initial page rendering.
   - Uses session cache for instant paint.
   - Refreshes after idle, on focus, and at a relaxed interval.
   - No MutationObserver and no realtime channel.
   - Never requests Circle badge data unless the account is adult-entitled.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.3.0";
  const CACHE_KEY = "ari_circle_badges_v1";
  const CACHE_MS = 30000;
  const REFRESH_MS = 60000;
  const STYLE_ID = "ariCircleSocialBadgeStyle";

  const state = {
    client: null,
    busy: false,
    started: false,
    authorized: false,
    timer: 0,
    counts: { activity: 0, messages: 0, requests: 0 }
  };

  const clampCount = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
  const labelCount = (value) => value > 99 ? "99+" : String(value);

  function normalizePublicCircleEntry() {
    document.querySelectorAll('.nav-circle[href="ari-circle-v6.html"]').forEach((link) => {
      link.setAttribute("href", "ari-circle-feed.html");
      link.dataset.circleEntry = "feed-connect-public";
    });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ari-social-badge{position:absolute;z-index:8;display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:linear-gradient(135deg,#235cff,#7048ff);color:#fff;font:800 11px/1 Inter,system-ui,-apple-system,sans-serif;letter-spacing:-.02em;box-shadow:0 5px 14px rgba(57,74,255,.28),0 0 0 2px rgba(255,255,255,.96);pointer-events:none;transform:translateZ(0)}
      .ari-social-badge[hidden]{display:none!important}
      .nav-circle{position:relative}
      .nav-circle>.ari-social-badge{top:22px;right:24px}
      .circle-v4-message,#circle-messages-button{position:relative}
      .circle-v4-message>.ari-social-badge,#circle-messages-button>.ari-social-badge{top:-5px;right:-6px;min-width:18px;height:18px;padding:0 5px;font-size:10px}
      .circle-v4-menu__panel a,.circle-v5-menu__panel a{position:relative}
      .circle-v4-menu__panel a>.ari-social-badge,.circle-v5-menu__panel a>.ari-social-badge{top:50%;right:14px;transform:translateY(-50%);min-width:18px;height:18px;padding:0 5px;font-size:10px}
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
    normalizePublicCircleEntry();
    if (!state.authorized) return;
    ensureStyle();

    const activity = clampCount(counts.activity);
    const messages = clampCount(counts.messages);
    const requests = clampCount(counts.requests);

    document.querySelectorAll(".nav-circle").forEach((host) => paintOne(host, "activity", activity));
    document.querySelectorAll(".circle-v4-message, #circle-messages-button").forEach((host) => paintOne(host, "messages", messages));

    document.querySelectorAll(
      '.circle-v4-menu__panel a[href*="panel=discover-friends"], .circle-v5-menu__panel a[href*="panel=discover-friends"]'
    ).forEach((host) => paintOne(host, "requests", requests));

    document.querySelectorAll(
      '.circle-v4-menu__panel a[href*="panel=notifications"], .circle-v5-menu__panel a[href*="panel=notifications"]'
    ).forEach((host) => paintOne(host, "activity", activity));
  }

  function readCache() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      if ((Date.now() - Number(parsed.at || 0)) > CACHE_MS) return null;
      return {
        activity: clampCount(parsed.activity),
        messages: clampCount(parsed.messages),
        requests: clampCount(parsed.requests ?? parsed.buddies)
      };
    } catch {
      return null;
    }
  }

  function writeCache(counts) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...counts, at: Date.now() }));
    } catch {}
  }

  async function resolveAdultEntitlement() {
    const known = window.ARI_ACCOUNT_ENTITLEMENTS || window.ARI_CIRCLE_AGE_STATE || null;
    if (known) return known.circleAllowed === true;
    if (!state.client?.rpc) return false;

    const { data, error } = await state.client.rpc("ari_circle_my_age_state");
    if (error) return false;

    const ageBand = String(data?.age_band || data?.ageBand || "").toLowerCase();
    const explicitAllowed = data?.circle_allowed ?? data?.circleAllowed;
    return ageBand === "adult" && explicitAllowed !== false;
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

  async function getRequestCount() {
    const { data, error } = await state.client.rpc("ari_circle_my_social_counts");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return clampCount(row?.request_count);
  }

  async function refresh() {
    normalizePublicCircleEntry();
    if (!state.client || !state.authorized || state.busy || document.hidden) return;
    state.busy = true;

    try {
      const results = await Promise.allSettled([
        getActivityCount(),
        getMessageCount(),
        getRequestCount()
      ]);

      if (results[0].status === "fulfilled") state.counts.activity = results[0].value;
      if (results[1].status === "fulfilled") state.counts.messages = results[1].value;
      if (results[2].status === "fulfilled") state.counts.requests = results[2].value;

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

  async function start() {
    normalizePublicCircleEntry();
    if (state.started) {
      paint();
      return;
    }

    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client) {
      window.setTimeout(start, 250);
      return;
    }

    state.authorized = await resolveAdultEntitlement();
    if (!state.authorized) {
      try { sessionStorage.removeItem(CACHE_KEY); } catch {}
      return;
    }

    state.started = true;
    ensureStyle();
    const cached = readCache();
    if (cached) state.counts = cached;
    paint();

    scheduleInitialRefresh();
    window.addEventListener("focus", () => window.setTimeout(refresh, 180));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) window.setTimeout(refresh, 180);
    });
    state.timer = window.setInterval(refresh, REFRESH_MS);
  }

  normalizePublicCircleEntry();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  window.addEventListener("ari-age-entitlements-ready", () => { if (!state.started) start(); });
  window.addEventListener("ari-circle-access-ready", () => { if (!state.started) start(); });
  document.addEventListener("circle:app-ready", () => { paint(); scheduleInitialRefresh(); });
  window.addEventListener("ari:circle-badges-refresh", refresh);

  window.AriCircleSocialBadges = Object.freeze({ version: VERSION, refresh, paint, normalizePublicCircleEntry });
})();
