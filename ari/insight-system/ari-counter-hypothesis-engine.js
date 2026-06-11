// ari/insight-system/ari-counter-hypothesis-engine.js
// Ari Counter-Hypothesis Engine
// Purpose: Generate alternate explanations so Ari does not lock onto one story too quickly.
// V1.1: Expanded to challenge newer hypothesis types.

window.Ari = window.Ari || {};

window.Ari.counterHypothesisEngine = {
  version: "1.1.0",

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

    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};

    const lifeChapter = personModel.lifeChapter?.name || "";
    const primaryBelief = beliefModel.primaryBelief?.name || "";
    const rootNeed = emotionalIntelligence.rootNeed?.name || "";

    if (hypothesis.name === "unwanted_cost") {
      add(
        "truth_seeking_not_avoidance",
        "low",
        "Another possibility is that the user is not avoiding the truth. They may be trying to understand it more honestly.",
        ["avoidance hypothesis detected"]
      );

      add(
        "language_may_be_exploratory",
        "low",
        "Another possibility is that the prompt is exploratory rather than confessional.",
        ["insight-seeking language detected"]
      );
    }

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

    if (hypothesis.name === "presence_must_be_earned") {
      add(
        "presence_may_need_structure",
        "low",
        "Another possibility is that presence is not being avoided. It may simply need structure because the user's responsibilities are real.",
        ["presence hypothesis detected"]
      );
    }

    if (hypothesis.name === "identity_overload") {
      add(
        "seasonal_intensity_not_identity_overload",
        "low",
        "Another possibility is that this is temporary seasonal intensity, not a permanent identity problem.",
        ["multiple role signals detected"]
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

    if (hypothesis.name === "purpose_abandonment_fear") {
      add(
        "purpose_may_be_changing_form",
        "low",
        "Another possibility is that purpose is not being abandoned. It may be changing form for this season.",
        ["purpose fear hypothesis detected"]
      );
    }

    if (hypothesis.name === "growth_requires_instability") {
      add(
        "stability_can_support_growth",
        "low",
        "Another possibility is that stability is not opposed to growth. It may be the foundation that makes growth sustainable.",
        ["growth versus stability hypothesis detected"]
      );
    }

    if (hypothesis.name === "hope_for_clarity") {
      add(
        "clarity_may_require_action",
        "low",
        "Another possibility is that clarity may not come from more reflection alone. It may require action and feedback.",
        ["meaning search detected"]
      );
    }

    if (hypothesis.name === "identity_reorganization") {
      add(
        "identity_continuity_still_exists",
        "low",
        "Another possibility is that the user's identity is not being replaced. The same core self may be reorganizing around new responsibilities.",
        ["life chapter transition detected"]
      );
    }

    if (hypothesis.name === "purpose_protection") {
      add(
        "purpose_may_need_pacing",
        "low",
        "Another possibility is that purpose does not need more intensity right now. It may need pacing.",
        ["purpose protection detected"]
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

    if (
      meaning.theme === "search_for_meaning" &&
      !counters.some((item) => item.name === "language_may_be_exploratory")
    ) {
      add(
        "meaning_search_not_hidden_problem",
        "low",
        "Another possibility is that there is no hidden problem yet. The user may simply be searching for meaning.",
        ["meaning search detected"]
      );
    }

    if (
      lifeChapter &&
      lifeChapter !== "unclear" &&
      !counters.some((item) => item.name === "seasonal_intensity_not_identity_overload")
    ) {
      add(
        "seasonal_transition_not_character_flaw",
        "low",
        "Another possibility is that the tension is seasonal rather than a flaw in the user's character.",
        ["life chapter detected"]
      );
    }

    if (
      rootNeed === "understanding" &&
      !counters.some((item) => item.name === "language_may_be_exploratory")
    ) {
      add(
        "need_for_understanding_not_avoidance",
        "low",
        "Another possibility is that the user is not avoiding action; they may first need understanding.",
        ["root need is understanding"]
      );
    }

    if (
      primaryBelief &&
      !counters.some((item) => item.name === "belief_may_be_contextual")
    ) {
      add(
        "belief_may_be_contextual",
        "low",
        "Another possibility is that this belief is active only in this context, not across the user's whole life.",
        ["primary belief detected"]
      );
    }

    counters.sort((a, b) => {
      const rank = {
        high: 3,
        medium: 2,
        low: 1
      };

      return (rank[b.confidence] || 0) - (rank[a.confidence] || 0);
    });

    return {
      primaryCounterHypothesis: counters[0] || null,
      counterHypotheses: counters,
      source: "ari-counter-hypothesis-engine"
    };
  }
};