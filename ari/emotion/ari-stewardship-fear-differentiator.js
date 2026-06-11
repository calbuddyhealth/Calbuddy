// ari/emotion/ari-stewardship-fear-differentiator.js
// Ari Stewardship vs Fear Differentiator
// Purpose: Prevent responsibility from being misclassified as fear.
// V1.0

window.AriStewardshipFearDifferentiator = {
  evaluate(input = {}) {
    const summary = input.summary || input || {};

    const strongestSignal = summary.strongestSignal || null;
    const lifeSignals = summary.lifeSignals || [];
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const highestGood = summary.highestGood || null;
    const protecting = summary.protecting || null;
    const primaryPriority = summary.primaryPriority || null;
    const rootNeed = summary.rootNeed || null;

    let stewardshipScore = 0;
    let fearScore = 0;

    const stewardshipSignals = [
      "fatherhood_transition",
      "family_transition",
      "protect_family",
      "stewardship",
      "responsibility",
      "care",
      "commitment",
      "service",
      "future_planning",
      "purpose_signal"
    ];

    const fearSignals = [
      "fear",
      "panic",
      "catastrophe",
      "danger",
      "threat",
      "loss",
      "abandonment"
    ];

    const allSignals = [
      strongestSignal,
      primaryLifeSignal,
      dominantIdentity,
      highestGood,
      protecting,
      primaryPriority,
      rootNeed,
      ...lifeSignals
    ]
      .filter(Boolean)
      .map(v => String(v).toLowerCase());

    allSignals.forEach(signal => {

      stewardshipSignals.forEach(keyword => {
        if (signal.includes(keyword)) stewardshipScore += 10;
      });

      fearSignals.forEach(keyword => {
        if (signal.includes(keyword)) fearScore += 10;
      });

    });

    let emotionalClassification = "unclear";
    let confidence = 60;
    let explanation = "Not enough evidence.";

    if (stewardshipScore >= fearScore + 15) {

      emotionalClassification = "stewardship";

      confidence = 88;

      explanation =
        "The dominant pattern appears to be responsibility, protection, preparation, or care rather than fear.";

    }
    else if (fearScore >= stewardshipScore + 15) {

      emotionalClassification = "fear";

      confidence = 88;

      explanation =
        "The dominant pattern appears to be fear, threat detection, or anticipated loss.";

    }
    else {

      emotionalClassification = "mixed";

      confidence = 72;

      explanation =
        "Both stewardship and fear signals are present.";
    }

    return {
      emotionalClassification,
      stewardshipScore,
      fearScore,
      confidence,
      explanation,
      source: "ari-stewardship-fear-differentiator"
    };
  }
};