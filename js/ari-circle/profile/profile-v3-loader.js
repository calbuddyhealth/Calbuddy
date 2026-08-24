// ARI Circle lightweight V4 profile loader.
// Keeps the legacy profile renderer/controllers while loading only the
// social data the simplified profile actually displays.

const PROFILE_STYLE_ID = "ari-circle-profile-v3-style";
const V4_STYLE_ID = "ari-circle-v4-style";
const V4_POLISH_STYLE_ID = "ari-circle-v4-polish-style";
const MEDIA_STYLE_ID = "ari-circle-media-style";
const PROFILE_BOOT_STYLE_ID = "ari-circle-profile-boot-style";

const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta) themeMeta.setAttribute("content", "#f8faff");

const routeParams = new URLSearchParams(window.location.search);
const isOwnProfileRoute = !routeParams.get("user") && !routeParams.get("handle");

document.documentElement.classList.add("circle-profile-hydrating");
if (isOwnProfileRoute) document.documentElement.classList.add("circle-profile-own-route");

if (!document.getElementById(PROFILE_BOOT_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = PROFILE_BOOT_STYLE_ID;
  style.textContent = `
    .circle-profile-hydrating #circle-owner-actions,
    .circle-profile-hydrating #circle-visitor-actions,
    .circle-profile-hydrating #circle-presence {
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .circle-profile-hydrating.circle-profile-own-route #circle-owner-actions {
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    .circle-profile-hydrating.circle-profile-own-route #circle-visitor-actions,
    .circle-profile-hydrating.circle-profile-own-route #circle-presence[hidden] {
      display: none !important;
    }

    .circle-profile-hydrating:not(.circle-profile-own-route) .circle-profile__body::after {
      content: "";
      display: block;
      width: min(100%, 360px);
      height: 70px;
      margin: 28px auto 0;
      border: 1px solid rgba(65, 108, 235, 0.08);
      border-radius: 18px;
      background:
        linear-gradient(100deg,
          rgba(245, 248, 255, 0.72) 10%,
          rgba(255, 255, 255, 0.98) 38%,
          rgba(238, 244, 255, 0.82) 66%,
          rgba(245, 248, 255, 0.72) 90%);
      background-size: 220% 100%;
      box-shadow: 0 16px 38px rgba(30, 66, 150, 0.06);
      animation: circleProfileBootShimmer 1.15s ease-in-out infinite;
    }

    html:not(.circle-profile-hydrating) #circle-owner-actions,
    html:not(.circle-profile-hydrating) #circle-visitor-actions,
    html:not(.circle-profile-hydrating) #circle-presence {
      transition: opacity 160ms ease, transform 160ms ease;
    }

    body.ari-circle-page #circle-owner-actions {
      width: min(100%, 390px);
      margin-inline: auto;
    }

    body.ari-circle-page #circle-owner-actions #circle-edit-profile-action:only-child {
      width: 100%;
    }

    @keyframes circleProfileBootShimmer {
      0% { background-position: 110% 0; opacity: .72; }
      50% { opacity: 1; }
      100% { background-position: -110% 0; opacity: .72; }
    }

    @media (prefers-reduced-motion: reduce) {
      .circle-profile-hydrating .circle-profile__body::after {
        animation: none;
      }
    }
  `;
  document.head.append(style);
}

if (!document.getElementById(PROFILE_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = PROFILE_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-profile-v3.css?v=1.0.1";
  document.head.append(link);
}

if (!document.getElementById(V4_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = V4_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-v4.css?v=4.0.0";
  document.head.append(link);
}

if (!document.getElementById(V4_POLISH_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = V4_POLISH_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-v4-polish.css?v=4.1.0";
  document.head.append(link);
}

if (!document.getElementById(MEDIA_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = MEDIA_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-media.css?v=1.0.1";
  document.head.append(link);
}

function primeOwnProfileActions() {
  if (!isOwnProfileRoute) return;

  const ownerActions = document.getElementById("circle-owner-actions");
  const visitorActions = document.getElementById("circle-visitor-actions");
  const edit = document.getElementById("circle-edit-profile-action");

  if (visitorActions) {
    visitorActions.hidden = true;
    visitorActions.style.display = "none";
  }

  if (ownerActions) {
    ownerActions.hidden = false;
    ownerActions.style.display = "grid";
  }

  if (edit) {
    edit.hidden = false;
    edit.disabled = false;
    edit.textContent = "Edit Profile";
  }
}

function finishProfessionalProfileBoot() {
  const started = performance.now();

  if (isOwnProfileRoute) {
    primeOwnProfileActions();
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("circle-profile-hydrating");
    });
    return;
  }

  const finish = () => {
    const flow = window.AriCircleV4FlowFixes;
    const relationship = flow?.relationship?.() || "unknown";
    const ownerActions = document.getElementById("circle-owner-actions");
    const visitorActions = document.getElementById("circle-visitor-actions");

    if (relationship !== "unknown" && ownerActions && visitorActions) {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("circle-profile-hydrating");
      });
      return;
    }

    if (performance.now() - started > 1200) {
      document.documentElement.classList.remove("circle-profile-hydrating");
      return;
    }

    requestAnimationFrame(finish);
  };

  requestAnimationFrame(finish);
}

Promise.all([
  import("./profile-v4.js?v=4.3.0"),
  import("../v4-ui.js?v=5.2.7"),
  import("../v4-flow-fixes.js?v=1.2.1")
])
  .then(() => finishProfessionalProfileBoot())
  .catch((error) => {
    primeOwnProfileActions();
    document.documentElement.classList.remove("circle-profile-hydrating");
    console.error("ARI Circle profile enhancement failed to load:", error);
  });