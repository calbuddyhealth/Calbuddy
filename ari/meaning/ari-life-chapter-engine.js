// ari/meaning/ari-life-chapter-engine.js
// Ari Life Chapter Engine
// Purpose: Detect the user's major life chapter and guide meaning-level interpretation.
// V1.2
// Fixes:
// - Deduplicates direct, ranked, and salience signals.
// - Prevents repeated chapter score explosions.
// - Caps final chapter strength.
// - Keeps major life chapters strong but not absurd.
// - Adds normalization debug.

window.AriLifeChapterEngine = {
  detect(input = {}) {
    const summary = input.summary || input || {};

    const lifeSignals = Array.isArray(summary.lifeSignals)
      ? summary.lifeSignals
      : [];

    const rankedSignals = Array.isArray(summary.rankedSignals)
      ? summary.rankedSignals
      : [];

    const rankedSalience = Array.isArray(summary.rankedSalience)
      ? summary.rankedSalience
      : [];

    const strongestSignal = summary.strongestSignal || null;
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const primaryWeightedLifeSignal = summary.primaryWeightedLifeSignal || null;
    const lifePriorityClass = summary.lifePriorityClass || "none";

    const dominantIdentity = summary.dominantIdentity || null;
    const personPrimaryRole = summary.personPrimaryRole || null;
    const leadIdentity = summary.resolvedLeadIdentity || summary.leadIdentity || null;

    const primaryPriority = summary.primaryPriority || null;
    const dominantValue = summary.dominantValue || null;
    const protecting = summary.protecting || null;
    const highestGood = summary.highestGood || null;
    const wisdomTension = summary.wisdomTension || null;
    const rootNeed = summary.rootNeed || summary.primaryNeed || null;

    const candidates = [];

    function normalizeKey(value = "") {
      return String(value || "").toLowerCase().trim();
    }

    function uniqueArray(items = []) {
      return [...new Set(items.filter(Boolean).map(normalizeKey))];
    }

    function capScore(value, max = 120) {
      return Math.min(Number(value || 0), max);
    }

    function addChapter(name, score, reason, question, focus = null) {
      if (!name) return;

      const existing = candidates.find(c => c.name === name);
      const safeScore = Number(score || 0);

      if (existing) {
        if (!existing.reasons.includes(reason)) {
          existing.score += safeScore;
          existing.reasons.push(reason);
        }

        existing.score = capScore(existing.score);
        return;
      }

      candidates.push({
        name,
        score: capScore(safeScore),
        reasons: reason ? [reason] : [],
        question,
        focus
      });
    }

    const chapterMap = {
      fatherhood_transition: {
        chapter: "fatherhood_transition",
        question: "What kind of father does this season ask you to become?",
        focus: "Protect presence, family stability, and identity transition."
      },
      family_transition: {
        chapter: "family_transition",
        question: "What does your family need from you in this season?",
        focus: "Protect family, relationship, and presence."
      },
      marriage_transition: {
        chapter: "marriage_transition",
        question: "What kind of husband does this chapter require?",
        focus: "Protect commitment, communication, and shared life."
      },
      creative_mission: {
        chapter: "creative_mission_chapter",
        question: "What future are you trying to create?",
        focus: "Protect purpose without letting it consume everything."
      },
      purpose_signal: {
        chapter: "purpose_chapter",
        question: "What part of your purpose needs to stay alive in this season?",
        focus: "Keep meaning connected to life, not separated from it."
      },
      builder_development: {
        chapter: "builder_development",
        question: "What are you building, and what kind of builder do you need to become?",
        focus: "Build sustainably, not compulsively."
      },
      planner_development: {
        chapter: "planner_development",
        question: "What clarity do you need before moving forward?",
        focus: "Use planning to serve action, not replace it."
      },
      identity_transition: {
        chapter: "identity_transition",
        question: "What identity is changing that you do not fully understand yet?",
        focus: "Let the old identity adapt to the new season."
      },
      career_transition: {
        chapter: "career_transition",
        question: "What future stability are you trying to protect?",
        focus: "Protect transition, responsibility, and long-term stability."
      },
      healing_chapter: {
        chapter: "healing_chapter",
        question: "What part of you needs repair before more pressure is added?",
        focus: "Protect recovery, honesty, and nervous system stability."
      }
    };

    const directSignals = uniqueArray([
      strongestSignal,
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      ...lifeSignals,
      dominantIdentity,
      personPrimaryRole,
      leadIdentity,
      primaryPriority,
      dominantValue,
      protecting,
      highestGood,
      wisdomTension,
      rootNeed
    ]);

    directSignals.forEach(key => {
      if (chapterMap[key]) {
        addChapter(
          chapterMap[key].chapter,
          key === normalizeKey(primaryWeightedLifeSignal) ? 34 : 26,
          `Direct signal '${key}' maps to chapter '${chapterMap[key].chapter}'.`,
          chapterMap[key].question,
          chapterMap[key].focus
        );
      }

      if (key.includes("father")) {
        addChapter(
          "fatherhood_transition",
          32,
          `Signal '${key}' points toward fatherhood transition.`,
          "What kind of father does this season ask you to become?",
          "Protect presence, family stability, and identity transition."
        );
      }

      if (key.includes("family")) {
        addChapter(
          "family_transition",
          28,
          `Signal '${key}' points toward family transition.`,
          "What does your family need from you in this season?",
          "Protect family, relationship, and presence."
        );
      }

      if (key.includes("husband") || key.includes("marriage")) {
        addChapter(
          "marriage_transition",
          28,
          `Signal '${key}' points toward marriage transition.`,
          "What kind of husband does this chapter require?",
          "Protect commitment, communication, and shared life."
        );
      }

      if (
        key.includes("builder") ||
        key.includes("creation") ||
        key.includes("mission")
      ) {
        addChapter(
          "builder_development",
          22,
          `Signal '${key}' points toward builder development.`,
          "What are you building, and what kind of builder do you need to become?",
          "Build sustainably, not compulsively."
        );
      }

      if (key.includes("purpose") || key.includes("calling")) {
        addChapter(
          "purpose_chapter",
          24,
          `Signal '${key}' points toward purpose chapter.`,
          "What part of your purpose needs to stay alive in this season?",
          "Keep meaning connected to life, not separated from it."
        );
      }

      if (key.includes("career") || key.includes("transition")) {
        addChapter(
          "career_transition",
          18,
          `Signal '${key}' may point toward career or transition themes.`,
          "What future stability are you trying to protect?",
          "Protect transition, responsibility, and long-term stability."
        );
      }
    });

    const seenRankedSignals = new Set();

    rankedSignals.forEach(signal => {
      if (!signal || !signal.name) return;

      const key = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);
      const seenKey = `${key}:${category}`;

      if (seenRankedSignals.has(seenKey)) return;
      seenRankedSignals.add(seenKey);

      if (chapterMap[key]) {
        const mapped = chapterMap[key];

        addChapter(
          mapped.chapter,
          Math.round(strength * 0.14),
          `Ranked signal '${key}' supports chapter '${mapped.chapter}'.`,
          mapped.question,
          mapped.focus
        );
      }
    });

    const seenSalienceSignals = new Set();

    rankedSalience.forEach(signal => {
      if (!signal || !signal.name) return;

      const key = normalizeKey(signal.name);
      const category = normalizeKey(signal.category || "unknown");
      const strength = Number(signal.strength || 0);
      const seenKey = `${key}:${category}`;

      if (seenSalienceSignals.has(seenKey)) return;
      seenSalienceSignals.add(seenKey);

      if (chapterMap[key]) {
        const mapped = chapterMap[key];

        addChapter(
          mapped.chapter,
          Math.round(strength * 0.12),
          `Salience signal '${key}' supports chapter '${mapped.chapter}'.`,
          mapped.question,
          mapped.focus
        );
      }
    });

    if (lifePriorityClass === "major_life_priority") {
      const key = normalizeKey(primaryWeightedLifeSignal);

      if (key && chapterMap[key]) {
        const mapped = chapterMap[key];

        addChapter(
          mapped.chapter,
          32,
          "Major life priority detected; this chapter receives extra weight.",
          mapped.question,
          mapped.focus
        );
      }
    }

    if (wisdomTension === "presence_vs_achievement") {
      addChapter(
        "presence_reordering_chapter",
        36,
        "Presence versus achievement tension suggests the chapter is asking for reordered priorities.",
        "What moment of presence needs protection before achievement gets more attention?",
        "Put irreplaceable moments before replaceable milestones."
      );
    }

    if (wisdomTension === "family_vs_purpose") {
      addChapter(
        "family_purpose_integration_chapter",
        36,
        "Family versus purpose tension suggests integration, not abandonment.",
        "How can your purpose serve your family instead of competing with it?",
        "Let purpose deepen love instead of competing with it."
      );
    }

    if (candidates.length === 0) {
      addChapter(
        "unclear_chapter",
        50,
        "No clear life chapter was detected.",
        "What feels different about this season of life?",
        "Continue observing before naming the chapter."
      );
    }

    candidates.forEach(candidate => {
      candidate.score = capScore(candidate.score);
    });

    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    return {
      primaryLifeChapter: winner.name,
      lifeChapterStrength: winner.score,
      lifeChapterStatement:
        winner.name === "unclear_chapter"
          ? "Ari does not have enough evidence to identify the life chapter cleanly."
          : `The strongest life chapter appears to be '${winner.name}'.`,
      lifeChapterQuestion: winner.question,
      lifeChapterFocus: winner.focus,

      rankedLifeChapters: candidates.map(item => ({
        name: item.name,
        score: item.score,
        focus: item.focus,
        question: item.question,
        reasons: item.reasons
      })),

      lifeChapterScoreNormalization: {
        maxScore: 120,
        directSignals,
        rankedSignalCount: seenRankedSignals.size,
        salienceSignalCount: seenSalienceSignals.size,
        source: "ari-life-chapter-engine-normalization"
      },

      source: "ari-life-chapter-engine"
    };
  }
};