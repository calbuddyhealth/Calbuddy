// ARI XP Training — Quick Log
// Compact manual activity logging opposite the Training date selector.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  let servicePromise = null;
  let estimateTimer = null;
  let caloriesUserEdited = false;

  const $ = (id) => document.getElementById(id);

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("./activity-log-service.js?v=1.0.0")
        .then((module) => module.default || module.ActivityLogService);
    }
    return servicePromise;
  }

  function selectedDate() {
    const runtime = window.AriTrainingRuntime || window.Ari?.Training || null;
    try {
      const value = runtime?.getSelectedDate?.();
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    } catch {}
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function strengthLike(name = "") {
    return /push.?up|pull.?up|squat|press|bench|deadlift|row|curl|raise|extension|lunge|strength|lift|calisthen|burpee|dip\b/i.test(String(name));
  }

  function ensureStyles() {
    if ($("ariActivityQuickLogStyles")) return;
    const style = document.createElement("style");
    style.id = "ariActivityQuickLogStyles";
    style.textContent = `
      .ari-training-quick-log-button {
        margin-left: auto;
        min-height: 54px;
        padding: 0 18px;
        border: 1px solid rgba(40,102,255,.18);
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,249,255,.95));
        color: #2457d6;
        box-shadow: 0 10px 28px rgba(36,86,190,.08), inset 0 0 0 1px rgba(255,255,255,.8);
        font: 800 .84rem/1 Orbitron, Inter, sans-serif;
        letter-spacing: .02em;
        white-space: nowrap;
      }
      .ari-training-quick-log-button:active { transform: translateY(1px); }
      .ari-activity-sheet {
        width: min(100% - 20px, 560px);
        max-height: min(88vh, 820px);
        margin: auto auto 10px;
        padding: 0;
        border: 0;
        border-radius: 30px;
        background: transparent;
        overflow: visible;
      }
      .ari-activity-sheet::backdrop {
        background: rgba(8,18,42,.28);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .ari-activity-sheet__surface {
        max-height: min(88vh, 820px);
        overflow: auto;
        padding: 22px;
        border: 1px solid rgba(255,255,255,.94);
        border-radius: 30px;
        background: rgba(250,253,255,.985);
        box-shadow: 0 28px 90px rgba(22,46,105,.22);
      }
      .ari-activity-sheet__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .ari-activity-sheet__eyebrow {
        margin: 0 0 5px;
        color: #22a9cb;
        font: 800 .68rem/1 Orbitron, Inter, sans-serif;
        letter-spacing: .14em;
      }
      .ari-activity-sheet h2 {
        margin: 0;
        color: #0a1730;
        font: 700 1.35rem/1.15 Orbitron, Inter, sans-serif;
      }
      .ari-activity-sheet__close {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(40,78,150,.12);
        border-radius: 14px;
        background: #f5f8fd;
        color: #20365e;
        font-size: 1.35rem;
      }
      .ari-activity-chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 0 0 12px;
        scrollbar-width: none;
      }
      .ari-activity-chips::-webkit-scrollbar { display: none; }
      .ari-activity-chip {
        min-height: 38px;
        padding: 0 13px;
        border: 1px solid rgba(45,92,215,.11);
        border-radius: 999px;
        background: #f4f8ff;
        color: #365379;
        font: 750 .72rem/1 Inter, sans-serif;
        white-space: nowrap;
      }
      .ari-activity-form { display: grid; gap: 13px; }
      .ari-activity-field { display: grid; gap: 6px; }
      .ari-activity-field label {
        color: #64738c;
        font: 800 .67rem/1 Orbitron, Inter, sans-serif;
        letter-spacing: .07em;
        text-transform: uppercase;
      }
      .ari-activity-field input,
      .ari-activity-field select,
      .ari-activity-field textarea {
        width: 100%;
        min-height: 50px;
        box-sizing: border-box;
        border: 1px solid rgba(37,83,187,.13);
        border-radius: 15px;
        background: rgba(247,250,255,.96);
        color: #0b1730;
        padding: 0 14px;
        font: 650 16px/1.3 Inter, sans-serif;
        outline: none;
      }
      .ari-activity-field textarea { min-height: 72px; padding-top: 12px; resize: vertical; }
      .ari-activity-field input:focus,
      .ari-activity-field select:focus,
      .ari-activity-field textarea:focus {
        border-color: rgba(0,195,225,.48);
        box-shadow: 0 0 0 3px rgba(0,195,225,.08);
      }
      .ari-activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
      .ari-activity-strength-fields[hidden] { display: none !important; }
      .ari-activity-calorie-wrap { position: relative; }
      .ari-activity-calorie-wrap input { padding-right: 72px; }
      .ari-activity-auto-button {
        position: absolute;
        right: 7px;
        top: 7px;
        min-height: 36px;
        padding: 0 10px;
        border: 0;
        border-radius: 10px;
        background: rgba(41,91,255,.09);
        color: #2859d6;
        font: 800 .65rem/1 Inter, sans-serif;
      }
      .ari-activity-estimate-note {
        min-height: 1.2em;
        margin: 0;
        color: #8190a7;
        font: 600 .7rem/1.45 Inter, sans-serif;
      }
      .ari-activity-estimate-note.is-user { color: #596a84; }
      .ari-activity-estimate-note.is-error { color: #bd3c57; }
      .ari-activity-save {
        min-height: 54px;
        margin-top: 5px;
        border: 0;
        border-radius: 17px;
        background: linear-gradient(100deg, #3158ee 0%, #23c6df 100%);
        color: white;
        box-shadow: 0 12px 28px rgba(38,92,224,.22);
        font: 800 .95rem/1 Inter, sans-serif;
      }
      .ari-activity-save:disabled { opacity: .55; }
      .ari-activity-status { min-height: 1.3em; margin: 0; color: #6e7f97; font-size: .72rem; }
      .ari-activity-toast {
        position: fixed;
        z-index: 10000;
        left: 50%;
        bottom: calc(24px + env(safe-area-inset-bottom));
        transform: translateX(-50%);
        max-width: calc(100% - 36px);
        padding: 12px 18px;
        border-radius: 999px;
        background: rgba(10,28,65,.94);
        color: white;
        box-shadow: 0 14px 40px rgba(12,28,68,.25);
        font: 750 .76rem/1.35 Inter, sans-serif;
      }
      @media (max-width: 420px) {
        .ari-training-quick-log-button { min-height: 50px; padding: 0 14px; font-size: .75rem; }
        .ari-activity-grid { grid-template-columns: 1fr 1fr; }
        .ari-activity-sheet__surface { padding: 19px; }
      }
    `;
    document.head.append(style);
  }

  function ensureButton() {
    const row = document.querySelector(".ari-training-date-row");
    if (!row || $("ariTrainingQuickLogButton")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "ariTrainingQuickLogButton";
    button.className = "ari-training-quick-log-button";
    button.textContent = "+ Quick Log";
    button.setAttribute("aria-haspopup", "dialog");
    row.append(button);
  }

  function ensureDialog() {
    let dialog = $("ariActivityQuickLogDialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "ariActivityQuickLogDialog";
    dialog.className = "ari-activity-sheet";
    dialog.innerHTML = `
      <div class="ari-activity-sheet__surface">
        <header class="ari-activity-sheet__header">
          <div>
            <p class="ari-activity-sheet__eyebrow">TRAINING</p>
            <h2>Quick Log</h2>
          </div>
          <button type="button" class="ari-activity-sheet__close" data-close-activity aria-label="Close Quick Log">&times;</button>
        </header>

        <div class="ari-activity-chips" aria-label="Common activities">
          <button type="button" class="ari-activity-chip" data-activity-chip="Run">Run</button>
          <button type="button" class="ari-activity-chip" data-activity-chip="Walk">Walk</button>
          <button type="button" class="ari-activity-chip" data-activity-chip="Bike">Bike</button>
          <button type="button" class="ari-activity-chip" data-activity-chip="Hike">Hike</button>
          <button type="button" class="ari-activity-chip" data-activity-chip="Push-ups">Push-ups</button>
          <button type="button" class="ari-activity-chip" data-activity-chip="Strength workout">Strength</button>
        </div>

        <form id="ariActivityQuickLogForm" class="ari-activity-form">
          <div class="ari-activity-field">
            <label for="ariActivityName">Activity / workout name</label>
            <input id="ariActivityName" name="activityName" autocomplete="off" placeholder="Run, push-ups, basketball…" required>
          </div>

          <div class="ari-activity-grid">
            <div class="ari-activity-field">
              <label for="ariActivityDuration">Duration (min)</label>
              <input id="ariActivityDuration" name="durationMinutes" type="number" inputmode="numeric" min="1" max="1440" step="1" placeholder="20">
            </div>
            <div class="ari-activity-field">
              <label for="ariActivityIntensity">Intensity</label>
              <select id="ariActivityIntensity" name="intensity">
                <option value="light">Light</option>
                <option value="moderate" selected>Moderate</option>
                <option value="vigorous">Vigorous</option>
              </select>
            </div>
          </div>

          <div id="ariActivityStrengthFields" class="ari-activity-grid ari-activity-strength-fields" hidden>
            <div class="ari-activity-field">
              <label for="ariActivitySets">Sets</label>
              <input id="ariActivitySets" name="sets" type="number" inputmode="numeric" min="1" max="100" step="1" placeholder="4">
            </div>
            <div class="ari-activity-field">
              <label for="ariActivityReps">Reps / set</label>
              <input id="ariActivityReps" name="repsPerSet" type="number" inputmode="numeric" min="1" max="10000" step="1" placeholder="50">
            </div>
          </div>

          <div class="ari-activity-field">
            <label for="ariActivityAverageHr">Average HR (optional)</label>
            <input id="ariActivityAverageHr" name="averageHeartRate" type="number" inputmode="numeric" min="30" max="240" step="1" placeholder="Use if known">
          </div>

          <div class="ari-activity-field">
            <label for="ariActivityCalories">Calories burned</label>
            <div class="ari-activity-calorie-wrap">
              <input id="ariActivityCalories" name="caloriesBurned" type="number" inputmode="numeric" min="1" max="10000" step="1" placeholder="Auto estimate">
              <button type="button" class="ari-activity-auto-button" id="ariActivityAutoCalories">AUTO</button>
            </div>
            <p id="ariActivityEstimateNote" class="ari-activity-estimate-note">Add an activity and duration for a profile-based estimate.</p>
          </div>

          <div class="ari-activity-field">
            <label for="ariActivityNotes">Notes (optional)</label>
            <textarea id="ariActivityNotes" name="notes" placeholder="Anything useful about the activity."></textarea>
          </div>

          <button class="ari-activity-save" id="ariActivitySaveButton" type="submit">Save Activity</button>
          <p id="ariActivityStatus" class="ari-activity-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    `;
    document.body.append(dialog);
    return dialog;
  }

  function formInput() {
    return {
      activityName: $("ariActivityName")?.value || "",
      durationMinutes: $("ariActivityDuration")?.value || null,
      intensity: $("ariActivityIntensity")?.value || "moderate",
      sets: $("ariActivitySets")?.value || null,
      repsPerSet: $("ariActivityReps")?.value || null,
      averageHeartRate: $("ariActivityAverageHr")?.value || null,
      caloriesBurned: caloriesUserEdited ? ($("ariActivityCalories")?.value || null) : null,
      notes: $("ariActivityNotes")?.value || "",
      dateText: selectedDate()
    };
  }

  function updateStrengthVisibility() {
    const fields = $("ariActivityStrengthFields");
    if (!fields) return;
    fields.hidden = !strengthLike($("ariActivityName")?.value || "");
  }

  async function updateEstimate() {
    const note = $("ariActivityEstimateNote");
    const calories = $("ariActivityCalories");
    if (!note || !calories || caloriesUserEdited) return;

    const input = formInput();
    if (!input.activityName || !Number(input.durationMinutes)) {
      calories.value = "";
      note.className = "ari-activity-estimate-note";
      note.textContent = "Add an activity and duration for a profile-based estimate.";
      return;
    }

    const service = await loadService();
    const result = await service.estimateActivity(input);
    if (!result?.success) {
      calories.value = "";
      note.className = "ari-activity-estimate-note is-error";
      note.textContent = result?.code === "profile_weight_required"
        ? "Add your current weight in My Goals or enter calories manually."
        : "Estimate unavailable — you can enter calories manually.";
      return;
    }

    calories.value = String(result.calories);
    note.className = "ari-activity-estimate-note";
    note.textContent = result.detail?.averageHeartRate
      ? "Estimated from your profile, activity, duration, and average heart rate."
      : "Estimated from your Goals profile, activity type, duration, and intensity.";
  }

  function scheduleEstimate() {
    window.clearTimeout(estimateTimer);
    estimateTimer = window.setTimeout(() => void updateEstimate(), 180);
  }

  function resetAutoCalories() {
    caloriesUserEdited = false;
    const calories = $("ariActivityCalories");
    if (calories) calories.value = "";
    scheduleEstimate();
  }

  function showToast(message) {
    const old = $("ariActivityToast");
    old?.remove();
    const toast = document.createElement("div");
    toast.id = "ariActivityToast";
    toast.className = "ari-activity-toast";
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function openDialog() {
    const dialog = ensureDialog();
    const form = $("ariActivityQuickLogForm");
    form?.reset();
    caloriesUserEdited = false;
    updateStrengthVisibility();
    const note = $("ariActivityEstimateNote");
    if (note) {
      note.className = "ari-activity-estimate-note";
      note.textContent = "Add an activity and duration for a profile-based estimate.";
    }
    const status = $("ariActivityStatus");
    if (status) status.textContent = `Logging for ${selectedDate()}.`;
    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      dialog.setAttribute("open", "");
    }
    window.setTimeout(() => $("ariActivityName")?.focus(), 60);
  }

  function closeDialog() {
    const dialog = $("ariActivityQuickLogDialog");
    if (!dialog) return;
    try {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    } catch {
      dialog.removeAttribute("open");
    }
  }

  async function save(event) {
    event.preventDefault();
    const button = $("ariActivitySaveButton");
    const status = $("ariActivityStatus");
    if (button) {
      button.disabled = true;
      button.textContent = "Saving…";
    }
    if (status) status.textContent = "";

    try {
      const service = await loadService();
      const input = formInput();
      if (!caloriesUserEdited) input.caloriesBurned = null;
      const result = await service.logActivity(input, { source: "manual_quick_log", dateText: selectedDate() });
      if (!result?.success) throw new Error(result?.message || "Activity could not be saved.");
      closeDialog();
      showToast(`${result.activity.activity_name} saved • ${Math.round(result.activity.calories_burned)} kcal`);
    } catch (error) {
      if (status) status.textContent = error?.message || "Activity could not be saved.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Save Activity";
      }
    }
  }

  function bind() {
    ensureStyles();
    ensureButton();
    const dialog = ensureDialog();

    $("ariTrainingQuickLogButton")?.addEventListener("click", openDialog);
    dialog.querySelector("[data-close-activity]")?.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });

    $("ariActivityQuickLogForm")?.addEventListener("submit", save);
    $("ariActivityName")?.addEventListener("input", () => {
      updateStrengthVisibility();
      scheduleEstimate();
    });
    ["ariActivityDuration", "ariActivityIntensity", "ariActivitySets", "ariActivityReps", "ariActivityAverageHr"]
      .forEach((id) => $(id)?.addEventListener("input", scheduleEstimate));
    $("ariActivityIntensity")?.addEventListener("change", scheduleEstimate);

    $("ariActivityCalories")?.addEventListener("input", () => {
      caloriesUserEdited = Boolean(String($("ariActivityCalories")?.value || "").trim());
      const note = $("ariActivityEstimateNote");
      if (caloriesUserEdited && note) {
        note.className = "ari-activity-estimate-note is-user";
        note.textContent = "Using your calorie value instead of ARI's estimate.";
      }
    });
    $("ariActivityAutoCalories")?.addEventListener("click", resetAutoCalories);

    dialog.querySelectorAll("[data-activity-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = $("ariActivityName");
        if (!input) return;
        input.value = button.dataset.activityChip || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });

    window.AriTrainingQuickLog = Object.freeze({ version: VERSION, open: openDialog });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
