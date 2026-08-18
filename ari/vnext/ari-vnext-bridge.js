// ARI vNext — browser boundary for controlled side-by-side testing.
// This file does not replace AriRebirthAppBridge yet.

window.Ari = window.Ari || {};

window.AriVNextBridge = {
  version: "1.5.0",
  source: "ari-vnext-bridge",
  pendingStorageKey: "ari_vnext_pending_action",

  async ask(message, options = {}) {
    const text = String(message || "").trim();
    if (!text) return { success: false, ready: false, reply: "Say something first." };

    const session = await this.getSession();
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");

    const history = Array.isArray(options?.history) ? options.history.slice(-16) : [];
    const context = await this.buildContext({ ...options, message: text, history });

    const payload = {
      message: text,
      history,
      surface: options?.page || options?.surface || window.location.pathname || "unknown",
      context,
      preferences: options?.preferences || options?.userContext?.preferences || {},
      memorySummary: options?.coachMemorySummary || options?.userContext?.coachMemorySummary || "",
      pendingAction: this.getPendingAction()
    };

    const response = await fetch("/api/ari-vnext", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Ari vNext request failed.");

    if (data?.pendingAction) this.setPendingAction(data.pendingAction);
    if (data?.action?.type === "cancel_pending_action") this.clearPendingAction();
    if (data?.action?.type === "execute_pending_action") this.clearPendingAction();

    return data;
  },

  async buildContext(options = {}) {
    const userContext = options?.userContext || {};
    const history = Array.isArray(options?.history) ? options.history : [];
    const trainingNeeded = needsCanonicalTrainingContext(options?.message, history);
    let trainingContext = null;

    // The canonical Training store is valuable but comparatively heavy. Do not
    // import and scan six weeks of sessions for greetings, ordinary life chat,
    // simple nutrition questions, or unrelated requests.
    if (trainingNeeded && window.AriVNextTrainingContext?.build) {
      trainingContext = await window.AriVNextTrainingContext.build({
        historyDays: 42,
        historySessionLimit: 48
      });
    }

    const goalType = userContext?.goalType ?? options?.goals?.goalType ?? null;
    const rawWeeklyGoal =
      userContext?.weeklyWeightChangeGoal ??
      userContext?.weekly_weight_change_goal ??
      userContext?.weeklyChange ??
      options?.goals?.weeklyWeightChangeGoal ??
      options?.goals?.weekly_weight_change_goal ??
      options?.goals?.weeklyChange ??
      null;

    return {
      surface: options?.page || window.location.pathname || "unknown",
      contextHints: {
        canonicalTrainingLoaded: Boolean(trainingContext?.available),
        canonicalTrainingNeeded: trainingNeeded
      },
      user: {
        id: userContext?.userId || options?.user?.id || null,
        displayName: userContext?.name || userContext?.displayName || null,
        age: userContext?.age ?? null,
        sex: userContext?.sex || userContext?.gender || null,
        height: userContext?.height || userContext?.heightIn || null,
        activityLevel: userContext?.activityLevel || null
      },
      goals: {
        dailyGoal: userContext?.dailyGoal ?? options?.goals?.dailyGoal ?? null,
        caloriesConsumed: userContext?.caloriesConsumed ?? options?.goals?.caloriesConsumed ?? null,
        caloriesBurned: userContext?.caloriesBurned ?? options?.goals?.caloriesBurned ?? null,
        caloriesLeft: userContext?.caloriesLeft ?? options?.goals?.caloriesLeft ?? null,
        currentWeight: userContext?.currentWeight ?? options?.goals?.currentWeight ?? null,
        goalWeight: userContext?.goalWeight ?? options?.goals?.goalWeight ?? null,
        goalType,
        weeklyWeightChangeGoal: signedWeeklyGoal(rawWeeklyGoal, goalType),
        activityLevel: userContext?.activityLevel ?? options?.goals?.activityLevel ?? null
      },
      mealsToday: userContext?.mealsToday || options?.meals || options?.todayLog || [],
      recentMeals: userContext?.recentMeals || options?.recentMeals || [],
      favoriteFoods: userContext?.favoriteFoods || options?.favoriteFoods || [],
      recentWeights: userContext?.recentWeights || options?.recentWeights || [],
      nutrition: userContext?.nutrition || options?.nutrition || {},
      training: trainingContext?.available
        ? {
            ...(userContext?.training || options?.training || {}),
            summary: trainingContext.summary,
            currentWeek: trainingContext.currentWeek,
            todayProgress: trainingContext.todayProgress,
            sessionHistory: trainingContext.sessionHistory,
            performanceTrends: trainingContext.performanceTrends,
            longitudinal: trainingContext.longitudinal
          }
        : (userContext?.training || options?.training || {}),
      trainingToday: trainingContext?.available
        ? trainingContext.todayPlan
        : (userContext?.trainingToday || options?.trainingToday || null),
      recentTraining: trainingContext?.available
        ? trainingContext.recentTraining
        : (userContext?.recentTraining || options?.recentTraining || []),
      social: userContext?.social || options?.social || {}
    };
  },

  async getSession() {
    if (window.CalBuddy?.getCurrentSession) return await window.CalBuddy.getCurrentSession();
    const client = window.calbuddySupabase || window.supabaseClient;
    if (!client?.auth?.getSession) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  },

  getPendingAction() {
    try {
      const value = sessionStorage.getItem(this.pendingStorageKey);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  setPendingAction(action) {
    if (!action) return this.clearPendingAction();
    sessionStorage.setItem(this.pendingStorageKey, JSON.stringify(action));
    window.dispatchEvent(new CustomEvent("ari:vnextPendingAction", { detail: { action } }));
    return action;
  },

  clearPendingAction() {
    sessionStorage.removeItem(this.pendingStorageKey);
    window.dispatchEvent(new CustomEvent("ari:vnextPendingActionCleared"));
  }
};

function needsCanonicalTrainingContext(message, history = []) {
  const text = String(message || "").trim();
  if (!text) return false;

  const followUp = /^(why|how|how so|what about|and|but|then|make it|do that|the other one|instead|harder|easier|change it|add that|remove that|yes|yeah|no)\b/i.test(text);
  const recent = followUp
    ? (Array.isArray(history) ? history : []).slice(-6).map((item) => String(item?.content || "")).join("\n")
    : "";
  const semantic = `${recent}\n${text}`;

  return /\b(workout|workouts|training|train|exercise|exercises|lift|lifting|strength|stronger|weak|weaker|sets?|reps?|bench|squat|deadlift|press|row|pulldown|shoulder|chest|back|legs?|arms?|biceps?|triceps?|glutes?|cardio|run|running|gym|rest day|recovery|sore|soreness|plateau|personal record|\bpr\b|progression|training volume|training frequency|program|split|deload|missed workout)\b/i.test(semantic);
}

function signedWeeklyGoal(value, goalType) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  const magnitude = Math.abs(number);
  const mode = String(goalType || "").toLowerCase();
  if (/lose|loss|cut/.test(mode)) return -magnitude;
  if (/gain|bulk/.test(mode)) return magnitude;
  if (/maintain|maintenance/.test(mode)) return 0;
  return number;
}

window.Ari.vNextBridge = window.AriVNextBridge;
