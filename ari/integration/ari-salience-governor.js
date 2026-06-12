// ari/integration/ari-salience-governor.js
// Ari Salience Governor
// Purpose: Decide which organ/system should lead the response.
// V1.3
// Fixes:
// - Updates missing_information question.
// - Prevents salience from reintroducing weak “missing information” wording.
// - Keeps uncertainty override intact.

window.AriSalienceGovernor = {
  govern(input = {}) {
    const summary = input.summary || input || {};

    const candidates = [];

    const uncertaintyType = summary.uncertaintyType || null;
    const uncertaintyConfidenceRaw = Number(summary.uncertaintyConfidence || 0);

    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const lifeChapterStrengthRaw = Number(summary.lifeChapterStrength || 0);

    const leadIdentity =
      summary.resolvedLeadIdentity || summary.leadIdentity || null;
    const leadIdentityScoreRaw = Number(summary.leadIdentityScore || 0);

    const valueIntegrationDetected = Boolean(summary.valueIntegrationDetected);
    const integratedValue = summary.integratedValue || null;

    const emotionalClassification = summary.emotionalClassification || null;
    const stewardshipScoreRaw = Number(summary.stewardshipScore || 0);
    const fearScoreRaw = Number(summary.fearScore || 0);

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

    const defaultMissingInformationQuestion =
      "What feels important here that has not been said out loud yet?";

    function clampScore(value, min = 0, max = 100) {
      const n = Number(value || 0);
      return Math.max(min, Math.min(max, n));
    }

    const uncertaintyConfidence = clampScore(uncertaintyConfidenceRaw, 0, 100);
    const lifeChapterStrength = clampScore(lifeChapterStrengthRaw, 0, 100);
    const leadIdentityScore = clampScore(leadIdentityScoreRaw, 0, 100);
    const stewardshipScore = clampScore(stewardshipScoreRaw, 0, 100);
    const fearScore = clampScore(fearScoreRaw, 0, 100);

    function priorityForLead(lead) {
      const priority = {
        uncertainty: 100,
        meaning: 90,
        identity: 85,
        wisdom: 80,
        values: 75,
        stewardship: 70,
        emotion: 60,
        belief: 55,
        observer: 10
      };

      return priority[lead] || 0;
    }

    function addCandidate(lead, score, reason, mode, question = null) {
      const normalizedScore = clampScore(score, 0, 120);
      const existing = candidates.find(c => c.lead === lead);

      if (existing) {
        existing.score = Math.max(existing.score, normalizedScore);
        existing.reasons.push(reason);
        if (!existing.question && question) existing.question = question;
        return;
      }

      candidates.push({
        lead,
        score: normalizedScore,
        reasons: [reason],
        mode,
        question,
        priority: priorityForLead(lead)
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
        Math.max(
          uncertaintyConfidence,
          shouldUncertaintyOverride ? 112 : 92
        ),
        "Ari lacks a grounded hypothesis and evidence, so uncertainty must lead before interpretation.",
        "continue_observing",
        summary.recommendedRecoveryQuestion ||
          defaultMissingInformationQuestion
      );
    }

    // 2. Major life chapters should lead when a real chapter is active.
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
        summary.lifeChapterQuestion ||
          "What feels different about this season of life?"
      );
    }

    // 3. Identity should lead when a clear role has priority.
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

    // 4. Values can lead when integration is meaningful.
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
      (
        emotionalClassification === "stewardship" ||
        stewardshipScore >= fearScore + 15
      )
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
      const emotionHasOverrideStrength =
        strongestSignalCategory === "underlying_emotion" &&
        !primaryLifeChapter &&
        !leadIdentity;

      addCandidate(
        "emotion",
        emotionHasOverrideStrength ? 96 : 90,
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
        98,
        "Highest good or leading good signal supports wisdom leadership.",
        "wisdom_resolution",
        "What good should lead right now?"
      );
    }

    // 9. Strongest signal category fallback.
    if (!shouldUncertaintyOverride && strongestSignalCategory === "life") {
      addCandidate(
        "meaning",
        86,
        `Strongest signal '${strongestSignal}' is life-related.`,
        "life_chapter",
        "What feels different about this season of life?"
      );
    }

    if (!shouldUncertaintyOverride && strongestSignalCategory === "belief") {
      addCandidate(
        "belief",
        84,
        `Strongest signal '${strongestSignal}' is belief-related.`,
        "belief_reflection",
        "What assumption are you making that might be shaping this?"
      );
    }

    if (!shouldUncertaintyOverride && strongestSignalCategory === "identity") {
      addCandidate(
        "identity",
        86,
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
        88,
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

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    });

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
        priority: item.priority,
        reasons: item.reasons
      })),

      salienceScoreNormalization: {
        uncertaintyConfidenceRaw,
        uncertaintyConfidence,
        lifeChapterStrengthRaw,
        lifeChapterStrength,
        leadIdentityScoreRaw,
        leadIdentityScore,
        stewardshipScoreRaw,
        stewardshipScore,
        fearScoreRaw,
        fearScore,
        source: "ari-salience-governor-normalization"
      },

      source: "ari-salience-governor"
    };
  }
};