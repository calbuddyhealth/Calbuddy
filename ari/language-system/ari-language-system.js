// ari/language-system/ari-language-system.js
// Ari Language System
// Purpose: Convert Ari's analysis into short, human, useful responses.
// V4.0: Speaks from Meaning, Insight, Belief, Person Model, Simulation, and Emotional Intelligence.

window.Ari = window.Ari || {};

window.Ari.languageSystem = {
  version: "4.0.0",

  generate(analysis = {}, options = {}) {
    const summary = window.Ari.core
      ? window.Ari.core.createSystemSummary(analysis)
      : {};

    const questionType =
      analysis.questionType || summary.questionType || "understanding";

    if (questionType === "meaning") {
      return this.generateMeaningResponse(analysis, summary);
    }

    if (questionType === "insight") {
      return this.generateInsightResponse(analysis, summary);
    }

    if (questionType === "emotional") {
      return this.generateEmotionalResponse(analysis, summary);
    }

    if (questionType === "decision") {
      return this.generateDecisionResponse(analysis, summary);
    }

    if (questionType === "planning") {
      return this.generatePlanningResponse(analysis, summary);
    }

    if (questionType === "building") {
      return this.generateBuildingResponse(analysis, summary);
    }

    return this.generateDefaultResponse(analysis, summary);
  },

  generateMeaningResponse(analysis = {}, summary = {}) {
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

    const lines = [];

    if (humanTruth) {
      lines.push(humanTruth);
    } else if (meaningStatement) {
      lines.push(meaningStatement);
    } else if (oneLineInsight) {
      lines.push(oneLineInsight);
    } else {
      lines.push("This moment seems to be asking for meaning, not just action.");
    }

    if (lifeChapter && lifeChapter !== "unclear") {
      lines.push("");
      lines.push(this.humanizeLifeChapter(lifeChapter));
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

    return this.finalize(lines.join("\n"));
  },

  generateInsightResponse(analysis = {}, summary = {}) {
    const insight = analysis.insight || {};
    const pattern = insight.pattern || {};
    const hiddenConflict = insight.hiddenConflict || {};
    const tradeoff = insight.tradeoff || {};
    const hiddenMotive = insight.hiddenMotive || {};
    const oneLineInsight = insight.oneLineInsight;

    const lines = [];

    if (oneLineInsight) {
      lines.push(this.withConfidencePrefix(oneLineInsight, this.highestConfidence([
        pattern,
        hiddenConflict,
        tradeoff,
        hiddenMotive
      ])));
    } else {
      lines.push("I think there is something here, but Ari does not have enough signal to name it cleanly yet.");
    }

    if (pattern.name && pattern.name !== "unclear") {
      lines.push("");
      lines.push(this.humanizePattern(pattern.name));
    }

    if (tradeoff.name && tradeoff.name !== "none_detected") {
      lines.push("");
      lines.push(this.humanizeTradeoff(tradeoff.name));
    }

    if (hiddenConflict.name && hiddenConflict.name !== "unclear") {
      lines.push("");
      lines.push(this.humanizeHiddenConflict(hiddenConflict.name));
    }

    return this.finalize(lines.join("\n"));
  },

  generateEmotionalResponse(analysis = {}, summary = {}) {
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const surface = emotionalIntelligence.surfaceEmotion?.name;
    const underlying = emotionalIntelligence.underlyingEmotion?.name;
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const protecting = emotionalIntelligence.protecting?.name;

    const lines = [];

    if (underlying && underlying !== "unclear") {
      lines.push(this.humanizeUnderlyingEmotion(underlying));
    } else if (surface && surface !== "curiosity") {
      lines.push(this.humanizeSurfaceEmotion(surface));
    } else {
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

    return this.finalize(lines.join("\n"));
  },

  generateDecisionResponse(analysis = {}, summary = {}) {
    const executive = analysis.executive || {};
    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const simulation = analysis.simulation || {};

    const lines = [];

    if (meaning.humanTruth) {
      lines.push(meaning.humanTruth);
    } else if (insight.oneLineInsight) {
      lines.push(insight.oneLineInsight);
    } else if (executive.recommendedFocus) {
      lines.push(executive.recommendedFocus);
    } else {
      lines.push("One thing needs to lead. The rest need to support.");
    }

    if (executive.recommendedFocus) {
      lines.push("");
      lines.push(executive.recommendedFocus);
    }

    if (simulation.primarySimulation?.theme) {
      lines.push("");
      lines.push(this.humanizeSimulationTheme(simulation.primarySimulation.theme));
    }

    const delay = executive.thingsToDelay || [];
    if (delay.length > 0) {
      lines.push("");
      lines.push(`Delay: ${delay.map((item) => item.name).join(", ")}.`);
    }

    return this.finalize(lines.join("\n"));
  },

  generatePlanningResponse(analysis = {}, summary = {}) {
    const executive = analysis.executive || {};
    const insight = analysis.insight || {};

    const lines = [];

    if (insight.oneLineInsight) {
      lines.push(insight.oneLineInsight);
      lines.push("");
    }

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
    return this.finalize(
      "This is a building question.\n\nFocus on the next clean change, not the whole architecture at once."
    );
  },

  generateDefaultResponse(analysis = {}, summary = {}) {
    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const executive = analysis.executive || {};

    if (meaning.humanTruth) {
      return this.finalize(meaning.humanTruth);
    }

    if (insight.oneLineInsight) {
      return this.finalize(insight.oneLineInsight);
    }

    if (executive.recommendedFocus) {
      return this.finalize(executive.recommendedFocus);
    }

    return "I need a little more context before I can name this cleanly.";
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

  withConfidencePrefix(text = "", confidence = "low") {
    if (confidence === "high") return text;
    if (confidence === "medium") return `I could be wrong, but ${text}`;
    return `This is only a weak signal, but ${text}`;
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
    return response
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
};