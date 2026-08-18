// ARI vNext — compact read-only Training context adapter.
// Uses the existing canonical Workout Plan Controller and never mutates the plan.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const CONTROLLER_URL = "js/training/workout-plan-controller.js";

  window.Ari = window.Ari || {};

  window.AriVNextTrainingContext = {
    version: VERSION,
    controllerPromise: null,

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

    async build({ historyDays = 14 } = {}) {
      try {
        const controller = await this.getController();
        const today = localIsoDate(new Date());
        const currentWeek = controller.getWeek(today);
        const todayPlan = compactDay(controller.getDate(today));
        const week = compactWeek(currentWeek);
        const recent = [];

        const days = Math.max(1, Math.min(30, Number(historyDays) || 14));
        for (let offset = -1; offset >= -days; offset -= 1) {
          const date = addDays(today, offset);
          const plan = compactDay(controller.getDate(date));
          if (!plan || (plan.type === "off" && !plan.completed)) continue;
          recent.push({ date, ...plan });
        }

        return {
          version: VERSION,
          available: true,
          today,
          todayPlan,
          currentWeek: week,
          recentTraining: recent.slice(0, 14),
          summary: summarize({ todayPlan, week, recent })
        };
      } catch (error) {
        console.warn("[ARI vNext Training Context] unavailable:", error?.message || error);
        return {
          version: VERSION,
          available: false,
          error: error?.message || "Training context unavailable.",
          todayPlan: null,
          currentWeek: null,
          recentTraining: [],
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

  function summarize({ todayPlan, week, recent } = {}) {
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

    return lines.join(" ").slice(0, 3000);
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
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function clean(value, max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }
})();
