// ari/language/ari-truth-engine.js
// Ari Truth Engine
// Purpose: Compress complex analysis into a memorable human truth.

window.AriTruthEngine = {

  generate(summary = {}) {

    const conflict = summary.primaryConflict;
    const chapter = summary.primaryLifeChapter;
    const identity = summary.leadIdentity;
    const highestGood = summary.highestGood;

    // Fatherhood + Achievement

    if (
      chapter === "fatherhood_transition" &&
      conflict === "ambition_vs_presence"
    ) {
      return "The danger is not failure. The danger is letting every important role compete for first place.";
    }

    if (
      chapter === "fatherhood_transition" &&
      highestGood === "protect_family"
    ) {
      return "Your child will never need a perfect father. They will need a present one.";
    }

    // Presence vs Achievement

    if (
      conflict === "presence_vs_achievement"
    ) {
      return "Achievement can be recovered later. Some moments cannot.";
    }

    // Growth vs Stability

    if (
      conflict === "growth_vs_stability"
    ) {
      return "Not every season is asking you to accelerate.";
    }

    // Identity Overload

    if (
      summary.dominantTheme === "identity_overload"
    ) {
      return "The problem is not too many responsibilities. The problem is too many first priorities.";
    }

    // Family

    if (
      identity === "father"
    ) {
      return "The way you spend your time teaches more than the goals you achieve.";
    }

    // Default

    return summary.oneLineInsight ||
           summary.metaConclusion ||
           null;
  }

};