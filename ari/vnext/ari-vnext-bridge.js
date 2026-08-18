// ARI vNext — browser boundary for controlled side-by-side testing.
// This file does not replace AriRebirthAppBridge yet.

window.Ari = window.Ari || {};

window.AriVNextBridge = {
  version: "1.0.0",
  source: "ari-vnext-bridge",
  pendingStorageKey: "ari_vnext_pending_action",

  async ask(message, options = {}) {
    const text = String(message || "").trim();
    if (!text) return { success: false, ready: false, reply: "Say something first." };

    const session = await this.getSession();
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");

    const payload = {
      message: text,
      history: Array.isArray(options?.history) ? options.history.slice(-16) : [],
      surface: options?.page || options?.surface || window.location.pathname || "unknown",
      context: this.buildContext(options),
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

  buildContext(options = {}) {
    const userContext = options?.userContext || {};

    return {
      surface: options?.page || window.location.pathname || "unknown",
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
        goalType: userContext?.goalType ?? options?.goals?.goalType ?? null,
        activityLevel: userContext?.activityLevel ?? options?.goals?.activityLevel ?? null
      },
      mealsToday: userContext?.mealsToday || options?.meals || options?.todayLog || [],
      nutrition: userContext?.nutrition || options?.nutrition || {},
      training: userContext?.training || options?.training || {},
      trainingToday: userContext?.trainingToday || options?.trainingToday || null,
      recentTraining: userContext?.recentTraining || options?.recentTraining || [],
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

window.Ari.vNextBridge = window.AriVNextBridge;
