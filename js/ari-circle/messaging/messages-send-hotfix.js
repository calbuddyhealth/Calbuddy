/* ARI Circle Messages — reliable send hotfix v1.0.0 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let sending = false;

  function client() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function toast(message) {
    const host = $("messagesToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 3200);
  }

  async function rpc(name, params = {}) {
    const supabase = client();
    if (!supabase?.rpc) throw new Error("Messages are unavailable right now.");
    const { data, error } = await supabase.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function requestedUserId() {
    const direct = clean(new URLSearchParams(location.search).get("user"));
    if (direct) return direct;

    const href = $("threadProfileLink")?.getAttribute("href") || "";
    try {
      return clean(new URL(href, location.href).searchParams.get("user"));
    } catch {
      return "";
    }
  }

  async function sendNow() {
    if (sending) return;

    const input = $("messageInput");
    const button = $("sendMessageButton");
    const body = clean(input?.value);
    const userId = requestedUserId();

    if (!body) return;
    if (!userId) {
      toast("Could not identify this conversation. Reopen it from Messages.");
      return;
    }

    sending = true;
    if (button) {
      button.disabled = true;
      button.dataset.originalLabel = button.textContent || "Send";
      button.textContent = "Sending…";
    }

    try {
      const conversationId = await rpc("ari_circle_messages_open_direct", {
        requested_user_id: userId
      });

      if (!conversationId) throw new Error("Conversation unavailable.");

      await rpc("ari_circle_messages_send", {
        requested_conversation_id: conversationId,
        requested_body: body
      });

      input.value = "";
      input.style.height = "auto";
      window.AriCircleMessagesV6?.refresh?.();
    } catch (error) {
      console.error("ARI Messages reliable send failed", error);
      toast(error?.message || "Message could not be sent.");
    } finally {
      sending = false;
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalLabel || "Send";
      }
    }
  }

  function bind() {
    const form = $("messageForm");
    const button = $("sendMessageButton");
    if (!form || !button || button.dataset.reliableSendBound === "true") return;

    button.dataset.reliableSendBound = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void sendNow();
    }, true);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void sendNow();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
