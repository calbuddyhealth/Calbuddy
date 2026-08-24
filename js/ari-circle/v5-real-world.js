/* =============================================================
   ARI CIRCLE V5.2.3 — REAL WORLD SOCIAL SHELL
   Feed · Meet Up · Quests, with Profile accessible from the drawer.
   One current navigation owner, bounded lifecycle refreshes, and no retired
   Buddies/Challenges route shims.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.2.3";
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
  const HALO_SEEN_KEY = "ari-circle-v522-wordmark-seen";
  let queued = false;
  let happeningLoaded = false;
  let profileLoaded = false;

  const ICONS = Object.freeze({
    feed: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="3"></rect><path d="M8 9h8M8 12.5h5M8 16h7"></path></svg>`,
    meetup: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="3"></circle><circle cx="16.5" cy="9" r="2.5"></circle><path d="M3.5 19c.5-3.5 2.3-5.3 5-5.3s4.6 1.8 5.1 5.3M14.2 14.2c3.4-.4 5.6 1.2 6.3 4.8"></path></svg>`,
    quests: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 6.2v5.2c0 4.4 2.7 7.5 6.5 9.6 3.8-2.1 6.5-5.2 6.5-9.6V6.2L12 3Z"></path><path d="m8.8 12 2.1 2.1 4.4-5"></path></svg>`,
    message: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.25 3.75 20l.85-3.45A7.9 7.9 0 0 1 3 11.75C3 7.47 6.9 4 11.7 4h.6c4.8 0 8.7 3.47 8.7 7.75s-3.9 7.75-8.7 7.75h-.6A9.5 9.5 0 0 1 7 18.25Z"></path></svg>`
  });

  function pathName() {
    return String(location.pathname || "").toLowerCase();
  }

  function isCirclePath() {
    return pathName().includes("ari-circle");
  }

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

  function ensureStyles() {
    ensureStylesheet(STYLE_ID, STYLE_HREF, "ari-circle-v5-real-world.css");
    ensureStylesheet(PEARL_STYLE_ID, PEARL_STYLE_HREF, "ari-circle-v5-pearl.css");
    ensureStylesheet(PREMIUM_STYLE_ID, PREMIUM_STYLE_HREF, "ari-circle-v5-premium.css");
    ensureStylesheet(AUTHORITY_STYLE_ID, AUTHORITY_STYLE_HREF, "ari-circle-v5-visual-authority.css");
  }

  function activeKey() {
    const path = pathName();
    if (path.includes("meetup")) return "meetup";
    if (path.includes("quest")) return "quests";
    if (path.endsWith("/ari-circle-feed.html")) return "feed";
    if (path.endsWith("/ari-circle.html")) return "profile";
    return "";
  }

  function navLink(key, href, label) {
    const active = activeKey() === key;
    return `<a href="${href}" data-circle-v5-nav="${key}" class="${active ? "is-active" : ""}"${active ? ' aria-current="page"' : ""}>
      ${ICONS[key]}
      <span>${label}</span>
    </a>`;
  }

  function ensureBottomNav() {
    let wrap = document.getElementById(NAV_ID);
    if (!wrap) {
      wrap = document.createElement("nav");
      wrap.id = NAV_ID;
      wrap.className = "circle-v5-bottom-nav";
      wrap.setAttribute("aria-label", "ARI Circle primary navigation");
      wrap.innerHTML = `<div class="circle-v5-bottom-nav__dock">
        ${navLink("feed", "ari-circle-feed.html", "Feed")}
        ${navLink("meetup", "ari-circle-meetup.html", "Meet Up")}
        ${navLink("quests", "ari-circle-quests.html", "Quests")}
      </div>`;
      document.body.append(wrap);
      return;
    }

    wrap.querySelectorAll("[data-circle-v5-nav]").forEach((link) => {
      const active = link.dataset.circleV5Nav === activeKey();
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
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
    if (!profileLoaded && (path.endsWith("/ari-circle.html") || document.body?.classList.contains("ari-circle-page"))) {
      profileLoaded = true;
      import("/js/ari-circle/profile/profile-v5-real-world.js?v=5.0.0").catch((error) => {
        profileLoaded = false;
        console.warn("ARI Circle Real World profile failed to load:", error);
      });
    }
  }

  function run() {
    if (!isCirclePath()) return;
    document.body?.classList.add("circle-v5-real-world");
    document.documentElement?.classList.add("circle-v5-real-world-root");
    ensureStyles();
    ensureBottomNav();
    normalizeSignatureHeader();
    loadRouteModules();
    document.dispatchEvent(new CustomEvent("ari-circle:v5-real-world-ready", { detail: { version: VERSION } }));
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

  window.AriCircleV5RealWorld = Object.freeze({ version: VERSION, refresh: run });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boundedRefresh, { once: true });
  } else {
    boundedRefresh();
  }

  document.addEventListener("circle:app-ready", queueRun);
  window.addEventListener("ari-circle-access-ready", queueRun);
  window.addEventListener("pageshow", queueRun);
})();