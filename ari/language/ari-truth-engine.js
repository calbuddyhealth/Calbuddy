// ari/language/ari-truth-engine.js
// Ari Truth Engine
// Purpose: Compress complex analysis into a memorable human truth.
// V1.2
// Fixes:
// - Adds Human Needs Network truth lines.
// - Handles restore_dignity / worth.
// - Handles emotional_connection / connection.
// - Respects Mouth Director truth permission.
// - Keeps extract() and generate() compatibility.

window.AriTruthEngine = {
  extract(summary = {}) {
    const truth = this.generate(summary);

    if (!truth) return null;

    return {
      truth,
      source: "ari-truth-engine"
    };
  },

  generate(summary = {}) {
    const director = summary.mouthDirector || {};

    const allowTruth =
      summary.mouthAllows?.truth !== false &&
      director.allowTruth !== false &&
      summary.allowTruth !== false;

    if (!allowTruth) return null;

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const primaryHumanNeed = summary.primaryHumanNeed || null;

    const conflict = summary.primaryConflict;
    const chapter = summary.primaryLifeChapter;
    const identity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      summary.dominantIdentity;

    const highestGood = summary.highestGood;
    const wisdomTension = summary.wisdomTension;
    const pattern = summary.pattern;
    const hypothesis = summary.hypothesis;
    const integratedValue = summary.integratedValue;
    const executiveDecision = summary.executiveDecision;

    // -------------------------
    // HUMAN NEED: WORTH / DIGNITY
    // -------------------------
    if (
      mode === "restore_dignity" ||
      primaryHumanNeed === "worth"
    ) {
      return "Other people’s behavior may be giving you a signal, but it should not get to define your value.";
    }

    // -------------------------
    // HUMAN NEED: CONNECTION
    // -------------------------
    if (
      mode === "emotional_connection" ||
      primaryHumanNeed === "connection"
    ) {
      return "Feeling alone does not mean you are without value or without people who care.";
    }

    // -------------------------
    // HUMAN NEED: SECURITY / BODY
    // -------------------------
    if (
      primaryHumanNeed === "security" ||
      primaryHumanNeed === "body"
    ) {
      return "Stability comes before interpretation.";
    }

    // Fatherhood + achievement / presence conflict
    if (
      chapter === "fatherhood_transition" &&
      (
        conflict === "ambition_vs_presence" ||
        conflict === "family_vs_creation" ||
        wisdomTension === "presence_vs_achievement"
      )
    ) {
      return "You are standing between two good things: building a future for your family and being present with them while that future is unfolding.";
    }

    // Fatherhood + family protection
    if (
      chapter === "fatherhood_transition" &&
      highestGood === "protect_family"
    ) {
      return "Your child will not need a perfect father. They will need a present one.";
    }

    // Father identity
    if (identity === "father") {
      return "The way you spend your time will teach more than the goals you achieve.";
    }

    // Presence vs achievement
    if (
      conflict === "presence_vs_achievement" ||
      wisdomTension === "presence_vs_achievement"
    ) {
      return "Achievement can be recovered later. Some moments cannot.";
    }

    // Family vs creation
    if (conflict === "family_vs_creation") {
      return "The builder does not need to disappear, but he should serve the family instead of competing with it.";
    }

    // Growth vs stability
    if (conflict === "growth_vs_stability") {
      return "Not every season is asking you to accelerate.";
    }

    // Identity overload
    if (
      summary.dominantTheme === "identity_overload" ||
      pattern === "too_many_primary_roles"
    ) {
      return "The problem is not that you have too many responsibilities. The problem is that too many things are trying to be first.";
    }

    // Presence must be earned
    if (hypothesis === "presence_must_be_earned") {
      return "Presence should not become the reward you only allow yourself after every goal is finished.";
    }

    // Meaningful presence
    if (integratedValue === "meaningful_presence") {
      return "The future matters, but so does who you are while you are building it.";
    }

    // Executive family-first decision
    if (executiveDecision === "protect_family_first") {
      return "This season does not require you to abandon ambition. It requires ambition to know its place.";
    }

    // Default
    return (
      summary.oneLineInsight ||
      summary.metaConclusion ||
      summary.humanTruth ||
      null
    );
  }
};