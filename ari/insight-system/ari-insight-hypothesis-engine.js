// ari/insight-system/ari-insight-hypothesis-engine.js
// Ari Insight Hypothesis Engine
// Purpose: Generate possible explanations when certainty is low.
// V1.0

window.Ari = window.Ari || {};

window.Ari.insightHypothesisEngine = {
  version: "1.0.0",

  generate(observation = {}, analysis = {}) {
    const hypotheses = [];

    const text = (
      observation.normalizedMessage ||
      observation.message ||
      ""
    ).toLowerCase();

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

    // Achievement / productivity signals

    if (
      text.includes("career") ||
      text.includes("school") ||
      text.includes("goal") ||
      text.includes("success") ||
      text.includes("achievement") ||
      text.includes("future")
    ) {
      add(
        "achievement_before_arrival",
        "low",
        "You may be postponing peace until after the next achievement.",
        ["achievement_language"]
      );
    }

    // Over-responsibility

    if (
      text.includes("family") ||
      text.includes("provider") ||
      text.includes("responsibility") ||
      text.includes("everyone")
    ) {
      add(
        "responsibility_before_rest",
        "low",
        "You may be carrying responsibilities that leave little room for recovery.",
        ["responsibility_language"]
      );
    }

    // Identity overload

    if (
      text.includes("career") &&
      text.includes("family")
    ) {
      add(
        "too_many_primary_roles",
        "medium",
        "Too many important identities may be competing to be primary.",
        ["multiple_identity_signals"]
      );
    }

    // Fear of slowing down

    if (
      text.includes("behind") ||
      text.includes("slow") ||
      text.includes("delay")
    ) {
      add(
        "slowing_down_equals_loss",
        "low",
        "Part of you may associate slowing down with losing progress.",
        ["delay_language"]
      );
    }

    return {
      primaryHypothesis: hypotheses[0] || null,
      hypotheses
    };
  }
};