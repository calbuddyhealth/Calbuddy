// ari/meaning/ari-life-chapter-engine.js
// Ari Life Chapter Engine
// Purpose: Detect the user's major life chapter and guide meaning-level interpretation.
// V1.1

window.AriLifeChapterEngine = {
  detect(input = {}) {
    const summary = input.summary || input || {};

    const lifeSignals = Array.isArray(summary.lifeSignals) ? summary.lifeSignals : [];
    const rankedSignals = Array.isArray(summary.rankedSignals) ? summary.rankedSignals : [];
    const rankedSalience = Array.isArray(summary.rankedSalience) ? summary.rankedSalience : [];

    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;
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

    function addChapter(name, score, reason, question, focus = null) {
      const existing = candidates.find(c => c.name === name);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        return;
      }

      candidates.push({
        name,
        score,
        reasons: [reason],
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

    const directSignals = [
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
    ].filter(Boolean);

    directSignals.forEach(signal => {
      const key = String(signal).toLowerCase();

      if (chapterMap[key]) {
        addChapter(
          chapterMap[key].chapter,
          34,
          `Direct signal '${signal}' maps to chapter '${chapterMap[key].chapter}'.`,
          chapterMap[key].question,
          chapterMap[key].focus
        );
      }

      if (key.includes("father")) {
        addChapter(
          "fatherhood_transition",
          38,
          `Signal '${signal}' points toward fatherhood transition.`,
          "What kind of father does this season ask you to become?",
          "Protect presence, family stability, and identity transition."
        );
      }

      if (key.includes("family")) {
        addChapter(
          "family_transition",
          32,
          `Signal '${signal}' points toward family transition.`,
          "What does your family need from you in this season?",
          "Protect family, relationship, and presence."
        );
      }

      if (key.includes("husband") || key.includes("marriage")) {
        addChapter(
          "marriage_transition",
          32,
          `Signal '${signal}' points toward marriage transition.`,
          "What kind of husband does this chapter require?",
          "Protect commitment, communication, and shared life."
        );
      }

      if (key.includes("builder") || key.includes("creation") || key.includes("mission")) {
        addChapter(
          "builder_development",
          28,
          `Signal '${signal}' points toward builder development.`,
          "What are you building, and what kind of builder do you need to become?",
          "Build sustainably, not compulsively."
        );
      }

      if (key.includes("purpose") || key.includes("calling")) {
        addChapter(
          "purpose_chapter",
          28,
          `Signal '${signal}' points toward purpose chapter.`,
          "What part of your purpose needs to stay alive in this season?",
          "Keep meaning connected to life, not separated from it."
        );
      }

      if (key.includes("career") || key.includes("transition")) {
        addChapter(
          "career_transition",
          22,
          `Signal '${signal}' may point toward career or transition themes.`,
          "What future stability are you trying to protect?",
          "Protect transition, responsibility, and long-term stability."
        );
      }
    });

    rankedSignals.forEach(signal => {
      if (!signal || !signal.name) return;
      const key = String(signal.name).toLowerCase();
      const strength = Number(signal.strength || 0);

      if (chapterMap[key]) {
        const mapped = chapterMap[key];
        addChapter(
          mapped.chapter,
          Math.round(strength * 0.22),
          `Ranked signal '${signal.name}' supports chapter '${mapped.chapter}'.`,
          mapped.question,
          mapped.focus
        );
      }
    });

    rankedSalience.forEach(signal => {
      if (!signal || !signal.name) return;
      const key = String(signal.name).toLowerCase();
      const strength = Number(signal.strength || 0);

      if (chapterMap[key]) {
        const mapped = chapterMap[key];
        addChapter(
          mapped.chapter,
          Math.round(strength * 0.25),
          `Salience signal '${signal.name}' supports chapter '${mapped.chapter}'.`,
          mapped.question,
          mapped.focus
        );
      }
    });

    if (lifePriorityClass === "major_life_priority") {
      if (primaryWeightedLifeSignal && chapterMap[primaryWeightedLifeSignal]) {
        const mapped = chapterMap[primaryWeightedLifeSignal];
        addChapter(
          mapped.chapter,
          48,
          "Major life priority detected; this chapter should receive extra weight.",
          mapped.question,
          mapped.focus
        );
      }
    }

    if (wisdomTension === "presence_vs_achievement") {
      addChapter(
        "presence_reordering_chapter",
        40,
        "Presence versus achievement tension suggests the chapter is asking for reordered priorities.",
        "What moment of presence needs protection before achievement gets more attention?",
        "Put irreplaceable moments before replaceable milestones."
      );
    }

    if (wisdomTension === "family_vs_purpose") {
      addChapter(
        "family_purpose_integration_chapter",
        40,
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
      source: "ari-life-chapter-engine"
    };
  }
};