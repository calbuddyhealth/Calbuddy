// =====================================================
// ARI EXPERIENCE
// File: ari/runtime/ari-fast-conversation.js
// Version: 1.0.1
// Purpose:
//   Add a lightweight conversational lane in front of the full Ari Rebirth
//   runtime without changing CalBuddy's public askAri API.
//
// Architecture:
//   CalBuddy._askAriInternal()
//        ↓
//   existing deterministic action / owner / usage checks
//        ↓
//   AriRebirthAppBridge.ask()  ← wrapped here
//        ↓
//   AriConversationRouter
//      ├─ FAST → authenticated /api/ari-conversation → direct natural reply
//      └─ DEEP → original AriRebirthAppBridge.ask()
//
// The full runtime remains the fallback authority. Fast mode never performs
// application writes and never replaces high-stakes or developer reasoning.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const AriFastConversation = {
    version: "1.0.1",
    source: "ari-fast-conversation",
    endpoint: "/api/ari-conversation",
    installed: false,
    originalBridgeAsk: null,
    fastTimeoutMs: 12000,

    install() {
      const bridge = window.AriRebirthAppBridge;
      const router = window.AriConversationRouter || window.Ari?.conversationRouter;

      if (this.installed) return true;

      if (!bridge || typeof bridge.ask !== "function") {
        console.warn("ARI FAST CONVERSATION: bridge unavailable; installation skipped.");
        return false;
      }

      if (!router || typeof router.decide !== "function") {
        console.warn("ARI FAST CONVERSATION: router unavailable; installation skipped.");
        return false;
      }

      this.originalBridgeAsk = bridge.ask.bind(bridge);

      const fastRuntime = this;

      bridge.ask = async function wrappedAriAsk(message, options = {}) {
        const route = router.decide(message, options);

        if (options?.debugTiming === true) {
          console.log("[ARI Runtime Route]", route);
        }

        if (route.mode !== "fast") {
          return await fastRuntime.originalBridgeAsk(message, {
            ...options,
            runtimeRoute: route
          });
        }

        try {
          const result = await fastRuntime.ask(message, options, route);

          if (result?.route === "deep" || result?.escalate === true) {
            return await fastRuntime.originalBridgeAsk(message, {
              ...options,
              runtimeRoute: {
                ...route,
                mode: "deep",
                reason: result.reason || "fast_endpoint_escalation"
              }
            });
          }

          return result;
        } catch (error) {
          console.warn(
            "ARI FAST CONVERSATION FAILED; falling back to Rebirth:",
            error?.message || error
          );

          return await fastRuntime.originalBridgeAsk(message, {
            ...options,
            runtimeRoute: {
              ...route,
              mode: "deep",
              reason: "fast_runtime_failure"
            },
            fastRuntimeFailure: {
              message: error?.message || String(error),
              source: fastRuntime.source
            }
          });
        }
      };

      bridge.fastConversationInstalled = true;
      bridge.fastConversationVersion = this.version;
      this.installed = true;

      console.log("ARI FAST CONVERSATION INSTALLED:", this.version);
      return true;
    },

    async ask(message = "", options = {}, route = {}) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), this.fastTimeoutMs);

      try {
        const accessToken = await this.resolveAccessToken();

        if (!accessToken) {
          const authError = new Error("A signed-in session is required for fast conversation.");
          authError.code = "ari_fast_conversation_auth_missing";
          throw authError;
        }

        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          signal: controller.signal,
          body: JSON.stringify(this.buildRequest(message, options, route))
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 409 && data?.route === "deep") {
          return {
            route: "deep",
            escalate: true,
            reason: data.reason || "server_escalation"
          };
        }

        if (!response.ok) {
          throw new Error(
            data?.error?.message ||
            data?.error ||
            `Fast conversation request failed (${response.status}).`
          );
        }

        const reply = String(data?.reply || "").trim();

        if (!reply) {
          throw new Error("Fast conversation returned an empty reply.");
        }

        return {
          success: true,
          ok: true,
          complete: true,
          ready: true,
          reply,
          emotion: this.normalizeEmotion(data?.emotion),
          source: data?.source || this.source,
          deliveryStatus: "delivered",
          runtimeMode: "fast",
          runtimeRoute: route,
          actions: [],
          developerIntent: null,
          pendingAction: null,
          memoryCandidate: data?.memoryCandidate || null,
          summary: {
            runtimeMode: "fast",
            runtimeRoute: route,
            model: data?.model || null,
            timing: data?.timing || null,
            source: data?.source || this.source
          }
        };
      } catch (error) {
        if (error?.name === "AbortError") {
          const timeoutError = new Error("Fast conversation timed out.");
          timeoutError.code = "ari_fast_conversation_timeout";
          throw timeoutError;
        }

        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },

    async resolveAccessToken() {
      try {
        if (
          window.CalBuddy &&
          typeof window.CalBuddy.getCurrentSession === "function"
        ) {
          const session = await window.CalBuddy.getCurrentSession();
          const token = String(session?.access_token || "").trim();
          if (token) return token;
        }

        const client =
          window.calbuddySupabase ||
          window.supabaseClient ||
          window.CalBuddy?.supabase ||
          null;

        if (client?.auth?.getSession) {
          const { data } = await client.auth.getSession();
          return String(data?.session?.access_token || "").trim();
        }
      } catch (error) {
        console.warn(
          "ARI FAST CONVERSATION: session token lookup failed:",
          error?.message || error
        );
      }

      return "";
    },

    buildRequest(message = "", options = {}, route = {}) {
      const history = this.normalizeHistory(options.history);
      const userContext = this.buildCompactUserContext(options);

      return {
        action: "conversation",
        message: String(message || "").trim(),
        history,
        context: userContext,
        coachMemorySummary: this.cleanText(options.coachMemorySummary, 2400),
        page: this.cleanText(options.page || window.location?.pathname, 240),
        route,
        client: {
          source: this.source,
          version: this.version
        }
      };
    },

    buildCompactUserContext(options = {}) {
      const context = options.userContext || {};
      const profile = context.profile || {};
      const goals = options.goals || {};

      return {
        user: {
          id: options.user?.id || context.userId || null,
          displayName:
            profile.display_name ||
            profile.full_name ||
            profile.first_name ||
            null
        },
        goals: {
          dailyGoal: goals.dailyGoal ?? context.dailyGoal ?? null,
          caloriesConsumed: goals.caloriesConsumed ?? context.caloriesConsumed ?? null,
          caloriesBurned: goals.caloriesBurned ?? context.caloriesBurned ?? null,
          caloriesLeft: goals.caloriesLeft ?? context.caloriesLeft ?? null,
          currentWeight: goals.currentWeight ?? context.currentWeight ?? null,
          goalWeight: goals.goalWeight ?? context.goalWeight ?? null,
          goalType: goals.goalType ?? context.goalType ?? null,
          activityLevel: goals.activityLevel ?? context.activityLevel ?? null,
          nutritionDate: goals.nutritionDate ?? context.nutritionDate ?? null
        },
        profile: {
          ariMode: profile.ari_mode || context.ariModeLabel || null,
          preferredName: profile.preferred_name || null,
          pronouns: profile.pronouns || null
        },
        ownerMode: options.ownerMode === true,
        mealsToday: this.compactMeals(options.meals || context.mealsToday),
        recentMeals: this.compactMeals(options.recentMeals || context.recentMeals, 5),
        recentWeights: this.compactWeights(options.recentWeights || context.recentWeights)
      };
    },

    normalizeHistory(history = []) {
      if (!Array.isArray(history)) return [];

      return history
        .slice(-12)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          content: this.cleanText(item?.content, 1600)
        }))
        .filter((item) => item.content);
    },

    compactMeals(meals = [], limit = 6) {
      if (!Array.isArray(meals)) return [];

      return meals.slice(0, limit).map((meal) => ({
        name: this.cleanText(meal?.name || meal?.food_name, 120),
        calories: this.safeNumber(meal?.calories),
        protein: this.safeNumber(meal?.protein),
        carbs: this.safeNumber(meal?.carbs),
        fat: this.safeNumber(meal?.fat)
      }));
    },

    compactWeights(weights = []) {
      if (!Array.isArray(weights)) return [];

      return weights.slice(0, 4).map((entry) => ({
        weight: this.safeNumber(entry?.weight),
        date: this.cleanText(entry?.date || entry?.created_at, 40)
      }));
    },

    normalizeEmotion(value) {
      const allowed = new Set([
        "idle", "thinking", "happy", "celebrate", "sad", "concerned",
        "mad", "shy", "coach", "wow", "laugh", "listening",
        "logging", "success"
      ]);

      const emotion = String(value || "idle").trim().toLowerCase();
      return allowed.has(emotion) ? emotion : "idle";
    },

    cleanText(value, maxLength = 1000) {
      return String(value ?? "").trim().slice(0, maxLength);
    },

    safeNumber(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }
  };

  window.AriFastConversation = AriFastConversation;
  window.Ari.fastConversation = AriFastConversation;

  // This script is intentionally loaded after AriRebirthAppBridge.
  AriFastConversation.install();
})();