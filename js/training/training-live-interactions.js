// =====================================================
// ARI XP Training — Live Interaction Repairs
// Version: 1.0.1
// Purpose:
//   - Open the live Add Exercise <dialog> correctly on iOS/Safari.
//   - Keep legacy day renders from re-hiding an already-open picker.
//   - Replace the unfiltered default catalog with a compact Quick Add row.
//   - Keep full Exercise Library access through search.
//   - Cancel a workout by marking its session abandoned instead of deleting
//     several related tables during a live interaction.
// =====================================================

import ExerciseRegistry from "./exercises/exercise-registry.js";
import WorkoutProgressStore from "./workout-progress-store.js";

const VERSION = "1.0.1";
const RECENT_KEY = "ari_training_recent_exercises_v1";
const ACTIVE_SESSION_CACHE_KEY = "ari_training_active_session_cache_v3";
const QUICK_LIMIT = 6;

const $ = (id) => document.getElementById(id);

function getRuntime() {
  return window.AriTrainingRuntime || window.Ari?.Training || null;
}

function getSupabase() {
  if (window.calbuddySupabase?.from) return window.calbuddySupabase;
  if (window.supabaseClient?.from) return window.supabaseClient;
  return null;
}

function allExercises() {
  try {
    if (Array.isArray(ExerciseRegistry?.all)) return [...ExerciseRegistry.all];
    if (typeof ExerciseRegistry?.list === "function") {
      const rows = ExerciseRegistry.list();
      return Array.isArray(rows) ? rows : [];
    }
  } catch (error) {
    console.warn("[ARI Training Interactions] Exercise list unavailable.", error);
  }
  return [];
}

function recentIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function rememberExercise(id) {
  if (!id) return;
  const next = [String(id), ...recentIds().filter((value) => value !== String(id))].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage is an enhancement only.
  }
}

