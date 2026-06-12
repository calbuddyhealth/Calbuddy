// ari/language-system/ari-language-reflection-questions.js
// Ari Reflection Question Engine
// Purpose: Select the best question when Ari needs deeper signal.
// V1.2

window.Ari = window.Ari || {};

window.Ari.languageReflectionQuestions = {
  version: "1.2.0",

  generate(analysis = {}) {
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};

    const insight = analysis.insight || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const underlyingEmotion = analysis.underlyingEmotion || {};
    const signals = analysis.signals || {};
    const salience = analysis.salience || {};

    const tradeoff = insight.tradeoff?.name;
    const pattern = insight.pattern?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const hypothesis = insight.hypothesis?.name;

    const lifeChapter = personModel.lifeChapter?.name;
    const primaryBelief = beliefModel.primaryBelief?.name;
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const protecting = emotionalIntelligence.protecting?.name;
    const emotionDepth =
      underlyingEmotion.primaryUnderlyingEmotion?.name;

    const lead =
      salience.recommendedLead ||
      signals.recommendedLanguageLead ||
      null;

    if (
      wisdomRecovery.shouldRecover &&
      wisdomRecovery.primaryQuestion
    ) {
      return wisdomRecovery.primaryQuestion;
    }

    if (emotionRecovery.primaryQuestion) {
      return emotionRecovery.primaryQuestion;
    }

    // --------------------------------------------------
    // HUMAN NEED RECOVERY
    // --------------------------------------------------

    if (rootNeed === "worth") {
      return this.pick([
        "What happened that made you feel disrespected?",
        "Where are you feeling the loss of respect most strongly?",
        "What would feeling respected look like in this situation?",
        "Has this feeling been building for a while or did something specific trigger it?",
        "Whose opinion seems to carry the most weight here?"
      ]);
    }

    if (rootNeed === "connection") {
      return this.pick([
        "Where are you feeling most disconnected right now?",
        "What kind of connection feels missing?",
        "Who do you wish understood this better?",
        "What would feeling understood look like?",
        "Is the pain coming more from being alone or from feeling unseen?"
      ]);
    }

    if (
      rootNeed === "security" ||
      rootNeed === "body"
    ) {
      return this.pick([
        "What feels most uncertain right now?",
        "What are you trying to protect?",
        "What would help you feel safer in this situation?",
        "What outcome worries you most?",
        "If things went well, what would stability look like?"
      ]);
    }

    if (rootNeed === "meaning") {
      return this.pick([
        "Why does this matter so much to you?",
        "What feels meaningful about this moment?",
        "What larger story does this seem connected to?",
        "What do you think life may be asking from you here?",
        "What would make this experience feel worthwhile?"
      ]);
    }

    if (rootNeed === "understanding") {
      return this.pick([
        "What feels most unclear right now?",
        "What information do you feel is missing?",
        "What are you trying hardest to understand?",
        "If you could know one thing with certainty, what would it be?",
        "What question keeps returning to you?"
      ]);
    }

    // --------------------------------------------------
    // UNDERLYING EMOTION QUESTIONS
    // --------------------------------------------------

    if (emotionDepth === "fear_of_losing_identity") {
      return "Who would you be if that identity had to change shape without disappearing?";
    }

    if (emotionDepth === "fear_of_betraying_purpose") {
      return "What part of your purpose feels threatened by slowing down?";
    }

    if (emotionDepth === "fear_of_missing_irreplaceable_moments") {
      return "What moment are you most afraid you will not be able to get back later?";
    }

    if (emotionDepth === "fear_of_failing_family") {
      return "What would being faithful to your family look like without requiring perfection?";
    }

    if (emotionDepth === "fear_of_collapse_if_capacity_is_ignored") {
      return "What would need to change before capacity becomes protected instead of borrowed from?";
    }

    // --------------------------------------------------
    // LIFE CHAPTER QUESTIONS
    // --------------------------------------------------

    if (
      lead === "life_chapter" ||
      lifeChapter === "career_and_identity_transition"
    ) {
      return "What part of you are you afraid will not survive this transition?";
    }

    if (
      lifeChapter === "entering_fatherhood" ||
      lifeChapter === "fatherhood_transition"
    ) {
      return "What kind of father are you trying to become before you feel fully ready?";
    }

    if (lifeChapter === "fatherhood_and_transition") {
      return "What would it look like to become a father without abandoning the parts of you that still need to grow?";
    }

    if (lifeChapter === "builder_development") {
      return "What would it look like to build with discipline instead of urgency?";
    }

    // --------------------------------------------------
    // BELIEF QUESTIONS
    // --------------------------------------------------

    if (primaryBelief === "slowing_down_means_falling_behind") {
      return "What would change if slowing down was discipline instead of failure?";
    }

    if (primaryBelief === "purpose_must_not_be_abandoned") {
      return "What rhythm would keep purpose alive without letting it consume everything?";
    }

    if (primaryBelief === "family_moments_are_irreplaceable") {
      return "What family moment needs protection before another goal gets added?";
    }

    if (primaryBelief === "achievement_creates_security") {
      return "What kind of security are you trying to earn through achievement?";
    }

    // --------------------------------------------------
    // CONFLICT QUESTIONS
    // --------------------------------------------------

    if (hiddenConflict === "identity_vs_transition") {
      return "What old identity are you trying to protect, and what new identity is trying to form?";
    }

    if (hiddenConflict === "provider_vs_presence") {
      return "Where are you confusing providing more with being present more?";
    }

    if (hiddenConflict === "family_vs_purpose") {
      return "What would it look like for purpose to serve family instead of compete with it?";
    }

    if (wisdomResolution.leadingGood === "capacity") {
      return "What would need to come off your plate for capacity to actually lead?";
    }

    if (
      wisdomResolution.leadingGood === "family" ||
      wisdomResolution.leadingGood === "presence"
    ) {
      return "What would change if presence did not have to be earned first?";
    }

    if (
      wisdom.highestGood ===
      "protect_purpose_without_worshiping_speed"
    ) {
      return "What would it look like to protect purpose without forcing it to move at full speed?";
    }

    if (
      pattern === "achievement_before_presence" ||
      tradeoff === "presence_vs_acceleration"
    ) {
      return "What would change if presence did not have to be earned first?";
    }

    if (pattern === "too_many_primary_roles") {
      return "Which role needs to lead this season, and which roles need to support instead of compete?";
    }

    if (meaning.theme === "family_transition") {
      return "What would it look like to measure this season by presence instead of progress?";
    }

    if (meaning.theme === "identity_overload") {
      return "Which identity is asking for too much authority right now?";
    }

    if (tradeoff === "growth_vs_stability") {
      return "What would growth look like if stability had to be protected too?";
    }

    if (hypothesis === "achievement_before_arrival") {
      return "What would it feel like to stop moving the finish line for peace?";
    }

    if (rootNeed === "secure_family_presence") {
      return "What would make your family feel secure in your presence, not just your effort?";
    }

    if (protecting === "future_family") {
      return "What future family moment are you trying to protect right now?";
    }

    return "What part of this feels most true?";
  },

  pick(options = []) {
    if (!Array.isArray(options) || !options.length) {
      return null;
    }

    const index = Math.floor(Math.random() * options.length);
    return options[index];
  }
};