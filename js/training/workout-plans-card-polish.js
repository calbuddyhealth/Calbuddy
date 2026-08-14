// =====================================================
// ARI XP
// File: js/training/workout-plans-card-polish.js
// Version: 1.1.1
// Purpose:
//   Improve My Week card hierarchy and mobile day-editor readability
//   without changing workout-plan logic.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.1.1";
  const GRID_ID = "workoutWeekGrid";
  const STYLE_ID = "ariWorkoutPlanCardHierarchyStyle";
  const EDITOR_STYLE_ID = "ariWorkoutDayEditorMobileStyle";

  function clean(value) {
    return String(value ?? "").trim();
  }

  function ensureStyles() {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement("link");
      link.id = STYLE_ID;
      link.rel = "stylesheet";
      link.href = "assets/css/workout-plans-card-hierarchy.css?v=1.0.0";
      document.head.append(link);
    }

    if (!document.getElementById(EDITOR_STYLE_ID)) {
      const link = document.createElement("link");
      link.id = EDITOR_STYLE_ID;
      link.rel = "stylesheet";
      link.href = "assets/css/workout-day-editor-mobile.css?v=1.0.1";
      document.head.append(link);
    }
  }

  function formatDateLabel(value) {
    const text = clean(value).replace(/\s*•\s*/g, " ");
    const match = text.match(/^([A-Z]{3})\s+(.+)$/);
    return match ? `${match[1]} • ${match[2]}` : text;
  }

  function classifyCard(card, titleText) {
    const baseType = clean(card?.dataset?.type).toLowerCase();
    const title = clean(titleText).toLowerCase();

    if (baseType === "off" || title === "off day") {
      return { kind: "off", label: "OFF DAY" };
    }

    if (baseType === "recovery" || title.includes("recovery")) {
      return { kind: "recovery", label: "RECOVERY" };
    }

    if (title.includes("custom")) {
      return { kind: "custom", label: "CUSTOM" };
    }

    if (title.includes("endurance")) {
      return { kind: "endurance", label: "ENDURANCE" };
    }

    return { kind: "workout", label: "WORKOUT" };
  }

  function polishCard(card) {
    if (!(card instanceof HTMLElement)) return;

    const day = card.querySelector(".workout-day-card__day");
    const type = card.querySelector(".workout-day-card__type");
    const title = card.querySelector(".workout-day-card__title");
    const summary = card.querySelector(".workout-day-card__summary");

    if (day) {
      const formatted = formatDateLabel(day.textContent);
      if (day.textContent !== formatted) day.textContent = formatted;
    }

    const classification = classifyCard(card, title?.textContent);
    card.dataset.planKind = classification.kind;
    card.dataset.cardHierarchy = VERSION;

    if (type && type.textContent !== classification.label) {
      type.textContent = classification.label;
    }

    if (summary && !clean(summary.textContent)) {
      if (classification.kind === "custom") {
        summary.textContent = "Build your session";
      } else if (classification.kind === "off") {
        summary.textContent = "Rest and recover";
      }
    }
  }

  function polishGrid() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return false;

    grid.querySelectorAll(".workout-day-card").forEach(polishCard);
    grid.dataset.cardHierarchy = VERSION;
    return true;
  }

  function polishEditorDate() {
    const title = document.getElementById("workoutDayEditorTitle");
    if (!title) return false;

    const formatted = formatDateLabel(title.textContent);
    if (title.textContent !== formatted) title.textContent = formatted;
    return true;
  }

  function boot() {
    ensureStyles();

    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        polishGrid();
        polishEditorDate();
      });
    };

    polishGrid();
    polishEditorDate();

    const observer = new MutationObserver(schedule);
    observer.observe(grid, { childList: true });

    const editorTitle = document.getElementById("workoutDayEditorTitle");
    if (editorTitle) {
      const editorObserver = new MutationObserver(schedule);
      editorObserver.observe(editorTitle, { childList: true, characterData: true, subtree: true });
    }

    window.addEventListener("pageshow", schedule);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.AriWorkoutPlanCardHierarchy = Object.freeze({
    version: VERSION,
    refresh() {
      polishGrid();
      polishEditorDate();
    }
  });
})();
