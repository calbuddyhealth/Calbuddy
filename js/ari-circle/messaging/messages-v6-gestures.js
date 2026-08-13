/* =============================================================
   ARI CIRCLE — MESSAGES V6 GESTURES
   Version: 6.4.0
   Purpose:
   - Reliable iPhone swipe-to-delete for inbox conversations.
   - Keep Delete locked open until user acts or taps away.
   - Tap an owned message once to reveal •••.
   - Tap ••• to open Edit/Delete actions.
   - Message Delete is immediate + optimistic after RPC success.
   - Edit remains server-enforced: newest sent + unread only.
   - Canonical messaging RPCs only; no direct message-table reads.
============================================================= */
(() => {
  "use strict";

  const VERSION = "6.4.0";
  const clean = (v) => String(v ?? "").trim();
  const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  if (!client) return;

  const gesture = {
    startX: 0,
    startY: 0,
    currentX: 0,
    activeWrap: null,
    moved: false,
    suppressClickUntil: 0,
    activeMessageId: ""
  };

  function toast(message) {
    const host = document.getElementById("messagesToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 2600);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function resetSwipeInline(wrap) {
    const content = wrap?.querySelector(".ari-swipe-content");
    if (!content) return;
    content.style.transition = "";
    content.style.transform = "";
  }

  function closeSwipe(except = null) {
    document.querySelectorAll(".ari-swipe-row.is-open,.ari-swipe-row.is-locked-open").forEach((row) => {
      if (row === except) return;
      row.classList.remove("is-open", "is-locked-open");
      resetSwipeInline(row);
    });
  }

  function openSwipe(wrap) {
    closeSwipe(wrap);
    resetSwipeInline(wrap);
    wrap?.classList.add("is-open", "is-locked-open");
  }

  function cancelSwipe(wrap) {
    resetSwipeInline(wrap);
    wrap?.classList.remove("is-open", "is-locked-open");
  }

  function closeMessageMenus(exceptRow = null) {
    document.querySelectorAll(".ari-message-more-v64,.ari-message-actions-v64").forEach((el) => {
      const row = el.closest(".circle-message-row");
      if (!exceptRow || row !== exceptRow) el.remove();
    });
    if (!exceptRow) gesture.activeMessageId = "";
  }

  async function getMessageContext(messageId) {
    const id = clean(messageId);
    if (!id) throw new Error("Message unavailable.");

    const otherUserId = clean(new URLSearchParams(location.search).get("user"));
    if (!otherUserId) throw new Error("Conversation unavailable.");

    const conversationId = await rpc("ari_circle_messages_open_direct", {
      requested_user_id: otherUserId
    });
    if (!conversationId) throw new Error("Conversation unavailable.");

    const rows = await rpc("ari_circle_messages_thread", {
      requested_conversation_id: conversationId,
      result_limit: 250
    });

    const detailed = (Array.isArray(rows) ? rows : []).find((row) => clean(row.message_id) === id);
    if (!detailed) throw new Error("Message unavailable.");

    return {
      message_id: id,
      conversation_id: conversationId,
      sender_user_id: detailed.sender_user_id,
      body: clean(detailed.body),
      deleted_at: detailed.deleted_at,
      can_edit: detailed.can_edit === true
    };
  }

  function reloadThreadSoon() {
    window.AriCircleMessagesV6?.refresh?.();
  }

  function showActions(rowEl, bubble, msg, anchor) {
    rowEl.querySelectorAll(".ari-message-actions-v64").forEach((el) => el.remove());

    const menu = document.createElement("div");
    menu.className = "ari-message-actions-v64";

    if (msg.can_edit) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = prompt("Edit message", msg.body);
        if (next === null || !clean(next) || clean(next) === msg.body) return;
        edit.disabled = true;
        try {
          await rpc("ari_circle_messages_edit", {
            requested_message_id: msg.message_id,
            requested_body: clean(next)
          });
          closeMessageMenus();
          reloadThreadSoon();
          toast("Message edited.");
        } catch (error) {
          edit.disabled = false;
          toast(error.message || "This message can no longer be edited.");
        }
      });
      menu.append(edit);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.className = "is-danger";
    del.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (del.disabled) return;

      del.disabled = true;
      del.textContent = "Deleting…";

      try {
        const result = await rpc("ari_circle_messages_delete", {
          requested_message_id: msg.message_id
        });
        if (result !== true && result !== null) throw new Error("Message could not be deleted.");

        closeMessageMenus();
        rowEl.style.transition = "opacity .16s ease, transform .16s ease";
        rowEl.style.opacity = "0";
        rowEl.style.transform = "scale(.96)";
        setTimeout(() => rowEl.remove(), 170);
        toast("Message deleted.");
        setTimeout(reloadThreadSoon, 220);
      } catch (error) {
        del.disabled = false;
        del.textContent = "Delete";
        toast(error.message || "Could not delete message.");
      }
    });
    menu.append(del);

    bubble.append(menu);
    anchor.classList.add("is-active");
  }

  async function revealMessageMore(rowEl) {
    if (!rowEl?.classList.contains("is-mine") || rowEl.classList.contains("is-deleted")) return;
    const messageId = clean(rowEl.dataset.messageId);
    const bubble = rowEl.querySelector(".circle-message-bubble");
    if (!messageId || !bubble) return;

    if (gesture.activeMessageId === messageId && rowEl.querySelector(".ari-message-more-v64")) {
      closeMessageMenus();
      return;
    }

    closeMessageMenus();
    gesture.activeMessageId = messageId;

    let msg;
    try {
      msg = await getMessageContext(messageId);
    } catch (error) {
      gesture.activeMessageId = "";
      toast(error.message || "Message options unavailable.");
      return;
    }
    if (msg.deleted_at) return;

    const more = document.createElement("button");
    more.type = "button";
    more.className = "ari-message-more-v64";
    more.textContent = "•••";
    more.setAttribute("aria-label", "Message options");
    more.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showActions(rowEl, bubble, msg, more);
    });
    bubble.append(more);
  }

  const inbox = document.getElementById("conversationList");
  if (inbox) {
    inbox.addEventListener("touchstart", (event) => {
      const content = event.target.closest(".ari-swipe-content");
      const wrap = content?.closest(".ari-swipe-row");
      const touch = event.touches?.[0];
      if (!content || !wrap || !touch) return;
      gesture.startX = touch.clientX;
      gesture.startY = touch.clientY;
      gesture.currentX = gesture.startX;
      gesture.activeWrap = wrap;
      gesture.moved = false;
      content.style.transition = "none";
    }, { passive: true });

    inbox.addEventListener("touchmove", (event) => {
      const wrap = gesture.activeWrap;
      const touch = event.touches?.[0];
      const content = wrap?.querySelector(".ari-swipe-content");
      if (!wrap || !content || !touch) return;

      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      gesture.currentX = touch.clientX;

      if (Math.abs(dx) < 5) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) return;

      gesture.moved = true;
      const base = wrap.classList.contains("is-locked-open") ? -104 : 0;
      const next = Math.max(-104, Math.min(0, base + dx));
      content.style.transform = `translateX(${next}px)`;
      event.preventDefault();
    }, { passive: false });

    inbox.addEventListener("touchend", () => {
      const wrap = gesture.activeWrap;
      if (!wrap) return;
      const dx = gesture.currentX - gesture.startX;
      const wasOpen = wrap.classList.contains("is-locked-open");
      const shouldOpen = wasOpen ? dx < 45 : dx < -28;

      gesture.suppressClickUntil = gesture.moved ? Date.now() + 520 : 0;
      resetSwipeInline(wrap);
      if (shouldOpen) openSwipe(wrap);
      else cancelSwipe(wrap);

      gesture.activeWrap = null;
      gesture.moved = false;
    }, { passive: true });

    inbox.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".ari-swipe-delete");
      if (deleteButton) return;

      if (Date.now() < gesture.suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const wrap = event.target.closest(".ari-swipe-row");
      if (wrap?.classList.contains("is-locked-open")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancelSwipe(wrap);
      }
    }, true);
  }

  const thread = document.getElementById("threadMessages");
  if (thread) {
    thread.addEventListener("click", (event) => {
      if (event.target.closest(".ari-message-more-v64,.ari-message-actions-v64")) return;
      const bubble = event.target.closest(".circle-message-row.is-mine:not(.is-deleted) .circle-message-bubble");
      if (!bubble) return;
      event.preventDefault();
      event.stopPropagation();
      revealMessageMore(bubble.closest(".circle-message-row"));
    });
  }

  document.addEventListener("pointerdown", (event) => {
    const insideMessageAction = event.target.closest(".circle-message-row.is-mine .circle-message-bubble,.ari-message-more-v64,.ari-message-actions-v64");
    if (!insideMessageAction) closeMessageMenus();
    if (!event.target.closest(".ari-swipe-row")) closeSwipe();
  });

  const style = document.createElement("style");
  style.id = "ariMessagesV64GestureStyle";
  style.textContent = `
    .ari-swipe-row{--ari-delete-width:104px;position:relative;overflow:hidden;border-radius:22px}
    .ari-swipe-delete{z-index:0!important;width:var(--ari-delete-width)!important;background:#e5484d!important;color:#fff!important;opacity:1!important;pointer-events:none!important;font-weight:850!important}
    .ari-swipe-row.is-open .ari-swipe-delete,.ari-swipe-row.is-locked-open .ari-swipe-delete{pointer-events:auto!important}
    .ari-swipe-content{z-index:1!important;width:100%;will-change:transform;touch-action:pan-y;transition:transform .19s cubic-bezier(.2,.75,.25,1)!important}
    .ari-swipe-row.is-open .ari-swipe-content,.ari-swipe-row.is-locked-open .ari-swipe-content{transform:translateX(calc(-1 * var(--ari-delete-width)))!important}

    .circle-message-row{position:relative!important}
    .circle-message-bubble{position:relative!important;touch-action:manipulation;-webkit-user-select:none;user-select:none;cursor:pointer}
    .circle-message-row.is-mine:not(.is-deleted) .circle-message-bubble:active{filter:brightness(.985)}

    .ari-message-more-v64{
      position:absolute;z-index:35;top:50%;right:calc(100% + 10px);transform:translateY(-50%);
      min-width:48px;height:38px;padding:0 10px;border:1px solid rgba(24,48,100,.12);border-radius:19px;
      background:#fff;color:#17223b;font-weight:900;letter-spacing:1px;box-shadow:0 8px 25px rgba(27,43,83,.16)
    }
    .ari-message-actions-v64{
      position:absolute;z-index:40;right:calc(100% + 10px);top:calc(50% + 24px);min-width:150px;padding:6px;
      border:1px solid rgba(24,48,100,.10);border-radius:16px;background:#fff;box-shadow:0 16px 50px rgba(19,31,68,.22)
    }
    .ari-message-actions-v64 button{width:100%;padding:12px 14px;border:0;border-radius:11px;background:transparent;color:#17223b;text-align:left;font:inherit;font-weight:780;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .ari-message-actions-v64 button:active{background:#f2f5fb}
    .ari-message-actions-v64 button:disabled{opacity:.55}
    .ari-message-actions-v64 .is-danger{color:#d83b42}
  `;
  document.head.append(style);

  window.AriCircleMessagesGestures = Object.freeze({ version: VERSION });
})();