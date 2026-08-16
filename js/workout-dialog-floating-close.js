// ARI XP — workout dialog floating close controls v1.0.0
(() => {
  "use strict";

  const PAGE = String(window.location.pathname || "").split("/").pop().toLowerCase();
  if (PAGE !== "workout-plans.html") return;

  const STYLE_ID = "ariWorkoutDialogFloatingCloseStyle";
  const STYLE_HREF = "assets/css/workout-plans-native-dialog.css?v=1.1.0";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) =>
      String(link.getAttribute("href") || "").includes("workout-plans-native-dialog.css")
    )) return;

    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = STYLE_HREF;
    document.head.appendChild(link);
  }

  function bindDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    const panel = dialog?.querySelector(".workout-dialog__panel");
    const closeButton = dialog?.querySelector(".workout-dialog__close");
    if (!dialog || !panel || !closeButton) return;
    if (closeButton.dataset.ariFloatingCloseBound === "true") return;

    closeButton.dataset.ariFloatingCloseBound = "true";
    closeButton.classList.add("ari-native-floating-dialog-close");

    let frame = 0;
    const sync = () => {
      frame = 0;
      const scrollTop = Math.max(0, Number(panel.scrollTop || 0));
      closeButton.style.setProperty("--ari-native-dialog-scroll-y", `${scrollTop}px`);
      closeButton.classList.toggle("is-ari-dialog-scrolled", scrollTop > 8);
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    panel.addEventListener("scroll", scheduleSync, { passive: true });

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "open")) {
        window.requestAnimationFrame(sync);
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });

    sync();
  }

  function setup() {
    ensureStyles();
    bindDialog("workoutDayEditor");
    bindDialog("workoutExercisePicker");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
