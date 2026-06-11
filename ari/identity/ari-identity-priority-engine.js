// ari/identity/ari-identity-priority-engine.js
// Ari Identity Priority Engine
// Purpose: Decide which identity/role should lead when multiple parts of the user are active.
// V1.1
// Fixes:
// - Deduplicates repeated life/signals/salience inputs.
// - Caps identity score inflation.
// - Prevents duplicate reasons from stacking endlessly.
// - Keeps identity ranking useful for salience governor.

window.AriIdentityPriorityEngine = {
  evaluate(input = {}) {
    const summary = input.summary || input || {};
    const candidates = [];

    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const personPrimaryRole = summary.personPrimaryRole || null;
    const primaryOrgan = summary.primaryOrgan || null;
    const primaryPriority = summary.primaryPriority || null;
    const dominantValue = summary.dominantValue || null;
    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const protecting = summary.protecting || null;
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryWeightedLifeSignal = summary.primaryWeightedLifeSignal || null;
    const lifeSignals = Array.isArray(summary.lifeSignals) ? summary.lifeSignals : [];
    const rankedSignals = Array.isArray(summary.rankedSignals) ? summary.rankedSignals : [];
    const rankedSalience = Array.isArray(summary.rankedSalience) ? summary.rankedSalience : [];
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;
    const highestGood = summary.highestGood || null;
    const wisdomTension = summary.wisdomTension || null;
    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;

    function normalizeKey(value = "") {
      return String(value).trim();
    }

    function uniqueArray(items = []) {
      return [...new Set(items.filter(Boolean).map(normalizeKey))];
    }

    function cap(value, max = 120) {
      return Math.min(Number(value || 0), max);
    }

    function addIdentity(name, score, reason, protects, motivation, action = "support") {
      if (!name) return;

      const safeScore = Number(score || 0);
      const existing = candidates.find(c => c.name === name);

      if (existing) {
        if (!existing.reasons.includes(reason)) {
          existing.score += safeScore;
          existing.reasons.push(reason);
        }

        if (protects && !existing.protects.includes(protects)) {
          existing.protects.push(protects);
        }

        if (motivation && !existing.motivations.includes(motivation)) {
          existing.motivations.push(motivation);
        }

        if (action === "lead_candidate") {
          existing.recommendedAction = "lead_candidate";
        }

        existing.score = cap(existing.score);
        return;
      }

      candidates.push({
        name,
        score: cap(safeScore),
        reasons: reason ? [reason] : [],
        protects: protects ? [protects] : [],
        motivations: motivation ? [motivation] : [],
        recommendedAction: action
      });
    }

    const lifeIdentityMap = {
      fatherhood_transition: {
        identity: "father",
        protects: "presence",
        motivation: "stewardship"
      },
      family_transition: {
        identity: "family-protector",
        protects: "family",
        motivation: "love"
      },
      marriage_transition: {
        identity: "husband",
        protects: "relationship",
        motivation: "commitment"
      },
      creative_mission: {
        identity: "builder",
        protects: "creative_purpose",
        motivation: "purpose"
      },
      purpose_signal: {
        identity: "builder",
        protects: "purpose",
        motivation: "meaning"
      },
      identity_transition: {
        identity: "emerging-self",
        protects: "growth",
        motivation: "integration"
      },
      career_transition: {
        identity: "steward",
        protects: "future_stability",
        motivation: "responsibility"
      },
      builder_development: {
        identity: "builder",
        protects: "creative_purpose",
        motivation: "purpose"
      },
      planner_development: {
        identity: "planner",
        protects: "clarity",
        motivation: "responsibility"
      }
    };

    const valueIdentityMap = {
      family: {
        identity: "family-protector",
        protects: "family",
        motivation: "love"
      },
      creation: {
        identity: "builder",
        protects: "creative_purpose",
        motivation: "purpose"
      },
      purpose: {
        identity: "builder",
        protects: "purpose",
        motivation: "meaning"
      },
      clarity: {
        identity: "planner",
        protects: "clarity",
        motivation: "responsibility"
      },
      service: {
        identity: "caregiver",
        protects: "people",
        motivation: "service"
      },
      presence: {
        identity: "present-self",
        protects: "presence",
        motivation: "love"
      },
      stability: {
        identity: "steward",
        protects: "stability",
        motivation: "responsibility"
      },
      sustainable_purpose: {
        identity: "builder",
        protects: "purpose",
        motivation: "meaning"
      }
    };

    const organIdentityMap = {
      builder: "builder",
      creator: "builder",
      planner: "planner",
      teacher: "teacher",
      observer: "observer",
      caregiver: "caregiver",
      protector: "protector",
      executive: "leader"
    };

    // 1. Direct identity signals
    if (dominantIdentity && dominantIdentity !== "unknown") {
      addIdentity(
        dominantIdentity,
        32,
        "Dominant identity detected.",
        protecting || highestGood || null,
        primaryEmotion || null,
        "lead_candidate"
      );
    }

    if (personPrimaryRole && personPrimaryRole !== "unknown") {
      addIdentity(
        personPrimaryRole,
        30,
        "Person model identified this as the primary role.",
        protecting || null,
        primaryEmotion || null,
        "lead_candidate"
      );
    }

    if (strongestSignalCategory === "identity" && strongestSignal) {
      addIdentity(
        strongestSignal,
        34,
        "Strongest signal is identity-related.",
        protecting || null,
        primaryEmotion || null,
        "lead_candidate"
      );
    }

    // 2. Life signal mapping
    const lifeKeys = uniqueArray([
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      ...lifeSignals
    ]);

    lifeKeys.forEach(signal => {
      const mapped = lifeIdentityMap[signal];
      if (!mapped) return;

      addIdentity(
        mapped.identity,
        signal === primaryWeightedLifeSignal ? 36 : 28,
        `Life signal '${signal}' maps to identity '${mapped.identity}'.`,
        mapped.protects,
        mapped.motivation,
        "lead_candidate"
      );
    });

    // 3. Priority / value mapping
    uniqueArray([
      primaryPriority,
      dominantValue,
      wisdomLeadingGood,
      highestGood,
      rootNeed
    ]).forEach(value => {
      const mapped = valueIdentityMap[value];
      if (!mapped) return;

      addIdentity(
        mapped.identity,
        24,
        `Value or priority '${value}' maps to identity '${mapped.identity}'.`,
        mapped.protects,
        mapped.motivation,
        "support_candidate"
      );
    });

    // 4. Organ mapping
    if (primaryOrgan && organIdentityMap[primaryOrgan]) {
      addIdentity(
        organIdentityMap[primaryOrgan],
        16,
        `Primary organ '${primaryOrgan}' suggests identity '${organIdentityMap[primaryOrgan]}'.`,
        protecting || null,
        primaryEmotion || null,
        "support_candidate"
      );
    }

    // 5. Ranked signals, deduped by name/category
    const seenRankedSignals = new Set();

    rankedSignals.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = signal.name;
      const category = signal.category;
      const strength = Number(signal.strength || 0);
      const key = `${name}:${category}`;

      if (seenRankedSignals.has(key)) return;
      seenRankedSignals.add(key);

      if (category === "identity" || category === "role") {
        addIdentity(
          name,
          Math.round(strength * 0.18),
          `Ranked signal '${name}' supports this identity.`,
          protecting || null,
          null,
          "support_candidate"
        );
      }

      if (lifeIdentityMap[name]) {
        const mapped = lifeIdentityMap[name];

        addIdentity(
          mapped.identity,
          Math.round(strength * 0.18),
          `Ranked life signal '${name}' supports identity '${mapped.identity}'.`,
          mapped.protects,
          mapped.motivation,
          "support_candidate"
        );
      }
    });

    // 6. Ranked salience, deduped by name/category
    const seenSalienceSignals = new Set();

    rankedSalience.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = signal.name;
      const category = signal.category || "unknown";
      const strength = Number(signal.strength || 0);
      const key = `${name}:${category}`;

      if (seenSalienceSignals.has(key)) return;
      seenSalienceSignals.add(key);

      if (lifeIdentityMap[name]) {
        const mapped = lifeIdentityMap[name];

        addIdentity(
          mapped.identity,
          Math.round(strength * 0.14),
          `Salience signal '${name}' supports identity '${mapped.identity}'.`,
          mapped.protects,
          mapped.motivation,
          "support_candidate"
        );
      }
    });

    // 7. Stewardship vs fear correction
    if (
      primaryEmotion === "stewardship" ||
      primaryEmotion === "responsibility" ||
      rootNeed === "stability"
    ) {
      addIdentity(
        "steward",
        28,
        "Primary emotional tone suggests stewardship rather than fear.",
        protecting || "what has been entrusted",
        "stewardship",
        "lead_candidate"
      );
    }

    // 8. Wisdom tension handling
    if (wisdomTension === "presence_vs_achievement") {
      addIdentity(
        "present-self",
        30,
        "Wisdom tension suggests presence needs protection.",
        "presence",
        "love",
        "lead_candidate"
      );

      addIdentity(
        "builder",
        18,
        "Achievement remains meaningful but should not dominate this tension.",
        "purpose",
        "purpose",
        "support_candidate"
      );
    }

    if (wisdomTension === "family_vs_purpose") {
      addIdentity(
        "family-protector",
        28,
        "Family is active in the tension.",
        "family",
        "love",
        "lead_candidate"
      );

      addIdentity(
        "builder",
        24,
        "Purpose is active in the tension.",
        "purpose",
        "purpose",
        "lead_candidate"
      );
    }

    // 9. Fallback
    if (candidates.length === 0) {
      addIdentity(
        "observer",
        50,
        "No clear identity is active, so Ari should continue observing.",
        "understanding",
        "curiosity",
        "observe"
      );
    }

    candidates.forEach(candidate => {
      candidate.score = cap(candidate.score);
    });

    candidates.sort((a, b) => b.score - a.score);

    const lead = candidates[0];
    const support = candidates.slice(1, 4);
    const deferred = candidates.slice(4);

    let leadershipMode = "single_lead";

    if (support.length > 0 && Math.abs(lead.score - support[0].score) <= 8) {
      leadershipMode = "shared_lead_or_tension";
    }

    if (lead.name === "observer") {
      leadershipMode = "continue_observing";
    }

    let recommendedQuestion = "Which part of you should lead this moment?";

    if (lead.name === "father") {
      recommendedQuestion = "What kind of father does this moment ask you to become?";
    } else if (lead.name === "family-protector") {
      recommendedQuestion = "What does protecting your family require from you right now?";
    } else if (lead.name === "husband") {
      recommendedQuestion = "What kind of husband does this chapter require?";
    } else if (lead.name === "builder") {
      recommendedQuestion = "What part of your purpose needs to stay alive without consuming everything?";
    } else if (lead.name === "planner") {
      recommendedQuestion = "What would enough clarity look like before you move?";
    } else if (lead.name === "steward") {
      recommendedQuestion = "What has been entrusted to you that needs careful stewardship?";
    } else if (lead.name === "present-self") {
      recommendedQuestion = "What moment of presence needs protection before achievement gets more attention?";
    } else if (lead.name === "teacher") {
      recommendedQuestion = "What truth are you trying to understand well enough to teach?";
    } else if (lead.name === "observer") {
      recommendedQuestion = "What do you need to understand before choosing a direction?";
    }

    const summaryStatement =
      leadershipMode === "shared_lead_or_tension"
        ? `${lead.name} and ${support[0].name} are both active. Ari should resolve which one leads before giving advice.`
        : `${lead.name} appears to be the identity that should lead right now.`;

    return {
      leadIdentity: lead.name,
      leadIdentityScore: lead.score,
      leadIdentityProtects: lead.protects,
      leadIdentityMotivations: lead.motivations,

      supportingIdentities: support.map(item => ({
        name: item.name,
        score: item.score,
        protects: item.protects,
        motivations: item.motivations,
        reasons: item.reasons
      })),

      deferredIdentities: deferred.map(item => ({
        name: item.name,
        score: item.score,
        protects: item.protects,
        motivations: item.motivations,
        reasons: item.reasons
      })),

      identityLeadershipMode: leadershipMode,
      identityPrioritySummary: summaryStatement,
      identityRecoveryQuestion: recommendedQuestion,

      rankedIdentities: candidates.map(item => ({
        name: item.name,
        score: item.score,
        protects: item.protects,
        motivations: item.motivations,
        reasons: item.reasons,
        recommendedAction: item.recommendedAction
      })),

      identityScoreNormalization: {
        maxScore: 120,
        dedupedLifeSignals: lifeKeys,
        source: "ari-identity-priority-engine-normalization"
      },

      source: "ari-identity-priority-engine"
    };
  }
};