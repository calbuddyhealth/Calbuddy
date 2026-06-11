// ari/insight-system/ari-insight-hypothesis-engine.js
// Ari Insight Hypothesis Engine
// Purpose: Generate possible explanations when certainty is low.
// V1.1

window.Ari = window.Ari || {};

window.Ari.insightHypothesisEngine = {
  version: "1.1.0",

  generate({
    observation = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {}
  } = {}) {

    const hypotheses = [];

    const add = (
      name,
      confidence,
      explanation,
      evidence = []
    ) => {
      hypotheses.push({
        name,
        confidence,
        explanation,
        evidence
      });
    };

    const pattern = insight.pattern?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const avoidance = insight.avoidance?.name;
    const tradeoff = insight.tradeoff?.name;

    const belief =
      beliefModel.primaryBelief?.name;

    const lifeChapter =
      personModel.lifeChapter?.name;

    const underlyingEmotion =
      emotionalIntelligence.underlyingEmotion?.name;

    //
    // Avoidance
    //

    if (
      avoidance === "known_answer_unwanted_cost"
    ) {
      add(
        "unwanted_cost",
        "medium",
        "The user may already know the answer but may be struggling with the cost of accepting it.",
        [
          "avoidance_detected",
          "known_answer_unwanted_cost"
        ]
      );
    }

    //
    // Achievement
    //

    if (
      pattern === "achievement_before_peace" ||
      belief === "achievement_creates_security"
    ) {
      add(
        "achievement_before_arrival",
        "medium",
        "The user may be postponing peace until after the next achievement.",
        [
          "achievement_pattern",
          "achievement_belief"
        ]
      );
    }

    //
    // Presence
    //

    if (
      pattern === "achievement_before_presence" ||
      tradeoff === "presence_vs_acceleration"
    ) {
      add(
        "presence_must_be_earned",
        "high",
        "The user may believe achievement must be completed before presence is allowed.",
        [
          "presence_tradeoff",
          "achievement_before_presence"
        ]
      );
    }

    //
    // Identity Overload
    //

    if (
      pattern === "too_many_primary_roles"
    ) {
      add(
        "identity_overload",
        "high",
        "Multiple important identities may be competing for primary status.",
        [
          "role_conflict",
          "identity_overload"
        ]
      );
    }

    //
    // Family vs Purpose
    //

    if (
      hiddenConflict === "family_vs_purpose"
    ) {
      add(
        "purpose_abandonment_fear",
        "high",
        "The user may fear that protecting family means abandoning purpose.",
        [
          "family_vs_purpose"
        ]
      );
    }

    //
    // Growth vs Stability
    //

    if (
      hiddenConflict === "growth_vs_stability"
    ) {
      add(
        "growth_requires_instability",
        "medium",
        "The user may believe growth requires sacrificing stability.",
        [
          "growth_vs_stability"
        ]
      );
    }

    //
    // Responsibility
    //

    if (
      pattern === "responsibility_before_recovery"
    ) {
      add(
        "responsibility_before_rest",
        "medium",
        "The user may consistently place responsibility ahead of recovery.",
        [
          "responsibility_pattern"
        ]
      );
    }

    //
    // Hope
    //

    if (
      meaning.theme === "search_for_meaning"
    ) {
      add(
        "hope_for_clarity",
        "low",
        "The user may be searching for a clearer interpretation of their situation.",
        [
          "meaning_search"
        ]
      );
    }

    //
    // Life chapter
    //

    if (
      lifeChapter === "fatherhood_and_transition"
    ) {
      add(
        "identity_reorganization",
        "high",
        "The user's life may be reorganizing around a new chapter.",
        [
          "fatherhood_transition"
        ]
      );
    }

    //
    // Emotion
    //

    if (
      underlyingEmotion === "fear_of_betraying_purpose"
    ) {
      add(
        "purpose_protection",
        "medium",
        "The user may be trying to protect something deeply meaningful.",
        [
          "fear_of_betraying_purpose"
        ]
      );
    }

    hypotheses.sort((a, b) => {
      const rank = {
        high: 3,
        medium: 2,
        low: 1
      };

      return (
        (rank[b.confidence] || 0) -
        (rank[a.confidence] || 0)
      );
    });

    return {
      primaryHypothesis:
        hypotheses[0] || null,
      hypotheses
    };
  }
};