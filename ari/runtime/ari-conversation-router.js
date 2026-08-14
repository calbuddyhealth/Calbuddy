// =====================================================
// ARI EXPERIENCE
// File: ari/runtime/ari-conversation-router.js
// Version: 1.0.3
// Purpose:
//   Decide whether a turn can use Ari's fast conversational lane or should
//   fall back to the full Rebirth runtime.
//
// V1.0.3:
//   - Meal write requests using pronouns such as "log that" now route deep
//     when the same turn clearly contains eating/food context.
//   - Prevents fast plain-text calorie replies from being reconstructed into
//     malformed meal names or zero-macro meal records.
//
// Design goals:
//   - Conversation first.
//   - Deep reasoning only when earned.
//   - Never bypass app actions, owner/developer routing, or high-stakes work.
//   - Preserve high-stakes context across short follow-up turns.
//   - Keep normal fitness, nutrition, and app-data conversation fast.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const FAST = "fast";
  const DEEP = "deep";

  const HIGH_STAKES_PATTERNS = [
    /\b(suicid(?:e|al)|self[- ]?harm|kill myself|hurt myself|overdose|poison(?:ing|ed)?)\b/i,
    /\b(chest pain|stroke|seizure|difficulty breathing|can['’]?t breathe|severe bleeding|unconscious|passed out)\b/i,
    /\b(pregnan(?:t|cy)|miscarriage|fetal|fetus|trimester|breastfeeding)\b/i,
    /\b(medication|medicine|prescription|dose|dosage|mg\b|milligram|drug interaction|side effect)\b/i,
    /\b(diagnos(?:e|is)|symptom|blood pressure|heart rate|infection|fever|injury|pain)\b/i,
    /\b(lawyer|legal advice|lawsuit|court order|criminal charge|immigration status|visa denial)\b/i,
    /\b(invest(?:ment|ing)|stock market|stock price|stocks|shares?|equities|crypto|tax advice|bankruptcy|mortgage rate|loan decision)\b/i
  ];

  const ACTION_PATTERNS = [
    /\b(log|add|save|delete|remove|clear|update|change|set|edit|submit|create)\b.{0,45}\b(meal|food|weight|workout|exercise|goal|profile|calorie|macro|account|week|plan)\b/i,
    /\b(meal|food|breakfast|lunch|dinner|snack|calories?|kcal|macros?|protein|carbs?|fat)\b.{0,90}\b(log|add|save|track|record|edit|delete|remove|change|replace)\b/i,
    /\b(i ate|i had|i drank|just ate|just had|just drank|ate a|ate an|had a|had an)\b[\s\S]{0,220}\b(log|add|save|track|record)\b(?:\s+(?:that|it|this))?/i,
    /\b(log|add|save|track|record)\b\s+(?:that|it|this)\b[\s\S]{0,140}\b(meal|food|breakfast|lunch|dinner|snack|calories?|macros?|protein|carbs?|fat)\b/i,
    /\b(remind me|schedule|book|reserve|send|email|upload|download)\b/i
  ];

  const DEVELOPER_PATTERNS = [
    /\b(github|repo|repository|branch|commit|pull request|\bpr\b|vercel|supabase|deploy|deployment|pipeline|runtime|api endpoint)\b/i,
    /\b(debug|refactor|patch|implement|code review|stack trace|console error|syntax error)\b/i,
    /\b[\w./-]+\.(?:js|mjs|cjs|ts|tsx|jsx|html|css|json|sql|md)\b/i,
    /```[\s\S]*```/
  ];

  const FRESH_INFO_PATTERNS = [
    /\b(latest|right now|breaking|news|live score|weather|forecast|stock price|exchange rate)\b/i,
    /\b(who is the (?:current )?(?:president|ceo|governor|mayor|secretary))\b/i
  ];

  const COMPLEX_TASK_PATTERNS = [
    /\b(deep dive|comprehensive analysis|root cause analysis|architecture review|threat model|migration plan)\b/i,
    /\b(write|draft|rewrite)\b.{0,30}\b(contract|policy|legal|medical|clinical|production code)\b/i
  ];

  const FOLLOW_UP_PATTERN =
    /^(why|why\?|how|how so|what about|and|but|really|you sure|are you sure|what do you mean|explain|tell me more|hmm|hm|okay|ok|yeah|yes|no|nope|lol|haha)[?.!\s\w'-]*$/i;

  const AriConversationRouter = {
    version: "1.0.3",
    source: "ari-conversation-router",

    decide(message = "", options = {}) {
      const text = String(message || "").trim();
      const recentHistoryText = this.readRecentHistory(options.history);
      const looksLikeFollowUp = text.length <= 160 && FOLLOW_UP_PATTERN.test(text);

      const decision = {
        mode: FAST,
        reason: "ordinary_conversation",
        source: this.source,
        version: this.version,
        confidence: "high"
      };

      if (!text) {
        return { ...decision, mode: DEEP, reason: "empty_message" };
      }

      if (options.forceDeep === true || options.runtimeMode === DEEP) {
        return { ...decision, mode: DEEP, reason: "forced_deep" };
      }

      if (options.forceFast === true || options.runtimeMode === FAST) {
        return { ...decision, mode: FAST, reason: "forced_fast" };
      }

      if (DEVELOPER_PATTERNS.some((pattern) => pattern.test(text))) {
        return { ...decision, mode: DEEP, reason: "developer_or_code_task" };
      }

      if (ACTION_PATTERNS.some((pattern) => pattern.test(text))) {
        return { ...decision, mode: DEEP, reason: "application_action_or_write" };
      }

      if (HIGH_STAKES_PATTERNS.some((pattern) => pattern.test(text))) {
        return { ...decision, mode: DEEP, reason: "high_stakes_topic" };
      }

      if (
        looksLikeFollowUp &&
        HIGH_STAKES_PATTERNS.some((pattern) => pattern.test(recentHistoryText))
      ) {
        return { ...decision, mode: DEEP, reason: "high_stakes_follow_up" };
      }

      if (FRESH_INFO_PATTERNS.some((pattern) => pattern.test(text))) {
        return { ...decision, mode: DEEP, reason: "fresh_information_required" };
      }

      if (COMPLEX_TASK_PATTERNS.some((pattern) => pattern.test(text))) {
        return { ...decision, mode: DEEP, reason: "complex_task" };
      }

      if (text.length > 1400) {
        return { ...decision, mode: DEEP, reason: "large_input" };
      }

      if (looksLikeFollowUp) {
        return { ...decision, mode: FAST, reason: "conversational_follow_up" };
      }

      return decision;
    },

    readRecentHistory(history = []) {
      if (!Array.isArray(history)) return "";

      return history
        .slice(-4)
        .map((item) => String(item?.content || "").trim())
        .filter(Boolean)
        .join("\n")
        .slice(-5000);
    },

    shouldUseFast(message = "", options = {}) {
      return this.decide(message, options).mode === FAST;
    }
  };

  window.AriConversationRouter = AriConversationRouter;
  window.Ari.conversationRouter = AriConversationRouter;

  console.log("ARI CONVERSATION ROUTER LOADED:", AriConversationRouter.version);
})();
