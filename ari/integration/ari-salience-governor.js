// ari/integration/ari-salience-governor.js
// Ari Salience Governor
// Purpose: Decide which organ/system should lead the response.
// V1.7
// Fixes:
// - Split helper logic into ari-salience-governor-core.js.
// - Separates body organism needs from relational organism needs.
// - Body survival needs route to safety.
// - Connection/loneliness routes to emotion instead of safety.
// - Prevents body stabilization from being triggered by attachment pain.
// - Keeps uncertainty override only when no strong human/organism need exists.

window.AriSalienceGovernor = {
  version: "1.6.0",

  govern(input = {}) {
    const summary = input.summary || input || {};
    const core = window.AriSalienceGovernorCore;

    if (!core) {
      console.warn("[AriSalienceGovernor] Missing AriSalienceGovernorCore.");
    }

    const helper = core || {
      clampScore: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0))),
      priorityForLead: () => 0,
      isBodyOrganismFunction: () => false,
      isRelationalOrganismFunction: () => false,
      addCandidate: (candidates, lead, score, reason, mode, question = null) => {
        candidates.push({
          lead,
          score,
          reasons: [reason],
          mode,
          question,
          priority: 0
        });
      }
    };

    const candidates = [];

    const uncertaintyType = summary.uncertaintyType || null;
    const uncertaintyConfidenceRaw = Number(summary.uncertaintyConfidence || 0);

    const primaryHumanNeed = summary.primaryHumanNeed || null;
    const primaryHumanNeedScoreRaw = Number(summary.primaryHumanNeedScore || 0);
    const needRecommendedLeadOrgan = summary.needRecommendedLeadOrgan || null;
    const needResponseMode = summary.needResponseMode || null;

    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismPrimaryFunction =
      summary.organismPrimaryFunction ||
      summary.organismFunction ||
      null;

    const organismPrimaryFunctionScoreRaw =
      Number(summary.organismPrimaryFunctionScore || 0);

    const organismUrgency = summary.organismUrgency || {};
    const organismUrgencyLevel =
      organismUrgency.level ||
      summary.organismUrgencyLevel ||
      null;

    const organismRecommendedMode = summary.organismRecommendedMode || null;
    const organismRecommendedAction = summary.organismRecommendedAction || null;

    const organismIsBodyFunction =
      helper.isBodyOrganismFunction(organismPrimaryFunction);

    const organismIsRelationalFunction =
      helper.isRelationalOrganismFunction(organismPrimaryFunction);

    const primaryLifeChapter = summary.primaryLifeChapter || null;
    const lifeChapterStrengthRaw = Number(summary.lifeChapterStrength || 0);

    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

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

    const uncertaintyConfidence = helper.clampScore(uncertaintyConfidenceRaw, 0, 100);
    const primaryHumanNeedScore = helper.clampScore(primaryHumanNeedScoreRaw, 0, 100);
    const organismPrimaryFunctionScore = helper.clampScore(organismPrimaryFunctionScoreRaw, 0, 100);
    const lifeChapterStrength = helper.clampScore(lifeChapterStrengthRaw, 0, 100);
    const leadIdentityScore = helper.clampScore(leadIdentityScoreRaw, 0, 100);
    const stewardshipScore = helper.clampScore(stewardshipScoreRaw, 0, 100);
    const fearScore = helper.clampScore(fearScoreRaw, 0, 100);

    const strongHumanNeed =
      primaryHumanNeed &&
      primaryHumanNeed !== "understanding" &&
      primaryHumanNeedScore >= 80;

    const strongBodyOrganismNeed =
      organismIsBodyFunction &&
      (
        organismNeedsStabilization ||
        organismUrgencyLevel === "critical" ||
        organismUrgencyLevel === "high" ||
        organismUrgencyLevel === "moderate"
      );

    const strongRelationalOrganismNeed =
      organismIsRelationalFunction &&
      primaryHumanNeedScore >= 75;

    const emotionHumanNeed =
      strongHumanNeed &&
      ["connection", "worth", "belonging"].includes(primaryHumanNeed);

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

    const directIntentSupported =
  summary.shouldSuppressUncertainty === true ||
  uncertaintyType === "direct_intent_supported" ||
  ["knowledge_teaching_domain", "planning_domain", "building_domain", "wisdom_domain"].includes(summary.domainLead) ||
  ["teach_clearly", "plan_next_step", "build_or_debug", "wisdom_resolution", "wisdom_clarity"].includes(summary.domainMode) ||
  ["teach_clearly", "create_priority_structure", "build_or_debug", "reflect_wisely"].includes(summary.responseIntent);

