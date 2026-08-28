// =====================================================
// ARI REBIRTH
// File: js/training/exercise-illustration-loader.js
// Version: 1.0.0
// Purpose:
//   Loads combined exercise guide PNGs from the deterministic
//   assets/training/exercises/<module>/<exercise-id>.png path.
//   Uses the existing Exercise Detail movement figure and falls
//   back cleanly to the current placeholder when an asset is absent.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";

  function getRegistry() {
    return globalThis.Ari?.training?.exercises || null;
  }

  function getExerciseFromDetail() {
    const registry = getRegistry();
    const name = document.getElementById("exerciseDetailName")?.textContent?.trim();

    if (!registry || !name) {
      return null;
    }

    return registry.get?.(name) || null;
  }

  function getGuidePath(exercise) {
    if (!exercise?.id || !exercise?.moduleId) {
      return null;
    }

    return `/assets/training/exercises/${exercise.moduleId}/${exercise.id}.png`;
  }

  function syncExerciseGuide() {
    const exercise = getExerciseFromDetail();
    const movementFigure = document.getElementById("exerciseMovementFigure");
    const movementImage = document.getElementById("exerciseMovementImage");
    const anatomyFigure = document.getElementById("exerciseAnatomyFigure");
    const placeholder = document.getElementById("exerciseVisualPlaceholder");

    if (!exercise || !movementFigure || !movementImage || !placeholder) {
      return;
    }

    // Preserve any future exercise-specific illustration records.
    if (exercise.illustration?.anatomy || exercise.illustration?.movement) {
      return;
    }

    const guidePath = exercise.illustration?.guide || getGuidePath(exercise);

    if (!guidePath) {
      return;
    }

    const expectedExerciseId = exercise.id;

    movementFigure.hidden = true;
    movementImage.removeAttribute("src");
    movementImage.alt = `${exercise.name} exercise guide`;

    const caption = movementFigure.querySelector("figcaption");
    if (caption) {
      caption.textContent = "Exercise Guide";
    }

    movementImage.onload = () => {
      const activeExercise = getExerciseFromDetail();

      if (activeExercise?.id !== expectedExerciseId) {
        return;
      }

      movementFigure.hidden = false;
      placeholder.hidden = true;
    };

    movementImage.onerror = () => {
      const activeExercise = getExerciseFromDetail();

      if (activeExercise?.id !== expectedExerciseId) {
        return;
      }

      movementFigure.hidden = true;
      movementImage.removeAttribute("src");

      if (!anatomyFigure || anatomyFigure.hidden) {
        placeholder.hidden = false;
      }
    };

    movementImage.src = guidePath;
  }

  function scheduleSync() {
    queueMicrotask(syncExerciseGuide);
  }

  function boot() {
    const dialog = document.getElementById("exerciseDetailDialog");
    const name = document.getElementById("exerciseDetailName");

    if (!dialog || !name) {
      return;
    }

    const nameObserver = new MutationObserver(scheduleSync);
    nameObserver.observe(name, {
      childList: true,
      characterData: true,
      subtree: true
    });

    const dialogObserver = new MutationObserver(scheduleSync);
    dialogObserver.observe(dialog, {
      attributes: true,
      attributeFilter: ["open"]
    });

    scheduleSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  globalThis.Ari = globalThis.Ari || {};
  globalThis.Ari.training = globalThis.Ari.training || {};
  globalThis.Ari.training.exerciseIllustrations = {
    version: VERSION,
    sync: syncExerciseGuide
  };
})();
