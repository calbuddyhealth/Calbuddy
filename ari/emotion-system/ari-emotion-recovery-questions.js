// ari/emotion-system/ari-emotion-recovery-questions.js
// Ari Emotion Recovery Questions
// Purpose: Generate deeper emotional-source questions when emotion is unclear or partially detected.
// V2.0

window.Ari = window.Ari || {};

window.Ari.emotionRecoveryQuestions = {
  version: "2.0.0",

  generate({
    underlyingEmotion = {},
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {},
    lifeChapter = {},
    identityPriority = {}
  } = {}) {
    const primary = underlyingEmotion.primaryUnderlyingEmotion || {};
    const emotionName = primary.name || "unclear";

    if (emotionName && emotionName !== "unclear") {
      return {
        shouldAsk: true,
        questionType: "deepen_detected_emotion",
        primaryQuestion: this.questionForEmotion(emotionName, primary),
        supportingQuestions: this.supportingQuestionsForEmotion(emotionName, primary),
        recoveryQuestionVersion: this.version,
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
        wisdom,
        lifeChapter,
        identityPriority
      }),
      supportingQuestions: this.supportingQuestionsForUnclearEmotion({
        emotionalIntelligence,
        insight,
        meaning,
        personModel,
        beliefModel,
        wisdom,
        lifeChapter,
        identityPriority
      }),
      recoveryQuestionVersion: this.version,
      source: "ari-emotion-recovery-questions"
    };
  },

  questionForEmotion(emotionName = "", primary = {}) {
    const map = {
      body_alarm_needing_stabilization:
        "What does your body need first before we try to interpret this?",

      fear_of_being_unwanted:
        "What part of this feels most alone or unwanted right now?",

      fear_of_not_being_enough:
        "What outcome are you afraid would prove you are not enough?",

      love_with_nowhere_to_go:
        "What part of this loss still feels like it needs somewhere to go?",

      loss_of_meaning:
        "What used to make this feel meaningful that feels missing now?",

      fear_of_wrong_direction:
        "What decision feels hardest to trust right now?",

      fear_rebuilding_will_not_work:
        "What are you afraid will happen if you try to rebuild and it still feels hard?",

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
      body_alarm_needing_stabilization: [
        "Have you eaten, slept, hydrated, or addressed the physical symptom yet?",
        "Is this a body signal that needs action before reflection?"
      ],

      fear_of_being_unwanted: [
        "Did this make you feel rejected, forgotten, or unchosen?",
        "What would connection look like right now?"
      ],

      fear_of_not_being_enough: [
        "What are you afraid this says about you?",
        "Can this be painful without becoming your identity?"
      ],

      love_with_nowhere_to_go: [
        "What do you miss most about the bond?",
        "What would honoring the loss look like without rushing yourself?"
      ],

      loss_of_meaning: [
        "Did the meaning disappear, or did exhaustion cover it?",
        "What small thing still matters, even if motivation is low?"
      ],

      fear_of_wrong_direction: [
        "Are you waiting for certainty, or just enough clarity?",
        "What would be the smallest reversible step?"
      ],

      fear_rebuilding_will_not_work: [
        "What would count as progress even if it is slow?",
        "What support would make rebuilding less lonely?"
      ],

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
      "Is this more fear, guilt, grief, shame, loneliness, pressure, hope, or responsibility?",
      "What would be hardest to admit out loud?"
    ];
  },

  questionForUnclearEmotion({
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {},
    lifeChapter = {},
    identityPriority = {}
  } = {}) {
    const pattern = insight.pattern?.name;
    const belief = beliefModel.primaryBelief?.name;
    const role = personModel.snapshot?.primaryRole;
    const need = emotionalIntelligence.rootNeed?.name;
    const classification = emotionalIntelligence.emotionalClassification;
    const highestGood = wisdom.highestGood;
    const chapter = lifeChapter.primaryLifeChapter;
    const leadIdentity = identityPriority.leadIdentity;

    if (
      classification === "body_stabilization" ||
      need === "body_stabilization" ||
      chapter === "body_health_chapter"
    ) {
      return "What does your body need first before we try to interpret this?";
    }

    if (
      classification === "connection_pain" ||
      need === "connection" ||
      chapter === "relationship_rupture_chapter"
    ) {
      return "What part of this feels most alone right now?";
    }

    if (
      classification === "worth_pain" ||
      need === "worth" ||
      belief === "failure_means_i_am_not_enough"
    ) {
      return "What are you afraid this says about your worth?";
    }

    if (
      classification === "grief" ||
      need === "honored_grief" ||
      chapter === "grief_loss_chapter"
    ) {
      return "What part of this loss needs to be honored before anything is fixed?";
    }

    if (
      classification === "meaning_loss" ||
      need === "meaning" ||
      chapter === "meaning_crisis_chapter"
    ) {
      return "What feels disconnected from meaning right now?";
    }

    if (
      chapter === "uncertainty_transition_chapter" ||
      need === "clarity"
    ) {
      return "What feels most uncertain right now?";
    }

    if (
      chapter === "recovery_rebuilding_chapter" ||
      leadIdentity === "rebuilding-self"
    ) {
      return "What are you trying to rebuild right now?";
    }

    if (
      pattern === "responsibility_before_recovery" ||
      belief === "responsibility_comes_before_rest" ||
      role === "provider" ||
      leadIdentity === "steward"
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
      highestGood === "protect_purpose_without_worshiping_speed" ||
      chapter === "purpose_mission_chapter"
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
    wisdom = {},
    lifeChapter = {},
    identityPriority = {}
  } = {}) {
    const questions = [];
    const chapter = lifeChapter.primaryLifeChapter;
    const leadIdentity = identityPriority.leadIdentity;

    if (emotionalIntelligence.rootNeed?.name) {
      questions.push(
        `What makes ${String(emotionalIntelligence.rootNeed.name).replaceAll("_", " ")} feel threatened right now?`
      );
    }

    if (chapter && chapter !== "unclear_chapter") {
      questions.push(
        `What does this ${chapter.replaceAll("_", " ")} feel like it is asking from you?`
      );
    }

    if (leadIdentity && leadIdentity !== "observer") {
      questions.push(
        `What does the ${leadIdentity.replaceAll("-", " ")} part of you feel responsible for?`
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
        "Is this more fear, guilt, grief, shame, loneliness, pressure, hope, or responsibility?"
      );
      questions.push(
        "What would be hardest to admit out loud?"
      );
    }

    return [...new Set(questions)].slice(0, 3);
  }
};