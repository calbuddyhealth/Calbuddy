// ari/integration/ari-salience-governor.js
// Ari Salience Governor
// Purpose: Decide which organ/system should lead the response.
// V1.5
// Fixes:
// - Adds Organism Function Engine priority.
// - Organism stabilization can override uncertainty, meaning, wisdom, values, and abstract interpretation.
// - Body/security survival needs route to safety.
// - Keeps Human Needs Network override behavior.
// - Keeps true uncertainty override intact when no strong human/organism need exists.

window.AriSalienceGovernor = {
  version: "1.5.0",

  govern(input = {}) {
    const summary = input.summary || input || {};

    const candidates = [];

    const uncertaintyType = summary.uncertaintyType || null;
    const uncertaintyConfidenceRaw = Number(summary.uncertaintyConfidence || 0);

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const primaryHumanNeedScoreRaw = Number(summary.primaryHumanNeedScore || 0);
    const needRecommendedLeadOrgan = summary.needRecommendedLeadOrgan || null;
    const needResponseMode = summary.needResponseMode || null;

    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismPrimaryFunction = summary.organismPrimaryFunction || null;
    const organismPrimaryFunctionScoreRaw = Number(summary.organismPrimaryFunctionScore || 0);
    const organismUrgency = summary.organismUrgency || {};
    const organismUrgencyLevel = organismUrgency.level || null;
    const organismRecommendedMode = summary.organismRecommendedMode || null;
    const organismRecommendedAction = summary.organismRecommendedAction || null;

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

    function clampScore(value, min = 0, max = 100) {
      const n = Number(value || 0);
      return Math.max(min, Math.min(max, n));
    }

    const uncertaintyConfidence = clampScore(uncertaintyConfidenceRaw, 0, 100);
    const primaryHumanNeedScore = clampScore(primaryHumanNeedScoreRaw, 0, 100);
    const organismPrimaryFunctionScore = clampScore(organismPrimaryFunctionScoreRaw, 0, 100);
    const lifeChapterStrength = clampScore(lifeChapterStrengthRaw, 0, 100);
    const leadIdentityScore = clampScore(leadIdentityScoreRaw, 0, 100);
    const stewardshipScore = clampScore(stewardshipScoreRaw, 0, 100);
    const fearScore = clampScore(fearScoreRaw, 0, 100);

    const strongHumanNeed =
      primaryHumanNeed &&
      primaryHumanNeed !== "understanding" &&
      primaryHumanNeedScore >= 80;

    const strongOrganismNeed =
      organismNeedsStabilization ||
      organismUrgencyLevel === "critical" ||
      organismUrgencyLevel === "high" ||
      organismUrgencyLevel === "moderate";

    const emotionHumanNeed =
      strongHumanNeed &&
      ["connection", "worth"].includes(primaryHumanNeed);

    const identityHumanNeed =
      strongHumanNeed &&
      primaryHumanNeed === "identity";

    const purposeHumanNeed =
      strongHumanNeed &&
      primaryHumanNeed === "purpose";

    const wisdomHumanNeed =
      strongHumanNeed &&
      primaryHumanNeed === "wisdom";

    const securityHumanNeed =
      strongHumanNeed &&
      ["body", "security"].includes(primaryHumanNeed);

    const shouldUncertaintyOverride =
      noHypothesis &&
      noEvidence &&
      strongestSignalCategory !== "underlying_emotion" &&
      !strongHumanNeed &&
      !strongOrganismNeed;

    const defaultMissingInformationQuestion =
      "What feels important here that has not been said out loud yet?";

    function priorityForLead(lead) {
      const priority = {
        safety: 110,
        uncertainty: 100,
        meaning: 90,
        identity: 85,
        wisdom: 80,
        values: 75,
        executive: 72,
        stewardship: 70,
        emotion: 68,
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

    // 0. Organism Function Engine should lead before uncertainty, meaning, wisdom, or values.
    if (strongOrganismNeed) {
      addCandidate(
        "safety",
        organismUrgencyLevel === "critical" ? 120 : 115,
        `Organism function '${organismPrimaryFunction || "unknown"}' needs stabilization before interpretation.`,
        organismRecommendedMode || "stabilize_body_first",
        organismRecommendedAction || "What does your body need first right now?"
      );
    }

    // 1. Human Need Network should influence salience before uncertainty.
    if (securityHumanNeed) {
      addCandidate(
        needRecommendedLeadOrgan === "safety" ? "safety" : "executive",
        primaryHumanNeedScore + 10,
        `Strong human need '${primaryHumanNeed}' detected, so protection/stability should lead.`,
        needResponseMode || "protect_security",
        primaryHumanNeed === "body"
          ? "What does your body need first right now?"
          : "What needs to be protected first?"
      );
    }

    if (emotionHumanNeed) {
      addCandidate(
        "emotion",
        primaryHumanNeedScore + 12,
        `Strong human need '${primaryHumanNeed}' detected, so emotion should lead instead of uncertainty.`,
        needResponseMode || "restore_dignity",
        primaryHumanNeed === "worth"
          ? "What happened that made you feel disrespected?"
          : "What made you feel alone or disconnected?"
      );
    }

    if (identityHumanNeed) {
      addCandidate(
        "identity",
        primaryHumanNeedScore + 8,
        "A strong identity need is active, so identity should guide the response.",
        needResponseMode || "clarify_identity",
        "Who are you trying to become in this moment?"
      );
    }

    if (purposeHumanNeed) {
      addCandidate(
        "meaning",
        primaryHumanNeedScore + 8,
        "A strong purpose need is active, so meaning should guide the response.",
        needResponseMode || "clarify_purpose",
        "What purpose feels like it is asking for your attention?"
      );
    }

    if (wisdomHumanNeed) {
      addCandidate(
        "wisdom",
        primaryHumanNeedScore + 8,
        "A strong wisdom need is active, so wisdom should guide the response.",
        needResponseMode || "choose_what_leads",
        "Which good thing should lead right now?"
      );
    }

    // 2. Uncertainty should lead when Ari lacks evidence AND no strong human/organism need is active.
    if (
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty" ||
      shouldUncertaintyOverride
    ) {
      if (!strongHumanNeed && !strongOrganismNeed) {
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
    }

    // 3. Major life chapters should lead when a real chapter is active.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 4. Identity should lead when a clear role has priority.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 5. Values can lead when integration is meaningful.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 6. Stewardship should beat fear when responsibility is dominant.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 7. Emotion leads when emotion is clearly central.
    if (
      !strongOrganismNeed &&
      (
        uncertaintyType === "emotion_uncertainty" ||
        strongestSignalCategory === "underlying_emotion"
      )
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

    // 8. Wisdom leads only when there is a real, named tension.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 9. Highest good / leading good can support wisdom, but not when evidence is absent.
    if (
      !shouldUncertaintyOverride &&
      !strongOrganismNeed &&
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

    // 10. Strongest signal category fallback.
    if (!shouldUncertaintyOverride && !strongOrganismNeed && strongestSignalCategory === "life") {
      addCandidate(
        "meaning",
        86,
        `Strongest signal '${strongestSignal}' is life-related.`,
        "life_chapter",
        "What feels different about this season of life?"
      );
    }

    if (!shouldUncertaintyOverride && !strongOrganismNeed && strongestSignalCategory === "belief") {
      addCandidate(
        "belief",
        84,
        `Strongest signal '${strongestSignal}' is belief-related.`,
        "belief_reflection",
        "What assumption are you making that might be shaping this?"
      );
    }

    if (!shouldUncertaintyOverride && !strongOrganismNeed && strongestSignalCategory === "identity") {
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
      !strongOrganismNeed &&
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
        primaryHumanNeedScoreRaw,
        primaryHumanNeedScore,
        organismPrimaryFunctionScoreRaw,
        organismPrimaryFunctionScore,
        organismUrgencyLevel,
        strongOrganismNeed,
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