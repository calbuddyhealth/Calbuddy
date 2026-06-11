// ari/meaning/ari-life-chapter-engine.js
// Ari Life Chapter Engine
// Purpose: Determine which major life chapter the user is currently entering.
// V1.0

window.AriLifeChapterEngine = {
  detect(input = {}) {

    const summary = input.summary || input || {};

    const lifeSignals = summary.lifeSignals || [];
    const strongestSignal = summary.strongestSignal || null;
    const dominantIdentity = summary.dominantIdentity || null;
    const primaryPriority = summary.primaryPriority || null;
    const protecting = summary.protecting || null;

    const signals = [
      strongestSignal,
      dominantIdentity,
      primaryPriority,
      protecting,
      ...lifeSignals
    ]
      .filter(Boolean)
      .map(v => String(v).toLowerCase());

    const chapters = {
      fatherhood_transition: 0,
      family_transition: 0,
      builder_development: 0,
      career_transition: 0,
      healing_chapter: 0,
      growth_chapter: 0,
      purpose_chapter: 0
    };

    signals.forEach(signal => {

      if (
        signal.includes("father") ||
        signal.includes("parent") ||
        signal.includes("child")
      ) {
        chapters.fatherhood_transition += 25;
      }

      if (
        signal.includes("family") ||
        signal.includes("marriage") ||
        signal.includes("relationship")
      ) {
        chapters.family_transition += 20;
      }

      if (
        signal.includes("builder") ||
        signal.includes("creation") ||
        signal.includes("mission")
      ) {
        chapters.builder_development += 20;
      }

      if (
        signal.includes("career") ||
        signal.includes("job") ||
        signal.includes("profession")
      ) {
        chapters.career_transition += 20;
      }

      if (
        signal.includes("healing") ||
        signal.includes("recovery")
      ) {
        chapters.healing_chapter += 20;
      }

      if (
        signal.includes("growth") ||
        signal.includes("development")
      ) {
        chapters.growth_chapter += 20;
      }

      if (
        signal.includes("purpose") ||
        signal.includes("calling")
      ) {
        chapters.purpose_chapter += 20;
      }

    });

    const ranked = Object.entries(chapters)
      .sort((a, b) => b[1] - a[1]);

    const primaryChapter = ranked[0][0];
    const chapterStrength = ranked[0][1];

    let statement =
      "Ari does not have enough evidence to identify a life chapter.";

    if (chapterStrength >= 20) {
      statement =
        `The strongest life chapter appears to be ${primaryChapter}.`;
    }

    return {
      primaryLifeChapter: primaryChapter,
      lifeChapterStrength: chapterStrength,
      rankedLifeChapters: ranked,
      lifeChapterStatement: statement,
      source: "ari-life-chapter-engine"
    };
  }
};