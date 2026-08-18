// ARI vNext — compact read-only Training context adapter.
// Uses the canonical Workout Plan Controller and Workout Progress Store.
// Never mutates training state.

(() => {
  "use strict";

  const VERSION = "1.2.0";
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

    async build({ historyDays = 28, historySessionLimit = 36 } = {}) {
      try {
        const [controller, progressStore] = await Promise.all([
          this.getController(),
          this.getProgressStore().catch(() => null)
        ]);

        const today = localIsoDate(new Date());
        const currentWeek = controller.getWeek(today);
        const todayPlan = compactDay(controller.getDate(today), controller);
        const week = compactWeek(currentWeek, controller);
        const recent = [];

        const days = Math.max(1, Math.min(56, Number(historyDays) || 28));
        for (let offset = -1; offset >= -days; offset -= 1) {
          const date = addDays(today, offset);
          const plan = compactDay(controller.getDate(date), controller);
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
          ? progressStore
              .getSessionHistory({ status: "complete", newestFirst: true })
              .slice(0, Math.max(3, Math.min(60, Number(historySessionLimit) || 36)))
          : [];
        const compactHistory = sessionHistory
          .map((session) => compactSession(session, controller))
          .filter(Boolean);
        const performanceTrends = buildPerformanceTrends(compactHistory);
        const longitudinal = buildLongitudinalTraining({
          today,
          recent,
          compactHistory,
          performanceTrends
        });

        return {
          version: VERSION,
          available: true,
          today,
          todayPlan,
          todayProgress: compactDayProgress(progressStore?.getDaySummary?.(today) || null),
          currentWeek: week,
          recentTraining: recent.slice(0, 42),
          sessionHistory: compactHistory.slice(0, 24),
          performanceTrends,
          longitudinal,
          summary: summarize({ todayPlan, week, recent, compactHistory, performanceTrends, longitudinal })
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
          longitudinal: null,
          summary: ""
        };
      }
    }
  };

  window.Ari.vNextTrainingContext = window.AriVNextTrainingContext;

  function compactWeek(week, controller) {
    if (!week || typeof week !== "object") return null;
    const daysObject = week.days && typeof week.days === "object" ? week.days : {};
    const days = Object.entries(daysObject).map(([weekday, day]) => ({
      weekday,
      ...compactDay(day, controller)
    }));

    return {
      weekKey: week.weekKey || week.weekStart || week.startDate || null,
      weekEnd: week.weekEnd || week.endDate || null,
      days
    };
  }

  function compactDay(day, controller) {
    if (!day || typeof day !== "object") return null;
    const exercises = Array.isArray(day.exercises)
      ? day.exercises.slice(0, 14).map((exercise) => {
          const id = clean(exercise?.exerciseId || exercise?.id, 120) || null;
          const canonical = id ? safeExercise(controller, id) : null;
          return {
            id,
            name: clean(
              canonical?.name || exercise?.name || exercise?.title || exercise?.exerciseName || id,
              160
            ) || "Exercise",
            sets: numberOrNull(exercise?.sets),
            reps: clean(exercise?.reps || exercise?.repRange, 80) || null,
            bodyParts: compactStrings(canonical?.bodyParts, 6),
            primaryMuscles: compactStrings(canonical?.primaryMuscles, 6),
            completed: exercise?.completed === true
          };
        })
      : [];

    const progress = day.progress && typeof day.progress === "object" ? day.progress : {};

    return {
      date: clean(day.date, 20) || null,
      type: clean(day.type, 40) || "off",
      focusId: clean(day.focusId, 100) || null,
      title: clean(day.title || day.focusLabel, 160) || (day.type === "off" ? "Off Day" : "Workout"),
      goal: clean(day.goal, 120) || null,
      durationMinutes: numberOrNull(day.estimatedDurationMinutes || day.durationMinutes),
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
      completedExercises: numberOrNull(progress.completedExercises),
      completedSets: numberOrNull(progress.completedSets),
      requiredSets: numberOrNull(progress.requiredSets),
      durationSeconds: numberOrNull(progress.elapsedSeconds),
      averageHeartRate: numberOrNull(progress.averageHeartRate),
      estimatedCalories: numberOrNull(progress.estimatedCalories)
    };
  }

  function compactSession(session, controller) {
    if (!session || typeof session !== "object") return null;
    const exercises = (Array.isArray(session.exercises) ? session.exercises : [])
      .map((exercise) => compactExecutedExercise(exercise, controller))
      .filter(Boolean)
      .slice(0, 18);

    return {
      date: clean(session.date, 20) || null,
      sessionId: clean(session.sessionId, 120) || null,
      durationSeconds: numberOrNull(session.elapsedSeconds),
      averageHeartRate: numberOrNull(session.averageHeartRate),
      estimatedCalories: numberOrNull(session.estimatedCalories),
      exercises
    };
  }

  function compactExecutedExercise(exercise, controller) {
    if (!exercise || typeof exercise !== "object") return null;
    const canonical = safeExercise(controller, exercise.exerciseId);
    const completedSets = exercise.completedSets && typeof exercise.completedSets === "object"
      ? Object.values(exercise.completedSets)
          .filter((set) => set?.completed === true)
          .map((set) => ({
            set: numberOrNull(set?.setNumber),
            reps: numberOrNull(set?.reps),
            weight: numberOrNull(set?.weight),
            durationSeconds: numberOrNull(set?.durationSeconds)
          }))
          .slice(0, 16)
      : [];

    return {
      exerciseId: clean(exercise.exerciseId, 120) || null,
      name: clean(
        canonical?.name || exercise.name || exercise.title || exercise.exerciseName || exercise.exerciseId,
        160
      ) || "Exercise",
      bodyParts: compactStrings(canonical?.bodyParts, 6),
      primaryMuscles: compactStrings(canonical?.primaryMuscles, 6),
      source: clean(exercise.source, 60) || null,
      completed: exercise.completed === true,
      skipped: exercise.status === "skipped",
      sets: completedSets,
      actual: exercise.actual && typeof exercise.actual === "object"
        ? {
            reps: numberOrNull(exercise.actual.reps),
            weight: numberOrNull(exercise.actual.weight),
            durationSeconds: numberOrNull(exercise.actual.durationSeconds),
            distance: numberOrNull(exercise.actual.distance)
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
      const direction = comparePerformance(latest, previous);
      const prior = rows.slice(1);
      const previousBestE1rm = bestFinite(prior.map((row) => row.estimated1Rm));
      const previousBestVolume = bestFinite(prior.map((row) => row.volumeLoad));
      const e1rmPr = rows.length >= 3 && latest.estimated1Rm !== null && previousBestE1rm !== null
        ? latest.estimated1Rm > previousBestE1rm * 1.01
        : false;
      const volumePr = rows.length >= 3 && latest.volumeLoad !== null && previousBestVolume !== null
        ? latest.volumeLoad > previousBestVolume * 1.03
        : false;
      const plateauCandidate = rows.length >= 3 ? isPlateauCandidate(rows.slice(0, 3)) : false;

      trends.push({
        exerciseId: exerciseKey,
        name: latest.name,
        direction,
        latest: compactPerformancePoint(latest),
        previous: compactPerformancePoint(previous),
        estimated1RmChangePct: percentChange(latest.estimated1Rm, previous.estimated1Rm),
        topWeightChange: difference(latest.topWeight, previous.topWeight),
        windowPr: e1rmPr || volumePr,
        windowPrType: e1rmPr ? "estimated_1rm" : volumePr ? "volume_load" : null,
        plateauCandidate,
        sessionCount: rows.length,
        caution: "Recent-window comparison only. Rep targets, exercise order, technique, effort, equipment, and programming context may differ."
      });
    }

    return trends
      .sort((a, b) => {
        if (a.windowPr !== b.windowPr) return a.windowPr ? -1 : 1;
        if (a.plateauCandidate !== b.plateauCandidate) return a.plateauCandidate ? -1 : 1;
        return trendPriority(a.direction) - trendPriority(b.direction);
      })
      .slice(0, 14);
  }

  function summarizeExercisePerformance(exercise) {
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
    const loadedSets = sets.filter((set) => Number(set?.weight) > 0 && Number(set?.reps) >= 0);
    const repSets = sets.filter((set) => Number.isFinite(Number(set?.reps)));
    const topWeight = loadedSets.length ? Math.max(...loadedSets.map((set) => Number(set.weight))) : null;
    const topWeightReps = topWeight !== null
      ? Math.max(...loadedSets.filter((set) => Number(set.weight) === topWeight).map((set) => Number(set.reps) || 0))
      : null;
    const totalReps = repSets.length ? repSets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0) : null;
    const volumeLoad = loadedSets.length
      ? round1(loadedSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0))
      : null;
    const estimated1Rm = loadedSets.length
      ? round1(Math.max(...loadedSets.map((set) => {
          const weight = Number(set.weight) || 0;
          const reps = Math.max(1, Number(set.reps) || 1);
          return weight * (1 + Math.min(reps, 15) / 30);
        })))
      : null;

    return {
      hasLoad: topWeight !== null,
      hasReps: totalReps !== null,
      topWeight,
      topWeightReps,
      totalReps,
      completedSetCount: sets.length,
      volumeLoad,
      estimated1Rm
    };
  }

  function compactPerformancePoint(point) {
    return {
      date: point.date || null,
      topWeight: point.topWeight,
      topWeightReps: point.topWeightReps,
      totalReps: point.totalReps,
      completedSetCount: point.completedSetCount,
      volumeLoad: point.volumeLoad,
      estimated1Rm: point.estimated1Rm
    };
  }

  function comparePerformance(latest, previous) {
    if (latest.estimated1Rm !== null && previous.estimated1Rm !== null && previous.estimated1Rm > 0) {
      const change = (latest.estimated1Rm - previous.estimated1Rm) / previous.estimated1Rm;
      return change > 0.015 ? "up" : change < -0.015 ? "down" : "stable";
    }

    if (latest.topWeight !== null && previous.topWeight !== null) {
      const change = latest.topWeight - previous.topWeight;
      if (change > 0.5) return "up";
      if (change < -0.5) return "down";
    }

    if (latest.hasReps && previous.hasReps) {
      const change = Number(latest.totalReps || 0) - Number(previous.totalReps || 0);
      return change > 1 ? "up" : change < -1 ? "down" : "stable";
    }

    return "unknown";
  }

  function isPlateauCandidate(rows = []) {
    if (rows.length < 3) return false;
    const spanDays = dateDistance(rows[2]?.date, rows[0]?.date);
    if (spanDays < 7) return false;

    const e1rms = rows.map((row) => row.estimated1Rm).filter((value) => value !== null && value > 0);
    if (e1rms.length === 3) {
      const high = Math.max(...e1rms);
      const low = Math.min(...e1rms);
      return high > 0 && (high - low) / high <= 0.025 && e1rms[0] <= e1rms[2] * 1.015;
    }

    const reps = rows.map((row) => row.totalReps).filter((value) => value !== null);
    if (reps.length === 3) {
      return Math.max(...reps) - Math.min(...reps) <= 2;
    }

    return false;
  }

  function buildLongitudinalTraining({ today, recent, compactHistory, performanceTrends } = {}) {
    const recentWorkouts = (Array.isArray(recent) ? recent : []).filter((item) => item?.type === "workout");
    const completed = recentWorkouts.filter((item) => item?.completed === true).length;
    const missed = Math.max(0, recentWorkouts.length - completed);
    const weeklySummaries = buildWeeklySummaries({ today, recent: recentWorkouts, history: compactHistory });
    const completedPastWeeks = weeklySummaries.filter((week) => week.weekKey !== weekKey(today) && week.completedSessions >= 2);
    const latestWeek = completedPastWeeks[0] || null;
    const previousWeek = completedPastWeeks[1] || null;
    const volumeChange = latestWeek && previousWeek
      ? {
          available: previousWeek.completedSets > 0,
          latestWeek: latestWeek.weekKey,
          previousWeek: previousWeek.weekKey,
          latestCompletedSets: latestWeek.completedSets,
          previousCompletedSets: previousWeek.completedSets,
          completedSetChangeRatio: ratioChange(latestWeek.completedSets, previousWeek.completedSets),
          latestVolumeLoad: latestWeek.volumeLoad,
          previousVolumeLoad: previousWeek.volumeLoad,
          volumeLoadChangeRatio: ratioChange(latestWeek.volumeLoad, previousWeek.volumeLoad)
        }
      : { available: false };

    const windowPrs = performanceTrends
      .filter((item) => item?.windowPr === true)
      .map((item) => ({
        exerciseId: item.exerciseId,
        name: item.name,
        type: item.windowPrType,
        latest: item.latest,
        sessionCount: item.sessionCount
      }))
      .slice(0, 8);
    const plateauCandidates = performanceTrends
      .filter((item) => item?.plateauCandidate === true)
      .map((item) => ({
        exerciseId: item.exerciseId,
        name: item.name,
        latest: item.latest,
        previous: item.previous,
        sessionCount: item.sessionCount
      }))
      .slice(0, 8);

    return {
      windowDays: 28,
      adherence: {
        windowDays: 28,
        plannedCount: recentWorkouts.length,
        completedCount: completed,
        missedCount: missed,
        rate: recentWorkouts.length ? round2(completed / recentWorkouts.length) : null,
        caution: "Missed-session counts reflect workouts still represented in the current date-specific plan/history; deleted historical plans cannot be reconstructed."
      },
      progression: {
        comparableExerciseCount: performanceTrends.length,
        upCount: performanceTrends.filter((item) => item.direction === "up").length,
        stableCount: performanceTrends.filter((item) => item.direction === "stable").length,
        downCount: performanceTrends.filter((item) => item.direction === "down").length,
        windowPrCount: windowPrs.length,
        windowPrs,
        plateauCandidateCount: plateauCandidates.length,
        plateauCandidates
      },
      weeklySummaries: weeklySummaries.slice(0, 8),
      volumeChange,
      muscleFrequency: buildMuscleFrequency(compactHistory, today, 28),
      bodyPartSetVolume: buildBodyPartSetVolume(compactHistory, today, 28)
    };
  }

  function buildWeeklySummaries({ today, recent = [], history = [] } = {}) {
    const weeks = new Map();

    for (const plan of recent) {
      const key = weekKey(plan?.date);
      if (!key) continue;
      const row = weeks.get(key) || emptyWeek(key);
      row.plannedSessions += 1;
      if (plan?.completed === true) row.completedPlannedSessions += 1;
      weeks.set(key, row);
    }

    for (const session of history) {
      const key = weekKey(session?.date);
      if (!key) continue;
      const row = weeks.get(key) || emptyWeek(key);
      row.completedSessions += 1;
      row.trainingMinutes += Number(session?.durationSeconds || 0) / 60;

      for (const exercise of session?.exercises || []) {
        if (exercise?.skipped) continue;
        const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
        row.completedSets += sets.length;
        row.volumeLoad += Number(summarizeExercisePerformance(exercise).volumeLoad || 0);
      }

      weeks.set(key, row);
    }

    return [...weeks.values()]
      .map((row) => ({
        ...row,
        missedPlannedSessions: Math.max(0, row.plannedSessions - row.completedPlannedSessions),
        trainingMinutes: Math.round(row.trainingMinutes),
        volumeLoad: round1(row.volumeLoad),
        isCurrentWeek: row.weekKey === weekKey(today)
      }))
      .sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
  }

  function emptyWeek(key) {
    return {
      weekKey: key,
      plannedSessions: 0,
      completedPlannedSessions: 0,
      completedSessions: 0,
      completedSets: 0,
      trainingMinutes: 0,
      volumeLoad: 0
    };
  }

  function buildMuscleFrequency(history = [], today, windowDays = 28) {
    const cutoff = addDays(today, -Math.max(1, windowDays));
    const counts = new Map();

    for (const session of history) {
      if (!session?.date || session.date < cutoff || session.date > today) continue;
      const hit = new Set();
      for (const exercise of session?.exercises || []) {
        if (exercise?.skipped) continue;
        for (const bodyPart of exercise?.bodyParts || []) {
          const key = clean(bodyPart, 80).toLowerCase();
          if (key) hit.add(key);
        }
      }
      for (const bodyPart of hit) counts.set(bodyPart, (counts.get(bodyPart) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([bodyPart, sessions]) => ({ bodyPart, sessions, perWeek: round2(sessions / (windowDays / 7)) }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 16);
  }

  function buildBodyPartSetVolume(history = [], today, windowDays = 28) {
    const cutoff = addDays(today, -Math.max(1, windowDays));
    const counts = new Map();

    for (const session of history) {
      if (!session?.date || session.date < cutoff || session.date > today) continue;
      for (const exercise of session?.exercises || []) {
        if (exercise?.skipped) continue;
        const primaryBodyPart = clean(exercise?.bodyParts?.[0], 80).toLowerCase();
        if (!primaryBodyPart) continue;
        const completedSets = Array.isArray(exercise?.sets) ? exercise.sets.length : 0;
        counts.set(primaryBodyPart, (counts.get(primaryBodyPart) || 0) + completedSets);
      }
    }

    return [...counts.entries()]
      .map(([bodyPart, completedSets]) => ({
        bodyPart,
        completedSets,
        averageSetsPerWeek: round1(completedSets / (windowDays / 7)),
        caution: "Approximate allocation uses the exercise's first canonical body-part tag to avoid double-counting one set across several muscles."
      }))
      .sort((a, b) => b.completedSets - a.completedSets)
      .slice(0, 16);
  }

  function summarize({ todayPlan, week, recent, compactHistory, performanceTrends, longitudinal } = {}) {
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

    const prs = (Array.isArray(performanceTrends) ? performanceTrends : []).filter((item) => item.windowPr).slice(0, 3);
    if (prs.length) {
      lines.push(`Recent-window performance bests: ${prs.map((item) => item.name).join(", ")}.`);
    }

    const plateaus = (Array.isArray(performanceTrends) ? performanceTrends : []).filter((item) => item.plateauCandidate).slice(0, 3);
    if (plateaus.length) {
      lines.push(`Plateau candidates worth inspecting: ${plateaus.map((item) => item.name).join(", ")}.`);
    }

    const declines = (Array.isArray(performanceTrends) ? performanceTrends : []).filter((item) => item.direction === "down").slice(0, 3);
    if (declines.length) {
      lines.push(`Comparable recent performance signals trending down: ${declines.map((item) => item.name).join(", ")}.`);
    }

    if (longitudinal?.adherence?.plannedCount) {
      lines.push(`28-day represented workout adherence: ${longitudinal.adherence.completedCount}/${longitudinal.adherence.plannedCount} completed.`);
    }

    return lines.join(" ").slice(0, 4200);
  }

  function safeExercise(controller, exerciseId) {
    try {
      return controller?.getExercise?.(exerciseId) || null;
    } catch {
      return null;
    }
  }

  function compactStrings(values, limit = 8) {
    return [...new Set((Array.isArray(values) ? values : []).map((value) => clean(value, 80)).filter(Boolean))].slice(0, limit);
  }

  function trendPriority(direction) {
    if (direction === "down") return 0;
    if (direction === "stable") return 1;
    if (direction === "up") return 2;
    return 3;
  }

  function weekKey(value) {
    const text = clean(value, 20);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - date.getDay());
    return localIsoDate(date);
  }

  function dateDistance(first, second) {
    const a = Date.parse(`${clean(first, 20)}T12:00:00`);
    const b = Date.parse(`${clean(second, 20)}T12:00:00`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.abs(Math.round((b - a) / 86400000));
  }

  function percentChange(latest, previous) {
    if (latest === null || previous === null || !Number.isFinite(Number(latest)) || !Number.isFinite(Number(previous)) || Number(previous) === 0) return null;
    return round2((Number(latest) - Number(previous)) / Number(previous));
  }

  function difference(latest, previous) {
    if (latest === null || previous === null || !Number.isFinite(Number(latest)) || !Number.isFinite(Number(previous))) return null;
    return round1(Number(latest) - Number(previous));
  }

  function bestFinite(values = []) {
    const numbers = values.map(Number).filter(Number.isFinite);
    return numbers.length ? Math.max(...numbers) : null;
  }

  function ratioChange(latest, previous) {
    const left = Number(latest);
    const right = Number(previous);
    if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) return null;
    return round2((left - right) / right);
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

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function round2(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function clean(value, max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }
})();
