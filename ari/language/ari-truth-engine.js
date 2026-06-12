// ari/language/ari-truth-engine.js
// Ari Truth Engine
// Purpose: Compress complex analysis into a memorable human truth.
// V2.0
// Upgrade:
// - Template-driven + mode-driven.
// - Returns metadata: truthType, patternUsed, confidence, avoid.
// - Separates situation from identity.
// - Handles dignity, connection, safety, uncertainty, fatherhood, presence, identity overload.
// - Respects Mouth Director truth permission.

window.AriTruthEngine = {
  extract(summary = {}) {
    const result = this.generateDetailed(summary);

    if (!result?.truth) return null;

    return result;
  },

  generate(summary = {}) {
    return this.generateDetailed(summary)?.truth || null;
  },

  generateDetailed(summary = {}) {
    if (!this.allowsTruth(summary)) return null;

    const context = this.readContext(summary);
    const pattern = this.choosePattern(context);

    if (!pattern) return null;

    const truth = this.chooseLine(pattern, context);

    if (!truth) return null;

    return {
      truth,
      truthType: pattern.truthType,
      patternUsed: pattern.name,
      confidence: pattern.confidence,
      avoid: pattern.avoid,
      source: "ari-truth-engine"
    };
  },

  allowsTruth(summary = {}) {
    const director = summary.mouthDirector || {};

    return (
      summary.mouthAllows?.truth !== false &&
      director.allowTruth !== false &&
      summary.allowTruth !== false
    );
  },

  readContext(summary = {}) {
    return {
      mode:
        summary.synthesisMode ||
        summary.salienceMode ||
        summary.needResponseMode ||
        null,

      responseIntent: summary.responseIntent || null,

      primaryHumanNeed: summary.primaryHumanNeed || null,
      primaryHumanNeedScore: Number(summary.primaryHumanNeedScore || 0),

      conflict: summary.primaryConflict || null,
      chapter: summary.primaryLifeChapter || null,

      identity:
        summary.resolvedLeadIdentity ||
        summary.leadIdentity ||
        summary.dominantIdentity ||
        null,

      highestGood: summary.highestGood || null,
      wisdomTension: summary.wisdomTension || null,
      pattern: summary.pattern || null,
      hypothesis: summary.hypothesis || null,
      integratedValue: summary.integratedValue || null,
      executiveDecision: summary.executiveDecision || null,

      dominantTheme: summary.dominantTheme || null,

      oneLineInsight: summary.oneLineInsight || null,
      metaConclusion: summary.metaConclusion || null,
      humanTruth: summary.humanTruth || null,

      confidence:
        summary.calibratedConfidence ||
        summary.metaConfidence ||
        "unknown"
    };
  },

  choosePattern(context = {}) {
    const {
      mode,
      responseIntent,
      primaryHumanNeed,
      primaryHumanNeedScore,
      conflict,
      chapter,
      identity,
      highestGood,
      wisdomTension,
      pattern,
      hypothesis,
      integratedValue,
      executiveDecision,
      dominantTheme,
      confidence
    } = context;

    if (
      mode === "restore_dignity" ||
      responseIntent === "protect_dignity" ||
      primaryHumanNeed === "worth"
    ) {
      return this.pattern(
        "restore_dignity_worth",
        "identity_separation",
        primaryHumanNeedScore >= 85 ? "high" : "medium",
        ["do_not_define_user_by_others", "avoid_moralizing", "avoid_overexplaining"]
      );
    }

    if (
      mode === "emotional_connection" ||
      responseIntent === "offer_connection" ||
      primaryHumanNeed === "connection"
    ) {
      return this.pattern(
        "emotional_connection",
        "connection_reality_check",
        "medium",
        ["avoid_false_reassurance", "avoid_fixing_too_fast"]
      );
    }

    if (
      mode === "safety_override" ||
      responseIntent === "protect_safety" ||
      primaryHumanNeed === "security" ||
      primaryHumanNeed === "body"
    ) {
      return this.pattern(
        "safety_body_security",
        "stabilization_first",
        "high",
        ["avoid_analysis_first", "avoid_abstract_meaning"]
      );
    }

    if (
      mode === "continue_observing" ||
      confidence === "unknown" ||
      confidence === "low"
    ) {
      return this.pattern(
        "uncertainty_truth",
        "epistemic_humility",
        "low",
        ["avoid_certainty", "avoid_big_claims"]
      );
    }

    if (
      chapter === "fatherhood_transition" &&
      highestGood === "protect_family"
    ) {
      return this.pattern(
        "fatherhood_protect_family",
        "family_presence",
        "high",
        ["avoid_perfectionism", "avoid_guilt"]
      );
    }

    if (
      chapter === "fatherhood_transition" &&
      (
        conflict === "ambition_vs_presence" ||
        conflict === "family_vs_creation" ||
        wisdomTension === "presence_vs_achievement"
      )
    ) {
      return this.pattern(
        "fatherhood_presence_vs_achievement",
        "competing_goods",
        "high",
        ["avoid_shaming_ambition", "avoid_false_binary"]
      );
    }

    if (identity === "father") {
      return this.pattern(
        "father_identity",
        "identity_priority",
        "medium",
        ["avoid_pressure", "avoid_perfectionism"]
      );
    }

    if (
      conflict === "presence_vs_achievement" ||
      wisdomTension === "presence_vs_achievement"
    ) {
      return this.pattern(
        "presence_vs_achievement",
        "irreversible_moments",
        "high",
        ["avoid_shaming_achievement"]
      );
    }

    if (conflict === "family_vs_creation") {
      return this.pattern(
        "family_vs_creation",
        "role_ordering",
        "high",
        ["avoid_killing_builder_identity"]
      );
    }

    if (conflict === "growth_vs_stability") {
      return this.pattern(
        "growth_vs_stability",
        "seasonal_pacing",
        "medium",
        ["avoid_stagnation_framing"]
      );
    }

    if (
      dominantTheme === "identity_overload" ||
      pattern === "too_many_primary_roles"
    ) {
      return this.pattern(
        "identity_overload",
        "priority_ordering",
        "high",
        ["avoid_calling_responsibility_bad"]
      );
    }

    if (hypothesis === "presence_must_be_earned") {
      return this.pattern(
        "presence_must_be_earned",
        "presence_not_reward",
        "high",
        ["avoid_productivity_worship"]
      );
    }

    if (integratedValue === "meaningful_presence") {
      return this.pattern(
        "meaningful_presence",
        "future_and_present",
        "high",
        ["avoid_false_binary"]
      );
    }

    if (executiveDecision === "protect_family_first") {
      return this.pattern(
        "protect_family_first",
        "ambition_ordering",
        "high",
        ["avoid_abandoning_ambition"]
      );
    }

    return this.pattern(
      "fallback_truth",
      "summary_truth",
      confidence === "high" ? "medium" : "low",
      ["avoid_overclaiming"]
    );
  },

  chooseLine(pattern = {}, context = {}) {
    const lines = {
      restore_dignity_worth: [
        "Being disrespected is information about the situation, not proof about your worth.",
        "Someone failing to respect you may reveal something about the interaction, but it does not get to define your value.",
        "Disrespect can tell you something needs attention, but it should not be allowed to rewrite who you are."
      ],

      emotional_connection: [
        "Feeling alone does not mean you are without value or without people who care.",
        "Loneliness is a signal for connection, not proof that you are unwanted.",
        "The feeling is real, but it should not be treated as final evidence that no one cares."
      ],

      safety_body_security: [
        "Stability comes before interpretation.",
        "When safety is active, the first job is to steady the situation, not explain it.",
        "The body needs safety before the mind can make meaning clearly."
      ],

      uncertainty_truth: [
        "Ari should not force a conclusion before the evidence is clear.",
        "Not every important moment is ready to be named immediately.",
        "The honest move here is to understand one more detail before interpreting."
      ],

      fatherhood_protect_family: [
        "Your child will not need a perfect father. They will need a present one.",
        "The goal is not to become flawless. The goal is to become steady and present.",
        "Fatherhood will ask for presence more often than perfection."
      ],

      fatherhood_presence_vs_achievement: [
        "You are standing between two good things: building a future for your family and being present with them while that future is unfolding.",
        "Providing matters, but presence is also part of provision.",
        "The future you are building should not cost the family you are building it for."
      ],

      father_identity: [
        "The way you spend your time will teach more than the goals you achieve.",
        "A father’s presence becomes part of the child’s sense of safety.",
        "Your role is not only to provide. It is also to be known."
      ],

      presence_vs_achievement: [
        "Achievement can be recovered later. Some moments cannot.",
        "Success loses meaning if it quietly consumes what it was supposed to protect.",
        "Some goals can wait. Some moments cannot return."
      ],

      family_vs_creation: [
        "The builder does not need to disappear, but he should serve the family instead of competing with it.",
        "Creation is good, but it should not make your family feel like an obstacle.",
        "The builder in you needs order, not exile."
      ],

      growth_vs_stability: [
        "Not every season is asking you to accelerate.",
        "Sometimes wisdom is not more speed. Sometimes it is steadier footing.",
        "Growth that destroys stability is not always progress."
      ],

      identity_overload: [
        "The problem is not that you have too many responsibilities. The problem is that too many things are trying to be first.",
        "You may not need fewer values. You may need a clearer order.",
        "When every role tries to lead, even good responsibilities can become chaos."
      ],

      presence_must_be_earned: [
        "Presence should not become the reward you only allow yourself after every goal is finished.",
        "You should not have to earn the right to be present with the people you love.",
        "If presence always waits until achievement is complete, it may never get protected."
      ],

      meaningful_presence: [
        "The future matters, but so does who you are while you are building it.",
        "The life you are building should still feel like a life while you build it.",
        "Meaning is not only in the outcome. It is also in how you live on the way there."
      ],

      protect_family_first: [
        "This season does not require you to abandon ambition. It requires ambition to know its place.",
        "Family first does not mean ambition dies. It means ambition serves the right thing.",
        "The issue is not whether ambition matters. The issue is whether it knows what it serves."
      ],

      fallback_truth: [
        context.oneLineInsight,
        context.metaConclusion,
        context.humanTruth
      ].filter(Boolean)
    };

    const options = lines[pattern.name] || [];
    return options[0] || null;
  },

  pattern(name, truthType, confidence, avoid = []) {
    return {
      name,
      truthType,
      confidence,
      avoid
    };
  }
};