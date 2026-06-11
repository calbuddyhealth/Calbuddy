// ari/integration/ari-salience-governor.js
// Ari Salience Governor
// Purpose: Decide which organ/system should lead the response.
// V1.1
// Fixes:
// - Missing/null evidence now counts as no evidence.
// - Uncertainty overrides wisdom when no hypothesis exists.
// - Highest-good signals support wisdom only when there is enough evidence.
// - Wisdom cannot lead on an unclear wisdom tension.

window.AriSalienceGovernor = {
  govern(input = {}) {
    const summary = input.summary || input || {};

    const candidates = [];

    const uncertaintyType = summary.uncertaintyType || null;
    const uncertaintyConfidence = Number(summary.uncertaintyConfidence || 0);

    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const lifeChapterStrength = Number(summary.lifeChapterStrength || 0);

    const leadIdentity =
      summary.resolvedLeadIdentity || summary.leadIdentity || null;
    const leadIdentityScore = Number(summary.leadIdentityScore || 0);

    const valueIntegrationDetected = Boolean(summary.valueIntegrationDetected);
    const integratedValue = summary.integratedValue || null;

    const emotionalClassification = summary.emotionalClassification || null;
    const stewardshipScore = Number(summary.stewardshipScore || 0);
    const fearScore = Number(summary.fearScore || 0);

    const wisdomTension = summary.wisdomTension || null;
    const wisdomConfidence = summary.wisdomConfidence || null;
    const highestGood = summary.highestGood || null;
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;

    const evidenceStrength = summary.evidenceStrength || "none";
    const hypothesis = summary.hypothesis || null;
    const strongestSignal = summary.strongestSignal || null;
    const strongestSignalCategory = summary.strongestSignalCategory || null;

    const noHypothesis = !hypothesis;
    const noEvidence =
      !evidenceStrength ||
      evidenceStrength === "none" ||
      evidenceStrength === "unknown";

    const shouldUncertaintyOverride =
      noHypothesis &&
      noEvidence &&
      strongestSignalCategory !== "underlying_emotion";

    function addCandidate(lead, score, reason, mode, question = null) {
      const existing = candidates.find(c => c.lead === lead);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        if (!existing.question && question) existing.question = question;
        return;
      }

      candidates.push({
        lead,
        score,
        reasons: [reason],
        mode,
        question
      });
    }

    // 1. Uncertainty should lead when Ari lacks enough evidence.
    if (
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty" ||
      shouldUncertaintyOverride
    ) {
      addCandidate(
        "uncertainty",
        Math.max(uncertaintyConfidence, shouldUncertaintyOverride ? 104 : 88),
        "Ari lacks a grounded hypothesis and evidence, so uncertainty must lead before interpretation.",
        "continue_observing",
        summary.recommendedRecoveryQuestion ||
          "What information feels most missing right now?"
      );
    }

    // 2. Major life chapters should override emotional depth, unless uncertainty hard-overrides.
    if (
      !shouldUncertaintyOverride &&
      primaryLifeChapter &&
      primaryLifeChapter !== "unclear_chapter" &&
      lifeChapterStrength >= 70
    ) {
      addCandidate(
        "meaning",
        lifeChapterStrength + 10,
        "A strong life chapter is active, so meaning/life chapter should lead.",
        "protect_life_chapter",
        summary.lifeChapterQuestion || "What feels different about this season of life?"
      );
    }

    // 3. Identity should lead when a clear role has priority, unless uncertainty hard-overrides.
    if (
      !shouldUncertaintyOverride &&
      leadIdentity &&
      leadIdentity !== "observer" &&
      leadIdentityScore >= 70
    ) {
      addCandidate(
        "identity",
        leadIdentityScore + 6,
        "A clear lead identity is active, so identity should guide the response.",
        "identity_leadership",
        summary.identityConflictQuestion ||
          summary.identityRecoveryQuestion ||
          "Which part of you should lead this moment?"
      );
    }

    // 4. Values can lead only when integration is meaningful and uncertainty is not overriding.
    if (
      !shouldUncertaintyOverride &&
      (valueIntegrationDetected || integratedValue)
    ) {
      addCandidate(
        "values",
        82,
        "Ari detected a deeper value integration opportunity.",
        "integrate_values",
        summary.valueIntegrationQuestion ||
          "What deeper good are both sides trying to protect?"
      );
    }

    // 5. Stewardship should beat fear when responsibility is dominant.
    if (
      !shouldUncertaintyOverride &&
      (emotionalClassification === "stewardship" ||
        stewardshipScore >= fearScore + 15)
    ) {
      addCandidate(
        "stewardship",
        84,
        "The emotional pattern looks more like stewardship than fear.",
        "stewardship_not_fear",
        "What has been entrusted to you that needs careful stewardship?"
      );
    }

    // 6. Emotion leads only when emotion is clearly central.
    if (
      uncertaintyType === "emotion_uncertainty" ||
      strongestSignalCategory === "underlying_emotion"
    ) {
      addCandidate(
        "emotion",
        strongestSignalCategory === "underlying_emotion" ? 90 : 78,
        "An underlying emotion appears central enough to guide the response.",
        "emotion_depth",
        summary.emotionRecoveryQuestion ||
          "What feeling is hardest to admit underneath this?"
      );
    }

    // 7. Wisdom leads only when there is a real, named tension.
    if (
      !shouldUncertaintyOverride &&
      wisdomTension &&
      wisdomTension !== "unclear" &&
      wisdomConfidence !== "low"
    ) {
      addCandidate(
        "wisdom",
        80,
        "A real wisdom tension is present and should guide resolution.",
        "wisdom_resolution",
        "Which good thing should lead, and which should support?"
      );
    }

    // 8. Highest good / leading good can support wisdom, but not when evidence is absent.
    if (
      !shouldUncertaintyOverride &&
      !noEvidence &&
      (highestGood || wisdomLeadingGood)
    ) {
      addCandidate(
        "wisdom",
        18,
        "Highest good or leading good signal supports wisdom leadership.",
        "wisdom_resolution",
        "What good should lead right now?"
      );
    }

    // 9. Strongest signal category fallback.
    if (!shouldUncertaintyOverride && strongestSignalCategory === "life") {
      addCandidate(
        "meaning",
        74,
        `Strongest signal '${strongestSignal}' is life-related.`,
        "life_chapter",
        "What feels different about this season of life?"
      );
    }

    if (!shouldUncertaintyOverride && strongestSignalCategory === "belief") {
      addCandidate(
        "belief",
        74,
        `Strongest signal '${strongestSignal}' is belief-related.`,
        "belief_reflection",
        "What assumption are you making that might be shaping this?"
      );
    }

    if (!shouldUncertaintyOverride && strongestSignalCategory === "identity") {
      addCandidate(
        "identity",
        74,
        `Strongest signal '${strongestSignal}' is identity-related.`,
        "identity_reflection",
        "Which part of you feels most responsible for this?"
      );
    }

    if (
      !shouldUncertaintyOverride &&
      strongestSignalCategory === "highest_good"
    ) {
      addCandidate(
        "wisdom",
        64,
        `Strongest signal '${strongestSignal}' points toward a highest-good question, but should not override missing evidence.`,
        "wisdom_clarity",
        "What good are you trying to protect most right now?"
      );
    }

    // Fallback
    if (candidates.length === 0) {
      addCandidate(
        "observer",
        50,
        "No system has enough salience to lead confidently.",
        "continue_observing",
        "What are you trying to understand more clearly?"
      );
    }

    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];
    const supports = candidates.slice(1, 4);

    return {
      salienceLeadOrgan: winner.lead,
      salienceLeadScore: winner.score,
      salienceMode: winner.mode,
      salienceQuestion: winner.question,
      salienceReason: winner.reasons.join(" "),

      supportingSalienceOrgans: supports.map(item => ({
        lead: item.lead,
        score: item.score,
        mode: item.mode,
        reasons: item.reasons
      })),

      rankedSalienceDecisions: candidates.map(item => ({
        lead: item.lead,
        score: item.score,
        mode: item.mode,
        question: item.question,
        reasons: item.reasons
      })),

      source: "ari-salience-governor"
    };
  }
};