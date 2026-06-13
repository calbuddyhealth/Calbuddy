// ari/identity/ari-identity-priority-engine.js
// Ari Identity Priority Engine
// Purpose: Decide which identity/role should lead when multiple parts of the user are active.
// V1.2
// Fixes:
// - Expands identity maps into universal life/value/organ roles.
// - Keeps scoring capped and deduped.
// - Avoids overfitting identity only to father/family/builder cases.

window.AriIdentityPriorityEngine = {
  version: "1.2.0",

  evaluate(input = {}) {
    const summary = input.summary || input || {};
    const candidates = [];

    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const personPrimaryRole = summary.personPrimaryRole || null;
    const primaryOrgan = summary.primaryOrgan || null;
    const primaryPriority =
      typeof summary.primaryPriority === "object"
        ? summary.primaryPriority?.name
        : summary.primaryPriority || null;

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
      return String(value || "").toLowerCase().trim();
    }

    function uniqueArray(items = []) {
      return [...new Set(items.filter(Boolean).map(normalizeKey))];
    }

    function cap(value, max = 120) {
      return Math.min(Number(value || 0), max);
    }

    function addIdentity(name, score, reason, protects, motivation, action = "support_candidate") {
      if (!name) return;

      const safeScore = Number(score || 0);
      const existing = candidates.find(c => c.name === name);

      if (existing) {
        if (reason && !existing.reasons.includes(reason)) {
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
      fatherhood_transition: { identity: "parent", protects: "presence", motivation: "stewardship" },
      motherhood_transition: { identity: "parent", protects: "presence", motivation: "stewardship" },
      parenthood_transition: { identity: "parent", protects: "presence", motivation: "stewardship" },
      family_transition: { identity: "family-protector", protects: "family", motivation: "love" },
      relationship_rupture_chapter: { identity: "wounded-relational-self", protects: "dignity", motivation: "connection" },
      marriage_transition: { identity: "partner", protects: "relationship", motivation: "commitment" },
      career_transition: { identity: "steward", protects: "future_stability", motivation: "responsibility" },
      military_transition: { identity: "transitioning-self", protects: "identity_continuity", motivation: "adaptation" },
      identity_transition: { identity: "emerging-self", protects: "growth", motivation: "integration" },
      healing_chapter: { identity: "healing-self", protects: "recovery", motivation: "wholeness" },
      purpose_chapter: { identity: "purpose-bearer", protects: "meaning", motivation: "purpose" },
      creative_mission_chapter: { identity: "creator", protects: "creative_purpose", motivation: "creation" },
      builder_development: { identity: "builder", protects: "sustainable_creation", motivation: "purpose" },
      planner_development: { identity: "planner", protects: "clarity", motivation: "responsibility" },
      learning_chapter: { identity: "learner", protects: "growth", motivation: "understanding" },
      service_chapter: { identity: "caregiver", protects: "people", motivation: "service" },
      leadership_chapter: { identity: "leader", protects: "direction", motivation: "responsibility" },
      spiritual_chapter: { identity: "seeker", protects: "meaning", motivation: "truth" }
    };

    const valueIdentityMap = {
      family: { identity: "family-protector", protects: "family", motivation: "love" },
      love: { identity: "relational-self", protects: "connection", motivation: "love" },
      connection: { identity: "relational-self", protects: "belonging", motivation: "connection" },
      belonging: { identity: "relational-self", protects: "belonging", motivation: "connection" },
      dignity: { identity: "self-respecting-self", protects: "worth", motivation: "self-respect" },
      worth: { identity: "self-respecting-self", protects: "worth", motivation: "dignity" },
      presence: { identity: "present-self", protects: "presence", motivation: "love" },
      purpose: { identity: "purpose-bearer", protects: "meaning", motivation: "purpose" },
      meaning: { identity: "meaning-maker", protects: "meaning", motivation: "truth" },
      creation: { identity: "creator", protects: "creative_purpose", motivation: "creation" },
      clarity: { identity: "planner", protects: "clarity", motivation: "responsibility" },
      stability: { identity: "steward", protects: "stability", motivation: "responsibility" },
      safety: { identity: "protector", protects: "safety", motivation: "protection" },
      service: { identity: "caregiver", protects: "people", motivation: "service" },
      growth: { identity: "learner", protects: "growth", motivation: "development" },
      truth: { identity: "seeker", protects: "truth", motivation: "understanding" },
      freedom: { identity: "autonomous-self", protects: "agency", motivation: "freedom" },
      responsibility: { identity: "steward", protects: "responsibility", motivation: "duty" },
      peace: { identity: "peacekeeper", protects: "peace", motivation: "harmony" }
    };

    const organIdentityMap = {
      builder: "builder",
      creator: "creator",
      planner: "planner",
      teacher: "teacher",
      observer: "observer",
      caregiver: "caregiver",
      protector: "protector",
      executive: "leader",
      meaning: "meaning-maker",
      wisdom: "seeker",
      emotion: "relational-self",
      safety: "protector",
      identity: "emerging-self",
      values: "steward",
      stewardship: "steward"
    };

    if (dominantIdentity && normalizeKey(dominantIdentity) !== "unknown") {
      addIdentity(dominantIdentity, 32, "Dominant identity detected.", protecting || highestGood || null, primaryEmotion || null, "lead_candidate");
    }

    if (personPrimaryRole && normalizeKey(personPrimaryRole) !== "unknown") {
      addIdentity(personPrimaryRole, 30, "Person model identified this as the primary role.", protecting || null, primaryEmotion || null, "lead_candidate");
    }

    if (strongestSignalCategory === "identity" && strongestSignal) {
      addIdentity(strongestSignal, 34, "Strongest signal is identity-related.", protecting || null, primaryEmotion || null, "lead_candidate");
    }

    const lifeKeys = uniqueArray([primaryLifeSignal, primaryWeightedLifeSignal, ...lifeSignals]);

    lifeKeys.forEach(signal => {
      const mapped = lifeIdentityMap[signal];
      if (!mapped) return;

      addIdentity(
        mapped.identity,
        signal === normalizeKey(primaryWeightedLifeSignal) ? 36 : 28,
        `Life signal '${signal}' maps to identity '${mapped.identity}'.`,
        mapped.protects,
        mapped.motivation,
        "lead_candidate"
      );
    });

    uniqueArray([primaryPriority, dominantValue, wisdomLeadingGood, highestGood, rootNeed]).forEach(value => {
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

    if (primaryOrgan && organIdentityMap[normalizeKey(primaryOrgan)]) {
      addIdentity(
        organIdentityMap[normalizeKey(primaryOrgan)],
        16,
        `Primary organ '${primaryOrgan}' suggests identity '${organIdentityMap[normalizeKey(primaryOrgan)]}'.`,
        protecting || null,
        primaryEmotion || null,
        "support_candidate"
      );
    }

    const seenRankedSignals = new Set();

    rankedSignals.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);
      const key = `${name}:${category}`;

      if (seenRankedSignals.has(key)) return;
      seenRankedSignals.add(key);

      if (category === "identity" || category === "role") {
        addIdentity(name, Math.round(strength * 0.18), `Ranked signal '${name}' supports this identity.`, protecting || null, null, "support_candidate");
      }

      if (lifeIdentityMap[name]) {
        const mapped = lifeIdentityMap[name];
        addIdentity(mapped.identity, Math.round(strength * 0.18), `Ranked life signal '${name}' supports identity '${mapped.identity}'.`, mapped.protects, mapped.motivation, "support_candidate");
      }
    });

    const seenSalienceSignals = new Set();

    rankedSalience.forEach(signal => {
      if (!signal || !signal.name) return;

      const name = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);
      const key = `${name}:${category}`;

      if (seenSalienceSignals.has(key)) return;
      seenSalienceSignals.add(key);

      if (lifeIdentityMap[name]) {
        const mapped = lifeIdentityMap[name];
        addIdentity(mapped.identity, Math.round(strength * 0.14), `Salience signal '${name}' supports identity '${mapped.identity}'.`, mapped.protects, mapped.motivation, "support_candidate");
      }
    });

    if (primaryEmotion === "stewardship" || primaryEmotion === "responsibility" || rootNeed === "stability") {
      addIdentity("steward", 28, "Primary emotional tone suggests stewardship rather than fear.", protecting || "what has been entrusted", "stewardship", "lead_candidate");
    }

    if (wisdomTension === "presence_vs_achievement") {
      addIdentity("present-self", 30, "Wisdom tension suggests presence needs protection.", "presence", "love", "lead_candidate");
      addIdentity("builder", 18, "Achievement remains meaningful but should not dominate this tension.", "purpose", "purpose", "support_candidate");
    }

    if (wisdomTension === "family_vs_purpose") {
      addIdentity("family-protector", 28, "Family is active in the tension.", "family", "love", "lead_candidate");
      addIdentity("purpose-bearer", 24, "Purpose is active in the tension.", "purpose", "purpose", "lead_candidate");
    }

    if (candidates.length === 0) {
      addIdentity("observer", 50, "No clear identity is active, so Ari should continue observing.", "understanding", "curiosity", "observe");
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

    const questionMap = {
      parent: "What kind of parent does this moment ask you to become?",
      "family-protector": "What does protecting your family require from you right now?",
      partner: "What kind of partner does this chapter require?",
      "wounded-relational-self": "What part of this feels most alone right now?",
      builder: "What part of your purpose needs to stay alive without consuming everything?",
      creator: "What are you trying to create, and what must it not cost you?",
      planner: "What would enough clarity look like before you move?",
      steward: "What has been entrusted to you that needs careful stewardship?",
      "present-self": "What moment of presence needs protection before achievement gets more attention?",
      teacher: "What truth are you trying to understand well enough to teach?",
      observer: "What do you need to understand before choosing a direction?",
      learner: "What are you being asked to learn here?",
      leader: "What needs direction from you right now?",
      caregiver: "Who or what needs care without you abandoning yourself?",
      protector: "What needs protection first?",
      seeker: "What truth are you trying to find?",
      "emerging-self": "What part of you is changing right now?"
    };

    const recommendedQuestion =
      questionMap[lead.name] || "Which part of you should lead this moment?";

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
        rankedSignalCount: seenRankedSignals.size,
        salienceSignalCount: seenSalienceSignals.size,
        source: "ari-identity-priority-engine-normalization"
      },

      source: "ari-identity-priority-engine"
    };
  }
};