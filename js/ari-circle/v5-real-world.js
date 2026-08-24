/* =============================================================
   ARI CIRCLE V5 — REAL WORLD SOCIAL SHELL
   Feed · Meet Up · Quests, with Profile accessible from the drawer.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
  if (window.AriCircleV5RealWorld?.version === VERSION) return;

  const STYLE_ID = "ariCircleV5RealWorldStyle";
  const STYLE_HREF = "assets/css/ari-circle-v5-real-world.css?v=5.0.0";
  const NAV_ID = "ariCircleV5BottomNav";
  let observer = null;
  let queued = false;
  let happeningLoaded = false;
  let profileLoaded = false;

  const ICONS = Object.freeze({
    feed: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="3"></rect><path d="M8 9h8M8 12.5h5M8 16h7"></path></svg>`,
    meetup: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="3"></circle><circle cx="16.5" cy="9" r="2.5"></circle><path d="M3.5 19c.5-3.5 2.3-5.3 5-5.3s4.6 1.8 5.1 5.3M14.2 14.2c3.4-.4 5.6 1.2 6.3 4.8"></path></svg>`,
    quests: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 6.2v5.2c0 4.4 2.7 7.5 6.5 9.6 3.8-2.1 6.5-5.2 6.5-9.6V6.2L12 3Z"></path><path d="m8.8 12 2.1 2.1 4.4-5"></path></svg>`
  });

  function pathName() {
    return String(location.pathname || "").toLowerCase();
  }

  function isCirclePath() {
    return pathName().includes("ari-circle");
  }

  function routeLegacySurface() {
    const path = pathName();
    if (path.endsWith("/ari-circle-partners.html")) {
      location.replace(`ari-circle-meetup.html${location.search || ""}${location.hash || ""}`);
      return true;
    }
    if (path.endsWith("/ari-circle-challenges.html")) {
      location.replace(`ari-circle-quests.html${location.search || ""}${location.hash || ""}`);
      return true;
    }
    return false;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = STYLE_HREF;
    document.head.append(link);
  }

  function activeKey() {
    const path = pathName();
    if (path.includes("meetup") || path.includes("partners")) return "meetup";
    if (path.includes("quest") || path.includes("challenge")) return "quests";
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
    } else {
      wrap.querySelectorAll("[data-circle-v5-nav]").forEach((link) => {
        const active = link.dataset.circleV5Nav === activeKey();
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }
  }

  function normalizeLegacyLinks() {
    document.querySelectorAll('a[href*="ari-circle-partners.html"]').forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.href);
      link.setAttribute("href", `ari-circle-meetup.html${url.search || ""}${url.hash || ""}`);
      const text = String(link.textContent || "").trim();
      if (["Buddies","Partners","Find People"].includes(text)) link.textContent = "Meet Up";
    });
    document.querySelectorAll('a[href*="ari-circle-challenges.html"]').forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.href);
      link.setAttribute("href", `ari-circle-quests.html${url.search || ""}${url.hash || ""}`);
      const text = String(link.textContent || "").trim();
      if (text === "Challenges") link.textContent = "Quests";
    });
  }

  function normalizeDrawer() {
    document.querySelectorAll(".circle-v5-menu__item").forEach((item) => {
      const label = item.querySelector(".circle-v5-menu__label");
      const text = String(label?.textContent || "").trim();
      if (["Find People", "Buddies", "Partners"].includes(text)) {
        if (item.tagName === "A") item.href = "ari-circle-meetup.html";
        if (label) label.textContent = "Meet Up";
      }
    });

    document.querySelectorAll(".circle-v5-menu__items").forEach((items) => {
      const hasProfile = [...items.querySelectorAll(".circle-v5-menu__label")]
        .some((label) => label.textContent?.trim() === "Profile");
      if (hasProfile || items.querySelector('[data-circle-v5-profile-link="true"]')) return;
      const link = document.createElement("a");
      link.href = "ari-circle.html";
      link.className = "circle-v5-menu__item";
      link.dataset.circleV5ProfileLink = "true";
      link.innerHTML = `<span class="circle-v5-menu__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg></span><span class="circle-v5-menu__label">Profile</span><span class="circle-v5-menu__chevron" aria-hidden="true">›</span>`;
      const privacy = [...items.children].find((child) => child.querySelector?.(".circle-v5-menu__label")?.textContent?.trim() === "Privacy & Visibility");
      items.insertBefore(link, privacy || null);
    });
  }

  function normalizeLegacyText() {
    document.querySelectorAll(".partner-loading strong").forEach((node) => { node.textContent = "Opening Meet Up"; });
    document.querySelectorAll(".challenge-loading strong").forEach((node) => { node.textContent = "Opening Quests"; });
  }

  function loadRouteModules() {
    const path = pathName();
    if (!happeningLoaded && (path.endsWith("/ari-circle-feed.html") || document.querySelector(".feed-page"))) {
      happeningLoaded = true;
      import("/js/ari-circle/feed/happening-v5.js?v=5.0.0").catch((error) => {
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
    if (!isCirclePath() || routeLegacySurface()) return;
    document.body?.classList.add("circle-v5-real-world");
    document.documentElement?.classList.add("circle-v5-real-world-root");
    ensureStyle();
    ensureBottomNav();
    normalizeLegacyLinks();
    normalizeDrawer();
    normalizeLegacyText();
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

  function watch() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) queueRun();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.AriCircleV5RealWorld = Object.freeze({ version: VERSION, refresh: run });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { run(); watch(); }, { once: true });
  else { run(); watch(); }

  document.addEventListener("circle:app-ready", queueRun);
  window.addEventListener("pageshow", queueRun);
})();
