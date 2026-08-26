/* =============================================================
   ARI CIRCLE — CONTROL DRAWER V5.3
   Version: 2.5.0
   Adults-only shared controls + authoritative Real World Social shell.
   The drawer panel is portaled to <body> so iOS Safari cannot clip it
   inside the sticky/backdrop-filtered header.
============================================================= */

(() => {
  "use strict";

  const VERSION = "2.5.0";
  const STYLE_ID = "ariCircleMenuV5Style";
  const STYLE_HREF = "assets/css/ari-circle-menu-v5.css?v=1.1.0";
  const AUTHORITY_STYLE_ID = "ariCircleMenuV5AuthorityStyle";
  const AUTHORITY_STYLE_HREF = "assets/css/ari-circle-menu-v5-authority.css?v=1.0.0";
  const READY_ATTR = "data-circle-menu-v5";
  const PANEL_ATTR = "data-circle-menu-panel-id";
  const ADULT_GUARD_SCRIPT_ID = "ariCircleAdultOnlyGuardScript";
  const ADULT_GUARD_SCRIPT_SRC = "js/ari-circle/adult-only-guard.js?v=1.0.0";
  const PRIVATE_MEDIA_SCRIPT_ID = "ariCirclePrivateMediaScript";
  const PRIVATE_MEDIA_SCRIPT_SRC = "js/ari-circle/private-media.js?v=1.0.0";
  const PROFILE_SAFETY_SCRIPT_ID = "ariCircleProfileSafetyScript";
  const PROFILE_SAFETY_SCRIPT_SRC = "js/ari-circle/profile/profile-safety.js?v=1.1.0";
  const REAL_WORLD_SCRIPT_ID = "ariCircleV5RealWorldScript";
  const REAL_WORLD_SCRIPT_SRC = "js/ari-circle/v5-real-world.js?v=5.3.0";
  let outsideBound = false;
  let panelSequence = 0;

  function adultAccessReady() {
    return window.ARI_CIRCLE_AGE_STATE?.circleAllowed === true;
  }

  function holdForAdultGate() {
    if (adultAccessReady()) return;
    document.documentElement.setAttribute("data-ari-circle-gate", "pending");
    document.documentElement.style.visibility = "hidden";
  }

  function revealAdultCircleUi() {
    if (!adultAccessReady()) return false;
    document.documentElement.style.visibility = "";
    document.documentElement.removeAttribute("data-ari-circle-gate");
    return true;
  }

  holdForAdultGate();

  function loadAdultGuard() {
    if (window.AriCircleAdultGuard || document.getElementById(ADULT_GUARD_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = ADULT_GUARD_SCRIPT_ID;
    script.src = ADULT_GUARD_SCRIPT_SRC;
    script.async = false;
    document.head.append(script);
  }

  const icon = Object.freeze({
    menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"></path></svg>`,
    bell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path><path d="M10 20h4"></path></svg>`,
    quest: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 6.2v5.2c0 4.4 2.7 7.5 6.5 9.6 3.8-2.1 6.5-5.2 6.5-9.6V6.2L12 3Z"></path><path d="m8.8 12 2.1 2.1 4.4-5"></path></svg>`,
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>`,
    discover: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"></circle><path d="M2.8 17c.5-3 2.3-4.7 5.2-4.7 1.7 0 3 .6 4 1.6"></path><circle cx="16.5" cy="15.5" r="3.2"></circle><path d="m19 18 2.5 2.5"></path></svg>`,
    privacy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="M9.5 12.5 11 14l3.5-4"></path></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="M12 8v4M12 16h.01"></path></svg>`,
    exit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"></path></svg>`,
    settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06-.06A1.7 1.7 0 0 0 19.4 9c.18.37.46.68.8.9.33.22.72.34 1.1.34h.1v4h-.1c-.38 0-.77.12-1.1.34-.34.22-.62.53-.8.9Z"></path></svg>`
  });

  function loadPrivateMedia() {
    if (!adultAccessReady()) return;
    if (window.AriCirclePrivateMedia || document.getElementById(PRIVATE_MEDIA_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = PRIVATE_MEDIA_SCRIPT_ID;
    script.src = PRIVATE_MEDIA_SCRIPT_SRC;
    script.async = false;
    document.head.append(script);
  }

  function loadRealWorldShell() {
    if (!adultAccessReady()) return;
    if (window.AriCircleV5RealWorld?.version === "5.3.0") {
      window.AriCircleV5RealWorld.refresh?.();
      return;
    }
    if (document.querySelector(`script[src*="v5-real-world.js?v=5.3.0"]`)) return;
    const script = document.createElement("script");
    script.id = REAL_WORLD_SCRIPT_ID;
    script.src = REAL_WORLD_SCRIPT_SRC;
    script.defer = true;
    document.head.append(script);
  }

  function shouldLoadProfileSafety() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/ari-circle.html") || Boolean(document.body?.classList.contains("ari-circle-page"));
  }

  function primeProfileV5Theme() {
    if (!shouldLoadProfileSafety()) return;
    document.documentElement.classList.add("circle-v5-real-world-root");
    document.body?.classList.add("circle-v5-real-world");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", "#f8faff");
  }

  function loadProfileSafety() {
    if (!adultAccessReady() || !shouldLoadProfileSafety()) return;
    if (window.AriCircleProfileSafety || document.getElementById(PROFILE_SAFETY_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = PROFILE_SAFETY_SCRIPT_ID;
    script.src = PROFILE_SAFETY_SCRIPT_SRC;
    script.async = false;
    document.head.append(script);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = STYLE_HREF;
    document.head.append(link);
  }

  function ensureThemeAuthority() {
    let link = document.getElementById(AUTHORITY_STYLE_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = AUTHORITY_STYLE_ID;
      link.rel = "stylesheet";
      link.href = AUTHORITY_STYLE_HREF;
      document.head.append(link);
      return;
    }
    if (link.parentElement === document.head && link !== document.head.lastElementChild) {
      document.head.append(link);
    }
  }

  function item({ href = "#", label, iconMarkup, exit = false, button = false, profileOptions = false }) {
    const tag = button ? "button" : "a";
    const attributes = button ? `type="button"${profileOptions ? " data-circle-v5-profile-options" : ""}` : `href="${href}"`;
    return `<${tag} ${attributes} class="circle-v5-menu__item${exit ? " circle-v5-menu__item--exit" : ""}">
      <span class="circle-v5-menu__icon">${iconMarkup}</span>
      <span class="circle-v5-menu__label">${label}</span>
      <span class="circle-v5-menu__chevron" aria-hidden="true">›</span>
    </${tag}>`;
  }

  function group(label, rows) {
    return `<section class="circle-v52-menu-group" aria-label="${label}">
      <p class="circle-v52-menu-group__label">${label}</p>
      <div class="circle-v52-menu-group__items">${rows}</div>
    </section>`;
  }

  function markup(includeProfileOptions = false) {
    const mainRows = [
      item({ href: "ari-circle.html?panel=notifications", label: "Notifications", iconMarkup: icon.bell }),
      item({ href: "ari-circle.html", label: "Profile", iconMarkup: icon.user }),
      item({ href: "ari-circle.html?panel=discover-friends", label: "Discover Friends", iconMarkup: icon.discover }),
      item({ href: "ari-circle-quests.html", label: "Quests", iconMarkup: icon.quest })
    ].join("");
    const accountRows = [
      includeProfileOptions ? item({ label: "Profile Options", iconMarkup: icon.user, button: true, profileOptions: true }) : item({ href: "ari-circle.html#about", label: "Profile Options", iconMarkup: icon.user }),
      item({ href: "account.html", label: "Privacy & Visibility", iconMarkup: icon.privacy }),
      item({ href: "help-safety.html", label: "Circle Safety", iconMarkup: icon.shield })
    ].join("");

    return `
      <summary class="feed-icon-button" aria-label="Open Circle menu">${icon.menu}</summary>
      <nav class="circle-v4-menu__panel circle-v5-menu__panel" aria-label="Circle menu">
        <div class="circle-v5-menu__identity">
          <span class="circle-v5-menu__mark" aria-hidden="true"></span>
          <span class="circle-v5-menu__identity-text"><strong>ARI CIRCLE</strong><small>Circle controls</small></span>
        </div>
        ${group("Main", mainRows)}
        ${group("Account", accountRows)}
        <div class="circle-v52-menu-exit">${item({ href: "home.html", label: "Exit ARI Circle", iconMarkup: icon.exit, exit: true })}</div>
        <div class="circle-v52-menu-footer">V5.3</div>
      </nav>`;
  }

  function isProfileMenu(details) {
    return details.classList.contains("circle-v4-menu--profile") || Boolean(document.body.classList.contains("ari-circle-page"));
  }

  function panelFor(details) {
    const panelId = details?.getAttribute?.(PANEL_ATTR);
    return panelId ? document.getElementById(panelId) : null;
  }

  function syncDocumentMenuState() {
    const anyOpen = Boolean(document.querySelector("details.circle-v4-menu[open]"));
    document.body?.classList.toggle("circle-v5-menu-open", anyOpen);
  }

  function syncMenuState(details) {
    const summary = details.querySelector("summary");
    const panel = panelFor(details);
    const open = details.open === true;
    if (summary) summary.setAttribute("aria-expanded", String(open));
    if (panel) panel.hidden = !open;
    if (open) ensureThemeAuthority();
    syncDocumentMenuState();
  }

  function portalPanel(details) {
    let panel = panelFor(details);
    if (!panel) panel = details.querySelector(".circle-v5-menu__panel, .circle-v4-menu__panel");
    if (!panel) return null;

    if (!panel.id) panel.id = `ariCircleMenuPanel${++panelSequence}`;
    details.setAttribute(PANEL_ATTR, panel.id);
    panel.dataset.circleV5Portal = "true";

    const summary = details.querySelector("summary");
    if (summary) {
      summary.dataset.circleV5Summary = VERSION;
      summary.setAttribute("aria-controls", panel.id);
      summary.setAttribute("aria-haspopup", "menu");
    }

    if (panel.parentElement !== document.body) document.body.append(panel);

    if (details.dataset.circleV5ToggleBound !== "true") {
      details.dataset.circleV5ToggleBound = "true";
      details.addEventListener("toggle", () => syncMenuState(details));
    }

    syncMenuState(details);
    return panel;
  }

  function bindProfileOptions(details) {
    const button = panelFor(details)?.querySelector("[data-circle-v5-profile-options]") || details.querySelector("[data-circle-v5-profile-options]");
    if (!button || button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const legacy = document.getElementById("circle-profile-menu-button");
      if (legacy) legacy.click();
      details.removeAttribute("open");
      syncMenuState(details);
    });
  }

  function normalizeMenu(details) {
    if (!(details instanceof HTMLElement)) return;
    const includeProfileOptions = isProfileMenu(details);
    const expectedProfile = includeProfileOptions ? "profile" : "standard";
    const currentVersion = details.getAttribute(READY_ATTR);
    const existingPanel = panelFor(details) || details.querySelector(".circle-v5-menu__panel, .circle-v4-menu__panel");
    const hasV52Markup = Boolean(existingPanel?.querySelector(".circle-v52-menu-group"));
    const hasCurrentSummary = details.querySelector("summary")?.dataset.circleV5Summary === VERSION;

    if (currentVersion !== `${VERSION}:${expectedProfile}` || !hasV52Markup || !hasCurrentSummary) {
      panelFor(details)?.remove();
      details.removeAttribute(PANEL_ATTR);
      details.innerHTML = markup(includeProfileOptions);
      details.setAttribute(READY_ATTR, `${VERSION}:${expectedProfile}`);
    }

    portalPanel(details);
    bindProfileOptions(details);
  }

  function normalizeMenus() {
    document.querySelectorAll("details.circle-v4-menu").forEach(normalizeMenu);
  }

  function ensureNotificationSettingsLink() {
    const dialog = document.getElementById("circle-notifications-dialog");
    const toolbar = dialog?.querySelector(".circle-notifications-toolbar");
    if (!toolbar || toolbar.querySelector(".circle-notifications-settings-link")) return;
    const link = document.createElement("a");
    link.className = "circle-notifications-settings-link";
    link.href = "notification-settings.html";
    link.setAttribute("aria-label", "Notification settings");
    link.innerHTML = `${icon.settings}<span>Settings</span>`;
    toolbar.prepend(link);
  }

  function isDiscoverFriendsRoute() {
    if (!shouldLoadProfileSafety()) return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("panel") === "discover-friends";
  }

  function clearDiscoverFriendsRoute() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("panel") !== "discover-friends") return;
    url.searchParams.delete("panel");
    window.history.replaceState(window.history.state, "", url.href);
  }

  function openRequestedDiscoverFriends() {
    if (!isDiscoverFriendsRoute()) return false;

    const trigger = document.getElementById("circle-find-friends-button");
    if (!trigger || trigger.hidden || trigger.disabled) return false;

    trigger.click();

    const dialog = document.getElementById("circle-people-discovery");
    if (!dialog?.open) return false;

    clearDiscoverFriendsRoute();
    return true;
  }

  function closeMenus(except = null) {
    document.querySelectorAll("details.circle-v4-menu[open]").forEach((details) => {
      if (details === except) return;
      details.removeAttribute("open");
      syncMenuState(details);
    });
    syncDocumentMenuState();
  }

  function bindOutsideClose() {
    if (outsideBound) return;
    outsideBound = true;
    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.(".circle-v5-menu__panel, .circle-v4-menu__panel")) return;

      const menu = event.target.closest?.("details.circle-v4-menu");
      if (menu) {
        if (event.target.closest?.("summary")) {
          if (!menu.open) closeMenus(menu);
          return;
        }
        if (menu.open) {
          menu.removeAttribute("open");
          syncMenuState(menu);
        }
        return;
      }
      closeMenus();
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenus();
    });
  }

  function run() {
    if (!adultAccessReady()) return;
    revealAdultCircleUi();
    primeProfileV5Theme();
    loadPrivateMedia();
    loadProfileSafety();
    loadRealWorldShell();
    ensureStyle();
    ensureThemeAuthority();
    normalizeMenus();
    ensureThemeAuthority();
    ensureNotificationSettingsLink();
    openRequestedDiscoverFriends();
    bindOutsideClose();
  }

  function startAdultCircleUi() {
    if (!adultAccessReady()) return;
    revealAdultCircleUi();
    run();
    setTimeout(run, 160);
    setTimeout(run, 700);
  }

  window.addEventListener("ari-circle-access-ready", startAdultCircleUi, { once: true });
  loadAdultGuard();

  if (adultAccessReady()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAdultCircleUi, { once: true });
    else startAdultCircleUi();
  }

  document.addEventListener("circle:app-ready", () => setTimeout(run, 0));
  window.addEventListener("pageshow", () => setTimeout(run, 0));

  window.AriCircleMenuV5 = Object.freeze({ version: VERSION, refresh: run });
})();