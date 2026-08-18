// ARI vNext — compact read-only Training context adapter.
// Uses the canonical Workout Plan Controller and Workout Progress Store.
// Never mutates training state.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const CONTROLLER_URL = "js/training/workout-plan-controller.js";
  const PROGRESS_URL = "js/training/workout-progress-store.js";

  window.Ari = window.Ari || {};

  window.AriVNextTrainingContext = {
    version: VERSION,
    controllerPromise: null,
    progressPromise: null,

    async getController() {
      if (!this.controllerPromise) {
        this.controllerPromise = import(new URL(CONTROLLER_URL, document.baseURI).href)
          .then(async (module) => {
            const controller = module.default || module.AriTrainingWorkoutPlanController;
            if (!controller?.init || !controller?.getToday || !controller?.getWeek || !controller?.getDate) {
              throw new Error("Canonical Training controller is unavailable.");
            }
            await controller.init();
            return controller;
          })
          .catch((error) => {
            this.controllerPromise = null;
            throw error;
          });
      }

      return await this.controllerPromise;
    },

    async getProgressStore() {
      if (!this.progressPromise) {
        this.progressPromise = import(new URL(PROGRESS_URL, document.baseURI).href)
          .then((module) => {
            const store = module.default || module.AriTrainingWorkoutProgressStore;
            if (!store?.getSessionHistory || !store?.getDaySummary) {
              throw new Error("Canonical Training progress store is unavailable.");
            }
            store.hydrate?.();
            return store;
          })
          .catch((error) => {
            this.progressPromise = null;
            throw error;
          });
      }

      return await this.progressPromise;
    },

    async build({ historyDays = 28, historySessionLimit = 24 } = {}) {
      try {
        const [controller, progressStore] = await Promise.all([
          this.getController(),
          this.getProgressStore().catch(() => null)
        ]);

        const today = localIsoDate(new Date());
        const currentWeek = controller.getWeek(today);
        const todayPlan = compactDay(controller.getDate(today));
        const week = compactWeek(currentWeek);
        const recent = [];

        const days = Math.max(1, Math.min(45, Number(historyDays) || 28));
        for (let offset = -1; offset >= -days; offset -= 1) {
          const date = addDays(today, offset);
          const plan = compactDay(controller.getDate(date));
          const progress = progressStore?.getDaySummary?.(date) || null;
          const completed = progress?.completed === true || plan?.completed === true;

          if (!plan || (plan.type === "off" && !completed)) continue;
          recent.push({
            date,
            ...plan,
            completed,
            actual: compactDayProgress(progress)
          });
        }

        const sessionHistory = progressStore?.getSessionHistory
          ? progressStore.getSessionHistory({ status: "complete", newestFirst: true }).slice(0, Math.max(2, Math.min(40, Number(historySessionLimit) || 24)))
          : [];
        const compactHistory = sessionHistory.map(compactSession).filter(Boolean);
        const performanceTrends = buildPerformanceTrends(compactHistory);

        return {
          version: VERSION,
          available: true,
          today,
          todayPlan,
          todayProgress: compactDayProgress(progressStore?.getDaySummary?.(today) || null),
          currentWeek: week,
          recentTraining: recent.slice(0, 28),
          sessionHistory: compactHistory.slice(0, 16),
          performanceTrends,
          summary: summarize({ todayPlan, week, recent, compactHistory, performanceTrends })
        };
      } catch (error) {
        console.warn("[ARI vNext Training Context] unavailable:", error?.message || error);
        return {
          version: VERSION,
          available: false,
          error: error?.message || "Training context unavailable.",
          todayPlan: null,
          todayProgress: null,
          currentWeek: null,
          recentTraining: [],
          sessionHistory: [],
          performanceTrends: [],
          summary: ""
        };
      }
    }
  };

  window.Ari.vNextTrainingContext = window.AriVNextTrainingContext;

  function compactWeek(week) {
    if (!week || typeof week !== "object") return null;
    const daysObject = week.days && typeof week.days === "object" ? week.days : {};
    const days = Object.entries(daysObject).map(([weekday, day]) => ({
      weekday,
      ...compactDay(day)
    }));

    return {
      weekKey: week.weekKey || week.weekStart || week.startDate || null,
      weekEnd: week.weekEnd || week.endDate || null,
      days
    };
  }

  function compactDay(day) {
    if (!day || typeof day !== "object") return null;
    const exercises = Array.isArray(day.exercises)
      ? day.exercises.slice(0, 12).map((exercise) => ({
          id: clean(exercise?.exerciseId || exercise?.id, 120) || null,
          name: clean(exercise?.name || exercise?.title || exercise?.exerciseName, 160) || "Exercise",
          sets: finiteOrNull(exercise?.sets),
          reps: clean(exercise?.reps || exercise?.repRange, 80) || null,
          completed: exercise?.completed === true
        }))
      : [];

    const progress = day.progress && typeof day.progress === "object" ? day.progress : {};

    return {
      date: clean(day.date, 20) || null,
      type: clean(day.type, 40) || "off",
      focusId: clean(day.focusId, 100) || null,
      title: clean(day.title || day.focusLabel, 160) || (day.type === "off" ? "Off Day" : "Workout"),
      goal: clean(day.goal, 120) || null,
      durationMinutes: finiteOrNull(day.estimatedDurationMinutes || day.durationMinutes),
      exercises,
      completed: day.completed === true || progress.completed === true,
      completedExerciseCount: exercises.filter((exercise) => exercise.completed).length
    };
  }

  function compactDayProgress(progress) {
    if (!progress || typeof progress !== "object") return null;
    return {
      status: clean(progress.status, 40) || null,
      completed: progress.completed === true,
      completedExercises: finiteOrNull(progress.completedExercises),
      completedSets: finiteOrNull(progress.completedSets),
      requiredSets: finiteOrNull(progress.requiredSets),
      durationSeconds: finiteOrNull(progress.elapsedSeconds),
      averageHeartRate: finiteOrNull(progress.averageHeartRate),
      estimatedCalories: finiteOrNull(progress.estimatedCalories)
    };
  }

  function compactSession(session) {
    if (!session || typeof session !== "object") return null;
    const exercises = (Array.isArray(session.exercises) ? session.exercises : [])
      .map((exercise) => compactExecutedExercise(exercise))
      .filter(Boolean)
      .slice(0, 16);

    return {
      date: clean(session.date, 20) || null,
      sessionId: clean(session.sessionId, 120) || null,
      durationSeconds: finiteOrNull(session.elapsedSeconds),
      averageHeartRate: finiteOrNull(session.averageHeartRate),
      estimatedCalories: finiteOrNull(session.estimatedCalories),
      exercises
    };
  }

  function compactExecutedExercise(exercise) {
    if (!exercise || typeof exercise !== "object") return null;
    const completedSets = exercise.completedSets && typeof exercise.completedSets === "object"
      ? Object.values(exercise.completedSets)
          .filter((set) => set?.completed === true)
          .map((set) => ({
            set: finiteOrNull(set?.setNumber),
            reps: finiteOrNull(set?.reps),
            weight: finiteOrNull(set?.weight),
            durationSeconds: finiteOrNull(set?.durationSeconds)
          }))
          .slice(0, 12)
      : [];

    return {
      exerciseId: clean(exercise.exerciseId, 120) || null,
      name: clean(exercise.name || exercise.title || exercise.exerciseName || exercise.exerciseId, 160) || "Exercise",
      source: clean(exercise.source, 60) || null,
      completed: exercise.completed === true,
      skipped: exercise.status === "skipped",
      sets: completedSets,
      actual: exercise.actual && typeof exercise.actual === "object"
        ? {
            reps: finiteOrNull(exercise.actual.reps),
            weight: finiteOrNull(exercise.actual.weight),
            durationSeconds: finiteOrNull(exercise.actual.durationSeconds),
            distance: finiteOrNull(exercise.actual.distance)
          }
        : null
    };
  }

  function buildPerformanceTrends(history = []) {
    const byExercise = new Map();

    for (const session of history) {
      for (const exercise of session?.exercises || []) {
        const key = clean(exercise?.exerciseId || exercise?.name, 160).toLowerCase();
        if (!key || exercise?.skipped) continue;
        const metric = summarizeExercisePerformance(exercise);
        if (!metric.hasLoad && !metric.hasReps) continue;
        const rows = byExercise.get(key) || [];
        rows.push({ date: session.date, name: exercise.name, ...metric });
        byExercise.set(key, rows);
      }
    }

    const trends = [];
    for (const [exerciseKey, rows] of byExercise.entries()) {
      if (rows.length < 2) continue;
      const latest = rows[0];
      const previous = rows[1];
      const comparableLoad = latest.hasLoad && previous.hasLoad;
      const loadChange = comparableLoad ? round1(latest.topWeight - previous.topWeight) : null;
      const direction = comparableLoad
        ? loadChange > 0.5 ? "up" : loadChange < -0.5 ? "down" : "stable"
        : compareReps(latest, previous);

      trends.push({
        exerciseId: exerciseKey,
        name: latest.name,
        direction,
        latest: compactPerformancePoint(latest),
        previous: compactPerformancePoint(previous),
        topWeightChange: loadChange,
        sessionCount: rows.length,
        caution: "Compare only like-for-like exercise performances; rep ranges, technique, effort, and programming context may differ."
      });
    }

    return trends
      .sort((a, b) => trendPriority(a.direction) - trendPriority(b.direction))
      .slice(0, 10);
  }

  function summarizeExercisePerformance(exercise) {
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
    const loadedSets = sets.filter((set) => Number(set?.weight) > 0);
    const repSets = sets.filter((set) => Number.isFinite(Number(set?.reps)));
    const topWeight = loadedSets.length ? Math.max(...loadedSets.map((set) => Number(set.weight))) : null;
    const topWeightReps = topWeight !== null
      ? Math.max(...loadedSets.filter((set) => Number(set.weight) === topWeight).map((set) => Number(set.reps) || 0))
      : null;
    const totalReps = repSets.length ? repSets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0) : null;
    const volumeLoad = loadedSets.length
      ? round1(loadedSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0))
      : null;

    return {
      hasLoad: topWeight !== null,
      hasReps: totalReps !== null,
      topWeight,
      topWeightReps,
      totalReps,
      volumeLoad
    };
  }

  function compactPerformancePoint(point) {
    return {
      date: point.date || null,
      topWeight: point.topWeight,
      topWeightReps: point.topWeightReps,
      totalReps: point.totalReps,
      volumeLoad: point.volumeLoad
    };
  }

  function compareReps(latest, previous) {
    if (!latest.hasReps || !previous.hasReps) return "unknown";
    const change = Number(latest.totalReps || 0) - Number(previous.totalReps || 0);
    return change > 1 ? "up" : change < -1 ? "down" : "stable";
  }

  function trendPriority(direction) {
    if (direction === "down") return 0;
    if (direction === "stable") return 1;
    if (direction === "up") return 2;
    return 3;
  }

  function summarize({ todayPlan, week, recent, compactHistory, performanceTrends } = {}) {
    const lines = [];
    if (todayPlan) {
      lines.push(`Today: ${todayPlan.title || todayPlan.type}${todayPlan.completed ? " (completed)" : ""}.`);
    }

    const planned = Array.isArray(week?.days)
      ? week.days.filter((day) => day?.type === "workout" && Array.isArray(day.exercises) && day.exercises.length)
      : [];
    if (planned.length) {
      lines.push(`This week: ${planned.map((day) => `${day.weekday}: ${day.title}`).join("; ")}.`);
    }

    const recentWorkouts = Array.isArray(recent)
      ? recent.filter((day) => day?.type === "workout").slice(0, 6)
      : [];
    if (recentWorkouts.length) {
      lines.push(`Recent planned/tracked training: ${recentWorkouts.map((day) => `${day.date}: ${day.title}`).join("; ")}.`);
    }

    if (Array.isArray(compactHistory) && compactHistory.length) {
      lines.push(`Completed session history available: ${compactHistory.length} recent session(s).`);
    }

    const declines = (Array.isArray(performanceTrends) ? performanceTrends : []).filter((item) => item.direction === "down").slice(0, 3);
    if (declines.length) {
      lines.push(`Comparable recent performance signals trending down: ${declines.map((item) => item.name).join(", ")}.`);
    }

    return lines.join(" ").slice(0, 3600);
  }

  function localIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function addDays(isoDate, amount) {
    const [year, month, day] = String(isoDate).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + Number(amount || 0));
    return localIsoDate(date);
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function clean(value, max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }
})();
