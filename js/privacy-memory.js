/* ARI Rebirth — Privacy & Ari Memory v1.0.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("memoryStatus"), message, type);
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
