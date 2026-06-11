// ari/language-system/ari-language-system.js
// Ari Language System
// Purpose: Convert Ari's analysis into short, human, useful responses.
// V6.1: Uses wisdom, regret, long-term consequence, underlying emotion depth, and recovery questions.

window.Ari = window.Ari || {};
 
window.Ari.languageSystem = {
  version: "6.1.0",

  generate(analysis = {}, options = {}) {
    const summary = window.Ari.core
      ? window.Ari.core.createSystemSummary(analysis)
      : {};

    const questionType =
      analysis.questionType || summary.questionType || "understanding";

    if (questionType === "meaning") return this.generateMeaningResponse(analysis, summary);
    if (questionType === "insight") return this.generateInsightResponse(analysis, summary);
    if (questionType === "emotional") return this.generateEmotionalResponse(analysis, summary);
    if (questionType === "decision") return this.generateDecisionResponse(analysis, summary);
    if (questionType === "planning") return this.generatePlanningResponse(analysis, summary);
    if (questionType === "building") return this.generateBuildingResponse(analysis, summary);

    return this.generateDefaultResponse(analysis, summary);
  },

  getVoice(analysis = {}) {
    return analysis.voice || {
      openingStyle: "steady_observation",
      confidenceStyle: { name: "tentative", prefix: "" },
      confidence: "low",
      structure: ["observation", "interpretation", "next_step"],
      stance: "steady_companion"
    };
  },

  getOpeningLine(analysis = {}) {
    const voice = this.getVoice(analysis);

    if (window.Ari.voiceEngine?.getOpeningLine) {
      return window.Ari.voiceEngine.getOpeningLine(voice);
    }

    return "The thing I notice first is this.";
  },

  hasWisdom(analysis = {}) {
    return Boolean(
      analysis.wisdom?.wisdomPrinciple ||
        analysis.wisdom?.wisdomStatement ||
        analysis.wisdomResolution?.resolvedStatement
    );
  },

  hasEmotionDepth(analysis = {}) {
    const depth = analysis.underlyingEmotion || {};
    return Boolean(
      depth.primaryUnderlyingEmotion?.name &&
        depth.primaryUnderlyingEmotion.name !== "unclear"
    );
  },

  shouldLeadWithWisdom(analysis = {}) {
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const insight = analysis.insight || {};
    const questionType = analysis.questionType || "";

    if (!this.hasWisdom(analysis)) return false;

    if (
      questionType === "decision" ||
      questionType === "planning" ||
      questionType === "meaning"
    ) {
      return true;
    }

    if (
      wisdom.confidence === "high" ||
      resolution.confidence === "high" ||
      insight.calibratedConfidence === "high"
    ) {
      return true;
    }

    return false;
  },

  generateWisdomLines(analysis = {}, options = {}) {
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};
    const lines = [];

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (
      resolution.resolvedStatement &&
      resolution.resolvedStatement !==
        "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      if (resolution.leadingGood && resolution.supportingGood) {
        lines.push(
          `For this season, ${this.cleanConcept(resolution.leadingGood)} should lead and ${this.cleanConcept(resolution.supportingGood)} should support.`
        );
      }

      if (resolution.boundary) lines.push(resolution.boundary);
      if (resolution.integration) lines.push(resolution.integration);
    }

    if (options.includeRegret && regret.regretStatement) {
      lines.push(regret.regretStatement);
    } else if (options.includeRegret && wisdom.likelyRegret) {
      lines.push(`The regret to avoid is ${this.lowercaseFirst(wisdom.likelyRegret)}`);
    }

    if (options.includeConsequence && consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    return lines;
  },

  generateEmotionDepthLines(analysis = {}, options = {}) {
    const depth = analysis.underlyingEmotion || {};
    const recovery = analysis.emotionRecoveryQuestions || {};
    const primary = depth.primaryUnderlyingEmotion || {};
    const lines = [];

    if (primary.name && primary.name !== "unclear") {
      lines.push(this.humanizeUnderlyingEmotionDepth(primary.name));
    }

    if (depth.hiddenFear) {
      lines.push(depth.hiddenFear);
    }

    if (depth.vulnerableTruth) {
      lines.push(depth.vulnerableTruth);
    }

    if (options.includeQuestion && recovery.primaryQuestion) {
      lines.push(recovery.primaryQuestion);
    }

    return lines;
  },

  generateRecoveryLines(analysis = {}) {
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};
    const lines = [];

    if (wisdomRecovery.shouldRecover && wisdomRecovery.primaryQuestion) {
      lines.push("I do not have enough evidence to answer that strongly yet.");
      lines.push(wisdomRecovery.primaryQuestion);
      return lines;
    }

    if (emotionRecovery.shouldAsk && emotionRecovery.primaryQuestion) {
      lines.push(emotionRecovery.primaryQuestion);
    }

    return lines;
  },

  generateInsightResponse(analysis = {}, summary = {}) {
    const voice = this.getVoice(analysis);
    const opening = this.getOpeningLine(analysis);

    const insight = analysis.insight || {};
    const pattern = insight.pattern || {};
    const hiddenConflict = insight.hiddenConflict || {};
    const tradeoff = insight.tradeoff || {};
    const hiddenMotive = insight.hiddenMotive || {};
    const hypothesis = insight.hypothesis || null;
    const counterHypothesis = insight.counterHypothesis || null;
    const oneLineInsight = insight.oneLineInsight;

    const calibratedConfidence =
      insight.calibratedConfidence ||
      this.highestConfidence([pattern, hiddenConflict, tradeoff, hiddenMotive]);

    const prefix = this.getPrefixForConfidence(calibratedConfidence);
    const lines = [];

    lines.push(opening);

    if (analysis.wisdomQuestionRecovery?.shouldRecover) {
      lines.push("");
      lines.push(...this.generateRecoveryLines(analysis));
      return this.finalize(lines.join("\n"));
    }

    if (this.shouldLeadWithWisdom(analysis)) {
      lines.push("");
      lines.push(...this.generateWisdomLines(analysis, { includeRegret: false }));

      if (oneLineInsight) {
        lines.push("");
        lines.push(oneLineInsight);
      }
    } else if (oneLineInsight) {
      lines.push("");
      lines.push(
        calibratedConfidence === "high"
          ? oneLineInsight
          : `${prefix}${this.lowercaseFirst(oneLineInsight)}`
      );
    } else if (hypothesis?.explanation) {
      lines.push("");
      lines.push(`${prefix}${this.lowercaseFirst(hypothesis.explanation)}`);
    } else {
      lines.push("");
      lines.push("I think there is something here, but Ari does not have enough signal to name it cleanly yet.");
    }

    if (this.hasEmotionDepth(analysis)) {
      lines.push("");
      lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
    }

    if (
      !this.shouldLeadWithWisdom(analysis) &&
      hypothesis?.explanation &&
      oneLineInsight !== hypothesis.explanation
    ) {
      lines.push("");
      lines.push(this.humanizeHypothesis(hypothesis));
    }

    if (
      counterHypothesis?.explanation &&
      calibratedConfidence !== "high"
    ) {
      lines.push("");
      lines.push(this.humanizeCounterHypothesis(counterHypothesis));
    }

    if (Array.isArray(voice.structure) && voice.structure.includes("question")) {
      lines.push("");
      lines.push(this.generateReflectionQuestion(analysis));
    }

    return this.finalize(lines.join("\n"));
  },

  generateMeaningResponse(analysis = {}, summary = {}) {
    const voice = this.getVoice(analysis);
    const opening = this.getOpeningLine(analysis);

    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const simulation = analysis.simulation || {};

    const humanTruth = meaning.humanTruth;
    const meaningStatement = meaning.meaning;
    const oneLineInsight = insight.oneLineInsight;
    const lifeChapter = personModel.lifeChapter?.name;
    const primaryBelief = beliefModel.primaryBelief?.name;
    const simulationTheme = simulation.primarySimulation?.theme;

    const prefix =
      voice.confidence === "high"
        ? ""
        : voice.confidenceStyle?.prefix || "";

    const lines = [];

    lines.push(opening);

    if (analysis.wisdomQuestionRecovery?.shouldRecover) {
      lines.push("");
      lines.push(...this.generateRecoveryLines(analysis));
      return this.finalize(lines.join("\n"));
    }

    if (this.shouldLeadWithWisdom(analysis)) {
      lines.push("");
      lines.push(...this.generateWisdomLines(analysis, {
        includeRegret: true,
        includeConsequence: true
      }));

      if (humanTruth) {
        lines.push("");
        lines.push(humanTruth);
      }

      if (this.hasEmotionDepth(analysis)) {
        lines.push("");
        lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
      }

      if (Array.isArray(voice.structure) && voice.structure.includes("reflection_question")) {
        lines.push("");
        lines.push(this.generateReflectionQuestion(analysis));
      }

      return this.finalize(lines.join("\n"));
    }

    if (lifeChapter && lifeChapter !== "unclear") {
      lines.push("");
      lines.push(this.humanizeLifeChapter(lifeChapter));
    }

    if (humanTruth) {
      lines.push("");
      lines.push(prefix ? `${prefix}${this.lowercaseFirst(humanTruth)}` : humanTruth);
    } else if (meaningStatement) {
      lines.push("");
      lines.push(prefix ? `${prefix}${this.lowercaseFirst(meaningStatement)}` : meaningStatement);
    }

    if (oneLineInsight && oneLineInsight !== humanTruth) {
      lines.push("");
      lines.push(oneLineInsight);
    }

    if (primaryBelief && primaryBelief !== "unclear") {
      lines.push("");
      lines.push(this.humanizeBelief(primaryBelief));
    }

    if (simulationTheme) {
      lines.push("");
      lines.push(this.humanizeSimulationTheme(simulationTheme));
    }

    if (this.hasEmotionDepth(analysis)) {
      lines.push("");
      lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
    }

    if (Array.isArray(voice.structure) && voice.structure.includes("reflection_question")) {
      lines.push("");
      lines.push(this.generateReflectionQuestion(analysis));
    }

    return this.finalize(lines.join("\n"));
  },

  generateEmotionalResponse(analysis = {}, summary = {}) {
    const opening = this.getOpeningLine(analysis);

    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const surface = emotionalIntelligence.surfaceEmotion?.name;
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const protecting = emotionalIntelligence.protecting?.name;

    const lines = [];

    lines.push(opening);

    if (this.hasEmotionDepth(analysis)) {
      lines.push("");
      lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
    } else if (surface && surface !== "curiosity") {
      lines.push("");
      lines.push(this.humanizeSurfaceEmotion(surface));
    } else {
      lines.push("");
      lines.push("The feeling matters. It is information, not noise.");
    }

    if (rootNeed) {
      lines.push("");
      lines.push(this.humanizeRootNeed(rootNeed));
    }

    if (protecting) {
      lines.push("");
      lines.push(this.humanizeProtecting(protecting));
    }

    if (this.hasWisdom(analysis)) {
      const wisdomLines = this.generateWisdomLines(analysis, {
        includeRegret: true,
        includeConsequence: false
      });

      if (wisdomLines.length > 0) {
        lines.push("");
        lines.push(wisdomLines[0]);
      }
    }

    const recoveryQuestion = analysis.emotionRecoveryQuestions?.primaryQuestion;
    if (recoveryQuestion) {
      lines.push("");
      lines.push(recoveryQuestion);
    }

    return this.finalize(lines.join("\n"));
  },

  generateDecisionResponse(analysis = {}, summary = {}) {
    const opening = this.getOpeningLine(analysis);

    const executive = analysis.executive || {};
    const lines = [];

    lines.push(opening);

    if (this.hasWisdom(analysis)) {
      lines.push("");
      lines.push(...this.generateWisdomLines(analysis, {
        includeRegret: true,
        includeConsequence: true
      }));

      if (this.hasEmotionDepth(analysis)) {
        lines.push("");
        lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
      }

      if (executive.recommendedFocus) {
        lines.push("");
        lines.push(executive.recommendedFocus);
      }

      const delay = executive.thingsToDelay || [];
      if (delay.length > 0) {
        lines.push("");
        lines.push(`Delay: ${delay.map((item) => item.name).join(", ")}.`);
      }

      return this.finalize(lines.join("\n"));
    }

    if (executive.recommendedFocus) {
      lines.push("");
      lines.push(executive.recommendedFocus);
    } else {
      lines.push("");
      lines.push("One thing needs to lead. The rest need to support.");
    }

    return this.finalize(lines.join("\n"));
  },

  generatePlanningResponse(analysis = {}, summary = {}) {
    const opening = this.getOpeningLine(analysis);

    const executive = analysis.executive || {};
    const insight = analysis.insight || {};
    const lines = [];

    lines.push(opening);

    if (this.hasWisdom(analysis)) {
      lines.push("");
      lines.push(...this.generateWisdomLines(analysis, {
        includeRegret: false,
        includeConsequence: true
      }));
    } else if (insight.oneLineInsight) {
      lines.push("");
      lines.push(insight.oneLineInsight);
    }

    if (this.hasEmotionDepth(analysis)) {
      lines.push("");
      lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
    }

    lines.push("");
    lines.push(
      executive.recommendedFocus ||
        "Choose one next action instead of trying to solve everything at once."
    );

    const delay = executive.thingsToDelay || [];
    if (delay.length > 0) {
      lines.push("");
      lines.push(`First, slow down: ${delay[0].name}.`);
    }

    return this.finalize(lines.join("\n"));
  },

  generateBuildingResponse(analysis = {}, summary = {}) {
    const opening = this.getOpeningLine(analysis);
    const executive = analysis.executive || {};
    const insight = analysis.insight || {};
    const lines = [];

    lines.push(opening);

    if (this.hasWisdom(analysis)) {
      lines.push("");
      lines.push(...this.generateWisdomLines(analysis, {
        includeRegret: false,
        includeConsequence: true
      }));
    }

    if (insight.oneLineInsight) {
      lines.push("");
      lines.push(insight.oneLineInsight);
    }

    if (this.hasEmotionDepth(analysis)) {
      lines.push("");
      lines.push(...this.generateEmotionDepthLines(analysis, { includeQuestion: false }));
    }

    lines.push("");
    lines.push(
      executive.recommendedFocus ||
        "The bottleneck is not the whole system. Focus on the next clean change."
    );

    return this.finalize(lines.join("\n"));
  },

  generateDefaultResponse(analysis = {}, summary = {}) {
    const opening = this.getOpeningLine(analysis);

    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const executive = analysis.executive || {};

    if (analysis.wisdomQuestionRecovery?.shouldRecover) {
      return this.finalize(
        `${opening}\n\n${this.generateRecoveryLines(analysis).join("\n\n")}`
      );
    }

    if (this.shouldLeadWithWisdom(analysis)) {
      return this.finalize(
        `${opening}\n\n${this.generateWisdomLines(analysis, {
          includeRegret: false,
          includeConsequence: true
        }).join("\n\n")}`
      );
    }

    if (this.hasEmotionDepth(analysis)) {
      return this.finalize(
        `${opening}\n\n${this.generateEmotionDepthLines(analysis, {
          includeQuestion: true
        }).join("\n\n")}`
      );
    }

    if (meaning.humanTruth) {
      return this.finalize(`${opening}\n\n${meaning.humanTruth}`);
    }

    if (insight.oneLineInsight) {
      return this.finalize(`${opening}\n\n${insight.oneLineInsight}`);
    }

    if (executive.recommendedFocus) {
      return this.finalize(`${opening}\n\n${executive.recommendedFocus}`);
    }

    return this.finalize(
      `${opening}\n\nI need a little more context before I can name this cleanly.`
    );
  },

  humanizeHypothesis(hypothesis = {}) {
    if (!hypothesis.explanation) return "";
    return `One possible explanation is this: ${this.lowercaseFirst(hypothesis.explanation)}`;
  },

  humanizeCounterHypothesis(counterHypothesis = {}) {
    if (!counterHypothesis.explanation) return "";
    return `I do not want to overstate that. ${counterHypothesis.explanation}`;
  },

  generateReflectionQuestion(analysis = {}) {
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};
    const insight = analysis.insight || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
    const tradeoff = insight.tradeoff?.name;
    const pattern = insight.pattern?.name;
    const meaning = analysis.meaning || {};

    if (wisdomRecovery.shouldRecover && wisdomRecovery.primaryQuestion) {
      return wisdomRecovery.primaryQuestion;
    }

    if (emotionRecovery.primaryQuestion) {
      return emotionRecovery.primaryQuestion;
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

    if (wisdom.highestGood === "protect_purpose_without_worshiping_speed") {
      return "What would it look like to protect purpose without forcing it to move at full speed?";
    }

    if (
      pattern === "achievement_before_presence" ||
      tradeoff === "presence_vs_acceleration"
    ) {
      return "What would change if presence did not have to be earned first?";
    }

    if (meaning.theme === "family_transition") {
      return "What would it look like to measure this season by presence instead of progress?";
    }

    if (tradeoff === "growth_vs_stability") {
      return "What would growth look like if stability had to be protected too?";
    }

    if (insight.hypothesis?.name === "achievement_before_arrival") {
      return "What would it feel like to stop moving the finish line for peace?";
    }

    return "What part of this feels most true?";
  },

  highestConfidence(signals = []) {
    const rank = {
      high: 3,
      medium: 2,
      low: 1,
      unknown: 0
    };

    const best = signals
      .filter(Boolean)
      .sort((a, b) => (rank[b.confidence] || 0) - (rank[a.confidence] || 0))[0];

    return best?.confidence || "low";
  },

  getPrefixForConfidence(confidence = "low") {
    if (confidence === "high") return "";
    if (confidence === "medium") return "I could be wrong, but ";
    if (confidence === "low") return "This is only a possibility, but ";
    return "I do not have enough to say this clearly, but ";
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  },

  cleanConcept(text = "") {
    return String(text || "").replaceAll("_", " ");
  },

  humanizeUnderlyingEmotionDepth(name = "") {
    const map = {
      fear_of_losing_identity:
        "Underneath this, Ari may be detecting fear of losing identity.",
      fear_of_being_irresponsible:
        "Underneath this, Ari may be detecting fear of being irresponsible.",
      fear_of_failing_family:
        "Underneath this, Ari may be detecting fear of failing family.",
      fear_of_missing_irreplaceable_moments:
        "Underneath this, Ari may be detecting fear of missing irreplaceable moments.",
      fear_of_betraying_purpose:
        "Underneath this, Ari may be detecting fear of betraying purpose.",
      fear_of_collapse_if_capacity_is_ignored:
        "Underneath this, Ari may be detecting fear that capacity will collapse if ignored."
    };

    return map[name] || `Underneath this, Ari may be detecting ${name.replaceAll("_", " ")}.`;
  },

  humanizeLifeChapter(name = "") {
    const map = {
      fatherhood_and_transition:
        "This is a double transition: becoming a father while also leaving an old service chapter.",
      entering_fatherhood:
        "This chapter is about becoming someone your child can depend on.",
      career_and_identity_transition:
        "This chapter is about letting one career identity change shape while another one forms.",
      family_transition:
        "This chapter is pulling you from achievement-centered success toward relationship-centered success.",
      fatherhood_transition:
        "This chapter is less about becoming perfect and more about becoming steady."
    };

    return map[name] || `This chapter appears to be about ${name.replaceAll("_", " ")}.`;
  },

  humanizeBelief(name = "") {
    const map = {
      achievement_creates_security:
        "Ari may be noticing a belief underneath it: achievement creates safety.",
      all_important_roles_must_be_maintained:
        "There may be a belief that every important role has to stay active at full strength.",
      slowing_down_means_falling_behind:
        "There may be a belief that slowing down means falling behind.",
      responsibility_comes_before_rest:
        "There may be a belief that responsibility has to come before rest.",
      people_depend_on_me_to_be_stable:
        "There may be a belief that people need you to stay steady no matter what.",
      family_moments_are_irreplaceable:
        "Ari is also detecting a strong belief: family moments cannot simply be recovered later.",
      presence_matters_more_than_performance:
        "There may be a new belief forming: presence matters more than performance.",
      purpose_must_not_be_abandoned:
        "There may be a belief that purpose must be protected from being abandoned.",
      delaying_purpose_feels_like_betrayal:
        "Delay may feel like betrayal, even when it is actually discipline."
    };

    return map[name] || `Ari may be detecting this belief: ${name.replaceAll("_", " ")}.`;
  },

  humanizeSimulationTheme(theme = "") {
    const map = {
      presence_vs_acceleration:
        "The simulated tradeoff is presence versus acceleration.",
      achievement_vs_presence:
        "The simulated tradeoff is achievement versus presence.",
      capacity_protection:
        "The simulation points toward protecting capacity before adding more responsibility."
    };

    return map[theme] || `The likely tradeoff is ${theme.replaceAll("_", " ")}.`;
  },

  humanizePattern(name = "") {
    const map = {
      achievement_before_peace:
        "The pattern may be that peace keeps getting placed after the next achievement.",
      achievement_before_presence:
        "The pattern may be that achievement has to feel complete before presence feels allowed.",
      too_many_primary_roles:
        "The pattern may be that too many roles are trying to be primary at once.",
      responsibility_before_recovery:
        "The pattern may be that responsibility keeps coming before recovery."
    };

    return map[name] || `The pattern may be ${name.replaceAll("_", " ")}.`;
  },

  humanizeTradeoff(name = "") {
    const map = {
      presence_vs_acceleration:
        "The real tradeoff may be presence versus acceleration.",
      family_presence_vs_creation:
        "The tradeoff may be family presence versus creative output.",
      growth_vs_stability:
        "The tradeoff may be growth versus stability.",
      chosen_sacrifice:
        "The tradeoff is that one meaningful thing may need to slow so another can be protected."
    };

    return map[name] || `The tradeoff may be ${name.replaceAll("_", " ")}.`;
  },

  humanizeHiddenConflict(name = "") {
    const map = {
      family_vs_purpose:
        "The hidden conflict may be family versus purpose.",
      provider_vs_presence:
        "The hidden conflict may be providing more versus being present more.",
      identity_vs_transition:
        "The hidden conflict may be an old identity trying to survive a new chapter.",
      growth_vs_stability:
        "The hidden conflict may be growth versus stability."
    };

    return map[name] || `The hidden conflict may be ${name.replaceAll("_", " ")}.`;
  },

  humanizeUnderlyingEmotion(name = "") {
    const map = {
      fear_of_failing_family:
        "Underneath this, Ari may be detecting fear of failing the people who matter most.",
      fear_of_betraying_purpose:
        "Underneath this, Ari may be detecting fear that slowing down means betraying purpose.",
      fear_of_falling_behind:
        "Underneath this, Ari may be detecting fear of falling behind.",
      anticipatory_guilt:
        "This may be guilt arriving before the situation has even happened.",
      depleted_capacity:
        "This may not just be stress. It may be depleted capacity.",
      identity_instability:
        "This may be the discomfort of an old identity changing shape."
    };

    return map[name] || `The underlying emotion may be ${name.replaceAll("_", " ")}.`;
  },

  humanizeSurfaceEmotion(name = "") {
    const map = {
      concern:
        "There is concern here, but it seems connected to something important.",
      stewardship:
        "You are trying to protect something important.",
      determination:
        "There is determination here, but determination may be carrying more than it should.",
      excitement:
        "There is excitement here, but it may be mixed with responsibility.",
      guilt:
        "There is guilt here, but guilt does not always mean wrongdoing.",
      fear:
        "There is fear here, but fear may be pointing at what matters.",
      overwhelm:
        "This looks like overwhelm, not weakness."
    };

    return map[name] || `The surface emotion appears to be ${name.replaceAll("_", " ")}.`;
  },

  humanizeRootNeed(name = "") {
    const map = {
      secure_family_presence:
        "The need underneath is secure family presence.",
      recovery_and_capacity:
        "The need underneath is recovery and capacity.",
      clarity_and_prioritization:
        "The need underneath is clarity and prioritization.",
      stability:
        "The need underneath is stability.",
      understanding:
        "The need underneath is understanding."
    };

    return map[name] || `The need underneath may be ${name.replaceAll("_", " ")}.`;
  },

  humanizeProtecting(name = "") {
    const map = {
      future_family:
        "What you are protecting may be your future family.",
      family:
        "What you are protecting may be family.",
      creative_purpose:
        "What you are protecting may be creative purpose.",
      future_self:
        "What you are protecting may be your future self.",
      meaning:
        "What you are protecting may be meaning."
    };

    return map[name] || `What you are protecting may be ${name.replaceAll("_", " ")}.`;
  },

  finalize(response = "") {
    return [...new Set(
      response
        .replace(/\n{3,}/g, "\n\n")
        .split("\n\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )].join("\n\n");
  }
};