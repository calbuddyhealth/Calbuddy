/* ARI XP — Privacy & Ari Memory v1.1.0 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CONSENT_VERSION = "1";
  const CONSENT_KEY = "ari_ai_processing_consent";
  const VERSION_KEY = "ari_ai_processing_consent_version";
  const GRANTED_AT_KEY = "ari_ai_processing_consented_at";
  const DECLINED_AT_KEY = "ari_ai_processing_declined_at";

  let currentUser = null;

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("memoryStatus"), message, type);
  }

  function hasCurrentConsent(user) {
    const metadata = user?.user_metadata || {};
    return (
      metadata[CONSENT_KEY] === true &&
      String(metadata[VERSION_KEY] || "") === CONSENT_VERSION
    );
  }

  function renderAIProcessingState() {
    const state = $("aiProcessingState");
    const enable = $("enableAiProcessingButton");
    const disable = $("disableAiProcessingButton");
    const allowed = hasCurrentConsent(currentUser);

    if (state) {
      state.textContent = allowed
        ? "AI processing is allowed for this ARI XP account."
        : "AI processing is currently off. ARI will not send new AI requests to OpenAI until you allow it.";
    }

    if (enable) enable.hidden = allowed;
    if (disable) disable.hidden = !allowed;
  }

  async function updateAIConsent(allowed) {
    const metadata = {
      ...(currentUser?.user_metadata || {}),
      [CONSENT_KEY]: allowed === true,
      [VERSION_KEY]: CONSENT_VERSION,
      [GRANTED_AT_KEY]: allowed === true ? new Date().toISOString() : null,
      [DECLINED_AT_KEY]: allowed === true ? null : new Date().toISOString()
    };

    $("enableAiProcessingButton").disabled = true;
    $("disableAiProcessingButton").disabled = true;

    const { data, error } = await window.calbuddySupabase.auth.updateUser({
      data: metadata
    });

    $("enableAiProcessingButton").disabled = false;
    $("disableAiProcessingButton").disabled = false;

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    currentUser = data?.user || {
      ...(currentUser || {}),
      user_metadata: metadata
    };

    renderAIProcessingState();
    setStatus(
      allowed
        ? "AI processing permission is on."
        : "AI processing permission is off.",
      "success"
    );
  }

  async function eraseMemory() {
    $("confirmEraseMemoryButton").disabled = true;
    setStatus("Erasing conversation memory…", "working");

    const { data, error } = await window.calbuddySupabase.rpc(
      "erase_my_ari_conversation_memory"
    );

    $("confirmEraseMemoryButton").disabled = false;
    $("eraseMemoryDialog").close();

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    window.AriSettings.clearConversationCaches();
    const deleted =
      Number(data?.recent_turns_deleted || 0) +
      Number(data?.durable_memories_deleted || 0);
    setStatus(
      deleted > 0
        ? `Ari's conversation memory was erased (${deleted} stored item${deleted === 1 ? "" : "s"}).`
        : "Ari's conversation memory is already clear.",
      "success"
    );
  }

  async function init() {
    const session = await window.AriSettings.requireSession();
    if (!session) return;

    currentUser = session.user || null;
    renderAIProcessingState();

    $("enableAiProcessingButton")?.addEventListener("click", () =>
      updateAIConsent(true)
    );

    $("disableAiProcessingButton")?.addEventListener("click", () =>
      updateAIConsent(false)
    );

    $("eraseMemoryButton").addEventListener("click", () =>
      $("eraseMemoryDialog").showModal()
    );

    $("eraseMemoryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      eraseMemory();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();