/* =============================================================
   ARI CIRCLE — SINGLE REACTION UX
   Version: 1.0.0

   Behavior:
   - One reaction per user per post (DB enforced separately).
   - Tap React with no reaction => quick ❤️.
   - Tap your active reaction => remove it.
   - Press and hold React => open the existing reaction picker.
   - Tapping your active reaction pill removes it.
   - Tapping a different summary pill opens the picker instead of
     stacking another reaction.
============================================================= */
(() => {
  "use strict";

  const HOLD_MS = 420;
  const state = {
    client: null,
    holdTimer: 0,
    holdTriggered: false,
    bypassNextClick: false
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function findPostCard(node) {
    return node?.closest?.(".feed-post") || null;
  }

  function getActiveEmoji(card) {
    const active = card?.querySelector?.(".feed-reaction-pill.is-active");
    if (!active) return "";
    return clean(active.textContent).split(/\s+/)[0] || "";
  }

  function getReactButton(card) {
    return card?.querySelector?.(".feed-post__actions button:first-child") || null;
  }

  async function refresh() {
    try {
      await window.AriCircleFeed?.refresh?.();
      window.setTimeout(paintReactionButtons, 30);
    } catch {}
  }

  async function toggle(postId, emoji) {
    if (!state.client || !postId || !emoji) return;
    const { error } = await state.client.rpc("ari_circle_feed_toggle_reaction", {
      requested_post_id: postId,
      requested_emoji: emoji
    });
    if (error) throw error;
    await refresh();
  }

  function paintReactionButtons(root = document) {
    root.querySelectorAll?.(".feed-post").forEach((card) => {
      const button = getReactButton(card);
      if (!button) return;
      const activeEmoji = getActiveEmoji(card);
      const total = card.querySelectorAll(".feed-reaction-pill")
        ? [...card.querySelectorAll(".feed-reaction-pill")].reduce((sum, pill) => {
            const match = clean(pill.textContent).match(/(\d+)\s*$/);
            return sum + Number(match?.[1] || 0);
          }, 0)
        : 0;
      if (activeEmoji) {
        button.classList.add("is-reacted");
        button.innerHTML = `<span aria-hidden="true">${activeEmoji}</span><span>Reacted${total ? ` · ${total}` : ""}</span>`;
        button.setAttribute("aria-label", `Remove ${activeEmoji} reaction. Press and hold to change reaction.`);
      } else {
        button.classList.remove("is-reacted");
        button.innerHTML = `<span aria-hidden="true">☺</span><span>React${total ? ` · ${total}` : ""}</span>`;
        button.setAttribute("aria-label", "React. Press and hold for reaction options.");
      }
    });
  }

  function openExistingPicker(button) {
    if (!button) return;
    state.bypassNextClick = true;
    button.click();
    window.setTimeout(() => { state.bypassNextClick = false; }, 0);
  }

  function startHold(button) {
    clearTimeout(state.holdTimer);
    state.holdTriggered = false;
    state.holdTimer = window.setTimeout(() => {
      state.holdTriggered = true;
      openExistingPicker(button);
      if (navigator.vibrate) navigator.vibrate(10);
    }, HOLD_MS);
  }

  function cancelHold() {
    clearTimeout(state.holdTimer);
    state.holdTimer = 0;
  }

  function bind() {
    document.addEventListener("pointerdown", (event) => {
      const button = event.target.closest?.(".feed-post__actions button:first-child");
      if (!button) return;
      startHold(button);
    }, true);

    document.addEventListener("pointerup", cancelHold, true);
    document.addEventListener("pointercancel", cancelHold, true);
    document.addEventListener("pointerleave", (event) => {
      if (event.target.closest?.(".feed-post__actions button:first-child")) cancelHold();
    }, true);

    document.addEventListener("click", async (event) => {
      const pill = event.target.closest?.(".feed-reaction-pill");
      if (pill) {
        const card = findPostCard(pill);
        if (!card) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const postId = card.dataset.postId;
        const emoji = clean(pill.textContent).split(/\s+/)[0] || "";
        try {
          if (pill.classList.contains("is-active")) await toggle(postId, emoji);
          else openExistingPicker(getReactButton(card));
        } catch (error) {
          console.error("ARI Circle single reaction pill failed:", error);
        }
        return;
      }

      const button = event.target.closest?.(".feed-post__actions button:first-child");
      if (!button) return;
      if (state.bypassNextClick) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (state.holdTriggered) {
        state.holdTriggered = false;
        return;
      }

      const card = findPostCard(button);
      const postId = card?.dataset.postId;
      const activeEmoji = getActiveEmoji(card);
      try {
        await toggle(postId, activeEmoji || "❤️");
      } catch (error) {
        console.error("ARI Circle quick reaction failed:", error);
      }
    }, true);

    document.addEventListener("pointerup", () => window.setTimeout(paintReactionButtons, 20));
    document.addEventListener("dialogclose", () => window.setTimeout(paintReactionButtons, 20));
  }

  function start() {
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    if (!state.client || !document.querySelector(".feed-page")) return;
    bind();
    paintReactionButtons();
    window.setTimeout(paintReactionButtons, 250);
    window.setTimeout(paintReactionButtons, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.AriCircleSingleReaction = Object.freeze({ version:"1.0.0", refresh:paintReactionButtons });
})();
