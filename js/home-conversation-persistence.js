// =====================================================
// ARI XP
// File: js/home-conversation-persistence.js
// Version: 1.1.0
// Purpose:
//   Keep a browser fallback for successful Ari vNext Home replies while making
//   the vNext server the authoritative conversation writer. When the server
//   confirms the turn was stored, do not insert a duplicate client-side copy.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.1.0";
  let installTimer = null;

  function clean(value = "") {
    return String(value || "").trim();
  }

  function isInternalFailureText(value = "") {
    const text = clean(value);
    if (!text) return true;

    return (
      /^(?:inside_deliberation|outside_deliberation|required_deliberation|semantic_validation|response_planning|reasoning_stage|reasoningstage)[\s:_-]/i.test(text) ||
      /^(?:load failed|failed to fetch|network request failed|the network connection was lost)$/i.test(text) ||
      /^ari[_ -]pipeline[_ -]error/i.test(text)
    );
  }

  async function persistVNextTurn(input = {}, result = {}) {
    const runtime = result?.runtime || {};

    if (runtime.selected !== "vnext" || runtime.fallback === true) {
      return false;
    }

    // vNext server persistence is canonical. The browser writer remains only as
    // a recovery path if the server explicitly reports that the turn was not stored.
    if (result?.continuity?.serverAuthoritative === true && result?.continuity?.turnStored === true) {
      return true;
    }

    const message = clean(input?.message);
    const reply = clean(result?.reply || result?.text || result?.message);

    if (!message || !reply || isInternalFailureText(reply)) {
      return false;
    }

    if (typeof window.CalBuddy?.saveConversationTurn !== "function") {
      console.warn("[ARI Conversation Persistence] Conversation writer is unavailable.");
      return false;
    }

    try {
      return await window.CalBuddy.saveConversationTurn({ message, reply });
    } catch (error) {
      // Conversation persistence must never suppress an answer the user already
      // received. Keep the failure observable for diagnostics and continue.
      console.warn(
        "[ARI Conversation Persistence] vNext turn save failed:",
        error?.message || error
      );
      return false;
    }
  }

  function install() {
    const calBuddy = window.CalBuddy;
    if (!calBuddy || typeof calBuddy.askAri !== "function") return false;

    if (calBuddy.askAri.__ariVNextConversationPersistenceV1 === true) {
      return true;
    }

    const originalAsk = calBuddy.askAri.bind(calBuddy);

    const wrappedAsk = async function persistedAriAsk(input = {}) {
      const result = await originalAsk(input);
      await persistVNextTurn(input, result || {});
      return result;
    };

    Object.defineProperty(wrappedAsk, "__ariVNextConversationPersistenceV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    calBuddy.askAri = wrappedAsk;
    return true;
  }

  function ensureInstalled() {
    window.clearTimeout(installTimer);

    if (install()) return;

    installTimer = window.setTimeout(ensureInstalled, 50);
  }

  // The runtime controller is dynamically loaded by Home resilience and
  // replaces CalBuddy.askAri when it becomes ready. Re-install immediately
  // after that replacement so vNext retains the persistence contract.
  window.addEventListener("ari:runtimeReady", ensureInstalled);
  window.addEventListener("ari:runtimeChanged", ensureInstalled);

  ensureInstalled();

  window.AriHomeConversationPersistence = Object.freeze({
    version: VERSION,
    install: ensureInstalled
  });
})();
