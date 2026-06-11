// ari/insight-system/ari-counter-hypothesis-engine.js
// Ari Counter-Hypothesis Engine
// Purpose: Generate alternate explanations so Ari does not lock onto one story too quickly.
// V1.0

window.Ari = window.Ari || {};

window.Ari.counterHypothesisEngine = {
  version: "1.0.0",

  generate({ hypothesis = null, observation = {}, analysis = {} } = {}) {
    if (!hypothesis) {
      return {
        primaryCounterHypothesis: null,
        counterHypotheses: [],
        source: "ari-counter-hypothesis-engine"
      };
    }

    const counters = [];
    const text = (
      observation.normalizedMessage ||
      observation.message ||
      analysis.message ||
      ""
    ).toLowerCase();

    const add = (name, confidence, explanation, evidence = []) => {
      counters.push({
        name,
        confidence,
        explanation,
        evidence
      });
    };

    if (hypothesis.name === "achievement_before_arrival") {
      add(
        "not_avoidance_but_preparation",
        "low",
        "Another possibility is that this is not avoidance. It may be preparation for a major transition.",
        ["achievement hypothesis detected"]
      );

      add(
        "pressure_from_real_responsibility",
        "low",
        "Another possibility is that the pressure is not self-created. The responsibilities may actually be increasing.",
        ["achievement and responsibility may overlap"]
      );
    }

    if (hypothesis.name === "responsibility_before_rest") {
      add(
        "responsibility_is_currently_appropriate",
        "low",
        "Another possibility is that carrying responsibility right now is appropriate, but the load still needs boundaries.",
        ["responsibility hypothesis detected"]
      );
    }

    if (hypothesis.name === "too_many_primary_roles") {
      add(
        "seasonal_intensity_not_identity_overload",
        "low",
        "Another possibility is that this is temporary seasonal intensity, not a permanent identity problem.",
        ["multiple role signals detected"]
      );
    }

    if (hypothesis.name === "slowing_down_equals_loss") {
      add(
        "slowing_down_may_be_strategy",
        "low",
        "Another possibility is that slowing down is not loss. It may be strategic pacing.",
        ["delay or slowing language detected"]
      );
    }

    if (
      text.includes("truth") ||
      text.includes("avoiding") ||
      text.includes("uncomfortable")
    ) {
      add(
        "question_may_be_seeking_depth_not_discovery",
        "low",
        "Another possibility is that the user is not avoiding a truth; they may be asking Ari to help deepen a truth they already sense.",
        ["truth or avoidance prompt detected"]
      );
    }

    return {
      primaryCounterHypothesis: counters[0] || null,
      counterHypotheses: counters,
      source: "ari-counter-hypothesis-engine"
    };
  }
};