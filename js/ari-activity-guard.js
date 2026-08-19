// ARI XP — Home activity action guard.
// Keeps Ari manual activity logs on the user's browser-local date unless the
// user explicitly named another date, and prevents action proposals from
// sounding as though they already executed before confirmation.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  let adapterTimer = null;
  let askTimer = null;

  function clean(value = "", max = 1200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function mentionsExplicitOtherDate(message = "") {
    const text = clean(message).toLowerCase();
    if (!text) return false;

    // Relative references that intentionally target a different day.
    if (/\b(yesterday|tomorrow|day before yesterday|last night)\b/.test(text)) return true;

    // Explicit calendar dates / named weekdays / month names.
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) return true;
    if (/\b(?:sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/.test(text)) return true;
    if (/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/.test(text)) return true;
    if (/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/.test(text)) return true;

    return false;
  }

  function shouldForceLocalToday(pendingAction = {}) {
    if (clean(pendingAction?.name, 120) !== "log_activity") return false;

    const sourceMessage = clean(pendingAction?.sourceMessage, 1200);
    if (mentionsExplicitOtherDate(sourceMessage)) return false;

    // "today", "this morning", "tonight", "earlier", or no date at all are
    // all current-browser-day activity for the Home surface.
    return true;
  }

  function patchActivityAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || typeof adapter.prepareCalBuddyAction !== "function") return false;
    if (adapter.__ariActivityLocalDateGuardV1 === true) return true;

    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);

    adapter.prepareCalBuddyAction = async function guardedPrepare(pendingAction = {}) {
      if (!shouldForceLocalToday(pendingAction)) {
        return await originalPrepare(pendingAction);
      }

      const patched = {
        ...pendingAction,
        arguments: {
          ...(pendingAction?.arguments && typeof pendingAction.arguments === "object"
            ? pendingAction.arguments
            : {}),
          dateText: "today"
        }
      };

      return await originalPrepare(patched);
    };

    Object.defineProperty(adapter, "__ariActivityLocalDateGuardV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    return true;
  }

  function ensureActivityAdapterPatched() {
    window.clearTimeout(adapterTimer);
    if (patchActivityAdapter()) return;
    adapterTimer = window.setTimeout(ensureActivityAdapterPatched, 40);
  }

  function proposedActionConfirmation(result = {}) {
    if (result?.action?.type !== "proposed_action") return "";
    return clean(result?.pendingAction?.confirmation_text, 500);
  }

  function replyClaimsExecution(reply = "") {
    const text = clean(reply, 1200);
    if (!text) return false;
    return /\b(?:i(?:'ve| have)?\s+(?:logged|saved|added|recorded|updated|created)|(?:it|that)\s+(?:is|'s)\s+(?:logged|saved|added|recorded|updated)|done[.!]?$)\b/i.test(text);
  }

  function patchAskAri() {
    const calBuddy = window.CalBuddy;
    if (!calBuddy || typeof calBuddy.askAri !== "function") return false;
    if (calBuddy.askAri.__ariActivityProposalGuardV1 === true) return true;

    const originalAsk = calBuddy.askAri.bind(calBuddy);

    const guardedAsk = async function activityProposalGuard(input = {}) {
      const result = await originalAsk(input);
      const confirmation = proposedActionConfirmation(result);

      if (confirmation && replyClaimsExecution(result?.reply)) {
        return { ...result, reply: confirmation };
      }

      return result;
    };

    Object.defineProperty(guardedAsk, "__ariActivityProposalGuardV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    calBuddy.askAri = guardedAsk;
    return true;
  }

  function ensureAskPatched() {
    window.clearTimeout(askTimer);
    if (patchAskAri()) return;
    askTimer = window.setTimeout(ensureAskPatched, 40);
  }

  // Runtime dependencies are loaded dynamically. Re-apply after a runtime
  // replacement so both guards survive the vNext/Rebirth cutover layer.
  window.addEventListener("ari:runtimeReady", () => {
    ensureActivityAdapterPatched();
    ensureAskPatched();
  });
  window.addEventListener("ari:runtimeChanged", ensureAskPatched);
  window.addEventListener("ari:vnextActivityReady", ensureActivityAdapterPatched);

  ensureActivityAdapterPatched();
  ensureAskPatched();

  window.AriActivityGuard = Object.freeze({
    version: VERSION,
    ensureActivityAdapterPatched,
    ensureAskPatched
  });
})();
