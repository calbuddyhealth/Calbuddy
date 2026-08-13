/* =============================================================
   ARI CIRCLE — MESSAGE ACTION MENU POSITIONING
   Version: 6.6.0
   Purpose:
   - Keep Edit/Delete fully visible above the composer on mobile Safari.
   - Render the action sheet in document.body so thread overflow cannot clip it.
   - Prefer positioning above the selected message when space is tight.
============================================================= */
(() => {
  "use strict";

  const VERSION = "6.6.0";
  const clean = (v) => String(v ?? "").trim();
  const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  const thread = document.getElementById("threadMessages");
  if (!client || !thread) return;

  let busy = false;
  let activeMenu = null;

  function toast(message) {
    const host = document.getElementById("messagesToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 2800);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function closeMenu() {
    activeMenu?.remove();
    activeMenu = null;
    document.querySelectorAll(".ari-message-actions-v66").forEach((el) => el.remove());
  }

  async function getMessage(messageId) {
    const id = clean(messageId);
    const otherUserId = clean(new URLSearchParams(location.search).get("user"));
    if (!id || !otherUserId) throw new Error("Message unavailable.");

    const conversationId = await rpc("ari_circle_messages_open_direct", {
      requested_user_id: otherUserId
    });
    if (!conversationId) throw new Error("Conversation unavailable.");

    const rows = await rpc("ari_circle_messages_thread", {
      requested_conversation_id: conversationId,
      result_limit: 250
    });

    const message = (Array.isArray(rows) ? rows : []).find((row) => clean(row.message_id) === id);
    if (!message) throw new Error("Message unavailable.");
    return message;
  }

  function viewportBounds() {
    const vv = window.visualViewport;
    const top = vv?.offsetTop || 0;
    const height = vv?.height || window.innerHeight;
    return { top, bottom: top + height };
  }

  function positionMenu(menu, bubble) {
    const rect = bubble.getBoundingClientRect();
    const bounds = viewportBounds();
    const menuWidth = 176;
    const estimatedHeight = menu.children.length > 1 ? 118 : 66;
    const safeGap = 12;
    const safeBottom = 112; // composer + breathing room

    let left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth));
    let top;

    const roomBelow = bounds.bottom - safeBottom - rect.bottom;
    const roomAbove = rect.top - bounds.top;

    if (roomBelow >= estimatedHeight + safeGap) {
      top = rect.bottom + safeGap;
    } else if (roomAbove >= estimatedHeight + safeGap) {
      top = rect.top - estimatedHeight - safeGap;
    } else {
      top = Math.max(bounds.top + 12, bounds.bottom - safeBottom - estimatedHeight - 12);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  }

  async function deleteMessage(button, row, messageId) {
    if (busy) return;
    busy = true;
    button.disabled = true;
    button.textContent = "Deleting…";
    try {
      const result = await rpc("ari_circle_messages_delete", { requested_message_id: messageId });
      if (result !== true && result !== null) throw new Error("Message could not be deleted.");
      closeMenu();
      document.querySelectorAll(".ari-message-more-v64,.ari-message-more-v63,.ari-message-more").forEach((el) => el.remove());
      row.style.transition = "opacity .16s ease, transform .16s ease";
      row.style.opacity = "0";
      row.style.transform = "scale(.96)";
      setTimeout(() => row.remove(), 170);
      toast("Message deleted.");
      setTimeout(() => window.AriCircleMessagesV6?.refresh?.(), 220);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Delete";
      toast(error.message || "Could not delete message.");
    } finally {
      busy = false;
    }
  }

  async function editMessage(button, messageId) {
    if (busy) return;
    busy = true;
    try {
      const message = await getMessage(messageId);
      if (message.can_edit !== true) throw new Error("This message can no longer be edited.");
      const currentBody = clean(message.body);
      const next = prompt("Edit message", currentBody);
      if (next === null) return;
      const body = clean(next);
      if (!body || body === currentBody) return;
      button.disabled = true;
      await rpc("ari_circle_messages_edit", {
        requested_message_id: messageId,
        requested_body: body
      });
      closeMenu();
      document.querySelectorAll(".ari-message-more-v64,.ari-message-more-v63,.ari-message-more").forEach((el) => el.remove());
      toast("Message edited.");
      window.AriCircleMessagesV6?.refresh?.();
    } catch (error) {
      button.disabled = false;
      toast(error.message || "Could not edit message.");
    } finally {
      busy = false;
    }
  }

  async function openMenuForMore(moreButton) {
    const row = moreButton.closest(".circle-message-row.is-mine");
    const bubble = row?.querySelector(".circle-message-bubble");
    const messageId = clean(row?.dataset?.messageId);
    if (!row || !bubble || !messageId) return;

    closeMenu();
    document.querySelectorAll(".ari-message-actions-v64,.ari-message-actions-v63,.ari-message-actions").forEach((el) => el.remove());

    let message;
    try {
      message = await getMessage(messageId);
    } catch (error) {
      toast(error.message || "Message options unavailable.");
      return;
    }
    if (message.deleted_at) return;

    const menu = document.createElement("div");
    menu.className = "ari-message-actions-v66";
    menu.setAttribute("role", "menu");

    if (message.can_edit === true) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        editMessage(edit, messageId);
      });
      menu.append(edit);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.className = "is-danger";
    del.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteMessage(del, row, messageId);
    });
    menu.append(del);

    document.body.append(menu);
    activeMenu = menu;
    positionMenu(menu, bubble);
  }

  // Capture the ••• click before the older inline menu can open inside the
  // scrollable thread. This avoids clipping behind the fixed composer.
  thread.addEventListener("click", (event) => {
    const more = event.target.closest(".ari-message-more-v64,.ari-message-more-v63,.ari-message-more");
    if (!more) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openMenuForMore(more);
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".ari-message-actions-v66,.ari-message-more-v64,.ari-message-more-v63,.ari-message-more")) {
      closeMenu();
    }
  }, true);

  window.addEventListener("resize", closeMenu, { passive: true });
  window.visualViewport?.addEventListener("resize", closeMenu, { passive: true });
  window.visualViewport?.addEventListener("scroll", closeMenu, { passive: true });

  const style = document.createElement("style");
  style.id = "ariMessagesV66MenuStyle";
  style.textContent = `
    .ari-message-actions-v66{
      position:fixed;z-index:99999;width:176px;padding:6px;
      border:1px solid rgba(24,48,100,.10);border-radius:18px;
      background:rgba(255,255,255,.98);box-shadow:0 18px 55px rgba(19,31,68,.24);
      backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)
    }
    .ari-message-actions-v66 button{
      display:block;width:100%;min-height:48px;padding:12px 14px;border:0;border-radius:12px;
      background:transparent;color:#17223b;text-align:left;font:inherit;font-weight:780;
      touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    .ari-message-actions-v66 button:active{background:#f2f5fb}
    .ari-message-actions-v66 button:disabled{opacity:.55}
    .ari-message-actions-v66 .is-danger{color:#d83b42}
  `;
  document.head.append(style);

  window.AriCircleMessagesMenuPosition = Object.freeze({ version: VERSION, close: closeMenu });
})();
