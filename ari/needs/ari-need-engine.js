// ari/needs/ari-need-engine.js
// Ari Need Engine
// Purpose: Identify the user's dominant human need before Ari chooses wisdom, meaning, emotion, or action.
// Inspired by Maslow, adapted for Ari Rebirth.
// V1.0

window.Ari = window.Ari || {};

window.Ari.needEngine = {
  version: "1.0.0",

  evaluate(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      ""
    ).toLowerCase();

    const needs = [];

    const add = (name, score, reason, leadOrgan, responseMode) => {
      needs.push({
        name,
        score,
        reason,
        leadOrgan,
        responseMode
      });
    };

    const has = (phrases = []) => phrases.some((p) => text.includes(p));

    // 1. Survival / body needs
    if (
      has([
        "haven't slept",
        "have not slept",
        "can't sleep",
        "cannot sleep",
        "hungry",
        "starving",
        "dehydrated",
        "can't eat",
        "cannot eat",
        "exhausted",
        "severe pain"
      ])
    ) {
      add(
        "survival",
        100,
        "Body-level need detected: sleep, food, hydration, pain, or exhaustion.",
        "safety",
        "stabilize_body_first"
      );
    }

    // 2. Safety
    if (
      has([
        "unsafe",
        "danger",
        "emergency",
        "pregnant",
        "severe pain",
        "bleeding",
        "hurt myself",
        "kill myself",
        "suicidal",
        "scared for my safety",
        "panic"
      ])
    ) {
      add(
        "safety",
        98,
        "Safety need detected.",
        "safety",
        "protect_safety_first"
      );
    }

    // 3. Connection / belonging
    if (
      has([
        "alone",
        "lonely",
        "nobody cares",
        "no one cares",
        "left out",
        "ignored",
        "abandoned",
        "unloved",
        "disconnected"
      ])
    ) {
      add(
        "connection",
        90,
        "Connection or belonging need detected.",
        "emotion",
        "emotional_connection"
      );
    }

    // 4. Esteem / respect / worth
    if (
      has([
        "nobody respects me",
        "no one respects me",
        "disrespected",
        "worthless",
        "not good enough",
        "i failed",
        "failure",
        "embarrassed",
        "ashamed",
        "humiliated",
        "look down on me"
      ])
    ) {
      add(
        "esteem",
        88,
        "Esteem, respect, or self-worth need detected.",
        "emotion",
        "restore_dignity"
      );
    }

    // 5. Stability / responsibility
    if (
      has([
        "rent",
        "money",
        "bills",
        "job",
        "career",
        "provider",
        "responsibility",
        "family needs",
        "baby coming",
        "pregnancy",
        "marriage"
      ])
    ) {
      add(
        "stability",
        82,
        "Stability and responsibility need detected.",
        "executive",
        "protect_stability"
      );
    }

    // 6. Growth
    if (
      has([
        "better",
        "improve",
        "grow",
        "learn",
        "develop",
        "become",
        "discipline",
        "habit",
        "goal"
      ])
    ) {
      add(
        "growth",
        78,
        "Growth or development need detected.",
        "identity",
        "support_growth"
      );
    }

    // 7. Meaning / purpose
    if (
      has([
        "meaning",
        "purpose",
        "what am i supposed to do",
        "why am i here",
        "mission",
        "calling",
        "legacy",
        "build something great",
        "life"
      ])
    ) {
      add(
        "meaning",
        76,
        "Meaning or purpose need detected.",
        "meaning",
        "clarify_meaning"
      );
    }

    if (!needs.length) {
      add(
        "understanding",
        55,
        "No strong need detected. Defaulting to understanding.",
        "observer",
        "continue_observing"
      );
    }

    needs.sort((a, b) => b.score - a.score);

    const primaryNeed = needs[0];

    return {
      needEngineRan: true,
      needEngineSource: "ari-need-engine",
      primaryHumanNeed: primaryNeed.name,
      primaryHumanNeedScore: primaryNeed.score,
      primaryHumanNeedReason: primaryNeed.reason,
      needRecommendedLeadOrgan: primaryNeed.leadOrgan,
      needResponseMode: primaryNeed.responseMode,
      rankedHumanNeeds: needs
    };
  }
};