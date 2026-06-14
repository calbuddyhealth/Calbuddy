// ari/values/ari-value-integration-engine.js
// Ari Value Integration Engine
// Purpose: Detect shared deeper values underneath apparent conflicts.
// V1.2
// Fixes:
// - Prevents simple teaching requests from creating fake value-integration conflicts.
// - Only integrates values when there is a real conflict, wisdom/tradeoff need, or multi-source value tension.
// - Keeps value detection available without forcing valueIntegrationDetected = true.
// - Deduplicates shared values more safely.

window.AriValueIntegrationEngine = {
  version: "1.2.0",

  integrate(input = {}) {
    const summary = input.summary || input || {};
    const candidates = [];

    const domainLead = summary.domainLead || null;
    const domainMode = summary.domainMode || null;
    const responseIntent = summary.responseIntent || null;

    const directTeachingActive =
      domainLead === "knowledge_teaching_domain" ||
      domainMode === "teach_clearly" ||
      responseIntent === "teach_clearly" ||
      summary.shouldPreferTeaching === true;

    const wisdomTension = summary.wisdomTension || null;
    const highestGood = summary.highestGood || null;
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;
    const wisdomSupportingGood = summary.wisdomSupportingGood || null;
    const dominantValue = summary.dominantValue || null;

    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const secondaryHumanNeed = summary.secondaryHumanNeed || null;
    const needResponseMode = summary.needResponseMode || null;
    const protecting = summary.protecting || null;

    const leadIdentity = summary.resolvedLeadIdentity || summary.leadIdentity || null;
    const supportIdentity = summary.resolvedSupportingIdentity || null;

    const rankedIdentities = Array.isArray(summary.rankedIdentities)
      ? summary.rankedIdentities
      : [];

    const lifeSignals = Array.isArray(summary.lifeSignals) ? summary.lifeSignals : [];
    const rankedLifeSignals = Array.isArray(summary.rankedLifeSignals)
      ? summary.rankedLifeSignals
      : [];

    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryWeightedLifeSignal = summary.primaryWeightedLifeSignal || null;
    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;
    const underlyingEmotion = summary.underlyingEmotion || null;

    const organismFunction =
      summary.organismPrimaryFunction ||
      summary.organismFunction ||
      null;

    const organismNeed = summary.organismNeed || null;

    const rankedSignals = Array.isArray(summary.rankedSignals)
      ? summary.rankedSignals
      : [];

    const rankedSalience = Array.isArray(summary.rankedSalience)
      ? summary.rankedSalience
      : [];

    function normalizeKey(value = "") {
      return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
    }

    function displayValue(value = "") {
      return normalizeKey(value);
    }

    function cap(value, max = 120) {
      return Math.min(Number(value || 0), max);
    }

    function addValue(name, score, reason, serves = []) {
      if (!name) return;

      const normalizedName = displayValue(name);
      const existing = candidates.find(v => v.name === normalizedName);
      const safeScore = Number(score || 0);

      if (existing) {
        if (reason && !existing.reasons.includes(reason)) {
          existing.score += safeScore;
          existing.reasons.push(reason);
        }

        serves.forEach(item => {
          const normalizedServe = displayValue(item);
          if (normalizedServe && !existing.serves.includes(normalizedServe)) {
            existing.serves.push(normalizedServe);
          }
        });

        existing.score = cap(existing.score);
        return;
      }

      candidates.push({
        name: normalizedName,
        score: cap(safeScore),
        reasons: reason ? [reason] : [],
        serves: serves.map(displayValue).filter(Boolean)
      });
    }

    function addValues(values = [], score = 16, reasonPrefix = "Signal", serves = []) {
      values.forEach(value => {
        addValue(value, score, `${reasonPrefix} points toward '${value}'.`, serves);
      });
    }

    const identityValueMap = {
      father: ["love", "presence", "stewardship", "protection"],
      mother: ["love", "presence", "stewardship", "protection"],
      parent: ["love", "presence", "stewardship", "protection"],
      husband: ["love", "commitment", "relationship", "presence"],
      wife: ["love", "commitment", "relationship", "presence"],
      spouse: ["love", "commitment", "relationship", "presence"],
      partner: ["love", "commitment", "relationship", "presence"],
      family_protector: ["love", "protection", "stability", "belonging"],
      builder: ["purpose", "meaning", "contribution", "growth"],
      creator: ["purpose", "meaning", "expression", "contribution"],
      planner: ["clarity", "stability", "responsibility"],
      steward: ["responsibility", "care", "stability", "protection"],
      nurse: ["service", "care", "protection"],
      caregiver: ["service", "care", "love"],
      teacher: ["understanding", "growth", "wisdom"],
      observer: ["understanding", "clarity", "humility"],
      present_self: ["presence", "love", "peace"],
      emerging_self: ["growth", "integration", "meaning"],
      protector: ["safety", "protection", "stability"],
      leader: ["responsibility", "clarity", "service"],
      survivor: ["safety", "dignity", "stability"],
      advocate: ["justice", "truth", "dignity"],
      healer: ["repair", "care", "wholeness"]
    };

    function addValuesFromIdentity(identity, baseScore, reasonPrefix) {
      const key = normalizeKey(identity);
      const values = identityValueMap[key] || [];

      values.forEach(value => {
        addValue(
          value,
          baseScore,
          `${reasonPrefix} '${identity}' protects '${value}'.`,
          [identity]
        );
      });
    }

    if (leadIdentity) addValuesFromIdentity(leadIdentity, 28, "Lead identity");
    if (supportIdentity) addValuesFromIdentity(supportIdentity, 22, "Supporting identity");

    rankedIdentities.forEach(identity => {
      if (!identity || !identity.name) return;

      addValuesFromIdentity(
        identity.name,
        Math.max(8, Math.round((identity.score || 40) * 0.12)),
        "Ranked identity"
      );
    });

    const directValueMap = {
      body: ["health", "stability", "survival"],
      safety: ["safety", "protection", "stability"],
      connection: ["belonging", "love", "attachment"],
      belonging: ["belonging", "connection", "love"],
      worth: ["dignity", "self_worth", "respect"],
      esteem: ["dignity", "competence", "respect"],
      identity: ["integration", "selfhood", "clarity"],
      understanding: ["clarity", "truth", "understanding"],
      clarity: ["clarity", "truth", "direction"],
      family: ["love", "belonging", "presence"],
      purpose: ["purpose", "meaning", "contribution"],
      stability: ["stability", "security", "responsibility"],
      growth: ["growth", "becoming", "possibility"],
      freedom: ["freedom", "agency", "self_direction"],
      responsibility: ["responsibility", "stewardship", "care"],
      truth: ["truth", "honesty", "clarity"],
      peace: ["peace", "stability", "non_harm"],
      justice: ["justice", "dignity", "truth"],
      health: ["health", "stability", "survival"]
    };

    [
      dominantValue,
      primaryPriority,
      rootNeed,
      primaryHumanNeed,
      secondaryHumanNeed,
      protecting,
      highestGood,
      wisdomLeadingGood,
      wisdomSupportingGood,
      organismNeed,
      needResponseMode
    ].forEach(value => {
      if (!value) return;

      const normalized = normalizeKey(value).replace(/^protect_/, "");

      addValue(
        normalized,
        20,
        `Direct value signal '${value}' was detected.`,
        ["direct_signal"]
      );

      if (directValueMap[normalized]) {
        addValues(
          directValueMap[normalized],
          14,
          `Direct value signal '${value}'`,
          ["direct_signal"]
        );
      }
    });

    const lifeValueMap = {
      fatherhood_transition: ["love", "presence", "stewardship", "protection"],
      motherhood_transition: ["love", "presence", "stewardship", "protection"],
      parenthood_transition: ["love", "presence", "stewardship", "protection"],
      family_transition: ["love", "belonging", "stability", "presence"],
      relationship_rupture_chapter: ["connection", "dignity", "repair", "emotional_stability"],
      marriage_transition: ["commitment", "relationship", "love", "communication"],
      creative_mission: ["purpose", "meaning", "contribution", "growth"],
      purpose_signal: ["purpose", "meaning", "contribution"],
      identity_transition: ["growth", "integration", "meaning", "selfhood"],
      career_transition: ["stability", "responsibility", "future", "competence"],
      military_transition: ["identity", "service", "stability", "belonging"],
      builder_development: ["purpose", "growth", "contribution"],
      planner_development: ["clarity", "responsibility", "stability"],
      healing_chapter: ["repair", "health", "honesty", "stability"]
    };

    const lifeKeys = [
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      primaryLifeChapter,
      ...lifeSignals,
      ...rankedLifeSignals.map(item => item?.name)
    ].filter(Boolean);

    [...new Set(lifeKeys.map(normalizeKey))].forEach(signal => {
      const values = lifeValueMap[signal] || [];

      values.forEach(value => {
        addValue(
          value,
          22,
          `Life signal '${signal}' points toward '${value}'.`,
          [signal]
        );
      });
    });

    const emotionValueMap = {
      stewardship: ["responsibility", "care", "protection"],
      responsibility: ["stability", "care", "protection"],
      curiosity: ["understanding", "growth", "clarity"],
      wonder: ["meaning", "growth", "understanding"],
      hope: ["future", "meaning", "possibility"],
      concern: ["care", "protection"],
      fear: ["safety", "protection"],
      anxiety: ["safety", "certainty", "stability"],
      guilt: ["repair", "relationship", "responsibility"],
      shame: ["dignity", "self_worth", "belonging"],
      grief: ["love", "loss", "meaning"],
      loneliness: ["connection", "belonging", "attachment"],
      anger: ["boundary", "justice", "dignity"],
      sadness: ["care", "connection", "loss"],
      determination: ["purpose", "discipline", "future"],
      identity_instability: ["identity", "integration", "stability"]
    };

    [primaryEmotion, underlyingEmotion].filter(Boolean).forEach(emotion => {
      const values = emotionValueMap[normalizeKey(emotion)] || [];

      values.forEach(value => {
        addValue(
          value,
          18,
          `Emotion '${emotion}' points toward '${value}'.`,
          [emotion]
        );
      });
    });

    const organismValueMap = {
      energy_intake: ["health", "stability", "survival"],
      hydration: ["health", "stability", "survival"],
      rest_recovery: ["health", "recovery", "stability"],
      injury_protection: ["health", "protection", "stability"],
      vital_stability: ["survival", "safety", "urgent_protection"],
      waste_elimination: ["health", "relief", "stability"],
      temperature_regulation: ["health", "stability", "safety"],
      movement_mobility: ["mobility", "agency", "safety"],
      threat_regulation: ["safety", "calm", "protection"],
      connection: ["connection", "belonging", "attachment"]
    };

    if (organismFunction && organismValueMap[normalizeKey(organismFunction)]) {
      addValues(
        organismValueMap[normalizeKey(organismFunction)],
        20,
        `Organism function '${organismFunction}'`,
        [organismFunction]
      );
    }

    rankedSignals.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);

      if (directValueMap[name]) {
        addValues(
          directValueMap[name],
          Math.max(8, Math.round(strength * 0.1)),
          `Ranked signal '${signal.name}'`,
          [category]
        );
      }
    });

    rankedSalience.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);

      if (directValueMap[name]) {
        addValues(
          directValueMap[name],
          Math.max(8, Math.round(strength * 0.08)),
          `Salience signal '${signal.name}'`,
          [category]
        );
      }
    });

    const conflictTemplates = {
      family_vs_purpose: {
        integratedValue: "meaningful_love",
        statement:
          "Family and purpose may not be enemies. Both may be trying to protect a meaningful life rooted in love, service, and contribution.",
        question:
          "How can your purpose serve your family instead of competing with it?",
        values: [
          ["love", 36, "Family side of the tension protects love.", ["family"]],
          ["purpose", 36, "Purpose side of the tension protects meaning.", ["purpose"]],
          ["contribution", 28, "Purpose often points toward contribution.", ["purpose"]],
          ["stewardship", 28, "Both family and purpose require stewardship.", ["family", "purpose"]]
        ]
      },

      presence_vs_achievement: {
        integratedValue: "meaningful_presence",
        statement:
          "Presence and achievement may not be enemies. Achievement should create a life worth being present for, not replace presence itself.",
        question:
          "What achievement would actually deepen presence instead of stealing from it?",
        values: [
          ["presence", 36, "Presence side of the tension protects irreplaceable moments.", ["presence"]],
          ["purpose", 28, "Achievement side may protect purpose.", ["achievement"]],
          ["love", 28, "Presence often protects love.", ["presence"]],
          ["meaning", 28, "Healthy achievement should protect meaning.", ["achievement"]]
        ]
      },

      certainty_vs_growth: {
        integratedValue: "secure_growth",
        statement:
          "Certainty and growth may both be trying to create safety. The deeper need may be secure movement, not perfect predictability.",
        question:
          "What would make growth feel safe enough without needing full certainty?",
        values: [
          ["safety", 34, "Certainty often protects safety.", ["certainty"]],
          ["growth", 34, "Growth protects becoming.", ["growth"]],
          ["trust", 26, "Secure growth requires trust.", ["certainty", "growth"]]
        ]
      },

      truth_vs_peace: {
        integratedValue: "honest_peace",
        statement:
          "Truth and peace do not have to be enemies. The deeper goal is honest peace, not silence and not unnecessary harm.",
        question:
          "What truth needs to be spoken in the most peace-protecting way?",
        values: [
          ["truth", 34, "Truth protects honesty and reality.", ["truth"]],
          ["peace", 34, "Peace protects stability and non-harm.", ["peace"]],
          ["dignity", 26, "Honest peace protects dignity.", ["truth", "peace"]]
        ]
      },

      freedom_vs_responsibility: {
        integratedValue: "responsible_freedom",
        statement:
          "Freedom and responsibility may be trying to protect the same thing: a life where agency does not abandon what matters.",
        question:
          "What would freedom look like if it still protected your responsibilities?",
        values: [
          ["freedom", 34, "Freedom protects agency.", ["freedom"]],
          ["responsibility", 34, "Responsibility protects what is entrusted.", ["responsibility"]],
          ["stewardship", 26, "Responsible freedom requires stewardship.", ["freedom", "responsibility"]]
        ]
      },

      safety_vs_love: {
        integratedValue: "protected_love",
        statement:
          "Love and safety both matter. The deeper good is protected love, not unsafe closeness or loveless protection.",
        question:
          "What kind of closeness would still protect safety?",
        values: [
          ["love", 34, "Love protects connection.", ["love"]],
          ["safety", 34, "Safety protects survival and stability.", ["safety"]],
          ["boundary", 26, "Protected love often requires boundaries.", ["love", "safety"]]
        ]
      },

      connection_vs_dignity: {
        integratedValue: "dignified_connection",
        statement:
          "Connection and dignity should not compete. The deeper need is closeness that does not require self-abandonment.",
        question:
          "What connection would let you stay close without losing self-respect?",
        values: [
          ["connection", 34, "Connection protects belonging.", ["connection"]],
          ["dignity", 34, "Dignity protects self-worth.", ["dignity"]],
          ["boundary", 26, "Dignified connection may require boundaries.", ["connection", "dignity"]]
        ]
      },

      purpose_vs_health: {
        integratedValue: "sustainable_purpose",
        statement:
          "Purpose and health should work together. Purpose that destroys the body eventually loses the life it was meant to serve.",
        question:
          "What version of your purpose can your body actually sustain?",
        values: [
          ["purpose", 34, "Purpose protects meaning.", ["purpose"]],
          ["health", 34, "Health protects capacity and life.", ["health"]],
          ["sustainability", 28, "Sustainable purpose protects both.", ["purpose", "health"]]
        ]
      },

      stability_vs_growth: {
        integratedValue: "stable_growth",
        statement:
          "Stability and growth are not enemies. The deeper goal is growth with enough structure to hold it.",
        question:
          "What structure would make growth safer and more sustainable?",
        values: [
          ["stability", 34, "Stability protects security.", ["stability"]],
          ["growth", 34, "Growth protects becoming.", ["growth"]],
          ["structure", 26, "Stable growth requires structure.", ["stability", "growth"]]
        ]
      }
    };

    let apparentConflict = wisdomTension || "none_detected";
    let integratedValue = null;
    let integrationStatement = null;
    let integrationQuestion = "What deeper good are both sides trying to protect?";

    const normalizedTension = normalizeKey(wisdomTension);

    if (conflictTemplates[normalizedTension]) {
      const template = conflictTemplates[normalizedTension];

      apparentConflict = normalizedTension;
      integratedValue = template.integratedValue;
      integrationStatement = template.statement;
      integrationQuestion = template.question;

      template.values.forEach(([name, score, reason, serves]) => {
        addValue(name, score, reason, serves);
      });
    }

    candidates.forEach(candidate => {
      candidate.score = cap(candidate.score);
    });

    candidates.sort((a, b) => b.score - a.score);

    const topValues = candidates.slice(0, 5);

    const sharedValues = candidates.filter(value => {
      const uniqueServes = [...new Set(value.serves || [])];
      return (
        uniqueServes.length > 1 &&
        !uniqueServes.every(item => item === "direct_signal")
      );
    });

    const hasExplicitConflict =
      apparentConflict &&
      apparentConflict !== "none_detected" &&
      apparentConflict !== "unclear";

    const hasSharedMultiSourceValue =
      sharedValues.some(value => {
        const uniqueServes = [...new Set(value.serves || [])];
        return uniqueServes.length > 1;
      });

    const shouldAutoIntegrate =
      !directTeachingActive &&
      !summary.shouldBlockMeaningProjection &&
      !summary.shouldBlockLifeChapter &&
      (
        hasExplicitConflict ||
        hasSharedMultiSourceValue ||
        primaryHumanNeed === "wisdom" ||
        needResponseMode === "choose_what_leads"
      );

    if (!integratedValue && shouldAutoIntegrate && topValues.length > 0) {
      integratedValue = topValues[0].name;

      integrationStatement =
        `The strongest deeper value appears to be '${integratedValue}'. Ari should help the active parts serve that value together.`;

      integrationQuestion =
        `How can the active parts serve '${integratedValue}' together instead of competing?`;
    }

    const hasIntegration =
      !directTeachingActive &&
      (
        Boolean(integratedValue) ||
        hasExplicitConflict ||
        hasSharedMultiSourceValue
      );

    return {
      valueIntegrationDetected: hasIntegration,
      apparentConflict,
      integratedValue: hasIntegration ? integratedValue : null,
      integrationStatement: hasIntegration ? integrationStatement : null,
      valueIntegrationQuestion: hasIntegration ? integrationQuestion : null,

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

      valueIntegrationDebug: {
        domainLead,
        domainMode,
        responseIntent,
        directTeachingActive,
        wisdomTension,
        normalizedTension,
        organismFunction,
        organismNeed,
        primaryHumanNeed,
        secondaryHumanNeed,
        needResponseMode,
        leadIdentity,
        supportIdentity,
        hasExplicitConflict,
        hasSharedMultiSourceValue,
        shouldAutoIntegrate,
        candidateCount: candidates.length,
        source: "ari-value-integration-engine-normalization"
      },

      source: "ari-value-integration-engine"
    };
  }
};