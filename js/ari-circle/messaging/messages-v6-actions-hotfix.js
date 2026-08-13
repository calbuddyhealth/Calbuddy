/* =============================================================
   ARI CIRCLE — MESSAGES V6 ACTION HOTFIX
   Version: 6.5.0
   Purpose:
   - Capture Edit/Delete taps before Safari/bubble gesture handlers.
   - Ensure message actions always reach canonical Supabase RPCs.
============================================================= */
(() => {
  "use strict";

  const VERSION = "6.5.0";
  const clean = (v) => String(v ?? "").trim();
  const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  const thread = document.getElementById("threadMessages");
  if (!client || !thread) return;

  let busy = false;

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

  function closeMenus() {
    document.querySelectorAll(
      ".ari-message-more-v64,.ari-message-actions-v64,.ari-message-more-v63,.ari-message-actions-v63,.ari-message-more,.ari-message-actions"
    ).forEach((el) => el.remove());
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

  async function deleteMessage(button, row, messageId) {
    if (busy) return;
    busy = true;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = "Deleting…";

    try {
      const result = await rpc("ari_circle_messages_delete", {
        requested_message_id: messageId
      });
      if (result !== true) throw new Error("Delete was not accepted.");

      closeMenus();
      row.style.transition = "opacity .16s ease, transform .16s ease";
      row.style.opacity = "0";
      row.style.transform = "scale(.96)";
      setTimeout(() => row.remove(), 170);
      toast("Message deleted.");
      setTimeout(() => window.AriCircleMessagesV6?.refresh?.(), 220);
    } catch (error) {
      button.disabled = false;
      button.textContent = oldText || "Delete";
      toast(error.message || "Could not delete message.");
    } finally {
      busy = false;
    }
  }

  async function editMessage(button, row, messageId) {
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

      closeMenus();
      toast("Message edited.");
      window.AriCircleMessagesV6?.refresh?.();
    } catch (error) {
      button.disabled = false;
      toast(error.message || "Could not edit message.");
    } finally {
      busy = false;
    }
  }

  function resolveAction(target) {
    const button = target.closest(
      ".ari-message-actions-v64 button,.ari-message-actions-v63 button,.ari-message-actions button"
    );
    if (!button) return null;
    const row = button.closest(".circle-message-row.is-mine");
    const messageId = clean(row?.dataset?.messageId);
    if (!row || !messageId) return null;
    return {
      button,
      row,
      messageId,
      action: button.classList.contains("is-danger") ? "delete" : "edit"
    };
  }

  async function handleAction(event) {
    const resolved = resolveAction(event.target);
    if (!resolved) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (resolved.action === "delete") {
      await deleteMessage(resolved.button, resolved.row, resolved.messageId);
    } else {
      await editMessage(resolved.button, resolved.row, resolved.messageId);
    }
  }

  // Capture before the bubble/thread click handlers. pointerup is the most
  // reliable path on iOS Safari; click is kept as a desktop fallback.
  thread.addEventListener("pointerup", handleAction, true);
  thread.addEventListener("click", handleAction, true);

  window.AriCircleMessagesActionHotfix = Object.freeze({ version: VERSION });
})();
