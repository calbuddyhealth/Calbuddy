/* =============================================================
   ARI CIRCLE V5.4.0 — SIMPLE SOCIAL SHELL
   Feed · Connect are the member-facing Circle experience.
   One current navigation owner, bounded lifecycle refreshes, and no retired
   Buddies/Challenges route shims.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.4.0";
  if (window.AriCircleV5RealWorld?.version === VERSION) return;

  const STYLE_ID = "ariCircleV5RealWorldStyle";
  const STYLE_HREF = "assets/css/ari-circle-v5-real-world.css?v=5.0.0";
  const PEARL_STYLE_ID = "ariCircleV51PearlStyle";
  const PEARL_STYLE_HREF = "assets/css/ari-circle-v5-pearl.css?v=5.1.0";
  const PREMIUM_STYLE_ID = "ariCircleV52PremiumStyle";
  const PREMIUM_STYLE_HREF = "assets/css/ari-circle-v5-premium.css?v=5.2.0";
  const AUTHORITY_STYLE_ID = "ariCircleV525AuthorityStyle";
  const AUTHORITY_STYLE_HREF = "assets/css/ari-circle-v5-visual-authority.css?v=5.2.5";
  const NAV_ID = "ariCircleV5BottomNav";
  const CONNECT_STYLE_ID = "ariCircleConnectModeStyle";
  const CONNECT_NAV_ID = "ariCircleConnectModeNav";
  const NAV_MODEL = "feed-connect-v1";
  const HALO_SEEN_KEY = "ari-circle-v522-wordmark-seen";
  const OWNER_ROUTE_FALLBACK = "ari-circle-feed.html";
  const MISSIONS_ROUTE_FALLBACK = "ari-circle-meetup.html";
  let queued = false;
  let happeningLoaded = false;
  let ownerAccess = false;
  let ownerAccessResolved = false;
  let ownerVerificationPromise = null;

  const ICONS = Object.freeze({

  function pathName() {
    return String(location.pathname || "").toLowerCase();
  }

  function isCirclePath() {
    return pathName().includes("ari-circle");
  }

  function isOwnerOnlyPath() {
    const path = pathName();
    return path.endsWith("/ari-circle-v6.html") || path.includes("ari-circle-explore") || path.includes("ari-circle-quest");
  }

  function ownerRouteFallback() {
    return pathName().includes("ari-circle-quest") ? MISSIONS_ROUTE_FALLBACK : OWNER_ROUTE_FALLBACK;
  }

  function holdOwnerOnlyRoute() {
    if (!isOwnerOnlyPath() || ownerAccessResolved) return;
    document.documentElement.style.visibility = "hidden";
    document.documentElement.setAttribute("data-ari-circle-owner-gate", "pending");
  }

  function releaseOwnerOnlyRoute() {
    document.documentElement.style.visibility = "";
    document.documentElement.removeAttribute("data-ari-circle-owner-gate");
  }

  async function verifyOwnerAccess() {
    if (ownerAccessResolved) return ownerAccess;
    if (ownerVerificationPromise) return ownerVerificationPromise;

    ownerVerificationPromise = (async () => {
      let verified = false;
      try {
        const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
        const { data, error } = client?.auth?.getSession ? await client.auth.getSession() : { data: null, error: null };
        const session = error ? null : data?.session;
        const accessToken = String(session?.access_token || "").trim();

        if (accessToken) {
          const response = await fetch("/api/ari-github-read", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store"
          });
          const payload = await response.json().catch(() => ({}));
          verified = response.ok && payload?.isOwner === true;
        }
      } catch (error) {
        console.warn("ARI Circle owner verification unavailable:", error?.message || error);
      }

      ownerAccess = verified;
      ownerAccessResolved = true;
      ownerVerificationPromise = null;

      if (isOwnerOnlyPath()) {
        if (!verified) {
          window.location.replace(ownerRouteFallback());
          return false;
        }
        releaseOwnerOnlyRoute();
      }

      run();
      return verified;
    })();

    return ownerVerificationPromise;
  }

  holdOwnerOnlyRoute();

  function ensureStylesheet(id, href, match) {
    if (document.getElementById(id)) return;
    const existing = match ? document.querySelector(`link[rel="stylesheet"][href*="${match}"]`) : null;
    if (existing) {
      existing.id ||= id;
      return;
    }
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }

  function ensureConnectStyle() {
    if (document.getElementById(CONNECT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CONNECT_STYLE_ID;
    style.textContent = `
      .circle-connect-mode-nav{margin:0 0 18px;padding:4px;display:grid;grid-template-columns:1fr;gap:4px;border:1px solid rgba(122,141,177,.2);border-radius:16px;background:rgba(255,255,255,.72)}
      .circle-connect-mode-nav a{display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:12px;text-decoration:none;font:800 .78rem/1 Inter,sans-serif;letter-spacing:.01em;color:#6f819d}
      .circle-connect-mode-nav a.is-active{background:#fff;color:#142033;box-shadow:0 8px 24px rgba(31,45,70,.10)}
    `;
    document.head.append(style);
  }

  function ensureStyles() {
    ensureStylesheet(STYLE_ID, STYLE_HREF, "ari-circle-v5-real-world.css");
    ensureStylesheet(PEARL_STYLE_ID, PEARL_STYLE_HREF, "ari-circle-v5-pearl.css");
    ensureStylesheet(PREMIUM_STYLE_ID, PREMIUM_STYLE_HREF, "ari-circle-v5-premium.css");
    ensureStylesheet(AUTHORITY_STYLE_ID, AUTHORITY_STYLE_HREF, "ari-circle-v5-visual-authority.css");
    ensureConnectStyle();
  }

  function activeKey() {
    const path = pathName();
    if (path.includes("ari-circle-meetup") || path.includes("ari-circle-quest")) return "connect";
    if (path.endsWith("/ari-circle-feed.html")) return "feed";
    return "";
  }

  function navLink(key, href, label) {
    const active = activeKey() === key;
    return `<a href="${href}" data-circle-v5-nav="${key}" class="${active ? "is-active" : ""}"${active ? ' aria-current="page"' : ""}>
      ${ICONS[key]}
      <span>${label}</span>
    </a>`;
  }

  function bottomNavMarkup() {
    return `<div class="circle-v5-bottom-nav__dock">
      ${navLink("feed", "ari-circle-feed.html", "Feed")}
      ${navLink("connect", "ari-circle-meetup.html", "Connect")}
    </div>`;
  }

  function ensureBottomNav() {
    let wrap = document.getElementById(NAV_ID);
    if (!wrap) {
      wrap = document.createElement("nav");
      wrap.id = NAV_ID;
      wrap.className = "circle-v5-bottom-nav";
      wrap.setAttribute("aria-label", "ARI Circle primary navigation");
      document.body.append(wrap);
    }

    const model = NAV_MODEL;
    if (wrap.dataset.circleNavModel !== model) {
      wrap.innerHTML = bottomNavMarkup();
      wrap.dataset.circleNavModel = model;
    }

    wrap.querySelectorAll("[data-circle-v5-nav]").forEach((link) => {
      const active = link.dataset.circleV5Nav === activeKey();
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
  }

  function ensureConnectModeNav() {
    document.getElementById(CONNECT_NAV_ID)?.remove();
  }

  function removeRedundantQuestDrawerLink() {
    document.querySelectorAll('.circle-v5-menu__panel a[href="ari-circle-quests.html"], .circle-v4-menu__panel a[href="ari-circle-quests.html"]').forEach((link) => link.remove());
  }

  function haloMarkup() {
    return `<span class="circle-v51-wordmark"><strong>ARI</strong><em>CIRCLE</em></span>`;
  }

  function shouldPlayHaloIntro() {
    try {
      if (sessionStorage.getItem(HALO_SEEN_KEY) === "1") return false;
      sessionStorage.setItem(HALO_SEEN_KEY, "1");
      return true;
    } catch {
      return false;
    }
  }

  function normalizeSignatureHeader() {
    const headers = document.querySelectorAll(".feed-header, .circle-v5-header, .circle-header");
    let introAvailable = shouldPlayHaloIntro();

    headers.forEach((header) => {
      if (!(header instanceof HTMLElement)) return;
      header.classList.add("circle-v51-halo-header");
      header.dataset.circleV51Halo = VERSION;

      const brand = header.querySelector(".feed-brand, .circle-v5-brand, .circle-header__brand");
      if (brand) {
        brand.classList.add("circle-v51-brand");
        brand.setAttribute("href", "ari-circle-feed.html");
        brand.setAttribute("aria-label", "ARI Circle Feed");
        if (brand.dataset.circleV51Brand !== VERSION) {
          brand.innerHTML = haloMarkup();
          brand.dataset.circleV51Brand = VERSION;
        }
      }

      const messageLink = header.querySelector("a.circle-v4-message");
      if (messageLink) {
        messageLink.classList.add("circle-v51-header-action");
        messageLink.innerHTML = ICONS.message;
      }

      const messageButton = header.querySelector("#circle-messages-button");
      if (messageButton) {
        messageButton.classList.add("circle-v51-header-action");
        const icon = messageButton.querySelector('span[aria-hidden="true"]');
        if (icon) icon.innerHTML = ICONS.message;
      }

      if (introAvailable && brand) {
        header.classList.add("circle-v51-halo-intro");
        introAvailable = false;
      }
    });
  }

  function loadRouteModules() {
    const path = pathName();
    if (!happeningLoaded && (path.endsWith("/ari-circle-feed.html") || document.querySelector(".feed-page"))) {
      happeningLoaded = true;
      import("/js/ari-circle/feed/happening-v5.js?v=5.2.2").catch((error) => {
        happeningLoaded = false;
        console.warn("ARI Circle Happening rail failed to load:", error);
      });
    }

  }

  function run() {
    if (!isCirclePath()) return;
    document.body?.classList.add("circle-v5-real-world");
    document.documentElement?.classList.add("circle-v5-real-world-root");
    ensureStyles();
    ensureBottomNav();
    ensureConnectModeNav();
    normalizeSignatureHeader();
    removeRedundantQuestDrawerLink();
    loadRouteModules();
    document.dispatchEvent(new CustomEvent("ari-circle:v5-real-world-ready", { detail: { version: VERSION, ownerAccess } }));
    if (!ownerAccessResolved) void verifyOwnerAccess();
  }

  function queueRun() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      run();
    });
  }

  function boundedRefresh() {
    run();
    window.setTimeout(run, 120);
    window.setTimeout(run, 700);
  }

  window.AriCircleV5RealWorld = Object.freeze({
    version: VERSION,
    refresh: run,
    verifyOwnerAccess,
    isOwner: () => ownerAccessResolved && ownerAccess
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boundedRefresh, { once: true });
  } else {
    boundedRefresh();
  }

  document.addEventListener("circle:app-ready", queueRun);
  window.addEventListener("ari-circle-access-ready", queueRun);
  window.addEventListener("pageshow", queueRun);
})();