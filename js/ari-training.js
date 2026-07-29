// js/ari-training.js
// ARI Training
//
// Purpose:
// Own the browser-side workout logging experience for ari-training.html.
//
// V1.0.0 — Local Workout Runtime
//
// Responsibilities:
// - Load, normalize, validate, create, edit, and delete workout entries.
// - Calculate workout duration from start and end times.
// - Render today's performance, today's timeline, weekly output, and history.
// - Publish today's burned-calorie total for the Goals page.
// - Read the current daily calorie goal and consumed-calorie total.
// - Preserve workout records in localStorage.
// - Expose a small public API for future integrations.
//
// Non-responsibilities:
// - Does not connect to Apple Health, Fitbit, Garmin, GPS, or pedometers.
// - Does not diagnose health conditions or judge workout quality.
// - Does not treat heart rate as a required field.
// - Does not estimate calories automatically in Version 1.
// - Does not sync to Supabase in Version 1.

(() => {
  "use strict";

  const VERSION = "1.0.0";

  const STORAGE_KEYS = Object.freeze({
    workoutEntries: "calbuddyExerciseEntries",
    legacyBurnedCalories: "calbuddyCaloriesBurned",
    dailyCalorieGoal: "calbuddyDailyCalorieGoal",
    caloriesConsumed: "calbuddyCaloriesConsumed"
  });

  const EVENT_NAMES = Object.freeze({
    workoutsChanged: "ari:training-workouts-changed",
    caloriesBurnedChanged: "ari:calories-burned-changed"
  });

  const WORKOUT_TYPES = Object.freeze({
    strength: "Strength Training",
    running: "Running",
    walking: "Walking",
    "cardio-machine": "Cardio Machine",
    cycling: "Cycling",
    swimming: "Swimming",
    sports: "Sports",
    mobility: "Yoga / Pilates / Mobility",
    custom: "Custom Workout"
  });

  const DEFAULT_WORKOUT_NAMES = Object.freeze({
    strength: "Strength Training",
    running: "Run",
    walking: "Walk",
    "cardio-machine": "Cardio Session",
    cycling: "Cycling",
    swimming: "Swimming",
    sports: "Sports",
    mobility: "Mobility Session",
    custom: ""
  });

  const WEEKDAY_IDS = Object.freeze([
    "weeklyMondayValue",
    "weeklyTuesdayValue",
    "weeklyWednesdayValue",
    "weeklyThursdayValue",
    "weeklyFridayValue",
    "weeklySaturdayValue",
    "weeklySundayValue"
  ]);

  const state = {
    initialized: false,
    entries: [],
    pendingDeleteId: null,
    activeDialogMode: "create",
    lastFocusedElement: null
  };

  const elements = {};

  /* =====================================================
     PUBLIC RUNTIME
  ===================================================== */

  const AriTrainingRuntime = {
    version: VERSION,

    initialize,
    refresh,
    getWorkoutEntries,
    getTodayEntries,
    getTodayBurnedCalories,
    getTodayWorkoutMinutes,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    openWorkoutDialog,
    closeWorkoutDialog
  };

  window.Ari = window.Ari || {};
  window.Ari.Training = AriTrainingRuntime;
  window.AriTrainingRuntime = AriTrainingRuntime;

  /* =====================================================
     INITIALIZATION
  ===================================================== */

  function initialize() {
    if (state.initialized) {
      refresh();
      return;
    }

    cacheElements();

    if (!elements.workoutForm || !elements.workoutDialog) {
      console.error(
        "[ARI Training] Required HTML elements are missing. " +
        "Confirm ari-training.html matches ari-training.js."
      );
      return;
    }

    state.entries = loadWorkoutEntries();
    bindEvents();
    setCurrentDateDisplay();
    setDefaultWorkoutDate();
    renderAll();

    state.initialized = true;

    console.info(`[ARI Training] Runtime initialized. Version ${VERSION}.`);
  }

  function cacheElements() {
    const ids = [
      "trainingMenuButton",
      "trainingMenu",
      "trainingCurrentDate",
      "trainingCaloriesBurned",
      "trainingWorkoutTime",
      "trainingWorkoutCount",
      "trainingCaloriesLeft",
      "openGenericWorkoutButton",
      "todayWorkoutList",
      "todayWorkoutEmptyState",
      "emptyStateLogWorkoutButton",
      "weeklyDateRange",
      "weeklyCaloriesBurned",
      "weeklyWorkoutTime",
      "weeklyWorkoutCount",
      "weeklyPerformanceChart",
      "weeklyActivityLabel",
      "workoutHistoryList",
      "workoutHistoryEmptyState",
      "workoutDialog",
      "workoutDialogTitle",
      "closeWorkoutDialogButton",
      "workoutForm",
      "workoutEntryId",
      "workoutType",
      "workoutName",
      "workoutDate",
      "workoutDuration",
      "workoutStartTime",
      "workoutEndTime",
      "workoutAverageHeartRate",
      "workoutCaloriesBurned",
      "workoutNotes",
      "workoutNotesCount",
      "workoutFormMessage",
      "cancelWorkoutButton",
      "deleteWorkoutDialog",
      "cancelDeleteWorkoutButton",
      "confirmDeleteWorkoutButton",
      "workoutEntryTemplate",
      "historyDayTemplate"
    ];

    for (const id of ids) {
      elements[id] = document.getElementById(id);
    }

    elements.categoryButtons = Array.from(
      document.querySelectorAll("[data-workout-type]")
    );

    elements.weeklyValueElements = WEEKDAY_IDS.map((id) =>
      document.getElementById(id)
    );
  }

  function bindEvents() {
    elements.trainingMenuButton?.addEventListener(
      "click",
      toggleTrainingMenu
    );

    elements.trainingMenu?.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeTrainingMenu();
      }
    });

    for (const button of elements.categoryButtons) {
      button.addEventListener("click", () => {
        openWorkoutDialog(button.dataset.workoutType || "");
      });
    }

    elements.openGenericWorkoutButton?.addEventListener("click", () => {
      openWorkoutDialog("");
    });

    elements.emptyStateLogWorkoutButton?.addEventListener("click", () => {
      scrollToWorkoutCategories();
    });

    elements.closeWorkoutDialogButton?.addEventListener(
      "click",
      closeWorkoutDialog
    );

    elements.cancelWorkoutButton?.addEventListener(
      "click",
      closeWorkoutDialog
    );

    elements.workoutForm.addEventListener("submit", handleWorkoutSubmit);

    elements.workoutType?.addEventListener(
      "change",
      handleWorkoutTypeChange
    );

    elements.workoutStartTime?.addEventListener(
      "input",
      updateDurationOutput
    );

    elements.workoutEndTime?.addEventListener(
      "input",
      updateDurationOutput
    );

    elements.workoutNotes?.addEventListener(
      "input",
      updateNotesCount
    );

    elements.todayWorkoutList?.addEventListener(
      "click",
      handleWorkoutEntryAction
    );

    elements.workoutHistoryList?.addEventListener(
      "click",
      handleWorkoutEntryAction
    );

    elements.cancelDeleteWorkoutButton?.addEventListener(
      "click",
      closeDeleteDialog
    );

    elements.confirmDeleteWorkoutButton?.addEventListener(
      "click",
      confirmPendingDelete
    );

    elements.workoutDialog.addEventListener("click", (event) => {
      if (event.target === elements.workoutDialog) {
        closeWorkoutDialog();
      }
    });

    elements.deleteWorkoutDialog?.addEventListener("click", (event) => {
      if (event.target === elements.deleteWorkoutDialog) {
        closeDeleteDialog();
      }
    });

    elements.workoutDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeWorkoutDialog();
    });

    elements.deleteWorkoutDialog?.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDeleteDialog();
    });

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", refresh);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refresh();
      }
    });
  }

  /* =====================================================
     STORAGE
  ===================================================== */

  function loadWorkoutEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.workoutEntries);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        console.warn(
          "[ARI Training] Stored workout data was not an array and was ignored."
        );
        return [];
      }

      return parsed
        .map(normalizeWorkoutEntry)
        .filter(Boolean)
        .sort(sortEntriesNewestFirst);
    } catch (error) {
      console.error("[ARI Training] Unable to read workout entries.", error);
      return [];
    }
  }

  function saveWorkoutEntries() {
    state.entries.sort(sortEntriesNewestFirst);

    try {
      localStorage.setItem(
        STORAGE_KEYS.workoutEntries,
        JSON.stringify(state.entries)
      );
    } catch (error) {
      console.error("[ARI Training] Unable to save workout entries.", error);
      showFormMessage(
        "Your workout could not be saved on this device.",
        "error"
      );
      return false;
    }

    publishWorkoutTotals();
    return true;
  }

  function publishWorkoutTotals() {
    const burnedToday = getTodayBurnedCalories();

    try {
      localStorage.setItem(
        STORAGE_KEYS.legacyBurnedCalories,
        String(burnedToday)
      );
    } catch (error) {
      console.warn(
        "[ARI Training] Unable to publish today's burned-calorie total.",
        error
      );
    }

    const detail = {
      source: "ari-training",
      version: VERSION,
      localDate: getLocalDateKey(),
      caloriesBurned: burnedToday,
      workoutMinutes: getTodayWorkoutMinutes(),
      workoutCount: getTodayEntries().length
    };

    window.dispatchEvent(
      new CustomEvent(EVENT_NAMES.workoutsChanged, { detail })
    );

    window.dispatchEvent(
      new CustomEvent(EVENT_NAMES.caloriesBurnedChanged, { detail })
    );
  }

  function handleStorageChange(event) {
    const relevantKeys = new Set(Object.values(STORAGE_KEYS));

    if (event.key && !relevantKeys.has(event.key)) {
      return;
    }

    refresh();
  }

  /* =====================================================
     WORKOUT CRUD
  ===================================================== */

  function createWorkout(workoutInput) {
    const normalized = normalizeWorkoutEntry({
      ...workoutInput,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual"
    });

    if (!normalized) {
      throw new Error("Workout entry could not be normalized.");
    }

    state.entries.push(normalized);

    if (!saveWorkoutEntries()) {
      state.entries = state.entries.filter(
        (entry) => entry.id !== normalized.id
      );
      return null;
    }

    renderAll();
    return cloneEntry(normalized);
  }

  function updateWorkout(entryId, workoutInput) {
    const index = state.entries.findIndex(
      (entry) => entry.id === entryId
    );

    if (index < 0) {
      return null;
    }

    const current = state.entries[index];

    const normalized = normalizeWorkoutEntry({
      ...current,
      ...workoutInput,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString()
    });

    if (!normalized) {
      throw new Error("Workout entry could not be normalized.");
    }

    state.entries[index] = normalized;

    if (!saveWorkoutEntries()) {
      state.entries[index] = current;
      return null;
    }

    renderAll();
    return cloneEntry(normalized);
  }

  function deleteWorkout(entryId) {
    const index = state.entries.findIndex(
      (entry) => entry.id === entryId
    );

    if (index < 0) {
      return false;
    }

    const [removed] = state.entries.splice(index, 1);

    if (!saveWorkoutEntries()) {
      state.entries.splice(index, 0, removed);
      return false;
    }

    renderAll();
    return true;
  }

  function getWorkoutEntries() {
    return state.entries.map(cloneEntry);
  }

  function getTodayEntries(referenceDate = new Date()) {
    const todayKey = getLocalDateKey(referenceDate);

    return state.entries
      .filter((entry) => entry.localDate === todayKey)
      .sort(sortEntriesNewestFirst)
      .map(cloneEntry);
  }

  function getTodayBurnedCalories(referenceDate = new Date()) {
    return sum(
      getTodayEntries(referenceDate),
      (entry) => entry.caloriesBurned
    );
  }

  function getTodayWorkoutMinutes(referenceDate = new Date()) {
    return sum(
      getTodayEntries(referenceDate),
      (entry) => entry.durationMinutes
    );
  }

  /* =====================================================
     FORM AND DIALOG
  ===================================================== */

  function openWorkoutDialog(workoutType = "", entryId = null) {
    state.lastFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    resetWorkoutForm();
    hideFormMessage();

    if (entryId) {
      const entry = state.entries.find((item) => item.id === entryId);

      if (!entry) {
        return;
      }

      state.activeDialogMode = "edit";
      populateWorkoutForm(entry);
      elements.workoutDialogTitle.textContent = "Edit Workout";
    } else {
      state.activeDialogMode = "create";
      elements.workoutDialogTitle.textContent = workoutType
        ? `Log ${getWorkoutTypeLabel(workoutType)}`
        : "Log Workout";

      elements.workoutType.value = workoutType;

      if (workoutType) {
        elements.workoutName.value =
          DEFAULT_WORKOUT_NAMES[workoutType] || "";
      }

      setDefaultWorkoutDate();
      setDefaultWorkoutTimes();
      updateDurationOutput();
    }

    if (typeof elements.workoutDialog.showModal === "function") {
      elements.workoutDialog.showModal();
    } else {
      elements.workoutDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => {
      if (workoutType && elements.workoutName) {
        elements.workoutName.focus();
        elements.workoutName.select();
      } else {
        elements.workoutType?.focus();
      }
    });
  }

  function closeWorkoutDialog() {
    hideFormMessage();

    if (elements.workoutDialog.open) {
      elements.workoutDialog.close();
    } else {
      elements.workoutDialog.removeAttribute("open");
    }

    resetWorkoutForm();

    if (state.lastFocusedElement?.isConnected) {
      state.lastFocusedElement.focus();
    }

    state.lastFocusedElement = null;
  }

  function resetWorkoutForm() {
    elements.workoutForm.reset();
    elements.workoutEntryId.value = "";
    elements.workoutDuration.textContent = "—";
    elements.workoutNotesCount.textContent = "0";
    state.activeDialogMode = "create";
    setDefaultWorkoutDate();
  }

  function populateWorkoutForm(entry) {
    elements.workoutEntryId.value = entry.id;
    elements.workoutType.value = entry.workoutType;
    elements.workoutName.value = entry.workoutName;
    elements.workoutDate.value = entry.localDate;
    elements.workoutStartTime.value = entry.startTime;
    elements.workoutEndTime.value = entry.endTime;
    elements.workoutAverageHeartRate.value =
      entry.averageHeartRate ?? "";
    elements.workoutCaloriesBurned.value = entry.caloriesBurned;
    elements.workoutNotes.value = entry.notes || "";

    updateDurationOutput();
    updateNotesCount();
  }

  function handleWorkoutTypeChange() {
    const type = elements.workoutType.value;
    const currentName = elements.workoutName.value.trim();
    const knownDefaultNames = new Set(
      Object.values(DEFAULT_WORKOUT_NAMES).filter(Boolean)
    );

    if (!currentName || knownDefaultNames.has(currentName)) {
      elements.workoutName.value =
        DEFAULT_WORKOUT_NAMES[type] || "";
    }

    elements.workoutDialogTitle.textContent =
      state.activeDialogMode === "edit"
        ? "Edit Workout"
        : type
          ? `Log ${getWorkoutTypeLabel(type)}`
          : "Log Workout";
  }

  function handleWorkoutSubmit(event) {
    event.preventDefault();
    hideFormMessage();

    const formResult = readAndValidateWorkoutForm();

    if (!formResult.ok) {
      showFormMessage(formResult.message, "error");
      formResult.field?.focus();
      return;
    }

    let savedEntry;

    if (state.activeDialogMode === "edit") {
      savedEntry = updateWorkout(
        elements.workoutEntryId.value,
        formResult.value
      );
    } else {
      savedEntry = createWorkout(formResult.value);
    }

    if (!savedEntry) {
      return;
    }

    closeWorkoutDialog();
    scrollToTodayTraining();
  }

  function readAndValidateWorkoutForm() {
    const workoutType = elements.workoutType.value.trim();
    const workoutName = elements.workoutName.value.trim();
    const localDate = elements.workoutDate.value;
    const startTime = elements.workoutStartTime.value;
    const endTime = elements.workoutEndTime.value;
    const averageHeartRate = parseOptionalInteger(
      elements.workoutAverageHeartRate.value
    );
    const caloriesBurned = parseInteger(
      elements.workoutCaloriesBurned.value
    );
    const notes = elements.workoutNotes.value.trim();

    if (!WORKOUT_TYPES[workoutType]) {
      return invalid(
        "Select a workout type.",
        elements.workoutType
      );
    }

    if (!workoutName) {
      return invalid(
        "Enter a name for this workout.",
        elements.workoutName
      );
    }

    if (workoutName.length > 80) {
      return invalid(
        "Workout names must be 80 characters or fewer.",
        elements.workoutName
      );
    }

    if (!isValidDateKey(localDate)) {
      return invalid(
        "Choose a valid workout date.",
        elements.workoutDate
      );
    }

    if (!isValidTimeValue(startTime)) {
      return invalid(
        "Enter a valid start time.",
        elements.workoutStartTime
      );
    }

    if (!isValidTimeValue(endTime)) {
      return invalid(
        "Enter a valid end time.",
        elements.workoutEndTime
      );
    }

    const durationMinutes = calculateDurationMinutes(
      startTime,
      endTime
    );

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return invalid(
        "The workout duration must be greater than zero.",
        elements.workoutEndTime
      );
    }

    if (durationMinutes > 24 * 60) {
      return invalid(
        "A workout cannot be longer than 24 hours.",
        elements.workoutEndTime
      );
    }

    if (
      averageHeartRate !== null &&
      (averageHeartRate < 30 || averageHeartRate > 240)
    ) {
      return invalid(
        "Average heart rate must be between 30 and 240 bpm.",
        elements.workoutAverageHeartRate
      );
    }

    if (
      !Number.isFinite(caloriesBurned) ||
      caloriesBurned < 1 ||
      caloriesBurned > 10000
    ) {
      return invalid(
        "Calories burned must be between 1 and 10,000 kcal.",
        elements.workoutCaloriesBurned
      );
    }

    if (notes.length > 500) {
      return invalid(
        "Workout notes must be 500 characters or fewer.",
        elements.workoutNotes
      );
    }

    const dateTimes = buildWorkoutDateTimes({
      localDate,
      startTime,
      endTime
    });

    return {
      ok: true,
      value: {
        workoutType,
        workoutName,
        localDate,
        startTime,
        endTime,
        startedAt: dateTimes.startedAt,
        endedAt: dateTimes.endedAt,
        durationMinutes,
        averageHeartRate,
        caloriesBurned,
        notes,
        calorieSource: "manual"
      }
    };
  }

  function invalid(message, field) {
    return {
      ok: false,
      message,
      field
    };
  }

  function updateDurationOutput() {
    const startTime = elements.workoutStartTime.value;
    const endTime = elements.workoutEndTime.value;

    if (!startTime || !endTime) {
      elements.workoutDuration.textContent = "—";
      return;
    }

    const durationMinutes = calculateDurationMinutes(
      startTime,
      endTime
    );

    elements.workoutDuration.textContent =
      durationMinutes > 0
        ? formatDuration(durationMinutes)
        : "—";
  }

  function updateNotesCount() {
    elements.workoutNotesCount.textContent = String(
      elements.workoutNotes.value.length
    );
  }

  function setDefaultWorkoutDate() {
    if (elements.workoutDate && !elements.workoutDate.value) {
      elements.workoutDate.value = getLocalDateKey();
    }
  }

  function setDefaultWorkoutTimes() {
    const now = new Date();
    const roundedEnd = roundDateToNearestMinutes(now, 5);
    const roundedStart = new Date(
      roundedEnd.getTime() - 60 * 60 * 1000
    );

    elements.workoutStartTime.value = formatTimeInput(roundedStart);
    elements.workoutEndTime.value = formatTimeInput(roundedEnd);
  }

  function showFormMessage(message, type = "info") {
    elements.workoutFormMessage.textContent = message;
    elements.workoutFormMessage.dataset.type = type;
    elements.workoutFormMessage.hidden = false;
  }

  function hideFormMessage() {
    elements.workoutFormMessage.textContent = "";
    delete elements.workoutFormMessage.dataset.type;
    elements.workoutFormMessage.hidden = true;
  }

  /* =====================================================
     DELETE CONFIRMATION
  ===================================================== */

  function requestDeleteWorkout(entryId) {
    const entry = state.entries.find((item) => item.id === entryId);

    if (!entry) {
      return;
    }

    state.pendingDeleteId = entryId;

    const title = document.getElementById("deleteWorkoutDialogTitle");

    if (title) {
      title.textContent = `Delete ${entry.workoutName}?`;
    }

    if (typeof elements.deleteWorkoutDialog.showModal === "function") {
      elements.deleteWorkoutDialog.showModal();
    } else {
      elements.deleteWorkoutDialog.setAttribute("open", "");
    }

    elements.cancelDeleteWorkoutButton?.focus();
  }

  function confirmPendingDelete() {
    if (!state.pendingDeleteId) {
      closeDeleteDialog();
      return;
    }

    deleteWorkout(state.pendingDeleteId);
    closeDeleteDialog();
  }

  function closeDeleteDialog() {
    state.pendingDeleteId = null;

    if (elements.deleteWorkoutDialog?.open) {
      elements.deleteWorkoutDialog.close();
    } else {
      elements.deleteWorkoutDialog?.removeAttribute("open");
    }
  }

  /* =====================================================
     RENDERING
  ===================================================== */

  function refresh() {
    state.entries = loadWorkoutEntries();
    setCurrentDateDisplay();
    renderAll();
  }

  function renderAll() {
    renderTodayPerformance();
    renderTodayWorkoutList();
    renderWeeklyPerformance();
    renderWorkoutHistory();
    publishWorkoutTotals();
  }

  function renderTodayPerformance() {
    const todayEntries = getTodayEntries();
    const caloriesBurned = sum(
      todayEntries,
      (entry) => entry.caloriesBurned
    );
    const workoutMinutes = sum(
      todayEntries,
      (entry) => entry.durationMinutes
    );

    elements.trainingCaloriesBurned.textContent =
      formatNumber(caloriesBurned);
    elements.trainingWorkoutTime.textContent =
      formatDuration(workoutMinutes);
    elements.trainingWorkoutCount.textContent =
      String(todayEntries.length);

    const caloriesLeft = calculateCaloriesLeft(caloriesBurned);

    elements.trainingCaloriesLeft.textContent =
      caloriesLeft === null
        ? "—"
        : formatNumber(Math.max(caloriesLeft, 0));

    const card = elements.trainingCaloriesLeft.closest(
      ".ari-performance-card"
    );

    if (card) {
      card.dataset.status =
        caloriesLeft === null
          ? "unknown"
          : caloriesLeft < 0
            ? "over"
            : "available";
    }
  }

  function renderTodayWorkoutList() {
    const todayEntries = getTodayEntries();

    elements.todayWorkoutList.replaceChildren();

    for (const entry of todayEntries) {
      elements.todayWorkoutList.appendChild(
        createWorkoutEntryElement(entry)
      );
    }

    const hasEntries = todayEntries.length > 0;
    elements.todayWorkoutEmptyState.hidden = hasEntries;
    elements.todayWorkoutList.hidden = !hasEntries;
  }

  function createWorkoutEntryElement(entry) {
    const template = elements.workoutEntryTemplate;

    if (!template?.content) {
      return createFallbackWorkoutEntry(entry);
    }

    const fragment = template.content.cloneNode(true);
    const article = fragment.querySelector(".ari-training-entry");

    article.dataset.workoutId = entry.id;

    setText(
      article,
      ".ari-training-entry__type",
      getWorkoutTypeLabel(entry.workoutType)
    );
    setText(
      article,
      ".ari-training-entry__name",
      entry.workoutName
    );
    setText(
      article,
      ".ari-training-entry__calories",
      `${formatNumber(entry.caloriesBurned)} kcal`
    );
    setText(
      article,
      ".ari-training-entry__time",
      formatWorkoutTimeRange(entry)
    );
    setText(
      article,
      ".ari-training-entry__duration",
      formatDuration(entry.durationMinutes)
    );

    const heartRateGroup = article.querySelector(
      ".ari-training-entry__heart-rate-group"
    );

    if (entry.averageHeartRate === null) {
      heartRateGroup?.setAttribute("hidden", "");
    } else {
      heartRateGroup?.removeAttribute("hidden");
      setText(
        article,
        ".ari-training-entry__heart-rate",
        `${entry.averageHeartRate} bpm`
      );
    }

    const notes = article.querySelector(
      ".ari-training-entry__notes"
    );

    if (notes && entry.notes) {
      notes.textContent = entry.notes;
      notes.hidden = false;
    }

    const editButton = article.querySelector(
      ".ari-entry-action--edit"
    );
    const deleteButton = article.querySelector(
      ".ari-entry-action--delete"
    );

    if (editButton) {
      editButton.dataset.action = "edit";
      editButton.dataset.workoutId = entry.id;
      editButton.setAttribute(
        "aria-label",
        `Edit ${entry.workoutName}`
      );
    }

    if (deleteButton) {
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.workoutId = entry.id;
      deleteButton.setAttribute(
        "aria-label",
        `Delete ${entry.workoutName}`
      );
    }

    return fragment;
  }

  function createFallbackWorkoutEntry(entry) {
    const article = document.createElement("article");
    article.className = "ari-training-entry";
    article.dataset.workoutId = entry.id;

    const content = document.createElement("div");
    content.className = "ari-training-entry__content";

    const title = document.createElement("h3");
    title.textContent = entry.workoutName;

    const summary = document.createElement("p");
    summary.textContent =
      `${getWorkoutTypeLabel(entry.workoutType)} • ` +
      `${formatWorkoutTimeRange(entry)} • ` +
      `${formatDuration(entry.durationMinutes)} • ` +
      `${formatNumber(entry.caloriesBurned)} kcal`;

    const actions = document.createElement("div");
    actions.className = "ari-training-entry__actions";

    actions.append(
      createEntryActionButton("edit", entry),
      createEntryActionButton("delete", entry)
    );

    content.append(title, summary, actions);
    article.append(content);

    return article;
  }

  function renderWeeklyPerformance() {
    const week = getCurrentWeekRange();
    const weeklyEntries = state.entries.filter((entry) =>
      isDateKeyWithinRange(entry.localDate, week.startKey, week.endKey)
    );

    const calories = sum(
      weeklyEntries,
      (entry) => entry.caloriesBurned
    );
    const minutes = sum(
      weeklyEntries,
      (entry) => entry.durationMinutes
    );

    elements.weeklyDateRange.textContent = formatWeekRange(week);
    elements.weeklyCaloriesBurned.textContent =
      `${formatNumber(calories)} kcal`;
    elements.weeklyWorkoutTime.textContent =
      formatDuration(minutes);
    elements.weeklyWorkoutCount.textContent =
      String(weeklyEntries.length);

    const dayTotals = Array(7).fill(0);

    for (const entry of weeklyEntries) {
      const dayIndex = getMondayBasedDayIndex(entry.localDate);

      if (dayIndex >= 0 && dayIndex < 7) {
        dayTotals[dayIndex] += entry.durationMinutes;
      }
    }

    const maxMinutes = Math.max(...dayTotals, 1);
    const chartDays = Array.from(
      elements.weeklyPerformanceChart.querySelectorAll(
        ".ari-weekly-chart__day"
      )
    );

    chartDays.forEach((dayElement, index) => {
      const minutesForDay = dayTotals[index];
      const percentage =
        minutesForDay > 0
          ? Math.max((minutesForDay / maxMinutes) * 100, 8)
          : 0;
      const bar = dayElement.querySelector(
        ".ari-weekly-chart__bar"
      );

      bar?.style.setProperty(
        "--bar-level",
        `${percentage.toFixed(1)}%`
      );

      dayElement.dataset.minutes = String(minutesForDay);
      dayElement.setAttribute(
        "aria-label",
        `${dayElement.dataset.weekday}: ${formatDuration(minutesForDay)}`
      );

      if (elements.weeklyValueElements[index]) {
        elements.weeklyValueElements[index].textContent =
          formatDuration(minutesForDay);
      }
    });

    elements.weeklyActivityLabel.textContent =
      getWeeklyActivityLabel(minutes);
  }

  function renderWorkoutHistory() {
    const groups = groupEntriesByDate(state.entries);

    elements.workoutHistoryList.replaceChildren();

    for (const group of groups) {
      elements.workoutHistoryList.appendChild(
        createHistoryDayElement(group)
      );
    }

    const hasHistory = groups.length > 0;
    elements.workoutHistoryEmptyState.hidden = hasHistory;
    elements.workoutHistoryList.hidden = !hasHistory;
  }

  function createHistoryDayElement(group) {
    const template = elements.historyDayTemplate;

    if (!template?.content) {
      return createFallbackHistoryDay(group);
    }

    const fragment = template.content.cloneNode(true);
    const details = fragment.querySelector(".ari-history-day");

    details.dataset.localDate = group.localDate;

    setText(
      details,
      ".ari-history-day__label",
      getRelativeDateLabel(group.localDate)
    );
    setText(
      details,
      ".ari-history-day__date",
      formatDateKey(group.localDate, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    );
    setText(
      details,
      ".ari-history-day__sessions",
      `${group.entries.length} ${pluralize(
        group.entries.length,
        "workout",
        "workouts"
      )}`
    );
    setText(
      details,
      ".ari-history-day__calories",
      `${formatNumber(
        sum(group.entries, (entry) => entry.caloriesBurned)
      )} kcal`
    );

    if (group.localDate === getLocalDateKey()) {
      details.open = true;
    }

    const entriesContainer = details.querySelector(
      ".ari-history-day__entries"
    );

    for (const entry of group.entries) {
      entriesContainer.appendChild(
        createWorkoutEntryElement(entry)
      );
    }

    return fragment;
  }

  function createFallbackHistoryDay(group) {
    const details = document.createElement("details");
    details.className = "ari-history-day";
    details.dataset.localDate = group.localDate;

    const summary = document.createElement("summary");
    summary.textContent =
      `${getRelativeDateLabel(group.localDate)} — ` +
      `${group.entries.length} ${pluralize(
        group.entries.length,
        "workout",
        "workouts"
      )}`;

    const container = document.createElement("div");

    for (const entry of group.entries) {
      container.appendChild(createWorkoutEntryElement(entry));
    }

    details.append(summary, container);
    return details;
  }

  function handleWorkoutEntryAction(event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const entryId = button.dataset.workoutId;
    const action = button.dataset.action;

    if (!entryId) {
      return;
    }

    if (action === "edit") {
      const entry = state.entries.find((item) => item.id === entryId);

      if (entry) {
        openWorkoutDialog(entry.workoutType, entryId);
      }
    }

    if (action === "delete") {
      requestDeleteWorkout(entryId);
    }
  }

  /* =====================================================
     GOALS INTEGRATION
  ===================================================== */

  function calculateCaloriesLeft(caloriesBurnedToday) {
    const goal = parseStoredNumber(
      localStorage.getItem(STORAGE_KEYS.dailyCalorieGoal)
    );
    const consumed = parseStoredNumber(
      localStorage.getItem(STORAGE_KEYS.caloriesConsumed)
    );

    if (goal === null) {
      return null;
    }

    return Math.round(
      goal + caloriesBurnedToday - (consumed ?? 0)
    );
  }

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  function normalizeWorkoutEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== "object") {
      return null;
    }

    const workoutType = normalizeWorkoutType(
      rawEntry.workoutType ?? rawEntry.type
    );
    const localDate =
      normalizeDateKey(
        rawEntry.localDate ??
        rawEntry.date ??
        rawEntry.workoutDate
      ) || inferDateKeyFromTimestamp(rawEntry.startedAt);
    const startTime =
      normalizeTimeValue(
        rawEntry.startTime ??
        extractLocalTime(rawEntry.startedAt)
      );
    const endTime =
      normalizeTimeValue(
        rawEntry.endTime ??
        extractLocalTime(rawEntry.endedAt)
      );

    if (!workoutType || !localDate || !startTime || !endTime) {
      return null;
    }

    const durationMinutes =
      positiveIntegerOrNull(rawEntry.durationMinutes) ??
      calculateDurationMinutes(startTime, endTime);

    const caloriesBurned = positiveIntegerOrNull(
      rawEntry.caloriesBurned ??
      rawEntry.calories ??
      rawEntry.activeCalories
    );

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0 ||
      !Number.isFinite(caloriesBurned) ||
      caloriesBurned <= 0
    ) {
      return null;
    }

    const dateTimes = buildWorkoutDateTimes({
      localDate,
      startTime,
      endTime
    });

    const workoutName =
      normalizeText(
        rawEntry.workoutName ??
        rawEntry.name ??
        DEFAULT_WORKOUT_NAMES[workoutType] ??
        WORKOUT_TYPES[workoutType]
      ).slice(0, 80) || WORKOUT_TYPES[workoutType];

    const averageHeartRate = normalizeHeartRate(
      rawEntry.averageHeartRate ??
      rawEntry.heartRate
    );

    return {
      id: normalizeId(rawEntry.id) || generateId(),
      workoutType,
      workoutName,
      localDate,
      startTime,
      endTime,
      startedAt:
        normalizeIsoTimestamp(rawEntry.startedAt) ||
        dateTimes.startedAt,
      endedAt:
        normalizeIsoTimestamp(rawEntry.endedAt) ||
        dateTimes.endedAt,
      durationMinutes: Math.round(durationMinutes),
      averageHeartRate,
      caloriesBurned: Math.round(caloriesBurned),
      calorieSource: normalizeText(
        rawEntry.calorieSource || "manual"
      ).slice(0, 40),
      notes: normalizeText(rawEntry.notes).slice(0, 500),
      source: normalizeText(rawEntry.source || "manual").slice(0, 40),
      createdAt:
        normalizeIsoTimestamp(rawEntry.createdAt) ||
        new Date().toISOString(),
      updatedAt:
        normalizeIsoTimestamp(rawEntry.updatedAt) ||
        normalizeIsoTimestamp(rawEntry.createdAt) ||
        new Date().toISOString()
    };
  }

  function normalizeWorkoutType(value) {
    const normalized = normalizeText(value).toLowerCase();

    const aliases = {
      strength: "strength",
      weights: "strength",
      weightlifting: "strength",
      "strength training": "strength",
      running: "running",
      run: "running",
      walking: "walking",
      walk: "walking",
      cardio: "cardio-machine",
      "cardio machine": "cardio-machine",
      "cardio-machine": "cardio-machine",
      cycling: "cycling",
      biking: "cycling",
      bike: "cycling",
      swimming: "swimming",
      swim: "swimming",
      sports: "sports",
      sport: "sports",
      mobility: "mobility",
      yoga: "mobility",
      pilates: "mobility",
      custom: "custom",
      other: "custom"
    };

    return aliases[normalized] || (
      WORKOUT_TYPES[normalized] ? normalized : ""
    );
  }

  /* =====================================================
     DATE AND TIME
  ===================================================== */

  function calculateDurationMinutes(startTime, endTime) {
    if (
      !isValidTimeValue(startTime) ||
      !isValidTimeValue(endTime)
    ) {
      return 0;
    }

    const startMinutes = timeValueToMinutes(startTime);
    let endMinutes = timeValueToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
  }

  function buildWorkoutDateTimes({
    localDate,
    startTime,
    endTime
  }) {
    const start = dateFromDateKeyAndTime(localDate, startTime);
    const end = dateFromDateKeyAndTime(localDate, endTime);

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    return {
      startedAt: start.toISOString(),
      endedAt: end.toISOString()
    };
  }

  function setCurrentDateDisplay() {
    const today = new Date();

    elements.trainingCurrentDate.dateTime =
      getLocalDateKey(today);
    elements.trainingCurrentDate.textContent =
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
      }).format(today);
  }

  function getCurrentWeekRange(referenceDate = new Date()) {
    const start = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const day = start.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysSinceMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      start,
      end,
      startKey: getLocalDateKey(start),
      endKey: getLocalDateKey(end)
    };
  }

  function getMondayBasedDayIndex(dateKey) {
    const date = dateFromDateKey(dateKey);
    const day = date.getDay();

    return day === 0 ? 6 : day - 1;
  }

  function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function dateFromDateKey(dateKey) {
    const [year, month, day] = dateKey
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  function dateFromDateKeyAndTime(dateKey, timeValue) {
    const [year, month, day] = dateKey
      .split("-")
      .map(Number);
    const [hours, minutes] = timeValue
      .split(":")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0
    );
  }

  function getRelativeDateLabel(dateKey) {
    const today = dateFromDateKey(getLocalDateKey());
    const target = dateFromDateKey(dateKey);
    const difference = Math.round(
      (today - target) / 86400000
    );

    if (difference === 0) {
      return "Today";
    }

    if (difference === 1) {
      return "Yesterday";
    }

    if (difference > 1 && difference < 7) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long"
      }).format(target);
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric"
    }).format(target);
  }

  function formatWeekRange(week) {
    const sameMonth =
      week.start.getMonth() === week.end.getMonth();

    if (sameMonth) {
      const month = new Intl.DateTimeFormat("en-US", {
        month: "short"
      }).format(week.start);

      return `${month} ${week.start.getDate()}–${week.end.getDate()}`;
    }

    const start = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(week.start);
    const end = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(week.end);

    return `${start}–${end}`;
  }

  function formatWorkoutTimeRange(entry) {
    return (
      `${formatClockTime(entry.startTime)}–` +
      `${formatClockTime(entry.endTime)}`
    );
  }

  function formatClockTime(timeValue) {
    const [hours, minutes] = timeValue
      .split(":")
      .map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function formatTimeInput(date) {
    return (
      `${String(date.getHours()).padStart(2, "0")}:` +
      `${String(date.getMinutes()).padStart(2, "0")}`
    );
  }

  function formatDateKey(dateKey, options) {
    return new Intl.DateTimeFormat(
      "en-US",
      options
    ).format(dateFromDateKey(dateKey));
  }

  function roundDateToNearestMinutes(date, interval) {
    const rounded = new Date(date);
    const milliseconds = interval * 60 * 1000;

    rounded.setTime(
      Math.round(rounded.getTime() / milliseconds) *
      milliseconds
    );
    rounded.setSeconds(0, 0);

    return rounded;
  }

  /* =====================================================
     GROUPING AND SORTING
  ===================================================== */

  function groupEntriesByDate(entries) {
    const groups = new Map();

    for (const entry of entries) {
      if (!groups.has(entry.localDate)) {
        groups.set(entry.localDate, []);
      }

      groups.get(entry.localDate).push(cloneEntry(entry));
    }

    return Array.from(groups.entries())
      .map(([localDate, groupedEntries]) => ({
        localDate,
        entries: groupedEntries.sort(sortEntriesNewestFirst)
      }))
      .sort((a, b) =>
        b.localDate.localeCompare(a.localDate)
      );
  }

  function sortEntriesNewestFirst(a, b) {
    const timestampDifference =
      Date.parse(b.startedAt) - Date.parse(a.startedAt);

    if (Number.isFinite(timestampDifference) &&
        timestampDifference !== 0) {
      return timestampDifference;
    }

    return (
      `${b.localDate}T${b.startTime}`.localeCompare(
        `${a.localDate}T${a.startTime}`
      )
    );
  }

  /* =====================================================
     UI HELPERS
  ===================================================== */

  function toggleTrainingMenu() {
    const isOpen =
      elements.trainingMenuButton.getAttribute(
        "aria-expanded"
      ) === "true";

    if (isOpen) {
      closeTrainingMenu();
      return;
    }

    elements.trainingMenu.hidden = false;
    elements.trainingMenuButton.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  function closeTrainingMenu() {
    elements.trainingMenu.hidden = true;
    elements.trainingMenuButton.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function scrollToWorkoutCategories() {
    document.getElementById("logWorkout")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });

    elements.categoryButtons[0]?.focus({
      preventScroll: true
    });
  }

  function scrollToTodayTraining() {
    document.getElementById("todayTraining")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  }

  function setText(root, selector, value) {
    const target = root.querySelector(selector);

    if (target) {
      target.textContent = value;
    }
  }

  function createEntryActionButton(action, entry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `ari-entry-action ari-entry-action--${action}`;
    button.dataset.action = action;
    button.dataset.workoutId = entry.id;
    button.textContent =
      action === "edit" ? "Edit" : "Delete";

    return button;
  }

  function getWorkoutTypeLabel(type) {
    return WORKOUT_TYPES[type] || "Workout";
  }

  function getWeeklyActivityLabel(totalMinutes) {
    if (totalMinutes <= 0) {
      return "No activity recorded";
    }

    if (totalMinutes < 75) {
      return "Light training week";
    }

    if (totalMinutes < 150) {
      return "Building activity";
    }

    if (totalMinutes < 300) {
      return "Active training week";
    }

    return "High-volume training week";
  }

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  function generateId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      `workout-${Date.now()}-` +
      Math.random().toString(16).slice(2)
    );
  }

  function cloneEntry(entry) {
    return { ...entry };
  }

  function sum(items, selector) {
    return items.reduce((total, item) => {
      const value = Number(selector(item));
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function formatDuration(totalMinutes) {
    const minutes = Math.max(
      0,
      Math.round(Number(totalMinutes) || 0)
    );
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    }

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
    }).format(Math.round(Number(value) || 0));
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function parseInteger(value) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function parseOptionalInteger(value) {
    const normalized = String(value ?? "").trim();

    if (!normalized) {
      return null;
    }

    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseStoredNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    try {
      const direct = Number(value);

      if (Number.isFinite(direct)) {
        return direct;
      }

      const parsed = JSON.parse(value);

      if (typeof parsed === "number" && Number.isFinite(parsed)) {
        return parsed;
      }

      if (parsed && typeof parsed === "object") {
        const candidates = [
          parsed.value,
          parsed.calories,
          parsed.goal,
          parsed.dailyCalorieGoal,
          parsed.consumed
        ];

        for (const candidate of candidates) {
          const number = Number(candidate);

          if (Number.isFinite(number)) {
            return number;
          }
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  function normalizeText(value) {
    return typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim();
  }

  function normalizeId(value) {
    const id = normalizeText(value);
    return id.length <= 120 ? id : "";
  }

  function positiveIntegerOrNull(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
      return null;
    }

    return Math.round(number);
  }

  function normalizeHeartRate(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const heartRate = Number(value);

    if (
      !Number.isFinite(heartRate) ||
      heartRate < 30 ||
      heartRate > 240
    ) {
      return null;
    }

    return Math.round(heartRate);
  }

  function normalizeDateKey(value) {
    const dateKey = normalizeText(value);
    return isValidDateKey(dateKey) ? dateKey : "";
  }

  function normalizeTimeValue(value) {
    const time = normalizeText(value);

    if (/^\d{2}:\d{2}:\d{2}/.test(time)) {
      return time.slice(0, 5);
    }

    return isValidTimeValue(time) ? time : "";
  }

  function normalizeIsoTimestamp(value) {
    const timestamp = normalizeText(value);

    if (!timestamp || !Number.isFinite(Date.parse(timestamp))) {
      return "";
    }

    return new Date(timestamp).toISOString();
  }

  function inferDateKeyFromTimestamp(timestamp) {
    const parsed = new Date(timestamp);

    return Number.isNaN(parsed.getTime())
      ? ""
      : getLocalDateKey(parsed);
  }

  function extractLocalTime(timestamp) {
    const parsed = new Date(timestamp);

    return Number.isNaN(parsed.getTime())
      ? ""
      : formatTimeInput(parsed);
  }

  function isValidDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = dateFromDateKey(value);

    return (
      !Number.isNaN(date.getTime()) &&
      getLocalDateKey(date) === value
    );
  }

  function isValidTimeValue(value) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);

    return (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    );
  }

  function timeValueToMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function isDateKeyWithinRange(dateKey, startKey, endKey) {
    return dateKey >= startKey && dateKey <= endKey;
  }

  function prefersReducedMotion() {
    return window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }

  /* =====================================================
     STARTUP
  ===================================================== */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();