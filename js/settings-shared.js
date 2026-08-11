/* ARI Rebirth — shared settings helpers v1.0.0 */

(() => {
  "use strict";

  function setStatus(element, message = "", type = "") {
    if (!element) return;
    element.textContent = message;
    element.className = "ari-status";
    element.hidden = !message;
    if (type) element.classList.add(`ari-status--${type}`);
  }

  async function getSession() {
    if (!window.calbuddySupabase) return null;
    const { data, error } = await window.calbuddySupabase.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  async function requireSession() {
    try {
      const session = await getSession();
      if (!session) {
        window.location.replace("signin.html");
        return null;
      }
      return session;
    } catch (error) {
      console.error("ARI settings session check failed:", error);
      window.location.replace("signin.html");
      return null;
    }
  }

  function clearConversationCaches() {
    const localKeys = [
      "ari_memory_items",
      "ari_memory_store_v1",
      "ariConversationHistory",
      "calbuddyLastMemoryCandidate",
      "ariLastConversation",
      "ariConversationContinuity"
    ];
    const sessionKeys = [
      "ari_memory_items",
      "ari_memory_store_v1",
      "ariConversationHistory",
      "ari_conversation_id"
    ];
    localKeys.forEach((key) => localStorage.removeItem(key));
    sessionKeys.forEach((key) => sessionStorage.removeItem(key));
  }

  window.AriSettings = Object.freeze({
    setStatus,
    getSession,
    requireSession,
    clearConversationCaches
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-dialog-close]");
    if (!button) return;
    button.closest("dialog")?.close();
  });
})();
