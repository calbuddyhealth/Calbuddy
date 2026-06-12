// ari/language/ari-wisdom-principle-engine.js
// Ari Wisdom Principle Engine
// Purpose: Generate compressed wisdom principles from conflicts,
// life chapters, values, and highest goods.
// V1.1
// Fixes:
// - Adds distill() for AriLanguageComposer compatibility.
// - Returns { principle } object.
// - Keeps generate() for backward compatibility.

window.AriWisdomPrincipleEngine = {

  distill(summary = {}) {

    const principle = this.generate(summary);

    if (!principle) return null;

    return {
      principle,
      source: "ari-wisdom-principle-engine"
    };
  },

  generate(summary = {}) {

    const conflict =
      summary.primaryConflict ||
      summary.apparentConflict ||
      summary.wisdomTension ||
      null;

    const chapter = summary.primaryLifeChapter || null;
    const highestGood = summary.highestGood || null;
    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    // Fatherhood

    if (
      chapter === "fatherhood_transition"
    ) {
      return "Protect what cannot be replaced before chasing what can return.";
    }

    // Presence vs Achievement

    if (
      conflict === "presence_vs_achievement" ||
      conflict === "ambition_vs_presence"
    ) {
      return "Achievement can wait. Some moments cannot.";
    }

    // Family

    if (
      highestGood === "protect_family"
    ) {
      return "The people you love should never become the price of what you build.";
    }

    // Growth vs Stability

    if (
      conflict === "growth_vs_stability"
    ) {
      return "Growth is powerful, but timing is wisdom.";
    }

    // Purpose vs Safety

    if (
      conflict === "purpose_vs_security"
    ) {
      return "Do not abandon your future for comfort, but do not abandon your life for ambition.";
    }

    // Identity Overload

    if (
      summary.dominantTheme === "identity_overload"
    ) {
      return "When everything is important, wisdom decides what goes first.";
    }

    // Builder

    if (
      leadIdentity === "builder"
    ) {
      return "Build slowly enough that you still recognize the life you are building for.";
    }

    // Stewardship

    if (
      summary.emotionalClassification === "stewardship"
    ) {
      return "Stewardship asks what must be protected, not merely what can be gained.";
    }

    // Fallback

    return (
      summary.wisdomPrinciple ||
      summary.wisdomStatement ||
      null
    );
  }
};