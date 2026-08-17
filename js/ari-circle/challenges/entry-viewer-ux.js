/* =============================================================
   ARI CIRCLE — CHALLENGE ENTRY VIEWER UX
   Version: 1.1.0

   Makes long challenge-entry viewers easy to exit on mobile:
   - Persistent floating close button after the header scrolls away
   - Tap the blurred backdrop to close
   - Swipe down from the top of the entry sheet to dismiss
   - Build 5 single-entry guard for non-goal challenges
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

/* =============================================================
   BUILD 5 — SINGLE CHALLENGE ENTRY GUARD

   The database is authoritative. This browser layer mirrors that rule so a
   participant who has already submitted sees a final state instead of an
   "Update Entry" path. viewer_completed_at intentionally remains effective
   after an entry is deleted, preventing delete-and-resubmit bypasses.
============================================================= */
(() => {
  "use strict";

  const list = document.getElementById("challengeList");
  if (!list) return;

  const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
  if (!client?.rpc) return;

  const lockedChallengeIds = new Set();
  let syncTimer = 0;
  let syncing = false;

  const showSingleEntryToast = () => {
    const toast = document.getElementById("challengeToast");
    if (!toast) return;
    toast.textContent = "Entry submitted. Each challenge allows one final entry.";
    toast.hidden = false;
    window.clearTimeout(showSingleEntryToast.timer);
    showSingleEntryToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  };

  const lockButton = (button) => {
    if (!button) return;
    button.textContent = "Entry Submitted";
    button.dataset.entrySubmitted = "true";
    button.setAttribute("aria-disabled", "true");
    button.classList.add("is-entry-submitted");
  };

  const unlockButton = (button) => {
    if (!button || button.dataset.entrySubmitted !== "true") return;
    button.textContent = "Post Entry";
    delete button.dataset.entrySubmitted;
    button.removeAttribute("aria-disabled");
    button.classList.remove("is-entry-submitted");
  };

  const paintCards = () => {
    list.querySelectorAll(".challenge-card[data-challenge-id]").forEach((card) => {
      const button = card.querySelector("[data-primary]");
      if (!button) return;
      const label = String(button.textContent || "").trim();
      const isGoalAction = label === "Join Challenge" || label === "Add Progress";
      if (isGoalAction) return;
      if (lockedChallengeIds.has(card.dataset.challengeId)) lockButton(button);
      else if (label === "Update Entry") lockButton(button);
      else unlockButton(button);
    });
  };

  const syncLocks = async () => {
    if (syncing) return;
    syncing = true;
    try {
      const { data, error } = await client.rpc("ari_circle_challenge_list_v2", { result_limit: 70 });
      if (error) throw error;
      lockedChallengeIds.clear();
      (Array.isArray(data) ? data : []).forEach((challenge) => {
        if (challenge?.challenge_mode === "goal") return;
        if (challenge?.viewer_has_entry || challenge?.viewer_completed_at) {
          lockedChallengeIds.add(String(challenge.challenge_id));
        }
      });
      paintCards();
    } catch (error) {
      console.warn("ARI Circle single-entry state unavailable:", error);
      // Even if the refresh fails, never expose the legacy update affordance.
      list.querySelectorAll("[data-primary]").forEach((button) => {
        if (String(button.textContent || "").trim() === "Update Entry") lockButton(button);
      });
    } finally {
      syncing = false;
    }
  };

  const scheduleSync = () => {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncLocks, 80);
  };

  // Stop the legacy challenges.js "Update Entry" path before its target-level
  // click handler runs. Database enforcement remains the final authority.
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.(".challenge-card [data-primary]");
    if (!button) return;
    const card = button.closest(".challenge-card[data-challenge-id]");
    const id = String(card?.dataset?.challengeId || "");
    if (!id) return;

    if (button.dataset.entrySubmitted === "true" || lockedChallengeIds.has(id)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      lockButton(button);
      showSingleEntryToast();
    }
  }, true);

  // If challenges.js writes the legacy label while cards are being rebuilt,
  // immediately replace it and then reconcile against the server state.
  const observer = new MutationObserver(() => {
    paintCards();
    scheduleSync();
  });
  observer.observe(list, { childList: true, subtree: true });

  paintCards();
  scheduleSync();
})();
