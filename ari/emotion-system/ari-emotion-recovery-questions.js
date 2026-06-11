// ari/emotion-system/ari-emotion-recovery-questions.js
// Ari Emotion Recovery Questions
// Purpose: Generate deeper emotional-source questions when emotion is unclear or partially detected.
// V1.0

window.Ari = window.Ari || {};

window.Ari.emotionRecoveryQuestions = {
  version: "1.0.0",

  generate({
    underlyingEmotion = {},
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {}
  } = {}) {
    const primary = underlyingEmotion.primaryUnderlyingEmotion || {};
    const emotionName = primary.name || "unclear";

    if (emotionName && emotionName !== "unclear") {
      return {
        shouldAsk: true,
        questionType: "deepen_detected_emotion",
        primaryQuestion: this.questionForEmotion(emotionName, primary),
        supportingQuestions: this.supportingQuestionsForEmotion(emotionName, primary),
        source: "ari-emotion-recovery-questions"
      };
    }

    return {
      shouldAsk: true,
      questionType: "recover_unclear_emotion",
      primaryQuestion: this.questionForUnclearEmotion({
        emotionalIntelligence,
        insight,
        meaning,
        personModel,
        beliefModel,
        wisdom
      }),
      supportingQuestions: this.supportingQuestionsForUnclearEmotion({
        emotionalIntelligence,
        insight,
        meaning,
        personModel,
        beliefModel,
        wisdom
      }),
      source: "ari-emotion-recovery-questions"
    };
  },

  questionForEmotion(emotionName = "", primary = {}) {
    const map = {
      fear_of_losing_identity:
        "Who would you be if achievement had to slow down for a season?",

      fear_of_being_irresponsible:
        "What would feel irresponsible about resting, even if rest is necessary?",

      fear_of_failing_family:
        "What are you afraid your family would lose if you stopped carrying so much alone?",

      fear_of_missing_irreplaceable_moments:
        "What moment are you most afraid you will not be able to get back later?",

      fear_of_betraying_purpose:
        "What part of your purpose feels threatened by slowing down?",

      fear_of_collapse_if_capacity_is_ignored:
        "What are you afraid will collapse if you admit your capacity has limits?"
    };

    return (
      map[emotionName] ||
      primary.hiddenFear ||
      "What feeling underneath this is asking to be understood?"
    );
  },

  supportingQuestionsForEmotion(emotionName = "", primary = {}) {
    const map = {
      fear_of_losing_identity: [
        "If you were not building or achieving, what part of you would feel exposed?",
        "What identity are you afraid of losing?"
      ],

      fear_of_being_irresponsible: [
        "Who taught you that rest has to be earned?",
        "What would responsible recovery look like?"
      ],

      fear_of_failing_family: [
        "Are you trying to protect family through presence, control, provision, or sacrifice?",
        "What kind of protection does your family actually need from you right now?"
      ],

      fear_of_missing_irreplaceable_moments: [
        "What moments feel most time-sensitive right now?",
        "What would you protect if you believed those moments could not be recovered later?"
      ],

      fear_of_betraying_purpose: [
        "Does slowing down feel like discipline or betrayal?",
        "What rhythm would keep purpose alive without letting it consume everything?"
      ],

      fear_of_collapse_if_capacity_is_ignored: [
        "What are you carrying that nobody sees?",
        "What would need to be removed before you could honestly breathe?"
      ]
    };

    return map[emotionName] || [
      "Is this more fear, guilt, grief, pressure, hope, or responsibility?",
      "What would be hardest to admit out loud?"
    ];
  },

  questionForUnclearEmotion({
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {}
  } = {}) {
    const pattern = insight.pattern?.name;
    const belief = beliefModel.primaryBelief?.name;
    const role = personModel.snapshot?.primaryRole;
    const need = emotionalIntelligence.rootNeed?.name;
    const highestGood = wisdom.highestGood;

    if (
      pattern === "responsibility_before_recovery" ||
      belief === "responsibility_comes_before_rest" ||
      role === "provider"
    ) {
      return "What would feel threatened if you finally allowed yourself to recover?";
    }

    if (
      pattern === "achievement_before_presence" ||
      highestGood === "protect_presence"
    ) {
      return "What would feel unfinished if you chose presence before achievement?";
    }

    if (
      belief === "purpose_must_not_be_abandoned" ||
      highestGood === "protect_purpose_without_worshiping_speed"
    ) {
      return "What would slowing down make you afraid is true about your purpose?";
    }

    if (need === "secure_family_presence") {
      return "What are you most afraid your family will need from you before you feel ready?";
    }

    return "What feeling is underneath this that has not been named yet?";
  },

  supportingQuestionsForUnclearEmotion({
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {}
  } = {}) {
    const questions = [];

    if (emotionalIntelligence.rootNeed?.name) {
      questions.push(
        `What makes ${emotionalIntelligence.rootNeed.name.replaceAll("_", " ")} feel threatened right now?`
      );
    }

    if (beliefModel.primaryBelief?.name) {
      questions.push(
        "Is that belief protecting you, pressuring you, or both?"
      );
    }

    if (personModel.snapshot?.primaryRole && personModel.snapshot.primaryRole !== "unknown") {
      questions.push(
        `What does the ${personModel.snapshot.primaryRole} part of you feel responsible for?`
      );
    }

    if (insight.hiddenConflict?.name && insight.hiddenConflict.name !== "unclear") {
      questions.push(
        "What are you afraid would happen if one side of this conflict had to wait?"
      );
    }

    if (questions.length === 0) {
      questions.push(
        "Is this more fear, guilt, grief, pressure, hope, or responsibility?"
      );
      questions.push(
        "What would be hardest to admit out loud?"
      );
    }

    return questions.slice(0, 3);
  }
};