function exerciseWords(exercise) {
  return [
    exercise?.name,
    exercise?.id,
    exercise?.category,
    ...(exercise?.exerciseTypes || []),
    ...(exercise?.primaryMuscles || []),
    ...(exercise?.secondaryMuscles || []),
    ...(exercise?.equipment || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function quickExercises() {
  const runtime = getRuntime();
  const session = runtime?.getActiveSession?.() || null;
  const collection = allExercises();
  if (!collection.length) return [];

  const existingIds = new Set(
    (session?.exercises || []).map((item) => String(item.exercise_id || "")).filter(Boolean)
  );

  const recents = recentIds();
  const recentRank = new Map(recents.map((id, index) => [String(id), recents.length - index]));

  const context = [
    session?.title,
    ...(session?.exercises || []).flatMap((item) => [
      item.exercise_name,
      item.exercise_type
    ])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const contextTokens = new Set(
    context
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3)
  );

  const commonPattern = /squat|bench|press|deadlift|row|pulldown|curl|extension|raise|run|walk|treadmill|bike|cycling|elliptical|plank|push.?up/i;

  return collection
    .filter((exercise) => exercise?.id && !existingIds.has(String(exercise.id)))
    .map((exercise, index) => {
      const text = exerciseWords(exercise);
      let score = Math.max(0, 30 - index) * 0.01;

      if (recentRank.has(String(exercise.id))) {
        score += 100 + recentRank.get(String(exercise.id));
      }

      for (const token of contextTokens) {
        if (text.includes(token)) score += 8;
      }

      if (commonPattern.test(`${exercise?.name || ""} ${exercise?.id || ""}`)) {
        score += 3;
      }

      return { exercise, score };
    })
    .sort((a, b) => b.score - a.score || String(a.exercise.name || a.exercise.id).localeCompare(String(b.exercise.name || b.exercise.id)))
    .slice(0, QUICK_LIMIT)
    .map((item) => item.exercise);
}

function ensureStyles() {
  if ($("ariTrainingLiveInteractionStyles")) return;

  const style = document.createElement("style");
  style.id = "ariTrainingLiveInteractionStyles";
  style.textContent = `
    #sessionExercisePicker[open] {
      width: min(100% - 24px, 560px);
      max-height: min(78vh, 720px);
      margin: auto;
      padding: 0;
      border: 0;
      border-radius: 30px;
      background: transparent;
      overflow: visible;
    }

    #sessionExercisePicker::backdrop {
      background: rgba(10, 18, 42, .24);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    #sessionExercisePicker .ari-training-dialog__surface {
      max-height: min(78vh, 720px);
      overflow: auto;
      border: 1px solid rgba(255,255,255,.95);
      border-radius: 30px;
      background: rgba(250,252,255,.98);
      box-shadow: 0 28px 80px rgba(29,49,105,.20);
    }

    .ari-session-quick-add {
      padding: 8px 0 2px;
    }

    .ari-session-quick-add__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 10px;
    }

    .ari-session-quick-add__heading strong {
      color: #0c1830;
      font-size: .86rem;
      font-weight: 800;
    }

    .ari-session-quick-add__heading span {
      color: #8a95aa;
      font-size: .68rem;
      font-weight: 700;
    }

    .ari-session-quick-add__chips {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 8px;
    }

    .ari-session-quick-add__chip {
      min-width: 0;
      min-height: 48px;
      padding: 0 13px;
      border: 1px solid rgba(37,88,255,.11);
      border-radius: 15px;
      background: linear-gradient(145deg, rgba(255,255,255,.99), rgba(242,247,255,.94));
      color: #22365e;
      box-shadow: 0 7px 20px rgba(39,63,124,.055);
      font: inherit;
      font-size: .75rem;
      font-weight: 750;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ari-session-quick-add__hint {
      margin: 11px 2px 0;
      color: #8994a7;
      font-size: .69rem;
      line-height: 1.45;
    }

    #sessionExerciseSearchResults[data-quick-hidden="true"] {
      display: none !important;
    }

    .ari-cancel-workout-dialog {
      width: min(100% - 28px, 460px);
      margin: auto;
      padding: 0;
      border: 0;
      border-radius: 26px;
      background: transparent;
    }

    .ari-cancel-workout-dialog::backdrop {
      background: rgba(10,18,42,.28);
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
    }

    .ari-cancel-workout-dialog__card {
      padding: 22px;
      border: 1px solid rgba(255,255,255,.95);
      border-radius: 26px;
      background: rgba(251,252,255,.99);
      box-shadow: 0 26px 70px rgba(24,42,88,.20);
    }

    .ari-cancel-workout-dialog__card h2 {
      margin: 0;
      color: #0b1730;
      font-size: 1.2rem;
    }

    .ari-cancel-workout-dialog__card p {
      margin: 9px 0 18px;
      color: #69758c;
      line-height: 1.5;
    }

    .ari-cancel-workout-dialog__actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .ari-cancel-workout-dialog__actions button {
      min-height: 48px;
      border-radius: 15px;
      font: inherit;
      font-weight: 800;
    }

    .ari-cancel-workout-dialog__keep {
      border: 1px solid rgba(45,74,145,.13);
      background: #f6f8fd;
      color: #1e3158;
    }

    .ari-cancel-workout-dialog__confirm {
      border: 1px solid rgba(216,58,89,.18);
      background: #fff0f3;
      color: #c92f50;
    }

    .ari-cancel-workout-dialog__status {
      min-height: 1.2em;
      margin: 12px 0 0 !important;
      color: #c92f50 !important;
      font-size: .72rem;
    }

    @media (max-width: 390px) {
      .ari-session-quick-add__chips { grid-template-columns: 1fr; }
    }
  `;

  document.head.append(style);
}

function ensureQuickPanel() {
  const input = $("sessionExerciseSearchInput");
  if (!input) return null;

  let panel = $("sessionQuickAddPanel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "sessionQuickAddPanel";
    panel.className = "ari-session-quick-add";
    panel.innerHTML = `
      <div class="ari-session-quick-add__heading">
        <strong>Quick Add</strong>
        <span>Tap once</span>
      </div>
      <div class="ari-session-quick-add__chips" id="sessionQuickAddChips"></div>
      <p class="ari-session-quick-add__hint">Need something else? Type the exercise name above.</p>
    `;
    input.insertAdjacentElement("afterend", panel);
  }

  return panel;
}

function renderQuickPanel() {
  const panel = ensureQuickPanel();
  const chips = $("sessionQuickAddChips");
  if (!panel || !chips) return;

  chips.replaceChildren();
  const suggestions = quickExercises();

  for (const exercise of suggestions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ari-session-quick-add__chip";
    button.dataset.quickExerciseId = String(exercise.id);
    button.dataset.quickExerciseName = exercise.name || String(exercise.id);
    button.textContent = exercise.name || String(exercise.id);
    chips.append(button);
  }

  panel.hidden = suggestions.length === 0;
}

function syncPickerMode() {
  const input = $("sessionExerciseSearchInput");
  const results = $("sessionExerciseSearchResults");
  const quick = $("sessionQuickAddPanel");
  if (!input || !results || !quick) return;

  const searching = Boolean(String(input.value || "").trim());
  quick.hidden = searching;
  results.dataset.quickHidden = searching ? "false" : "true";
}

function protectOpenPickerVisibility(dialog) {
  if (!dialog || dialog.dataset.ariPickerVisibilityGuard === "true") return;

  const observer = new MutationObserver(() => {
    if (dialog.open && dialog.hidden) {
      dialog.hidden = false;
    }
  });

  observer.observe(dialog, {
    attributes: true,
    attributeFilter: ["hidden", "open"]
  });

  dialog.dataset.ariPickerVisibilityGuard = "true";
}

function openPickerCorrectly() {
  const runtime = getRuntime();
  const dialog = $("sessionExercisePicker");
  if (!dialog) return;

  protectOpenPickerVisibility(dialog);
  runtime?.openExercisePicker?.();
  dialog.hidden = false;

  renderQuickPanel();
  syncPickerMode();

  try {
    if (!dialog.open && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (!dialog.open) {
      dialog.setAttribute("open", "");
    }
  } catch (error) {
    console.warn("[ARI Training Interactions] Dialog open fallback used.", error);
    dialog.setAttribute("open", "");
  }

  // A legacy selected-day render can run after the click and reapply hidden.
  // If this dialog is still genuinely open, the visibility guard removes it.
  dialog.hidden = false;
  window.setTimeout(() => $("sessionExerciseSearchInput")?.focus(), 40);
}

function closePickerCorrectly() {
  const dialog = $("sessionExercisePicker");
  if (!dialog) return;

  try {
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  } catch {
    dialog.removeAttribute("open");
  }

  dialog.hidden = true;
}

function quickAddExercise(button) {
  const input = $("sessionExerciseSearchInput");
  const results = $("sessionExerciseSearchResults");
  if (!input || !results) return;

  const id = String(button.dataset.quickExerciseId || "");
  const name = String(button.dataset.quickExerciseName || "");
  if (!id) return;

  input.value = name;
  input.dispatchEvent(new Event("input", { bubbles: true }));

  const exact = [...results.querySelectorAll('[data-action="add-session-exercise"]')]
    .find((item) => String(item.dataset.exerciseId || "") === id);

  if (exact) {
    rememberExercise(id);
    exact.click();
  }
}

function ensureCancelDialog() {
  let dialog = $("ariCancelWorkoutConfirm");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.id = "ariCancelWorkoutConfirm";
  dialog.className = "ari-cancel-workout-dialog";
  dialog.innerHTML = `
    <div class="ari-cancel-workout-dialog__card">
      <h2>Cancel workout?</h2>
      <p>Your progress from this live session will be discarded. Your workout plan will stay unchanged.</p>
      <div class="ari-cancel-workout-dialog__actions">
        <button type="button" class="ari-cancel-workout-dialog__keep" data-keep-workout>Keep Workout</button>
        <button type="button" class="ari-cancel-workout-dialog__confirm" data-confirm-cancel>Cancel Workout</button>
      </div>
      <p class="ari-cancel-workout-dialog__status" id="ariCancelWorkoutStatus" role="status" aria-live="polite"></p>
    </div>
  `;
  document.body.append(dialog);

  dialog.querySelector("[data-keep-workout]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-confirm-cancel]")?.addEventListener("click", () => void abandonActiveWorkout(dialog));

  return dialog;
}

function openCancelDialog() {
  const dialog = ensureCancelDialog();
  const status = $("ariCancelWorkoutStatus");
  if (status) status.textContent = "";

  const confirmButton = dialog.querySelector("[data-confirm-cancel]");
  if (confirmButton) {
    confirmButton.disabled = false;
    confirmButton.textContent = "Cancel Workout";
  }

  try {
    if (!dialog.open) dialog.showModal();
  } catch {
    dialog.setAttribute("open", "");
  }
}

async function abandonActiveWorkout(dialog) {
  const runtime = getRuntime();
  const session = runtime?.getActiveSession?.();
  const status = $("ariCancelWorkoutStatus");
  const button = dialog.querySelector("[data-confirm-cancel]");

  if (!session?.id) {
    if (status) status.textContent = "No active workout was found.";
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Cancelling…";
  }
  if (status) status.textContent = "";

  try {
    const isLocal = String(session.id).startsWith("local_");

    if (!isLocal) {
      const client = getSupabase();
      if (!client) throw new Error("Cloud connection is unavailable.");

      const update = client
        .from("ari_workout_sessions")
        .update({
          status: "abandoned",
          paused_at: null,
          completed_at: null
        })
        .eq("id", session.id);

      if (session.user_id) update.eq("user_id", session.user_id);

      const { error } = await update;
      if (error) throw error;
    }

    try {
      WorkoutProgressStore?.cancelDay?.(
        session.local_date || runtime?.getSelectedDate?.(),
        { preservePlannedEntries: true }
      );
    } catch (progressError) {
      console.warn("[ARI Training Interactions] Progress cleanup warning.", progressError);
    }

    try {
      localStorage.removeItem(ACTIVE_SESSION_CACHE_KEY);
    } catch {
      // Safe to continue; reload will rehydrate from the abandoned session state.
    }

    if (status) status.textContent = "Workout cancelled.";

    window.setTimeout(() => {
      window.location.reload();
    }, 180);
  } catch (error) {
    console.error("[ARI Training Interactions] Cancel workout failed.", error);
    if (status) {
      status.textContent = error?.message || "Workout could not be cancelled. Please try again.";
    }
    if (button) {
      button.disabled = false;
      button.textContent = "Try Again";
    }
  }
}

function bind() {
  ensureStyles();
  ensureQuickPanel();

  const addButton = $("addExerciseToSessionButton");
  const closeButton = $("closeSessionExercisePickerButton");
  const input = $("sessionExerciseSearchInput");
  const results = $("sessionExerciseSearchResults");
  const quickPanel = $("sessionQuickAddPanel");
  const picker = $("sessionExercisePicker");
  const cancelButton = $("cancelTodayWorkoutButton");

  protectOpenPickerVisibility(picker);

  // The legacy controller removes hidden but does not call showModal().
  // Run after its target listener so its search results are ready first.
  addButton?.addEventListener("click", () => {
    window.setTimeout(openPickerCorrectly, 0);
  });

  // Close modal state before the legacy hidden toggle runs.
  closeButton?.addEventListener("click", closePickerCorrectly, true);

  input?.addEventListener("input", () => {
    window.requestAnimationFrame(syncPickerMode);
  });

  quickPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-exercise-id]");
    if (button) quickAddExercise(button);
  });

  results?.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="add-session-exercise"]');
    if (!button) return;

    if (button.dataset.exerciseId) rememberExercise(button.dataset.exerciseId);

    // The legacy handler performs the actual add asynchronously. Closing the
    // modal here is purely UI state cleanup and does not cancel that operation.
    window.setTimeout(closePickerCorrectly, 0);
  });

  picker?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePickerCorrectly();
  });

  // Intercept before the original Cancel handler so we do one reliable row
  // update instead of deleting session + exercise + set + HR rows live.
  cancelButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openCancelDialog();
  }, true);

  window.AriTrainingLiveInteractions = Object.freeze({
    version: VERSION,
    openExercisePicker: openPickerCorrectly,
    openCancelDialog
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}
