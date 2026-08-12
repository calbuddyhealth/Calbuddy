/* =============================================================
   ARI CIRCLE — CHALLENGE ENTRY VIEWER UX
   Version: 1.0.0

   Makes long challenge-entry viewers easy to exit on mobile:
   - Persistent floating close button after the header scrolls away
   - Tap the blurred backdrop to close
   - Swipe down from the top of the entry sheet to dismiss
============================================================= */

(() => {
  "use strict";

  const dialog = document.getElementById("entriesDialog");
  if (!dialog) return;

  const card = dialog.querySelector(".challenge-entries-card");
  const originalClose = dialog.querySelector('[data-close-dialog="entriesDialog"]');
  if (!card || !originalClose) return;

  const style = document.createElement("style");
  style.textContent = `
    #entriesDialog .challenge-entry-floating-close {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 14px);
      right: 16px;
      z-index: 2147483000;
      display: grid;
      place-items: center;
      width: 50px;
      height: 50px;
      padding: 0;
      border: 1px solid rgba(70, 88, 145, .14);
      border-radius: 50%;
      color: #526078;
      background: rgba(255, 255, 255, .94);
      box-shadow: 0 12px 34px rgba(28, 43, 92, .18);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      font-size: 28px;
      font-weight: 400;
      line-height: 1;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px) scale(.96);
      transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
      -webkit-tap-highlight-color: transparent;
    }

    #entriesDialog .challenge-entry-floating-close.is-visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    #entriesDialog .challenge-entry-floating-close:active {
      transform: scale(.93);
    }

    #entriesDialog .challenge-entries-card {
      overscroll-behavior: contain;
      transition: transform .18s ease;
      will-change: transform;
    }

    #entriesDialog.is-swipe-dismissing .challenge-entries-card {
      transition: none;
    }

    @media (min-width: 700px) {
      #entriesDialog .challenge-entry-floating-close {
        right: max(24px, calc((100vw - 620px) / 2));
      }
    }
  `;
  document.head.appendChild(style);

  const floatingClose = document.createElement("button");
  floatingClose.type = "button";
  floatingClose.className = "challenge-entry-floating-close";
  floatingClose.setAttribute("aria-label", "Close challenge entries");
  floatingClose.textContent = "×";
  dialog.appendChild(floatingClose);

  const closeViewer = () => {
    floatingClose.classList.remove("is-visible");
    card.style.transform = "";
    dialog.classList.remove("is-swipe-dismissing");
    if (dialog.open) dialog.close();
  };

  floatingClose.addEventListener("click", closeViewer);

  const syncFloatingClose = () => {
    if (!dialog.open) {
      floatingClose.classList.remove("is-visible");
      return;
    }

    // The built-in X is still available at the top. Only introduce the
    // viewport-level X after the user has actually scrolled it away.
    floatingClose.classList.toggle("is-visible", card.scrollTop > 72);
  };

  card.addEventListener("scroll", syncFloatingClose, { passive: true });

  dialog.addEventListener("click", (event) => {
    // A click directly on the dialog element is the blurred backdrop,
    // not the white entry card.
    if (event.target === dialog) closeViewer();
  });

  dialog.addEventListener("close", () => {
    floatingClose.classList.remove("is-visible");
    card.scrollTop = 0;
    card.style.transform = "";
    dialog.classList.remove("is-swipe-dismissing");
  });

  let startY = 0;
  let startX = 0;
  let dragging = false;
  let dragDistance = 0;

  card.addEventListener("touchstart", (event) => {
    if (!dialog.open || card.scrollTop > 2 || event.touches.length !== 1) return;
    const touch = event.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;
    dragDistance = 0;
    dragging = true;
  }, { passive: true });

  card.addEventListener("touchmove", (event) => {
    if (!dragging || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dy = touch.clientY - startY;
    const dx = Math.abs(touch.clientX - startX);

    if (dy <= 0 || dx > dy * .75) {
      if (dy < -8 || dx > 28) dragging = false;
      return;
    }

    dragDistance = Math.min(dy, 180);
    if (dragDistance > 8) {
      dialog.classList.add("is-swipe-dismissing");
      card.style.transform = `translateY(${dragDistance * .46}px)`;
    }
  }, { passive: true });

  card.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;

    if (dragDistance >= 92) {
      closeViewer();
      return;
    }

    dialog.classList.remove("is-swipe-dismissing");
    card.style.transform = "";
    dragDistance = 0;
  }, { passive: true });

  // Keep state correct when challenges.js opens the native <dialog>.
  const observer = new MutationObserver(syncFloatingClose);
  observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
})();
