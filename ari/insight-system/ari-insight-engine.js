// ari/insight-system/ari-insight-engine.js
// Ari Insight Engine
// Purpose: Find hidden truths, avoidance, tradeoffs, patterns, and one memorable insight.
// V1.0

window.Ari = window.Ari || {};

window.Ari.insightEngine = {
  version: "1.0.0",

  generate({ observation = {}, values = {}, identity = {}, conflicts = {}, executive = {} } = {}) {
    const text = observation.normalizedMessage || "";
    const patterns = observation.humanPatterns || {};
    const primaryPriority = executive.primaryPriority?.name || null;
    const dominantIdentity = identity.dominantIdentity?.name || null;
    const dominantValue = values.dominantValue || null;
    const primaryConflict = conflicts.primaryConflict?.name || null;
    const delayList = executive.thingsToDelay || [];

    const hiddenConflict = this.detectHiddenConflict({
      text,
      patterns,
      primaryConflict,
      dominantIdentity,
      dominantValue
    });

    const avoidance = this.detectAvoidance({
      text,
      executive,
      conflicts,
      identity
    });

    const pattern = this.detectPattern({
      text,
      patterns,
      identity,
      values
    });

    const tradeoff = this.detectTradeoff({
      text,
      executive,
      conflicts,
      delayList
    });

    const wisdom = this.generateWisdom({
      hiddenConflict,
      avoidance,
      pattern,
      tradeoff,
      primaryPriority,
      dominantIdentity,
      dominantValue
    });

    return {
      hiddenConflict,
      avoidance,
      pattern,
      tradeoff,
      wisdom,
      oneLineInsight: wisdom.oneLine,
      source: "ari-insight-engine"
    };
  },

  detectHiddenConflict({ text = "", patterns = {}, primaryConflict = "", dominantIdentity = "", dominantValue = "" } = {}) {
    if (
      primaryConflict === "provider_vs_present_parent" ||
      text.includes("income or family") ||
      text.includes("promotion")
    ) {
      return {
        name: "provider_vs_presence",
        description:
          "The user may be confusing providing more with being present more.",
        confidence: "high"
      };
    }

    if (
      primaryConflict === "identity_vs_transition" ||
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      return {
        name: "identity_overload",
        description:
          "The user is trying to preserve too many identities at full strength during one season.",
        confidence: "high"
      };
    }

    if (
      dominantIdentity === "father" &&
      dominantValue === "family" &&
      text.includes("ari")
    ) {
      return {
        name: "family_vs_purpose",
        description:
          "The user is afraid that protecting family means betraying purpose.",
        confidence: "medium"
      };
    }

    return {
      name: "unclear",
      description: "No strong hidden conflict detected.",
      confidence: "low"
    };
  },

  detectAvoidance({ text = "", executive = {}, conflicts = {}, identity = {} } = {}) {
    if (
      text.includes("what am i avoiding") ||
      text.includes("avoiding admitting") ||
      text.includes("what am i not seeing")
    ) {
      return {
        name: "known_answer_unwanted_cost",
        description:
          "The user likely already knows the priority but is struggling with the cost of accepting it.",
        confidence: "high"
      };
    }

    if (
      executive.thingsToDelay?.length > 0 &&
      executive.primaryPriority?.name === "family"
    ) {
      return {
        name: "resisting_delay",
        description:
          "The user may be resisting the fact that meaningful goals must slow down temporarily.",
        confidence: "medium"
      };
    }

    return {
      name: "none_detected",
      description: "No clear avoidance detected.",
      confidence: "low"
    };
  },

  detectPattern({ text = "", patterns = {}, identity = {}, values = {} } = {}) {
    if (patterns.roleConflict && patterns.lifeTransitionLoad?.level === "extreme") {
      return {
        name: "too_many_primary_roles",
        description:
          "The user is treating multiple important roles as if all of them can be primary at once.",
        confidence: "high"
      };
    }

    if (
      values.values?.includes("service") &&
      patterns.burnoutRisk
    ) {
      return {
        name: "service_without_recovery",
        description:
          "The user may be prioritizing service while under-protecting recovery.",
        confidence: "medium"
      };
    }

    if (
      identity.identityConflicts?.includes("learner_vs_builder")
    ) {
      return {
        name: "growth_scattered_across_too_many_paths",
        description:
          "The user is trying to grow through multiple demanding identities at the same time.",
        confidence: "medium"
      };
    }

    return {
      name: "unclear",
      description: "No major recurring pattern detected from this message alone.",
      confidence: "low"
    };
  },

  detectTradeoff({ text = "", executive = {}, conflicts = {}, delayList = [] } = {}) {
    if (delayList.length > 0) {
      return {
        name: "chosen_sacrifice",
        description:
          `To protect ${executive.primaryPriority?.name || "the priority"}, the user must slow: ${delayList
            .map((item) => item.name)
            .join(", ")}.`,
        confidence: "high"
      };
    }

    if (conflicts.conflictIntensity === "critical") {
      return {
        name: "unmade_sacrifice",
        description:
          "A sacrifice is required, but Ari has not clearly identified which one yet.",
        confidence: "medium"
      };
    }

    return {
      name: "none_detected",
      description: "No major tradeoff detected.",
      confidence: "low"
    };
  },

  generateWisdom({ hiddenConflict = {}, avoidance = {}, pattern = {}, tradeoff = {}, primaryPriority = "", dominantIdentity = "", dominantValue = "" } = {}) {
    if (avoidance.name === "known_answer_unwanted_cost") {
      return {
        oneLine:
          "You may not be avoiding the answer. You may be avoiding the cost of accepting it.",
        explanation:
          "The priority is already visible, but accepting it means letting other meaningful goals become secondary for now."
      };
    }

    if (pattern.name === "too_many_primary_roles") {
      return {
        oneLine:
          "The problem is not that you have too many goals. The problem is that every goal is trying to be first.",
        explanation:
          "Ari should help the user choose which identity leads and which identities support."
      };
    }

    if (hiddenConflict.name === "provider_vs_presence") {
      return {
        oneLine:
          "Providing more is not always the same as being there more.",
        explanation:
          "The user may need to protect presence, not just productivity or income."
      };
    }

    if (hiddenConflict.name === "family_vs_purpose") {
      return {
        oneLine:
          "Protecting family does not mean betraying purpose. It means purpose needs discipline.",
        explanation:
          "Ari Rebirth can stay alive without becoming the driver during a family transition."
      };
    }

    if (tradeoff.name === "chosen_sacrifice") {
      return {
        oneLine:
          "Every serious yes requires a serious no.",
        explanation:
          "Ari should name the delay clearly so the user chooses the sacrifice instead of drifting into it."
      };
    }

    if (primaryPriority === "family") {
      return {
        oneLine:
          "Some opportunities return. Family moments do not.",
        explanation:
          "Family should lead this season while other ambitions are kept alive at a sustainable pace."
      };
    }

    return {
      oneLine:
        "The next wise move is to choose what must lead, not what matters.",
      explanation:
        "Multiple things can matter, but only one can be primary in a limited season."
    };
  }
};