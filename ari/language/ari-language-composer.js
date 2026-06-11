// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Convert synthesis into natural, human, context-aware language.
// V1.0

window.AriLanguageComposer = {
  compose(input = {}) {

    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const synthesisStatement =
      summary.synthesisStatement ||
      "";

    const recommendedQuestion =
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      null;

    const primaryLifeChapter =
      summary.primaryLifeChapter || null;

    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    const emotionalClassification =
      summary.emotionalClassification ||
      null;

    const wisdomTension =
      summary.wisdomTension ||
      null;

    const wisdomResolvedStatement =
      summary.wisdomResolvedStatement ||
      summary.wisdomStatement ||
      null;

    const integratedValue =
      summary.integratedValue ||
      null;

    const confidence =
      summary.calibratedConfidence ||
      summary.metaConfidence ||
      "unknown";

    let opening = "";
    let body = "";
    let closing = "";
    let mode = "reflection";

    // Meaning-led responses

    if (leadOrgan === "meaning") {

      mode = "life_chapter";

      opening =
        "Something feels important about this chapter.";

      if (primaryLifeChapter) {

        body +=
          ` Ari is seeing signals consistent with '${primaryLifeChapter}'.`;
      }

      body +=
        " This may be less about solving a problem and more about understanding what this season is asking from you.";

      if (wisdomResolvedStatement) {
        body += " " + wisdomResolvedStatement;
      }
    }

    // Identity-led responses

    else if (leadOrgan === "identity") {

      mode = "identity";

      opening =
        "This may be more about identity than circumstance.";

      if (leadIdentity) {

        body +=
          ` The identity currently trying to lead appears to be '${leadIdentity}'.`;
      }

      body +=
        " Different identities often want different things. Clarity comes from deciding who should lead rather than letting every part compete equally.";
    }

    // Values-led responses

    else if (leadOrgan === "values") {

      mode = "values";

      opening =
        "There may be a deeper value underneath both sides of this.";

      if (integratedValue) {

        body +=
          ` Ari suspects the deeper value is '${integratedValue}'.`;
      }

      body +=
        " Sometimes conflicts disappear once the shared value becomes visible.";
    }

    // Stewardship-led responses

    else if (leadOrgan === "stewardship") {

      mode = "stewardship";

      opening =
        "This may not be fear.";

      body +=
        " It may be stewardship.";

      body +=
        " Responsibility, care, commitment, and preparation can sometimes feel similar to fear even though they come from a very different place.";
    }

    // Emotion-led responses

    else if (leadOrgan === "emotion") {

      mode = "emotion";

      opening =
        "That sounds heavier than it looks.";

      body +=
        " There may be an emotional signal underneath this that has not been fully named yet.";

      if (emotionalClassification) {

        body +=
          ` Ari currently sees signs of '${emotionalClassification}'.`;
      }
    }

    // Wisdom-led responses

    else if (leadOrgan === "wisdom") {

      mode = "wisdom";

      opening =
        "There appears to be a tension here.";

      if (wisdomTension) {

        body +=
          ` Ari sees a tension around '${wisdomTension}'.`;
      }

      if (wisdomResolvedStatement) {

        body +=
          " " + wisdomResolvedStatement;
      }
    }

    // Uncertainty-led responses

    else if (leadOrgan === "uncertainty") {

      mode = "uncertainty";

      opening =
        "Something is unclear here.";

      body +=
        " Ari does not have enough evidence to be confident yet.";

      body +=
        " More understanding is needed before a strong interpretation should be made.";
    }

    // Observer fallback

    else {

      mode = "observer";

      opening =
        "Something important may be present.";

      body +=
        " Ari is still observing before reaching a stronger conclusion.";
    }

    // Confidence adjustments

    if (confidence === "low") {

      body +=
        " Ari could easily be wrong and would want more evidence before making a stronger claim.";
    }

    if (confidence === "unknown") {

      body +=
        " There is not enough evidence yet to form a confident interpretation.";
    }

    // Closing question

    if (recommendedQuestion) {

      closing = recommendedQuestion;
    }
    else {

      closing =
        "What feels most important about this right now?";
    }

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