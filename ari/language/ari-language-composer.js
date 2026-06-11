// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Convert synthesis into natural, human, context-aware language.
// V1.1
// Fixes:
// - Stops leaking internal labels like purpose_chapter or builder_development.
// - Makes responses warmer, cleaner, and more human.
// - Uses Rebirth signals without sounding like a debug report.

window.AriLanguageComposer = {
  compose(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const recommendedQuestion =
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      null;

    const primaryLifeChapter =
      summary.primaryLifeChapter || null;

    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    const supportIdentity =
      summary.resolvedSupportingIdentity ||
      summary.supportIdentity ||
      null;

    const emotionalClassification =
      summary.emotionalClassification || null;

    const wisdomTension =
      summary.wisdomTension || null;

    const wisdomResolvedStatement =
      summary.wisdomResolvedStatement ||
      summary.wisdomStatement ||
      null;

    const integratedValue =
      summary.integratedValue || null;

    const hypothesis =
      summary.hypothesis || null;

    const counterHypothesis =
      summary.counterHypothesis || null;

    const uncertaintyType =
      summary.uncertaintyType || null;

    const confidence =
      summary.calibratedConfidence ||
      summary.metaConfidence ||
      "unknown";

    let opening = "";
    let body = "";
    let closing = "";
    let mode = "reflection";

    function humanizeLabel(label = "") {
      return String(label)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .trim();
    }

    function chapterPhrase(chapter) {
      const map = {
        purpose_chapter:
          "staying connected to the purpose behind what you are building",
        builder_development:
          "becoming the kind of builder who can create without burning out",
        creative_mission_chapter:
          "clarifying the future you are trying to create",
        family_transition:
          "protecting family, presence, and the relationships that cannot be replaced",
        fatherhood_transition:
          "stepping into fatherhood with presence, steadiness, and love",
        family_purpose_integration_chapter:
          "learning how purpose and family can support each other instead of competing"
      };

      return map[chapter] || humanizeLabel(chapter);
    }

    function identityPhrase(identity) {
      const map = {
        builder:
          "the builder part of you",
        planner:
          "the planner part of you",
        observer:
          "the observer part of you",
        caregiver:
          "the caregiver part of you",
        "family-protector":
          "the family-protector part of you",
        father:
          "the father part of you"
      };

      return map[identity] || `the ${humanizeLabel(identity)} part of you`;
    }

    function tensionPhrase(tension) {
      const map = {
        family_vs_purpose:
          "family and purpose",
        presence_vs_achievement:
          "presence and achievement",
        presence_vs_acceleration:
          "presence and acceleration",
        purpose_relationship_split:
          "purpose and relationship",
        clarity_before_action:
          "clarity and action"
      };

      return map[tension] || humanizeLabel(tension);
    }

    function valuePhrase(value) {
      const map = {
        meaningful_love:
          "a meaningful life rooted in love, service, and contribution",
        clarity:
          "clarity",
        sustainable_purpose:
          "sustainable purpose",
        protect_family:
          "protecting family",
        protect_purpose_without_worshiping_speed:
          "protecting purpose without worshiping speed"
      };

      return map[value] || humanizeLabel(value);
    }

    // Meaning-led responses
    if (leadOrgan === "meaning") {
      mode = "life_chapter";

      opening = "Something feels important about this chapter.";

      if (primaryLifeChapter) {
        body +=
          `This seems to be about ${chapterPhrase(primaryLifeChapter)}. `;
      }

      body +=
        "The point may not be to solve everything immediately. The point may be to understand what this season is asking from you. ";

      if (
        wisdomTension &&
        wisdomTension !== "unclear"
      ) {
        body +=
          `There may be a real tension between ${tensionPhrase(wisdomTension)}. `;
      }

      if (integratedValue) {
        body +=
          `The deeper value may be ${valuePhrase(integratedValue)}. `;
      }

      if (wisdomResolvedStatement) {
        body +=
          "Purpose can stay alive without demanding full speed from you in every season. ";
      }
    }

    // Identity-led responses
    else if (leadOrgan === "identity") {
      mode = "identity";

      opening = "This may be more about identity than circumstance.";

      if (leadIdentity) {
        body +=
          `${identityPhrase(leadIdentity)} seems to be trying to protect something important. `;
      }

      if (supportIdentity && supportIdentity !== leadIdentity) {
        body +=
          `At the same time, ${identityPhrase(supportIdentity)} may still need a voice. `;
      }

      if (leadIdentity === "builder") {
        body +=
          "The danger is not that you care too much. The danger is letting purpose become pressure. ";
      } else if (leadIdentity === "planner") {
        body +=
          "The planner part of you may be trying to create enough clarity before you move. ";
      } else if (
        leadIdentity === "father" ||
        leadIdentity === "family-protector"
      ) {
        body +=
          "This part of you may be trying to protect what cannot be replaced later. ";
      } else {
        body +=
          "Different parts of you may want different things, but not all of them should lead at the same time. ";
      }

      if (integratedValue) {
        body +=
          `The deeper value may be ${valuePhrase(integratedValue)}. `;
      }
    }

    // Values-led responses
    else if (leadOrgan === "values") {
      mode = "values";

      opening = "There may be a deeper value underneath both sides of this.";

      if (integratedValue) {
        body +=
          `This may be about ${valuePhrase(integratedValue)}. `;
      }

      body +=
        "Sometimes the conflict softens when the shared good becomes visible. ";
    }

    // Stewardship-led responses
    else if (leadOrgan === "stewardship") {
      mode = "stewardship";

      opening = "This may not be fear.";

      body +=
        "It may be stewardship. Responsibility, care, commitment, and preparation can feel intense without being unhealthy. ";

      body +=
        "The question is whether this pressure is helping you protect what matters or slowly exhausting the person who has to protect it. ";
    }

    // Emotion-led responses
    else if (leadOrgan === "emotion") {
      mode = "emotion";

      opening = "That sounds heavier than it looks.";

      if (
        emotionalClassification &&
        emotionalClassification !== "mixed"
      ) {
        body +=
          `This may carry ${humanizeLabel(emotionalClassification)} underneath it. `;
      } else {
        body +=
          "There may be an emotional signal underneath this, but it should be named carefully, not forced. ";
      }

      if (wisdomTension && wisdomTension !== "unclear") {
        body +=
          `It may also connect to the tension between ${tensionPhrase(wisdomTension)}. `;
      }
    }

    // Wisdom-led responses
    else if (leadOrgan === "wisdom") {
      mode = "wisdom";

      opening = "There appears to be a real tension here.";

      if (wisdomTension && wisdomTension !== "unclear") {
        body +=
          `This may be about ${tensionPhrase(wisdomTension)}. `;
      }

      if (integratedValue) {
        body +=
          `The deeper good may be ${valuePhrase(integratedValue)}. `;
      }

      if (wisdomResolvedStatement) {
        body +=
          "The goal is not to destroy one good for another. The goal is to put them in the right order. ";
      }
    }

    // Uncertainty-led responses
    else if (leadOrgan === "uncertainty") {
      mode = "uncertainty";

      opening = "Something is unclear here.";

      if (
        uncertaintyType === "mission_uncertainty" ||
        uncertaintyType === "life_chapter_uncertainty"
      ) {
        body +=
          "Ari can tell this matters, but the direction is not fully clear yet. ";
      } else {
        body +=
          "Ari does not have enough evidence to be confident yet. ";
      }

      body +=
        "More understanding is needed before a strong interpretation should be made. ";
    }

    // Observer fallback
    else {
      mode = "observer";

      opening = "Something important may be present.";

      body +=
        "Ari is still observing before reaching a stronger conclusion. ";
    }

    // Confidence adjustments
    if (confidence === "low") {
      body +=
        "Ari could be wrong and would want more evidence before making a stronger claim. ";
    }

    if (confidence === "unknown" && leadOrgan === "uncertainty") {
      body +=
        "There is not enough evidence yet to form a confident interpretation. ";
    }

    if (hypothesis && confidence !== "low") {
      // Keep this subtle. Do not overexplain the hypothesis.
      if (hypothesis === "purpose_abandonment_fear") {
        body +=
          "One possible pattern is that slowing down feels too close to abandoning the future you care about. ";
      }
    }

    if (counterHypothesis && leadOrgan !== "uncertainty") {
      if (counterHypothesis === "purpose_may_be_changing_form") {
        body +=
          "Another possibility is that purpose is not disappearing; it may just be changing form for this season. ";
      }
    }

    // Closing question
    closing =
      recommendedQuestion ||
      "What feels most important about this right now?";

    const finalResponse =
`${opening}

${body.trim()}

${closing}`;

    return {
      languageMode: mode,
      languageOpening: opening,
      languageBody: body.trim(),
      languageClosing: closing,
      finalResponse,
      source: "ari-language-composer"
    };
  }
};