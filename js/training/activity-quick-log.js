// ARI XP Training — Quick Log + completed manual/Ari activity ledger.
// Manual/Ari activities project into Training as completed activities without claiming planned workout completion.

(() => {
  "use strict";

  const VERSION = "1.2.0";
  let servicePromise = null;
  let estimateTimer = null;
  let caloriesUserEdited = false;
  let editingActivityId = null;
  let lastRenderedDate = null;
  const revealedActivityDates = new Set();

  const $ = (id) => document.getElementById(id);

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("./activity-log-service.js?v=1.1.0")
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function strengthLike(name = "") {
    return /push.?up|pull.?up|squat|press|bench|deadlift|row|curl|raise|extension|lunge|strength|lift|calisthen|burpee|dip\b/i.test(String(name));
  }

  function escapeHtml(value = "") {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function titleCase(value = "") {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function ensureStyles() {
    if ($("ariActivityQuickLogStyles")) return;
    const style = document.createElement("style");
    style.id = "ariActivityQuickLogStyles";
    style.textContent = `
      .ari-training-quick-log-button{margin-left:auto;min-height:54px;padding:0 18px;border:1px solid rgba(40,102,255,.18);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(239,249,255,.95));color:#2457d6;box-shadow:0 10px 28px rgba(36,86,190,.08),inset 0 0 0 1px rgba(255,255,255,.8);font:800 .84rem/1 Orbitron,Inter,sans-serif;letter-spacing:.02em;white-space:nowrap}
      .ari-training-quick-log-button:active{transform:translateY(1px)}
      .ari-activity-sheet{width:min(100% - 20px,560px);max-height:min(88vh,820px);margin:auto auto 10px;padding:0;border:0;border-radius:30px;background:transparent;overflow:visible}
      .ari-activity-sheet::backdrop{background:rgba(8,18,42,.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .ari-activity-sheet__surface{max-height:min(88vh,820px);overflow:auto;padding:22px;border:1px solid rgba(255,255,255,.94);border-radius:30px;background:rgba(250,253,255,.985);box-shadow:0 28px 90px rgba(22,46,105,.22)}
      .ari-activity-sheet__header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.ari-activity-sheet__eyebrow{margin:0 0 5px;color:#22a9cb;font:800 .68rem/1 Orbitron,Inter,sans-serif;letter-spacing:.14em}.ari-activity-sheet h2{margin:0;color:#0a1730;font:700 1.35rem/1.15 Orbitron,Inter,sans-serif}.ari-activity-sheet__close{width:42px;height:42px;border:1px solid rgba(40,78,150,.12);border-radius:14px;background:#f5f8fd;color:#20365e;font-size:1.35rem}
      .ari-activity-chips{display:flex;gap:8px;overflow-x:auto;padding:0 0 12px;scrollbar-width:none}.ari-activity-chips::-webkit-scrollbar{display:none}.ari-activity-chip{min-height:38px;padding:0 14px;border:1px solid rgba(41,95,190,.13);border-radius:999px;background:#f5f8fd;color:#365777;font:750 .76rem/1 Inter,sans-serif;white-space:nowrap}
      .ari-activity-form{display:grid;gap:14px}.ari-activity-field{display:grid;gap:7px}.ari-activity-field label{color:#61718a;font:800 .68rem/1.2 Orbitron,Inter,sans-serif;letter-spacing:.03em}.ari-activity-field input,.ari-activity-field select,.ari-activity-field textarea{width:100%;min-height:52px;padding:0 14px;border:1px solid rgba(45,88,165,.16);border-radius:16px;background:#f8faff;color:#0a1730;outline:0;font:700 1rem/1.2 Inter,sans-serif}.ari-activity-field textarea{min-height:82px;padding-top:13px;resize:vertical}.ari-activity-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ari-activity-calorie-wrap{display:grid;grid-template-columns:1fr auto;gap:8px}.ari-activity-auto-button{min-width:82px;border:0;border-radius:15px;background:#e7eeff;color:#2d5cc7;font:800 .75rem/1 Orbitron,Inter,sans-serif}.ari-activity-estimate-note,.ari-activity-status{margin:0;color:#71819a;font:600 .7rem/1.45 Inter,sans-serif}.ari-activity-estimate-note.is-user{color:#596a84}.ari-activity-estimate-note.is-error,.ari-activity-status.is-error{color:#bd3c57}
      .ari-activity-more{border:1px solid rgba(45,88,165,.1);border-radius:16px;background:#fbfcff;overflow:hidden}.ari-activity-more summary{padding:13px 14px;color:#4d6281;font:800 .72rem/1 Orbitron,Inter,sans-serif;cursor:pointer}.ari-activity-more__body{display:grid;gap:14px;padding:0 14px 14px}
      .ari-activity-save{min-height:54px;margin-top:4px;border:0;border-radius:17px;background:linear-gradient(100deg,#3158ee 0%,#23c6df 100%);color:#fff;box-shadow:0 12px 28px rgba(38,92,224,.22);font:800 .95rem/1 Inter,sans-serif}.ari-activity-save:disabled{opacity:.55}
      .ari-activity-toast{position:fixed;z-index:10000;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 36px);padding:12px 18px;border-radius:999px;background:rgba(10,28,65,.94);color:#fff;box-shadow:0 14px 40px rgba(12,28,68,.25);font:750 .76rem/1.35 Inter,sans-serif}
      .ari-manual-activity-card{margin-top:18px;border:1px solid rgba(46,101,210,.12);border-radius:24px;background:rgba(255,255,255,.73);box-shadow:0 14px 36px rgba(42,75,135,.07);overflow:hidden}.ari-manual-activity-card[hidden]{display:none!important}.ari-manual-activity-card summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;cursor:pointer}.ari-manual-activity-card summary::-webkit-details-marker{display:none}.ari-manual-activity-summary__left{min-width:0}.ari-manual-activity-kicker{display:block;margin-bottom:6px;color:#2b63d6;font:800 .64rem/1 Orbitron,Inter,sans-serif;letter-spacing:.11em}.ari-manual-activity-title{display:block;color:#0b1932;font:750 1rem/1.2 Inter,sans-serif}.ari-manual-activity-summary__right{display:flex;align-items:center;gap:12px;white-space:nowrap}.ari-manual-activity-calories{color:#173764;font:800 .84rem/1 Inter,sans-serif}.ari-manual-activity-chevron{color:#6d7f9a;font-size:1.1rem;transition:transform .18s ease}.ari-manual-activity-card[open] .ari-manual-activity-chevron{transform:rotate(180deg)}
      .ari-manual-activity-list{display:grid;gap:10px;padding:0 14px 14px}.ari-manual-activity-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:15px;border:1px solid rgba(44,94,180,.1);border-radius:18px;background:#f8faff}.ari-manual-activity-item__name{margin:0 0 5px;color:#0a1730;font:800 .9rem/1.2 Inter,sans-serif}.ari-manual-activity-item__meta{margin:0;color:#73839a;font:600 .72rem/1.45 Inter,sans-serif}.ari-manual-activity-item__side{text-align:right}.ari-manual-activity-item__kcal{display:block;margin-bottom:9px;color:#163b71;font:800 .82rem/1 Inter,sans-serif}.ari-manual-activity-actions{display:flex;justify-content:flex-end;gap:7px}.ari-manual-activity-action{min-height:34px;padding:0 10px;border:1px solid rgba(45,88,165,.12);border-radius:11px;background:#fff;color:#44617f;font:750 .68rem/1 Inter,sans-serif}.ari-manual-activity-action[data-action="delete"]{color:#b64056;background:#fff8fa}
      @media(max-width:420px){.ari-training-quick-log-button{min-height:50px;padding:0 14px;font-size:.75rem}.ari-activity-sheet__surface{padding:19px}.ari-manual-activity-card summary{padding:16px}.ari-manual-activity-item{grid-template-columns:1fr}.ari-manual-activity-item__side{text-align:left;display:flex;align-items:center;justify-content:space-between}.ari-manual-activity-item__kcal{margin:0}}
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

  function ensureActivitySection() {
    let card = $("ariManualActivityCard");
    if (card) return card;

    card = document.createElement("details");
    card.id = "ariManualActivityCard";
    card.className = "ari-manual-activity-card";
    card.hidden = true;
    card.innerHTML = `
      <summary>
        <span class="ari-manual-activity-summary__left">
          <span class="ari-manual-activity-kicker">COMPLETED ACTIVITY</span>
          <span id="ariManualActivitySummaryTitle" class="ari-manual-activity-title">Completed activity</span>
        </span>
        <span class="ari-manual-activity-summary__right">
          <span id="ariManualActivitySummaryCalories" class="ari-manual-activity-calories">0 kcal</span>
          <span class="ari-manual-activity-chevron" aria-hidden="true">⌄</span>
        </span>
      </summary>
      <div id="ariManualActivityList" class="ari-manual-activity-list"></div>
    `;

    const completed = $("todaysTrainingCompletedDay");
    const selectedSection = $("todaysTraining");
    if (completed?.parentElement) completed.insertAdjacentElement("afterend", card);
    else selectedSection?.append(card);
    return card;
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
            <h2 id="ariActivityDialogTitle">Quick Log</h2>
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
            <label for="ariActivityName">ACTIVITY / WORKOUT NAME</label>
            <input id="ariActivityName" name="activityName" autocomplete="off" placeholder="Run, push-ups, basketball…" required>
          </div>
          <div class="ari-activity-grid">
            <div class="ari-activity-field">
              <label for="ariActivityDuration">DURATION (MIN)</label>
              <input id="ariActivityDuration" name="durationMinutes" type="number" inputmode="numeric" min="1" max="1440" step="1" placeholder="20">
            </div>
            <div class="ari-activity-field">
              <label for="ariActivityIntensity">INTENSITY</label>
              <select id="ariActivityIntensity" name="intensity">
                <option value="light">Light</option>
                <option value="moderate" selected>Moderate</option>
                <option value="vigorous">Vigorous</option>
              </select>
            </div>
          </div>
          <div class="ari-activity-field">
            <label for="ariActivityAverageHr">AVERAGE HR (OPTIONAL)</label>
            <input id="ariActivityAverageHr" name="averageHeartRate" type="number" inputmode="numeric" min="30" max="240" step="1" placeholder="Use if known">
          </div>
          <div class="ari-activity-field">
            <label for="ariActivityCalories">CALORIES BURNED</label>
            <div class="ari-activity-calorie-wrap">
              <input id="ariActivityCalories" name="caloriesBurned" type="number" inputmode="numeric" min="1" max="10000" step="1" placeholder="Auto estimate">
              <button type="button" class="ari-activity-auto-button" id="ariActivityAutoCalories">AUTO</button>
            </div>
            <p id="ariActivityEstimateNote" class="ari-activity-estimate-note">Add an activity and duration for a profile-based estimate.</p>
          </div>
          <details class="ari-activity-more" id="ariActivityMoreDetails">
            <summary>More details</summary>
            <div class="ari-activity-more__body">
              <div id="ariActivityStrengthFields" class="ari-activity-grid" hidden>
                <div class="ari-activity-field">
                  <label for="ariActivitySets">SETS</label>
                  <input id="ariActivitySets" name="sets" type="number" inputmode="numeric" min="1" max="100" step="1" placeholder="4">
                </div>
                <div class="ari-activity-field">
                  <label for="ariActivityReps">REPS / SET</label>
                  <input id="ariActivityReps" name="repsPerSet" type="number" inputmode="numeric" min="1" max="10000" step="1" placeholder="12">
                </div>
              </div>
              <div class="ari-activity-field">
                <label for="ariActivityNotes">NOTES (OPTIONAL)</label>
                <textarea id="ariActivityNotes" name="notes" placeholder="Anything useful about the activity."></textarea>
              </div>
            </div>
          </details>
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
      ? "Estimated from your profile, duration, and average heart rate."
      : "Estimated from your Goals profile, activity, duration, and intensity.";
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
    $("ariActivityToast")?.remove();
    const toast = document.createElement("div");
    toast.id = "ariActivityToast";
    toast.className = "ari-activity-toast";
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function populateActivity(activity = null) {
    const form = $("ariActivityQuickLogForm");
    form?.reset();
    editingActivityId = activity?.id ? String(activity.id) : null;
    caloriesUserEdited = Boolean(activity);

    $("ariActivityDialogTitle").textContent = activity ? "Edit Activity" : "Quick Log";
    $("ariActivitySaveButton").textContent = activity ? "Save Changes" : "Save Activity";

    if (activity) {
      $("ariActivityName").value = activity.activity_name || "";
      $("ariActivityDuration").value = activity.duration_minutes ?? "";
      $("ariActivityIntensity").value = activity.intensity || "moderate";
      $("ariActivityAverageHr").value = activity.average_heart_rate ?? "";
      $("ariActivityCalories").value = activity.calories_burned ?? "";
      $("ariActivitySets").value = activity.sets ?? "";
      $("ariActivityReps").value = activity.reps_per_set ?? "";
      $("ariActivityNotes").value = activity.notes || "";
      const note = $("ariActivityEstimateNote");
      note.className = "ari-activity-estimate-note is-user";
      note.textContent = activity.calorie_source === "profile_estimate"
        ? "Using the saved estimate. Tap AUTO to recalculate."
        : "Using your saved calorie value. Tap AUTO to recalculate.";
    } else {
      const note = $("ariActivityEstimateNote");
      note.className = "ari-activity-estimate-note";
      note.textContent = "Add an activity and duration for a profile-based estimate.";
    }

    updateStrengthVisibility();
    const status = $("ariActivityStatus");
    status.className = "ari-activity-status";
    status.textContent = `${activity ? "Editing" : "Logging"} for ${selectedDate()}.`;
  }

  function openDialog(activity = null) {
    const dialog = ensureDialog();
    populateActivity(activity);
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
    editingActivityId = null;
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
    const wasEditing = Boolean(editingActivityId);
    if (button) {
      button.disabled = true;
      button.textContent = "Saving…";
    }
    if (status) {
      status.className = "ari-activity-status";
      status.textContent = "";
    }

    try {
      const service = await loadService();
      const input = formInput();
      if (!caloriesUserEdited) input.caloriesBurned = null;
      const result = wasEditing
        ? await service.updateActivity(editingActivityId, input, { source: "manual_quick_log", dateText: selectedDate() })
        : await service.logActivity(input, { source: "manual_quick_log", dateText: selectedDate() });

      if (!result?.success) throw new Error(result?.message || "Activity could not be saved.");
      closeDialog();
      await renderManualActivities({ open: true });
      showToast(`${result.activity.activity_name} ${wasEditing ? "updated" : "saved"} • ${Math.round(result.activity.calories_burned)} kcal`);
    } catch (error) {
      if (status) {
        status.className = "ari-activity-status is-error";
        status.textContent = error?.message || "Activity could not be saved.";
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = editingActivityId ? "Save Changes" : "Save Activity";
      }
    }
  }

  function activityMeta(activity) {
    const pieces = [];
    if (Number(activity?.duration_minutes) > 0) pieces.push(`${Math.round(Number(activity.duration_minutes))} min`);
    if (activity?.intensity) pieces.push(titleCase(activity.intensity));
    if (Number(activity?.average_heart_rate) > 0) pieces.push(`${Math.round(Number(activity.average_heart_rate))} bpm`);
    if (Number(activity?.sets) > 0) {
      const reps = Number(activity?.reps_per_set) > 0 ? ` × ${Math.round(Number(activity.reps_per_set))}` : "";
      pieces.push(`${Math.round(Number(activity.sets))} sets${reps}`);
    }
    return pieces.join(" • ") || "Completed activity";
  }

  async function renderManualActivities({ open = null } = {}) {
    const card = ensureActivitySection();
    const list = $("ariManualActivityList");
    if (!card || !list) return;

    const date = selectedDate();
    lastRenderedDate = date;
    const service = await loadService();
    const activities = await service.listActivities(date);

    if (date !== selectedDate()) return;
    if (!activities.length) {
      card.hidden = true;
      list.replaceChildren();
      revealedActivityDates.delete(date);
      return;
    }

    const total = activities.reduce((sum, item) => sum + Math.max(Number(item?.calories_burned) || 0, 0), 0);
    $("ariManualActivitySummaryTitle").textContent = activities.length === 1
      ? (activities[0]?.activity_name || "Completed activity")
      : `${activities.length} completed activities`;
    $("ariManualActivitySummaryCalories").textContent = `${Math.round(total).toLocaleString()} kcal`;

    list.innerHTML = activities.map((activity) => `
      <article class="ari-manual-activity-item" data-activity-id="${escapeHtml(activity.id)}">
        <div>
          <p class="ari-manual-activity-item__name">${escapeHtml(activity.activity_name || "Activity")}</p>
          <p class="ari-manual-activity-item__meta">${escapeHtml(activityMeta(activity))}</p>
        </div>
        <div class="ari-manual-activity-item__side">
          <strong class="ari-manual-activity-item__kcal">${Math.round(Number(activity.calories_burned) || 0)} kcal</strong>
          <div class="ari-manual-activity-actions">
            <button type="button" class="ari-manual-activity-action" data-action="edit" data-activity-id="${escapeHtml(activity.id)}">Edit</button>
            <button type="button" class="ari-manual-activity-action" data-action="delete" data-activity-id="${escapeHtml(activity.id)}">Delete</button>
          </div>
        </div>
      </article>
    `).join("");

    card.hidden = false;
    if (open === true) {
      card.open = true;
      revealedActivityDates.add(date);
    } else if (open === false) {
      card.open = false;
      revealedActivityDates.add(date);
    } else if (!revealedActivityDates.has(date)) {
      card.open = true;
      revealedActivityDates.add(date);
    }
    card.dataset.activityJson = JSON.stringify(activities);
  }

  function cachedActivities() {
    try {
      return JSON.parse($("ariManualActivityCard")?.dataset.activityJson || "[]");
    } catch {
      return [];
    }
  }

  async function handleManualActivityAction(event) {
    const button = event.target.closest("[data-action][data-activity-id]");
    if (!button) return;
    const id = String(button.dataset.activityId || "");
    const activity = cachedActivities().find((item) => String(item.id) === id);
    if (!activity) return;

    if (button.dataset.action === "edit") {
      openDialog(activity);
      return;
    }

    if (button.dataset.action === "delete") {
      const okay = window.confirm(`Delete ${activity.activity_name || "this activity"}?`);
      if (!okay) return;
      button.disabled = true;
      try {
        const service = await loadService();
        const result = await service.deleteActivity(id);
        if (!result?.success) throw new Error(result?.message || "Activity could not be deleted.");
        await renderManualActivities();
        showToast("Activity deleted");
      } catch (error) {
        button.disabled = false;
        showToast(error?.message || "Activity could not be deleted.");
      }
    }
  }

  function bind() {
    ensureStyles();
    ensureButton();
    ensureActivitySection();
    const dialog = ensureDialog();

    $("ariTrainingQuickLogButton")?.addEventListener("click", () => openDialog());
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

    $("ariManualActivityList")?.addEventListener("click", handleManualActivityAction);

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-date],#trainingTodayShortcut")) {
        window.setTimeout(() => void renderManualActivities(), 40);
      }
    });
    window.addEventListener("ari:activityChanged", () => void renderManualActivities());
    window.addEventListener("ari:activityLogged", () => void renderManualActivities({ open: true }));
    window.addEventListener("focus", () => {
      const date = selectedDate();
      if (date !== lastRenderedDate) void renderManualActivities();
    });

    window.AriTrainingQuickLog = Object.freeze({
      version: VERSION,
      open: openDialog,
      refresh: renderManualActivities
    });

    void renderManualActivities();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();