// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-nutrition-action-ui.js
// Version: 1.0.0
// Purpose:
//   Nutrition-page presentation for the shared CalBuddy pending-action
//   lifecycle. This file NEVER creates or interprets meal actions.
//   It only displays, confirms, or cancels actions created by canonical
//   domain services such as ari-meal-action.js.
// =====================================================

(() => {
  "use strict";

  const CARD_ID = "ariNutritionPendingAction";

  const clean = (value = "") => String(value ?? "").trim();

  function isNutritionPage() {
    const page = String(window.location.pathname || "")
      .split("/")
      .pop()
      .toLowerCase();
    return page === "nutrition.html";
  }

  function getThread() {
    return document.getElementById("ariMessages");
  }

  function removeCard() {
    document.getElementById(CARD_ID)?.remove();
  }

  function appendAriMessage(text) {
    const thread = getThread();
    if (!thread || !clean(text)) return;

    const message = document.createElement("div");
    message.className = "ari-message ari-ai";

    const label = document.createElement("span");
    label.className = "ari-message-label";
    label.textContent = "Ari";

    const body = document.createElement("p");
    body.textContent = clean(text);
    body.style.whiteSpace = "pre-wrap";

    message.append(label, body);
    thread.appendChild(message);
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function styleButton(button, primary = false) {
    button.type = "button";
    button.style.minHeight = "44px";
    button.style.padding = "0 22px";
    button.style.borderRadius = "16px";
    button.style.border = primary
      ? "1px solid rgba(38, 112, 255, 0.34)"
      : "1px solid rgba(21, 45, 92, 0.14)";
    button.style.background = primary
      ? "linear-gradient(135deg, rgba(38,112,255,.96), rgba(86,70,230,.94))"
      : "rgba(255,255,255,.82)";
    button.style.color = primary ? "white" : "#102451";
    button.style.fontWeight = "800";
    button.style.letterSpacing = ".08em";
    button.style.cursor = "pointer";
  }

  function renderPendingAction(action) {
    if (!isNutritionPage() || !action) return;

    // Nutrition only owns the presentation for meal actions here. Other
    // domains retain their own page-specific UI while sharing CalBuddy state.
    const type = clean(action.action_type || action.type);
    if (type !== "log_meal") return;

    const thread = getThread();
    if (!thread) return;

    removeCard();

    const card = document.createElement("div");
    card.id = CARD_ID;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Confirm Ari meal action");
    card.style.margin = "14px 0";
    card.style.padding = "16px";
    card.style.borderRadius = "22px";
    card.style.border = "1px solid rgba(79, 123, 255, .22)";
    card.style.background = "rgba(255,255,255,.88)";
    card.style.boxShadow = "0 14px 38px rgba(34, 71, 160, .10)";
    card.style.backdropFilter = "blur(18px)";

    const text = document.createElement("p");
    text.textContent = clean(action.confirmation_text) || "Log this meal?";
    text.style.margin = "0 0 14px";
    text.style.color = "#102451";
    text.style.fontWeight = "750";
    text.style.lineHeight = "1.5";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const yes = document.createElement("button");
    yes.textContent = "YES";
    styleButton(yes, true);

    const cancel = document.createElement("button");
    cancel.textContent = "CANCEL";
    styleButton(cancel, false);

    yes.addEventListener("click", async () => {
      if (!window.CalBuddy?.confirmPendingAction) return;
      yes.disabled = true;
      cancel.disabled = true;

      try {
        const result = await window.CalBuddy.confirmPendingAction();
        removeCard();
        appendAriMessage(result?.reply || "Done — I logged that meal.");

        if (typeof window.refreshNutritionPage === "function") {
          await window.refreshNutritionPage();
        }
      } catch (error) {
        yes.disabled = false;
        cancel.disabled = false;
        appendAriMessage(error?.message || "I couldn't log that meal. Try again.");
      }
    });

    cancel.addEventListener("click", () => {
      const result = window.CalBuddy?.cancelPendingAction?.();
      removeCard();
      appendAriMessage(result?.reply || "No problem — I won't log it.");
    });

    actions.append(yes, cancel);
    card.append(text, actions);
    thread.appendChild(card);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function restorePendingAction() {
    if (!isNutritionPage()) return;
    const pending = window.CalBuddy?.getPendingAction?.();
    if (pending) renderPendingAction(pending);
  }

  window.addEventListener("calbuddy:pendingAction", (event) => {
    renderPendingAction(event?.detail?.action || event?.detail || null);
  });

  window.addEventListener("calbuddy:pendingActionCleared", removeCard);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(restorePendingAction, 150);
    });
  } else {
    window.setTimeout(restorePendingAction, 150);
  }
})();
