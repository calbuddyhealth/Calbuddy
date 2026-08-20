// ARI vNext — browser boundary for controlled side-by-side testing.
// This file does not replace AriRebirthAppBridge yet.

window.Ari = window.Ari || {};

window.AriVNextBridge = {
  version: "1.7.1",
  source: "ari-vnext-bridge",
  pendingStorageKey: "ari_vnext_pending_action",
  peerReflectionStorageKey: "ari_vnext_peer_reflection_last",
  peerReflectionPreferenceKey: "ari_vnext_peer_reflection_enabled",

  async ask(message, options = {}) {
    const text = String(message || "").trim();
    if (!text) return { success: false, ready: false, reply: "Say something first." };

    const session = await this.getSession();
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");

    const history = Array.isArray(options?.history) ? options.history.slice(-16) : [];
    const context = await this.buildContext({ ...options, message: text, history });
    const surface = options?.page || options?.surface || window.location.pathname || "unknown";
    const turnId = normalizeTurnId(options?.turnId || options?.requestId) || makeTurnId();

    const payload = {
      turnId,
      message: text,
      history,
      surface,
      context,
      preferences: options?.preferences || options?.userContext?.preferences || {},
      // vNext owns identity, permissions, and durable memory retrieval. Do not
      // forward the legacy CalBuddy coachMemorySummary prompt into the model.
      pendingAction: this.getPendingAction()
    };

    const response = await fetch("/api/ari-vnext", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Ari-Turn-Id": turnId
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Ari vNext request failed.");

    if (data?.pendingAction) this.setPendingAction(data.pendingAction);
    if (data?.action?.type === "cancel_pending_action") this.clearPendingAction();

    if (data?.action?.type === "execute_pending_action") {
      const pending = data?.pendingAction || this.getPendingAction();
      if (isExperimentAction(data?.action?.applicationAction || pending?.name)) {
        const execution = await this.executeExperimentPending({ pendingAction: pending, accessToken });
        data.experimentExecution = execution;
        data.reply = experimentExecutionReply(execution, pending);
      }
      this.clearPendingAction();
    }

    // Reflection is deliberately not awaited. Ari's visible response remains on
    // the fast path; a qualifying peer exchange happens only after the answer.
    this.schedulePeerReflection({
      message: text,
      result: data,
      surface,
      accessToken,
      options
    });

    return data;
  },

  async executeExperimentPending({ pendingAction, accessToken } = {}) {
    const pending = pendingAction && typeof pendingAction === "object" ? pendingAction : null;
    if (!pending?.id || !pending?.sourceTurnId) throw new Error("The experiment action is missing its turn-bound identity.");
    if (pending?.expiresAt && Date.parse(pending.expiresAt) < Date.now()) throw new Error("That experiment change expired. Ask Ari to prepare it again.");

    const name = String(pending?.name || "").trim();
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    let body;

    if (name === "track_experiment") {
      body = {
        action: "start",
        sourceTurnId: pending.sourceTurnId,
        route: args.route || {},
        scientificIntelligence: args.scientificIntelligence || null
      };
    } else if (name === "complete_experiment") {
      body = {
        action: "complete",
        experimentId: args.experimentId,
        outcomeDirection: args.outcomeDirection,
        confidenceAfter: args.confidenceAfter,
        evaluationSource: "user_confirmed_with_ari",
        result: { summary: String(args.summary || "").slice(0, 2000) }
      };
    } else if (name === "cancel_experiment") {
      body = {
        action: "cancel",
        experimentId: args.experimentId,
        reason: String(args.reason || "cancelled_by_user").slice(0, 500)
      };
    } else {
      throw new Error("Unsupported Ari experiment action.");
    }

    const response = await fetch("/api/ari-vnext-experiments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(accessToken || "").trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "Ari could not update the experiment ledger.");
    }

    window.dispatchEvent(new CustomEvent("ari:vnextExperimentChanged", { detail: data }));
    return data;
  },

  async listExperiments({ statuses = ["active", "completed"], limit = 10 } = {}) {
    const session = await this.getSession();
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");
    const response = await fetch("/api/ari-vnext-experiments", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", statuses, limit }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Ari could not load the experiment ledger.");
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

  schedulePeerReflection({ message, result, surface, accessToken, options = {} } = {}) {
    if (!this.isPeerReflectionEnabled(options, surface)) return false;
    if (!shouldSchedulePeerReflection(message, result)) return false;

    const last = this.getLastPeerReflectionAt();
    if (last && Date.now() - last < 18 * 60 * 60 * 1000) return false;

    window.setTimeout(() => {
      this.reflectWithPeer({ message, result, surface, accessToken }).catch(() => {});
    }, 0);
    return true;
  },

  async reflectWithPeer({ message, result, surface, accessToken } = {}) {
    const response = await fetch("/api/ari-vnext-peer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(accessToken || "").trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: String(message || "").slice(0, 1400),
        surface: String(surface || "unknown").slice(0, 200),
        result: compactPeerResult(result)
      }),
      cache: "no-store",
      keepalive: true
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return data;

    if (data?.reflected || data?.reason === "reflection_cooldown") {
      try {
        localStorage.setItem(this.peerReflectionStorageKey, String(Date.now()));
      } catch {
        // Browser privacy/storage restrictions should not affect Ari.
      }
    }

    window.dispatchEvent(new CustomEvent("ari:vnextPeerReflection", { detail: data }));
    return data;
  },

  isPeerReflectionEnabled(options = {}, surface = "") {
    if (options?.peerReflectionEnabled === false) return false;
    if (options?.peerReflectionEnabled === true) return true;
    if (/ari-vnext-lab\.html/i.test(String(surface || ""))) return true;
    try {
      return localStorage.getItem(this.peerReflectionPreferenceKey) === "true";
    } catch {
      return false;
    }
  },

  setPeerReflectionEnabled(enabled) {
    try {
      localStorage.setItem(this.peerReflectionPreferenceKey, enabled ? "true" : "false");
    } catch {
      // No-op when storage is unavailable.
    }
    return Boolean(enabled);
  },

  getLastPeerReflectionAt() {
    try {
      const value = Number(localStorage.getItem(this.peerReflectionStorageKey) || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
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
      if (!value) return null;
      const pending = JSON.parse(value);
      const expiresAt = Date.parse(String(pending?.expiresAt || ""));
      if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
        this.clearPendingAction();
        return null;
      }
      return pending;
    } catch {
      return null;
    }
  },

  setPendingAction(action) {
    if (!action) return this.clearPendingAction();
    const expiresAt = Date.parse(String(action?.expiresAt || ""));
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      this.clearPendingAction();
      return null;
    }
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

  return /\b(workout|workouts|training|train|exercise|exercises|lift|lifting|strength|stronger|weak|weaker|sets?|reps?|bench|squat|deadlift|press|row|pulldown|shoulder|chest|back|legs?|arms?|biceps?|triceps?|glutes?|cardio|run|running|gym|rest day|recovery|sore|soreness|plateau|personal record|\bpr\b|progression|training volume|training frequency|program|split|deload|missed workout|experiment|hypothesis|intervention|observation window)\b/i.test(semantic);
}

function shouldSchedulePeerReflection(message, result = {}) {
  const text = String(message || "").trim();
  if (!text || !String(result?.reply || "").trim()) return false;
  if (result?.safety?.highStakes || result?.route?.currentInfo) return false;

  const mode = String(result?.selfModel?.current?.mode || "");
  const signals = [
    ...(Array.isArray(result?.coachingState?.signals) ? result.coachingState.signals : []),
    ...(Array.isArray(result?.longitudinalState?.signals) ? result.longitudinalState.signals : [])
  ];
  const meaningfulFitness = Boolean(
    (result?.route?.training || result?.route?.goals || result?.route?.nutrition) &&
    (signals.length || result?.longitudinalState?.programDecision?.stance || result?.scientificIntelligence?.hypotheses?.length)
  );
  const reflectiveMode = ["identity_expression", "honest_accountability", "celebration", "steady_support", "collaborative_partner"].includes(mode);
  const explicitReflection = /\b(what do you think|your opinion|be honest|am i wrong|should i change|what would you do)\b/i.test(text);
  const action = result?.action?.applicationAction || result?.action?.type || null;

  return Boolean(action || meaningfulFitness || (reflectiveMode && text.length >= 35) || explicitReflection);
}

function compactPeerResult(result = {}) {
  return {
    reply: String(result?.reply || "").slice(0, 3500),
    route: result?.route || {},
    safety: result?.safety || {},
    selfModel: result?.selfModel || {},
    metacognition: result?.metacognition || {},
    coachingState: result?.coachingState || {},
    longitudinalState: result?.longitudinalState || {},
    scientificIntelligence: result?.scientificIntelligence || {},
    experimentReviewState: result?.experimentReviewState || {},
    action: result?.action || null
  };
}

function isExperimentAction(name) {
  return ["track_experiment", "complete_experiment", "cancel_experiment"].includes(String(name || ""));
}

function experimentExecutionReply(execution = {}, pending = {}) {
  const experiment = execution?.experiment || null;
  if (pending?.name === "track_experiment" && experiment) {
    const review = experiment.reviewAt ? new Date(experiment.reviewAt).toLocaleDateString() : null;
    return `Experiment started${review ? ` — I'll treat ${review} as the review point` : ""}. I'll keep the controlled variables in mind while we collect evidence.`;
  }
  if (pending?.name === "complete_experiment" && experiment) {
    return `Experiment completed and recorded as ${experiment.outcomeDirection || "inconclusive"}. I'll use that result as supporting evidence in future decisions, not as proof.`;
  }
  if (pending?.name === "cancel_experiment") return "Experiment cancelled. I won't treat the unfinished observation window as evidence.";
  return "Experiment ledger updated.";
}

function normalizeTurnId(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 200);
}

function makeTurnId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return `turn_${window.crypto.randomUUID()}`;
  }
  return `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
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