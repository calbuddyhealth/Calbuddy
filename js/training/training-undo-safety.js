// =====================================================
// ARI XP
// File: js/training/training-undo-safety.js
// Version: 1.0.0
// Purpose:
//   Make destructive completed-workout actions independent of the Training
//   controller's transient user refresh state. iOS/Safari can fire focus while
//   a native confirm dialog is closing; this module snapshots the authenticated
//   user directly from Supabase before deleting a completed workout.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const COMPLETED_CACHE_KEY = "ari_training_completed_sessions_v2";
  let busy = false;

  function client() {
    return window.calbuddySupabase || window.supabaseClient || null;
  }

  async function authenticatedUser() {
    const supabase = client();
    if (!supabase?.auth?.getUser) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  function removeLocalCompletion(sessionId) {
    try {
      const rows = JSON.parse(localStorage.getItem(COMPLETED_CACHE_KEY) || "[]");
      if (!Array.isArray(rows)) return;
      const next = rows.filter((row) => String(row?.id ?? row?.sessionId ?? "") !== String(sessionId));
      localStorage.setItem(COMPLETED_CACHE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("[ARI Training Undo Safety] Local completion cleanup failed.", error);
    }
  }

  async function deleteCompletedWorkout(sessionId, userId) {
    const supabase = client();
    if (!supabase?.from) throw new Error("Training cloud connection is unavailable.");

    for (const table of [
      "ari_workout_session_sets",
      "ari_workout_heart_rate_readings",
      "ari_workout_session_exercises"
    ]) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", userId);
      if (error) throw error;
    }

    const { error } = await supabase
      .from("ari_workout_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) throw error;
    removeLocalCompletion(sessionId);
  }

  function showMessage(message, type = "success") {
    const runtime = window.AriTrainingRuntime || window.Ari?.Training || null;
    if (typeof runtime?.showMessage === "function") {
      runtime.showMessage(message, type);
      return;
    }

    let note = document.getElementById("ariTrainingUndoSafetyMessage");
    if (!note) {
      note = document.createElement("p");
      note.id = "ariTrainingUndoSafetyMessage";
      note.setAttribute("role", "status");
      note.style.margin = "14px 0 0";
      note.style.font = "600 .78rem/1.45 Inter, sans-serif";
      document.getElementById("todaysTraining")?.append(note);
    }
    note.style.color = type === "error" ? "#b64056" : "#3e6d5a";
    note.textContent = message;
  }

  async function refreshTraining() {
    const runtime = window.AriTrainingRuntime || window.Ari?.Training || null;
    if (typeof runtime?.refresh === "function") {
      await runtime.refresh();
      return;
    }
    window.location.reload();
  }

  async function handleUndo(button) {
    if (busy) return;

    const sessionId = String(button?.dataset?.sessionId || "").trim();
    if (!sessionId) {
      showMessage("This completed workout could not be identified. Refresh Training and try again.", "error");
      return;
    }

    const approved = window.confirm(
      "Undo this completed workout? Its saved sets, time, calories, and heart-rate data will be removed. Your workout plan will stay unchanged."
    );
    if (!approved) return;

    busy = true;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Undoing…";

    try {
      // Resolve and snapshot the user only after Safari's confirm dialog closes.
      // Never depend on ari-training.js state.user during this mutation.
      const user = await authenticatedUser();
      if (!user?.id) throw new Error("Your signed-in session could not be verified. Refresh and sign in again if needed.");

      if (sessionId.startsWith("local_")) {
        removeLocalCompletion(sessionId);
      } else {
        await deleteCompletedWorkout(sessionId, user.id);
      }

      showMessage("Workout completion undone.", "success");
      await refreshTraining();
    } catch (error) {
      console.error("[ARI Training Undo Safety] Undo failed.", error);
      showMessage(error?.message || "Workout completion could not be undone.", "error");
      button.disabled = false;
      button.textContent = originalText || "Undo Completion";
    } finally {
      busy = false;
    }
  }

  function captureUndo(event) {
    const button = event.target?.closest?.("#undoCompletedWorkoutButton");
    if (!button) return;

    // The legacy Training click handler uses controller state that can briefly
    // be null during Safari focus refresh. Own this click before it reaches the
    // legacy target listener.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void handleUndo(button);
  }

  document.addEventListener("click", captureUndo, true);

  window.AriTrainingUndoSafety = Object.freeze({
    version: VERSION,
    undo: (sessionId) => {
      const button = document.getElementById("undoCompletedWorkoutButton");
      if (button && sessionId) button.dataset.sessionId = sessionId;
      return handleUndo(button);
    }
  });
})();