const shouldUncertaintyOverride =

  !directIntentSupported &&

  noHypothesis &&

  noEvidence &&

  strongestSignalCategory !== "underlying_emotion" &&

  !strongHumanNeed &&

  !strongBodyOrganismNeed &&

  !strongRelationalOrganismNeed;

    const defaultMissingInformationQuestion =
      "What feels important here that has not been said out loud yet?";

    // 0. True body organism functions lead safety.
    if (strongBodyOrganismNeed) {
      helper.addCandidate(
        candidates,
        "safety",
        organismUrgencyLevel === "critical" ? 120 : 115,
        `Body organism function '${organismPrimaryFunction || "unknown"}' needs stabilization before interpretation.`,
        organismRecommendedMode || "stabilize_body_first",
        organismRecommendedAction || "What does your body need first right now?"
      );
    }

    // 1. Relational organism functions lead emotion/connection, not safety.
    if (
      strongRelationalOrganismNeed ||
      primaryHumanNeed === "connection" ||
      primaryHumanNeed === "belonging" ||
      needResponseMode === "restore_connection"
    ) {
      helper.addCandidate(
        candidates,
        "emotion",
        Math.max(primaryHumanNeedScore + 10, 92),
        "Connection or attachment rupture is active, so Ari should restore connection before analysis.",
        "restore_connection",
        "What feels most lonely about this right now?"
      );
    }

    // 2. Human Need Network.
    if (securityHumanNeed) {
      helper.addCandidate(
        candidates,
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
      helper.addCandidate(
        candidates,
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
      helper.addCandidate(
        candidates,
        "identity",
        primaryHumanNeedScore + 8,
        "A strong identity need is active, so identity should guide the response.",
        needResponseMode || "clarify_identity",
        "Who are you trying to become in this moment?"
      );
    }

    if (purposeHumanNeed) {
      helper.addCandidate(
        candidates,
        "meaning",
        primaryHumanNeedScore + 8,
        "A strong purpose need is active, so meaning should guide the response.",
        needResponseMode || "clarify_purpose",
        "What purpose feels like it is asking for your attention?"
      );
    }

    if (wisdomHumanNeed) {
      helper.addCandidate(
        candidates,
        "wisdom",
        primaryHumanNeedScore + 8,
        "A strong wisdom need is active, so wisdom should guide the response.",
        needResponseMode || "choose_what_leads",
        "Which good thing should lead right now?"
      );
    }

// 2.5. Direct intent should lead by domain, with uncertainty supporting.
if (directIntentSupported) {
  helper.addCandidate(
    candidates,
    summary.domainLeadOrgan ||
      (summary.responseIntent === "build_or_debug" ? "builder" :
       summary.responseIntent === "create_priority_structure" ? "planner" :
       summary.responseIntent === "reflect_wisely" ? "wisdom" :
       "teacher"),
    125,
    "Direct user intent is clear, so the relevant domain should lead while uncertainty supports.",
    summary.domainMode ||
      (summary.responseIntent === "build_or_debug" ? "build_or_debug" :
       summary.responseIntent === "create_priority_structure" ? "plan_next_step" :
       summary.responseIntent === "reflect_wisely" ? "wisdom_clarity" :
       "teach_clearly"),
    null
  );
}


    // 3. Uncertainty only leads when no strong need is active.
    if (
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty" ||
      shouldUncertaintyOverride
    ) {
      if (
        !strongHumanNeed &&
        !strongBodyOrganismNeed &&
        !strongRelationalOrganismNeed
      ) {
        helper.addCandidate(
          candidates,
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

    // 4. Life chapter.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      primaryLifeChapter &&
      primaryLifeChapter !== "unclear_chapter" &&
      lifeChapterStrength >= 70
    ) {
      helper.addCandidate(
        candidates,
        "meaning",
        lifeChapterStrength + 10,
        "A strong life chapter is active, so meaning/life chapter should lead.",
        "protect_life_chapter",
        summary.lifeChapterQuestion ||
          "What feels different about this season of life?"
      );
    }

    // 5. Identity.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      leadIdentity &&
      leadIdentity !== "observer" &&
      leadIdentityScore >= 70
    ) {
      helper.addCandidate(
        candidates,
        "identity",
        leadIdentityScore + 6,
        "A clear lead identity is active, so identity should guide the response.",
        "identity_leadership",
        summary.identityConflictQuestion ||
          summary.identityRecoveryQuestion ||
          "Which part of you should lead this moment?"
      );
    }

    // 6. Values.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      (valueIntegrationDetected || integratedValue)
    ) {
      helper.addCandidate(
        candidates,
        "values",
        82,
        "Ari detected a deeper value integration opportunity.",
        "integrate_values",
        summary.valueIntegrationQuestion ||
          "What deeper good are both sides trying to protect?"
      );
    }

    // 7. Stewardship.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      (
        emotionalClassification === "stewardship" ||
        stewardshipScore >= fearScore + 15
      )
    ) {
      helper.addCandidate(
        candidates,
        "stewardship",
        84,
        "The emotional pattern looks more like stewardship than fear.",
        "stewardship_not_fear",
        "What has been entrusted to you that needs careful stewardship?"
      );
    }

    // 8. Emotion.
    if (
      !strongBodyOrganismNeed &&
      (
        uncertaintyType === "emotion_uncertainty" ||
        strongestSignalCategory === "underlying_emotion"
      )
    ) {
      const emotionHasOverrideStrength =
        strongestSignalCategory === "underlying_emotion" &&
        !primaryLifeChapter &&
        !leadIdentity;

      helper.addCandidate(
        candidates,
        "emotion",
        emotionHasOverrideStrength ? 96 : 90,
        "An underlying emotion appears central enough to guide the response.",
        "emotion_depth",
        summary.emotionRecoveryQuestion ||
          "What feeling is hardest to admit underneath this?"
      );
    }

    // 9. Wisdom.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      wisdomTension &&
      wisdomTension !== "unclear" &&
      wisdomConfidence !== "low"
    ) {
      helper.addCandidate(
        candidates,
        "wisdom",
        80,
        "A real wisdom tension is present and should guide resolution.",
        "wisdom_resolution",
        "Which good thing should lead, and which should support?"
      );
    }

    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      !noEvidence &&
      (highestGood || wisdomLeadingGood)
    ) {
      helper.addCandidate(
        candidates,
        "wisdom",
        98,
        "Highest good or leading good signal supports wisdom leadership.",
        "wisdom_resolution",
        "What good should lead right now?"
      );
    }

    // 10. Strongest signal fallback.
    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      strongestSignalCategory === "life"
    ) {
      helper.addCandidate(
        candidates,
        "meaning",
        86,
        `Strongest signal '${strongestSignal}' is life-related.`,
        "life_chapter",
        "What feels different about this season of life?"
      );
    }

    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      strongestSignalCategory === "belief"
    ) {
      helper.addCandidate(
        candidates,
        "belief",
        84,
        `Strongest signal '${strongestSignal}' is belief-related.`,
        "belief_reflection",
        "What assumption are you making that might be shaping this?"
      );
    }

    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      strongestSignalCategory === "identity"
    ) {
      helper.addCandidate(
        candidates,
        "identity",
        86,
        `Strongest signal '${strongestSignal}' is identity-related.`,
        "identity_reflection",
        "Which part of you feels most responsible for this?"
      );
    }

    if (
      !shouldUncertaintyOverride &&
      !strongBodyOrganismNeed &&
      strongestSignalCategory === "highest_good"
    ) {
      helper.addCandidate(
        candidates,
        "wisdom",
        88,
        `Strongest signal '${strongestSignal}' points toward a highest-good question.`,
        "wisdom_clarity",
        "What good are you trying to protect most right now?"
      );
    }

    if (candidates.length === 0) {
      helper.addCandidate(
        candidates,
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
        organismPrimaryFunction,
        organismPrimaryFunctionScoreRaw,
        organismPrimaryFunctionScore,
        organismUrgencyLevel,
        organismIsBodyFunction,
        organismIsRelationalFunction,
        strongBodyOrganismNeed,
        strongRelationalOrganismNeed,
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