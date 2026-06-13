// ari/emotion/ari-stewardship-fear-differentiator.js
// Ari Stewardship vs Fear Differentiator
// Purpose: Prevent responsibility, protection, care, and preparation from being misclassified as fear.
// V2.0

window.AriStewardshipFearDifferentiator = {
  version: "2.0.0",

  evaluate(input = {}) {
    const summary = input.summary || input || {};

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const strongestSignal = summary.strongestSignal || null;
    const lifeSignals = Array.isArray(summary.lifeSignals) ? summary.lifeSignals : [];
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryWeightedLifeSignal = summary.primaryWeightedLifeSignal || null;
    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const lifeChapter = summary.lifeChapter || null;

    const dominantIdentity = summary.dominantIdentity || null;
    const leadIdentity = summary.resolvedLeadIdentity || summary.leadIdentity || null;

    const highestGood = summary.highestGood || null;
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;
    const wisdomSupportingGood = summary.wisdomSupportingGood || null;
    const integratedValue = summary.integratedValue || null;
    const protecting = summary.protecting || null;

    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

    const rootNeed = summary.rootNeed || summary.primaryNeed || summary.primaryHumanNeed || null;
    const needResponseMode = summary.needResponseMode || null;

    const surfaceEmotion = summary.surfaceEmotion || null;
    const primaryEmotion = summary.primaryEmotion || null;
    const underlyingEmotion =
      summary.underlyingEmotion ||
      summary.underlyingEmotionDepth ||
      summary.primaryUnderlyingEmotion ||
      null;

    const organismNeed = summary.organismNeed || null;
    const organismFunction = summary.organismFunction || summary.organismPrimaryFunction || null;
    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismUrgencyLevel = summary.organismUrgency?.level || summary.organismUrgencyLevel || null;

    let stewardshipScore = 0;
    let fearScore = 0;
    const stewardshipReasons = [];
    const fearReasons = [];

    const stewardshipSignals = [
      "stewardship",
      "stewardship_chapter",
      "family_parenthood_chapter",
      "fatherhood_transition",
      "motherhood_transition",
      "parenthood_transition",
      "family_transition",
      "protect_family",
      "responsibility",
      "provision",
      "provide",
      "care",
      "caregiving",
      "protector",
      "protection",
      "commitment",
      "service",
      "future_planning",
      "purpose_signal",
      "presence",
      "family",
      "parent",
      "partner",
      "duty",
      "entrusted",
      "depend"
    ];

    const fearSignals = [
      "fear",
      "panic",
      "anxiety",
      "catastrophe",
      "danger",
      "threat",
      "loss",
      "abandonment",
      "rejection",
      "unsafe",
      "body_health_chapter",
      "relationship_rupture_chapter",
      "capacity_burnout_chapter",
      "meaning_crisis_chapter",
      "fear_of_failing_family",
      "fear_of_being_irresponsible",
      "fear_of_missing_irreplaceable_moments",
      "fear_of_collapse_if_capacity_is_ignored",
      "fear_of_wrong_direction",
      "fear_of_not_being_enough",
      "fear_of_being_unwanted"
    ];

    const bodySafetySignals = [
      "body",
      "security",
      "safety",
      "urgent_safety",
      "stabilize_body_first",
      "body_stabilization",
      "energy_intake",
      "hydration",
      "rest_recovery",
      "injury_protection",
      "vital_stability",
      "pain_protection"
    ];

    const allSignals = [
      strongestSignal,
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      primaryLifeChapter,
      lifeChapter,
      dominantIdentity,
      leadIdentity,
      highestGood,
      wisdomLeadingGood,
      wisdomSupportingGood,
      integratedValue,
      protecting,
      primaryPriority,
      rootNeed,
      needResponseMode,
      surfaceEmotion,
      primaryEmotion,
      underlyingEmotion,
      organismNeed,
      organismFunction,
      ...lifeSignals
    ]
      .filter(Boolean)
      .map(value => this.normalize(value));

    allSignals.forEach(signal => {
      stewardshipSignals.forEach(keyword => {
        if (signal.includes(keyword)) {
          stewardshipScore += 10;
          stewardshipReasons.push(`Stewardship signal '${keyword}' found in '${signal}'.`);
        }
      });

      fearSignals.forEach(keyword => {
        if (signal.includes(keyword)) {
          fearScore += 10;
          fearReasons.push(`Fear signal '${keyword}' found in '${signal}'.`);
        }
      });

      bodySafetySignals.forEach(keyword => {
        if (signal.includes(keyword)) {
          fearScore += 8;
          fearReasons.push(`Body/safety signal '${keyword}' found in '${signal}'.`);
        }
      });
    });

    if (
      this.containsAny(text, [
        "i need to protect",
        "i have to protect",
        "they depend on me",
        "depend on me",
        "provide for",
        "take care of",
        "responsible for",
        "my responsibility",
        "i need to be there",
        "i want to be present",
        "i don't want to miss",
        "i dont want to miss"
      ])
    ) {
      stewardshipScore += 25;
      stewardshipReasons.push("Text indicates protection, provision, responsibility, or presence.");
    }

    if (
      this.containsAny(text, [
        "panic",
        "terrified",
        "i'm scared",
        "im scared",
        "afraid",
        "what if",
        "catastrophe",
        "unsafe",
        "danger",
        "left me",
        "abandoned",
        "rejected",
        "can't breathe",
        "cant breathe"
      ])
    ) {
      fearScore += 25;
      fearReasons.push("Text indicates fear, threat, danger, rejection, or panic.");
    }

    if (
      primaryLifeChapter === "stewardship_chapter" ||
      primaryLifeChapter === "family_parenthood_chapter" ||
      leadIdentity === "steward" ||
      leadIdentity === "family-protector" ||
      integratedValue === "responsibility" ||
      protecting === "responsibility" ||
      protecting === "family"
    ) {
      stewardshipScore += 20;
      stewardshipReasons.push("Life chapter, lead identity, or protected value supports stewardship.");
    }

    if (
      organismNeedsStabilization ||
      organismUrgencyLevel === "critical" ||
      organismUrgencyLevel === "high" ||
      primaryLifeChapter === "body_health_chapter" ||
      needResponseMode === "stabilize_body_first"
    ) {
      fearScore += 25;
      fearReasons.push("Body or organism stabilization signal supports safety/fear classification.");
    }

    let emotionalClassification = "unclear";
    let confidence = 60;
    let explanation = "Not enough evidence.";
    let recommendedMode = "observe";
    let shouldOverrideFear = false;

    if (organismNeedsStabilization || organismUrgencyLevel === "critical") {
      emotionalClassification = "body_stabilization";
      confidence = 95;
      recommendedMode = "stabilize_body_first";
      explanation =
        "A body or organism stabilization signal is active. Ari should stabilize before interpreting emotion.";
    } else if (stewardshipScore >= fearScore + 15) {
      emotionalClassification = "stewardship";
      confidence = 90;
      recommendedMode = "support_stewardship";
      shouldOverrideFear = true;
      explanation =
        "The dominant pattern appears to be responsibility, protection, preparation, care, or stewardship rather than fear.";
    } else if (fearScore >= stewardshipScore + 15) {
      emotionalClassification = "fear";
      confidence = 88;
      recommendedMode = "name_and_regulate_fear";
      explanation =
        "The dominant pattern appears to be fear, threat detection, anticipated loss, or safety concern.";
    } else if (stewardshipScore > 0 && fearScore > 0) {
      emotionalClassification = "mixed";
      confidence = 76;
      recommendedMode = "separate_stewardship_from_fear";
      explanation =
        "Both stewardship and fear signals are present. Ari should separate responsible care from threat reaction.";
    }

    return {
      emotionalClassification,
      stewardshipScore,
      fearScore,
      confidence,
      explanation,
      recommendedMode,
      shouldOverrideFear,

      stewardshipReasons: [...new Set(stewardshipReasons)].slice(0, 10),
      fearReasons: [...new Set(fearReasons)].slice(0, 10),

      stewardshipFearVersion: this.version,
      source: "ari-stewardship-fear-differentiator"
    };
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  containsAny(text = "", phrases = []) {
    return phrases.some(phrase => text.includes(phrase));
  }
};