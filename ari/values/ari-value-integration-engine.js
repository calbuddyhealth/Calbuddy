// ari/values/ari-value-integration-engine.js
// Ari Value Integration Engine
// Purpose: Detect shared deeper values underneath apparent conflicts.
// V1.0

window.AriValueIntegrationEngine = {
  integrate(input = {}) {
    const summary = input.summary || input || {};

    const candidates = [];

    const wisdomTension = summary.wisdomTension || null;
    const highestGood = summary.highestGood || null;
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;
    const wisdomSupportingGood = summary.wisdomSupportingGood || null;
    const dominantValue = summary.dominantValue || null;
    const primaryPriority = summary.primaryPriority || null;
    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const protecting = summary.protecting || null;

    const leadIdentity = summary.resolvedLeadIdentity || summary.leadIdentity || null;
    const supportIdentity = summary.resolvedSupportingIdentity || null;
    const rankedIdentities = Array.isArray(summary.rankedIdentities)
      ? summary.rankedIdentities
      : [];

    const lifeSignals = Array.isArray(summary.lifeSignals) ? summary.lifeSignals : [];
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;

    function addValue(name, score, reason, serves = []) {
      if (!name) return;

      const existing = candidates.find(v => v.name === name);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        serves.forEach(item => {
          if (item && !existing.serves.includes(item)) existing.serves.push(item);
        });
        return;
      }

      candidates.push({
        name,
        score,
        reasons: [reason],
        serves: serves.filter(Boolean)
      });
    }

    const identityValueMap = {
      father: ["love", "presence", "stewardship", "protection"],
      husband: ["love", "commitment", "relationship", "presence"],
      "family-protector": ["love", "protection", "stability", "belonging"],
      builder: ["purpose", "meaning", "contribution", "growth"],
      creator: ["purpose", "meaning", "expression", "contribution"],
      planner: ["clarity", "stability", "responsibility"],
      steward: ["responsibility", "care", "stability", "protection"],
      nurse: ["service", "care", "protection"],
      caregiver: ["service", "care", "love"],
      teacher: ["understanding", "growth", "wisdom"],
      observer: ["understanding", "clarity", "humility"],
      "present-self": ["presence", "love", "peace"],
      "emerging-self": ["growth", "integration", "meaning"]
    };

    function addValuesFromIdentity(identity, baseScore, reasonPrefix) {
      const values = identityValueMap[identity] || [];

      values.forEach(value => {
        addValue(
          value,
          baseScore,
          `${reasonPrefix} '${identity}' protects '${value}'.`,
          [identity]
        );
      });
    }

    if (leadIdentity) {
      addValuesFromIdentity(leadIdentity, 28, "Lead identity");
    }

    if (supportIdentity) {
      addValuesFromIdentity(supportIdentity, 22, "Supporting identity");
    }

    rankedIdentities.forEach(identity => {
      if (!identity || !identity.name) return;
      addValuesFromIdentity(
        identity.name,
        Math.max(8, Math.round((identity.score || 40) * 0.12)),
        "Ranked identity"
      );
    });

    // Direct value signals
    [
      dominantValue,
      primaryPriority,
      rootNeed,
      protecting,
      highestGood,
      wisdomLeadingGood,
      wisdomSupportingGood
    ].forEach(value => {
      if (!value) return;

      const normalized = String(value)
        .replace("protect_", "")
        .replace("_", "-");

      addValue(
        normalized,
        24,
        `Direct value signal '${value}' was detected.`,
        ["direct_signal"]
      );
    });

    // Life signal mapping
    const lifeValueMap = {
      fatherhood_transition: ["love", "presence", "stewardship", "protection"],
      family_transition: ["love", "belonging", "stability", "presence"],
      marriage_transition: ["commitment", "relationship", "love"],
      creative_mission: ["purpose", "meaning", "contribution", "growth"],
      purpose_signal: ["purpose", "meaning", "contribution"],
      identity_transition: ["growth", "integration", "meaning"],
      career_transition: ["stability", "responsibility", "future"],
      builder_development: ["purpose", "growth", "contribution"],
      planner_development: ["clarity", "responsibility", "stability"]
    };

    const lifeKeys = [primaryLifeSignal, ...lifeSignals].filter(Boolean);

    lifeKeys.forEach(signal => {
      const values = lifeValueMap[signal] || [];

      values.forEach(value => {
        addValue(
          value,
          24,
          `Life signal '${signal}' points toward '${value}'.`,
          [signal]
        );
      });
    });

    // Emotion mapping
    const emotionValueMap = {
      stewardship: ["responsibility", "care", "protection"],
      responsibility: ["stability", "care", "protection"],
      curiosity: ["understanding", "growth", "clarity"],
      wonder: ["meaning", "growth", "understanding"],
      hope: ["future", "meaning", "possibility"],
      concern: ["care", "protection"],
      fear: ["safety", "protection"],
      guilt: ["repair", "relationship"],
      grief: ["love", "loss", "meaning"],
      determination: ["purpose", "discipline", "future"]
    };

    const emotionValues = emotionValueMap[primaryEmotion] || [];

    emotionValues.forEach(value => {
      addValue(
        value,
        18,
        `Primary emotion '${primaryEmotion}' points toward '${value}'.`,
        [primaryEmotion]
      );
    });

    // Tension-specific integration
    let apparentConflict = wisdomTension || "none_detected";
    let integratedValue = null;
    let integrationStatement = null;
    let integrationQuestion = "What deeper good are both sides trying to protect?";

    if (wisdomTension === "family_vs_purpose") {
      apparentConflict = "family_vs_purpose";
      integratedValue = "meaningful_love";
      integrationStatement =
        "Family and purpose may not be enemies. Both may be trying to protect a meaningful life rooted in love, service, and contribution.";
      integrationQuestion =
        "How can your purpose serve your family instead of competing with it?";

      addValue("love", 36, "Family side of the tension protects love.", ["family"]);
      addValue("purpose", 36, "Purpose side of the tension protects meaning.", ["purpose"]);
      addValue("contribution", 28, "Purpose often points toward contribution.", ["purpose"]);
      addValue("stewardship", 28, "Both family and purpose require stewardship.", ["family", "purpose"]);
    }

    if (wisdomTension === "presence_vs_achievement") {
      apparentConflict = "presence_vs_achievement";
      integratedValue = "meaningful_presence";
      integrationStatement =
        "Presence and achievement may not be enemies. Achievement should create a life worth being present for, not replace presence itself.";
      integrationQuestion =
        "What achievement would actually deepen presence instead of stealing from it?";

      addValue("presence", 36, "Presence side of the tension protects irreplaceable moments.", ["presence"]);
      addValue("purpose", 28, "Achievement side may protect purpose.", ["achievement"]);
      addValue("love", 28, "Presence often protects love.", ["presence"]);
      addValue("meaning", 28, "Healthy achievement should protect meaning.", ["achievement"]);
    }

    if (wisdomTension === "certainty_vs_growth") {
      apparentConflict = "certainty_vs_growth";
      integratedValue = "secure_growth";
      integrationStatement =
        "Certainty and growth may both be trying to create safety. The deeper need may be secure movement, not perfect predictability.";
      integrationQuestion =
        "What would make growth feel safe enough without needing full certainty?";

      addValue("safety", 34, "Certainty often protects safety.", ["certainty"]);
      addValue("growth", 34, "Growth protects becoming.", ["growth"]);
      addValue("trust", 26, "Secure growth requires trust.", ["certainty", "growth"]);
    }

    // If no explicit tension exists, infer integration from top values.
    candidates.sort((a, b) => b.score - a.score);

    const topValues = candidates.slice(0, 5);

    if (!integratedValue && topValues.length > 0) {
      integratedValue = topValues[0].name;

      integrationStatement =
        `The strongest deeper value appears to be '${integratedValue}'. Ari should ask how the active identities can serve that value together.`;

      integrationQuestion =
        `How can the active parts of you serve '${integratedValue}' together instead of competing?`;
    }

    const sharedValues = candidates.filter(value => value.serves.length > 1);

    const hasIntegration =
      Boolean(integratedValue) ||
      Boolean(sharedValues.length) ||
      apparentConflict !== "none_detected";

    return {
      valueIntegrationDetected: hasIntegration,
      apparentConflict,
      integratedValue,
      integrationStatement,
      valueIntegrationQuestion: integrationQuestion,

      topValues: topValues.map(value => ({
        name: value.name,
        score: value.score,
        serves: value.serves,
        reasons: value.reasons
      })),

      sharedValues: sharedValues.map(value => ({
        name: value.name,
        score: value.score,
        serves: value.serves,
        reasons: value.reasons
      })),

      rankedValues: candidates.map(value => ({
        name: value.name,
        score: value.score,
        serves: value.serves,
        reasons: value.reasons
      })),

      source: "ari-value-integration-engine"
    };
  }
};